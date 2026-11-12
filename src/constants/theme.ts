export const Colors = {
  dark: {
    bg: '#0A0C10',
    card: '#131720',
    surface: '#171C28',
    surfaceLight: '#1F2636',
    border: '#232A3B',
    borderSubtle: '#19202E',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    textSubtle: '#64748B',
    primary: '#38BDF8', // Cyan / Sky
    primarySoft: 'rgba(56, 189, 248, 0.12)',
    secondary: '#818CF8', // Indigo
    secondarySoft: 'rgba(129, 140, 248, 0.12)',
    success: '#10B981', // Emerald
    successSoft: 'rgba(16, 185, 129, 0.12)',
    warning: '#F59E0B', // Amber
    warningSoft: 'rgba(245, 158, 11, 0.12)',
    danger: '#F43F5E', // Rose
    dangerSoft: 'rgba(244, 63, 94, 0.12)',
    accent: '#A855F7', // Purple
    accentSoft: 'rgba(168, 85, 247, 0.12)',
    navBg: '#0D1017',
    tabBarBorder: '#1A212E',
    statusBar: 'light-content' as const,
  },
  light: {
    bg: '#F8FAFC',
    card: '#FFFFFF',
    surface: '#F1F5F9',
    surfaceLight: '#E2E8F0',
    border: '#E2E8F0',
    borderSubtle: '#F1F5F9',
    text: '#0F172A',
    textMuted: '#475569',
    textSubtle: '#94A3B8',
    primary: '#0284C7',
    primarySoft: 'rgba(2, 132, 199, 0.10)',
    secondary: '#4F46E5',
    secondarySoft: 'rgba(79, 70, 229, 0.10)',
    success: '#059669',
    successSoft: 'rgba(5, 150, 105, 0.10)',
    warning: '#D97706',
    warningSoft: 'rgba(217, 119, 6, 0.10)',
    danger: '#E11D48',
    dangerSoft: 'rgba(225, 29, 72, 0.10)',
    accent: '#7C3AED',
    accentSoft: 'rgba(124, 58, 237, 0.10)',
    navBg: '#FFFFFF',
    tabBarBorder: '#E2E8F0',
    statusBar: 'dark-content' as const,
  }
};

export type ThemeColors = typeof Colors.dark;

export const Typography = {
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.6,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  h4: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  caption: {
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 0.2,
  },
  metric: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.8,
  },
  metricLarge: {
    fontSize: 44,
    fontWeight: '800' as const,
    letterSpacing: -1.2,
  }
};
