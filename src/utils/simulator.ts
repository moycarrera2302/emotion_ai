import type {
  EmotionLabel,
  EmotionDistribution,
  EmotionFrame,
  DimensionalModel,
  VisualSignal,
  AudioSignal,
  EmotionFlags,
} from '../types/emotions';

const EMOTIONS: EmotionLabel[] = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'neutral'];

const AU_MAP: Record<EmotionLabel, string[]> = {
  joy: ['AU6', 'AU12'],
  sadness: ['AU1', 'AU4', 'AU15'],
  anger: ['AU4', 'AU5', 'AU7', 'AU23'],
  fear: ['AU1', 'AU2', 'AU4', 'AU5', 'AU20'],
  surprise: ['AU1', 'AU2', 'AU5B', 'AU27'],
  disgust: ['AU9', 'AU15', 'AU25'],
  neutral: [],
};

const VALENCE_MAP: Record<EmotionLabel, number> = {
  joy: 0.8, sadness: -0.6, anger: -0.5, fear: -0.7,
  surprise: 0.2, disgust: -0.4, neutral: 0.0,
};

const AROUSAL_MAP: Record<EmotionLabel, number> = {
  joy: 0.6, sadness: -0.4, anger: 0.8, fear: 0.7,
  surprise: 0.8, disgust: 0.3, neutral: 0.0,
};

const DOMINANCE_MAP: Record<EmotionLabel, number> = {
  joy: 0.6, sadness: -0.5, anger: 0.7, fear: -0.6,
  surprise: 0.0, disgust: 0.3, neutral: 0.5,
};

function clamp(v: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, v));
}

function jitter(base: number, range: number): number {
  return base + (Math.random() - 0.5) * 2 * range;
}

let currentMood: EmotionLabel = 'neutral';
let moodInertia = 0;
let frameCounter = 0;
let stressAccumulator = 0.15;

export function resetSimulator(): void {
  currentMood = 'neutral';
  moodInertia = 0;
  frameCounter = 0;
  stressAccumulator = 0.15;
}

export function generateEmotionFrame(sessionId: string): EmotionFrame {
  frameCounter++;

  if (moodInertia <= 0) {
    const r = Math.random();
    if (r < 0.35) currentMood = 'joy';
    else if (r < 0.45) currentMood = 'sadness';
    else if (r < 0.52) currentMood = 'anger';
    else if (r < 0.58) currentMood = 'fear';
    else if (r < 0.65) currentMood = 'surprise';
    else if (r < 0.68) currentMood = 'disgust';
    else currentMood = 'neutral';
    moodInertia = 5 + Math.floor(Math.random() * 15);
  }
  moodInertia--;

  const distribution = generateDistribution(currentMood);
  const dominant = currentMood;
  const confidence = distribution[dominant];

  const dimensional = generateDimensional(dominant, confidence);
  const visual = generateVisual(dominant, confidence);
  const audio = generateAudio(dominant, confidence);
  const flags = generateFlags(dominant, confidence, visual, audio);

  return {
    timestamp: new Date().toISOString(),
    session_id: sessionId,
    frame_number: frameCounter,
    dominant_emotion: dominant,
    confidence,
    emotion_distribution: distribution,
    dimensional_model: dimensional,
    modality_signals: { visual, audio },
    flags,
  };
}

function generateDistribution(dominant: EmotionLabel): EmotionDistribution {
  const dist: EmotionDistribution = { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0, disgust: 0, neutral: 0 };
  const dominantVal = clamp(jitter(0.7, 0.15), 0.4, 0.95);
  dist[dominant] = dominantVal;

  let remaining = 1 - dominantVal;
  const others = EMOTIONS.filter(e => e !== dominant);
  others.forEach((e, i) => {
    if (i === others.length - 1) {
      dist[e] = clamp(remaining, 0, 1);
    } else {
      const share = clamp(jitter(remaining / (others.length - i), remaining * 0.3), 0, remaining);
      dist[e] = Math.round(share * 100) / 100;
      remaining -= dist[e];
    }
  });

  return dist;
}

function generateDimensional(dominant: EmotionLabel, confidence: number): DimensionalModel {
  return {
    valence: clamp(jitter(VALENCE_MAP[dominant] * confidence, 0.1), -1, 1),
    arousal: clamp(jitter(AROUSAL_MAP[dominant] * confidence, 0.1), -1, 1),
    dominance: clamp(jitter(DOMINANCE_MAP[dominant] * confidence, 0.1), -1, 1),
  };
}

function generateVisual(dominant: EmotionLabel, confidence: number): VisualSignal {
  return {
    dominant,
    confidence: clamp(jitter(confidence, 0.08)),
    active_AUs: AU_MAP[dominant],
    face_detected: Math.random() > 0.02,
    expressivity_index: clamp(jitter(0.6, 0.2)),
  };
}

function generateAudio(dominant: EmotionLabel, confidence: number): AudioSignal {
  const basePitch = dominant === 'joy' ? 220 : dominant === 'sadness' ? 150 : dominant === 'anger' ? 260 : 190;
  return {
    dominant,
    confidence: clamp(jitter(confidence - 0.05, 0.1)),
    features: {
      pitch_mean_hz: Math.round(jitter(basePitch, 30)),
      pitch_range_hz: Math.round(jitter(80, 25)),
      energy_rms: clamp(jitter(0.65, 0.15)),
      speech_rate_syl_s: clamp(jitter(4.0, 1.0), 1.5, 7.0),
      pause_ratio: clamp(jitter(0.18, 0.08)),
    },
    voice_quality: Math.random() > 0.8 ? 'breathy' : 'clear',
    speech_detected: Math.random() > 0.05,
  };
}

function generateFlags(
  dominant: EmotionLabel,
  _confidence: number,
  visual: VisualSignal,
  audio: AudioSignal,
): EmotionFlags {
  const mixed = visual.dominant !== audio.dominant;
  stressAccumulator = clamp(
    stressAccumulator + (dominant === 'anger' || dominant === 'fear' ? 0.02 : -0.01),
    0, 1,
  );

  return {
    micro_expression_detected: Math.random() < 0.05,
    mixed_signals: mixed,
    stress_level: clamp(jitter(stressAccumulator, 0.05)),
    emotional_shift: frameCounter > 1 && Math.random() < 0.08,
  };
}

export function generateSessionId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
