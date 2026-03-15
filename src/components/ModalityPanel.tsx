import type { VisualSignal, AudioSignal } from '../types/emotions';
import { THEME } from '../utils/colors';

interface Props {
  type: 'visual' | 'audio';
  signal: VisualSignal | AudioSignal;
}

export function ModalityPanel({ type, signal }: Props) {
  const isVisual = type === 'visual';
  const title = isVisual ? 'Visual (Camera)' : 'Audio (Voice)';
  const icon = isVisual ? '\u{1F441}' : '\u{1F3A4}';

  return (
    <div style={{
      background: THEME.bgHover,
      borderRadius: 8,
      padding: 14,
      border: `1px solid ${THEME.borderLight}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: THEME.text }}>{title}</span>
        <span style={{
          marginLeft: 'auto', fontSize: 10, fontWeight: 600,
          color: signal.confidence > 0.6 ? THEME.positive : THEME.accent,
        }}>
          {Math.round(signal.confidence * 100)}%
        </span>
      </div>

      <div style={{ fontSize: 11, color: THEME.textSecondary, lineHeight: 1.6 }}>
        <div>Dominant: <strong style={{ color: THEME.text, textTransform: 'capitalize' }}>{signal.dominant}</strong></div>

        {isVisual && (
          <>
            <div>AUs: {(signal as VisualSignal).active_AUs.join(', ') || 'None'}</div>
            <div>Expressivity: {((signal as VisualSignal).expressivity_index * 100).toFixed(0)}%</div>
            <div>Face: {(signal as VisualSignal).face_detected ? 'Detected' : 'Not detected'}</div>
          </>
        )}

        {!isVisual && (
          <>
            <div>Pitch: {(signal as AudioSignal).features.pitch_mean_hz} Hz (range: {(signal as AudioSignal).features.pitch_range_hz})</div>
            <div>Speech rate: {(signal as AudioSignal).features.speech_rate_syl_s.toFixed(1)} syl/s</div>
            <div>Energy: {((signal as AudioSignal).features.energy_rms * 100).toFixed(0)}%</div>
            <div>Quality: {(signal as AudioSignal).voice_quality}</div>
          </>
        )}
      </div>
    </div>
  );
}
