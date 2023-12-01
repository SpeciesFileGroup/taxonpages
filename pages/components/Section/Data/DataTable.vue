<script setup>

defineProps( {
    items: {
        type: Array,
        required: true
    }
});

</script>
    

<template>
 <div class="bg-white relative border rounded-lg">
   <table class="w-full text-sm text-left text-gray-500">
    <thead class="text-xs text-gray-700 upper-case bg-gray-50">
     <tr>
        <th class="px-4 py-3">Subfamily</th>
     </tr>
    </thead>
    <tbody>
        <tr v-for="item in items" :key="item.id">
          <td class="px-4 py-3 font-medium text-gray-900">{{ item.id }}</td>
        </tr>
    </tbody>
   </table>
 </div>
</template>