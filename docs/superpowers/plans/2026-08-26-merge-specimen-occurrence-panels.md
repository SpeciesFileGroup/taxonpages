# Merge Specimen/FieldOccurrence Panels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge `PanelSpecimenRecords` and `PanelFieldOccurrences` into one `PanelSpecimenOccurrences` panel with a single shared fetch, one flat grouped list (type specimens first, same-event records collapsed), and no duplicate `dwc.json` network call.

**Architecture:** A new panel folder holds a pure, dependency-free grouping module (`lib/groupRecords.js`) plus the Vue panel/list components. The panel component keeps the existing fetch/hydration logic (institution-name resolution, media hydration, type-material cross-reference) unchanged from `PanelSpecimenRecords.vue`, but now applies it uniformly to both CollectionObject and FieldOccurrence records, then pipes the hydrated records through `groupRecords()` before rendering. Old panels are deleted once the new one is verified working in the browser.

**Tech Stack:** Vue 3 `<script setup>`, Tailwind v4, `makeAPIRequest` (TaxonWorks API), plain `fetch` (GRSciColl). No test framework in this repo — pure logic is verified with throwaway Node scripts; UI is verified manually in the browser (`npm run dev`), per this repo's existing convention (see `CLAUDE.md`).

**Spec:** `docs/superpowers/specs/2026-08-26-merge-specimen-occurrence-panels-design.md`

## Global Constraints

- One shared fetch of `/otus/:otuId/inventory/dwc.json` per panel load (no duplicate network call).
- Grouping key: `(dwc_occurrence_object_type, typeStatus, country, stateProvince, county, verbatimLocality, eventDate, recordedBy)`.
- Records where every locality/date/collector field is empty are never grouped with each other.
- Render order: all type-specimen groups first, then all other groups; each bucket sorted media-present-first (matches current `PanelSpecimenRecords` tiebreak).
- No filter control (All/Types/Specimens/Field occurrences) in this pass.
- Row detail stays the existing built inline label string — no `DwcTable` modal wiring for row detail in this pass.
- `panels/PanelSpecimenRecords/` and `panels/PanelFieldOccurrences/` are deleted entirely once the new panel is verified.

---

## Task 1: Pure grouping/collapsing module

**Files:**
- Create: `panels/PanelSpecimenOccurrences/lib/groupRecords.js`

**Interfaces:**
- Consumes: nothing (pure function, no imports from this codebase).
- Produces (used by Task 2):
  - `buildGroupKey(record: object): string`
  - `groupRecords(records: object[]): Array<{ records: object[], isGroup: boolean, totalCount: number, uniformSex: string|null }>` — each input record is a hydrated `dwc.json` row (has `dwc_occurrence_object_type`, `typeStatus`, `country`, `stateProvince`, `county`, `verbatimLocality`, `eventDate`, `recordedBy`, `individualCount`, `sex`, `associatedMedia` — an array once hydrated, `catalogNumber`, `id`).
  - `groupCountLabel(group: { records, totalCount, uniformSex }): string` — e.g. `"2 Paratypes"`, `"3 male"`, `"5 specimens"`, `"4 occurrences"`. Only meaningful when `group.isGroup` is true.

- [ ] **Step 1: Write the throwaway verification script**

Create `/tmp/groupRecords.test.mjs` (outside the repo — this is a one-off check, this codebase has no test framework/convention to add one to):

