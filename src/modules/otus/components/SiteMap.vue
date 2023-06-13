<template>
  <div>
    <VButton
      primary
      class="text-sm md:flex items-center gap-1 hidden"
      @click="isModalVisible = true"
    >
      <IconJson class="w-4 h-4" />
      Sitemap
    </VButton>
    <VModal
      v-if="isModalVisible"
      @close="isModalVisible = false"
    >
      <template #header>
        <h3>Sitemap requests</h3>
      </template>
      <ul class="p-4 text-sm whitespace-pre">
        <li v-for="(item, key) in store.sitemap">
          <span class="capitalize">{{ key }}</span
          >: <a :href="item">{{ item }}</a>
        </li>
      </ul>
    </VModal>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useOtuPageRequestStore } from '../store/request'

const isModalVisible = ref(false)
const store = useOtuPageRequestStore()
</script>
