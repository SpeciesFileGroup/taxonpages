import { ref, shallowRef } from 'vue'
import { apiFetch } from './useApi.js'

const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000

/**
 * Composable for fetching projects from a remote TaxonWorks API.
 * Handles loading/error states and caches results.
 */
export function useProjectFetcher() {
  const projects = shallowRef([])
  const loading = ref(false)
  const error = ref('')

  async function fetchProjects(baseUrl) {
    if (!baseUrl) {
      projects.value = []
      error.value = ''
      return
    }

    const cached = cache.get(baseUrl)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      projects.value = cached.data
      error.value = ''
      return
    }

    loading.value = true
    error.value = ''
    projects.value = []

    try {
      const res = await apiFetch('/api/proxy/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: baseUrl })
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`)
      }

      const list = data.open_projects || []
      projects.value = list
      cache.set(baseUrl, { data: list, timestamp: Date.now() })
    } catch (err) {
      error.value = err.message || 'Failed to load projects'
      projects.value = []
    } finally {
      loading.value = false
    }
  }

  function clearCache(baseUrl) {
    if (baseUrl) {
      cache.delete(baseUrl)
    } else {
      cache.clear()
    }
  }

  return { projects, loading, error, fetchProjects, clearCache }
}
