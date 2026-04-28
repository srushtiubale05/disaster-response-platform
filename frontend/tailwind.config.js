/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        urgent: '#EF4444',
        moderate: '#F59E0B',
        low: '#10B981',
      },
    },
  },
  plugins: [],
};
