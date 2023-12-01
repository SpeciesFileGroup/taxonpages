<script setup>

defineProps( {
    items: {
        type: Array,
        required: true
    }
});

</script>
    

<template>
   <table>
    <tr v-for="item in items" :key="item.id">
        <td>{{ item.id }}</td>
    
    </tr>
   </table>
</template>