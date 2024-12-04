<template>
    <VCard v-if="scrutinies.length">
      <VCardHeader>Scrutiny</VCardHeader>
      <VCardContent>
        <ul class="text-sm">
          <li v-for="item in scrutinies">
            {{ item.value
            }}{{ item.value[item.value.length - 1] === '.' ? '' : '.' }}
            {{
              item.citations
                ?.map((citation) => citation.citation_source_body)
                .join('; ')
            }}
          </li>
        </ul>
      </VCardContent>
    </VCard>
  </template>
  
  <script setup>
  import { makeAPIRequest } from '@/utils';
import { onMounted, ref } from 'vue';
  
  const SCRUTINY_ID = 3102
  
  const props = defineProps({
    taxonId: {
      type: Number,
      required: true
    }
  })
  
  const scrutinies = ref([])
  
  onMounted(() => {
    const payload = {
      attribute_subject_id: props.taxonId,
      controlled_vocabulary_term_id: SCRUTINY_ID
    }
  
    makeAPIRequest
      .get('/data_attributes.json', { params: payload })
      .then(async (response) => {
        scrutinies.value = response.data
        scrutinies.value.forEach((scrutiny) => getCitationsFor(scrutiny))
      })
  })
  
  function getCitationsFor(scrutiny) {
    const payload = {
      citation_object_id: scrutiny.id,
      citation_object_type: 'DataAttribute'
    }
  
    makeAPIRequest
      .get('/citations.json', { params: payload })
      .then((response) => {
        scrutiny.citations = response.data
      })
  }
  </script>