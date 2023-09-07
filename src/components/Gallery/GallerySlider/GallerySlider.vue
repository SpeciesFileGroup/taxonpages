<template>
  <div class="overflow-hidden h-[550px] w-full">
    <img
      class="object-cover overflow-hidden h-[550px] w-full absolute"
      :key="currentDepiction.src"
      :src="currentDepiction.src"
      alt="Dichroplus maculipennis"
    />
    <div class="bg-black bg-opacity-25 absolute h-full w-full top-0"></div>
    <div class="absolute bottom-2 right-4">
      <span class="z-10 text-white text-sm drop-shadow">
        <RouterLink
          v-if="currentDepiction.otuId"
          class="text-white"
          :to="{ name: 'otus-id', params: { id: currentDepiction.otuId } }"
        >
          {{ currentDepiction.label }} © {{ currentDepiction.copyright }}
        </RouterLink>
      </span>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed, onBeforeUnmount } from 'vue'
import { makeAPIRequest } from '@/utils'

const props = defineProps({
  depictionId: {
    type: Array,
    default: () => []
  },

  interval: {
    type: Number,
    default: 5000
  }
})

const depictions = ref([])
const currentIndex = ref(0)
const currentDepiction = computed(() => depictions[currentIndex.value] || {})
let timeout = null

function updateIndex() {
  currentIndex.value = Math.round(Math.random() * depictions.length)
}

onMounted(() => {
  makeAPIRequest.get(`/url`).then(({ data }) => {
    depictions.value = data

    timeout = setInterval(updateIndex, props.interval)
  })
})

onBeforeUnmount(() => {
  clearInterval(timeout)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s ease-in-out;
}
.fade-enter-from {
  opacity: 0;
}
.fade-enter-to {
  opacity: 1;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
