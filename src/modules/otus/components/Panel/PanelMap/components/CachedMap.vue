<template>
  <VButton
    class="left-2 bottom-2 absolute z-1500"
    circle
    size="lg"
    :title="synchMessage"
    @click="isModalVisible = true"
  >
    <IconCheck
      v-if="cachedMap.synced"
      :title="synchMessage"
      class="w-4 h-4"
    />
    <IconWarning
      v-else
      :title="synchMessage"
      class="w-4 h-4"
    />
  </VButton>
  <VModal
    v-if="isModalVisible"
    @close="() => (isModalVisible = false)"
  >
    <template #header>
      <h3 class="font-medium">{{ $t('panel.map.cached_map.title') }}</h3>
    </template>
    <div class="p-4 pt-0">
      <VTable>
        <VTableHeader>
          <VTableHeaderRow>
            <VTableHeaderCell>
              {{ $t('panel.map.cached_map.data') }}
            </VTableHeaderCell>
            <VTableHeaderCell></VTableHeaderCell>
          </VTableHeaderRow>
        </VTableHeader>
        <VTableBody>
          <VTableBodyRow>
            <VTableBodyCell>
              {{ $t('panel.map.cached_map.is_synced') }}
            </VTableBodyCell>
            <VTableBodyCell>
              <p
                class="text-success flex text-sm items-center"
                v-if="cachedMap.synced"
              >
                <IconCheck class="w-4 h-4" />
                <span class="ml-1"> {{ synchMessage }} * </span>
              </p>
              <p
                class="text-warning flex text-sm items-center"
                v-else
              >
                <IconWarning class="w-4 h-4" />
                <span class="ml-1"> {{ synchMessage }} * </span>
              </p>
            </VTableBodyCell>
          </VTableBodyRow>
          <VTableBodyRow>
            <VTableBodyCell>
              {{ $t('panel.map.cached_map.last_update') }}
            </VTableBodyCell>
            <VTableBodyCell>
              {{ new Date(cachedMap.updated_at) }}
            </VTableBodyCell>
          </VTableBodyRow>
        </VTableBody>
        <VTableHeader>
          <VTableHeaderRow>
            <VTableHeaderCell>{{ $t('common.source') }}</VTableHeaderCell>
            <VTableHeaderCell>{{ $t('common.total') }}</VTableHeaderCell>
          </VTableHeaderRow>
        </VTableHeader>
        <VTableBody>
          <VTableBodyRow
            v-for="(value, key) in cachedMap.source_scope"
            :key="key"
          >
            <VTableBodyCell class="capitalize">
              {{ key.replaceAll('_', ' ') }}
            </VTableBodyCell>
            <VTableBodyCell>
              {{ value }}
            </VTableBodyCell>
          </VTableBodyRow>
        </VTableBody>
      </VTable>
      <p class="italic text-xs pt-4">
        {{ $t('panel.map.cached_map.note') }}
      </p>
    </div>
  </VModal>
</template>
<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  cachedMap: {
    type: Object,
    required: true
  }
})

const { t } = useI18n()
const isModalVisible = ref(false)

const synchMessage = computed(() =>
  props.cachedMap?.synced
    ? t('panel.map.cached_map.synced')
    : t('panel.map.cached_map.not_synced')
)
</script>

<style>
.cached-map-icon {
  right: 20px;
  top: 20px;
  z-index: 1098;
}
</style>
