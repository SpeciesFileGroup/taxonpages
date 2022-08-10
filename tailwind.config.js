function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${variableName}), ${opacityValue})`
    }
    return `rgb(var(${variableName}))`
  }
}

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx,md}",
    "./pages/*.{vue,md}",
    "./config/*.yml",
  ],

  darkMode: 'class',

  theme: {
    extend: {
      fontFamily: {
        main: ['-apple-system','BlinkMacSystemFont','San Francisco','Segoe UI','Roboto','Helvetica Neue','sans-serif']
      },
      colors: {
        base: {
          0: withOpacity('--color-base-0'),
          100: withOpacity('--color-base-100'),
          200: withOpacity('--color-base-200'),
          300: withOpacity('--color-base-300'),
          content: withOpacity('--color-base-content')
        },

        primary: {
          color: withOpacity('--color-primary'),
          content: withOpacity('--color-secondary-content')
        },

        secondary: {
          color: withOpacity('--color-secondary'),
          content: withOpacity('--color-secondary-content')
        }
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            '--tw-prose-links': theme('colors.secondary.color'),
          },
        },
        invert: {
          css: {
            '--tw-prose-links': theme('colors.secondary.color'),
          }
        }
      }),

      screens: {
        'print': { 'raw': 'print' }
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
}
