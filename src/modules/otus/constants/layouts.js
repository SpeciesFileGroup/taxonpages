import { DEFAULT_OVERVIEW_LAYOUT } from './layouts/index.js'

const userPanels = Object.values(
  import.meta.glob('~/panels/*/main.js', {
    eager: true,
    import: 'default'
  })
)

const corePanels = Object.values(
  import.meta.glob('../components/Panel/*/main.js', {
    eager: true,
    import: 'default'
  })
)

export const panelsById = new Map()

for (const entry of [...userPanels, ...corePanels]) {
  if (entry?.id && !panelsById.has(entry.id)) {
    panelsById.set(entry.id, entry)
  }
}

const { taxa_page } = __APP_ENV__

const tabsLayout = taxa_page || DEFAULT_OVERVIEW_LAYOUT

function parsePanelConfiguraion(panelLayout) {
  return panelLayout.map((row) =>
    row.map((col) =>
      col
        .map((panel) => {
          const isPanelKey = typeof panel === 'string'
          const panelObj = isPanelKey ? { id: panel } : { ...panel }
          const entry = panelsById.get(panelObj.id)

          if (!entry) {
            console.error(
              `[taxonpages] Unknown panel id "${panelObj.id}" in the taxa_page ` +
                `configuration. No panel declares it, so it will not be rendered.`
            )
            return null
          }

          return {
            ...entry,
            ...panelObj
          }
        })
        .filter(Boolean)
    )
  )
}

const layouts = {}

for (const key in tabsLayout) {
  const tabLayout = tabsLayout[key]

  layouts[key] = {
    panels: parsePanelConfiguraion(tabLayout?.panels || {}),
    rankGroup: tabLayout.rank_group || [],
    label: tabLayout.label
  }
}

export default layouts
