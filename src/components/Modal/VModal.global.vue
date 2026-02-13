<template>
  <div
    class="fixed top-0 left-0 w-full h-screen max-h-screen flex flex-col justify-center bg-black bg-opacity-50 z-[2000]"
    @click="emit('close')"
  >
    <div
      ref="dialogRef"
      role="dialog"
      aria-modal="true"
      :aria-label="ariaLabel"
      :class="[
        'h-full md:h-auto mx-auto  bg-base-foreground container overflow-y-auto rounded',
        containerClass
      ]"
      @click.stop
    >
      <div
        class="w-full p-4 md:p-4 flex flex-row box-border justify-between items-center gap-2"
      >
        <slot name="header">
          <span />
        </slot>
        <button
          type="button"
          aria-label="Close dialog"
          class="p-1 cursor-pointer opacity-50"
          @click="() => emit('close')"
        >
          <IconClose class="w-6 h-6 min-w-6 min-h-6" />
        </button>
      </div>
      <div
        class="bg-base-foreground overflow-x-auto h-full md:h-auto max-h-full md:max-h-[70vh]"
      >
        <slot />
      </div>
      <div>
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

defineProps({
  containerClass: {
    type: String,
    default: ''
  },

  ariaLabel: {
    type: String,
    default: 'Dialog'
  }
})

const emit = defineEmits(['close'])
const dialogRef = ref(null)
let previouslyFocusedElement = null

const handleKeys = (e) => {
  if (e.key === 'Escape') {
    e.stopPropagation()
    emit('close')
  }

  if (e.key === 'Tab') {
    trapFocus(e)
  }
}

function trapFocus(e) {
  const focusable = dialogRef.value?.querySelectorAll(
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
  )

  if (!focusable?.length) return

  const first = focusable[0]
  const last = focusable[focusable.length - 1]

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

onMounted(async () => {
  previouslyFocusedElement = document.activeElement
  document.addEventListener('keydown', handleKeys)
  document.body.classList.add('overflow-hidden')

  await nextTick()
  dialogRef.value?.focus()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeys)
  document.body.classList.remove('overflow-hidden')
  previouslyFocusedElement?.focus()
})
</script>
