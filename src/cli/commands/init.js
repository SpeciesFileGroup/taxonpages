import { resolve, basename } from 'node:path'
import { existsSync, mkdirSync, cpSync, readdirSync } from 'node:fs'

export async function init({ packageRoot, directory }) {
  const targetDir = resolve(process.cwd(), directory)
  const projectName = basename(targetDir)

  if (existsSync(targetDir) && directory !== '.') {
    const contents = readdirSync(targetDir)
    if (contents.length > 0) {
      console.error(`Error: Directory "${directory}" is not empty.`)
      process.exit(1)
    }
  }

  mkdirSync(targetDir, { recursive: true })

  const templatesDir = resolve(packageRoot, 'templates')

  if (!existsSync(templatesDir)) {
    console.error('Error: Templates directory not found in the package.')
    process.exit(1)
  }

  cpSync(templatesDir, targetDir, { recursive: true })

  const cdInstruction = directory !== '.' ? `  cd ${directory}\n` : ''

  console.log(`
TaxonPages project "${projectName}" created successfully!

Next steps:
${cdInstruction}  1. Edit config/api.yml with your TaxonWorks API URL and project token
  2. Edit config/project.yml with your project metadata
  3. Run: taxonpages dev
`)
}
