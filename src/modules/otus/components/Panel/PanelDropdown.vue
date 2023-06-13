<template>
  <Dropdown :items="menuOptions">
    <template #button>
      <IconHamburger class="text-base-soft h-4" />
    </template>
  </Dropdown>
  <VModal
    v-if="isModalVisible"
    @close="isModalVisible = false"
  >
    <template #header>
      <h3>JSON Data</h3>
    </template>
    <div
      class="p-5 font-normal"
      v-if="request"
    >
      <h3 class="pb-2 text-sm">
        URL: <a :href="request.url">{{ request.url }}</a>
      </h3>
      <div class="relative">
        <p
          class="bg-base-background p-2 text-sm font-normal whitespace-pre-wrap"
          v-html="JSON.stringify(request.data, null, 4)"
        />
        <VClipboard
          class="absolute right-2 top-2 opacity-75"
          :text="JSON.stringify(request.data, null, 2)"
        />
      </div>
    </div>
  </VModal>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useOtuPageRequestStore } from '../../store/request'

const props = defineProps({
  panelKey: {
    type: String,
    required: true
  },

  menuOptions: {
    type: Array,
    default: () => []
  }
})

const request = computed(() => store.getRequest(props.panelKey))

const store = useOtuPageRequestStore()
const isModalVisible = ref(false)

const menuOptions = computed(() => [
  ...props.menuOptions,
  {
    label: 'JSON Data',
    action: () => (isModalVisible.value = true)
  }
])
</script>
