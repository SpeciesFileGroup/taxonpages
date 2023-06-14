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
    './index.html',
    './vite.config.js',
    './src/**/*.{vue,js,ts,jsx,tsx,md}',
    './pages/**/*.{vue,md}',
    './config/*.yml'
  ],

  darkMode: 'class',

  theme: {
    extend: {
      fontFamily: {
        main: ['Roboto', 'sans-serif']
      },
      colors: {
        base: {
          background: withOpacity('--color-base-background'),
          border: withOpacity('--color-base-border'),
          content: withOpacity('--color-base-content'),
          foreground: withOpacity('--color-base-foreground'),
          lighter: withOpacity('--color-base-lighter'),
          muted: withOpacity('--color-base-muted'),
          soft: withOpacity('--color-base-soft')
        },

        map: {
          georeference: withOpacity('--color-map-georeference'),
          aggregate: withOpacity('--color-map-aggregate'),
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
        },

        danger: withOpacity('--color-danger'),
        success: withOpacity('--color-success'),
        warning: withOpacity('--color-warning')
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            '--tw-prose-links': theme('colors.secondary.color')
          }
        },
        invert: {
          css: {
            '--tw-prose-links': theme('colors.secondary.color')
          }
        }
      }),

      screens: {
        print: { raw: 'print' }
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
}
