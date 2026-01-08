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
    subjectId: data.subject.id,
    subjectType: data.subject.type,
    subjectOrder: data.subject.order,
    subjectFamily: data.subject.family,
    subjectGenus: data.subject.genus,
    subjectLabel: data.subject.label,
    biologicalPropertySubject: data.subject.properties,
    biologicalRelationship: data.relationship,
    biologicalPropertyObject: data.object.properties,
    objectId: data.object.id,
    objectType: data.object.type,
    objectOrder: data.object.order,
    objectFamily: data.object.family,
    objectGenus: data.object.genus,
    objectLabel: data.object.label,
    citations: data.citations
  }
}
