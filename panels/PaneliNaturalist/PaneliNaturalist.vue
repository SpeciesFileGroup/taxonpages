<template>
  <VCard>
    <VCardHeader>iNaturalist</VCardHeader>
    <VCardContent>
      <div class="flex flex-row flex-wrap gap-2">
        <div
          v-for="observation in observations"
          :key="observation.id"
          class="flex flex-row flex-wrap gap-2"
        >
          <a
            :href="`https://www.inaturalist.org/observations/${observation.id}`"
          >
            <img
              :key="observation.observation_photos[0].photo.id"
              :src="observation.observation_photos[0].photo.url"
            />
          </a>
        </div>
      </div>
    </VCardContent>
  </VCard>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const props = defineProps({
  taxon: {
    type: Object,
    required: true
  }
})

const observations = ref([])

axios
  .get(`https://api.inaturalist.org/v1/observations`, {
    params: {
      q: props.taxon.expanded_name
    }
  })
  .then(({ data }) => {
    observations.value = data.results
  })
</script>
