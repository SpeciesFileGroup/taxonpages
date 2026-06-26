import { ref } from 'vue'

const STORAGE_KEY = 'taxonpages:dismissed-announcements'

function readStorage() {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeStorage(value) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {}
}

const dismissed = ref(readStorage())

export function getAnnouncementKey(announcement) {
  if (announcement.id != null) return String(announcement.id)

  const input = `${announcement.message}|${announcement.url || ''}`
  let hash = 0

  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }

  return `a${hash >>> 0}`
}

export function useDismissedAnnouncements() {
  function isDismissed(key) {
    return dismissed.value.includes(key)
  }

  function dismiss(key) {
    if (!key || isDismissed(key)) return

    dismissed.value = [...dismissed.value, key]
    writeStorage(dismissed.value)
  }

  function prune(validKeys) {
    const valid = new Set(validKeys)
    const next = dismissed.value.filter((key) => valid.has(key))

    if (next.length !== dismissed.value.length) {
      dismissed.value = next
      writeStorage(next)
    }
  }

  return { dismissed, isDismissed, dismiss, prune }
}
