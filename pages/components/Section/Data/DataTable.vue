<script setup>
  defineProps({
    items: {
        type: Array,
        required: true

    }
  });


</script>

<template>
    <div>
     <table class="w-full text-sm text-left text-gray-500">
        <thead class="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
                <th class="px-4 py-3">Subfamily</th>
                <th class="px-4 py-3">
                    <span class="sr-only">Distribution</span>
                </th>
            </tr>
        </thead> 
        <body>
            <tr v-for="item in items" :key="item.id">
             <td class="px-4 py-3 font-medium text-gray-900">{{ item.id }}</td>
             <td class="px-4 py-3 font-medium text-gray-900">{{ item.distribution }}</td>
            </tr> 
        </body>

     </table>
</div>
</template>