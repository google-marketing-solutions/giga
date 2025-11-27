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

import { getCriterionIDs } from './geo';
import { generateKeywordIdeas } from './ideas';
import { getInsightsPrompt } from './prompt';
import {
  columnWiseSum,
  getScriptProperties,
  objectToLowerCaseKeys,
  partition,
  setScriptProperties,
  sum,
} from './util';
import { gemini, GeminiConfig, getGcpProjectId } from './vertex';

const MIN_SEARCH_VOLUME_THRESHOLD_FOR_LATEST_MONTH = 100;

// TODO remove MIN_SEARCH_VOLUME_THRESHOLD_FOR_LATEST_MONTH and let frontend handle this?
export const convertIdeasToRows = ideas =>
  ideas
    .filter(
      res =>
        res.keywordIdeaMetrics?.monthlySearchVolumes?.[
          res.keywordIdeaMetrics.monthlySearchVolumes.length - 1
        ].monthlySearches > MIN_SEARCH_VOLUME_THRESHOLD_FOR_LATEST_MONTH
    )
    .map(result => [
      result.text,
      `${result.keywordIdeaMetrics?.avgMonthlySearches || 0}`,
      ...getSearchVolumeRow(result),
    ]);

export const getIdeas = (keywords, geoID, language, maxIdeas) => {
  const languageID = isNaN(Number(language))
    ? getCriterionIDs([language])[0]
    : language;
  const ideas = generateKeywordIdeas(keywords, geoID, languageID, maxIdeas);
  return convertIdeasToRows(ideas);
};

export const getYoYGrowth = searchVolumes => {
  const latestVolume = searchVolumes[searchVolumes.length - 1];
  const previousYearVolume = searchVolumes[searchVolumes.length - 13];
  return latestVolume / previousYearVolume - 1;
};

export const removeHTMLTicks = html => {
  const prefix = '```html';
  const suffix = '```';
  let cleanedHtml = html;
  if (cleanedHtml.startsWith(prefix)) {
    cleanedHtml = cleanedHtml.substring(prefix.length);
  }
  if (cleanedHtml.endsWith(suffix)) {
    cleanedHtml = cleanedHtml.substring(0, cleanedHtml.length - suffix.length);
  }
  return cleanedHtml;
};

export const getInsights = (
  ideas,
  seedKeywords,
  growthMetric = 'yoy',
  geminiConfig: Partial<GeminiConfig>
) => {
  const relevantIdeas = Object.entries(ideas).map(([idea, searchVolume]) => {
    const history = searchVolume as number[];
    const latest = history[history.length - 1] || 0;
    const prevMonth = history[history.length - 2] || 0;
    const prevYear = history[history.length - 13] || 0;

    let growth = 0;
    if (growthMetric === 'yoy') {
      growth = prevYear !== 0 ? (latest - prevYear) / prevYear : 0;
    } else if (growthMetric === 'mom') {
      growth = prevMonth !== 0 ? (latest - prevMonth) / prevMonth : 0;
    } else if (growthMetric === 'latest_vs_avg') {
      const totalSum = history.reduce((a, b) => a + b, 0);
      const avg = history.length > 0 ? totalSum / history.length : 0;
      growth = avg !== 0 ? (latest - avg) / avg : 0;
    } else if (growthMetric === 'latest_vs_max') {
      const max = Math.max(...history);
      growth = max !== 0 ? (latest - max) / max : 0;
    }
    return [idea, growth];
  });
  console.log('relevantIdeas: ', relevantIdeas);

  const metricNames = {
    yoy: 'YoY',
    mom: 'MoM',
    latest_vs_avg: 'Latest vs Average',
    latest_vs_max: 'Last Month vs Max',
  };
  const metricName = metricNames[growthMetric] || 'YoY';

  const insightsPrompt = getInsightsPrompt(
    relevantIdeas,
    seedKeywords,
    metricName
  );
  console.log(insightsPrompt.slice(insightsPrompt.length - 1000));
  const responseType = 'text/plain';
  const config = createGeminiConfig(geminiConfig, responseType);
  return removeHTMLTicks(gemini(config)(insightsPrompt));
};

const getSearchVolumeRow = res => {
  const volumes = res.keywordIdeaMetrics.monthlySearchVolumes.map(
    m => m.monthlySearches
  );

  const latestVolume = volumes[volumes.length - 1];
  const previousMonthVolume = volumes[volumes.length - 2];
  const previousYearVolume = volumes[volumes.length - 13];

  return [
    latestVolume / previousMonthVolume - 1,
    latestVolume / previousYearVolume - 1,
    ...volumes,
  ];
};

/**
 * @return {GeminiConfig} config
 */
export const createGeminiConfig = (
  config: Partial<GeminiConfig>,
  responseType = 'application/json'
): GeminiConfig => {
  return {
    modelId: config.modelId,
    projectId: getGcpProjectId(),
    location: 'us-central1',
    temperature: config.temperature,
    topP: config.topP,
    responseType,
  };
};

