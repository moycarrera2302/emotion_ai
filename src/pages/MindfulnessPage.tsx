import { useState } from 'react';
import { useEmotion } from '../context/EmotionContext';
import { THEME } from '../utils/colors';
import type { BreathingExercise } from '../types/emotions';

const EXERCISES: Array<{
  id: BreathingExercise;
  name: string;
  tagline: string;
  description: string;
  steps: string[];
  duration: string;
  reference: string;
  bestFor: string;
}> = [
  {
    id: '4-7-8',
    name: '4-7-8 Breathing',
    tagline: 'Parasympathetic activation',
    description: 'Developed by Dr. Andrew Weil. Activates the parasympathetic nervous system to reduce anxiety and promote sleep.',
    steps: ['Inhale through nose — 4 seconds', 'Hold breath — 7 seconds', 'Exhale fully through mouth — 8 seconds', 'Repeat 4 cycles'],
    duration: '~2 min',
    reference: 'Weil (2015)',
    bestFor: 'Anxiety, pre-sleep',
  },
  {
    id: 'box',
    name: 'Box Breathing',
    tagline: 'Navy SEAL stress protocol',
    description: 'Used by US Navy SEALs for stress management. Equal 4-second phases create a "box" pattern, balancing the nervous system.',
    steps: ['Inhale — 4 seconds', 'Hold — 4 seconds', 'Exhale — 4 seconds', 'Hold — 4 seconds', 'Repeat 4-8 cycles'],
    duration: '~3 min',
    reference: 'US Navy SEAL Protocol',
    bestFor: 'High stress, focus',
  },
  {
    id: 'physiological-sigh',
    name: 'Physiological Sigh',
    tagline: 'Fastest real-time stress reduction',
    description: 'Stanford/Cell Reports Medicine (2023) — the fastest known way to reduce physiological arousal in real time.',
    steps: ['Quick inhale through nose', 'Short second inhale (top-up the lungs)', 'Long slow exhale through mouth', 'Repeat 1-3 times'],
    duration: '~30 sec',
    reference: 'Balban et al., 2023 — Cell Reports Medicine',
    bestFor: 'Immediate stress relief',
  },
  {
    id: 'coherent',
    name: 'Coherent Breathing',
    tagline: 'HRV optimization',
    description: 'Breathing at 5.5 breaths per minute maximizes heart rate variability (HRV), a key marker of resilience.',
    steps: ['Inhale smoothly — 5.5 seconds', 'Exhale smoothly — 5.5 seconds', 'No pauses, continuous flow', 'Continue for 3-5 minutes'],
    duration: '~5 min',
    reference: 'Lehrer & Gevirtz (2014)',
    bestFor: 'HRV, emotional regulation',
  },
  {
    id: 'body-scan',
    name: 'Body Scan',
    tagline: 'MBSR mindfulness protocol',
    description: 'Progressive attention through body regions from Jon Kabat-Zinn\'s Mindfulness-Based Stress Reduction program.',
    steps: ['Close eyes, breathe naturally', 'Focus attention on feet — notice sensations', 'Move up through legs, torso, arms', 'Observe shoulders, neck, face', 'Rest in full body awareness'],
    duration: '~5 min',
    reference: 'Kabat-Zinn (1990) — Full Catastrophe Living',
    bestFor: 'Chronic stress, body awareness',
  },
];

