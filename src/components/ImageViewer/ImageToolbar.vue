<template>
  <div class="p-2 box-border flex justify-between">
    <div>
      <slot />
    </div>
    <button
      type="button"
      class="p-2 cursor-pointer text-black dark:text-white opacity-50"
    >
      <IconClose />
    </button>
  </div>
</template>

<script setup>

</script>