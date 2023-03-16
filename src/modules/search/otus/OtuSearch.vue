<template>
  <div
    ref="root"
    class="w-screen h-screen fixed top-0 left-0 z-[5000]"
  >
    <div class="absolute right-0 top-0 w-96 h-screen z-[1100] p-4">
      <!--       <h2 class="text-xl text-base-content mb-4">Search by geographic area</h2> -->
      <FilterView />
    </div>
    <VMap
      class="w-screen h-screen"
      controls
      :zoom="4"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import FilterView from './Filter/FilterView.vue'

const root = ref()
const emit = defineEmits(['close'])
const parameters = ref({})

onMounted(() => {
  document.addEventListener('keyup', handleKeyboard)
  document.body.classList.add('overflow-hidden')
})

onUnmounted(() => {
  document.removeEventListener('keyup', handleKeyboard)
  document.body.classList.remove('overflow-hidden')
})

const handleKeyboard = ({ key }) => {
  switch (key) {
    case 'Escape':
      emit('close')
      break
  }
}
</script>
