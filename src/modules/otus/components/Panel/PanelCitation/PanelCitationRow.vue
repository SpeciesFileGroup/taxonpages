<template>
  <div
    class="
      flex
      justify-start
      border-b
      border-base-muted
      p-3
      px-4
    "
  >
    <div 
      class="h-5 w-5 text-secondary-color opacity-60 mr-2 cursor-pointer"
      @click="isExpanded = !isExpanded"
    >
      <IconArrowRight 
        v-if="!isExpanded"
        class="h-5 w-5"
      />
      <IconArrowDown
        v-else
        class="h-5 w-5"
      />
    </div>
 
    <div class="break-all">
      <span 
        :title="citation.source.name"
        v-html="sourceLabel" 
      />
      <span> — </span>
      <span
        class=" text-base-lighter"
        v-html="taxonNames"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  citation: {
    type: Object,
    required: true
  }
})

const isExpanded = ref(false)
const sourceLabel = computed(() => {
  const { source } = props.citation

  return isExpanded.value 
    ? source.name
    : source.short_name
})

const taxonNames = computed(() => props.citation.names.join(', '))

const setExpanded = value => {
  isExpanded.value = value
}

defineExpose({
  setExpanded
})

</script>