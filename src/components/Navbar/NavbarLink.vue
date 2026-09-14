<template>
  <component
    :is="isExternal ? 'a' : RouterLink"
    v-bind="linkAttributes"
  >
    <slot />
  </component>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { localeRoutePath } from '@/i18n/locale'
import { isExternalLink } from '@/utils/url'

const props = defineProps({
  link: {
    type: String,
    required: true
  },

  target: {
    type: String,
    default: '_self'
  }
})

const isExternal = computed(() => isExternalLink(props.link))
const { locale } = useI18n()

const linkAttributes = computed(() =>
  isExternal.value
    ? {
        href: props.link,
        target: props.target,
        rel: props.target === '_blank' ? 'noopener noreferrer' : undefined
      }
    : { to: localeRoutePath(props.link, locale.value, __APP_ENV__) }
)
</script>
