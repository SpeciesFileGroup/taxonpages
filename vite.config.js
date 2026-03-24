import { defineConfig } from 'vite'
import { loadConfiguration } from './src/utils/loadConfiguration.js'
import { VitePluginRadar } from 'vite-plugin-radar'
import path from 'path'
import { fileURLToPath } from 'node:url'
import Vue from '@vitejs/plugin-vue'
import Markdown from 'unplugin-vue-markdown/vite'
import markdownAnchor from 'markdown-it-anchor'
import { ViteRestart, projectStylesPlugin } from './src/plugins/vite'
import {
  relativeToRouterPlugin,
  variableReplacementPlugin
} from './src/plugins/markdown'
import Pages from 'vite-plugin-pages'
import tailwindcss from '@tailwindcss/vite'
import { writeFileSync } from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Vite configuration factory.
 *
 * Supports two modes:
 * 1. Direct invocation via `vite` CLI (backward compatible) — uses __dirname as both package and project root.
 * 2. Programmatic invocation via the taxonpages CLI — receives configEnv with packageRoot/projectRoot.
 */
export default (configEnv = {}) => {
  const packageRoot = configEnv.packageRoot || __dirname
  const projectRoot = configEnv.projectRoot || process.cwd()

  const configuration = loadConfiguration(projectRoot)

  // Write @source directives so Tailwind v4 scans user project files
  const sourcesContent = [
    `@source "${path.resolve(projectRoot, 'pages/**/*.{vue,md}')}";`,
    `@source "${path.resolve(projectRoot, 'layouts/**/*.vue')}";`,
    `@source "${path.resolve(projectRoot, 'modules/**/*.vue')}";`,
    `@source "${path.resolve(projectRoot, 'panels/**/*.vue')}";`,
    `@source "${path.resolve(projectRoot, 'components/**/*.vue')}";`
  ].join('\n') + '\n'
  writeFileSync(path.resolve(packageRoot, 'src/assets/css/sources.css'), sourcesContent)

  return defineConfig({
    base: configuration.base_url,
    define: {
      __APP_ENV__: configuration
    },

    resolve: {
      alias: {
        '@': path.resolve(packageRoot, './src'),
        '~': path.resolve(projectRoot)
      }
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

      ViteRestart({ dir: [path.resolve(projectRoot, 'config/**/*.yml')] }),

      //projectStylesPlugin(projectRoot),

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
        dirs: path.resolve(projectRoot, 'pages'),
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
  })
}
