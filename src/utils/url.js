/**
 * Remove the app's base_url from the start of a path.
 *
 * Shared by the SSR server and the browser entry so both reduce a URL to the
 * same app-relative path before resolving the locale from it.
 *
 * @param {string} url - Path, possibly prefixed with base_url
 * @param {string} base - Configured base_url
 * @returns {string} Path relative to the base, always starting with '/'
 */
export function stripBase(url, base) {
  if (!base || base === '/') return url

  const normalized = base.endsWith('/') ? base.slice(0, -1) : base

  if (url === normalized) return '/'
  if (url.startsWith(normalized + '/')) return url.slice(normalized.length)

  return url
}

export function isValidUrl(string) {
  try {
    new URL(string)
    return true
  } catch (err) {
    return false
  }
}

const EXTERNAL_LINK_REGEX = /^([a-z][a-z0-9+.-]*:|\/\/)/i

export function isExternalLink(link) {
  return typeof link === 'string' && EXTERNAL_LINK_REGEX.test(link)
}

export function resolveAssetUrl(path, baseUrl = '/') {
  if (!path) return path

  return isValidUrl(path) ? path : (baseUrl + path).replace('//', '/')
}

function sanitizeHtml(html = '') {
  const allowed = /^(i|em|b|strong|sub|sup|br|p|span)$/i

  return html.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (tag, name) => {
    if (!allowed.test(name)) return ''
    return tag.startsWith('</') ? `</${name}>` : `<${name}>`
  })
}

export function sanitizeAndLinkifyHtml(html = '') {
  const urlRegex = /\bhttps?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)]/g
  const safe = sanitizeHtml(html)
  return safe.replace(urlRegex, (url) => {
    const href = url.replace(/&/g, '&amp;')
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-secondary">${url}</a>`
  })
}
