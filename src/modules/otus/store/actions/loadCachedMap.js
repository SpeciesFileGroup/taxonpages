import TaxonWorks from '../../services/TaxonWorks'

export const actionLoadCachedMap = {
  loadCachedMap(mapId) {
    TaxonWorks.getCachedMap(mapId).then((response) => {
      this.distribution.cachedMap = response.data
    })
  }
}
