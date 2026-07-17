<template>
  <component
    :is="tag"
    type="button"
    :title="$t('component.tracker.title')"
    :class="[buttonClass, 'cursor-pointer']"
    :aria-label="$t('component.tracker.title')"
    @click="openTracker"
  >
    <IconGithub
      v-if="icon"
      :class="iconClass"
    />
    <span v-if="label">{{ label }}</span>
  </component>
  <VModal
    v-if="isModalVisible"
    class="tp-tracker-report-modal text-base-content"
    :aria-label="$t('component.tracker.title')"
    @close="isModalVisible = false"
  >
    <template #header>
      <h1 class="font-medium text-base px-1">{{ $t('component.tracker.title') }}</h1>
    </template>
    <div class="font-normal p-5 pt-0 text-base">
      <span>{{ $t('component.tracker.issue_with') }}</span>
      <ul class="mx-5 my-2">
        <li v-for="item in issue_trackers">
          <a
            :href="item.url"
            target="_blank"
            rel="noopener"
          >
            {{ item.label }}
            <span class="sr-only">{{ $t('component.tracker.opens_new_window') }}</span>
          </a>
          <span
            v-if="item.description"
            class="text-sm"
          >
            - {{ item.description }}
          </span>
        </li>
      </ul>
    </div>
  </VModal>
</template>

<script setup>
import { ref } from 'vue'

const { issue_trackers } = __APP_ENV__
const TAXONPAGES_ISSUE_TRACKER =
  'https://github.com/SpeciesFileGroup/taxonpages/issues/new/choose'

defineProps({
  buttonClass: {
    type: String,
    default: undefined
  },

  label: {
    type: String,
    default: undefined
  },

  icon: {
    type: Boolean,
    default: false
  },

  iconClass: {
    type: Array,
    default: () => ['w-5.5 h-5.5']
  },

  tag: {
    type: String,
    default: 'button'
  }
})

const isModalVisible = ref(false)

function openTracker() {
  if (issue_trackers) {
    isModalVisible.value = true
  } else {
    window.open(TAXONPAGES_ISSUE_TRACKER, '_blank')
  }
}
</script>
