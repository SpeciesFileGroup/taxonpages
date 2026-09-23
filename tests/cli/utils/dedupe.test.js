import { describe, it, expect } from 'vitest'
import { findDuplicatePackages } from '../../../cli/utils/dedupe.js'
import { createProject } from '../../helpers/project.js'

describe('findDuplicatePackages', () => {
  it('reports shared libraries installed more than once, including scoped ones', () => {
    const root = createProject({
      'node_modules/vue/package.json': { version: '3.5.0' },
      'node_modules/pinia/package.json': { version: '3.0.0' },
      'node_modules/@unhead/vue/package.json': { version: '3.0.0' },
      'node_modules/taxonpages-panel-x/node_modules/vue/package.json': { version: '3.4.0' },
      'node_modules/taxonpages-panel-x/node_modules/@unhead/vue/package.json': { version: '2.0.0' }
    })

    const duplicates = findDuplicatePackages(root)

    expect(duplicates.map((d) => d.name).sort()).toEqual(['@unhead/vue', 'vue'])
    expect(duplicates.find((d) => d.name === 'vue').copies.map((c) => c.version).sort()).toEqual(['3.4.0', '3.5.0'])
  })

  it('returns nothing for a clean tree or a project without node_modules', () => {
    expect(findDuplicatePackages(createProject({ 'node_modules/vue/package.json': { version: '3.5.0' } }))).toEqual([])
    expect(findDuplicatePackages(createProject())).toEqual([])
  })
})
