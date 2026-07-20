/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'eucaly-green': '#2D5A27',
        'eucaly-accent': '#FFD700',
      },
      fontFamily: {
        'kids': ['"Comic Sans MS"', '"Chalkboard SE"', 'cursive'],
      },
    },
  },
  plugins: [],
}
