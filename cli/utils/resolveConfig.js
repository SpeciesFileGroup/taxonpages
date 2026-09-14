import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { mergeConfig } from 'vite'
import { loadConfiguration } from '../../src/utils/loadConfiguration.js'
import { writeTailwindSources } from '../../src/plugins/vite/writeTailwindSources.js'
import { loadPlugins } from './loadPlugins.js'
import { DEDUPE_PACKAGES } from './dedupe.js'
import { VitePluginRadar } from 'vite-plugin-radar'
import Vue from '@vitejs/plugin-vue'
import Markdown from 'unplugin-vue-markdown/vite'
import markdownAnchor from 'markdown-it-anchor'
import VueRouter from 'vue-router/vite'
import tailwindcss from '@tailwindcss/vite'
import {
  relativeToRouterPlugin,
  variableReplacementPlugin
} from '../../src/plugins/markdown/index.js'
import {
  ViteRestart,
  ViteRestartOnRouteDelete,
  ViteRestartOnEntryChange,
  componentRegistrationPlugin,
  localeDiscoveryPlugin
} from '../../src/plugins/vite/index.js'
import { pluginInjectionPlugin } from '../../src/plugins/vite/pluginInjection.js'
import {
  pageTranslationsPlugin,
  translatedPagePatterns,
  findTranslations,
  warnOrphanTranslations,
  pageVirtualId
} from '../../src/plugins/vite/pageTranslations.js'
import { resolveI18nConfig } from '../../src/i18n/config.js'
import { faviconInjectionPlugin } from '../../src/plugins/vite/faviconInjection.js'

/**
 * Build the full Vite configuration, resolving paths correctly
 * for both the installed package and the user's project directory.
 *
 * @param {object} options
 * @param {string} options.packageRoot - Absolute path to the taxonpages package
 * @param {string} options.projectRoot - Absolute path to the user's project (CWD)
 * @param {boolean} [options.ssr] - Whether this config is for an SSR build/server
 */
export async function getViteConfig({ packageRoot, projectRoot, ssr = false }) {
  const configuration = loadConfiguration(projectRoot)

  writeTailwindSources(packageRoot, projectRoot, {
    disabled: configuration.packages?.disabled
  })

  // Use user's index.html if it exists, otherwise fall back to the package's
  const root = existsSync(resolve(projectRoot, 'index.html'))
    ? projectRoot
    : packageRoot

  const { locales, defaultLocale } = resolveI18nConfig(configuration)
  const translatableLocales = locales.filter((code) => code !== defaultLocale)

  const routesConfig = {
    routesFolder: [resolve(projectRoot, 'pages')],
    exclude: [
      '**/components/*.vue',
      'components/**/*.vue',
      // about.es.md is a variant of about.md, not a route of its own
      ...translatedPagePatterns(translatableLocales)
    ],
    extensions: ['.vue', '.md']
  }

  warnOrphanTranslations(resolve(projectRoot, 'pages'), translatableLocales)

  const config = {
    root,
    publicDir: resolve(projectRoot, 'public'),
    base: configuration.base_url,

    define: {
      // vue-i18n build flags. We only use the Composition API, so the legacy
      // Options API runtime and the production devtools hooks are dead code —
      // these let the bundler drop them.
      __VUE_I18N_FULL_INSTALL__: false,
      __VUE_I18N_LEGACY_API__: false,
      __INTLIFY_PROD_DEVTOOLS__: false
    },

    server: {
      fs: {
        allow: [packageRoot, projectRoot]
      }
    },

    resolve: {
      // Force a single copy of every package that keeps module-scoped state.
      // Vite resolves these from `config.root` (the package root, unless the
      // project ships its own index.html) instead of from each importer, so a
      // panel, module or component library that carries its own nested copy
      // still shares the app's instance. `taxonpages doctor` reports the
      // duplicates this papers over.
      dedupe: DEDUPE_PACKAGES,

      alias: {
        '@': resolve(packageRoot, 'src'),
        '~': projectRoot,
        '@tailwind-config': existsSync(
          resolve(projectRoot, 'config/vendor/tailwind.css')
        )
          ? resolve(projectRoot, 'config/vendor/tailwind.css')
          : resolve(packageRoot, 'src/assets/css/tailwind.css'),
        '@fonts-config': existsSync(
          resolve(projectRoot, 'config/vendor/fonts.css')
        )
          ? resolve(projectRoot, 'config/vendor/fonts.css')
          : resolve(packageRoot, 'src/assets/css/fonts.css')
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

      localeDiscoveryPlugin({
        packageRoot,
        projectRoot,
        locales: resolveI18nConfig(configuration).locales,
        disabled: configuration.packages?.disabled
      }),

      faviconInjectionPlugin({ projectRoot }),

      ViteRestart({
        dir: [
          resolve(projectRoot, 'config/**/*.yml'),
          resolve(projectRoot, 'public/favicon.*'),
          resolve(projectRoot, 'public/apple-touch-icon.*')
        ],
        projectRoot,
        ssr
      }),

      ViteRestartOnRouteDelete(routesConfig),

      ViteRestartOnEntryChange({
        entries: [
          resolve(projectRoot, 'modules/**/router/*.js'),
          resolve(projectRoot, 'panels/*/main.js')
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

      pageTranslationsPlugin(),

      VueRouter({
        ...routesConfig,
        async extendRoute(route) {
          if (route.path === '/home') {
            route.path = '/'
            route.addAlias('/home')
          }

          // Swap any page that has locale variants for a wrapper holding all of
          // them. Pages without variants — every page on a single-locale site —
          // keep their component untouched.
          if (translatableLocales.length === 0) return

          for (const [name, file] of route.components) {
            const translations = findTranslations(file, translatableLocales)

            if (Object.keys(translations).length === 0) continue

            route.components.set(name, pageVirtualId(file, translations))
          }
        }
      }),

      VitePluginRadar({
        ...configuration?.analytics_services
      })
    ]
  }

  // Apply vite() hooks from discovered plugins.
  // Protected keys (root, base, resolve.alias, resolve.dedupe) cannot be overridden.
  const plugins = await loadPlugins({ projectRoot, packageRoot, configuration })
  const protectedKeys = { root: config.root, base: config.base }
  const protectedAliases = { ...config.resolve.alias }
  const protectedDedupe = [...config.resolve.dedupe]

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

  // Plugins may add to the dedupe list (mergeConfig concatenates arrays) but
  // must not be able to drop an entry the framework depends on.
  config.resolve.dedupe = [
    ...new Set([...protectedDedupe, ...(config.resolve.dedupe || [])])
  ]

  return config
}
