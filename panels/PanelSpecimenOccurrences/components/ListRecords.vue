<template>
  <VCard>
    <VCardHeader>Specimen records</VCardHeader>
    <VCardContent :class="isLoading && 'min-h-[6rem]'">
      <VSpinner v-if="isLoading" />
      <ul>
        <li
          v-for="item in items"
          :key="item.key"
          class="flex flex-col text-sm px-2 py-4 gap-2 border-b first:pt-0 last:pb-0 last:border-none"
        >
          <div class="flex flex-col">
            <span v-if="item.typeStatus" class="font-medium">{{ item.typeStatus }}</span>
            <span v-html="item.label" />
          </div>
          <div v-if="item.catalogNumbers" class="text-xs">
            <span
              class="text-secondary opacity-60 cursor-pointer"
              @click="toggleExpand(item.key)"
            >{{ expanded.has(item.key) ? 'Hide' : 'Show' }} catalog numbers ({{ item.catalogNumbers.length }})</span>
            <div v-if="expanded.has(item.key)" class="mt-1">{{ item.catalogNumbers.join(', ') }}</div>
          </div>
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

const emit = defineEmits(['select'])

const showAll = ref(false)
const expanded = ref(new Set())

const items = computed(() =>
  showAll.value ? props.list : props.list.slice(0, props.max)
)

function toggleExpand(key) {
  const next = new Set(expanded.value)
  next.has(key) ? next.delete(key) : next.add(key)
  expanded.value = next
}
</script>
