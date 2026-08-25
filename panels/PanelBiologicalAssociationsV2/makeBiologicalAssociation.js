/**
 * makeBiologicalAssociation.js
 *
 * Transforms a /biological_associations response (extend[]=object,subject,
 * biological_relationship) into a flat object for display in
 * PanelBiologicalAssociationsV2. Species name HTML comes from the object_tag
 * span (no taxonomy extend needed — see extractNameHtml).
 *
 * basic: the matching row from /biological_associations/basic for this
 *   association (same id). Supplies subject_otu_id/object_otu_id,
 *   subject.family/object.family and citations from the pre-computed
 *   biological_association_indices table — cheap even at large page sizes,
 *   unlike the live extend[]=taxonomy path.
 */

/**
 * Returns true for physical specimen types (not taxa, not anatomical parts).
 */
export function isSpecimenType(type) {
  return type === 'CollectionObject' || type === 'FieldOccurrence'
}

/**
 * Resolves the physical specimen (CollectionObject/FieldOccurrence) an
 * entity refers to, so locality/collector lookup and the DWC info button
 * work the same for a direct CO/FO and for an AnatomicalPart attached to
 * one.
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

/**
 * Extracts the inner HTML of an otu_tag_taxon_name or otu_tag_otu_name span
 * from object_tag — already italicized by TaxonWorks, no taxonomy extend needed.
 *
 * A name can carry multiple separately-italicized runs, e.g. a subgenus:
 * "<i>Hypera</i> (<i>Hypera</i>) <i>miles</i> (Paykull, 1792)" — so the match
 * must be greedy (first <i> to *last* </i>) to keep the whole construct, not
 * just the first run.
 *
 * A taxon-name-linked determination reaching only genus rank (no species
 * epithet) renders as a single italicized word, e.g. "<i>Promecops</i>
 * Sahlberg, 1823" — TaxonWorks' own tag omits any "sp." qualifier, so add
 * one back. Detected by stripping tags/parens from the matched run and
 * counting words, not by naively checking for whitespace in a single
 * capture (which the subgenus case would misread as "has a species").
 */
function extractNameHtml(objectTag) {
  if (!objectTag) return null
  const span = objectTag.match(/otu_tag_(?:taxon_name|otu_name)[^>]*>([\s\S]*?)<\/span>/)
  if (!span) return null
  const italics = span[1].match(/<i>[\s\S]*<\/i>/)
  if (!italics) return span[1].trim() || null
  const html = italics[0]
  const words = html.replace(/<[^>]+>/g, '').replace(/[()]/g, '').trim().split(/\s+/).filter(Boolean)
  return words.length > 1 ? html : `${html} sp.`
}

/**
 * Returns { prefix, html } for the label cell.
 *
 * OTU / CO / FO    → { prefix: null, html: "<i>Genus species</i>" }
 * AnatomicalPart   → { prefix: "Leaf of ", html: "<i>Genus species</i>" }
 *                    (prefix extracted from object_label "leaf: Artemisia vulgaris")
 * Fallback         → { prefix: null, html: plain object_label text }
 *
 * Keeping prefix separate lets the template wrap only the species name in a RouterLink.
 */
function buildLabelParts(entity) {
  const speciesHtml = extractNameHtml(entity.object_tag)

  if (speciesHtml) {
    if (entity.base_class !== 'Otu' && !isSpecimenType(entity.base_class)) {
      // AnatomicalPart: object_label is "leaf: Artemisia vulgaris"
      const label = entity.object_label || ''
      const colonIdx = label.indexOf(': ')
      if (colonIdx > 0) {
        const raw = label.slice(0, colonIdx)
        const capitalized = raw.charAt(0).toUpperCase() + raw.slice(1)
        return { prefix: `${capitalized} of `, html: speciesHtml }
      }
    }
    return { prefix: null, html: speciesHtml }
  }

  return { prefix: null, html: entity.object_label || '' }
}

export function makeBiologicalAssociation(
  data,
  images         = [],
  distributions  = [],
  citationList   = [],
  basic          = null,
  localityByCoId = new Map()
) {
  const subj = data.subject || {}
  const obj  = data.object  || {}
  const rel  = data.biological_relationship || {}

  const subjLabel = buildLabelParts(subj)
  const objLabel  = buildLabelParts(obj)

  const subjSpecimen = resolveSpecimenRef(subj)
  const objSpecimen  = resolveSpecimenRef(obj)

  return {
    id: data.id,

    subjectFamily:       basic?.subject?.family || null,
    subjectLabelPrefix:  subjLabel.prefix,
    subjectSpeciesHtml:  subjLabel.html,
    subjectOtuId:        basic?.subject_otu_id || null,
    subjectDetail:      subj.object_tag || null,
    subjectSpecimenType: subjSpecimen?.type || null,
    subjectSpecimenId:   subjSpecimen?.id || null,
    subjectLocality:    subjSpecimen ? (localityByCoId.get(subjSpecimen.id) || null) : null,
    subjectCollector:   subjSpecimen ? (localityByCoId.get(subjSpecimen.id)?.recordedBy || null) : null,

    biologicalRelationship:    rel.name || '',

    objectFamily:       basic?.object?.family || null,
    objectLabelPrefix:  objLabel.prefix,
    objectSpeciesHtml:  objLabel.html,
    objectOtuId:        basic?.object_otu_id || null,
    objectDetail:      obj.object_tag || null,
    objectSpecimenType: objSpecimen?.type || null,
    objectSpecimenId:   objSpecimen?.id || null,
    objectLocality:    objSpecimen ? (localityByCoId.get(objSpecimen.id) || null) : null,
    objectCollector:   objSpecimen ? (localityByCoId.get(objSpecimen.id)?.recordedBy || null) : null,

    citations:    basic?.citations || null,
    citationList,
    images,
    distributions
  }
}
