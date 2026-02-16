/**
 * Vite plugin that replaces import.meta.glob calls in component
 * registration files with pre-resolved absolute paths.
 *
 * This is necessary because import.meta.glob with aliases (@/, ~/)
 * won't scan inside node_modules when the package is installed
 * as a dependency.
 */
import { resolve } from 'node:path'
import { globSync } from 'glob'

const GLOBAL_PATTERNS = [
  'src/components/**/*.global.vue',
  'src/modules/**/components/**/*.global.vue'
]

const CLIENT_PATTERNS = [
  'src/components/**/*.client.vue',
  'src/modules/**/components/**/*.client.vue'
]

const USER_GLOBAL_PATTERNS = [
  'components/**/*.global.vue',
  'modules/**/components/**/*.global.vue'
]

const USER_CLIENT_PATTERNS = [
  'components/**/*.client.vue',
  'modules/**/components/**/*.client.vue'
]

function findComponents(baseDir, patterns) {
  const files = []

  for (const pattern of patterns) {
    const matches = globSync(pattern, { cwd: baseDir })
    files.push(...matches.map((f) => resolve(baseDir, f)))
  }

  return files
}

function buildGlobObject(files) {
  return (
    '{\n' +
    files
      .map((f) => `  '${f}': () => import('${f}')`)
      .join(',\n') +
    '\n}'
  )
}

export function componentRegistrationPlugin({ packageRoot, projectRoot }) {
  return {
    name: 'taxonpages:component-registration',
    enforce: 'pre',
    transform(code, id) {
      if (
        !id.includes('globalComponents') &&
        !id.includes('clientComponents')
      ) {
        return
      }

      if (!code.includes('import.meta.glob')) return

      const isGlobal = id.includes('globalComponents')
      const pkgPatterns = isGlobal ? GLOBAL_PATTERNS : CLIENT_PATTERNS
      const userPatterns = isGlobal ? USER_GLOBAL_PATTERNS : USER_CLIENT_PATTERNS

      const pkgFiles = findComponents(packageRoot, pkgPatterns)
      const userFiles = findComponents(projectRoot, userPatterns)
      const allFiles = [...pkgFiles, ...userFiles]

      const globObject = buildGlobObject(allFiles)

      const transformed = code.replace(
        /import\.meta\.glob\(\s*\[[\s\S]*?\]\s*,\s*\{[\s\S]*?\}\s*\)/,
        globObject
      )

      if (transformed === code) return

      return { code: transformed, map: null }
    }
  }
}
