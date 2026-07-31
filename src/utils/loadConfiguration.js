import { glob } from 'glob'
import fs from 'fs'
import { join } from 'node:path'
import { loadYaml } from './loadYaml.js'
import defaultConfig from '../constants/defaultConfig.js'
import { toForwardSlash } from './paths.js'

export const loadConfiguration = (appPath) => {
  const isProd = process.env.NODE_ENV === 'production'
  const filePaths = glob.sync(toForwardSlash(join(appPath, 'config', '*.yml')))
  const configurationPaths = splitFilePathsByEnv(filePaths)

  const jsonConfig = [
    ...configurationPaths.prod,
    ...(!isProd ? configurationPaths.dev : [])
  ].map((filepath) => {
    const content = fs.readFileSync(filepath, 'utf8')
    return loadYaml(content)
  })

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
