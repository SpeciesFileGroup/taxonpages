<template>
  <div
    class="tp-card bg-base-foreground print:shadow-none print:border-0 rounded-lg"
  >
    <slot />
  </div>
</template>

<style>
.tp-card {
  border: 1px solid var(--tp-card-border);
  box-shadow:
    0 1px 2px var(--tp-card-shadow),
    0 1px 3px var(--tp-card-shadow);
  transition:
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.tp-card:hover {
  box-shadow:
    0 1px 3px var(--tp-card-shadow),
    0 4px 8px var(--tp-card-shadow);
}
</style>
