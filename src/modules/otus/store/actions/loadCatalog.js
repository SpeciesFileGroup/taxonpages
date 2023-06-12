import TaxonWorks from '../../services/TaxonWorks'
import { useOtuPageRequest } from '../../helpers/useOtuPageRequest'

export const actionLoadCatalog = {
  async loadCatalog(taxonId) {
    const response = await useOtuPageRequest('taxonomy', () =>
      TaxonWorks.getTaxonNameCitations(taxonId)
    )

    this.catalog = {
      ...response.data,
      sources: response.data.sources.map(({ cached, url }) =>
        cached.replace(url, `<a href="${url}">${url}</a>`)
      )
    }
  }
}
