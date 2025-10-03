<template>
  <ul class="tp-tab-list inline-flex items-center gap-0.5 flex-wrap">
    <li class="tp-tab-item inline-flex items-center text-sm cursor-pointer">
      <span
        v-for="(tab, index) in tabs"
        :key="tab"
        :class="[
          'block py-2 px-3 text-base-content border-b-2 border-transparent',
          selected === index &&
            'border-b-2 !border-secondary-color text-secondary-color'
        ]"
        @click="selected = index"
      >
        {{ tab }}
      </span>
    </li>
  </ul>
</template>

<script setup>
defineProps({
  tabs: {
    type: Array,
    required: true
  }
})

const selected = defineModel({
  type: Number,
  required: true
})
</script>
