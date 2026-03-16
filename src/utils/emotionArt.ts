/**
 * Generative Emotion Art Engine
 *
 * Inspired by:
 * - Plutchik's Wheel of Emotions (color mapping)
 * - Perlin-noise flow fields (organic movement)
 * - Watercolor / ink diffusion aesthetics
 *
 * Each emotion creates streams of particles that flow across the canvas.
 * Joy → warm rising streams,  Sadness → cool descending flows,
 * Anger → turbulent red bursts, Fear → scattered violet fragments,
 * Surprise → bright teal sparks, Neutral → soft sand drifts.
 * The result is a unique "emotional fingerprint" painting.
 */

import type { EmotionFrame, EmotionLabel } from '../types/emotions';

// ── Plutchik-inspired color palette ─────────────────────────────────────────
const EMOTION_PALETTE: Record<EmotionLabel, string[]> = {
  joy:      ['#FFD700', '#FFA500', '#FF8C42', '#FFEB3B', '#FFC107'],
  sadness:  ['#4A7BA7', '#5B9BD5', '#3B6E8F', '#8AB4D6', '#2C5F7C'],
  anger:    ['#D32F2F', '#FF5252', '#B71C1C', '#FF8A80', '#C62828'],
  fear:     ['#7B1FA2', '#9C27B0', '#6A1B9A', '#CE93D8', '#4A148C'],
  surprise: ['#00897B', '#26A69A', '#00695C', '#80CBC4', '#004D40'],
  disgust:  ['#558B2F', '#7CB342', '#33691E', '#AED581', '#1B5E20'],
  neutral:  ['#D7CCC8', '#BCAAA4', '#A1887F', '#EFEBE9', '#8D6E63'],
};

// ── Simplex-like noise (fast approximation) ─────────────────────────────────
function pseudoNoise(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 43.28) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const n00 = pseudoNoise(ix, iy, seed);
  const n10 = pseudoNoise(ix + 1, iy, seed);
  const n01 = pseudoNoise(ix, iy + 1, seed);
  const n11 = pseudoNoise(ix + 1, iy + 1, seed);
  return (n00 * (1 - sx) + n10 * sx) * (1 - sy) + (n01 * (1 - sx) + n11 * sx) * sy;
}

// ── Particle system ─────────────────────────────────────────────────────────
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  emotion: EmotionLabel;
}

function createParticle(w: number, h: number, emotion: EmotionLabel, intensity: number): Particle {
  const palette = EMOTION_PALETTE[emotion];
  const color = palette[Math.floor(Math.random() * palette.length)];

  // Each emotion has a different spawn pattern
  let x: number, y: number, vx: number, vy: number;
  switch (emotion) {
    case 'joy':
      x = w * 0.3 + Math.random() * w * 0.4;
      y = h * 0.6 + Math.random() * h * 0.3;
      vx = (Math.random() - 0.5) * 1.5;
      vy = -Math.random() * 2.0 * intensity; // rises up
      break;
    case 'sadness':
      x = Math.random() * w;
      y = Math.random() * h * 0.3;
      vx = (Math.random() - 0.5) * 0.5;
      vy = Math.random() * 1.5 * intensity; // falls down
      break;
    case 'anger':
      x = w * 0.5 + (Math.random() - 0.5) * w * 0.3;
      y = h * 0.5 + (Math.random() - 0.5) * h * 0.3;
      vx = (Math.random() - 0.5) * 4 * intensity; // explosive
      vy = (Math.random() - 0.5) * 4 * intensity;
      break;
    case 'fear':
      x = Math.random() * w;
      y = Math.random() * h;
      vx = (Math.random() - 0.5) * 3;
      vy = (Math.random() - 0.5) * 3;
      break;
    case 'surprise':
      x = w * 0.5;
      y = h * 0.5;
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2.5 * intensity;
      vx = Math.cos(angle) * speed; // radiates outward
      vy = Math.sin(angle) * speed;
      break;
    case 'disgust':
      x = Math.random() * w;
      y = h * 0.7 + Math.random() * h * 0.3;
      vx = (Math.random() - 0.5) * 1.2;
      vy = (Math.random() - 0.5) * 0.8;
      break;
    default: // neutral
      x = Math.random() * w;
      y = Math.random() * h;
      vx = (Math.random() - 0.5) * 0.3;
      vy = (Math.random() - 0.5) * 0.3;
  }

  return {
    x, y, vx, vy,
    life: 0,
    maxLife: 40 + Math.random() * 80,
    color,
    size: 1.5 + Math.random() * 4 * intensity,
    emotion,
  };
}

