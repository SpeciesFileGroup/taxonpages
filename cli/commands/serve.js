import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export async function serve({ packageRoot, projectRoot, port }) {
  global.__basedir = projectRoot
  global.__packageRoot = packageRoot

  process.env.NODE_ENV = 'production'

  const { createServer } = await import(
    pathToFileURL(resolve(packageRoot, 'server.js')).href
  )

  const { app } = await createServer({
    projectRoot,
    packageRoot,
    isProd: true
  })

  app.listen(Number(port), () => {
    console.log(`TaxonPages production server running at http://localhost:${port}`)
  })
}
