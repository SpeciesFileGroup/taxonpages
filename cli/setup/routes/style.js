import { Router } from 'express'
import { resolve } from 'node:path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'

/**
 * Create style API routes for reading/writing CSS variables.
 *
 * @param {string} projectRoot
 * @returns {Router}
 */
export function createStyleRoutes(projectRoot) {
  const router = Router()
  const stylePath = resolve(projectRoot, 'config/style/theme.css')

  /**
   * GET /api/style
   * Parses config/style/theme.css and returns CSS variables as JSON.
   */
  router.get('/', (_req, res) => {
    if (!existsSync(stylePath)) {
      return res.json({ light: {}, dark: {} })
    }

    try {
      const css = readFileSync(stylePath, 'utf-8')
      res.json(parseCssVariables(css))
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  /**
   * PUT /api/style
   * Receives { light: {}, dark: {} } and writes config/style/theme.css.
   */
  router.put('/', (req, res) => {
    const { light, dark } = req.body

    if (!light && !dark) {
      return res.status(400).json({ error: 'Missing light or dark in request body' })
    }

    try {
      const styleDir = resolve(projectRoot, 'config/style')

      if (!existsSync(styleDir)) {
        mkdirSync(styleDir, { recursive: true })
      }

      const css = generateCss(light || {}, dark || {})
      writeFileSync(stylePath, css, 'utf-8')
      res.json({ ok: true })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  return router
}

/**
 * Parse CSS variables from :root and .dark blocks.
 *
 * @param {string} css
 * @returns {{ light: Record<string, string>, dark: Record<string, string> }}
 */
function parseCssVariables(css) {
  const light = {}
  const dark = {}

  const blockRegex = /(:root|\.dark)\s*\{([^}]*)}/g
  let match

  while ((match = blockRegex.exec(css)) !== null) {
    const selector = match[1]
    const body = match[2]
    const target = selector === ':root' ? light : dark

    const varRegex = /(--tp-[\w-]+)\s*:\s*([^;]+);/g
    let varMatch

    while ((varMatch = varRegex.exec(body)) !== null) {
      target[varMatch[1]] = varMatch[2].trim()
    }
  }

  return { light, dark }
}

/**
 * Generate CSS string from light/dark variable objects.
 *
 * @param {Record<string, string>} light
 * @param {Record<string, string>} dark
 * @returns {string}
 */
function generateCss(light, dark) {
  const lines = []

  const lightEntries = Object.entries(light)
  const darkEntries = Object.entries(dark)

  if (lightEntries.length) {
    lines.push(':root {')
    for (const [key, value] of lightEntries) {
      lines.push(`  ${key}: ${value};`)
    }
    lines.push('}')
  }

  if (darkEntries.length) {
    if (lines.length) lines.push('')
    lines.push('.dark {')
    for (const [key, value] of darkEntries) {
      lines.push(`  ${key}: ${value};`)
    }
    lines.push('}')
  }

  return lines.join('\n') + '\n'
}
