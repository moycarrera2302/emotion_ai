import { useState } from 'react';
import type { Session } from '../types/emotions';
import { THEME } from '../utils/colors';

interface Props {
  session: Session;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onAddNote: (note: string) => void;
}

export function SessionControls({ session, onStart, onPause, onStop, onAddNote }: Props) {
  const [noteInput, setNoteInput] = useState('');

  const elapsed = session.frames.length * 2;
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={headerStyle}>Session</h2>
        <StatusBadge status={session.status} />
      </div>

      <div style={{ fontSize: 12, color: THEME.textSecondary, marginBottom: 16 }}>
        <div>ID: <span style={{ fontFamily: 'monospace', fontSize: 10 }}>{session.id.slice(0, 18)}...</span></div>
        <div>Duration: {minutes}m {seconds.toString().padStart(2, '0')}s</div>
        <div>Frames: {session.frames.length}</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {session.status !== 'active' && (
          <button onClick={onStart} style={{ ...btnStyle, background: THEME.positive, color: '#fff' }}>
            {session.status === 'completed' ? 'New Session' : 'Start'}
          </button>
        )}
        {session.status === 'active' && (
          <>
            <button onClick={onPause} style={{ ...btnStyle, background: THEME.accent, color: '#fff' }}>
              Pause
            </button>
            <button onClick={onStop} style={{ ...btnStyle, background: THEME.negative, color: '#fff' }}>
              Stop
            </button>
          </>
        )}
      </div>

      {session.status !== 'completed' && (
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type="text"
            placeholder="Add a note..."
            value={noteInput}
            onChange={e => setNoteInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && noteInput.trim()) {
                onAddNote(noteInput.trim());
                setNoteInput('');
              }
            }}
            style={inputStyle}
          />
          <button
            onClick={() => {
              if (noteInput.trim()) {
                onAddNote(noteInput.trim());
                setNoteInput('');
              }
            }}
            style={{ ...btnStyle, background: THEME.bgHover, color: THEME.text, fontSize: 11 }}
          >
            Add
          </button>
        </div>
      )}

      {session.notes.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <span style={{ fontSize: 11, color: THEME.textMuted }}>Notes:</span>
          {session.notes.map((n, i) => (
            <div key={i} style={{
              fontSize: 11, color: THEME.textSecondary, padding: '4px 0',
              borderBottom: `1px solid ${THEME.borderLight}`,
            }}>
              {n}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = status === 'active' ? THEME.positive : status === 'paused' ? THEME.accent : THEME.textMuted;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 600, color,
      textTransform: 'uppercase', letterSpacing: 0.5,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: color,
        animation: status === 'active' ? 'pulse 2s ease-in-out infinite' : 'none',
      }} />
      {status}
    </span>
  );
}

const cardStyle: React.CSSProperties = {
  background: THEME.bgCard,
  borderRadius: 12,
  padding: 20,
  border: `1px solid ${THEME.border}`,
  boxShadow: THEME.shadow,
};

const headerStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  fontWeight: 600,
  color: THEME.textSecondary,
  textTransform: 'uppercase',
  letterSpacing: 1,
};

const btnStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: 8,
  padding: '8px 16px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'opacity 0.2s',
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  border: `1px solid ${THEME.border}`,
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 12,
  background: THEME.bg,
  color: THEME.text,
  outline: 'none',
};
