import { useMemo } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';
import type { EmotionFrame } from '../types/emotions';
import { EMOTION_COLORS, THEME } from '../utils/colors';

interface Props {
  frames: EmotionFrame[];
}

export function Timeline({ frames }: Props) {
  const data = useMemo(() => {
    return frames.map((f, i) => ({
      index: i,
      time: new Date(f.timestamp).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
      valence: Number(f.dimensional_model.valence.toFixed(2)),
      arousal: Number(f.dimensional_model.arousal.toFixed(2)),
      stress: Number(f.flags.stress_level.toFixed(2)),
      joy: Math.round(f.emotion_distribution.joy * 100),
      sadness: Math.round(f.emotion_distribution.sadness * 100),
      anger: Math.round(f.emotion_distribution.anger * 100),
      fear: Math.round(f.emotion_distribution.fear * 100),
      surprise: Math.round(f.emotion_distribution.surprise * 100),
    }));
  }, [frames]);

  if (frames.length < 2) {
    return (
      <div style={cardStyle}>
        <h2 style={headerStyle}>Emotional Timeline</h2>
        <p style={{ color: THEME.textMuted, textAlign: 'center', padding: 20, fontSize: 13 }}>
          Collecting data... ({frames.length}/2 samples)
        </p>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <h2 style={headerStyle}>Emotional Timeline</h2>

      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 11, color: THEME.textMuted }}>Valence / Arousal / Stress over time</span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={THEME.borderLight} />
          <XAxis dataKey="time" tick={{ fontSize: 9, fill: THEME.textMuted }} interval="preserveStartEnd" />
          <YAxis domain={[-1, 1]} tick={{ fontSize: 9, fill: THEME.textMuted }} />
          <Tooltip
            contentStyle={{
              background: THEME.bgCard,
              border: `1px solid ${THEME.border}`,
              borderRadius: 8,
              fontSize: 11,
              boxShadow: THEME.shadowMd,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area type="monotone" dataKey="valence" stroke={THEME.positive} fill={`${THEME.positive}20`} strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey="arousal" stroke={THEME.accent} fill={`${THEME.accent}20`} strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey="stress" stroke={THEME.negative} fill={`${THEME.negative}20`} strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
        </AreaChart>
      </ResponsiveContainer>

      <div style={{ marginTop: 20 }}>
        <span style={{ fontSize: 11, color: THEME.textMuted }}>Emotion probabilities over time</span>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={THEME.borderLight} />
          <XAxis dataKey="time" tick={{ fontSize: 9, fill: THEME.textMuted }} interval="preserveStartEnd" />
          <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: THEME.textMuted }} />
          <Tooltip contentStyle={{
            background: THEME.bgCard,
            border: `1px solid ${THEME.border}`,
            borderRadius: 8,
            fontSize: 11,
          }} />
          {(['joy', 'sadness', 'anger', 'fear', 'surprise'] as const).map(e => (
            <Area
              key={e}
              type="monotone"
              dataKey={e}
              stackId="1"
              stroke={EMOTION_COLORS[e]}
              fill={EMOTION_COLORS[e]}
              fillOpacity={0.6}
              strokeWidth={0}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
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

const headerStyle: React.CSSProperties = {
  margin: '0 0 8px 0',
  fontSize: 14,
  fontWeight: 600,
  color: THEME.textSecondary,
  textTransform: 'uppercase',
  letterSpacing: 1,
};
