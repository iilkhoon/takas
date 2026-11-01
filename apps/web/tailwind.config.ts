import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: { DEFAULT: '1rem', sm: '1.5rem', lg: '2rem' }, screens: { '2xl': '1280px' } },
    extend: {
      colors: {
        ink: { DEFAULT: '#14121F', soft: '#4A4658', mute: '#8A8597' },
        cream: { DEFAULT: '#FFF8F1', deep: '#FBEEDF' },
        line: '#EDE4DA',
        nar: {
          50: '#FFF0F2', 100: '#FFDDE2', 200: '#FFB8C3', 300: '#FF8A9C', 400: '#F95A72',
          500: '#E8334A', 600: '#CF1F3A', 700: '#AD1530', 800: '#8C142C', 900: '#74142A',
        },
        xezer: {
          50: '#E6FAF8', 100: '#C3F2EE', 200: '#8BE5DE', 300: '#4DD2C9', 400: '#1FBAB1',
          500: '#0E9E97', 600: '#0A7F7B', 700: '#0C6563', 800: '#0F5150', 900: '#104342',
        },
        zefran: {
          50: '#FFF9E6', 100: '#FFF0BF', 200: '#FFE38A', 300: '#FFD24D', 400: '#FFC21F',
          500: '#FFB000', 600: '#DB8E00', 700: '#B06C00', 800: '#8F5507', 900: '#75450B',
        },
        lale: { 50: '#F3EEFF', 100: '#E5DBFF', 400: '#9775FA', 500: '#7C4DFF', 600: '#6741D9', 700: '#5233B5' },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: { '4xl': '2rem' },
      boxShadow: {
        card: '0 1px 2px rgba(20,18,31,.04), 0 8px 24px -12px rgba(20,18,31,.12)',
        lift: '0 2px 4px rgba(20,18,31,.05), 0 22px 40px -18px rgba(20,18,31,.28)',
        pop: '0 4px 0 0 #14121F',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        spinslow: { to: { transform: 'rotate(360deg)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        wiggle: { '0%,100%': { transform: 'rotate(-6deg)' }, '50%': { transform: 'rotate(6deg)' } },
      },
      animation: {
        float: 'float 5s ease-in-out infinite',
        'spin-slow': 'spinslow 14s linear infinite',
        shimmer: 'shimmer 1.6s infinite',
        marquee: 'marquee 40s linear infinite',
        wiggle: 'wiggle .6s ease-in-out',
      },
    },
  },
  plugins: [],
};
export default config;
