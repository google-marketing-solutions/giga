/*Copyright 2026 Google LLC

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


import {GoogleAdsApi, enums, services} from 'google-ads-api';
import {chunk, getEnvVar, sleep} from './utils';

// Load credentials from environment variables
const developerToken = getEnvVar('GOOGLE_ADS_DEVELOPER_TOKEN', '');
const clientId = getEnvVar('GOOGLE_ADS_CLIENT_ID', '');
const clientSecret = getEnvVar('GOOGLE_ADS_CLIENT_SECRET', '');
const refreshToken = getEnvVar('GOOGLE_ADS_REFRESH_TOKEN', '');
const customerId = getEnvVar('GOOGLE_ADS_CUSTOMER_ID', '');

/**
 * Represents a keyword idea returned by the Google Ads API.
 */
export interface KeywordIdea {
  /** The text of the keyword idea. */
  text: string;
  /** The average monthly searches for the keyword. */
  avgMonthlySearches: number;
  /** The competition level for the keyword (e.g., "HIGH", "MEDIUM", "LOW"). */
  competition: string;
  /** The competition index for the keyword (0-100). */
  competitionIndex: number | null;
  /** The low range top of page bid in micros. */
  lowTopOfPageBidMicros: number | null;
  /** The high range top of page bid in micros. */
  highTopOfPageBidMicros: number | null;
  /** The monthly search volumes for the past 12 months. */
  monthlySearchVolumes: { month: string; year: number; monthlySearches: number }[];
  /** A list of close variants for the keyword. */
  closeVariants: string[];
    averageCpcMicros: number | null;
}


const monthsOfYear = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];
const getMonth = (offset = 0) => {
  const x = new Date();
  x.setMonth(x.getMonth() + offset);
  return enums.MonthOfYear[monthsOfYear[x.getMonth()] as keyof typeof enums.MonthOfYear];
};
const getYear = (offset = 0) => new Date().getFullYear() + offset;

export const getHistoricalMetricsOptions = (lookbackYears: number) => ({
  include_average_cpc: true,
  year_month_range: {
    start: { year: getYear(-lookbackYears), month: getMonth(-2) },
    end: { year: getYear(), month: getMonth(-1) },
  },
});

/**
 * Generates keyword ideas based on a list of seed keywords.
 * Respects the maximum number of seed keywords per request by chunking the input.
 * Enforces a 1 QPS rate limit by delaying subsequent requests.
 *
 * @param keywords - An array of seed keywords to generate ideas from.
 * @returns A promise that resolves to an array of KeywordIdea objects.
 */
