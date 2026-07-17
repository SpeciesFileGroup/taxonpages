<template>
  <ClientOnly>
    <div
      v-if="visibleAnnouncements.length"
      class="relative z-10 flex px-4 py-2 bg-secondary"
      @mouseenter="stopRotation"
      @mouseleave="startRotation"
    >
      <div
        class="flex items-center gap-3 justify-between mx-auto container px-4"
      >
        <Transition
          mode="out-in"
          enter-active-class="transition duration-300 ease-out motion-reduce:transition-none"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-200 ease-in motion-reduce:transition-none"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-1"
        >
          <component
            :is="currentAnnouncement.url ? 'a' : 'span'"
            :key="currentAnnouncement.key"
            class="text-xs font-medium font-mono leading-snug tracking-wide uppercase text-secondary-content"
            :href="currentAnnouncement.url"
            >{{ currentAnnouncement.message }}</component
          >
        </Transition>

        <div class="flex items-center gap-3 shrink-0">
          <div
            v-if="visibleAnnouncements.length > 1"
            class="flex items-center gap-2 text-secondary-content"
          >
            <svg
              class="size-4 -rotate-90"
              viewBox="0 0 20 20"
            >
              <circle
                class="text-secondary-content/30"
                cx="10"
                cy="10"
                r="9"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              />
              <circle
                cx="10"
                cy="10"
                r="9"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                :stroke-dasharray="PROGRESS_CIRCUMFERENCE"
                :stroke-dashoffset="PROGRESS_CIRCUMFERENCE * (1 - progress)"
              />
            </svg>
            <span class="text-xs font-mono tabular-nums text-secondary-content/70">
              {{ currentIndex + 1 }}/{{ visibleAnnouncements.length }}
            </span>
          </div>
          <button
            type="button"
            :title="$t('news.close_announcement')"
            @click="dismiss(currentAnnouncement.key)"
          >
            <IconClose class="text-secondary-content size-4! cursor-pointer" />
          </button>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { localizeDeep } from '@/i18n/localize'
import {
  useDismissedAnnouncements,
  getAnnouncementKey
} from '../composables/useDismissedAnnouncements'

const DEFAULT_INTERVAL = 6
const PROGRESS_RADIUS = 9
const PROGRESS_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS

const { news_module = {} } = __APP_ENV__
const { announcements: rawAnnouncements = [], announcement_interval } =
  news_module

const { locale } = useI18n()

// An announcement's identity must not depend on the reader's language: when it
// has no id, its key is hashed from the message, so keying off the translated
// text would both re-show announcements after a locale switch and make prune()
// discard the dismissals belonging to the other locale. The key is therefore
// taken from the raw config; only the message and url are localized.
const announcements = computed(() =>
  rawAnnouncements.map((announcement) => ({
    ...localizeDeep(announcement, locale.value, __APP_ENV__),
    key: getAnnouncementKey(announcement)
  }))
)

const rotationInterval =
  (Number(announcement_interval) > 0
    ? Number(announcement_interval)
    : DEFAULT_INTERVAL) * 1000

const { isDismissed, dismiss, prune } = useDismissedAnnouncements()

const visibleAnnouncements = computed(() =>
  announcements.value.filter((announcement) => !isDismissed(announcement.key))
)

const currentIndex = ref(0)
const progress = ref(0)
const currentAnnouncement = computed(
  () => visibleAnnouncements.value[currentIndex.value]
)

let rafId = null
let lastTimestamp = null
let elapsed = 0

function advance() {
  elapsed = 0
  progress.value = 0
  currentIndex.value =
    (currentIndex.value + 1) % visibleAnnouncements.value.length
}

function tick(timestamp) {
  if (lastTimestamp === null) lastTimestamp = timestamp

  elapsed += timestamp - lastTimestamp
  lastTimestamp = timestamp
  progress.value = Math.min(elapsed / rotationInterval, 1)

  if (elapsed >= rotationInterval) advance()

  rafId = requestAnimationFrame(tick)
}

function stopRotation() {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }

  lastTimestamp = null
}

function startRotation() {
  stopRotation()

  if (visibleAnnouncements.value.length > 1) {
    rafId = requestAnimationFrame(tick)
  }
}

watch(visibleAnnouncements, (list) => {
  if (currentIndex.value > list.length - 1) {
    currentIndex.value = Math.max(0, list.length - 1)
  }

  elapsed = 0
  progress.value = 0
  startRotation()
})

onMounted(() => {
  prune(announcements.value.map((a) => a.key))
  startRotation()
})

onBeforeUnmount(stopRotation)
</script>
