/**
 * CHOLAN WEAR design tokens - the single source of truth for colour.
 * Components must use these semantic classes (bg-brand-black, text-gold, border-line ...)
 * and never hard-coded hex values.
 *
 * Gold #D2A24E is sampled from the official logo.
 * gold.deep is the same hue, darkened so gold TEXT stays readable (WCAG AA) on white.
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          black: '#000000',
          white: '#FFFFFF',
          gold: '#D2A24E',
        },
        gold: {
          DEFAULT: '#D2A24E',
          light: '#E6C27E',
          dark: '#B88A38',
          deep: '#8A6417', // gold text on white
          tint: '#F7EFDF', // very light gold wash for selected states
        },
        ink: {
          DEFAULT: '#0A0A0A', // primary text
          soft: '#3D3D3D', // body text
          muted: '#6E6E6E', // secondary text
        },
        surface: {
          DEFAULT: '#FFFFFF',
          alt: '#F6F6F5', // subtle section background
          dark: '#0A0A0A', // dark sections
          darker: '#141414', // cards on dark
        },
        line: {
          DEFAULT: '#E4E4E2', // borders on white
          dark: '#2A2A2A', // borders on black
        },
        danger: '#B3261E', // errors / destructive only
        success: '#1E9E5A', // order-created success state only
      },
      fontFamily: {
        display: ['Cinzel', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: { brand: '0.18em' },
      boxShadow: {
        lift: '0 18px 40px -18px rgba(0,0,0,.35)',
        gold: '0 0 0 1px #D2A24E',
      },
      keyframes: {
        fadeUp: { '0%': { opacity: 0, transform: 'translateY(14px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideRight: { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'translateX(0)' } },
        slideLeft: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(0)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        pulseGold: { '0%,100%': { opacity: 0.45 }, '50%': { opacity: 1 } },
        pop: { '0%': { transform: 'scale(0)' }, '60%': { transform: 'scale(1.12)' }, '80%': { transform: 'scale(.96)' }, '100%': { transform: 'scale(1)' } },
        confettiFall: {
          '0%': { opacity: 1, transform: 'translate3d(0,-10vh,0) rotate(0deg)' },
          '80%': { opacity: 1 },
          '100%': { opacity: 0, transform: 'translate3d(var(--drift),108vh,0) rotate(var(--spin))' },
        },
      },
      animation: {
        'fade-up': 'fadeUp .6s cubic-bezier(.2,.7,.2,1) both',
        'fade-in': 'fadeIn .3s ease both',
        'slide-right': 'slideRight .32s cubic-bezier(.2,.7,.2,1) both',
        'slide-left': 'slideLeft .32s cubic-bezier(.2,.7,.2,1) both',
        marquee: 'marquee 28s linear infinite',
        'pulse-gold': 'pulseGold 1.4s ease-in-out infinite',
        pop: 'pop .6s cubic-bezier(.3,1.3,.5,1) both',
        confetti: 'confettiFall var(--dur) cubic-bezier(.3,.2,.6,1) var(--delay) both',
      },
    },
  },
  plugins: [],
};
