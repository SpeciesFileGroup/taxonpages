# PanelGbifTypeSpecimens

> **Compatibility:** `@sfgrp/taxonpages` ≥ 0.5.4 (npm package setup)

Copied from [MortenHofft/taxonpages](https://github.com/MortenHofft/taxonpages) by [Morten Høfft](https://github.com/MortenHofft) on 2026-05-21.

**Note:** Links open `www.gbif.org`. The GBIF v2 CoL API returns alphanumeric usage keys (e.g. `LPL3Q`); these now resolve on the main portal under `/taxon/:key` (CoL taxonomy). The former `demo.gbif-staging.org` preview host is retired — the legacy integer-keyed backbone still lives at `/species/:key` and on `old.gbif.org`.

---

Displays a paginated list of type specimens from GBIF for the matched taxon. Each row shows the type status badge, verbatim scientific name, and collection date, linking to the full occurrence record on GBIF.org.

Only shown for species and genus rank. Supports all standard type status values (Holotype, Paratype, Lectotype, Neotype, etc.).
