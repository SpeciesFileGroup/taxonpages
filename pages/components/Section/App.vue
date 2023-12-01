<script setup>
import DataTable from './Data/DataTable.vue';

const items =[
    {
        id: "Acaenitinae"
    },
    {
        id: "Ichneumoninae"
    }

];
const items = [
    {
        id: "Afrotropical"
    },
    {
        id: "Nearctic"
    }
];

</script>


<template>
    <div class="p-8 bg-gray-100 min-h-screen">
        <DataTable :items="items" />
    </div>
</template>