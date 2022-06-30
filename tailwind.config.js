// https://colors.muz.li/palette/24AADB/198599/2c4bdb/24db44/199930
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx,md}",
  ],

  darkMode: 'class',

  theme: {
    extend: {
      colors: {
        'primary': { // Sky
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e'
        },
        'secondary-2': {
          50: '#ecfeff', //Cyan 
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63'
        },
        'secondary-3': { // Indigo
          50: '#eef2ff', 
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81'
        },
        'secondary-4': { // Green
          50: '#f0fdf4', 
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d'
        },
        'secondary-5': { // Lime
          50: '#f7fee7', 
          100: '#ecfccb',
          200: '#d9f99d',
          300: '#bef264',
          400: '#a3e635',
          500: '#84cc16',
          600: '#65a30d',
          700: '#4d7c0f',
          800: '#3f6212',
          900: '#365314'
        },
        'fonts': {
          50: '#24DBB1', //primary font
          100: '#C1BFC4', //secondary herader font
          200: '#858388', //secondary font
          400: '#7D7C80', //grayed out text
          600: '#727E87', //primary header font
          800: '#3E9AFC', //link blue
        },
        
      },
      screens: {
        'print': {'raw': 'print'}
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
}
