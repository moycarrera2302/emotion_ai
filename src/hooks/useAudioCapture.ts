import { useRef, useState, useCallback, useEffect } from 'react';
import type { EmotionFrame, EmotionLabel, EmotionDistribution } from '../types/emotions';

export type AudioStatus = 'idle' | 'requesting' | 'active' | 'error';

const VALENCE_MAP: Record<EmotionLabel, number> = { joy: 0.8, sadness: -0.6, anger: -0.5, fear: -0.7, surprise: 0.2, disgust: -0.4, neutral: 0.0 };
const AROUSAL_MAP: Record<EmotionLabel, number> = { joy: 0.6, sadness: -0.4, anger: 0.8, fear: 0.7, surprise: 0.8, disgust: 0.3, neutral: 0.0 };

interface Options {
  sessionId: string;
  active: boolean;
  onFrame: (frame: EmotionFrame) => void;
}

export interface AudioFeatures {
  rms: number;
  spectralCentroid: number;
  zcr: number;
  pitchEstimate: number;
}

export function useAudioCapture({ sessionId, active, onFrame }: Options) {
  const [status, setStatus] = useState<AudioStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [features, setFeatures] = useState<AudioFeatures>({ rms: 0, spectralCentroid: 0, zcr: 0, pitchEstimate: 0 });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const frameCountRef = useRef(0);

  const startMic = useCallback(async () => {
    setStatus('requesting');
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.75;
      analyserRef.current = analyser;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      setStatus('active');
    } catch {
      setError('Microphone access denied. Please allow microphone permissions.');
      setStatus('error');
    }
  }, []);

  const stopMic = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
    analyserRef.current = null;
    setStatus('idle');
    setFeatures({ rms: 0, spectralCentroid: 0, zcr: 0, pitchEstimate: 0 });
  }, []);

  useEffect(() => {
    if (status !== 'active' || !active) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }

    intervalRef.current = setInterval(() => {
      const analyser = analyserRef.current;
      if (!analyser) return;

      const bufferLength = analyser.fftSize;
      const freqBins = analyser.frequencyBinCount;
      const timeData = new Float32Array(bufferLength);
      const freqData = new Float32Array(freqBins);
      analyser.getFloatTimeDomainData(timeData);
      analyser.getFloatFrequencyData(freqData);

      const rms = Math.sqrt(timeData.reduce((s, v) => s + v * v, 0) / bufferLength);
      const sampleRate = analyser.context.sampleRate;

      // Spectral centroid (weighted mean frequency)
      let weightedSum = 0, totalMag = 0;
      for (let i = 0; i < freqBins; i++) {
        const mag = Math.pow(10, freqData[i] / 20); // dB to linear
        const freq = (i * sampleRate) / (freqBins * 2);
        weightedSum += freq * mag;
        totalMag += mag;
      }
      const spectralCentroid = totalMag > 0 ? weightedSum / totalMag : 0;

      // Zero crossing rate
      let crossings = 0;
      for (let i = 1; i < bufferLength; i++) {
        if ((timeData[i] >= 0) !== (timeData[i - 1] >= 0)) crossings++;
      }
      const zcr = crossings / bufferLength;

      // Rough pitch estimate (dominant frequency in vocal range 80-1000 Hz)
      let maxMag = -Infinity, pitchBin = 0;
      const minBin = Math.floor((80 * freqBins * 2) / sampleRate);
      const maxBin = Math.floor((1000 * freqBins * 2) / sampleRate);
      for (let i = minBin; i < maxBin && i < freqBins; i++) {
        if (freqData[i] > maxMag) { maxMag = freqData[i]; pitchBin = i; }
      }
      const pitchEstimate = (pitchBin * sampleRate) / (freqBins * 2);

      const extracted: AudioFeatures = { rms, spectralCentroid, zcr, pitchEstimate };
      setFeatures(extracted);

      frameCountRef.current++;
      const frame = buildAudioFrame(extracted, sessionId, frameCountRef.current);
      onFrame(frame);
    }, 2000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [status, active, sessionId, onFrame]);

  useEffect(() => () => { stopMic(); }, [stopMic]);

  return { status, error, features, analyserRef, startMic, stopMic };
}

