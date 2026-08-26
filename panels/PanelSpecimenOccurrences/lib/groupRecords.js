// Pure grouping/collapsing logic for the merged specimen/field-occurrence
// list. No network calls, no Vue — testable with a plain Node script.
// See docs/superpowers/specs/2026-08-26-merge-specimen-occurrence-panels-design.md

const EVENT_FIELDS = [
  'country',
  'stateProvince',
  'county',
  'verbatimLocality',
  'eventDate',
  'recordedBy'
]

// Grouping key also splits by institutionCode (fix #5: same-event specimens
// held at different institutions must not collapse into one row). Kept
// separate from EVENT_FIELDS because hasNoEventFields() below must only
// look at genuine collecting-event data, not institution.
const KEY_FIELDS = [...EVENT_FIELDS, 'institutionCode']

export function buildGroupKey(record) {
  return JSON.stringify(
    [record.dwc_occurrence_object_type, record.typeStatus || ''].concat(
      KEY_FIELDS.map((f) => record[f] || '')
    )
  )
}

// A record with no collecting-event data at all (old, unlocalized museum
// specimens) gets its own singleton group rather than key-matching other
// blank records. Must check only EVENT_FIELDS, not institutionCode: an
// unlocalized specimen almost always has institutionCode populated, so
// including it here would collapse unrelated unlocalized specimens at the
// same institution into one row.
function hasNoEventFields(record) {
  return EVENT_FIELDS.every((f) => !record[f])
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
  return records.every((r) => r.sex) && sexes.size === 1 ? [...sexes][0] : null
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
      totalCount: group.records.reduce((sum, r) => sum + (Number(r.individualCount) || 1), 0),
      uniformSex: uniformSex(group.records)
    })
  )
}

// Aggregated "count + sex/noun" text for a collapsed group row, replacing
// the single-record getCountAndSex() output. Sex is only shown when every
// member of the group shares the same sex; otherwise falls back to a plain
// noun ("specimens"/"occurrences"). typeStatus is not folded in here — it's
// a full citation sentence in real data (e.g. "syntype of Pnigodes setosus
// LeConte, 1876"), not clean DWC vocabulary, and ListRecords.vue already
// renders it verbatim above the label. Only meaningful for isGroup groups
// (records.length > 1).
export function groupCountLabel(group) {
  if (group.uniformSex) {
    return `${group.totalCount} ${group.uniformSex}`
  }
  const first = group.records[0]
  const noun = first.dwc_occurrence_object_type === 'FieldOccurrence' ? 'occurrences' : 'specimens'
  return `${group.totalCount} ${noun}`
}
