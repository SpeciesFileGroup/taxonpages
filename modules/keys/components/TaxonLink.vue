<template>
  <span>
    <RouterLink
      :to="{ name: 'otus-id', params: { id } }"
      target="_blank"
      rel="noopener"
      :class="variant === 'pill'
        ? 'inline-flex items-center whitespace-nowrap rounded-full bg-secondary/10 px-2.5 py-0.5 text-sm text-secondary hover:bg-secondary/20 hover:underline'
        : 'text-base-content hover:underline hover:text-secondary'"
    ><span
        v-if="nameHtml"
        v-html="nameHtml"
      /><i v-else>{{ label }}</i><span v-if="authorYear" v-html="authorYearSuffix" /></RouterLink><span
      v-if="validName"
      class="text-base-soft"
    > [= <i>{{ validName }}</i>]</span>
  </span>
</template>

<script setup>
import { inject, computed } from 'vue'

const props = defineProps({
  id: { type: [Number, String], required: true },
  label: { type: String, required: true },
  // 'text' (default) keeps the inline link used in the reachable-taxa list;
  // 'pill' is the right-aligned filled chip used as a lead target in the key views.
  variant: { type: String, default: 'text' }
})

const synonymy = inject('keySynonymy', { value: {} })
const validName = computed(() => synonymy.value?.[props.id]?.validName || '')

// Provided by KeyView: otuId -> { html: "<i>Name</i>", authorYear: "Author, Year" }.
// Falls back to the plain (fully italic) label when the OTU isn't resolved yet.
const taxonNames = inject('keyTaxonNames', { map: {} })
const entry = computed(() => taxonNames.map?.[props.id] || null)
const nameHtml = computed(() => entry.value?.html || '')
const authorYear = computed(() => entry.value?.authorYear || '')
// leading &nbsp; keeps the author on the same line as the name and survives Vue's
// whitespace condensing (a plain leading space in a text node would be stripped)
const authorYearSuffix = computed(() =>
  authorYear.value ? `&nbsp;${escHtml(authorYear.value)}` : ''
)

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
</script>
