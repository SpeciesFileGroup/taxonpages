<template>

    <div class="searchBar">
      <!-- Filter Search -->
        <div class="input-group mb-5">
          <input type="search" class="form-control" v-model='searchQuery' placeholder="Student's Name" aria-label="Recipient's username" aria-describedby="button-addon2">
        </div>
    </div>
  
  <table id="tableComponent" class="table table-bordered table-striped">
  <caption> A Responsive, Accessible Table Component</caption>
    <thead>
      <tr>
        <!-- loop through each value of the fields to get the table header -->
        <th  v-for="field in fields" :key='field' @click="sortTable(field)" > 
          {{field}} <i class="bi bi-sort-alpha-down" aria-label='Sort Icon'></i>
         </th>
      </tr>
    </thead>
    <tbody>
        <!-- Loop through the list get the each student data -->
        <tr v-for="item in filteredList" :key='item'>
        <td v-for="field in fields" :key='field'>{{item[field]}}</td>
      </tr>
    </tbody>
  </table> 
  </template>
  <script>
  import {computed,ref} from "vue";
  // Importing  the lodash library 
  import { sortBy} from 'lodash';
  
  export default {
    name: 'TableComponent',
    props:{
        studentData:{
            type: Array,
        },
        fields:{
            type: Array,
        }
    },
    
    setup(props) {
      let sort = ref(false);
      let updatedList =  ref([])
      let searchQuery = ref("");
      
          // a function to sort the table
      const sortTable = (col) => {
        sort.value = true
         // Use of _.sortBy() method
        updatedList.value = sortBy(props.studentData,col)
        }
  
      const sortedList = computed(() => {
        if (sort.value) {
           return updatedList.value
        }
        else{
           return props.studentData;
        }
        });
  
  
        // Filter Search
        const filteredList = computed(() => {
            return sortedList.value.filter((product) => {
              return (
                product.Name.toLowerCase().indexOf(searchQuery.value.toLowerCase()) != -1
              );
            });
  });   
        
  
    return {sortedList, sortTable,searchQuery,filteredList}
    }
   
  }
  </script>
  <style scoped>
  table th:hover {
          background:#f2f2f2;
        }
  </style>