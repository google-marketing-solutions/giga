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


'use client';

import React, {Component, ErrorInfo, ReactNode} from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {hasError: false, error: null};
  }

  static getDerivedStateFromError(error: Error): State {
    return {hasError: true, error};
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  handleCopy = () => {
    const {error} = this.state;
    if (!error) return;

    const textToCopy = `Error: ${error.message}\n\nStack Trace:\n${error.stack || 'No stack trace available'}`;
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        const btn = document.getElementById('error-boundary-copy-btn');
        if (btn) {
          const originalText = btn.innerText;
          btn.innerText = 'Copied!';
          btn.classList.remove('bg-gray-900');
          btn.classList.add('bg-green-600');
          setTimeout(() => {
            btn.innerText = originalText;
            btn.classList.remove('bg-green-600');
            btn.classList.add('bg-gray-900');
          }, 2000);
        }
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col p-8 overflow-auto text-gray-900 font-sans">
          <div className="max-w-4xl mx-auto w-full flex flex-col h-full">
            <div className="flex items-center justify-between mb-6 border-b pb-4 border-gray-200">
              <h1 className="text-3xl font-bold tracking-tight text-red-600">
                Application Rendering Error
              </h1>
              <div className="flex gap-4">
                <button
                  id="error-boundary-copy-btn"
                  onClick={this.handleCopy}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-sm text-sm"
                >
                  Copy Error & Stack Trace
                </button>
                <button
                  onClick={() => this.setState({hasError: false, error: null})}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm text-sm"
                >
                  Dismiss & Retry
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-6 h-[calc(100vh-160px)]">
              <div className="bg-red-50 p-6 rounded-xl border border-red-200">
                <h2 className="text-lg font-semibold text-red-800 mb-2">
                  Message
                </h2>
                <p className="text-md text-red-900 font-medium">
                  {this.state.error.message}
                </p>
              </div>

              <div className="flex-1 flex flex-col bg-gray-50 p-6 rounded-xl border border-gray-200 overflow-hidden h-[60%]">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  Stack Trace
                </h2>
                <pre className="flex-1 text-sm font-mono text-gray-700 whitespace-pre-wrap overflow-auto p-4 bg-white rounded-lg border border-gray-100 h-[calc(100%-40px)]">
                  {this.state.error.stack || 'No stack trace available'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
