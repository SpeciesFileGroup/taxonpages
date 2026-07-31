import { isLocaleMap } from '../../../../src/i18n/localize.js'

/**
 * Finding every translatable value across a site's configuration.
 *
 * Two passes, because neither alone is honest.
 *
 * The **schema pass** walks the declared `translatable` fields, so a value that
 * has never been translated still shows up — which is the whole question when
 * adding a language.
 *
 * The **config pass** walks the raw config for values that already are locale
 * maps. It catches what no schema describes: `taxa_page.yml` is edited by a
 * custom editor and has no `fields`, so its tab labels and panel `bind` titles
 * would otherwise be invisible here despite being translated.
 *
 * Merged by path, schema entries winning, since they carry a proper label.
 *
 * Pure and free of Vue so the walk can be tested directly.
 */

/**
 * @typedef {object} Entry
 * @property {string} id - Stable key: `file:path`
 * @property {string} file - Config filename
 * @property {string} sectionPath - `group.section`, for navigating to it
 * @property {string} sectionLabel
 * @property {string} label - Human path to the value within the section
 * @property {*} value - The raw config value
 * @property {boolean} declared - Whether a schema marks this field translatable
 */

/**
 * Every translatable value in a site's configuration.
 *
 * @param {object} schema - The merged setup schema
 * @param {object} configData - Loaded config, keyed by filename
 * @param {object} ctx - Locale context (see translatedValue.js)
 * @returns {Entry[]}
 */
export function collectTranslatable(schema, configData, ctx) {
  const sections = indexSectionsByFile(schema)
  const entries = new Map()

  const add = (entry) => {
    // Schema entries carry a real label, so they must not be replaced by a
    // config-pass entry describing the same value by its raw path.
    if (entry.declared || !entries.has(entry.id)) entries.set(entry.id, entry)
  }

  // Pass 1: declared fields, translated or not.
  for (const [file, section] of Object.entries(sections)) {
    if (!section.fields) continue

    walkFields({
      fields: section.fields,
      data: configData[file],
      path: [],
      trail: [],
      emit: (path, trail, value) =>
        add(makeEntry({ file, section, path, label: trail.join(' › '), value, declared: true }))
    })
  }

  // Pass 2: anything already translated, wherever it lives.
  for (const [file, content] of Object.entries(configData)) {
    const section = sections[file]

    if (!section) continue

    scanLocaleMaps({
      node: content,
      ctx,
      path: [],
      emit: (path, value) =>
        add(
          makeEntry({
            file,
            section,
            path,
            label: humanizePath(path),
            value,
            declared: false
          })
        )
    })
  }

  return [...entries.values()]
}

function makeEntry({ file, section, path, label, value, declared }) {
  return {
    id: `${file}:${path.join('.')}`,
    file,
    sectionPath: section.sectionPath,
    sectionLabel: section.label,
    label,
    value,
    declared
  }
}

/**
 * Map every config file to the section that edits it.
 *
 * @param {object} schema
 * @returns {Record<string, object>}
 */
function indexSectionsByFile(schema) {
  const byFile = {}

  for (const [groupKey, group] of Object.entries(schema || {})) {
    for (const [sectionKey, section] of Object.entries(group.sections || {})) {
      if (!section.file) continue

      byFile[section.file] = {
        ...section,
        sectionPath: `${groupKey}.${sectionKey}`
      }
    }
  }

  return byFile
}

/**
 * Walk a schema's fields against the config they describe.
 *
 * `trail` accumulates the human labels, `path` the actual keys — the first is
 * what a reader recognises, the second is what identifies the value.
 */
function walkFields({ fields, data, path, trail, emit }) {
  for (const [key, field] of Object.entries(fields || {})) {
    const value = isPlainObject(data) ? data[key] : undefined
    const label = field.label || key

    if (field.type === 'object' && field.fields) {
      walkFields({
        fields: field.fields,
        data: value,
        path: [...path, key],
        trail: [...trail, label],
        emit
      })
      continue
    }

    if (field.type === 'array' && field.items && !isSimpleItems(field.items)) {
      const items = Array.isArray(value) ? value : []

      items.forEach((item, index) => {
        walkFields({
          fields: field.items,
          data: item,
          path: [...path, key, index],
          trail: [...trail, `${label} ${index + 1}`],
          emit
        })
      })
      continue
    }

    if (field.type === 'string' && field.translatable) {
      emit([...path, key], [...trail, label], value)
    }
  }
}

/**
 * Whether an array's `items` describes one scalar rather than a set of fields.
 * Mirrors the test ArrayEditor uses to choose its layout.
 */
function isSimpleItems(items) {
  return typeof items.type === 'string' && !items.fields
}

/** Walk any config value, reporting the locale maps found in it. */
function scanLocaleMaps({ node, ctx, path, emit }) {
  if (isLocaleMap(node, ctx.configuration)) {
    emit(path, node)
    return
  }

  if (Array.isArray(node)) {
    node.forEach((item, index) =>
      scanLocaleMaps({ node: item, ctx, path: [...path, index], emit })
    )
    return
  }

  if (isPlainObject(node)) {
    for (const [key, item] of Object.entries(node)) {
      scanLocaleMaps({ node: item, ctx, path: [...path, key], emit })
    }
  }
}

/**
 * A readable label for a value no schema describes.
 *
 * Array indices are rendered as positions rather than keys, so a panel bind
 * reads "Panels 1 › Title" instead of "panels.0.title".
 */
function humanizePath(path) {
  return path
    .reduce((parts, segment) => {
      if (typeof segment !== 'number') return [...parts, humanizeKey(segment)]

      // An index belongs to the key before it: "Header links" + 0 reads as
      // "Header links 1", not as a step of its own. Runs of indices — a panel
      // sits at row/column/position — join as "Panels 1.1.1".
      const last = parts.pop() ?? ''
      const separator = /\d$/.test(last) ? '.' : ' '

      return [...parts, `${last}${separator}${segment + 1}`.trim()]
    }, [])
    .join(' › ')
}

function humanizeKey(key) {
  if (typeof key !== 'string') return key

  return key.replace(/[_-]/g, ' ').replace(/^./, (c) => c.toUpperCase())
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
