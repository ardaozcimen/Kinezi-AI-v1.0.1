// Kinezi-AI Design System & Theme Constants
// Cyberpunk/Futuristic Theme with Neon accents

export const Colors = {
  // Background
  bgPrimary: '#0A0A0F',
  bgSecondary: '#12121A',
  bgTertiary: '#1A1A2E',
  bgCard: 'rgba(255, 255, 255, 0.04)',
  bgCardHover: 'rgba(255, 255, 255, 0.08)',
  bgGlass: 'rgba(255, 255, 255, 0.06)',
  bgGlassBorder: 'rgba(255, 255, 255, 0.1)',

  // Neon Colors
  neonCyan: '#00F5FF',
  neonCyanDim: 'rgba(0, 245, 255, 0.3)',
  neonCyanGlow: 'rgba(0, 245, 255, 0.15)',
  neonMagenta: '#FF00E5',
  neonMagentaDim: 'rgba(255, 0, 229, 0.3)',
  neonMagentaGlow: 'rgba(255, 0, 229, 0.15)',
  neonGreen: '#39FF14',
  neonGreenDim: 'rgba(57, 255, 20, 0.3)',
  neonRed: '#FF3131',
  neonRedDim: 'rgba(255, 49, 49, 0.3)',
  neonOrange: '#FF6B35',
  neonYellow: '#FFE500',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textTertiary: 'rgba(255, 255, 255, 0.4)',
  textMuted: 'rgba(255, 255, 255, 0.25)',

  // Skeleton Overlay
  skeletonCorrect: '#00F5FF',
  skeletonWarning: '#FFE500',
  skeletonDanger: '#FF3131',
  skeletonJoint: '#FFFFFF',

  // Gradients
  gradientCyan: ['#00F5FF', '#0080FF'] as const,
  gradientMagenta: ['#FF00E5', '#8B00FF'] as const,
  gradientSuccess: ['#39FF14', '#00F5FF'] as const,
  gradientDanger: ['#FF3131', '#FF6B35'] as const,
  gradientBg: ['#0A0A0F', '#12121A', '#1A1A2E'] as const,

  // Score colors
  scoreExcellent: '#39FF14',
  scoreGood: '#00F5FF',
  scoreFair: '#FFE500',
  scorePoor: '#FF6B35',
  scoreBad: '#FF3131',

  // Tab bar
  tabActive: '#00F5FF',
  tabInactive: 'rgba(255, 255, 255, 0.3)',
  tabBarBg: 'rgba(10, 10, 15, 0.95)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  massive: 64,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 999,
};

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  title: 34,
  hero: 48,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
};

export const Shadows = {
  neonCyan: {
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  neonMagenta: {
    shadowColor: '#FF00E5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  neonGreen: {
    shadowColor: '#39FF14',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
};
