import { addGoogleAdsAuth, ADS_ENDPOINT, ADS_VERSION } from './ideas';
import { createGeminiConfig } from './main';
import { deduplicate, getDateWithDeltaDays, groupBy, keepKeys } from './util';
import { gemini } from './vertex';

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
export const getNewSearchTermsClusters = (
  customerId,
  newDuringLastDays = 7,
  compareDuration = 30,
  language = 'English',
  geminiConfig
) => {
  const config = createGeminiConfig(geminiConfig, 'application/json');

  // TODO make get only new a parameter
  const searchTerms = getSearchTermReportDiff(
    customerId,
    newDuringLastDays,
    compareDuration
  );

  const clusters = gemini(config)(`
  Given a list of google ads search terms defined below in SEARCH_TERMS.
  Return a list of maximum 20 different broad match keywords that represent those search terms as best as possible.

  Please use ${language} for the output.
  Output format should be an array of strings.

  SEARCH_TERMS:
  ${searchTerms.join(', ')}`);

  console.log(JSON.stringify(clusters, null, 2));
  console.log(clusters.join(', '));
  console.log(clusters.join('\n'));
  return clusters;
};

/**
 * Sends a request to the Google Ads API with authentication.
 *
 * @param customerId - The ID of the Google Ads customer.
 * @param service - The service endpoint to use.
 * @param request - The request payload to send.
 * @returns The response from the Google Ads API.
 */
const authorizedGoogleAdsRequest = (customerId, service, request) => {
  const params: object = addGoogleAdsAuth(request);
  const url = `${ADS_ENDPOINT}/customers/${customerId}${service}`;
  return UrlFetchApp.fetch(url, params).getContentText();
};

/**
 * Represents the AdsApp class, which provides a static method for searching the Google Ads API.
 */
class AdsApp {
  static search = (payload, config) =>
    authorizedGoogleAdsRequest(config.customerId, '/googleAds:search', payload);
}

/**
 * Executes a Google Ads query and returns the results.
 *
 * @param customerId - The ID of the Google Ads customer.
 * @param query - The query to execute.
 * @returns The results of the query.
 */
export const runQuery = (customerId, query) => {
  const request = {
    customerId,
    query,
    pageToken: undefined,
  };

  const results = [];
  do {
    // preparing payload
    const config = { customerId, version: ADS_VERSION };
    const payload = JSON.stringify(request);
    const response = JSON.parse(AdsApp.search(payload, config));

    const error = response.error || response.errors;
    if (error) {
      const message = JSON.stringify(error, null, 2);
      throw new Error(message);
    }
    request.pageToken = response.nextPageToken;
    results.push(...(response.results || []));
    console.log(`Fetching results... #${results.length}`);
  } while (request.pageToken);

  return results;
};

/**
 * Retrieves a list of search terms from the Google Ads API based on the specified criteria.
 *
 * @param customerId - The ID of the Google Ads customer.
 * @param segmentClause - The segment clause to use in the query.
 * @param metric - The metric to use for sorting (default is "clicks").
 * @param metricThreshold - The threshold for the metric (default is 100).
 * @param sortOrder - The order to sort the results (default is "DESC").
 * @param limit - The maximum number of results to return (default is 10000).
 * @returns An array of search terms.
 */
const getSearchTerms = (
  customerId,
  segmentClause,
  metric = 'clicks',
  metricThreshold = 100,
  sortOrder = 'DESC',
  limit = 10000
) => {
  const query = `SELECT
    search_term_view.search_term,
    metrics.${metric}
  FROM
    search_term_view
  WHERE
    ${segmentClause}
    AND search_term_view.search_term != ''
    AND metrics.${metric} > ${metricThreshold}
  ORDER BY
    metrics.${metric} ${sortOrder}
  LIMIT ${limit}`;
  const res = runQuery(customerId, query);
  const searchTerms = res.map(item => item.searchTermView.searchTerm);
  return deduplicate(searchTerms);
};

/**
 * Retrieves a list of search terms from the Google Ads API based on the specified criteria.
 *
 * @param customerId - The ID of the Google Ads customer.
 * @param startDaysAgo - The number of days ago to start the date range (default is 0).
 * @param endDaysAgo - The number of days ago to end the date range (default is 0).
 * @returns A date segment string in the format "segments.date >= \"YYYY-MM-DD\" AND segments.date < \"YYYY-MM-DD\"".
 */
