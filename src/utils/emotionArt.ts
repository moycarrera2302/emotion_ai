/**
 * Generative Emotion Art Engine — Impressionist Masters Edition
 *
 * Each session is randomly assigned an Impressionist master whose style
 * defines how the emotion particles are rendered:
 *
 * Monet    — soft horizontal dabs, water-reflection layering, dissolved edges
 * Renoir   — warm luminous circles, overlapping glows, rosy palette shift
 * Degas    — diagonal pastel strokes, asymmetric composition, movement
 * Manet    — bold flat patches with sharp edges, high contrast
 * Pissarro — dense pointillist dots, earthy undertones, rural texture
 * Cézanne  — geometric rectangular patches, constructive planes
 * Morisot  — feathery translucent wisps, ethereal lightness
 * Van Gogh — thick swirling strokes following flow field, vivid saturation
 * Sisley   — atmospheric horizontal bands, sky-heavy, gentle luminosity
 */

import type { EmotionFrame, EmotionLabel } from '../types/emotions';

// ── Artist definitions ──────────────────────────────────────────────────────

export interface ArtistStyle {
  name: string;
  fullName: string;
  prompt: string; // describes the visual essence
  bgColors: [string, string];
  particleCount: number;
  steps: number;
  drawParticle: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, alpha: number, angle: number) => void;
  flowStrength: number;
  flowScale: number;
  damping: number;
  sizeMultiplier: number;
  paletteShift: (r: number, g: number, b: number) => [number, number, number];
}

