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
import { post } from './ideas';
import { chunk } from './util';

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
