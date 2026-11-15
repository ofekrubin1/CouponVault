/** @type {import('tailwindcss').Config} */
// Palette and depth follow TripFlow: navy + gold on a soft grey canvas.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Heebo', 'sans-serif'],
      },
      colors: {
        navy: { DEFAULT: '#0A1F44', light: '#14306A' },
        gold: { DEFAULT: '#C9A45B', dark: '#B8943F', deep: '#8F6F2C' },
        ink: '#33363D',
        mute: '#50535A',
        line: '#D0D1D3',
        canvas: '#F3F3F4',
        soft: '#F8F8F9',
        danger: '#C0392B',
        ok: '#2E8B57',
      },
      boxShadow: {
        card: '0 2px 12px rgba(10,31,68,0.06), 0 1px 3px rgba(10,31,68,0.04), inset 0 1px 0 rgba(255,255,255,0.8)',
        inset: 'inset 0 2px 4px rgba(10,31,68,0.04), inset 0 0 2px rgba(10,31,68,0.02)',
        btn: '0 3px 10px rgba(10,31,68,0.2), 0 1px 3px rgba(10,31,68,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
        btn2: '0 2px 8px rgba(10,31,68,0.06), 0 1px 2px rgba(10,31,68,0.04), inset 0 1px 0 rgba(255,255,255,0.9)',
        goldbtn: '0 3px 10px rgba(201,164,91,0.25), 0 1px 3px rgba(201,164,91,0.15), inset 0 1px 0 rgba(255,255,255,0.15)',
        danger: '0 2px 8px rgba(192,57,43,0.08), 0 1px 2px rgba(192,57,43,0.04)',
        fab: '0 6px 20px rgba(10,31,68,0.35), 0 2px 6px rgba(10,31,68,0.2)',
        pop: '0 12px 32px rgba(10,31,68,0.18), 0 2px 8px rgba(10,31,68,0.10)',
        sheet: '0 -10px 40px rgba(10,31,68,0.16)',
        nav: '0 -2px 16px rgba(10,31,68,0.06), 0 -1px 4px rgba(10,31,68,0.04)',
        hero: '0 10px 30px rgba(10,31,68,0.28), 0 2px 8px rgba(10,31,68,0.16)',
      },
      keyframes: {
        'sheet-up': { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'pop-in': { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'toast-in': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '20%,60%': { transform: 'translateX(-5px)' },
          '40%,80%': { transform: 'translateX(5px)' },
        },
      },
      animation: {
        sheet: 'sheet-up 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
        fade: 'fade-in 0.2s ease-out',
        pop: 'pop-in 0.18s ease-out',
        toast: 'toast-in 0.2s ease-out',
        shake: 'shake 0.35s ease-in-out',
      },
    },
  },
  plugins: [],
};
