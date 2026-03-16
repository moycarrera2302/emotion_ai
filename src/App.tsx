import { useCallback } from 'react';
import { useEmotionStream } from './hooks/useEmotionStream';
import { useFaceDetection } from './hooks/useFaceDetection';
import { EmotionDashboard } from './components/EmotionDashboard';
import { EmotionChart } from './components/EmotionChart';
import { Timeline } from './components/Timeline';
import { MindfulnessPanel } from './components/MindfulnessPanel';
import { SessionControls } from './components/SessionControls';
import { SessionSummary } from './components/SessionSummary';
import { CameraFeed } from './components/CameraFeed';
import { THEME } from './utils/colors';
import type { BreathingExercise, EmotionFrame } from './types/emotions';

export default function App() {
  const {
    session,
    latestFrame,
    mindfulness,
    setMindfulness,
    simulationMode,
    setSimulationMode,
    processFrame,
    start,
    pause,
    stop,
    addNote,
    dismissMindfulness,
    completeMindfulness,
  } = useEmotionStream();

  const sessionActive = session.status === 'active';

  const handleFrame = useCallback((frame: EmotionFrame) => {
    if (sessionActive) processFrame(frame);
  }, [sessionActive, processFrame]);

  const { videoRef, canvasRef, status: camStatus, error: camError, startCamera, stopCamera } =
    useFaceDetection({
      sessionId: session.id,
      active: sessionActive && !simulationMode,
      onFrame: handleFrame,
    });

  const handleSelectExercise = useCallback((exercise: BreathingExercise) => {
    setMindfulness(prev => ({ ...prev, exercise }));
  }, [setMindfulness]);

  return (
    <div style={{
      minHeight: '100vh',
      background: THEME.bg,
      color: THEME.text,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <header style={{
        padding: '16px 32px',
        borderBottom: `1px solid ${THEME.border}`,
        background: THEME.bgCard,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: THEME.text, letterSpacing: -0.5 }}>
            EmotionsAI
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: THEME.textMuted }}>
            Real-time multimodal sentiment analysis
          </p>
        </div>

        {/* Mode toggle */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: THEME.bgHover, borderRadius: 8, padding: '4px 6px',
          border: `1px solid ${THEME.border}`,
        }}>
          <ModeBtn label="Camera" active={!simulationMode} onClick={() => setSimulationMode(false)} />
          <ModeBtn label="Simulate" active={simulationMode} onClick={() => setSimulationMode(true)} />
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 24 }}>
          <SessionControls
            session={session}
            onStart={start}
            onPause={pause}
            onStop={stop}
            onAddNote={addNote}
          />

          {!simulationMode && (
            <CameraFeed
              videoRef={videoRef}
              canvasRef={canvasRef}
              status={camStatus}
              error={camError}
              sessionActive={sessionActive}
              onStart={startCamera}
              onStop={stopCamera}
            />
          )}

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

function ModeBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? THEME.bgCard : 'transparent',
        border: active ? `1px solid ${THEME.border}` : '1px solid transparent',
        borderRadius: 6,
        padding: '5px 14px',
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        color: active ? THEME.text : THEME.textMuted,
        cursor: 'pointer',
        boxShadow: active ? THEME.shadow : 'none',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}

function PrivacyNote() {
  return (
    <div style={{
      background: THEME.bgHover,
      borderRadius: 10,
      padding: '12px 14px',
      border: `1px solid ${THEME.borderLight}`,
    }}>
      <p style={{ margin: 0, fontSize: 11, color: THEME.textMuted, lineHeight: 1.5 }}>
        <strong style={{ color: THEME.textSecondary }}>Privacy:</strong> All face detection runs
        locally in your browser. No video or data is ever transmitted or stored.
      </p>
    </div>
  );
}
