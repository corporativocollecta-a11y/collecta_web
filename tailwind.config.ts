import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors - Collecta
        brand: {
          green: '#00FF80',
          'green-secondary': '#2ECC71',
          'blue-dark': '#1E3A5F',
          'blue-light': '#4D9FFF',
          'blue-accent': '#0066CC',
        },
        // Dark Mode
        dark: {
          bg: '#1a1a1a',
          'bg-secondary': '#0f1612',
          'text': '#ffffff',
          'text-secondary': '#cccccc',
          'text-muted': '#999999',
          'border': 'rgba(0, 255, 128, 0.2)',
        },
        // Light Mode
        light: {
          bg: '#ffffff',
          'bg-secondary': '#f5f5f5',
          'text': '#1a1a1a',
          'text-secondary': '#666666',
          'text-muted': '#999999',
          'border': 'rgba(0, 0, 0, 0.1)',
        },
        // Functional
        success: '#2ECC71',
        warning: '#E8A844',
        error: '#D84242',
      },
      fontFamily: {
        sans: [
          'var(--font-sans)',
          'Geist',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        serif: [
          'var(--font-sans)',
          'Geist',
          '-apple-system',
          'sans-serif',
        ],
        mono: ['"Source Code Pro"', 'Menlo', 'monospace'],
      },
      // ESCALA DE TIPOGRAFÍA ESTANDARIZADA
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0em' }],
        sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0em' }],
        base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '0em' }],
        lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '0em' }],
        xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '0em' }],
        '2xl': ['1.5rem', { lineHeight: '1.75rem', letterSpacing: '-0.02em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em' }],
        '5xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
        '6xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
        '7xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
      },
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0em',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
      },
      // ESCALA DE ESPACIADO CONSISTENTE (8px base)
      spacing: {
        0: '0',
        0.5: '0.125rem',
        1: '0.25rem',
        2: '0.5rem',
        3: '0.75rem',
        4: '1rem',
        5: '1.25rem',
        6: '1.5rem',
        8: '2rem',
        10: '2.5rem',
        12: '3rem',
        14: '3.5rem',
        16: '4rem',
        20: '5rem',
        24: '6rem',
        28: '7rem',
        32: '8rem',
        36: '9rem',
        40: '10rem',
        44: '11rem',
        48: '12rem',
        52: '13rem',
        56: '14rem',
        60: '15rem',
        64: '16rem',
        72: '18rem',
        80: '20rem',
        96: '24rem',
        // Extended spacing for sections
        '128': '32rem',
        '144': '36rem',
        '160': '40rem',
      },
      maxWidth: {
        '7xl': '80rem',
        '8xl': '88rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-in-out',
        'slide-up': 'slideUp 0.8s ease-out',
        'slide-down': 'slideDown 0.8s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(60px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-60px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
