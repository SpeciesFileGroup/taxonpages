<template>
  <main>
    <div class="bg-base-foreground border-b border-base-muted pl-4 pr-4">
      <div class="container mx-auto">
        <div class="pt-6 pb-6">
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
                <DataMap />
              </ClientOnly>
              <DWCDownload
                v-if="isReady"
                :otu="otu"
              />
            </div>
          </div>
        </div>

        <TabMenu
          v-if="isReady && childrenRoutes.length > 1"
          class="print:hidden"
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
        <RouterView
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
import { useFooterStore } from '@/store'
import { useHead, injectHead } from '@unhead/vue'
import { useSchemaOrg, defineTaxon } from '@/plugins/schemaOrg/composables'
import { RESPONSE_ERROR } from '../constants'
import { isAvailableForRank } from '../utils'
import { useChildrenRoutes, useUserLifeCycles } from '../composables'
import DataMap from '../components/DataMap.vue'
import Breadcrumb from '../components/Breadcrumb/Breadcrumb.vue'
import TaxaInfo from '../components/TaxaInfo.vue'
import DWCDownload from '../components/DWCDownload.vue'

const head = injectHead()
const route = useRoute()
const router = useRouter()
const routeParams = ref(route.params)
const childrenRoutes = useChildrenRoutes()
const store = useOtuStore()
const footerStore = useFooterStore()
let controller = new AbortController()

router.afterEach((route) => {
  routeParams.value = route.params
})

const otu = computed(() => store.otu)
const taxon = computed(() => store.taxon)
const isReady = computed(() => otu.value?.id && taxon.value?.id)
const tabs = computed(() =>
  childrenRoutes.value.filter((item) =>
    isAvailableForRank(item.meta.rankGroup, taxon.value.rank_string)
  )
)

const { onCreatePage, onSSRCreatePage } = useUserLifeCycles({ taxon, otu })

onServerPrefetch(async () => {
  await loadInitialData()
  await onSSRCreatePage()
})

onCreatePage()

watch(
  () => route.params.id,
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
  footerStore.$reset()
})

async function loadInitialData() {
  store.$reset()
  footerStore.$reset()

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
      router.replace({ name: 'httpError404' })
      break
    case 500:
      router.replace({ name: 'httpError500' })
      break
  }
}

function updateMetadata() {
  useHead(
    {
      title: `${__APP_ENV__.project_name} - ${taxon.value.full_name}`
    },
    { head }
  )

  useSchemaOrg(
    [
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
    ],
    head
  )
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
