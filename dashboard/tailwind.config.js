/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'glass-border': 'rgba(255,255,255,0.08)',
        'glass-bg': 'rgba(10,10,10,0.6)',
        'neon-yellow': '#facc15',
        'neon-cyan': '#22d3ee',
        'neon-red': '#ef4444',
        'neon-pink': '#f472b6',
      },
      backdropBlur: {
        'heavy': '24px',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
    },
  },
  plugins: [],
};
