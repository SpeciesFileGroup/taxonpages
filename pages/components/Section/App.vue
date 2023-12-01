<script setup>
import DataTable from './Data/DataTable.vue';

const items = ref([]);

onMounted( async () => {
    const response = await fetch('https://sfg.taxonworks.org/api/v1');
    items.value = await response.json();
});

</script>


<template>
    <div class="p-8 bg-gray-100 min-h-screen">
        <DataTable :items="items" />
    </div>
</template>