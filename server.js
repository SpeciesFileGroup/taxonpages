// @ts-check
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import express from 'express'
import { generateConsoleMessage } from './src/ssr/utils/generateConsoleMessage.js'
import { loadApiRoutes } from './src/server/loadApiRoutes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Create the Express SSR server.
 *
 * @param {object} [options]
 * @param {string} [options.projectRoot] - User's project directory (where config/, dist/ live). Defaults to CWD.
 * @param {string} [options.packageRoot] - The taxonpages package directory (where src/, index.html live). Defaults to this file's directory.
 * @param {boolean} [options.isProd] - Whether to run in production mode. Defaults to NODE_ENV === 'production'.
 * @param {number} [options.hmrPort] - HMR port for development mode.
 */
export async function createServer({
  projectRoot = process.cwd(),
  packageRoot = __dirname,
  isProd = process.env.NODE_ENV === 'production',
  hmrPort
} = {}) {
  const resolveProject = (p) => path.resolve(projectRoot, p)
  const resolvePackage = (p) => path.resolve(packageRoot, p)

  const templateHtml = isProd
    ? fs.readFileSync(resolveProject('dist/client/index.html'), 'utf-8')
    : ''

  const manifest = isProd
    ? JSON.parse(
        fs.readFileSync(
          resolveProject('dist/client/.vite/ssr-manifest.json'),
          'utf-8'
        )
      )
    : {}

  const app = express()
  const httpServer = http.createServer(app)
  let vite

  if (!isProd) {
    const { getViteConfig } = await import(
      './cli/utils/resolveConfig.js'
    )
    const viteConfig = getViteConfig({ packageRoot, projectRoot })

    vite = await (
      await import('vite')
    ).createServer({
      configFile: false,
      ...viteConfig,
      logLevel: 'info',
      server: {
        ...viteConfig.server,
        middlewareMode: true,
        watch: {
          usePolling: true,
          interval: 100
        },
        hmr: {
          server: httpServer
        }
      },
      appType: 'custom'
    })
    // use vite's connect instance as middleware
    app.use(vite.middlewares)
  } else {
    app.use((await import('compression')).default())
    app.use(
      '/',
      (await import('serve-static')).default(
        resolveProject('dist/client'),
        { index: false }
      )
    )
  }

  // User-defined API routes from ~/server/routes/*.js
  const apiRouter = express.Router()
  app.use('/api', apiRouter)

  async function mountApiRoutes() {
    apiRouter.stack.length = 0
    const routes = await loadApiRoutes(projectRoot)

    for (const { name, handler } of routes) {
      apiRouter.use(`/${name}`, handler)
    }
  }

  await mountApiRoutes()

  if (!isProd) {
    const { watch } = await import('node:fs')
    const routesDir = path.resolve(projectRoot, 'server', 'routes')

    try {
      watch(routesDir, { recursive: true }, async (eventType, filename) => {
        if (!filename) return

        // Bust the module cache so re-import picks up changes
        const filePath = path.resolve(routesDir, filename)
        const fileUrl = pathToFileURL(filePath).href

        // For ESM we append a query param to force re-import
        if (!globalThis.__apiRouteVersions) {
          globalThis.__apiRouteVersions = {}
        }
        globalThis.__apiRouteVersions[fileUrl] =
          (globalThis.__apiRouteVersions[fileUrl] || 0) + 1

        console.log(`[taxonpages] API route changed: ${filename}. Reloading...`)
        await mountApiRoutes()
      })
    } catch {
      // routesDir doesn't exist yet — that's fine
    }
  }

  app.use('/ping', async (req, res) => {
    res.status(200).end('')
  })

  app.use(/(.*)/, async (req, res) => {
    try {
      const url = req.originalUrl
      const origin = req.protocol + '://' + req.get('host')

      let template, render
      if (!isProd) {
        // always read fresh template in dev
        template = fs.readFileSync(resolvePackage('index.html'), 'utf-8')
        template = await vite.transformIndexHtml(url, template)
        render = (await vite.ssrLoadModule('/src/entry-server.js')).render
      } else {
        template = templateHtml
        render = (await import(pathToFileURL(resolveProject('dist/server/entry-server.js')).href))
          .render
      }

      const [appHtml, appState, preloadLinks, tagMeta, statusCode] =
        await render(url, manifest, origin)
      const html = template
        .replace(`<!--preload-links-->`, preloadLinks)
        .replace(`<!--app-state-->`, appState)
        .replace(`<!--head-tags-->`, tagMeta.headTags)
        .replace(`<!--body-tags-open-->`, tagMeta.bodyTagsOpen)
        .replace(`<!--body-tags-->`, tagMeta.bodyTags)
        .replace(makeAppContainer(), makeAppContainer(appHtml))

      res.status(statusCode).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      vite && vite.ssrFixStacktrace(e)
      console.error(e.stack)
      res.status(500).end(isProd ? 'Internal Server Error' : e.stack)
    }
  })

  return { app, httpServer, vite }
}

function makeAppContainer(app = '') {
  return `<div id="app">${app}</div>`
}

// Standalone execution: when run directly (not imported by CLI)
const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith('server.js') ||
    process.argv[1].endsWith('server'))

if (isDirectRun) {
  const minimist = (await import('minimist')).default
  const { port = 6173 } = minimist(process.argv.slice(2))

  createServer().then(({ httpServer }) =>
    httpServer.listen(port, () => {
      generateConsoleMessage({ port, url: 'http://localhost' })
    })
  )
}
