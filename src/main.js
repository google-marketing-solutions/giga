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

const MIN_SEARCH_VOLUME_THREASHOLD_FOR_LATEST_MONTH = 100;
const MIN_YEAR_OVER_YEAR_GROWTH = 0.1;

const onOpen = () => {
  SpreadsheetApp.getUi()
    .createMenu('💡 GIGA 💡')
    .addItem('Update Ideas', updateIdeas.name)
    .addItem('Update Clusters', updateClusters.name)
    .addItem('Update Insights', updateInsights.name)
    .addItem('Update Campaigns', updateCampaigns.name)
    .addToUi();
};

const getSheet = name => SpreadsheetApp.getActive().getSheetByName(name);
``;

const getConfigSheet = () => getSheet('config');
const getIdeaSheet = () => getSheet('ideas');
const getClusterSheet = () => getSheet('clusters');
const getInsightsSheet = () => getSheet('insights');
const getCamaignsSheet = () => getSheet('campaigns');

const MAX_SEED_KEYWORDS = 20;

const getSeedKeywords = () =>
  SpreadsheetApp.getActive()
    .getRangeByName('SEED_KEYWORDS')
    .getValue()
    .split(',')
    .map(keyword => keyword.trim());

// TODO remove MIN_SEARCH_VOLUME_THREASHOLD_FOR_LATEST_MONTH and let frontend handle this?
const convertIdeasToRows = ideas =>
  ideas
    .filter(
      res =>
        res.keywordIdeaMetrics?.monthlySearchVolumes?.at(-1).monthlySearches >
        MIN_SEARCH_VOLUME_THREASHOLD_FOR_LATEST_MONTH
    )
    .map(result => [
      result.text,
      `${result.keywordIdeaMetrics?.avgMonthlySearches || 0}`,
      ...getSearchVolumeRow(result),
    ]);

const getIdeas = (keywords, geoID, language, maxIdeas) => {
  const languageID = isNaN(new Number(language))
    ? getCriterionIDs([language])[0]
    : language;
  const ideas = generateKeywordIdeas(keywords, geoID, languageID, maxIdeas);
  return convertIdeasToRows(ideas);
};

const updateIdeas = () => {
  const geoID = SpreadsheetApp.getActive().getRangeByName('COUNTRY').getValue();
  const languageID = SpreadsheetApp.getActive()
    .getRangeByName('LANGUAGE')
    .getValue();
  const keywords = getSeedKeywords();
  const overflowKeywords = keywords.splice(MAX_SEED_KEYWORDS);
  if (overflowKeywords.length > 0) {
    alert(`Please enter a maximum of ${MAX_SEED_KEYWORDS} keywords only.
    Ignoring the overflow keywords: ${overflowKeywords.join(', ')} `);
  }
  const maxIdeas = 10000;
  const ideaRows = getIdeas(keywords, geoID, languageID, maxIdeas);
  writeRowsToSheet(getIdeaSheet(), ideaRows, 1);
};

const getYoYGroth = searchVolumes => {
  const latestIndex = -1;
  const previousYearIndex = latestIndex - 12;
  const latestVolume = searchVolumes.at(latestIndex);
  const previousYearVolume = searchVolumes.at(previousYearIndex);
  return latestVolume / previousYearVolume - 1;
};

