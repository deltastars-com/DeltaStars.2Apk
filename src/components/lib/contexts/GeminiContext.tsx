import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface GeminiAiContextType { status: 'loading' | 'ready' | 'error'; hasKey: boolean; }
const GeminiAiContext = createContext<GeminiAiContextType>({ status: 'loading', hasKey: false });
export const useGeminiAi = () => useContext(GeminiAiContext);

export const GeminiAiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GeminiAiContextType>({ status: 'loading', hasKey: false });
  useEffect(() => {
    const k = !!(import.meta.env.VITE_GEMINI_KEY || import.meta.env.VITE_GEMINI_API_KEY);
    setState({ hasKey: k, status: k ? 'ready' : 'error' });
  }, []);
  return <GeminiAiContext.Provider value={state}>{children}</GeminiAiContext.Provider>;
};
