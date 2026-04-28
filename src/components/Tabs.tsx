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


interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}: TabsProps) {
  return (
    <div className={`flex border-b border-[var(--card-border)] ${className}`}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            relative px-4 py-3 text-sm font-medium transition-all outline-none
            ${
              activeTab === tab.id
                ? 'text-[var(--primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
            }
          `}
        >
          {tab.label}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--primary)] rounded-t-full" />
          )}
        </button>
      ))}
    </div>
  );
}
