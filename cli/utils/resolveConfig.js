import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { mergeConfig } from 'vite'
import { loadConfiguration } from '../../src/utils/loadConfiguration.js'
import { writeTailwindSources } from '../../src/plugins/vite/writeTailwindSources.js'
import { loadPlugins } from './loadPlugins.js'
import { VitePluginRadar } from 'vite-plugin-radar'
import Vue from '@vitejs/plugin-vue'
import Markdown from 'unplugin-vue-markdown/vite'
import markdownAnchor from 'markdown-it-anchor'
import Pages from 'vite-plugin-pages'
import tailwindcss from '@tailwindcss/vite'
import {
  relativeToRouterPlugin,
  variableReplacementPlugin
} from '../../src/plugins/markdown/index.js'
import {
  ViteRestart,
  projectStylesPlugin,
  componentRegistrationPlugin
} from '../../src/plugins/vite/index.js'
import { pluginInjectionPlugin } from '../../src/plugins/vite/pluginInjection.js'

/**
 * Build the full Vite configuration, resolving paths correctly
 * for both the installed package and the user's project directory.
 *
 * @param {object} options
 * @param {string} options.packageRoot - Absolute path to the taxonpages package
 * @param {string} options.projectRoot - Absolute path to the user's project (CWD)
 */
export async function getViteConfig({ packageRoot, projectRoot }) {
  const configuration = loadConfiguration(projectRoot)

  writeTailwindSources(packageRoot, projectRoot, {
    disabled: configuration.packages?.disabled
  })

  // Use user's index.html if it exists, otherwise fall back to the package's
  const root = existsSync(resolve(projectRoot, 'index.html'))
    ? projectRoot
    : packageRoot

  const config = {
    root,
    publicDir: resolve(projectRoot, 'public'),
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

      pluginInjectionPlugin({
        projectRoot,
        packageRoot,
        disabled: configuration.packages?.disabled
      }),
      //projectStylesPlugin(projectRoot),

      ViteRestart({
        dir: [
          resolve(projectRoot, 'config/**/*.yml'),
        ],
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

  // Apply vite() hooks from discovered plugins.
  // Protected keys (root, base, resolve.alias) cannot be overridden.
  const plugins = await loadPlugins({ projectRoot, packageRoot, configuration })
  const protectedKeys = { root: config.root, base: config.base }
  const protectedAliases = { ...config.resolve.alias }

  for (const plugin of plugins) {
    if (typeof plugin.vite !== 'function') continue

    try {
      const additions = plugin.vite(config)
      if (!additions || typeof additions !== 'object') continue

      Object.assign(config, mergeConfig(config, additions))
    } catch (err) {
      console.error(
        `[taxonpages] Plugin "${plugin.name}" vite() hook failed:`,
        err.message
      )
    }
  }

  // Restore protected keys
  config.root = protectedKeys.root
  config.base = protectedKeys.base
  config.resolve.alias = protectedAliases

  return config
}
