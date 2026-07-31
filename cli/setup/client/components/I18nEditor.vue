<template>
  <div class="space-y-5">
    <!-- Off: a site with no i18n.yml is single-locale and pays nothing -->
    <div
      v-if="!enabled"
      class="tp-card p-5 sm:p-6"
    >
      <p class="text-sm text-base-content mb-1.5">
        This site is served in
        <span class="font-medium">{{ languageLabel(activeDefault) }}</span>
        only.
      </p>
      <p class="text-sm text-base-soft mb-5 leading-relaxed">
        Turning this on adds <code>config/i18n.yml</code> and lets you translate
        navigation labels, page content, and the interface. Existing URLs are
        unaffected — the default language keeps its unprefixed addresses.
      </p>
      <button
        class="tp-btn tp-btn-primary"
        @click="enable"
      >
        Set up languages
      </button>
    </div>

    <template v-else>
      <!-- Languages -->
      <div class="tp-card p-5 sm:p-6">
        <h3 class="text-base font-semibold text-base-content mb-1">
          Languages
        </h3>
        <p class="text-sm text-base-soft mb-4 leading-relaxed">
          The site is built for each language listed here.
        </p>

        <div class="space-y-1.5 mb-4">
          <div
            v-for="code in locales"
            :key="code"
            class="flex items-center gap-3 rounded-lg border border-base-border bg-base-muted/30 px-3 py-2"
          >
            <span class="text-sm text-base-content flex-1 truncate">
              {{ languageLabel(code) }}
              <span class="text-base-soft ml-1.5 text-xs">{{ code }}</span>
            </span>

            <span
              v-if="code === defaultLocale"
              class="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-secondary-color"
            >
              Default
            </span>
            <button
              v-else
              class="shrink-0 text-xs text-base-soft hover:text-secondary-color transition-colors"
              @click="setDefault(code)"
            >
              Make default
            </button>

            <button
              class="tp-btn tp-btn-danger tp-btn-sm p-1 shrink-0"
              :disabled="locales.length === 1"
              :title="
                locales.length === 1
                  ? 'A site needs at least one language'
                  : `Remove ${languageLabel(code)}`
              "
              @click="askRemove(code)"
            >
              <svg
                class="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <select
            class="tp-select max-w-xs"
            :value="''"
            @change="onPickLanguage"
          >
            <option
              value=""
              disabled
            >
              Add a language…
            </option>
            <option
              v-for="option in available"
              :key="option.code"
              :value="option.code"
            >
              {{ option.label }} ({{ option.code }})
            </option>
          </select>

          <span class="text-xs text-base-soft">or</span>

          <input
            v-model="customTag"
            type="text"
            class="tp-input max-w-[10rem]"
            placeholder="pt-BR"
            @keydown.enter.prevent="addCustom"
          />
          <button
            class="tp-btn tp-btn-outline tp-btn-sm"
            :disabled="!isAddableTag(customTag)"
            @click="addCustom"
          >
            Add tag
          </button>
        </div>
        <p class="text-xs text-base-soft mt-2 leading-relaxed">
          Any BCP-47 tag works. Regional tags such as
          <code>pt-BR</code> match content recorded for the base language.
        </p>
      </div>

      <!-- Behaviour -->
      <div class="tp-card p-5 sm:p-6 space-y-5">
        <h3 class="text-base font-semibold text-base-content">Behaviour</h3>

        <div>
          <label class="block text-sm font-medium text-base-content mb-1.5">
            Fall back to
          </label>
          <p class="text-xs text-base-soft mb-2 leading-relaxed">
            Shown when a string has no translation in the language being
            viewed, instead of a blank or a raw key.
          </p>
          <select
            class="tp-select max-w-xs"
            :value="fallback"
            @change="update('fallback', $event.target.value)"
          >
            <option
              v-for="code in locales"
              :key="code"
              :value="code"
            >
              {{ languageLabel(code) }} ({{ code }})
            </option>
          </select>
        </div>

        <div>
          <label
            class="inline-flex items-start gap-3 cursor-pointer"
            @click.prevent="togglePrefix"
          >
            <button
              type="button"
              role="switch"
              :aria-checked="prefixDefault"
              class="relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 mt-0.5"
              :class="prefixDefault ? 'bg-secondary-color' : 'bg-base-muted'"
            >
              <span
                class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200"
                :class="prefixDefault ? 'translate-x-5' : 'translate-x-0.5'"
                style="margin-top: 2px"
              />
            </button>
            <span class="text-sm">
              <span class="block font-medium text-base-content">
                Put the default language in the URL too
              </span>
              <span class="block text-base-soft mt-0.5 leading-relaxed">
                <template v-if="prefixDefault">
                  Pages are served at
                  <code>/{{ defaultLocale }}/otus/12345</code>.
                </template>
                <template v-else>
                  Pages stay at <code>/otus/12345</code>, and other languages
                  get a prefix.
                </template>
              </span>
            </span>
          </label>

          <p
            v-if="prefixDefault"
            class="mt-2 text-xs text-warning leading-relaxed"
          >
            Every existing address changes. Taxon page URLs are cited in
            published literature, so this breaks links that cannot be corrected
            after the fact. Leave it off unless the site has never been
            published.
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-base-content mb-1.5">
            Browser language
          </label>
          <select
            class="tp-select max-w-xs"
            :value="detect"
            @change="update('detect', $event.target.value)"
          >
            <option value="suggest">Suggest a matching language</option>
            <option value="off">Ignore it</option>
          </select>
          <p class="text-xs text-base-soft mt-2 leading-relaxed">
            The URL always decides which language renders — redirecting on a
            browser header would break caching and confuse crawlers. Reserved:
            the setting is validated but nothing acts on it yet, so both values
            behave the same today.
          </p>
        </div>
      </div>

      <!-- Save / disable -->
      <div class="flex flex-wrap items-center gap-3">
        <button
          class="tp-btn tp-btn-primary"
          :disabled="!hasUnsavedChanges(section.file)"
          @click="save"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          Save {{ section.label }}
        </button>
        <span
          v-if="hasUnsavedChanges(section.file)"
          class="text-xs text-warning font-medium"
        >
          Unsaved changes
        </span>
        <button
          class="tp-btn tp-btn-ghost tp-btn-sm ml-auto"
          @click="disableModal = true"
        >
          Turn off multiple languages
        </button>
      </div>
    </template>

    <!-- Removing a language -->
    <SwModal
      :visible="!!removing"
      :title="`Remove ${removing ? languageLabel(removing) : ''}?`"
      @close="removing = null"
    >
      <template v-if="removing">
        <p class="text-sm text-base-content mb-3 leading-relaxed">
          The site stops being built for this language and its addresses stop
          resolving.
        </p>

        <div
          v-if="strandedTotal > 0"
          class="rounded-lg border border-warning/40 bg-warning-light/40 p-3 mb-3"
        >
          <p class="text-sm font-medium text-warning mb-2">
            {{ strandedTotal }}
            {{ strandedTotal === 1 ? 'translation' : 'translations' }}
            stay in place but stop being shown
          </p>
          <ul class="text-xs text-base-content space-y-1">
            <li
              v-for="entry in strandedConfig"
              :key="entry.file"
            >
              <code>config/{{ entry.file }}</code> —
              {{ entry.count }}
              {{ entry.count === 1 ? 'value' : 'values' }}
            </li>
            <li
              v-for="page in strandedPages"
              :key="page"
            >
              <code>{{ page }}</code>
            </li>
            <li v-if="strandedCatalog">
              <code>locales/{{ removing }}.yml</code> — interface strings
            </li>
          </ul>
          <p class="text-xs text-base-soft mt-2 leading-relaxed">
            Nothing is deleted. Adding the language back restores all of it.
          </p>
        </div>

        <div class="flex justify-end gap-2">
          <button
            class="tp-btn tp-btn-outline"
            @click="removing = null"
          >
            Cancel
          </button>
          <button
            class="tp-btn tp-btn-danger"
            @click="confirmRemove"
          >
            Remove
          </button>
        </div>
      </template>
    </SwModal>

    <!-- Turning i18n off -->
    <SwModal
      :visible="disableModal"
      title="Turn off multiple languages?"
      @close="disableModal = false"
    >
      <p class="text-sm text-base-content mb-3 leading-relaxed">
        <code>config/i18n.yml</code> is removed and the site is served in
        {{ languageLabel(defaultLocale) }} only. Translations already written
        stay in their files, unused, and come back if you turn this on again.
      </p>
      <div class="flex justify-end gap-2">
        <button
          class="tp-btn tp-btn-outline"
          @click="disableModal = false"
        >
          Cancel
        </button>
        <button
          class="tp-btn tp-btn-danger"
          @click="disable"
        >
          Turn off
        </button>
      </div>
    </SwModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { languageLabel, LANGUAGE_TAGS } from '../../../../src/i18n/languageTags.js'
