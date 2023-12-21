<template>
  <VCard class="m-8">
    <DataTable :items="subfamilyData" />
  </VCard>
</template>

<script setup>
import DataTable from './components/subfamilies/DataTable.vue'
import subfamilyData from './components/subfamilies/subfamiliesData.js'
</script>