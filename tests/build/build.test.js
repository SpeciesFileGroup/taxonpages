import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execFile, spawn } from 'node:child_process'
import { promisify } from 'node:util'
import { createServer } from 'node:net'
import { existsSync, readFileSync, readdirSync, mkdtempSync, rmSync, realpathSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { writeFiles } from '../helpers/project.js'

const run = promisify(execFile)
const packageRoot = resolve(import.meta.dirname, '../..')
const bin = join(packageRoot, 'bin/taxonpages.js')

const PANEL_MARKER = 'smoke-panel-marker'

let project
let workDir

/** Run the CLI in the project, as a user would. */
function taxonpages(...args) {
  return run(process.execPath, [bin, ...args], {
    cwd: project,
    env: { ...process.env, NODE_ENV: 'production' },
    maxBuffer: 20 * 1024 * 1024
  })
}

function readAssets(dir) {
  return readdirSync(dir, { recursive: true })
    .filter((f) => f.endsWith('.js'))
    .map((f) => readFileSync(join(dir, f), 'utf-8'))
    .join('\n')
}

beforeAll(async () => {
  workDir = realpathSync(mkdtempSync(join(tmpdir(), 'taxonpages-build-')))
  // Deliberately deep: generated chunk names once embedded absolute paths and
  // broke the build of sites in long directories.
  project = join(workDir, 'a-rather-long-directory-name-for-a-site/'.repeat(3), 'site')

  await run(process.execPath, [bin, 'init', project])

  // A scaffolded site plus one of everything a site can add: a local module
  // with its own catalog, a local panel, a second locale and a translated page.
  writeFiles(project, {
    // Unreachable on purpose: no test may depend on a real TaxonWorks server.
    'config/api.yml': 'url: http://127.0.0.1:9/api/v1\nproject_token: test',
    'config/i18n.yml': 'i18n:\n  default_locale: en\n  locales: [en, es]',
    'pages/about.es.md': '# Acerca de este sitio',
    'modules/smoke/router/index.js': `export default [
      { path: '/smoke', name: 'smoke', component: () => import('../views/Smoke.vue') }
    ]`,
    'modules/smoke/views/Smoke.vue': `<template><p id="smoke">{{ $t('smoke.hello') }}</p></template>`,
    'modules/smoke/locales/en.yml': 'smoke:\n  hello: Hello from a local module',
    'modules/smoke/locales/es.yml': 'smoke:\n  hello: Hola desde un módulo local',
    'panels/PanelSmoke/main.js': `export default { id: 'panel:smoke', component: { name: '${PANEL_MARKER}', render: () => null } }`
  })
})

afterAll(() => {
  if (workDir) rmSync(workDir, { recursive: true, force: true })
})

describe('SPA build', () => {
  it('builds a site that includes local modules and panels', async () => {
    await taxonpages('build')

    expect(existsSync(join(project, 'dist/index.html'))).toBe(true)

    const bundle = readAssets(join(project, 'dist'))
    expect(bundle).toContain(PANEL_MARKER)
    expect(bundle).toContain('Hello from a local module')
  })
})

describe('SSR build and server', () => {
  let server
  let base

  beforeAll(async () => {
    await taxonpages('build:ssr')

    const port = await freePort()
    base = `http://127.0.0.1:${port}`
    server = spawn(process.execPath, [bin, 'serve', '--port', String(port)], {
      cwd: project,
      stdio: 'pipe'
    })

    await waitFor(`${base}/ping`)
  })

  afterAll(() => server?.kill())

  it('renders a local module route on the server, in the default locale', async () => {
    const res = await fetch(`${base}/smoke`)
    const html = await res.text()

    expect(res.status).toBe(200)
    expect(html).toMatch(/<html[^>]*lang="en"/)
    expect(html).toContain('<p id="smoke">Hello from a local module</p>')
    expect(html).toContain('window.initialState')
  })

  it('renders the same route under a locale prefix', async () => {
    const html = await (await fetch(`${base}/es/smoke`)).text()

    expect(html).toMatch(/<html[^>]*lang="es"/)
    expect(html).toContain('Hola desde un módulo local')
  })

  it('serves translated pages by locale', async () => {
    expect(await (await fetch(`${base}/es/about`)).text()).toContain('Acerca de este sitio')
    expect(await (await fetch(`${base}/about`)).text()).not.toContain('Acerca de este sitio')
  })

  it('answers unknown routes with a 404 status', async () => {
    expect((await fetch(`${base}/does-not-exist`)).status).toBe(404)
  })
})

describe('hash mode', () => {
  let server
  let base

  beforeAll(() => {
    writeFiles(project, { 'config/router.yml': 'base_url: /site/\nhash_mode: true' })
  })

  afterAll(() => {
    server?.kill()
    rmSync(join(project, 'config/router.yml'))
  })

  // The route table this produces is covered by tests/src/router, against the
  // real router module.
  it('builds a multi-locale SPA served under base_url', async () => {
    await taxonpages('build')

    const html = readFileSync(join(project, 'dist/index.html'), 'utf-8')
    expect(html).toMatch(/src="\/site\/assets\/[^"]+\.js"/)
  })

  // The fragment never reaches a server, so SSR forces history mode: a site
  // configured for hash mode must still serve locale-prefixed paths.
  it('still serves SSR, in history mode', async () => {
    await taxonpages('build:ssr')

    const port = await freePort()
    base = `http://127.0.0.1:${port}`
    server = spawn(process.execPath, [bin, 'serve', '--port', String(port)], {
      cwd: project,
      stdio: 'pipe'
    })
    await waitFor(`${base}/ping`)

    const html = await (await fetch(`${base}/es/smoke`)).text()

    expect(html).toMatch(/<html[^>]*lang="es"/)
    expect(html).toContain('Hola desde un módulo local')
  })
})

function freePort() {
  return new Promise((done, fail) => {
    const srv = createServer()
    srv.on('error', fail)
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address()
      srv.close(() => done(port))
    })
  })
}

async function waitFor(url, timeout = 30_000) {
  const start = Date.now()

  while (Date.now() - start < timeout) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 200))
  }

  throw new Error(`Server did not start: ${url}`)
}