import { useConfig } from '../composables/useConfig.js'
import { useI18nConfig } from '../composables/useI18nConfig.js'
import { apiFetch } from '../composables/useApi.js'

/**
 * The `config/i18n.yml` editor.
 *
 * A custom editor rather than generated fields because the settings constrain
 * each other: the default and fallback languages must be chosen from the ones
 * configured, and removing a language is destructive enough to be worth
 * describing before it happens.
 */

const props = defineProps({
  section: { type: Object, required: true }
})

const {
  configData,
  getConfigValue,
  setConfigValue,
  saveConfig,
  deleteConfig,
  loadSchema,
  hasUnsavedChanges
} = useConfig()

const { loadI18nConfig, countLocaleValues, defaultLocale: activeDefault } =
  useI18nConfig()

const removing = ref(null)
const disableModal = ref(false)
const customTag = ref('')
const usage = ref({})

onMounted(fetchUsage)

async function fetchUsage() {
  try {
    const res = await apiFetch('/api/i18n/usage')
    usage.value = res.ok ? await res.json() : {}
  } catch {
    usage.value = {}
  }
}

// --- Reading the file ------------------------------------------------------

const block = computed(() => getConfigValue(props.section.file, 'i18n') || {})

const enabled = computed(() => Object.keys(block.value).length > 0)

