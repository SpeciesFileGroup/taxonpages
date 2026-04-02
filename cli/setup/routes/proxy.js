import { Router } from 'express'

/**
 * Validate that a URL is a safe TaxonWorks API endpoint.
 * Blocks non-HTTP protocols and URLs that don't target /api/v1.
 */
function isTaxonWorksUrl(urlString) {
  try {
    const parsed = new URL(urlString)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
    if (!parsed.pathname.includes('/api/v1')) return false
    return true
  } catch {
    return false
  }
}

/**
 * Proxy route to fetch remote TaxonWorks API data.
 * Avoids CORS issues when the setup client calls external APIs.
 */
export function createProxyRoutes() {
  const router = Router()

  /**
   * POST /api/proxy/projects
   * Fetches the project list from a remote TaxonWorks API.
   * Body: { url: string }
   */
  router.post('/projects', async (req, res) => {
    const { url } = req.body || {}

    if (!url) {
      return res.status(400).json({ error: 'Missing "url" in request body' })
    }

    if (!isTaxonWorksUrl(url)) {
      return res.status(400).json({ error: 'URL must be an HTTP(S) TaxonWorks API endpoint (/api/v1)' })
    }

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      })

      clearTimeout(timeout)

      if (!response.ok) {
        return res.status(502).json({
          error: `Remote API returned ${response.status}`
        })
      }

      const data = await response.json()

      if (!data.success || !Array.isArray(data.open_projects)) {
        return res.status(502).json({
          error: 'Unexpected response format from remote API'
        })
      }

      res.json(data)
    } catch (err) {
      if (err.name === 'AbortError') {
        return res.status(504).json({ error: 'Request timed out' })
      }

      res.status(502).json({ error: `Failed to fetch: ${err.message}` })
    }
  })

  return router
}
