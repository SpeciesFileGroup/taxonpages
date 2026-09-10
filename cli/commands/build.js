import { resolve } from 'node:path'
import { build as viteBuild } from 'vite'
import { getViteConfig } from '../utils/resolveConfig.js'

export async function runBuild({ packageRoot, projectRoot, mode }) {
  setGlobalVars(packageRoot, projectRoot)

  const config = await getViteConfig({
    packageRoot,
    projectRoot,
    ssr: mode === 'ssr'
  })

  if (mode === 'spa') {
    await viteBuild({
      configFile: false,
      ...config,
      build: {
        ...config.build,
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
      ...config.build,
      ssrManifest: true,
      outDir: resolve(projectRoot, 'dist/client')
    }
  })

  console.log('Building server bundle...')
  await viteBuild({
    configFile: false,
    ...config,
    ssr: {
      ...config.ssr,
      noExternal: true
    },
    build: {
      ...config.build,
      ssr: resolve(packageRoot, 'src/entry-server.js'),
      outDir: resolve(projectRoot, 'dist/server')
    }
  })

  console.log('SSR build complete. Output: dist/client/ and dist/server/')
}

function setGlobalVars(packageRoot, projectRoot) {
  global.__basedir = projectRoot
  global.__packageRoot = packageRoot
}