const defaultLocale = computed(() => block.value.default_locale || 'en')

// The default locale is always available whether or not it is listed, matching
// resolveI18nConfig — so what is shown is what the site will actually build.
const locales = computed(() => [
  ...new Set([
    defaultLocale.value,
    ...(Array.isArray(block.value.locales) ? block.value.locales : [])
  ])
])

const fallback = computed(() =>
  locales.value.includes(block.value.fallback)
    ? block.value.fallback
    : defaultLocale.value
)

const prefixDefault = computed(() => block.value.prefix_default_locale === true)

const detect = computed(() => block.value.detect || 'suggest')

const available = computed(() =>
  LANGUAGE_TAGS.filter((code) => !locales.value.includes(code))
    .map((code) => ({ code, label: languageLabel(code) }))
    .sort((a, b) => a.label.localeCompare(b.label))
)

// --- Writing it ------------------------------------------------------------

function write(next) {
  setConfigValue(props.section.file, 'i18n', next)
}

function update(key, value) {
  write({ ...block.value, [key]: value })
}

function enable() {
  write({
    default_locale: activeDefault.value,
    locales: [activeDefault.value],
    prefix_default_locale: false,
    fallback: activeDefault.value,
    detect: 'suggest'
  })
}

function addLocale(code) {
  if (!code || locales.value.includes(code)) return

  write({ ...block.value, locales: [...locales.value, code] })
}

function onPickLanguage(event) {
  addLocale(event.target.value)
  event.target.value = ''
}

function isAddableTag(tag) {
  const trimmed = (tag || '').trim()

  return /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/.test(trimmed) &&
    !locales.value.includes(trimmed)
}

function addCustom() {
  if (!isAddableTag(customTag.value)) return

  addLocale(customTag.value.trim())
  customTag.value = ''
}

function setDefault(code) {
  // Keep the fallback pointing somewhere real: it defaults to the default
  // locale, and a fallback outside `locales` only warns at build time.
  write({
    ...block.value,
    default_locale: code,
    locales: locales.value,
    fallback: locales.value.includes(block.value.fallback)
      ? block.value.fallback
      : code
  })
}

function togglePrefix() {
  update('prefix_default_locale', !prefixDefault.value)
}

// --- Removing a language ---------------------------------------------------

function askRemove(code) {
  if (locales.value.length === 1) return

  removing.value = code
}

const strandedConfig = computed(() => {
  if (!removing.value) return []

  return Object.entries(configData)
    .map(([file, content]) => ({
      file,
      count: countLocaleValues(content, removing.value)
    }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count)
})

const strandedPages = computed(() =>
  removing.value ? (usage.value[removing.value]?.pages ?? []) : []
)

const strandedCatalog = computed(() =>
  removing.value ? usage.value[removing.value]?.catalog === true : false
)

const strandedTotal = computed(
  () =>
    strandedConfig.value.reduce((total, entry) => total + entry.count, 0) +
    strandedPages.value.length +
    (strandedCatalog.value ? 1 : 0)
)

function confirmRemove() {
  const code = removing.value
  const remaining = locales.value.filter((locale) => locale !== code)

  write({
    ...block.value,
    default_locale:
      defaultLocale.value === code ? remaining[0] : defaultLocale.value,
    locales: remaining,
    fallback: remaining.includes(block.value.fallback)
      ? block.value.fallback
      : remaining[0]
  })

  removing.value = null
}

// --- Persisting ------------------------------------------------------------

function save() {
  saveConfig(props.section.file)
}

// Every translatable field in the wizard reads these settings, so they have to
// be re-read once the file lands — before anything else is asked about a
// locale that only just started or stopped existing.
//
// Keyed off the file going clean rather than the save call, so the editor's
// own button and the Ctrl+S handler in SectionEditor both take this path.
watch(
  () => hasUnsavedChanges(props.section.file),
  async (isDirty, wasDirty) => {
    if (wasDirty && !isDirty) {
      await loadI18nConfig(true)
      // The translations overview is only in the schema for a multi-locale
      // site, so going from one locale to two has to bring it into the sidebar.
      await loadSchema()
      await fetchUsage()
    }
  }
)

async function disable() {
  disableModal.value = false

  try {
    await deleteConfig(props.section.file)
    await loadI18nConfig(true)
    await loadSchema()
  } catch {
    // deleteConfig has already surfaced the message through the status toast.
  }
}
</script>