export const getDateSegment = (startDaysAgo, endDaysAgo = 0) => {
  const startSegment = getDateWithDeltaDays(-startDaysAgo)
    .toISOString()
    .slice(0, 10);
  const endSegment = getDateWithDeltaDays(-endDaysAgo)
    .toISOString()
    .slice(0, 10);
  return `segments.date >= "${startSegment}" AND segments.date < "${endSegment}"`;
};

/**
 * Retrieves a list of search terms from the Google Ads API based on the specified criteria.
 *
 * @param customerId - The ID of the Google Ads customer.
 * @param newDuringLastDays - The number of days ago to start the date range (default is 0).
 * @param endDaysAgo - The number of days ago to end the date range (default is 0).
 * @returns A date segment string in the format "segments.date >= \"YYYY-MM-DD\" AND segments.date < \"YYYY-MM-DD\"".
 */
const getSearchTermReportDiff = (
  customerId,
  newDuringLastDays = 7,
  compareDuration = 30
) => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - newDuringLastDays - compareDuration);

  const end = new Date(now);
  const endSegment = end.toISOString().slice(0, 10);

  const startSegment = start.toISOString().slice(0, 10);

  if (!compareDuration) {
    return getSearchTerms(
      customerId,
      `segments.date >= "${startSegment}" AND segments.date < "${endSegment}"`
    );
  } else {
    const middle = new Date(now);
    middle.setDate(now.getDate() - newDuringLastDays);
    const middleSegment = middle.toISOString().slice(0, 10);

    const a = getSearchTerms(
      customerId,
      `segments.date >= "${startSegment}" AND segments.date < "${middleSegment}"`
    );
    const setA = new Set(a);
    const b = getSearchTerms(
      customerId,
      `segments.date >= "${middleSegment}" AND segments.date <= "${endSegment}"`
    );
    const diff = b.filter(str => !setA.has(str));
    console.log(a);
    console.log(b);
    console.log(diff);
    return diff;
  }
};

/**
 * Generates a prompt for ad creation based on a list of keywords.
 *
 * @param keywords - An array of keywords to use in the prompt.
 * @returns A string containing the prompt for ad creation.
 */
const getPromptKeywordsTemplate = keywords => `
*User:*

Please write 3 distinct ads, each with 15 headlines and 4 descriptions for the following keywords:
[${keywords.join(', ')}]

Make sure the ads are different from each other to cover different angles.
Do not produce placeholders (e.g. {KeyWord: Vintage Jeans}) and instead produce readable text.
Output strictly as a JSON array of objects, where each object has 'headlines' (array of strings) and 'descriptions' (array of strings) properties.

*Model:*
`;

/**
 * Generates an example from an ad.
 *
 * @param ad - The ad to generate an example from.
 * @returns A string containing the example.
 */
const getExampleFromAd = ad => `
${getPromptKeywordsTemplate(ad.keywords)}
${JSON.stringify(keepKeys(ad, ['headlines', 'descriptions']), null, 2)}
`;

/**
 * Generates a prompt template from an array of ads.
 *
 * @param ads - An array of ads to generate a prompt template from.
 * @returns A string containing the prompt template.
 */
const getPromptTemplate = ads => `
  ${ads.map(getExampleFromAd).join('\n')}
`;

/**
 * Retrieves a list of keywords from the Google Ads API based on the specified criteria.
 *
 * @param cid - The ID of the Google Ads customer.
 * @param adGroupIds - An array of ad group IDs to use in the query.
 * @param durationClause - The duration clause to use in the query.
 * @returns An array of keywords.
 */
const getKeywords = (cid, adGroupIds, durationClause) => {
  // TODO might need chunking for large accounts
  const query = `
    SELECT ad_group_criterion.keyword.text,
      ad_group.id
      FROM keyword_view
    WHERE
      ad_group.id IN (${adGroupIds.join(',')})
      AND ad_group_criterion.status != 'REMOVED'
      AND ${durationClause}
      AND ad_group_criterion.keyword.match_type = 'BROAD'
  `;
  console.log(query);
  const res = runQuery(cid, query);
  const adGroupIdsWithKeywords = res.map(item => [
    item.adGroup.id,
    item.adGroupCriterion.keyword.text,
  ]);
  const mapping = groupBy(
    adGroupIdsWithKeywords,
    item => item[0],
    item => item[1]
  );
  return mapping;
};

