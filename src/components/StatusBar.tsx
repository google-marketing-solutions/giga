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
import {useApp} from '../contexts/AppContext';

export function StatusBar() {
  const {step, logs} = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const latestLog = logs[logs.length - 1];
  const lastThreeLogs = logs.slice(-3).reverse();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-100 border-t border-gray-200 text-gray-700 text-xs z-50 shadow-md">
      {/* Summary Line */}
      <div
        className="flex items-center justify-between p-2 h-10 cursor-pointer hover:bg-gray-200 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 truncate">
          <span className="font-semibold text-[var(--primary)]">
            [{step || 'Idle'}]
          </span>
          <span className="text-gray-400">|</span>
          <span className="truncate">
            {latestLog ? latestLog.message : 'No recent activity'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <span className="text-xs text-gray-400">({logs.length})</span>
          )}
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
            className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-white max-h-60 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="p-4 text-center text-gray-400">No logs yet.</div>
          ) : (
            <div className="p-2 space-y-1">
              {(showAll ? [...logs].reverse() : lastThreeLogs).map(log => (
                <div
                  key={log.id}
                  className="flex items-center justify-between text-xs py-1 px-2 hover:bg-gray-50 rounded"
                >
                  <span className="truncate">{log.message}</span>
                  <span className="text-gray-400 flex-shrink-0 ml-2">
                    {log.timestamp}
                  </span>
                </div>
              ))}

              {!showAll && logs.length > 3 && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setShowAll(true);
                  }}
                  className="w-full text-center text-[var(--primary)] py-1.5 hover:underline font-medium mt-1 text-xs"
                >
                  Show All ({logs.length})
                </button>
              )}
              {showAll && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setShowAll(false);
                  }}
                  className="w-full text-center text-[var(--primary)] py-1.5 hover:underline font-medium mt-1 text-xs"
                >
                  Show Less
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
