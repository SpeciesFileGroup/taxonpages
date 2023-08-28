const { map_tile_server, map_tile_attribution, map_tiles } = __APP_ENV__

export function makeTileFromConfiguration(L, opts) {
  const tiles = map_tiles || [
    {
      label: 'tile',
      server: map_tile_server,
      attribution: map_tile_attribution
    }
  ]

  return Object.fromEntries(
    tiles.map(({ server, attribution, label }) => [
      label,
      L.tileLayer(server, { ...opts, attribution })
    ])
  )
}
