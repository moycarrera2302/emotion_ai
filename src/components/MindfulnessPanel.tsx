import { useState } from 'react';
import type { BreathingExercise, MindfulnessPrompt } from '../types/emotions';
import { THEME } from '../utils/colors';

interface Props {
  prompt: MindfulnessPrompt;
  onSelectExercise: (exercise: BreathingExercise) => void;
  onDismiss: () => void;
  onComplete: () => void;
}

const EXERCISES: Array<{ id: BreathingExercise; name: string; description: string; duration: string }> = [
  { id: '4-7-8', name: '4-7-8 Breathing', description: 'Inhale 4s, hold 7s, exhale 8s. Activates parasympathetic nervous system.', duration: '~2 min' },
  { id: 'box', name: 'Box Breathing', description: 'Equal 4s phases: inhale, hold, exhale, hold. Navy SEAL stress protocol.', duration: '~3 min' },
  { id: 'physiological-sigh', name: 'Physiological Sigh', description: 'Double inhale + long exhale. Fastest real-time stress reduction (Stanford).', duration: '~1 min' },
  { id: 'coherent', name: 'Coherent Breathing', description: '5.5 breaths per minute for HRV optimization.', duration: '~3 min' },
  { id: 'body-scan', name: 'Body Scan', description: 'Progressive attention through body regions (MBSR).', duration: '~5 min' },
];

export function MindfulnessPanel({ prompt, onSelectExercise, onDismiss, onComplete }: Props) {
  const [selectedExercise, setSelectedExercise] = useState<BreathingExercise | null>(prompt.exercise);
  const [started, setStarted] = useState(false);

  if (!prompt.active && prompt.post_valence !== null && prompt.pre_valence !== null) {
    const improved = prompt.post_valence > prompt.pre_valence;
    return (
      <div style={{ ...cardStyle, borderColor: THEME.positive }}>
        <p style={{ fontSize: 13, color: THEME.text, margin: 0 }}>
          After the exercise, your valence shifted from{' '}
          <strong>{prompt.pre_valence.toFixed(2)}</strong> to{' '}
          <strong>{prompt.post_valence.toFixed(2)}</strong>
          {improved ? ' — a meaningful improvement.' : ' — give yourself a moment.'}
        </p>
      </div>
    );
  }

  if (!prompt.active) return null;

  return (
    <div style={{ ...cardStyle, borderColor: THEME.accent }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: '0 0 6px 0', fontSize: 15, fontWeight: 600, color: THEME.text }}>
            Mindfulness Suggestion
          </h2>
          <p style={{ margin: 0, fontSize: 12, color: THEME.textSecondary, lineHeight: 1.5 }}>
            I've noticed your emotional tone has been lower for a few minutes.
            Would you like to try a quick breathing exercise?
          </p>
        </div>
        <button onClick={onDismiss} style={dismissBtnStyle}>Dismiss</button>
      </div>

      {!started && (
        <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
          {EXERCISES.map(ex => (
            <button
              key={ex.id}
              onClick={() => { setSelectedExercise(ex.id); onSelectExercise(ex.id); }}
              style={{
                ...exerciseBtnStyle,
                borderColor: selectedExercise === ex.id ? THEME.accent : THEME.borderLight,
                background: selectedExercise === ex.id ? `${THEME.accent}10` : THEME.bgHover,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 13, color: THEME.text }}>{ex.name}</strong>
                <span style={{ fontSize: 10, color: THEME.textMuted }}>{ex.duration}</span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: THEME.textSecondary, lineHeight: 1.4 }}>
                {ex.description}
              </p>
            </button>
          ))}
          {selectedExercise && (
            <button onClick={() => setStarted(true)} style={startBtnStyle}>
              Begin Exercise
            </button>
          )}
        </div>
      )}

      {started && selectedExercise && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: THEME.text, marginBottom: 4 }}>
            {EXERCISES.find(e => e.id === selectedExercise)?.name}
          </p>
          <p style={{ fontSize: 12, color: THEME.textSecondary, marginBottom: 16 }}>
            Follow the breathing pattern. Take your time.
          </p>
          <BreathingAnimation exercise={selectedExercise} />
          <button onClick={onComplete} style={{ ...startBtnStyle, marginTop: 16 }}>
            I'm Done
          </button>
        </div>
      )}
    </div>
  );
}

function BreathingAnimation({ exercise }: { exercise: BreathingExercise }) {
  const instructions: Record<BreathingExercise, string[]> = {
    '4-7-8': ['Inhale... 4s', 'Hold... 7s', 'Exhale... 8s'],
    'box': ['Inhale... 4s', 'Hold... 4s', 'Exhale... 4s', 'Hold... 4s'],
    'physiological-sigh': ['Quick inhale', 'Second inhale', 'Long exhale...'],
    'coherent': ['Inhale... 5.5s', 'Exhale... 5.5s'],
    'body-scan': ['Focus on your feet', 'Move up through your legs', 'Notice your torso', 'Relax your shoulders', 'Soften your face'],
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: `${THEME.accent}20`,
        border: `2px solid ${THEME.accent}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'breathe 6s ease-in-out infinite',
      }}>
        <span style={{ fontSize: 11, color: THEME.accent, fontWeight: 600 }}>Breathe</span>
      </div>
      <div style={{ fontSize: 11, color: THEME.textSecondary, lineHeight: 1.6 }}>
        {instructions[exercise].map((step, i) => (
          <div key={i}>{i + 1}. {step}</div>
        ))}
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: THEME.bgCard,
  borderRadius: 12,
  padding: 20,
  border: `2px solid ${THEME.border}`,
  boxShadow: THEME.shadowMd,
};

const dismissBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: 11,
  color: THEME.textMuted,
  cursor: 'pointer',
  padding: '4px 8px',
};

const exerciseBtnStyle: React.CSSProperties = {
  background: THEME.bgHover,
  border: `1px solid ${THEME.borderLight}`,
  borderRadius: 8,
  padding: '10px 14px',
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

const startBtnStyle: React.CSSProperties = {
  background: THEME.accent,
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '10px 24px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};
