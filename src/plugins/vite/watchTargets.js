/**
 * Helpers for pointing the dev-server watcher at glob patterns.
 *
 * chokidar dropped glob support in v4, so `watcher.add()` takes literal
 * paths only: a pattern handed to it whole watches nothing. A pattern has
 * to be reduced to its longest glob-free prefix — the directory chokidar
 * can actually watch — and the pattern itself is then used to filter the
 * events that come back.
 *
 * This matters for anything under the user's project: the Vite root is the
 * package, so those paths are outside it and are only watched when the
 * module graph happens to pull them in. A file that does not exist yet is
 * in no graph, which is why an entry point added while the server runs is
 * invisible until something watches its directory.
 */

import { toForwardSlash } from '../../utils/paths.js'

const GLOB_CHARS = /[*?[\]{}()!+]/

/**
 * The longest glob-free prefix of a pattern, i.e. the directory that has to
 * be watched for the pattern's matches to produce events at all.
 *
 * @param {string} pattern
 * @returns {string} Directory to hand to `watcher.add()`
 */
export function getWatchTarget(pattern) {
  const normalizedPattern = toForwardSlash(pattern)
  const isAbsolute = normalizedPattern.startsWith('/')
  const segments = normalizedPattern.split('/')
  const staticSegments = []

  for (const segment of segments) {
    if (GLOB_CHARS.test(segment)) {
      break
    }

    staticSegments.push(segment)
  }

  if (
    staticSegments.length === 0 ||
    (staticSegments.length === 1 && staticSegments[0] === '')
  ) {
    return '.'
  }

  const result = staticSegments.join('/')

  return isAbsolute && !result.startsWith('/') ? '/' + result : result
}

/**
 * The de-duplicated set of directories covering every given pattern.
 *
 * @param {string[]} patterns
 * @returns {string[]}
 */
export function watchTargetsFor(patterns) {
  return [...new Set(patterns.map(getWatchTarget))]
}
