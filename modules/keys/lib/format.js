const VALID = ['guided', 'full']
const STORAGE_KEY = 'taxonpages:key-format'

// Pure: given a stored preference and a ?format= query value, pick the format.
// Precedence: query > stored > default('guided'). Unknown values are ignored.
export function resolveFormat({ stored, query }) {
  if (VALID.includes(query)) return query
  if (VALID.includes(stored)) return stored
  return 'guided'
}

// `query` is the ?format= value, supplied by the caller from the router (route.query.format).
// The SPA runs in hash mode, where the URL search string is empty — the query must come
// from the route, not from the location object (F2).
export function readFormat(query = null) {
  let stored = null
  try {
    if (typeof localStorage !== 'undefined') stored = localStorage.getItem(STORAGE_KEY)
  } catch { /* private mode / SSR */ }
  return resolveFormat({ stored, query })
}

export function writeFormat(value) {
  if (!VALID.includes(value)) return
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, value)
  } catch { /* ignore */ }
}
