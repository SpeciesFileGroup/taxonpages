<script setup>
import FilterDropdown from './FilterDropdown.vue';
import FilterRadios from './FilterRadios.vue';
import SearchForm from './SearchForm.vue';

const props = defineProps({
    items: {
        type: Array,
        required: true

    }
});


</script>

<template>
    <div class="bg-white relative border rounded-lg">
        <div class="flex items-center justify-between">
            <SearchForm />

         <div class="flex items-center justify-end text-sm font-semibold">   
            <FilterDropdown/>
            <FilterRadios/>
         </div>
        </div>
     <table class="w-full text-sm text-left text-gray-500">
        <thead class="text-xs text-gray-700 bg-gray-50">
            <tr>
                <th class="px-4 py-3">Subfamily</th>
                <th class="px-4 py-3">Species</th>
                <th class="px-4 py-3">Distribution</th>
                <th class="px-4 py-3">Citation & Synonymic History</th>
                <th class="px-4 py-3">Biological Association</th>
                <th class="px-4 py-3">    
                    <span class="sr-only">Link</span>
                </th>
            </tr>
        </thead> 
        <tbody>
            <tr v-for="item in props.items" :key="item.id" class="border-b">
             <td class="px-4 py-3 font-medium text-gray-900">{{ item.id }}</td>
             <td class="px-4 py-3">{{ item.numberSpecies }}</td>
             <td class="px-4 py-3" >{{ item.distribution }}</td>
             <td class="px-4 py-3">{{ item.citations }}</td>
             <td class="px-4 py-3">{{ item.biology }}</td>
             <td class="px-4 py-3 flex items-center justify-end">
                <a v-bind:href="item.link" class="text-indigo-500 hover:underline" target="_blank">{{ item.anchor}}</a>
            </td>
            </tr> 
        </tbody>
     </table>
    </div>
</template>