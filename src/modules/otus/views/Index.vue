<template>
  <div>
    <div class="bg-base-foreground border-b border-base-muted pl-4 pr-4">
      <div class="container mx-auto pt-6 pb-6">
        <div
          class="flex flex-col-reverse md:flex-row justify-between items-start"
        >
          <Breadcrumb
            class="w-3/4"
            :list="otu.parents"
            :current="taxon"
          />
          <Autocomplete
            class="print:hidden min-w-full mb-2 md:min-w-fit md:ml-2 md:mb-0 w-1/4"
            url="/otus/autocomplete"
            query-param="term"
            label="label_html"
            placeholder="Search name..."
            :params="{ having_taxon_name_only: true }"
            @select="loadOtu"
          />
        </div>

        <div class="mt-8">
          <TaxaInfo
            :taxon="taxon"
            :otu-id="otu.id"
          />
        </div>

        <TabMenu
          v-if="tabs.length"
          class="m-[-1px] print:hidden"
        >
          <TabItem
            v-for="{ name, label } in tabs"
            :key="name"
            :to="{ name }"
          >
            {{ label }}
          </TabItem>
        </TabMenu>
      </div>
    </div>
    <div class="pt-3 pb-4">
      <div class="container mx-auto box-border">
        <router-view
          v-if="taxon.id && otu.id"
          :key="route.fullPath"
          :taxon-id="taxon.id"
          :taxon="taxon"
          :taxon-rank="taxon.rank_string"
          :otu-id="otu.id"
        />
      </div>
    </div>
  </div>
  <OtuSearch />
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Breadcrumb from '../components/Breadcrumb/Breadcrumb.vue'
import TaxaInfo from '../components/TaxaInfo.vue'
import TaxonWorks from '../services/TaxonWorks'
import OtuSearch from '@/modules/search/otus/OtuSearch.vue'
//import useChildrenRoutes from '../composables/useChildrenRoutes'

const route = useRoute()
const router = useRouter()
const routeParams = ref(route.params)
const tabs = [] // useChildrenRoutes()

router.afterEach((route) => {
  routeParams.value = route.params
})

const otu = ref({})
const taxon = ref({})

watch(
  routeParams,
  async (newParams, oldParams) => {
    if (!newParams.id || newParams.id == oldParams?.id) {
      return
    }

    otu.value = {}
    taxon.value = {}

    otu.value = (await TaxonWorks.getOtu(route.params.id)).data
    taxon.value = (await TaxonWorks.summary(otu.value.taxon_name_id)).data
  },
  { immediate: true }
)

const loadOtu = ({ id }) => {
  router.push({
    name: 'otus-id-overview',
    params: {
      id
    }
  })
}
</script>
