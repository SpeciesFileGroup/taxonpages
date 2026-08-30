<template>
  <div class="max-h-64 overflow-y-auto text-xs min-w-80">
    <ul>
      <li
        v-for="(item, i) in items"
        :key="i"
        class="py-2 last:border-0 border-b"
        :class="CLICKABLE_TYPES.includes(item.type) ? 'cursor-pointer text-secondary hover:underline' : ''"
        @click="CLICKABLE_TYPES.includes(item.type) ? emit('selected', item) : null"
      >
        <!-- CollectionObject / FieldOccurrence -->
        <template v-if="CLICKABLE_TYPES.includes(item.type)">
          <div class="text-sm font-medium text-base-soft">{{ TYPE_LABELS[item.type] }}</div>
          <div class="text-xs truncate">
            <span class="italic">{{ splitName(targets?.[i]?.label ?? item.label).name }}</span>
            <span v-if="splitName(targets?.[i]?.label ?? item.label).author">
              {{ ' ' + splitName(targets?.[i]?.label ?? item.label).author }}
            </span>
          </div>
        </template>

        <!-- AssertedDistribution / AssertedAbsent — BA-linked variant -->
        <template v-else-if="AD_TYPES.includes(item.type) && isBaLinked(item, targets?.[i])">
          <div class="text-sm font-medium text-base-soft">Asserted Distribution (Biological Association)</div>
          <div class="text-xs mt-0.5">
            <span v-if="baLoading" class="text-base-soft italic">loading...</span>
            <template v-else-if="baDetailsMap.get(item.id)">
              <RouterLink
                :to="`/otus/${baDetailsMap.get(item.id).otherId}/overview`"
                class="text-secondary hover:underline"
              ><span class="italic">{{ splitName(baDetailsMap.get(item.id).otherLabel).name }}</span>{{ splitName(baDetailsMap.get(item.id).otherLabel).author ? ' ' + splitName(baDetailsMap.get(item.id).otherLabel).author : '' }}</RouterLink>
              <span class="mx-1 text-base-soft">/</span>
              <RouterLink
                :to="`/otus/${targets?.[i]?.id}/overview`"
                class="text-secondary hover:underline"
              ><span class="italic">{{ splitName(targets?.[i]?.label ?? '').name }}</span>{{ splitName(targets?.[i]?.label ?? '').author ? ' ' + splitName(targets?.[i]?.label ?? '').author : '' }}</RouterLink>
            </template>
            <!-- fallback while loading or if match fails -->
            <span v-else class="text-base-content">{{ parseBaRelationship(item.label) }}</span>
          </div>
          <div class="mt-1">
            <span v-if="citationsLoading" class="text-base-soft italic">loading...</span>
            <template v-else>
              <button
                v-for="cit in citationsByItemId.get(item.id) || []"
                :key="cit.id"
                class="text-secondary hover:underline mr-2"
                @click.stop="emit('citation-selected', cit)"
              >{{ cit.display }}</button>
            </template>
          </div>
        </template>

        <!-- AssertedDistribution / AssertedAbsent — regular -->
        <template v-else-if="AD_TYPES.includes(item.type)">
          <div class="text-sm font-medium text-base-soft">
            {{ item.type === ASSERTED_ABSENT ? 'Asserted absent' : 'Asserted distribution' }}
          </div>
          <div class="font-medium truncate">{{ areaNameFor(item) }}</div>
          <div class="text-xs truncate mt-0.5">
            <span class="italic">{{ splitName(targets?.[i]?.label ?? '').name }}</span>
            <span v-if="splitName(targets?.[i]?.label ?? '').author">
              {{ ' ' + splitName(targets?.[i]?.label ?? '').author }}
            </span>
          </div>
          <div class="mt-1">
            <span v-if="citationsLoading" class="text-base-soft italic">loading...</span>
            <template v-else>
              <button
                v-for="cit in citationsByItemId.get(item.id) || []"
                :key="cit.id"
                class="text-secondary hover:underline mr-2"
                @click.stop="emit('citation-selected', cit)"
              >{{ cit.display }}</button>
            </template>
          </div>
        </template>

        <!-- Other / fallback -->
        <span v-else class="truncate">{{ item.label }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { makeAPIRequest } from '@/utils'
import {
  COLLECTION_OBJECT,
  FIELD_OCCURRENCE,
  ASSERTED_DISTRIBUTION,
  ASSERTED_ABSENT
} from '@/constants/objectTypes.js'

const CLICKABLE_TYPES = [COLLECTION_OBJECT, FIELD_OCCURRENCE]
const AD_TYPES = [ASSERTED_DISTRIBUTION, ASSERTED_ABSENT]

const TYPE_LABELS = {
  [COLLECTION_OBJECT]: 'Collection object',
  [FIELD_OCCURRENCE]: 'Field occurrence'
}

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  targets: {
    type: Array,
    default: undefined
  }
})

const emit = defineEmits(['selected', 'citation-selected'])

const citationsByItemId = ref(new Map())
const citationsLoading = ref(false)
const baDetailsMap = ref(new Map())   // item.id → { otherId, otherLabel }
const baLoading = ref(false)

// Module-level caches: persist across popup open/close cycles
const citationCache = new Map()    // itemId → citation[]
const baByTargetId = new Map()     // targetId → BaRecord[] from /biological_associations/basic
const baDetailsCache = new Map()   // item.label → { otherId, otherLabel } | null

