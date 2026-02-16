import { loadConfiguration } from '../../utils/loadConfiguration.js'
import {
  discoverNpmPackages,
  discoverLocalPanels,
  discoverLocalModules,
  resolveConflicts,
  extractBaseName
} from '../../plugins/vite/discoverPackages.js'

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

  const npmPackages = discoverNpmPackages(projectRoot, { disabled })
  const npmPanels = npmPackages.filter((p) => p.type === 'panel')
  const npmModules = npmPackages.filter((p) => p.type === 'module')

  const localPanels = discoverLocalPanels(projectRoot)
  const localModules = discoverLocalModules(projectRoot)

  const panels = resolveConflicts(localPanels, npmPanels)
  const modules = resolveConflicts(localModules, npmModules)

  console.log('')
  console.log('  TaxonPages — Installed packages')
  console.log('')

  if (panels.length === 0 && modules.length === 0) {
    console.log('  No external packages found.')
    console.log('')
    return
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

  const npmCount = panels.filter((p) => p.source === 'npm').length +
    modules.filter((m) => m.source === 'npm').length
  const localCount = panels.filter((p) => p.source === 'local').length +
    modules.filter((m) => m.source === 'local').length

  console.log(`  ${npmCount} npm, ${localCount} local`)
  console.log('')
}
