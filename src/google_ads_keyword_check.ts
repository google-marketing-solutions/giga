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
 * Copyright 2026 Google LLC
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

import { getScriptProperties, chunk } from './util';
import { runQuery } from './reporting';

/**
 * Retrieves the target account ID for checking existing keywords.
 * Falls back to undefined if not set.
 */
const getTargetAccountId = () =>
  getScriptProperties('ADS_ACCOUNT_ID')?.toString().replace(/-/g, '').trim();

/**
 * Checks if a list of keywords already exist in the configured Google Ads account.
 *
 * @param keywords - An array of keyword texts to check.
 * @returns A record mapping each keyword to a boolean indicating if it exists.
 */
export const checkKeywordsExistence = (
  keywords: string[]
): Record<string, boolean> => {
  const targetAccountId = getTargetAccountId();
  if (!targetAccountId) {
    console.warn(
      'ADS_ACCOUNT_ID is not set. Skipping keyword existence check.'
    );
    return {};
  }

  if (!keywords || keywords.length === 0) {
    return {};
  }

  const results: Record<string, boolean> = {};

  // Initialize all as not existing
  keywords.forEach(kw => {
    results[kw] = false;
  });

  // Query all active/paused keywords in non-removed ad groups and campaigns
  const query = `
    SELECT ad_group_criterion.keyword.text
    FROM ad_group_criterion
    WHERE ad_group_criterion.type = 'KEYWORD'
      AND ad_group_criterion.status != 'REMOVED'
      AND ad_group.status != 'REMOVED'
      AND campaign.status != 'REMOVED'
  `;

  console.log(
    `Checking keyword existence for ${keywords.length} ideas against all existing keywords on account ${targetAccountId}...`
  );
  try {
    const res = runQuery(targetAccountId, query);
    const existingKeywordsSet = new Set<string>();
    if (res && res.length > 0) {
      res.forEach(item => {
        const kwText = item.adGroupCriterion?.keyword?.text;
        if (kwText) {
          existingKeywordsSet.add(kwText.toLowerCase().trim());
        }
      });
    }
    console.log(
      `Found ${existingKeywordsSet.size} unique existing keywords in account.`
    );

    keywords.forEach(kw => {
      if (kw) {
        results[kw] = existingKeywordsSet.has(kw.toLowerCase().trim());
      }
    });
  } catch (e) {
    console.error('Error checking keywords existence for account:', e);
  }

  return results;
};
