<template>
  <button
    v-if="themeMode === themeModes.dark"
    type="button"
    @click="themeMode = themeModes.light"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  </button>

  <button
    v-else
    type="button"
    @click="themeMode = themeModes.dark"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-6 w-6 text-slate-400 hover:text-primary-500 dark:hover:text-slate-300"
      :class="link_class"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  </button>
</template>

<script setup>
import { watch, ref } from 'vue'

const {
  link_class
} = __APP_ENV__

const themeModes = {
  dark: 'dark',
  light: 'light'
}
const themeMode = ref(null)

if (
  localStorage.theme === 'dark' || 
  (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
  themeMode.value = 'dark'
} else {
  themeMode.value = 'light'
}

watch(
  themeMode,
  (value, oldValue) => {
    document.documentElement.classList.add(value)
    document.documentElement.classList.remove(oldValue)
    localStorage.setItem('theme', value)
  },
  { immediate: true }
)

</script>