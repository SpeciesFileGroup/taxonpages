<template>
  <div class="min-h-screen h-screen flex flex-col justify-between">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:z-[9999] focus:bg-primary-color focus:text-primary-content focus:p-3 focus:rounded"
    >
      Skip to main content
    </a>
    <div class="flex flex-col flex-grow">
      <LayoutHeader />
      <main id="main-content">
        <slot />
      </main>
    </div>
    <LayoutFooter />
  </div>
</template>
<script setup>
import LayoutHeader from '@/components/Layout/LayoutHeader.vue'
import LayoutFooter from '@/components/Layout/LayoutFooter.vue'
</script>
