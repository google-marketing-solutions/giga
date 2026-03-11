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
import { getCustomerId, post } from './ideas';
import {
  gemini,
  GeminiConfig,
  getGcpProjectId,
  ResponseSchema,
} from './vertex';

export const getGeoTargetConstantSuggestions = (names: string[]) =>
  post('geoTargetConstants:suggest', {
    locale: 'en',
    locationNames: { names: names },
  }).geoTargetConstantSuggestions;

/**
 * Retrieves the language ID for a given language name.
 *
 * @param name - The name of the language to search for (e.g. 'German').
 * @returns The language ID, or undefined if not found.
 */
export const getLanguageId = (
  name: string,
  geminiConfig?: Partial<GeminiConfig>
) => {
  const query = `
    SELECT language_constant.id, language_constant.name
    FROM language_constant
    WHERE language_constant.name = "${name}"
  `;
  const response = post(`customers/${getCustomerId()}/googleAds:search`, {
    query,
  });
  const result = response?.results?.[0]?.languageConstant;
  if (result) {
    return { id: result.id, name: result.name };
  }

  return suggestLanguageId(name, geminiConfig);
};

/**
 * Suggests a language ID using Gemini
 *
 * @param name - The name of the language to search for.
 * @param geminiConfig - The Gemini configuration.
 * @returns The verified language object { id, name }.
 * @throws Error if no language could be found or verified.
 */
export const suggestLanguageId = (
  name: string,
  geminiConfig?: Partial<GeminiConfig>
) => {
  const responseSchema: ResponseSchema = {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'The Google Ads language constant integer ID',
      },
    },
    required: ['id'],
  };

  const config = {
    modelId: geminiConfig?.modelId || 'gemini-3.1-pro-preview',
    projectId: getGcpProjectId(),
    temperature: 0,
    topP: 1,
    responseType: 'application/json',
    responseSchema,
  };

  const prompt = `Find the Google Ads language constant integer ID for the language: "${name}".
  Return ONLY the ID in the requested JSON format.`;

  try {
    const geminiResult = gemini(config)(prompt);
    const geminiId = geminiResult?.id;

    if (geminiId) {
      // Verify the ID with GAQL
      return getLanguageById(geminiId);
    }
  } catch (e) {
    console.error('Gemini fallback failed or verification failed:', e);
  }

  throw new Error(
    `Could not find language ID for "${name}" even after Gemini fallback.`
  );
};

/**
 * Retrieves the language name for a given language ID.
 *
 * @param id - The numeric ID of the language (e.g. '1000').
 * @returns The language object { id, name }, or undefined if not found.
 */
export const getLanguageById = (id: string) => {
  const query = `
    SELECT language_constant.id, language_constant.name
    FROM language_constant
    WHERE language_constant.id = ${id}
  `;
  const response = post(`customers/${getCustomerId()}/googleAds:search`, {
    query,
  });
  const result = response?.results?.[0]?.languageConstant;
  return result ? { id: result.id, name: result.name } : undefined;
};
/**
 * Retrieves the location ID for a given location name.
 *
 * This function uses Google Ads' geoTargetConstants:suggest and returns the
 * first result that is ENABLED.
 *
 * @param name - The name of the location to search for (e.g. 'France', 'Paris').
 * @param geminiConfig - The Gemini configuration.
 * @returns The location object { id, name }.
 * @throws Error if location is not found.
 */
export const getLocationId = (
  name: string,
  geminiConfig?: Partial<GeminiConfig>
) => {
  const suggestions = getGeoTargetConstantSuggestions([name]);
  const bestMatch = (suggestions || []).find(
    (s: { geoTargetConstant: { status: string } }) =>
      s.geoTargetConstant.status === 'ENABLED'
  );

  if (bestMatch) {
    return {
      id: bestMatch.geoTargetConstant.id,
      name:
        bestMatch.geoTargetConstant.name ||
        bestMatch.geoTargetConstant.canonicalName,
    };
  }

  return suggestLocationId(name, geminiConfig);
};

/**
 * Suggests a location ID using Gemini
 *
 * @param name - The name of the location to search for.
 * @param geminiConfig - The Gemini configuration.
 * @returns The verified location object { id, name }.
 * @throws Error if no location could be found or verified.
 */
export const suggestLocationId = (
  name: string,
  geminiConfig?: Partial<GeminiConfig>
) => {
  const responseSchema: ResponseSchema = {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'The Google Ads location criterion ID',
      },
    },
    required: ['id'],
  };

  const config = {
    modelId: geminiConfig?.modelId || 'gemini-3.1-pro-preview',
    projectId: getGcpProjectId(),
    temperature: 0,
    topP: 1,
    responseType: 'application/json',
    responseSchema,
  };

  const prompt = `Find the Google Ads criterion ID for the location: "${name}".
  Return ONLY the ID in the requested JSON format.`;

  try {
    const geminiResult = gemini(config)(prompt);
    const geminiId = geminiResult?.id;

    if (geminiId) {
      // Verify the ID with GAQL
      return getLocationById(geminiId);
    }
  } catch (e) {
    console.error('Gemini fallback failed or verification failed:', e);
  }

  throw new Error(
    `Could not find location ID for "${name}" even after Gemini fallback.`
  );
};

/**
 * Retrieves the location name for a given location ID.
 *
 * @param id - The criterion ID of the location (e.g. '2250').
 * @returns The location object { id, name }, or undefined if not found.
 */
export const getLocationById = (id: string) => {
  const query = `
    SELECT geo_target_constant.id, geo_target_constant.name, geo_target_constant.canonical_name
    FROM geo_target_constant
    WHERE geo_target_constant.id = ${id}
  `;
  const response = post(`customers/${getCustomerId()}/googleAds:search`, {
    query,
  });
  const result = response?.results?.[0]?.geoTargetConstant;
  return result
    ? { id: result.id, name: result.name || result.canonicalName }
    : undefined;
};
