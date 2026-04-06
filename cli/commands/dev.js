import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createServer as createViteServer } from 'vite'
import { getViteConfig } from '../utils/resolveConfig.js'

export async function startDev({ packageRoot, projectRoot, port, host }) {
  setGlobalVars(packageRoot, projectRoot)

  const config = await getViteConfig({ packageRoot, projectRoot })

  const server = await createViteServer({
    configFile: false,
    ...config,
    server: {
      port: Number(port),
      host: host === true ? '0.0.0.0' : host
    }
  })

  await server.listen()
  server.printUrls()
}

export async function startDevSSR({ packageRoot, projectRoot, port }) {
  setGlobalVars(packageRoot, projectRoot)

  const { createServer } = await import(
    pathToFileURL(resolve(packageRoot, 'server.js')).href
  )

  const { httpServer } = await createServer({
    projectRoot,
    packageRoot,
    isProd: false
  })

  httpServer.listen(Number(port), () => {
    console.log(`TaxonPages SSR dev server running at http://localhost:${port}`)
  })
}

function setGlobalVars(packageRoot, projectRoot) {
  global.__basedir = projectRoot
  global.__packageRoot = packageRoot
}
