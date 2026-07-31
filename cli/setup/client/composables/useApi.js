const token = document.querySelector('meta[name="csrf-token"]')?.content

/**
 * Wrapper around fetch that includes the CSRF token header
 * on state-changing requests (POST, PUT, DELETE).
 */
export function apiFetch(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase()

  if (method !== 'GET' && method !== 'HEAD') {
    options.headers = {
      ...options.headers,
      'x-csrf-token': token
    }
  }

  return fetch(url, options)
}
