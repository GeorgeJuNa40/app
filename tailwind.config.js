/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta "Zen Balance" — valores por defecto (white-label configurable en runtime)
        forest: {
          DEFAULT: '#2D5A4C', // Verde Bosque (Primario)
          light: '#3C7364',
          dark: '#1E3E33',
        },
        cream: {
          DEFAULT: '#F4F1EA', // Crema (Secundario)
          dark: '#E8E3D6',
        },
        ink: {
          DEFAULT: '#333333', // Gris Oscuro (Acento/Texto)
          soft: '#5C5C5C',
          faint: '#8A8A8A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        zen: '0 4px 24px -8px rgba(45, 90, 76, 0.15)',
      },
    },
  },
  plugins: [],
};
