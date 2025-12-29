<template>
  <div class="tp-autocomplete md:block relative w-fit">
    <div
      class="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none"
    >
      <IconSearch class="w-4 h-4 text-gray-500" />
    </div>
    <InputText
      ref="inputElement"
      v-model="typed"
      type="text"
      :autofocus="autofocus"
      autocomplete="none"
      class="tp-autocomplete__input block box-border w-full p-1.5 pl-10"
      :placeholder="placeholder"
      @input="trigger"
    />
    <AutocompleteSpinner
      v-if="isSearching"
      class="tp-autocomplete__spinner hidden absolute top-1/2 -translate-y-1/2 right-2 h-5 w-5"
    />

    <ul
      v-if="list.length"
      class="tp-autocomplete__list list absolute z-[500] max-h-52 w-full overflow-y-auto border bg-base-foreground border-base-border !m-0 shadow-md"
      role="listbox"
    >
      <li
        v-for="item in list"
        :key="item.id"
        class="tp-autocomplete__item px-3 py-2 border-b text-xs text-base-content cursor-pointer hover:bg-secondary-color hover:bg-opacity-5 border-base-border truncate"
        role="option"
        @mousedown.prevent="selectItem(item)"
      >
        <span v-html="label ? item[label] : item" />
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue'
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
    default: undefined
  },

  retainInput: {
    type: Boolean,
    default: false
  }
})

const typed = defineModel('input', {
  type: String,
  default: ''
})

const emit = defineEmits(['select'])
const list = ref([])
const isSearching = ref(false)
const inputElement = ref(null)

const delay = 500
let timeout

function trigger(e) {
  clearTimeout(timeout)

  if (e.target.value.length) {
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
        .catch(() => {})
    }, delay)
  } else {
    list.value = []
  }
}

const selectItem = (item) => {
  emit('select', item)

  if (props.retainInput) {
    typed.value = props.label ? item[props.label] : item
  } else {
    typed.value = ''
  }

  inputElement.value.inputRef.blur()
}

function setFocus() {
  inputElement.value.inputRef.focus()
}

defineExpose({
  setFocus
})
</script>

<style lang="scss" scoped>
.tp-autocomplete {
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

  &__input:focus ~ &__spinner {
    display: block;
  }
}
</style>
