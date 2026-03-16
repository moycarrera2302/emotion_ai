import { useCallback } from 'react';
import { useEmotion } from '../context/EmotionContext';
import { useFaceDetection } from '../hooks/useFaceDetection';
import { EmotionDashboard } from '../components/EmotionDashboard';
import { EmotionChart } from '../components/EmotionChart';
import { THEME, EMOTION_COLORS } from '../utils/colors';
import type { EmotionFrame } from '../types/emotions';

export function VisualPage() {
  const { session, latestFrame, processFrame } = useEmotion();
  const sessionActive = session.status === 'active';

  const handleFrame = useCallback((frame: EmotionFrame) => {
    if (sessionActive) processFrame(frame);
  }, [sessionActive, processFrame]);

  const { videoRef, canvasRef, status, error, startCamera, stopCamera } = useFaceDetection({
    sessionId: session.id,
    active: sessionActive,
    onFrame: handleFrame,
  });

  const isLive = status === 'active';
  const isLoading = status === 'loading-models' || status === 'requesting-camera';

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>
      <h1 style={pageTitle}>Visual Analysis</h1>
      <p style={pageSubtitle}>Facial expression recognition using FACS Action Units with real-time face mesh vectorization</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>
        {/* Left: dashboard + chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <EmotionDashboard frame={latestFrame} />
          <EmotionChart distribution={latestFrame?.emotion_distribution ?? null} />

          {/* AU legend */}
          {latestFrame?.modality_signals.visual.face_detected && (
            <div style={card}>
              <h3 style={sectionLabel}>Active Action Units (FACS)</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {latestFrame.modality_signals.visual.active_AUs.length > 0
                  ? latestFrame.modality_signals.visual.active_AUs.map(au => (
                      <span key={au} style={{
                        background: `${EMOTION_COLORS[latestFrame.dominant_emotion]}18`,
                        border: `1px solid ${EMOTION_COLORS[latestFrame.dominant_emotion]}40`,
                        borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600,
                        color: THEME.text,
                      }}>{au}</span>
                    ))
                  : <span style={{ fontSize: 12, color: THEME.textMuted }}>No active AUs (neutral)</span>
                }
              </div>
              <p style={{ margin: '10px 0 0', fontSize: 11, color: THEME.textMuted, lineHeight: 1.5 }}>
                Based on Ekman & Friesen (1978) FACS Manual. Face mesh shows 68 tracked landmark points.
              </p>
            </div>
          )}
        </div>

        {/* Right: camera feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 80 }}>
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={sectionLabel}>Camera Feed</h3>
              <span style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 11, fontWeight: 600,
                color: isLive ? THEME.positive : isLoading ? THEME.accent : THEME.textMuted,
              }}>
                {isLive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: THEME.positive, animation: 'pulse 2s infinite' }} />}
                {isLive ? 'Detecting' : isLoading ? 'Loading...' : status === 'models-ready' ? 'Ready' : status === 'error' ? 'Error' : 'Idle'}
              </span>
            </div>

            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: 8, overflow: 'hidden', background: '#111' }}>
              <video
                ref={videoRef}
                autoPlay muted playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: isLive ? 'block' : 'none', transform: 'scaleX(-1)' }}
              />
              <canvas
                ref={canvasRef}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'scaleX(-1)', pointerEvents: 'none', display: isLive ? 'block' : 'none' }}
              />
              {!isLive && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{ fontSize: 32 }}>{status === 'error' ? '⚠️' : '📷'}</span>
                  <span style={{ fontSize: 12, color: '#666', textAlign: 'center', padding: '0 16px' }}>
                    {(status === 'loading-models' || status === 'idle') && 'Loading face detection models...'}
                    {status === 'models-ready' && (sessionActive ? 'Click Enable Camera' : 'Start session first')}
                    {status === 'requesting-camera' && 'Allow camera access in browser'}
                    {status === 'error' && error}
                  </span>
                </div>
              )}
            </div>

            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              {!isLive
                ? <button onClick={startCamera} disabled={!sessionActive || isLoading || status !== 'models-ready'}
                    style={{ flex: 1, background: (sessionActive && status === 'models-ready') ? THEME.accent : THEME.borderLight, color: (sessionActive && status === 'models-ready') ? '#fff' : THEME.textMuted, border: 'none', borderRadius: 8, padding: '9px 0', fontSize: 12, fontWeight: 600, cursor: (sessionActive && status === 'models-ready') ? 'pointer' : 'not-allowed' }}>
                    {isLoading ? 'Please wait...' : 'Enable Camera'}
                  </button>
                : <button onClick={stopCamera} style={{ flex: 1, background: THEME.bgHover, color: THEME.text, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: '9px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Disable Camera
                  </button>
              }
            </div>
          </div>

          {/* Mesh legend */}
          <div style={{ ...card, padding: '14px 16px' }}>
            <h3 style={{ ...sectionLabel, marginBottom: 8 }}>Face Mesh Legend</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[
                { color: '#6BAE7A', label: 'Eyes (AU1-7 area)' },
                { color: '#E8B931', label: 'Eyebrows (AU1,2,4)' },
                { color: '#C4614E', label: 'Mouth / Lips (AU20-28)' },
                { color: '#A8C4E0', label: 'Nose' },
                { color: '#C4946A', label: 'Jaw line' },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 2, background: color, borderRadius: 1 }} />
                  <span style={{ fontSize: 11, color: THEME.textSecondary }}>{label}</span>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.75)', border: '1px solid #666' }} />
                <span style={{ fontSize: 11, color: THEME.textSecondary }}>68 landmark points</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const pageTitle: React.CSSProperties = { margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: THEME.text };
const pageSubtitle: React.CSSProperties = { margin: '0 0 24px', fontSize: 13, color: THEME.textSecondary };
const card: React.CSSProperties = { background: THEME.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${THEME.border}`, boxShadow: THEME.shadow };
const sectionLabel: React.CSSProperties = { margin: '0 0 12px', fontSize: 12, fontWeight: 600, color: THEME.textSecondary, textTransform: 'uppercase', letterSpacing: 1 };
