<template>
  <div 
    class="
      bg-header
      border-base-200
      px-2
      sm:px-4
      py-2.5
      border-b
      dark:border-b-slate-800
      dark:bg-slate-900
      pl-4
      pr-4
      h-9
      align-middle
      flex
      items-center
      bg-primary-color
    "
  >
    <div class="container flex flex-wrap justify-between items-center mx-auto font-medium text-secondary-content">
      <a
        href="/"
        class="flex items-center text-primary-content"
      >
        <img
          v-if="header_logo_url"
          class="mr-3 h-10"
          :src="header_logo_url"
        >
        <span>
          {{ header_logo_text }}
        </span>
      </a>

      <button
        type="button"
        class="inline-flex items-center p-2 ml-3 text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600 print:hidden"
        aria-controls="mobile-menu-2"
        aria-expanded="false"
      >
        <span class="sr-only">Open main menu</span>
        <svg
          class="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
            clip-rule="evenodd"
          />
        </svg>
        <svg
          class="hidden w-6 h-6"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
      <div class="relative hidden lg:flex items-center ml-auto">
        <nav class="text-sm leading-6 font-semibold">
          <ul class="flex space-x-8">
            <li
              v-for="(item, index) in header_links"
              :key="index"
            >
              <router-link
                :to="item.link"
                class="hover:text-primary-content text-primary-content"
              >
                {{ item.label }}
              </router-link>
            </li>
          </ul>
        </nav>

        <div class="flex items-center border-l border-slate-200 ml-6 pl-6 dark:border-slate-800">
          <SwitchTheme class="text-primary-content" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import SwitchTheme from '../SwitchTheme.vue'

const {
  header_link_class,
  header_links,
  header_logo_text,
  header_logo_url
} = __APP_ENV__

</script>