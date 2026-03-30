<template>
  <code
    class="inline-flex items-center gap-1.5 px-1.5 py-0.5 bg-slate-100 rounded text-xs font-mono cursor-pointer hover:bg-slate-200 transition-colors"
    :title="copied ? 'Copied!' : 'Click to copy'"
    @click="copy"
  >
    {{ text }}
    <svg
      v-if="!copied"
      xmlns="http://www.w3.org/2000/svg"
      class="w-3.5 h-3.5 text-slate-400"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
      <path
        d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z"
      />
    </svg>
    <svg
      v-else
      xmlns="http://www.w3.org/2000/svg"
      class="w-3.5 h-3.5 text-emerald-500"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fill-rule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clip-rule="evenodd"
      />
    </svg>
  </code>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  text: { type: String, required: true }
})

const copied = ref(false)

function copy() {
  navigator.clipboard.writeText(props.text)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>
