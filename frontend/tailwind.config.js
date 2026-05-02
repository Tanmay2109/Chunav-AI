/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          800: '#1e3a5f',
          900: '#112240',
        },
        gold: {
          400: '#f6d365',
          500: '#f3b434',
        }
      }
    },
  },
  plugins: [],
}