export const ARTISTS: ArtistStyle[] = [
  {
    name: 'Monet',
    fullName: 'Claude Monet',
    prompt: 'Soft broken colour, dissolved edges, light dancing on water, layered horizontal dabs that blur into atmosphere',
    bgColors: ['#F5F0E8', '#E8E0D4'],
    particleCount: 2400,
    steps: 140,
    flowStrength: 0.3,
    flowScale: 0.003,
    damping: 0.97,
    sizeMultiplier: 1.4,
    paletteShift: (r, g, b) => [Math.min(255, r + 15), Math.min(255, g + 8), Math.min(255, b + 20)],
    drawParticle: (ctx, x, y, size, color, alpha) => {
      ctx.globalAlpha = alpha * 0.14;
      ctx.fillStyle = color;
      // Horizontal elongated dab
      ctx.beginPath();
      ctx.ellipse(x, y, size * 2.5, size * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Soft reflected echo below
      ctx.globalAlpha = alpha * 0.04;
      ctx.beginPath();
      ctx.ellipse(x + (Math.random() - 0.5) * 4, y + size * 3, size * 2, size * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    name: 'Renoir',
    fullName: 'Pierre-Auguste Renoir',
    prompt: 'Warm luminous skin tones, soft dappled light, rosy glowing circles that overlap like sunlight through leaves',
    bgColors: ['#FDF5ED', '#F5E8D8'],
    particleCount: 2000,
    steps: 120,
    flowStrength: 0.25,
    flowScale: 0.004,
    damping: 0.96,
    sizeMultiplier: 1.6,
    paletteShift: (r, g, b) => [Math.min(255, r + 25), g, Math.max(0, b - 10)], // warmer
    drawParticle: (ctx, x, y, size, color, alpha) => {
      ctx.globalAlpha = alpha * 0.1;
      // Warm glowing circle
      const grad = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, size * 2, 0, Math.PI * 2);
      ctx.fill();
      // Inner bright spot
      ctx.globalAlpha = alpha * 0.15;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    name: 'Degas',
    fullName: 'Edgar Degas',
    prompt: 'Dynamic diagonal movement, pastel chalk texture, asymmetric off-center composition, captured motion',
    bgColors: ['#F0EDE6', '#E6E0D6'],
    particleCount: 1800,
    steps: 110,
    flowStrength: 0.5,
    flowScale: 0.005,
    damping: 0.94,
    sizeMultiplier: 1.0,
    paletteShift: (r, g, b) => [r, Math.min(255, g + 10), Math.min(255, b + 15)], // cooler pastels
    drawParticle: (ctx, x, y, size, color, alpha, angle) => {
      ctx.globalAlpha = alpha * 0.18;
      ctx.strokeStyle = color;
      ctx.lineWidth = size * 0.5;
      ctx.lineCap = 'round';
      // Diagonal chalk stroke
      const len = size * 4;
      const diagAngle = angle + Math.PI * 0.25; // diagonal bias
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(diagAngle) * len, y - Math.sin(diagAngle) * len);
      ctx.lineTo(x + Math.cos(diagAngle) * len, y + Math.sin(diagAngle) * len);
      ctx.stroke();
    },
  },
  {
    name: 'Manet',
    fullName: 'Édouard Manet',
    prompt: 'Bold flat patches, striking contrast, decisive brushwork mixing sharp edges with loose spontaneous strokes',
    bgColors: ['#F2EDE5', '#E0D8CC'],
    particleCount: 1400,
    steps: 100,
    flowStrength: 0.2,
    flowScale: 0.003,
    damping: 0.95,
    sizeMultiplier: 2.0,
    paletteShift: (r, g, b) => [r, g, b], // pure, unshifted
    drawParticle: (ctx, x, y, size, color, alpha) => {
      // Bold flat rectangle patch
      ctx.globalAlpha = alpha * 0.2;
      ctx.fillStyle = color;
      const w = size * 3 + Math.random() * size * 2;
      const h = size * 1.5 + Math.random() * size;
      ctx.fillRect(x - w / 2, y - h / 2, w, h);
      // Occasional sharp edge accent
      if (Math.random() < 0.3) {
        ctx.globalAlpha = alpha * 0.35;
        ctx.fillRect(x, y, size * 0.8, size * 4);
      }
    },
  },
  {
    name: 'Pissarro',
    fullName: 'Camille Pissarro',
    prompt: 'Dense pointillist dots, earthy natural palette, rustic texture, thousands of tiny marks building form',
    bgColors: ['#F0EBE0', '#E5DDD0'],
    particleCount: 3500,
    steps: 100,
    flowStrength: 0.15,
    flowScale: 0.006,
    damping: 0.97,
    sizeMultiplier: 0.6,
    paletteShift: (r, g, b) => [Math.min(255, r + 10), Math.min(255, g + 15), Math.max(0, b - 5)], // earthy
    drawParticle: (ctx, x, y, size, color, alpha) => {
      ctx.globalAlpha = alpha * 0.25;
      ctx.fillStyle = color;
      // Dense small dot
      ctx.beginPath();
      ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
      ctx.fill();
      // Scatter companion dots
      if (Math.random() < 0.5) {
        ctx.globalAlpha = alpha * 0.12;
        ctx.beginPath();
        ctx.arc(x + (Math.random() - 0.5) * size * 4, y + (Math.random() - 0.5) * size * 4, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
  {
    name: 'Cézanne',
    fullName: 'Paul Cézanne',
    prompt: 'Geometric constructive planes, angled rectangular patches, building form through structured colour blocks',
    bgColors: ['#EDE8DF', '#DDD6CA'],
    particleCount: 1600,
    steps: 100,
    flowStrength: 0.2,
    flowScale: 0.004,
    damping: 0.95,
    sizeMultiplier: 1.8,
    paletteShift: (r, g, b) => [r, Math.min(255, g + 5), Math.min(255, b + 10)],
    drawParticle: (ctx, x, y, size, color, alpha, angle) => {
      ctx.globalAlpha = alpha * 0.16;
      ctx.fillStyle = color;
      // Rotated rectangular patch
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + Math.floor(angle / 0.5) * 0.5); // snap to grid-ish angles
      const w = size * 3;
      const h = size * 2;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.restore();
    },
  },
  {
    name: 'Morisot',
    fullName: 'Berthe Morisot',
    prompt: 'Feathery translucent wisps, delicate pastel transparency, ethereal lightness, intimate gentle strokes',
    bgColors: ['#FBF7F2', '#F2EDE5'],
    particleCount: 2200,
    steps: 130,
    flowStrength: 0.35,
    flowScale: 0.003,
    damping: 0.97,
    sizeMultiplier: 1.0,
    paletteShift: (r, g, b) => [Math.min(255, r + 20), Math.min(255, g + 15), Math.min(255, b + 25)], // lighter
    drawParticle: (ctx, x, y, size, color, alpha, angle) => {
      ctx.globalAlpha = alpha * 0.08; // very transparent
      ctx.strokeStyle = color;
      ctx.lineWidth = size * 0.3;
      ctx.lineCap = 'round';
      // Feathery wisp
      const len = size * 5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(
        x + Math.cos(angle) * len * 0.5 + (Math.random() - 0.5) * size * 3,
        y + Math.sin(angle) * len * 0.5 + (Math.random() - 0.5) * size * 3,
        x + Math.cos(angle) * len,
        y + Math.sin(angle) * len,
      );
      ctx.stroke();
      // Delicate glow
      ctx.globalAlpha = alpha * 0.04;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, size * 2, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    name: 'Van Gogh',
    fullName: 'Vincent van Gogh',
    prompt: 'Bold swirling impasto strokes following energy currents, vivid saturated colour, spiral turbulent movement',
    bgColors: ['#EDE5D8', '#D8CEBC'],
    particleCount: 2000,
    steps: 150,
    flowStrength: 0.7, // strong flow influence
    flowScale: 0.005,
    damping: 0.93,
    sizeMultiplier: 1.3,
    paletteShift: (r, g, b) => [Math.min(255, r + 20), Math.min(255, g + 10), b], // more vivid
    drawParticle: (ctx, x, y, size, color, alpha, angle) => {
      ctx.globalAlpha = alpha * 0.22;
      ctx.strokeStyle = color;
      ctx.lineWidth = size * 0.9;
      ctx.lineCap = 'round';
      // Thick swirling stroke following the flow
      const len = size * 4;
      const curve = Math.sin(x * 0.02 + y * 0.02) * size * 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(
        x + Math.cos(angle) * len * 0.3, y + Math.sin(angle) * len * 0.3 + curve,
        x + Math.cos(angle) * len * 0.7, y + Math.sin(angle) * len * 0.7 - curve,
        x + Math.cos(angle) * len, y + Math.sin(angle) * len,
      );
      ctx.stroke();
    },
  },
  {
    name: 'Sisley',
    fullName: 'Alfred Sisley',
    prompt: 'Atmospheric horizontal layers, sky-dominant composition, gentle river reflections, soft luminous haze',
    bgColors: ['#F0ECE5', '#E0D8CC'],
    particleCount: 2000,
    steps: 120,
    flowStrength: 0.2,
    flowScale: 0.003,
    damping: 0.97,
    sizeMultiplier: 1.2,
    paletteShift: (r, g, b) => [r, g, Math.min(255, b + 20)], // sky blue shift
    drawParticle: (ctx, x, y, size, color, alpha) => {
      ctx.globalAlpha = alpha * 0.1;
      ctx.fillStyle = color;
      // Wide horizontal atmospheric band
      ctx.beginPath();
      ctx.ellipse(x, y, size * 4, size * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Luminous haze layer
      ctx.globalAlpha = alpha * 0.03;
      ctx.beginPath();
      ctx.ellipse(x, y, size * 8, size * 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
    },
  },
];

// ── Emotion color palettes ──────────────────────────────────────────────────

const BASE_PALETTE: Record<EmotionLabel, string[]> = {
  joy:      ['#FFD700', '#FFA500', '#FF8C42', '#FFEB3B', '#FFC107'],
  sadness:  ['#4A7BA7', '#5B9BD5', '#3B6E8F', '#8AB4D6', '#2C5F7C'],
  anger:    ['#D32F2F', '#FF5252', '#B71C1C', '#FF8A80', '#C62828'],
  fear:     ['#7B1FA2', '#9C27B0', '#6A1B9A', '#CE93D8', '#4A148C'],
  surprise: ['#00897B', '#26A69A', '#00695C', '#80CBC4', '#004D40'],
  disgust:  ['#558B2F', '#7CB342', '#33691E', '#AED581', '#1B5E20'],
  neutral:  ['#D7CCC8', '#BCAAA4', '#A1887F', '#EFEBE9', '#8D6E63'],
};

function shiftColor(hex: string, shift: ArtistStyle['paletteShift']): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const [nr, ng, nb] = shift(r, g, b);
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}

// ── Noise ───────────────────────────────────────────────────────────────────

function pseudoNoise(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 43.28) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const n00 = pseudoNoise(ix, iy, seed), n10 = pseudoNoise(ix + 1, iy, seed);
  const n01 = pseudoNoise(ix, iy + 1, seed), n11 = pseudoNoise(ix + 1, iy + 1, seed);
  return (n00 * (1 - sx) + n10 * sx) * (1 - sy) + (n01 * (1 - sx) + n11 * sx) * sy;
}

// ── Particle ────────────────────────────────────────────────────────────────

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number;
  color: string; size: number; emotion: EmotionLabel;
}

function createParticle(w: number, h: number, emotion: EmotionLabel, intensity: number, artist: ArtistStyle): Particle {
  const rawColor = BASE_PALETTE[emotion][Math.floor(Math.random() * BASE_PALETTE[emotion].length)];
  const color = shiftColor(rawColor, artist.paletteShift);

  let x: number, y: number, vx: number, vy: number;
  switch (emotion) {
    case 'joy':
      x = w * 0.3 + Math.random() * w * 0.4; y = h * 0.6 + Math.random() * h * 0.3;
      vx = (Math.random() - 0.5) * 1.5; vy = -Math.random() * 2.0 * intensity;
      break;
    case 'sadness':
      x = Math.random() * w; y = Math.random() * h * 0.3;
      vx = (Math.random() - 0.5) * 0.5; vy = Math.random() * 1.5 * intensity;
      break;
    case 'anger':
      x = w * 0.5 + (Math.random() - 0.5) * w * 0.3; y = h * 0.5 + (Math.random() - 0.5) * h * 0.3;
      vx = (Math.random() - 0.5) * 4 * intensity; vy = (Math.random() - 0.5) * 4 * intensity;
      break;
    case 'fear':
      x = Math.random() * w; y = Math.random() * h;
      vx = (Math.random() - 0.5) * 3; vy = (Math.random() - 0.5) * 3;
      break;
    case 'surprise': {
      x = w * 0.5; y = h * 0.5;
      const a = Math.random() * Math.PI * 2, sp = 1.5 + Math.random() * 2.5 * intensity;
      vx = Math.cos(a) * sp; vy = Math.sin(a) * sp;
      break;
    }
    case 'disgust':
      x = Math.random() * w; y = h * 0.7 + Math.random() * h * 0.3;
      vx = (Math.random() - 0.5) * 1.2; vy = (Math.random() - 0.5) * 0.8;
      break;
    default:
      x = Math.random() * w; y = Math.random() * h;
      vx = (Math.random() - 0.5) * 0.3; vy = (Math.random() - 0.5) * 0.3;
  }

  return {
    x, y, vx, vy, life: 0,
    maxLife: 40 + Math.random() * 80,
    color,
    size: (1.5 + Math.random() * 4 * intensity) * artist.sizeMultiplier,
    emotion,
  };
}

// ── Public API ──────────────────────────────────────────────────────────────

export interface EmotionArtResult {
  canvas: HTMLCanvasElement;
  artist: ArtistStyle;
}

export function pickRandomArtist(): ArtistStyle {
  return ARTISTS[Math.floor(Math.random() * ARTISTS.length)];
}

export function generateEmotionArt(
  frames: EmotionFrame[],
  width: number,
  height: number,
  forceArtist?: ArtistStyle,
): EmotionArtResult {
  const artist = forceArtist ?? pickRandomArtist();

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Background with artist-specific colors
  const bgGrad = ctx.createRadialGradient(width * 0.5, height * 0.4, 0, width * 0.5, height * 0.5, width * 0.7);
  bgGrad.addColorStop(0, artist.bgColors[0]);
  bgGrad.addColorStop(1, artist.bgColors[1]);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  if (frames.length === 0) return { canvas, artist };

  // Aggregate emotion weights
  const weights: Record<EmotionLabel, number> = { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0, disgust: 0, neutral: 0 };
  frames.forEach(f => {
    (Object.keys(weights) as EmotionLabel[]).forEach(e => { weights[e] += f.emotion_distribution[e]; });
  });
  const total = frames.length;
  (Object.keys(weights) as EmotionLabel[]).forEach(e => { weights[e] /= total; });

  // Generate particles
  const particles: Particle[] = [];
  const seed = frames.length + frames[0].timestamp.charCodeAt(10);

  (Object.entries(weights) as [EmotionLabel, number][]).forEach(([emotion, weight]) => {
    if (weight < 0.02) return;
    const count = Math.round(artist.particleCount * weight);
    for (let i = 0; i < count; i++) {
      particles.push(createParticle(width, height, emotion, weight, artist));
    }
  });

  // Simulate
  for (let step = 0; step < artist.steps; step++) {
    for (const p of particles) {
      if (p.life >= p.maxLife) continue;
      p.life++;

      const noiseVal = smoothNoise(p.x * artist.flowScale, p.y * artist.flowScale, seed + step * 0.01);
      const fieldAngle = noiseVal * Math.PI * 4;

      p.vx += Math.cos(fieldAngle) * artist.flowStrength;
      p.vy += Math.sin(fieldAngle) * artist.flowStrength;
      p.vx *= artist.damping;
      p.vy *= artist.damping;
      p.x += p.vx;
      p.y += p.vy;

      const lifeRatio = p.life / p.maxLife;
      const alpha = Math.sin(lifeRatio * Math.PI);

      if (alpha < 0.01) continue;
      if (p.x < -30 || p.x > width + 30 || p.y < -30 || p.y > height + 30) continue;

      const radius = p.size * (1 + lifeRatio * 0.5);
      artist.drawParticle(ctx, p.x, p.y, radius, p.color, alpha, fieldAngle);
    }
  }

  ctx.globalAlpha = 1;

  // Timeline ribbon at bottom
  const ribbonY = height - 24;
  frames.forEach((f, i) => {
    const x = (i / frames.length) * width;
    const segW = Math.max(width / frames.length, 1);
    const rawColor = BASE_PALETTE[f.dominant_emotion][0];
    ctx.fillStyle = shiftColor(rawColor, artist.paletteShift);
    ctx.globalAlpha = 0.55;
    ctx.fillRect(x, ribbonY, segW + 0.5, 6);
  });
  ctx.globalAlpha = 1;

  return { canvas, artist };
}

/**
 * Render the art to an existing canvas element (for preview).
 * Returns the selected artist.
 */
export function renderEmotionArtToCanvas(
  targetCanvas: HTMLCanvasElement,
  frames: EmotionFrame[],
  forceArtist?: ArtistStyle,
): ArtistStyle {
  const { canvas: art, artist } = generateEmotionArt(frames, targetCanvas.width, targetCanvas.height, forceArtist);
  const ctx = targetCanvas.getContext('2d');
  if (ctx) ctx.drawImage(art, 0, 0);
  return artist;
}
