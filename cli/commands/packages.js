import { loadConfiguration } from '../../src/utils/loadConfiguration.js'
import {
  discoverAllPackages,
  extractBaseName
} from '../../src/plugins/vite/discoverPackages.js'

/**
 * List all discovered TaxonPages packages (local + npm).
 *
 * @param {object} options
 * @param {string} options.packageRoot
 * @param {string} options.projectRoot
 */
export function listPackages({ packageRoot, projectRoot }) {
  const configuration = loadConfiguration(projectRoot)
  const disabled = configuration.packages?.disabled || []

  const { panels, modules, plugins } = discoverAllPackages(projectRoot, {
    disabled
  })

  console.log('')
  console.log('  TaxonPages — Installed packages')
  console.log('')

  if (panels.length === 0 && modules.length === 0 && plugins.length === 0) {
    console.log('  No external packages found.')
    console.log('')
    return
  }

  if (plugins.length > 0) {
    console.log('  PLUGINS')
    for (const p of plugins) {
      const label =
        p.source === 'npm'
          ? `(npm)   ${p.name}@${p.version}`
          : `(local) ~/plugins/${p.name}`
      console.log(`  ├─ ${p.name.padEnd(30)} ${label}`)
    }
    console.log('')
  }

  if (panels.length > 0) {
    console.log('  PANELS')
    for (const p of panels) {
      const label =
        p.source === 'npm'
          ? `(npm)   ${p.name}@${p.version}`
          : `(local) ~/panels/${p.name}`
      console.log(`  ├─ ${p.name.padEnd(30)} ${label}`)
    }
    console.log('')
  }

  if (modules.length > 0) {
    console.log('  MODULES')
    for (const m of modules) {
      const label =
        m.source === 'npm'
          ? `(npm)   ${m.name}@${m.version}`
          : `(local) ~/modules/${m.name}`
      console.log(`  ├─ ${m.name.padEnd(30)} ${label}`)
    }
    console.log('')
  }

  const all = [...panels, ...modules, ...plugins]
  const npmCount = all.filter((p) => p.source === 'npm').length
  const localCount = all.filter((p) => p.source === 'local').length

  console.log(`  ${npmCount} npm, ${localCount} local`)
  console.log('')
}