/**
 * Retrieves a list of top performing ads and keywords from the Google Ads API based on the specified criteria.
 *
 * @param cid - The ID of the Google Ads customer.
 * @param topN - The number of top performing ads to retrieve.
 * @param lookbackDays - The number of days to look back for performance data (default is 30).
 * @param metric - The metric to use for sorting (default is "clicks").
 * @returns An array of top performing ads and keywords.
 */
export const getTopPerformingAdsAndKeywords = (
  cid,
  topN,
  lookbackDays = 30,
  metric = 'clicks'
) => {
  const dateSegment = getDateSegment(lookbackDays);

  const topAdsQuery = `
  SELECT
    ad_group.id,
    ad_group_ad.ad.id,
    ad_group_ad.ad.responsive_search_ad.headlines,
    ad_group_ad.ad.responsive_search_ad.descriptions,
    ad_group_ad.ad_strength,
    metrics.${metric}
  FROM ad_group_ad
  WHERE campaign.advertising_channel_type = 'SEARCH'
    AND ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD'
    AND ${dateSegment}
    AND ad_group_ad.status = 'ENABLED'
    AND ad_group.status = 'ENABLED'
    AND campaign.status = 'ENABLED'
  ORDER BY metrics.${metric} DESC
  LIMIT ${topN}`;

  const bestAds = runQuery(cid, topAdsQuery).map(item => ({
    adGroupId: item.adGroup.id,
    headlines: item.adGroupAd.ad.responsiveSearchAd.headlines.map(x => x.text),
    descriptions: item.adGroupAd.ad.responsiveSearchAd.descriptions.map(
      x => x.text
    ),
  }));

  const adGroupIds = deduplicate(bestAds.map(ad => ad.adGroupId));
  const keywords = getKeywords(cid, adGroupIds, dateSegment);
  return bestAds.map(ad =>
    Object.assign(ad, { keywords: keywords[ad.adGroupId] })
  );
};

/**
 * Generates a prompt for ad creation based on a list of keywords.
 *
 * @param cid - The ID of the Google Ads customer.
 * @param topN - The number of top performing ads to retrieve.
 * @param lookbackDays - The number of days to look back for performance data (default is 30).
 * @param metric - The metric to use for sorting (default is "clicks").
 * @returns A string containing the prompt for ad creation.
 */
export const getTopPerformingAdsPrompt = (
  cid,
  topN,
  lookbackDays = 30,
  metric = 'clicks'
) => {
  const adsWithKeywords = getTopPerformingAdsAndKeywords(
    cid,
    topN,
    lookbackDays,
    metric
  );
  const prompt = getPromptTemplate(adsWithKeywords);
  console.log(prompt);
  return prompt;
};

/**
 * Generates an ad suggestion based on a prompt and a list of keywords.
 *
 * @param prompt - The prompt to use for ad generation.
 * @param userKeywords - An array of keywords to use in the prompt.
 * @param geminiConfig - The configuration for the Gemini API.
 * @returns A string containing the ad suggestion.
 */
export const createAdSuggestion = (prompt, userKeywords, geminiConfig) => {
  const config = createGeminiConfig(geminiConfig, 'application/json');
  return gemini(config)(
    `${prompt}\n${getPromptKeywordsTemplate(userKeywords)}`
  );
};

/**
 * Generates a campaign prompt based on a list of top performing ads and keywords.
 *
 * @param cid - The ID of the Google Ads customer.
 * @param lookbackDays - The number of days to look back for performance data (default is 30).
 * @param metric - The metric to use for sorting (default is "clicks").
 * @returns A string containing the campaign prompt.
 */
export const createCampaignPrompt = (
  cid,
  lookbackDays = 30,
  metric = 'clicks'
) => {
  const adsWithKeywords = getTopPerformingAdsAndKeywords(
    cid,
    5,
    lookbackDays,
    metric
  );
  return getPromptTemplate(adsWithKeywords);
};
