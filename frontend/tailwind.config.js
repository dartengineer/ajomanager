/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        bg: '#0D0D0D',
        surface: '#161616',
        surface2: '#1E1E1E',
        border: '#2A2A2A',
        gold: {
          DEFAULT: '#E8A838',
          light: '#F5C96A',
          muted: 'rgba(232,168,56,0.15)',
        },
        success: '#3DD68C',
        danger: '#FF5C5C',
        info: '#4D9EFF',
        muted: '#7A7670',
        text: '#F0EDE6',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulse_gold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(232,168,56,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(232,168,56,0)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.35s ease both',
        shimmer: 'shimmer 2s linear infinite',
        pulse_gold: 'pulse_gold 2s infinite',
      },
    },
  },
  plugins: [],
}
