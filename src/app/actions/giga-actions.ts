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


'use server';

import { GoogleAdsApi } from 'google-ads-api';
import { getEnvVar } from '../../lib/utils';
import { getHistoricalMetrics as googleAdsGetHistoricalMetrics, getKeywordIdeasFromSeed } from '../../lib/google-ads';
import { geminiRequest } from './gemini';
import { calculateKeywordGrowth, calculateGrowthMetrics } from '../../lib/metrics';
import { getInsightsPrompt, INSIGHTS_CHAT_PROMPT, getPromptKeywordsTemplate } from '../../lib/prompt-templates';

/**
 * The default limit for keyword ideas to generate.
 */
const DEFAULT_KEYWORD_LIMIT = 5000;

const properties: Record<string, string> = {
  ADS_ACCOUNT_ID: '',
  DEVELOPER_TOKEN: '',
  GEMINI_API_KEY: ''
};

const getAdsClient = (customerIdOverride?: string) => {
  const developerToken = properties.DEVELOPER_TOKEN || getEnvVar('GOOGLE_ADS_DEVELOPER_TOKEN', '');
  const clientId = getEnvVar('GOOGLE_ADS_CLIENT_ID', '');
  const clientSecret = getEnvVar('GOOGLE_ADS_CLIENT_SECRET', '');
  const refreshToken = getEnvVar('GOOGLE_ADS_REFRESH_TOKEN', '');
  const customerId = customerIdOverride || properties.ADS_ACCOUNT_ID || getEnvVar('GOOGLE_ADS_CUSTOMER_ID', '');
  
  const client = new GoogleAdsApi({
    client_id: clientId.trim(),
    client_secret: clientSecret.trim(),
    developer_token: developerToken.trim(),
  });

  return client.Customer({
    customer_id: customerId.trim().replace(/-/g, ''),
    refresh_token: refreshToken.trim(),
  });
};

export async function createSpreadsheet() {
  return 'https://docs.google.com/spreadsheets/d/mock-sheet-id';
}
export async function exportToSheet() {
  return true;
}
export async function getLanguageId(lookupText: string, config: Record<string, unknown>) {
  try {
    const customer = getAdsClient();
    const query = `
      SELECT language_constant.id, language_constant.name
      FROM language_constant
      WHERE language_constant.name = '${lookupText}'
    `;
    const response = await customer.query(query);
    const result = response?.[0]?.language_constant;
    if (result) {
      return { id: String(result.id), name: result.name };
    }
  } catch (error) {
    console.error('Failed to get language from Google Ads API', error);
  }

  const prompt = `You are a Google Ads API expert. I have the following text representing a language: "${lookupText}".
Please provide the EXACT Google Ads language criterion ID and standard name for this language.
If you cannot confidently find a match, return null or empty values.`;
  const schema = {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'The Google Ads language criterion ID (e.g., 1000 for English)' },
      name: { type: 'string', description: 'The standard name of the language (e.g., English)' }
    },
    required: ['id', 'name']
  };
  const geminiConfig = {
    model: (config?.explorationModelId as string) || 'gemini-3.1-pro-preview',
    location: (config?.location as string) || 'global',
    responseMimeType: 'application/json'
  };
  try {
    const result = await geminiRequest(geminiConfig, prompt, schema, false) as Record<string, unknown>;
    if (result && result.id) {
      return await getLanguageById(result.id as string);
    }
  } catch (e) {
    console.error('Failed to get language ID via Gemini', e);
  }
  return null;
}

