/**
 * specimenRef.js
 *
 * Resolves a biological_associations subject/object entity to the physical
 * specimen (CollectionObject/FieldOccurrence) it refers to — the entity may
 * *be* one directly, or be an AnatomicalPart (e.g. a nidus, an egg) that
 * wraps one.
 *
 * Depended on by:
 *   - ../PanelBiologicalAssociationsV2/makeBiologicalAssociation.js
 *       — locality/collector lookup and the DWC info button for BA rows
 *   - ./DwcTable.vue
 *       — finding biological associations that involve the CO/FO being
 *         shown, including ones only reachable via a wrapping AnatomicalPart
 *   - ../PanelSpecimenOccurrences/components/SingleSpeciesOccurrences.vue
 *       — indexing every association for the OTU once (not per row) to show
 *         the primary one inline on each list row
 *
 * If you change this file, sanity-check all three call sites.
 */

/**
 * Returns true for physical specimen types (not taxa, not anatomical parts).
 */
export function isSpecimenType(type) {
  return type === 'CollectionObject' || type === 'FieldOccurrence'
}

/**
 * Resolves the physical specimen (CollectionObject/FieldOccurrence) an
 * entity refers to.
 *
 * An AnatomicalPart's own id (e.g. 99) is not the specimen id — the API
 * doesn't expose the wrapped specimen as a structured field, only baked
 * into object_label as "nidus: FieldOccurrence 4996; <uuid>; ...", the same
 * catalog-string format CO depiction labels use. Parse it out from there.
 */
export function resolveSpecimenRef(entity) {
  if (!entity) return null
  if (isSpecimenType(entity.base_class)) return { type: entity.base_class, id: entity.id }
  if (entity.base_class === 'AnatomicalPart') {
    const m = (entity.object_label || '').match(/\b(CollectionObject|FieldOccurrence)\s+(\d+)/)
    if (m) return { type: m[1], id: Number(m[2]) }
  }
  return null
}
