const fs = require('fs')
const {
  userTailwindConfigPath,
  defaultTailwindConfigPath
} = require('./src/constants/configPaths.cjs')

module.exports = {
  plugins: {
    'tailwindcss/nesting': {},
    tailwindcss: {
      config: fs.existsSync(userTailwindConfigPath)
        ? userTailwindConfigPath
        : defaultTailwindConfigPath
    },
    autoprefixer: {}
  }
}
