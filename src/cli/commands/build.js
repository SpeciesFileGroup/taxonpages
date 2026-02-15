import { resolve } from 'node:path'
import { build as viteBuild } from 'vite'
import { getViteConfig } from '../utils/resolveConfig.js'

export async function runBuild({ packageRoot, projectRoot, mode }) {
  setGlobalVars(packageRoot, projectRoot)

  const config = getViteConfig({ packageRoot, projectRoot })

  if (mode === 'spa') {
    await viteBuild({
      configFile: false,
      ...config,
      build: {
        outDir: resolve(projectRoot, 'dist')
      }
    })
    console.log('SPA build complete. Output: dist/')
    return
  }

  // SSR mode: build client then server
  console.log('Building client bundle...')
  await viteBuild({
    configFile: false,
    ...config,
    build: {
      ssrManifest: true,
      outDir: resolve(projectRoot, 'dist/client')
    }
  })

  console.log('Building server bundle...')
  await viteBuild({
    configFile: false,
    ...config,
    resolve: {
      ...config.resolve,
      dedupe: ['vue', 'vue-router', 'pinia']
    },
    ssr: {
      noExternal: true
    },
    build: {
      ssr: resolve(packageRoot, 'src/entry-server.js'),
      outDir: resolve(projectRoot, 'dist/server')
    }
  })

  console.log('SSR build complete. Output: dist/client/ and dist/server/')
}

function setGlobalVars(packageRoot, projectRoot) {
  global.__basedir = projectRoot
  global.__packageRoot = packageRoot
  global.__tailwindCSSTaxonPagesConfigPath = resolve(
    packageRoot,
    'tailwind.config.cjs'
  )
}
