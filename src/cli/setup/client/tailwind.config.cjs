const path = require('path')

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
    path.join(__dirname, '**/*.{vue,js,html}')
  ],

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
      }
    }
  }
}
