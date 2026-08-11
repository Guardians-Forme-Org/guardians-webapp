// Source of truth lives in globals.css CSS custom properties.
// These constants mirror those values for use in any JS/TS context that
// cannot consume CSS variables directly (e.g. third-party charting libs).
export const colors = {
  background: '#FFFFFF',
  surface: '#F7F7F7',
  border: '#EBEBEB',
  progressTrack: '#E6E6E6',
  textPrimary: '#1A1A1A',
  textSubheading: '#333333',
  textSecondary: '#999999',
  textMuted: '#767676',
  brandGreen: '#003518',
  accentYellow: '#FFCC00',
  accentBlue: '#0088FF',
} as const;
