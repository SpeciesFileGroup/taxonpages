<template>
  <div
    v-if="annoucements.length"
    class="relative z-10 h-8 flex px-4 bg-linear-to-r from-primary via-green-800/80 to-primary"
  >
    <div
      v-for="annoucement in annoucements"
      :key="annoucement.message"
      class="flex items-center gap-2 justify-between mx-auto container px-4"
    >
      <a
        class="text-xs font-medium font-mono leading-snug tracking-wide uppercase whitespace-nowrap overflow-hidden text-ellipsis text-shadow-md/50 text-white"
        :href="annoucement.url"
        >{{ annoucement.message }}</a
      >
      <button
        type="button"
        title="Close"
      >
        <IconClose class="text-white size-4! cursor-pointer" />
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  annoucements: {
    type: Array,
    default: () => []
  }
})
</script>
