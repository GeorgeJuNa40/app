/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta "Premium Zen Tech" — valores por defecto (white-label configurable en runtime).
        forest: {
          DEFAULT: '#4A5D55', // Verde Salvia Profundo (Primario)
          light: '#6E837A',
          dark: '#3A4A43',
        },
        // Acento menta/cian — energía y movimiento.
        mint: {
          DEFAULT: '#88B8B7',
          soft: '#B9D6D5',
          dark: '#5F9695',
        },
        cream: {
          light: '#FAF8F3', // fondo aún más limpio (zen)
          DEFAULT: '#F4F1EA', // Crema (Secundario)
          dark: '#E8E3D6',
        },
        ink: {
          DEFAULT: '#212121', // Carbón oscuro (texto/elementos críticos)
          soft: '#4A4A4A',
          faint: '#8A8A8A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        // Sombras muy suaves y difusas (nunca negras duras) para dar profundidad zen.
        soft: '0 2px 14px -6px rgba(33, 33, 33, 0.08)',
        card: '0 6px 26px -12px rgba(74, 93, 85, 0.16)',
        zen: '0 10px 34px -14px rgba(74, 93, 85, 0.22)',
        nav: '0 -4px 24px -12px rgba(33, 33, 33, 0.12)',
      },
    },
  },
  plugins: [],
};
