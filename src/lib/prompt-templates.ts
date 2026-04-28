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


export const INSIGHTS_CHAT_PROMPT = `\nIMPORTANT:
* Context: Respond to the user message using the existing conversation history.
* Formatting: Use standard HTML tags for rich text (such as p, strong, ul, li), no raw Markdown.
* Links: Ensure all anchor tags include the target="_blank" attribute.
* Follow-ups: Provide 3 short follow-up actions that can be completed using data already present.
* Style: Keep responses brief and suitable for a chat interface by omitting titles and conclusions.
* Images: If the user asks for an image, generate highly detailed visual descriptions/prompts for an image generation model and put them in the 'image_prompts' array. DO NOT reply saying you cannot generate images.`;

export const getInsightsPrompt = (
  ideaRows: [string, number][],
  keywords: string[],
  metricName: string,
  language = 'English',
  specificQuestion?: string
) => {
  const data = ideaRows.map(row => {
    return `${row[0]}, ${(row[1] * 100).toFixed(0)}%`;
  });

  let instruction = `You are a marketing and strategy analyst and you want to find interesting insights based on the topic(s) [${keywords.join(', ')}] related list provided in the <DATA> section. Cluster this comma-separated list of search terms and ${metricName} search growth and identify overall trends. Also, consider the list is sorted descending by growth rate.`;

  const formatInstruction = `
  Format your response as a JSON object with the following structure:
  {
    "report": "HTML string containing the insights report, using standard HTML elements like <h1>, <h2>, <p>, and <ul>",
    "suggestions": [
      "Short follow-up question 1",
      "Short follow-up question 2",
      "Short follow-up question 3"
    ]
  }

  Output in ${language}.

  Do NOT include any markdown code block formatting (like \`\`\`json) in your response.`;

  if (specificQuestion) {
    instruction = `You are a marketing and strategy analyst.
    Answer EXACTLY this question using the data provided in the <DATA> section: "${specificQuestion}".
    Do not generate the full insights report. Just provide the answer.
    Output using standard HTML elements for formatting (like <p>, <strong>, <ul>, <li>).`;
  }

  return `${instruction}\n${formatInstruction}\n<DATA>\n${JSON.stringify(data, null, 2)}\n</DATA>`;
};

export const getPromptKeywordsTemplate = (keywords: string[]) => `
*User:*

Please write 3 distinct ads, each with 15 headlines and 4 descriptions for the following keywords:
[${(keywords || []).join(', ')}]

Make sure the ads are different from each other to cover different angles.
Do not produce placeholders (e.g. {KeyWord: Vintage Jeans}) and instead produce readable text.
Output strictly as a JSON array of objects, where each object has 'headlines' (array of strings) and 'descriptions' (array of strings) properties.

*Model:*
`;