const removeHTLMTicks = html => {
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

const getInsights = (ideas, seedKeywords) => {
  const relevantIdeas = Object.entries(ideas)
    .map(([idea, searchVolume]) => [idea, getYoYGroth(searchVolume)])
    .filter(([_, yoyGroth]) => yoyGroth > MIN_YEAR_OVER_YEAR_GROWTH);
  console.log('relevantIdeas: ', relevantIdeas);
  const insightsPrompt = getInsightsPrompt(relevantIdeas, seedKeywords);
  console.log(insightsPrompt.slice(insightsPrompt.length - 1000));
  const responseType = 'text/plain';
  const config = getGeminiConfig(responseType);
  return removeHTLMTicks(gemini(config)(insightsPrompt));
};

const updateInsights = () => {
  const ideas = getIdeasFromSheet();
  const keywords = getSeedKeywords();
  const insights = getInsights(ideas, keywords);
  getInsightsSheet().getRange('A1').setValue(insights);
  console.log(insights);
};

const getSearchVolumeRow = res => {
  const volumes = res.keywordIdeaMetrics.monthlySearchVolumes.map(
    m => m.monthlySearches
  );
  const latestIndex = -1;
  const previousMonthIndex = latestIndex - 1;
  const previousYearIndex = latestIndex - 12;

  const latestVolume = volumes.at(latestIndex);
  const previousMonthVolume = volumes.at(previousMonthIndex);
  const previousYearVolume = volumes.at(previousYearIndex);

  return [
    latestVolume / previousMonthVolume - 1,
    latestVolume / previousYearVolume - 1,
    ...volumes,
  ];
};

const getIdeasFromSheet = () =>
  Object.fromEntries(
    SpreadsheetApp.getActive()
      .getRange('IDEAS')
      .getValues()
      .filter(isNonEmptyRow)
      .map(row => [row[0], row.slice(4)])
  ); // at 4 search volume starts, bevore avg and yoy are calculated

/**
 * @return {GeminiConfig} config
 */
const getGeminiConfig = responseType => {
  const temperature = Number(
    SpreadsheetApp.getActive().getRangeByName('GEMINI_TEMPERATURE').getValue()
  );
  const topP = Number(
    SpreadsheetApp.getActive().getRangeByName('GEMINI_TOP_P').getValue()
  );
  return {
    modelID: getGeminiModelID(),
    projectID: getGCPProjectID(),
    location: 'us-central1',
    temperature, // Default for gemini-1.5-pro: 1.0, higher temperatures can lead to more diverse or creative results, range [0.0, 2.0]
    topP,
    responseType, // see https://cloud.google.com/vertex-ai/generative-ai/docs/reference/java/latest/com.google.cloud.vertexai.api.GenerationConfig
  };
};

const getClusters = (ideas, promptTemplate) => {
  ideas = objectToLowerCaseKeys(ideas);
  const keywords = Object.keys(ideas).join(', ');
  console.log(
    `Starting to cluster ${Object.keys(ideas).length} ideas (${keywords.length} characters)`
  );
  const prompt = `${promptTemplate}\n${keywords}\n${PROMPT_DATA_FORMAT_SUFFIX}`;
  const config = getGeminiConfig('application/json');
  const clusters = gemini(config)(prompt).map(cluster => {
    // TODO lookup all keywords again in keyword planner since gemini could have combined keywords into more generic broad match keywords that did not show up in ideas
    // remove keywords not found in ideas (hallucinations)
    const [keywwordIdeas, hallucinations] = partition(
      cluster.keywords,
      keyword => keyword.toLowerCase() in ideas
    );
    cluster.keywords = keywwordIdeas;

    // check hallucinations
    if (hallucinations.length > 0) {
      console.log(
        `WARNING: Gemini Clustering produced the following keywords for cluster ${cluster.topic} which could not be found in ideas: ${hallucinations.join(', ')}`
      );
    }

    // add search volume stats
    cluster.searchVolumes = cluster.keywords.map(k => ideas[k]);
    cluster.latestSearchVolumes = cluster.searchVolumes.map(v => v.at(-1));

    // add sum of all keywords over time
    cluster.searchVolumeHistory = columnWiseSum(cluster.searchVolumes);

    // get latest search volume sum of cluster
    cluster.searchVolume = sum(cluster.latestSearchVolumes);

    // get yearOverYearGrowth
    const latestIndex = -1;
    const previousYearVolumes = cluster.searchVolumes.map(v =>
      v.at(latestIndex - 12)
    );
    cluster.yearOverYearGrowth =
      cluster.searchVolume / sum(previousYearVolumes) - 1;

    return cluster;
  });
  return clusters;
};

const PROMPT_DATA_FORMAT_SUFFIX = `
  Output as a list of topics where each topic has a name and up to 10 keywords as JSON with this format:
    [
      {
        "topic": "A decriptive name of topic 1",
        "keywords": ["a1", "b1", "c1"]
      },
      {
        "topic": "A decriptive name of topic 2",
        "keywords": ["a2", "b2", "c2"]
      }
    ]
`;

const updateClusters = () => {
  const ideas = getIdeasFromSheet();
  const promptTemplate = SpreadsheetApp.getActive()
    .getRangeByName('PROMPT_TEMPLATE')
    .getValue();
  const clusters = getClusters(ideas, promptTemplate);
  const clusterRows = clusters.map(cluster => [
    cluster.topic,
    cluster.keywords.join(', '),
    cluster.searchVolumes,
  ]);
  writeRowsToSheet(getClusterSheet(), clusterRows, 1);
};

const getCampaigns = (insights, language) => {
  const prompt = ` I am a SEA manager and I want to crate new Google Ads search campaigns based on the following input.
  For each cluster in the **Cluster Insights & Marketing Takeaways:** section, generate a ready-to-use text ad campaign.
  Output as HTML with standard HTML elements like <h1> and <ul> for captions or lists

  Create the Campaings in ${language}.
  Please style the Ad examples so that they look like text ads shown on google.com

  ${NO_BRANDS_PRE_PROMPT}

  Insights:

  ${insights}

  `;
  return removeHTLMTicks(gemini(getGeminiConfig('text/plain'))(prompt));
};

const updateCampaigns = () => {
  const insights = getInsightsSheet().getRange('A1').getValue();
  const campaings = getCampaigns(insights);
  getCamaignsSheet().getRange('A1').setValue(campaings);
};

function doGet() {
  return HtmlService.createHtmlOutputFromFile('webApp');
}
