module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx,md}",
  ],
  theme: {
    extend: {
      screens: {
        'print': {'raw': 'print'}
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
}
