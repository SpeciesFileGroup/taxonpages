<template>
  <nav class="tp-header-nav text-sm leading-6 font-normal">
    <div class="flex gap-8">
      <template
        v-for="(item, index) in menu"
        :key="index"
      >
        <div v-if="item.label">
          <RouterLink
            v-if="item.link"
            :to="item.link"
            class="hover:text-primary-content text-primary-content"
          >
            {{ item.label }}
          </RouterLink>
          <NavbarSubmenu
            v-else-if="item.submenu"
            :menu="item.submenu"
            :label="item.label"
          />
        </div>
      </template>
    </div>
  </nav>
</template>

<script setup>
import NavbarSubmenu from './NavbarSubmenu.vue'

defineProps({
  menu: {
    type: Array,
    required: true
  }
})
</script>
