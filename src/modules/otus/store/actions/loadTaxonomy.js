import TaxonWorks from '../../services/TaxonWorks'

export const actionLoadTaxonomy = {
  async loadTaxonomy(otuId) {
    const { data } = await TaxonWorks.getTaxonomy(otuId, {
      max_descendants_depth: 0,
      extend: ['common_names']
    })

    this.taxonomy = {
      commonNames: data.common_names,
      synonyms: data.nomenclatural_synonyms
    }
  }
}
