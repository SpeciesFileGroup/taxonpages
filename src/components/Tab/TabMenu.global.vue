<template>
  <nav :aria-label="$t('component.navbar.section_navigation')">
    <ul class="tp-tab-list inline-flex items-center gap-0.5 flex-wrap border-b border-base-border/60">
      <slot />
    </ul>
  </nav>
</template>
