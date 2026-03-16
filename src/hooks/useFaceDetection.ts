import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';
import type { EmotionFrame, EmotionLabel, EmotionDistribution } from '../types/emotions';

export type CameraStatus = 'idle' | 'loading-models' | 'models-ready' | 'requesting-camera' | 'active' | 'error';

// ── Emotion mapping tables ──────────────────────────────────────────────────
const AU_MAP: Record<EmotionLabel, string[]> = {
  joy: ['AU6', 'AU12'], sadness: ['AU1', 'AU4', 'AU15'],
  anger: ['AU4', 'AU5', 'AU7', 'AU23'], fear: ['AU1', 'AU2', 'AU4', 'AU5', 'AU20'],
  surprise: ['AU1', 'AU2', 'AU5B', 'AU27'], disgust: ['AU9', 'AU15', 'AU25'], neutral: [],
};
const VALENCE_MAP: Record<EmotionLabel, number> = { joy: 0.8, sadness: -0.6, anger: -0.5, fear: -0.7, surprise: 0.2, disgust: -0.4, neutral: 0.0 };
const AROUSAL_MAP: Record<EmotionLabel, number> = { joy: 0.6, sadness: -0.4, anger: 0.8, fear: 0.7, surprise: 0.8, disgust: 0.3, neutral: 0.0 };
const DOMINANCE_MAP: Record<EmotionLabel, number> = { joy: 0.6, sadness: -0.5, anger: 0.7, fear: -0.6, surprise: 0.0, disgust: 0.3, neutral: 0.5 };

function weightedDim(dist: EmotionDistribution, map: Record<EmotionLabel, number>): number {
  return (Object.entries(dist) as [EmotionLabel, number][]).reduce((s, [e, p]) => s + map[e] * p, 0);
}

// ── Temporal smoothing (exponential moving average) ─────────────────────────
const SMOOTHING_ALPHA = 0.35; // lower = smoother (more history weight), higher = more responsive

class EmotionSmoother {
  private smoothed: EmotionDistribution | null = null;

  update(raw: EmotionDistribution): EmotionDistribution {
    if (!this.smoothed) { this.smoothed = { ...raw }; return this.smoothed; }

    const result: EmotionDistribution = { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0, disgust: 0, neutral: 0 };
    (Object.keys(result) as EmotionLabel[]).forEach(e => {
      result[e] = SMOOTHING_ALPHA * raw[e] + (1 - SMOOTHING_ALPHA) * this.smoothed![e];
    });

    // ── Reduce neutral bias ──
    // face-api.js over-reports neutral. Amplify non-neutral signals.
    const nonNeutralTotal = 1 - result.neutral;
    if (nonNeutralTotal > 0.08) {
      // Boost non-neutral emotions by redistributing part of neutral
      const boost = result.neutral * 0.35; // steal 35% of neutral's probability
      result.neutral -= boost;
      (Object.keys(result) as EmotionLabel[]).forEach(e => {
        if (e !== 'neutral' && result[e] > 0.01) {
          result[e] += boost * (result[e] / nonNeutralTotal);
        }
      });
    }

    // Normalize
    const total = (Object.values(result) as number[]).reduce((s, v) => s + v, 0);
    if (total > 0) (Object.keys(result) as EmotionLabel[]).forEach(e => { result[e] /= total; });

    this.smoothed = result;
    return result;
  }

  reset() { this.smoothed = null; }
}

// ── Face mesh drawing ───────────────────────────────────────────────────────
const MESH_REGIONS: Array<{ idx: number[]; color: string; closed: boolean }> = [
  { idx: Array.from({ length: 17 }, (_, i) => i),         color: '#C4946A66', closed: false },
  { idx: Array.from({ length: 5 }, (_, i) => i + 17),     color: '#E8B93166', closed: false },
  { idx: Array.from({ length: 5 }, (_, i) => i + 22),     color: '#E8B93166', closed: false },
  { idx: Array.from({ length: 4 }, (_, i) => i + 27),     color: '#A8C4E066', closed: false },
  { idx: Array.from({ length: 5 }, (_, i) => i + 31),     color: '#A8C4E066', closed: false },
  { idx: Array.from({ length: 6 }, (_, i) => i + 36),     color: '#6BAE7A99', closed: true },
  { idx: Array.from({ length: 6 }, (_, i) => i + 42),     color: '#6BAE7A99', closed: true },
  { idx: Array.from({ length: 12 }, (_, i) => i + 48),    color: '#C4614E99', closed: true },
  { idx: Array.from({ length: 8 }, (_, i) => i + 60),     color: '#E8A0A099', closed: true },
];

