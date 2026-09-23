import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import * as yaml from 'js-yaml'
import { packageAddCore } from '../../../cli/commands/packageAdd.js'
import { packageRemoveCore } from '../../../cli/commands/packageRemove.js'
import { createProject, writeFiles, npmPackage, panelEntry } from '../../helpers/project.js'

// The only mock: npm itself. Each test decides what "installing" does.
vi.mock('node:child_process', () => ({ execFileSync: vi.fn() }))

beforeEach(() => {
  execFileSync.mockReset()
})

const PANEL = 'taxonpages-panel-foo'

function installedPanel(root) {
  writeFiles(root, {
    [`node_modules/${PANEL}/package.json`]: npmPackage(PANEL, { type: 'panel' }),
    [`node_modules/${PANEL}/src/main.js`]: panelEntry('panel:foo')
  })
}

describe('packageAddCore', () => {
  it('installs with --ignore-scripts and reports the panel id', () => {
    const root = createProject({ 'package.json': {}, 'node_modules/.keep': '' })
    execFileSync.mockImplementation(() => installedPanel(root))

    const result = packageAddCore({ packageRoot: root, projectRoot: root, name: PANEL })

    expect(execFileSync).toHaveBeenCalledWith(
      'npm',
      ['install', '--ignore-scripts', PANEL],
      expect.objectContaining({ cwd: root })
    )
    expect(result).toMatchObject({ type: 'panel', panelId: 'panel:foo', isCommunity: true })
    // Dev server restart sentinel
    expect(existsSync(join(root, 'node_modules/.taxonpages-refresh'))).toBe(true)
  })

  it('does not flag @sfgrp packages as community packages', () => {
    const root = createProject({ 'package.json': {}, 'node_modules/.keep': '' })
    execFileSync.mockImplementation(() =>
      writeFiles(root, {
        'node_modules/@sfgrp/taxonpages-module-x/package.json': npmPackage('@sfgrp/taxonpages-module-x', { type: 'module' })
      })
    )

    const result = packageAddCore({ packageRoot: root, projectRoot: root, name: '@sfgrp/taxonpages-module-x' })

    expect(result).toMatchObject({ type: 'module', panelId: null, isCommunity: false })
  })

  it('uninstalls a package that turns out not to be a TaxonPages package', () => {
    const root = createProject({ 'package.json': {}, 'node_modules/.keep': '' })
    execFileSync.mockImplementation((cmd, args) => {
      if (args[0] === 'install') writeFiles(root, { 'node_modules/lodash/package.json': { name: 'lodash' } })
    })

    expect(() => packageAddCore({ packageRoot: root, projectRoot: root, name: 'lodash' })).toThrow(/taxonpages manifest/)
    expect(execFileSync).toHaveBeenLastCalledWith('npm', ['uninstall', 'lodash'], expect.anything())
  })

  it('refuses a package that is already installed', () => {
    const root = createProject({ 'package.json': {} })
    installedPanel(root)

    expect(() => packageAddCore({ packageRoot: root, projectRoot: root, name: PANEL })).toThrow(/already installed/)
    expect(execFileSync).not.toHaveBeenCalled()
  })

  it('surfaces the first meaningful npm error line', () => {
    const root = createProject({ 'package.json': {} })
    execFileSync.mockImplementation(() => {
      const err = new Error('failed')
      err.stderr = Buffer.from('npm warn deprecated x\nnpm error 404 Not Found - nope\n')
      throw err
    })

    expect(() => packageAddCore({ packageRoot: root, projectRoot: root, name: 'nope' })).toThrow(
      'npm error 404 Not Found - nope'
    )
  })
})

describe('packageRemoveCore', () => {
  it('removes every occurrence of the panel from taxa_page.yml before uninstalling', () => {
    const root = createProject({
      'package.json': {},
      'config/taxa_page.yml': yaml.dump({
        taxa_page: {
          overview: { panels: [[['panel:gallery', 'panel:foo'], [{ id: 'panel:foo', bind: { a: 1 } }]]] },
          other: { panels: [[['panel:map']]] }
        }
      })
    })
    installedPanel(root)

    packageRemoveCore({ projectRoot: root, name: PANEL })

    const config = yaml.load(readFileSync(join(root, 'config/taxa_page.yml'), 'utf-8'))

    expect(config.taxa_page).toEqual({
      overview: { panels: [[['panel:gallery'], []]] },
      other: { panels: [[['panel:map']]] }
    })
    expect(execFileSync).toHaveBeenCalledWith('npm', ['uninstall', PANEL], expect.anything())
  })

  it('leaves taxa_page.yml untouched when the panel is not in it', () => {
    const original = 'taxa_page:\n  overview:\n    panels: [[[panel:map]]]  # keep my comment\n'
    const root = createProject({ 'package.json': {}, 'config/taxa_page.yml': original })
    installedPanel(root)

    packageRemoveCore({ projectRoot: root, name: PANEL })

    expect(readFileSync(join(root, 'config/taxa_page.yml'), 'utf-8')).toBe(original)
  })
})
