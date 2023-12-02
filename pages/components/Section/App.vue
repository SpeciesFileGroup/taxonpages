<script setup>
import DataTable from './Data/DataTable.vue';

const items = [
    {
        id: "Acaenitinae"
        distribution: "OK"

    },
    {
        id: "Ichneumoninae"
        distribution: "OK"
    }
];

</script>

<template>
    <div class="p-8 bg-gray-100 min-h-screen">
        <DataTable :items="items" />
    </div>
</template>