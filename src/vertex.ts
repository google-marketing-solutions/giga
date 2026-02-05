/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Ajv from 'ajv';
import { fetchJson, getGcpProjectDetails } from './util';

const ajv = new Ajv();

/**
 * Returns the GCP project ID.
 * @returns {string}
 */
export const getGcpProjectId = () => getGcpProjectDetails().projectId;

/**
 * Adds authentication to a request.
 * Additionaly stringifies the payload and sets the content type to application/json.
 * @param {Object} params - The request parameters.
 * @param {string} payloadKey - The key for the payload.
 * @returns {Object} The request parameters with authentication added.
 */
const addAuth = (params, payloadKey = 'payload') =>
  Object.assign(
    { [payloadKey]: JSON.stringify(params) },
    {
      method: 'POST',
      contentType: 'application/json',
      muteHttpExceptions: true,
      headers: {
        Authorization: `Bearer ${ScriptApp.getOAuthToken()}`,
      },
    }
  );

/**
 * Configuration for the Gemini API.
 * @param {string} projectId - The GCP project ID.
 * @param {string} modelId - The Gemini model ID.
 * @param {number} temperature - The temperature for the model.
 * @param {number} topP - The top P value for the model.
 * @param {string} location - The location for the model.
 * @param {number} maxOutputTokens - The maximum number of output tokens.
 * @param {string} responseType - The response type.
 * @param {ResponseSchema} responseSchema - The response schema.
 * @param {boolean} enableGoogleSearch - Whether to enable Google search for grounding.
 */
export interface GeminiConfig {
  projectId: string;
  modelId: string;
  temperature: number;
  topP: number;
  location?: string;
  maxOutputTokens?: number;
  responseType?: string;
  responseSchema?: ResponseSchema;
  enableGoogleSearch?: boolean;
}

/**
 * Configuration for the response schema.
 * @param {string} type - The type of the response.
 * @param {string} format - The format of the response.
 * @param {string} description - The description of the response.
 * @param {boolean} nullable - Whether the response can be null.
 * @param {ResponseSchema} items - The items of the response.
 * @param {string[]} enum - The enum of the response.
 * @param {{ [key: string]: ResponseSchema }} properties - The properties of the response.
 * @param {string[]} required - The required properties of the response.
 */
export interface ResponseSchema {
  type: string;
  format?: string;
  description?: string;
  nullable?: boolean;
  items?: ResponseSchema;
  enum?: string[];
  properties?: { [key: string]: ResponseSchema };
  required?: string[];
}

/**
 * @param {GeminiConfig} config
 * @param {Function} jsonFetcher - The function to fetch JSON.
 */
export const gemini =
  (config: GeminiConfig, jsonFetcher = fetchJson) =>
  prompt => {
    const isGroundingWithJson =
      config.enableGoogleSearch && config.responseType === 'application/json';

    const effectiveConfig = { ...config };
    let effectivePrompt = prompt;

    // Google Search Grounding is currently incompatible with responseMimeType: 'application/json' and responseSchema
    // See: https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/grounding-search
    if (isGroundingWithJson) {
      // Thus changing to text/plain and on unsuccesfull JSON parsing re-generating with JSON-response mode.
      effectiveConfig.responseType = 'text/plain';
      delete effectiveConfig.responseSchema;
      const schemaString = config.responseSchema
        ? JSON.stringify(config.responseSchema, null, 2)
        : '';
      effectivePrompt += `\n\nImportant:
       - Output only the raw JSON string. Do not include markdown formatting (e.g. \`\`\`json) or any other text.
      ${schemaString ? `\n - Adhere to the following OpenAPI Schema Object definition: ${schemaString}` : ''}`;
    }

    const [url, options] = getGeminiRequest(
      effectiveConfig,
      effectivePrompt,
      effectiveConfig.enableGoogleSearch
    );
    console.log(effectivePrompt);
    const res = jsonFetcher(url, options);
    const responseText = res.candidates?.[0]?.content?.parts?.[0]?.text;

    if (config.responseType === 'application/json') {
      try {
        console.log(`trying to parse ${responseText}`);
        let textToParse = responseText;
        if (textToParse.startsWith('```json')) {
          textToParse = textToParse
            .replace(/^```json\s*/, '')
            .replace(/\s*```$/, '');
        }
        const parsed = JSON.parse(textToParse);
        if (config.responseSchema) {
          const validate = ajv.compile(config.responseSchema);
          if (!validate(parsed)) {
            throw new Error(
              `JSON Validation failed: ${ajv.errorsText(validate.errors)}`
            );
          }
        }
        return parsed;
      } catch (e) {
        // Since the response is not valid JSON (e.g. ```json was added and/or intro text "Here is your JSON: ...")
        // We run Gemini a second time without grounding to extract the JSON from the already grounded response
        if (isGroundingWithJson && responseText) {
          console.log(
            `Response did not provide valid JSON, re-generating with JSON-response mode now. Full response is:\n${responseText}\n\n`
          );
          const extractionConfig = { ...config, enableGoogleSearch: false };
          return gemini(
            extractionConfig,
            jsonFetcher
          )(`Extract valid JSON from this text response:\n\n${responseText}`);
        }
        console.log(`Error while parsing JSON. Text:\n${responseText}`);
        console.log(JSON.stringify(res, null, 2));
        throw e;
      }
    }

    return responseText;
  };

/**
 * @param {GeminiConfig} config
 * @param {string} prompt
 * @param {boolean} enableGoogleSearch
 * @param {string} payloadKey
 */
const getGeminiRequest = (
  config: GeminiConfig,
  prompt,
  enableGoogleSearch = false,
  payloadKey = 'payload'
) => {
  const location = config.location || 'us-central1';
  const baseUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${config.projectId}/locations/${location}/publishers/google/models/${config.modelId}`;

  const safetySettings = [
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_ONLY_HIGH',
    },
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_ONLY_HIGH',
    },
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_ONLY_HIGH',
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_ONLY_HIGH',
    },
  ];

  const request = {
    contents: [
      {
        role: 'user',
        parts: { text: prompt },
      },
    ],
    // see https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/inference#generationconfig
    generation_config: {
      temperature: config.temperature,
      top_p: config.topP,
      max_output_tokens: config.maxOutputTokens,
      response_mime_type: config.responseType,
      response_schema: config.responseSchema,
      thinkingConfig: {
        thinkingBudget: 1024,
      },
    },
    tools: enableGoogleSearch ? [{ googleSearch: {} }] : [],
  };

  return [
    `${baseUrl}:generateContent`,
    addAuth({ ...request, safetySettings }, payloadKey),
  ];
};
