import { createRequire } from 'node:module'
import { resolve, basename } from 'node:path'
import { existsSync, mkdirSync, cpSync, readdirSync, writeFileSync } from 'node:fs'

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

  const packageJsonPath = resolve(targetDir, 'package.json')

  if (!existsSync(packageJsonPath)) {
    const require = createRequire(import.meta.url)
    const { version: taxonpagesVersion } = require('../../../package.json')

    const pkg = {
      name: projectName,
      private: true,
      type: 'module',
      scripts: {
        dev: 'taxonpages dev',
        'dev:ssr': 'taxonpages dev:ssr',
        build: 'taxonpages build',
        'build:ssr': 'taxonpages build:ssr',
        serve: 'taxonpages serve',
        preview: 'taxonpages preview'
      },
      dependencies: {
        '@sfgrp/taxonpages': `^${taxonpagesVersion}`
      }
    }

    writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n')
  }

  const cdInstruction = directory !== '.' ? `  cd ${directory}\n` : ''

  console.log(`
TaxonPages project "${projectName}" created successfully!

Next steps:
${cdInstruction}  1. Run: npm install
  2. Edit config/api.yml with your TaxonWorks API URL and project token
  3. Edit config/project.yml with your project metadata
  4. Run: npm run dev
`)
}
