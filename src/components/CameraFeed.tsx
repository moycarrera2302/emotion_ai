import type { RefObject } from 'react';
import type { CameraStatus } from '../hooks/useFaceDetection';
import { THEME } from '../utils/colors';

interface Props {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  status: CameraStatus;
  error: string | null;
  sessionActive: boolean;
  onStart: () => void;
  onStop: () => void;
}

const STATUS_LABEL: Record<CameraStatus, string> = {
  'idle': 'Off',
  'loading-models': 'Loading AI models...',
  'models-ready': 'Ready',
  'requesting-camera': 'Requesting access...',
  'active': 'Live',
  'error': 'Error',
};

export function CameraFeed({ videoRef, canvasRef, status, error, sessionActive, onStart, onStop }: Props) {
  const isLive = status === 'active';
  const isLoading = status === 'loading-models' || status === 'requesting-camera';
  const canEnable = status === 'models-ready' && sessionActive;

  return (
    <div style={{
      background: THEME.bgCard,
      borderRadius: 12,
      padding: 20,
      border: `1px solid ${THEME.border}`,
      boxShadow: THEME.shadow,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: THEME.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>
          Camera
        </h2>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 11, fontWeight: 600,
          color: isLive ? THEME.positive : isLoading ? THEME.accent : THEME.textMuted,
        }}>
          {isLive && (
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: THEME.positive,
              animation: 'pulse 2s ease-in-out infinite',
            }} />
          )}
          {STATUS_LABEL[status]}
        </span>
      </div>

      {/* Video viewport */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '4/3',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#1a1a1a',
      }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: isLive ? 'block' : 'none',
            transform: 'scaleX(-1)', // Mirror for natural selfie view
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            transform: 'scaleX(-1)',
            pointerEvents: 'none',
            display: isLive ? 'block' : 'none',
          }}
        />

        {/* Overlay for non-live states */}
        {!isLive && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 28 }}>
              {status === 'loading-models' ? '⚙️' : status === 'error' ? '⚠️' : '📷'}
            </span>
            <span style={{ fontSize: 12, color: '#888', textAlign: 'center', padding: '0 16px' }}>
              {status === 'loading-models' && 'Loading face detection models...'}
              {status === 'idle' && 'Models loading...'}
              {status === 'models-ready' && (sessionActive ? 'Click Enable Camera to start' : 'Start a session first')}
              {status === 'requesting-camera' && 'Allow camera access in your browser'}
              {status === 'error' && (error ?? 'An error occurred')}
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        {!isLive ? (
          <button
            onClick={onStart}
            disabled={!canEnable}
            style={{
              flex: 1,
              background: canEnable ? THEME.accent : THEME.borderLight,
              color: canEnable ? '#fff' : THEME.textMuted,
              border: 'none',
              borderRadius: 8,
              padding: '9px 0',
              fontSize: 12,
              fontWeight: 600,
              cursor: canEnable ? 'pointer' : 'not-allowed',
            }}
          >
            {isLoading ? 'Please wait...' : 'Enable Camera'}
          </button>
        ) : (
          <button
            onClick={onStop}
            style={{
              flex: 1,
              background: THEME.bgHover,
              color: THEME.text,
              border: `1px solid ${THEME.border}`,
              borderRadius: 8,
              padding: '9px 0',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Disable Camera
          </button>
        )}
      </div>

      {isLive && (
        <p style={{ margin: '8px 0 0', fontSize: 10, color: THEME.textMuted, textAlign: 'center' }}>
          Face detection runs locally in your browser. No video is transmitted.
        </p>
      )}
    </div>
  );
}
