import PanelBiologicalAssociationsV2 from './PanelBiologicalAssociationsV2.vue'

export default {
  id: 'panel:biological-associations-v2',
  component: PanelBiologicalAssociationsV2,
  // No rank restriction: shown at every rank, from species up through
  // family/subfamily/etc. — the query itself (see PanelBiologicalAssociationsV2.vue)
  // uses otu_query[taxon_name_id]+descendants to roll up descendant taxa's
  // associations, so higher-rank pages actually have data to show.
  rankGroup: []
}
