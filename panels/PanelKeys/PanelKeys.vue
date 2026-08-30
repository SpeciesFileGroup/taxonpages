<template>
  <VCard v-if="count">
    <VCardHeader>Keys ({{ count }})</VCardHeader>
    <VCardContent>
      <template v-for="(group, key) in keys" :key="key">
        <div v-if="[...group.matrices, ...group.leads].length">
          <VTable>
            <VTableHeader>
              <VTableHeaderRow>
                <VTableHeaderCell>{{ key }}</VTableHeaderCell>
              </VTableHeaderRow>
            </VTableHeader>
            <VTableBody>
              <VTableBodyRow v-for="{ id, name, is_media } in group.matrices" :key="id">
                <VTableBodyCell>
                  <RouterLink
                    :to="{
                      name: is_media ? 'image-matrices-id' : 'interactive-key',
                      params: { id }
                    }"
                    v-text="name"
                  />
                </VTableBodyCell>
              </VTableBodyRow>
              <VTableBodyRow v-for="{ text, id } in group.leads" :key="id">
                <VTableBodyCell>
                  <RouterLink :to="{ name: 'dichotomous-key', params: { id } }" v-text="text" />
                </VTableBodyCell>
              </VTableBodyRow>
            </VTableBody>
          </VTable>
        </div>
      </template>
    </VCardContent>
  </VCard>
</template>

<script setup>
import TaxonWorks from '@/modules/otus/services/TaxonWorks.js'
import { useOtuPageRequest } from '@/modules/otus/helpers/useOtuPageRequest.js'
import { makeAPIRequest } from '@/utils/request'
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'

const props = defineProps({
  otuId: { type: Number },
  // taxon.id is the taxon-name id — used to find this taxon's coordinate OTUs.
  taxon: { type: Object, default: undefined }
})

const controller = new AbortController()
const keys = ref({ to: {}, in: {} })

const count = computed(
  () =>
    [...Object.values(keys.value.to), ...Object.values(keys.value.in)].flat().length
)

// /otus/:id/inventory/keys matches a key's leaf lead by its EXACT otu_id. A key
// whose terminal points at a *coordinate* OTU of this taxon (same taxon name,
// different OTU — e.g. "Brentidae (except Nanophyinae)") is therefore invisible
// on this taxon's page. Fetch each coordinate OTU's keys too and merge them in,
// deduped by id. Server has no param for this (Lead.public_root_leads_for_leaf_otus
// uses otu.leads directly), so it's done client-side.
async function mergeCoordinateKeys(acc) {
  if (!props.taxon?.id) return
  let coords = []
  try {
    const { data } = await makeAPIRequest.get('/otus', {
      params: { 'taxon_name_id[]': [props.taxon.id], per: 50 },
      signal: controller.signal
    })
    coords = (Array.isArray(data) ? data : [])
      .map((o) => o.id)
      .filter((id) => id && id !== props.otuId)
  } catch {
    return
  }
  if (!coords.length) return

  const results = await Promise.all(
    coords.map((id) => TaxonWorks.getKeys(id).then((r) => r.data).catch(() => null))
  )
  const pushNew = (list, items) => {
    for (const it of items || []) {
      if (!list.some((x) => x.id === it.id)) list.push(it)
    }
  }
  for (const d of results) {
    if (!d) continue
    pushNew(acc.to.matrices, d.observation_matrices?.scoped)
    pushNew(acc.to.leads, d.leads?.scoped)
    pushNew(acc.in.matrices, d.observation_matrices?.in)
    pushNew(acc.in.leads, d.leads?.in)
  }
}

onMounted(() => {
  const params = { otu_id: props.otuId }

  useOtuPageRequest('panel keys', () =>
    TaxonWorks.getKeys(props.otuId, { signal: controller.signal, params })
  )
    .then(async ({ data }) => {
      const acc = {
        to: {
          matrices: [...data.observation_matrices.scoped],
          leads: [...data.leads.scoped]
        },
        in: {
          matrices: [...data.observation_matrices.in],
          leads: [...data.leads.in]
        }
      }
      await mergeCoordinateKeys(acc)
      keys.value = acc
    })
    .catch(() => {})
})

onBeforeUnmount(() => {
  controller?.abort()
})
</script>
