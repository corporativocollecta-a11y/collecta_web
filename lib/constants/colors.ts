export const colors = {
  // Primary - Grays
  primary: {
    dark: '#2A2A2A',      // Gris oscuro, autoridad
    DEFAULT: '#4A4A4A',   // Gris medio, depth
    light: '#6A6A6A',     // Gris claro
  },

  // Secondary - Terrosos/Agricultural
  secondary: {
    dark: '#6B5D52',      // Marrón oscuro
    DEFAULT: '#8B7D6B',   // Marrón terroso, agricultura
    light: '#A89E8D',     // Marrón claro
  },

  // Accent - Ocre/Sofisticación
  accent: {
    dark: '#B89450',      // Ocre oscuro
    DEFAULT: '#D4A76A',   // Ocre dorado, sofisticación
    light: '#E8C99E',     // Ocre claro
  },

  // Neutrals
  neutral: {
    white: '#FFFFFF',
    light: '#F5F2ED',     // Beige/hueso, limpieza
    lighter: '#FAF8F5',   // Casi blanco
    dark: '#1A1A1A',      // Muy oscuro, fondo hero
    black: '#000000',
  },

  // Functionals
  success: '#2D9B5C',
  warning: '#E8A844',
  error: '#D84242',

  // Backgrounds
  bg: {
    primary: '#FFFFFF',
    secondary: '#F5F2ED',
    dark: '#1A1A1A',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },

  // Borders
  border: {
    light: '#E0DDD6',
    DEFAULT: '#C8C3BA',
    dark: '#8B7D6B',
  }
} as const;

export type ColorKey = keyof typeof colors;
