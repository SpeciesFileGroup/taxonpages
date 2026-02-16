/**
 * Vite plugin that resolves import.meta.glob calls containing @/ or ~/
 * aliases into pre-resolved absolute paths.
 *
 * This is necessary because import.meta.glob with aliases pointing into
 * node_modules won't scan those directories. This plugin intercepts the
 * glob calls, performs the scanning with absolute paths, and replaces
 * the call with a pre-built object of lazy imports.
 *
 * Additionally, it discovers NPM packages with a `taxonpages` manifest
 * and injects their entry points into the appropriate glob results,
 * making `npm install @vendor/taxonpages-panel-foo` work seamlessly.
 */
import { resolve, dirname } from 'node:path'
import { globSync } from 'glob'
import {
  discoverNpmPackages,
  resolveConflicts,
  discoverLocalPanels,
  discoverLocalModules,
  logDiscoveredPackages
} from './discoverPackages.js'

const STYLE_EXT = /\.(css|scss|sass|less|styl)$/

export function componentRegistrationPlugin({
  packageRoot,
  projectRoot,
  disabled
}) {
  const srcPath = resolve(packageRoot, 'src')

  // Lazy-initialized cache: discovered once per build, reused across transforms
  let _npmPackages = null
  let _resolvedPanels = null
  let _resolvedModules = null

  function getNpmPackages() {
    if (_npmPackages) return _npmPackages
    _npmPackages = discoverNpmPackages(projectRoot, { disabled })

    const npmPanels = _npmPackages.filter((p) => p.type === 'panel')
    const npmModules = _npmPackages.filter((p) => p.type === 'module')
    const localPanels = discoverLocalPanels(projectRoot)
    const localModules = discoverLocalModules(projectRoot)

    _resolvedPanels = resolveConflicts(localPanels, npmPanels).filter(
      (p) => p.source === 'npm'
    )
    _resolvedModules = resolveConflicts(localModules, npmModules).filter(
      (p) => p.source === 'npm'
    )

    logDiscoveredPackages({
      panels: _resolvedPanels,
      modules: _resolvedModules
    })

    return _npmPackages
  }

  /**
   * Collect additional files from NPM packages that should be injected
   * into a given set of glob patterns.
   */
  function getNpmFiles(patterns) {
    getNpmPackages()
    const extra = []

    const patternsStr = patterns.join(' ')

    // Panel entry points: patterns like "panels/*/main.js" or "Panel/*/main.js"
    if (
      patternsStr.includes('panels/*/main.js') ||
      patternsStr.includes('Panel/*/main.js')
    ) {
      for (const panel of _resolvedPanels) {
        extra.push(panel.entry)
      }
    }

    // Module router entry points: patterns like "modules/**/router/*.js"
    if (patternsStr.includes('modules/**/router/')) {
      for (const mod of _resolvedModules) {
        extra.push(mod.entry)
      }
    }

    // Global components: patterns like "*.global.vue"
    if (patternsStr.includes('.global.vue')) {
      for (const pkg of [..._resolvedPanels, ..._resolvedModules]) {
        const matches = globSync('**/*.global.vue', { cwd: pkg.path })
        extra.push(...matches.map((f) => resolve(pkg.path, f)))
      }
    }

    // Client-only components: patterns like "*.client.vue"
    if (patternsStr.includes('.client.vue')) {
      for (const pkg of [..._resolvedPanels, ..._resolvedModules]) {
        const matches = globSync('**/*.client.vue', { cwd: pkg.path })
        extra.push(...matches.map((f) => resolve(pkg.path, f)))
      }
    }

    return extra
  }

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

          // Inject NPM package files matching these glob patterns
          const npmFiles = getNpmFiles(patterns)
          allFiles.push(...npmFiles)

          changed = true

          if (allFiles.length === 0) return '{}'

          if (isEager) {
            const allStyles = allFiles.every((f) => STYLE_EXT.test(f))

            if (allStyles) {
              // Style files: generate side-effect imports
              prependImports +=
                allFiles.map((f) => `import '${f}';`).join('\n') + '\n'
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
