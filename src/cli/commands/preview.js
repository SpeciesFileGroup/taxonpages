import { resolve } from 'node:path'
import { preview as vitePreview } from 'vite'
import { getViteConfig } from '../utils/resolveConfig.js'

export async function preview({ packageRoot, projectRoot, port }) {
  global.__basedir = projectRoot
  global.__packageRoot = packageRoot
  global.__tailwindCSSTaxonPagesConfigPath = resolve(
    packageRoot,
    'tailwind.config.cjs'
  )

  const config = getViteConfig({ packageRoot, projectRoot })

  const server = await vitePreview({
    configFile: false,
    ...config,
    build: {
      outDir: resolve(projectRoot, 'dist')
    },
    preview: {
      port: Number(port)
    }
  })

  server.printUrls()
}
