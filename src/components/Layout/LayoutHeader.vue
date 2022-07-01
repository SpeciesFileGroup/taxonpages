<template>
  <div 
    class="
      bg-white
      border-gray-200
      px-2
      sm:px-4
      py-2.5
      rounded
      border-b
      dark:border-b-slate-800
      dark:bg-slate-900
      pl-4
      pr-4
      h-9
      align-middle
      flex
      items-center"
  >
    <div class="container flex flex-wrap justify-between items-center mx-auto dark:text-slate-200 font-medium">
      <a
        href="/"
        class="flex"
      >
        <img
          v-if="logo"
          class="mr-3 h-10"
          :src="logo_url"
        >
        <span v-else>
          {{ project_name }}
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
        <nav class="text-sm leading-6 font-semibold text-slate-700 dark:text-slate-200">
          <ul class="flex space-x-8">
            <li
              v-for="(item, index) in links"
              :key="index"
            >
              <router-link
                :to="item.link"
                class="hover:text-sky-500 dark:hover:text-sky-400"
              >
                {{ item.label }}
              </router-link>
            </li>
          </ul>
        </nav>

        <div class="flex items-center border-l border-slate-200 ml-6 pl-6 dark:border-slate-800">
          <SwitchTheme />
          <a 
            class="ml-6 block text-slate-400 hover:text-slate-500 dark:hover:text-slate-300"
            href="https://github.com/SpeciesFileGroup/taxonpages"
          >
            <svg 
              viewBox="0 0 16 16"
              class="w-5 h-5"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>

import headerConfiguration from '@/config/header.yml'
import projectConfiguration from '@/config/project.yml'
import SwitchTheme from '../SwitchTheme.vue';

const {
  logo,
  links
} = headerConfiguration

const {
  project_name
} = projectConfiguration

</script>