export async function getLocationId(lookupText: string, config: Record<string, unknown>) {
  try {
    const customer = getAdsClient();
    const suggestionsResponse = await customer.geoTargetConstants.suggestGeoTargetConstants({
      locale: 'en',
      location_names: { names: [lookupText] }
    } as unknown as Parameters<typeof customer.geoTargetConstants.suggestGeoTargetConstants>[0]);
    
    const responseData = suggestionsResponse as unknown as Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    const suggestions = (responseData.geoTargetConstantSuggestions || responseData.geo_target_constant_suggestions || []) as any[];
    const bestMatch = suggestions.find(
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      (s: any) => {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
        const c = s.geoTargetConstant || s.geo_target_constant as any;
        return c?.status === 'ENABLED' || c?.status === 2;
      }
    );

    const geoTarget = bestMatch?.geoTargetConstant || bestMatch?.geo_target_constant;
    if (geoTarget) {
      return {
        id: String(geoTarget.id),
        name: geoTarget.name || geoTarget.canonicalName || geoTarget.canonical_name || '',
      };
    }
  } catch (error) {
    console.error('Failed to get location suggestions from Google Ads API', error);
  }

  const prompt = `You are a Google Ads API expert. I need to find the Google Ads location criterion ID for the following location query: "${lookupText}".
// eslint-disable-next-line @typescript-eslint/no-explicit-any
Search for this location. It could be a city, country, region, or a combination (like "Munich, Germany"). 
Please provide the EXACT Google Ads location criterion ID and standard name for the most relevant location match.
If you cannot confidently find a match, return null or empty values.`;
  const schema = {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'The Google Ads location criterion ID (e.g., 2840 for United States)' },
      name: { type: 'string', description: 'The standard name of the location (e.g., United States)' }
    },
    required: ['id', 'name']
  };
  const geminiConfig = {
    model: (config?.explorationModelId as string) || 'gemini-3.1-pro-preview',
    location: (config?.location as string) || 'global',
    responseMimeType: 'application/json'
  };
  try {
    const result = await geminiRequest(geminiConfig, prompt, schema, true) as Record<string, unknown>;
    if (result && result.id) {
      return await getLocationById(result.id as string);
    }
  } catch (e) {
    console.error('Failed to get location ID via Gemini', e);
  }
  return null;
}

export async function getLanguageById(id: string) {
  try {
    const customer = getAdsClient();
    const query = `
      SELECT language_constant.id, language_constant.name
      FROM language_constant
      WHERE language_constant.id = ${id}
    `;
    const response = await customer.query(query);
    const result = response?.[0]?.language_constant;
    if (result) {
      return { id: String(result.id), name: result.name };
    }
  } catch (e) {
    console.error('Failed to get language by ID', e);
  }
  return { id, name: `Language (${id})` };
}

export async function getLocationById(id: string) {
  try {
    const customer = getAdsClient();
    const query = `
      SELECT geo_target_constant.id, geo_target_constant.name, geo_target_constant.canonical_name
      FROM geo_target_constant
      WHERE geo_target_constant.id = ${id}
    `;
    const response = await customer.query(query);
    const result = response?.[0]?.geo_target_constant;
    if (result) {
      return { id: String(result.id), name: result.name || result.canonical_name };
    }
  } catch (e) {
    console.error('Failed to reverse lookup location', e);
  }
  return { id, name: `Location (${id})` };
}
export async function getScriptPropertiesConfiguration(localConfig?: Record<string, string>) {
  if (localConfig) {
    if (localConfig.ADS_ACCOUNT_ID) properties.ADS_ACCOUNT_ID = localConfig.ADS_ACCOUNT_ID;
    if (localConfig.DEVELOPER_TOKEN) properties.DEVELOPER_TOKEN = localConfig.DEVELOPER_TOKEN;
    if (localConfig.GEMINI_API_KEY) properties.GEMINI_API_KEY = localConfig.GEMINI_API_KEY;
  }
  
  const envAdsAccountId = getEnvVar('GOOGLE_ADS_CUSTOMER_ID', '');
  const envDevToken = getEnvVar('GOOGLE_ADS_DEVELOPER_TOKEN', '');
  const adsAccountId = properties.ADS_ACCOUNT_ID || envAdsAccountId;
  const devToken = properties.DEVELOPER_TOKEN || envDevToken;
  
  return { 
    ADS_ACCOUNT_ID: adsAccountId, 
    DEVELOPER_TOKEN: devToken,
    GEMINI_API_KEY: properties.GEMINI_API_KEY,
    checked: true,
    adsAccountId: adsAccountId,
    hasDeveloperToken: !!devToken,
    hasEnvAdsCredentials: !!envAdsAccountId && !!envDevToken
  };
}
export async function setScriptProperty(key: string, value: string) {
  properties[key] = value;
  
  const envAdsAccountId = getEnvVar('GOOGLE_ADS_CUSTOMER_ID', '');
  const envDevToken = getEnvVar('GOOGLE_ADS_DEVELOPER_TOKEN', '');
  const adsAccountId = properties.ADS_ACCOUNT_ID || envAdsAccountId;
  const devToken = properties.DEVELOPER_TOKEN || envDevToken;
  
  return { 
    ADS_ACCOUNT_ID: adsAccountId, 
    DEVELOPER_TOKEN: devToken,
    GEMINI_API_KEY: properties.GEMINI_API_KEY,
    checked: true,
    adsAccountId: adsAccountId,
    hasDeveloperToken: !!devToken,
    hasEnvAdsCredentials: !!envAdsAccountId && !!envDevToken
  };
}

