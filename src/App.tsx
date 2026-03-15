import { useEmotionStream } from './hooks/useEmotionStream';
import { EmotionDashboard } from './components/EmotionDashboard';
import { EmotionChart } from './components/EmotionChart';
import { Timeline } from './components/Timeline';
import { MindfulnessPanel } from './components/MindfulnessPanel';
import { SessionControls } from './components/SessionControls';
import { SessionSummary } from './components/SessionSummary';
import { THEME } from './utils/colors';
import type { BreathingExercise } from './types/emotions';

export default function App() {
  const {
    session,
    latestFrame,
    mindfulness,
    setMindfulness,
    start,
    pause,
    stop,
    addNote,
    dismissMindfulness,
    completeMindfulness,
  } = useEmotionStream();

  const handleSelectExercise = (exercise: BreathingExercise) => {
    setMindfulness(prev => ({ ...prev, exercise }));
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: THEME.bg,
      color: THEME.text,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <header style={{
        padding: '20px 32px',
        borderBottom: `1px solid ${THEME.border}`,
        background: THEME.bgCard,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{
            margin: 0, fontSize: 20, fontWeight: 700, color: THEME.text,
            letterSpacing: -0.5,
          }}>
            EmotionsAI
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: THEME.textMuted }}>
            Real-time multimodal sentiment analysis
          </p>
        </div>
        <div style={{ fontSize: 11, color: THEME.textMuted }}>
          Prototype &middot; Simulated Data
        </div>
      </header>

      <main style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '24px 24px 48px',
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: 20,
        alignItems: 'start',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <EmotionDashboard frame={latestFrame} />
          <EmotionChart distribution={latestFrame?.emotion_distribution ?? null} />
          <Timeline frames={session.frames} />
          <SessionSummary session={session} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 24 }}>
          <SessionControls
            session={session}
            onStart={start}
            onPause={pause}
            onStop={stop}
            onAddNote={addNote}
          />
          <MindfulnessPanel
            prompt={mindfulness}
            onSelectExercise={handleSelectExercise}
            onDismiss={dismissMindfulness}
            onComplete={completeMindfulness}
          />
          <PrivacyNote />
        </div>
      </main>
    </div>
  );
}

function PrivacyNote() {
  return (
    <div style={{
      background: THEME.bgHover,
      borderRadius: 10,
      padding: '14px 16px',
      border: `1px solid ${THEME.borderLight}`,
    }}>
      <p style={{ margin: 0, fontSize: 11, color: THEME.textMuted, lineHeight: 1.5 }}>
        <strong style={{ color: THEME.textSecondary }}>Privacy:</strong> All processing happens locally.
        No data is stored without your explicit consent. This prototype uses simulated data only.
      </p>
    </div>
  );
}
