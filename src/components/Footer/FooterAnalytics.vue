<template>
  <span v-if="analytics">This site uses {{ analytics }}.</span>
</template>

<script setup>
const ANALYTICS_LOADERS = {
  analytics: 'Google Analytics',
  gtm: 'Google Tag Manager',
  pixel: 'Facebook Pixel',
  retargeting: 'VK Retargeting',
  linkedin: 'Linkedin Insight',
  tongji: 'Baidu Tongji',
  metrica: 'Yandex Metrica',
  microsoft: 'Microsoft Analytics',
  hotjar: 'Hotjar Analytics',
  fullStory: 'Full story Analytics',
  unbounce: 'Unbounce conversion analytics',
  tiktok: 'TikTok Pixel Analytics'
}

const analyticKeys = Object.keys(__APP_ENV__.analytics_services || {})
const analytics = analyticKeys
  .map((key) => ANALYTICS_LOADERS[key])
  .filter(Boolean)
  .join('; ')
</script>
