<template>
  <button
    type="button"
    class="tp-mobile-navbar-button inline-flex items-center p-2 z-50 ml-3 text-sm text-primary-content rounded-lg md:hidden print:hidden"
    :title="$t('component.navbar.menu')"
    aria-controls="mobile-menu"
    :aria-label="$t('component.navbar.open_menu')"
    :aria-expanded="isMenuVisible"
    @click="toggleMenu"
  >
    <span class="sr-only">{{ $t('component.navbar.open_main_menu') }}</span>
    <IconClose v-if="isMenuVisible" />
    <IconHamburger
      class="w-6 h-6"
      v-else
    />
  </button>

  <AnimationOpacity>
    <div
      v-if="isMenuVisible"
      id="mobile-menu"
      class="tp-mobile-navbar absolute top-full left-0 w-full z-50 bg-base-foreground text-base-content block shadow-md md:hidden print:hidden"
    >
      <nav class="font-normal container mx-auto">
        <ul class="flex flex-col m-0 p-0 border-t border-base-border">
          <li
            v-for="(item, index) in header_links"
            :key="index"
            class="border-b border-base-border"
          >
            <div
              v-if="item.submenu"
              class="w-full"
            >
              <div class="font-bold py-3 px-4 border-b bg-base-background">
                {{ item.label }}
              </div>
              <div>
                <div
                  v-for="subItem in item.submenu"
                  :key="subItem.link"
                  class="border-b last:border-b-2 border-b-base-border"
                >
                  <NavbarLink
                    class="cursor-pointer text-base-content w-full py-3 px-4 box-border block"
                    :link="subItem.link"
                    :target="subItem.target"
                    @click="() => (isMenuVisible = false)"
                  >
                    {{ subItem.label }}
                  </NavbarLink>
                </div>
              </div>
            </div>
            <NavbarLink
              v-else
              :link="item.link"
              :target="item.target"
              class="text-base-content w-full p-4 py-3 block box-border"
              @click="() => (isMenuVisible = false)"
            >
              {{ item.label }}
            </NavbarLink>
          </li>
          <!-- Flat rows rather than the header's dropdown: a menu inside an
               open menu is poor on a phone, and there are only ever a handful. -->
          <li
            v-for="item in localeOptions"
            v-show="isMultiLocale"
            :key="item.code"
            class="border-b border-base-border"
          >
            <a
              :href="item.href"
              :hreflang="item.code"
              :lang="item.code"
              :aria-current="item.isCurrent ? 'true' : undefined"
              :class="[
                'text-base-content w-full p-4 py-3 flex items-center gap-2 box-border',
                item.isCurrent && 'font-medium'
              ]"
            >
              <IconLanguage class="size-5" />
              {{ item.label }}
            </a>
          </li>
          <li>
            <ClientOnly>
              <SwitchTheme
                class="text-base-content w-full p-4 pt-3 pb-3 block box-border border-b border-b-base-border"
              />
            </ClientOnly>
          </li>
          <li>
            <TrackerReport
              icon
              icon-class="size-6"
              button-class="text-base-content w-full p-4 pt-3 pb-3 block box-border border-b border-b-base-border"
            />
          </li>
        </ul>
      </nav>
    </div>
  </AnimationOpacity>
</template>

<script setup>
import { ref } from 'vue'
import SwitchTheme from '../SwitchTheme.vue'
import { useLocalizedConfig } from '@/i18n/useLocalizedConfig'
import { useLocaleOptions } from '@/i18n/useLocaleOptions'
import NavbarLink from './NavbarLink.vue'

const { cDeep } = useLocalizedConfig()
const { options: localeOptions, isMultiLocale } = useLocaleOptions()
const header_links = cDeep(__APP_ENV__.header_links)
const isMenuVisible = ref(false)

const toggleMenu = () => {
  isMenuVisible.value = !isMenuVisible.value
}
</script>
