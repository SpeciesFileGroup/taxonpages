<template>
  <button
    type="button"
    class="
      inline-flex
      items-center
      p-2 z-50
      ml-3
      text-sm
      text-primary-content
      rounded-lg
      md:hidden
      print:hidden"
    aria-controls="mobile-menu"
    aria-expanded="false"
    @click="toggleMenu"
  >
    <span class="sr-only">Open main menu</span>
    <IconClose v-if="isMenuVisible" />
    <IconHamburger v-else />
  </button>

  <AnimationOpacity>
    <div
      v-if="isMenuVisible"
      class="
        absolute
        top-full
        left-0
        w-full
        z-50
        bg-base-foreground
        block
        md:hidden
        print:hidden"
    >
      <nav class="font-normal">
        <ul class="flex flex-col m-0 p-0">
          <li
            v-for="(item, index) in header_links"
            :key="index"
            class="border-b"
          >
            <router-link
              :to="item.link"
              class="text-base-content w-full p-4 block box-border"
            >
              {{ item.label }}
            </router-link>
          </li>
          <li>
            <SwitchTheme class="text-primary-content" />
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

const toggleMenu = () => { isMenuVisible.value = !isMenuVisible.value }

</script>