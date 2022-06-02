<template>
  <div class="min-h-screen flex flex-col justify-between">
    <div>
      <LayoutHeader />
      <slot />
    </div>
    <LayoutFooter />
  </div>
</template>
<script setup>
import LayoutHeader from '@/components/Layout/LayoutHeader.vue'
import LayoutFooter from '@/components/Layout/LayoutFooter.vue'
</script>