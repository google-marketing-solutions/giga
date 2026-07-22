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

import { generateKeywordIdeas, getHistoricalMetrics } from './ideas';
import { synthesizeTrends } from './main';
import { generateTrendsKeywords } from './trends';
import { getScriptProperties, setScriptProperties } from './util';
import { GeminiConfig } from './vertex';
import { checkKeywordsExistence } from './google_ads_keyword_check';

const ACTIVE_ALERTS_KEY = 'ACTIVE_ALERTS';
const SINGLETON_TRIGGER_KEY = 'SINGLETON_TRIGGER_ID';

const DEFAULT_TRENDS_PROMPT = `Provide a list of around 100 Google Ads keywords that represent trends regarding the topics/keywords mentioned below. Rules:
- Aim for simple wording (best case single words) that can be used as keywords in Google Ads.
- Focus on keywords that are currently trending or have high demand.
- Prioritize keywords with significant recent growth in search volume.
- Consider seasonal trends and emerging topics relevant to the provided keywords.
- Ensure the keywords are relevant to the context of the original keywords.
- Provide a diverse set of keywords covering various aspects of the original keywords.
- Avoid overly specific or niche keywords; focus on broader terms that capture wider interest.
- Do NOT add the Google Ads keyword itself to the trends if not necessary.
- Do NOT add punctuation or unnecessary hyphens to keep the keyword as simple and generic as possible`;

export interface AlertConfig {
  id?: string;
  seed: string;
  emails: string;
  frequency: string; // 'daily', 'weekly', 'bi-weekly', 'monthly'
  language?: string;
  location?: string;
  continent?: string;
  languageName?: string;
  locationName?: string;
  maxIdeas?: number;
  growthMetric?: string;
  lastRun?: number; // timestamp
  geminiConfig?: Partial<GeminiConfig>;
}

/**
 * Retrieves the list of active alerts from Script Properties.
 */
export const getActiveAlerts = (): AlertConfig[] => {
  const alertsJson = getScriptProperties(ACTIVE_ALERTS_KEY);
  if (!alertsJson) return [];
  try {
    return JSON.parse(alertsJson);
  } catch (e) {
    console.error('Failed to parse active alerts:', e);
    return [];
  }
};

/**
 * Saves the list of active alerts to Script Properties.
 */
const saveActiveAlerts = (alerts: AlertConfig[]) => {
  setScriptProperties(ACTIVE_ALERTS_KEY, JSON.stringify(alerts));
};

/**
 * Creates or ensures the singleton daily trigger exists.
 */
const setupSingletonTrigger = () => {
  const triggerId = getScriptProperties(SINGLETON_TRIGGER_KEY);
  if (triggerId) {
    const triggers = ScriptApp.getProjectTriggers();
    const exists = triggers.some(t => t.getUniqueId() === triggerId);
    if (exists) return triggerId;
  }

  // Create daily trigger
  const trigger = ScriptApp.newTrigger('runAutomatedReports')
    .timeBased()
    .everyDays(1)
    .create();

  if (trigger) {
    setScriptProperties(SINGLETON_TRIGGER_KEY, trigger.getUniqueId());
    return trigger.getUniqueId();
  }
  return '';
};

/**
 * Creates a new email alert.
 */
