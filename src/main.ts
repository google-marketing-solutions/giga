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

/**
 * Converts keyword ideas to rows.
 *
 * @param ideas - An array of keyword ideas.
 * @returns A list of rows representing the keyword ideas and their metrics.
 */
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

/**
 * Retrieves keyword ideas for a given set of seed keywords, location, and language.
 *
 * @param keywords - An array of seed keywords.
 * @param geoID - The location ID to target.
 * @param language - The language ID or name.
 * @param maxIdeas - The maximum number of ideas to retrieve.
 * @returns A list of rows representing the keyword ideas and their metrics.
 */
export const getIdeas = (
  keywords: string[],
  geoID: string,
  language: string,
  maxIdeas: number
) => {
  const languageID = isNaN(Number(language))
    ? getCriterionIDs([language])[0]
    : language;
  const ideas = generateKeywordIdeas(keywords, geoID, languageID, maxIdeas);
  return convertIdeasToRows(ideas);
};

/**
 * Calculates the year-over-year (YoY) growth rate for a list of search volumes.
 *
 * @param searchVolumes - An array of search volumes.
 * @returns The YoY growth rate as a decimal.
 */
export const getYoYGrowth = (searchVolumes: number[]) => {
  const latestVolume = searchVolumes[searchVolumes.length - 1];
  const previousYearVolume = searchVolumes[searchVolumes.length - 13];
  return latestVolume / previousYearVolume - 1;
};

/**
 * Calculates various growth metrics for a list of search volumes.
 *
 * @param searchVolumes - An array of search volumes.
 * @returns An object containing various growth metrics.
 */
export const calculateGrowthMetrics = (searchVolumes: number[]) => {
  const latest = searchVolumes[searchVolumes.length - 1] || 0;
  const prevMonth = searchVolumes[searchVolumes.length - 2] || 0;
  const prevYear = searchVolumes[searchVolumes.length - 13] || 0;

  const yoy = prevYear !== 0 ? (latest - prevYear) / prevYear : 0;
  const mom = prevMonth !== 0 ? (latest - prevMonth) / prevMonth : 0;

  const totalSum = searchVolumes.reduce((a, b) => a + b, 0);
  const avg = searchVolumes.length > 0 ? totalSum / searchVolumes.length : 0;
  const latest_vs_avg = avg !== 0 ? (latest - avg) / avg : 0;

  const historyWithoutLatest = searchVolumes.slice(0, -1);
  const max =
    historyWithoutLatest.length > 0 ? Math.max(...historyWithoutLatest) : 0;
  const latest_vs_max = max !== 0 ? (latest - max) / max : 0;

  const last3Months = searchVolumes.slice(-3);
  const prevMonths = searchVolumes.slice(-24, -3);
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

/**
 * Calculates the growth metric for each keyword idea.
 *
 * @param ideas - A record mapping keyword text to search volume history.
 * @param growthMetric - The specific growth metric to extract (default: 'three_months_vs_avg').
 * @returns A list of tuples containing the keyword and its calculated growth metric.
 */
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

/**
 * Removes markdown code block ticks (```html ... ```) from a string.
 *
 * @param html - The string containing potential markdown code blocks.
 * @returns The cleaned string.
 */
export const removeHTMLTicks = (html: string) => {
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

/**
 * Retrieves insights for a list of keyword ideas.
 *
 * @param ideas - A record mapping keyword text to search volume history.
 * @param seedKeywords - An array of seed keywords.
 * @param growthMetric - The specific growth metric to extract (default: 'three_months_vs_avg').
 * @param geminiConfig - The Gemini configuration.
 * @param language - The language to use for the insights (default: 'English').
 * @returns The insights for the keyword ideas.
 */
export const getInsights = (
  ideas,
  seedKeywords,
  growthMetric = 'three_months_vs_avg',
  geminiConfig: Partial<GeminiConfig>,
  language = 'English'
) => {
  const relevantIdeas = calculateKeywordGrowth(ideas, growthMetric);
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
    metricName,
    language
  );
  const responseType = 'text/plain';
  const config = createGeminiConfig(geminiConfig, responseType);
  return removeHTMLTicks(gemini(config)(insightsPrompt));
};

/**
 * Retrieves the search volume row for a keyword idea.
 *
 * @param res - The keyword idea result.
 * @returns The search volume row.
 */
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
 * Creates a Gemini configuration.
 *
 * @param config - The partial Gemini configuration.
 * @param responseType - The response type (default: 'application/json').
 * @param responseSchema - The response schema.
 * @returns The Gemini configuration.
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

/**
 * Retrieves clusters for a list of keyword ideas.
 *
 * @param ideas - A record mapping keyword text to search volume history.
 * @param promptTemplate - The prompt template.
 * @param geminiConfig - The Gemini configuration.
 * @returns The clusters for the keyword ideas.
 */
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

/**
 * Retrieves campaigns for a list of keyword ideas.
 *
 * @param ideas - A record mapping keyword text to search volume history.
 * @param growthMetric - The specific growth metric to extract (default: 'three_months_vs_avg').
 * @param language - The language to use for the insights (default: 'English').
 * @param brandName - The brand name.
 * @param adExamples - The ad examples.
 * @param styleGuide - The style guide.
 * @param geminiConfig - The Gemini configuration.
 * @returns The campaigns for the keyword ideas.
 */
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
/**
 * Checks if the current active user is the effective user.
 *
 * @returns A boolean indicating whether the effective user is the active user.
 */
export const isEffectiveUser = () =>
  Session.getEffectiveUser().getEmail() === Session.getActiveUser().getEmail();

/**
 * Gets the script properties configuration accessing the Google Ads api and spreadsheet exports
 *
 * @returns An object containing the developer token, ads account ID, and spreadsheet URL.
 */
export const getScriptPropertiesConfiguration = () => {
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
/**
 * Sets a script property.
 *
 * @param key - The key of the script property.
 * @param value - The value of the script property.
 * @returns The updated script properties configuration.
 */
export const setScriptProperty = (key: string, value: string) => {
  if (!isEffectiveUser()) {
    throw new Error(
      'Only the script owner is allowed to update script properties'
    );
  }
  setScriptProperties(key, value);
  return getScriptPropertiesConfiguration();
};

/**
 * Handles the GET request for the web app.
 *
 * @returns The HTML output of the web app.
 */
export const doGet = () => {
  const template = HtmlService.createTemplateFromFile('webApp');
  template.userEmail = Session.getEffectiveUser().getEmail();
  template.isEffectiveUser = isEffectiveUser();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (template as any).include = (filename: string) =>
    HtmlService.createHtmlOutputFromFile(filename).getContent();
  return template.evaluate().setTitle('GIGA');
};

export const main = null;
