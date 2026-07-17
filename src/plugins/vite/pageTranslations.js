/**
 * Locale variants for pages in ~/pages.
 *
 * A page is translated by adding a sibling with the locale in its name:
 *
 *   pages/about.md       <- default locale
 *   pages/about.es.md    <- Spanish
 *   pages/grants.md      <- no translation; /es/grants serves this
 *
 * The suffix is additive: it needs no restructuring, it is opt-in per page, and
 * the fallback is simply the absence of a file. It extends a convention the
 * project already uses for config (`api.development.yml`).
 *
 * The locale lives in the router's history base, so /es/about and /about are
 * the *same* route — there is no second route to point at a second file.
 * Instead the route's component is swapped for a generated wrapper that holds
 * every variant and renders the one matching the active locale. Pages with no
 * translation are left completely untouched.
 */

import { existsSync } from 'node:fs'
import { extname, dirname, basename, join, relative } from 'node:path'
import { globSync } from 'glob'
import { toForwardSlash } from '../../utils/paths.js'

const VIRTUAL_PREFIX = 'virtual:taxonpages-page/'
const RESOLVED_PREFIX = '\0' + VIRTUAL_PREFIX

// Extensions the route scanner accepts, and so the extensions a translation may
// use. A page's translation need not match its extension: home.vue is perfectly
// well translated by home.es.md — the wrapper renders whichever component the
// locale resolves to, and markdown is usually what a translator wants to write.
const PAGE_EXTENSIONS = ['.md', '.vue']

/**
 * Glob patterns matching translated page files, for the route scanner's
 * `exclude`. Without these, `about.es.md` would become its own `/about.es`
 * route.
 *
 * One pattern per locale rather than a `{a,b}` alternation: a brace group with
 * a single member is not expanded by every glob implementation, so a one-locale
 * site would silently match nothing.
 *
 * @param {string[]} locales
 * @returns {string[]}
 */
export function translatedPagePatterns(locales) {
  return locales.map((locale) => `**/*.${locale}.{vue,md}`)
}

/**
 * Find the translations of a page file.
 *
 * Matching is by base name, not by extension, so `home.vue` is translated by
 * `home.es.md`. When a locale somehow has two variants, the one sharing the
 * page's own extension wins and the clash is reported — silently picking one
 * would be worse.
 *
 * @param {string} filePath - Absolute path of the default-locale page
 * @param {string[]} locales - Locales to look for
 * @returns {Record<string, string>} locale -> absolute path, for those present
 */
export function findTranslations(filePath, locales) {
  const ext = extname(filePath)
  const dir = dirname(filePath)
  const name = basename(filePath, ext)
  const found = {}

  // The page's own extension first, so it wins a tie.
  const extensions = [ext, ...PAGE_EXTENSIONS.filter((e) => e !== ext)]

  for (const locale of locales) {
    const candidates = extensions
      .map((e) => join(dir, `${name}.${locale}${e}`))
      .filter((candidate) => existsSync(candidate))

    if (candidates.length === 0) continue

    if (candidates.length > 1) {
      console.warn(
        `[taxonpages] Page "${name}" has more than one "${locale}" translation ` +
          `(${candidates.map((c) => basename(c)).join(', ')}). ` +
          `Using ${basename(candidates[0])}; remove the others.`
      )
    }

    found[locale] = candidates[0]
  }

  return found
}

/**
 * Warn about translated pages that translate nothing.
 *
 * A translation is discovered from its base page, so one whose base is missing
 * — a typo, or a page that was renamed or deleted — is excluded from routing
 * and never picked up: it simply vanishes. Failing loudly at startup beats a
 * page that is silently not there.
 *
 * @param {string} pagesDir - Absolute path to ~/pages
 * @param {string[]} locales - Locales that carry a suffix
 */
export function warnOrphanTranslations(pagesDir, locales) {
  if (locales.length === 0 || !existsSync(pagesDir)) return

  // Per-locale patterns: see translatedPagePatterns for why not a brace group.
  const files = translatedPagePatterns(locales).flatMap((pattern) =>
    globSync(pattern, { cwd: pagesDir, absolute: true })
  )

  for (const file of files) {
    const ext = extname(file)
    const withoutExt = basename(file, ext)
    const locale = extname(withoutExt).slice(1)
    const base = basename(withoutExt, `.${locale}`)
    const dir = dirname(file)

    const hasBase = PAGE_EXTENSIONS.some((e) =>
      existsSync(join(dir, `${base}${e}`))
    )

    if (!hasBase) {
      console.warn(
        `[taxonpages] "${toForwardSlash(relative(pagesDir, file))}" translates a page ` +
          `that does not exist (looked for ${base}.md or ${base}.vue). ` +
          `It will not be served — check the file name.`
      )
    }
  }
}

/**
 * Vite plugin serving the generated wrapper components.
 *
 * @returns {import('vite').Plugin}
 */
export function pageTranslationsPlugin() {
  return {
    name: 'taxonpages:page-translations',

    resolveId(id) {
      if (id.startsWith(VIRTUAL_PREFIX)) return '\0' + id
    },

    load(id) {
      if (!id.startsWith(RESOLVED_PREFIX)) return

      const payload = id.slice(RESOLVED_PREFIX.length)
      const { file, translations } = JSON.parse(
        Buffer.from(payload, 'base64url').toString('utf8')
      )

      const entries = Object.entries(translations)
      const imports = entries
        .map(([locale, path], i) => `import __t${i} from '${path}'`)
        .join('\n')
      const map = entries.map(([locale], i) => `'${locale}': __t${i}`).join(', ')

      // Attrs and slots are forwarded so the wrapper is transparent to the
      // markdown layout and to any props a .vue page declares.
      return `
import { defineComponent, computed, h } from 'vue'
import { useI18n } from 'vue-i18n'
import __default from '${file}'
${imports}

const byLocale = { ${map} }

export default defineComponent({
  name: 'LocalizedPage',
  setup(props, { attrs, slots }) {
    const { locale } = useI18n()
    const resolved = computed(() => byLocale[locale.value] || __default)

    return () => h(resolved.value, attrs, slots)
  }
})
`
    }
  }
}

/**
 * The virtual module id for a page and its translations.
 *
 * @param {string} file - Absolute path of the default-locale page
 * @param {Record<string, string>} translations
 * @returns {string}
 */
export function pageVirtualId(file, translations) {
  const payload = JSON.stringify({
    file: toForwardSlash(file),
    translations: Object.fromEntries(
      Object.entries(translations).map(([locale, path]) => [
        locale,
        toForwardSlash(path)
      ])
    )
  })

  return VIRTUAL_PREFIX + Buffer.from(payload, 'utf8').toString('base64url')
}
