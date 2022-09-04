<template>
  <div 
    class="
      relative
      bg-header
      border-base-muted
      px-2
      sm:px-4
      py-2.5
      border-b
      dark:border-b-slate-800
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

      <NavbarMobile />

      <div class="relative hidden lg:flex items-center ml-auto">
        <nav class="text-sm leading-6 font-medium">
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
import NavbarMobile from '../Navbar/NavbarMobile.vue'

const {
  header_links,
  header_logo_text,
  header_logo_url
} = __APP_ENV__

</script>