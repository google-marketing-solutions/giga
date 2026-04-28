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


import type {Metadata} from 'next';
import {Inter, Outfit} from 'next/font/google';
import './globals.css';

const inter = Inter({subsets: ['latin'], variable: '--font-inter'});
const outfit = Outfit({subsets: ['latin'], variable: '--font-outfit'});

export const metadata: Metadata = {
  title: 'GIGA - Google Marketing Solutions',
  description: 'GIGA Application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head></head>
      <body
        className={`${inter.variable} ${outfit.variable} antialiased`}
      >
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  );
}
