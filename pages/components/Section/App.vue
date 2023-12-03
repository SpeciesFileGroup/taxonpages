<script setup>
import DataTable from './Data/DataTable.vue';

const items = [
    {
        id: "Acaenitinae",
        numberSpecies: "Afr",
        distribution: "OK",
        citations: "OK",
        biology: "Incomplete",
        link: "Link"
    },
    {
        id: "Ichneumoninae",
        numberSpecies: "Afr",
        distribution: "OK",
        citations: "OK",
        biology: "Incomplete",
        link: "Link"
    }
];

</script>

<template>
    <div class="p-8 bg-gray-100 min-h-screen">
        <DataTable :items="items" />
    </div>
</template>