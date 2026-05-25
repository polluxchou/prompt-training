/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FFFCF7',
          100: '#FFF8EE',
          200: '#FBEFD9',
        },
        clay: {
          400: '#E8A87C',
          500: '#D97757',
          600: '#C46A4A',
          700: '#A0522D',
        },
        ember: {
          500: '#F2994A',
          600: '#E07B2F',
        },
        ink: {
          700: '#5C4A3A',
          800: '#3D2F22',
          900: '#26190F',
        },
      },
      fontFamily: {
        sans: ['"Inter"', '"PingFang SC"', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', '"Noto Serif SC"', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        warm: '0 10px 30px -10px rgba(217, 119, 87, 0.25)',
        soft: '0 4px 16px -4px rgba(92, 74, 58, 0.12)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'blink': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0 },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s ease-out',
        'slide-in-right': 'slide-in-right 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'blink': 'blink 1s steps(2) infinite',
      },
    },
  },
  plugins: [],
}