export function MindfulnessPage() {
  const { latestFrame, mindfulness, setMindfulness, dismissMindfulness, completeMindfulness } = useEmotion();
  const [activeExercise, setActiveExercise] = useState<BreathingExercise | null>(null);
  const [step, setStep] = useState(0);

  const valence = latestFrame?.dimensional_model.valence ?? null;
  const stress = latestFrame?.flags.stress_level ?? 0;

  const startExercise = (id: BreathingExercise) => {
    setActiveExercise(id);
    setStep(0);
    setMindfulness(prev => ({ ...prev, active: true, exercise: id, pre_valence: valence }));
  };

  const finishExercise = () => {
    setActiveExercise(null);
    completeMindfulness();
  };

  const ex = activeExercise ? EXERCISES.find(e => e.id === activeExercise) : null;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>
      <h1 style={pageTitle}>Mindfulness</h1>
      <p style={pageSubtitle}>Evidence-based breathing and mindfulness exercises to regulate your emotional state</p>

      {/* Status banner */}
      {(valence !== null || stress > 0) && (
        <div style={{
          background: stress > 0.6 ? `${THEME.negative}12` : valence !== null && valence < 0.35 ? `${THEME.accent}12` : `${THEME.positive}12`,
          border: `1px solid ${stress > 0.6 ? THEME.negative : valence !== null && valence < 0.35 ? THEME.accent : THEME.positive}40`,
          borderRadius: 10, padding: '14px 18px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <span style={{ fontSize: 24 }}>{stress > 0.6 ? '😟' : valence !== null && valence < 0.35 ? '😔' : '🙂'}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: THEME.text }}>
              {stress > 0.6
                ? 'High stress detected — a breathing exercise may help'
                : valence !== null && valence < 0.35
                  ? 'Your emotional tone is lower — would a mindfulness exercise help?'
                  : 'Your emotional state looks balanced — exercises available below'}
            </div>
            {valence !== null && (
              <div style={{ fontSize: 11, color: THEME.textSecondary, marginTop: 2 }}>
                Valence: {valence.toFixed(2)} · Stress: {Math.round(stress * 100)}%
              </div>
            )}
          </div>
          {mindfulness.active && (
            <button onClick={dismissMindfulness} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: 11, color: THEME.textMuted, cursor: 'pointer' }}>
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Post-exercise result */}
      {!mindfulness.active && mindfulness.post_valence !== null && mindfulness.pre_valence !== null && (
        <div style={{ background: `${THEME.positive}12`, border: `1px solid ${THEME.positive}40`, borderRadius: 10, padding: '14px 18px', marginBottom: 24 }}>
          <span style={{ fontSize: 13, color: THEME.text }}>
            After the exercise, your valence shifted from <strong>{mindfulness.pre_valence.toFixed(2)}</strong> → <strong>{mindfulness.post_valence.toFixed(2)}</strong>
            {mindfulness.post_valence > mindfulness.pre_valence ? ' — a meaningful improvement.' : ' — give yourself a moment.'}
          </span>
        </div>
      )}

      {/* Active exercise */}
      {activeExercise && ex ? (
        <div style={{ ...card, borderColor: THEME.accent, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: THEME.text }}>{ex.name}</h2>
              <span style={{ fontSize: 12, color: THEME.accent }}>{ex.tagline}</span>
            </div>
            <button onClick={finishExercise} style={{ background: THEME.positive, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Done
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', background: `${THEME.accent}15`, border: `2px solid ${THEME.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'breathe 6s ease-in-out infinite' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: THEME.accent }}>Breathe</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ex.steps.map((s, i) => (
              <button key={i} onClick={() => setStep(i)}
                style={{ background: step === i ? `${THEME.accent}15` : THEME.bgHover, border: `1px solid ${step === i ? THEME.accent : THEME.borderLight}`, borderRadius: 8, padding: '10px 14px', textAlign: 'left', cursor: 'pointer', fontSize: 13, color: step === i ? THEME.text : THEME.textSecondary, fontWeight: step === i ? 600 : 400 }}>
                {i + 1}. {s}
              </button>
            ))}
          </div>

          <p style={{ margin: '12px 0 0', fontSize: 10, color: THEME.textMuted }}>Reference: {ex.reference}</p>
        </div>
      ) : (
        /* Exercise cards */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {EXERCISES.map(ex => (
            <div key={ex.id} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <h3 style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: THEME.text }}>{ex.name}</h3>
                  <span style={{ fontSize: 11, color: THEME.accent }}>{ex.tagline}</span>
                </div>
                <span style={{ fontSize: 10, color: THEME.textMuted, flexShrink: 0 }}>{ex.duration}</span>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: 12, color: THEME.textSecondary, lineHeight: 1.5 }}>{ex.description}</p>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 10, color: THEME.textMuted }}>Best for: </span>
                <span style={{ fontSize: 10, fontWeight: 600, color: THEME.textSecondary }}>{ex.bestFor}</span>
              </div>
              <button onClick={() => startExercise(ex.id)}
                style={{ width: '100%', background: THEME.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Begin
              </button>
              <p style={{ margin: '6px 0 0', fontSize: 10, color: THEME.textMuted, textAlign: 'center' }}>{ex.reference}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const pageTitle: React.CSSProperties = { margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: THEME.text };
const pageSubtitle: React.CSSProperties = { margin: '0 0 24px', fontSize: 13, color: THEME.textSecondary };
const card: React.CSSProperties = { background: THEME.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${THEME.border}`, boxShadow: THEME.shadow };
