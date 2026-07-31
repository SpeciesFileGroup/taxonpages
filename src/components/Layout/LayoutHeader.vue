<template>
  <header
    class="tp-header relative bg-primary px-4 sm:px-6 py-2 min-h-10 shadow-sm shadow-base-muted/50 align-middle flex items-center"
  >
    <div
      class="container flex flex-wrap justify-between items-center mx-auto font-medium text-secondary-content"
    >
      <RouterLink
        to="/"
        class="flex items-center !text-primary-content"
      >
        <img
          v-if="header_logo_url"
          class="mr-3 h-10"
          :src="logoUrl"
          alt=""
        />
        <span>
          {{ header_logo_text || project_name }}
        </span>
      </RouterLink>

      <NavbarMobile />

      <div class="relative hidden md:flex items-center ml-auto gap-5">
        <NavbarMenu :menu="header_links" />
        <div class="h-6 w-px ml-[1px] bg-primary-content/25"></div>
        <div class="flex flex-row gap-4">
          <div class="flex items-center">
            <ClientOnly>
              <SwitchTheme class="text-primary-content" />
            </ClientOnly>
          </div>
          <div class="flex items-center border-base-border/50">
            <TrackerReport
              icon
              button-class="text-primary-content"
            />
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import SwitchTheme from '../SwitchTheme.vue'
import NavbarMenu from '../Navbar/NavbarMenu.vue'
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
