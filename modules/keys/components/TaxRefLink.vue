<template>
  <RouterLink
    v-if="taxon.otuId"
    :to="{ name: 'otus-id', params: { id: taxon.otuId } }"
    target="_blank"
    rel="noopener"
    class="hover:underline hover:text-secondary"
    v-html="html"
  /><span v-else v-html="html" />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  taxon: { type: Object, required: true }
})

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// italic name + plain authorship, built as one HTML string so the space between them
// survives Vue's whitespace-condense pass.
const html = computed(() => {
  const name = `<i>${esc(props.taxon.name)}</i>`
  return props.taxon.authorYear ? `${name} ${esc(props.taxon.authorYear)}` : name
})
</script>
