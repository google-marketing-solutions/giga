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

import {
  chunk,
  fetchJson,
  getConfigVariable,
  getScriptProperties,
} from './util';

export const MAX_KEYWORDS_PER_REQUEST = 10000; // See https://developers.google.com/google-ads/api/rest/reference/rest/v15/customers/generateKeywordHistoricalMetrics for details
export const LOOKBACK_YEARS = 2;
// https://developers.google.com/google-ads/api/rest/reference/rest/v18/customers/generateKeywordIdeas
export const MAX_NUMBER_OF_KEYWORD_SEED_IDEAS = 20;

export const getDeveloperToken = () => getScriptProperties('DEVELOPER_TOKEN');
export const getCustomerId = () =>
  getConfigVariable('ADS_ACCOUNT_ID').toString().replaceAll('-', '').trim();
export const ADS_VERSION = 'v22';
export const ADS_ENDPOINT = `https://googleads.googleapis.com/${ADS_VERSION}`;

export const addGoogleAdsAuth = payload =>
  Object.assign(
    { payload },
    {
      method: 'POST',
      contentType: 'application/json',
      muteHttpExceptions: true,
      headers: {
        'developer-token': getDeveloperToken(),
        'Authorization': 'Bearer ' + ScriptApp.getOAuthToken(),
        'login-customer-id': getCustomerId(),
      },
    }
  );

export const post = (service, params) => {
  console.log(service, '-->', JSON.stringify(params, null, 2));
  return fetchJson(
    `${ADS_ENDPOINT}/${service}`,
    addGoogleAdsAuth(JSON.stringify(params))
  );
};

const monthsOfYear = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
];
const getMonth = (offset = 0) => {
  const x = new Date();
  x.setMonth(x.getMonth() + offset);
  return monthsOfYear[x.getMonth()];
};
const getYear = (offset = 0) => new Date().getFullYear() + offset;

export const getHistoricalMetricsOptions = lookbackYears => ({
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

export function getSearchVolume(
  keywords,
  criteriaId,
  lookbackYears = LOOKBACK_YEARS
) {
  const results = chunk(keywords, MAX_KEYWORDS_PER_REQUEST).map(
    (keywords, batchIndex) => {
      console.log(
        `Getting keyword ideas: ${batchIndex + 1} / ${Math.ceil(keywords.length / MAX_KEYWORDS_PER_REQUEST)} ...`
      );
      Utilities.sleep(1000); // respect 1qps quota from keyword planner
      return post(
        `customers/${getCustomerId()}:generateKeywordHistoricalMetrics`,
        {
          keywords,
          geoTargetConstants: criteriaId
            ? [`geoTargetConstants/${criteriaId}`]
            : undefined,
          keywordPlanNetwork: 'GOOGLE_SEARCH',
          historicalMetricsOptions: getHistoricalMetricsOptions(lookbackYears),
        }
      );
    }
  );
  // return "flat" list of results
  return results.flatMap(res => res.results);
}

export const generateKeywordIdeas = (
  seedKeywords,
  geoCriteriaID,
  languageCriteriaID,
  maxIdeas = 10000,
  lookbackYears = LOOKBACK_YEARS
) => {
  return chunk(seedKeywords, MAX_NUMBER_OF_KEYWORD_SEED_IDEAS).flatMap(
    (keywords, batchIndex) => {
      console.log(
        `Getting keyword ideas batch ${batchIndex + 1} / ${Math.ceil(seedKeywords.length / MAX_NUMBER_OF_KEYWORD_SEED_IDEAS)}`
      );
      const results = [];
      const request = {
        pageSize: maxIdeas
          ? Math.min(maxIdeas, MAX_KEYWORDS_PER_REQUEST)
          : undefined, // A maximum of 10,000 results may be returned
        keywordPlanNetwork: 'GOOGLE_SEARCH',
        // See https://developers.google.com/google-ads/api/data/geotargets
        geo_target_constants: geoCriteriaID
          ? [`geoTargetConstants/${geoCriteriaID}`]
          : [],
        // See https://developers.google.com/google-ads/api/data/codes-formats#languages
        language: languageCriteriaID
          ? `languageConstants/${languageCriteriaID}`
          : undefined, // The resource name of the language to target. Each keyword belongs to some set of languages; a keyword is included if language is one of its languages. If not set, all keywords will be included.
        historicalMetricsOptions: getHistoricalMetricsOptions(lookbackYears),
        keywordSeed: { keywords },
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
    }
  );
};
