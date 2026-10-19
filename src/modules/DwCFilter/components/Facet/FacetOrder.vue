<template>
  <div>
    <label class="text-base font-medium">{{
      $t('dwc_filter.classification')
    }}</label>

    <div class="grid grid-cols-[auto_1fr_auto] gap-x-2 mt-2">
      <label>{{ $t('dwc_filter.classification_rank') }}</label>
      <label>{{ $t('dwc_filter.classification_name') }}</label>
      <span />
      <div class="grid grid-cols-subgrid col-span-3 gap-y-2">
        <div
          v-for="(row, index) in rows"
          :key="row.id"
          class="grid grid-cols-subgrid col-span-3"
        >
          <SelectInput
            :model-value="row.rank"
            @update:model-value="(rank) => updateRank(row, rank)"
          >
            <option
              v-for="term in availableRanks(row)"
              :key="term"
              :value="term"
            >
              {{ $t(`dwc.labels.${term}`) }}
            </option>
          </SelectInput>
          <InputText
            class="w-full"
            :placeholder="$t('dwc_filter.classification_placeholder')"
            :model-value="row.value"
            @update:model-value="(value) => updateValue(row, value)"
          />
          <VButton
            v-if="rows.length > 1"
            class="self-center"
            ghost
            variant="secondary"
            size="sm"
            :title="$t('dwc_filter.classification_remove')"
            @click="() => removeRow(index)"
          >
            <IconTrash class="w-4 h-4" />
          </VButton>
        </div>
      </div>
    </div>

    <VButton
      v-if="rows.length < DWC_CLASSIFICATION_HIERARCHY.length"
      class="mt-2 flex flex-row gap-1 items-center"
      ghost
      variant="secondary"
      size="sm"
      @click="addRow"
    >
      <IconPlusCircle class="w-4 h-4" />
      {{ $t('dwc_filter.classification_add') }}
    </VButton>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const DWC_CLASSIFICATION_HIERARCHY = [
  'kingdom',
  'phylum',
  'class',
  'order',
  'family',
  'subfamily',
  'tribe',
  'subtribe',
  'genus',
  'subgenus',
  'specificEpithet',
  'infraspecificEpithet'
]

const parameters = defineModel({
  type: Object,
  required: true
})

const rows = ref([])
let nextId = 0

function makeRow(rank, value = '') {
  return { id: nextId++, rank, value }
}

function usedRanks() {
  return rows.value.map((row) => row.rank)
}

function availableRanks(row) {
  const used = usedRanks()

  return DWC_CLASSIFICATION_HIERARCHY.filter(
    (term) => term === row.rank || !used.includes(term)
  )
}

function setParameter(rank, value) {
  if (value) {
    parameters.value[rank] = value
  } else {
    delete parameters.value[rank]
  }
}

function updateRank(row, rank) {
  delete parameters.value[row.rank]
  row.rank = rank
  setParameter(rank, row.value)
}

function updateValue(row, value) {
  row.value = value
  setParameter(row.rank, value)
}

function addRow() {
  const used = usedRanks()
  const rank = DWC_CLASSIFICATION_HIERARCHY.find((term) => !used.includes(term))

  rows.value.push(makeRow(rank))
}

function removeRow(index) {
  const [row] = rows.value.splice(index, 1)

  delete parameters.value[row.rank]
}

// Rebuild rows when the whole parameters object is replaced (initial load
// from the URL query, reset). Edits made here mutate it in place instead.
watch(
  parameters,
  (params) => {
    rows.value = DWC_CLASSIFICATION_HIERARCHY.filter(
      (term) => params[term]
    ).map((term) => makeRow(term, params[term]))

    if (!rows.value.length) {
      addRow()
    }
  },
  { immediate: true }
)
</script>
