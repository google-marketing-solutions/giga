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

export const getScriptProperties = key =>
  PropertiesService.getScriptProperties().getProperty(key);

export const setScriptProperties = (key, value) =>
  PropertiesService.getScriptProperties().setProperty(key, value);

export const trying = func => {
  try {
    return func();
  } catch (e) {
    return undefined;
  }
};

export const columnWiseSum = matrix => {
  const numRows = matrix.length;
  const numCols = matrix[0].length;
  const result = new Array(numCols).fill(0);
  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
      result[col] += matrix[row][col];
    }
  }
  return result;
};

export const chunk = (arr, len) => {
  const chunks = [];
  const n = arr.length;
  let i = 0;
  while (i < n) {
    chunks.push(arr.slice(i, (i += len)));
  }
  return chunks;
};

export const fetchJson = (url, params) => {
  const text = UrlFetchApp.fetch(url, params).getContentText();
  let res = undefined;
  try {
    res = JSON.parse(text);
  } catch (e) {
    console.log(`Response is not valid JSON:\n${text}`);
  }
  if (res?.error) {
    const msg = res.error.message || JSON.stringify(res?.error, null, 2);
    console.log(JSON.stringify(res.error, null, 2));
    throw new Error(msg);
  }
  return res;
};

export const sum = array => array.reduce((sum, x) => sum + x, 0);

export const zip = (a, b) => a.map((item, index) => [item, b[index]]);

export const deduplicate = array => [...new Set(array)];

export const groupBy = (items, getKey, transform) => {
  return items.reduce((mapping, item) => {
    const key = getKey(item);
    const newItem = transform ? transform(item) : item;
    (mapping[key] = mapping[key] || []).push(newItem);
    return mapping;
  }, {});
};

export const keepKeys = (obj, keysToKeep) =>
  Object.fromEntries(
    Object.entries(obj).filter(([key]) => keysToKeep.includes(key))
  );

export const getDateWithDeltaDays = days => {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return new Date(Date.now() + days * MS_PER_DAY);
};

export const partition = (array, condition) =>
  array.reduce(
    (partitions, item) => {
      partitions[condition(item) ? 0 : 1].push(item);
      return partitions;
    },
    [[], []]
  );

export const objectToLowerCaseKeys = obj =>
  Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key.toLowerCase(), value])
  );

export const getGcpProjectDetails = () => {
  const token = ScriptApp.getOAuthToken();
  const tokenInfoUrl = `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`;
  const tokenResponse = UrlFetchApp.fetch(tokenInfoUrl);
  const tokenData = JSON.parse(tokenResponse.getContentText());
  const clientId = tokenData.issued_to;
  if (!clientId) throw new Error('Could not retrieve Client ID.');
  const projectNumber = clientId.split('-')[0];
  const crmUrl = `https://cloudresourcemanager.googleapis.com/v3/projects/${projectNumber}`;

  const options = {
    method: 'get' as const,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    muteHttpExceptions: true,
  };

  const crmResponse = UrlFetchApp.fetch(crmUrl, options);
  const crmData = JSON.parse(crmResponse.getContentText());

  if (crmResponse.getResponseCode() !== 200) {
    throw new Error(`API Error: ${crmData.error.message}`);
  }

  return {
    projectNumber: projectNumber,
    projectId: crmData.projectId,
  };
};
