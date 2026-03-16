import { NavLink, useLocation } from 'react-router-dom';
import { useEmotion } from '../context/EmotionContext';
import { EMOTION_COLORS } from '../utils/colors';

const LINKS = [
  { to: '/', label: 'Home', exact: true },
  { to: '/visual', label: 'Visual' },
  { to: '/audio', label: 'Audio' },
  { to: '/mindfulness', label: 'Mindfulness' },
  { to: '/timeline', label: 'Timeline' },
];

export function Nav() {
  const { session, latestFrame, start, pause, stop } = useEmotion();
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '';
  const isActive = session.status === 'active';
  const emotion = latestFrame?.dominant_emotion;

  return (
    <header style={{
      position: isHome ? 'fixed' : 'sticky',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      padding: '0 32px',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      gap: 32,
      background: isHome ? 'transparent' : 'rgba(253,251,248,0.92)',
      backdropFilter: isHome ? 'none' : 'blur(12px)',
      borderBottom: isHome ? 'none' : '1px solid #E8E4DD',
      transition: 'background 0.3s, border-bottom 0.3s',
    }}>
      <NavLink to="/" style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: 16, fontWeight: 800, color: '#2C2A26',
        textDecoration: 'none', flexShrink: 0,
      }}>
        Emotions<span style={{ color: '#C4946A' }}>AI</span>
      </NavLink>

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
              color: active ? '#2C2A26' : '#7A756B',
              background: active && !isHome ? 'rgba(0,0,0,0.04)' : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.2s',
            })}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        {emotion && isActive && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: `${EMOTION_COLORS[emotion]}18`,
            border: `1px solid ${EMOTION_COLORS[emotion]}40`,
            borderRadius: 20, padding: '4px 12px',
            fontSize: 12, fontWeight: 600, color: '#2C2A26',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: EMOTION_COLORS[emotion],
              animation: 'pulse 2s infinite',
            }} />
            <span style={{ textTransform: 'capitalize' }}>{emotion}</span>
          </div>
        )}

        {!isActive ? (
          <button onClick={start} style={{
            background: '#2C2A26', color: '#FDFBF8',
            border: 'none', borderRadius: 20, padding: '7px 18px',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
            {session.status === 'completed' ? 'New Session' : 'Start'}
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={pause} style={{
              background: 'rgba(0,0,0,0.05)', color: '#2C2A26',
              border: '1px solid #E8E4DD', borderRadius: 20, padding: '7px 14px',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
            }}>
              Pause
            </button>
            <button onClick={stop} style={{
              background: '#C4614E', color: '#fff',
              border: 'none', borderRadius: 20, padding: '7px 14px',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
              Stop
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
