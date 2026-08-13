<template>
  <nav class="tp-header-nav text-sm leading-6 font-normal">
    <div class="flex gap-6">
      <template
        v-for="(item, index) in menu"
        :key="index"
      >
        <div v-if="item.label">
          <NavbarLink
            v-if="item.link"
            :link="item.link"
            :target="item.target"
            class="hover:text-primary-content text-primary-content"
          >
            {{ item.label }}
          </NavbarLink>
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
import NavbarLink from './NavbarLink.vue'

defineProps({
  menu: {
    type: Array,
    required: true
  }
})
</script>
