<template>
  <div>
    <!-- Default locale: always visible, in the place the plain input had -->
    <div class="flex items-center gap-2">
      <input
        type="text"
        class="tp-input"
        :value="readLocale(modelValue, defaultLocale, true)"
        :placeholder="field.placeholder || ''"
        @input="update(defaultLocale, $event.target.value)"
      />
      <span
        v-if="showTranslations"
        class="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-base-soft"
      >
        {{ defaultLocale }}
      </span>
    </div>

    <!-- Translations -->
    <button
      v-if="showTranslations"
      type="button"
      class="flex items-center gap-1.5 mt-1.5 text-xs text-base-soft hover:text-base-content transition-colors"
      @click="expanded = !expanded"
    >
      <svg
        class="w-3 h-3 transition-transform duration-150"
        :class="expanded && 'rotate-90'"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2.5"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M9 5l7 7-7 7"
        />
      </svg>
      <span>Translations</span>
      <span
        class="px-1.5 py-0.5 rounded font-medium tabular-nums"
        :class="
          isFullyTranslated
            ? 'bg-base-muted text-base-soft'
            : 'bg-warning-light text-warning'
        "
      >
        {{ filled }}/{{ locales.length }}
      </span>
      <span
        v-if="orphans.length"
        class="px-1.5 py-0.5 rounded font-medium bg-danger-light text-danger"
      >
        {{ orphans.length }} unconfigured
      </span>
    </button>

    <div
      v-if="showTranslations && expanded"
      class="mt-2 ml-1 pl-3 border-l-2 border-base-border space-y-2"
    >
      <div
        v-for="option in otherLocales"
        :key="option.code"
        class="flex items-center gap-2"
      >
        <span
          class="shrink-0 w-24 text-xs text-base-soft truncate"
          :title="option.label"
        >
          {{ option.label }}
        </span>
        <input
          type="text"
          class="tp-input"
          :placeholder="fallbackPlaceholder"
          :value="readLocale(modelValue, option.code, true)"
          @input="update(option.code, $event.target.value)"
        />
      </div>

      <p
        v-if="otherLocales.length"
        class="text-[11px] text-base-soft leading-relaxed"
      >
        Leave a locale empty to fall back to
        <span class="font-medium">{{ defaultLocaleLabel }}</span
        >.
      </p>

      <!-- Locales present in the file but missing from config/i18n.yml -->
      <template v-if="orphans.length">
        <div
          v-for="code in orphans"
          :key="code"
          class="flex items-center gap-2"
        >
          <span class="shrink-0 w-24 text-xs text-danger truncate">
            {{ languageLabel(code) }}
          </span>
          <input
            type="text"
            class="tp-input"
            :value="modelValue?.[code] ?? ''"
            @input="update(code, $event.target.value)"
          />
          <button
            type="button"
            class="tp-btn tp-btn-danger tp-btn-sm p-1 shrink-0"
            title="Remove this translation"
            @click="update(code, '')"
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
        <p class="text-[11px] text-danger leading-relaxed">
          {{ orphans.length === 1 ? 'This locale is' : 'These locales are' }}
          not listed in <code>config/i18n.yml</code>, so the text is never
          shown. Add the locale back, or remove the translation.
        </p>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { languageLabel } from '../../../../src/i18n/languageTags.js'
import { useI18nConfig } from '../composables/useI18nConfig.js'

/**
 * A config value that can carry one text per locale.
 *
 * Renders the default locale where the plain input used to be, so the form
 * reads the same for someone who never translates anything, and hides the
 * other locales behind a disclosure that reports coverage at a glance.
 *
 * Safe to use unconditionally: on a single-locale site it collapses to that
 * one input and emits a plain string, so a custom editor can reach for it
 * without first asking whether the site is translated.
 */

const props = defineProps({
  field: { type: Object, default: () => ({}) },
  modelValue: { default: null }
})

const emit = defineEmits(['update:modelValue'])

const {
  defaultLocale,
  locales,
  localeOptions,
  isMultiLocale,
  readLocale,
  writeLocale,
  orphanLocales,
  filledCount
} = useI18nConfig()

const orphans = computed(() => orphanLocales(props.modelValue, true))

// Nothing to disclose on a single-locale site — unless the value carries text
// for a locale that is no longer configured, which the reader needs to see
// precisely because nothing else will ever show it.
const showTranslations = computed(
  () => isMultiLocale.value || orphans.value.length > 0
)

// Open by default where there is something to see, so an existing translation
// is never hidden behind a click the reader has no reason to make.
const expanded = ref(
  filledCount(props.modelValue, true) > 1 ||
    orphanLocales(props.modelValue, true).length > 0
)

const otherLocales = computed(() =>
  localeOptions.value.filter((option) => !option.isDefault)
)

const defaultLocaleLabel = computed(() => languageLabel(defaultLocale.value))

const filled = computed(() => filledCount(props.modelValue, true))

const isFullyTranslated = computed(() => filled.value === locales.value.length)

// Untranslated locales render the default locale's text at runtime; showing it
// as the placeholder says so without implying the field has been filled in.
const fallbackPlaceholder = computed(
  () => readLocale(props.modelValue, defaultLocale.value, true) || ''
)

function update(locale, value) {
  emit('update:modelValue', writeLocale(props.modelValue, locale, value, true))
}
</script>
