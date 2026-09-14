import { Router } from 'express'
import { resolve, relative, join } from 'node:path'
import { existsSync } from 'node:fs'
import { globSync } from 'glob'
import { loadConfiguration } from '../../../src/utils/loadConfiguration.js'
import { resolveI18nConfig } from '../../../src/i18n/config.js'
import { toForwardSlash } from '../../../src/utils/paths.js'

/**
 * Create i18n API routes.
 *
 * The wizard needs to know which locales a site is built for before it can
 * render a translated value: the rule that tells a translation map apart from
 * an ordinary config object is "every key is a configured locale", so without
 * the locale list the client cannot classify a value at all.
 *
 * The resolved settings and the raw `i18n` block are both returned. The raw
 * block is what `isLocaleMap`/`localize` from `src/i18n` expect as their
 * `configuration` argument, so the client can call the very same functions the
 * site uses at runtime rather than reimplementing the rule.
 *
 * @param {string} projectRoot
 * @returns {Router}
 */
export function createI18nRoutes(projectRoot) {
  const router = Router()

  router.get('/', (_req, res) => {
    try {
      const configuration = loadConfiguration(projectRoot)
      const resolved = resolveI18nConfig(configuration)

      res.json({
        ...resolved,
        // Whether the site opted into i18n at all. Without the file a site is
        // single-locale and the wizard must behave exactly as it did before.
        configured: existsSync(resolve(projectRoot, 'config', 'i18n.yml')),
        // Shaped for isLocaleMap(value, configuration).
        configuration: { i18n: configuration.i18n ?? {} }
      })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  /**
   * GET /api/i18n/usage
   * What exists on disk for each locale, so removing one can say what it
   * would strand.
   *
   * Files only. Translated values inside config are counted in the client,
   * where unsaved edits are visible — a locale the user has just typed text
   * into must count as used.
   */
  router.get('/usage', (_req, res) => {
    try {
      const configuration = loadConfiguration(projectRoot)
      const { locales } = resolveI18nConfig(configuration)
      const usage = {}

      for (const locale of locales) {
        usage[locale] = {
          pages: findTranslatedPages(projectRoot, locale),
          catalog: existsSync(
            resolve(projectRoot, 'locales', `${locale}.yml`)
          )
        }
      }

      res.json(usage)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  return router
}

/**
 * Page files carrying a locale suffix, as project-relative paths.
 *
 * One glob per extension rather than a `{md,vue}` group: brace groups are not
 * expanded uniformly across glob implementations, and this has bitten the
 * locale patterns elsewhere in the codebase.
 *
 * @param {string} projectRoot
 * @param {string} locale
 * @returns {string[]}
 */
function findTranslatedPages(projectRoot, locale) {
  const pagesDir = resolve(projectRoot, 'pages')

  if (!existsSync(pagesDir)) return []

  return ['md', 'vue']
    .flatMap((ext) =>
      globSync(toForwardSlash(join(pagesDir, '**', `*.${locale}.${ext}`)))
    )
    .map((filePath) => toForwardSlash(relative(projectRoot, filePath)))
    .sort()
}
