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

const getGeminiModelId = () => getConfigVariable("GEMINI_MODEL_ID");
const getGCPProjectID = () => getConfigVariable("GCP_ID");

const addAuth = (params) =>
  Object.assign(
    { payload: JSON.stringify(params) },
    {
      method: "POST",
      contentType: "application/json",
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
 * @property {string} modelId - ID of the prediction model to use (e.g. gemini-pro)
 * @property {number} temperature - Degree of randomness in token selection (0 is deterministic, 1 max randomness, default for gemini-pro-vision: 0.4)
 * @property {number} topP - Lower value for less randomness. Range: 0.0 - 1.0, Default: 1.0
 * @property {number} maxOutputTokens - Default gemini-pro-vision: 2048
 * @property {string} responseType - Response (text/plain or application/json)
 */

/**
 * @param {GeminiConfig} config
 */
const gemini = (config) => (prompt) => {
  console.log(prompt);
  const serviceUrl = `https://${
    config.location || "us-central1"
  }-aiplatform.googleapis.com/v1/projects/${config.projectID}/locations/${
    config.location
  }/publishers/google/models/${config.modelId}:generateContent`;
  const res = fetchJson(
    serviceUrl,
    addAuth({
      contents: [
        {
          role: "user",
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
      safetySettings: [
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_ONLY_HIGH",
        },
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_ONLY_HIGH",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_ONLY_HIGH",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_ONLY_HIGH",
        },
      ],
    })
  );

  const finishReason = res.candidates?.[0].finishReason;
  console.log(`finishReason: ${finishReason}`);
  const responseText = res.candidates?.[0].content?.parts?.[0].text;
  try {
    return config.responseType === "application/json"
      ? JSON.parse(responseText)
      : responseText;
  } catch (e) {
    console.log(`Error while parsing JSON. Text:\n${responseText}`);
    console.log(JSON.stringify(res, null, 2));
    throw e;
  }
};
