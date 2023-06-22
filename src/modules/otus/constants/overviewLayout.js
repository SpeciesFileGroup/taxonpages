import { FAMILY_GROUP, GENUS_GROUP, SPECIES_GROUP } from './index.js'
import PanelGallery from '../components/Panel/PanelGallery/Gallery.vue'
import PanelTypeSpecimen from '../components/Panel/PanelTypeSpecimen/PanelTypeSpecimen.vue'
import PanelTypeDesignation from '../components/Panel/PanelTypeDesignation/PanelTypeDesignation.vue'
import PanelNomenclature from '../components/Panel/PanelNomenclature/PanelNomenclature.vue'
import PanelNomenclatureReference from '../components/Panel/PanelNomenclatureReferences/PanelNomenclatureReferences.vue'
import PanelMap from '../components/Panel/PanelMap/PanelMap.vue'
import PanelDescendants from '../components/Panel/PanelDescendants/Descendants.vue'
import PanelContent from '../components/Panel/PanelContent/PanelContent.vue'
import PanelStats from '../components/Panel/PanelStats/PanelStats.vue'

export const overviewLayout = {
  left: [
    { component: PanelGallery },
    {
      component: PanelTypeSpecimen,
      available: [SPECIES_GROUP]
    },
    {
      component: PanelTypeDesignation,
      available: [FAMILY_GROUP, GENUS_GROUP]
    },
    { component: PanelNomenclature },
    { component: PanelNomenclatureReference }
  ],

  right: [
    { component: PanelMap },
    { component: PanelDescendants },
    { component: PanelContent },
    { component: PanelStats }
  ]
}