async function getKeywordIdeas(
  options: {keywords?: string[]; url?: string},
  pageSize?: number,
): Promise<KeywordIdea[]> {
  const {keywords = [], url} = options;
  const client = new GoogleAdsApi({
    client_id: clientId.trim(),
    client_secret: clientSecret.trim(),
    developer_token: developerToken.trim(),
  });

  const customer = client.Customer({
    customer_id: customerId.trim(),
    refresh_token: refreshToken.trim(),
  });

  // See `keyword_seed` in https://developers.google.com/google-ads/api/reference/rpc/v22/GenerateKeywordIdeasRequest
  const MAX_NUMBER_OF_KEYWORD_SEED_IDEAS = 20;

  // If a URL is provided, we don't need to chunk the keywords as there are none,
  // but if both are provided, we should probably still chunk the keywords.
  // However, usually it's one or the other.
  // For simplicity, if url is provided and no keywords, we just do one request.
  const chunks =
    keywords.length > 0
      ? chunk(keywords, MAX_NUMBER_OF_KEYWORD_SEED_IDEAS)
      : [[]];

  const results = await chunks.reduce(
    async (accPromise, chunkedKeywords, i) => {
      const acc = await accPromise;
      if (i > 0) {
        await sleep(1000);
      }

      const seedParams: Record<string, unknown> = {};
      if (url && chunkedKeywords.length > 0) {
        seedParams.keyword_and_url_seed = {url, keywords: chunkedKeywords};
      } else if (url) {
        seedParams.site_seed = {site: url};
      } else {
        seedParams.keyword_seed = {keywords: chunkedKeywords};
      }

      const requestPayload = {
        customer_id: customerId,
        ...seedParams,
        ...(pageSize !== undefined && {page_size: pageSize}),
        keyword_plan_network: enums.KeywordPlanNetwork.GOOGLE_SEARCH,
        historical_metrics_options: getHistoricalMetricsOptions(2),
      };

      const payload = new services.GenerateKeywordIdeasRequest(requestPayload);
      const response =
        await customer.keywordPlanIdeas.generateKeywordIdeas(payload);

      // The response can be an array of results directly or an object with results
      const chunkResults = Array.isArray(response)
        ? response
        : (response as {results?: unknown[]}).results || [];
      const mappedResults = chunkResults.map((idea: unknown) => {
        const i = idea as {
          text?: string;
          keyword_idea_metrics?: {
            avg_monthly_searches?: string | number; avgMonthlySearches?: string | number;
            competition?: string;
            monthly_search_volumes?: { month?: string | number; year?: string | number; monthly_searches?: string | number; monthlySearches?: string | number }[];
            competition_index?: string | number; competitionIndex?: string | number;
            low_top_of_page_bid_micros?: string | number; lowTopOfPageBidMicros?: string | number;
            high_top_of_page_bid_micros?: string | number; highTopOfPageBidMicros?: string | number;
            average_cpc_micros?: string | number; averageCpcMicros?: string | number;
          };
          close_variants?: string[]; closeVariants?: string[];
        };
        return {
          text: i.text || '',
          avgMonthlySearches: Number(i.keyword_idea_metrics?.avg_monthly_searches ?? i.keyword_idea_metrics?.avgMonthlySearches) || 0,
          competition: i.keyword_idea_metrics?.competition || 'UNKNOWN',
          monthlySearchVolumes: i.keyword_idea_metrics?.monthly_search_volumes?.map(vol => ({
            month: typeof vol.month === 'number' || !isNaN(Number(vol.month)) ? enums.MonthOfYear[Number(vol.month)] : String(vol.month),
            year: Number(vol.year),
            monthlySearches: Number(vol.monthly_searches ?? vol.monthlySearches) || 0
          })) || [],
          closeVariants: i.close_variants ?? i.closeVariants ?? [],
          competitionIndex: (i.keyword_idea_metrics?.competition_index ?? i.keyword_idea_metrics?.competitionIndex) != null ? Number(i.keyword_idea_metrics?.competition_index ?? i.keyword_idea_metrics?.competitionIndex) : null,
          lowTopOfPageBidMicros: (i.keyword_idea_metrics?.low_top_of_page_bid_micros ?? i.keyword_idea_metrics?.lowTopOfPageBidMicros) != null ? Number(i.keyword_idea_metrics?.low_top_of_page_bid_micros ?? i.keyword_idea_metrics?.lowTopOfPageBidMicros) : null,
          highTopOfPageBidMicros: (i.keyword_idea_metrics?.high_top_of_page_bid_micros ?? i.keyword_idea_metrics?.highTopOfPageBidMicros) != null ? Number(i.keyword_idea_metrics?.high_top_of_page_bid_micros ?? i.keyword_idea_metrics?.highTopOfPageBidMicros) : null,
          averageCpcMicros: (i.keyword_idea_metrics?.average_cpc_micros ?? i.keyword_idea_metrics?.averageCpcMicros) != null ? Number(i.keyword_idea_metrics?.average_cpc_micros ?? i.keyword_idea_metrics?.averageCpcMicros) : null,
        };
      });
      return acc.concat(mappedResults);
    },
    Promise.resolve([] as KeywordIdea[]),
  );

  return results;
}

/**
 * Generates keyword ideas based on a website URL.
 *
 * @param url - The website URL to generate keyword ideas from.
 * @param pageSize - The maximum number of ideas to return.
 * @returns A promise that resolves to an array of KeywordIdea objects.
 */
export async function getKeywordIdeasFromUrl(
  url: string,
  pageSize?: number,
): Promise<KeywordIdea[]> {
  return getKeywordIdeas({url}, pageSize);
}

/**
 * Generates keyword ideas based on a list of seed keywords.
 * Respects the maximum number of seed keywords per request by chunking the input.
 *
 * @param keywords - An array of seed keywords to generate ideas from.
 * @param pageSize - The maximum number of ideas to return.
 * @returns A promise that resolves to an array of KeywordIdea objects.
 */
export async function getKeywordIdeasFromSeed(
  keywords: string[],
  pageSize?: number,
): Promise<KeywordIdea[]> {
  return getKeywordIdeas({keywords}, pageSize);
}

/**
 * Represents historical metrics for a keyword.
 */
export interface HistoricalMetrics {
  /** The metrics data for the keyword. */
  metrics: {
    /** The average monthly searches for the keyword. */
    avgMonthlySearches: number;
    /** The competition level for the keyword. */
    competition: string;
    /** The competition index for the keyword (0-100). */
    competitionIndex: number | null;
    /** The low range top of page bid in micros. */
    lowTopOfPageBidMicros: number | null;
    /** The high range top of page bid in micros. */
    highTopOfPageBidMicros: number | null;
    /** The monthly search volumes for the past 12 months. */
    monthlySearchVolumes: { month: string; year: number; monthlySearches: number }[];
    /** A list of close variants for the keyword. */
    closeVariants: string[];
    averageCpcMicros: number | null;
  };
  /** The text of the keyword. */
  text: string;
}

