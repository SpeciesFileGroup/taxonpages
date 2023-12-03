<script setup>
import DataTable from './Data/DataTable.vue';

const items = [
    {
        id: 'Acaenitinae',
        numberSpecies: "Afr",
        distribution: "OK",
        citations: "OK",
        biology: "Incomplete",
        anchor: "Link",
        link: "/otus/659414"
    },
    {
        id: "Adelognathinae",
        numberSpecies: "Nea",
        distribution: "OK",
        citations: "OK",
        biology: "Incomplete",
        anchor: "Link",
        link: "/otus/659415"
    },

    {
        id: "Ichneumoninae",
        numberSpecies: "Afr",
        distribution: "OK",
        citations: "OK",
        biology: "Incomplete",
        anchor: "Link",
        link: "/otus/659408"
    }
];

</script>

<template>
    <div class="p-8 bg-gray-100 min-h-screen">
        <DataTable :items="items" />
    </div>
</template>