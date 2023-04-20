<template>
  <div>
    <div class="bg-base-foreground border-b border-base-muted pl-4 pr-4">
      <div class="container mx-auto pt-6 pb-6">
        <div
          class="flex flex-col-reverse md:flex-row justify-between items-start"
        >
          <Breadcrumb
            v-if="isReady"
            class="w-4/4 md:w-3/4"
            :list="otu?.parents || {}"
            :current="taxon"
          />
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

        <div class="mt-8 flex justify-between middle">
          <TaxaInfo
            v-if="isReady"
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
  </div>
</template>

<script setup>
import { ref, watch, onServerPrefetch, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOtuStore } from '../store/store'
import Breadcrumb from '../components/Breadcrumb/Breadcrumb.vue'
import TaxaInfo from '../components/TaxaInfo.vue'
//import useChildrenRoutes from '../composables/useChildrenRoutes'

const route = useRoute()
const router = useRouter()
const routeParams = ref(route.params)
const tabs = [] // useChildrenRoutes()
const store = useOtuStore()

router.afterEach((route) => {
  routeParams.value = route.params
})

const otu = computed(() => store.otu)
const taxon = computed(() => store.taxon)

const isReady = computed(() => otu.value?.id && taxon.value?.id)

onServerPrefetch(async () => {
  await store.loadInit(route.params.id)
})

watch(
  () => route.fullPath,
  async () => {
    store.$reset()
    store.loadInit(route.params.id)
  }
)

onMounted(() => {
  if (!otu.value || otu.value.id !== Number(route.params.id)) {
    store.$reset()
    store.loadInit(route.params.id)
  }
})

function loadOtu({ id }) {
  router.push({
    name: 'otus-id-overview',
    params: {
      id
    }
  })
}
</script>
