<template>
  <div class="tp-footer-copyright flex items-center text-xs gap-2">
    <component
      :is="copyright_image_link ? 'a' : 'span'"
      :href="copyright_image_link"
      class="min-w-fit"
    >
      <img
        v-if="copyright_image"
        :src="copyright_image"
        :alt="$t('component.footer_copyright.logo_alt')"
      />
    </component>
    <span>{{ copyright_text }}</span>
  </div>
</template>

<script setup>
import { useLocalizedConfig } from '@/i18n/useLocalizedConfig'

const { copyright_image, copyright_image_link } = __APP_ENV__
const { c } = useLocalizedConfig()
const copyright_text = c(__APP_ENV__.copyright_text)
</script>
