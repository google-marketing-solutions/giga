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
import { chunk } from './util';
import {
  gemini,
  GeminiConfig,
  getGcpProjectId,
  ResponseSchema,
} from './vertex';

/**
 * Maximum number of countries to process in a single batch.
 */
export const MAX_COUNTRIES = 25;

/**
 * Retrieves geo target constant suggestions for a list of location names.
 *
 * @param names - An array of location names to search for.
 * @returns A list of geo target constant suggestions.
 */
export const getGeoTargetConstantSuggestions = (names: string[]) =>
  post('geoTargetConstants:suggest', {
    locale: 'en',
    locationNames: { names: names },
  }).geoTargetConstantSuggestions;

/**
 * Resolves a list of country names to their corresponding criterion IDs.
 *
 * This function chunks the input names, queries for suggestions, filters for
 * targets of type 'Country', and maps the original names (lowercased) to their IDs.
 *
 * @param names - An array of country names to resolve.
 * @returns An object mapping lowercased country names to their criterion IDs.
 */
export const getCriterionIDs = (names: string[]) => {
  const suggestions = chunk(names, MAX_COUNTRIES)
    .flatMap(getGeoTargetConstantSuggestions)
    .filter(
      (suggestion: { geoTargetConstant: { targetType: string } }) =>
        suggestion.geoTargetConstant.targetType === 'Country'
    );

  const geo = names.map((country: string) => [
    country.toLowerCase(),
    suggestions.find((s: { searchTerm: string }) => s.searchTerm === country)
      .geoTargetConstant.id,
  ]);
  return Object.fromEntries(geo);
};

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
    modelId: geminiConfig?.modelId || 'gemini-2.5-flash',
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