export async function generateKeywordIdeas(seedKeywords: string | string[], country?: string, language?: string, limit?: number) {
  const keywordsArray = Array.isArray(seedKeywords) ? seedKeywords : seedKeywords.split(' ,').map(s => s.trim()).filter(Boolean);
  const result = await getKeywordIdeasFromSeed(keywordsArray, limit || DEFAULT_KEYWORD_LIMIT);
  
  // Format exactly how GigaApp.tsx expects
  return result.map(idea => ({
    text: idea.text,
    closeVariants: idea.closeVariants || [],
    keywordIdeaMetrics: {
      avgMonthlySearches: idea.avgMonthlySearches,
      competition: idea.competition,
      competitionIndex: idea.competitionIndex,
      lowTopOfPageBidMicros: idea.lowTopOfPageBidMicros,
      highTopOfPageBidMicros: idea.highTopOfPageBidMicros,
      averageCpcMicros: idea.averageCpcMicros,
      monthlySearchVolumes: idea.monthlySearchVolumes
    }
  }));
}

export async function generateTrendsKeywords(seedKeywords: string | string[], prompt: string, config: Record<string, unknown>) {
  const seedsStr = Array.isArray(seedKeywords) ? seedKeywords.join(' , ') : seedKeywords;
  const finalPrompt = `${prompt}\nKeywords:\n${seedsStr}`;
  const responseSchema = { type: 'array', items: { type: 'string' } };
  const geminiConfig = {
    model: (config?.explorationModelId as string) || 'gemini-3.1-pro-preview',
    location: (config?.location as string) || 'global',
    responseMimeType: 'application/json'
  };
  return geminiRequest(geminiConfig, finalPrompt, responseSchema, true) as Promise<string[]>;
}

export async function getHistoricalMetrics(keywords: string[]) {
  const result = await googleAdsGetHistoricalMetrics(keywords);
  return result.map(m => ({
    text: m.text,
    keywordMetrics: {
      ...m.metrics,
      monthlySearchVolumes: m.metrics.monthlySearchVolumes
    }
  }));
}

