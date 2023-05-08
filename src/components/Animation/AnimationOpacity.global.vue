<template>
  <transition
    enter-active-class="duration-500 ease-out origin-top"
    enter-from-class="transform opacity-0 scale-y-0"
    enter-to-class="opacity-100 scale-y-100"
    leave-active-class="duration-200 ease-in origin-top"
    leave-from-class="opacity-100 scale-y-100"
    leave-to-class="transform opacity-0 scale-y-0"
  >
    <slot />
  </transition>
</template>
