import { useCallback, useEffect, useRef } from 'react';
import { useEmotion } from '../context/EmotionContext';
import { useAudioCapture } from '../hooks/useAudioCapture';
import { EmotionBadge } from '../components/EmotionBadge';
import { THEME } from '../utils/colors';
import type { EmotionFrame } from '../types/emotions';

export function AudioPage() {
  const { session, latestFrame, processFrame } = useEmotion();
  const sessionActive = session.status === 'active';

  const handleFrame = useCallback((frame: EmotionFrame) => {
    if (sessionActive) processFrame(frame);
  }, [sessionActive, processFrame]);

  const { status, error, features, analyserRef, startMic, stopMic } = useAudioCapture({
    sessionId: session.id,
    active: sessionActive,
    onFrame: handleFrame,
  });

  const isActive = status === 'active';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  // Waveform animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isActive) {
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) { ctx.clearRect(0, 0, canvas.width, canvas.height); }
      }
      return;
    }

    const draw = () => {
      const analyser = analyserRef.current;
      if (!analyser || !canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const bufferLength = analyser.fftSize;
      const data = new Float32Array(bufferLength);
      analyser.getFloatTimeDomainData(data);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = THEME.accent;
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = data[i];
        const y = (v + 1) / 2 * canvas.height;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.stroke();
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [isActive, analyserRef]);

  const audioSignal = latestFrame?.modality_signals.audio;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>
      <h1 style={pageTitle}>Audio Analysis</h1>
      <p style={pageSubtitle}>Voice prosody — pitch, energy, and spectral features mapped to emotional states</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Microphone panel */}
        <div style={{ ...card, gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={sectionLabel}>Microphone</h3>
            <span style={{ fontSize: 11, fontWeight: 600, color: isActive ? THEME.positive : THEME.textMuted, display: 'flex', alignItems: 'center', gap: 5 }}>
              {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: THEME.positive, animation: 'pulse 2s infinite' }} />}
              {isActive ? 'Recording' : status === 'requesting' ? 'Requesting...' : 'Off'}
            </span>
          </div>

          {/* Waveform */}
          <div style={{ position: 'relative', width: '100%', height: 80, background: THEME.bgHover, borderRadius: 8, overflow: 'hidden', marginBottom: 14 }}>
            <canvas ref={canvasRef} width={800} height={80} style={{ width: '100%', height: '100%' }} />
            {!isActive && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 12, color: THEME.textMuted }}>
                  {status === 'error' ? error : sessionActive ? 'Enable microphone to see waveform' : 'Start session first'}
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {!isActive
              ? <button onClick={startMic} disabled={!sessionActive || status === 'requesting'}
                  style={{ background: sessionActive ? THEME.accent : THEME.borderLight, color: sessionActive ? '#fff' : THEME.textMuted, border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 12, fontWeight: 600, cursor: sessionActive ? 'pointer' : 'not-allowed' }}>
                  {status === 'requesting' ? 'Requesting...' : 'Enable Microphone'}
                </button>
              : <button onClick={stopMic} style={{ background: THEME.bgHover, color: THEME.text, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: '9px 20px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Disable Microphone
                </button>
            }
          </div>
        </div>

        {/* Real-time features */}
        <div style={card}>
          <h3 style={sectionLabel}>Prosodic Features</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FeatureMeter label="Energy (RMS)" value={features.rms} max={0.3} unit="" />
            <FeatureMeter label="Pitch Estimate" value={features.pitchEstimate} max={500} unit="Hz" isRaw />
            <FeatureMeter label="Spectral Centroid" value={features.spectralCentroid} max={3000} unit="Hz" isRaw />
            <FeatureMeter label="Zero Crossing Rate" value={features.zcr} max={0.2} unit="" />
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 10, color: THEME.textMuted, lineHeight: 1.5 }}>
            GeMAPS-inspired features (Eyben et al., 2016).
          </p>
        </div>

        {/* Emotion reading */}
        <div style={card}>
          <h3 style={sectionLabel}>Voice Emotion Reading</h3>
          {audioSignal && audioSignal.speech_detected ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <EmotionBadge emotion={audioSignal.dominant} confidence={audioSignal.confidence} size="lg" />
              <div style={{ fontSize: 12, color: THEME.textSecondary, lineHeight: 1.8 }}>
                <div>Pitch: <strong>{audioSignal.features.pitch_mean_hz} Hz</strong></div>
                <div>Energy: <strong>{(audioSignal.features.energy_rms * 100).toFixed(1)}%</strong></div>
                <div>Speech rate: <strong>{audioSignal.features.speech_rate_syl_s.toFixed(1)} syl/s</strong></div>
                <div>Voice quality: <strong>{audioSignal.voice_quality}</strong></div>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: THEME.textMuted }}>
              {isActive ? 'No speech detected — speak to see emotion reading' : 'Enable microphone to start'}
            </p>
          )}
        </div>


      </div>
    </div>
  );
}

function FeatureMeter({ label, value, max, unit, isRaw }: { label: string; value: number; max: number; unit: string; isRaw?: boolean }) {
  const pct = Math.min((value / max) * 100, 100);
  const display = isRaw ? `${Math.round(value)}${unit}` : `${(value / max * 100).toFixed(0)}%`;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: THEME.textSecondary }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: THEME.text }}>{display}</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: THEME.borderLight, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: THEME.accent, borderRadius: 3, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

const pageTitle: React.CSSProperties = { margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: THEME.text };
const pageSubtitle: React.CSSProperties = { margin: '0 0 24px', fontSize: 13, color: THEME.textSecondary };
const card: React.CSSProperties = { background: THEME.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${THEME.border}`, boxShadow: THEME.shadow };
const sectionLabel: React.CSSProperties = { margin: '0 0 12px', fontSize: 12, fontWeight: 600, color: THEME.textSecondary, textTransform: 'uppercase', letterSpacing: 1 };
