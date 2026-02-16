import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { loadConfiguration } from '../../utils/loadConfiguration.js'
import { VitePluginRadar } from 'vite-plugin-radar'
import Vue from '@vitejs/plugin-vue'
import Markdown from 'unplugin-vue-markdown/vite'
import markdownAnchor from 'markdown-it-anchor'
import Pages from 'vite-plugin-pages'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import {
  relativeToRouterPlugin,
  variableReplacementPlugin
} from '../../plugins/markdown/index.js'
import { ViteRestart, projectStylesPlugin, componentRegistrationPlugin } from '../../plugins/vite/index.js'

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

  // Use user's index.html if it exists, otherwise fall back to the package's
  const root = existsSync(resolve(projectRoot, 'index.html'))
    ? projectRoot
    : packageRoot

  return {
    root,
    base: configuration.base_url,

    resolve: {
      alias: {
        '@': resolve(packageRoot, 'src'),
        '~': projectRoot
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
      postcss: {
        plugins: [
          tailwindcss({
            config: getTailwindConfigPath(packageRoot, projectRoot)
          }),
          autoprefixer()
        ]
      },
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler'
        }
      }
    },

    plugins: [
      componentRegistrationPlugin({ packageRoot, projectRoot }),
      projectStylesPlugin(projectRoot),

      ViteRestart({ dir: [resolve(projectRoot, 'config/**/*.yml')], projectRoot }),

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
 * Resolve the Tailwind config file path.
 * Prefers user's custom config at config/vendor/tailwind.config.cjs,
 * falls back to the package's default tailwind.config.cjs.
 */

function getTailwindConfigPath(packageRoot, projectRoot) {
  const userConfig = resolve(projectRoot, 'config/vendor/tailwind.config.cjs')
  if (existsSync(userConfig)) {
    return userConfig
  }
  return resolve(packageRoot, 'tailwind.config.cjs')
}
