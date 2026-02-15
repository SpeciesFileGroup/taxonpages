import { resolve } from 'node:path'

export async function serve({ packageRoot, projectRoot, port }) {
  global.__basedir = projectRoot
  global.__packageRoot = packageRoot
  global.__tailwindCSSTaxonPagesConfigPath = resolve(
    packageRoot,
    'tailwind.config.cjs'
  )

  process.env.NODE_ENV = 'production'

  const { createServer } = await import(
    resolve(packageRoot, 'server.js')
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
