const VALID = ['guided', 'full']
const STORAGE_KEY = 'taxonpages:key-format'

// Pure: given a stored preference and a ?format= query value, pick the format.
// Precedence: query > stored > default('guided'). Unknown values are ignored.
export function resolveFormat({ stored, query }) {
  if (VALID.includes(query)) return query
  if (VALID.includes(stored)) return stored
  return 'guided'
}

export function readFormat() {
  let stored = null
  let query = null
  try {
    if (typeof localStorage !== 'undefined') stored = localStorage.getItem(STORAGE_KEY)
  } catch (e) { /* private mode / SSR */ }
  try {
    if (typeof window !== 'undefined') {
      query = new URLSearchParams(window.location.search).get('format')
    }
  } catch (e) { /* SSR */ }
  return resolveFormat({ stored, query })
}

export function writeFormat(value) {
  if (!VALID.includes(value)) return
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, value)
  } catch (e) { /* ignore */ }
}
