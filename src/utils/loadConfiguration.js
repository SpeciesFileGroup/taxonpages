import fs from 'fs'
import yaml from 'js-yaml'
import glob from 'glob'

export const loadConfiguration = appPath => {
  const filePaths = glob.sync(appPath + '/config/*.yml', {})
  const jsonConfig = filePaths.map(filepath => yaml.load(fs.readFileSync(filepath, 'utf8')))

  return Object.assign({}, ...jsonConfig)
}