```js
import assert from 'node:assert/strict'
import { groupRecords, groupCountLabel, buildGroupKey } from '/home/jakobj/Data/01Aktuelle_Projekte/0_TaxonWorks/TaxonPagesDev/taxa/.claude/worktrees/merge-specimen-occurrence-panels/panels/PanelSpecimenOccurrences/lib/groupRecords.js'

const rec = (overrides) => ({
  id: overrides.id,
  dwc_occurrence_object_type: 'CollectionObject',
  typeStatus: null,
  country: 'Germany',
  stateProvince: 'Bavaria',
  county: null,
  verbatimLocality: 'Munich',
  eventDate: '2020-05-01',
  recordedBy: 'J. Jilg',
  individualCount: 1,
  sex: null,
  associatedMedia: [],
  catalogNumber: null,
  ...overrides
})

// 1. Two paratypes from the same event collapse into one group
{
  const records = [
    rec({ id: 1, typeStatus: 'Paratype', catalogNumber: 'A1' }),
    rec({ id: 2, typeStatus: 'Paratype', catalogNumber: 'A2' })
  ]
  const groups = groupRecords(records)
  assert.equal(groups.length, 1)
  assert.equal(groups[0].isGroup, true)
  assert.equal(groups[0].totalCount, 2)
  assert.equal(groupCountLabel(groups[0]), '2 Paratypes')
}

// 2. A holotype from the same event as paratypes stays a separate row
{
  const records = [
    rec({ id: 1, typeStatus: 'Holotype', catalogNumber: 'H1' }),
    rec({ id: 2, typeStatus: 'Paratype', catalogNumber: 'A1' }),
    rec({ id: 3, typeStatus: 'Paratype', catalogNumber: 'A2' })
  ]
  const groups = groupRecords(records)
  assert.equal(groups.length, 2)
  const holo = groups.find((g) => g.records[0].typeStatus === 'Holotype')
  const para = groups.find((g) => g.records[0].typeStatus === 'Paratype')
  assert.equal(holo.isGroup, false)
  assert.equal(para.isGroup, true)
  assert.equal(para.totalCount, 2)
}

// 3. Type groups render before non-type groups regardless of input order
{
  const records = [
    rec({ id: 1, typeStatus: null, individualCount: 3 }),
    rec({ id: 2, typeStatus: 'Holotype' })
  ]
  const groups = groupRecords(records)
  assert.equal(groups[0].records[0].typeStatus, 'Holotype')
  assert.equal(groups[1].records[0].typeStatus, null)
}

// 4. CollectionObject and FieldOccurrence with identical event fields never merge
{
  const records = [
    rec({ id: 1, dwc_occurrence_object_type: 'CollectionObject', typeStatus: null }),
    rec({ id: 2, dwc_occurrence_object_type: 'FieldOccurrence', typeStatus: null })
  ]
  const groups = groupRecords(records)
  assert.equal(groups.length, 2)
}

// 5. Records with no event fields at all never collapse with each other
{
  const blank = {
    country: null, stateProvince: null, county: null,
    verbatimLocality: null, eventDate: null, recordedBy: null
  }
  const records = [
    rec({ id: 1, typeStatus: null, ...blank }),
    rec({ id: 2, typeStatus: null, ...blank })
  ]
  const groups = groupRecords(records)
  assert.equal(groups.length, 2)
  assert.equal(groups[0].isGroup, false)
  assert.equal(groups[1].isGroup, false)
}

// 6. Uniform sex is shown; mixed sex falls back to plain noun
{
  const uniform = groupRecords([
    rec({ id: 1, sex: 'male' }),
    rec({ id: 2, sex: 'male' })
  ])[0]
  assert.equal(groupCountLabel(uniform), '2 male')

  const mixed = groupRecords([
    rec({ id: 1, sex: 'male' }),
    rec({ id: 2, sex: 'female' })
  ])[0]
  assert.equal(groupCountLabel(mixed), '2 specimens')
}

// 7. Group with media sorts before a group without, within the same bucket
{
  const records = [
    rec({ id: 1, country: 'A', associatedMedia: [] }),
    rec({ id: 2, country: 'B', associatedMedia: [{ id: 'img' }] })
  ]
  const groups = groupRecords(records)
  assert.equal(groups[0].records[0].country, 'B')
  assert.equal(groups[1].records[0].country, 'A')
}

// 8. buildGroupKey is stable for identical inputs
{
  assert.equal(buildGroupKey(rec({ id: 1 })), buildGroupKey(rec({ id: 2 })))
}

console.log('All groupRecords tests passed.')
```

