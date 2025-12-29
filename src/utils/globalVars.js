import path from 'node:path'

global.__basedir = process.cwd()
global.__tailwindCSSTaxonPagesConfigPath = path.resolve(
  process.cwd(),
  'tailwind.config.cjs'
)
