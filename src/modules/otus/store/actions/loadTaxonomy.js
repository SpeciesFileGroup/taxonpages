import TaxonWorks from '../../services/TaxonWorks'

export const actionLoadTaxonomy = {
  async loadTaxonomy(otuId, { signal }) {
    const { data } = await TaxonWorks.getTaxonomy(otuId, {
      params: {
        max_descendants_depth: 0,
        extend: ['common_names']
      },
      signal
    })

    this.taxonomy = {
      commonNames: data.common_names,
      synonyms: data.nomenclatural_synonyms
    }
  }
}
