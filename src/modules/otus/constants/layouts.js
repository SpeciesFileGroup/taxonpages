import { DEFAULT_OVERVIEW_LAYOUT } from './layouts/index.js'
import {
  makePanelRegistry,
  buildTabLayouts
} from '../utils/parseTaxaPageLayout.js'

const userPanels = Object.values(
  import.meta.glob('~/panels/*/main.js', {
    eager: true,
    import: 'default'
  })
)

const corePanels = Object.values(
  import.meta.glob('@/modules/otus/components/Panel/*/main.js', {
    eager: true,
    import: 'default'
  })
)

export const panelsById = makePanelRegistry([...userPanels, ...corePanels])

const { taxa_page } = __APP_ENV__

const tabsLayout = taxa_page || DEFAULT_OVERVIEW_LAYOUT

const layouts = buildTabLayouts(tabsLayout, panelsById)

export default layouts
