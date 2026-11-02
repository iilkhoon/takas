import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: { DEFAULT: '1rem', sm: '1.5rem', lg: '2rem' }, screens: { '2xl': '1280px' } },
    extend: {
      colors: {
        // Neobrutalizm palitrası — parlaq, düz rənglər + qara konturlar
        ink: { DEFAULT: '#0B0B0F', soft: '#3B3B45', mute: '#6E6E7A' },
        cream: { DEFAULT: '#FFF7E8', deep: '#FFEBC7' },
        line: '#0B0B0F',
        // "Moruq" — əsas aksent (CTA, qiymətlər)
        nar: {
          50: '#FFF0F3', 100: '#FFD9E1', 200: '#FFB3C4', 300: '#FF85A1', 400: '#FF5C82',
          500: '#FF2E63', 600: '#E0154D', 700: '#B30D3C', 800: '#8A0B30', 900: '#660824',
        },
        // "Nanə" — uğur, istəklər
        xezer: {
          50: '#E9FFF5', 100: '#C6FBE3', 200: '#8EF4C8', 300: '#4FE7A8', 400: '#1FD68D',
          500: '#00BF78', 600: '#009A61', 700: '#00784C', 800: '#065E3E', 900: '#074C34',
        },
        // "Limon" — brend rəngi, VIP, bonuslar
        zefran: {
          50: '#FFFCE5', 100: '#FFF6B8', 200: '#FFEE85', 300: '#FFE54D', 400: '#FFDB1F',
          500: '#FFCC00', 600: '#D9A800', 700: '#A67F00', 800: '#7A5D00', 900: '#5C4600',
        },
        // "Göy" — Plus, mağazalar
        lale: { 50: '#EEF1FF', 100: '#D9E0FF', 400: '#6B83FF', 500: '#3D5AFE', 600: '#2A44D9', 700: '#1F33A8' },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      // Neobrutalizm: kiçik radiuslar
      borderRadius: { xl: '0.625rem', '2xl': '0.75rem', '3xl': '0.875rem', '4xl': '1.125rem' },
      boxShadow: {
        // Sərt (bulanıqlıqsız) kölgələr
        card: '4px 4px 0 0 #0B0B0F',
        lift: '7px 7px 0 0 #0B0B0F',
        pop: '5px 5px 0 0 #0B0B0F',
        sm: '2px 2px 0 0 #0B0B0F',
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
