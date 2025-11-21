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
import { createGeminiConfig } from './main';
import { GeminiConfig, gemini } from './vertex';

export const generateTrendsKeywords = (
  seedKeywords,
  promptTemplate,
  geminiConfig: Partial<GeminiConfig>
) => {
  const separator = ';';
  const prompt = `${promptTemplate}

  Keywords:
  ${seedKeywords.join('\n')}

  IMPORTANT:
  - Aim for simple wording (best case single words) that can be used as broadmatch keywords in Google Ads.
  - Focus on keywords that are currently trending or have high demand.
  - Prioritize keywords with significant recent growth in search volume.
  - Consider seasonal trends and emerging topics relevant to the provided keywords.
  - Ensure the keywords are relevant to the context of the original keywords.
  - Provide a diverse set of keywords covering various aspects of the original keywords.
  - Avoid overly specific or niche keywords; focus on broader terms that capture wider interest.
  - Do NOT add the Google Ads keyword itself to the trends if not necessary.
  - Only output the Google Ads broadmatch keywords itself and not add "trending" or "high demand for" other search terms
  - Only output the keywords without any introduction or other annotations separated by "${separator}
  - Do NOT add punctuation or unnecessary hyphens to keep the keyword as simple and generic as possible`;

  const config: GeminiConfig = createGeminiConfig(geminiConfig, 'text/plain');
  config.enableGoogleSearch = true;
  const res = gemini(config)(prompt);
  return res.split(separator).map(k => k.trim());
};
