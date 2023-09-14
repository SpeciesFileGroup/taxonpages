<template>
  <header
    class="relative bg-header px-2 sm:px-4 py-2.5 shadow-sm shadow-base-muted pl-4 pr-4 h-9 align-middle flex items-center bg-primary-color"
  >
    <div
      class="container flex flex-wrap justify-between items-center mx-auto font-medium text-secondary-content"
    >
      <RouterLink
        to="/"
        class="flex items-center text-primary-content"
      >
        <img
          v-if="header_logo_url"
          class="mr-3 h-10"
          :src="logoUrl"
          :alt="header_logo_text"
        />
        <span>
          {{ header_logo_text || project_name }}
        </span>
      </RouterLink>

      <NavbarMobile />

      <div class="relative hidden md:flex items-center ml-auto">
        <nav class="text-sm leading-6 font-normal">
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

        <div
          class="flex items-center border-l ml-6 pl-6 border-base-muted border-opacity-50"
        >
          <ClientOnly>
            <SwitchTheme class="text-primary-content" />
          </ClientOnly>
        </div>
        <div class="flex items-center ml-2 border-base-muted">
          <TrackerReport icon />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import SwitchTheme from '../SwitchTheme.vue'
import NavbarMobile from '../Navbar/NavbarMobile.vue'
import { isValidUrl } from '@/utils/url'

const {
  header_links,
  header_logo_text,
  header_logo_url,
  base_url,
  project_name
} = __APP_ENV__

const logoUrl = isValidUrl(header_logo_url)
  ? header_logo_url
  : (base_url + header_logo_url).replace('//', '/')
</script>
