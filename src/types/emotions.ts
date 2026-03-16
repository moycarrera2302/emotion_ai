export type EmotionLabel = 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'disgust' | 'neutral';

export type CompoundEmotion = 'amusement' | 'contempt' | 'anxiety';

export interface EmotionDistribution {
  joy: number;
  sadness: number;
  anger: number;
  fear: number;
  surprise: number;
  disgust: number;
  neutral: number;
}

export interface DimensionalModel {
  valence: number;
  arousal: number;
  dominance: number;
}

export interface VisualSignal {
  dominant: EmotionLabel;
  confidence: number;
  active_AUs: string[];
  face_detected: boolean;
  expressivity_index: number;
}



export interface EmotionFlags {
  micro_expression_detected: boolean;
  mixed_signals: boolean;
  stress_level: number;
  emotional_shift: boolean;
}

export interface EmotionFrame {
  timestamp: string;
  session_id: string;
  frame_number: number;
  dominant_emotion: EmotionLabel;
  confidence: number;
  emotion_distribution: EmotionDistribution;
  dimensional_model: DimensionalModel;
  visual: VisualSignal;
  flags: EmotionFlags;
}

export interface SessionSummary {
  session_id: string;
  start_time: string;
  duration_seconds: number;
  dominant_distribution: EmotionDistribution;
  avg_valence: number;
  avg_arousal: number;
  stress_trend: 'increasing' | 'decreasing' | 'stable';
  valence_trend: 'improving' | 'declining' | 'stable';
  peak_moments: Array<{
    timestamp: string;
    emotion: EmotionLabel;
    intensity: number;
  }>;
  emotional_variability: number;
}

export type SessionStatus = 'active' | 'paused' | 'completed';

export interface Session {
  id: string;
  status: SessionStatus;
  startTime: string;
  frames: EmotionFrame[];
  notes: string[];
}

export type BreathingExercise = '4-7-8' | 'box' | 'physiological-sigh' | 'coherent' | 'body-scan';

export interface MindfulnessPrompt {
  active: boolean;
  exercise: BreathingExercise | null;
  pre_valence: number | null;
  post_valence: number | null;
}
