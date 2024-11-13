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

const MAX_COUNTRIES = 25;

const getGeoTargetConstantSuggestions = (names) =>
  post("geoTargetConstants:suggest", {
    locale: "en",
    locationNames: { names: names },
  }).geoTargetConstantSuggestions;

const getCriterionIDs = (names) => {
  const suggestions = chunk(names, MAX_COUNTRIES)
    .flatMap(getGeoTargetConstantSuggestions)
    .filter(
      (suggestion) => suggestion.geoTargetConstant.targetType === "Country"
    );

  const geo = names.map((country) => [
    country.toLowerCase(),
    suggestions.find((s) => s.searchTerm === country).geoTargetConstant.id,
  ]);
  return Object.fromEntries(geo);
};
