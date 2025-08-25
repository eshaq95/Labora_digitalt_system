/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Labora-like blue accent
        labora: {
          DEFAULT: '#2563eb', // blue-600
          light: '#3b82f6', // blue-500
          dark: '#1e40af', // blue-800
        },
        // Scandinavian light gray background
        background: {
          DEFAULT: '#f7f8fa',
        },
      },
      fontFamily: {
        // Clean, airy typography
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        // Softer corners
        lg: '0.75rem',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
