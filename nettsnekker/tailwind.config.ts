import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Granskog – hovedfargen
        gran: {
          50: '#EDF7F3',
          100: '#D3EDE3',
          200: '#A8DBC8',
          300: '#73C2A6',
          400: '#43A284',
          500: '#2A856B',
          600: '#1F6F5C',
          700: '#1A594A',
          800: '#16473C',
          900: '#123A31',
        },
        // Harpiks – brukes sparsomt, til priser og markeringer
        harpiks: {
          100: '#FFF1D2',
          200: '#FFE2A3',
          300: '#FAC968',
          400: '#F2B33D',
          500: '#D9951C',
          600: '#B07514',
        },
        ink: {
          50: '#F4F7F6',
          100: '#E7ECEA',
          200: '#CFD8D5',
          300: '#AAB7B3',
          400: '#7F8E89',
          500: '#61716C',
          600: '#4A5955',
          700: '#36433F',
          800: '#23302C',
          900: '#10201C',
        },
      },
      fontFamily: {
        sans: ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(16,32,28,0.04), 0 8px 24px -12px rgba(16,32,28,0.18)',
        lift: '0 2px 4px rgba(16,32,28,0.04), 0 24px 48px -24px rgba(31,111,92,0.4)',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
      },
      animation: { float: 'float 7s ease-in-out infinite' },
    },
  },
  plugins: [],
};

export default config;
