<template>
  <main>
    <div class="bg-base-foreground border-b border-base-muted pl-4 pr-4">
      <div class="container mx-auto pt-6 pb-6">
        <div
          class="flex flex-col-reverse md:flex-row justify-between items-start"
        >
          <VSkeleton class="w-full md:w-3/4">
            <Breadcrumb
              v-if="isReady"
              class="w-full md:w-3/4"
              :list="otu?.parents || {}"
              :current="taxon"
            />
          </VSkeleton>
          <Autocomplete
            class="print:hidden min-w-full mb-2 md:min-w-fit md:ml-2 md:mb-0 md:w-96"
            url="/otus/autocomplete"
            query-param="term"
            label="label_html"
            placeholder="Search name..."
            :params="{ having_taxon_name_only: true }"
            @select="loadOtu"
          />
        </div>

        <div class="mt-8 flex justify-between items-end">
          <VSkeleton
            :lines="2"
            class="w-96"
          >
            <TaxaInfo v-if="isReady" />
          </VSkeleton>
          <div class="flex flex-row gap-2">
            <ClientOnly>
              <SiteMap />
            </ClientOnly>
            <DWCDownload
              v-if="isReady"
              :otu="otu"
            />
          </div>
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
          v-if="isReady"
          :key="route.fullPath"
          :taxon-id="taxon.id"
          :taxon="taxon"
          :taxon-rank="taxon.rank_string"
          :otu-id="otu.id"
          :otu="otu"
        />
      </div>
    </div>
  </main>
</template>

<script setup>
import {
  ref,
  watch,
  onServerPrefetch,
  computed,
  onMounted,
  onBeforeUnmount
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOtuStore } from '../store/store'
import { useHead } from 'unhead'
import { useSchemaOrg, defineTaxon } from '@/plugins/schemaOrg/composables'
import SiteMap from '../components/SiteMap.vue'
import Breadcrumb from '../components/Breadcrumb/Breadcrumb.vue'
import TaxaInfo from '../components/TaxaInfo.vue'
import DWCDownload from '../components/DWCDownload.vue'
import { RESPONSE_ERROR } from '../constants'

//import useChildrenRoutes from '../composables/useChildrenRoutes'

const route = useRoute()
const router = useRouter()
const routeParams = ref(route.params)
const tabs = [] // useChildrenRoutes()
const store = useOtuStore()
let controller = new AbortController()

router.afterEach((route) => {
  routeParams.value = route.params
})

const otu = computed(() => store.otu)
const taxon = computed(() => store.taxon)
const isReady = computed(() => otu.value?.id && taxon.value?.id)

onServerPrefetch(async () => {
  await loadInitialData()
})

watch(
  () => route.fullPath,
  async () => {
    controller.abort()
    controller = new AbortController()
    loadInitialData()
  }
)

onMounted(async () => {
  if (otu.value?.id !== Number(route.params.id) || !taxon.value?.id) {
    await loadInitialData()
  } else {
    updateMetadata()
  }
})

onBeforeUnmount(() => {
  store.$reset()
})

async function loadInitialData() {
  store.$reset()

  try {
    await store.loadInit({
      otuId: route.params.id,
      controller
    })
    updateMetadata()
  } catch (e) {
    if (e.name !== RESPONSE_ERROR.CanceledError) {
      redirectOnError(e)
    }
  }
}

function redirectOnError(error) {
  switch (error?.response?.status) {
    case 404:
      router.replace({ name: 'httpError400' })
      break
    case 500:
      router.replace({ name: 'httpError500' })
      break
  }
}

function updateMetadata() {
  useHead({
    title: `${__APP_ENV__.project_name} - ${taxon.value.full_name}`
  })

  useSchemaOrg([
    defineTaxon({
      id: route.fullPath,
      name: taxon.value.full_name,
      scientificName: {
        name: taxon.value.full_name,
        author: taxon.value.author,
        taxonRank: taxon.value.rank
      },
      parentTaxon: {
        name: taxon.value.parent.full_name,
        taxonRank: taxon.value.parent.rank
      },
      commonNames: store.taxonomy.commonNames,
      alternateName: store.taxonomy.synonyms
    })
  ])
}

function loadOtu({ id, otu_valid_id }) {
  router.push({
    name: 'otus-id-overview',
    params: {
      id: otu_valid_id || id
    }
  })
}
</script>
