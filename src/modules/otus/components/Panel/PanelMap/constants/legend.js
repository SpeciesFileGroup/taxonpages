// Legend entries hold a translation key rather than a label: this module is
// evaluated once at import time, so a literal string here could never follow
// the active locale. The label is resolved where it renders.
export const LEGEND = {
  Aggregate: {
    labelKey: 'panel.map.legend.aggregate',
    background: 'bg-map-aggregate'
  },
  AssertedAbsent: {
    labelKey: 'panel.map.legend.asserted_absent',
    background: 'bg-map-asserted-absent'
  },
  AssertedDistribution: {
    labelKey: 'panel.map.legend.asserted_distribution',
    background: 'bg-map-asserted'
  },
  Georeference: {
    labelKey: 'panel.map.legend.georeference',
    background: 'bg-map-georeference'
  },
  CollectionObject: {
    labelKey: 'panel.map.legend.collection_object',
    background: 'bg-map-collection-object'
  },
  FieldOccurrence: {
    labelKey: 'panel.map.legend.field_occurrence',
    background: 'bg-map-field-occurrence'
  },
  TypeMaterial: {
    labelKey: 'panel.map.legend.type_material',
    background: 'bg-map-type-material'
  }
}
