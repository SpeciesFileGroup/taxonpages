import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  makePanelRegistry,
  parsePanelConfiguration,
  buildTabLayouts
} from '@/modules/otus/utils/parseTaxaPageLayout.js'

const Map_ = { name: 'PanelMap' }
const Gallery = { name: 'PanelGallery' }
const LocalMap = { name: 'LocalMap' }

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('makePanelRegistry', () => {
  it('lets the first entry for an id win, so user panels can replace core ones', () => {
    const registry = makePanelRegistry([
      { id: 'panel:map', component: LocalMap },
      { id: 'panel:map', component: Map_ },
      { id: 'panel:gallery', component: Gallery },
      undefined,
      { component: Gallery }
    ])

    expect([...registry.keys()]).toEqual(['panel:map', 'panel:gallery'])
    expect(registry.get('panel:map').component).toBe(LocalMap)
  })
})

describe('parsePanelConfiguration', () => {
  const registry = makePanelRegistry([
    { id: 'panel:map', component: Map_ },
    { id: 'panel:gallery', component: Gallery }
  ])

  it('resolves ids and object references, keeping rows and columns', () => {
    const layout = [
      [
        ['panel:gallery'],
        [{ id: 'panel:map', bind: { title: 'Where' }, rank_group: ['SpeciesGroup'] }]
      ]
    ]

    expect(parsePanelConfiguration(layout, registry)).toEqual([
      [
        [{ id: 'panel:gallery', component: Gallery }],
        [
          {
            id: 'panel:map',
            component: Map_,
            bind: { title: 'Where' },
            rankGroup: ['SpeciesGroup']
          }
        ]
      ]
    ])
  })

  it('drops unknown panels with an error instead of breaking the page', () => {
    const result = parsePanelConfiguration([[['panel:nope', 'panel:map']]], registry)

    expect(result[0][0].map((p) => p.id)).toEqual(['panel:map'])
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('panel:nope'))
  })

  it('ignores a rank_group that is not a list', () => {
    const [[[panel]]] = parsePanelConfiguration(
      [[[{ id: 'panel:map', rank_group: 'SpeciesGroup' }]]],
      registry
    )

    expect(panel).not.toHaveProperty('rankGroup')
    expect(panel).not.toHaveProperty('rank_group')
  })
})

describe('buildTabLayouts', () => {
  it('builds one layout per tab, with tab-level rank group and label', () => {
    const registry = makePanelRegistry([{ id: 'panel:map', component: Map_ }])
    const layouts = buildTabLayouts(
      {
        overview: { panels: [[['panel:map']]] },
        distribution: {
          label: { en: 'Distribution', es: 'Distribución' },
          rank_group: ['SpeciesGroup'],
          panels: [[['panel:map']]]
        }
      },
      registry
    )

    expect(Object.keys(layouts)).toEqual(['overview', 'distribution'])
    expect(layouts.overview.rankGroup).toEqual([])
    expect(layouts.distribution).toMatchObject({
      rankGroup: ['SpeciesGroup'],
      label: { en: 'Distribution', es: 'Distribución' }
    })
  })
})
