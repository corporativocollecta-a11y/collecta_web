export const typography = {
  // Font families
  fonts: {
    sans: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'sans-serif'
    ].join(','),
    serif: [
      'Playfair Display',
      'Georgia',
      'serif'
    ].join(','),
    mono: [
      '"Source Code Pro"',
      'Menlo',
      'monospace'
    ].join(','),
  },

  // Scale - tailwind compatible
  sizes: {
    xs: { size: '0.75rem', line: '1rem' },      // 12px
    sm: { size: '0.875rem', line: '1.25rem' },  // 14px
    base: { size: '1rem', line: '1.5rem' },     // 16px
    lg: { size: '1.125rem', line: '1.75rem' },  // 18px
    xl: { size: '1.25rem', line: '1.75rem' },   // 20px
    '2xl': { size: '1.5rem', line: '2rem' },    // 24px
    '3xl': { size: '1.875rem', line: '2.25rem' }, // 30px
    '4xl': { size: '2.25rem', line: '2.5rem' },   // 36px
    '5xl': { size: '3rem', line: '1' },           // 48px
    '6xl': { size: '3.75rem', line: '1' },        // 60px
    '7xl': { size: '4.5rem', line: '1' },         // 72px
  },

  // Weight
  weights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  // Line heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },

  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  }
} as const;

// Predefined text styles
export const textStyles = {
  h1: {
    fontSize: '4.5rem',
    fontWeight: 700,
    lineHeight: 1,
    letterSpacing: '-0.025em',
    fontFamily: 'serif',
  },
  h2: {
    fontSize: '3rem',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.025em',
    fontFamily: 'serif',
  },
  h3: {
    fontSize: '1.875rem',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.025em',
  },
  h4: {
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.5,
  },
  body: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  caption: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: '0.025em',
  },
} as const;
