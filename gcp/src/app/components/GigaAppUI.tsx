/*Copyright 2026 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.*/

/* eslint-disable */

// @ts-nocheck
'use client';
import React, {useState, useEffect, useRef, useMemo, useCallback} from 'react';
import Chart from 'chart.js/auto';

// Mocking backend calls
const USER_EMAIL = 'mocked.user@example.com';

import * as serverActions from '../actions/giga-actions';

// --- utils.html ---

// --- Constants & Data ---
const COLOR_PALETTE = ['#4f6d7a', '#c0d6df', '#dbe9ee', '#4a6fa5', '#166088'];

const DARK_MODE_PALETTE = [
  '#60a5fa', // blue-400
  '#93c5fd', // blue-300
  '#38bdf8', // sky-400
  '#7dd3fc', // sky-300
  '#22d3ee', // cyan-400
];

/**
 * Array of language objects with their IDs and names.
 * This will be used to populate the language dropdown in the UI.
 */
const LANGUAGES = [
  {id: '1000', name: 'English'},
  {id: '1001', name: 'German'},
  {id: '1002', name: 'French'},
  {id: '1003', name: 'Spanish'},
  {id: '1004', name: 'Italian'},
  {id: '1005', name: 'Japanese'},
  {id: '1009', name: 'Danish'},
  {id: '1010', name: 'Dutch'},
  {id: '1011', name: 'Finnish'},
  {id: '1013', name: 'Norwegian'},
  {id: '1014', name: 'Portuguese'},
  {id: '1015', name: 'Swedish'},
  {id: '1020', name: 'Bulgarian'},
  {id: '1021', name: 'Czech'},
  {id: '1022', name: 'Greek'},
  {id: '1024', name: 'Hungarian'},
  {id: '1028', name: 'Latvian'},
  {id: '1029', name: 'Lithuanian'},
  {id: '1030', name: 'Polish'},
  {id: '1031', name: 'Russian'},
  {id: '1032', name: 'Romanian'},
  {id: '1033', name: 'Slovak'},
  {id: '1034', name: 'Slovenian'},
  {id: '1036', name: 'Ukrainian'},
  {id: '1038', name: 'Catalan'},
  {id: '1039', name: 'Croatian'},
  {id: '1043', name: 'Estonian'},
  {id: '1064', name: 'Persian'},
];

/**
 * Array of country objects with their IDs and names.
 * This will be used to populate the country dropdown in the UI.
 */
const COUNTRIES = [
  {id: '', name: 'Worldwide'},
  {id: '2276', name: 'Germany'},
  {id: '2826', name: 'UK'},
  {id: '2250', name: 'France'},
  {id: '2380', name: 'Italy'},
  {id: '2756', name: 'Switzerland'},
  {id: '2724', name: 'Spain'},
  {id: '2616', name: 'Poland'},
  {id: '2642', name: 'Romania'},
  {id: '2528', name: 'Netherlands'},
  {id: '2056', name: 'Belgium'},
  {id: '2203', name: 'Czechia'},
  {id: '2300', name: 'Greece'},
  {id: '2620', name: 'Portugal'},
  {id: '2752', name: 'Sweden'},
  {id: '2348', name: 'Hungary'},
  {id: '2040', name: 'Austria'},
  {id: '2100', name: 'Bulgaria'},
  {id: '2208', name: 'Denmark'},
  {id: '2703', name: 'Slovakia'},
  {id: '2246', name: 'Finland'},
  {id: '2372', name: 'Ireland'},
  {id: '2191', name: 'Croatia'},
  {id: '2440', name: 'Lithuania'},
  {id: '2705', name: 'Slovenia'},
  {id: '2428', name: 'Latvia'},
  {id: '2233', name: 'Estonia'},
  {id: '2196', name: 'Cyprus'},
  {id: '2442', name: 'Luxembourg'},
  {id: '2470', name: 'Malta'},
];

const REGION_MAP = {
  Worldwide: [{id: '', name: 'Worldwide'}],
  Africa: [
    {id: '2112', name: 'Algeria'},
    {id: '2024', name: 'Angola'},
    {id: '2120', name: 'Cameroon'},
    {id: '2384', name: "Cote d'Ivoire"},
    {id: '2818', name: 'Egypt'},
    {id: '2288', name: 'Ghana'},
    {id: '2466', name: 'Mali'},
    {id: '2504', name: 'Morocco'},
    {id: '2566', name: 'Nigeria'},
    {id: '2686', name: 'Senegal'},
    {id: '2710', name: 'South Africa'},
    {id: '2788', name: 'Tunisia'},
  ],
  'Asia & Oceania': [
    {id: '2036', name: 'Australia'},
    {id: '2554', name: 'New Zealand'},
    {id: '2048', name: 'Bahrain'},
    {id: '2156', name: 'China'},
    {id: '2356', name: 'India'},
    {id: '2360', name: 'Indonesia'},
    {id: '2376', name: 'Israel'},
    {id: '2392', name: 'Japan'},
    {id: '2414', name: 'Kuwait'},
    {id: '2458', name: 'Malaysia'},
    {id: '2634', name: 'Qatar'},
    {id: '2682', name: 'Saudi Arabia'},
    {id: '2702', name: 'Singapore'},
    {id: '2410', name: 'South Korea'},
    {id: '2764', name: 'Thailand'},
    {id: '2792', name: 'Turkiye'},
    {id: '2784', name: 'United Arab Emirates'},
    {id: '2704', name: 'Vietnam'},
  ],
  Europe: [
    {id: '2008', name: 'Albania'},
    {id: '2040', name: 'Austria'},
    {id: '2112', name: 'Belarus'},
    {id: '2056', name: 'Belgium'},
    {id: '2070', name: 'Bosnia and Herzegovina'},
    {id: '2100', name: 'Bulgaria'},
    {id: '2191', name: 'Croatia'},
    {id: '2203', name: 'Czechia'},
    {id: '2208', name: 'Denmark'},
    {id: '2233', name: 'Estonia'},
    {id: '2246', name: 'Finland'},
    {id: '2250', name: 'France'},
    {id: '2268', name: 'Georgia'},
    {id: '2276', name: 'Germany'},
    {id: '2300', name: 'Greece'},
    {id: '2348', name: 'Hungary'},
    {id: '2352', name: 'Iceland'},
    {id: '2372', name: 'Ireland'},
    {id: '2380', name: 'Italy'},
    {id: '2428', name: 'Latvia'},
    {id: '2438', name: 'Liechtenstein'},
    {id: '2440', name: 'Lithuania'},
    {id: '2492', name: 'Monaco'},
    {id: '2499', name: 'Montenegro'},
    {id: '2528', name: 'Netherlands'},
    {id: '2807', name: 'North Macedonia'},
    {id: '2578', name: 'Norway'},
    {id: '2616', name: 'Poland'},
    {id: '2620', name: 'Portugal'},
    {id: '2642', name: 'Romania'},
    {id: '2643', name: 'Russia'},
    {id: '2688', name: 'Serbia'},
    {id: '2703', name: 'Slovakia'},
    {id: '2705', name: 'Slovenia'},
    {id: '2724', name: 'Spain'},
    {id: '2752', name: 'Sweden'},
    {id: '2756', name: 'Switzerland'},
    {id: '2804', name: 'Ukraine'},
    {id: '2826', name: 'United Kingdom'},
  ],
  'North America': [
    {id: '2124', name: 'Canada'},
    {id: '2188', name: 'Costa Rica'},
    {id: '2388', name: 'Jamaica'},
    {id: '2484', name: 'Mexico'},
    {id: '2591', name: 'Panama'},
    {id: '2840', name: 'United States'},
  ],
  'South America': [
    {id: '2032', name: 'Argentina'},
    {id: '2068', name: 'Bolivia'},
    {id: '2076', name: 'Brazil'},
    {id: '2152', name: 'Chile'},
    {id: '2170', name: 'Colombia'},
    {id: '2218', name: 'Ecuador'},
    {id: '2600', name: 'Paraguay'},
    {id: '2604', name: 'Peru'},
    {id: '2858', name: 'Uruguay'},
    {id: '2862', name: 'Venezuela'},
  ],
};

/**
 * Default prompt for keyword clustering.
 * This will be used as the default prompt in the UI.
 */
const DEFAULT_PROMPT = `You are given a list of Google Ads keyword ideas.
Your task is to create 10 clusters. For each cluster use only up to 20 keywords that are most representative of that cluster.
Make sure to only assign the keywords provided to the cluster and do not invent new keywords.
All keywords assigned to a cluster must be exactly the same (e.g. same case, same spacing, same accents).

The Google Ads keyword ideas are:
`;

const DEFAULT_TRENDS_PROMPT = `Provide a list of around 100 Google Ads keywords that represent trends regarding the topics/keywords mentioned below. Rules:
- Aim for simple wording (best case single words) that can be used as keywords in Google Ads.
- Focus on keywords that are currently trending or have high demand.
- Prioritize keywords with significant recent growth in search volume.
- Consider seasonal trends and emerging topics relevant to the provided keywords.
- Ensure the keywords are relevant to the context of the original keywords.
- Provide a diverse set of keywords covering various aspects of the original keywords.
- Avoid overly specific or niche keywords; focus on broader terms that capture wider interest.
- Do NOT add the Google Ads keyword itself to the trends if not necessary.
- Do NOT add punctuation or unnecessary hyphens to keep the keyword as simple and generic as possible`;

const LANGUAGE_INFO_URL =
  'https://developers.google.com/google-ads/api/reference/data/codes-formats#languages';
const LOCATION_INFO_URL =
  'https://developers.google.com/google-ads/api/reference/data/geotargets';
const GOOGLE_ADS_ID_HELP_URL =
  'https://support.google.com/google-ads/answer/1704344?hl=en';

/**
 * Array of growth metrics objects with their IDs and names.
 * This will be used to populate the growth metrics dropdown in the UI.
 */
const GROWTH_METRICS = [
  {id: 'latest_vs_max', name: 'Last Month vs Max'},
  {id: 'yoy', name: 'Year over Year'},
  {id: 'mom', name: 'Month over Month'},
  {id: 'latest_vs_avg', name: 'Last Month vs Average'},
  {id: 'three_months_vs_avg', name: 'Last 3 Months vs Prev Avg'},
];

const MODEL_NAMES = {
  'gemini-3.1-pro-preview': 'Gemini 3.1 Pro',
  'gemini-3-flash-preview': 'Gemini 3 Flash',
  'gemini-3.1-flash-lite-preview': 'Gemini 3.1 Flash Lite',
};

const APP_VERSION = 'v1.2.0';

const compareVersions = (v1, v2) => {
  if (!v1 || !v2) return 'major';
  const cleanV1 = v1.replace(/^v/, '');
  const cleanV2 = v2.replace(/^v/, '');
  const parts1 = cleanV1.split('.').map(Number);
  const parts2 = cleanV2.split('.').map(Number);

  if (parts1[0] !== parts2[0]) return 'major';
  if (parts1[1] !== parts2[1]) return 'minor';
  if (parts1[2] !== parts2[2]) return 'patch';
  return 'equal';
};

/**
 * Custom React hook that provides sticky state with optional read-only mode.
 * This will be used to persist state in the UI.
 */
const useStickyState = (defaultValue, key, isReadOnly = false) => {
  const [value, setValue] = useState(() => {
    if (isReadOnly) return defaultValue;
    try {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      window.localStorage.removeItem(key);
      return defaultValue;
    }
  });
  useEffect(() => {
    if (isReadOnly) return;
    try {
      if (value === undefined || value === null) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.warn(`Error writing localStorage key "${key}":`, error);
      if (
        error instanceof DOMException &&
        error.name === 'QuotaExceededError'
      ) {
        console.warn(
          `Quota exceeded for localStorage. Try clearing your browser cache.`,
        );
      }
    }
  }, [key, value, isReadOnly]);
  return [value, setValue];
};

/**
 * Helper function to format micros to currency.
 * This will be used to display currency values in the UI.
 */
const formatMicrosToCurrency = micros => {
  if (micros == null) return '';
  return (micros / 1000000).toFixed(2);
};

/**
 * Helper function to convert HTML to Markdown.
 * This will be used to convert HTML content to Markdown in the UI.
 */
const htmlToMarkdown = html => {
  let md = html;
  // Simple replacements for common tags
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
  md = md.replace(/<ul[^>]*>/gi, '\n');
  md = md.replace(/<\/ul>/gi, '\n');
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
  md = md.replace(/<p[^>]*>/gi, '\n\n');
  md = md.replace(/<\/p>/gi, '');
  md = md.replace(/<br\s*\/?>/gi, '\n');
  // Strip remaining tags
  md = md.replace(/<[^>]+>/g, '');
  // Decode entities
  md = md.replace(/&nbsp;/g, ' ');
  md = md.replace(/&amp;/g, '&');
  md = md.replace(/&lt;/g, '<');
  md = md.replace(/&gt;/g, '>');
  return md.trim();
};

/**
 * Helper function to convert an array of arrays to CSV.
 * This will be used to convert data to CSV in the UI.
 */
const convertToCSV = (headers, rows) => {
  const headerRow = headers.join(',');
  const bodyRows = rows.map(row =>
    row
      .map(cell => {
        const val = String(cell ?? '').replace(/"/g, '""');
        return `"${val}"`;
      })
      .join(','),
  );
  return [headerRow, ...bodyRows].join('\n');
};

/**
 * Helper function to download a file.
 * This will be used to download files in the UI.
 */
const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], {type: mimeType});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const flattenCampaignsForSheet = campaigns => {
  if (!Array.isArray(campaigns)) return [];
  const rows = [];
  campaigns.forEach(campaign => {
    campaign.adGroups.forEach(adGroup => {
      adGroup.keywords.forEach(keyword => {
        rows.push([campaign.campaignName, adGroup.name, keyword]);
      });
    });
  });
  return rows;
};

// --- components.html ---

const TabButton = ({active, onClick, children}) => (
  <button className={`tab-btn ${active ? 'active' : ''}`} onClick={onClick}>
    {children}
  </button>
);

const InputField = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  rows,
  helpText,
  onKeyDown,
  style,
}) => (
  <div className="input-group" style={style}>
    <label>{label}</label>
    {type === 'textarea' ? (
      <textarea
        rows={rows || 4}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={onKeyDown}
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={onKeyDown}
      />
    )}
    {helpText && <div className="text-sm text-muted mt-1">{helpText}</div>}
  </div>
);

