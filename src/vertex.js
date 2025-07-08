/*
Copyright 2024 Google LLC

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

const getGeminiModelID = () => getConfigVariable('GEMINI_MODEL_ID');
const getGCPProjectID = () => getConfigVariable('GCP_ID');

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
 * @typedef {Object} GeminiConfig
 * @property {string} projectID - GCP Project ID with Vertex AI enabled
 * @property {string} location - Location of the prediction model
 * @property {string} modelID - ID of the prediction model to use (e.g. gemini-pro)
 * @property {number} temperature - Degree of randomness in token selection (0 is deterministic, 1 max randomness, default for gemini-pro-vision: 0.4)
 * @property {number} topP - Lower value for less randomness. Range: 0.0 - 1.0, Default: 1.0
 * @property {number} maxOutputTokens - Default gemini-pro-vision: 2048
 * @property {string} responseType - Response (text/plain or application/json)
 */

/**
 * @param {GeminiConfig} config
 */
const gemini =
  (config, jsonFetcher = fetchJson) =>
  prompt => {
    const [url, options] = getGeminiRequest(config, prompt);

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

const getGeminiRequest = (config, prompt, payloadKey = 'payload') => {
  console.log(prompt);
  console.log(JSON.stringify(config, null, 2));
  const location = config.location || 'us-central1';
  const baseUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${config.projectID}/locations/${location}/publishers/google/models/${config.modelID}`;

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
    },
  };

  return [
    `${baseUrl}:generateContent`,
    addAuth({ ...request, safetySettings }, payloadKey),
  ];
};
