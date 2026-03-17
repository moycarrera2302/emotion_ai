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
      {/* Artist reminder */}
      {frames.length >= 3 && (
        <a href="#art-section" style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'linear-gradient(135deg, #F8F5F0, #F0EDE5)',
          border: '1px solid #E8E4DD', borderRadius: 12,
          padding: '14px 20px', marginBottom: 20, textDecoration: 'none',
          transition: 'border-color 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = '#C4946A')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = '#E8E4DD')}
        >
          <span style={{ fontSize: 24 }}>🎨</span>
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#2C2A26' }}>
              Your emotional fingerprint is ready below
            </span>
            <span style={{ fontSize: 12, color: '#A8A08E', display: 'block', marginTop: 2 }}>
              Scroll down to choose your favorite Impressionist master and download your art
            </span>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 14, color: '#C4946A' }}>&darr;</span>
        </a>
      )}

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
          {frames.length >= 3 && <div id="art-section"><EmotionArtPreview frames={frames} selected={selectedArtist} onSelect={setSelectedArtist} /></div>}

          {/* Emotional Fingerprint Explanation */}
          {frames.length >= 3 && (
            <div style={{
              background: 'linear-gradient(135deg, #F8F5F0 0%, #EFE8DC 100%)',
              borderRadius: 12, padding: 28, marginTop: 20, border: '1px solid #E8E4DD',
            }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#2C2A26', marginBottom: 16 }}>
                What Is Your Emotional Fingerprint?
              </h3>
              
              <p style={{ fontSize: 14, color: '#5A5650', lineHeight: 1.8, marginBottom: 16 }}>
                Your <strong>emotional fingerprint</strong> is a unique, multi-dimensional snapshot of your emotional landscape during this session.
                Just like no two fingerprints are identical, no two emotional journeys are the same. Your fingerprint captures not just
                <em> what </em>you felt, but <em>how</em> you felt it — the intensity, the duration, the peaks, and the valleys.
              </p>

              <div style={{ background: '#FDFBF8', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#2C2A26', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                  How It's Built
                </h4>
                <ol style={{ fontSize: 13, color: '#5A5650', lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
                  <li><strong>Face Detection (4 FPS)</strong> — Your camera captures 68 facial landmark points every 250ms using neural networks trained on thousands of expressions.</li>
                  <li><strong>Emotion Classification</strong> — Each frame is analyzed for 7 universal emotions (joy, sadness, anger, fear, surprise, disgust, neutral) using Facial Action Coding System (FACS).</li>
                  <li><strong>Temporal Smoothing</strong> — Raw results are smoothed over time to reduce noise and camera jitter, revealing your true emotional patterns.</li>
                  <li><strong>Dimensional Mapping</strong> — Each moment is converted into three dimensions: <strong>Valence</strong> (negative ↔ positive), <strong>Arousal</strong> (calm ↔ excited), and <strong>Stress</strong> (relaxed ↔ tense).</li>
                  <li><strong>Data Aggregation</strong> — All frames combine into a session summary: dominant emotions, trends, peak moments, and emotional variability.</li>
                  <li><strong>Generative Art</strong> — Your emotion data becomes a painting. Joy rises as warm gold. Sadness flows as cool blue. Anger bursts in crimson. The result is a beautiful, unique artwork inspired by one of 9 Impressionist masters.</li>
                </ol>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: '#2C2A26', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                    The Three Dimensions
                  </h4>
                  <div style={{ fontSize: 12, color: '#5A5650', lineHeight: 1.8 }}>
                    <div style={{ marginBottom: 8 }}>
                      <strong style={{ color: '#E8B931' }}>Valence:</strong> How positive or negative you felt. High = joyful; Low = sad.
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <strong style={{ color: '#6B8DAE' }}>Arousal:</strong> How activated or calm you were. High = excited/anxious; Low = peaceful/sluggish.
                    </div>
                    <div>
                      <strong style={{ color: '#C4614E' }}>Stress:</strong> Overall tension level derived from fear, anger, and sadness signals.
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: '#2C2A26', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Privacy & Accuracy
                  </h4>
                  <div style={{ fontSize: 12, color: '#5A5650', lineHeight: 1.8 }}>
                    <div style={{ marginBottom: 8 }}>
                      ✓ <strong>100% local processing</strong> — No video leaves your device
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      ✓ <strong>No cloud storage</strong> — Only you see your data
                    </div>
                    <div>
                      ✓ <strong>Probabilistic, not diagnostic</strong> — For self-awareness, not medical use
                    </div>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: 11, color: '#B0A99E', fontStyle: 'italic', marginTop: 16, lineHeight: 1.6 }}>
                Your emotional fingerprint is a window into your inner world. Use it to reflect, understand patterns, and cultivate self-awareness.
                Every emotion is valid. Every moment counts.
              </p>
            </div>
          )}

          {/* Generative Art Deep Dive */}
          {frames.length >= 3 && (
            <div style={{
              background: 'linear-gradient(135deg, #F5F0E8 0%, #EBE5D8 100%)',
              borderRadius: 12, padding: 28, marginTop: 20, border: '1px solid #E8E4DD',
            }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#2C2A26', marginBottom: 16 }}>
                🎨 Reading Your Generative Art
              </h3>
              
              <p style={{ fontSize: 14, color: '#5A5650', lineHeight: 1.8, marginBottom: 20 }}>
                Your emotional painting is not random. Every stroke, color, and particle placement encodes your emotional journey.
                Below is how to interpret what you're seeing — and what each artist's unique style reveals.
              </p>

              {/* How It Works Section */}
              <div style={{ background: '#FDFBF8', borderRadius: 8, padding: 16, marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#2C2A26', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                  How the Painting Is Built
                </h4>
                <div style={{ fontSize: 13, color: '#5A5650', lineHeight: 1.9 }}>
                  <div style={{ marginBottom: 12 }}>
                    <strong>1. Particle Generation</strong><br />
                    For every emotion detected, thousands of tiny particles "spawn" in specific locations and with specific velocities:
                    <ul style={{ marginTop: 6, marginBottom: 0, paddingLeft: 20 }}>
                      <li><strong>Joy</strong> spawns in the lower half, rising upward (optimism climbing)</li>
                      <li><strong>Sadness</strong> spawns high, falling downward (weight pulling down)</li>
                      <li><strong>Anger</strong> spawns from center, bursting outward in all directions (explosive energy)</li>
                      <li><strong>Fear</strong> scatters randomly across the canvas (panic/uncertainty)</li>
                      <li><strong>Surprise</strong> radiates outward from center in rays (sudden expansion)</li>
                      <li><strong>Disgust</strong> spawns in lower region, moving laterally (withdrawal)</li>
                    </ul>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <strong>2. Flow Field Simulation</strong><br />
                    Particles don't move randomly. They follow an invisible "flow field" — a mathematical vector field based on Perlin-like noise.
                    Think of it like wind patterns or water currents. Each artist controls the <strong>strength</strong> of this flow:
                    <ul style={{ marginTop: 6, marginBottom: 0, paddingLeft: 20 }}>
                      <li>Van Gogh (0.7) — Strong, swirling currents = turbulent, expressive strokes</li>
                      <li>Monet (0.3) — Gentle currents = soft, dissolved edges</li>
                      <li>Pissarro (0.15) — Almost still = dense, scattered pointillist dots</li>
                    </ul>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <strong>3. Artist-Specific Rendering</strong><br />
                    Each of the 9 masters draws particles differently:
                    <ul style={{ marginTop: 6, marginBottom: 0, paddingLeft: 20 }}>
                      <li><strong>Monet:</strong> Soft horizontal dabs that blur and reflect</li>
                      <li><strong>Van Gogh:</strong> Thick, curved bezier strokes following turbulent flow</li>
                      <li><strong>Pissarro:</strong> Tiny dots scattered with companions (pointillism)</li>
                      <li><strong>Cézanne:</strong> Rotated rectangles in geometric planes</li>
                      <li><strong>Renoir:</strong> Luminous glowing circles with warm overlaps</li>
                    </ul>
                  </div>

                  <div>
                    <strong>4. Temporal Layering</strong><br />
                    Particles live for 40-120 frames, fading gradually. This creates <strong>depth</strong> — recent emotions appear sharp and vivid,
                    while older emotions fade into the background. The painting accumulates your emotional history, layer by layer.
                  </div>
                </div>
              </div>

              {/* The Color Language */}
              <div style={{ background: '#FDFBF8', borderRadius: 8, padding: 16, marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#2C2A26', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                  The Color Language (Emotion Palette)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 4, background: '#E8B931' }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#2C2A26' }}>Joy</div>
                        <div style={{ fontSize: 11, color: '#8A857B' }}>Warm gold, rising motion</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 4, background: '#6B8DAE' }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#2C2A26' }}>Sadness</div>
                        <div style={{ fontSize: 11, color: '#8A857B' }}>Cool blue, falling motion</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 4, background: '#C4614E' }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#2C2A26' }}>Anger</div>
                        <div style={{ fontSize: 11, color: '#8A857B' }}>Crimson, explosive burst</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 4, background: '#8B6BAE' }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#2C2A26' }}>Fear</div>
                        <div style={{ fontSize: 11, color: '#8A857B' }}>Deep purple, scattered</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 4, background: '#4EA88B' }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#2C2A26' }}>Surprise</div>
                        <div style={{ fontSize: 11, color: '#8A857B' }}>Teal, radiating outward</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 4, background: '#7A8B5E' }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#2C2A26' }}>Disgust</div>
                        <div style={{ fontSize: 11, color: '#8A857B' }}>Olive green, withdrawn</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Simple Visual Guide */}
              <div style={{ background: '#FDFBF8', borderRadius: 8, padding: 16, marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#2C2A26', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                  How to Read the 5 Visual Elements
                </h4>
                <div style={{ fontSize: 13, color: '#5A5650', lineHeight: 2 }}>
                  <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #E8E4DD' }}>
                    <strong style={{ color: '#2C2A26', fontSize: 14 }}>1. Color</strong><br />
                    What emotion you felt: <strong>Gold = joy, Blue = sadness, Red = anger, Purple = fear, Teal = surprise, Green = disgust</strong>
                  </div>

                  <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #E8E4DD' }}>
                    <strong style={{ color: '#2C2A26', fontSize: 14 }}>2. Brightness & Sharpness</strong><br />
                    <strong>Bright & vivid</strong> = Recent (last 20 seconds) • <strong>Faded & ghostly</strong> = Earlier in your session
                  </div>

                  <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #E8E4DD' }}>
                    <strong style={{ color: '#2C2A26', fontSize: 14 }}>3. Density & Thickness</strong><br />
                    <strong>Dense clusters</strong> = You felt that emotion for a long time • <strong>Sparse marks</strong> = Quick, fleeting moment
                  </div>

                  <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #E8E4DD' }}>
                    <strong style={{ color: '#2C2A26', fontSize: 14 }}>4. Spread & Scatter</strong><br />
                    <strong>Tight pattern</strong> = Calm, controlled emotion • <strong>Wild, dispersed</strong> = Intense, turbulent emotion
                  </div>

                  <div>
                    <strong style={{ color: '#2C2A26', fontSize: 14 }}>5. The Bottom Ribbon (Most Important!)</strong><br />
                    This is your <strong>emotional timeline</strong>. Each color block shows what you felt at each moment. <strong>This is the most accurate reading of your session.</strong>
                  </div>
                </div>
              </div>

              {/* Quick Examples */}
              <div style={{ background: '#FDFBF8', borderRadius: 8, padding: 16 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#2C2A26', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                  What Your Painting Tells You
                </h4>
                <ul style={{ fontSize: 13, color: '#5A5650', lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
                  <li><strong>Lots of yellow?</strong> You experienced sustained joy during your session</li>
                  <li><strong>Scattered, wild patterns?</strong> Your emotions were turbulent or intense — rapid shifts</li>
                  <li><strong>Layered, fading colors?</strong> Complex emotional arc — you evolved through different states</li>
                  <li><strong>One solid color?</strong> Consistent emotion throughout — stable mood</li>
                  <li><strong>Different artist = different look:</strong> Van Gogh shows intensity vividly; Monet softens it; Pissarro creates texture. The emotion data is the same, but each artist reveals different aesthetics.</li>
                </ul>
              </div>
            </div>
          )}
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
