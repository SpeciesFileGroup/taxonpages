import express from 'express'
import { resolve, dirname } from 'node:path'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { exec } from 'node:child_process'
import { createServer as createViteServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { createConfigRoutes } from './routes/config.js'
import { createPackageRoutes } from './routes/packages.js'
import { createPanelRoutes } from './routes/panels.js'
import schema from './schema.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

function openBrowser(url) {
  const { platform, env } = process
  const isWSL = !!env.WSL_DISTRO_NAME
  const cmd =
    platform === 'darwin' ? 'open' :
    platform === 'win32' ? 'start' :
    isWSL ? 'explorer.exe' :
    'xdg-open'

  exec(`${cmd} ${url}`)
}

/**
 * Create the setup server.
 * Uses Vite as middleware to serve the Vue SPA client.
 *
 * @param {object} options
 * @param {string} options.projectRoot - Path to the user's project
 * @param {number} options.port - Port to listen on
 */
export async function createSetupServer({ packageRoot, projectRoot, port }) {
  const app = express()
  const clientDir = resolve(__dirname, 'client')

  app.use(express.json())

  // API routes (before Vite middleware)
  app.use('/api/config', createConfigRoutes(projectRoot))
  app.use('/api/packages', createPackageRoutes(projectRoot))
  app.use('/api/panels', createPanelRoutes(packageRoot, projectRoot))

  app.get('/api/schema', (_req, res) => {
    res.json(schema)
  })

  // Vite dev server as middleware for the setup client SPA
  const vite = await createViteServer({
    configFile: false,
    root: clientDir,
    server: { middlewareMode: true },
    appType: 'custom',
    plugins: [tailwindcss(), vue()],
    optimizeDeps: {
      include: ['vue']
    }
  })

  app.use(vite.middlewares)

  // SPA fallback — only for navigation requests (not assets)
  app.use('/{*path}', async (req, res, next) => {
    const accept = req.headers.accept || ''
    if (!accept.includes('text/html')) {
      return next()
    }

    try {
      const url = req.originalUrl
      let html = readFileSync(resolve(clientDir, 'index.html'), 'utf-8')
      html = await vite.transformIndexHtml(url, html)
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (err) {
      vite.ssrFixStacktrace(err)
      console.error(err)
      res.status(500).end(err.message)
    }
  })

  app.listen(port, '127.0.0.1', () => {
    const url = `http://localhost:${port}`

    console.log('')
    console.log(`  TaxonPages Setup`)
    console.log(`  Local: ${url}`)
    console.log(`  Project: ${projectRoot}`)
    console.log('')
    console.log('  Press Ctrl+C to stop.')
    console.log('')

    openBrowser(url)
  })
}
