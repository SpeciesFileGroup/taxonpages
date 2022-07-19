<template>
  <Autocomplete
    url="/otus/autocomplete"
    query-param="term"
    label="label_html"
    :params="{ having_taxon_name_only: true }"
    @select="loadOtu"
  />
</template>

<script setup>
import { useRouter } from 'vue-router'
import Autocomplete from '@/components/Autocomplete/Autocomplete.global.vue'

const router = useRouter()

const loadOtu = ({ id }) => {
  router.push({
    name: 'otus-id-overview',
    params: {
      id
    }
  })
}
</script>