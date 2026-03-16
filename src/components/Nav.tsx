import { NavLink } from 'react-router-dom';
import { useEmotion } from '../context/EmotionContext';
import { THEME, EMOTION_COLORS } from '../utils/colors';

const LINKS = [
  { to: '/', label: 'Home', exact: true },
  { to: '/visual', label: 'Visual', exact: false },
  { to: '/audio', label: 'Audio', exact: false },
  { to: '/mindfulness', label: 'Mindfulness', exact: false },
  { to: '/timeline', label: 'Timeline', exact: false },
];

export function Nav() {
  const { session, latestFrame, start, pause, stop } = useEmotion();
  const isActive = session.status === 'active';
  const isPaused = session.status === 'paused';
  const emotion = latestFrame?.dominant_emotion;

  return (
    <header style={{
      background: THEME.bgCard,
      borderBottom: `1px solid ${THEME.border}`,
      padding: '0 28px',
      display: 'flex',
      alignItems: 'center',
      gap: 32,
      height: 56,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: THEME.shadow,
    }}>
      {/* Brand */}
      <div style={{ flexShrink: 0 }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: THEME.text, letterSpacing: -0.5 }}>
          Emotions<span style={{ color: THEME.accent }}>AI</span>
        </span>
      </div>

      {/* Nav links */}
      <nav style={{ display: 'flex', gap: 4 }}>
        {LINKS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive: active }) => ({
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: active ? 600 : 400,
              color: active ? THEME.text : THEME.textSecondary,
              background: active ? THEME.bgHover : 'transparent',
              textDecoration: 'none',
              border: active ? `1px solid ${THEME.border}` : '1px solid transparent',
              transition: 'all 0.15s',
            })}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Session controls + live emotion */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        {emotion && isActive && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: `${EMOTION_COLORS[emotion]}18`,
            border: `1px solid ${EMOTION_COLORS[emotion]}40`,
            borderRadius: 20, padding: '4px 12px',
            fontSize: 12, fontWeight: 600, color: THEME.text,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: EMOTION_COLORS[emotion], animation: 'pulse 2s infinite' }} />
            <span style={{ textTransform: 'capitalize' }}>{emotion}</span>
            <span style={{ color: THEME.textMuted, fontWeight: 400 }}>
              {Math.round((latestFrame?.confidence ?? 0) * 100)}%
            </span>
          </div>
        )}

        {!isActive ? (
          <button onClick={start} style={{ ...btnStyle, background: THEME.positive, color: '#fff' }}>
            {session.status === 'completed' ? 'New Session' : 'Start'}
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={pause} style={{ ...btnStyle, background: THEME.bgHover, color: THEME.text, border: `1px solid ${THEME.border}` }}>
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button onClick={stop} style={{ ...btnStyle, background: THEME.negative, color: '#fff' }}>
              Stop
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

const btnStyle: React.CSSProperties = {
  border: 'none', borderRadius: 8, padding: '7px 16px',
  fontSize: 12, fontWeight: 600, cursor: 'pointer',
};
