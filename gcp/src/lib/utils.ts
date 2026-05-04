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
