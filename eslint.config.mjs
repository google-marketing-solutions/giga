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

import {defineConfig, globalIgnores} from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import eslintPluginHeader from 'eslint-plugin-header';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Monkey-patch to allow options in ESLint 9
eslintPluginHeader.rules.header.meta.schema = false;

// Read the license file and split into an array of lines
const licenseText = fs.readFileSync(path.join(__dirname, 'license-header.txt'), 'utf8')
  .split('\n')
  .map(line => line.trimEnd()); // Clean up trailing spaces

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
  {
    plugins: {
      header: eslintPluginHeader,
    },
    rules: {
      'header/header': [2, 'block', licenseText, 2]
    }
  }
]);

export default eslintConfig;
