<template>
  <div
    ref="menu"
    class="relative cursor-pointer select-none group"
  >
    <button
      class="flex items-center gap-2 text-primary-content"
      aria-haspopup="true"
      :aria-expanded="isOpen"
      @click="toggleMenu"
      @keydown.escape="closeMenu"
      @keydown.arrow-down.prevent="openAndFocusFirst"
    >
      {{ label }}
      <IconArrowDown
        :class="[
          'size-3 stroke-[3] transition-transform',
          isOpen && 'rotate-180'
        ]"
      />
    </button>

    <div
      v-if="isOpen"
      ref="submenu"
      role="menu"
      class="absolute top-full left-0 bg-base-background break-keep text-nowrap mt-2 z-50 shadow min-w-full leading-5"
      @keydown="handleSubmenuKeydown"
    >
      <div
        v-for="item in menu"
        class="border-b hover:bg-base-foreground border-base-muted last:border-b-0"
        @click="() => (isOpen = false)"
      >
        <RouterLink
          :to="item.link"
          role="menuitem"
          class="block px-4 py-2 text-base-content focus-visible:bg-base-foreground focus-visible:outline-none"
        >
          {{ item.label }}
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, useTemplateRef, onMounted, onBeforeUnmount } from 'vue'

defineProps({
  menu: {
    type: Object,
    required: true
  },

  label: {
    type: String,
    required: true
  }
})

const isOpen = ref(false)
const element = useTemplateRef('menu')
const submenu = ref(null)

function toggleMenu() {
  isOpen.value = !isOpen.value
}

function closeMenu() {
  isOpen.value = false
}

async function openAndFocusFirst() {
  isOpen.value = true
  await nextTick()
  submenu.value?.querySelector('[role="menuitem"]')?.focus()
}

function handleSubmenuKeydown(e) {
  const items = submenu.value?.querySelectorAll('[role="menuitem"]')
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

function handleClickOutside(e) {
  const menu = element.value

  if (menu && !menu.contains(e.target)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>
