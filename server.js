// @ts-check
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { generateConsoleMessage } from './src/ssr/utils/generateConsoleMessage.js'

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
  let vite

  if (!isProd) {
    const { getViteConfig } = await import(
      './src/cli/utils/resolveConfig.js'
    )
    const viteConfig = getViteConfig({ packageRoot, projectRoot })

    vite = await (
      await import('vite')
    ).createServer({
      configFile: false,
      ...viteConfig,
      logLevel: 'info',
      server: {
        middlewareMode: true,
        watch: {
          usePolling: true,
          interval: 100
        },
        hmr: {
          port: hmrPort
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
        render = (await import(resolveProject('dist/server/entry-server.js')))
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
      console.log(e.stack)
      res.status(500).end(e.stack)
    }
  })

  return { app, vite }
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

  createServer().then(({ app }) =>
    app.listen(port, () => {
      generateConsoleMessage({ port, url: 'http://localhost' })
    })
  )
}
