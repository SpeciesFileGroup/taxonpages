<script setup>
import { computed, ref } from 'vue';
import FilterDropdown from './FilterDropdown.vue';
import FilterRadios from './FilterRadios.vue';
import SearchForm from './SearchForm.vue';

const props = defineProps({
  items: {
    type: Array,
    required: true
  }
});

const filters = ref({
  subfamily: ''
});

const list = computed(() =>
  props.items.filter((item) =>
    item.id.toLowerCase().includes(filters.value.subfamily.toLowerCase())
  )
);
</script>

<template>  
  <section class="bg-base-foreground">
    <div class="container mx-auto p-4 sm:pt-10 sm:pb-2 relative box-border">
      <div class="prose !container dark:prose-invert">
        <div>
          <p>
            Because Ichneumonidae is extremely diverse (>24,000 species described) and has a huge literature (>12,000 papers), 
            it can take many years to fully and precisely update a subfamily, especially the very diverse one. 
            The following table gives you information about the current updates on WID according to subfamilies.
          </p>
          <p>
            Here are the abbreviations used within the table:
          </p>
          <p>
            WID is open to contributions from anyone with specimen records and images.
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

    <!-- Table Content -->
    <table class="w-full text-sm text-left text-gray-500">
      <thead class="text-xs text-base-content uppercase bg-base-background">
        <tr>
          <th class="px-4 py-3">Subfamily</th>
          <th class="px-4 py-3">Species</th>
          <th class="px-4 py-3">Distribution</th>
          <th class="px-4 py-3">Taxonomic History</th>
          <th class="px-4 py-3">Biological Association</th>
          <!-- Right-align the Page title and content -->
          <th class="px-4 py-3 text-right">Page
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
          <td class="px-4 py-3 font-medium text-base-content wrap-content">{{ item.id }}</td>
          <td class="px-4 py-3 wrap-content">{{ item.numberSpecies }}</td>
          <td class="px-4 py-3 wrap-content">{{ item.distribution }}</td>
          <td class="px-4 py-3 wrap-content">{{ item.citations }}</td>
          <td class="px-4 py-3 wrap-content">{{ item.biology }}</td>
          <!-- Ensure right alignment of the content in Page column -->
          <td class="px-4 py-3 text-right">
            <router-link
              v-bind:to="item.link"
              class="text-indigo-500 hover:underline"
              target="_blank"
            >
              {{ item.anchor }}
            </router-link>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/* Ensure text wraps inside table cells */
.wrap-content {
  white-space: normal;
  word-wrap: break-word;
  word-break: break-word;
  max-width: 150px; /* Adjust as needed to prevent column stretching */
}

table {
  table-layout: fixed; /* Ensures columns don't stretch to fit content */
}

th, td {
  max-width: 150px; /* Limits the width of each column */
  overflow: hidden; /* Ensures overflow text wraps */
}
</style>
