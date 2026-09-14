import { DEDUPE_PACKAGES, findDuplicatePackages } from '../utils/dedupe.js'

/**
 * Check the project for known dependency problems.
 *
 * Currently one check: libraries that TaxonPages owns and shares with every
 * panel, module and plugin must exist exactly once in the tree. A second copy
 * is deduplicated when the site is bundled, so this reports what that papers
 * over rather than something the site is actively failing on.
 *
 * @param {object} options
 * @param {string} options.projectRoot
 * @returns {boolean} true when no problems were found
 */
export function doctor({ projectRoot }) {
  console.log('')
  console.log('  TaxonPages — Project check')
  console.log('')

  const ok = checkDuplicateDependencies(projectRoot)

  console.log('')

  return ok
}

function checkDuplicateDependencies(projectRoot) {
  let duplicates

  try {
    duplicates = findDuplicatePackages(projectRoot)
  } catch (err) {
    console.log('  SHARED LIBRARIES')
    console.log(`  ├─ Could not read node_modules: ${err.message}`)
    return true
  }

  console.log('  SHARED LIBRARIES')
  console.log(`  ├─ Checked: ${DEDUPE_PACKAGES.join(', ')}`)

  if (duplicates.length === 0) {
    console.log('  └─ One copy of each. Nothing to do.')
    return true
  }

  for (const { name, copies } of duplicates) {
    console.log(`  ├─ ${name} is installed ${copies.length} times:`)
    for (const copy of copies) {
      console.log(`  │    ${copy.version.padEnd(10)} ${relativeToProject(copy.path, projectRoot)}`)
    }
  }

  console.log('  │')
  console.log('  │  TaxonPages creates the Vue app, the router, the Pinia store, the i18n')
  console.log('  │  instance and the head context, and shares them with every panel, module')
  console.log('  │  and plugin. When one of those libraries is installed twice, the two')
  console.log('  │  copies cannot see each other. Your site still works: only one copy is')
  console.log('  │  used when it is built. But the package that brought the extra copy now')
  console.log('  │  runs against a version it was not built for, and the unused copies sit')
  console.log('  │  in node_modules for nothing.')
  console.log('  │')
  console.log('  └─ This is fixed in the package that brought the extra copy, by declaring')
  console.log('     these libraries as peerDependencies. Report it to its author, or see the')
  console.log('     "Shared dependencies" section of the developer guide if it is yours.')

  return false
}

function relativeToProject(path, projectRoot) {
  return path.startsWith(projectRoot) ? path.slice(projectRoot.length + 1) : path
}
