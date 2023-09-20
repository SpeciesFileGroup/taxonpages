<template>
  <div
    class="overflow-hidden w-full relative"
    :style="containerStyle"
  >
    <Transition name="fade">
      <img
        v-if="currentDepiction.imageOriginal"
        class="object-cover overflow-hidden h-full w-full absolute top-0 my-0"
        :key="currentDepiction.imageOriginal"
        :src="currentDepiction.imageOriginal"
        :alt="currentDepiction.label"
      />
    </Transition>
    <div class="bg-black bg-opacity-25 absolute h-full w-full">
      <slot />
    </div>
    <span
      v-if="currentDepiction.objectId"
      class="z-10 text-white text-sm drop-shadow absolute bottom-2 right-4"
    >
      <RouterLink
        v-if="isOtu"
        class="text-white decoration-transparent"
        :to="{
          name: 'otus-id',
          params: { id: currentDepiction.objectId }
        }"
        v-html="label"
      />
      <span
        v-else
        v-html="label"
      />
    </span>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useGallery } from '../useGallery.js'

const props = defineProps({
  depictionId: {
    type: Array,
    default: () => []
  },

  interval: {
    type: Number,
    default: 10000
  },

  height: {
    type: String,
    default: '550px'
  }
})

const { depictions } = useGallery({ props })

const currentIndex = ref(0)

const containerStyle = computed(() => ({ height: props.height }))
const currentDepiction = computed(
  () => depictions.value[currentIndex.value] || {}
)
const isOtu = computed(() => currentDepiction.value.objectType === 'Otu')

const label = computed(() =>
  [currentDepiction.value.objectLabel, currentDepiction.value.attribution].join(
    ' '
  )
)
let timeout = null

function updateIndex() {
  currentIndex.value = (currentIndex.value + 1) % depictions.value.length
}

watch(depictions, () => {
  if (props.interval) {
    clearInterval(timeout)
    timeout = setInterval(updateIndex, props.interval)
  } else {
    currentIndex.value = Math.floor(Math.random() * data.length)
  }
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
