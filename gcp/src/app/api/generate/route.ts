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

import {GoogleGenAI} from '@google/genai';
import {appConfig} from '../../../lib/config';

export async function POST(req: Request) {
  try {
    const {prompt, config, useGrounding, schema} = await req.json();

    const client = new GoogleGenAI({
      vertexai: true,
      project: appConfig.projectId,
      location: config.location,
    });

    const jsonInstruction =
      useGrounding && config.responseMimeType === 'application/json'
        ? `\n\nOutput As JSON${schema ? ` with the following Schema: ${JSON.stringify(schema, null, 2)}` : ''}`
        : '';

    const streamingResp = await client.models.generateContentStream({
      model: config.model || 'gemini-3.1-pro-preview',
      contents: [
        {role: 'user', parts: [{text: `${prompt}${jsonInstruction}`}]},
      ],
      config: {
        responseMimeType: useGrounding
          ? 'text/plain'
          : config.responseMimeType || 'application/json',
        responseSchema: useGrounding ? undefined : schema,
        tools: useGrounding ? [{googleSearch: {}}] : undefined,
      },
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const item of streamingResp) {
            const text = item.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (text) {
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error: unknown) {
    console.error('Streaming error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {'Content-Type': 'application/json'},
      },
    );
  }
}
