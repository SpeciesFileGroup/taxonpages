<template>
  <VCard>
    <VCardHeader>
      <h1 class="text-md">
        Nomenclature citations
      </h1>
    </VCardHeader>

    <div class="text-sm">
      <CitationRow
        v-for="citation in citationList.start"
        :key="citation.id"
        :citation="citation"
      />

      <CitationRowShowMore
        v-if="!showAll && citationList.middle.length"
        :count="citationList.middle.length"
        @click="showAll = true"
      />
      <AnimationOpacity>
        <div v-if="showAll">
          <CitationRow
            v-for="citation in citationList.middle"
            :key="citation.id"
            :citation="citation"
          />
        </div>
      </AnimationOpacity>

      <CitationRow
        v-for="citation in citationList.last"
        :key="citation.id"
        :citation="citation"
        class="last:border-b-0"
      />
    </div>
  </VCard>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import OtuService from '../../services/OtuService'
import CitationRow from './CitationRow.vue'
import CitationRowShowMore from './CitationRowShowMore.vue'

const MAX_CITATIONS = 3

const props = defineProps({
  otuId: {
    type: [Number, String],
    required: true
  }
})

const showAll = ref(false)
const citations = ref([])
const citationList = computed(() => {
  const copyArr = citations.value.slice()

  const start = copyArr.splice(0, MAX_CITATIONS)
  const last = copyArr.splice(-MAX_CITATIONS)
  const middle = copyArr
  return {
    start,
    middle,
    last
  }
})

watch(() => props.otuId, async () => {
  if (!props.otuId) { return }

  citations.value = (await OtuService.getTaxonNameCitations(props.otuId)).data
}, { immediate: true })

</script>
