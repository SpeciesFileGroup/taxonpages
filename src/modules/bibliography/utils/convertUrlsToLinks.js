function sanitizeHtml(html = '') {
  const allowed = /^(i|em|b|strong|sub|sup|br|p|span)$/i

  return html.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (tag, name) => {
    return allowed.test(name) ? tag : ''
  })
}

export function convertUrlsToLinks(html = '') {
  const urlRegex = /\bhttps?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)]/g
  const safe = sanitizeHtml(html)
  return safe.replace(urlRegex, (url) => {
    const href = url.replace(/&/g, '&amp;')
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-secondary-color">${url}</a>`
  })
}
