<template>
  <span>{{ $d(value, 'long') }}</span>
</template>

<script setup>
defineProps({
  value: {
    type: Date,
    required: true
  }
})
</script>
