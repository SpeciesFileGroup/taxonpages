const panelEntries = Object.values(
  import.meta.glob(['../components/Panel/*/main.js', '#/panels/*/main.js'], {
    eager: true,
    import: 'default'
  })
)

const { taxa_page_overview } = __APP_ENV__

const DEFAULT_LAYOUT = [
  [
    [
      'panel:gallery',
      'panel:type',
      'panel:type',
      'panel:type-specimen',
      'panel:nomenclature',
      'panel:nomenclature-references'
    ],
    ['panel:map', 'panel:descendants', 'panel:content', 'panel:statistics']
  ]
]

function parsePanelConfiguraion(panelLayout) {
  return panelLayout.map((row) =>
    row.map((col) =>
      col.map((panel) => {
        const isPanelKey = typeof panel === 'string'
        const panelObj = isPanelKey ? { id: panel } : { ...panel }
        const entry = panelEntries.find((item) => item.id === panelObj.id)

        return {
          ...entry,
          ...panelObj
        }
      })
    )
  )
}

export const overviewLayout = parsePanelConfiguraion(
  taxa_page_overview?.panels || DEFAULT_LAYOUT
)
