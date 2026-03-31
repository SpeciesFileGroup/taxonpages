import express from 'express'
import { resolve, dirname } from 'node:path'
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
import {
  customEditorPlugin,
  VIRTUAL_EDITOR_PREFIX
} from './plugins/customEditorPlugin.js'
import { tailwindCustomSources } from './plugins/tailwindCustomSources.js'
import schema from './schema.js'
import {
  discoverNpmPackages,
  extractBaseName,
  loadSchema
} from '../../src/plugins/vite/discoverPackages.js'

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
 * Scan all module sources for custom editor components and return
 * a map of editor name -> absolute file path.
 *
 * @param {string} packageRoot
 * @param {string} projectRoot
 * @returns {Map<string, string>}
 */
function discoverCustomEditors(packageRoot, projectRoot) {
  const editors = new Map()

  // Core modules
  for (const { name, moduleDir, schema: moduleSchema } of scanModuleSchemas(resolve(packageRoot, 'src/modules'))) {
    if (moduleSchema.editor === 'custom' && moduleSchema.component) {
      editors.set(name, resolve(moduleDir, moduleSchema.component))
    }
  }

  // Local modules
  for (const { name, moduleDir, schema: moduleSchema } of scanModuleSchemas(resolve(projectRoot, 'modules'))) {
    if (moduleSchema.editor === 'custom' && moduleSchema.component) {
      editors.set(name, resolve(moduleDir, moduleSchema.component))
    }
  }

  // NPM modules
  const npmModules = discoverNpmPackages(projectRoot)
    .filter((p) => p.type === 'module' && p.configSchema)

  for (const pkg of npmModules) {
    const baseName = extractBaseName(pkg.name, 'module')
    if (pkg.configSchema.editor === 'custom' && pkg.configSchema.component) {
      editors.set(baseName, resolve(pkg.path, pkg.configSchema.component))
    }
  }

  return editors
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

  // Discover custom editors before starting Vite so they can be
  // registered as virtual modules in the normal module graph.
  const editorMap = discoverCustomEditors(packageRoot, projectRoot)

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
    cacheDir: resolve(projectRoot, 'node_modules/.vite-setup'),
    plugins: [
      customEditorPlugin(editorMap),
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
 * Custom editors use virtual:editor/<name> identifiers that are resolved
 * by the customEditorPlugin to actual file paths on disk.
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
    section.component = `${VIRTUAL_EDITOR_PREFIX}${name}`
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