export async function getClusters(ideas: Record<string, number[]>, promptTemplate: string, config: Record<string, unknown>) {
  const keywords = Object.keys(ideas).map(k => k.toLowerCase()).join(', ');
  const finalPrompt = `${promptTemplate}\n${keywords}\nDo NOT include markdown formatting.`;
  const responseSchema = {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        topic: { type: 'string' },
        keywords: { type: 'array', items: { type: 'string' } }
      },
      required: ['topic', 'keywords']
    }
  };
  const geminiConfig = {
    model: (config?.explorationModelId as string) || 'gemini-3.1-pro-preview',
    location: (config?.location as string) || 'global',
    responseMimeType: 'application/json'
  };
  
  const result = await geminiRequest(geminiConfig, finalPrompt, responseSchema, false) as { topic: string, keywords: string[] }[];
  
  const lowerIdeas = Object.keys(ideas).reduce((acc, key) => {
    acc[key.toLowerCase()] = ideas[key];
    return acc;
  }, {} as Record<string, number[]>);

  return result.map(cluster => {
    cluster.keywords = cluster.keywords.filter(kw => kw.toLowerCase() in lowerIdeas);
    
    // Aggregating metrics for the cluster
    const clusterVols = cluster.keywords.map(kw => lowerIdeas[kw.toLowerCase()]);
    const numMonths = clusterVols.length > 0 ? clusterVols[0].length : 12;
    const aggregatedHistory = new Array(numMonths).fill(0);
    clusterVols.forEach(vols => {
      vols.forEach((vol, idx) => { aggregatedHistory[idx] += vol; });
    });
    
    const growthMetrics = calculateGrowthMetrics(aggregatedHistory);
    
    return {
      ...cluster,
      searchVolumeHistory: aggregatedHistory,
      searchVolume: aggregatedHistory.reduce((a, b) => a + b, 0) / aggregatedHistory.length,
      growthYoY: growthMetrics.yoy,
      growthMoM: growthMetrics.mom,
      growthLatestVsAvg: growthMetrics.latest_vs_avg,
      growthLatestVsMax: growthMetrics.latest_vs_max,
      growthThreeMonthsVsAvg: growthMetrics.three_months_vs_avg
    };
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getInsightsChatResponse(history: any[], config: Record<string, unknown>) {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transcript = history.map(msg => `${msg.role === 'user' ? 'User' : 'Model'}: ${msg.parts.map((p: any) => p.text).join('')}`).join('\n\n');
  const finalPrompt = `${INSIGHTS_CHAT_PROMPT}\n\nCHAT HISTORY:\n${transcript}\n\nModel response (JSON format):`;
  
  const responseSchema = {
    type: 'object',
    properties: {
      response: { type: 'string' },
      suggestions: { type: 'array', items: { type: 'string' } },
      image_prompts: { type: 'array', items: { type: 'string' } }
    },
    required: ['response', 'suggestions']
  };
  const geminiConfig = {
    model: (config?.insightsModelId as string) || 'gemini-3.1-pro-preview',
    location: (config?.location as string) || 'global',
    responseMimeType: 'application/json'
  };
  const result = await geminiRequest(geminiConfig, finalPrompt, responseSchema, config?.enableGoogleSearch as boolean) as Record<string, unknown>;

  if (result.image_prompts && Array.isArray(result.image_prompts) && result.image_prompts.length > 0) {
    try {
      const { generateImage } = await import('./image');
      const generatedImages = [];
      const imageModel = (config?.imageModelId as string) || 'gemini-2.5-flash-image';
      
      for (const prompt of result.image_prompts) {
        const formData = new FormData();
        formData.append('prompt', prompt);
        formData.append('location', (config?.location as string) || 'global');
        formData.append('model', imageModel);
        
        const imgResult = await generateImage(formData);
        if (imgResult.content) {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
            generatedImages.push(...imgResult.content.filter((c: any) => c.type === 'image').map((c: any) => c.value));
        }
      }
      result.images = generatedImages;
    } catch (e) {
      console.error('Failed to generate images:', e);
    }
  }

  return JSON.stringify(result);
}

export async function getInsights(
  ideas: Record<string, number[]>, 
  seedKeywords: string | string[], 
  growthMetric: string, 
  config: Record<string, unknown>, 
  language: string, 
  specificQuestion?: string
) {
  const relevantIdeas = calculateKeywordGrowth(ideas, growthMetric);
  const metricNames: Record<string, string> = {
    yoy: 'YoY',
    mom: 'MoM',
    latest_vs_avg: 'Last Month vs Average',
    latest_vs_max: 'Last Month vs Max',
    three_months_vs_avg: 'Last 3 Months vs Prev Avg',
  };
  const metricName = metricNames[growthMetric] || 'YoY';
  
  const prompt = getInsightsPrompt(relevantIdeas, (Array.isArray(seedKeywords) ? seedKeywords : seedKeywords.split(' , ')), metricName, language, specificQuestion);
  const responseSchema = {
    type: 'object',
    properties: {
      report: { type: 'string' },
      suggestions: { type: 'array', items: { type: 'string' } }
    },
    required: ['report', 'suggestions']
  };
  const geminiConfig = {
    model: (config?.insightsModelId as string) || 'gemini-3.1-pro-preview',
    location: (config?.location as string) || 'global',
    responseMimeType: 'application/json'
  };
  const result = await geminiRequest(geminiConfig, prompt, responseSchema, config?.enableGoogleSearch as boolean) as Record<string, unknown>;
  return JSON.stringify(result);
}

export async function getTopPerformingAdsAndKeywords(cid: string, topN: number, metric = 'clicks') {
  try {
    const customer = getAdsClient(cid);
    const query = `
      SELECT
        ad_group.id,
        ad_group_ad.ad.id,
        ad_group_ad.ad.responsive_search_ad.headlines,
        ad_group_ad.ad.responsive_search_ad.descriptions,
        metrics.${metric}
      FROM ad_group_ad
      WHERE campaign.advertising_channel_type = 'SEARCH'
        AND ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD'
        AND ad_group_ad.status = 'ENABLED'
        AND ad_group.status = 'ENABLED'
        AND campaign.status = 'ENABLED'
      ORDER BY metrics.${metric} DESC
      LIMIT ${topN}
    `;
    const response = await customer.query(query);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    return response.map((item: any) => ({
      adGroupId: item.ad_group.id,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      headlines: (item.ad_group_ad.ad.responsive_search_ad?.headlines || []).map((x: any) => x.text),
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      descriptions: (item.ad_group_ad.ad.responsive_search_ad?.descriptions || []).map((x: any) => x.text),
      keywords: [] // To keep it simple, we skip keyword mapping here unless necessary
    }));
  } catch(e) {
    console.error(e);
    return [];
  }
}

export async function getCampaigns(
  ideas: Record<string, number[]>,
  growthMetric: string,
  langName: string,
  brandName: string,
  adExamples: string,
  creationStyleGuide: string,
  config: Record<string, unknown>
) {
  const relevantIdeasList = calculateKeywordGrowth(ideas, growthMetric);
  const sortedIdeas = relevantIdeasList.sort((a, b) => b[1] - a[1]).slice(0, 100);
  const keywordsStr = sortedIdeas.map(row => `${row[0]} (${(row[1]*100).toFixed(0)}% ${growthMetric})`).join(', ');
  
  let prompt = `You are an expert Google Ads copywriter. Create a Google Ads Search campaign structure based on the following top keywords and their growth:
[${keywordsStr}]

Please create 2 to 3 distinct Campaigns. For each campaign, create 2 to 4 Ad Groups based on logical themes.
For each Ad Group, assign 3 to 10 relevant keywords from the list, and write 3 distinct text ads.
Each ad MUST have exactly 15 headlines (max 30 characters each) and exactly 4 descriptions (max 90 characters each). Make sure the ads are different from each other to cover different angles.
Do not produce placeholders (e.g. {KeyWord: Vintage Jeans}) and instead produce readable text.

Output the campaigns in ${langName}.`;

  if (brandName) {
    prompt += `\n\nThe brand name is "${brandName}". Make sure to use it appropriately in the ad copy.`;
  }
  
  if (creationStyleGuide) {
    prompt += `\n\nPlease adhere to the following style guide:\n${creationStyleGuide}`;
  }
  
  if (adExamples) {
    prompt += `\n\nHere are some examples of good historical ads to inspire your copy:\n${adExamples}`;
  }

  const responseSchema = {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        campaignName: { type: 'string' },
        adGroups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              adGroupName: { type: 'string' },
              keywords: { type: 'array', items: { type: 'string' } },
              ads: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    headlines: { type: 'array', items: { type: 'string' } },
                    descriptions: { type: 'array', items: { type: 'string' } }
                  },
                  required: ['headlines', 'descriptions']
                }
              }
            },
            required: ['adGroupName', 'keywords', 'ads']
          }
        }
      },
      required: ['campaignName', 'adGroups']
    }
  };

  const geminiConfig = {
    model: (config?.modelId as string) || 'gemini-3.1-pro-preview',
    location: (config?.location as string) || 'global',
    responseMimeType: 'application/json'
  };

  const result = await geminiRequest(geminiConfig, prompt, responseSchema, false);
  return result;
}

