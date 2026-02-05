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

/**
 * Retrieves a script property value.
 *
 * @param key - The key of the script property to retrieve.
 * @returns The value of the script property.
 */
export const getScriptProperties = key =>
  PropertiesService.getScriptProperties().getProperty(key);

/**
 * Sets a script property value.
 *
 * @param key - The key of the script property to set.
 * @param value - The value to set for the script property.
 */
export const setScriptProperties = (key, value) =>
  PropertiesService.getScriptProperties().setProperty(key, value);

/**
 * Tries to execute a function and returns undefined if it fails.
 *
 * @param func - The function to execute.
 * @returns The result of the function execution, or undefined if it fails.
 */
export const trying = func => {
  try {
    return func();
  } catch (e) {
    return undefined;
  }
};

/**
 * Calculates the column-wise sum of a matrix.
 *
 * @param matrix - The matrix to calculate the column-wise sum for.
 * @returns An array containing the column-wise sum of the matrix.
 */
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

/**
 * Splits an array into chunks of a specified length.
 *
 * @param arr - The array to split into chunks.
 * @param len - The length of each chunk.
 * @returns An array of chunks, where each chunk is an array of elements from the original array.
 */
export const chunk = (arr, len) => {
  const chunks = [];
  const n = arr.length;
  let i = 0;
  while (i < n) {
    chunks.push(arr.slice(i, (i += len)));
  }
  return chunks;
};

/**
 * Fetches JSON data from a URL.
 *
 * @param url - The URL to fetch JSON data from.
 * @param params - The parameters to include in the request.
 * @returns The parsed JSON data, or undefined if the response is not valid JSON.
 */
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

/**
 * Calculates the sum of an array of numbers.
 *
 * @param array - The array of numbers to calculate the sum for.
 * @returns The sum of the array of numbers.
 */
export const sum = array => array.reduce((sum, x) => sum + x, 0);

/**
 * Zips two arrays together into an array of pairs.
 *
 * @param a - The first array to zip.
 * @param b - The second array to zip.
 * @returns An array of pairs, where each pair is an array containing one element from each of the input arrays.
 */
export const zip = (a, b) => a.map((item, index) => [item, b[index]]);

/**
 * Deduplicates an array by removing duplicate elements.
 *
 * @param array - The array to deduplicate.
 * @returns A new array containing only unique elements from the input array.
 */
export const deduplicate = array => [...new Set(array)];

/**
 * Groups items in an array based on a key and a transformation function.
 *
 * @param items - The array of items to group.
 * @param getKey - A function that returns the key for each item.
 * @param transform - An optional function that transforms each item before grouping.
 * @returns An object where each key is a unique key from the input array, and the value is an array of transformed items that have that key.
 */
export const groupBy = (items, getKey, transform) => {
  return items.reduce((mapping, item) => {
    const key = getKey(item);
    const newItem = transform ? transform(item) : item;
    (mapping[key] = mapping[key] || []).push(newItem);
    return mapping;
  }, {});
};

/**
 * Keeps only the specified keys in an object.
 *
 * @param obj - The object to keep keys from.
 * @param keysToKeep - An array of keys to keep in the object.
 * @returns A new object containing only the specified keys from the input object.
 */
export const keepKeys = (obj, keysToKeep) =>
  Object.fromEntries(
    Object.entries(obj).filter(([key]) => keysToKeep.includes(key))
  );

/**
 * Gets a date with a specified number of days added to the current date.
 *
 * @param days - The number of days to add to the current date.
 * @returns A new date object with the specified number of days added to the current date.
 */
export const getDateWithDeltaDays = days => {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return new Date(Date.now() + days * MS_PER_DAY);
};

/**
 * Partitions an array into two arrays based on a condition.
 *
 * @param array - The array to partition.
 * @param condition - A function that returns true or false for each element in the array.
 * @returns An array of two arrays, where the first array contains elements for which the condition returns true, and the second array contains elements for which the condition returns false.
 */
export const partition = (array, condition) =>
  array.reduce(
    (partitions, item) => {
      partitions[condition(item) ? 0 : 1].push(item);
      return partitions;
    },
    [[], []]
  );

