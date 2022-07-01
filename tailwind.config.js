const colors = require('tailwindcss/colors')

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx,md}",
  ],

  darkMode: 'class',

  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif']
      },
      colors: {
        'primary': colors.sky,
        'secondary-2': colors.cyan,
        'secondary-3': colors.indigo,
        'secondary-4': colors.green,
        'secondary-5': colors.lime
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            '--tw-prose-links': theme('colors.primary[500]'),
          },
        },
        invert: {
          css: {
            '--tw-prose-links': theme('colors.primary[500]'),
          }
        }
      }),

      screens: {
        'print': {'raw': 'print'}
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
}
