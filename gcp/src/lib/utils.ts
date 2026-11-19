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

/**
 * Vertex AI locations that this service is permitted to call. The
 * `location` value is interpolated into the Vertex AI hostname by
 * `@google/genai`, so any value not on this list must be rejected to
 * prevent the request (and the attached service-account credentials)
 * from being sent to an attacker-controlled host.
 */
const ALLOWED_VERTEX_LOCATIONS: ReadonlySet<string> = new Set([
  'global',
  'us',
  'eu',
  'us-central1',
  'us-east1',
  'us-east4',
  'us-east5',
  'us-south1',
  'us-west1',
  'us-west4',
  'northamerica-northeast1',
  'southamerica-east1',
  'europe-central2',
  'europe-north1',
  'europe-southwest1',
  'europe-west1',
  'europe-west2',
  'europe-west3',
  'europe-west4',
  'europe-west6',
  'europe-west8',
  'europe-west9',
  'asia-east1',
  'asia-east2',
  'asia-northeast1',
  'asia-northeast3',
  'asia-south1',
  'asia-southeast1',
  'australia-southeast1',
  'me-central1',
  'me-central2',
  'me-west1',
]);

/**
 * Validates a caller-supplied Vertex AI location and returns a value that
 * is safe to pass to `new GoogleGenAI({location})`. Falls back to
 * `GCP_LOCATION` (or `global`) when no location is supplied, and throws on
 * any value that is not an exact match for a known Vertex AI region.
 *
 * @param loc - The caller-supplied location.
 * @returns A validated Vertex AI location string.
 */
export function safeVertexLocation(loc: unknown): string {
  const requested = typeof loc === 'string' && loc ? loc : '';
  const candidate = (
    requested ||
    process.env.GCP_LOCATION ||
    'global'
  ).toLowerCase();
  if (!ALLOWED_VERTEX_LOCATIONS.has(candidate)) {
    throw new Error('Unsupported Vertex AI location');
  }
  return candidate;
}

export function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`${name} environment variable is undefined`);
  }
  return value;
}

/**
 * Splits an array into chunks of a specified size.
 *
 * @param arr - The array to split.
 * @param len - The size of each chunk.
 * @returns A two-dimensional array containing the chunks.
 */
export const chunk = <T>(arr: T[], len: number): T[][] => {
  const chunks: T[][] = [];
  const n = arr.length;
  let i = 0;
  while (i < n) {
    chunks.push(arr.slice(i, (i += len)));
  }
  return chunks;
};

/**
 * Pauses execution for a specified number of milliseconds.
 *
 * @param ms - The number of milliseconds to sleep.
 * @returns A promise that resolves after the specified delay.
 */
export const sleep = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Formats an unknown error into a string message.
 *
 * @param error - The error object to format.
 * @returns A formatted error message string.
 */
export function formatErrorMessage(error: unknown): string {
  let errorMessage = 'Unknown error';
  if (error instanceof Error) {
    errorMessage = error.message;
    if ('errors' in error && typeof error.errors === 'object') {
      errorMessage += ' ' + JSON.stringify(error.errors, null, 2);
    }
  } else {
    try {
      errorMessage = JSON.stringify(error, null, 2);
    } catch {
      errorMessage = String(error);
    }
  }
  return errorMessage;
}
/**
 * Retries a function with exponential backoff.
 *
 * @param fn - The function to retry.
 * @param options - Retry options (count, delay, filter).
 * @returns The result of the function.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    shouldRetry?: (error: unknown) => boolean;
  } = {},
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    shouldRetry = () => true,
  } = options;

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries && shouldRetry(error)) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.warn(
          `Retry attempt ${attempt + 1} after ${delay}ms due to: ${error instanceof Error ? error.message : String(error)}`,
        );
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}
