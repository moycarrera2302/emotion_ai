import { useMemo, useState, useRef, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useEmotion } from '../context/EmotionContext';
import { EmotionBadge } from '../components/EmotionBadge';
import { THEME, EMOTION_COLORS } from '../utils/colors';
import { exportFramedArt, exportAnalyticsPDF } from '../utils/artExport';
import { renderEmotionArtToCanvas, ARTISTS, type ArtistStyle } from '../utils/emotionArt';
import type { EmotionLabel } from '../types/emotions';

export function TimelinePage() {
  const { session } = useEmotion();
  const [exporting, setExporting] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<ArtistStyle>(ARTISTS[0]);
  const frames = session.frames;

  const chartData = useMemo(() => frames.map((f, i) => ({
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
    neutral: Math.round(f.emotion_distribution.neutral * 100),
  })), [frames]);

  const summary = useMemo(() => {
    if (frames.length === 0) return null;
    const len = frames.length;
    const avgDist: Record<EmotionLabel, number> = { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0, disgust: 0, neutral: 0 };
    let totalValence = 0, totalStress = 0;
    frames.forEach(f => {
      (Object.keys(avgDist) as EmotionLabel[]).forEach(e => { avgDist[e] += f.emotion_distribution[e]; });
      totalValence += f.dimensional_model.valence;
      totalStress += f.flags.stress_level;
    });
    (Object.keys(avgDist) as EmotionLabel[]).forEach(e => { avgDist[e] /= len; });
    const dominant = (Object.entries(avgDist) as [EmotionLabel, number][]).sort((a, b) => b[1] - a[1])[0];
    const peaks = frames.filter(f => f.confidence > 0.8);
    const firstHalf = frames.slice(0, Math.floor(len / 2));
    const secondHalf = frames.slice(Math.floor(len / 2));
    const v1 = firstHalf.reduce((s, f) => s + f.dimensional_model.valence, 0) / firstHalf.length;
    const v2 = secondHalf.reduce((s, f) => s + f.dimensional_model.valence, 0) / secondHalf.length;
    return {
      dominant, avgDist,
      avgValence: totalValence / len,
      avgStress: totalStress / len,
      valenceTrend: (v2 - v1) > 0.05 ? 'improving' : (v2 - v1) < -0.05 ? 'declining' : 'stable' as const,
      peaks,
    };
  }, [frames]);

  const handleArtDownload = () => {
    setExporting(true);
    try { exportFramedArt(frames, session.id, selectedArtist); }
    finally { setTimeout(() => setExporting(false), 800); }
  };

  const handleAnalyticsDownload = () => {
    setExporting(true);
    try { exportAnalyticsPDF(frames, session.id, session.notes); }
    finally { setTimeout(() => setExporting(false), 800); }
  };

  const duration = frames.length * 2;
  const mins = Math.floor(duration / 60);
  const secs = duration % 60;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={pageTitle}>Timeline</h1>
          <p style={pageSubtitle}>Emotional trajectory · {frames.length} frames · {mins}m {secs.toString().padStart(2, '0')}s</p>
        </div>
        {frames.length > 0 && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleArtDownload} disabled={exporting}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: exporting ? THEME.borderLight : '#2C2A26',
                color: exporting ? THEME.textMuted : '#FDFBF8',
                border: 'none', borderRadius: 50, padding: '11px 24px',
                fontSize: 13, fontWeight: 600,
                cursor: exporting ? 'not-allowed' : 'pointer',
                boxShadow: exporting ? 'none' : '0 4px 16px rgba(44,42,38,0.15)',
              }}>
              🎨 Download Art
            </button>
            <button onClick={handleAnalyticsDownload} disabled={exporting}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'transparent',
                color: '#7A756B',
                border: '1px solid #D4CFC7', borderRadius: 50, padding: '11px 24px',
                fontSize: 13, fontWeight: 500,
                cursor: exporting ? 'not-allowed' : 'pointer',
              }}>
              📊 Download Analytics
            </button>
          </div>
        )}
      </div>

      {frames.length < 2 ? (
        <div style={{ ...card, textAlign: 'center', padding: 48 }}>
          <p style={{ color: THEME.textMuted, fontSize: 14 }}>Start a session and record at least a few seconds to see the timeline.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Valence / Arousal / Stress */}
          <div style={card}>
            <h3 style={sectionLabel}>Valence · Arousal · Stress over time</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.borderLight} />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: THEME.textMuted }} interval="preserveStartEnd" />
                <YAxis domain={[-1, 1]} tick={{ fontSize: 9, fill: THEME.textMuted }} />
                <Tooltip contentStyle={{ background: THEME.bgCard, border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="valence" stroke={THEME.positive} fill={`${THEME.positive}20`} strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="arousal" stroke={THEME.accent} fill={`${THEME.accent}15`} strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="stress" stroke={THEME.negative} fill={`${THEME.negative}15`} strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Emotion stacks */}
          <div style={card}>
            <h3 style={sectionLabel}>Emotion probabilities over time</h3>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.borderLight} />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: THEME.textMuted }} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: THEME.textMuted }} />
                <Tooltip contentStyle={{ background: THEME.bgCard, border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 11 }} />
                {(['joy', 'sadness', 'anger', 'fear', 'surprise', 'neutral'] as EmotionLabel[]).map(e => (
                  <Area key={e} type="monotone" dataKey={e} stackId="1" stroke={EMOTION_COLORS[e]} fill={EMOTION_COLORS[e]} fillOpacity={0.65} strokeWidth={0} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Summary */}
          {summary && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={card}>
                <h3 style={sectionLabel}>Session Summary</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <span style={{ fontSize: 11, color: THEME.textMuted }}>Dominant emotion</span>
                    <div style={{ marginTop: 4 }}>
                      <EmotionBadge emotion={summary.dominant[0]} confidence={summary.dominant[1]} size="lg" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <StatBox label="Avg Valence" value={`${summary.avgValence >= 0 ? '+' : ''}${summary.avgValence.toFixed(2)}`} color={summary.avgValence >= 0 ? THEME.positive : THEME.negative} />
                    <StatBox label="Avg Stress" value={`${Math.round(summary.avgStress * 100)}%`} color={summary.avgStress > 0.6 ? THEME.negative : THEME.textSecondary} />
                    <StatBox label="Valence Trend" value={summary.valenceTrend} color={summary.valenceTrend === 'improving' ? THEME.positive : summary.valenceTrend === 'declining' ? THEME.negative : THEME.textMuted} />
                    <StatBox label="Peak Moments" value={String(summary.peaks.length)} />
                  </div>
                </div>
              </div>

              <div style={card}>
                <h3 style={sectionLabel}>Emotion Breakdown</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {(Object.entries(summary.avgDist) as [EmotionLabel, number][]).sort((a, b) => b[1] - a[1]).map(([e, v]) => (
                    <div key={e} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, width: 62, textTransform: 'capitalize', color: THEME.textSecondary }}>{e}</span>
                      <div style={{ flex: 1, height: 7, borderRadius: 3, background: THEME.borderLight, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${v * 100}%`, background: EMOTION_COLORS[e], borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 10, color: THEME.textMuted, width: 28, textAlign: 'right' }}>{Math.round(v * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Peak moments */}
          {summary && summary.peaks.length > 0 && (
            <div style={card}>
              <h3 style={sectionLabel}>Peak Moments ({summary.peaks.length})</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {summary.peaks.slice(0, 12).map((f, i) => (
                  <div key={i} style={{ background: `${EMOTION_COLORS[f.dominant_emotion]}12`, border: `1px solid ${EMOTION_COLORS[f.dominant_emotion]}40`, borderRadius: 8, padding: '6px 12px' }}>
                    <div style={{ fontSize: 10, color: THEME.textMuted }}>{new Date(f.timestamp).toLocaleTimeString()}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: THEME.text, textTransform: 'capitalize' }}>{f.dominant_emotion} · {Math.round(f.confidence * 100)}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emotion art preview */}
          {frames.length >= 3 && <EmotionArtPreview frames={frames} selected={selectedArtist} onSelect={setSelectedArtist} />}
        </div>
      )}
    </div>
  );
}

function EmotionArtPreview({ frames, selected, onSelect }: {
  frames: import('../types/emotions').EmotionFrame[];
  selected: ArtistStyle;
  onSelect: (a: ArtistStyle) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || frames.length < 3) return;
    renderEmotionArtToCanvas(canvasRef.current, frames, selected);
    setRendered(true);
  }, [frames.length, selected]);

  return (
    <div style={card}>
      <h3 style={sectionLabel}>Emotional Fingerprint — Choose Your Master</h3>

      {/* Artist picker */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {ARTISTS.map(a => (
          <button
            key={a.name}
            onClick={() => onSelect(a)}
            style={{
              background: selected.name === a.name ? '#2C2A26' : '#F5F2ED',
              color: selected.name === a.name ? '#FDFBF8' : '#7A756B',
              border: selected.name === a.name ? '1px solid #2C2A26' : '1px solid #E8E4DD',
              borderRadius: 20, padding: '6px 14px',
              fontSize: 12, fontWeight: selected.name === a.name ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {a.name}
          </button>
        ))}
      </div>

      <p style={{ fontSize: 14, color: THEME.text, marginBottom: 4, fontStyle: 'italic', fontFamily: "'Playfair Display', Georgia, serif" }}>
        Inspired by <strong>{selected.fullName}</strong>
      </p>
      <p style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 12, lineHeight: 1.5 }}>
        {selected.prompt}
      </p>

      <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${THEME.border}` }}>
        <canvas
          ref={canvasRef}
          width={900}
          height={500}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      </div>
      {rendered && (
        <p style={{ fontSize: 10, color: THEME.textMuted, marginTop: 8, fontStyle: 'italic', textAlign: 'center' }}>
          Click a different artist to regenerate your painting
        </p>
      )}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: THEME.bgHover, borderRadius: 8, padding: '8px 12px', border: `1px solid ${THEME.borderLight}` }}>
      <div style={{ fontSize: 10, color: THEME.textMuted, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: color ?? THEME.text, textTransform: 'capitalize' }}>{value}</div>
    </div>
  );
}

const pageTitle: React.CSSProperties = { margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: THEME.text };
const pageSubtitle: React.CSSProperties = { margin: 0, fontSize: 13, color: THEME.textSecondary };
const card: React.CSSProperties = { background: THEME.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${THEME.border}`, boxShadow: THEME.shadow };
const sectionLabel: React.CSSProperties = { margin: '0 0 12px', fontSize: 12, fontWeight: 600, color: THEME.textSecondary, textTransform: 'uppercase', letterSpacing: 1 };
