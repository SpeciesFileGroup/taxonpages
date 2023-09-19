<template>
  <div
    class="bottom-0 w-screen bg-base-foreground z-[1000] left-0 p-4 text-sm flex flex-row justify-between align-middle box-border border-b border-base-muted"
  >
    <div>
      <span
        class="ml-2"
        v-html="label"
      />
    </div>
    <IconClose
      class="cursor-pointer"
      @click="() => emit('close')"
    />
  </div>
</template>

<script setup>
const emit = defineEmits(['close'])

const props = defineProps({
  label: {
    type: String,
    required: true
  }
})
</script>
