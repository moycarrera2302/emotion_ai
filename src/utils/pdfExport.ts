import jsPDF from 'jspdf';
import type { Session, EmotionLabel } from '../types/emotions';
import { EMOTION_COLORS } from './colors';
import { generateEmotionArt } from './emotionArt';

const HEX_TO_RGB = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
};

export function exportSessionPDF(session: Session) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = pdf.internal.pageSize.getWidth();
  const MARGIN = 20;
  const CONTENT_W = W - MARGIN * 2;
  let y = MARGIN;

  const frames = session.frames;
  if (frames.length === 0) return;

  // ── Header ──────────────────────────────────────────────────────────────────
  pdf.setFillColor(250, 248, 245);
  pdf.rect(0, 0, W, 40, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(44, 42, 38);
  pdf.text('EmotionsAI', MARGIN, y + 10);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(122, 117, 107);
  pdf.text('Session Analysis Report', MARGIN, y + 17);

  pdf.setFontSize(9);
  const dateStr = new Date(session.startTime).toLocaleString();
  pdf.text(`Generated: ${new Date().toLocaleString()}`, W - MARGIN, y + 10, { align: 'right' });
  pdf.text(`Session: ${session.id.slice(0, 18)}...`, W - MARGIN, y + 17, { align: 'right' });
  pdf.text(`Started: ${dateStr}`, W - MARGIN, y + 24, { align: 'right' });
  y = 48;

  // ── Session Stats ───────────────────────────────────────────────────────────
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(44, 42, 38);
  pdf.text('Session Overview', MARGIN, y);
  y += 6;

  const duration = frames.length * 2;
  const mins = Math.floor(duration / 60);
  const secs = duration % 60;

  const avgValence = frames.reduce((s, f) => s + f.dimensional_model.valence, 0) / frames.length;
  const avgArousal = frames.reduce((s, f) => s + f.dimensional_model.arousal, 0) / frames.length;
  const avgStress = frames.reduce((s, f) => s + f.flags.stress_level, 0) / frames.length;

  // Stat boxes
  const stats = [
    { label: 'Duration', value: `${mins}m ${secs.toString().padStart(2, '0')}s` },
    { label: 'Frames', value: String(frames.length) },
    { label: 'Avg Valence', value: `${avgValence >= 0 ? '+' : ''}${avgValence.toFixed(2)}` },
    { label: 'Avg Arousal', value: `${avgArousal >= 0 ? '+' : ''}${avgArousal.toFixed(2)}` },
    { label: 'Avg Stress', value: `${Math.round(avgStress * 100)}%` },
  ];

  const boxW = CONTENT_W / stats.length - 2;
  stats.forEach((stat, i) => {
    const bx = MARGIN + i * (boxW + 2.5);
    pdf.setFillColor(245, 242, 237);
    pdf.roundedRect(bx, y, boxW, 16, 2, 2, 'F');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(120, 115, 107);
    pdf.text(stat.label, bx + boxW / 2, y + 5, { align: 'center' });
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(44, 42, 38);
    pdf.text(stat.value, bx + boxW / 2, y + 12, { align: 'center' });
  });
  y += 22;

  // ── Dominant Emotion + Distribution ────────────────────────────────────────
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(44, 42, 38);
  pdf.text('Emotion Distribution', MARGIN, y);
  y += 6;

  const avgDist: Record<string, number> = {};
  (Object.keys(frames[0].emotion_distribution) as EmotionLabel[]).forEach(e => {
    avgDist[e] = frames.reduce((s, f) => s + f.emotion_distribution[e], 0) / frames.length;
  });

  const sortedEmotions = (Object.entries(avgDist) as [EmotionLabel, number][]).sort((a, b) => b[1] - a[1]);

  sortedEmotions.forEach(([emotion, value]) => {
    const barW = CONTENT_W * 0.55;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(80, 76, 72);
    const label = emotion.charAt(0).toUpperCase() + emotion.slice(1);
    pdf.text(label, MARGIN, y + 4);

    const [r, g, b] = HEX_TO_RGB(EMOTION_COLORS[emotion]);
    pdf.setFillColor(r, g, b);
    pdf.roundedRect(MARGIN + 28, y, barW * value, 5, 1, 1, 'F');

    pdf.setFillColor(232, 228, 221);
    pdf.roundedRect(MARGIN + 28 + barW * value, y, barW * (1 - value), 5, 1, 1, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(44, 42, 38);
    pdf.text(`${Math.round(value * 100)}%`, MARGIN + 28 + barW + 3, y + 4);
    y += 8;
  });
  y += 4;

  // ── Timeline ────────────────────────────────────────────────────────────────
  if (y > 200) { pdf.addPage(); y = MARGIN; }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(44, 42, 38);
  pdf.text('Emotional Timeline', MARGIN, y);
  y += 6;

  const CHART_H = 35;
  const CHART_W = CONTENT_W;

  // Draw valence and stress lines
  const LINE_SERIES: Array<{ key: 'valence' | 'stress'; label: string; color: string }> = [
    { key: 'valence', label: 'Valence', color: '#6BAE7A' },
    { key: 'stress', label: 'Stress', color: '#C4614E' },
  ];

  // Background
  pdf.setFillColor(245, 242, 237);
  pdf.roundedRect(MARGIN, y, CHART_W, CHART_H, 2, 2, 'F');

  const midY = y + CHART_H / 2;
  pdf.setDrawColor(208, 200, 192);
  pdf.setLineWidth(0.2);
  pdf.line(MARGIN, midY, MARGIN + CHART_W, midY);

  LINE_SERIES.forEach(({ key, color }) => {
    const [r, g, b] = HEX_TO_RGB(color);
    pdf.setDrawColor(r, g, b);
    pdf.setLineWidth(0.8);

    const vals = frames.map(f =>
      key === 'valence' ? f.dimensional_model.valence : f.flags.stress_level,
    );

    for (let i = 1; i < vals.length; i++) {
      const x1 = MARGIN + ((i - 1) / (vals.length - 1)) * CHART_W;
      const x2 = MARGIN + (i / (vals.length - 1)) * CHART_W;
      const normalize = key === 'valence' ? (v: number) => (v + 1) / 2 : (v: number) => v;
      const y1 = y + CHART_H - normalize(vals[i - 1]) * CHART_H;
      const y2 = y + CHART_H - normalize(vals[i]) * CHART_H;
      pdf.line(x1, y1, x2, y2);
    }
  });

  // Legend
  LINE_SERIES.forEach(({ label, color }, i) => {
    const [r, g, b] = HEX_TO_RGB(color);
    pdf.setFillColor(r, g, b);
    pdf.rect(MARGIN + i * 30, y + CHART_H + 3, 6, 2, 'F');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 95, 90);
    pdf.text(label, MARGIN + i * 30 + 8, y + CHART_H + 5);
  });
  y += CHART_H + 12;

  // ── Peak Moments ────────────────────────────────────────────────────────────
  const peaks = frames.filter(f => f.confidence > 0.8);
  if (peaks.length > 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(44, 42, 38);
    pdf.text('Peak Moments', MARGIN, y);
    y += 6;

    peaks.slice(0, 6).forEach(f => {
      const time = new Date(f.timestamp).toLocaleTimeString();
      const [r, g, b] = HEX_TO_RGB(EMOTION_COLORS[f.dominant_emotion]);
      pdf.setFillColor(r, g, b);
      pdf.circle(MARGIN + 2, y + 2, 2, 'F');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(80, 76, 72);
      pdf.text(`${time} — ${f.dominant_emotion} (${Math.round(f.confidence * 100)}%)`, MARGIN + 7, y + 4);
      y += 7;
    });
    y += 4;
  }

  // ── Notes ───────────────────────────────────────────────────────────────────
  if (session.notes.length > 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(44, 42, 38);
    pdf.text('Session Notes', MARGIN, y);
    y += 6;
    session.notes.forEach(note => {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(80, 76, 72);
      pdf.text(`• ${note}`, MARGIN + 4, y);
      y += 6;
    });
  }

  // ── Emotion Art — Full Page Painting ──────────────────────────────────────
  pdf.addPage();
  const pageH = pdf.internal.pageSize.getHeight();

  // Title on the art page
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(14);
  pdf.setTextColor(168, 160, 142);
  pdf.text('Your Emotional Fingerprint', W / 2, 14, { align: 'center' });

  // Generate the art canvas
  const artWidth = 1200;
  const artHeight = 900;
  const { canvas: artCanvas, artist } = generateEmotionArt(frames, artWidth, artHeight);
  const artDataUrl = artCanvas.toDataURL('image/png');

  // Place art on page (full width with small margin)
  const artMargin = 10;
  const artPdfW = W - artMargin * 2;
  const artPdfH = (artHeight / artWidth) * artPdfW;
  pdf.addImage(artDataUrl, 'PNG', artMargin, 20, artPdfW, artPdfH);

  // Art legend
  const legendY = 20 + artPdfH + 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(160, 154, 145);
  pdf.text('Each color and flow pattern represents a different emotion detected during your session.', W / 2, legendY, { align: 'center' });
  pdf.text('Joy rises (gold) · Sadness falls (blue) · Anger bursts (red) · Fear scatters (violet) · Surprise radiates (teal)', W / 2, legendY + 5, { align: 'center' });
  pdf.text(`Inspired by the style of ${artist.fullName}`, W / 2, legendY + 10, { align: 'center' });

  // Footer on both pages
  [1, 2].forEach(pageNum => {
    pdf.setPage(pageNum);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(160, 154, 145);
    pdf.text('EmotionsAI · Observational wellness tool, not a diagnostic instrument · All data processed locally', W / 2, pageH - 8, { align: 'center' });
  });

  pdf.save(`emotions-session-${session.id.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
