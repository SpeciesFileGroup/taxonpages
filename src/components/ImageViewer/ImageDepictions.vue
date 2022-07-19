<template>
  <div>
    <div 
      v-for="depiction in depictions"
      :key="depiction.id"
    >
      <p>{{ depiction.label }}</p>
    </div>
  </div>
</template>

<script setup>

defineProps({
  depictions: {
    type: Array,
    default: () => []
  }
})

</script>
