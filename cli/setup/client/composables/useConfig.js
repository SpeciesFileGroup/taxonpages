import { ref, reactive, computed } from 'vue'

const schema = ref(null)
const configData = reactive({})
const dirty = ref(new Set())
const status = ref('idle') // 'idle' | 'saving' | 'saved' | 'error'
const statusMessage = ref('')

export function useConfig() {
  async function loadSchema() {
    const res = await fetch('/api/schema')
    schema.value = await res.json()
  }

  async function loadAllConfig() {
    const res = await fetch('/api/config')
    const data = await res.json()

    for (const [filename, entry] of Object.entries(data)) {
      configData[filename] = entry.content
    }
  }

  async function loadConfig(filename) {
    const res = await fetch(`/api/config/${filename}`)
    const data = await res.json()
    configData[filename] = data.content
  }

  async function saveConfig(filename) {
    status.value = 'saving'

    try {
      const res = await fetch(`/api/config/${filename}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: configData[filename] || {} })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Save failed')
      }

      dirty.value.delete(filename)
      status.value = 'saved'
      statusMessage.value = `Saved ${filename}`

      setTimeout(() => {
        if (status.value === 'saved') status.value = 'idle'
      }, 2000)
    } catch (err) {
      status.value = 'error'
      statusMessage.value = err.message
    }
  }

  function getConfigValue(filename, key) {
    return configData[filename]?.[key]
  }

  function setConfigValue(filename, key, value) {
    if (!configData[filename]) {
      configData[filename] = {}
    }

    configData[filename][key] = value
    dirty.value.add(filename)
    status.value = 'idle'
  }

  function setConfigContent(filename, content) {
    configData[filename] = content
    dirty.value.add(filename)
    status.value = 'idle'
  }

  const isDirty = computed(() => dirty.value.size > 0)

  function hasUnsavedChanges(filename) {
    return dirty.value.has(filename)
  }

  return {
    schema,
    configData,
    status,
    statusMessage,
    isDirty,
    loadSchema,
    loadAllConfig,
    loadConfig,
    saveConfig,
    getConfigValue,
    setConfigValue,
    setConfigContent,
    hasUnsavedChanges
  }
}
