/**
 * Vite plugin that resolves import.meta.glob calls containing @/ or ~/
 * aliases into pre-resolved absolute paths.
 *
 * This is necessary because import.meta.glob with aliases pointing into
 * node_modules won't scan those directories. This plugin intercepts the
 * glob calls, performs the scanning with absolute paths, and replaces
 * the call with a pre-built object of lazy imports.
 */
import { resolve, dirname } from 'node:path'
import { globSync } from 'glob'

const STYLE_EXT = /\.(css|scss|sass|less|styl)$/

export function componentRegistrationPlugin({ packageRoot, projectRoot }) {
  const srcPath = resolve(packageRoot, 'src')

  return {
    name: 'taxonpages:resolve-glob-aliases',
    enforce: 'pre',
    transform(code, id) {
      if (!code.includes('import.meta.glob')) return

      let changed = false
      let prependImports = ''
      let varCounter = 0

      const globRegex =
        /import\.meta\.glob\(\s*(\[[\s\S]*?\]|['"][^'"]*['"])\s*(?:,\s*(\{[\s\S]*?\}))?\s*\)/g

      const transformed = code.replace(
        globRegex,
        (match, patternsStr, optionsStr) => {
          if (!patternsStr.includes('@/') && !patternsStr.includes('~/')) {
            return match
          }

          const patternMatches = [
            ...patternsStr.matchAll(/['"]([^'"]+)['"]/g)
          ]
          const patterns = patternMatches.map((m) => m[1])

          const isEager = optionsStr && /eager\s*:\s*true/.test(optionsStr)
          const importDefault =
            optionsStr && /import\s*:\s*['"]default['"]/.test(optionsStr)

          const allFiles = []

          // Resolve the directory of the file being transformed
          const fileDir = dirname(id.replace(/\?.*$/, ''))

          for (const pattern of patterns) {
            let baseDir
            let resolvedPattern

            if (pattern.startsWith('@/')) {
              baseDir = srcPath
              resolvedPattern = pattern.slice(2)
            } else if (pattern.startsWith('~/')) {
              baseDir = projectRoot
              resolvedPattern = pattern.slice(2)
            } else if (pattern.startsWith('./') || pattern.startsWith('../')) {
              baseDir = fileDir
              resolvedPattern = pattern
            } else {
              continue
            }

            const matches = globSync(resolvedPattern, { cwd: baseDir })
            allFiles.push(...matches.map((f) => resolve(baseDir, f)))
          }

          changed = true

          if (allFiles.length === 0) return '{}'

          if (isEager) {
            const allStyles = allFiles.every((f) => STYLE_EXT.test(f))

            if (allStyles) {
              // Style files: generate side-effect imports
              prependImports += allFiles
                .map((f) => `import '${f}';`)
                .join('\n') + '\n'
              return '{}'
            }

            const entries = allFiles.map((f) => {
              const varName = `__glob_${varCounter++}`
              prependImports += importDefault
                ? `import { default as ${varName} } from '${f}';\n`
                : `import * as ${varName} from '${f}';\n`
              return `  '${f}': ${varName}`
            })

            return '{\n' + entries.join(',\n') + '\n}'
          }

          const entries = allFiles.map((f) => {
            const suffix = importDefault ? '.then(m => m.default)' : ''
            return `  '${f}': () => import('${f}')${suffix}`
          })

          return '{\n' + entries.join(',\n') + '\n}'
        }
      )

      if (!changed) return

      const result = prependImports
        ? prependImports + transformed
        : transformed

      return { code: result, map: null }
    }
  }
}
