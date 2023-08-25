<template>
  <VButton
    type="button"
    title="Report a problem"
    href="http://www.google.com.ar"
    class="flex gap-2"
    :class="buttonClass"
    @click="openTracker"
  >
    <IconGithub
      v-if="icon"
      class="w-5 h-5"
    />
    <span v-if="label">{{ label }}</span>
  </VButton>
  <VModal
    v-if="isModalVisible"
    class="text-base-content"
    @close="isModalVisible = false"
  >
    <template #header>
      <h1 class="font-medium text-base px-1">Report a problem</h1>
    </template>
    <div class="font-normal p-5 pt-0 text-base">
      <span>My issue is with:</span>
      <ul class="mx-5 my-2">
        <li v-for="item in issue_trackers">
          <a :href="item.url">{{ item.label }}</a>
          <span
            v-if="item.description"
            class="text-sm"
          >
            - {{ item.description }}</span
          >
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
    default: 'pl-0 pr-0 pt-0 pb-0'
  },

  label: {
    type: String,
    default: undefined
  },

  icon: {
    type: Boolean,
    default: false
  }
})

const isModalVisible = ref(false)

function openTracker() {
  if (issue_trackers) {
    isModalVisible.value = true
  } else {
    window.open(TAXONPAGES_ISSUE_TRACKER, '_self')
  }
}
</script>
