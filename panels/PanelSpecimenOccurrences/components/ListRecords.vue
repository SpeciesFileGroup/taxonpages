<template>
  <VCard>
    <VCardHeader>Specimen &amp; occurrence records</VCardHeader>
    <VCardContent :class="isLoading && 'min-h-[6rem]'">
      <VSpinner v-if="isLoading" />
      <ul>
        <li
          v-for="item in items"
          :key="item.key"
          class="flex flex-col text-sm px-2 py-4 gap-2 border-b first:pt-0 last:pb-0 last:border-none"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex flex-col flex-1 min-w-0">
              <span v-if="item.typeStatus" class="font-medium">{{ item.typeStatus }}</span>
              <span v-html="item.label" />
            </div>
            <button
              v-if="item.detail"
              type="button"
              class="shrink-0 opacity-40 hover:opacity-100 cursor-pointer leading-none text-xs mt-0.5"
              title="Show details"
              @click="emit('show-detail', item.detail)"
            >ⓘ</button>
          </div>
          <details v-if="item.recordEntries" class="text-xs group">
            <summary class="cursor-pointer text-secondary opacity-60 hover:opacity-100 select-none list-none flex items-center gap-1.5">
              <span class="inline-block motion-safe:transition-transform group-open:rotate-90">›</span>
              Individual records
              <span class="inline-block text-xs font-medium bg-secondary text-secondary-content rounded px-1.5 py-0.5">{{ item.recordEntries.length }}</span>
            </summary>
            <ul class="mt-1 flex flex-col gap-0.5">
              <li
                v-for="entry in item.recordEntries"
                :key="entry.key"
                class="rounded px-1 py-0.5 -mx-1"
                :class="entry.detail ? 'cursor-pointer text-secondary hover:bg-base-foreground' : ''"
                @click="entry.detail && emit('show-detail', entry.detail)"
              >{{ entry.label }}</li>
            </ul>
          </details>
          <GalleryThumbnailList
            v-if="item.associatedMedia?.length"
            :images="item.associatedMedia"
            class="lg:flex-row gap-2 flex-wrap"
            @select-index="
              (index) => emit('select', { images: item.associatedMedia, index })
            "
          />
        </li>
        <li
          v-if="!showAll && list.length > props.max"
          class="flex justify-start pt-4 px-2 cursor-pointer border-base-muted text-sm"
        >
          <div
            class="h-5 w-5 text-secondary opacity-60 mr-2 cursor-pointer"
            @click="() => (showAll = true)"
          >
            <IconPlusCircle class="h-5 w-5" />
          </div>
          <span @click="() => (showAll = true)"
            >... Show all ... ({{ list.length }})</span
          >
        </li>
        <li
          v-else-if="!isLoading && !list.length"
          class="px-2 py-4 text-sm opacity-50"
        >No specimen or field-occurrence records.</li>
      </ul>
    </VCardContent>
  </VCard>
</template>

<script setup>
import GalleryThumbnailList from '@/components/Gallery/GalleryThumbnailList.vue'
import { computed, ref } from 'vue'

const props = defineProps({
  list: {
    type: Array,
    default: () => []
  },

  isLoading: {
    type: Boolean,
    default: false
  },

  max: {
    type: Number,
    default: 2
  }
})

const emit = defineEmits(['select', 'show-detail'])

const showAll = ref(false)

const items = computed(() =>
  showAll.value ? props.list : props.list.slice(0, props.max)
)
</script>
