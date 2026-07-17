<template>
  <div
    v-if="isMultiLocale"
    ref="root"
    class="relative select-none"
  >
    <button
      type="button"
      class="cursor-pointer flex items-center"
      :title="$t('component.locale.switch')"
      :aria-label="$t('component.locale.switch')"
      aria-haspopup="true"
      :aria-expanded="isOpen"
      @click="toggleMenu"
      @keydown.escape="closeMenu"
      @keydown.arrow-down.prevent="openAndFocusFirst"
    >
      <IconLanguage class="h-6 w-6" />
    </button>

    <div
      v-if="isOpen"
      ref="menu"
      role="menu"
      class="absolute top-full right-0 mt-2 z-50 min-w-full text-sm text-nowrap break-keep leading-5 overflow-hidden rounded-md bg-base-foreground shadow-lg ring-1 ring-black/5"
      @keydown="handleMenuKeydown"
    >
      <a
        v-for="item in options"
        :key="item.code"
        :href="item.href"
        :hreflang="item.code"
        :lang="item.code"
        role="menuitem"
        :aria-current="item.isCurrent ? 'true' : undefined"
        :class="[
          'block px-4 py-2 border-b border-base-muted last:border-b-0',
          'text-base-content hover:bg-secondary/5 focus-visible:bg-secondary/5',
          'focus-visible:outline-none transition-colors duration-100',
          item.isCurrent && 'font-medium bg-secondary/10'
        ]"
      >
        {{ item.label }}
      </a>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useLocaleOptions } from '@/i18n/useLocaleOptions'

const { options, isMultiLocale } = useLocaleOptions()

const root = ref(null)
const menu = ref(null)
const isOpen = ref(false)

async function toggleMenu() {
  isOpen.value = !isOpen.value

  if (isOpen.value) await focusFirst()
}

async function openAndFocusFirst() {
  isOpen.value = true
  await focusFirst()
}

async function focusFirst() {
  await nextTick()
  menu.value?.querySelector('[role="menuitem"]')?.focus()
}

function closeMenu() {
  isOpen.value = false
}

function handleMenuKeydown(e) {
  const items = menu.value?.querySelectorAll('[role="menuitem"]')
  if (!items?.length) return

  const current = Array.from(items).indexOf(document.activeElement)

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      items[(current + 1) % items.length]?.focus()
      break
    case 'ArrowUp':
      e.preventDefault()
      items[(current - 1 + items.length) % items.length]?.focus()
      break
    case 'Escape':
      e.preventDefault()
      closeMenu()
      break
  }
}

function handlePointerDown(event) {
  if (!event.target || !root.value?.contains(event.target)) closeMenu()
}

onMounted(() => {
  document.addEventListener('pointerdown', handlePointerDown, {
    passive: true,
    capture: true
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handlePointerDown, {
    capture: true
  })
})
</script>
