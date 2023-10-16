import PanelTypeDesignation from './PanelTypeDesignation.vue'
import { FAMILY_GROUP, GENUS_GROUP } from '../../../constants'

export default {
  id: 'panel:type',
  component: PanelTypeDesignation,
  rankGroup: [FAMILY_GROUP, GENUS_GROUP]
}
