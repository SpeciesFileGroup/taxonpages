/**
 * Vite plugin that injects user project style files (CSS/SCSS)
 * from config/style/ into the application entry point.
 */
import { resolve } from 'node:path'
import { existsSync, readdirSync } from 'node:fs'

export function projectStylesPlugin(projectRoot) {
  const styleDir = resolve(projectRoot, 'config/style')

  return {
    name: 'taxonpages:project-styles',
    transform(code, id) {
      if (!id.includes('main.js') && !id.includes('main.ts')) return

      if (!existsSync(styleDir)) return

      const files = readdirSync(styleDir).filter((f) => /\.(css|scss)$/.test(f))

      if (!files.length) return

      const imports = files
        .map((f) => `import '${resolve(styleDir, f)}';`)
        .join('\n')

      return { code: imports + '\n' + code, map: null }
    }
  }
}
