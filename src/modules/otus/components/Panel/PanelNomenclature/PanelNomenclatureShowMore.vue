<template>
  <li class="border-b border-base-muted">
    <button
      type="button"
      class="flex flex-row gap-2 items-center w-full p-3 px-5 text-left text-secondary cursor-pointer hover:bg-secondary/5 focus-visible:bg-secondary/10 focus-visible:outline-none transition-colors duration-100 box-border"
      :aria-expanded="expanded"
      @click="() => emit('toggle')"
    >
      <IconArrowDown
        :class="[
          'size-3 stroke-3 transition-transform',
          expanded && 'rotate-180'
        ]"
      />
      <span>
        {{ expanded ? $t('otus.show_less') : $t('otus.show_more', { count }) }}
      </span>
    </button>
  </li>
</template>

<script setup>
defineProps({
  count: {
    type: Number,
    required: true
  },

  expanded: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle'])
</script>
