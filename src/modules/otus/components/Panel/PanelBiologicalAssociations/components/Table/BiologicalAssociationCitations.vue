<template>
  <span
    class="text-secondary cursor-pointer"
    v-html="citations"
    @click="() => (isModalVisible = true)"
  />
  <ModalCitations
    v-if="isModalVisible"
    :biological-association="biologicalAssociation"
    @close="() => (isModalVisible = false)"
  />
</template>

<script setup>
import ModalCitations from '../ModalCitations.vue'
import { ref } from 'vue'

const props = defineProps({
  biologicalAssociation: {
    type: Object,
    required: true
  },

  citations: {
    type: String,
    default: ''
  }
})

const isModalVisible = ref(false)
</script>
