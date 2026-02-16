#!/usr/bin/env node

import { createRequire } from 'node:module'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Command } from 'commander'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(__dirname, '..')
const require = createRequire(import.meta.url)
const { version, description } = require('../package.json')

const program = new Command()

program.name('taxonpages').description(description).version(version)

program
  .command('dev')
  .description('Start Vite development server with HMR (SPA mode)')
  .option('-p, --port <number>', 'port number', '5173')
  .option('--host [host]', 'expose to network')
  .action(async (options) => {
    const { startDev } = await import('../src/cli/commands/dev.js')
    await startDev({ packageRoot, projectRoot: process.cwd(), ...options })
  })

program
  .command('dev:ssr')
  .description('Start SSR development server')
  .option('-p, --port <number>', 'port number', '6173')
  .action(async (options) => {
    const { startDevSSR } = await import('../src/cli/commands/dev.js')
    await startDevSSR({ packageRoot, projectRoot: process.cwd(), ...options })
  })

program
  .command('build')
  .description('Build for production (SPA mode)')
  .action(async () => {
    const { runBuild } = await import('../src/cli/commands/build.js')
    await runBuild({ packageRoot, projectRoot: process.cwd(), mode: 'spa' })
  })

program
  .command('build:ssr')
  .description('Build for production (SSR mode)')
  .action(async () => {
    const { runBuild } = await import('../src/cli/commands/build.js')
    await runBuild({ packageRoot, projectRoot: process.cwd(), mode: 'ssr' })
  })

program
  .command('serve')
  .description('Start production SSR server')
  .option('-p, --port <number>', 'port number', '6173')
  .action(async (options) => {
    const { serve } = await import('../src/cli/commands/serve.js')
    await serve({ packageRoot, projectRoot: process.cwd(), ...options })
  })

program
  .command('preview')
  .description('Preview production build locally')
  .option('-p, --port <number>', 'port number', '4173')
  .action(async (options) => {
    const { preview } = await import('../src/cli/commands/preview.js')
    await preview({ packageRoot, projectRoot: process.cwd(), ...options })
  })

program
  .command('packages')
  .description('List discovered TaxonPages modules and panels')
  .action(async () => {
    const { listPackages } = await import('../src/cli/commands/packages.js')
    listPackages({ packageRoot, projectRoot: process.cwd() })
  })

program
  .command('init [directory]')
  .description('Scaffold a new TaxonPages project')
  .action(async (directory) => {
    const { init } = await import('../src/cli/commands/init.js')
    await init({ packageRoot, directory: directory || '.' })
  })

program.parse()
