const fs = require('fs')
const { 
  userTailwindConfigPath,
  defaultTailwindConfigPath
} = require('./src/constants/configPaths')

module.exports = {
  plugins: {
    tailwindcss: { 
      config: fs.existsSync(userTailwindConfigPath) 
      ? userTailwindConfigPath
      : defaultTailwindConfigPath
    },
    autoprefixer: {},
  },
}
