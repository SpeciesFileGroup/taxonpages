import { Router } from 'express'
import { resolve, join, basename } from 'node:path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { glob } from 'glob'
import yaml from 'js-yaml'
import { toForwardSlash } from '../../../src/utils/paths.js'

/**
 * Create config API routes.
 *
 * @param {string} projectRoot
 * @returns {Router}
 */
export function createConfigRoutes(projectRoot) {
  const router = Router()
  const configDir = resolve(projectRoot, 'config')

  /**
   * GET /api/config
   * Returns all config files as an object keyed by filename.
   */
  router.get('/', (req, res) => {
    const files = getConfigFiles(configDir)
    const result = {}

    for (const filePath of files) {
      const filename = basename(filePath)

      try {
        const content = readFileSync(filePath, 'utf-8')
        result[filename] = {
          filename,
          content: yaml.load(content) || {},
          raw: content
        }
      } catch (err) {
        result[filename] = {
          filename,
          content: {},
          raw: '',
          error: err.message
        }
      }
    }

    res.json(result)
  })

  /**
   * GET /api/config/:filename
   * Returns a single config file's parsed content.
   */
  router.get('/:filename', (req, res) => {
    const { filename } = req.params

    if (!isValidFilename(filename)) {
      return res.status(400).json({ error: 'Invalid filename' })
    }

    const filePath = resolve(configDir, filename)

    if (!filePath.startsWith(configDir)) {
      return res.status(403).json({ error: 'Path traversal not allowed' })
    }

    if (!existsSync(filePath)) {
      return res.json({ filename, content: {}, raw: '' })
    }

    try {
      const raw = readFileSync(filePath, 'utf-8')
      res.json({ filename, content: yaml.load(raw) || {}, raw })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  /**
   * PUT /api/config/:filename
   * Writes updated content to a config file.
   * Accepts JSON body: { content: object }
   */
  router.put('/:filename', (req, res) => {
    const { filename } = req.params

    if (!isValidFilename(filename)) {
      return res.status(400).json({ error: 'Invalid filename' })
    }

    const filePath = resolve(configDir, filename)

    if (!filePath.startsWith(configDir)) {
      return res.status(403).json({ error: 'Path traversal not allowed' })
    }

    const { content } = req.body

    if (content === undefined) {
      return res.status(400).json({ error: 'Missing content in request body' })
    }

    try {
      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true })
      }

      const yamlStr = yaml.dump(content, { lineWidth: -1, noRefs: true })
      writeFileSync(filePath, `---\n${yamlStr}`, 'utf-8')
      res.json({ ok: true, filename })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  return router
}

function getConfigFiles(configDir) {
  if (!existsSync(configDir)) return []

  return glob.sync(toForwardSlash(join(configDir, '*.yml')))
}

function isValidFilename(filename) {
  return /^[\w.-]+\.yml$/.test(filename) && !filename.includes('..')
}
