<template>
  <div
    class="w-full relative"
    :style="containerStyle"
  >
    <Transition name="fade">
      <img
        v-if="currentDepiction.imageOriginal"
        :key="currentDepiction.imageOriginal"
        class="object-cover overflow-hidden h-full w-full absolute top-0 my-0"
        :src="currentDepiction.imageOriginal"
        :alt="currentDepiction.label"
      />
    </Transition>
    <div class="bg-black bg-opacity-25 absolute h-full w-full">
      <slot />
    </div>
    <VButton
      v-if="interval && depictions.length > 1"
      primary
      circle
      :aria-label="isPaused ? 'Play slideshow' : 'Pause slideshow'"
      @click="togglePause"
    >
      <IconPlay
        v-if="isPaused"
        class="w-4 h-4"
      />
      <IconPause
        v-else
        class="w-4 h-4"
      />
    </VButton>
    <span
      v-if="currentDepiction.objectId"
      class="z-10 text-white text-sm drop-shadow absolute bottom-2 right-0 px-4"
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
const isPaused = ref(false)

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

function togglePause() {
  isPaused.value = !isPaused.value

  if (isPaused.value) {
    clearInterval(timeout)
    timeout = null
  } else {
    timeout = setInterval(updateIndex, props.interval)
  }
}

watch(depictions, () => {
  if (props.interval) {
    clearInterval(timeout)
    timeout = setInterval(updateIndex, props.interval)
  } else {
    currentIndex.value = Math.floor(Math.random() * depictions.value.length)
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
