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
        main: ['Roboto','sans-serif']
      },
      colors: {
        base: {
          background: withOpacity('--color-base-background'),
          foreground: withOpacity('--color-base-foreground'),
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
