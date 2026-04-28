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

import {
  getHistoricalMetrics,
  getKeywordIdeasFromSeed,
  getKeywordIdeasFromUrl,
} from '../../lib/google-ads';
import {formatErrorMessage} from '../../lib/utils';

export async function generateKeywordIdeasFromUrl(
  url: string,
  pageSize?: number,
) {
  try {
    const ideas = await getKeywordIdeasFromUrl(url, pageSize);
    return {ideas};
  } catch (error: unknown) {
    console.error('Error generating keyword ideas from URL:', error);
    throw new Error(formatErrorMessage(error));
  }
}

export async function generateKeywordIdeasFromSeed(
  keywords: string[],
  pageSize?: number,
) {
  try {
    const ideas = await getKeywordIdeasFromSeed(keywords, pageSize);
    return {ideas};
  } catch (error: unknown) {
    console.error('Error generating keyword ideas from seeds:', error);
    throw new Error(formatErrorMessage(error));
  }
}

export async function generateHistoricalMetrics(keywords: string) {
  const keywordList = keywords
    .split(',')
    .map(k => k.trim())
    .filter(k => k);
  const metrics = await getHistoricalMetrics(keywordList);
  return {metrics};
}
