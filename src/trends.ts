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
import { GeminiConfig, ResponseSchema, gemini } from './vertex';

/**
 * Generates a list of trending keywords based on a list of seed keywords.
 *
 * @param seedKeywords - An array of seed keywords to use for keyword generation.
 * @param promptTemplate - A template for the prompt to use for keyword generation.
 * @param geminiConfig - The configuration for Gemini.
 * @returns An array of trending keywords.
 */
export const generateTrendsKeywords = (
  seedKeywords: string[],
  promptTemplate: string,
  geminiConfig: Partial<GeminiConfig>
) => {
  const prompt = `${promptTemplate}\nKeywords:\n${seedKeywords.join(', ')}`;
  const responseSchema: ResponseSchema = {
    type: 'array',
    items: {
      type: 'string',
    },
  };
  const config: GeminiConfig = createGeminiConfig(
    geminiConfig,
    'application/json'
  );
  config.enableGoogleSearch = true;
  config.responseSchema = responseSchema;
  return gemini(config)(prompt);
};