/**
 * Converts all keys in an object to lowercase.
 *
 * @param obj - The object to convert.
 * @returns A new object with all keys converted to lowercase.
 */
export const objectToLowerCaseKeys = obj =>
  Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key.toLowerCase(), value])
  );

/**
 * Retrieves details about the current GCP project.
 *
 * @returns An object containing details about the current GCP project.
 */
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

/**
 * Exports data to a Google Sheet.
 *
 * @param spreadsheetUrl - The URL of the Google Sheet to export to.
 * @param sheetName - The name of the sheet to export to.
 * @param header - The header row to export.
 * @param rows - The rows of data to export.
 * @param columnFormats - An optional array of column formats to apply to the exported data.
 */
export const exportToSheet = (
  spreadsheetUrl,
  sheetName,
  header,
  rows,
  columnFormats = []
) => {
  try {
    const spreadsheet = SpreadsheetApp.openByUrl(spreadsheetUrl);
    let sheet = spreadsheet.getSheetByName(sheetName);

    if (sheet) {
      sheet.clear();
    } else {
      sheet = spreadsheet.insertSheet(sheetName);
    }

    const defaultSheet = spreadsheet.getSheetByName('Sheet1');
    if (
      defaultSheet &&
      defaultSheet.getSheetId() !== sheet.getSheetId() &&
      spreadsheet.getSheets().length > 1
    ) {
      spreadsheet.deleteSheet(defaultSheet);
    }

    let finalRows = rows;
    let finalHeader = header;

    if (columnFormats && columnFormats.length > 0) {
      // Apply transformations
      finalRows = rows.map(row =>
        row.map((cell, colIndex) => {
          const fmt = columnFormats.find(f => f.colIndex === colIndex);
          if (fmt && fmt.scale !== undefined) {
            const val = Number(cell);
            if (!isNaN(val)) {
              return val * fmt.scale;
            }
          }
          return cell;
        })
      );

      if (header) {
        finalHeader = header.map((h, colIndex) => {
          const fmt = columnFormats.find(f => f.colIndex === colIndex);
          if (fmt && fmt.headerRename) {
            return fmt.headerRename;
          }
          return h;
        });
      }
    }

    const data = [];
    if (finalHeader && finalHeader.length > 0) {
      data.push(finalHeader);
    }
    if (finalRows && finalRows.length > 0) {
      finalRows.forEach(r => data.push(r));
    }

    if (data.length > 0) {
      const range = sheet.getRange(1, 1, data.length, data[0].length);
      range.setValues(data);

      range.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY);
      if (finalHeader && finalHeader.length > 0) {
        sheet.getRange(1, 1, 1, data[0].length).setFontWeight('bold');
      }

      // Apply number formats
      if (columnFormats && columnFormats.length > 0) {
        const numRows = data.length - (finalHeader ? 1 : 0);
        if (numRows > 0) {
          const startRow = finalHeader ? 2 : 1;
          columnFormats.forEach(fmt => {
            if (fmt.numberFormat) {
              // colIndex is 0-based, getRange is 1-based
              const col = fmt.colIndex + 1;
              if (col <= data[0].length) {
                sheet
                  .getRange(startRow, col, numRows, 1)
                  .setNumberFormat(fmt.numberFormat);
              }
            }
          });
        }
      }

      sheet.autoResizeColumns(1, data[0].length);
    }

    return 'Success';
  } catch (e) {
    throw new Error(`Failed to export to sheet: ${e.message}`);
  }
};

/**
 * Creates a new Google Sheet with the specified name.
 *
 * @param name - The name of the sheet to create.
 * @returns The URL of the newly created sheet.
 */
export const createSpreadsheet = name => {
  const spreadsheet = SpreadsheetApp.create(name);
  const url = spreadsheet.getUrl();
  const file = DriveApp.getFileById(spreadsheet.getId());
  const activeUserEmail = Session.getEffectiveUser().getEmail();
  const currentOwnerEmail = file.getOwner().getEmail();
  if (activeUserEmail && currentOwnerEmail !== activeUserEmail) {
    file.setOwner(activeUserEmail);
  }
  return url;
};
