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
      class="bg-base-foreground absolute font-normal text-sm text-base-lighter right-0 z-10 mt-2 w-56 origin-top-right rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
    >
      <li
        v-for="item in items"
        :key="item.label"
        class="block w-full px-4 py-2 text-left text-sm cursor-pointer hover:bg-secondary-color hover:bg-opacity-5 box-border"
        @click="itemClicked(item)"
      >
        {{ item.label }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  items: {
    type: Array,
    default: () => []
  }
})

const isVisible = ref(false)

const toggleMenu = () => {
  isVisible.value = !isVisible.value
}

const itemClicked = (item) => {
  isVisible.value = false

  item.action()
}
</script>
