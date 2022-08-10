<template>
  <div class="border-1 card border-base-2 bg-base-0 print:shadow-none print:border-0 rounded">
    <slot />
  </div>
</template>

<style>
.card {
    box-shadow: rgba(30,41,59,.04) 0 2px 4px 0;
    border: 1px solid rgba(98,105,118,.16);
    transition: transform .3s ease-out,opacity .3s ease-out,box-shadow .3s ease-out;
}
</style>