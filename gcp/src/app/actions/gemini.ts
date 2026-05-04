/*Copyright 2026 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

'use server';

import {GoogleGenAI} from '@google/genai';
import Ajv from 'ajv';
import {
  appConfig,
  getApplicationConfig,
  type ApplicationConfig,
} from '../../lib/config';
import {withRetry} from '../../lib/utils';

export interface TextGenerationConfig {
  model: string;
  location: string;
  responseMimeType?: string;
  responseSchema?: Record<string, unknown>;
}

export {getApplicationConfig, type ApplicationConfig};

const ajv = new Ajv();

export async function geminiRequest(
  config: TextGenerationConfig,
  prompt: string,
  schema?: Record<string, unknown>,
  googleSearchGrounding?: boolean,
  fallbackConfig?: TextGenerationConfig,
): Promise<unknown> {
  return geminiRequestWithFallback(
    config,
    prompt,
    schema,
    googleSearchGrounding,
    fallbackConfig ?? config,
  );
}

async function geminiRequestWithFallback(
  config: TextGenerationConfig,
  prompt: string,
  schema?: Record<string, unknown>,
  googleSearchGrounding?: boolean,
  fallbackConfig?: TextGenerationConfig,
): Promise<unknown> {
  const projectId = appConfig.projectId;
  const location = config.location || 'global';

  const client = new GoogleGenAI({
    vertexai: true,
    project: projectId,
    location,
  });

  const generationConfig: Record<string, unknown> = {
    responseMimeType: googleSearchGrounding
      ? 'text/plain'
      : config.responseMimeType,
    responseSchema: googleSearchGrounding ? undefined : schema,
  };

  let jsonInstruction = '';
  if (googleSearchGrounding && config.responseMimeType === 'application/json') {
    jsonInstruction +=
      '\n\n**Important:**\n - Output only the raw JSON string. Do not include markdown formatting (e.g. ```json) or any other text.';
    if (schema) {
      jsonInstruction += `\n - Adhere to the following OpenAPI Schema Object definition: ${JSON.stringify(schema, null, 2)}`;
    }
  }

  let promptSuffix = '';
  if (googleSearchGrounding) {
    promptSuffix +=
      '\n\nUse **Google Search** to ensure your knowledge is up-to-date.';
  }

  const modelParams = {
    model: config.model,
    contents: [
      {
        role: 'user',
        parts: [{text: `${prompt}${promptSuffix}${jsonInstruction}`}],
      },
    ],
    config: {
      ...generationConfig,
      tools: googleSearchGrounding
        ? [
            {
              googleSearch: {},
            },
          ]
        : undefined,
    },
  };

  const isRetryableError = (error: unknown) => {
    const errorString = JSON.stringify(error);
    return (
      errorString.includes('429') ||
      errorString.includes('RESOURCE_EXHAUSTED') ||
      errorString.includes('QUOTA_EXCEEDED') ||
      errorString.includes('Overloaded prefill queue')
    );
  };

  const response = await withRetry(
    () => client.models.generateContent(modelParams),
    {
      maxRetries: 3,
      initialDelay: 1000,
      shouldRetry: isRetryableError,
    },
  );

  const text =
    response.candidates?.[0]?.content?.parts
      ?.map((part: {text?: string}) => part.text)
      .join('') || '';

  if (config.responseMimeType === 'application/json') {
    try {
      const parsed = JSON.parse(text);
      if (schema) {
        const validate = ajv.compile(schema);
        if (!validate(parsed)) {
          throw new Error(
            `JSON Validation failed: ${ajv.errorsText(validate.errors)}`,
          );
        }
      }
      return parsed;
    } catch (error: unknown) {
      console.log(
        `\x1b[38;5;208m${error instanceof Error ? error.message : String(error) || 'Response did not provide valid JSON'}, re-generating with JSON-response mode now. Full response is:\n${text}\n\n\x1b[0m`,
      );
      if (fallbackConfig) {
        return geminiRequestWithFallback(
          fallbackConfig,
          `Extract valid JSON from this text response:\n\n${text}`,
          schema,
          false,
          undefined,
        );
      } else {
        throw error;
      }
    }
  } else {
    return {text};
  }
}
