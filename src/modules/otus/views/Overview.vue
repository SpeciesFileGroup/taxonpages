<template>
  <div>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div class="grid grid-cols-1 gap-4 auto-rows-min">
        <template
          v-for="({ component, available }) in componentsLayout.left"
          :key="component"
        >
          <component
            :is="component"
            v-if="!available || isComponentForRank(available, taxonRank)"
            :otu-id="otuId"
            :taxon-id="taxonId"
          />
        </template>
      </div>
      <div class="grid grid-cols-1 auto-rows-min gap-4">
        <template
          v-for="({ component, available }) in componentsLayout.right"
          :key="component"
        >
          <component
            :is="component"
            v-if="!available || isComponentForRank(available, taxonRank)"
            :otu-id="otuId"
            :taxon-id="taxonId"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import OtuGallery from '@/modules/otus/components/Gallery.vue'
import OtuTypeSpecimen from '@/modules/otus/components/TypeSpecimen.vue'
import OtuTypeDesignation from '@/modules/otus/components/TypeDesignation.vue'
import OtuCitations from '@/modules/otus/components/Citation/CitationList.vue'
import OtuMap from '@/modules/otus/components/Map.vue'
import OtuDescendants from '@/modules/otus/components/Descendants.vue'
import OtuContent from '@/modules/otus/components/Content/Content.vue'
import { FAMILY_GROUP, GENUS_GROUP, SPECIES_GROUP } from '@/constants/rankGroups'

const componentsLayout = {
  left: [
    { component: OtuGallery },
    { 
      component: OtuTypeSpecimen,
      available: [SPECIES_GROUP] 
    },
    {
      component: OtuTypeDesignation,
      available: [FAMILY_GROUP, GENUS_GROUP]
    },
    { component: OtuCitations }
  ],
  right: [
    { component: OtuMap },
    { component: OtuDescendants },
    { component: OtuContent }
  ]
}

defineProps({
  taxonId: {
    type: [Number, String],
    required: true
  },

  taxonRank: {
    type: [String, null],
    required: true
  },

  otuId: {
    type: [Number, String],
    required: true
  }
})

const isComponentForRank = (available, rankString) => available.some(rankGroup => rankString?.includes(rankGroup))

</script>