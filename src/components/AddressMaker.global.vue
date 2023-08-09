<template>
  <span
    class="text-secondary-color cursor-pointer whitespace-nowrap"
    @click="openClient"
  >
    <span v-html="data.username" />
    <template v-for="(item, index) in data.host">
      <svg
        v-if="index === 0"
        class="h-4 inline"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 10-2.636 6.364M16.5 12V8.25"
        />
      </svg>

      <svg
        class="inline h-4 w-1"
        v-else
      >
        <circle
          cy="calc(100% - 5px)"
          cx="2.5"
          r="1"
          fill="currentColor"
        />
      </svg>
      <span v-html="item" />
    </template>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    required: true
  }
})

const data = computed(() => {
  const [username, ...rest] = props.items

  return {
    username,
    host: rest
  }
})

function openClient() {
  const [username, ...rest] = props.items

  document.location.href = `mailto:${username}@${rest.join('.')}`
}
</script>