function drawFaceMesh(ctx: CanvasRenderingContext2D, positions: faceapi.Point[], w: number, h: number) {
  const scaleX = w / ctx.canvas.width;
  const scaleY = h / ctx.canvas.height;
  MESH_REGIONS.forEach(({ idx, color, closed }) => {
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 1.2;
    idx.forEach((pi, j) => {
      const p = positions[pi];
      j === 0 ? ctx.moveTo(p.x / scaleX, p.y / scaleY) : ctx.lineTo(p.x / scaleX, p.y / scaleY);
    });
    if (closed) ctx.closePath(); ctx.stroke();
  });
  positions.forEach(p => {
    ctx.beginPath(); ctx.arc(p.x / scaleX, p.y / scaleY, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fill();
  });
}

// ── Detection interval (ms) ─────────────────────────────────────────────────
const DETECTION_INTERVAL = 500; // 2 FPS instead of 5 FPS — more stable readings

// ── Hook ────────────────────────────────────────────────────────────────────
interface Options {
  sessionId: string;
  active: boolean;
  onFrame: (frame: EmotionFrame) => void;
}

export function useFaceDetection({ sessionId, active, onFrame }: Options) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const frameCounterRef = useRef(0);
  const modelsLoadedRef = useRef(false);
  const smootherRef = useRef(new EmotionSmoother());

  const [status, setStatus] = useState<CameraStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (modelsLoadedRef.current) return;
    setStatus('loading-models');
    const MODEL_URL = `${import.meta.env.BASE_URL}models`;
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
    ]).then(() => { modelsLoadedRef.current = true; setStatus('models-ready'); })
      .catch(() => { setError('Failed to load face detection models.'); setStatus('error'); });
  }, []);

  const startCamera = useCallback(async () => {
    if (!modelsLoadedRef.current) return;
    setStatus('requesting-camera'); setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      smootherRef.current.reset();
      setStatus('active');
    } catch { setError('Camera access denied.'); setStatus('models-ready'); }
  }, []);

  const stopCamera = useCallback(() => {
    if (detectionRef.current) { clearInterval(detectionRef.current); detectionRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    smootherRef.current.reset();
    setStatus(modelsLoadedRef.current ? 'models-ready' : 'idle'); setError(null);
  }, []);

  useEffect(() => {
    if (status !== 'active' || !active) {
      if (detectionRef.current) { clearInterval(detectionRef.current); detectionRef.current = null; }
      return;
    }

    detectionRef.current = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.paused || video.readyState < 2) return;

      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.35 }))
        .withFaceLandmarks(true)
        .withFaceExpressions();

      frameCounterRef.current++;

      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = video.clientWidth;
        canvas.height = video.clientHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          if (detection) {
            const box = detection.detection.box;
            const sx = canvas.width / video.videoWidth;
            const sy = canvas.height / video.videoHeight;
            ctx.strokeStyle = `${EMOTION_COLOR(detection.expressions)}88`;
            ctx.lineWidth = 2;
            ctx.strokeRect(box.x * sx, box.y * sy, box.width * sx, box.height * sy);
            drawFaceMesh(ctx, detection.landmarks.positions, video.videoWidth, video.videoHeight);
            const dominant = getDominant(detection.expressions);
            ctx.fillStyle = EMOTION_COLOR(detection.expressions);
            ctx.font = 'bold 13px system-ui';
            ctx.fillText(`${dominant.name} ${Math.round(dominant.score * 100)}%`, box.x * sx, (box.y * sy) - 8);
          }
        }
      }

      const frame = detection
        ? buildFrameFromDetection(detection.expressions, smootherRef.current, sessionId, frameCounterRef.current)
        : buildNoFaceFrame(sessionId, frameCounterRef.current);
      onFrame(frame);
    }, DETECTION_INTERVAL);

    return () => { if (detectionRef.current) clearInterval(detectionRef.current); };
  }, [status, active, sessionId, onFrame]);

  useEffect(() => () => { stopCamera(); }, [stopCamera]);
  return { videoRef, canvasRef, status, error, startCamera, stopCamera };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getDominant(expressions: faceapi.FaceExpressions) {
  const map: Record<string, string> = { happy: 'Joy', sad: 'Sadness', angry: 'Anger', fearful: 'Fear', surprised: 'Surprise', disgusted: 'Disgust', neutral: 'Neutral' };
  const entries = Object.entries(expressions) as [string, number][];
  const top = entries.sort((a, b) => b[1] - a[1])[0];
  return { name: map[top[0]] ?? top[0], score: top[1] };
}

