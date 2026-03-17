import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useEmotion } from '../context/EmotionContext';
import { useFaceDetection } from '../hooks/useFaceDetection';
import { EMOTION_COLORS } from '../utils/colors';
import type { EmotionFrame, EmotionLabel } from '../types/emotions';

export function VisualPage() {
  const { session, latestFrame, processFrame } = useEmotion();
  const sessionActive = session.status === 'active';
  const sessionDone = session.status === 'completed';

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
  const dist = latestFrame?.emotion_distribution;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 80px' }}>

      {/* ── Session complete banner ────────────────────────────────────── */}
      {sessionDone && session.frames.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #F8F5F0, #F0EDE5)',
          borderRadius: 16, padding: '32px 36px', marginBottom: 28,
          border: '1px solid #E8E4DD',
          textAlign: 'center',
        }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700,
            color: '#2C2A26', marginBottom: 8,
          }}>
            Your session is ready
          </h2>
          <p style={{ fontSize: 15, color: '#7A756B', marginBottom: 24, lineHeight: 1.6 }}>
            {session.frames.length} moments captured. Your emotional fingerprint has been created.
            <br />Head to the Timeline to explore your data and download your art.
          </p>
          <Link to="/timeline" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#2C2A26', color: '#FDFBF8',
            padding: '14px 32px', borderRadius: 50, fontSize: 14, fontWeight: 600,
            textDecoration: 'none', boxShadow: '0 4px 16px rgba(44,42,38,0.15)',
          }}>
            View Timeline & Download &rarr;
          </Link>
        </div>
      )}

      {/* ── Main layout ───────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>

        {/* Left: Camera feed (main focus) */}
        <div>
          <div style={{
            position: 'relative', width: '100%', aspectRatio: '4/3',
            borderRadius: 20, overflow: 'hidden', background: '#111',
            boxShadow: '0 20px 60px rgba(44,42,38,0.12)',
            border: '1px solid #E8E4DD',
          }}>
            <video
              ref={videoRef}
              autoPlay muted playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: isLive ? 'block' : 'none', transform: 'scaleX(-1)' }}
            />
            <canvas
              ref={canvasRef}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'scaleX(-1)', pointerEvents: 'none', display: isLive ? 'block' : 'none' }}
            />

            {/* Overlay when not live */}
            {!isLive && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 16,
                background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
              }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '2px solid rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28,
                }}>
                  {status === 'error' ? '⚠️' : isLoading ? '⏳' : '📷'}
                </div>
                <div style={{ textAlign: 'center', maxWidth: 300 }}>
                  <p style={{ fontSize: 15, color: '#ccc', marginBottom: 4 }}>
                    {(status === 'loading-models' || status === 'idle') && 'Preparing face detection...'}
                    {status === 'models-ready' && (sessionActive ? 'Camera ready' : 'Start a session to begin')}
                    {status === 'requesting-camera' && 'Allow camera access in your browser'}
                    {status === 'error' && (error ?? 'Camera error')}
                  </p>
                  {status === 'models-ready' && sessionActive && (
                    <p style={{ fontSize: 12, color: '#888' }}>
                      Feel free to express yourself — smile, reflect, let it all out.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Live emotion pill overlay (top-left) - minimal */}
            {isLive && latestFrame && (
              <div style={{
                position: 'absolute', top: 14, left: 14,
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
                borderRadius: 20, padding: '6px 14px',
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#6BAE7A',
                }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.8)', textTransform: 'capitalize' }}>
                  {latestFrame.dominant_emotion}
                </span>
              </div>
            )}


          </div>

          {/* Camera controls */}
          <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'center' }}>
            {!isLive ? (
              <button onClick={startCamera}
                disabled={!sessionActive || isLoading || status !== 'models-ready'}
                style={{
                  background: (sessionActive && status === 'models-ready') ? '#2C2A26' : '#D4CFC7',
                  color: (sessionActive && status === 'models-ready') ? '#FDFBF8' : '#A8A08E',
                  border: 'none', borderRadius: 50, padding: '12px 32px',
                  fontSize: 14, fontWeight: 600,
                  cursor: (sessionActive && status === 'models-ready') ? 'pointer' : 'not-allowed',
                }}>
                {isLoading ? 'Loading models...' : 'Enable Camera'}
              </button>
            ) : (
              <button onClick={stopCamera} style={{
                background: 'transparent', color: '#7A756B',
                border: '1px solid #D4CFC7', borderRadius: 50, padding: '12px 28px',
                fontSize: 14, fontWeight: 500, cursor: 'pointer',
              }}>
                Disable Camera
              </button>
            )}
          </div>

          {/* Encouragement text */}
          {isLive && (
            <p style={{
              textAlign: 'center', fontSize: 13, color: '#B0A99E', marginTop: 14,
              fontStyle: 'italic', lineHeight: 1.5,
            }}>
              Be present. Feel what comes. No need to perform for the camera.
            </p>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 80 }}>

          {/* Emotion distribution bars */}
          <div style={card}>
            <h3 style={sectionLabel}>Emotion Reading</h3>
            {dist ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(Object.entries(dist) as [EmotionLabel, number][])
                  .sort((a, b) => b[1] - a[1])
                  .map(([emotion, value]) => (
                    <div key={emotion}>
                      <div style={{ marginBottom: 3 }}>
                        <span style={{ fontSize: 12, color: '#5A5650', textTransform: 'capitalize' }}>{emotion}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: '#F0EDE8', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 3, width: `${value * 100}%`,
                          background: EMOTION_COLORS[emotion],
                          transition: 'width 1.5s ease-out',
                        }} />
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: '#B0A99E', textAlign: 'center', padding: '20px 0' }}>
                Waiting for camera...
              </p>
            )}
          </div>

          {/* Dimensions */}
          {latestFrame && (
            <div style={card}>
              <h3 style={sectionLabel}>Dimensions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <DimBar label="Valence" value={latestFrame.dimensional_model.valence} />
                <DimBar label="Arousal" value={latestFrame.dimensional_model.arousal} />
                <DimBar label="Stress" value={latestFrame.flags.stress_level} isStress />
              </div>
            </div>
          )}

          {/* Active AUs */}
          {latestFrame?.visual.face_detected && (
            <div style={card}>
              <h3 style={sectionLabel}>Facial Action Units</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {latestFrame.visual.active_AUs.length > 0
                  ? latestFrame.visual.active_AUs.map(au => (
                    <span key={au} style={{
                      background: `${EMOTION_COLORS[latestFrame.dominant_emotion]}15`,
                      border: `1px solid ${EMOTION_COLORS[latestFrame.dominant_emotion]}30`,
                      borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600,
                      color: '#2C2A26',
                    }}>{au}</span>
                  ))
                  : <span style={{ fontSize: 12, color: '#B0A99E' }}>Neutral — no strong AUs</span>
                }
              </div>
            </div>
          )}

          {/* Mesh legend */}
          <div style={{ ...card, padding: '14px 16px' }}>
            <h3 style={{ ...sectionLabel, marginBottom: 8, fontSize: 10 }}>Face Mesh</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {[
                { color: '#6BAE7A', label: 'Eyes' },
                { color: '#E8B931', label: 'Brows' },
                { color: '#C4614E', label: 'Mouth' },
                { color: '#A8C4E0', label: 'Nose' },
                { color: '#C4946A', label: 'Jaw' },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 2, background: color, borderRadius: 1 }} />
                  <span style={{ fontSize: 10, color: '#A8A08E' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* What am I seeing? */}
          <details style={{ ...card, cursor: 'pointer' }}>
            <summary style={{ ...sectionLabel, marginBottom: 0, cursor: 'pointer', userSelect: 'none' }}>
              What does each emotion look like?
            </summary>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {EMOTION_GUIDE.map(({ emotion, color, face }) => (
                <div key={emotion} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, marginTop: 4, flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#2C2A26', textTransform: 'capitalize' }}>{emotion}: </span>
                    <span style={{ fontSize: 11, color: '#7A756B' }}>{face}</span>
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

function DimBar({ label, value, isStress }: { label: string; value: number; isStress?: boolean }) {
  const normalized = isStress ? value : (value + 1) / 2;
  const color = isStress
    ? (value > 0.6 ? '#C4614E' : value > 0.3 ? '#C4946A' : '#6BAE7A')
    : (value >= 0 ? '#6BAE7A' : '#C4614E');
  return (
    <div>
      <div style={{ marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: '#7A756B' }}>{label}</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: '#F0EDE8', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 2, width: `${normalized * 100}%`, background: color, transition: 'width 1.5s ease-out' }} />
      </div>
    </div>
  );
}

const EMOTION_GUIDE = [
  { emotion: 'joy', color: '#E8B931', face: 'Raised cheeks, lip corners up (Duchenne smile)' },
  { emotion: 'sadness', color: '#6B8DAE', face: 'Inner brow raise, lip corners down, drooping lids' },
  { emotion: 'anger', color: '#C4614E', face: 'Brows lowered, lids tight, lips compressed' },
  { emotion: 'fear', color: '#8B6BAE', face: 'Wide eyes, raised brows, tense mouth' },
  { emotion: 'surprise', color: '#4EA88B', face: 'Wide open eyes and mouth, raised eyebrows' },
  { emotion: 'neutral', color: '#A8A08E', face: 'Relaxed muscles, resting expression' },
];

const card: React.CSSProperties = {
  background: '#fff', borderRadius: 14, padding: 18,
  border: '1px solid #E8E4DD', boxShadow: '0 1px 4px rgba(44,42,38,0.04)',
};

const sectionLabel: React.CSSProperties = {
  margin: '0 0 10px', fontSize: 11, fontWeight: 600, color: '#A8A08E',
  textTransform: 'uppercase', letterSpacing: 1.5,
};
