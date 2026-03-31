import { resolve } from 'node:path'
import { existsSync, writeFileSync } from 'node:fs'
import { loadConfiguration } from '../../utils/loadConfiguration.js'
import { toForwardSlash } from '../../utils/paths.js'
import {
  discoverNpmPackages,
  discoverLocalPanels,
  discoverLocalModules,
  resolveConflicts
} from '../../plugins/vite/discoverPackages.js'
import { VitePluginRadar } from 'vite-plugin-radar'
import Vue from '@vitejs/plugin-vue'
import Markdown from 'unplugin-vue-markdown/vite'
import markdownAnchor from 'markdown-it-anchor'
import Pages from 'vite-plugin-pages'
import tailwindcss from '@tailwindcss/vite'
import {
  relativeToRouterPlugin,
  variableReplacementPlugin
} from '../../plugins/markdown/index.js'
import {
  ViteRestart,
  projectStylesPlugin,
  componentRegistrationPlugin
} from '../../plugins/vite/index.js'

/**
 * Build the full Vite configuration, resolving paths correctly
 * for both the installed package and the user's project directory.
 *
 * @param {object} options
 * @param {string} options.packageRoot - Absolute path to the taxonpages package
 * @param {string} options.projectRoot - Absolute path to the user's project (CWD)
 */
export function getViteConfig({ packageRoot, projectRoot }) {
  const configuration = loadConfiguration(projectRoot)

  writeTailwindSources(packageRoot, projectRoot, {
    disabled: configuration.packages?.disabled
  })

  // Use user's index.html if it exists, otherwise fall back to the package's
  const root = existsSync(resolve(projectRoot, 'index.html'))
    ? projectRoot
    : packageRoot

  return {
    root,
    base: configuration.base_url,

    server: {
      fs: {
        allow: [packageRoot, projectRoot]
      }
    },

    resolve: {
      alias: {
        '@': resolve(packageRoot, 'src'),
        '~': projectRoot,
        '@tailwind-config': existsSync(
          resolve(projectRoot, 'config/vendor/tailwind.css')
        )
          ? resolve(projectRoot, 'config/vendor/tailwind.css')
          : resolve(packageRoot, 'src/assets/css/tailwind.css')
      }
    },

    optimizeDeps: {
      include: [
        'leaflet',
        'leaflet.markercluster/dist/leaflet.markercluster',
        '@geoman-io/leaflet-geoman-free'
      ]
    },

    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler'
        }
      }
    },

    plugins: [
      tailwindcss(),

      componentRegistrationPlugin({
        packageRoot,
        projectRoot,
        disabled: configuration.packages?.disabled
      }),
      //projectStylesPlugin(projectRoot),

      ViteRestart({
        dir: [resolve(projectRoot, 'config/**/*.yml')],
        projectRoot
      }),

      Vue({
        include: [/\.vue$/, /\.md$/]
      }),

      Markdown({
        wrapperComponent: 'markdown-layout',
        markdownItSetup(md) {
          md.use(markdownAnchor)
          md.use(variableReplacementPlugin, {
            variables: { ...configuration }
          })
          md.use(relativeToRouterPlugin, configuration)
        }
      }),

      Pages({
        dirs: resolve(projectRoot, 'pages'),
        exclude: ['**/components/*.vue', 'components/**/*.vue'],
        extensions: ['vue', 'md'],
        extendRoute(route) {
          if (route.path === '/home') {
            route.alias = '/home'
            route.path = '/'
            return route
          }
        }
      }),

      VitePluginRadar({
        ...configuration?.analytics_services
      })
    ]
  }
}

/**
 * Write a physical CSS file with @source directives pointing to the user's
 * project directories and discovered NPM packages so Tailwind v4 scans
 * them for utility classes.
 *
 * @param {string} packageRoot
 * @param {string} projectRoot
 * @param {object} [options]
 * @param {string[]} [options.disabled] - Package names to skip
 */
function writeTailwindSources(packageRoot, projectRoot, options = {}) {
  const sourcesFile = resolve(packageRoot, 'src/assets/css/sources.css')

  // User project directories
  const sources = [
    `@source "${toForwardSlash(resolve(projectRoot, 'pages/**/*.{vue,md,js}'))}";`,
    `@source "${toForwardSlash(resolve(projectRoot, 'layouts/**/*.{vue,js}'))}";`,
    `@source "${toForwardSlash(resolve(projectRoot, 'modules/**/*.{vue,js}'))}";`,
    `@source "${toForwardSlash(resolve(projectRoot, 'panels/**/*.{vue,js}'))}";`,
    `@source "${toForwardSlash(resolve(projectRoot, 'components/**/*.{vue,js}'))}";`
  ]

  // Discover NPM packages and add their source directories
  const npmPackages = discoverNpmPackages(projectRoot, {
    disabled: options.disabled
  })
  const localPanels = discoverLocalPanels(projectRoot)
  const localModules = discoverLocalModules(projectRoot)

  const panels = resolveConflicts(
    localPanels,
    npmPackages.filter((p) => p.type === 'panel')
  ).filter((p) => p.source === 'npm')

  const modules = resolveConflicts(
    localModules,
    npmPackages.filter((p) => p.type === 'module')
  ).filter((p) => p.source === 'npm')

  for (const pkg of [...panels, ...modules]) {
    const pkgSource = toForwardSlash(resolve(pkg.path, '**/*.{vue,js}'))
    sources.push(`@source "${pkgSource}";`)
  }

  writeFileSync(sourcesFile, sources.join('\n') + '\n')
}
