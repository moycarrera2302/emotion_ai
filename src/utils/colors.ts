import type { EmotionLabel } from '../types/emotions';

export const EMOTION_COLORS: Record<EmotionLabel, string> = {
  joy: '#E8B931',
  sadness: '#6B8DAE',
  anger: '#C4614E',
  fear: '#8B6BAE',
  surprise: '#4EA88B',
  disgust: '#7A8B5E',
  neutral: '#A8A08E',
};

export const THEME = {
  bg: '#FAF8F5',
  bgCard: '#FFFFFF',
  bgHover: '#F5F2ED',
  border: '#E8E4DD',
  borderLight: '#F0EDE8',
  text: '#2C2A26',
  textSecondary: '#7A756B',
  textMuted: '#B0A99E',
  accent: '#C4946A',
  accentLight: '#E8D5C0',
  positive: '#6BAE7A',
  negative: '#C4614E',
  shadow: '0 1px 3px rgba(44, 42, 38, 0.06)',
  shadowMd: '0 4px 12px rgba(44, 42, 38, 0.08)',
};
