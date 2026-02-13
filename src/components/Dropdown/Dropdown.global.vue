<template>
  <div class="relative inline">
    <button
      title="Menu"
      aria-label="Open panel options"
      aria-haspopup="true"
      :aria-expanded="isVisible"
      @click="toggleMenu"
      @keydown.escape="closeMenu"
    >
      <slot name="button" />
    </button>
    <ul
      v-if="isVisible"
      ref="element"
      role="menu"
      class="bg-base-foreground absolute font-normal text-sm text-base-lighter right-0 z-10 mt-2 w-56 origin-top-right rounded-md shadow-lg ring-1 ring-black ring-opacity-5"
      @keydown="handleMenuKeydown"
    >
      <li
        v-for="(item, index) in items"
        :key="item.label"
        role="menuitem"
        tabindex="0"
        class="block w-full px-4 py-2 text-left cursor-pointer hover:bg-secondary-color hover:bg-opacity-5 focus-visible:bg-secondary-color focus-visible:bg-opacity-10 focus-visible:outline-none box-border border-b border-base-border last:border-b-0"
        @click="itemClicked(item)"
        @keydown.enter.prevent="itemClicked(item)"
        @keydown.space.prevent="itemClicked(item)"
      >
        {{ item.label }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue'

defineProps({
  items: {
    type: Array,
    default: () => []
  }
})

const element = ref(null)
const isVisible = ref(false)

const toggleMenu = async () => {
  isVisible.value = !isVisible.value

  if (isVisible.value) {
    await nextTick()
    element.value?.querySelector('[role="menuitem"]')?.focus()
  }
}

const closeMenu = () => {
  isVisible.value = false
}

const itemClicked = (item) => {
  isVisible.value = false

  item.action()
}

function handleMenuKeydown(e) {
  const items = element.value?.querySelectorAll('[role="menuitem"]')
  if (!items?.length) return

  const currentIndex = Array.from(items).indexOf(document.activeElement)

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      items[(currentIndex + 1) % items.length]?.focus()
      break
    case 'ArrowUp':
      e.preventDefault()
      items[(currentIndex - 1 + items.length) % items.length]?.focus()
      break
    case 'Escape':
      e.preventDefault()
      closeMenu()
      break
  }
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
