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
 * The prompt template used for the insights follow-up chat.
 */
export const INSIGHTS_CHAT_PROMPT = `\n\nIMPORTANT: Respond to the user's message based on the history.
When the user is requesting an image, use the generateImage function to generate an image and do *not*
output any other text. Use standard HTML tags (e.g., <p>, <strong>, <ul>, <li>) for basic markdown-style
rich text formatting in your response but DO NOT use RAW Markdown. Also provide 3 short follow-up questions
for the user. The questions should be formulated as direct actions for you (the AI) and not like "Shall I identify the top-performing keywords" but rather only the actionable part: "Identify the top-performing keywords".
CRITICAL: Only suggest follow-up questions that can be answered using the data already present in the chat history/context window. Do not suggest calculating new growth metrics, getting search volume for new topics, or requesting external data that you do not have access to.
The response must be suitable for a chat message (no title, no conclusions).
Aim for a short response.`;

/**
 * Generates a prompt for insights based on a list of keywords and their search growth.
 *
 * @param ideaRows - An array of arrays containing keyword and search growth data.
 * @param keywords - An array of keywords to search for.
 * @param metricName - The name of the metric to use for sorting (default is "YoY").
 * @param language - The language to use for the prompt (default is "English").
 * @returns A string containing the prompt for insights.
 */
export const getInsightsPrompt = (
  ideaRows,
  keywords,
  metricName,
  language = 'English',
  specificQuestion
) => {
  const data = ideaRows.map(row => {
    return `${row[0]}, ${(row[1] * 100).toFixed(1)}%`;
  });

  let instruction = `You are a marketing and strategy analyst and you want to find interesting insights based on the topic(s) [${keywords.join(
    ', '
  )}] related list provided in the <DATA> section. Cluster this comma-separated list of search terms and ${metricName} search growth and identify overall trends. Also, consider the list is sorted descending by growth rate.`;

  let formatInstruction = `
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

  Do NOT include any markdown code block formatting (like \`\`\`json) in your response.

<EXAMPLE>
INPUT:
[
  "dog pool, 12242.3%",
  "dog games, 3602.5%",
  "pet health, 1014.9%"
]


OUTPUT:
<h1>Decoding Pet-Related Search Trends: Insights for Marketing & Strategy</h1>

<p>This analysis examines the provided Google Ads keywords related to "pets," sorted by descending YoY growth rate, to uncover consumer trends and potential marketing opportunities.</p>

<h2>Overall Trends:</h2>

<ul>
    <li><b>Explosive Growth in Pet-Specific Products and Activities:</b> The massive growth observed across all provided keywords points to a significant increase in pet owners' focus on enhancing their pets' lives.  "Dog pool" (+12242.3%), "dog games" (+3602.5%), and "pet health" (+1014.9%) all show exceptional YoY increases, suggesting a surge in demand for products and services catering to these areas.</li>
</ul>

<h2>Cluster Insights & Marketing Takeaways:</h2>

<p>While the limited number of keywords prevents granular clustering, we can identify key themes and suggest marketing strategies based on them:</p>

<h3>1. Pet Enrichment & Entertainment:</h3>

<ul>
    <li><b>Focus:</b> Products and activities that provide mental and physical stimulation for pets, particularly dogs.</li>
    <li><b>Keywords:</b> "dog pool," "dog games"</li>
    <li><b>Strategy:</b>
        <ul>
            <li>Expand product lines to include a variety of dog pools, from basic wading pools to more elaborate setups.</li>
            <li>Develop and market a range of interactive dog games, including puzzle toys, fetch toys, and agility equipment.</li>
            <li>Create engaging content showcasing the benefits of pet enrichment and how your products meet those needs.</li>
        </ul>
    </li>
</ul>

<h3>2. Pet Health & Wellness:</h3>

<ul>
    <li><b>Focus:</b> Products and services that support pet health, including preventative care, nutrition, and veterinary services.</li>
    <li><b>Keywords:</b> "pet health"</li>
    <li><b>Strategy:</b>
        <ul>
            <li>Offer a range of pet health products, such as supplements, grooming tools, and first-aid kits.</li>
            <li>Partner with veterinarians or pet health professionals to offer educational content and resources.</li>
            <li>Develop targeted marketing campaigns highlighting the importance of preventative pet care.</li>
        </ul>
    </li>
</ul>


<h2>Recommendations for Future Analysis:</h2>

<ul>
    <li><b>Expand Keyword List:</b> Include a broader range of pet-related keywords to gain a more comprehensive understanding of search trends within this market. Consider keywords related to specific pet types (e.g., "cat toys," "bird cages"), breeds (e.g., "golden retriever food"), and health concerns (e.g., "dog arthritis treatment").</li>
    <li><b>Analyze Competitor Performance:</b> Monitor search volume and growth for competitor brands to assess market positioning and identify potential threats and opportunities.</li>
    <li><b>Investigate Seasonality:</b> Analyze search trends over time to identify any seasonal patterns in pet-related searches. This information can inform targeted marketing campaigns and inventory management.</li>
</ul>

<h2>Conclusion:</h2>

<p>The provided data, while limited, clearly indicates a growing interest in pet-related products and services, particularly in the areas of enrichment, entertainment, and health. By expanding research and strategically leveraging these initial insights, businesses can effectively target pet owners and capitalize on this thriving market.</p>
</EXAMPLE>`;

  if (specificQuestion) {
    instruction = `You are a marketing and strategy analyst.
    Answer EXACTLY this question using the data provided in the <DATA> section: "${specificQuestion}".
    Do not generate the full insights report. Just provide the answer.
    Output using standard HTML elements for formatting (like <p>, <strong>, <ul>, <li>).`;

    formatInstruction = `
  Format your response as a JSON object with the following structure:
  {
    "report": "HTML string containing the answer",
    "suggestions": [
      "Short follow-up question 1",
      "Short follow-up question 2",
      "Short follow-up question 3"
    ]
  }

  Output in ${language}.

  Do NOT include any markdown code block formatting (like \`\`\`json) in your response.`;
  }

  return `${instruction}
${formatInstruction}

<DATA>
${JSON.stringify(data, null, 2)}
</DATA>`;
};

export const DEFAULT_STYLE_GUIDE = `### Styleguide and Technical Specifications Google Search Ads

**Headlines**
*   **Quantity:** Provide up to 15 headlines.
*   **Character Limit:** Each headline has a maximum length of 30 characters.

**Descriptions**
*   **Quantity:** Provide up to 4 descriptions.
*   **Character Limit:** Each description has a maximum length of 90 characters.

### Headline Best Practices

*   **Create Unique Headlines:** Each headline should offer something different and be able to stand on its own. Avoid overly similar phrases as this limits the number of combinations Google can test.
*   **Incorporate Keywords:** Include your primary keywords in some of the headlines to improve relevance to user searches.
*   **Use Action-Oriented Language:** Start headlines with verbs like "Get," "Shop," or "Discover" to encourage clicks.
*   **Showcase Unique Value:** Highlight what makes your offer stand out, such as special promotions, guarantees, or exclusive features.

### Description Best Practices

*   **Write for Modularity:** Descriptions are paired with various headlines, so ensure each description is written to make sense independently and in combination with any headline.
*   **Focus on Benefits:** Clearly state the advantages and solutions your product or service provides to the customer.
*   **Include a Clear Call to Action (CTA):** Tell users what you want them to do next, for example, "Shop Now," "Request a Quote," or "Sign Up Today." Short and straightforward CTAs are effective.
*   **Highlight Promotions:** If you have special offers, discounts, or limited-time deals, feature them in your descriptions to create a sense of urgency and value.
`;
