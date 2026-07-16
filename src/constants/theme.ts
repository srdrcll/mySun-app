export const theme = {
  light: {
    colors: {
      primary: '#FF8A7A', // Warm peach
      primaryLight: '#FFEBE8',
      secondary: '#A78BFA', // Soft lavender
      secondaryLight: '#F0EDFE',
      success: '#8ED6B1', // Sage mint
      successLight: '#EBF9F1',
      warning: '#FBBF24', // Warm yellow
      warningLight: '#FEF8E6',
      info: '#60A5FA', // Soft blue
      infoLight: '#EEF6FF',
      danger: '#EF4444',
      dangerLight: '#FEF2F2',
      
      background: '#FCFBF7', // Cream warm white
      backgroundSecondary: '#F6F4ED',
      card: '#FFFFFF',
      text: '#2D2A26',
      textSecondary: '#706B63',
      border: '#EDEAE1',
      shadow: 'rgba(112, 107, 99, 0.08)',
    },
  },
  dark: {
    colors: {
      primary: '#FF9B8D',
      primaryLight: '#2D1A18',
      secondary: '#B5A1FC',
      secondaryLight: '#211A35',
      success: '#9EE0BE',
      successLight: '#16241D',
      warning: '#FCD34D',
      warningLight: '#2D2510',
      info: '#93C5FD',
      infoLight: '#162235',
      danger: '#F87171',
      dangerLight: '#3B1717',
      
      background: '#121110', // Dark warm charcoal
      backgroundSecondary: '#1C1A18',
      card: '#1E1C1A',
      text: '#F4F1EB',
      textSecondary: '#A39E96',
      border: '#2F2D2A',
      shadow: 'rgba(0, 0, 0, 0.4)',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 12,
    md: 20,
    lg: 28,
    round: 9999,
  },
  typography: {
    fontFamily: 'Outfit_400Regular',
    fontFamilyMedium: 'Outfit_500Medium',
    fontFamilyBold: 'Outfit_700Bold',
    fontFamilyHeading: 'Fredoka_600SemiBold',
    fontFamilyHeadingBold: 'Fredoka_700Bold',
    sizes: {
      caption: 11,
      bodySm: 13,
      body: 15,
      titleSm: 17,
      title: 20,
      header: 24,
      display: 32,
    },
    weights: {
      light: '300' as const,
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      heavy: '800' as const,
    },
  },
};

export type ThemeColors = typeof theme.light.colors;
export type Spacing = typeof theme.spacing;
export type BorderRadius = typeof theme.borderRadius;
export type Typography = typeof theme.typography;
