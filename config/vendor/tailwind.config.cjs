const round = (num) =>
  num
    .toFixed(7)
    .replace(/(\.[0-9]+?)0+$/, '$1')
    .replace(/\.0$/, '')
const em = (px, base) => `${round(px / base)}em`

module.exports = {
  presets: [require(__tailwindCSSTaxonPagesConfigPath)],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            li: {
              marginTop: em(2, 14),
              marginBottom: em(2, 14)
            },

            h1: {
              marginBottom: em(28, 36)
            },

            h2: {
              marginTop: em(24, 24),
              marginBottom: em(24, 24)
            },

            h3: {
              marginTop: em(12, 20),
              marginBottom: em(12, 20)
            },

            h4: {
              marginTop: em(24, 16),
              marginBottom: em(8, 16)
            },

            p: {
              marginTop: em(8, 16),
              marginBottom: em(8, 16),
              lineHeight: 1.5
            },

            ul: {
              marginTop: 0
            }
          }
        }
      }
    }
  }
}