function estimateEmotion(rms: number, spectralCentroid: number, zcr: number): EmotionDistribution {
  const energy = Math.min(rms / 0.25, 1);
  const pitch = Math.min(spectralCentroid / 2500, 1);
  const noise = Math.min(zcr / 0.15, 1);
  const silence = energy < 0.05;

  if (silence) return { neutral: 0.85, joy: 0, sadness: 0.05, anger: 0, fear: 0.05, surprise: 0, disgust: 0.05 };

  const dist: EmotionDistribution = { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0, disgust: 0, neutral: 0 };

  // High energy + high pitch → joy or anger
  if (energy > 0.65 && pitch > 0.6) {
    dist.joy = 0.45 + (1 - noise) * 0.2;
    dist.anger = 0.20 + noise * 0.2;
    dist.surprise = 0.15;
    dist.neutral = 0.1;
  } else if (energy > 0.65 && pitch < 0.4) {
    // High energy + low pitch → anger
    dist.anger = 0.55;
    dist.disgust = 0.15;
    dist.neutral = 0.2;
    dist.sadness = 0.1;
  } else if (energy < 0.3 && pitch < 0.35) {
    // Low energy + low pitch → sadness
    dist.sadness = 0.55;
    dist.neutral = 0.30;
    dist.disgust = 0.1;
    dist.fear = 0.05;
  } else if (noise > 0.5 && pitch > 0.55) {
    // High noise + high pitch → fear
    dist.fear = 0.45;
    dist.surprise = 0.25;
    dist.neutral = 0.2;
    dist.anger = 0.1;
  } else {
    // Neutral speech
    dist.neutral = 0.6;
    dist.joy = energy * 0.2;
    dist.sadness = (1 - energy) * 0.1;
    dist.anger = 0.05;
    dist.fear = 0.025;
    dist.surprise = 0.025;
    dist.disgust = 0;
  }

  // Normalize
  const total = Object.values(dist).reduce((s, v) => s + v, 0);
  if (total > 0) (Object.keys(dist) as EmotionLabel[]).forEach(k => { dist[k] /= total; });
  return dist;
}

function buildAudioFrame(features: AudioFeatures, sessionId: string, frameNumber: number): EmotionFrame {
  const distribution = estimateEmotion(features.rms, features.spectralCentroid, features.zcr);
  const sorted = (Object.entries(distribution) as [EmotionLabel, number][]).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0][0];
  const confidence = sorted[0][1];

  const valence = (Object.entries(distribution) as [EmotionLabel, number][]).reduce((s, [e, p]) => s + VALENCE_MAP[e] * p, 0);
  const arousal = (Object.entries(distribution) as [EmotionLabel, number][]).reduce((s, [e, p]) => s + AROUSAL_MAP[e] * p, 0);
  const stress = Math.min(1, distribution.anger * 0.6 + distribution.fear * 0.5 + (1 - features.rms > 0.1 ? 0 : 0.1));

  return {
    timestamp: new Date().toISOString(),
    session_id: sessionId,
    frame_number: frameNumber,
    dominant_emotion: dominant,
    confidence,
    emotion_distribution: distribution,
    dimensional_model: { valence, arousal, dominance: 0.5 },
    modality_signals: {
      visual: { dominant, confidence: 0, active_AUs: [], face_detected: false, expressivity_index: 0 },
      audio: {
        dominant, confidence,
        features: {
          pitch_mean_hz: Math.round(features.pitchEstimate),
          pitch_range_hz: Math.round(features.spectralCentroid),
          energy_rms: features.rms,
          speech_rate_syl_s: features.zcr * 10,
          pause_ratio: features.rms < 0.02 ? 1 : 0,
        },
        voice_quality: features.zcr > 0.12 ? 'tense' : 'clear',
        speech_detected: features.rms > 0.02,
      },
    },
    flags: { micro_expression_detected: false, mixed_signals: false, stress_level: stress, emotional_shift: false },
  };
}