export const createEmailAlert = (config: AlertConfig) => {
  const alerts = getActiveAlerts();

  // Assign a unique ID if not present
  if (!config.id) {
    config.id = `alert_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }
  config.lastRun = 0; // Never run yet

  alerts.push(config);
  saveActiveAlerts(alerts);

  // Ensure trigger exists
  setupSingletonTrigger();

  return { success: true, id: config.id };
};

/**
 * Deletes an email alert.
 */
export const deleteEmailAlert = (id: string | number) => {
  // ID can be index or string ID. Let's support both for now or just string ID.
  // Better to use string ID for robustness.
  const alerts = getActiveAlerts();
  const index =
    typeof id === 'number' ? id : alerts.findIndex(a => a.id === id);
  if (index !== -1 && index < alerts.length) {
    alerts.splice(index, 1);
    saveActiveAlerts(alerts);

    // Optional: If no alerts left, delete the singleton trigger?
    // Let's keep it for now.
    return { success: true };
  }
  return { success: false, error: 'Alert not found' };
};

/**
 * Executes the automated reporting process for all active alerts.
 * This is the function called by the daily trigger.
 */
export const runAutomatedReports = () => {
  const alerts = getActiveAlerts();
  const now = Date.now();
  let updated = false;

  for (const alert of alerts) {
    if (shouldRunAlert(alert, now)) {
      try {
        runSingleAlert(alert);
        alert.lastRun = now;
        updated = true;
      } catch (e) {
        console.error(`Failed to run alert ${alert.id}:`, e);
      }
    } else {
      console.log(`Skipping alert ${alert.id} (not due yet)`);
    }
  }

  if (updated) {
    saveActiveAlerts(alerts);
  }
};

/**
 * Force runs all active alerts immediately, bypassing frequency checks.
 */
export const forceRunAutomatedReports = () => {
  const alerts = getActiveAlerts();
  console.log(`Force running ${alerts.length} alerts...`);
  for (const alert of alerts) {
    try {
      runSingleAlert(alert);
    } catch (e) {
      console.error(`Failed to run alert ${alert.id}:`, e);
    }
  }
};

/**
 * Checks if an alert should run based on its frequency and last run time.
 */
const shouldRunAlert = (alert: AlertConfig, now: number): boolean => {
  if (!alert.lastRun) return true; // Never run, run now

  const diff = now - alert.lastRun;
  const dayMs = 24 * 60 * 60 * 1000;
  const bufferMs = 60 * 60 * 1000; // 1 hour buffer for trigger jitter

  switch (alert.frequency) {
    case 'daily':
      return diff >= dayMs - bufferMs;
    case 'weekly':
      return diff >= 7 * dayMs - bufferMs;
    case 'bi-weekly':
      return diff >= 14 * dayMs - bufferMs;
    case 'monthly':
      return diff >= 30 * dayMs - bufferMs; // Approx
    default:
      return diff >= 7 * dayMs - bufferMs; // Default to weekly
  }
};

/**
 * Executes the reporting logic for a single alert.
 */
const runSingleAlert = (alert: AlertConfig) => {
  const seeds = alert.seed
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const ideas = generateKeywordIdeas(
    seeds,
    alert.location || undefined, // Geo ID
    alert.language || undefined, // Language ID
    alert.maxIdeas || 500
  );

  // Generate Gemini keywords as well to match app behavior
  let combinedResults = [...ideas];
  try {
    console.log(`Generating Gemini keywords for alert ${alert.id}...`);
    const geminiKeywords = generateTrendsKeywords(
      seeds,
      DEFAULT_TRENDS_PROMPT,
      alert.geminiConfig || {}
    );

    if (geminiKeywords && geminiKeywords.length > 0) {
      console.log(
        `Fetching metrics for ${geminiKeywords.length} Gemini keywords...`
      );
      const geminiMetrics = getHistoricalMetrics(
        geminiKeywords,
        alert.location || undefined
      );

      const mappedGemini = geminiMetrics
        .filter(m => m && m.text && (m as any).keywordMetrics)
        .map(m => ({
          text: m.text,
          keywordIdeaMetrics: (m as any).keywordMetrics,
        }));

      combinedResults = combinedResults.concat(mappedGemini);
    }
  } catch (e) {
    console.error(
      `Failed to generate Gemini keywords for alert ${alert.id}:`,
      e
    );
    // Fallback to just planner ideas
  }

  const processedIdeas = processIdeaResults(combinedResults);

  // Filter and Sort
  // We want top 10 based on 3 Months vs Avg growth.
  const sortedIdeas = processedIdeas
    .filter(idea => idea.growthThreeMonthsVsAvg !== undefined) // Ensure we have the metric
    .sort(
      (a, b) =>
        (b.growthThreeMonthsVsAvg || 0) - (a.growthThreeMonthsVsAvg || 0)
    )
    .slice(0, 10);

  if (sortedIdeas.length === 0) {
    console.log(`No valid ideas found for alert ${alert.id}`);
    return;
  }

  // Check account status if configured
  const targetAccountId = getScriptProperties('ADS_ACCOUNT_ID')
    ?.toString()
    .replace(/-/g, '')
    .trim();
  if (targetAccountId && sortedIdeas.length > 0) {
    try {
      console.log(
        `Checking account status for ${sortedIdeas.length} keywords in email report...`
      );
      const keywordTexts = sortedIdeas.map(idea => idea.text);
      const existenceMap = checkKeywordsExistence(keywordTexts);
      sortedIdeas.forEach(idea => {
        idea.accountStatus = existenceMap[idea.text]
          ? 'Exists'
          : 'Not in Account';
      });
    } catch (e) {
      console.error(
        `Failed to check keyword existence for alert ${alert.id}:`,
        e
      );
      sortedIdeas.forEach(idea => {
        idea.accountStatus = 'Error';
      });
    }
  }

  // Format Email
  const top10Texts = sortedIdeas.map(idea => idea.text);
  const trends = synthesizeTrends(
    top10Texts,
    alert.geminiConfig || {
      modelId: 'gemini-3.5-flash',
      location: 'global',
    },
    alert.languageName,
    alert.continent,
    alert.locationName
  );

  const emailBody = formatTrendsEmailReport(
    seeds,
    trends,
    sortedIdeas,
    alert.languageName,
    alert.continent,
    alert.locationName
  );

  // Send Email
  MailApp.sendEmail({
    to: alert.emails,
    subject: 'Giga Trends Summary',
    htmlBody: emailBody,
  });

  console.log(`Sent email report for alert ${alert.id} to ${alert.emails}`);
};

/**
 * Processes raw keyword ideas results into a more usable format.
 * (Extracted from tabExplore.html)
 */
const processIdeaResults = (ideas: any[]) => {
  const validIdeas = ideas.filter(
    res => res && res.keywordIdeaMetrics !== undefined
  );

  const processed = validIdeas
    .flatMap(idea =>
      (idea.closeVariants || []).concat(idea.text).map(k => [k, idea])
    )
    .map(([k, res]) => {
      const metrics = res.keywordIdeaMetrics;
      const volumes = (metrics.monthlySearchVolumes || []).map(item =>
        Number(item.monthlySearches)
      );

      const len = volumes.length;
      const latest = len > 0 ? volumes[len - 1] : 0;
      const prevMonth = len > 1 ? volumes[len - 2] : 0;
      const prevYear = len > 12 ? volumes[len - 13] : 0;

      const growthYoY = prevYear !== 0 ? (latest - prevYear) / prevYear : 0;
      const growthMoM = prevMonth !== 0 ? (latest - prevMonth) / prevMonth : 0;

      const totalSum = volumes.reduce((a, b) => a + b, 0);
      const avg = len > 0 ? totalSum / len : 0;
      const growthLatestVsAvg = avg !== 0 ? (latest - avg) / avg : 0;

      const max = Math.max(...volumes);
      const growthLatestVsMax = max !== 0 ? (latest - max) / max : 0;

      const last3Months = volumes.slice(-3);
      const prevMonths = volumes.slice(-24, -3);
      const avgLast3 =
        last3Months.length > 0
          ? last3Months.reduce((a, b) => a + b, 0) / last3Months.length
          : 0;
      const avgPrev =
        prevMonths.length > 0
          ? prevMonths.reduce((a, b) => a + b, 0) / prevMonths.length
          : 0;
      const growthThreeMonthsVsAvg =
        avgPrev !== 0 ? (avgLast3 - avgPrev) / avgPrev : 0;

      return {
        text: k,
        latestSearchVolume: latest,
        growthYoY,
        growthMoM,
        growthLatestVsAvg,
        growthLatestVsMax,
        growthThreeMonthsVsAvg,
        competition: metrics.competition,
        competition_index: metrics.competitionIndex,
        low_top_of_page_bid_micros: metrics.lowTopOfPageBidMicros,
        high_top_of_page_bid_micros: metrics.highTopOfPageBidMicros,
        average_cpc_micros: metrics.averageCpcMicros,
      };
    });

  // Deduplicate
  const uniqueIdeas = [];
  const seen = new Set();
  for (const idea of processed) {
    if (!seen.has(idea.text.toLowerCase())) {
      seen.add(idea.text.toLowerCase());
      uniqueIdeas.push(idea);
    }
  }
  return uniqueIdeas;
};

/**
 * Formats the email report with macro trends as HTML.
 */
const formatTrendsEmailReport = (
  seeds: string[],
  trends: any[],
  ideas: any[],
  language?: string,
  continent?: string,
  location?: string
) => {
  let html = `
    <html>
    <head>
        <style>
            body { font-family: sans-serif; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .metric { text-align: right; }
        </style>
    </head>
    <body>
        <h1>GIGA Automated Macro Trends Report</h1>
        <p><strong>Keywords (Seeds):</strong> ${seeds.join(', ')}</p>
        <p><strong>Language:</strong> ${language || 'Not specified'}</p>
        <p><strong>Continent:</strong> ${continent || 'Not specified'}</p>
        <p><strong>Location:</strong> ${location || 'Not specified'}</p>
        <p>Here are the synthesized macro trends based on the top growing keywords:</p>
        <table>
            <tr>
                <th>Trending Keyword</th>
                <th>Explanation</th>
                <th>Industry Trend</th>
                <th>Top Competitors</th>
            </tr>
    `;

  for (const trend of trends) {
    html += `
            <tr>
                <td>${trend.trending_keyword || ''}</td>
                <td>${trend.explanation || ''}</td>
                <td>${trend.industry_trend || ''}</td>
                <td>${(trend.competitors || []).join(', ')}</td>
            </tr>
        `;
  }

  html += `
        </table>

        <h2>Top 10 Trending Keywords Metrics</h2>
        <table>
            <tr>
                <th>Keyword</th>
                ${ideas.length > 0 && ideas[0].accountStatus !== undefined ? '<th>Account Status</th>' : ''}
                <th class="metric">Search Volume</th>
                <th class="metric">YoY Growth</th>
                <th class="metric">MoM Growth</th>
                <th class="metric">Latest vs Avg</th>
                <th class="metric">Latest vs Max</th>
                <th class="metric">3 Months vs Avg</th>
                <th>Competition</th>
                <th class="metric">Low Bid</th>
                <th class="metric">High Bid</th>
                <th class="metric">Avg CPC</th>
            </tr>
    `;

  for (const idea of ideas) {
    html += `
            <tr>
                <td>${idea.text}</td>
                ${
                  idea.accountStatus !== undefined
                    ? `
                  <td>
                    <span style="color: ${idea.accountStatus === 'Exists' ? '#16a34a' : '#dc2626'}; font-weight: bold;">
                      ${idea.accountStatus}
                    </span>
                  </td>
                `
                    : ''
                }
                <td class="metric">${idea.latestSearchVolume ? idea.latestSearchVolume.toLocaleString() : '0'}</td>
                <td class="metric">${idea.growthYoY ? (idea.growthYoY * 100).toFixed(1) + '%' : '0%'}</td>
                <td class="metric">${idea.growthMoM ? (idea.growthMoM * 100).toFixed(1) + '%' : '0%'}</td>
                <td class="metric">${idea.growthLatestVsAvg ? (idea.growthLatestVsAvg * 100).toFixed(1) + '%' : '0%'}</td>
                <td class="metric">${idea.growthLatestVsMax ? (idea.growthLatestVsMax * 100).toFixed(1) + '%' : '0%'}</td>
                <td class="metric">${idea.growthThreeMonthsVsAvg ? (idea.growthThreeMonthsVsAvg * 100).toFixed(1) + '%' : '0%'}</td>
                <td>${idea.competition || 'UNKNOWN'}</td>
                <td class="metric">${idea.low_top_of_page_bid_micros ? (idea.low_top_of_page_bid_micros / 1000000).toFixed(2) : '-'}</td>
                <td class="metric">${idea.high_top_of_page_bid_micros ? (idea.high_top_of_page_bid_micros / 1000000).toFixed(2) : '-'}</td>
                <td class="metric">${idea.average_cpc_micros ? (idea.average_cpc_micros / 1000000).toFixed(2) : '-'}</td>
            </tr>
        `;
  }

  html += `
        </table>
    </body>
    </html>
    `;
  return html;
};

/**
 * Test function to verify email alerts with trends.
 * Run this function manually in the Apps Script editor.
 */
export const testTrendsAlert = () => {
  const testConfig: AlertConfig = {
    seed: 'pet food, dog toys',
    emails: Session.getEffectiveUser().getEmail(),
    frequency: 'daily',
    language: '1000', // English
    location: '2840', // US
    continent: 'North America',
    languageName: 'English',
    locationName: 'United States',
    maxIdeas: 10,
    geminiConfig: {
      modelId: 'gemini-3.5-flash',
      location: 'global',
    },
  };

  console.log('Running test alert...');
  runSingleAlert(testConfig);
  console.log('Test alert completed. Check your email.');
};
