import { ref, shallowRef } from 'vue'
import { apiFetch } from './useApi.js'

let cached = null

/**
 * Composable for fetching project status information.
 * Caches the result for the session to avoid repeated requests.
 */
export function useStatus() {
  const data = shallowRef(null)
  const loading = ref(false)
  const error = ref('')

  async function fetchStatus(force = false) {
    if (cached && !force) {
      data.value = cached
      return
    }

    loading.value = true
    error.value = ''

    try {
      const res = await apiFetch('/api/status')
      if (!res.ok) throw new Error(`Request failed (${res.status})`)

      const result = await res.json()
      cached = result
      data.value = result
    } catch (err) {
      error.value = err.message || 'Failed to load status'
    } finally {
      loading.value = false
    }
  }

  async function testConnection(url, projectToken) {
    const res = await apiFetch('/api/status/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, project_token: projectToken })
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Request failed')
    }

    return res.json()
  }

  function clearCache() {
    cached = null
  }

  return { data, loading, error, fetchStatus, testConnection, clearCache }
}
