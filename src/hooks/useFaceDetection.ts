import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';
import type { EmotionFrame, EmotionLabel, EmotionDistribution } from '../types/emotions';

export type CameraStatus = 'idle' | 'loading-models' | 'models-ready' | 'requesting-camera' | 'active' | 'error';

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

function weightedDim(dist: EmotionDistribution, map: Record<EmotionLabel, number>): number {
  return (Object.entries(dist) as [EmotionLabel, number][]).reduce(
    (sum, [e, p]) => sum + map[e] * p, 0,
  );
}

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

  const [status, setStatus] = useState<CameraStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const modelsLoadedRef = useRef(false);

  // Load models once on mount
  useEffect(() => {
    if (modelsLoadedRef.current) return;
    setStatus('loading-models');

    const MODEL_URL = `${import.meta.env.BASE_URL}models`;
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ])
      .then(() => {
        modelsLoadedRef.current = true;
        setStatus('models-ready');
      })
      .catch(() => {
        setError('Failed to load face detection models.');
        setStatus('error');
      });
  }, []);

  const startCamera = useCallback(async () => {
    if (!modelsLoadedRef.current) return;
    setStatus('requesting-camera');
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus('active');
    } catch {
      setError('Camera access denied. Please allow camera permissions and try again.');
      setStatus('models-ready');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (detectionRef.current) {
      clearInterval(detectionRef.current);
      detectionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (modelsLoadedRef.current) {
      setStatus('models-ready');
    } else {
      setStatus('idle');
    }
    setError(null);
  }, []);

  // Detection loop
  useEffect(() => {
    if (status !== 'active' || !active) {
      if (detectionRef.current) {
        clearInterval(detectionRef.current);
        detectionRef.current = null;
      }
      return;
    }

    detectionRef.current = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.paused || video.readyState < 2) return;

      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4 }))
        .withFaceExpressions();

      frameCounterRef.current++;

      // Draw overlay
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detection) {
          const resized = faceapi.resizeResults(detection, {
            width: video.videoWidth,
            height: video.videoHeight,
          });
          faceapi.draw.drawDetections(canvas, resized);
        }
      }

      const frame = detection
        ? buildFrameFromDetection(detection.expressions, sessionId, frameCounterRef.current)
        : buildNoFaceFrame(sessionId, frameCounterRef.current);

      onFrame(frame);
    }, 200);

    return () => {
      if (detectionRef.current) clearInterval(detectionRef.current);
    };
  }, [status, active, sessionId, onFrame]);

  // Cleanup on unmount
  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  return { videoRef, canvasRef, status, error, startCamera, stopCamera };
}

function buildFrameFromDetection(
  expressions: faceapi.FaceExpressions,
  sessionId: string,
  frameNumber: number,
): EmotionFrame {
  const distribution: EmotionDistribution = {
    joy: expressions.happy ?? 0,
    sadness: expressions.sad ?? 0,
    anger: expressions.angry ?? 0,
    fear: expressions.fearful ?? 0,
    surprise: expressions.surprised ?? 0,
    disgust: expressions.disgusted ?? 0,
    neutral: expressions.neutral ?? 0,
  };

  const sorted = (Object.entries(distribution) as [EmotionLabel, number][]).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0][0];
  const confidence = sorted[0][1];

  const valence = weightedDim(distribution, VALENCE_MAP);
  const arousal = weightedDim(distribution, AROUSAL_MAP);
  const dominance = weightedDim(distribution, DOMINANCE_MAP);
  const stress = Math.min(1, distribution.anger * 0.6 + distribution.fear * 0.5 + distribution.sadness * 0.3);

  return {
    timestamp: new Date().toISOString(),
    session_id: sessionId,
    frame_number: frameNumber,
    dominant_emotion: dominant,
    confidence,
    emotion_distribution: distribution,
    dimensional_model: { valence, arousal, dominance },
    modality_signals: {
      visual: {
        dominant,
        confidence,
        active_AUs: AU_MAP[dominant],
        face_detected: true,
        expressivity_index: 1 - distribution.neutral,
      },
      audio: {
        dominant,
        confidence: 0,
        features: { pitch_mean_hz: 0, pitch_range_hz: 0, energy_rms: 0, speech_rate_syl_s: 0, pause_ratio: 0 },
        voice_quality: 'clear',
        speech_detected: false,
      },
    },
    flags: {
      micro_expression_detected: false,
      mixed_signals: false,
      stress_level: stress,
      emotional_shift: false,
    },
  };
}

function buildNoFaceFrame(sessionId: string, frameNumber: number): EmotionFrame {
  const distribution: EmotionDistribution = {
    joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0, disgust: 0, neutral: 1,
  };
  return {
    timestamp: new Date().toISOString(),
    session_id: sessionId,
    frame_number: frameNumber,
    dominant_emotion: 'neutral',
    confidence: 0,
    emotion_distribution: distribution,
    dimensional_model: { valence: 0, arousal: 0, dominance: 0 },
    modality_signals: {
      visual: {
        dominant: 'neutral',
        confidence: 0,
        active_AUs: [],
        face_detected: false,
        expressivity_index: 0,
      },
      audio: {
        dominant: 'neutral',
        confidence: 0,
        features: { pitch_mean_hz: 0, pitch_range_hz: 0, energy_rms: 0, speech_rate_syl_s: 0, pause_ratio: 0 },
        voice_quality: 'clear',
        speech_detected: false,
      },
    },
    flags: {
      micro_expression_detected: false,
      mixed_signals: false,
      stress_level: 0,
      emotional_shift: false,
    },
  };
}
