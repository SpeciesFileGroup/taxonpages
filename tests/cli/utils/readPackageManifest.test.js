import { describe, it, expect } from 'vitest'
import { join } from 'node:path'
import { readPackageManifest } from '../../../cli/utils/readPackageManifest.js'
import { createProject, npmPackage } from '../../helpers/project.js'

function project(pkgJson, name = 'pkg') {
  return createProject({
    [`node_modules/${name}/package.json`]: pkgJson,
    'node_modules/pkg-evil/main.js': "export default { id: 'panel:evil' }"
  })
}

describe('readPackageManifest', () => {
  it('reads the manifest with the default entry for the type', () => {
    const root = project(npmPackage('@acme/p', { type: 'panel' }), '@acme/p')

    expect(readPackageManifest(root, '@acme/p')).toEqual({
      type: 'panel',
      entry: './src/main.js',
      entryPath: join(root, 'node_modules/@acme/p/src/main.js'),
      pkgDir: join(root, 'node_modules/@acme/p'),
      version: '1.0.0'
    })
  })

  it.each([
    ['is not installed', null],
    ['has no manifest', npmPackage('pkg')],
    ['has a manifest without type', npmPackage('pkg', { entry: './x.js' })],
    ['points its entry outside the package', npmPackage('pkg', { type: 'panel', entry: '../../x.js' })],
    // Shares the package name as a prefix: must not pass as inside `pkg`
    ['points its entry at a sibling package', npmPackage('pkg', { type: 'panel', entry: '../pkg-evil/main.js' })]
  ])('returns null for a package that %s', (_, pkgJson) => {
    const root = pkgJson ? project(pkgJson) : createProject()

    expect(readPackageManifest(root, 'pkg')).toBe(null)
  })
})
