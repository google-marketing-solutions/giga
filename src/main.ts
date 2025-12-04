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
import {
  gemini,
  GeminiConfig,
  getGcpProjectId,
  ResponseSchema,
} from './vertex';

const MIN_SEARCH_VOLUME_THRESHOLD_FOR_LATEST_MONTH = 100;

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

export const calculateGrowthMetrics = (history: number[]) => {
  const latest = history[history.length - 1] || 0;
  const prevMonth = history[history.length - 2] || 0;
  const prevYear = history[history.length - 13] || 0;

  const yoy = prevYear !== 0 ? (latest - prevYear) / prevYear : 0;
  const mom = prevMonth !== 0 ? (latest - prevMonth) / prevMonth : 0;

  const totalSum = history.reduce((a, b) => a + b, 0);
  const avg = history.length > 0 ? totalSum / history.length : 0;
  const latest_vs_avg = avg !== 0 ? (latest - avg) / avg : 0;

  const historyWithoutLatest = history.slice(0, -1);
  const max =
    historyWithoutLatest.length > 0 ? Math.max(...historyWithoutLatest) : 0;
  const latest_vs_max = max !== 0 ? (latest - max) / max : 0;

  const last3Months = history.slice(-3);
  const prevMonths = history.slice(-24, -3);
  const avgLast3 =
    last3Months.length > 0
      ? last3Months.reduce((a, b) => a + b, 0) / last3Months.length
      : 0;
  const avgPrev =
    prevMonths.length > 0
      ? prevMonths.reduce((a, b) => a + b, 0) / prevMonths.length
      : 0;
  const three_months_vs_avg =
    avgPrev !== 0 ? (avgLast3 - avgPrev) / avgPrev : 0;

  return {
    yoy,
    mom,
    latest_vs_avg,
    latest_vs_max,
    three_months_vs_avg,
  };
};

export const calculateKeywordGrowth = (
  ideas: Record<string, number[]>,
  growthMetric = 'three_months_vs_avg'
): [string, number][] => {
  return Object.entries(ideas).map(([idea, searchVolume]) => {
    const history = searchVolume as number[];
    const metrics = calculateGrowthMetrics(history);
    return [idea, metrics[growthMetric] || 0];
  });
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
  growthMetric = 'three_months_vs_avg',
  geminiConfig: Partial<GeminiConfig>
) => {
  const relevantIdeas = calculateKeywordGrowth(ideas, growthMetric);
  console.log('relevantIdeas: ', relevantIdeas);

  const metricNames = {
    yoy: 'YoY',
    mom: 'MoM',
    latest_vs_avg: 'Latest vs Average',
    latest_vs_max: 'Last Month vs Max',
    three_months_vs_avg: 'Last 3 Months vs Prev Avg',
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
  responseType = 'application/json',
  responseSchema?: ResponseSchema
): GeminiConfig => {
  return {
    modelId: config.modelId,
    projectId: getGcpProjectId(),
    location: 'us-central1',
    temperature: config.temperature,
    topP: config.topP,
    responseType,
    responseSchema,
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
  const responseSchema: ResponseSchema = {
    type: 'ARRAY',
    items: {
      type: 'OBJECT',
      properties: {
        topic: { type: 'STRING' },
        keywords: {
          type: 'ARRAY',
          items: { type: 'STRING' },
        },
      },
      required: ['topic', 'keywords'],
    },
  };
  const config = createGeminiConfig(
    geminiConfig,
    'application/json',
    responseSchema
  );
  const clusters = gemini(config)(prompt).map(cluster => {
    const [keywordIdeas, hallucinations] = partition(
      cluster.keywords,
      keyword => keyword.toLowerCase() in ideas
    );
    cluster.keywords = keywordIdeas;

    if (hallucinations.length > 0) {
      console.log(
        `WARNING: Gemini Clustering produced the following keywords for cluster ${cluster.topic} which could not be found in ideas: ${hallucinations.join(', ')}`
      );
    }

    cluster.searchVolumes = cluster.keywords.map(k => ideas[k]);
    cluster.latestSearchVolumes = cluster.searchVolumes.map(
      v => v[v.length - 1]
    );

    cluster.searchVolumeHistory = columnWiseSum(cluster.searchVolumes);
    cluster.searchVolume = sum(cluster.latestSearchVolumes);

    const history = cluster.searchVolumeHistory;
    const metrics = calculateGrowthMetrics(history);

    cluster.growthYoY = metrics.yoy;
    cluster.yearOverYearGrowth = cluster.growthYoY;

    cluster.growthMoM = metrics.mom;

    cluster.growthLatestVsAvg = metrics.latest_vs_avg;

    cluster.growthLatestVsMax = metrics.latest_vs_max;

    cluster.growthThreeMonthsVsAvg = metrics.three_months_vs_avg;

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
  ideas,
  growthMetric,
  language,
  brandName,
  adExamples,
  styleGuide,
  geminiConfig: Partial<GeminiConfig>
) => {
  const relevantIdeas = calculateKeywordGrowth(ideas, growthMetric);

  // Format relevantIdeas for the prompt
  const ideasString = relevantIdeas
    .map(([idea, growth]) => `- ${idea}: ${(growth * 100).toFixed(1)}%`)
    .join('\n');

  const prompt = ` I am a SEA manager working for ${brandName} and I want to create new Google Ads search campaigns based on the following input.
  Based on the provided keywords and their growth metrics, generate ready-to-use text ad campaigns. Group related keywords into campaigns and focus on high-growth keywords.

  Ensure the new created ads are following the style, wording, tonality of the following ad examples:
  ${adExamples}

  Also adhere to the following Style Guide:
  ${styleGuide}

  Create the Campaigns in ${language}.

  Keywords and Growth Metrics:

  ${ideasString}

  `;
  const responseSchema: ResponseSchema = {
    type: 'ARRAY',
    items: {
      type: 'OBJECT',
      properties: {
        campaignName: { type: 'STRING' },
        adGroups: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              name: { type: 'STRING' },
              keywords: { type: 'ARRAY', items: { type: 'STRING' } },
              ads: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    headlines: { type: 'ARRAY', items: { type: 'STRING' } },
                    descriptions: { type: 'ARRAY', items: { type: 'STRING' } },
                  },
                  required: ['headlines', 'descriptions'],
                },
              },
            },
            required: ['name', 'keywords', 'ads'],
          },
        },
      },
      required: ['campaignName', 'adGroups'],
    },
  };

  const result = gemini(
    createGeminiConfig(geminiConfig, 'application/json', responseSchema)
  )(prompt);
  return result;
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

export const doGet = () => {
  const template = HtmlService.createTemplateFromFile('webApp');
  template.userEmail = Session.getActiveUser().getEmail();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (template as any).include = (filename: string) =>
    HtmlService.createHtmlOutputFromFile(filename).getContent();
  return template.evaluate().setTitle('GIGA');
};

export const main = null;
