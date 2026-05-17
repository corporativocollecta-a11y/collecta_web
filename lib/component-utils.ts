/**
 * Component Utility Classes - Estandarización de componentes
 * Sistema de espaciado base: 8px (4 = 1rem, 8 = 2rem, etc.)
 */

// BOTONES
export const buttonClasses = {
  primary: 'px-6 py-3 rounded-lg font-semibold text-base transition-all duration-300 hover:shadow-lg active:scale-95 bg-brand-green text-dark-bg hover:opacity-90',
  primarySmall: 'px-5 py-2 rounded-lg font-semibold text-sm transition-all duration-300 bg-brand-green text-dark-bg hover:opacity-90',
  secondary: 'px-6 py-3 rounded-lg font-semibold text-base transition-all duration-300 border-2 border-brand-green text-brand-green hover:bg-brand-green hover:text-dark-bg',
  outline: 'px-6 py-3 rounded-lg font-semibold text-base transition-all duration-300 border-2 border-dark-text text-dark-text hover:border-brand-green hover:text-brand-green',
};

// CARDS
export const cardClasses = {
  base: 'rounded-xl border border-dark-border bg-white shadow-sm transition-all duration-300',
  hover: 'hover:shadow-lg hover:border-brand-green',
  dark: 'rounded-xl border border-dark-border bg-dark-bg-secondary shadow-sm transition-all duration-300',
  padding: 'p-6 sm:p-8',
};

// INPUTS
export const inputClasses = {
  base: 'w-full h-11 px-4 rounded-lg border border-light-border text-base placeholder:text-light-text-muted focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all duration-300',
  dark: 'w-full h-11 px-4 rounded-lg border border-dark-border bg-dark-bg-secondary text-dark-text text-base placeholder:text-dark-text-muted focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all duration-300',
};

// SELECTS / DROPDOWNS
export const selectClasses = {
  base: 'w-full h-11 px-4 rounded-lg border border-light-border text-base bg-white focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all duration-300 cursor-pointer appearance-none',
  dark: 'w-full h-11 px-4 rounded-lg border border-dark-border bg-dark-bg-secondary text-dark-text text-base focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all duration-300 cursor-pointer appearance-none',
};

// TEXTOS
export const textClasses = {
  // Títulos
  h1: 'text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight',
  h2: 'text-4xl sm:text-5xl font-bold leading-tight',
  h3: 'text-3xl sm:text-4xl font-bold leading-snug',
  h4: 'text-2xl sm:text-3xl font-bold leading-snug',
  h5: 'text-xl sm:text-2xl font-semibold leading-normal',
  h6: 'text-lg sm:text-xl font-semibold leading-normal',
  // Body
  body: 'text-base leading-relaxed',
  bodySm: 'text-sm leading-relaxed',
  // Meta / Small
  meta: 'text-xs sm:text-sm leading-relaxed uppercase tracking-wide',
};

// ESPACIADO SECCIONES
export const sectionClasses = {
  container: 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8',
  spacingLg: 'py-16 sm:py-24 lg:py-32',
  spacingMd: 'py-12 sm:py-16 lg:py-20',
  spacingSm: 'py-8 sm:py-12 lg:py-16',
};

// LINKS
export const linkClasses = {
  base: 'text-brand-green underline hover:opacity-80 transition-opacity duration-300',
  nav: 'text-sm tracking-wide transition-colors duration-300 hover:text-brand-green relative group',
};

// ICONOS CIRCULARES
export const circleClasses = {
  sm: 'w-12 h-12 rounded-full flex items-center justify-center',
  md: 'w-16 h-16 rounded-full flex items-center justify-center',
  lg: 'w-20 h-20 rounded-full flex items-center justify-center',
};
