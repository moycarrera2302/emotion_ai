import { Link } from 'react-router-dom';
import { useEmotion } from '../context/EmotionContext';
import { THEME, EMOTION_COLORS } from '../utils/colors';
import type { EmotionLabel } from '../types/emotions';

const PAGES = [
  { to: '/visual', icon: '📷', title: 'Visual Analysis', desc: 'Real-time facial expression tracking with face landmark vectorization' },
  { to: '/audio', icon: '🎤', title: 'Audio Analysis', desc: 'Voice prosody — pitch, energy, speech rate and vocal emotion signatures' },
  { to: '/mindfulness', icon: '🧘', title: 'Mindfulness', desc: 'Evidence-based breathing exercises triggered by your emotional state' },
  { to: '/timeline', icon: '📈', title: 'Timeline & Export', desc: 'Emotional trajectory over time. Download your session as a PDF report' },
];

export function HomePage() {
  const { session, latestFrame, start } = useEmotion();
  const isActive = session.status === 'active';
  const elapsed = session.frames.length * 2;
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <h1 style={{ fontSize: 42, fontWeight: 800, letterSpacing: -1.5, margin: '0 0 12px', color: THEME.text }}>
          Emotions<span style={{ color: THEME.accent }}>AI</span>
        </h1>
        <p style={{ fontSize: 16, color: THEME.textSecondary, maxWidth: 520, margin: '0 auto 28px', lineHeight: 1.6 }}>
          Real-time multimodal emotional intelligence. Facial FACS coding, voice prosody, and AI-powered insights — all running locally in your browser.
        </p>
        {!isActive && (
          <button onClick={start} style={{
            background: THEME.accent, color: '#fff', border: 'none',
            borderRadius: 10, padding: '14px 36px', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', boxShadow: `0 4px 16px ${THEME.accent}40`,
          }}>
            Start Session
          </button>
        )}
      </div>

      {/* Live status strip */}
      {isActive && latestFrame && (
        <div style={{
          background: THEME.bgCard, borderRadius: 14, padding: '20px 28px',
          border: `1px solid ${THEME.border}`, marginBottom: 32,
          display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: THEME.positive, animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: THEME.positive }}>Live</span>
          </div>
          <StatItem label="Duration" value={`${minutes}m ${seconds.toString().padStart(2, '0')}s`} />
          <StatItem label="Frames" value={String(session.frames.length)} />
          <StatItem
            label="Dominant emotion"
            value={latestFrame.dominant_emotion}
            color={EMOTION_COLORS[latestFrame.dominant_emotion as EmotionLabel]}
            capitalize
          />
          <StatItem
            label="Valence"
            value={(latestFrame.dimensional_model.valence >= 0 ? '+' : '') + latestFrame.dimensional_model.valence.toFixed(2)}
            color={latestFrame.dimensional_model.valence >= 0 ? THEME.positive : THEME.negative}
          />
          <StatItem
            label="Stress"
            value={`${Math.round(latestFrame.flags.stress_level * 100)}%`}
            color={latestFrame.flags.stress_level > 0.6 ? THEME.negative : THEME.textSecondary}
          />
        </div>
      )}

      {/* Page cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {PAGES.map(({ to, icon, title, desc }) => (
          <Link key={to} to={to} style={{ textDecoration: 'none' }}>
            <div style={{
              background: THEME.bgCard, borderRadius: 12, padding: '22px 24px',
              border: `1px solid ${THEME.border}`, cursor: 'pointer',
              transition: 'all 0.2s', boxShadow: THEME.shadow,
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = THEME.accent; (e.currentTarget as HTMLDivElement).style.boxShadow = THEME.shadowMd; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = THEME.border; (e.currentTarget as HTMLDivElement).style.boxShadow = THEME.shadow; }}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: THEME.text, marginBottom: 6 }}>{title}</div>
              <div style={{ fontSize: 13, color: THEME.textSecondary, lineHeight: 1.5 }}>{desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Science note */}
      <div style={{ marginTop: 40, padding: '16px 20px', background: THEME.bgHover, borderRadius: 10, border: `1px solid ${THEME.borderLight}` }}>
        <p style={{ margin: 0, fontSize: 11, color: THEME.textMuted, lineHeight: 1.6 }}>
          <strong style={{ color: THEME.textSecondary }}>Scientific basis:</strong> Facial coding based on Ekman & Friesen (1978) FACS · Voice prosody via GeMAPS (Eyben et al., 2016) · Valence-Arousal-Dominance model (Russell, 1980) · Mindfulness exercises (Balban et al., 2023; Kabat-Zinn, 1990)
          <br />
          <strong style={{ color: THEME.textSecondary }}>Privacy:</strong> All processing runs locally in your browser. No data is transmitted. Video and audio never leave your device.
        </p>
      </div>
    </div>
  );
}

function StatItem({ label, value, color, capitalize }: { label: string; value: string; color?: string; capitalize?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: THEME.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: color ?? THEME.text, textTransform: capitalize ? 'capitalize' : 'none' }}>{value}</div>
    </div>
  );
}
