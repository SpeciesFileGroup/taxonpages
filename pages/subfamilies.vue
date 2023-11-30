<script setup>
import DataTable from './components/Section/DataTable.vue';

const item = [
    {
        id: 2
    },
    {
        id: 3
    }

];



</script>

<template>
  <div class="p-8 bg-gray-100 min-h-screen">
    <DataTable :items="items" /S>
  </div>  

</template>    