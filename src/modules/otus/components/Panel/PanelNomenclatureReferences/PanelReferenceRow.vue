<template>
  <li class="border-b border-base-muted p-3 px-5">
    <span
      class="[&>a]:break-all block"
      :title="stripHTML(reference)"
      v-html="reference"
    />
  </li>
</template>

<script setup>
import { stripHTML } from '../../../utils'

defineProps({
  reference: {
    type: String,
    required: true
  }
})
</script>
