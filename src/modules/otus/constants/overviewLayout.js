import { FAMILY_GROUP, GENUS_GROUP, SPECIES_GROUP } from './index.js'
import PanelGallery from '../components/Panel/PanelGallery/Gallery.vue'
import PanelTypeSpecimen from '../components/Panel/PanelTypeSpecimen/PanelTypeSpecimen.vue'
import PanelTypeDesignation from '../components/Panel/PanelTypeDesignation/PanelTypeDesignation.vue'
import PanelCitations from '../components/Panel/PanelCitation/PanelCitation.vue'
import PanelMap from '../components/Panel/PanelMap/PanelMap.vue'
import PanelDescendants from '../components/Panel/PanelDescendants/Descendants.vue'
import PanelContent from '../components/Panel/PanelContent/PanelContent.vue'
import PanelStatus from '../components/Panel/PanelStatus/PanelStatus.vue'

export const overviewLayout = {
  left: [
    { component: PanelGallery },
    { component: PanelStatus },
    {
      component: PanelTypeSpecimen,
      available: [SPECIES_GROUP]
    },
    {
      component: PanelTypeDesignation,
      available: [FAMILY_GROUP, GENUS_GROUP]
    },
    { component: PanelCitations }
  ],

  right: [
    { component: PanelMap },
    { component: PanelDescendants },
    { component: PanelContent }
  ]
}
