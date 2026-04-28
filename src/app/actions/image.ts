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

import {GoogleGenAI, HarmCategory, HarmBlockThreshold} from '@google/genai';
import {appConfig} from '../../lib/config';

export async function generateImage(formData: FormData) {
  const prompt = formData.get('prompt') as string;
  const location = formData.get('location') as string;
  const model = formData.get('model') as string;
  const referenceImagesBase64 = formData.getAll(
    'referenceImagesBase64',
  ) as string[];

  const aspectRatio = formData.get('aspectRatio') as string | null;
  const imageSize = formData.get('imageSize') as string | null;

  const client = new GoogleGenAI({
    vertexai: true,
    project: appConfig.projectId,
    location,
  });

  try {
    const hasRefImages =
      referenceImagesBase64 && referenceImagesBase64.length > 0;

    // Gemini Models (generateContent)
    // This path handles text-only, or text+image prompt (which Gemini 3.1 Flash natively translates to image-to-image output)
    const parts: {
      text?: string;
      inlineData?: {mimeType: string; data: string};
    }[] = [{text: prompt}];

    if (hasRefImages) {
      for (const b64 of referenceImagesBase64) {
        const match = b64.match(/^data:(image\/[a-zA-Z]*);base64,(.*)$/);
        if (match) {
          parts.push({
            inlineData: {mimeType: match[1], data: match[2]},
          });
        }
      }
    }

        const generateConfig: Record<string, unknown> = {};
    const imageConfig: Record<string, unknown> = {};

    if (aspectRatio) imageConfig.aspectRatio = aspectRatio;
    if (imageSize) imageConfig.imageSize = imageSize;

    if (Object.keys(imageConfig).length > 0) {
      generateConfig.imageConfig = imageConfig;
    }

    const response = await client.models.generateContent({
      model: model,
      contents: [{role: 'user', parts: parts}],
      config:
        Object.keys(generateConfig).length > 0
          ? {
              ...generateConfig,
              safetySettings: [
                {
                  category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                  threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                  category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                  threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                  category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                  threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE},
              ],
            }
          : {
              safetySettings: [
                {
                  category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                  threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                  category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                  threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                  category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                  threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE},
              ],
            },
    });

    const respParts = response.candidates?.[0]?.content?.parts;
    if (!respParts || respParts.length === 0) {
      throw new Error('No content generated');
    }

     
    const content = respParts
      .map((part: import('@google/genai').Part) => {
        if (part.text) {
          return {type: 'text', value: part.text};
        }
        if (part.inlineData && part.inlineData.data) {
          return {
            type: 'image',
            value: `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`,
          };
        }
        return null;
      })
      .filter(
        (
          item: {type: string; value: string} | null,
        ): item is {type: 'text' | 'image'; value: string} => item !== null,
      );

    if (content.length === 0) {
      throw new Error('No supported content generated');
    }

    return {content};
  } catch (error) {
    console.error('Image generation/edition error:', error);
    throw error;
  }
}