const EXPR_COLORS: Record<string, string> = {
  happy: '#E8B931', sad: '#6B8DAE', angry: '#C4614E',
  fearful: '#8B6BAE', surprised: '#4EA88B', disgusted: '#7A8B5E', neutral: '#A8A08E',
};

function EMOTION_COLOR(expressions: faceapi.FaceExpressions): string {
  const entries = Object.entries(expressions) as [string, number][];
  const top = entries.sort((a, b) => b[1] - a[1])[0];
  return EXPR_COLORS[top[0]] ?? '#A8A08E';
}

function buildFrameFromDetection(
  expressions: faceapi.FaceExpressions,
  smoother: EmotionSmoother,
  sessionId: string,
  frameNumber: number,
): EmotionFrame {
  // Raw distribution from face-api.js
  const raw: EmotionDistribution = {
    joy: expressions.happy ?? 0, sadness: expressions.sad ?? 0,
    anger: expressions.angry ?? 0, fear: expressions.fearful ?? 0,
    surprise: expressions.surprised ?? 0, disgust: expressions.disgusted ?? 0,
    neutral: expressions.neutral ?? 0,
  };

  // Apply temporal smoothing + neutral bias correction
  const distribution = smoother.update(raw);

  const sorted = (Object.entries(distribution) as [EmotionLabel, number][]).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0][0];
  const confidence = sorted[0][1];
  const valence = weightedDim(distribution, VALENCE_MAP);
  const arousal = weightedDim(distribution, AROUSAL_MAP);
  const dominance = weightedDim(distribution, DOMINANCE_MAP);
  const stress = Math.min(1, distribution.anger * 0.6 + distribution.fear * 0.5 + distribution.sadness * 0.3);

  return {
    timestamp: new Date().toISOString(), session_id: sessionId, frame_number: frameNumber,
    dominant_emotion: dominant, confidence,
    emotion_distribution: distribution,
    dimensional_model: { valence, arousal, dominance },
    modality_signals: {
      visual: { dominant, confidence, active_AUs: AU_MAP[dominant], face_detected: true, expressivity_index: 1 - distribution.neutral },
      audio: { dominant, confidence: 0, features: { pitch_mean_hz: 0, pitch_range_hz: 0, energy_rms: 0, speech_rate_syl_s: 0, pause_ratio: 0 }, voice_quality: 'clear', speech_detected: false },
    },
    flags: { micro_expression_detected: false, mixed_signals: false, stress_level: stress, emotional_shift: false },
  };
}

function buildNoFaceFrame(sessionId: string, frameNumber: number): EmotionFrame {
  const dist: EmotionDistribution = { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0, disgust: 0, neutral: 1 };
  return {
    timestamp: new Date().toISOString(), session_id: sessionId, frame_number: frameNumber,
    dominant_emotion: 'neutral', confidence: 0, emotion_distribution: dist,
    dimensional_model: { valence: 0, arousal: 0, dominance: 0 },
    modality_signals: {
      visual: { dominant: 'neutral', confidence: 0, active_AUs: [], face_detected: false, expressivity_index: 0 },
      audio: { dominant: 'neutral', confidence: 0, features: { pitch_mean_hz: 0, pitch_range_hz: 0, energy_rms: 0, speech_rate_syl_s: 0, pause_ratio: 0 }, voice_quality: 'clear', speech_detected: false },
    },
    flags: { micro_expression_detected: false, mixed_signals: false, stress_level: 0, emotional_shift: false },
  };
}
