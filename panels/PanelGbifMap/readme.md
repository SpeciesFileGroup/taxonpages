# PanelGbifMap

> **Compatibility:** `@sfgrp/taxonpages` ≥ 0.5.4 (npm package setup)

Copied from [MortenHofft/taxonpages](https://github.com/MortenHofft/taxonpages) by [Morten Høfft](https://github.com/MortenHofft) on 2026-05-21.

**Note:** Links open `www.gbif.org`. The GBIF v2 CoL API returns alphanumeric usage keys (e.g. `LPL3Q`); these now resolve on the main portal under `/taxon/:key` (CoL taxonomy). The former `demo.gbif-staging.org` preview host is retired — the legacy integer-keyed backbone still lives at `/species/:key` and on `old.gbif.org`.

---

Displays an interactive Leaflet map of GBIF occurrence density for the matched taxon, using hexagonal binning tiles from the GBIF map API. Users can toggle between Topographic and Dark Gray basemaps (Esri), and open the current map extent in GBIF's occurrence explorer via a WKT polygon parameter.

Only shown when georeferenced occurrences exist for the taxon. Leaflet is loaded lazily (`import('leaflet')`) to avoid adding it to the initial bundle.
