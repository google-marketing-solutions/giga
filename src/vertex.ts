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

import { fetchJson, getConfigVariable, getGcpProjectDetails } from './util';

export const getGeminiModelId = () => getConfigVariable('GEMINI_MODEL_ID');
export const getGcpProjectId = () => getGcpProjectDetails().projectId;

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

export interface GeminiConfig {
  projectId: string;
  modelId: string;
  temperature: number;
  topP: number;
  location?: string;
  maxOutputTokens?: number;
  responseType?: string;
  responseSchema?: any;
  enableGoogleSearch?: boolean;
}

/**
 * @param {GeminiConfig} config
 */
export const gemini =
  (config: GeminiConfig, jsonFetcher = fetchJson) =>
  prompt => {
    const [url, options] = getGeminiRequest(
      config,
      prompt,
      config.enableGoogleSearch
    );

    const res = jsonFetcher(url, options);
    console.log(JSON.stringify(res, null, 2));

    const responseText = res.candidates?.[0].content?.parts?.[0].text;

    try {
      const response =
        config.responseType === 'application/json'
          ? JSON.parse(responseText)
          : responseText;
      return response;
    } catch (e) {
      console.log(`Error while parsing JSON. Text:\n${responseText}`);
      console.log(JSON.stringify(res, null, 2));
      throw e;
    }
  };

const getGeminiRequest = (
  config: GeminiConfig,
  prompt,
  enableGoogleSearch = false,
  payloadKey = 'payload'
) => {
  console.log(prompt);
  console.log(JSON.stringify(config, null, 2));
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
