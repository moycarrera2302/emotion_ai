import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useEmotion } from '../context/EmotionContext';
import { useReveal } from '../hooks/useReveal';
import { generateEmotionArt, ARTISTS } from '../utils/emotionArt';
import type { EmotionFrame, EmotionDistribution, EmotionLabel } from '../types/emotions';

// Generate demo frames for the hero art
function makeDemoFrames(): EmotionFrame[] {
  const emotions: EmotionLabel[] = ['joy', 'sadness', 'surprise', 'anger', 'neutral', 'fear', 'joy', 'neutral', 'joy', 'surprise'];
  return emotions.map((e, i) => {
    const dist: EmotionDistribution = { joy: 0.05, sadness: 0.05, anger: 0.05, fear: 0.05, surprise: 0.05, disgust: 0.05, neutral: 0.05 };
    dist[e] = 0.65;
    return {
      timestamp: new Date(Date.now() - (emotions.length - i) * 2000).toISOString(),
      session_id: 'demo', frame_number: i, dominant_emotion: e, confidence: 0.75,
      emotion_distribution: dist,
      dimensional_model: { valence: 0.3, arousal: 0.3, dominance: 0.3 },
      visual: { dominant: e, confidence: 0.75, active_AUs: [], face_detected: true, expressivity_index: 0.6 },
      flags: { micro_expression_detected: false, mixed_signals: false, stress_level: 0.2, emotional_shift: false },
    };
  });
}