// ── Main art generator ──────────────────────────────────────────────────────
export function generateEmotionArt(
  frames: EmotionFrame[],
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Background: warm off-white with subtle gradient
  const bgGrad = ctx.createRadialGradient(width * 0.5, height * 0.4, 0, width * 0.5, height * 0.5, width * 0.7);
  bgGrad.addColorStop(0, '#FEFCF9');
  bgGrad.addColorStop(1, '#F5F0E8');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  if (frames.length === 0) return canvas;

  // Aggregate emotion weights across session
  const emotionWeights: Record<EmotionLabel, number> = { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0, disgust: 0, neutral: 0 };
  frames.forEach(f => {
    (Object.keys(emotionWeights) as EmotionLabel[]).forEach(e => {
      emotionWeights[e] += f.emotion_distribution[e];
    });
  });
  const total = frames.length;
  (Object.keys(emotionWeights) as EmotionLabel[]).forEach(e => { emotionWeights[e] /= total; });

  // Generate particles proportional to emotion weight
  const TOTAL_PARTICLES = 2000;
  const particles: Particle[] = [];
  const seed = frames[0].timestamp.length; // deterministic-ish seed

  (Object.entries(emotionWeights) as [EmotionLabel, number][]).forEach(([emotion, weight]) => {
    if (weight < 0.02) return;
    const count = Math.round(TOTAL_PARTICLES * weight);
    for (let i = 0; i < count; i++) {
      particles.push(createParticle(width, height, emotion, weight));
    }
  });

  // Simulate particles with flow-field influence
  const STEPS = 120;
  for (let step = 0; step < STEPS; step++) {
    for (const p of particles) {
      if (p.life >= p.maxLife) continue;
      p.life++;

      // Flow field influence (noise-based)
      const noiseScale = 0.004;
      const noiseVal = smoothNoise(p.x * noiseScale, p.y * noiseScale, seed + step * 0.01);
      const fieldAngle = noiseVal * Math.PI * 4;
      const fieldStrength = 0.4;

      p.vx += Math.cos(fieldAngle) * fieldStrength;
      p.vy += Math.sin(fieldAngle) * fieldStrength;

      // Damping
      p.vx *= 0.96;
      p.vy *= 0.96;

      p.x += p.vx;
      p.y += p.vy;

      // Fade over life
      const lifeRatio = p.life / p.maxLife;
      const alpha = Math.sin(lifeRatio * Math.PI) * 0.12; // peaks at midlife, very transparent

      if (alpha < 0.005) continue;
      if (p.x < -20 || p.x > width + 20 || p.y < -20 || p.y > height + 20) continue;

      // Draw as soft circle (watercolor-like)
      const radius = p.size * (1 + lifeRatio * 0.5);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Secondary glow layer
      ctx.globalAlpha = alpha * 0.3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1;

  // ── Add subtle timeline ribbon at the bottom ──────────────────────────────
  const ribbonY = height - 28;
  const ribbonH = 8;
  frames.forEach((f, i) => {
    const x = (i / frames.length) * width;
    const segW = Math.max(width / frames.length, 1);
    const color = EMOTION_PALETTE[f.dominant_emotion][0];
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(x, ribbonY, segW + 0.5, ribbonH);
  });
  ctx.globalAlpha = 1;

  // ── Label ─────────────────────────────────────────────────────────────────
  ctx.font = 'italic 11px Georgia, serif';
  ctx.fillStyle = '#A8A08E';
  ctx.textAlign = 'right';
  ctx.fillText('EmotionsAI — Emotional Fingerprint', width - 12, height - 6);

  return canvas;
}

/**
 * Render the art to an existing canvas element (for preview)
 */
export function renderEmotionArtToCanvas(
  targetCanvas: HTMLCanvasElement,
  frames: EmotionFrame[],
) {
  const art = generateEmotionArt(frames, targetCanvas.width, targetCanvas.height);
  const ctx = targetCanvas.getContext('2d');
  if (ctx) ctx.drawImage(art, 0, 0);
}
