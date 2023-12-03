<script setup>
import DataTable from './Data/DataTable.vue';

const items = [
    {
        id: "Acaenitinae",
        numberSpecies: "Afr",
        distribution: "OK",
        citations: "OK",
        biology: "Incomplete",
        anchor: "Link",
        link: "https://davidedalpos.github.io/WID_Ichneumonidae/#/otus/659414/overview"
    },
    {
        id: "Ichneumoninae",
        numberSpecies: "Afr",
        distribution: "OK",
        citations: "OK",
        biology: "Incomplete",
        anchor: "Link",
        link: "https://davidedalpos.github.io/WID_Ichneumonidae/#/otus/659408/overview"
    }
];

</script>

<template>
    <div class="p-8 bg-gray-100 min-h-screen">
        <DataTable :items="items" />
    </div>
</template>