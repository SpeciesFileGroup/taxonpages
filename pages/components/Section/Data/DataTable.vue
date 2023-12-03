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
                <th class="px-4 py-3">Number of Species</th>
                <th class="px-4 py-3">Distribution</th>
                <th class="px-4 py-3">Citations History</th>
                <th class="px-4 py-3">Biological Association</th>
                <th class="px-4 py-3">    
                    <span class="sr-only">Link</span>
                </th>
            </tr>
        </thead> 
        <body>
            <tr v-for="item in items" :key="item.id">
             <td class="px-4 py-3 font-medium text-gray-900">{{ item.id }}</td>
             <td class="px-4 py-3 font-medium text-gray-900">{{ item.numberSpecies }}</td>
             <td class="px-4 py-3" >{{ item.distribution }}</td>
             <td class="px-4 py-3">{{ item.citations }}</td>
             <td class="px-4 py-3">{{ item.biology }}</td>
             <td class="px-4 py-3 flex items-center justify-end">
                <a href="#" class="text-indigo-500 hover:underline"></a>{{ item.link}}
            </td>
            </tr> 
        </body>

     </table>
</div>
</template>