import { defineConfig } from 'vite'
import { loadConfiguration } from './src/utils/loadConfiguration.js'
import path from 'path'
import Vue from '@vitejs/plugin-vue'
import Markdown from 'vite-plugin-md'
import markdownAnchor from 'markdown-it-anchor'
import markdownRelativeToRouter from './src/plugins/markdown/relativeToRouter.js'
import Pages from 'vite-plugin-pages'
import './src/utils/globalVars'

export default () => {
  const configuration = loadConfiguration(__dirname)

  return defineConfig({
    base: configuration.base_url,
    define: {
      __APP_ENV__: configuration
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '#': path.resolve(__dirname)
      }
    },
    plugins: [
      Vue({
        include: [/\.vue$/, /\.md$/]
      }),
      Markdown({
        wrapperClasses:
          '!container mx-auto p-4 sm:pl-0 sm:pr-0 prose dark:prose-invert box-border',
        markdownItSetup(md) {
          md.use(markdownAnchor)
        },
        markdownItUses: [markdownRelativeToRouter]
      }),
      Pages({
        dirs: 'pages',
        exclude: ['**/components/*.vue'],
        extensions: ['vue', 'md'],
        extendRoute(route) {
          if (route.path === '/home') {
            route.alias = '/home'
            route.path = '/'

            return route
          }
        }
      })
    ]
  })
}
