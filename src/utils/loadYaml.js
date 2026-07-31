import * as yaml from 'js-yaml'

/**
 * Load YAML content, tolerating empty or comment-only files.
 *
 * js-yaml >= 5 throws ("expected a document, but the input is empty") when
 * the input has no YAML node — empty, whitespace-only, or only comments.
 * A config file in any of those states just means "no overrides", so we
 * return the fallback instead. Real syntax errors are left to throw.
 *
 * @param {string} content - Raw file content.
 * @param {*} [fallback={}] - Value returned when there is no YAML document.
 * @returns {*} Parsed YAML, or the fallback for empty/comment-only input.
 */
export function loadYaml(content, fallback = {}) {
  const hasDocument = content
    .split('\n')
    .some((line) => {
      const trimmed = line.trim()
      return trimmed !== '' && !trimmed.startsWith('#')
    })

  return hasDocument ? yaml.load(content) : fallback
}
