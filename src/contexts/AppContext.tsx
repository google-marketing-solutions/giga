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

import {createContext, useContext, useState, useCallback} from 'react';

export type Log = {
  id: string;
  message: string;
  timestamp: string;
};

export type AppContextType = {
  step: string;
  setStep: (step: string) => void;
  logs: Log[];
  addLog: (message: string) => void;
  clearLogs: () => void;
  error: Error | null;
  setError: (error: Error | null) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({children}: {children: React.ReactNode}) {
  const [step, setStep] = useState<string>('');
  const [logs, setLogs] = useState<Log[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const addLog = useCallback((message: string) => {
    const newLog: Log = {
      id: Math.random().toString(36).substring(7),
      message,
      timestamp: new Date().toLocaleTimeString(),
    };
    setLogs(prev => [...prev, newLog]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return (
    <AppContext.Provider
      value={{step, setStep, logs, addLog, clearLogs, error, setError}}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
