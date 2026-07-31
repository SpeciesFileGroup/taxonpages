<template>
  <div class="min-h-screen h-screen flex flex-col justify-between">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:z-[9999] focus:bg-primary focus:text-primary-content focus:p-3 focus:rounded"
    >
      Skip to main content
    </a>
    <div class="flex flex-col flex-grow">
      <LayoutOutlet region="header:before" />
      <LayoutHeader />
      <LayoutOutlet region="header:after" />
      <main id="main-content">
        <LayoutOutlet region="main:before" />
        <slot />
      </main>
    </div>
    <LayoutOutlet region="footer:before" />
    <LayoutFooter />
  </div>
</template>
<script setup>
import LayoutHeader from '@/components/Layout/LayoutHeader.vue'
import LayoutFooter from '@/components/Layout/LayoutFooter.vue'
import LayoutOutlet from '@/components/Layout/LayoutOutlet.vue'
</script>
