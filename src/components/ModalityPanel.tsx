import type { VisualSignal } from '../types/emotions';
import { THEME } from '../utils/colors';

interface Props {
  type: 'visual';
  signal: VisualSignal;
}

export function ModalityPanel({ signal }: Props) {
  const title = 'Visual (Camera)';
  const icon = '\u{1F441}';

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
        <div>AUs: {signal.active_AUs.join(', ') || 'None'}</div>
        <div>Expressivity: {(signal.expressivity_index * 100).toFixed(0)}%</div>
        <div>Face: {signal.face_detected ? 'Detected' : 'Not detected'}</div>
      </div>
    </div>
  );
}
