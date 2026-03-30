import { resolve, join } from 'node:path'

/**
 * Normalize a path to forward slashes.
 * Essential for globs, CSS @source directives, Vite /@fs/ URLs,
 * and import specifiers on Windows.
 *
 * @param {string} p
 * @returns {string}
 */
export function toForwardSlash(p) {
  return p.replace(/\\/g, '/')
}

/**
 * path.join with forward-slash normalization.
 *
 * @param  {...string} segments
 * @returns {string}
 */
export function globJoin(...segments) {
  return toForwardSlash(join(...segments))
}

/**
 * path.resolve with forward-slash normalization.
 *
 * @param  {...string} segments
 * @returns {string}
 */
export function globResolve(...segments) {
  return toForwardSlash(resolve(...segments))
}
