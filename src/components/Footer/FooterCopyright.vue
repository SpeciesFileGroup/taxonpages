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
        alt="copyright"
      />
    </component>
    <span>{{ copyright_text }}</span>
  </div>
</template>

<script setup>
const { copyright_image, copyright_image_link, copyright_text } = __APP_ENV__
</script>
