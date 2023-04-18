<template>
  <div class="autocomplete md:block md:mr-0 mr-3 relative w-fit">
    <div
      class="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none"
    >
      <IconSearch class="w-4 h-4 text-gray-500" />
    </div>
    <input
      v-model="typed"
      type="text"
      autocomplete="none"
      class="autocomplete__input block box-border min-w-full p-1.5 pl-10 text-base-content rounded border sm:text-sm placeholder:text-sm dark:border-slate-700 border-gray-300 dark:placeholder:text-slate-400 focus:ring-primary-500 focus:border-primary-500"
      :placeholder="placeholder"
      ref="inputElement"
    />
    <AutocompleteSpinner
      v-if="isSearching"
      class="absolute top-1/2 -translate-y-1/2 right-2 h-5 w-5"
    />

    <ul
      v-if="list.length"
      class="autocomplete__list list absolute z-[500] max-h-52 w-full overflow-y-auto border bg-base-foreground border-base-border !m-0 shadow-md"
    >
      <li
        v-for="item in list"
        :key="item.id"
        class="autocomplete__item px-3 py-2 border-b text-xs cursor-pointer hover:bg-secondary-color hover:bg-opacity-5 border-base-border truncate"
        @click="selectItem(item)"
      >
        <span v-html="item[label]" />
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { makeAPIRequest } from '@/utils/request'
import AutocompleteSpinner from './AutocompleteSpinner.vue'

const props = defineProps({
  autofocus: {
    type: Boolean,
    default: false
  },

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
const inputElement = ref(null)

const delay = 500
let timeout

watch(typed, (newVal) => {
  clearTimeout(timeout)

  if (newVal.length) {
    timeout = setTimeout(() => {
      isSearching.value = true
      makeAPIRequest
        .get(props.url, {
          params: {
            ...props.params,
            [props.queryParam]: typed.value
          }
        })
        .then(({ data }) => {
          isSearching.value = false
          list.value = data
        })
    }, delay)
  } else {
    list.value = []
  }
})

const selectItem = (item) => {
  emit('select', item)
  typed.value = ''
}

onMounted(() => {
  if (props.autofocus) {
    inputElement.value.focus()
  }
})
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
