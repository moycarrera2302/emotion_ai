import type { EmotionFrame } from '../types/emotions';
import { THEME } from '../utils/colors';
import { EmotionBadge } from './EmotionBadge';
import { ModalityPanel } from './ModalityPanel';

interface Props {
  frame: EmotionFrame | null;
}

export function EmotionDashboard({ frame }: Props) {
  if (!frame) {
    return (
      <div style={cardStyle}>
        <p style={{ color: THEME.textMuted, textAlign: 'center', padding: 40 }}>
          Start a session to see real-time emotion data
        </p>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: THEME.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>
          Live Reading
        </h2>
        <span style={{ fontSize: 11, color: THEME.textMuted }}>
          Frame #{frame.frame_number}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <EmotionBadge emotion={frame.dominant_emotion} confidence={frame.confidence} size="lg" />
        {frame.flags.mixed_signals && (
          <span style={{
            fontSize: 11, color: THEME.accent, background: `${THEME.accent}15`,
            padding: '3px 8px', borderRadius: 8,
          }}>
            Mixed signals detected
          </span>
        )}
        {frame.flags.micro_expression_detected && (
          <span style={{
            fontSize: 11, color: THEME.negative, background: `${THEME.negative}15`,
            padding: '3px 8px', borderRadius: 8,
          }}>
            Micro-expression
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
        <DimensionMeter label="Valence" value={frame.dimensional_model.valence} />
        <DimensionMeter label="Arousal" value={frame.dimensional_model.arousal} />
        <DimensionMeter label="Dominance" value={frame.dimensional_model.dominance} />
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <StressIndicator level={frame.flags.stress_level} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
        <ModalityPanel type="visual" signal={frame.modality_signals.visual} />
        <ModalityPanel type="audio" signal={frame.modality_signals.audio} />
      </div>
    </div>
  );
}

function DimensionMeter({ label, value }: { label: string; value: number }) {
  const normalized = (value + 1) / 2;
  const isPositive = value >= 0;

  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: THEME.textSecondary }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: isPositive ? THEME.positive : THEME.negative }}>
          {value >= 0 ? '+' : ''}{value.toFixed(2)}
        </span>
      </div>
      <div style={{
        height: 4, borderRadius: 2, background: THEME.borderLight, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 2,
          width: `${normalized * 100}%`,
          background: isPositive ? THEME.positive : THEME.negative,
          transition: 'width 0.5s ease, background 0.5s ease',
        }} />
      </div>
    </div>
  );
}

function StressIndicator({ level }: { level: number }) {
  const label = level < 0.3 ? 'Low' : level < 0.6 ? 'Moderate' : 'High';
  const color = level < 0.3 ? THEME.positive : level < 0.6 ? THEME.accent : THEME.negative;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 11, color: THEME.textSecondary }}>Stress:</span>
      <div style={{
        width: 80, height: 4, borderRadius: 2, background: THEME.borderLight, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 2, width: `${level * 100}%`,
          background: color, transition: 'width 0.5s ease',
        }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color }}>{label}</span>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: THEME.bgCard,
  borderRadius: 12,
  padding: 24,
  border: `1px solid ${THEME.border}`,
  boxShadow: THEME.shadow,
};
