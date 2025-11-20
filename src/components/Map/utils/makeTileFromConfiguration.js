const { map_tile_server, map_tile_attribution, map_tiles } = __APP_ENV__

function resolveTileUrl(urlTemplate, dprRules) {
  if (!urlTemplate.includes('{r}') || !dprRules) return urlTemplate

  const dpr = Math.round(window.devicePixelRatio || 1)
  const replacement = dprRules?.[dpr]

  if (typeof replacement === 'string') {
    return urlTemplate.replace('{r}', replacement)
  }

  return urlTemplate
}

export function makeTileFromConfiguration(L, opts) {
  const tiles = map_tiles || [
    {
      label: 'tile',
      server: map_tile_server,
      attribution: map_tile_attribution
    }
  ]

  return Object.fromEntries(
    tiles.map(({ server, label, dpr, ...userOpts }) => [
      label,
      L.tileLayer(resolveTileUrl(server, dpr), { ...opts, ...userOpts })
    ])
  )
}