export const getClusters = (
  ideas,
  promptTemplate,
  geminiConfig: Partial<GeminiConfig>
) => {
  ideas = objectToLowerCaseKeys(ideas);
  const keywords = Object.keys(ideas).join(', ');
  console.log(
    `Starting to cluster ${Object.keys(ideas).length} ideas (${keywords.length} characters)`
  );
  const prompt = `${promptTemplate}\n${keywords}\n${PROMPT_DATA_FORMAT_SUFFIX}`;
  const config = createGeminiConfig(geminiConfig, 'application/json');
  const clusters = gemini(config)(prompt).map(cluster => {
    // TODO lookup all keywords again in keyword planner since gemini could have combined keywords into more generic broad match keywords that did not show up in ideas
    // remove keywords not found in ideas (hallucinations)
    const [keywordIdeas, hallucinations] = partition(
      cluster.keywords,
      keyword => keyword.toLowerCase() in ideas
    );
    cluster.keywords = keywordIdeas;

    // check hallucinations
    if (hallucinations.length > 0) {
      console.log(
        `WARNING: Gemini Clustering produced the following keywords for cluster ${cluster.topic} which could not be found in ideas: ${hallucinations.join(', ')}`
      );
    }

    // add search volume stats
    cluster.searchVolumes = cluster.keywords.map(k => ideas[k]);
    cluster.latestSearchVolumes = cluster.searchVolumes.map(
      v => v[v.length - 1]
    );

    // add sum of all keywords over time
    cluster.searchVolumeHistory = columnWiseSum(cluster.searchVolumes);

    // get latest search volume sum of cluster
    cluster.searchVolume = sum(cluster.latestSearchVolumes);

    // Calculate Growth Metrics
    const history = cluster.searchVolumeHistory;
    const latest = history[history.length - 1] || 0;
    const prevMonth = history[history.length - 2] || 0;
    const prevYear = history[history.length - 13] || 0; // 12 months ago

    // Year over Year
    // Note: Original logic used sum of previousYearVolumes for individual keywords, which is mathematically equivalent to history.at(-13) if history is sum.
    // However, let's stick to the history array for consistency.
    cluster.growthYoY = prevYear !== 0 ? (latest - prevYear) / prevYear : 0;
    cluster.yearOverYearGrowth = cluster.growthYoY; // Keep for backward compatibility

    // Month over Month
    cluster.growthMoM = prevMonth !== 0 ? (latest - prevMonth) / prevMonth : 0;

    // Latest vs Average
    const totalSum = history.reduce((a, b) => a + b, 0);
    const avg = history.length > 0 ? totalSum / history.length : 0;
    cluster.growthLatestVsAvg = avg !== 0 ? (latest - avg) / avg : 0;

    // Latest vs Max
    const max = Math.max(...history);
    cluster.growthLatestVsMax = max !== 0 ? (latest - max) / max : 0;

    return cluster;
  });
  return clusters;
};

const PROMPT_DATA_FORMAT_SUFFIX = `
  Output as a list of topics where each topic has a name and up to 10 keywords as JSON with this format:
    [
      {
        "topic": "A descriptive name of topic 1",
        "keywords": ["a1", "b1", "c1"]
      },
      {
        "topic": "A descriptive name of topic 2",
        "keywords": ["a2", "b2", "c2"]
      }
    ]
`;

export const getCampaigns = (
  insights,
  language,
  brandName,
  adExamples,
  geminiConfig: Partial<GeminiConfig>
) => {
  const prompt = ` I am a SEA manager working for ${brandName} and I want to create new Google Ads search campaigns based on the following input.
  For each cluster in the **Cluster Insights & Marketing Takeaways:** section, generate a ready-to-use text ad campaign.

  Ensure the new created ads are following the style, wording, tonality of the following ad examples:
  ${adExamples}

  Output as HTML with standard HTML elements like <h1> and <ul> for captions or lists

  Create the Campaigns in ${language}.
  Please style the Ad examples so that they look like text ads shown on google.com

  Insights:

  ${insights}

  `;
  return removeHTMLTicks(
    gemini(createGeminiConfig(geminiConfig, 'text/plain'))(prompt)
  );
};

export const checkScriptProperties = () => {
  const devToken = getScriptProperties('DEVELOPER_TOKEN');
  const adsAccountId = getScriptProperties('ADS_ACCOUNT_ID');
  const spreadsheetUrl = getScriptProperties('SPREADSHEET_URL');
  return {
    hasDeveloperToken: !!devToken,
    hasAdsAccountId: !!adsAccountId,
    adsAccountId: adsAccountId || '',
    spreadsheetUrl: spreadsheetUrl || '',
  };
};

export const setScriptProperty = (key: string, value: string) => {
  setScriptProperties(key, value);
  return checkScriptProperties();
};

export const doGet = () =>
  HtmlService.createTemplateFromFile('webApp').evaluate().setTitle('GIGA');

export const main = null;
