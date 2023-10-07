import { SPECIES_GROUP, SPECIES_AND_INFRASPECIES_GROUP } from '@/modules/otus/constants'
import PanelGallery from './PanelGallery.vue'

export default {
  id: 'panel:gallery',
  component: PanelGallery,
  available: [SPECIES_GROUP, SPECIES_AND_INFRASPECIES_GROUP]
}
