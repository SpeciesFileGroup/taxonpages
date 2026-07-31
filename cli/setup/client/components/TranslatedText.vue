<template>
  <span>{{ text }}</span>
</template>

<script setup>
import { computed } from 'vue'
import { useI18nConfig } from '../composables/useI18nConfig.js'

/**
 * Read-only display of a config value that may carry one text per locale.
 *
 * For labelling something with a value the reader is not editing here — a tab
 * button, a list row — where a locale map would otherwise render as
 * "[object Object]".
 *
 * Registered globally as `SwTranslatedText`, like the other shared setup
 * components. A custom editor lives in its own module and is built by the main
 * app's Vite as well as the wizard's, so it must not import from the wizard
 * client: the aliases that would resolve such an import only exist while the
 * wizard is running.
 */

const props = defineProps({
  value: { default: null },
  /** Shown when the value is empty in every locale. */
  fallback: { type: String, default: '' }
})

const { readLocale, defaultLocale } = useI18nConfig()

const text = computed(
  () => readLocale(props.value, defaultLocale.value, true) || props.fallback
)
</script>
