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
    "./vite.config.js",
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
          muted: withOpacity('--color-base-muted'),
          border: withOpacity('--color-base-border'),
          content: withOpacity('--color-base-content')
        },

        map: {
          georeference: withOpacity('--color-map-georeference'),
          asserted: withOpacity('--color-map-asserted'),
          'type-material': withOpacity('--color-map-type-material'),
          'collection-object': withOpacity('--color-map-collection-object')
        },

        primary: {
          color: withOpacity('--color-primary'),
          content: withOpacity('--color-primary-content')
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
