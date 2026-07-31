<template>
  <div class="space-y-5">
    <!-- Coverage per locale -->
    <div class="tp-card p-5 sm:p-6">
      <div class="flex items-baseline justify-between mb-4">
        <h3 class="text-base font-semibold text-base-content">Coverage</h3>
        <span class="text-xs text-base-soft">
          {{ entries.length }}
          {{ entries.length === 1 ? 'value' : 'values' }}
        </span>
      </div>

      <div class="space-y-3">
        <div
          v-for="stat in coverage"
          :key="stat.code"
        >
          <div class="flex items-baseline justify-between mb-1">
            <span class="text-sm text-base-content">
              {{ languageLabel(stat.code) }}
              <span class="text-xs text-base-soft ml-1">{{ stat.code }}</span>
            </span>
            <span
              class="text-xs tabular-nums"
              :class="
                stat.filled === entries.length
                  ? 'text-base-soft'
                  : 'text-warning font-medium'
              "
            >
              {{ stat.filled }}/{{ entries.length }}
            </span>
          </div>
          <div class="h-1.5 rounded-full bg-base-muted overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-300"
              :class="
                stat.filled === entries.length
                  ? 'bg-success'
                  : 'bg-secondary-color'
              "
              :style="{ width: `${stat.percent}%` }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3">
      <select
        v-model="focus"
        class="tp-select max-w-xs"
      >
        <option value="">All languages</option>
        <option
          v-for="code in otherLocales"
          :key="code"
          :value="code"
        >
          Missing in {{ languageLabel(code) }}
        </option>
      </select>

      <span
        v-if="visible.length !== entries.length"
        class="text-xs text-base-soft"
      >
        {{ visible.length }} of {{ entries.length }} shown
      </span>
    </div>

    <!-- Nothing to show -->
    <div
      v-if="!visible.length"
      class="tp-card p-5 sm:p-6"
    >
      <p class="text-sm text-base-soft">
        <template v-if="!entries.length">
          No translatable values found. Text becomes translatable when a field
          is marked for it, or when you translate it from its own section.
        </template>
        <template v-else>
          Everything is translated into
          {{ languageLabel(focus) }}.
        </template>
      </p>
    </div>

    <!-- Values, grouped by the section that edits them -->
    <div
      v-for="group in grouped"
      :key="group.sectionPath"
      class="tp-card overflow-hidden"
    >
      <div
        class="flex items-center gap-3 px-5 py-3 border-b border-base-border bg-base-muted/30"
      >
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold text-base-content truncate">
            {{ group.sectionLabel }}
          </div>
          <div class="text-xs text-base-soft">
            <code>config/{{ group.file }}</code>
          </div>
        </div>
        <button
          class="tp-btn tp-btn-outline tp-btn-sm shrink-0"
          @click="goToSection(group.sectionPath)"
        >
          Edit
        </button>
      </div>

      <div class="divide-y divide-base-border">
        <div
          v-for="entry in group.entries"
          :key="entry.id"
          class="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-2.5"
        >
          <div class="flex-1 min-w-[12rem]">
            <div class="text-xs text-base-soft truncate">
              {{ entry.label }}
            </div>
            <div class="text-sm text-base-content truncate">
              {{ preview(entry) || '—' }}
            </div>
          </div>

          <div class="flex items-center gap-1.5 shrink-0">
            <span
              v-for="code in locales"
              :key="code"
              class="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
              :class="
                has(entry, code)
                  ? 'bg-success/15 text-success'
                  : 'bg-warning-light text-warning'
              "
              :title="`${languageLabel(code)}: ${has(entry, code) ? 'translated' : 'falls back'}`"
            >
              {{ code }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <p
      v-if="entries.length"
      class="text-xs text-base-soft leading-relaxed"
    >
      Values edited by a module's own editor — taxa page tab labels and panel
      settings — appear here once they have at least one translation, because
      nothing declares them ahead of time.
    </p>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { languageLabel } from '../../../../src/i18n/languageTags.js'
import { collectTranslatable } from '../composables/translationAudit.js'
import { useConfig } from '../composables/useConfig.js'
import { useI18nConfig } from '../composables/useI18nConfig.js'
import { useNavigation } from '../composables/useNavigation.js'

/**
 * Where every translatable value in the site's configuration is, and which
 * languages it is missing.
 *
 * Answers the question no individual section can: after adding a language,
 * what is left to translate? Without it that means opening each section in
 * turn and expanding every field.
 */

const { schema, configData } = useConfig()
const { locales, defaultLocale, configuration, readLocale } = useI18nConfig()
const { goToSection } = useNavigation()

const focus = ref('')

const otherLocales = computed(() =>
  locales.value.filter((code) => code !== defaultLocale.value)
)

const entries = computed(() =>
  collectTranslatable(schema.value, configData, {
    locales: locales.value,
    defaultLocale: defaultLocale.value,
    configuration: configuration.value
  })
)

function has(entry, code) {
  return readLocale(entry.value, code, entry.declared) !== ''
}

function preview(entry) {
  return readLocale(entry.value, defaultLocale.value, entry.declared)
}

const coverage = computed(() =>
  locales.value.map((code) => {
    const filled = entries.value.filter((entry) => has(entry, code)).length

    return {
      code,
      filled,
      percent: entries.value.length
        ? Math.round((filled / entries.value.length) * 100)
        : 0
    }
  })
)

const visible = computed(() =>
  focus.value
    ? entries.value.filter((entry) => !has(entry, focus.value))
    : entries.value
)

const grouped = computed(() => {
  const groups = new Map()

  for (const entry of visible.value) {
    if (!groups.has(entry.sectionPath)) {
      groups.set(entry.sectionPath, {
        sectionPath: entry.sectionPath,
        sectionLabel: entry.sectionLabel,
        file: entry.file,
        entries: []
      })
    }

    groups.get(entry.sectionPath).entries.push(entry)
  }

  return [...groups.values()]
})
</script>
