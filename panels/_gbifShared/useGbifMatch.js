import { ref, computed, watch } from 'vue'

export const CHECKLIST_KEY = '7ddf754f-d193-4cc9-b351-99906754a03b'
// The v2 CoL match returns alphanumeric usage keys (e.g. "32HTC"). These now
// resolve on the main www.gbif.org portal, which serves the CoL taxonomy under
// /taxon/:key (the legacy integer-keyed backbone lives at /species/:key and on
// old.gbif.org). The former demo.gbif-staging.org preview host is retired.
export const GBIF_TAXON_BASE = 'https://www.gbif.org/taxon'
export const GBIF_OCCURRENCE_BASE = 'https://www.gbif.org/occurrence/search'
export const GBIF_OCCURRENCE_DETAIL = 'https://www.gbif.org/occurrence'

const MATCH_ENDPOINT = 'https://api.gbif.org/v2/species/match'
const MIN_CONFIDENCE = 80
const ACCEPTED_MATCH_TYPES = ['EXACT', 'FUZZY', 'HIGHERRANK']

const cache = new Map()

function isConfidentMatch(data) {
  const matchType = data?.diagnostics?.matchType
  const confidence = data?.diagnostics?.confidence ?? 0

  return (
    !!data?.usage?.key &&
    ACCEPTED_MATCH_TYPES.includes(matchType) &&
    confidence >= MIN_CONFIDENCE
  )
}

async function fetchMatch(name) {
  const url = new URL(MATCH_ENDPOINT)
  url.searchParams.set('scientificName', name)
  url.searchParams.set('verbose', 'true')
  url.searchParams.set('checklistKey', CHECKLIST_KEY)
  const requestUrl = url.toString()

  try {
    const res = await fetch(requestUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data = await res.json()
    return {
      match: isConfidentMatch(data) ? data : null,
      error: false,
      raw: data,
      url: requestUrl
    }
  } catch (e) {
    return { match: null, error: true, raw: null, url: requestUrl }
  }
}

function getOrFetch(name) {
  if (!cache.has(name)) {
    cache.set(name, fetchMatch(name))
  }
  return cache.get(name)
}

export function useGbifMatch(scientificName) {
  const loading = ref(false)
  const error = ref(false)
  const match = ref(null)
  const rawMatch = ref(null)
  const matchUrl = ref(null)

  watch(
    () => scientificName.value,
    async (name) => {
      if (!name) {
        match.value = null
        rawMatch.value = null
        matchUrl.value = null
        error.value = false
        loading.value = false
        return
      }

      loading.value = true
      error.value = false
      const result = await getOrFetch(name)

      if (scientificName.value !== name) return

      match.value = result.match
      rawMatch.value = result.raw
      matchUrl.value = result.url
      error.value = result.error
      loading.value = false
    },
    { immediate: true }
  )

  const isSynonym = computed(
    () =>
      !!(match.value?.usage?.status === 'SYNONYM' && match.value.acceptedUsage)
  )

  const targetUsage = computed(() =>
    isSynonym.value ? match.value.acceptedUsage : match.value?.usage
  )

  const gbifKey = computed(() => targetUsage.value?.key)

  const classification = computed(() => match.value?.classification || [])

  return {
    loading,
    error,
    match,
    rawMatch,
    matchUrl,
    isSynonym,
    targetUsage,
    gbifKey,
    classification
  }
}

export function recordRequest(store, panelKey, { url, data }) {
  if (!url) return
  store.setRequest(panelKey, {
    data,
    request: { responseURL: url }
  })
}

export const GBIF_TECHDOCS_URL = 'https://techdocs.gbif.org/en/'

export const gbifMenuOptions = [
  {
    label: 'GBIF tech docs',
    action: () => window.open(GBIF_TECHDOCS_URL, '_blank', 'noopener')
  }
]

export function deriveScientificName(taxon, otu) {
  return taxon?.full_name || taxon?.name || otu?.object_label || ''
}
