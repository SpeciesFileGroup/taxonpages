import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const modulesDir = join(root, 'src/modules')

// Custom setup editors live in src/, so Tailwind and Vite scan them during the
// *site* build — where the wizard's `@setup` alias does not exist. An import
// from the wizard client breaks the site's dependency scan while the wizard
// itself keeps working, so nothing else catches it.
// Use the globally registered Sw* components instead.
const FORBIDDEN = /from\s+['"](@setup\/|[^'"]*cli\/setup\/client)/

function customEditorFiles() {
  const files = []

  for (const name of readdirSync(modulesDir)) {
    const schemaPath = join(modulesDir, name, 'setup.schema.json')
    if (!existsSync(schemaPath)) continue

    const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'))
    if (schema.editor !== 'custom') continue

    const editorDir = dirname(resolve(modulesDir, name, schema.component))

    for (const file of readdirSync(editorDir, { recursive: true })) {
      if (/\.(vue|js)$/.test(file)) files.push(join(editorDir, file))
    }
  }

  return files
}

describe('custom setup editors', () => {
  const files = customEditorFiles()

  it('exist', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it.each(files.map((f) => [f.slice(root.length + 1), f]))(
    '%s does not import from the wizard client',
    (_, file) => {
      expect(readFileSync(file, 'utf-8')).not.toMatch(FORBIDDEN)
    }
  )
})
