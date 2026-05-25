<template>
  <VCard>
    <VCardHeader class="flex justify-between">
      <h2 class="text-md">Type</h2>
      <PanelDropdown panel-key="panel:type" />
    </VCardHeader>
    <VCardContent class="text-sm">
      <p v-if="typeDesignation.subject_name">
        <RouterLink
          v-if="subjectOtuId"
          :to="{ name: 'otus-id', params: { id: subjectOtuId } }"
          class="text-secondary hover:underline"
        ><em v-if="subjectItalic">{{ subjectParsed.italic }}</em><template v-else>{{ subjectParsed.italic }}</template></RouterLink>
        <em v-else-if="subjectItalic">{{ subjectParsed.italic }}</em>
        <template v-else>{{ subjectParsed.italic }}</template><span v-html="labelSuffix" />
      </p>
    </VCardContent>
  </VCard>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useOtuStore } from '@/modules/otus/store/store'
import { makeAPIRequest } from '@/utils/request'
import PanelDropdown from '../PanelDropdown.vue'

const props = defineProps({
  taxonId: {
    type: [String, Number],
    required: true
  }
})

const store = useOtuStore()

const typeDesignation = computed(
  () => store.taxon?.type_taxon_name_relationship || {}
)

// The relationship type string encodes the object's rank:
// e.g. "TaxonNameRelationship::Typification::Genus::Original::OriginalDesignation" → "Genus"
const typLevel = computed(() => {
  const match = (typeDesignation.value.type || '').match(/Typification::(\w+)::/)
  return match ? match[1] : null
})

// Genus and species group names are italic; family group and above are not.
const GENUS_GROUP  = ['Genus', 'Subgenus']
const FAMILY_GROUP = ['Family', 'Subfamily', 'Tribe', 'Subtribe', 'Supertribe']

// Subject is one rank below the object. It is italic when it belongs to genus or species group.
const subjectItalic = computed(() =>
  GENUS_GROUP.includes(typLevel.value) || FAMILY_GROUP.includes(typLevel.value)
)
// Object is italic only when it is genus group.
const objectItalic = computed(() =>
  GENUS_GROUP.includes(typLevel.value)
)

// Split "Genus species Author, Year" into the italicisable name and plain authorship.
function splitName(name) {
  const words = (name || '').trim().split(/\s+/)
  let i = 1
  while (i < words.length) {
    const w = words[i]
    if (/^[a-z]/.test(w)) { i++; continue }
    if (/^\(/.test(w) && /^[a-z]/.test(words[i + 1] || '')) { i++; continue }
    break
  }
  return { italic: words.slice(0, i).join(' '), plain: words.slice(i).join(' ') }
}

const subjectParsed = computed(() =>
  typeDesignation.value.subject_name ? splitName(typeDesignation.value.subject_name) : null
)
const objectParsed = computed(() =>
  typeDesignation.value.object_name ? splitName(typeDesignation.value.object_name) : null
)

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Build the suffix as an HTML string to avoid Vue whitespace condensing stripping spaces.
const labelSuffix = computed(() => {
  const parts = []
  if (subjectParsed.value?.plain) parts.push(escHtml(subjectParsed.value.plain))
  if (typeDesignation.value.subject_status_tag) parts.push(escHtml(typeDesignation.value.subject_status_tag))
  if (objectParsed.value) {
    const { italic, plain } = objectParsed.value
    const obj = objectItalic.value
      ? `<em>${escHtml(italic)}</em>${plain ? ' ' + escHtml(plain) : ''}`
      : `${escHtml(italic)}${plain ? ' ' + escHtml(plain) : ''}`
    parts.push(obj)
  }
  return parts.length ? ' ' + parts.join(' ') : ''
})

// Resolve the OTU for the subject taxon name to build a link.
const subjectOtuId = ref(null)

watch(
  () => typeDesignation.value.subject_taxon_name_id,
  async (id) => {
    subjectOtuId.value = null
    if (!id) return
    try {
      const { data } = await makeAPIRequest.get('/otus', {
        params: { 'taxon_name_id[]': id, per: 1 }
      })
      subjectOtuId.value = data[0]?.id ?? null
    } catch { /* leave unlinked */ }
  },
  { immediate: true }
)
</script>
