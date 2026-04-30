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

import {useState} from 'react';

interface SettingsConfig {
  textModel: string;
  fallbackTextModel: string;
  imageModel: string;
  responseSchema: string;
  location: string;
}

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  config: SettingsConfig;
  onConfigChange: (newConfig: SettingsConfig) => void;
  defaultConfig?: SettingsConfig;
}

const TEXT_MODELS = [
  {
    value: 'gemini-3.1-flash-lite-preview',
    label: 'Gemini 3.1 Flash Lite Preview',
  },
  {value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro Preview'},
  {value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash Preview'},
];

const IMAGE_MODELS = [
  {
    value: 'gemini-3.1-flash-image-preview',
    label: 'Gemini 3.1 Flash Image Preview',
  },
  {value: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash Image'},
];

export function SettingsDialog({
  isOpen,
  onClose,
  config,
  onConfigChange,
  defaultConfig,
}: SettingsDialogProps) {
  const [localConfig, setLocalConfig] = useState<SettingsConfig>(config);
  const [wasOpen, setWasOpen] = useState(isOpen);

  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setLocalConfig(config);
    }
  }

  if (!isOpen) return null;

  const handleChange = (key: keyof SettingsConfig, value: unknown) => {
    setLocalConfig({...localConfig, [key]: value});
  };

  const handleSave = () => {
    onConfigChange(localConfig);
    onClose();
  };

  const isChangedFromDefault =
    defaultConfig &&
    JSON.stringify(localConfig) !== JSON.stringify(defaultConfig);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-white border border-[var(--card-border)] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-6 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              Settings
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[var(--primary)]/10 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Location */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                Location
                <a
                  href="https://cloud.google.com/vertex-ai/generative-ai/docs/learn/locations"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                  title="View Google Cloud locations documentation"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 16v-4"></path>
                    <path d="M12 8h.01"></path>
                  </svg>
                </a>
              </label>
              <input
                type="text"
                value={localConfig.location || 'global'}
                onChange={e => handleChange('location', e.target.value)}
                placeholder="e.g., us-central1"
                className="w-full p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all"
              />
            </div>

            {/* Text Model */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                Text Model
              </label>
              <select
                value={localConfig.textModel}
                onChange={e => handleChange('textModel', e.target.value)}
                className="w-full p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all appearance-none"
              >
                {TEXT_MODELS.map(model => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
              {!localConfig.textModel?.includes('pro') && (
                <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-xl flex items-start gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5"
                  >
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                    <path d="M12 9v4"></path>
                    <path d="M12 17h.01"></path>
                  </svg>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200/90 leading-relaxed">
                    Flash models are not recommended for analysis (Explore,
                    Insights, and Campaigns) due to complexity and volume. They
                    should only be used for demonstration purposes.
                  </p>
                </div>
              )}
            </div>

            {/* Fallback Text Model */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                Fallback Text Model (JSON Extraction)
              </label>
              <select
                value={
                  localConfig.fallbackTextModel || 'gemini-3.1-pro-preview'
                }
                onChange={e =>
                  handleChange('fallbackTextModel', e.target.value)
                }
                className="w-full p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all appearance-none"
              >
                {TEXT_MODELS.map(model => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Image Model */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                Image Model
              </label>
              <select
                value={localConfig.imageModel}
                onChange={e => handleChange('imageModel', e.target.value)}
                className="w-full p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all appearance-none"
              >
                {IMAGE_MODELS.map(model => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Response Schema */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                Response Schema (JSON)
              </label>
              <textarea
                value={localConfig.responseSchema || ''}
                onChange={e => handleChange('responseSchema', e.target.value)}
                placeholder='{"type": "OBJECT", "properties": {...}}'
                className="w-full p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all min-h-[200px] font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end items-center gap-4 pt-4 border-t border-[var(--card-border)]/50 mt-2">
            {isChangedFromDefault && (
              <button
                onClick={() => setLocalConfig(defaultConfig)}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-all mr-auto"
              >
                Reset to Defaults
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2 border border-[var(--card-border)] text-[var(--text-secondary)] rounded-xl font-medium hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-[var(--primary)] text-white rounded-xl font-medium hover:bg-[var(--primary-hover)] transition-all shadow-lg shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/40 active:scale-95"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
