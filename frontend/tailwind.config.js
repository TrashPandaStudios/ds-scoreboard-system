/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        arena: {
          bg: '#080b11',
          surface: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          muted: '#64748b',
          glow: '#38bdf8',
        },
        team: {
          red: {
            DEFAULT: '#ef4444',
            dark: '#991b1b',
            light: '#f87171',
            glow: 'rgba(239, 68, 68, 0.45)',
          },
          blue: {
            DEFAULT: '#3b82f6',
            dark: '#1e40af',
            light: '#60a5fa',
            glow: 'rgba(59, 130, 246, 0.45)',
          },
          hazard: {
            amber: '#f59e0b',
            dark: '#b45309',
            light: '#fbbf24',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flash-buzzer': 'buzzerFlash 0.5s ease-in-out 3',
        'hazard-stripe': 'hazardScroll 2s linear infinite',
      },
      keyframes: {
        buzzerFlash: {
          '0%, 100%': { borderColor: 'rgba(239, 68, 68, 0)', boxShadow: '0 0 0px rgba(239, 68, 68, 0)' },
          '50%': { borderColor: '#ef4444', boxShadow: '0 0 60px #ef4444, inset 0 0 40px #ef4444' },
        },
        hazardScroll: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '40px 0' },
        }
      }
    },
  },
  plugins: [],
}
