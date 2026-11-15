export const Gradients = {
  cyberViolet: ['#8B5CF6', '#6366F1', '#EC4899'] as const,
  sunsetBlaze: ['#FF512F', '#F09819', '#DD2476'] as const,
  oceanCyan: ['#06B6D4', '#3B82F6', '#1D4ED8'] as const,
  electricEmerald: ['#10B981', '#059669', '#047857'] as const,
  solarGold: ['#F59E0B', '#EF4444', '#DC2626'] as const,
  neonPurple: ['#A855F7', '#7C3AED', '#4F46E5'] as const,
  gamifiedPurple: ['#9333EA', '#7C3AED', '#4F46E5'] as const,
  gemActive: ['#C084FC', '#9333EA', '#6D28D9'] as const,
  gemStone: ['rgba(55, 45, 105, 0.85)', 'rgba(28, 23, 62, 0.92)'] as const,
  goldChest: ['#FBBF24', '#F59E0B', '#D97706'] as const,
  cardGlassDark: ['rgba(30, 24, 72, 0.88)', 'rgba(18, 14, 46, 0.96)'] as const,
  cardGlassLight: ['rgba(255, 255, 255, 0.95)', 'rgba(241, 245, 249, 0.90)'] as const,
  glareOverlay: ['rgba(255, 255, 255, 0.35)', 'rgba(255, 255, 255, 0.0)'] as const,
};

export const Colors = {
  dark: {
    bg: '#0E0B25', // Deep midnight cosmic purple (Image 2)
    card: '#1A153E',
    surface: '#221C52',
    surfaceLight: '#2C2466',
    border: 'rgba(168, 85, 247, 0.22)',
    borderSubtle: 'rgba(168, 85, 247, 0.10)',
    borderGlow: 'rgba(168, 85, 247, 0.55)',
    text: '#F8FAFC',
    textMuted: '#A5B4FC',
    textSubtle: '#818CF8',
    primary: '#8B5CF6', // Purple/Violet
    primarySoft: 'rgba(139, 92, 246, 0.18)',
    secondary: '#6366F1', // Indigo
    secondarySoft: 'rgba(99, 102, 241, 0.18)',
    success: '#10B981', // Emerald
    successSoft: 'rgba(16, 185, 129, 0.15)',
    warning: '#F59E0B', // Amber
    warningSoft: 'rgba(245, 158, 11, 0.15)',
    danger: '#F43F5E', // Rose
    dangerSoft: 'rgba(244, 63, 94, 0.15)',
    accent: '#A855F7', // Purple
    accentSoft: 'rgba(168, 85, 247, 0.18)',
    neonFlame: '#FF512F',
    neonCyan: '#06B6D4',
    neonEmerald: '#10B981',
    neonViolet: '#A855F7',
    neonGold: '#FBBF24',
    navBg: '#110D2C',
    tabBarBorder: 'rgba(168, 85, 247, 0.20)',
    statusBar: 'light-content' as const,
  },
  light: {
    bg: '#F8FAFC',
    card: '#FFFFFF',
    surface: '#F1F5F9',
    surfaceLight: '#E2E8F0',
    border: '#E2E8F0',
    borderSubtle: '#F1F5F9',
    borderGlow: 'rgba(99, 102, 241, 0.25)',
    text: '#0F172A',
    textMuted: '#475569',
    textSubtle: '#94A3B8',
    primary: '#0284C7',
    primarySoft: 'rgba(2, 132, 199, 0.12)',
    secondary: '#4F46E5',
    secondarySoft: 'rgba(79, 70, 229, 0.12)',
    success: '#059669',
    successSoft: 'rgba(5, 150, 105, 0.12)',
    warning: '#D97706',
    warningSoft: 'rgba(217, 119, 6, 0.12)',
    danger: '#E11D48',
    dangerSoft: 'rgba(225, 29, 72, 0.12)',
    accent: '#7C3AED',
    accentSoft: 'rgba(124, 58, 237, 0.12)',
    neonFlame: '#E11D48',
    neonCyan: '#0284C7',
    neonEmerald: '#059669',
    neonViolet: '#7C3AED',
    neonGold: '#D97706',
    navBg: '#FFFFFF',
    tabBarBorder: '#E2E8F0',
    statusBar: 'dark-content' as const,
  }
};

export type ThemeColors = typeof Colors.dark;

export const Typography = {
  h1: {
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: -0.6,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
  },
  h3: {
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodyBold: {
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 0.2,
  },
  captionBold: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  micro: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
  mono: {
    fontFamily: 'Courier',
    fontSize: 14,
    fontWeight: '600' as const,
  }
};

export const Shadows = {
  glowCyan: {
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  glowViolet: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  glowFlame: {
    shadowColor: '#FF512F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  glowEmerald: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  card3D: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.55,
    shadowRadius: 22,
    elevation: 12,
  }
};
