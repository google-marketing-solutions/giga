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

const isNonEmptyRow = row => row.join('').length > 0;

const getNonEmptyRows = sheet =>
  sheet.getDataRange().getValues().filter(isNonEmptyRow);

const truncateRows = (sheet, headerRows) => {
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();

  if (lastRow > headerRows) {
    sheet
      .getRange(headerRows + 1, 1, lastRow - headerRows, lastColumn)
      .clearContent();
  }
};
const appendRows = (sheet, data, startRow = 1) => {
  var numRows = data.length;
  var numColumns = data[0].length;
  var range = sheet.getRange(startRow, 1, numRows, numColumns);
  range.setValues(data);
};

const writeRowsToSheet = (sheet, data, headerRows) => {
  truncateRows(sheet, headerRows);
  appendRows(sheet, data, 1 + headerRows);
};

const getScriptProperties = key =>
  PropertiesService.getScriptProperties().getProperty(key);

const setScriptProperties = (key, value) =>
  PropertiesService.getScriptProperties().setProperty(key, value);

function* generateCartesianProduct(a, b) {
  for (const rowA of a) {
    for (const rowB of b) {
      yield [...rowA, ...rowB];
    }
  }
}

const trying = func => {
  try {
    return func();
  } catch (e) {
    return undefined;
  }
};

const columnWiseSum = matrix => {
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

const alert = prompt => {
  console.log(prompt);
  trying(() => SpreadsheetApp.getUi())?.alert(prompt);
};

const chunk = (arr, len) => {
  const chunks = [];
  const n = arr.length;
  let i = 0;
  while (i < n) {
    chunks.push(arr.slice(i, (i += len)));
  }
  return chunks;
};

const getConfigVariable = id =>
  SpreadsheetApp.getActiveSpreadsheet()
    .getRangeByName(`config!${id}`)
    .getValue();

const fetchJson = (url, params) => {
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

const sum = array => array.reduce((sum, x) => sum + x, 0);

const zip = (a, b) => a.map((item, index) => [item, b[index]]);

const deduplicate = array => [...new Set(array)];

const groupBy = (items, getKey, transform) => {
  return items.reduce((mapping, item) => {
    const key = getKey(item);
    const newItem = transform ? transform(item) : item;
    (mapping[key] = mapping[key] || []).push(newItem);
    return mapping;
  }, {});
};

const keepKeys = (obj, keysToKeep) =>
  Object.fromEntries(
    Object.entries(obj).filter(([key]) => keysToKeep.includes(key))
  );

const getDateWithDeltaDays = days => {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return new Date(Date.now() + days * MS_PER_DAY);
};