export async function createCampaignPrompt(cid: string) {
  const ads = await getTopPerformingAdsAndKeywords(cid, 5);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  return "  " + ads.map((ad: any) => "\n" + getPromptKeywordsTemplate(ad.keywords) + "\n" + JSON.stringify({ headlines: ad.headlines, descriptions: ad.descriptions }, null, 2) + "\n").join("");
}

export async function createAdSuggestion(prompt: string, userKeywords: string[], config: Record<string, unknown>) {
  const finalPrompt = `${prompt}\n${getPromptKeywordsTemplate(userKeywords)}`;
  const responseSchema = {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        headlines: { type: 'array', items: { type: 'string' } },
        descriptions: { type: 'array', items: { type: 'string' } }
      },
      required: ['headlines', 'descriptions']
    }
  };
  const geminiConfig = {
    model: (config?.modelId as string) || 'gemini-3.1-pro-preview',
    location: (config?.location as string) || 'global',
    responseMimeType: 'application/json'
  };
  const result = await geminiRequest(geminiConfig, finalPrompt, responseSchema, false) as unknown as Record<string, unknown>[];
  return JSON.stringify(result, null, 2);
}

export async function checkManagerAccount(id?: string) {
  try {
    const customer = getAdsClient(id);
    const query = `SELECT customer.manager, customer.id FROM customer LIMIT 1`;
    const res = await customer.query(query);
    if (res && res.length > 0 && res[0]?.customer?.manager) {
      const childQuery = `SELECT customer_client.client_customer, customer_client.descriptive_name FROM customer_client WHERE customer_client.manager = false AND customer_client.status = 'ENABLED'`;
      const childRes = await customer.query(childQuery);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      const children = childRes.map((item: any) => ({
        id: item.customer_client.client_customer.replace('customers/', ''),
        name: item.customer_client.descriptive_name,
      }));
      return { isManager: true, children };
    }
    return { isManager: false, children: [] };
  } catch (e: unknown) {
    return { isManager: false, children: [], error: (e as Error).message };
  }
}

export async function getAccountKeywordStats(id?: string) {
  try {
    const customer = getAdsClient(id);
    const query = `
      SELECT campaign.id, ad_group_criterion.criterion_id
      FROM ad_group_criterion
      WHERE campaign.advertising_channel_type = 'SEARCH'
        AND ad_group_criterion.type = 'KEYWORD'
        AND ad_group_criterion.status = 'ENABLED'
        AND campaign.status = 'ENABLED'
        LIMIT 1000
    `;
    const res = await customer.query(query);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uniqueCampaigns = new Set(res.map((item: any) => item.campaign.id));
    const keywordCount = res.length;
    return { count: uniqueCampaigns.size, keywordCount, hasData: keywordCount > 0 };
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }
}
