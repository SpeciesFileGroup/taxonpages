import { defineConfig, loadEnv } from 'vite'
import { loadConfiguration } from './src/utils/loadConfiguration.js'
import Vue from '@vitejs/plugin-vue'
import Markdown from 'vite-plugin-md'
import path from 'path'
import Pages from 'vite-plugin-pages'
import Content from '@originjs/vite-plugin-content'

export default ({ mode }) => {
  const { VITE_BASE_URL } = loadEnv(mode, process.cwd())

  return defineConfig({
    base: VITE_BASE_URL,
    define: {
     __APP_ENV__: loadConfiguration(__dirname),
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
      Content(),
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
      })
    ],
  })
}
