<script setup>
import DataTable from './Data/DataTable.vue';

onMounted(() => {
   const response  = await fetch ( '' );
});

</script>


<template>
    <div class="p-8 bg-gray-100 min-h-screen">
        <DataTable :items="items" />
    </div>
</template>