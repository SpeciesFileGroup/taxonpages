function getBiologicalProperty(biologicalRelationshipTypes, type) {
  return biologicalRelationshipTypes.find((r) => r.target === type)
    ?.biological_property?.name
}

function parseRank(rank) {
  return Array.isArray(rank) ? rank.filter(Boolean).join(' ') : rank
}

export function makeBiologicalAssociation(data) {
  return {
    id: data.id,
    subjectOrder: parseRank(data.subject?.taxonomy?.order),
    subjectFamily: parseRank(data.subject?.taxonomy?.family),
    subjectGenus: parseRank(data.subject?.taxonomy?.genus),
    subjectLabel: data.subject.object_label,
    biologicalPropertySubject: getBiologicalProperty(
      data.biological_relationship_types,
      'subject'
    ),
    biologicalRelationship: data.biological_relationship.object_label,
    biologicalPropertyObject: getBiologicalProperty(
      data.biological_relationship_types,
      'object'
    ),
    objectOrder: parseRank(data.object?.taxonomy?.order),
    objectFamily: parseRank(data.object?.taxonomy?.family),
    objectGenus: parseRank(data.object?.taxonomy?.genus),
    objectLabel: data.object.object_label
  }
}
