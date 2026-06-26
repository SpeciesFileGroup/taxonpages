<template>
  <ClientOnly>
    <div
      v-if="visibleAnnouncements.length"
      class="relative z-10 flex px-4 py-2 bg-secondary"
    >
      <div
        v-for="announcement in visibleAnnouncements"
        :key="getAnnouncementKey(announcement)"
        class="flex items-center gap-2 justify-between mx-auto container px-4"
      >
        <component
          :is="announcement.url ? 'a' : 'span'"
          class="text-xs font-medium font-mono leading-snug tracking-wide uppercase text-secondary-content"
          :href="announcement.url"
          >{{ announcement.message }}</component
        >
        <button
          type="button"
          title="Close"
          @click="dismiss(getAnnouncementKey(announcement))"
        >
          <IconClose class="text-secondary-content size-4! cursor-pointer" />
        </button>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import {
  useDismissedAnnouncements,
  getAnnouncementKey
} from '../composables/useDismissedAnnouncements'

const { news_module = {} } = __APP_ENV__
const { announcements = [] } = news_module

const { isDismissed, dismiss, prune } = useDismissedAnnouncements()

const visibleAnnouncements = computed(() =>
  announcements.filter(
    (announcement) => !isDismissed(getAnnouncementKey(announcement))
  )
)

onMounted(() => {
  prune(announcements.map(getAnnouncementKey))
})
</script>
