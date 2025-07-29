<template>
  <button
    type="button"
    class="tp-mobile-navbar-button inline-flex items-center p-2 z-50 ml-3 text-sm text-primary-content rounded-lg md:hidden print:hidden"
    title="Menu"
    aria-controls="mobile-menu"
    :aria-expanded="isMenuVisible"
    @click="toggleMenu"
  >
    <span class="sr-only">Open main menu</span>
    <IconClose v-if="isMenuVisible" />
    <IconHamburger
      class="w-6 h-6"
      v-else
    />
  </button>

  <AnimationOpacity>
    <div
      v-if="isMenuVisible"
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
                  v-for="item in item.submenu"
                  class="border-b last:border-b-2 border-b-base-border"
                >
                  <RouterLink
                    class="cursor-pointer text-base-content w-full py-3 px-4 box-border block"
                    :to="item.link"
                    @click="() => (isMenuVisible = false)"
                  >
                    {{ item.label }}
                  </RouterLink>
                </div>
              </div>
            </div>
            <RouterLink
              v-else
              :to="item.link"
              class="text-base-content w-full p-4 py-3 block box-border"
              @click="() => (isMenuVisible = false)"
            >
              {{ item.label }}
            </RouterLink>
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

const { header_links } = __APP_ENV__
const isMenuVisible = ref(false)

const toggleMenu = () => {
  isMenuVisible.value = !isMenuVisible.value
}
</script>
