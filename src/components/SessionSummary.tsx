import { useMemo } from 'react';
import type { Session, EmotionLabel, EmotionDistribution } from '../types/emotions';
import { THEME, EMOTION_COLORS } from '../utils/colors';
import { EmotionBadge } from './EmotionBadge';

interface Props {
  session: Session;
}

export function SessionSummary({ session }: Props) {
  const summary = useMemo(() => {
    if (session.frames.length === 0) return null;

    const frames = session.frames;
    const len = frames.length;

    const avgDist: EmotionDistribution = { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0, disgust: 0, neutral: 0 };
    let totalValence = 0;
    let totalArousal = 0;
    let totalStress = 0;

    frames.forEach(f => {
      (Object.keys(avgDist) as EmotionLabel[]).forEach(e => {
        avgDist[e] += f.emotion_distribution[e];
      });
      totalValence += f.dimensional_model.valence;
      totalArousal += f.dimensional_model.arousal;
      totalStress += f.flags.stress_level;
    });

    (Object.keys(avgDist) as EmotionLabel[]).forEach(e => {
      avgDist[e] = avgDist[e] / len;
    });

    const dominantEmotion = (Object.entries(avgDist) as [EmotionLabel, number][])
      .sort((a, b) => b[1] - a[1])[0];

    const peaks = frames
      .filter(f => f.confidence > 0.80)
      .slice(-5)
      .map(f => ({
        timestamp: new Date(f.timestamp).toLocaleTimeString(),
        emotion: f.dominant_emotion,
        intensity: f.confidence,
      }));

    const firstHalfStress = frames.slice(0, Math.floor(len / 2)).reduce((s, f) => s + f.flags.stress_level, 0) / Math.floor(len / 2);
    const secondHalfStress = frames.slice(Math.floor(len / 2)).reduce((s, f) => s + f.flags.stress_level, 0) / (len - Math.floor(len / 2));
    const stressDelta = secondHalfStress - firstHalfStress;
    const stressTrend = stressDelta > 0.05 ? 'increasing' : stressDelta < -0.05 ? 'decreasing' : 'stable';

    const avgValence = totalValence / len;
    const valenceTrend = (() => {
      const firstHalf = frames.slice(0, Math.floor(len / 2)).reduce((s, f) => s + f.dimensional_model.valence, 0) / Math.floor(len / 2);
      const secondHalf = frames.slice(Math.floor(len / 2)).reduce((s, f) => s + f.dimensional_model.valence, 0) / (len - Math.floor(len / 2));
      const d = secondHalf - firstHalf;
      return d > 0.05 ? 'improving' : d < -0.05 ? 'declining' : 'stable';
    })();

    return {
      duration: len * 2,
      totalFrames: len,
      dominant: dominantEmotion,
      avgDist,
      avgValence,
      avgArousal: totalArousal / len,
      avgStress: totalStress / len,
      stressTrend,
      valenceTrend,
      peaks,
    };
  }, [session.frames]);

  if (session.status !== 'completed' || !summary) return null;

  const minutes = Math.floor(summary.duration / 60);
  const seconds = summary.duration % 60;

  return (
    <div style={cardStyle}>
      <h2 style={headerStyle}>Session Summary</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
        <StatBox label="Duration" value={`${minutes}m ${seconds}s`} />
        <StatBox label="Frames" value={String(summary.totalFrames)} />
        <StatBox label="Avg Valence" value={summary.avgValence.toFixed(2)} color={summary.avgValence >= 0 ? THEME.positive : THEME.negative} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 11, color: THEME.textMuted }}>Dominant emotion:</span>
        <div style={{ marginTop: 6 }}>
          <EmotionBadge emotion={summary.dominant[0]} confidence={summary.dominant[1]} size="lg" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <TrendBox label="Valence Trend" trend={summary.valenceTrend} />
        <TrendBox label="Stress Trend" trend={summary.stressTrend} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 11, color: THEME.textMuted, display: 'block', marginBottom: 8 }}>Emotion Breakdown:</span>
        {(Object.entries(summary.avgDist) as [EmotionLabel, number][])
          .sort((a, b) => b[1] - a[1])
          .map(([emotion, value]) => (
            <div key={emotion} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, width: 60, textTransform: 'capitalize', color: THEME.textSecondary }}>{emotion}</span>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: THEME.borderLight, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3, width: `${value * 100}%`,
                  background: EMOTION_COLORS[emotion],
                  transition: 'width 0.3s',
                }} />
              </div>
              <span style={{ fontSize: 10, color: THEME.textMuted, width: 32, textAlign: 'right' }}>
                {Math.round(value * 100)}%
              </span>
            </div>
          ))}
      </div>

      {summary.peaks.length > 0 && (
        <div>
          <span style={{ fontSize: 11, color: THEME.textMuted, display: 'block', marginBottom: 6 }}>Peak Moments:</span>
          {summary.peaks.map((p, i) => (
            <div key={i} style={{
              fontSize: 11, color: THEME.textSecondary, padding: '3px 0',
              display: 'flex', gap: 8,
            }}>
              <span style={{ color: THEME.textMuted }}>{p.timestamp}</span>
              <EmotionBadge emotion={p.emotion} confidence={p.intensity} size="sm" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: THEME.textMuted, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: color || THEME.text }}>{value}</div>
    </div>
  );
}

function TrendBox({ label, trend }: { label: string; trend: string }) {
  const arrow = trend === 'improving' || trend === 'decreasing' ? '\u2191' : trend === 'declining' || trend === 'increasing' ? '\u2193' : '\u2192';
  const color = trend === 'improving' || trend === 'decreasing' ? THEME.positive : trend === 'declining' || trend === 'increasing' ? THEME.negative : THEME.textMuted;

  return (
    <div style={{
      background: THEME.bgHover, borderRadius: 8, padding: '8px 12px',
      border: `1px solid ${THEME.borderLight}`,
    }}>
      <div style={{ fontSize: 10, color: THEME.textMuted }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color, marginTop: 2 }}>
        {arrow} {trend.charAt(0).toUpperCase() + trend.slice(1)}
      </div>
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
  margin: '0 0 16px 0',
  fontSize: 14,
  fontWeight: 600,
  color: THEME.textSecondary,
  textTransform: 'uppercase',
  letterSpacing: 1,
};
