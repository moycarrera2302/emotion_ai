import type { EmotionLabel } from '../types/emotions';
import { EMOTION_COLORS, THEME } from '../utils/colors';

const EMOTION_ICONS: Record<EmotionLabel, string> = {
  joy: '\u{1F60A}',
  sadness: '\u{1F622}',
  anger: '\u{1F621}',
  fear: '\u{1F628}',
  surprise: '\u{1F632}',
  disgust: '\u{1F616}',
  neutral: '\u{1F610}',
};

interface Props {
  emotion: EmotionLabel;
  confidence: number;
  size?: 'sm' | 'lg';
}

export function EmotionBadge({ emotion, confidence, size = 'sm' }: Props) {
  const color = EMOTION_COLORS[emotion];
  const isLarge = size === 'lg';

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: isLarge ? 10 : 6,
      padding: isLarge ? '10px 18px' : '4px 10px',
      borderRadius: 20,
      background: `${color}18`,
      border: `1px solid ${color}40`,
      fontSize: isLarge ? 16 : 12,
      fontWeight: 600,
      color: THEME.text,
      transition: 'all 0.3s ease',
    }}>
      <span style={{ fontSize: isLarge ? 22 : 14 }}>{EMOTION_ICONS[emotion]}</span>
      <span style={{ textTransform: 'capitalize' }}>{emotion}</span>
      <span style={{ color: THEME.textSecondary, fontWeight: 400 }}>
        {Math.round(confidence * 100)}%
      </span>
    </div>
  );
}
