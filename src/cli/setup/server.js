import express from 'express'
import { resolve, relative, dirname } from 'node:path'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { exec } from 'node:child_process'
import { createServer as createViteServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { createConfigRoutes } from './routes/config.js'
import { createPackageRoutes } from './routes/packages.js'
import { createPanelRoutes } from './routes/panels.js'
import { createProxyRoutes } from './routes/proxy.js'
import { createStatusRoutes } from './routes/status.js'
import { createStyleRoutes } from './routes/style.js'
import schema from './schema.js'
import {
  discoverNpmPackages,
  extractBaseName,
  loadSchema
} from '../../plugins/vite/discoverPackages.js'
import { toForwardSlash } from '../../utils/paths.js'

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
 * Vite plugin that injects @source directives into styles.css
 * so Tailwind CSS scans custom editor components from all module sources.
 */
function tailwindCustomSources(clientDir, packageRoot, projectRoot) {
  return {
    name: 'tailwind-custom-sources',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('styles.css')) return

      const cssDir = dirname(id)
      const sources = [
        resolve(packageRoot, 'src/modules/*/setup/**/*.vue'),
        resolve(projectRoot, 'modules/*/setup/**/*.vue')
      ]

      // Discover NPM modules (both scoped and unscoped) with setup schemas
      const npmPackages = discoverNpmPackages(projectRoot)
        .filter((p) => p.type === 'module' && p.configSchema)
      for (const pkg of npmPackages) {
        sources.push(resolve(pkg.path, 'setup/**/*.vue'))
      }

      const directives = sources
        .map((src) => `@source "${toForwardSlash(relative(cssDir, src))}";`)
        .join('\n')

      return { code: directives + '\n' + code, map: null }
    }
  }
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
  app.use('/api/proxy', createProxyRoutes())
  app.use('/api/status', createStatusRoutes(packageRoot, projectRoot))
  app.use('/api/style', createStyleRoutes(projectRoot))

  app.get('/api/schema', (_req, res) => {
    const mergedSchema = injectModuleSchemas(schema, packageRoot, projectRoot)
    res.json(mergedSchema)
  })

  // Vite dev server as middleware for the setup client SPA
  const vite = await createViteServer({
    configFile: false,
    root: clientDir,
    server: {
      middlewareMode: true,
      fs: {
        allow: [packageRoot, projectRoot]
      }
    },
    appType: 'custom',
    plugins: [
      tailwindCustomSources(clientDir, packageRoot, projectRoot),
      tailwindcss(),
      vue()
    ],
    resolve: {
      alias: {
        '@setup': clientDir
      }
    },
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

/**
 * Merge dynamically discovered module schemas into the base schema.
 * Hardcoded sections in schema.js take precedence over discovered ones.
 */
function injectModuleSchemas(baseSchema, packageRoot, projectRoot) {
  const merged = JSON.parse(JSON.stringify(baseSchema))

  // Core modules: packageRoot/src/modules/*/setup.schema.json
  const coreModulesDir = resolve(packageRoot, 'src/modules')
  for (const { name, moduleDir, schema: moduleSchema } of scanModuleSchemas(coreModulesDir)) {
    if (!merged.modules.sections[name]) {
      merged.modules.sections[name] = moduleSchemaToSection(name, moduleSchema, moduleDir)
    }
  }

  // Local modules: projectRoot/modules/*/setup.schema.json
  const localModulesDir = resolve(projectRoot, 'modules')
  for (const { name, moduleDir, schema: moduleSchema } of scanModuleSchemas(localModulesDir)) {
    if (!merged.modules.sections[name]) {
      merged.modules.sections[name] = moduleSchemaToSection(name, moduleSchema, moduleDir)
    }
  }

  // NPM modules with configSchema
  const npmModules = discoverNpmPackages(projectRoot)
    .filter((p) => p.type === 'module' && p.configSchema)

  for (const pkg of npmModules) {
    const baseName = extractBaseName(pkg.name, 'module')
    if (!merged.modules.sections[baseName]) {
      merged.modules.sections[baseName] = moduleSchemaToSection(baseName, pkg.configSchema)
    }
  }

  return merged
}

/**
 * Scan a directory of module folders for setup.schema.json files.
 */
function scanModuleSchemas(modulesDir) {
  if (!existsSync(modulesDir)) return []

  const results = []
  try {
    const entries = readdirSync(modulesDir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const moduleSchema = loadSchema(resolve(modulesDir, entry.name))
      if (moduleSchema) {
        results.push({
          name: entry.name,
          moduleDir: resolve(modulesDir, entry.name),
          schema: moduleSchema
        })
      }
    }
  } catch {
    // Directory not readable
  }
  return results
}

/**
 * Convert a module's setup.schema.json into a setup wizard section.
 *
 * @param {string} name - Module name
 * @param {object} moduleSchema - Parsed setup.schema.json
 * @param {string} [moduleDir] - Absolute path to the module directory (for resolving component paths)
 */
function moduleSchemaToSection(name, moduleSchema, moduleDir) {
  const section = {
    file: moduleSchema.file || `${name}.yml`,
    label: moduleSchema.label || name,
    description: moduleSchema.description || ''
  }

  if (moduleSchema.editor === 'custom' && moduleSchema.component && moduleDir) {
    section.editor = 'custom'
    section.component = `/@fs/${toForwardSlash(resolve(moduleDir, moduleSchema.component))}`
    section.configKey = moduleSchema.configKey || null
  } else if (moduleSchema.editor) {
    section.editor = moduleSchema.editor
    section.configKey = moduleSchema.configKey || null
  } else {
    section.configKey = moduleSchema.configKey || null
    section.fields = moduleSchema.fields || {}
  }

  return section
}
