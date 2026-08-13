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

const linkAttributes = computed(() =>
  isExternal.value
    ? {
        href: props.link,
        target: props.target,
        rel: props.target === '_blank' ? 'noopener noreferrer' : undefined
      }
    : { to: props.link }
)
</script>
