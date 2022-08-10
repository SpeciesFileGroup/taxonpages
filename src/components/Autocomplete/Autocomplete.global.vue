<template>
  <div
    class="
      autocomplete
      md:block 
      md:mr-0
      mr-3
      relative
      w-fit"
  >
    <div class="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
      <IconSearch class="w-5 h-5 text-gray-500" />
    </div>
    <input
      v-model="typed"
      type="text"
      class="
        autocomplete__input
        block
        box-border
        min-w-full
        p-1.5
        pl-10
        text-gray-900
        dark:bg-slate-800
        rounded
        border
        sm:text-sm
        dark:text-white
        dark:border-slate-700
        border-gray-300
        dark:placeholder:text-slate-400
        focus:ring-primary-500
        focus:border-primary-500"
      :placeholder="placeholder"
    >
    <AutocompleteSpinner
      v-if="isSearching"
      class="absolute top-2 right-2 h-5 w-5"
    />

    <ul
      v-if="list.length"
      class="autocomplete__list list absolute z-[500] max-h-52 overflow-y-auto border bg-white dark:bg-gray-800 dark:border-gray-700"
    >
      <li
        v-for="item in list"
        :key="item.id"
        class="
          autocomplete__item
          p-2 border-b 
          bg-white
          text-sm
          cursor-pointer
          hover:bg-gray-200
          dark:border-gray-700
          dark:bg-gray-800"
        @click="selectItem(item)"
      >
        <span v-html="item[label]" />
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { makeAPIRequest } from '@/utils/request'
import AutocompleteSpinner from './AutocompleteSpinner.vue'

const props = defineProps({
  placeholder: {
    type: String,
    default: 'Search...'
  },

  url: {
    type: String,
    required: true
  },

  queryParam: {
    type: String,
    default: 'term'
  },

  params: {
    type: Object,
    default: () => ({})
  },

  label: {
    type: String,
    default: 'label'
  }
})

const emit = defineEmits(['select'])
const typed = ref('')
const list = ref([])
const isSearching = ref(false)

const delay = 500
let timeout

watch(typed, newVal => {
  clearTimeout(timeout)

  if (newVal.length) {
    timeout = setTimeout(() => {
      isSearching.value = true
      makeAPIRequest.get(props.url, {
        params: {
          ...props.params,
          [props.queryParam]: typed.value,
        }
      }).then(({ data }) => {
        isSearching.value = false
        list.value = data
      })
    }, delay)
  } else {
    list.value = []
  }
})

const selectItem = item => {
  emit('select', item)
  typed.value = ''
}


</script>

<style lang="scss" scoped>

.autocomplete {
  &__list {
    display: none;
    padding: 0px;
  }

  &__item {
    margin: 0px;
  }

  &__input:focus ~ &__list {
    display: block;
  }

  &__list:hover {
    display: block;
  }
}
</style>