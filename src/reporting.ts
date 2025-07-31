import { addGoogleAdsAuth, ADS_ENPOINT, ADS_VERSION } from './ideas';
import { getGeminiConfig } from './main';
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
  language = 'English'
) => {
  // TODO use model config from frontend
  // See https://ai.google.dev/gemini-api/docs/models/experimental-models#available-models
  const config = {
    modelID: 'gemini-2.5-flash',
    projectID: 'cloud-project-here',
    responseType: 'application/json',
  };

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

const authorizedGoogleAdsRequest = (customerId, service, request) => {
  const params: object = addGoogleAdsAuth(request);
  const url = `${ADS_ENPOINT}/customers/${customerId}${service}`;
  return UrlFetchApp.fetch(url, params).getContentText();
};

class AdsApp {
  static search = (payload, config) =>
    authorizedGoogleAdsRequest(config.customerId, '/googleAds:search', payload);
}

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

export const getDateSegment = (startDaysAgo, endDaysAgo = 0) => {
  const startSegment = getDateWithDeltaDays(-startDaysAgo)
    .toISOString()
    .slice(0, 10);
  const endSegment = getDateWithDeltaDays(-endDaysAgo)
    .toISOString()
    .slice(0, 10);
  return `segments.date >= "${startSegment}" AND segments.date < "${endSegment}"`;
};

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

const getPromptKeywordsTemplate = keywords => `
*User:*

Please write an ad with 15 headlines and 4 descriptions for the following keywords:
[${keywords.join(', ')}]

*Model:*
`;

const getExampleFromAd = ad => `
${getPromptKeywordsTemplate(ad.keywords)}
${JSON.stringify(keepKeys(ad, ['headlines', 'descriptions']), null, 2)}
`;

const getPromptTemplate = ads => `
  ${ads.map(getExampleFromAd).join('\n')}
`;

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
  // console.log(JSON.stringify(res, null, 2));
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

export const getTopPerformingAdsAndKeywords = (cid, topN) => {
  const durationClause = `segments.date DURING LAST_30_DAYS`;
  const topAdsQuery = `
  SELECT
    ad_group.id,
    ad_group_ad.ad.id,
    ad_group_ad.ad.responsive_search_ad.headlines,
    ad_group_ad.ad.responsive_search_ad.descriptions,
    ad_group_ad.ad_strength,
    metrics.clicks
  FROM ad_group_ad
  WHERE campaign.advertising_channel_type = 'SEARCH'
    AND ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD'
    AND ${durationClause}
    AND ad_group_ad.status = 'ENABLED'
    AND ad_group.status = 'ENABLED'
    AND campaign.status = 'ENABLED'
  ORDER BY metrics.clicks DESC
  LIMIT ${topN}`;

  const bestAds = runQuery(cid, topAdsQuery).map(item => ({
    adGroupId: item.adGroup.id,
    headlines: item.adGroupAd.ad.responsiveSearchAd.headlines.map(x => x.text),
    descriptions: item.adGroupAd.ad.responsiveSearchAd.descriptions.map(
      x => x.text
    ),
  }));

  const adGroupIds = deduplicate(bestAds.map(ad => ad.adGroupId));
  const keywords = getKeywords(cid, adGroupIds, durationClause);
  return bestAds.map(ad =>
    Object.assign(ad, { keywords: keywords[ad.adGroupId] })
  );
};
export const getTopPerformingAdsPrompt = (cid, topN) => {
  const adsWithKeywords = getTopPerformingAdsAndKeywords(cid, topN);
  const prompt = getPromptTemplate(adsWithKeywords);
  console.log(prompt);
  return prompt;
};

export const createAdSuggestion = (prompt, userKeywords) => {
  const config = getGeminiConfig('application/json');
  return gemini(config)(
    `${prompt}\n${getPromptKeywordsTemplate(userKeywords)}`
  );
};