export function HomePage() {
  const { start } = useEmotion();
  const heroCanvasRef = useRef<HTMLCanvasElement>(null);
  useReveal();

  // Render hero art on mount
  useEffect(() => {
    const canvas = heroCanvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    const { canvas: art } = generateEmotionArt(makeDemoFrames(), canvas.width, canvas.height);
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.drawImage(art, 0, 0);
  }, []);

  return (
    <div>
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', minHeight: '100vh', display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Art background */}
        <canvas
          ref={heroCanvasRef}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            opacity: 0.35, zIndex: 0,
          }}
        />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(180deg, rgba(253,251,248,0.6) 0%, rgba(253,251,248,0.2) 40%, rgba(253,251,248,0.7) 100%)',
        }} />

        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 24px', maxWidth: 800 }}>
          <p style={{
            fontFamily: "'Inter'", fontSize: 13, fontWeight: 500, letterSpacing: 3,
            textTransform: 'uppercase', color: '#C4946A', marginBottom: 24,
            animation: 'fadeIn 1.2s ease-out',
          }}>
            Discover what your face reveals
          </p>

          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(42px, 7vw, 80px)',
            fontWeight: 700,
            lineHeight: 1.05,
            color: '#2C2A26',
            marginBottom: 28,
            animation: 'fadeInUp 1s ease-out 0.2s both',
          }}>
            Your emotions,<br />
            <span style={{
              fontStyle: 'italic',
              background: 'linear-gradient(135deg, #C4946A, #E8B931, #6B8DAE, #8B6BAE)',
              backgroundSize: '300% 300%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'gradientShift 8s ease infinite',
            }}>
              painted in light
            </span>
          </h1>

          <p style={{
            fontFamily: "'Inter'", fontSize: 18, fontWeight: 300, lineHeight: 1.7,
            color: '#5A5650', maxWidth: 560, margin: '0 auto 16px',
            animation: 'fadeInUp 1s ease-out 0.4s both',
          }}>
            Let your face tell its story. Smile, frown, wonder, rage — express
            yourself freely to the camera and watch your emotions become a living painting.
          </p>
          <p style={{
            fontFamily: "'Inter'", fontSize: 14, fontWeight: 400, lineHeight: 1.6,
            color: '#A8A08E', maxWidth: 440, margin: '0 auto 40px',
            animation: 'fadeInUp 1s ease-out 0.5s both',
          }}>
            Everything stays on your device. Nothing is recorded. This is your safe space.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', animation: 'fadeInUp 1s ease-out 0.6s both' }}>
            <Link to="/visual" onClick={start} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#2C2A26', color: '#FDFBF8',
              padding: '16px 40px', borderRadius: 50, fontSize: 15, fontWeight: 600,
              textDecoration: 'none', letterSpacing: 0.3,
              boxShadow: '0 8px 32px rgba(44,42,38,0.2)',
            }}>
              Open camera &rarr;
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: 32, zIndex: 2,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          animation: 'float 3s ease-in-out infinite',
        }}>
          <span style={{ fontSize: 11, letterSpacing: 2, color: '#B0A99E', textTransform: 'uppercase' }}>Scroll</span>
          <div style={{ width: 1, height: 32, background: 'linear-gradient(to bottom, #B0A99E, transparent)' }} />
        </div>
      </section>

      {/* ── Philosophy ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '120px 24px', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <p className="reveal" style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(24px, 4vw, 38px)',
          fontWeight: 400,
          lineHeight: 1.6,
          color: '#3D3A35',
          fontStyle: 'italic',
        }}>
          "Every face tells a story. Every micro-expression is a brushstroke.
          EmotionsAI doesn't just read your emotions — it transforms them
          into art that is uniquely, irreplicably <em style={{ color: '#C4946A' }}>yours</em>."
        </p>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: '80px 24px 120px', background: '#F8F5F0' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <p className="reveal" style={sectionTag}>How it works</p>
          <h2 className="reveal" style={sectionTitle}>Three layers of emotional intelligence</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, marginTop: 56 }}>
            {[
              {
                num: '01', title: 'See',
                body: 'Your camera captures facial micro-expressions. Our AI reads 68 landmark points and maps them to Ekman\'s 7 universal emotions using the Facial Action Coding System.',
                color: '#E8B931',
                detail: 'FACS · AU coding · 68-point mesh · 2 FPS precision',
              },
              {
                num: '02', title: 'Listen',
                body: 'Your microphone analyzes voice prosody — pitch, energy, speech rate, and spectral patterns that reveal emotional states words alone can\'t express.',
                color: '#6B8DAE',
                detail: 'Pitch · Energy · ZCR · Spectral centroid',
              },
              {
                num: '03', title: 'Create',
                body: 'Your emotional data becomes a generative painting. Joy rises as warm gold, sadness flows as cool blue, anger bursts in crimson — your unique emotional fingerprint.',
                color: '#C4614E',
                detail: 'Flow fields · Plutchik palette · PDF report',
              },
            ].map(({ num, title, body, color, detail }, i) => (
              <div key={num} className="reveal" style={{ transitionDelay: `${i * 0.15}s` }}>
                <div style={{
                  fontSize: 48, fontFamily: "'Playfair Display', serif",
                  fontWeight: 800, color: `${color}30`, marginBottom: 12,
                }}>{num}</div>
                <h3 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 28, fontWeight: 700, color: '#2C2A26', marginBottom: 12,
                }}>{title}</h3>
                <p style={{ fontSize: 15, color: '#5A5650', lineHeight: 1.7, marginBottom: 14 }}>{body}</p>
                <p style={{
                  fontSize: 11, color: '#B0A99E', letterSpacing: 1.5,
                  textTransform: 'uppercase', fontWeight: 500,
                }}>{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The Art ────────────────────────────────────────────────────────── */}
      <section style={{ padding: '120px 24px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div className="reveal-left">
            <p style={sectionTag}>The art footprint</p>
            <h2 style={{
              fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700,
              color: '#2C2A26', lineHeight: 1.3, marginBottom: 20,
            }}>
              Your session becomes<br />a living painting
            </h2>
            <p style={{ fontSize: 16, color: '#5A5650', lineHeight: 1.8, marginBottom: 24 }}>
              Every emotion you express sends particles flowing across a digital canvas.
              Joy creates warm ascending streams. Sadness paints cool descending waves.
              Anger ignites turbulent bursts. The result is a one-of-a-kind artwork
              that captures the texture of your inner world.
            </p>
            <p style={{ fontSize: 16, color: '#5A5650', lineHeight: 1.8, marginBottom: 32 }}>
              Download it as a beautiful PDF — your emotional fingerprint,
              a piece of art no one else can create.
            </p>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[
                { label: 'Joy', color: '#E8B931', desc: 'Warm ascending streams' },
                { label: 'Sadness', color: '#6B8DAE', desc: 'Cool descending flows' },
                { label: 'Anger', color: '#C4614E', desc: 'Turbulent bursts' },
                { label: 'Fear', color: '#8B6BAE', desc: 'Scattered violet fragments' },
                { label: 'Surprise', color: '#4EA88B', desc: 'Radiating teal sparks' },
              ].map(({ label, color, desc }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#2C2A26' }}>{label}</div>
                    <div style={{ fontSize: 10, color: '#B0A99E' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal-right">
            <HeroArtDemo />
          </div>
        </div>
      </section>

      {/* ── Impressionist masters showcase ────────────────────────────────── */}
      <section style={{ padding: '100px 24px', background: '#F8F5F0' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <p className="reveal" style={sectionTag}>Inspired by the masters</p>
          <h2 className="reveal" style={{
            fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700,
            color: '#2C2A26', lineHeight: 1.3, marginBottom: 12, textAlign: 'center',
          }}>
            Nine Impressionist styles,<br />one emotional canvas
          </h2>
          <p className="reveal" style={{
            fontSize: 16, color: '#7A756B', lineHeight: 1.7, textAlign: 'center',
            maxWidth: 600, margin: '0 auto 48px',
          }}>
            After your session, choose any of these legendary painters
            to transform your emotions into a unique work of art in their style.
          </p>

          <div className="reveal" style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
          }}>
            {ARTISTS.map(a => (
              <ArtistCard key={a.name} artist={a} />
            ))}
          </div>

          <div className="reveal" style={{ textAlign: 'center', marginTop: 40 }}>
            <Link to="/visual" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#2C2A26', color: '#FDFBF8',
              padding: '14px 32px', borderRadius: 50, fontSize: 14, fontWeight: 600,
              textDecoration: 'none', boxShadow: '0 4px 20px rgba(44,42,38,0.15)',
            }}>
              Start a session &amp; create yours
            </Link>
          </div>
        </div>
      </section>

      {/* ── Emotion tracking ──────────────────────────────────────────────── */}
      <section style={{ padding: '100px 24px 120px', background: '#2C2A26' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p className="reveal" style={{ ...sectionTag, color: '#C4946A' }}>Real-time tracking</p>
          <h2 className="reveal" style={{
            fontFamily: "'Playfair Display', serif", fontSize: 38, fontWeight: 700,
            color: '#F5F0E8', lineHeight: 1.3, marginBottom: 20,
          }}>
            Understand yourself in a way<br />you never have before
          </h2>
          <p className="reveal" style={{
            fontSize: 16, color: '#A8A08E', lineHeight: 1.8, maxWidth: 600,
            margin: '0 auto 56px',
          }}>
            Most of us go through life unaware of the emotions playing across our faces.
            EmotionsAI gives you a mirror — not just for what you look like,
            but for what you feel.
          </p>

          <div className="reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {[
              { icon: '📷', title: 'Face Tracking', desc: '68 landmarks, 7 emotions, FACS coding' },
              { icon: '🎤', title: 'Voice Analysis', desc: 'Pitch, energy, spectral features' },
              { icon: '📊', title: 'Live Timeline', desc: 'Valence, arousal, stress in real-time' },
              { icon: '🎨', title: 'Art Export', desc: 'PDF with your emotional fingerprint' },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{
                background: '#3A3835', borderRadius: 16, padding: '28px 20px',
                border: '1px solid #4A4744', textAlign: 'center',
                transition: 'transform 0.3s, border-color 0.3s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.borderColor = '#C4946A'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.borderColor = '#4A4744'; }}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#F5F0E8', marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: 12, color: '#8A857B', lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Learn about your emotions ─────────────────────────────────────── */}
      <section style={{ padding: '120px 24px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <p className="reveal" style={sectionTag}>Learn</p>
          <h2 className="reveal" style={{
            fontFamily: "'Playfair Display', serif", fontSize: 38, fontWeight: 700,
            color: '#2C2A26', lineHeight: 1.3,
          }}>
            Every emotion has a purpose
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {[
            { emotion: 'Joy', color: '#E8B931', text: 'Joy isn\'t just a smile — it\'s the raised cheeks (AU6), the crow\'s feet around your eyes, the genuine Duchenne smile that can\'t be faked. It signals safety, connection, and well-being.', aus: 'AU6 + AU12' },
            { emotion: 'Sadness', color: '#6B8DAE', text: 'The inner corners of your eyebrows rise (AU1), your lip corners pull down. Sadness signals a need for support and reflection. It\'s not weakness — it\'s your emotional system asking for care.', aus: 'AU1 + AU4 + AU15' },
            { emotion: 'Anger', color: '#C4614E', text: 'Brows lower, lids tighten, lips compress. Anger signals that a boundary has been crossed. Understanding it helps you respond instead of react.', aus: 'AU4 + AU5 + AU7 + AU23' },
            { emotion: 'Fear', color: '#8B6BAE', text: 'Wide eyes, raised brows, tense mouth. Fear is your protective system alerting you to potential threats. Recognizing it is the first step to working with it.', aus: 'AU1 + AU2 + AU20' },
            { emotion: 'Surprise', color: '#4EA88B', text: 'Eyebrows shoot up, eyes widen, jaw drops. Surprise is your brain encountering the unexpected — a reset moment that sharpens attention and opens you to new information.', aus: 'AU1 + AU2 + AU5 + AU27' },
          ].map(({ emotion, color, text, aus }, i) => (
            <div key={emotion} className={i % 2 === 0 ? 'reveal-left' : 'reveal-right'}
              style={{
                display: 'grid', gridTemplateColumns: i % 2 === 0 ? '80px 1fr' : '1fr 80px',
                gap: 32, alignItems: 'center', padding: '32px 0',
                borderBottom: '1px solid #E8E4DD',
              }}>
              {i % 2 === 0 && <EmotionOrb color={color} />}
              <div>
                <h3 style={{
                  fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700,
                  color: '#2C2A26', marginBottom: 8,
                }}>
                  {emotion} <span style={{ fontSize: 13, fontWeight: 400, color: '#B0A99E', fontFamily: "'Inter'" }}>{aus}</span>
                </h3>
                <p style={{ fontSize: 15, color: '#5A5650', lineHeight: 1.8 }}>{text}</p>
              </div>
              {i % 2 !== 0 && <EmotionOrb color={color} />}
            </div>
          ))}
        </div>
      </section>

      {/* ── Privacy + Science ─────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: '#F8F5F0' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <p className="reveal" style={sectionTag}>Built on science. Built on trust.</p>
          <p className="reveal" style={{
            fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 400,
            fontStyle: 'italic', color: '#3D3A35', lineHeight: 1.7, marginTop: 20,
          }}>
            Everything runs locally in your browser. No video is transmitted.
            No data is stored. Your emotions are yours alone.
          </p>
          <p className="reveal" style={{ fontSize: 13, color: '#B0A99E', marginTop: 20, lineHeight: 1.6 }}>
            Ekman & Friesen (1978) FACS &middot; Russell (1980) Circumplex Model &middot;
            Scherer (2003) Vocal Communication &middot; Balban et al. (2023) Physiological Sigh &middot;
            Kabat-Zinn (1990) MBSR
          </p>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section style={{
        padding: '120px 24px', textAlign: 'center',
        background: 'linear-gradient(180deg, #FDFBF8 0%, #F5F0E8 100%)',
      }}>
        <div className="reveal" style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: 700, color: '#2C2A26', lineHeight: 1.2, marginBottom: 20,
          }}>
            Ready to see<br />what you feel?
          </h2>
          <p style={{ fontSize: 16, color: '#7A756B', lineHeight: 1.7, marginBottom: 36 }}>
            Start a session. Watch the art unfold. Download your emotional fingerprint.
            It takes less than a minute.
          </p>
          <Link to="/visual" onClick={start} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#2C2A26', color: '#FDFBF8',
            padding: '18px 44px', borderRadius: 50, fontSize: 16, fontWeight: 600,
            textDecoration: 'none', letterSpacing: 0.3,
            boxShadow: '0 8px 32px rgba(44,42,38,0.18)',
          }}>
            Start session &rarr;
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer style={{
        padding: '32px 24px', textAlign: 'center',
        borderTop: '1px solid #E8E4DD',
      }}>
        <p style={{ fontSize: 12, color: '#B0A99E' }}>
          EmotionsAI &middot; An observational wellness tool, not a diagnostic instrument &middot;
          All processing runs locally in your browser
        </p>
      </footer>
    </div>
  );
}

function EmotionOrb({ color }: { color: string }) {
  return (
    <div style={{
      width: 64, height: 64, borderRadius: '50%',
      background: `radial-gradient(circle at 35% 35%, ${color}60, ${color}20)`,
      border: `1px solid ${color}40`,
      animation: 'float 5s ease-in-out infinite',
      flexShrink: 0,
    }} />
  );
}

function HeroArtDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    const { canvas: art } = generateEmotionArt(makeDemoFrames(), canvas.width, canvas.height);
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.drawImage(art, 0, 0);
  }, []);

  return (
    <div style={{
      borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(44,42,38,0.12)',
      border: '1px solid #E8E4DD',
    }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: 360, display: 'block' }} />
    </div>
  );
}

function ArtistCard({ artist }: { artist: import('../utils/emotionArt').ArtistStyle }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = 320;
    c.height = 200;
    const { canvas: art } = generateEmotionArt(makeDemoFrames(), 320, 200, artist);
    const ctx = c.getContext('2d');
    if (ctx) ctx.drawImage(art, 0, 0);
  }, [artist]);

  return (
    <div style={{
      background: '#FDFBF8', borderRadius: 14, overflow: 'hidden',
      border: '1px solid #E8E4DD', transition: 'box-shadow 0.3s',
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 28px rgba(44,42,38,0.10)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: 140, display: 'block' }} />
      <div style={{ padding: '12px 16px' }}>
        <div style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 15, fontWeight: 700, color: '#2C2A26', marginBottom: 4,
        }}>
          {artist.fullName}
        </div>
        <div style={{ fontSize: 11, color: '#A8A08E', lineHeight: 1.5 }}>
          {artist.prompt}
        </div>
      </div>
    </div>
  );
}

const sectionTag: React.CSSProperties = {
  fontFamily: "'Inter'", fontSize: 12, fontWeight: 600, letterSpacing: 2.5,
  textTransform: 'uppercase', color: '#C4946A', marginBottom: 12,
};

const sectionTitle: React.CSSProperties = {
  fontFamily: "'Playfair Display', serif", fontSize: 38, fontWeight: 700,
  color: '#2C2A26', lineHeight: 1.3,
};
