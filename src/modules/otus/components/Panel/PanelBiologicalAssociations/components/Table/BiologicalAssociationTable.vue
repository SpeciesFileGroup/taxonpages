<template>
  <VTable>
    <VTableHeader class="normal-case">
      <VTableHeaderRow>
        <VTableHeaderCell :colspan="subjectColspan">Subject</VTableHeaderCell>
        <VTableHeaderCell class="border-l-2 border-r-2 border-base-border">
          Biological
        </VTableHeaderCell>
        <VTableHeaderCell :colspan="objectColspan"> Object </VTableHeaderCell>
        <VTableHeaderCell
          v-if="visibleColumns.assertedDistribution"
          class="hidden lg:table-cell border-l-2 border-base-border"
        >
          Asserted
        </VTableHeaderCell>
        <VTableHeaderCell
          v-if="visibleColumns.citations || visibleColumns.images"
          :colspan="
            (visibleColumns.citations ? 1 : 0) + (visibleColumns.images ? 1 : 0)
          "
          class="hidden lg:table-cell border-l-2 border-base-border"
        >
          Annotations
        </VTableHeaderCell>
      </VTableHeaderRow>
      <VTableHeaderRow>
        <VTableHeaderCell
          v-if="visibleColumns.subjectOrder"
          class="cursor-pointer"
          @click="toggleSort('subjectOrder')"
          >Order{{ sortIndicator('subjectOrder') }}</VTableHeaderCell
        >
        <VTableHeaderCell
          v-if="visibleColumns.subjectFamily"
          class="cursor-pointer"
          @click="toggleSort('subjectFamily')"
          >Family{{ sortIndicator('subjectFamily') }}</VTableHeaderCell
        >
        <VTableHeaderCell
          v-if="visibleColumns.subjectGenus"
          class="cursor-pointer"
          @click="toggleSort('subjectGenus')"
          >Genus{{ sortIndicator('subjectGenus') }}</VTableHeaderCell
        >
        <VTableHeaderCell
          class="cursor-pointer"
          @click="toggleSort('subjectLabel')"
          >Label{{ sortIndicator('subjectLabel') }}</VTableHeaderCell
        >
        <VTableHeaderCell
          v-if="visibleColumns.subjectProperties"
          class="cursor-pointer"
          @click="toggleSort('biologicalPropertySubject')"
          >Properties{{
            sortIndicator('biologicalPropertySubject')
          }}</VTableHeaderCell
        >
        <VTableHeaderCell
          class="border-l-2 border-r-2 border-base-border cursor-pointer"
          @click="toggleSort('biologicalRelationship')"
        >
          Relationship{{ sortIndicator('biologicalRelationship') }}
        </VTableHeaderCell>
        <VTableHeaderCell
          v-if="visibleColumns.objectProperties"
          class="cursor-pointer"
          @click="toggleSort('biologicalPropertyObject')"
        >
          Properties{{ sortIndicator('biologicalPropertyObject') }}
        </VTableHeaderCell>
        <VTableHeaderCell
          v-if="visibleColumns.objectOrder"
          class="cursor-pointer"
          @click="toggleSort('objectOrder')"
          >Order{{ sortIndicator('objectOrder') }}</VTableHeaderCell
        >
        <VTableHeaderCell
          v-if="visibleColumns.objectFamily"
          class="cursor-pointer"
          @click="toggleSort('objectFamily')"
          >Family{{ sortIndicator('objectFamily') }}</VTableHeaderCell
        >
        <VTableHeaderCell
          v-if="visibleColumns.objectGenus"
          class="cursor-pointer"
          @click="toggleSort('objectGenus')"
          >Genus{{ sortIndicator('objectGenus') }}</VTableHeaderCell
        >
        <VTableHeaderCell
          class="cursor-pointer"
          @click="toggleSort('objectLabel')"
          >Label{{ sortIndicator('objectLabel') }}</VTableHeaderCell
        >
        <VTableHeaderCell
          v-if="visibleColumns.assertedDistribution"
          class="border-l-2 cursor-pointer"
          @click="toggleSort('assertedDistributions')"
        >
          Distribution{{ sortIndicator('assertedDistributions') }}
        </VTableHeaderCell>
        <VTableHeaderCell
          v-if="visibleColumns.citations"
          class="border-l-2 border-base-border cursor-pointer"
          @click="toggleSort('citations')"
        >
          Citations{{ sortIndicator('citations') }}
        </VTableHeaderCell>
        <VTableHeaderCell v-if="visibleColumns.images">
          Images
        </VTableHeaderCell>
      </VTableHeaderRow>
    </VTableHeader>
    <VTableBody>
      <VTableBodyRow
        v-for="ba in sortedRows"
        :key="ba.id"
      >
        <VTableBodyCell
          v-if="visibleColumns.subjectOrder"
          v-text="ba.subjectOrder"
        />
        <VTableBodyCell
          v-if="visibleColumns.subjectFamily"
          v-text="ba.subjectFamily"
        />
        <VTableBodyCell
          v-if="visibleColumns.subjectGenus"
          v-text="ba.subjectGenus"
        />
        <VTableBodyCell>
          <template v-if="ba.subjectType === 'Otu'">
            <RouterLink
              :to="{
                name: 'otus-id',
                params: { id: ba.subjectId }
              }"
              v-html="ba.subjectLabel"
            />
          </template>
          <template v-else>
            {{ ba.subjectLabel }}
          </template>
        </VTableBodyCell>
        <VTableBodyCell
          v-if="visibleColumns.subjectProperties"
          v-text="ba.biologicalPropertySubject"
        />
        <VTableBodyCell
          class="border-l-2 border-r-2 border-base-border"
          v-text="ba.biologicalRelationship"
        />
        <VTableBodyCell
          v-if="visibleColumns.objectProperties"
          v-text="ba.biologicalPropertyObject"
        />
        <VTableBodyCell
          v-if="visibleColumns.objectOrder"
          v-text="ba.objectOrder"
        />
        <VTableBodyCell
          v-if="visibleColumns.objectFamily"
          v-text="ba.objectFamily"
        />
        <VTableBodyCell
          v-if="visibleColumns.objectGenus"
          v-text="ba.objectGenus"
        />
        <VTableBodyCell>
          <template v-if="ba.objectType === 'Otu'">
            <RouterLink
              :to="{
                name: 'otus-id',
                params: { id: ba.objectId }
              }"
              v-html="ba.objectLabel"
            />
          </template>
          <template v-else>
            {{ ba.objectLabel }}
          </template>
        </VTableBodyCell>

        <VTableBodyCell
          v-if="visibleColumns.assertedDistribution"
          class="border-l-2 border-base-border"
        >
          {{ ba.assertedDistributions.join('; ') }}
        </VTableBodyCell>

        <VTableBodyCell
          v-if="visibleColumns.citations"
          class="border-l-2 border-base-border"
        >
          <BiologicalAssociationCitations
            :biological-association="ba"
            :citations="ba.citations"
          />
        </VTableBodyCell>

        <VTableBodyCell v-if="visibleColumns.images">
          <BiologicalAssociationImages :images="ba.images" />
        </VTableBodyCell>
      </VTableBodyRow>
    </VTableBody>
  </VTable>
