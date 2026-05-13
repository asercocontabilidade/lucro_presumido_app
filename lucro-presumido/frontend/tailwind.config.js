/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          600: '#1e3a5f',
          700: '#1a3352',
          800: '#162b44',
          900: '#0f1e30',
        },
      },
    },
  },
  plugins: [],
};
