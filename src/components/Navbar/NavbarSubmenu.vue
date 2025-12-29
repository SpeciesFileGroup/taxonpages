<template>
  <div
    ref="menu"
    class="relative cursor-pointer select-none group"
  >
    <button
      class="flex items-center gap-2 text-primary-content"
      @click="() => (isOpen = !isOpen)"
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
      class="absolute top-full left-0 bg-base-background break-keep text-nowrap mt-2 z-50 shadow min-w-full leading-5"
    >
      <div
        v-for="item in menu"
        class="border-b hover:bg-base-foreground border-base-muted last:border-b-0"
        @click="() => (isOpen = false)"
      >
        <RouterLink
          :to="item.link"
          class="block px-4 py-2 text-base-content"
        >
          {{ item.label }}
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, useTemplateRef, onMounted, onBeforeUnmount } from 'vue'

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

function handleClickOutside(e) {
  const menu = element.value

  if (menu && !menu.contains(e.target)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>
