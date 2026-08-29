# PanelGbifTaxon

> **Compatibility:** `@sfgrp/taxonpages` ≥ 0.5.4 (npm package setup)

Copied from [MortenHofft/taxonpages](https://github.com/MortenHofft/taxonpages) by [Morten Høfft](https://github.com/MortenHofft) on 2026-05-21.

**Note:** Links open `www.gbif.org`. The GBIF v2 CoL API returns alphanumeric usage keys (e.g. `LPL3Q`); these now resolve on the main portal under `/taxon/:key` (CoL taxonomy). The former `demo.gbif-staging.org` preview host is retired — the legacy integer-keyed backbone still lives at `/species/:key` and on `old.gbif.org`.

---

Displays the GBIF name match for the current taxon: accepted name, synonym status, classification breadcrumb, total occurrence count, and a link to the taxon page on GBIF.org.

Uses the GBIF species match API (`/v2/species/match`) with a minimum confidence threshold of 80. If no confident match is found, a "no match" message is shown instead of an empty panel.
