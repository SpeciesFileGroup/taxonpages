function humanize(text) {
  return text
    .replace(/^[\s_]+|[\s_]+$/g, '')
    .replace(/[_\s]+/g, ' ')
    .replace(/^[a-z]/, (m) => m.toUpperCase())
}

function uncapitalize(text) {
  return text.replace(/^[A-Z]/, (m) => m.toLowerCase())
}

export { humanize, uncapitalize }
