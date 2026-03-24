import { Router } from 'express'

/**
 * Proxy route to fetch remote TaxonWorks API data.
 * Avoids CORS issues when the setup client calls external APIs.
 */
export function createProxyRoutes() {
  const router = Router()

  /**
   * GET /api/proxy/projects?url=<base_api_url>
   * Fetches the project list from a remote TaxonWorks API.
   */
  router.get('/projects', async (req, res) => {
    const { url } = req.query

    if (!url) {
      return res.status(400).json({ error: 'Missing "url" query parameter' })
    }

    try {
      new URL(url)
    } catch {
      return res.status(400).json({ error: 'Invalid URL' })
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
