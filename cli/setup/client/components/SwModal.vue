<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        class="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        @click="$emit('close')"
      />
      <div
        class="relative tp-card w-full mx-4 shadow-xl"
        :class="maxWidth"
      >
        <div
          v-if="title"
          class="flex items-center justify-between p-5 border-b border-base-border"
        >
          <h3 class="text-sm font-semibold text-base-content">
            {{ title }}
          </h3>
          <button
            class="w-7 h-7 flex items-center justify-center rounded-md text-base-soft hover:bg-base-muted hover:text-base-content transition-colors"
            @click="$emit('close')"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div class="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          <slot />
        </div>
        <div class="flex justify-end p-5 border-t border-base-border">
          <slot name="footer">
            <button
              class="tp-btn tp-btn-primary tp-btn-sm"
              @click="$emit('close')"
            >
              Done
            </button>
          </slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '' },
  maxWidth: { type: String, default: 'max-w-3xl' }
})

defineEmits(['close'])
</script>
