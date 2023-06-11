import TaxonWorks from '../../services/TaxonWorks'

function parseStats(obj) {
  return Object.entries(obj)
    .filter(([_, count]) => count)
    .map((item) => item.join(': '))
    .join('; ')
}

export const actionLoadCatalog = {
  async loadCatalog(taxonId) {
    const { data } = await TaxonWorks.getTaxonNameCitations(taxonId)

    this.catalog = {
      ...data,
      sources: data.sources.map(({ cached, url }) =>
        cached.replace(url, `<a href="${url}">${url}</a>`)
      )
    }
  }
}