- [ ] **Step 2: Run it to verify it fails (module doesn't exist yet)**

Run: `node /tmp/groupRecords.test.mjs`
Expected: FAIL with a module-not-found error (`panels/PanelSpecimenOccurrences/lib/groupRecords.js` doesn't exist yet).

- [ ] **Step 3: Create the module**

Create `panels/PanelSpecimenOccurrences/lib/groupRecords.js`:

```js
// Pure grouping/collapsing logic for the merged specimen/field-occurrence
// list. No network calls, no Vue — testable with a plain Node script.
// See docs/superpowers/specs/2026-08-26-merge-specimen-occurrence-panels-design.md

const KEY_FIELDS = [
  'country',
  'stateProvince',
  'county',
  'verbatimLocality',
  'eventDate',
  'recordedBy'
]

export function buildGroupKey(record) {
  return [record.dwc_occurrence_object_type, record.typeStatus || '']
    .concat(KEY_FIELDS.map((f) => record[f] || ''))
    .join('|')
}

function hasNoEventFields(record) {
  return KEY_FIELDS.every((f) => !record[f])
}

function hasMedia(records) {
  return records.some((r) => r.associatedMedia && r.associatedMedia.length)
}

function sortGroups(groups) {
  return [...groups].sort((a, b) => {
    const aMedia = hasMedia(a.records)
    const bMedia = hasMedia(b.records)
    if (aMedia && !bMedia) return -1
    if (!aMedia && bMedia) return 1
    return 0
  })
}

function uniformSex(records) {
  const sexes = new Set(records.map((r) => r.sex).filter(Boolean))
  return sexes.size === 1 ? [...sexes][0] : null
}

function groupBucket(records) {
  const singles = []
  const byKey = new Map()

  records.forEach((record) => {
    if (hasNoEventFields(record)) {
      singles.push([record])
      return
    }
    const key = buildGroupKey(record)
    if (!byKey.has(key)) byKey.set(key, [])
    byKey.get(key).push(record)
  })

  return sortGroups(
    [...Array.from(byKey.values()), ...singles].map((records) => ({ records }))
  )
}

// Splits records into a type bucket (CollectionObject with a typeStatus) and
// everything else, groups each bucket by buildGroupKey, and returns the
// final render order: all type groups first, then all other groups, each
// bucket sorted media-present-first.
export function groupRecords(records) {
  const typeRecords = records.filter(
    (r) => r.dwc_occurrence_object_type === 'CollectionObject' && r.typeStatus
  )
  const otherRecords = records.filter(
    (r) => !(r.dwc_occurrence_object_type === 'CollectionObject' && r.typeStatus)
  )

  return [...groupBucket(typeRecords), ...groupBucket(otherRecords)].map(
    (group) => ({
      records: group.records,
      isGroup: group.records.length > 1,
      totalCount: group.records.reduce((sum, r) => sum + r.individualCount, 0),
      uniformSex: uniformSex(group.records)
    })
  )
}

function pluralize(word) {
  return word.endsWith('s') ? word : `${word}s`
}

// Aggregated "count + sex/noun" text for a collapsed group row, replacing
// the single-record getCountAndSex() output. Sex is only shown when every
// member of the group shares the same sex; otherwise falls back to a plain
// noun (pluralized type status for type groups, "specimens"/"occurrences"
// otherwise). Only meaningful for isGroup groups (records.length > 1).
export function groupCountLabel(group) {
  if (group.uniformSex) {
    return `${group.totalCount} ${group.uniformSex}`
  }
  const first = group.records[0]
  const noun =
    first.dwc_occurrence_object_type === 'CollectionObject' && first.typeStatus
      ? pluralize(first.typeStatus)
      : first.dwc_occurrence_object_type === 'FieldOccurrence'
        ? 'occurrences'
        : 'specimens'
  return `${group.totalCount} ${noun}`
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node /tmp/groupRecords.test.mjs`
Expected: `All groupRecords tests passed.`

(This exact module + test were already run successfully during planning — re-running here is a sanity check that the file was created correctly, not exploratory.)

- [ ] **Step 5: Delete the throwaway script and commit the module**

```bash
rm /tmp/groupRecords.test.mjs
git add panels/PanelSpecimenOccurrences/lib/groupRecords.js
git commit -m "$(cat <<'EOF'
Add pure grouping/collapsing module for merged specimen panel

Groups hydrated dwc.json records by event (locality+date+collector)
plus record type and type status, so same-event specimens collapse
into one row while a holotype never merges with its paratypes.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: New panel, components, config wiring, cleanup

**Files:**
- Create: `panels/PanelSpecimenOccurrences/PanelSpecimenOccurrences.vue`
- Create: `panels/PanelSpecimenOccurrences/components/ListRecords.vue`
- Create: `panels/PanelSpecimenOccurrences/main.js`
- Modify: `config/taxa_page.yml:25-27`
- Delete: `panels/PanelSpecimenRecords/` (entire folder: `PanelSpecimenRecords.vue`, `main.js`, `components/ListSpecimens.vue`, `components/ListTypeSpecimens.vue`)
- Delete: `panels/PanelFieldOccurrences/` (entire folder: `PanelFieldOccurrences.vue`, `main.js`, `components/ListOccurrences.vue`)

**Interfaces:**
- Consumes: `groupRecords`, `groupCountLabel` from `./lib/groupRecords.js` (Task 1).
- Produces: panel id `panel:specimen-occurrences`, registered via `main.js`, mounted wherever `config/taxa_page.yml` lists it (the `specimen_records` tab). `ListRecords.vue` consumes a `list` prop shaped as `Array<{ key: string, typeStatus: string|null, label: string, associatedMedia: object[], catalogNumbers: string[]|null }>` and emits `select({ images, index })`, matching the existing `ImageViewer` wiring pattern used by every other list-of-specimens component in this repo.

- [ ] **Step 1: Create the list component**

Create `panels/PanelSpecimenOccurrences/components/ListRecords.vue`:

```vue
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
```

Note: the original `ListSpecimens.vue`/`ListTypeSpecimens.vue`/`ListOccurrences.vue` "show all" icon's click handler referenced an undeclared `isExpanded` variable (a latent bug — clicking the icon would throw). Fixed here by having the icon set `showAll = true` directly, same as the adjacent text span.

- [ ] **Step 2: Create the panel component**

Create `panels/PanelSpecimenOccurrences/PanelSpecimenOccurrences.vue`:

```vue
<template>
  <div class="flex flex-col gap-3">
    <ListRecords
      :list="listItems"
      :is-loading="isLoading"
      :max="MAX"
      @select="setCurrentImages"
    />

    <ImageViewer
      v-if="isViewerVisible"
      :images="currentImages"
      :index="currentIndex"
      :next="currentImages.length - 1 > currentIndex"
      :previous="currentIndex > 0"
      @select-index="(index) => (currentIndex = index)"
      @next="() => currentIndex++"
      @previous="() => currentIndex--"
      @close="() => (isViewerVisible = false)"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { makeAPIRequest } from '@/utils'
import ListRecords from './components/ListRecords.vue'
import { groupRecords, groupCountLabel } from './lib/groupRecords'

// Module-level cache: institutionCode → full name
const instNameCache = new Map()

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

// Type material labels look like "Holotype; adult; <identifier>; deposited at: <institution>; <verbatim>"
// <identifier> is the catalogNumber, or (when none was entered) the specimen's occurrenceID UUID.
// The "deposited at:" segment is sometimes absent (no repository recorded), so look for a bare
// UUID first — it's unambiguous regardless of label shape — before falling back to position.
function extractTypeIdentifier(label) {
  const uuidMatch = label.match(UUID_RE)
  if (uuidMatch) return uuidMatch[0]

  const parts = label.split('; ')
  const depositedIndex = parts.findIndex((p) => p.startsWith('deposited at:'))
  return depositedIndex > 0 ? parts[depositedIndex - 1].trim() : null
}

// Type specimens are only found by the OTU dwc.json endpoint when they carry a current
// determination to this OTU. Specimens whose determination was never updated (e.g. after
// a name change) are known to TaxonWorks only via type_material.json, so fetch those
// individually and merge them in.
async function fetchMissingTypeSpecimens(typeLabels, existingRecords) {
  const known = new Set(existingRecords.map((r) => r.occurrenceID).filter(Boolean))
  const queued = new Set()
  const found = []

  await Promise.all(
    typeLabels.map(async ({ label }) => {
      const identifier = extractTypeIdentifier(label)
      if (!identifier || queued.has(identifier)) return
      queued.add(identifier)

      const isUuid = UUID_RE.test(identifier)
      if (isUuid && known.has(identifier)) return
      if (!isUuid && existingRecords.some((r) => r.catalogNumber === identifier)) return

      try {
        const { data } = await makeAPIRequest.get('/dwc_occurrences.json', {
          params: isUuid ? { occurrenceID: identifier } : { catalogNumber: identifier }
        })
        if (data?.length === 1) found.push(data[0])
      } catch {}
    })
  )

  return found
}

async function resolveInstitutionName(code, institutionID) {
  if (!code) return null
  if (instNameCache.has(code)) return instNameCache.get(code)
  try {
    if (institutionID) {
      const r = await fetch(`https://api.gbif.org/v1/grscicoll/institution?identifier=${encodeURIComponent(institutionID)}`)
      if (r.ok) {
        const j = await r.json()
        if (j.results?.length === 1) {
          instNameCache.set(code, j.results[0].name)
          return j.results[0].name
        }
      }
    }
    const r = await fetch(`https://api.gbif.org/v1/grscicoll/institution?code=${encodeURIComponent(code)}`)
    if (r.ok) {
      const j = await r.json()
      if (j.results?.length === 1) {
        instNameCache.set(code, j.results[0].name)
        return j.results[0].name
      }
    }
  } catch {}
  instNameCache.set(code, null)
  return null
}

const MAX = 10

const props = defineProps({
  otuId: {
    type: Number,
    required: true
  }
})

const currentIndex = ref(0)
const currentImages = ref([])
const isViewerVisible = ref(false)
const isLoading = ref(false)

const dwcRecords = ref([])

function loadDwc() {
  isLoading.value = true
  Promise.all([
    makeAPIRequest.get(`/otus/${props.otuId}/inventory/dwc.json`),
    makeAPIRequest
      .get(`/otus/${props.otuId}/inventory/type_material.json`)
      .catch(() => ({ data: { type_materials_catalog_labels: [] } }))
  ])
    .then(async ([{ data }, { data: typeMaterialData }]) => {
      const missingTypeSpecimens = await fetchMissingTypeSpecimens(
        typeMaterialData.type_materials_catalog_labels || [],
        data
      )
      data.push(...missingTypeSpecimens)

      await Promise.all(
        data.map(async (item) => {
          if (item.associatedMedia) {
            item.associatedMedia = await getMediaImages(item)
          }
        })
      )

      // Resolve institution names for unique codes (deduplicated by code)
      const seenCodes = new Set()
      await Promise.all(
        data
          .filter((d) => d.institutionCode && !seenCodes.has(d.institutionCode) && seenCodes.add(d.institutionCode))
          .map((d) => resolveInstitutionName(d.institutionCode, d.institutionID))
      )

      dwcRecords.value = data.map((d) => ({
        ...d,
        label: makeLabel(d)
      }))
    })
    .finally(() => {
      isLoading.value = false
    })
}

function getLocalityData(data) {
  const area = [
    data.country,
    data.stateProvince,
    data.county,
    data.verbatimLocality
  ]
    .filter(Boolean)
    .join(', ')

  return area
}

function makeLabel(item) {
  return item.dwc_occurrence_object_type === 'FieldOccurrence'
    ? makeFieldOccurrenceLabel(item)
    : makeSpecimenLabel(item)
}

function makeSpecimenLabel(item) {
  return [
    getCountAndSex(item),
    getDepositoryData(item),
    item.catalogNumber,
    getLocalityData(item),
    getCoordinates(item),
    getCollector(item)
  ]
    .filter(Boolean)
    .join('; ')
}

function makeFieldOccurrenceLabel(item) {
  return [
    getCountAndSex(item),
    getLocalityData(item),
    getCoordinates(item),
    getCollector(item)
  ]
    .filter(Boolean)
    .join('; ')
}

// Shared label for a collapsed group of 2+ records: same pieces as
// makeSpecimenLabel/makeFieldOccurrenceLabel, but the per-record count+sex
// is replaced by the group's aggregated count (groupCountLabel) and the
// single catalogNumber is dropped (the list component renders a "show
// catalog numbers" disclosure for CO groups with more than one instead).
function makeGroupLabel(group) {
  const first = group.records[0]
  const parts = [groupCountLabel(group)]
  if (first.dwc_occurrence_object_type === 'CollectionObject') {
    parts.push(getDepositoryData(first))
  }
  parts.push(getLocalityData(first), getCoordinates(first), getCollector(first))
  return parts.filter(Boolean).join('; ')
}

function getDepositoryData(data) {
  const { institutionCode, institutionID } = data
  if (!institutionCode) return
  const fullName = instNameCache.get(institutionCode)
  const display = fullName ? `${fullName} (${institutionCode})` : institutionCode
  return institutionID
    ? `<a href="${institutionID}" target="_blank">${display}</a>`
    : `<span>${display}</span>`
}

function getCountAndSex({ individualCount, sex }) {
  return sex
    ? `${individualCount} ${sex}`
    : `${individualCount} specimen${individualCount > 1 ? 's' : ''}`
}

function getCollector({ recordedBy }) {
  return recordedBy ? `Col. ${recordedBy}` : ''
}

function getCoordinates({ verbatimCoordinates }) {
  const coordinates = verbatimCoordinates?.split(' ').join(', ')

  return coordinates ? `(${coordinates})` : ''
}

function toListItem(group) {
  const first = group.records[0]
  const key = group.records.map((r) => r.id).join('-')
  const media = group.records.flatMap((r) => r.associatedMedia || [])

  if (!group.isGroup) {
    return {
      key,
      typeStatus: first.typeStatus,
      label: first.label,
      associatedMedia: media,
      catalogNumbers: null
    }
  }

  const catalogNumbers =
    first.dwc_occurrence_object_type === 'CollectionObject'
      ? [...new Set(group.records.map((r) => r.catalogNumber).filter(Boolean))]
      : []

  return {
    key,
    typeStatus: first.typeStatus,
    label: makeGroupLabel(group),
    associatedMedia: media,
    catalogNumbers: catalogNumbers.length > 1 ? catalogNumbers : null
  }
}

const listItems = computed(() => groupRecords(dwcRecords.value).map(toListItem))

onMounted(loadDwc)

async function getMediaImages(item) {
  const links = item.associatedMedia.split('|')
  const promises = []

  links.forEach((link) => {
    promises.push(
      makeAPIRequest.get(link.trim(), {
        params: {
          extend: ['attribution', 'depictions', 'source']
        }
      })
    )
  })

  return await Promise.all(promises).then((responses) => {
    return responses.map((item) => item.data)
  })
}

function setCurrentImages({ images, index }) {
  currentImages.value = images
  currentIndex.value = index
  isViewerVisible.value = true
}
</script>
```

- [ ] **Step 3: Create `main.js`**

Create `panels/PanelSpecimenOccurrences/main.js`:

```js
import PanelSpecimenOccurrences from './PanelSpecimenOccurrences.vue'

export default {
  id: 'panel:specimen-occurrences',
  component: PanelSpecimenOccurrences
}
```

- [ ] **Step 4: Wire into `config/taxa_page.yml`**

In `config/taxa_page.yml`, replace lines 25-27:

```yaml
    panels:
      - - - panel:specimen-records
      - - - panel:field-occurrences
```

with:

```yaml
    panels:
      - - - panel:specimen-occurrences
```

- [ ] **Step 5: Manual verification in the browser**

Run: `npm run dev`, open http://localhost:5173/, navigate to an OTU with type specimens, plain specimens, and field occurrences (check via the TaxonWorks API or by browsing a few Curculionoidea species pages already known to have all three), open the "Specimen Records" tab.

Confirm:
- Only one `dwc.json` request appears in the browser Network tab for the tab (not two).
- Type specimens render before non-type specimens/field occurrences.
- A holotype and its paratypes never collapse together; multiple paratypes from the same locality/date/collector do collapse into one row showing the combined count (e.g. "3 Paratypes").
- Regular specimens sharing a collecting event collapse into one row; field occurrences collapse independently of specimens even when co-located.
- A collapsed CollectionObject group with more than one distinct catalog number shows a "Show catalog numbers (N)" toggle that reveals them.
- Clicking a thumbnail on a collapsed row's `GalleryThumbnailList` opens `ImageViewer` with every merged image, and next/previous/close work.
- The "... Show all ..." row appears when there are more than 10 rows and expands the full list; clicking the `IconPlusCircle` icon itself also expands (no console error — this was the latent `isExpanded` bug fixed in Step 1).
- No console errors.

- [ ] **Step 6: Delete the old panels**

```bash
git rm -r panels/PanelSpecimenRecords panels/PanelFieldOccurrences
```

- [ ] **Step 7: Re-verify after deletion**

Run: `npm run dev` again (restart the dev server so stale module references can't mask a broken glob-discovery), reload the same OTU page's "Specimen Records" tab.

Confirm: the tab still renders correctly with no console errors or warnings about a missing panel id.

- [ ] **Step 8: Commit**

```bash
git add panels/PanelSpecimenOccurrences config/taxa_page.yml
git commit -m "$(cat <<'EOF'
Merge PanelSpecimenRecords and PanelFieldOccurrences

Both panels fetched the identical /otus/:id/inventory/dwc.json
endpoint and duplicated label-building/institution-lookup code.
Replaces them with one PanelSpecimenOccurrences panel: single
fetch, one flat list (type specimens first), records sharing a
collecting event collapsed into one row via groupRecords().

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Post-implementation

Update `memory/project_open_threads.md` (outside this plan's scope to edit directly — flag for the user/agent driving the session) to mark thread #3 as done, and update `memory/MEMORY.md`'s panel list to reference `PanelSpecimenOccurrences` instead of the two old panels.
