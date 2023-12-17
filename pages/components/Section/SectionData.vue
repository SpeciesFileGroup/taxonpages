<template>
  <section>
    <div class="bg-base-foreground">
      <div class="container mx-auto">
        <div
          class="max-h-max grid grid-cols-2 sm:grid-cols-4 grid-col auto-cols-fr xl:grid-flow-col lg:py-18 xl:py-28 py-10 gap-10"
        >
          <DataType
            class="px-4"
            v-for="(item, key) in dataTypes"
            :key="key"
            :icon="item.icon"
            :label="item.label"
            :count="item.count"
          />
        </div>
      </div>
    </div>
    <div class="bg-base-foreground">
      <div class="container mx-auto"></div>
    </div>
  </section>
</template>

<script setup>
import { shallowRef, triggerRef } from 'vue'
import { makeAPIRequest } from '@/utils/request'

import IconBug from '../Icon/IconBug.vue'
import IconImage from '../Icon/IconImage.vue'
import IconMicroscope from '../Icon/IconMicroscope.vue'
import IconReference from '../Icon/IconReference.vue'
import IconOk from '../Icon/IconOk.vue'
import IconCitation from '../Icon/iconCitation.vue'

import DataType from './Data/DataType.vue'

const TYPES = {
  validSpecies: 'Valid species',
  validExtantSpecies: 'Valid extant species',
  taxonNames: 'Taxon names',
  projectSources: 'Project sources',
  collectionObjects: 'Collection objects',
  citations: 'Citations',
  images: 'Images'
}

const dataTypes = shallowRef({
  [TYPES.validSpecies]: {
    icon: IconOk,
    label: 'Valid species',
    count: 29410
  },
  [TYPES.validExtantSpecies]: {
    icon: IconOk,
    label: 'Valid extant species',
    count: 28955
  },
  [TYPES.taxonNames]: {
    icon: IconMicroscope,
    label: 'Scientific names',
    count: 47350
  },
  [TYPES.projectSources]: {
    icon: IconReference,
    label: 'References',
    count: 15500
  },
  [TYPES.citations]: {
    icon: IconCitation,
    label: 'Citations',
    count: 250000
  },
  [TYPES.images]: {
    icon: IconImage,
    label: 'Images',
    count: 107700
  },  
  [TYPES.collectionObjects]: {
    icon: IconBug,
    label: 'Specimen records',
    count: 108000
  }
})

makeAPIRequest('/stats').then((response) => {
  const { data } = response.data

  for (const key in data) {
    if (dataTypes.value[key]) {
      dataTypes.value[key].count = data[key]
    }
  }

  triggerRef(dataTypes)
})

async function loadSpeciesCount() {
  await makeAPIRequest('/taxon_names.json', {
    params: {
      page: 1,
      per: 1,
      validity: true,
      rank: ['NomenclaturalRank::Iczn::SpeciesGroup::Species']
    }
  }).then(({ headers }) => {
    dataTypes.value[TYPES.validSpecies].count = Number(
      headers['pagination-total']
    )
  })

  await makeAPIRequest('/taxon_names.json', {
    params: {
      page: 1,
      per: 1,
      taxon_name_id: [],
      taxon_name_classification: ['TaxonNameClassification::Iczn::Fossil'],
      validity: true,
      descendants: true,
      nomenclature_group: ['Species'],
      rank: ['NomenclaturalRank::Iczn::SpeciesGroup::Species']
    }
  }).then(({ headers }) => {
    dataTypes.value[TYPES.validExtantSpecies].count =
      dataTypes.value[TYPES.validSpecies].count -
      Number(headers['pagination-total'])
  })

  triggerRef(dataTypes)
}

loadSpeciesCount()
</script>
