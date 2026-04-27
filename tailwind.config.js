/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Inter Display"', '"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'ui-monospace', 'monospace']
      },
      colors: {
        ink: {
          50: '#f4f6fb',
          100: '#e6eaf6',
          200: '#c7cee3',
          300: '#9aa5c5',
          400: '#6c7aa5',
          500: '#4d5a85',
          600: '#3a4569',
          700: '#2c3553',
          800: '#1c2238',
          900: '#0f1325',
          950: '#070a18'
        },
        accent: {
          DEFAULT: '#7c5cff',
          soft: '#b9a6ff',
          glow: '#9d80ff'
        },
        cyan2: '#5ce0ff',
        mint: '#5cffb4'
      },
      boxShadow: {
        glow: '0 0 40px -10px rgba(124, 92, 255, 0.55)',
        card: '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 32px -12px rgba(0,0,0,0.6)'
      },
      backgroundImage: {
        'aurora':
          'radial-gradient(at 0% 0%, rgba(124,92,255,0.18) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(92,224,255,0.10) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(92,255,180,0.06) 0px, transparent 50%)',
        'glass':
          'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)'
      },
      animation: {
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
        'fade-in': 'fade-in 240ms ease-out both',
        'slide-up': 'slide-up 280ms ease-out both',
        shimmer: 'shimmer 2.6s linear infinite'
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' }
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      }
    }
  },
  plugins: []
};