const ChipsInput = ({
  label,
  value = [], // Array of strings
  onChange, // (newChips: string[]) => void
  placeholder,
  helpText,
  onKeyDown,
}) => {
  const [inputValue, setInputValue] = useState('');

  const addChip = text => {
    const trimmed = text.trim();
    if (trimmed) {
      if (!value.includes(trimmed)) {
        const nextValue = [...value, trimmed];
        onChange(nextValue);
        setInputValue('');
        return nextValue;
      }
      setInputValue('');
    }
    return value;
  };

  const handleKeyDown = e => {
    if (['Tab', ','].includes(e.key)) {
      e.preventDefault();
      addChip(inputValue);
    } else if (e.key === 'Enter') {
      const trimmed = inputValue.trim();
      if (trimmed) {
        e.preventDefault();
        addChip(inputValue);
      } else {
        if (onKeyDown) {
          onKeyDown(e, value);
        }
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const handleBlur = () => {
    addChip(inputValue);
  };

  const removeChip = indexToRemove => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="input-group">
      <label>{label}</label>
      <div
        className="chips-container"
        onClick={() => document.getElementById('chips-input').focus()}
      >
        {value.map((chip, index) => (
          <div key={index} className="chip">
            {chip}
            <span
              className="material-symbols-outlined close-icon"
              onClick={e => {
                e.stopPropagation();
                removeChip(index);
              }}
            >
              close
            </span>
          </div>
        ))}
        <input
          id="chips-input"
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={value.length === 0 ? placeholder : ''}
          className="chips-input-field"
        />
      </div>
      {helpText && <div className="text-sm text-muted mt-1">{helpText}</div>}
    </div>
  );
};

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  maxWidth = '',
  showCloseButton = true,
}) => {
  const overlayRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = event => {
      if (event.key === 'Escape' && overlayRef.current) {
        const overlays = Array.from(
          document.querySelectorAll('.modal-overlay'),
        );
        if (
          overlays.length > 0 &&
          overlays[overlays.length - 1] === overlayRef.current
        ) {
          event.stopImmediatePropagation();
          onCloseRef.current();
        }
      }
    };
    window.addEventListener('keydown', handleEsc, true);
    return () => window.removeEventListener('keydown', handleEsc, true);
  }, [isOpen]);

  if (!isOpen) return null;
  return (
    <div className="modal-overlay" ref={overlayRef} onClick={onClose}>
      <div
        className={`modal-content ${className}`}
        onClick={e => e.stopPropagation()}
        style={maxWidth ? {maxWidth} : undefined}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          {showCloseButton && (
            <button className="close-btn" onClick={onClose}>
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};

const ErrorModal = ({isOpen, onClose, error}) => {
  const overlayRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = event => {
      if (event.key === 'Escape' && overlayRef.current) {
        const overlays = Array.from(
          document.querySelectorAll('.modal-overlay'),
        );
        if (
          overlays.length > 0 &&
          overlays[overlays.length - 1] === overlayRef.current
        ) {
          event.stopImmediatePropagation();
          onCloseRef.current();
        }
      }
    };
    window.addEventListener('keydown', handleEsc, true);
    return () => window.removeEventListener('keydown', handleEsc, true);
  }, [isOpen]);

  if (!isOpen || !error) return null;

  const copyToClipboard = () => {
    const text = `Error: ${error.title}\nMessage: ${error.message}\n\nStack Trace:\n${error.stack || 'N/A'}`;
    navigator.clipboard.writeText(text).then(() => {
      // Optional: Show a temporary "Copied!" tooltip or state
    });
  };

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={onClose}>
      <div
        className="modal-content error-modal-content"
        onClick={e => e.stopPropagation()}
      >
        <div className="error-header">
          <span className="material-symbols-outlined error-icon">
            error_outline
          </span>
          <h2 className="error-title">{error.title || 'An error occurred'}</h2>
        </div>

        <div className="error-body">
          <p className="error-message">{error.message}</p>
          {error.stack && <div className="error-details">{error.stack}</div>}
        </div>

        <div className="error-actions">
          <button className="btn btn-secondary" onClick={copyToClipboard}>
            <span className="material-symbols-outlined">content_copy</span>
            Copy Details
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const SelectField = ({
  label,
  value,
  onChange,
  options,
  onCustomOption,
  onDeleteOption,
  searchable = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);

  const selectedOption = options.find(opt => opt.id === value);

  useEffect(() => {
    const handleClickOutside = event => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  const handleSelect = id => {
    onChange(id);
    setIsOpen(false);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (onDeleteOption) {
      onDeleteOption(id);
    }
  };

  const filteredOptions = searchable
    ? options.filter(opt =>
        opt.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : options;

  return (
    <div className="input-group" ref={containerRef}>
      <label>{label}</label>
      <div className="select-wrapper">
        <div
          className={`custom-select ${isOpen ? 'active' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{selectedOption ? selectedOption.name : 'Select...'}</span>
          <span className="material-symbols-outlined">
            {isOpen ? 'expand_less' : 'expand_more'}
          </span>
        </div>
        {isOpen && (
          <div className="select-dropdown">
            {searchable && (
              <div
                style={{
                  padding: '8px',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '6px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                  }}
                  onClick={e => {
                    e.stopPropagation();
                  }}
                  onKeyDown={e => {
                    e.stopPropagation();
                  }}
                />
              </div>
            )}
            <div style={{maxHeight: '300px', overflowY: 'auto'}}>
              {filteredOptions.length > 0 ? (
                filteredOptions.map(opt => (
                  <div
                    key={opt.id}
                    className={`select-option ${opt.id === value ? 'selected' : ''}`}
                    onClick={() => handleSelect(opt.id)}
                  >
                    <span>{opt.name}</span>
                    {onDeleteOption && opt.isCustom && (
                      <button
                        className="btn-icon delete-btn"
                        onClick={e => handleDelete(e, opt.id)}
                        title="Remove custom option"
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{fontSize: '1rem'}}
                        >
                          close
                        </span>
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div
                  className="select-option"
                  style={{cursor: 'default', color: 'var(--text-secondary)'}}
                >
                  No options found
                </div>
              )}
              {onCustomOption && (
                <div
                  className="select-option custom-divider"
                  onClick={() => {
                    onCustomOption();
                    setIsOpen(false);
                  }}
                >
                  <span className="material-symbols-outlined">add</span>
                  Add Custom...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ChartComponent = ({type, data, options, theme}) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      if (chartRef.current) chartRef.current.destroy();
      chartRef.current = new Chart(canvasRef.current, {
        type,
        data,
        options,
      });
    }
    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [type, data, options, theme]);

  return (
    <div
      className="chart-container"
      style={{position: 'relative', height: '100%', width: '100%'}}
    >
      <canvas ref={canvasRef} />
    </div>
  );
};

const SettingsModal = ({
  isOpen,
  onClose,
  modalConfig,
  geminiConfig,
  minSearchVolume,
  keywordLimit,
  configStatus,
  onSave,
  onClearCache,
}) => {
  const [localGeminiConfig, setLocalGeminiConfig] = useState(geminiConfig);
  const [localMinSearchVolume, setLocalMinSearchVolume] =
    useState(minSearchVolume);
  const [localKeywordLimit, setLocalKeywordLimit] = useState(keywordLimit);
  const [localAdsId, setLocalAdsId] = useState(configStatus.adsAccountId || '');
  const [localDevToken, setLocalDevToken] = useState('');
  const [localSpreadsheetUrl, setLocalSpreadsheetUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const adsInputRef = useRef(null);

  // Sync with props when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalGeminiConfig(geminiConfig);
      setLocalMinSearchVolume(minSearchVolume);
      setLocalKeywordLimit(keywordLimit);
      setLocalSpreadsheetUrl(modalConfig.spreadsheetUrl || '');
      setLocalAdsId(configStatus.adsAccountId || '');
      setLocalDevToken('');
    }
  }, [
    isOpen,
    geminiConfig,
    minSearchVolume,
    keywordLimit,
    configStatus,
    modalConfig.spreadsheetUrl,
  ]);

  // Focus Ads Account ID if highlighted
  useEffect(() => {
    if (
      isOpen &&
      (modalConfig.highlight === 'ADS_ACCOUNT_ID' ||
        modalConfig.highlight === 'BOTH') &&
      adsInputRef.current
    ) {
      setTimeout(() => {
        adsInputRef.current.focus();
      }, 100);
    }
  }, [isOpen, modalConfig.highlight]);

  const insightsModelRef = useRef(null);
  useEffect(() => {
    if (
      isOpen &&
      modalConfig.highlight === 'INSIGHTS_MODEL' &&
      insightsModelRef.current
    ) {
      setTimeout(() => {
        insightsModelRef.current.focus();
        insightsModelRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [isOpen, modalConfig.highlight]);

  const exploreModelRef = useRef(null);
  useEffect(() => {
    if (
      isOpen &&
      modalConfig.highlight === 'EXPLORE_MODEL' &&
      exploreModelRef.current
    ) {
      setTimeout(() => {
        exploreModelRef.current.focus();
        exploreModelRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [isOpen, modalConfig.highlight]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        geminiConfig: localGeminiConfig,
        minSearchVolume: localMinSearchVolume,
        keywordLimit: localKeywordLimit,
        adsAccountId: localAdsId,
        devToken: localDevToken,
        spreadsheetUrl: localSpreadsheetUrl,
      });
    } catch (error) {
      console.error('Failed to save settings', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <React.Fragment>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Settings"
        maxWidth="700px"
        showCloseButton={false}
      >
        <div className="modal-body">
          {modalConfig.message && (
            <div
              className="alert alert-warning mb-4"
              style={{
                color: '#dc2626',
                background: '#fee2e2',
                padding: '10px',
                borderRadius: '6px',
                fontSize: '0.9rem',
                border: '1px solid #fca5a5',
              }}
            >
              {modalConfig.message}
            </div>
          )}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
            }}
          >
            <div className="input-group">
              <label
                style={{display: 'flex', alignItems: 'center', gap: '4px'}}
              >
                Exploration & Campaign Model
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: '1rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                  onClick={e => {
                    e.preventDefault();
                    setInfoModalOpen('exploration_model');
                  }}
                  title="Learn more about Gemini models used for exploratory analysis"
                >
                  info
                </span>
              </label>
              <div
                className="select-wrapper"
                style={
                  modalConfig.highlight === 'EXPLORE_MODEL'
                    ? {
                        border: '2px solid #dc2626',
                        borderRadius: '8px',
                        padding: '4px',
                        position: 'relative',
                      }
                    : {}
                }
              >
                <select
                  ref={exploreModelRef}
                  value={localGeminiConfig.modelId}
                  onChange={e =>
                    setLocalGeminiConfig({
                      ...localGeminiConfig,
                      modelId: e.target.value,
                    })
                  }
                >
                  <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                  <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                  <option value="gemini-3.1-flash-lite-preview">
                    Gemini 3.1 Flash Lite
                  </option>
                </select>
                {modalConfig.highlight === 'EXPLORE_MODEL' && (
                  <div
                    style={{
                      position: 'absolute',
                      right: '-60px',
                      top: '50%',
                      color: '#dc2626',
                      fontSize: '48px',
                      fontWeight: 'bold',
                      zIndex: 9999,
                      animation: 'bounceHorizontal 1s infinite ease-in-out',
                    }}
                  >
                    ←
                  </div>
                )}
              </div>
            </div>
            <div className="input-group">
              <label
                style={{display: 'flex', alignItems: 'center', gap: '4px'}}
              >
                Insights Model
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: '1rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                  onClick={e => {
                    e.preventDefault();
                    setInfoModalOpen('insights_model');
                  }}
                  title="Learn more about Gemini models used for generating insights"
                >
                  info
                </span>
              </label>
              <div
                className="select-wrapper"
                style={
                  modalConfig.highlight === 'INSIGHTS_MODEL'
                    ? {
                        border: '2px solid #dc2626',
                        borderRadius: '8px',
                        padding: '4px',
                        position: 'relative',
                      }
                    : {}
                }
              >
                <select
                  ref={insightsModelRef}
                  value={
                    localGeminiConfig.insightsModelId ||
                    'gemini-3.1-pro-preview'
                  }
                  onChange={e =>
                    setLocalGeminiConfig({
                      ...localGeminiConfig,
                      insightsModelId: e.target.value,
                    })
                  }
                >
                  <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                  <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                  <option value="gemini-3.1-flash-lite-preview">
                    Gemini 3.1 Flash Lite
                  </option>
                </select>
                {modalConfig.highlight === 'INSIGHTS_MODEL' && (
                  <div
                    style={{
                      position: 'absolute',
                      right: '-60px',
                      top: '50%',
                      color: '#dc2626',
                      fontSize: '48px',
                      fontWeight: 'bold',
                      zIndex: 9999,
                      animation: 'bounceHorizontal 1s infinite ease-in-out',
                    }}
                  >
                    ←
                  </div>
                )}
              </div>
            </div>
          </div>

          {(!localGeminiConfig.modelId?.includes('pro') ||
            (localGeminiConfig.insightsModelId &&
              !localGeminiConfig.insightsModelId.includes('pro'))) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                background: '#fef9c3',
                border: '1px solid #fef08a',
                color: '#854d0e',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '0.9rem',
                lineHeight: '1.4',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{color: '#ca8a04', flexShrink: 0}}
              >
                warning
              </span>
              <div>
                Flash models are not recommended for analysis (Explore,
                Insights, and Campaigns) due to complexity and volume. They
                should only be used for demonstration purposes.
              </div>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
            }}
          >
            <div className="input-group">
              <label
                style={{display: 'flex', alignItems: 'center', gap: '4px'}}
              >
                Image Model
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: '1rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                  onClick={e => {
                    e.preventDefault();
                    setInfoModalOpen('image_model');
                  }}
                  title="Learn more about Gemini models used for generating images"
                >
                  info
                </span>
              </label>
              <div className="select-wrapper">
                <select
                  value={
                    localGeminiConfig.imageModelId ||
                    'gemini-3.1-flash-image-preview'
                  }
                  onChange={e =>
                    setLocalGeminiConfig({
                      ...localGeminiConfig,
                      imageModelId: e.target.value,
                    })
                  }
                >
                  <option value="gemini-3.1-flash-image-preview">
                    Gemini 3.1 Flash Image
                  </option>
                  <option value="gemini-3-pro-image-preview">
                    Gemini 3 Pro Image
                  </option>
                </select>
              </div>
            </div>
            <div className="input-group">
              <label
                style={{display: 'flex', alignItems: 'center', gap: '4px'}}
              >
                Location
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: '1rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                  onClick={e => {
                    e.preventDefault();
                    setInfoModalOpen('location');
                  }}
                  title="Learn more about Vertex AI region locations"
                >
                  info
                </span>
              </label>
              <input
                type="text"
                value={localGeminiConfig.location || 'global'}
                onChange={e =>
                  setLocalGeminiConfig({
                    ...localGeminiConfig,
                    location: e.target.value,
                  })
                }
                placeholder="e.g. global, us-central1, europe-west3"
              />
            </div>
          </div>

          <hr
            style={{
              margin: '20px 0',
              border: '0',
              borderTop: '1px solid var(--border-color)',
            }}
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
            }}
          >
            <div className="input-group">
              <label
                style={{display: 'flex', alignItems: 'center', gap: '4px'}}
              >
                Min Search Volume
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: '1rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                  onClick={e => {
                    e.preventDefault();
                    setInfoModalOpen('min_search_volume');
                  }}
                  title="Keywords below this search volume are skipped for clustering and analysis."
                >
                  info
                </span>
              </label>
              <input
                type="number"
                value={localMinSearchVolume}
                onChange={e => setLocalMinSearchVolume(Number(e.target.value))}
                placeholder="100"
              />
            </div>

            <div className="input-group">
              <label
                style={{display: 'flex', alignItems: 'center', gap: '4px'}}
              >
                Keyword Limit
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: '1rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                  onClick={e => {
                    e.preventDefault();
                    setInfoModalOpen('keyword_limit');
                  }}
                  title="Controls the max number of keywords shown in explore and used for clustering."
                >
                  info
                </span>
              </label>
              <input
                type="number"
                value={localKeywordLimit}
                onChange={e => setLocalKeywordLimit(Number(e.target.value))}
                placeholder="5000"
              />
            </div>
          </div>

          <div className="input-group" style={{marginTop: '16px'}}>
            <label>Export Spreadsheet URL</label>
            <input
              type="text"
              value={localSpreadsheetUrl}
              onChange={e => setLocalSpreadsheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
            />
            <div className="text-sm text-muted mt-1">
              Note: The spreadsheet must be shared with{' '}
              <strong>{USER_EMAIL}</strong> with edit permissions.
            </div>
          </div>

          <hr
            style={{
              margin: '20px 0',
              border: '0',
              borderTop: '1px solid var(--border-color)',
            }}
          />
          <div className="input-group">
            <label>Application Data</label>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              <button
                className="btn"
                onClick={() => {
                  onClearCache();
                  onClose();
                }}
                style={{
                  width: '40px',
                  height: '40px',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f3f4f6',
                  color: '#4b5563',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  flexShrink: 0,
                }}
                title="Clear Cache"
              >
                <span
                  className="material-symbols-outlined"
                  style={{fontSize: '1.2rem'}}
                >
                  delete_outline
                </span>
              </button>
              <div className="text-sm text-muted">
                Removes all locally saved data and resets the application state.
              </div>
            </div>
          </div>

          <hr
            style={{
              margin: '20px 0',
              border: '0',
              borderTop: '1px solid var(--border-color)',
            }}
          />

          {!configStatus.hasEnvAdsCredentials && (
            <details
              className="advanced-settings"
              open={!!modalConfig.highlight}
              style={{
                background: 'var(--bg-color)',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
              }}
            >
              <summary
                style={{
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{fontSize: '1.2rem'}}
                >
                  expand_more
                </span>
                <span
                  className="material-symbols-outlined"
                  style={{fontSize: '1.2rem'}}
                >
                  settings
                </span>
                Advanced Settings
              </summary>
              <div className="mt-4">
                <div className="input-group">
                  <label
                    style={{display: 'flex', alignItems: 'center', gap: '4px'}}
                  >
                    Ads Account ID
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: '1rem',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                      onClick={e => {
                        e.preventDefault();
                        setInfoModalOpen('ads_account_id');
                      }}
                      title="Learn more about the Google Ads Account ID"
                    >
                      info
                    </span>
                  </label>
                  <div
                    style={
                      modalConfig.highlight === 'ADS_ACCOUNT_ID' ||
                      modalConfig.highlight === 'BOTH'
                        ? {
                            border: '2px solid #dc2626',
                            borderRadius: '8px',
                            padding: '4px',
                            position: 'relative',
                          }
                        : {}
                    }
                  >
                    <input
                      ref={adsInputRef}
                      type="text"
                      value={localAdsId}
                      onChange={e => setLocalAdsId(e.target.value)}
                      placeholder="e.g. 123-456-7890"
                      style={{width: '100%', boxSizing: 'border-box'}}
                    />
                    {(modalConfig.highlight === 'ADS_ACCOUNT_ID' ||
                      modalConfig.highlight === 'BOTH') && (
                      <div
                        style={{
                          position: 'absolute',
                          right: '-60px',
                          top: '50%',
                          color: '#dc2626',
                          fontSize: '48px',
                          fontWeight: 'bold',
                          zIndex: 9999,
                          animation: 'bounceHorizontal 1s infinite ease-in-out',
                        }}
                      >
                        ←
                      </div>
                    )}
                  </div>
                </div>
                <div className="input-group">
                  <label
                    style={{display: 'flex', alignItems: 'center', gap: '4px'}}
                  >
                    Developer Token
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: '1rem',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                      onClick={e => {
                        e.preventDefault();
                        setInfoModalOpen('developer_token');
                      }}
                      title="Learn more about the Google Ads Developer Token"
                    >
                      info
                    </span>
                  </label>
                  <div
                    style={
                      modalConfig.highlight === 'DEVELOPER_TOKEN' ||
                      modalConfig.highlight === 'BOTH'
                        ? {
                            border: '2px solid #dc2626',
                            borderRadius: '8px',
                            padding: '4px',
                            position: 'relative',
                          }
                        : {}
                    }
                  >
                    <input
                      type="text"
                      value={localDevToken}
                      onChange={e => setLocalDevToken(e.target.value)}
                      placeholder={
                        configStatus.hasDeveloperToken
                          ? 'Token is set (hidden for safety). Type to update.'
                          : 'Enter Developer Token'
                      }
                      style={{width: '100%', boxSizing: 'border-box'}}
                    />
                    {(modalConfig.highlight === 'DEVELOPER_TOKEN' ||
                      modalConfig.highlight === 'BOTH') && (
                      <div
                        style={{
                          position: 'absolute',
                          right: '-60px',
                          top: '50%',
                          color: '#dc2626',
                          fontSize: '48px',
                          fontWeight: 'bold',
                          zIndex: 9999,
                          animation: 'bounceHorizontal 1s infinite ease-in-out',
                        }}
                      >
                        ←
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </details>
          )}
          <div
            className="modal-actions"
            style={{justifyContent: 'space-between', alignItems: 'center'}}
          >
            <div style={{fontSize: '0.8rem', color: '#9ca3af'}}>
              Version: {APP_VERSION}
            </div>
            <div style={{display: 'flex', gap: '8px'}}>
              <button className="btn" onClick={onClose} disabled={isSaving}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {infoModalOpen && (
        <Modal
          isOpen={!!infoModalOpen}
          onClose={() => setInfoModalOpen(null)}
          title={
            {
              min_search_volume: 'Min Search Volume',
              keyword_limit: 'Keyword Limit',
              exploration_model: 'Exploration & Campaign Model',
              insights_model: 'Insights Model',
              image_model: 'Image Model',
              location: 'Location',
              ads_account_id: 'Ads Account ID',
              developer_token: 'Developer Token',
            }[infoModalOpen] || 'Settings Info'
          }
        >
          <div>
            {infoModalOpen === 'min_search_volume' && (
              <p>
                Keywords with an average monthly search volume below this
                threshold will be excluded from the analysis and clustering
                process. This helps focus the tool on higher-volume terms and
                reduces unnecessary API calls.
              </p>
            )}
            {infoModalOpen === 'keyword_limit' && (
              <p>
                Controls the maximum number of keywords shown in the explore tab
                and used for the clustering process. A higher limit provides
                more data but may take longer to process.
              </p>
            )}
            {infoModalOpen === 'exploration_model' && (
              <p>
                The Exploration & Campaign Model is used in the "Explore" and
                "Campaigns" tab to suggest related keywords, find geographic
                criteria IDs, perform intelligent clustering of keyword groups
                based on search data, and generate campaign structures.
                <br />
                <br />
                <a
                  href="https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn more about Gemini models in Vertex AI
                </a>
                .
              </p>
            )}
            {infoModalOpen === 'insights_model' && (
              <p>
                The Insights Model is used in the "Insights" tab to generate the
                comprehensive marketing reports and powers the ongoing chat
                analysis functionality.
                <br />
                <br />
                <a
                  href="https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn more about Gemini models in Vertex AI
                </a>
                .
              </p>
            )}
            {infoModalOpen === 'image_model' && (
              <p>
                The Image Model is used to generate images for the agentic
                insights follow-up chat, creating visual assets directly based
                on data analysis requests.
                <br />
                <br />
                <a
                  href="https://cloud.google.com/vertex-ai/generative-ai/docs/image/overview"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn more about Imagen models in Vertex AI
                </a>
                .
              </p>
            )}
            {infoModalOpen === 'location' && (
              <p>
                This determines the Google Cloud region where the Gemini models
                are executed. It is needed to route requests to the correct
                Vertex AI endpoint.
                <br />
                <br />
                <a
                  href="https://cloud.google.com/vertex-ai/generative-ai/docs/learn/locations"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn more about Vertex AI geographic locations
                </a>
                .
              </p>
            )}
            {infoModalOpen === 'ads_account_id' && (
              <p>
                The Google Ads Account ID is required by the Google Ads API to
                fetch keyword ideas and search volume history using the Keyword
                Planner.
                <br />
                <br />
                <a
                  href="https://support.google.com/google-ads/answer/1704344"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn how to find your Google Ads Account ID
                </a>
                .
                <br />
                <br />
                <a
                  href="https://developers.google.com/google-ads/api/docs/keyword-planning/generate-keyword-ideas"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn more about the Google Ads Keyword Planner API
                </a>
                .
              </p>
            )}
            {infoModalOpen === 'developer_token' && (
              <p>
                The Developer Token provides programmatic access to the Google
                Ads API. It is strictly required to execute Keyword Planner
                volume queries.
                <br />
                <br />
                <a
                  href="https://developers.google.com/google-ads/api/docs/get-started/dev-token"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn how to obtain a Developer Token
                </a>
                .
              </p>
            )}
          </div>
        </Modal>
      )}
    </React.Fragment>
  );
};

const AdPreview = ({adData}) => {
  const [h1Index, setH1Index] = useState(0);
  const [h2Index, setH2Index] = useState(1);
  const [dIndex, setDIndex] = useState(0);

  const headlines = adData?.headlines || [];
  const descriptions = adData?.descriptions || [];

  const randomize = () => {
    if (headlines.length > 0) {
      const r1 = Math.floor(Math.random() * headlines.length);
      let r2 = Math.floor(Math.random() * headlines.length);
      // Try to get a different second headline if possible
      if (headlines.length > 1) {
        while (r2 === r1) {
          r2 = Math.floor(Math.random() * headlines.length);
        }
      }
      setH1Index(r1);
      setH2Index(r2);
    }
    if (descriptions.length > 0) {
      setDIndex(Math.floor(Math.random() * descriptions.length));
    }
  };

  useEffect(() => {
    randomize();
  }, [adData]);

  if (!adData || headlines.length === 0) return null;

  return (
    <div className="ad-preview">
      <div className="ad-url">
        <span className="ad-label">Ad</span>
        www.example.com
      </div>
      <div className="ad-headline">
        <a
          href="#"
          onClick={e => e.preventDefault()}
          style={{color: 'inherit', textDecoration: 'none'}}
        >
          {headlines[h1Index]}{' '}
          {headlines.length > 1 && `| ${headlines[h2Index]}`}
        </a>
        <div className="preview-controls">
          <button
            className="control-btn"
            onClick={randomize}
            title="Shuffle Headlines"
          >
            <span
              className="material-symbols-outlined"
              style={{fontSize: '14px'}}
            >
              shuffle
            </span>
          </button>
        </div>
      </div>
      <div className="ad-description">
        {descriptions[dIndex]}
        <div className="preview-controls">
          <button
            className="control-btn"
            onClick={randomize}
            title="Shuffle Description"
          >
            <span
              className="material-symbols-outlined"
              style={{fontSize: '14px'}}
            >
              shuffle
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

// --- tabCampaigns.html ---

const CampaignsTab = ({
  campaignSuggestions,
  setCampaignSuggestions,
  setCampaignStatus,
  brandName,
  setBrandName,
  creationKeywords,
  setCreationKeywords,
  creationResult,
  setCreationResult,
  creationAccountId,
  setCreationAccountId,
  creationInstructions,
  setCreationInstructions,
  creationPromptTemplate,
  setCreationPromptTemplate,
  creationStyleGuide,
  setCreationStyleGuide,
  showIdInfo,
  setShowIdInfo,
  showBrandInfo,
  setShowBrandInfo,
  showInstructionsInfo,
  setShowInstructionsInfo,
  isGeneratingPrompt,
  isCreatingCampaign,
  generatePrompt,
  generateNewCampaigns,
  campaignStatus,
  isGeneratingCampaigns,
  generateCampaignSuggestions,
  handleDownloadCampaigns,
  handleExportCampaignsToSheet,
  isExporting,
  GOOGLE_ADS_ID_HELP_URL,
  creationLookbackDays,
  setCreationLookbackDays,
  creationMetric,
  setCreationMetric,
  geminiConfig,
  onOpenSettings,
}) => {
  const campaignModelId = geminiConfig?.modelId || 'gemini-3.1-pro-preview';
  const campaignModelName = MODEL_NAMES?.[campaignModelId] || campaignModelId;

  return (
    <div className="card fade-in">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
          <h2 style={{marginBottom: 0}}>Campaigns</h2>
          <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
            Model: {campaignModelName} (
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                onOpenSettings('EXPLORE_MODEL');
              }}
              style={{color: 'var(--primary)', textDecoration: 'none'}}
            >
              change
            </a>
            )
            {!campaignModelId?.includes('pro') && (
              <span
                style={{
                  color: '#ca8a04',
                  marginLeft: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#fef9c3',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid #fef08a',
                }}
                title="Flash models are not recommended for analysis. They should only be used for demonstration purposes."
              >
                <span
                  className="material-symbols-outlined"
                  style={{fontSize: '12px'}}
                >
                  warning
                </span>
                Please consider using pro models
              </span>
            )}
          </div>
        </div>
        <button
          className="header-action-btn"
          onClick={() => {
            setCampaignSuggestions('');
            setCampaignStatus('');
            setBrandName('');
            setCreationKeywords('');
            setCreationResult('');
            setCreationAccountId('');
            setCreationInstructions('');
            setCreationPromptTemplate('');
          }}
          title="Reset Campaign Suggestions"
        >
          <span
            className="material-symbols-outlined"
            style={{fontSize: '1.2rem'}}
          >
            delete_outline
          </span>
        </button>
      </div>

      <div className="grid-2">
        <div className="input-group" style={{position: 'relative'}}>
          <label>
            Google Ads Account ID (Optional)
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '16px',
                marginLeft: '6px',
                verticalAlign: 'middle',
                cursor: 'pointer',
                color: 'var(--primary)',
              }}
              onClick={() => setShowIdInfo(true)}
            >
              info
            </span>
          </label>
          <input
            type="text"
            value={creationAccountId}
            onChange={e => setCreationAccountId(e.target.value)}
            placeholder="123-456-7890"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-color)',
              fontFamily: 'inherit',
              fontSize: '0.95rem',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div className="input-group">
          <label>
            Brand Name (optional)
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '16px',
                marginLeft: '6px',
                verticalAlign: 'middle',
                cursor: 'pointer',
                color: 'var(--primary)',
              }}
              onClick={() => setShowBrandInfo(true)}
            >
              info
            </span>
          </label>
          <input
            type="text"
            value={brandName}
            onChange={e => setBrandName(e.target.value)}
            placeholder="My Brand"
          />
        </div>
      </div>

      <details className="mb-4">
        <summary className="cursor-pointer text-sm font-medium text-primary">
          Advanced Configuration
        </summary>
        <div className="mt-4">
          <div
            className="mb-4"
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
            }}
          >
            <button
              className="btn btn-primary"
              onClick={generatePrompt}
              disabled={isGeneratingPrompt || isCreatingCampaign}
            >
              {isGeneratingPrompt ? (
                <>
                  <div
                    className="spinner"
                    style={{width: '16px', height: '16px'}}
                  ></div>
                  Generating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">refresh</span>
                  Re-create Prompt Template
                </>
              )}
            </button>
          </div>
          <InputField
            type="textarea"
            label="Prompt Template"
            value={creationPromptTemplate}
            onChange={setCreationPromptTemplate}
            rows={6}
          />
          <InputField
            type="textarea"
            label="Style Guide"
            value={creationStyleGuide}
            onChange={setCreationStyleGuide}
            rows={6}
          />

          <div className="grid-2 mt-4">
            <InputField
              type="number"
              label="Lookback Window (Days)"
              value={creationLookbackDays}
              onChange={val => setCreationLookbackDays(Number(val))}
              placeholder="30"
            />
            <div className="input-group">
              <label>Performance Metric</label>
              <div className="select-wrapper">
                <select
                  value={creationMetric}
                  onChange={e => setCreationMetric(e.target.value)}
                >
                  <option value="clicks">Clicks</option>
                  <option value="impressions">Impressions</option>
                  <option value="conversions">Conversions</option>
                  <option value="cost_micros">Cost</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </details>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '16px',
        }}
      >
        <button
          className="btn btn-primary"
          onClick={generateCampaignSuggestions}
          disabled={isGeneratingCampaigns}
        >
          {isGeneratingCampaigns ? (
            <>
              <div className="spinner"></div>{' '}
              {campaignStatus || 'Generating...'}
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">campaign</span>{' '}
              Generate Suggestions
            </>
          )}
        </button>
        <div style={{display: 'flex', gap: '8px'}}>
          {campaignSuggestions && (
            <button
              className="btn btn-secondary"
              onClick={handleDownloadCampaigns}
              style={{
                background: 'var(--surface-color)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
              }}
              title="Download Markdown"
            >
              <span className="material-symbols-outlined">download</span>
            </button>
          )}
          {campaignSuggestions && (
            <button
              className="btn btn-secondary"
              onClick={handleExportCampaignsToSheet}
              style={{
                background: 'var(--surface-color)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
              }}
              disabled={isExporting}
              title="Export to Sheet"
            >
              {isExporting ? (
                <div
                  className="spinner"
                  style={{
                    borderColor: 'rgba(37, 99, 235, 0.3)',
                    borderTopColor: '#2563eb',
                  }}
                ></div>
              ) : (
                <span className="material-symbols-outlined">table</span>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 mt-4">
        <h3>Suggestions</h3>
        {Array.isArray(campaignSuggestions) ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            {campaignSuggestions.map((campaign, cIdx) => (
              <div
                key={cIdx}
                className="card"
                style={{borderLeft: '4px solid var(--primary)'}}
              >
                <h4 style={{marginBottom: '16px', fontSize: '1.1rem'}}>
                  Campaign: {campaign.campaignName}
                </h4>
                {campaign.adGroups &&
                  campaign.adGroups.map((adGroup, gIdx) => (
                    <div
                      key={gIdx}
                      style={{
                        marginLeft: '16px',
                        marginBottom: '16px',
                      }}
                    >
                      <div
                        style={{
                          marginBottom: '8px',
                          fontWeight: '500',
                        }}
                      >
                        Ad Group: {adGroup.name}
                      </div>
                      {adGroup.keywords && (
                        <div
                          style={{
                            fontSize: '0.9rem',
                            color: 'var(--text-secondary)',
                            marginBottom: '12px',
                          }}
                        >
                          <strong>Keywords:</strong>{' '}
                          {adGroup.keywords.join(', ')}
                        </div>
                      )}
                      <div
                        style={{
                          display: 'grid',
                          gap: '12px',
                          gridTemplateColumns:
                            'repeat(auto-fill, minmax(300px, 1fr))',
                        }}
                      >
                        {adGroup.ads &&
                          adGroup.ads.map((ad, aIdx) => (
                            <AdPreview key={aIdx} adData={ad} />
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        ) : (
          <div dangerouslySetInnerHTML={{__html: campaignSuggestions}} />
        )}
      </div>

      <hr
        style={{
          margin: '32px 0',
          borderTop: '1px solid var(--border-color)',
        }}
      />

      <h3>Creation</h3>

      <InputField
        label="Campaign Keywords"
        value={creationKeywords}
        onChange={setCreationKeywords}
        placeholder="keyword1, keyword2"
      />

      <InputField
        type="textarea"
        label={
          <>
            Instructions
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '16px',
                marginLeft: '6px',
                verticalAlign: 'middle',
                cursor: 'pointer',
                color: 'var(--primary)',
              }}
              onClick={() => setShowInstructionsInfo(true)}
            >
              info
            </span>
          </>
        }
        value={creationInstructions}
        onChange={setCreationInstructions}
        placeholder="Your additional instructions (e.g. Created ads in German)."
        rows={3}
      />

      <div className="mt-4">
        <button
          className="btn btn-primary"
          onClick={generateNewCampaigns}
          disabled={isCreatingCampaign || isGeneratingPrompt}
        >
          {isCreatingCampaign ? (
            <>
              <div className="spinner"></div>
              {creationResult && creationResult.startsWith('Generating')
                ? creationResult
                : 'Creating...'}
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">add_circle</span>
              Generate Ad
            </>
          )}
        </button>
      </div>

      {creationResult && !creationResult.startsWith('Generating') && (
        <div className="mt-4">
          {(() => {
            try {
              const data = JSON.parse(creationResult);
              if (Array.isArray(data)) {
                return (
                  <div
                    className="grid-2"
                    style={{
                      gridTemplateColumns:
                        'repeat(auto-fit, minmax(300px, 1fr))',
                      gap: '24px',
                    }}
                  >
                    {data.map((ad, i) => (
                      <div key={i}>
                        <h4
                          style={{
                            marginBottom: '12px',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          Option {i + 1}
                        </h4>
                        <AdPreview adData={ad} />
                      </div>
                    ))}
                  </div>
                );
              }
              return <AdPreview adData={data} />;
            } catch (e) {
              return (
                <pre className="p-4 bg-gray-100 rounded overflow-auto">
                  {creationResult}
                </pre>
              );
            }
          })()}
        </div>
      )}

      <Modal
        isOpen={showIdInfo}
        onClose={() => setShowIdInfo(false)}
        title="Google Ads Account ID"
      >
        <div className="modal-body">
          <p>
            This will be used to tailor the campaigns to the best performing
            ones in the account.
          </p>
          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              marginTop: '10px',
            }}
          >
            <strong>Requirements:</strong> The account must be a non-manager
            account and have active Search campaigns with Responsive Search Ads
            (RSA) and keywords that have performance data (e.g. clicks,
            impressions) within the specified lookback window.
          </p>
          <p>
            <a
              href={GOOGLE_ADS_ID_HELP_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Find your ID
            </a>
          </p>
          <div className="modal-actions">
            <button
              className="btn btn-primary"
              onClick={() => setShowIdInfo(false)}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={showBrandInfo}
        onClose={() => setShowBrandInfo(false)}
        title="Brand Name"
      >
        <div className="modal-body">
          <p>
            This information will be included in the campaign suggestions to
            make it more tailored to your brand.
          </p>
          <div className="modal-actions">
            <button
              className="btn btn-primary"
              onClick={() => setShowBrandInfo(false)}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={showInstructionsInfo}
        onClose={() => setShowInstructionsInfo(false)}
        title="Instructions"
      >
        <div className="modal-body">
          <p>
            You can provide custom instructions like specific languages, tone of
            voice, or other company marketing guidelines that the model should
            follow when generating campaign suggestions.
          </p>
          <div className="modal-actions">
            <button
              className="btn btn-primary"
              onClick={() => setShowInstructionsInfo(false)}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// --- tabExplore.html ---

const ExploreTab = ({
  keywords,
  setKeywords,
  runExplore,
  stopExplore,
  isExploring,
  exploreStatus,
  ideasData,
  setIdeasData,
  setClusters,
  setRelevantIdeas,
  setChartLabels,
  setSelectedCluster,
  language,
  setLanguage,
  country,
  setCountry,
  continent,
  setContinent,
  continentOptions,
  customLanguages,
  customCountries,
  handleCustomOption,
  promptTemplate,
  setPromptTemplate,
  seedChartData,
  clusters,
  growthMetric,
  setGrowthMetric,
  handleDownloadExplore,
  handleExportExploreToSheet,
  isExporting,
  clustersChartData,
  bubbleChartOptions,
  selectedCluster,
  selectedClusterChartData,
  chartLabels,
  relevantIdeas,
  useKeywordPlanner,
  setUseKeywordPlanner,
  useGemini,
  setUseGemini,
  geminiPrompt,
  setGeminiPrompt,
  useClustering,
  setUseClustering,
  highlightKeywordSources,
  setHighlightKeywordSources,
  theme,
  geminiConfig,
  onOpenSettings,
}) => {
  const palette = theme === 'dark' ? DARK_MODE_PALETTE : COLOR_PALETTE;
  const textColor = theme === 'dark' ? '#f1f5f9' : '#1e293b';
  const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0';

  const searchVolumeDisclaimer = (
    <div
      style={{
        padding: '0 1rem 1rem',
        fontSize: '0.8rem',
        color: 'var(--text-secondary)',
        marginTop: '8px',
        textAlign: 'center',
      }}
    >
      * Search Volume is from the previous full month only and is limited by the{' '}
      <a
        href="https://developers.google.com/google-ads/api/docs/keyword-planning/generate-historical-metrics"
        target="_blank"
        rel="noopener noreferrer"
        style={{color: 'inherit', textDecoration: 'underline'}}
      >
        Historical Metrics
      </a>{' '}
      endpoint from the Google Ads API.
    </div>
  );

  const promptCustomizationNote = promptName => (
    <p>
      The {promptName} can be customized to your needs. Any changes you make are
      stored locally in your browser and will only affect your current session,
      not other users of the application.
    </p>
  );

  const filteredCountries = useMemo(() => {
    if (continent === 'Custom Locations') {
      return customCountries;
    }
    const countriesForContinent = REGION_MAP[continent] || [];
    return countriesForContinent;
  }, [continent, customCountries]);

  const [activeInfoModal, setActiveInfoModal] = useState(null);
  const detailsRef = useRef(null);

  useEffect(() => {
    if (highlightKeywordSources && detailsRef.current) {
      detailsRef.current.open = true;
    }
  }, [highlightKeywordSources]);

  // Keyword Table State
  const [sortConfig, setSortConfig] = useState({
    key: 'latest_vs_max',
    direction: 'descending',
  });
  const [filters, setFilters] = useState({keyword: '', minVolume: ''});
  const [expandedIdea, setExpandedIdea] = useState(null);
  const lastAutoExpandedDataRef = useRef(null);

  const [activeMetrics, setActiveMetrics] = useStickyState(
    ['latest_vs_max', 'yoy', 'mom'],
    'giga_activeMetrics',
  );
  const [isMetricsDropdownOpen, setIsMetricsDropdownOpen] = useState(false);
  const metricsDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = event => {
      if (
        metricsDropdownRef.current &&
        !metricsDropdownRef.current.contains(event.target)
      ) {
        setIsMetricsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const requestSort = key => {
    let direction = 'descending';
    if (sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = 'ascending';
    }
    setSortConfig({key, direction});
  };

  const getSortIndicator = key => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
  };

  const processedIdeas = useMemo(() => {
    if (!ideasData) return [];
    return ideasData;
  }, [ideasData]);

  const filteredIdeas = useMemo(() => {
    return processedIdeas.filter(item => {
      if (
        filters.keyword &&
        !item.text.toLowerCase().includes(filters.keyword.toLowerCase())
      ) {
        return false;
      }
      if (
        filters.minVolume !== '' &&
        (item.latestSearchVolume || 0) < Number(filters.minVolume)
      ) {
        return false;
      }
      return true;
    });
  }, [processedIdeas, filters]);

  const sortedIdeas = useMemo(() => {
    let sortableItems = [...filteredIdeas];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue, bValue;
        if (sortConfig.key === 'competition') {
          aValue =
            a.competition_index != null ? Number(a.competition_index) : null;
          bValue =
            b.competition_index != null ? Number(b.competition_index) : null;
        } else if (
          [
            'low_top_of_page_bid_micros',
            'high_top_of_page_bid_micros',
            'average_cpc_micros',
          ].includes(sortConfig.key)
        ) {
          aValue = a[sortConfig.key] != null ? Number(a[sortConfig.key]) : null;
          bValue = b[sortConfig.key] != null ? Number(b[sortConfig.key]) : null;
        } else if (sortConfig.key === 'yoy') {
          aValue = a.growthYoY;
          bValue = b.growthYoY;
        } else if (sortConfig.key === 'mom') {
          aValue = a.growthMoM;
          bValue = b.growthMoM;
        } else if (sortConfig.key === 'latest_vs_avg') {
          aValue = a.growthLatestVsAvg;
          bValue = b.growthLatestVsAvg;
        } else if (sortConfig.key === 'latest_vs_max') {
          aValue = a.growthLatestVsMax;
          bValue = b.growthLatestVsMax;
        } else if (sortConfig.key === 'three_months_vs_avg') {
          aValue = a.growthThreeMonthsVsAvg;
          bValue = b.growthThreeMonthsVsAvg;
        } else if (sortConfig.key === 'growth') {
          // Fallback for default sort which is just 'growth' initially
          const defaultMetric = activeMetrics[0] || 'yoy';
          if (defaultMetric === 'yoy') {
            aValue = a.growthYoY;
            bValue = b.growthYoY;
          } else if (defaultMetric === 'mom') {
            aValue = a.growthMoM;
            bValue = b.growthMoM;
          } else if (defaultMetric === 'latest_vs_avg') {
            aValue = a.growthLatestVsAvg;
            bValue = b.growthLatestVsAvg;
          } else if (defaultMetric === 'latest_vs_max') {
            aValue = a.growthLatestVsMax;
            bValue = b.growthLatestVsMax;
          } else if (defaultMetric === 'three_months_vs_avg') {
            aValue = a.growthThreeMonthsVsAvg;
            bValue = b.growthThreeMonthsVsAvg;
          }
        } else {
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
        }

        if (aValue == null) return 1;
        if (bValue == null) return -1;

        if (aValue < bValue)
          return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue)
          return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredIdeas, sortConfig, growthMetric]);

  useEffect(() => {
    if (ideasData !== lastAutoExpandedDataRef.current) {
      if (
        ideasData &&
        ideasData.length > 0 &&
        sortedIdeas &&
        sortedIdeas.length > 0
      ) {
        setExpandedIdea(sortedIdeas[0]);
      } else if (!ideasData) {
        setExpandedIdea(null);
      }
      lastAutoExpandedDataRef.current = ideasData;
    }
  }, [ideasData, sortedIdeas]);

  // Memoize chart options to prevent re-renders/animations
  const seedChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {boxWidth: 10, padding: 10},
        },
        tooltip: {mode: 'index', intersect: false},
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false,
      },
      scales: {
        x: {
          ticks: {color: textColor},
          grid: {color: gridColor},
        },
        y: {
          beginAtZero: true,
          ticks: {color: textColor},
          grid: {color: gridColor},
        },
      },
    }),
    [theme],
  );

  const clusterVolumeChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {display: false},
      },
      scales: {
        x: {
          ticks: {color: textColor},
          grid: {color: gridColor},
        },
        y: {
          ticks: {color: textColor},
          grid: {color: gridColor},
        },
      },
    }),
    [theme, textColor, gridColor],
  );

  const keywordVolumeChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {boxWidth: 10, padding: 10},
        },
        tooltip: {mode: 'index', intersect: false},
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false,
      },
      scales: {
        x: {
          ticks: {color: textColor},
          grid: {color: gridColor},
        },
        y: {
          beginAtZero: true,
          ticks: {color: textColor},
          grid: {color: gridColor},
        },
      },
    }),
    [theme],
  );

  const keywordVolumeChartData = useMemo(() => {
    if (!selectedCluster || !chartLabels) return null;
    return {
      labels: chartLabels,
      datasets: selectedCluster.keywords.map((k, i) => {
        const volHistory = relevantIdeas[k] ? relevantIdeas[k] : [];
        const color = palette[i % palette.length];
        return {
          label: k,
          data: volHistory.slice(),
          borderColor: color,
          backgroundColor: color,
          fill: false,
          tension: 0.3,
          pointRadius: 2,
          pointHoverRadius: 5,
        };
      }),
    };
  }, [selectedCluster, chartLabels, relevantIdeas, palette]);

  const expandedIdeaChartData = useMemo(() => {
    if (!expandedIdea || !chartLabels) return null;
    // Verify lengths match or slice
    // In ideasData, searchVolume matches months. chartLabels should match.
    return {
      labels: chartLabels,
      datasets: [
        {
          label: expandedIdea.text,
          data: expandedIdea.searchVolume,
          borderColor: palette[0],
          backgroundColor: palette[0],
          fill: false,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [expandedIdea, chartLabels, palette]);

  const exploreModelId = geminiConfig?.modelId || 'gemini-3.1-pro-preview';
  const exploreModelName = MODEL_NAMES?.[exploreModelId] || exploreModelId;

  return (
    <div className="card fade-in">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
          <h2 style={{marginBottom: 0}}>Explore trending topics</h2>
          <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
            Model: {exploreModelName} (
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                onOpenSettings('EXPLORE_MODEL');
              }}
              style={{color: 'var(--primary)', textDecoration: 'none'}}
            >
              change
            </a>
            )
            {!exploreModelId?.includes('pro') && (
              <span
                style={{
                  color: '#ca8a04',
                  marginLeft: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#fef9c3',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid #fef08a',
                }}
                title="Flash models are not recommended for analysis. They should only be used for demonstration purposes."
              >
                <span
                  className="material-symbols-outlined"
                  style={{fontSize: '12px'}}
                >
                  warning
                </span>
                Please consider using pro models
              </span>
            )}
          </div>
        </div>
        <button
          className="btn-icon"
          onClick={() => {
            setIdeasData(null);
            setKeywords('');
            setExpandedIdea(null);
            setClusters(null);
          }}
          title="Reset Explore Data"
        >
          <span
            className="material-symbols-outlined"
            style={{fontSize: '1.2rem'}}
          >
            delete_outline
          </span>
        </button>
      </div>
      <ChipsInput
        label={
          <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
            Seed Keywords
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '1rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                setActiveInfoModal('seed_keywords');
              }}
            >
              info
            </span>
          </div>
        }
        value={
          keywords
            ? keywords
                .split(',')
                .map(s => s.trim())
                .filter(s => s)
            : []
        }
        onChange={chips => setKeywords(chips.join(', '))}
        placeholder="Type keywords (Enter/Tab to add). Press Enter again to start."
        onKeyDown={(e, newChips) => {
          if (e.key === 'Enter') {
            const keywordsToRun = newChips ? newChips.join(', ') : keywords;
            runExplore(keywordsToRun);
          }
        }}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '16px',
          marginBottom: '16px',
        }}
      >
        <SelectField
          label={
            <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
              Language
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: '1rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveInfoModal('language_info');
                }}
              >
                info
              </span>
            </div>
          }
          value={language}
          onChange={setLanguage}
          options={[
            ...LANGUAGES,
            ...customLanguages.map(l => ({...l, isCustom: true})),
          ].sort((a, b) => a.name.localeCompare(b.name))}
          onCustomOption={() => handleCustomOption('language')}
          onDeleteOption={id => handleCustomOption('language_delete', id)}
          searchable={true}
        />
        <SelectField
          label="Continent"
          value={continent}
          onChange={setContinent}
          options={continentOptions}
        />
        <SelectField
          label={
            <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
              Location
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: '1rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveInfoModal('location_info');
                }}
              >
                info
              </span>
            </div>
          }
          value={country}
          onChange={setCountry}
          options={
            continent === 'Custom Locations'
              ? customCountries.map(c => ({...c, isCustom: true}))
              : [
                  ...filteredCountries,
                  ...customCountries.map(c => ({...c, isCustom: true})),
                ]
          }
          onCustomOption={() => handleCustomOption('country')}
          onDeleteOption={id => handleCustomOption('country_delete', id)}
        />
      </div>

      <details className="mb-4" ref={detailsRef}>
        <summary className="cursor-pointer text-sm font-medium text-primary">
          Advanced Config
        </summary>
        <div className="mt-4">
          <div className="mb-4">
            <label style={{display: 'block', marginBottom: '8px'}}>
              Keyword Sources
            </label>
            <div
              style={
                highlightKeywordSources
                  ? {
                      border: '2px solid #dc2626',
                      borderRadius: '8px',
                      padding: '4px',
                      position: 'relative',
                      width: 'fit-content',
                    }
                  : {}
              }
            >
              <div style={{display: 'flex', gap: '16px'}}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={useKeywordPlanner}
                    onChange={e => {
                      setUseKeywordPlanner(e.target.checked);
                      if (e.target.checked && highlightKeywordSources) {
                        setHighlightKeywordSources(false);
                      }
                    }}
                  />
                  Keyword Idea Service
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: '1rem',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      marginLeft: '4px',
                    }}
                    onClick={e => {
                      e.preventDefault();
                      setActiveInfoModal('keyword_planner');
                    }}
                  >
                    info
                  </span>
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={useGemini}
                    onChange={e => {
                      setUseGemini(e.target.checked);
                      if (e.target.checked && highlightKeywordSources) {
                        setHighlightKeywordSources(false);
                      }
                    }}
                  />
                  Gemini
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: '1rem',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      marginLeft: '4px',
                    }}
                    onClick={e => {
                      e.preventDefault();
                      setActiveInfoModal('gemini_source');
                    }}
                  >
                    info
                  </span>
                </label>
              </div>
              {highlightKeywordSources && (
                <div
                  style={{
                    position: 'absolute',
                    right: '-60px',
                    top: '50%',
                    color: '#dc2626',
                    fontSize: '48px',
                    fontWeight: 'bold',
                    zIndex: 9999,
                    animation: 'bounceHorizontal 1s infinite ease-in-out',
                  }}
                >
                  ←
                </div>
              )}
            </div>
            {!useKeywordPlanner && !useGemini && (
              <div
                style={{
                  color: 'var(--error)',
                  marginTop: '8px',
                  fontSize: '0.9rem',
                }}
              >
                At least one source needs to be selected.
              </div>
            )}
          </div>
          {useGemini && (
            <div className="mt-4">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <div
                  style={{display: 'flex', alignItems: 'center', gap: '4px'}}
                >
                  <label style={{margin: 0}}>Gemini Prompt</label>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: '1rem',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                    onClick={e => {
                      e.preventDefault();
                      setActiveInfoModal('gemini');
                    }}
                  >
                    info
                  </span>
                </div>
                {geminiPrompt !== DEFAULT_TRENDS_PROMPT && (
                  <button
                    onClick={() => setGeminiPrompt(DEFAULT_TRENDS_PROMPT)}
                    className="btn btn-ghost btn-sm"
                    style={{
                      padding: '2px 8px',
                      fontSize: '0.8rem',
                      fontWeight: 'normal',
                    }}
                  >
                    ⟳ Reset to default
                  </button>
                )}
              </div>
              <InputField
                type="textarea"
                value={geminiPrompt}
                onChange={setGeminiPrompt}
                rows={6}
              />
            </div>
          )}
          <div className="mt-4">
            <label style={{display: 'block', marginBottom: '8px'}}>
              Clustering
            </label>
            <div style={{display: 'flex', gap: '16px'}}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={useClustering}
                  onChange={e => setUseClustering(e.target.checked)}
                />
                Enable Clustering
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: '1rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    marginLeft: '4px',
                  }}
                  onClick={e => {
                    e.preventDefault();
                    setActiveInfoModal('clustering_info');
                  }}
                >
                  info
                </span>
              </label>
            </div>
          </div>
          {useClustering && (
            <div className="mt-4">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <div
                  style={{display: 'flex', alignItems: 'center', gap: '4px'}}
                >
                  <label style={{margin: 0}}>Clustering Prompt</label>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: '1rem',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                    onClick={e => {
                      e.preventDefault();
                      setActiveInfoModal('clustering_info');
                    }}
                  >
                    info
                  </span>
                </div>
                {promptTemplate !== DEFAULT_PROMPT && (
                  <button
                    onClick={() => setPromptTemplate(DEFAULT_PROMPT)}
                    className="btn btn-ghost btn-sm"
                    style={{
                      padding: '2px 8px',
                      fontSize: '0.8rem',
                      fontWeight: 'normal',
                    }}
                  >
                    ⟳ Reset to default
                  </button>
                )}
              </div>
              <InputField
                type="textarea"
                value={promptTemplate}
                onChange={setPromptTemplate}
                rows={6}
              />
            </div>
          )}
        </div>
      </details>

      <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
        <button
          className="btn btn-primary"
          onClick={runExplore}
          disabled={isExploring}
        >
          {isExploring ? (
            <>
              <div className="spinner"></div> {exploreStatus || 'Running...'}
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">rocket_launch</span>{' '}
              Start
            </>
          )}
        </button>

        {isExploring && (
          <button
            className="btn btn-secondary"
            onClick={stopExplore}
            style={{
              color: 'var(--error)',
              borderColor: 'var(--error)',
              background: 'transparent',
            }}
          >
            <span className="material-symbols-outlined">close</span> Cancel
          </button>
        )}
      </div>

      {seedChartData && (
        <div className="mt-4 card" style={{border: '1px solid var(--primary)'}}>
          <h3>Seed Keywords Search Volume</h3>
          <div style={{height: '400px'}}>
            <ChartComponent
              type="line"
              data={seedChartData}
              options={seedChartOptions}
              theme={theme}
            />
          </div>
          {searchVolumeDisclaimer}
        </div>
      )}

      {(clusters || (ideasData && ideasData.length > 0)) && (
        <div
          className="mt-4"
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          <div>
            {useClustering && clusters && (
              <>
                <button
                  className="btn btn-secondary"
                  onClick={handleDownloadExplore}
                  title="Download CSV"
                >
                  <span className="material-symbols-outlined">download</span>
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleExportExploreToSheet}
                  style={{
                    marginLeft: '8px',
                  }}
                  disabled={isExporting}
                  title="Export to Sheet"
                >
                  {isExporting ? (
                    <div
                      className="spinner"
                      style={{
                        borderColor: 'rgba(37, 99, 235, 0.3)',
                        borderTopColor: '#2563eb',
                      }}
                    ></div>
                  ) : (
                    <span className="material-symbols-outlined">table</span>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {useClustering && clustersChartData && (
        <div className="mt-4">
          <h3>Clusters</h3>
          <div style={{marginBottom: '8px', width: '250px'}}>
            <SelectField
              label="Growth metric for clustering"
              value={growthMetric}
              onChange={setGrowthMetric}
              options={GROWTH_METRICS}
            />
          </div>
          <div className="text-sm text-muted mb-2">
            Click on a bubble to view details
          </div>
          <div style={{height: '400px'}}>
            <ChartComponent
              type="bubble"
              data={clustersChartData}
              options={bubbleChartOptions}
              theme={theme}
            />
          </div>
          {searchVolumeDisclaimer}
        </div>
      )}

      {useClustering && selectedCluster && selectedClusterChartData && (
        <div
          id="cluster-details"
          className="mt-4 card"
          style={{border: '1px solid var(--primary)'}}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3>Details: {selectedCluster.topic}</h3>
            <button
              onClick={() => setSelectedCluster(null)}
              className="btn"
              style={{padding: '4px 8px'}}
            >
              &times;
            </button>
          </div>
          <div className="grid-2">
            <div>
              <strong>Total Volume:</strong>{' '}
              {selectedCluster.searchVolume.toLocaleString()}
            </div>
            <div>
              <strong>
                {GROWTH_METRICS.find(m => m.id === growthMetric)?.name ||
                  'Growth'}
                :
              </strong>{' '}
              {(() => {
                let val = 0;
                if (growthMetric === 'yoy')
                  val =
                    selectedCluster.growthYoY ||
                    selectedCluster.yearOverYearGrowth ||
                    0;
                else if (growthMetric === 'mom')
                  val = selectedCluster.growthMoM || 0;
                else if (growthMetric === 'latest_vs_avg')
                  val = selectedCluster.growthLatestVsAvg || 0;
                else if (growthMetric === 'latest_vs_max')
                  val = selectedCluster.growthLatestVsMax || 0;
                else if (growthMetric === 'three_months_vs_avg')
                  val = selectedCluster.growthThreeMonthsVsAvg || 0;
                return (
                  <span
                    style={{
                      color:
                        val > 0
                          ? 'var(--success)'
                          : val < 0
                            ? 'var(--error)'
                            : 'inherit',
                    }}
                  >
                    {val > 0 ? '+' : ''}
                    {(val * 100).toFixed(0)}%
                  </span>
                );
              })()}
            </div>
          </div>
          <div className="mt-4">
            <h4>Cluster Search Volume</h4>
            <div style={{height: '300px'}}>
              <ChartComponent
                type="line"
                data={selectedClusterChartData}
                options={clusterVolumeChartOptions}
                theme={theme}
              />
            </div>
          </div>
          <div className="mt-4">
            <h4>Keyword Search Volume</h4>
            <div style={{height: '400px'}}>
              <ChartComponent
                type="line"
                data={keywordVolumeChartData}
                options={keywordVolumeChartOptions}
                theme={theme}
              />
            </div>
          </div>
        </div>
      )}

      {ideasData && ideasData.length > 0 && (
        <div
          className="mt-4 card"
          style={{border: '1px solid var(--border-color)'}}
        >
          <h3>All Keywords ({ideasData.length})</h3>
          <div
            style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start',
              marginBottom: '1rem',
            }}
          >
            <div style={{flex: 1}}>
              <InputField
                label="Filter by Keyword"
                value={filters.keyword}
                onChange={val => setFilters(prev => ({...prev, keyword: val}))}
                placeholder="Search..."
              />
            </div>
            <div style={{flex: 1}}>
              <div className="input-group">
                <label>Growth Metrics</label>
                <div style={{position: 'relative'}} ref={metricsDropdownRef}>
                  <div
                    style={{
                      padding: '8px 12px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      background: 'var(--surface-color)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      color: 'var(--text-main)',
                      minHeight: '38px',
                      boxSizing: 'border-box',
                    }}
                    onClick={() =>
                      setIsMetricsDropdownOpen(!isMetricsDropdownOpen)
                    }
                  >
                    <span>{activeMetrics.length} selected</span>
                    <span
                      className="material-symbols-outlined"
                      style={{fontSize: '1.2rem'}}
                    >
                      {isMetricsDropdownOpen ? 'expand_less' : 'expand_more'}
                    </span>
                  </div>
                  {isMetricsDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '4px',
                        background: 'var(--surface-color)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        boxShadow: 'var(--shadow-md)',
                        zIndex: 10,
                        maxHeight: '250px',
                        overflowY: 'auto',
                        padding: '8px 0',
                      }}
                    >
                      {GROWTH_METRICS.map(m => (
                        <label
                          key={m.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            gap: '8px',
                            margin: 0,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={activeMetrics.includes(m.id)}
                            onChange={e => {
                              if (e.target.checked) {
                                setActiveMetrics([...activeMetrics, m.id]);
                              } else {
                                if (activeMetrics.length > 1) {
                                  setActiveMetrics(
                                    activeMetrics.filter(id => id !== m.id),
                                  );
                                }
                              }
                            }}
                          />
                          <span style={{color: 'var(--text-main)'}}>
                            {m.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div style={{width: '150px'}}>
              <InputField
                type="number"
                label="Min Volume"
                value={filters.minVolume}
                onChange={val =>
                  setFilters(prev => ({...prev, minVolume: val}))
                }
                placeholder="e.g. 100"
              />
            </div>
          </div>
          <div style={{overflowX: 'auto'}}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '10px',
                fontSize: '0.9rem',
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '2px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '8px',
                      cursor: 'pointer',
                    }}
                    onClick={() => requestSort('text')}
                  >
                    Keyword{getSortIndicator('text')}
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: '8px',
                      cursor: 'pointer',
                    }}
                    onClick={() => requestSort('latestSearchVolume')}
                  >
                    Search Vol{getSortIndicator('latestSearchVolume')}
                  </th>
                  {activeMetrics.map(metricId => (
                    <th
                      key={metricId}
                      style={{
                        textAlign: 'right',
                        padding: '8px',
                        cursor: 'pointer',
                        minWidth: '100px',
                      }}
                      onClick={() => requestSort(metricId)}
                    >
                      {GROWTH_METRICS.find(m => m.id === metricId)?.name ||
                        metricId}
                      {getSortIndicator(metricId)}
                    </th>
                  ))}
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '8px',
                      cursor: 'pointer',
                    }}
                    onClick={() => requestSort('competition')}
                  >
                    Competition{getSortIndicator('competition')}
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: '8px',
                      cursor: 'pointer',
                    }}
                    onClick={() => requestSort('low_top_of_page_bid_micros')}
                  >
                    Low Bid
                    {getSortIndicator('low_top_of_page_bid_micros')}
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: '8px',
                      cursor: 'pointer',
                    }}
                    onClick={() => requestSort('high_top_of_page_bid_micros')}
                  >
                    High Bid
                    {getSortIndicator('high_top_of_page_bid_micros')}
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: '8px',
                      cursor: 'pointer',
                    }}
                    onClick={() => requestSort('average_cpc_micros')}
                  >
                    Avg CPC{getSortIndicator('average_cpc_micros')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedIdeas.map((item, index) => {
                  const text = item.text;
                  const vol = item.latestSearchVolume;
                  const comp = item.competition;
                  const idx = item.competition_index;
                  const low = item.low_top_of_page_bid_micros;
                  const high = item.high_top_of_page_bid_micros;
                  const cpc = item.average_cpc_micros;

                  const formatMoney = micros =>
                    micros != null
                      ? (micros / 1000000).toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        })
                      : '-';

                  return (
                    <React.Fragment key={index}>
                      <tr
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          cursor: 'pointer',
                          backgroundColor:
                            expandedIdea?.text === text
                              ? 'rgba(37, 99, 235, 0.05)'
                              : 'transparent',
                        }}
                        onClick={() =>
                          setExpandedIdea(
                            expandedIdea?.text === text ? null : item,
                          )
                        }
                      >
                        <td style={{padding: '8px'}}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{
                                fontSize: '1.2rem',
                                color: 'var(--primary)',
                                transition: 'transform 0.2s',
                                transform:
                                  expandedIdea?.text === text
                                    ? 'rotate(90deg)'
                                    : 'rotate(0deg)',
                              }}
                            >
                              chevron_right
                            </span>
                            {text}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: '8px',
                            textAlign: 'right',
                          }}
                        >
                          {vol != null ? vol.toLocaleString() : '-'}
                        </td>
                        {activeMetrics.map(metricId => {
                          let growth = 0;
                          if (metricId === 'yoy') growth = item.growthYoY || 0;
                          else if (metricId === 'mom')
                            growth = item.growthMoM || 0;
                          else if (metricId === 'latest_vs_avg')
                            growth = item.growthLatestVsAvg || 0;
                          else if (metricId === 'latest_vs_max')
                            growth = item.growthLatestVsMax || 0;
                          else if (metricId === 'three_months_vs_avg')
                            growth = item.growthThreeMonthsVsAvg || 0;

                          return (
                            <td
                              key={metricId}
                              style={{
                                padding: '8px',
                                textAlign: 'right',
                                color:
                                  growth > 0
                                    ? 'var(--success)'
                                    : growth < 0
                                      ? 'var(--error)'
                                      : 'inherit',
                              }}
                            >
                              {growth > 0 ? '+' : ''}
                              {(growth * 100).toFixed(0)}%
                            </td>
                          );
                        })}
                        <td style={{padding: '8px'}}>
                          {comp ? `${comp} (${idx ?? '-'})` : '-'}
                        </td>
                        <td
                          style={{
                            padding: '8px',
                            textAlign: 'right',
                          }}
                        >
                          {formatMoney(low)}
                        </td>
                        <td
                          style={{
                            padding: '8px',
                            textAlign: 'right',
                          }}
                        >
                          {formatMoney(high)}
                        </td>
                        <td
                          style={{
                            padding: '8px',
                            textAlign: 'right',
                          }}
                        >
                          {formatMoney(cpc)}
                        </td>
                      </tr>
                      {expandedIdea?.text === text && (
                        <tr
                          style={{
                            backgroundColor: 'rgba(37, 99, 235, 0.05)',
                          }}
                        >
                          <td
                            colSpan={6 + activeMetrics.length}
                            style={{padding: '16px'}}
                          >
                            {expandedIdeaChartData ? (
                              <div>
                                <div style={{height: '300px'}}>
                                  <ChartComponent
                                    type="line"
                                    data={expandedIdeaChartData}
                                    options={{
                                      responsive: true,
                                      maintainAspectRatio: false,
                                      plugins: {
                                        legend: {display: false},
                                      },
                                      scales: {
                                        x: {
                                          ticks: {
                                            autoSkip: false,
                                          },
                                        },
                                        y: {
                                          beginAtZero: true,
                                        },
                                      },
                                    }}
                                  />
                                </div>
                                {searchVolumeDisclaimer}
                              </div>
                            ) : (
                              <div
                                className="text-muted"
                                style={{
                                  padding: '20px',
                                  background: '#f1f5f9',
                                  borderRadius: '8px',
                                  textAlign: 'center',
                                }}
                              >
                                No historical data available.
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeInfoModal && (
        <Modal
          isOpen={!!activeInfoModal}
          onClose={() => setActiveInfoModal(null)}
          title={
            {
              keyword_planner: 'Keyword Idea Service',
              gemini_source: 'Gemini',
              gemini: 'Gemini Prompt',
              seed_keywords: 'Seed Keywords',
              location_info: 'Location Settings',
              clustering_info: 'Clustering Info',
            }[activeInfoModal] || 'Language Settings'
          }
        >
          {(() => {
            switch (activeInfoModal) {
              case 'keyword_planner':
                return (
                  <div>
                    <p>
                      The{' '}
                      <a
                        href="https://developers.google.com/google-ads/api/docs/keyword-planning/generate-keyword-ideas"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{color: 'var(--primary)'}}
                      >
                        Keyword Idea Service
                      </a>{' '}
                      uses the Google Ads API to generate keyword ideas based on
                      your seed keywords, location, and language settings.
                    </p>
                  </div>
                );
              case 'gemini_source':
                return (
                  <div>
                    <p>
                      Gemini is used to generate trending keywords based on your
                      seed keywords.
                    </p>
                    <p>
                      The Google Ads{' '}
                      <a
                        href="https://developers.google.com/google-ads/api/docs/keyword-planning/generate-historical-metrics"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{color: 'var(--primary)'}}
                      >
                        Historical Metrics
                      </a>{' '}
                      service is then used to retrieve their historical search
                      volume.
                    </p>
                    <p>
                      Google Search is used for grounding to get the latest
                      trends.
                    </p>
                  </div>
                );
              case 'gemini':
                return <div>{promptCustomizationNote('Gemini Prompt')}</div>;
              case 'seed_keywords':
                return (
                  <div>
                    <p>
                      Enter one or more starting keywords here. These serve as
                      the foundation for generating new keyword ideas and
                      clusters.
                    </p>
                    <p>
                      Type keywords and press <strong>Enter</strong> or{' '}
                      <strong>Tab</strong> to add them. Press{' '}
                      <strong>Enter</strong> again to start.
                    </p>
                    <p>
                      The tool will use these seeds to find related search terms
                      and historical data to help expand your keyword research.
                    </p>
                    <div
                      style={{
                        marginTop: '1rem',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        borderTop: '1px solid var(--border-color)',
                        paddingTop: '0.5rem',
                      }}
                    >
                      <p style={{marginBottom: '4px'}}>
                        * Gemini may display inaccurate info, so double-check
                        its responses.
                      </p>
                      <p>
                        * Keyword Planner may not return results for keywords
                        that violate{' '}
                        <a
                          href="https://support.google.com/adspolicy/answer/6008942"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: 'inherit',
                            textDecoration: 'underline',
                          }}
                        >
                          Google Ads Policies
                        </a>
                        .
                      </p>
                    </div>
                  </div>
                );
              case 'location_info':
                return (
                  <div>
                    <p>
                      Select the geographic location for your keyword research.
                    </p>
                    <p>
                      The tool will only retrieve search volume and historical
                      metrics specific to this location.
                    </p>
                    <div
                      style={{
                        marginTop: '1rem',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        borderTop: '1px solid var(--border-color)',
                        paddingTop: '0.5rem',
                      }}
                    >
                      <p style={{marginBottom: '4px'}}>
                        * When adding a custom location, use city level or
                        higher (e.g., City, State, Country).
                      </p>
                      <p>
                        * Locations lower than city level (e.g., postal codes,
                        specific neighborhoods) often result in sparse or no
                        data being returned.{' '}
                        <a
                          href="https://developers.google.com/google-ads/api/reference/data/geotargets"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: 'inherit',
                            textDecoration: 'underline',
                          }}
                        >
                          Learn more about geo targets
                        </a>
                        .
                      </p>
                    </div>
                  </div>
                );
              case 'clustering_info':
                return (
                  <div>
                    <p>
                      Clustering groups keywords into related categories based
                      on semantic similarity. This helps you organize your
                      target keywords into efficient ad groups or content
                      themes.
                    </p>
                    <p>
                      Gemini is used to perform a semantic clustering based on
                      the prompt. You can guide the clustering by telling Gemini
                      what to focus on, such as <strong>colors</strong>,{' '}
                      <strong>materials</strong>, <strong>brands</strong>, or{' '}
                      <strong>user intent</strong>.
                    </p>
                    {promptCustomizationNote('Clustering Prompt')}
                  </div>
                );
              default:
                return (
                  <div>
                    <p>
                      Select the language for the <strong>Keyword Ideas</strong>{' '}
                      you want to generate.
                    </p>
                    <p>
                      <strong>Important:</strong> Ensure this matches the
                      language of your <strong>Seed Keywords</strong>.
                    </p>
                    <p>
                      The Keyword Idea Service uses this setting to find
                      relevant keywords in the specified language. Mismatched
                      languages (e.g., English keywords with &quot;German&quot;
                      selected) will likely yield poor or no results.
                    </p>
                  </div>
                );
            }
          })()}
        </Modal>
      )}
    </div>
  );
};

// --- tabInsights.html ---

const InsightsTab = ({
  insights,
  setInsights,
  generateInsights,
  isGeneratingInsights,
  handleDownloadInsights,
  handleExportInsightsToSheet,
  isExporting,
  language,
  setLanguage,
  insightsChatHistory,
  sendInsightsChatMessage,
  isSendingChatMessage,
  setInsightsChatHistory,
  followUpSuggestions,
  setFollowUpSuggestions,
  geminiConfig,
  onOpenSettings,
}) => {
  const languageInputRef = React.useRef(null);
  const [selectedImage, setSelectedImage] = React.useState(null);
  const [activeInfoModal, setActiveInfoModal] = React.useState(null);

  const insightsModelId =
    geminiConfig?.insightsModelId || 'gemini-3.1-pro-preview';
  const insightsModelName = MODEL_NAMES?.[insightsModelId] || insightsModelId;

  return (
    <div className="card fade-in">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
          <h2 style={{marginBottom: 0}}>Insights</h2>
          <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
            Model: {insightsModelName} (
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                onOpenSettings('INSIGHTS_MODEL');
              }}
              style={{color: 'var(--primary)', textDecoration: 'none'}}
            >
              change
            </a>
            )
            {!insightsModelId?.includes('pro') && (
              <span
                style={{
                  color: '#ca8a04',
                  marginLeft: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#fef9c3',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid #fef08a',
                }}
                title="Flash models are not recommended for analysis. They should only be used for demonstration purposes."
              >
                <span
                  className="material-symbols-outlined"
                  style={{fontSize: '12px'}}
                >
                  warning
                </span>
                Please consider using pro models
              </span>
            )}
          </div>
        </div>
        <button
          className="header-action-btn"
          onClick={() => {
            setInsights('');
            setLanguage('English');
            setInsightsChatHistory(prev => {
              if (
                prev &&
                prev.length >= 2 &&
                prev[1].parts?.[0]?.text ===
                  "Hi! I've analyzed your data from the Explore tab. How can I help? You can also generate a report or images."
              ) {
                return prev.slice(0, 2);
              }
              return [];
            });
            setFollowUpSuggestions([]);
          }}
          title="Reset Insights"
        >
          <span
            className="material-symbols-outlined"
            style={{fontSize: '1.2rem'}}
          >
            delete_outline
          </span>
        </button>
      </div>

      <div className="input-group">
        <label
          htmlFor="insights-language"
          style={{display: 'flex', alignItems: 'center', gap: '4px'}}
        >
          Language
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: '1rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
            onClick={e => {
              e.preventDefault();
              setActiveInfoModal('language_info');
            }}
          >
            info
          </span>
        </label>
        <input
          ref={languageInputRef}
          id="insights-language"
          type="text"
          value={language}
          onChange={e => setLanguage(e.target.value)}
          placeholder="e.g. English, Spanish, German"
          style={{width: 'auto', minWidth: '200px'}}
        />
      </div>

      {insights && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            marginTop: '16px',
            marginBottom: '16px',
          }}
        >
          <div style={{display: 'flex', gap: '8px'}}>
            <button
              className="btn btn-secondary"
              onClick={handleDownloadInsights}
              style={{
                background: 'var(--surface-color)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
              }}
              title="Download Markdown"
            >
              <span className="material-symbols-outlined">download</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleExportInsightsToSheet}
              style={{
                background: 'var(--surface-color)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
              }}
              disabled={isExporting}
              title="Export to Sheet"
            >
              {isExporting ? (
                <div
                  className="spinner"
                  style={{
                    borderColor: 'rgba(37, 99, 235, 0.3)',
                    borderTopColor: '#2563eb',
                  }}
                ></div>
              ) : (
                <span className="material-symbols-outlined">table</span>
              )}
            </button>
          </div>
        </div>
      )}
      <div
        className="chat-section"
        style={{flex: 1, display: 'flex', flexDirection: 'column'}}
      >
        <div
          className="chat-history"
          style={{
            flex: 1,
            overflowY: 'auto',
            marginBottom: '16px',
            padding: '12px',
            borderRadius: '8px',
          }}
        >
          {(insightsChatHistory || [])
            .filter((msg, index) => index > 0)
            .map((msg, index) => {
              const text = msg.parts?.[0]?.text || '';
              const isHtml =
                text.trim().startsWith('<') || /<[a-z][\s\S]*>/i.test(text);
              const isReport = msg.isReport;

              return (
                <div
                  key={index}
                  className={`chat-message ${msg.role}`}
                  style={{
                    marginBottom: '12px',
                    textAlign: msg.role === 'user' ? 'right' : 'left',
                    width: isReport ? '100%' : 'auto',
                  }}
                >
                  <div
                    style={{
                      display: isReport ? 'block' : 'inline-block',
                      padding: isReport ? '0' : '8px 12px',
                      borderRadius: isReport ? '0' : '12px',
                      background: isReport
                        ? 'transparent'
                        : msg.role === 'user'
                          ? 'var(--primary)'
                          : 'var(--chat-bubble-bg)',
                      color: msg.role === 'user' ? 'white' : 'var(--text-main)',
                      boxShadow: isReport
                        ? 'none'
                        : '0 1px 2px rgba(0,0,0,0.1)',
                      maxWidth: isReport ? '100%' : '80%',
                      textAlign: 'left',
                    }}
                  >
                    {isHtml ? (
                      <div dangerouslySetInnerHTML={{__html: text}} />
                    ) : (
                      text
                    )}
                    {msg.images &&
                      msg.images.map((imgSrc, imgIdx) => (
                        <img
                          key={imgIdx}
                          src={imgSrc}
                          onClick={() => setSelectedImage(imgSrc)}
                          style={{
                            maxWidth: '400px',
                            borderRadius: '8px',
                            marginTop: '8px',
                            cursor: 'pointer',
                            display: 'block',
                          }}
                          alt="Generated content preview"
                        />
                      ))}
                  </div>
                </div>
              );
            })}
          {(isSendingChatMessage || isGeneratingInsights) && (
            <div
              className="chat-message model"
              style={{marginBottom: '12px', textAlign: 'left'}}
            >
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          )}
        </div>

        {followUpSuggestions && followUpSuggestions.length > 0 && (
          <div
            className="suggestion-chips"
            style={{
              marginBottom: '12px',
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            {followUpSuggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                className="chip"
                onClick={() => {
                  sendInsightsChatMessage(suggestion);
                  setFollowUpSuggestions([]);
                }}
                style={{
                  borderRadius: '16px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.setProperty(
                    'background-color',
                    '#bae6fd',
                    'important',
                  );
                }}
                onMouseOut={e => {
                  e.currentTarget.style.setProperty(
                    'background-color',
                    '#e0f2fe',
                    'important',
                  );
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {!insights &&
          (!followUpSuggestions || followUpSuggestions.length === 0) &&
          (!insightsChatHistory || insightsChatHistory.length <= 2) &&
          !isSendingChatMessage &&
          !isGeneratingInsights && (
            <div
              className="suggestion-chips"
              style={{
                marginBottom: '12px',
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                className="chip"
                onClick={() => generateInsights(language)}
                disabled={isGeneratingInsights}
                style={{
                  borderRadius: '16px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.setProperty(
                    'background-color',
                    '#bae6fd',
                    'important',
                  );
                }}
                onMouseOut={e => {
                  e.currentTarget.style.setProperty(
                    'background-color',
                    '#e0f2fe',
                    'important',
                  );
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{fontSize: '16px'}}
                >
                  lightbulb
                </span>
                Generate Insights Report
              </button>

              <button
                type="button"
                className="chip"
                onClick={() =>
                  generateInsights(
                    language,
                    'Add news headlines to top trending keywords',
                  )
                }
                disabled={isGeneratingInsights}
                style={{
                  borderRadius: '16px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.setProperty(
                    'background-color',
                    '#bae6fd',
                    'important',
                  );
                }}
                onMouseOut={e => {
                  e.currentTarget.style.setProperty(
                    'background-color',
                    '#e0f2fe',
                    'important',
                  );
                }}
              >
                Add news to top keywords
              </button>

              <button
                type="button"
                className="chip"
                onClick={() =>
                  generateInsights(
                    language,
                    'Give more details on the top trending topic',
                  )
                }
                disabled={isGeneratingInsights}
                style={{
                  borderRadius: '16px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.setProperty(
                    'background-color',
                    '#bae6fd',
                    'important',
                  );
                }}
                onMouseOut={e => {
                  e.currentTarget.style.setProperty(
                    'background-color',
                    '#e0f2fe',
                    'important',
                  );
                }}
              >
                Give more details on the top trending topic
              </button>
            </div>
          )}

        <div className="chat-input-group" style={{display: 'flex', gap: '8px'}}>
          <input
            type="text"
            placeholder="Ask a follow-up question..."
            style={{flex: 1}}
            onKeyPress={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (isSendingChatMessage || isGeneratingInsights) return;
                sendInsightsChatMessage(e.target.value);
                setFollowUpSuggestions([]);
                e.target.value = '';
              }
            }}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={e => {
              const input = e.currentTarget.previousSibling;
              sendInsightsChatMessage(input.value);
              setFollowUpSuggestions([]);
              input.value = '';
            }}
            disabled={isSendingChatMessage || isGeneratingInsights}
            style={{padding: '0 16px'}}
          >
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>

      {selectedImage && (
        <Modal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          title="Image Preview"
          className="large-modal"
        >
          <div style={{textAlign: 'center', padding: '10px'}}>
            <img
              src={selectedImage}
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
              }}
              alt="Fullscreen preview"
            />
          </div>
        </Modal>
      )}
      {activeInfoModal && (
        <Modal
          isOpen={!!activeInfoModal}
          onClose={() => setActiveInfoModal(null)}
          title="Language Settings"
        >
          <div>
            <p>
              Specify the language you want the Insights report and chat
              responses to use.
            </p>
            <p>
              <strong>Note:</strong> This language will be provided as an
              instruction to Gemini for generating insights and answering your
              questions.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};

const LocationModalBody = ({
  onCancel,
  onAdd,
  geminiConfig,
  showAlert,
  serverActions,
  LOCATION_INFO_URL,
}) => {
  const [countryText, setCountryText] = useState('');
  const [countryId, setCountryId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastLookup, setLastLookup] = useState('');

  const handleLookup = async () => {
    if (!countryText) return;
    setIsLoading(true);
    setLastLookup('text');
    try {
      const res = await serverActions.getLocationId(countryText, geminiConfig);
      if (res) {
        setCountryId(res.id.toString());
        setCountryText(res.name);
      } else {
        showAlert(
          `Location "${countryText}" not found. This must be a valid Name or Criterion ID for a location.`,
          LOCATION_INFO_URL,
        );
      }
    } catch (e) {
      console.error('Lookup failed:', e);
      showAlert('Lookup failed.', LOCATION_INFO_URL);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIdLookup = async () => {
    if (!countryId) return;
    setIsLoading(true);
    setLastLookup('id');
    try {
      const res = await serverActions.getLocationById(countryId);
      if (res) {
        setCountryId(res.id.toString());
        setCountryText(res.name);
      } else {
        showAlert(
          `Location ID "${countryId}" not found. This must be a valid Name or Criterion ID for a location.`,
          LOCATION_INFO_URL,
        );
      }
    } catch (e) {
      console.error('Lookup failed:', e);
      showAlert(
        'Lookup failed. Please check your connection.',
        LOCATION_INFO_URL,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const submitModal = () => {
    if (countryId && !isNaN(Number(countryId))) {
      onAdd(countryId, countryText || `ID: ${countryId}`);
    } else {
      showAlert('Valid Country ID is required.');
    }
  };

  return (
    <div className="modal-body">
      <p className="text-sm text-muted mb-4">
        Enter a Google Ads Criterion ID for a location (e.g. 2250 for France) or
        use the search to find it by name. Target at the city level or higher
        (e.g. City, State, Country) to ensure sufficient data.
        <a
          href={LOCATION_INFO_URL}
          target="_blank"
          rel="noreferrer noopener"
          style={{marginLeft: '4px', verticalAlign: 'middle'}}
          title="Locations lower than city level may return sparse or no data"
        >
          <span
            className="material-symbols-outlined"
            style={{fontSize: '16px'}}
          >
            info
          </span>
        </a>
      </p>
      <div className="input-group">
        <label>Location Name (canonical English name)</label>
        <div style={{display: 'flex', gap: '8px'}}>
          <input
            type="text"
            value={countryText}
            onChange={e => setCountryText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLookup()}
            placeholder="e.g. France"
            disabled={isLoading}
            autoFocus
          />
          <button
            className="btn btn-secondary"
            onClick={handleLookup}
            disabled={isLoading || !countryText}
            style={{minWidth: '40px', position: 'relative'}}
            title="Lookup ID"
          >
            {isLoading && lastLookup === 'text' ? (
              <div className="spinner"></div>
            ) : (
              <span className="material-symbols-outlined">search</span>
            )}
          </button>
        </div>
      </div>
      <div className="input-group">
        <label>Location ID</label>
        <div style={{display: 'flex', gap: '8px'}}>
          <input
            type="text"
            value={countryId}
            onChange={e => setCountryId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleIdLookup()}
            placeholder="e.g. 2250"
            disabled={isLoading}
          />
          <button
            className="btn btn-secondary"
            onClick={handleIdLookup}
            disabled={isLoading || !countryId}
            style={{minWidth: '40px', position: 'relative'}}
            title="Lookup Name"
          >
            {isLoading && lastLookup === 'id' ? (
              <div className="spinner"></div>
            ) : (
              <span className="material-symbols-outlined">search</span>
            )}
          </button>
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={submitModal}
          disabled={isLoading || !countryId}
        >
          Add
        </button>
      </div>
    </div>
  );
};

const LanguageModalBody = ({
  onCancel,
  onAdd,
  geminiConfig,
  showAlert,
  serverActions,
  LANGUAGE_INFO_URL,
}) => {
  const [languageText, setLanguageText] = useState('');
  const [languageId, setLanguageId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastLookup, setLastLookup] = useState('');

  const handleLookup = async () => {
    if (!languageText) return;
    setIsLoading(true);
    setLastLookup('text');
    try {
      const res = await serverActions.getLanguageId(languageText, geminiConfig);
      if (res) {
        setLanguageId(res.id.toString());
        setLanguageText(res.name);
      } else {
        showAlert(`Language "${languageText}" not found.`);
      }
    } catch (e) {
      console.error('Lookup failed:', e);
      showAlert('Lookup failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleIdLookup = async () => {
    if (!languageId) return;
    setIsLoading(true);
    setLastLookup('id');
    try {
      const res = await serverActions.getLanguageById(languageId);
      if (res) {
        setLanguageId(res.id.toString());
        setLanguageText(res.name);
      } else {
        showAlert(`Language ID "${languageId}" not found.`);
      }
    } catch (e) {
      console.error('Lookup failed:', e);
      showAlert('Lookup failed. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const submitModal = () => {
    if (languageId && !isNaN(Number(languageId))) {
      onAdd(languageId, languageText || `ID: ${languageId}`);
    } else {
      showAlert('Valid Language ID is required.');
    }
  };

  return (
    <div className="modal-body">
      <p className="text-sm text-muted mb-4">
        Enter a Language ID or Name. Use the lookup buttons to resolve the
        missing field.
        <a
          href={LANGUAGE_INFO_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{marginLeft: '4px', verticalAlign: 'middle'}}
        >
          <span
            className="material-symbols-outlined"
            style={{fontSize: '16px'}}
          >
            info
          </span>
        </a>
      </p>
      <div className="input-group">
        <label>Language Name</label>
        <div style={{display: 'flex', gap: '8px'}}>
          <input
            type="text"
            value={languageText}
            onChange={e => setLanguageText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLookup()}
            placeholder="e.g. English"
            disabled={isLoading}
            autoFocus
          />
          <button
            className="btn btn-secondary"
            onClick={handleLookup}
            disabled={isLoading || !languageText}
            style={{minWidth: '40px', position: 'relative'}}
            title="Lookup ID"
          >
            {isLoading && lastLookup === 'text' ? (
              <div className="spinner"></div>
            ) : (
              <span className="material-symbols-outlined">search</span>
            )}
          </button>
        </div>
      </div>
      <div className="input-group">
        <label>Language ID</label>
        <div style={{display: 'flex', gap: '8px'}}>
          <input
            type="text"
            value={languageId}
            onChange={e => setLanguageId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleIdLookup()}
            placeholder="e.g. 1000"
            disabled={isLoading}
          />
          <button
            className="btn btn-secondary"
            onClick={handleIdLookup}
            disabled={isLoading || !languageId}
            style={{minWidth: '40px', position: 'relative'}}
            title="Lookup Name"
          >
            {isLoading && lastLookup === 'id' ? (
              <div className="spinner"></div>
            ) : (
              <span className="material-symbols-outlined">search</span>
            )}
          </button>
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={submitModal}
          disabled={isLoading || !languageId}
        >
          Add
        </button>
      </div>
    </div>
  );
};

const GigaApp = ({onReset, isDemoMode}) => {
  const [activeTab, setActiveTab] = useStickyState('explore', 'giga_activeTab');

  // Version State
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionUpdateType, setVersionUpdateType] = useState(''); // 'major', 'minor', 'patch'

  // Theme State
  const [theme, setTheme] = useStickyState('light', 'giga_theme');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);

    // Update Chart.js defaults
    const isDark = theme === 'dark';
    const textColor = isDark ? '#f1f5f9' : '#1e293b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';

    Chart.defaults.color = textColor;
    Chart.defaults.borderColor = gridColor;
    Chart.defaults.scale.grid.color = gridColor;
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Version Check Effect
  useEffect(() => {
    const checkVersion = () => {
      const cachedVersion = localStorage.getItem('giga_version');
      if (!cachedVersion) {
        // First run or no version set, just set it
        localStorage.setItem('giga_version', APP_VERSION);
        return;
      }

      const diff = compareVersions(cachedVersion, APP_VERSION);
      if (diff === 'major' || diff === 'minor') {
        setVersionUpdateType(diff);
        setShowVersionModal(true);
      } else if (diff === 'patch') {
        // Silent update for patch
        localStorage.setItem('giga_version', APP_VERSION);
      }
    };
    checkVersion();
  }, []);

  const handleVersionUpdate = shouldClearCache => {
    if (shouldClearCache) {
      clearCache();
    } else {
      // Update version without clearing cache
      localStorage.setItem('giga_version', APP_VERSION);
      // Force reload to ensure fresh state if needed, or just close modal
      // Ideally we might want to reload, but for now just updating version is enough to stop modal
    }
    setShowVersionModal(false);
  };

  // Explore State
  const [keywords, setKeywords] = useStickyState('', 'giga_keywords');
  const [language, setLanguage] = useStickyState('1000', 'giga_language');
  const [continent, setContinent] = useStickyState(
    'Worldwide',
    'giga_continent',
  );
  const [country, setCountry] = useStickyState('', 'giga_country');

  const [customLanguages, setCustomLanguages] = useStickyState(
    [],
    'giga_customLanguages',
  );
  const [customCountries, setCustomCountries] = useStickyState(
    [],
    'giga_customCountries',
  );

  const continentOptions = useMemo(() => {
    const options = Object.keys(REGION_MAP || {}).map(name => ({
      id: name,
      name: name,
    }));
    if (customCountries && customCountries.length > 0) {
      options.push({id: 'Custom Locations', name: 'Custom Locations'});
    }
    return options;
  }, [customCountries]);

  // Set default country for each continent
  const continentDefaults = {
    Worldwide: '', // Default selected category
    Europe: '2276', // Germany
    'North America': '2840', // United States
    'South America': '2076', // Brazil
    Africa: '2710', // South Africa
    'Asia & Oceania': '2392', // Japan
  };

  const [promptTemplate, setPromptTemplate] = useStickyState(
    DEFAULT_PROMPT,
    'giga_promptTemplate',
  );
  const [geminiPrompt, setGeminiPrompt] = useStickyState(
    DEFAULT_TRENDS_PROMPT,
    'giga_geminiPrompt',
  );
  const [useKeywordPlanner, setUseKeywordPlanner] = useStickyState(
    true,
    'giga_useKeywordPlanner',
  );
  const [useGemini, setUseGemini] = useStickyState(true, 'giga_useGemini');
  const [useClustering, setUseClustering] = useStickyState(
    true,
    'giga_useClustering',
  );
  const [exploreStatus, setExploreStatus] = useState('');
  const [isExploring, setIsExploring] = useState(false);
  const isExploringRef = useRef(false);
  const isFetchingKeywordsRef = useRef(false);

  const stopExplore = () => {
    isExploringRef.current = false;
    isFetchingKeywordsRef.current = false;
    setIsExploring(false);
    setExploreStatus('Cancelled by user.');
  };

  const [ideasData, setIdeasData] = useStickyState(
    null,
    'giga_ideasData',
    isDemoMode,
  );
  const [clusters, setClusters] = useStickyState(
    null,
    'giga_clusters',
    isDemoMode,
  );
  const [relevantIdeas, setRelevantIdeas] = useStickyState(
    {},
    'giga_relevantIdeas',
    isDemoMode,
  );
  const relevantIdeasRef = useRef(relevantIdeas);
  useEffect(() => {
    relevantIdeasRef.current = relevantIdeas;
  }, [relevantIdeas]);

  const [selectedCluster, setSelectedCluster] = useState(null);
  const [chartLabels, setChartLabels] = useStickyState(
    [],
    'giga_chartLabels',
    isDemoMode,
  );
  const [minSearchVolume, setMinSearchVolume] = useStickyState(
    100,
    'giga_minSearchVolume',
  );
  const [keywordLimit, setKeywordLimit] = useStickyState(
    5000,
    'giga_keywordLimit',
  );
  const [highlightKeywordSources, setHighlightKeywordSources] = useState(false);

  const [spreadsheetUrl, setSpreadsheetUrl] = useStickyState(
    '',
    'giga_spreadsheetUrl',
  );

  // Insights State
  const [insights, setInsights] = useStickyState(
    '',
    'giga_insights',
    isDemoMode,
  );
  const [insightsLanguage, setInsightsLanguage] = useStickyState(
    'English',
    'giga_insightsLanguage',
  );
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [followUpSuggestions, setFollowUpSuggestions] = useStickyState(
    [],
    'giga_followUpSuggestions',
    isDemoMode,
  );
  const [insightsChatHistory, setInsightsChatHistory] = useStickyState(
    [],
    'giga_insightsChatHistory',
    isDemoMode,
  );
  const [isSendingChatMessage, setIsSendingChatMessage] = useState(false);

  // Campaigns State
  const [adsAccountId, setAdsAccountId] = useStickyState(
    '',
    'giga_adsAccountId',
  );
  const [brandName, setBrandName] = useStickyState('', 'giga_brandName');
  const [campaignSuggestions, setCampaignSuggestions] = useStickyState(
    '',
    'giga_campaignSuggestions',
  );
  const [isGeneratingCampaigns, setIsGeneratingCampaigns] = useState(false);
  const [campaignStatus, setCampaignStatus] = useState('');
  const [showIdInfo, setShowIdInfo] = useState(false);
  const [showBrandInfo, setShowBrandInfo] = useState(false);
  const [showInstructionsInfo, setShowInstructionsInfo] = useState(false);

  // Demo Mode Randomization
  const [isRandomized, setIsRandomized] = useState(true);
  const [demoRandomizationPercent, setDemoRandomizationPercent] =
    useStickyState(100, 'giga_demoRandomizationPercent');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).setDemoRandomizationPercent = setDemoRandomizationPercent;
    }
  }, [setDemoRandomizationPercent]);

  // --- Sheet Export Helper ---
  const [isExporting, setIsExporting] = useState(false);

  const handleSheetExport = async (
    sheetName,
    header,
    rows,
    columnFormats = [],
  ) => {
    setIsExporting(true);
    try {
      let targetUrl = spreadsheetUrl;
      let isNewSheet = false;
      if (!targetUrl) {
        targetUrl = await serverActions.createSpreadsheet('Giga Export');
        setSpreadsheetUrl(targetUrl);
        isNewSheet = true;
      }
      await serverActions.exportToSheet(
        targetUrl,
        sheetName,
        header,
        rows,
        columnFormats,
      );
      if (isNewSheet) {
        showAlert(
          `Successfully exported to a new spreadsheet. You can change the destination URL in Settings. Note: The user (${USER_EMAIL}) must have edit access to this spreadsheet for future exports.`,
          targetUrl,
        );
      } else {
        showAlert('Successfully exported to:', targetUrl);
      }
    } catch (e) {
      showError('Export Failed', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExploreToSheet = () => {
    if (!clusters) return;
    const headers = [
      'Cluster Topic',
      'Keyword',
      'Last Month Search Volume',
      'Cluster Growth YoY',
      'Cluster Growth MoM',
      'Competition',
      'Low Bid (Micros)',
      'High Bid (Micros)',
      'Avg CPC (Micros)',
    ];
    const rows = [];

    clusters.forEach(cluster => {
      cluster.keywords.forEach(kw => {
        const history = relevantIdeas[kw];
        const vol = history && history.length > 0 ? history[0] : 0;
        const idea = ideasData ? ideasData.find(i => i.text === kw) : null;

        rows.push([
          cluster.topic,
          kw,
          vol,
          cluster.growthYoY,
          cluster.growthMoM,
          idea ? idea.competition : '',
          idea ? idea.low_top_of_page_bid_micros : '',
          idea ? idea.high_top_of_page_bid_micros : '',
          idea ? idea.average_cpc_micros : '',
        ]);
      });
    });

    const columnFormats = [
      {colIndex: 2, numberFormat: '#,##0'},
      {colIndex: 3, numberFormat: '0%'},
      {colIndex: 4, numberFormat: '0%'},
      {
        colIndex: 6,
        numberFormat: '"$"#,##0.00',
        scale: 0.000001,
        headerRename: 'Low Bid (USD)',
      },
      {
        colIndex: 7,
        numberFormat: '"$"#,##0.00',
        scale: 0.000001,
        headerRename: 'High Bid (USD)',
      },
      {
        colIndex: 8,
        numberFormat: '"$"#,##0.00',
        scale: 0.000001,
        headerRename: 'Avg CPC (USD)',
      },
    ];

    handleSheetExport('Explore', headers, rows, columnFormats);
  };

  const handleExportInsightsToSheet = () => {
    if (!insights) return;
    // Just put the markdown text in one cell
    const rows = [[htmlToMarkdown(insights)]];
    handleSheetExport('Insights', ['Insights Content'], rows);
  };

  const formatCampaignsForExport = campaigns => {
    if (!campaigns) return '';
    if (typeof campaigns === 'string') return htmlToMarkdown(campaigns);
    if (!Array.isArray(campaigns)) return JSON.stringify(campaigns, null, 2);

    return campaigns
      .map(c => {
        let text = `Campaign: ${c.campaignName}\n`;
        if (c.adGroups) {
          c.adGroups.forEach(ag => {
            text += `\nAd Group: ${ag.name}\n`;
            if (ag.keywords) text += `Keywords: ${ag.keywords.join(', ')}\n`;
            if (ag.ads) {
              ag.ads.forEach((ad, i) => {
                text += `\nAd ${i + 1}:\n`;
                if (ad.headlines)
                  text += `  Headlines: ${ad.headlines.join(' | ')}\n`;
                if (ad.descriptions)
                  text += `  Descriptions: ${ad.descriptions.join(' | ')}\n`;
              });
            }
          });
        }
        return text;
      })
      .join('\n\n' + '-'.repeat(40) + '\n\n');
  };

  const handleExportCampaignsToSheet = async () => {
    if (!campaignSuggestions) return;
    setIsExporting(true);
    try {
      const text = formatCampaignsForExport(campaignSuggestions);
      const rows = [[text]];
      await handleSheetExport(
        'Campaign Suggestions',
        ['Campaign Content'],
        rows,
      );

      const headers = ['Campaign', 'Ad Group', 'Keyword'];
      const flatData = flattenCampaignsForSheet(campaignSuggestions);
      await handleSheetExport('Campaign Structure', headers, flatData);
    } catch (e) {
      showError('Export Failed', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadCampaigns = () => {
    if (!campaignSuggestions) return;
    const text = formatCampaignsForExport(campaignSuggestions);
    downloadFile(text, 'giga_campaign_suggestions.md', 'text/markdown');
  };

  const loadExploreDemoData = async (randomize, delay = 0) => {
    if (!isDemoMode) return false;
    try {
      const cachedIdeas = localStorage.getItem('giga_ideasData');
      const cachedClusters = localStorage.getItem('giga_clusters');
      const cachedRelevantIdeas = localStorage.getItem('giga_relevantIdeas');
      const cachedLaels = localStorage.getItem('giga_chartLabels');

      if (cachedIdeas && cachedClusters) {
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        let parsedIdeas = JSON.parse(cachedIdeas);
        let parsedClusters = JSON.parse(cachedClusters);
        let parsedRelevant = cachedRelevantIdeas
          ? JSON.parse(cachedRelevantIdeas)
          : {};

        if (randomize) {
          const p = demoRandomizationPercent / 100;
          const generateSmoothSeries = originalSeries => {
            const length = Array.isArray(originalSeries)
              ? originalSeries.length
              : 12;

            let magnitude = 10;
            if (Array.isArray(originalSeries) && originalSeries.length > 0) {
              const maxVal = Math.max(...originalSeries);
              if (maxVal > 0) {
                magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
              }
            }

            const series = [];
            // Start between 1 and 9 * magnitude
            let current = Math.floor(Math.random() * 9 * magnitude) + magnitude;
            series.push(current);

            for (let i = 1; i < length; i++) {
              const volatility = Math.max(
                Math.ceil(magnitude * 0.1),
                Math.round(current * 0.2),
              );
              const change =
                Math.floor(Math.random() * (volatility * 2 + 1)) - volatility;
              current = Math.max(0, current + change);
              series.push(current);
            }

            if (Math.random() < 0.2) {
              const lastIdx = series.length - 1;
              series[lastIdx] = Math.round(
                series[lastIdx] * (2 + Math.random() * 3),
              );
            }

            if (
              Array.isArray(originalSeries) &&
              originalSeries.length === series.length
            ) {
              return originalSeries.map((orig, i) =>
                Math.round(orig + (series[i] - orig) * p),
              );
            }
            return series;
          };

          const randomizeMetric = val => {
            if (val == null || val === '') return val;
            const numVal = Number(val);
            if (isNaN(numVal) || numVal === 0) return val;

            const magnitude = Math.pow(
              10,
              Math.floor(Math.log10(Math.abs(numVal))),
            );
            const sign = Math.sign(numVal);
            const randomVal = Math.random() * 9 * magnitude + magnitude;
            const interpolated = numVal + (sign * randomVal - numVal) * p;

            // keep integer if original was integer
            return Number.isInteger(numVal)
              ? Math.floor(interpolated)
              : interpolated;
          };

          const randomizeGrowth = val => {
            if (typeof val !== 'number') return val;
            const randomGrowth = val + (Math.random() - 0.5);
            return val + (randomGrowth - val) * p;
          };

          parsedIdeas = parsedIdeas.map(idea => {
            const newSearchVolume = Array.isArray(idea.searchVolume)
              ? generateSmoothSeries(idea.searchVolume)
              : idea.searchVolume;

            const newLatestVolume =
              Array.isArray(newSearchVolume) && newSearchVolume.length > 0
                ? newSearchVolume[newSearchVolume.length - 1]
                : idea.latestSearchVolume;

            const compLevels = ['LOW', 'MEDIUM', 'HIGH'];
            let newComp = idea.competition;
            if (
              p > 0 &&
              compLevels.includes(idea.competition) &&
              Math.random() < p
            ) {
              newComp =
                compLevels[Math.floor(Math.random() * compLevels.length)];
            }

            let newCompIndex = idea.competition_index;
            if (typeof newCompIndex === 'number' && p > 0) {
              const randomIdx = Math.floor(Math.random() * 100);
              newCompIndex = Math.min(
                100,
                Math.max(
                  0,
                  Math.floor(newCompIndex + (randomIdx - newCompIndex) * p),
                ),
              );
            }

            return {
              ...idea,
              searchVolume: newSearchVolume,
              latestSearchVolume: newLatestVolume,
              growthYoY: randomizeGrowth(idea.growthYoY),
              growthMoM: randomizeGrowth(idea.growthMoM),
              growthLatestVsAvg: randomizeGrowth(idea.growthLatestVsAvg),
              growthLatestVsMax: randomizeGrowth(idea.growthLatestVsMax),
              growthThreeMonthsVsAvg: randomizeGrowth(
                idea.growthThreeMonthsVsAvg,
              ),
              competition: newComp,
              competition_index: newCompIndex,
              low_top_of_page_bid_micros: randomizeMetric(
                idea.low_top_of_page_bid_micros,
              ),
              high_top_of_page_bid_micros: randomizeMetric(
                idea.high_top_of_page_bid_micros,
              ),
              average_cpc_micros: randomizeMetric(idea.average_cpc_micros),
            };
          });

          parsedClusters = parsedClusters.map(c => {
            const newHistory = Array.isArray(c.searchVolumeHistory)
              ? generateSmoothSeries(c.searchVolumeHistory)
              : c.searchVolumeHistory;
            // Calculate avg for scalar volume
            const avgVol =
              Array.isArray(newHistory) && newHistory.length > 0
                ? Math.round(
                    newHistory.reduce((a, b) => a + b, 0) / newHistory.length,
                  )
                : 0;

            return {
              ...c,
              searchVolume: avgVol,
              searchVolumeHistory: newHistory,
              growthYoY: randomizeGrowth(c.growthYoY),
              growthMoM: randomizeGrowth(c.growthMoM),
              growthLatestVsAvg: randomizeGrowth(c.growthLatestVsAvg),
              growthLatestVsMax: randomizeGrowth(c.growthLatestVsMax),
              growthThreeMonthsVsAvg: randomizeGrowth(c.growthThreeMonthsVsAvg),
            };
          });

          Object.keys(parsedRelevant).forEach(k => {
            if (Array.isArray(parsedRelevant[k])) {
              parsedRelevant[k] = generateSmoothSeries(parsedRelevant[k]);
            }
          });
        } else {
          // Explicitly reload original data to be safe
          parsedIdeas = JSON.parse(cachedIdeas);
          parsedClusters = JSON.parse(cachedClusters);
          parsedRelevant = cachedRelevantIdeas
            ? JSON.parse(cachedRelevantIdeas)
            : {};
        }

        setIdeasData(parsedIdeas);
        setClusters(parsedClusters);
        setRelevantIdeas(parsedRelevant);
        isFetchingKeywordsRef.current = false;
        if (cachedLaels) setChartLabels(JSON.parse(cachedLaels));

        setExploreStatus('');
        isExploringRef.current = false;
        setIsExploring(false);
        return true;
      }
    } catch (e) {
      console.warn('Failed to load demo cache', e);
    }
    return false;
  };

  const loadInsightsDemoData = async (randomize, delay = 0) => {
    if (!isDemoMode) return;
    try {
      const key = randomize ? 'giga_insights_random' : 'giga_insights';
      const cached = localStorage.getItem(key);

      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      if (cached) {
        setInsights(JSON.parse(cached));
      } else {
        // If no specific cache exists, clear to avoid mismatch
        setInsights('');
      }
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    const updateData = async () => {
      if (isDemoMode) {
        if (ideasData) {
          // setIsExploring(true);
          // setExploreStatus('Updating demo data...');
          await loadExploreDemoData(isRandomized, 0);
        }
        if (insights) {
          await loadInsightsDemoData(isRandomized, 0);
        }
      }
    };
    updateData();
  }, [isRandomized, demoRandomizationPercent]);

  useEffect(() => {
    const handleKeyDown = e => {
      if (!isDemoMode) return;
      // Toggle on Shift + Alt + R
      if (e.shiftKey && e.altKey && e.code === 'KeyR') {
        console.log('Shortcut triggered: Toggling Randomization');
        e.preventDefault();
        setIsRandomized(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDemoMode]);

  useEffect(() => {
    if (continent === 'Custom Locations') return;
    const defaultCountryId = continentDefaults[continent] || '';
    setCountry(defaultCountryId);
  }, [continent]);

  // Campaign Creation State
  const [creationAccountId, setCreationAccountId] = useStickyState(
    '',
    'giga_creationAccountId',
  );
  const [creationPromptTemplate, setCreationPromptTemplate] = useState('');
  const [creationStyleGuide, setCreationStyleGuide] = useStickyState(
    '<?= DEFAULT_STYLE_GUIDE ?>',
    'giga_creationStyleGuide',
  );
  const [creationInstructions, setCreationInstructions] = useStickyState(
    '',
    'giga_creationInstructions',
  );
  const [creationKeywords, setCreationKeywords] = useStickyState(
    '',
    'giga_creationKeywords',
  );
  const [growthMetric, setGrowthMetric] = useStickyState(
    'three_months_vs_avg',
    'growthMetric',
  );

  // Campaign Creation Settings
  const [creationLookbackDays, setCreationLookbackDays] = useStickyState(
    30,
    'giga_creationLookbackDays',
  );
  const [creationMetric, setCreationMetric] = useStickyState(
    'clicks',
    'giga_creationMetric',
  );

  // Gemini Configuration
  const [errorState, setErrorState] = useState({
    isOpen: false,
    title: '',
    message: '',
    stack: '',
  });

  const [configStatus, setConfigStatus] = useState({
    hasDeveloperToken: false,
    hasAdsAccountId: false,
    hasEnvAdsCredentials: false,
    adsAccountId: '',
    checked: false,
  });

  const [mccSelectorConfig, setMccSelectorConfig] = useState({
    isOpen: false,
    children: [],
    onSelect: null,
  });
  const [mccSearchQuery, setMccSearchQuery] = useState('');
  const [mccAccountStats, setMccAccountStats] = useState({});
  const [isCheckingAll, setIsCheckingAll] = useState(false);
  const [mccCheckProgress, setMccCheckProgress] = useState({
    current: 0,
    total: 0,
  });

  // Sorting State
  const [sortConfig, setSortConfig] = useState({
    key: 'growth',
    direction: 'descending',
  });

  const requestSort = key => {
    let direction = 'descending';
    if (sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = 'ascending';
    }
    setSortConfig({key, direction});
  };

  const getSortIndicator = key => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
  };

  useEffect(() => {
    const localProps = localStorage.getItem('giga_script_properties');
    const parsedProps = localProps ? JSON.parse(localProps) : undefined;
    serverActions
      .getScriptPropertiesConfiguration(parsedProps)
      .then(status => {
        setConfigStatus({...status, checked: true});
        if (status.adsAccountId) {
          setAdsAccountId(status.adsAccountId);
        }
        if (status.spreadsheetUrl) {
          setSpreadsheetUrl(status.spreadsheetUrl);
        }
      })
      .catch(console.error);
  }, []);

  const showError = (title, error) => {
    console.error(error);
    setErrorState({
      isOpen: true,
      title: title,
      message: error.message || String(error),
      stack: error.stack || '',
    });
  };

  const [geminiConfig, setGeminiConfig] = useStickyState(
    {
      projectId: '',
      modelId: 'gemini-3.1-pro-preview',
      insightsModelId: 'gemini-3.1-pro-preview',
      location: 'global',
    },
    'giga_geminiConfig',
  );

  // Migration for renamed keys
  useEffect(() => {
    if (
      geminiConfig.modelID !== undefined ||
      geminiConfig.projectID !== undefined
    ) {
      console.log('Migrating legacy geminiConfig keys...');
      setGeminiConfig(prev => {
        const newConfig = {...prev};
        if (prev.modelID !== undefined) {
          newConfig.modelId = prev.modelID;
          delete newConfig.modelID;
        }
        if (prev.projectID !== undefined) {
          newConfig.projectId = prev.projectID;
          delete newConfig.projectID;
        }
        return newConfig;
      });
    }
  }, [geminiConfig]);
  const [creationResult, setCreationResult] = useStickyState(
    '',
    'giga_creationResult',
  );
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [devTokenInput, setDevTokenInput] = useState('*****');

  const clearCache = () => {
    localStorage.clear();
    onReset();
  };

  // Handlers
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: '',
    value: '',
    message: '',
    link: '',
    isLoading: false,
    lastLookup: '',
    result: null,
    languageId: '',
    languageText: '',
    countryId: '',
    countryText: '',
  });

  const showAlert = (message, link = '') => {
    setModalConfig({
      isOpen: true,
      type: 'alert',
      message: message,
      value: '',
      link: link,
    });
  };

  const handleCustomOption = (type, id) => {
    if (type === 'language_delete') {
      setCustomLanguages(prev => prev.filter(l => l.id !== id));
      if (language === id) setLanguage('1000');
      return;
    }
    if (type === 'country_delete') {
      setCustomCountries(prev => prev.filter(c => c.id !== id));
      if (country === id) setCountry('');
      return;
    }
    setModalConfig({
      isOpen: true,
      type,
      languageId: '',
      languageText: '',
      countryId: '',
      countryText: '',
      isLoading: false,
      result: null,
    });
  };

  const handleLookup = async () => {
    const {type, languageText, countryText} = modalConfig;
    const lookupText = type === 'language' ? languageText : countryText;
    if (!lookupText) return;

    setModalConfig(prev => ({
      ...prev,
      isLoading: true,
      lastLookup: 'text',
      result: null,
    }));
    try {
      const res =
        type === 'language'
          ? await serverActions.getLanguageId(lookupText, geminiConfig)
          : await serverActions.getLocationId(lookupText, geminiConfig);
      if (res) {
        console.log('Location lookup response:', res);
        const update =
          type === 'language'
            ? {languageId: res.id.toString(), languageText: res.name}
            : {countryId: res.id.toString(), countryText: res.name};
        setModalConfig(prev => ({
          ...prev,
          result: res,
          ...update,
        }));
      } else {
        const errorMsg =
          type === 'language'
            ? `Language "${lookupText}" not found.`
            : `Location "${lookupText}" not found. This must be a valid Name or Criterion ID for a location.`;
        showAlert(errorMsg, type === 'language' ? '' : LOCATION_INFO_URL);
      }
    } catch (e) {
      console.error('Lookup failed:', e);
      showAlert('Lookup failed.', type === 'language' ? '' : LOCATION_INFO_URL);
    } finally {
      setModalConfig(prev => ({...prev, isLoading: false}));
    }
  };

  const handleIdLookup = async () => {
    const {type, languageId, countryId} = modalConfig;
    const lookupId = type === 'language' ? languageId : countryId;
    if (!lookupId) return;

    setModalConfig(prev => ({
      ...prev,
      isLoading: true,
      lastLookup: 'id',
      result: null,
    }));
    try {
      const res =
        type === 'language'
          ? await serverActions.getLanguageById(lookupId)
          : await serverActions.getLocationById(lookupId);
      if (res) {
        if (type === 'country') {
          console.log('Location ID lookup response:', res);
        }
        const update =
          type === 'language'
            ? {languageId: res.id.toString(), languageText: res.name}
            : {countryId: res.id.toString(), countryText: res.name};
        setModalConfig(prev => ({
          ...prev,
          result: res,
          ...update,
        }));
      } else {
        const errorMsg =
          type === 'language'
            ? `Language ID "${lookupId}" not found.`
            : `Location ID "${lookupId}" not found. This must be a valid Name or Criterion ID for a location.`;
        showAlert(errorMsg, type === 'language' ? '' : LOCATION_INFO_URL);
      }
    } catch (e) {
      console.error('Lookup failed:', e);
      showAlert(
        'Lookup failed. Please check your connection.',
        type === 'language' ? '' : LOCATION_INFO_URL,
      );
    } finally {
      setModalConfig(prev => ({...prev, isLoading: false}));
    }
  };

  const submitModal = () => {
    const {
      type,
      value,
      result,
      languageId,
      languageText,
      countryId,
      countryText,
    } = modalConfig;

    if (type === 'language') {
      const id = result ? result.id.toString() : languageId;
      const name = result ? result.name : languageText || `ID: ${languageId}`;

      if (id && !isNaN(Number(id))) {
        setCustomLanguages([...customLanguages, {id, name}]);
        setLanguage(id);
        setModalConfig({
          ...modalConfig,
          isOpen: false,
          type: '',
          value: '',
          result: null,
          languageId: '',
          languageText: '',
        });
      } else {
        showAlert('Valid Language ID is required.');
      }
    } else if (type === 'country') {
      const id = result ? result.id.toString() : countryId;
      const name = result ? result.name : countryText || `ID: ${countryId}`;

      if (id && !isNaN(Number(id))) {
        setCustomCountries([...customCountries, {id, name}]);
        setContinent('Custom Locations');
        setCountry(id);
        setModalConfig({
          ...modalConfig,
          isOpen: false,
          type: '',
          value: '',
          result: null,
          countryId: '',
          countryText: '',
        });
      } else {
        showAlert('Valid Country ID is required.');
      }
    } else if (type === 'settings') {
      setModalConfig({...modalConfig, isOpen: false, type: '', value: ''});
    }
  };

  useEffect(() => {
    if (configStatus.checked) {
      setDevTokenInput('');
    }
  }, [configStatus]);

  const runExplore = async overrideKeywords => {
    if (!useKeywordPlanner && !useGemini) {
      setHighlightKeywordSources(true);
      showAlert('At least one source needs to be selected.');
      return;
    }
    setHighlightKeywordSources(false);
    const keywordsToUse =
      typeof overrideKeywords === 'string' ? overrideKeywords : keywords;
    if (!keywordsToUse.trim()) {
      showAlert('Please enter at least one seed keyword.');
      return;
    }
    const seedKeywords = keywordsToUse
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);
    if (seedKeywords.length > 20) {
      showAlert('Maximum 20 keywords allowed.');
      return;
    }

    setIsExploring(true);
    isExploringRef.current = true;
    isFetchingKeywordsRef.current = true;

    if (isDemoMode) {
      setExploreStatus('Getting keyword ideas...');

      if (await loadExploreDemoData(isRandomized, 1500)) {
        return;
      }
    }

    setExploreStatus('Verifying configuration...');
    let currentStatus = configStatus;
    try {
      const localProps = localStorage.getItem('giga_script_properties');
      const parsedProps = localProps ? JSON.parse(localProps) : undefined;
      const status =
        await serverActions.getScriptPropertiesConfiguration(parsedProps);
      setConfigStatus({...status, checked: true});
      if (status.adsAccountId) {
        setAdsAccountId(status.adsAccountId);
      }
      currentStatus = status;
    } catch (e) {
      console.error('Failed to check script properties:', e);
      if (!configStatus.checked) {
        isExploringRef.current = false;
        setIsExploring(false);
        showAlert(
          'Failed to verify configuration. Please check your connection and try again.',
        );
        return;
      }
    }

    if (!currentStatus.hasDeveloperToken && !currentStatus.adsAccountId) {
      isExploringRef.current = false;
      setIsExploring(false);
      setPendingAction(() => runExplore);
      setModalConfig({
        isOpen: true,
        type: 'settings',
        highlight: 'BOTH',
        message:
          'Please configure your Developer Token and Ads Account ID to proceed.',
      });
      return;
    }

    if (!currentStatus.hasDeveloperToken) {
      isExploringRef.current = false;
      setIsExploring(false);
      setPendingAction(() => runExplore);
      setModalConfig({
        isOpen: true,
        type: 'settings',
        highlight: 'DEVELOPER_TOKEN',
        message: 'Please configure your Developer Token to proceed.',
      });
      return;
    }
    if (!currentStatus.adsAccountId) {
      isExploringRef.current = false;
      setIsExploring(false);
      setPendingAction(() => runExplore);
      setModalConfig({
        isOpen: true,
        type: 'settings',
        highlight: 'ADS_ACCOUNT_ID',
        message: 'Please configure your Ads Account ID to proceed.',
      });
      return;
    }

    setExploreStatus('Getting keyword ideas...');
    setIdeasData(null);
    setClusters(null);
    setSelectedCluster(null);

    try {
      let processedIdeas = [];

      if (useKeywordPlanner) {
        const ideas = await serverActions.generateKeywordIdeas(
          seedKeywords,
          country || undefined,
          language || undefined,
          keywordLimit,
        );

        const validIdeas = ideas.filter(
          res => res.keywordIdeaMetrics !== undefined,
        );

        const plannerIdeas = validIdeas
          .flatMap(idea =>
            (idea.closeVariants || []).concat(idea.text).map(k => [k, idea]),
          )
          .map(([k, res]) => {
            if (!isExploringRef.current) return null;
            const metrics = res.keywordIdeaMetrics;
            const volumes = metrics.monthlySearchVolumes.map(item =>
              Number(item.monthlySearches),
            );

            const len = volumes.length;
            const latest = len > 0 ? volumes[len - 1] : 0;
            const prevMonth = len > 1 ? volumes[len - 2] : 0;
            const prevYear = len > 12 ? volumes[len - 13] : 0;

            const growthYoY =
              prevYear !== 0 ? (latest - prevYear) / prevYear : 0;
            const growthMoM =
              prevMonth !== 0 ? (latest - prevMonth) / prevMonth : 0;

            const totalSum = volumes.reduce((a, b) => a + b, 0);
            const avg = len > 0 ? totalSum / len : 0;
            const growthLatestVsAvg = avg !== 0 ? (latest - avg) / avg : 0;

            const historyWithoutLatest = volumes.slice(0, -1);
            const max =
              historyWithoutLatest.length > 0
                ? Math.max(...historyWithoutLatest)
                : 0;
            const growthLatestVsMax = max !== 0 ? (latest - max) / max : 0;

            const last3Months = volumes.slice(-3);
            const prevMonths = volumes.slice(-24, -3);
            const avgLast3 =
              last3Months.length > 0
                ? last3Months.reduce((a, b) => a + b, 0) / last3Months.length
                : 0;
            const avgPrev =
              prevMonths.length > 0
                ? prevMonths.reduce((a, b) => a + b, 0) / prevMonths.length
                : 0;
            const growthThreeMonthsVsAvg =
              avgPrev !== 0 ? (avgLast3 - avgPrev) / avgPrev : 0;

            return {
              text: k,
              searchVolume: volumes,
              months: metrics.monthlySearchVolumes.map(
                item => `${item.month} ${item.year}`,
              ),
              latestSearchVolume: latest,
              growthYoY,
              growthMoM,
              growthLatestVsAvg,
              growthLatestVsMax,
              growthThreeMonthsVsAvg,
              competition: metrics.competition,
              competition_index: metrics.competitionIndex,
              low_top_of_page_bid_micros: metrics.lowTopOfPageBidMicros,
              high_top_of_page_bid_micros: metrics.highTopOfPageBidMicros,
              average_cpc_micros: metrics.averageCpcMicros,
            };
          })
          .filter(Boolean);
        processedIdeas = processedIdeas.concat(plannerIdeas);
      }

      if (!isExploringRef.current) return;

      if (useGemini) {
        setExploreStatus('Generating Gemini keywords...');

        let finalGeminiPrompt = geminiPrompt;
        const langName = [...LANGUAGES, ...customLanguages].find(
          l => l.id === language,
        )?.name;
        if (langName) {
          finalGeminiPrompt += `\n\nOutput in ${langName}`;
        }
        const countryName = [...COUNTRIES, ...customCountries].find(
          c => c.id === country,
        )?.name;
        if (countryName) {
          finalGeminiPrompt += `\nLocation: ${countryName}`;
        }

        const geminiKeywords = await serverActions.generateTrendsKeywords(
          seedKeywords,
          finalGeminiPrompt,
          geminiConfig,
        );

        if (!isExploringRef.current) return;

        if (geminiKeywords && geminiKeywords.length > 0) {
          setExploreStatus('Fetching metrics for Gemini keywords...');
          const metrics = await serverActions.getHistoricalMetrics(
            geminiKeywords,
            country || undefined,
          );

          if (!isExploringRef.current) return;

          const geminiIdeas = metrics
            .filter(m => m && m.text && m.keywordMetrics)
            .map(metric => {
              if (!isExploringRef.current) return null;
              const hist = metric.keywordMetrics;
              const volumes = (hist.monthlySearchVolumes || []).map(m =>
                Number(m.monthlySearches),
              );

              const len = volumes.length;
              const latest = len > 0 ? volumes[len - 1] : 0;
              const prevMonth = len > 1 ? volumes[len - 2] : 0;
              const prevYear = len > 12 ? volumes[len - 13] : 0;

              const growthYoY =
                prevYear !== 0 ? (latest - prevYear) / prevYear : 0;
              const growthMoM =
                prevMonth !== 0 ? (latest - prevMonth) / prevMonth : 0;

              const totalSum = volumes.reduce((a, b) => a + b, 0);
              const avg = len > 0 ? totalSum / len : 0;
              const growthLatestVsAvg = avg !== 0 ? (latest - avg) / avg : 0;

              const historyWithoutLatest = volumes.slice(0, -1);
              const max =
                historyWithoutLatest.length > 0
                  ? Math.max(...historyWithoutLatest)
                  : 0;
              const growthLatestVsMax = max !== 0 ? (latest - max) / max : 0;

              const last3Months = volumes.slice(-3);
              const prevMonths = volumes.slice(-24, -3);
              const avgLast3 =
                last3Months.length > 0
                  ? last3Months.reduce((a, b) => a + b, 0) / last3Months.length
                  : 0;
              const avgPrev =
                prevMonths.length > 0
                  ? prevMonths.reduce((a, b) => a + b, 0) / prevMonths.length
                  : 0;
              const growthThreeMonthsVsAvg =
                avgPrev !== 0 ? (avgLast3 - avgPrev) / avgPrev : 0;

              return {
                text: metric.text,
                searchVolume: volumes,
                months: (hist.monthlySearchVolumes || []).map(
                  m => `${m.month} ${m.year}`,
                ),
                latestSearchVolume: latest,
                growthYoY,
                growthMoM,
                growthLatestVsAvg,
                growthLatestVsMax,
                growthThreeMonthsVsAvg,
                competition: hist.competition,
                competition_index: hist.competitionIndex,
                low_top_of_page_bid_micros: hist.lowTopOfPageBidMicros,
                high_top_of_page_bid_micros: hist.highTopOfPageBidMicros,
                average_cpc_micros: hist.averageCpcMicros,
              };
            })
            .filter(Boolean);
          processedIdeas = processedIdeas.concat(geminiIdeas);
        }
      }

      if (!isExploringRef.current) return;

      // Deduplicate by text
      const uniqueIdeas = [];
      const seen = new Set();
      for (const idea of processedIdeas) {
        if (!seen.has(idea.text.toLowerCase())) {
          seen.add(idea.text.toLowerCase());
          uniqueIdeas.push(idea);
        }
      }
      processedIdeas = uniqueIdeas;

      if (processedIdeas.length > 0) {
        setChartLabels(processedIdeas[0].months.slice());
      }

      setIdeasData(processedIdeas);

      // Filter relevant ideas
      const relevant = {};
      processedIdeas.forEach(idea => {
        if (idea.searchVolume.at(0) >= minSearchVolume) {
          relevant[idea.text] = idea.searchVolume;
        }
      });
      setRelevantIdeas(relevant);
      isFetchingKeywordsRef.current = false;

      if (!isExploringRef.current) return;

      if (useClustering) {
        setExploreStatus(`Clustering ${processedIdeas.length} ideas...`);

        const clusterResult = await serverActions.getClusters(
          relevant,
          promptTemplate,
          geminiConfig,
        );

        if (!isExploringRef.current) return;

        setClusters(clusterResult);
        setExploreStatus(`Done. Clustered ${processedIdeas.length} keywords.`);
      } else {
        setExploreStatus(
          `Done. Found ${processedIdeas.length} keywords (Clustering skipped).`,
        );
      }
    } catch (e) {
      console.error(e);
      setExploreStatus(`Error: ${e.message}`);
      showError('Error', e);
    } finally {
      isExploringRef.current = false;
      isFetchingKeywordsRef.current = false;
      setIsExploring(false);
    }
  };

  const initInsightsChat = () => {
    if (!relevantIdeas || Object.keys(relevantIdeas).length === 0) {
      setInsightsChatHistory([]);
      return;
    }

    const seedKeywords = (keywords || '')
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);

    let dataToSerialize = relevantIdeas;
    const keys = Object.keys(relevantIdeas);
    if (keys.length > 500) {
      const sortedKeys = keys.sort((a, b) => {
        const volA = relevantIdeas[a][relevantIdeas[a].length - 1] || 0;
        const volB = relevantIdeas[b][relevantIdeas[b].length - 1] || 0;
        return volB - volA;
      });
      dataToSerialize = {};
      sortedKeys.slice(0, 500).forEach(k => {
        dataToSerialize[k] = relevantIdeas[k];
      });
    }

    const dataPrompt = `You are a marketing analyst. You are provided with trend data for keywords.
        Context:
        Seed Keywords: ${seedKeywords.join(', ')}
        Growth Metric: ${growthMetric}
        Language: ${insightsLanguage}

        Data:
        ${JSON.stringify(dataToSerialize)}

        Please acknowledge receipt of this data. Use basic HTML tags (e.g., <p>, <strong>, <ul>, <li>) for simple markdown-style rich text formatting in your responses but DO NOT use RAW Markdown. Also keep the response concise and suitable for a chat message.`;

    setInsightsChatHistory([
      {role: 'user', parts: [{text: dataPrompt}]},
      {
        role: 'model',
        parts: [
          {
            text: "Hi! I've analyzed your data from the Explore tab. How can I help? You can also generate a report or images.",
          },
        ],
      },
    ]);
  };

  const hasMountedRef = useRef(false);
  const prevRelevantIdeasRef = useRef();
  const prevInsightsLanguageRef = useRef();

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      if (
        !insightsChatHistory ||
        (insightsChatHistory.length === 0 &&
          relevantIdeas &&
          Object.keys(relevantIdeas).length > 0)
      ) {
        initInsightsChat();
      }
    } else {
      if (
        prevRelevantIdeasRef.current !== relevantIdeas ||
        prevInsightsLanguageRef.current !== insightsLanguage
      ) {
        initInsightsChat();
        setInsights('');
      }
    }
    prevRelevantIdeasRef.current = relevantIdeas;
    prevInsightsLanguageRef.current = insightsLanguage;
  }, [relevantIdeas, insightsLanguage]);

  const sendInsightsChatMessage = async (message, retryHistory = null) => {
    if (!message?.trim() && !retryHistory) return;
    setIsSendingChatMessage(true);
    setFollowUpSuggestions([]);

    let updatedHistory = retryHistory || [
      ...insightsChatHistory,
      {role: 'user', parts: [{text: message}]},
    ];

    if (isFetchingKeywordsRef.current) {
      const queuedMsg = {
        role: 'model',
        parts: [
          {
            text: 'Your prompt is queued and will continue once the analysis in explore is finished.',
          },
        ],
        isQueuedMsg: true,
      };
      setInsightsChatHistory([...updatedHistory, queuedMsg]);

      while (isFetchingKeywordsRef.current) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Update our local reference synchronously
      updatedHistory = updatedHistory.filter(m => !m.isQueuedMsg);

      setInsightsChatHistory(prev => {
        return prev.filter(m => !m.isQueuedMsg);
      });
    } else if (!retryHistory) {
      setInsightsChatHistory(updatedHistory);
    }

    if (
      !relevantIdeasRef.current ||
      Object.keys(relevantIdeasRef.current).length === 0
    ) {
      setIsSendingChatMessage(false);
      setInsightsChatHistory(prev => [
        ...prev,
        {
          role: 'model',
          parts: [{text: 'Please generate keywords in Explore tab first.'}],
          isErrorMsg: true,
        },
      ]);
      return;
    }

    try {
      const response = await serverActions.getInsightsChatResponse(
        updatedHistory,
        {...geminiConfig, enableGoogleSearch: true},
      );

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(response);
      } catch (e) {
        console.error('Failed to parse chat response JSON:', response);
        // Fallback to treat raw response as text and clear suggestions
        parsedResponse = {response: response, suggestions: []};
      }

      const modelMessage = {
        role: 'model',
        parts: [{text: parsedResponse.response}],
      };
      if (parsedResponse.images && Array.isArray(parsedResponse.images)) {
        // Include images returned by the generator
        modelMessage.images = parsedResponse.images;
      }

      setInsightsChatHistory([...updatedHistory, modelMessage]);
      setFollowUpSuggestions(parsedResponse.suggestions);
      setIsSendingChatMessage(false);
    } catch (e) {
      if (e.message && e.message.toLowerCase().includes('resource exhausted')) {
        let countdown = 10;
        setInsightsChatHistory(prev => [
          ...prev,
          {
            role: 'model',
            isErrorMsg: true,
            parts: [
              {text: `Resource exhausted. Retrying in ${countdown} seconds...`},
            ],
          },
        ]);

        const countdownInterval = setInterval(() => {
          countdown -= 1;
          if (countdown <= 0) {
            clearInterval(countdownInterval);
            setInsightsChatHistory(prev => {
              const newHist = [...prev];
              if (
                newHist.length > 0 &&
                newHist[newHist.length - 1].isErrorMsg
              ) {
                newHist.pop();
              }
              return newHist;
            });
            sendInsightsChatMessage(null, updatedHistory);
          } else {
            setInsightsChatHistory(prev => {
              const newHist = [...prev];
              const errorMsg = {
                role: 'model',
                isErrorMsg: true,
                parts: [
                  {
                    text: `Resource exhausted. Retrying in ${countdown} seconds...`,
                  },
                ],
              };
              if (
                newHist.length > 0 &&
                newHist[newHist.length - 1].isErrorMsg
              ) {
                newHist[newHist.length - 1] = errorMsg;
              } else {
                newHist.push(errorMsg);
              }
              return newHist;
            });
          }
        }, 1000);
        return;
      }
      showError('Chat Error', e);
      setIsSendingChatMessage(false);
    }
  };

  const generateInsights = async (
    language = 'English',
    initialPrompt,
    retryHistory = null,
  ) => {
    if (
      !isExploringRef.current &&
      (!relevantIdeasRef.current ||
        Object.keys(relevantIdeasRef.current).length === 0)
    ) {
      showAlert('Please generate keywords in Explore tab first.');
      return;
    }
    setIsGeneratingInsights(true);
    setFollowUpSuggestions([]);
    if (!retryHistory) {
      setInsights('');
    }

    const userMessage = initialPrompt || 'Generate Insights Report';
    let updatedHistory = retryHistory || [
      ...insightsChatHistory,
      {role: 'user', parts: [{text: userMessage}]},
    ];

    const generateStatusMsg = {
      role: 'model',
      parts: [{text: 'Generating report...'}],
      isQueuedMsg: true,
    };

    if (isFetchingKeywordsRef.current) {
      generateStatusMsg.parts[0].text =
        'Waiting for Explore analysis to finish...';
      setInsightsChatHistory([...updatedHistory, generateStatusMsg]);

      while (isFetchingKeywordsRef.current) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Update our local reference synchronously
      updatedHistory = updatedHistory.filter(m => !m.isQueuedMsg);

      setInsightsChatHistory(prev => {
        return [
          ...prev.filter(m => !m.isQueuedMsg),
          {...generateStatusMsg, parts: [{text: 'Generating report...'}]},
        ];
      });
    } else {
      setInsightsChatHistory([...updatedHistory, generateStatusMsg]);
    }

    if (
      !relevantIdeasRef.current ||
      Object.keys(relevantIdeasRef.current).length === 0
    ) {
      showAlert('Please generate keywords in Explore tab first.');
      setIsGeneratingInsights(false);
      setInsightsChatHistory(prev => prev.filter(m => !m.isQueuedMsg));
      return;
    }

    if (isDemoMode) {
      const key = isRandomized ? 'giga_insights_random' : 'giga_insights';
      const cached = localStorage.getItem(key);

      if (cached) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        setInsights(JSON.parse(cached));
        setIsGeneratingInsights(false);
        setInsightsChatHistory(prev => prev.filter(m => !m.isQueuedMsg));
        return;
      }
    }

    try {
      const seedKeywords = keywords
        .split(',')
        .map(k => k.trim())
        .filter(Boolean);
      const rawResult = await serverActions.getInsights(
        relevantIdeasRef.current,
        seedKeywords,
        growthMetric,
        {...geminiConfig, enableGoogleSearch: true},
        language,
        initialPrompt,
      );

      let result;
      try {
        result =
          typeof rawResult === 'string' ? JSON.parse(rawResult) : rawResult;
      } catch (e) {
        console.error('Failed to parse insights response JSON:', rawResult);
        result = {
          report:
            typeof rawResult === 'string'
              ? rawResult
              : 'Error generating report',
          suggestions: [],
        };
      }

      if (initialPrompt) {
        // Direct Question mode
        setFollowUpSuggestions(result.suggestions || []);
        setInsightsChatHistory(prev => {
          const newHist = prev.filter(m => !m.isQueuedMsg);
          return [...newHist, {role: 'model', parts: [{text: result.report}]}];
        });
      } else {
        // Full Report mode
        setInsights(result.report);
        setFollowUpSuggestions(result.suggestions || []);
        setInsightsChatHistory(prev => {
          const newHist = prev.filter(m => !m.isQueuedMsg);
          return [
            ...newHist,
            {role: 'model', parts: [{text: result.report}], isReport: true},
          ];
        });
      }

      if (isDemoMode) {
        const key = isRandomized ? 'giga_insights_random' : 'giga_insights';
        localStorage.setItem(key, JSON.stringify(result));
      }

      setIsGeneratingInsights(false);
    } catch (e) {
      if (e.message && e.message.toLowerCase().includes('resource exhausted')) {
        let countdown = 10;
        const errorText = `Resource exhausted. Retrying in ${countdown} seconds...`;
        setInsightsChatHistory(prev => [
          ...prev.filter(m => !m.isQueuedMsg),
          {role: 'model', isErrorMsg: true, parts: [{text: errorText}]},
        ]);

        const countdownInterval = setInterval(() => {
          countdown -= 1;
          if (countdown <= 0) {
            clearInterval(countdownInterval);
            setInsightsChatHistory(prev => {
              const newHist = [...prev];
              if (
                newHist.length > 0 &&
                newHist[newHist.length - 1].isErrorMsg
              ) {
                newHist.pop();
              }
              return newHist;
            });
            generateInsights(language, initialPrompt, updatedHistory);
          } else {
            const newErrorText = `Resource exhausted. Retrying in ${countdown} seconds...`;
            setInsightsChatHistory(prev => {
              const newHist = [...prev];
              const errorMsg = {
                role: 'model',
                isErrorMsg: true,
                parts: [{text: newErrorText}],
              };
              if (
                newHist.length > 0 &&
                newHist[newHist.length - 1].isErrorMsg
              ) {
                newHist[newHist.length - 1] = errorMsg;
              } else {
                newHist.push(errorMsg);
              }
              return newHist;
            });
          }
        }, 1000);
        return;
      }

      showError('Error', e);
      setIsGeneratingInsights(false);
      setInsightsChatHistory(prev => prev.filter(m => !m.isQueuedMsg));
    }
  };

  const generateCampaignSuggestions = async () => {
    if (
      !isExploringRef.current &&
      (!relevantIdeasRef.current ||
        Object.keys(relevantIdeasRef.current).length === 0)
    ) {
      showAlert('Please generate keywords in Explore tab first.');
      return;
    }

    setIsGeneratingCampaigns(true);

    if (isFetchingKeywordsRef.current) {
      setCampaignStatus('Waiting for Explore analysis to finish...');
      while (isFetchingKeywordsRef.current) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    if (
      !relevantIdeasRef.current ||
      Object.keys(relevantIdeasRef.current).length === 0
    ) {
      showAlert('Please generate keywords in Explore tab first.');
      setIsGeneratingCampaigns(false);
      setCampaignStatus('');
      return;
    }

    setCampaignStatus('Verifying Account ID...');

    let resolvedCreationId = '';
    if (creationAccountId) {
      resolvedCreationId = await resolveAccountId(creationAccountId);
      if (resolvedCreationId === null) {
        setIsGeneratingCampaigns(false);
        setCampaignStatus('');
        return;
      }
      if (resolvedCreationId !== creationAccountId) {
        setCreationAccountId(resolvedCreationId);
      }
    }

    setCampaignStatus('Generating suggestions...');
    try {
      let adExamples = '';
      let template = creationPromptTemplate;

      // If prompt template is missing but account ID is present, try to generate it first
      if (!template && resolvedCreationId.length >= 10) {
        setCampaignStatus('Generating Prompt Template...');
        template = await generatePrompt(resolvedCreationId);
      }

      if (resolvedCreationId.length >= 10 && template) {
        adExamples = template;
      } else if (adsAccountId) {
        const ads = await serverActions.getTopPerformingAdsAndKeywords(
          adsAccountId.replaceAll('-', '').trim(),
          10,
        );
        if (ads.length === 0) {
          showAlert(
            'No text ads found in the configured Google Ads account within the specified lookback window. The suggestions will be generated without taking historical performance into account.',
          );
        }
        adExamples = ads.map(ad => JSON.stringify(ad)).join('\n');
      }

      setCampaignStatus('Generating suggestions...');
      const langName =
        [...LANGUAGES, ...customLanguages].find(l => l.id === language)?.name ||
        language;
      const result = await serverActions.getCampaigns(
        relevantIdeasRef.current,
        growthMetric,
        langName,
        brandName,
        adExamples,
        creationStyleGuide,
        geminiConfig,
      );
      setCampaignSuggestions(result);
      setCampaignStatus('');
    } catch (e) {
      setCampaignStatus(`Error: ${e.message}`);
      showError('Error', e);
    } finally {
      setIsGeneratingCampaigns(false);
    }
  };

  const generatePrompt = async passedId => {
    let id = typeof passedId === 'string' ? passedId : null;
    if (!id) {
      id = await resolveAccountId(creationAccountId);
      if (id === null) return null;
      if (id !== creationAccountId) {
        setCreationAccountId(id);
      }
    }

    if (!id) return null;

    setIsGeneratingPrompt(true);
    try {
      const result = await serverActions.createCampaignPrompt(
        id,
        creationLookbackDays,
        creationMetric,
      );
      if (!result.trim()) {
        showAlert(
          'No text ads found in the provided Google Ads account within the specified lookback window. The suggestions will be generated without taking historical performance into account.',
        );
      }
      setCreationPromptTemplate(result.trim() ? result : '');
      setCreationResult('');
      return result;
    } catch (e) {
      setCreationResult(`Error: ${e.message}`);
      showError('Error', e);
      return null;
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const generateNewCampaigns = async () => {
    setIsCreatingCampaign(true);
    try {
      let resolvedCreationId = '';
      if (creationAccountId) {
        resolvedCreationId = await resolveAccountId(creationAccountId);
        if (resolvedCreationId === null) {
          setIsCreatingCampaign(false);
          return;
        }
        if (resolvedCreationId !== creationAccountId) {
          setCreationAccountId(resolvedCreationId);
        }
      }

      let template = creationPromptTemplate;
      if (!template && resolvedCreationId.length >= 10) {
        setCreationResult('Generating Prompt Template...');
        template = await generatePrompt(resolvedCreationId);
      }

      setCreationResult('Generating Ad Suggestions...');
      const kws = creationKeywords
        .split(',')
        .map(k => k.trim())
        .filter(Boolean);
      const prompt = `${creationStyleGuide}\n${creationInstructions}\n${template || ''}`;
      const result = await serverActions.createAdSuggestion(
        prompt,
        kws,
        geminiConfig,
      );
      setCreationResult(
        typeof result === 'string' ? result : JSON.stringify(result, null, 2),
      );
    } catch (e) {
      setCreationResult(`Error: ${e.message}`);
      showError('Error', e);
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  // Charts Data Preparation
  const clustersChartData = useMemo(() => {
    if (!clusters) return null;
    const maxVol = Math.max(...clusters.map(c => c.searchVolume), 1);

    return {
      datasets: clusters.map((c, i) => {
        let yValue = 0;

        if (growthMetric === 'yoy') {
          yValue = c.growthYoY || c.yearOverYearGrowth || 0;
        } else if (growthMetric === 'mom') {
          yValue = c.growthMoM || 0;
        } else if (growthMetric === 'latest_vs_avg') {
          yValue = c.growthLatestVsAvg || 0;
        } else if (growthMetric === 'latest_vs_max') {
          yValue = c.growthLatestVsMax || 0;
        } else if (growthMetric === 'three_months_vs_avg') {
          yValue = c.growthThreeMonthsVsAvg || 0;
        }

        return {
          label: c.topic,
          data: [
            {
              x: c.searchVolume || 0,
              y: yValue,
              r: 5 + ((c.searchVolume || 0) / maxVol) * 45,
            },
          ],
          backgroundColor: COLOR_PALETTE[i % COLOR_PALETTE.length],
        };
      }),
    };
  }, [clusters, growthMetric]);

  const selectedClusterChartData = useMemo(() => {
    if (!selectedCluster || !chartLabels.length) return null;
    const data = selectedCluster.searchVolumeHistory.slice();

    return {
      labels: chartLabels,
      datasets: [
        {
          label: `Search Volume: ${selectedCluster.topic}`,
          data: data,
          borderColor: COLOR_PALETTE[4],
          backgroundColor: COLOR_PALETTE[4] + '1A',
          fill: true,
          tension: 0.3,
        },
      ],
    };
  }, [selectedCluster, chartLabels]);

  const seedChartData = useMemo(() => {
    if (!ideasData || !keywords || !chartLabels.length) return null;
    const seeds = keywords
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(Boolean);
    const seedIdeas = ideasData.filter(idea =>
      seeds.includes(idea.text.toLowerCase()),
    );

    if (seedIdeas.length === 0) return null;

    return {
      labels: chartLabels,
      datasets: seedIdeas.map((idea, index) => {
        const color = COLOR_PALETTE[index % COLOR_PALETTE.length];

        return {
          label: idea.text,
          data: idea.searchVolume,
          borderColor: color,
          backgroundColor: color, // Same as border for legend
          fill: false, // No fill
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 6,
        };
      }),
    };
  }, [ideasData, keywords, chartLabels]);

  const bubbleChartOptions = useMemo(() => {
    const textColor = theme === 'dark' ? '#f1f5f9' : '#1e293b';
    const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0';
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: 'Search Volume',
            color: textColor,
          },
          ticks: {color: textColor},
          grid: {color: gridColor},
        },
        y: {
          title: {
            display: true,
            text:
              GROWTH_METRICS.find(m => m.id === growthMetric)?.name || 'Growth',
            color: textColor,
          },
          ticks: {
            color: textColor,
            callback: value =>
              (value > 0 ? '+' : '') + (value * 100).toFixed(0) + '%',
          },
          grid: {color: gridColor},
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx =>
              `${ctx.dataset.label}: Vol ${ctx.raw.x}, Growth ${(ctx.raw.y > 0 ? '+' : '') + (ctx.raw.y * 100).toFixed(0)}%`,
          },
        },
      },
      onClick: (evt, elements) => {
        if (elements.length > 0) {
          const index = elements[0].datasetIndex;
          if (clusters && clusters[index]) {
            setSelectedCluster(clusters[index]);
            setTimeout(() => {
              document
                .getElementById('cluster-details')
                ?.scrollIntoView({behavior: 'smooth'});
            }, 100);
          }
        }
      },
    };
  }, [growthMetric, clusters, theme]);

  const handleDownloadExplore = () => {
    if (!clusters) return;
    const headers = [
      'Cluster Topic',
      'Keyword',
      'Last Month Search Volume',
      'Cluster Growth YoY',
      'Cluster Growth MoM',
      'Competition',
      'Low Bid (USD)',
      'High Bid (USD)',
      'Avg CPC (USD)',
    ];
    const rows = [];

    clusters.forEach(cluster => {
      cluster.keywords.forEach(kw => {
        const history = relevantIdeas[kw];
        const vol = history && history.length > 0 ? history[0] : 0;
        const idea = ideasData ? ideasData.find(i => i.text === kw) : null;

        rows.push([
          cluster.topic,
          kw,
          vol,
          (cluster.growthYoY * 100).toFixed(0) + '%',
          (cluster.growthMoM * 100).toFixed(0) + '%',
          idea ? idea.competition : '',
          idea ? formatMicrosToCurrency(idea.low_top_of_page_bid_micros) : '',
          idea ? formatMicrosToCurrency(idea.high_top_of_page_bid_micros) : '',
          idea ? formatMicrosToCurrency(idea.average_cpc_micros) : '',
        ]);
      });
    });

    const csv = convertToCSV(headers, rows);
    downloadFile(csv, 'giga_explore_clusters.csv', 'text/csv');
  };

  const handleDownloadInsights = () => {
    if (!insights) return;
    const md = htmlToMarkdown(insights);
    downloadFile(md, 'giga_insights.md', 'text/markdown');
  };

  // --- Render ---

  const resolveAccountId = accountId => {
    return new Promise(async resolve => {
      const cleanId = accountId.replaceAll('-', '').trim();
      const formattedId =
        cleanId.length === 10
          ? cleanId.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
          : accountId.trim();
      if (!cleanId || cleanId.length < 10) return resolve(formattedId);

      try {
        const mccCheck = await serverActions.checkManagerAccount(cleanId);
        if (mccCheck.isManager) {
          if (mccCheck.children.length === 0) {
            showError(
              'Manager Account',
              new Error(
                'No active child accounts found in this Manager account.',
              ),
            );
            resolve(null);
          } else {
            setMccAccountStats({});
            setMccSelectorConfig({
              isOpen: true,
              children: mccCheck.children,
              onSelect: selectedId => {
                setMccSelectorConfig({
                  isOpen: false,
                  children: [],
                  onSelect: null,
                });
                resolve(selectedId);
              },
            });
          }
        } else if (mccCheck.error) {
          showError('Invalid Account', new Error(mccCheck.error));
          resolve(null);
        } else {
          resolve(formattedId);
        }
      } catch (e) {
        showError('Verification Error', e);
        resolve(null);
      }
    });
  };

  const handleSettingsSave = async newSettings => {
    setGeminiConfig(newSettings.geminiConfig);
    setMinSearchVolume(newSettings.minSearchVolume);
    setKeywordLimit(newSettings.keywordLimit);
    setSpreadsheetUrl(newSettings.spreadsheetUrl);

    let finalAdsId = newSettings.adsAccountId;
    if (newSettings.adsAccountId !== configStatus.adsAccountId) {
      finalAdsId = await resolveAccountId(newSettings.adsAccountId);
      if (finalAdsId === null) return; // Flow interrupted (MCC selection or error)
    }

    if (finalAdsId !== configStatus.adsAccountId) {
      await updateScriptProperty('ADS_ACCOUNT_ID', finalAdsId);
    }
    if (newSettings.devToken) {
      await updateScriptProperty('DEVELOPER_TOKEN', newSettings.devToken);
    }

    setModalConfig({...modalConfig, isOpen: false});
    if (pendingAction) {
      setTimeout(() => {
        pendingAction();
        setPendingAction(null);
      }, 100);
    }
  };

  const languageModal = (
    <Modal
      isOpen={modalConfig.isOpen && modalConfig.type === 'language'}
      onClose={() => setModalConfig({...modalConfig, isOpen: false})}
      title="Add Custom Language"
    >
      <LanguageModalBody
        onCancel={() =>
          setModalConfig({
            ...modalConfig,
            isOpen: false,
            result: null,
            languageId: '',
            languageText: '',
          })
        }
        onAdd={(id, name) => {
          setCustomLanguages([...customLanguages, {id, name}]);
          setLanguage(id);
          setModalConfig({
            ...modalConfig,
            isOpen: false,
            result: null,
            languageId: '',
            languageText: '',
          });
        }}
        geminiConfig={geminiConfig}
        showAlert={msg =>
          setModalConfig({isOpen: true, type: 'alert', message: msg, value: ''})
        }
        serverActions={serverActions}
        LANGUAGE_INFO_URL={LANGUAGE_INFO_URL}
      />
    </Modal>
  );

  const alertModal = (
    <Modal
      isOpen={modalConfig.isOpen && modalConfig.type === 'alert'}
      onClose={() => setModalConfig({...modalConfig, isOpen: false})}
      title="Alert"
      showCloseButton={false}
    >
      <div className="modal-body">
        <p>{modalConfig.message}</p>
        {modalConfig.link && (
          <p>
            <a
              href={modalConfig.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{display: 'inline-flex', alignItems: 'center', gap: '4px'}}
            >
              <span
                className="material-symbols-outlined"
                style={{fontSize: '20px'}}
              >
                info
              </span>
              More Information
            </a>
          </p>
        )}
        <div className="modal-actions">
          <button
            className="btn btn-primary"
            onClick={() => setModalConfig({...modalConfig, isOpen: false})}
          >
            OK
          </button>
        </div>
      </div>
    </Modal>
  );

  const stopCheckAllRef = useRef(false);

  const handleCheckAllVisible = async () => {
    if (isCheckingAll) {
      stopCheckAllRef.current = true;
      // Immediately reset checking state and clear out remaining loading states
      setIsCheckingAll(false);
      setMccCheckProgress({current: 0, total: 0});
      setMccAccountStats(prev => {
        const next = {...prev};
        Object.keys(next).forEach(key => {
          if (next[key] && next[key].loading && next[key].count === undefined) {
            delete next[key];
          }
        });
        return next;
      });
      return;
    }

    stopCheckAllRef.current = false;
    setIsCheckingAll(true);
    const visibleChildren = mccSelectorConfig.children.filter(
      child =>
        (child.name || '')
          .toLowerCase()
          .includes(mccSearchQuery.toLowerCase()) ||
        child.id.includes(mccSearchQuery),
    );
    const accountsToCheck = visibleChildren.filter(child => {
      const stats = mccAccountStats[child.id];
      return (
        !stats || (!stats.loading && stats.count === undefined && !stats.error)
      );
    });

    const totalAccounts = accountsToCheck.length;
    if (totalAccounts === 0) {
      setIsCheckingAll(false);
      return;
    }

    setMccCheckProgress({current: 0, total: totalAccounts});

    let currentChecked = 0;
    for (let i = 0; i < totalAccounts; i += 10) {
      if (stopCheckAllRef.current) break;

      const batch = accountsToCheck.slice(i, i + 10);

      setMccAccountStats(prev => {
        const next = {...prev};
        batch.forEach(c => {
          if (!next[c.id]) next[c.id] = {loading: true};
        });
        return next;
      });

      await Promise.all(
        batch.map(async child => {
          try {
            const result = await serverActions.getAccountKeywordStats(child.id);
            if (!stopCheckAllRef.current) {
              setMccAccountStats(prev => ({...prev, [child.id]: result}));
            }
          } catch (e) {
            if (!stopCheckAllRef.current) {
              setMccAccountStats(prev => ({
                ...prev,
                [child.id]: {error: e.message},
              }));
            }
          } finally {
            if (!stopCheckAllRef.current) {
              currentChecked++;
              setMccCheckProgress(prev => ({...prev, current: currentChecked}));
            }
          }
        }),
      );

      if (i + 10 < totalAccounts && !stopCheckAllRef.current) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    if (!stopCheckAllRef.current) {
      setIsCheckingAll(false);
      setTimeout(() => setMccCheckProgress({current: 0, total: 0}), 1000);
    }
  };

  const mccModal = (
    <Modal
      isOpen={mccSelectorConfig.isOpen}
      maxWidth="900px"
      onClose={() => {
        setMccSelectorConfig({...mccSelectorConfig, isOpen: false});
        setMccSearchQuery('');
        if (mccSelectorConfig.onSelect) {
          mccSelectorConfig.onSelect(null); // Resolve with null to stop flow
        }
      }}
      title="Select Child Account"
    >
      <div className="modal-body">
        <p>
          The provided ID is a Manager Account. Please select a child account:
        </p>
        <div
          style={{
            marginTop: '12px',
            marginBottom: '12px',
            display: 'flex',
            gap: '8px',
          }}
        >
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={mccSearchQuery}
            onChange={e => setMccSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-color)',
              fontFamily: 'inherit',
              fontSize: '0.95rem',
              boxSizing: 'border-box',
            }}
          />
          <button
            className={`btn ${isCheckingAll ? 'btn-danger' : 'btn-secondary'}`}
            onClick={handleCheckAllVisible}
            title="Check all visible accounts for their total active search campaigns and keywords."
            style={{
              whiteSpace: 'nowrap',
              backgroundColor: isCheckingAll ? 'var(--error)' : '',
              color: isCheckingAll ? 'white' : '',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isCheckingAll ? (
              <>
                <div
                  className="spinner"
                  style={{
                    width: '14px',
                    height: '14px',
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    borderColor: 'rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                  }}
                ></div>
                Stop Check
              </>
            ) : (
              'Check all'
            )}
          </button>
        </div>
        {mccCheckProgress.total > 0 && (
          <div
            style={{
              marginBottom: '12px',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '4px',
              }}
            >
              <span>Checking accounts...</span>
              <span>
                {mccCheckProgress.current} / {mccCheckProgress.total}
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '4px',
                background: 'var(--bg-color-alt)',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${(mccCheckProgress.current / mccCheckProgress.total) * 100}%`,
                  height: '100%',
                  background: 'var(--primary)',
                  transition: 'width 0.3s ease',
                }}
              ></div>
            </div>
          </div>
        )}
        <div style={{maxHeight: '400px', overflowY: 'auto'}}>
          <table
            className="table"
            style={{width: '100%', borderCollapse: 'collapse'}}
          >
            <thead>
              <tr style={{borderBottom: '1px solid var(--border-color)'}}>
                <th style={{textAlign: 'left', padding: '8px'}}>
                  Account Name
                </th>
                <th style={{textAlign: 'left', padding: '8px'}}>Account ID</th>
                <th style={{textAlign: 'center', padding: '8px'}}>
                  Search Campaigns
                </th>
                <th style={{textAlign: 'center', padding: '8px'}}>Keywords</th>
                <th
                  style={{width: '150px', padding: '8px', textAlign: 'center'}}
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {mccSelectorConfig.children
                .filter(
                  child =>
                    (child.name || '')
                      .toLowerCase()
                      .includes(mccSearchQuery.toLowerCase()) ||
                    child.id.includes(mccSearchQuery),
                )
                .sort((a, b) => {
                  const kwA = mccAccountStats[a.id]?.keywordCount ?? -1;
                  const kwB = mccAccountStats[b.id]?.keywordCount ?? -1;
                  return kwB - kwA;
                })
                .map(child => {
                  const stats = mccAccountStats[child.id];
                  return (
                    <tr
                      key={child.id}
                      style={{borderBottom: '1px solid var(--bg-color-alt)'}}
                    >
                      <td style={{padding: '8px'}}>
                        {child.name || 'Unnamed Account'}
                      </td>
                      <td style={{padding: '8px'}}>{child.id}</td>
                      <td style={{padding: '8px', textAlign: 'center'}}>
                        {stats?.loading ? (
                          <div
                            className="spinner"
                            style={{
                              width: '16px',
                              height: '16px',
                              margin: '0 auto',
                            }}
                          ></div>
                        ) : stats?.error ? (
                          <span
                            title={stats.error}
                            style={{color: 'var(--error)'}}
                          >
                            Error
                          </span>
                        ) : stats?.count !== undefined ? (
                          <span
                            style={{
                              color:
                                stats.count > 0 ? 'var(--success)' : 'inherit',
                              fontWeight: stats.count > 0 ? 'bold' : 'normal',
                            }}
                          >
                            {stats.count}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td style={{padding: '8px', textAlign: 'center'}}>
                        {stats?.loading ? (
                          <div
                            className="spinner"
                            style={{
                              width: '16px',
                              height: '16px',
                              margin: '0 auto',
                            }}
                          ></div>
                        ) : stats?.error ? (
                          <span
                            title={stats.error}
                            style={{color: 'var(--error)'}}
                          >
                            Error
                          </span>
                        ) : stats?.keywordCount !== undefined ? (
                          <span
                            style={{
                              color:
                                stats.keywordCount > 0
                                  ? 'var(--success)'
                                  : 'inherit',
                              fontWeight:
                                stats.keywordCount > 0 ? 'bold' : 'normal',
                            }}
                          >
                            {stats.keywordCount}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td style={{padding: '8px', textAlign: 'center'}}>
                        <div
                          style={{
                            display: 'flex',
                            gap: '8px',
                            justifyContent: 'center',
                          }}
                        >
                          {(!stats ||
                            (!stats.loading &&
                              stats.count === undefined &&
                              !stats.error)) && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={async () => {
                                setMccAccountStats(prev => ({
                                  ...prev,
                                  [child.id]: {loading: true},
                                }));
                                try {
                                  const result =
                                    await serverActions.getAccountKeywordStats(
                                      child.id,
                                    );
                                  setMccAccountStats(prev => ({
                                    ...prev,
                                    [child.id]: result,
                                  }));
                                } catch (e) {
                                  setMccAccountStats(prev => ({
                                    ...prev,
                                    [child.id]: {error: e.message},
                                  }));
                                }
                              }}
                            >
                              Check
                            </button>
                          )}
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              setMccSearchQuery('');
                              const formattedId = child.id.replace(
                                /(\d{3})(\d{3})(\d{4})/,
                                '$1-$2-$3',
                              );
                              mccSelectorConfig.onSelect(formattedId);
                            }}
                          >
                            {' '}
                            Select
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              {mccSelectorConfig.children.filter(
                child =>
                  (child.name || '')
                    .toLowerCase()
                    .includes(mccSearchQuery.toLowerCase()) ||
                  child.id.includes(mccSearchQuery),
              ).length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      textAlign: 'center',
                      padding: '16px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    No matching accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="modal-actions" style={{marginTop: '16px'}}>
          <button
            className="btn"
            onClick={() => {
              setMccSelectorConfig({...mccSelectorConfig, isOpen: false});
              setMccSearchQuery('');
              if (mccSelectorConfig.onSelect) {
                mccSelectorConfig.onSelect(null);
              }
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );

  const updateScriptProperty = async (key, value) => {
    try {
      const localProps = localStorage.getItem('giga_script_properties');
      const parsedProps = localProps ? JSON.parse(localProps) : {};
      parsedProps[key] = value;
      localStorage.setItem(
        'giga_script_properties',
        JSON.stringify(parsedProps),
      );

      const status = await serverActions.setScriptProperty(key, value);
      setConfigStatus({...status, checked: true});
      if (key === 'ADS_ACCOUNT_ID') {
        setAdsAccountId(value);
      }
      return true;
    } catch (e) {
      showError('Error updating property', e);
      return false;
    }
  };

  const handleOpenSettings = () => {
    setModalConfig({
      isOpen: true,
      type: 'settings',
      value: '',
      spreadsheetUrl: spreadsheetUrl,
    });
  };

  const locationModal = (
    <Modal
      isOpen={modalConfig.isOpen && modalConfig.type === 'country'}
      onClose={() => setModalConfig({...modalConfig, isOpen: false})}
      title="Add Custom Location"
    >
      <LocationModalBody
        onCancel={() =>
          setModalConfig({
            ...modalConfig,
            isOpen: false,
            result: null,
            countryId: '',
            countryText: '',
          })
        }
        onAdd={(id, name) => {
          setCustomCountries([...customCountries, {id, name}]);
          setContinent('Custom Locations');
          setCountry(id);
          setModalConfig({
            ...modalConfig,
            isOpen: false,
            result: null,
            countryId: '',
            countryText: '',
          });
        }}
        geminiConfig={geminiConfig}
        showAlert={(msg, link) =>
          setModalConfig({
            isOpen: true,
            type: 'alert',
            message: msg,
            link: link,
            value: '',
          })
        }
        serverActions={serverActions}
        LOCATION_INFO_URL={LOCATION_INFO_URL}
      />
    </Modal>
  );

  return (
    <div className="app">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h1>GIGA GCP</h1>
        <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
          <button
            className="btn"
            onClick={handleOpenSettings}
            style={{
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              padding: '8px',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{fontSize: '1.5rem'}}
            >
              settings
            </span>
          </button>
          <button
            className="btn"
            onClick={toggleTheme}
            style={{
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              padding: '8px',
            }}
            title={
              theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'
            }
          >
            <span
              className="material-symbols-outlined"
              style={{fontSize: '1.5rem'}}
            >
              {theme === 'light' ? 'dark_mode' : 'light_mode'}
            </span>
          </button>
        </div>
      </div>

      <div className="tabs">
        <TabButton
          active={activeTab === 'explore'}
          onClick={() => setActiveTab('explore')}
        >
          Explore
        </TabButton>
        <TabButton
          active={activeTab === 'insights'}
          onClick={() => setActiveTab('insights')}
        >
          Insights
        </TabButton>
        <TabButton
          active={activeTab === 'campaigns'}
          onClick={() => setActiveTab('campaigns')}
        >
          Campaigns
        </TabButton>
      </div>

      {activeTab === 'explore' && (
        <ExploreTab
          keywords={keywords}
          setKeywords={setKeywords}
          runExplore={runExplore}
          stopExplore={stopExplore}
          isExploring={isExploring}
          exploreStatus={exploreStatus}
          ideasData={ideasData}
          setIdeasData={setIdeasData}
          setClusters={setClusters}
          setRelevantIdeas={setRelevantIdeas}
          setChartLabels={setChartLabels}
          setSelectedCluster={setSelectedCluster}
          language={language}
          setLanguage={setLanguage}
          country={country}
          setCountry={setCountry}
          continent={continent}
          setContinent={setContinent}
          continentOptions={continentOptions}
          customLanguages={customLanguages}
          customCountries={customCountries}
          handleCustomOption={handleCustomOption}
          promptTemplate={promptTemplate}
          setPromptTemplate={setPromptTemplate}
          seedChartData={seedChartData}
          clusters={clusters}
          growthMetric={growthMetric}
          setGrowthMetric={setGrowthMetric}
          handleDownloadExplore={handleDownloadExplore}
          handleExportExploreToSheet={handleExportExploreToSheet}
          isExporting={isExporting}
          clustersChartData={clustersChartData}
          bubbleChartOptions={bubbleChartOptions}
          selectedCluster={selectedCluster}
          selectedClusterChartData={selectedClusterChartData}
          chartLabels={chartLabels}
          relevantIdeas={relevantIdeas}
          useKeywordPlanner={useKeywordPlanner}
          setUseKeywordPlanner={setUseKeywordPlanner}
          useGemini={useGemini}
          setUseGemini={setUseGemini}
          geminiPrompt={geminiPrompt}
          setGeminiPrompt={setGeminiPrompt}
          useClustering={useClustering}
          setUseClustering={setUseClustering}
          highlightKeywordSources={highlightKeywordSources}
          setHighlightKeywordSources={setHighlightKeywordSources}
          theme={theme}
          geminiConfig={geminiConfig}
          onOpenSettings={highlight =>
            setModalConfig({
              ...modalConfig,
              isOpen: true,
              type: 'settings',
              highlight: highlight || null,
            })
          }
        />
      )}

      {activeTab === 'insights' && (
        <InsightsTab
          insights={insights}
          setInsights={setInsights}
          generateInsights={generateInsights}
          isGeneratingInsights={isGeneratingInsights}
          handleDownloadInsights={handleDownloadInsights}
          handleExportInsightsToSheet={handleExportInsightsToSheet}
          isExporting={isExporting}
          language={insightsLanguage}
          setLanguage={setInsightsLanguage}
          insightsChatHistory={insightsChatHistory}
          sendInsightsChatMessage={sendInsightsChatMessage}
          isSendingChatMessage={isSendingChatMessage}
          setInsightsChatHistory={setInsightsChatHistory}
          followUpSuggestions={followUpSuggestions}
          setFollowUpSuggestions={setFollowUpSuggestions}
          geminiConfig={geminiConfig}
          onOpenSettings={highlight =>
            setModalConfig({
              ...modalConfig,
              isOpen: true,
              type: 'settings',
              highlight: highlight || null,
            })
          }
        />
      )}

      {activeTab === 'campaigns' && (
        <CampaignsTab
          campaignSuggestions={campaignSuggestions}
          setCampaignSuggestions={setCampaignSuggestions}
          setCampaignStatus={setCampaignStatus}
          brandName={brandName}
          setBrandName={setBrandName}
          creationKeywords={creationKeywords}
          setCreationKeywords={setCreationKeywords}
          creationResult={creationResult}
          setCreationResult={setCreationResult}
          creationAccountId={creationAccountId}
          setCreationAccountId={setCreationAccountId}
          creationInstructions={creationInstructions}
          setCreationInstructions={setCreationInstructions}
          creationPromptTemplate={creationPromptTemplate}
          setCreationPromptTemplate={setCreationPromptTemplate}
          creationStyleGuide={creationStyleGuide}
          setCreationStyleGuide={setCreationStyleGuide}
          showIdInfo={showIdInfo}
          setShowIdInfo={setShowIdInfo}
          showBrandInfo={showBrandInfo}
          setShowBrandInfo={setShowBrandInfo}
          showInstructionsInfo={showInstructionsInfo}
          setShowInstructionsInfo={setShowInstructionsInfo}
          geminiConfig={geminiConfig}
          onOpenSettings={highlight =>
            setModalConfig({
              ...modalConfig,
              isOpen: true,
              type: 'settings',
              highlight: highlight || null,
            })
          }
          isGeneratingPrompt={isGeneratingPrompt}
          isCreatingCampaign={isCreatingCampaign}
          generatePrompt={generatePrompt}
          generateNewCampaigns={generateNewCampaigns}
          campaignStatus={campaignStatus}
          isGeneratingCampaigns={isGeneratingCampaigns}
          generateCampaignSuggestions={generateCampaignSuggestions}
          handleDownloadCampaigns={handleDownloadCampaigns}
          handleExportCampaignsToSheet={handleExportCampaignsToSheet}
          isExporting={isExporting}
          GOOGLE_ADS_ID_HELP_URL={GOOGLE_ADS_ID_HELP_URL}
          creationLookbackDays={creationLookbackDays}
          setCreationLookbackDays={setCreationLookbackDays}
          creationMetric={creationMetric}
          setCreationMetric={setCreationMetric}
        />
      )}

      {languageModal}
      {locationModal}

      <SettingsModal
        isOpen={modalConfig.isOpen && modalConfig.type === 'settings'}
        onClose={() => setModalConfig({...modalConfig, isOpen: false})}
        modalConfig={modalConfig}
        geminiConfig={geminiConfig}
        minSearchVolume={minSearchVolume}
        keywordLimit={keywordLimit}
        configStatus={configStatus}
        onSave={handleSettingsSave}
        onClearCache={clearCache}
      />
      {alertModal}
      {mccModal}

      <Modal
        isOpen={showVersionModal}
        onClose={() => {}}
        title={`Update Available (${APP_VERSION})`}
        showCloseButton={false}
      >
        <div className="modal-body">
          <div
            className="alert alert-warning mb-4"
            style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#1e40af',
              padding: '15px',
              borderRadius: '8px',
            }}
          >
            <h3 style={{marginTop: 0, fontSize: '1.1rem'}}>
              New Version Detected
            </h3>
            <p>
              A new version of GIGA is available. It is recommended to clear
              your local cache to ensure compatibility with new features.
            </p>
            <p className="text-sm mt-2">
              <strong>Update Type:</strong> {versionUpdateType.toUpperCase()}
            </p>
          </div>

          <div className="modal-actions">
            <button className="btn" onClick={() => handleVersionUpdate(false)}>
              Keep Cache (Risk of Errors)
            </button>
            <button
              className="btn btn-primary"
              onClick={() => handleVersionUpdate(true)}
            >
              Clear Cache & Update
            </button>
          </div>
        </div>
      </Modal>

      <ErrorModal
        isOpen={errorState.isOpen}
        onClose={() => setErrorState({...errorState, isOpen: false})}
        error={errorState}
      />
      {isDemoMode && isRandomized && (
        <div className="warning-footer">
          ⚠ Search volume and other metrics are randomized for demonstration ⚠
        </div>
      )}
    </div>
  );
};

const App = () => {
  const [resetKey, setResetKey] = useState(0);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkDemo = () => {
      let isDemo = false;
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('demo') === 'true') {
          isDemo = true;
        }
      }

      if (typeof google !== 'undefined' && google.script && google.script.url) {
        try {
          google.script.url.getLocation(location => {
            const demo = location.parameter['demo'] === 'true' || isDemo;
            console.log('Demo Mode:', demo);
            setIsDemoMode(demo);
            setIsReady(true);
          });
          return;
        } catch (e) {
          console.warn('Error checking location:', e);
        }
      }

      console.log('Demo Mode:', isDemo);
      setIsDemoMode(isDemo);
      setIsReady(true);
    };

    checkDemo();

    // Safety timeout
    const timer = setTimeout(() => {
      if (!isReady) setIsReady(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [isReady]);

  const handleReset = () => setResetKey(prev => prev + 1);

  if (!isReady) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontFamily: 'sans-serif',
          color: '#64748b',
        }}
      >
        Loading GIGA...
      </div>
    );
  }

  return (
    <GigaApp key={resetKey} onReset={handleReset} isDemoMode={isDemoMode} />
  );
};

export default App;
