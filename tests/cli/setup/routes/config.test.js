import { describe, it, expect, afterEach } from 'vitest'
import express from 'express'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { createConfigRoutes } from '../../../../cli/setup/routes/config.js'
import { createProject } from '../../../helpers/project.js'

let server

afterEach(() => new Promise((done) => (server ? server.close(done) : done())))

/** Mount the router on an ephemeral port and return a fetch bound to it. */
async function serve(projectRoot) {
  const app = express()
  app.use(express.json())
  app.use('/api/config', createConfigRoutes(projectRoot))

  await new Promise((done) => (server = app.listen(0, '127.0.0.1', done)))
  const base = `http://127.0.0.1:${server.address().port}/api/config`

  return (path, init = {}) =>
    fetch(base + path, {
      ...init,
      headers: { 'Content-Type': 'application/json' },
      body: init.body && JSON.stringify(init.body)
    })
}

describe('config API', () => {
  it('lists every config file, parsed and raw', async () => {
    const root = createProject({
      'config/api.yml': 'url: https://x.org',
      'config/empty.yml': ''
    })
    const request = await serve(root)

    const body = await (await request('/')).json()

    expect(body['api.yml']).toEqual({ filename: 'api.yml', content: { url: 'https://x.org' }, raw: 'url: https://x.org' })
    expect(body['empty.yml'].content).toEqual({})
  })

  it('reports a broken file without failing the whole listing', async () => {
    const root = createProject({ 'config/bad.yml': 'a: [1', 'config/ok.yml': 'a: 1' })
    const body = await (await (await serve(root))('/')).json()

    expect(body['bad.yml'].error).toBeTruthy()
    expect(body['ok.yml'].content).toEqual({ a: 1 })
  })

  it('returns an empty document for a missing file', async () => {
    const request = await serve(createProject())

    expect(await (await request('/header.yml')).json()).toEqual({ filename: 'header.yml', content: {}, raw: '' })
  })

  it('writes YAML that reads back to the same content, creating config/', async () => {
    const root = createProject()
    const request = await serve(root)
    const content = { header_links: [{ label: { en: 'Home', es: 'Inicio' }, link: '/' }] }

    const res = await request('/header.yml', { method: 'PUT', body: { content } })

    expect(res.status).toBe(200)
    expect(readFileSync(join(root, 'config/header.yml'), 'utf-8').startsWith('---\n')).toBe(true)
    expect((await (await request('/header.yml')).json()).content).toEqual(content)
  })

  it('rejects a PUT without content', async () => {
    const request = await serve(createProject())

    expect((await request('/a.yml', { method: 'PUT', body: {} })).status).toBe(400)
  })

  it.each(['..%2Fpackage.yml', 'a.json', '.yml', 'a b.yml', '..yml'])(
    'rejects the filename %s',
    async (filename) => {
      const request = await serve(createProject())
      const res = await request(`/${filename}`, { method: 'PUT', body: { content: {} } })

      expect(res.status).toBe(400)
    }
  )

  it('deletes a file, and treats an already missing file as success', async () => {
    const root = createProject({ 'config/i18n.yml': 'i18n: {}' })
    const request = await serve(root)

    expect((await request('/i18n.yml', { method: 'DELETE' })).status).toBe(200)
    expect(existsSync(join(root, 'config/i18n.yml'))).toBe(false)
    expect((await request('/i18n.yml', { method: 'DELETE' })).status).toBe(200)
  })
})
