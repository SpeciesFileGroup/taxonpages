# PanelGbifImages

> **Compatibility:** `@sfgrp/taxonpages` ≥ 0.5.4 (npm package setup)

Copied from [MortenHofft/taxonpages](https://github.com/MortenHofft/taxonpages) by [Morten Høfft](https://github.com/MortenHofft) on 2026-05-21.

**Note:** Links open `www.gbif.org`. The GBIF v2 CoL API returns alphanumeric usage keys (e.g. `LPL3Q`); these now resolve on the main portal under `/taxon/:key` (CoL taxonomy). The former `demo.gbif-staging.org` preview host is retired — the legacy integer-keyed backbone still lives at `/species/:key` and on `old.gbif.org`.

---

Displays a carousel of up to 20 still images from the GBIF multimedia API for the matched taxon. Each image shows rights holder, Creative Commons license, and a link to the source occurrence record on GBIF.org. A link to the full gallery view is provided.

Only shown for family-level and below (genus, species, subspecies, variety, etc.). Hidden entirely when no images are available.
