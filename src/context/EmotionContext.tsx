import { createContext, useContext, type ReactNode } from 'react';
import { useEmotionStream } from '../hooks/useEmotionStream';

type EmotionContextType = ReturnType<typeof useEmotionStream>;
const EmotionContext = createContext<EmotionContextType | null>(null);

export function EmotionProvider({ children }: { children: ReactNode }) {
  const value = useEmotionStream();
  return <EmotionContext.Provider value={value}>{children}</EmotionContext.Provider>;
}

export function useEmotion() {
  const ctx = useContext(EmotionContext);
  if (!ctx) throw new Error('useEmotion must be used within EmotionProvider');
  return ctx;
}