</template>

<script setup>
import { computed, ref } from 'vue'
import BiologicalAssociationImages from './BiologicalAssociationImages.vue'
import BiologicalAssociationCitations from './BiologicalAssociationCitations.vue'

const props = defineProps({
  biologicalAssociations: {
    type: Array,
    required: true
  },

  citations: {
    type: Boolean,
    default: true
  },

  images: {
    type: Boolean,
    default: true
  },

  assertedDistribution: {
    type: Boolean,
    default: true
  }
})

const visibleColumns = computed(() => ({
  subjectOrder: props.biologicalAssociations.some((ba) => ba.subjectOrder),
  subjectFamily: props.biologicalAssociations.some((ba) => ba.subjectFamily),
  subjectGenus: props.biologicalAssociations.some((ba) => ba.subjectGenus),
  subjectProperties: props.biologicalAssociations.some(
    (ba) => ba.biologicalPropertySubject
  ),
  objectProperties: props.biologicalAssociations.some(
    (ba) => ba.biologicalPropertyObject
  ),
  objectOrder: props.biologicalAssociations.some((ba) => ba.objectOrder),
  objectFamily: props.biologicalAssociations.some((ba) => ba.objectFamily),
  objectGenus: props.biologicalAssociations.some((ba) => ba.objectGenus),
  assertedDistribution:
    props.assertedDistribution &&
    props.biologicalAssociations.some((ba) => ba.assertedDistributions?.length),
  citations:
    props.citations && props.biologicalAssociations.some((ba) => ba.citations),
  images:
    props.images && props.biologicalAssociations.some((ba) => ba.images?.length)
}))

const subjectColspan = computed(
  () =>
    1 +
    [
      visibleColumns.value.subjectOrder,
      visibleColumns.value.subjectFamily,
      visibleColumns.value.subjectGenus,
      visibleColumns.value.subjectProperties
    ].filter(Boolean).length
)

const objectColspan = computed(
  () =>
    1 +
    [
      visibleColumns.value.objectOrder,
      visibleColumns.value.objectFamily,
      visibleColumns.value.objectGenus,
      visibleColumns.value.objectProperties
    ].filter(Boolean).length
)

const sortKey = ref(null)
const sortDirection = ref('asc')

function toggleSort(key) {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDirection.value = 'asc'
  }
}

function sortIndicator(key) {
  if (sortKey.value !== key) return ''
  return sortDirection.value === 'asc' ? ' ▲' : ' ▼'
}

const sortedRows = computed(() => {
  if (!sortKey.value) return props.biologicalAssociations

  return [...props.biologicalAssociations].sort((a, b) => {
    let valA = a[sortKey.value]
    let valB = b[sortKey.value]

    if (Array.isArray(valA)) valA = valA.join('; ')
    if (Array.isArray(valB)) valB = valB.join('; ')

    const cmp = (valA || '').localeCompare(valB || '', undefined, {
      sensitivity: 'base'
    })
    return sortDirection.value === 'asc' ? cmp : -cmp
  })
})
</script>
