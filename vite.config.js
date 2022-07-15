import { defineConfig, loadEnv } from 'vite'
import { loadConfiguration } from './src/utils/loadConfiguration.js'
import path from 'path'
import htmlPlugin from './src/plugins/htmlPlugin.js'
import Vue from '@vitejs/plugin-vue'
import Markdown from 'vite-plugin-md'
import Pages from 'vite-plugin-pages'

export default () => {
  const configuration = loadConfiguration(__dirname)

  return defineConfig({
    base: configuration.base_url,
    define: {
     __APP_ENV__: configuration,
     __APP_PATH__: () => __dirname
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      },
    },
    plugins: [
      Vue({
        include: [/\.vue$/, /\.md$/]
      }),
      Markdown(),
      Pages({
        dirs: 'pages',
        extensions: ['vue', 'md'],
        extendRoute(route) {
          if (route.path === '/home') {
            route.alias = '/home'
            route.path = '/'

            return route
          }
        }
      }),
      htmlPlugin(configuration)
    ],
  })
}
