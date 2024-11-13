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

const MAX_KEYWORDS_PER_REQUEST = 10000; // See https://developers.google.com/google-ads/api/rest/reference/rest/v15/customers/generateKeywordHistoricalMetrics for details
const LOOKBACK_YEARS = 2;

const getDeveloperToken = () => getScriptProperties("DEVELOPER_TOKEN");
const getCustomerId = () =>
  getConfigVariable("ADS_ACCOUNT_ID").toString().replaceAll("-", "").trim();
const ADS_ENPOINT = "https://googleads.googleapis.com/v17/";

const addGoogleAdsAuth = (params) =>
  Object.assign(
    { payload: JSON.stringify(params) },
    {
      method: "POST",
      contentType: "application/json",
      muteHttpExceptions: true,
      headers: {
        "developer-token": getDeveloperToken(),
        Authorization: "Bearer " + ScriptApp.getOAuthToken(),
        "login-customer-id": getCustomerId(),
      },
    }
  );

const post = (url, params) =>
  fetchJson(ADS_ENPOINT + url, addGoogleAdsAuth(params));

const monthsOfYear = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];
const getMonth = (offset = 0) => {
  const x = new Date();
  x.setMonth(x.getMonth() + offset);
  return monthsOfYear[x.getMonth()];
};
const getYear = (offset = 0) => new Date().getFullYear() + offset;

const getHistoricalMetricsOptions = (lookbackYears) => ({
  includeAverageCpc: true,
  yearMonthRange: {
    start: {
      year: getYear(-lookbackYears),
      month: getMonth(-1),
    },
    end: {
      year: getYear(),
      month: getMonth(-1),
    },
  },
});

function getSearchVolume(keywords, criteriaId, lookbackYears = LOOKBACK_YEARS) {
  const results = chunk(keywords, MAX_KEYWORDS_PER_REQUEST).map((keywords) =>
    post(`customers/${getCustomerId()}:generateKeywordHistoricalMetrics`, {
      keywords,
      geoTargetConstants: [`geoTargetConstants/${criteriaId}`],
      // "keywordPlanNetwork": "GOOGLE_SEARCH_AND_PARTNERS",
      keywordPlanNetwork: "GOOGLE_SEARCH",
      historicalMetricsOptions: getHistoricalMetricsOptions(lookbackYears),
    })
  );
  // return "flat" list of results
  return results.flatMap((res) => res.results);
}

// https://developers.google.com/google-ads/api/rest/reference/rest/v16/customers/generateKeywordIdeas
const generateKeywordIdeas = (
  seedKeywords,
  geoCriteriaID,
  languageCriteriaID,
  maxIdeas = 10000
) => {
  const results = [];
  const request = {
    pageSize: maxIdeas
      ? Math.min(maxIdeas, MAX_KEYWORDS_PER_REQUEST)
      : undefined, // A maximum of 10,000 results may be returned
    keywordPlanNetwork: "GOOGLE_SEARCH_AND_PARTNERS",
    // See https://developers.google.com/google-ads/api/data/geotargets
    geo_target_constants: geoCriteriaID
      ? [`geoTargetConstants/${geoCriteriaID}`]
      : [],
    // See https://developers.google.com/google-ads/api/data/codes-formats#languages
    language: languageCriteriaID
      ? `languageConstants/${languageCriteriaID}`
      : undefined, // The resource name of the language to target. Each keyword belongs to some set of languages; a keyword is included if language is one of its languages. If not set, all keywords will be included.
    historicalMetricsOptions: getHistoricalMetricsOptions(LOOKBACK_YEARS),
    keywordSeed: { keywords: seedKeywords },
    pageToken: undefined,
  };
  do {
    // to respect max 1qps limit
    Utilities.sleep(1000);
    const response = post(
      `customers/${getCustomerId()}:generateKeywordIdeas`,
      request
    );
    results.push(...(response.results || []));
    request.pageToken = response.nextPageToken;
  } while (request.pageToken && results.length < maxIdeas);
  return results;
};