// A regular AD label is "{target.label} in {area} [{type}]".
// A BA-linked AD has a relationship verb phrase after the target label instead of " in ".
// This works regardless of which side of the BA the target OTU is on.
function isBaLinked(item, target) {
  if (!target?.label || !item?.label) return false
  if (!item.label.startsWith(target.label)) return true
  const afterTarget = item.label.slice(target.label.length)
  return !afterTarget.startsWith(' in ')
}

watch(
  () => props.items,
  async (items) => {
    // ── Citations for AD items ────────────────────────────────────────────────
    const adIds = items
      .filter((item) => AD_TYPES.includes(item.type) && !citationCache.has(item.id))
      .map((item) => item.id)

    citationsByItemId.value = new Map(
      items.map((item) => [item.id, citationCache.get(item.id) || []])
    )

    // ── BA OTU details for BA-linked ADs ─────────────────────────────────────
    const baItems = items
      .map((item, i) => ({ item, i }))
      .filter(({ item, i }) => AD_TYPES.includes(item.type) && isBaLinked(item, props.targets?.[i]))

    if (baItems.length) {
      const uncached = baItems.filter(({ item }) => !baDetailsCache.has(item.label))

      if (uncached.length) {
        baLoading.value = true
        try {
          const targetIds = [
            ...new Set(uncached.map(({ i }) => props.targets?.[i]?.id).filter(Boolean))
          ]

          for (const targetId of targetIds) {
            if (!baByTargetId.has(targetId)) {
              try {
                const { data } = await makeAPIRequest.get('/biological_associations/basic', {
                  params: { 'otu_id[]': targetId }
                })
                baByTargetId.set(targetId, data)
              } catch {
                baByTargetId.set(targetId, [])
              }
            }
          }

          for (const { item, i } of uncached) {
            const targetId = props.targets?.[i]?.id
            const records = targetId ? (baByTargetId.get(targetId) || []) : []
            let matched = null

            for (const rec of records) {
              const subjLabel = rec.subject?.label
              if (subjLabel && item.label.startsWith(subjLabel)) {
                const isSubjTarget = rec.subject.id === targetId
                matched = {
                  otherId: isSubjTarget ? rec.object.id : rec.subject.id,
                  otherLabel: isSubjTarget ? rec.object.label : subjLabel
                }
                break
              }
            }

            baDetailsCache.set(item.label, matched)
          }
        } catch {
          // uncached entries stay undefined → fall back to label text
        } finally {
          baLoading.value = false
        }
      }

      baDetailsMap.value = new Map(
        baItems.map(({ item }) => [item.id, baDetailsCache.get(item.label) || null])
      )
    }

    // ── Fetch AD citations ────────────────────────────────────────────────────
    if (!adIds.length) return

    citationsLoading.value = true
    try {
      const params = new URLSearchParams()
      params.append('citation_object_type', 'AssertedDistribution')
      adIds.forEach((id) => params.append('citation_object_id[]', id))

      const { data: citations } = await makeAPIRequest.get(`/citations?${params.toString()}`)

      if (citations.length) {
        const sourceIds = [...new Set(citations.map((c) => c.source_id))]
        const srcParams = new URLSearchParams()
        sourceIds.forEach((id) => srcParams.append('source_id[]', id))
        const { data: sources } = await makeAPIRequest.get(`/sources?${srcParams.toString()}`)
        const sourceMap = new Map(sources.map((s) => [s.id, s.cached]))

        for (const cit of citations) {
          if (!citationCache.has(cit.citation_object_id)) {
            citationCache.set(cit.citation_object_id, [])
          }
          citationCache.get(cit.citation_object_id).push({
            id: cit.id,
            display: shortCitation(cit.citation_source_body || ''),
            full: sourceMap.get(cit.source_id) || cit.citation_source_body || ''
          })
        }
      }

      adIds.forEach((id) => {
        if (!citationCache.has(id)) citationCache.set(id, [])
      })
    } catch {
      adIds.forEach((id) => {
        if (!citationCache.has(id)) citationCache.set(id, [])
      })
    } finally {
      citationsLoading.value = false
      citationsByItemId.value = new Map(
        props.items.map((item) => [item.id, citationCache.get(item.id) || []])
      )
    }
  },
  { immediate: true }
)

function areaNameFor(item) {
  const m = item.label?.match(/ in (.+?) \[/)
  return m ? m[1] : item.label
}

// Strips the area suffix and returns the relationship sentence for fallback display
function parseBaRelationship(label) {
  if (!label) return ''
  const m = label.match(/^(.+?) in .+? \[/)
  return m ? m[1] : label
}

function splitName(label) {
  if (!label) return { name: '', author: '' }
  const match = label.match(/^((?:.*\s)?[a-z]\S*)\s+(.+)$/)
  if (!match) return { name: label, author: '' }
  return { name: match[1], author: match[2] }
}

function shortCitation(body) {
  if (!body) return ''
  const m = body.match(/,\s*(\d{4}[a-z]?(?::[^\s,]+)?)\s*$/)
  if (!m) return body
  const year = m[1]
  const authorsStr = body.slice(0, m.index)
  const ampIdx = authorsStr.lastIndexOf('&')
  if (ampIdx < 0 || !authorsStr.slice(0, ampIdx).includes(',')) return body
  return `${authorsStr.split(',')[0].trim()} et al., ${year}`
}
</script>
