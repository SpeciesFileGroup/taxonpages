<template>
  <div class="relative inline">
    <button
      title="Menu"
      @click="toggleMenu"
    >
      <slot name="button" />
    </button>
    <ul
      v-if="isVisible"
      ref="element"
      class="bg-base-foreground absolute font-normal text-sm text-base-lighter right-0 z-10 mt-2 w-56 origin-top-right rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
    >
      <li
        v-for="item in items"
        :key="item.label"
        class="block w-full px-4 py-2 text-left cursor-pointer hover:bg-secondary-color hover:bg-opacity-5 box-border border-b border-base-border last:border-b-0"
        @click="itemClicked(item)"
      >
        {{ item.label }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

defineProps({
  items: {
    type: Array,
    default: () => []
  }
})

const element = ref(null)
const isVisible = ref(false)

const toggleMenu = () => {
  isVisible.value = !isVisible.value
}

const itemClicked = (item) => {
  isVisible.value = false

  item.action()
}

function handleEvent(event) {
  if (!event.target || !element.value?.contains(event.target)) {
    isVisible.value = false
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleEvent, {
    passive: true,
    capture: true
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleEvent, {
    capture: true
  })
})
</script>
