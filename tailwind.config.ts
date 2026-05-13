import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        atreides: {
          deep: '#050a14',
          night: '#0b1426',
          navy: '#142a4d',
          blue: '#1e3a8a',
          blueSoft: '#2c4d9e',
          silver: '#c0c8d6',
          silverMuted: '#8993a8',
          gold: '#d4a437',
          goldSoft: '#b8902a',
          goldGlow: 'rgba(212,164,55,0.35)',
        },
        faction: {
          atreides: '#56692D',
          harkonnen: '#212121',
          emperor: '#8C3932',
          fremen: '#C7993D',
          guild: '#BA5827',
          bg: '#47506E',
        },
        severity: {
          info: '#3b82f6',
          warning: '#d4a437',
          danger: '#dc2626',
          critical: '#7f1d1d',
        },
      },
      fontFamily: {
        display: ['"Orbitron"', 'system-ui', 'sans-serif'],
        serif: ['"Cinzel"', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        goldGlow: '0 0 12px rgba(212,164,55,0.35)',
        panel: '0 4px 24px rgba(0,0,0,0.4)',
        inset: 'inset 0 0 0 1px rgba(212,164,55,0.2)',
      },
      backgroundImage: {
        'starfield':
          'radial-gradient(ellipse at top, rgba(30,58,138,0.15), transparent 60%), radial-gradient(ellipse at bottom, rgba(212,164,55,0.08), transparent 60%)',
        'panel-gradient':
          'linear-gradient(180deg, rgba(20,42,77,0.6) 0%, rgba(11,20,38,0.85) 100%)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212,164,55,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(212,164,55,0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 3s linear infinite',
        pulseGold: 'pulseGold 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
