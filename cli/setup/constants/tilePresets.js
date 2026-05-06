export const TILE_PRESETS = [
  {
    label: 'OpenStreetMap',
    value: {
      label: 'OpenStreetMap',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      server: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      subdomains: 'abc',
      maxZoom: 19
    }
  },
  {
    label: 'GBIF - Natural',
    value: {
      label: 'GBIF',
      attribution: '&copy; <a href="https://gbif.org">Based on GBIF.org</a>',
      server:
        'https://tile.gbif.org/3857/omt/{z}/{x}/{y}{r}.png?style=gbif-natural-en',
      tileSize: 512,
      zoomOffset: -1,
      minZoom: 1,
      maxZoom: 18,
      dpr: { 1: '@1x' }
    }
  },
  {
    label: 'GBIF - Classic',
    value: {
      label: 'GBIF Classic',
      attribution: '&copy; <a href="https://gbif.org">Based on GBIF.org</a>',
      server:
        'https://tile.gbif.org/3857/omt/{z}/{x}/{y}{r}.png?style=gbif-classic-en',
      tileSize: 512,
      zoomOffset: -1,
      minZoom: 1,
      maxZoom: 18,
      dpr: { 1: '@1x' }
    }
  },
  {
    label: 'OpenTopoMap',
    value: {
      label: 'OpenTopoMap',
      attribution:
        'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
      server: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      subdomains: 'abc',
      maxZoom: 17
    }
  },
  {
    label: 'CartoDB Positron (light)',
    value: {
      label: 'CartoDB Positron',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      server: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      subdomains: 'abcd',
      maxZoom: 20,
      dpr: { 2: '@2x' }
    }
  },
  {
    label: 'Esri World Imagery (satellite)',
    value: {
      label: 'Esri World Imagery',
      attribution:
        'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
      server:
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      maxZoom: 19
    }
  }
]
