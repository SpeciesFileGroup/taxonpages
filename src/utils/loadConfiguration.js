import fs from 'fs'
import yaml from 'js-yaml'
import glob from 'glob'
import defaultConfig from '../constants/defaultConfig'

export const loadConfiguration = (appPath) => {
  const isProd = process.env.NODE_ENV === 'production'
  const filePaths = glob.sync(appPath + '/config/*.yml')
  const configurationPaths = splitFilePathsByEnv(filePaths)

  const jsonConfig = [
    ...configurationPaths.prod,
    ...(!isProd ? configurationPaths.dev : [])
  ].map((filepath) => yaml.load(fs.readFileSync(filepath, 'utf8')))

  return Object.assign({}, defaultConfig, ...jsonConfig)
}

function splitFilePathsByEnv(filepaths) {
  const devExtension = '.development.yml'

  return filepaths.reduce(
    (acc, current) => {
      if (current.includes(devExtension)) {
        acc.dev.push(current)
      } else {
        acc.prod.push(current)
      }

      return acc
    },
    { dev: [], prod: [] }
  )
}
