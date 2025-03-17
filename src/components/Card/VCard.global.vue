<template>
  <div
    class="border-1 tp-card border-base-muted bg-base-foreground print:shadow-none print:border-0 rounded"
  >
    <slot />
  </div>
</template>

<style>
.tp-card {
  box-shadow: rgba(30, 41, 59, 0.04) 0 2px 4px 0;
  border: 1px solid rgba(98, 105, 118, 0.16);
  transition: transform 0.3s ease-out, opacity 0.3s ease-out,
    box-shadow 0.3s ease-out;
}
</style>
