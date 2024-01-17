<script setup>
import { computed, ref } from 'vue'
import FilterDropdown from './FilterDropdown.vue'
import FilterRadios from './FilterRadios.vue'
import SearchForm from './SearchForm.vue'

const props = defineProps({
  items: {
    type: Array,
    required: true
  }
})

const filters = ref({
  subfamily: ''
})

const list = computed(() =>
  props.items.filter((item) =>
    item.id.toLowerCase().includes(filters.value.subfamily.toLowerCase())
  )
)
</script>

<template>  
  <section class="bg-base-foreground">
    <div class="container mx-auto p-4 sm:pt-10 sm:pb-2 relative box-border">
      <div class="prose !container dark:prose-invert">
        <div>
          <p>
            The <b>World Ichneumonidae Database (WID)</b> is a comprehensive and 
            collaborative database for world fauna of Ichneumonidae managed in 
            <a href="https://taxonworks.org"> TaxonWorks</a>. In this portal 
            you can find information about distribution, nomenclature, 
            and biology of the world Darwin wasps.
          </p>
          <p>
            The core purpose of the WID is 
            the research on Ichneumonidae by providing a centralized resource for images, 
            reference, and taxonomy/nomenclature. Moreover, being updateble and open access,
            the portal is designed to include all the relevant information updated 
            constantly.
          </p>
          <p>
            WID is open to contributions from anyone with specimen records and
            images.
          </p>
        </div>
      </div>
    </div>
  </section>

  <div class="bg-base-foreground rounded-lg">
    <div class="flex items-center justify-between">
      <SearchForm v-model="filters.subfamily" />

      <div class="flex items-center justify-end text-sm font-semibold">
        <FilterDropdown />
        <FilterRadios />
      </div>
    </div>
    <table class="w-full text-sm text-left text-gray-500">
      <thead class="text-xs text-base-content uppercase bg-base-background">
        <tr>
          <th class="px-4 py-3">Subfamily</th>
          <th class="px-4 py-3">Species</th>
          <th class="px-4 py-3">Distribution</th>
          <th class="px-4 py-3">Taxonomic History</th>
          <th class="px-4 py-3">Biological Association</th>
          <th class="px-4 py-3">
            <span class="sr-only">Link</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in list"
          :key="item.id"
          class="border-b border-base-muted"
        >
          <td class="px-4 py-3 font-medium text-base-content">{{ item.id }}</td>
          <td class="px-4 py-3">{{ item.numberSpecies }}</td>
          <td class="px-4 py-3">{{ item.distribution }}</td>
          <td class="px-4 py-3">{{ item.citations }}</td>
          <td class="px-4 py-3">{{ item.biology }}</td>
          <td class="px-4 py-3 flex items-center justify-end">
            <router-link
              v-bind:to="item.link"
              class="text-indigo-500 hover:underline"
              target="_blank"
              >{{ item.anchor }}</router-link
            >
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