/**
 * Retrieves historical metrics for a list of keywords.
 * Respects the maximum number of keywords per request by chunking the input.
 * Enforces a 1 QPS rate limit by delaying subsequent requests.
 *
 * @param keywords - An array of keywords to retrieve metrics for.
 * @returns A promise that resolves to an array of HistoricalMetrics objects.
 */
export async function getHistoricalMetrics(
  keywords: string[],
): Promise<HistoricalMetrics[]> {
  // See `keywords[]` in https://developers.google.com/google-ads/api/reference/rpc/v22/GenerateKeywordHistoricalMetricsRequest
  const MAX_KEYWORDS_PER_REQUEST = 10000;

  const client = new GoogleAdsApi({
    client_id: clientId.trim(),
    client_secret: clientSecret.trim(),
    developer_token: developerToken.trim(),
  });

  const customer = client.Customer({
    customer_id: customerId.trim(),
    refresh_token: refreshToken.trim(),
  });

  const chunks = chunk(keywords, MAX_KEYWORDS_PER_REQUEST);
  const results = await chunks.reduce(
    async (accPromise, chunkedKeywords, i) => {
      const acc = await accPromise;
      if (i > 0) {
        await sleep(1000);
      }

      const payload = new services.GenerateKeywordHistoricalMetricsRequest({
        customer_id: customerId,
        keywords: chunkedKeywords,
        include_adult_keywords: false,
        keyword_plan_network: enums.KeywordPlanNetwork.GOOGLE_SEARCH,
        historical_metrics_options: getHistoricalMetricsOptions(2),
        geo_target_constants: [],
      });

      const response =
        await customer.keywordPlanIdeas.generateKeywordHistoricalMetrics(
          payload,
        );

      // The response can be an array of results directly or an object with results
      const chunkResults = Array.isArray(response)
        ? response
        : (response as {results?: unknown[]}).results || [];
      const mappedResults = chunkResults.map((metric: unknown) => {
        const m = metric as {
          text?: string;
          keyword_metrics?: {
            avg_monthly_searches?: string | number; avgMonthlySearches?: string | number;
            competition?: string;
            competition_index?: string | number; competitionIndex?: string | number;
            low_top_of_page_bid_micros?: string | number; lowTopOfPageBidMicros?: string | number;
            high_top_of_page_bid_micros?: string | number; highTopOfPageBidMicros?: string | number;
            average_cpc_micros?: string | number; averageCpcMicros?: string | number;
            monthly_search_volumes?: { month?: string | number; year?: string | number; monthly_searches?: string | number; monthlySearches?: string | number }[];
          };
          close_variants?: string[]; closeVariants?: string[];
        };
        return {
          text: m.text || '',
          metrics: {
            avgMonthlySearches: Number(m.keyword_metrics?.avg_monthly_searches ?? m.keyword_metrics?.avgMonthlySearches) || 0,
            competition: m.keyword_metrics?.competition || 'UNKNOWN',
            competitionIndex: (m.keyword_metrics?.competition_index ?? m.keyword_metrics?.competitionIndex) != null ? Number(m.keyword_metrics?.competition_index ?? m.keyword_metrics?.competitionIndex) : null,
            lowTopOfPageBidMicros: (m.keyword_metrics?.low_top_of_page_bid_micros ?? m.keyword_metrics?.lowTopOfPageBidMicros) != null ? Number(m.keyword_metrics?.low_top_of_page_bid_micros ?? m.keyword_metrics?.lowTopOfPageBidMicros) : null,
            highTopOfPageBidMicros: (m.keyword_metrics?.high_top_of_page_bid_micros ?? m.keyword_metrics?.highTopOfPageBidMicros) != null ? Number(m.keyword_metrics?.high_top_of_page_bid_micros ?? m.keyword_metrics?.highTopOfPageBidMicros) : null,
            monthlySearchVolumes: m.keyword_metrics?.monthly_search_volumes?.map(vol => ({
              month: typeof vol.month === 'number' || !isNaN(Number(vol.month)) ? enums.MonthOfYear[Number(vol.month)] : String(vol.month),
              year: Number(vol.year),
              monthlySearches: Number(vol.monthly_searches ?? vol.monthlySearches) || 0
            })) || [],
            closeVariants: m.close_variants ?? m.closeVariants ?? [],
            averageCpcMicros: (m.keyword_metrics?.average_cpc_micros ?? m.keyword_metrics?.averageCpcMicros) != null ? Number(m.keyword_metrics?.average_cpc_micros ?? m.keyword_metrics?.averageCpcMicros) : null,
          },
        };
      });
      return acc.concat(mappedResults);
    },
    Promise.resolve([] as HistoricalMetrics[]),
  );

  return results;
}
