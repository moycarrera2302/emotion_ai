import { useState, useEffect, useRef, useCallback } from 'react';
import type { Session, SessionStatus, MindfulnessPrompt } from '../types/emotions';
import { generateEmotionFrame, generateSessionId, resetSimulator } from '../utils/simulator';

const SAMPLE_INTERVAL_MS = 2000;
const NEGATIVE_VALENCE_THRESHOLD = 0.35;
const NEGATIVE_STREAK_TRIGGER = 5; // ~10 seconds at 2s interval = roughly 3 min scaled for demo

export function useEmotionStream() {
  const [session, setSession] = useState<Session>(() => ({
    id: generateSessionId(),
    status: 'paused' as SessionStatus,
    startTime: new Date().toISOString(),
    frames: [],
    notes: [],
  }));

  const [mindfulness, setMindfulness] = useState<MindfulnessPrompt>({
    active: false,
    exercise: null,
    pre_valence: null,
    post_valence: null,
  });

  const negativeStreakRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const latestFrame = session.frames.length > 0 ? session.frames[session.frames.length - 1] : null;

  const start = useCallback(() => {
    if (session.status === 'active') return;
    setSession(prev => {
      if (prev.status === 'completed') {
        resetSimulator();
        return {
          id: generateSessionId(),
          status: 'active',
          startTime: new Date().toISOString(),
          frames: [],
          notes: [],
        };
      }
      return { ...prev, status: 'active' };
    });
  }, [session.status]);

  const pause = useCallback(() => {
    setSession(prev => ({ ...prev, status: 'paused' }));
  }, []);

  const stop = useCallback(() => {
    setSession(prev => ({ ...prev, status: 'completed' }));
    negativeStreakRef.current = 0;
  }, []);

  const addNote = useCallback((note: string) => {
    setSession(prev => ({ ...prev, notes: [...prev.notes, note] }));
  }, []);

  const dismissMindfulness = useCallback(() => {
    setMindfulness({ active: false, exercise: null, pre_valence: null, post_valence: null });
    negativeStreakRef.current = 0;
  }, []);

  const completeMindfulness = useCallback(() => {
    const postValence = latestFrame?.dimensional_model.valence ?? 0;
    setMindfulness(prev => ({ ...prev, active: false, post_valence: postValence }));
    negativeStreakRef.current = 0;
  }, [latestFrame]);

  useEffect(() => {
    if (session.status !== 'active') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }

    intervalRef.current = setInterval(() => {
      const frame = generateEmotionFrame(session.id);
      setSession(prev => ({
        ...prev,
        frames: [...prev.frames, frame],
      }));

      if (frame.dimensional_model.valence < NEGATIVE_VALENCE_THRESHOLD) {
        negativeStreakRef.current++;
      } else {
        negativeStreakRef.current = Math.max(0, negativeStreakRef.current - 1);
      }

      if (negativeStreakRef.current >= NEGATIVE_STREAK_TRIGGER && !mindfulness.active) {
        setMindfulness({
          active: true,
          exercise: null,
          pre_valence: frame.dimensional_model.valence,
          post_valence: null,
        });
      }
    }, SAMPLE_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [session.status, session.id, mindfulness.active]);

  return {
    session,
    latestFrame,
    mindfulness,
    setMindfulness,
    start,
    pause,
    stop,
    addNote,
    dismissMindfulness,
    completeMindfulness,
  };
}
