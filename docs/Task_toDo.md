# Task Layout and images
Changes to layout: In "Full key" view, the taxon names that are the target of a lead should be more visible. Consider making a "pill" or chip for them. They, and the lead to couplet ("couplet 6") should be in a consistent position (aligned right) to allow easy scanning of the whole page. Currently, they are the same color as the text, making them almost unnoticeable. Clickable items should have the link color scheme from main CSS stylesheets.  
Also, reserve some space (a fourth of width would be suffucient) on the right for images that illustrate leads. They should be small previews, clicking would open a gallery with text and image and option to cycle through the images. Consider loading time for large keys (first render everything else, then load images)

- If a lead has no own images, and has a taxon associated, it should show a few images of that taxon as a fallback. This can include iNaturalist images if no TaxonWorks images are present. Images should be fetched not only from the OTU, but also from collectionObject and FieldOccurrence, just as in the gallery panel.

# Task Scope by Geography
Review the feasability to "filter" a key by Geography. This would draw data from species distribution. Test if the API has indexed species lists per country, based on specimen records and asserted distributions. 

The user would be able to select one or more countries to filter the key for. All species outside of that area will be greyed-out or otherwise marked as less relevant, and the completeness will be evaluated based on the selected country set. 
Perhaps, TaxonPages could hard-code sets of countries like "Western Palearctic", "Central Europe", "Neotropical" etc.

# Investigate:
key/3605 has to couplets numbered as 1. 

# Primary Source of keys
You changed primary source behavior, picking the first source if no "is original" is given. Actually, it should rely on "is original", since there may be keys that do cite sources for a few couplets, but are original work of the taxonworks weevil project team. in that case, there shouldnt be a primary source.

# Jumping to another couplet
- currently its a very sudden screen movement, sometimes moving further than necessary: If I am at couplet 1 and go to couplet 2, only a short and gentle movement is necessary to slide to the next couplet. Instead it seems to jump somewhere and is then rapidly moving to 2. This could be improved a lot! 
- clicking one of the couplet numbers at the left, this should also select the couplet.

# Offtopic (not part of the work on keys) — DONE 2026-08-30
Feasibility written (`docs/feasibility_references_cited_panel.md`); panel enabled as its own
last tab "Other references" in `config/taxa_page.yml`. Blue type badges are automatic
(`citation_object_type`), yellow badges are the only tag component (`topics[]`, optional).

Explore the feasibility of 
          - id: panel:references-cited
            bind:
              title: Other references
- in case it helps with the investigation, https://github.com/sfg-taxonpages/plecoptera/tree/setup has the feature enabled
- How is the panel working, how does it know if a source is dealing with TaxonDetermination, TypeMaterial or AssertedDistribution? Are those tags or is TaxonPages getting them from objects in TaxonWorks (e.g. if a type material has a citation the reference is automatically put in "other references" as "TypeMaterial")?
- How useful is the feature for our database? In case tags are needed, how many tags are there on citations so far?

# Metadata / "data" depictions (`is_metadata_depiction`) — PARTLY DONE 2026-08-30

TaxonWorks depictions carry a boolean `is_metadata_depiction` (nullable). Semantics (from TW `lib/catalog/collection_object.rb` + `app/models/depiction.rb`): the image depicts *metadata about* the object rather than the object itself — a specimen-label photo, a collection-site / locality photo, a ledger or register page, etc. TW's own radial UI labels the checkbox literally **"Is data depiction"**. Catalog splits `:metadata_depicted` vs `:imaged` (and `:collecting_event_metadata_depicted` vs `:collection_site_imaged`).

Findings:
- **Vanilla TaxonPages ignores it entirely** — zero references to `is_metadata_depiction` / `metadata_depiction` anywhere in `node_modules/@sfgrp/taxonpages/src/` (incl. `useImageStore.js`, GalleryViewer, image/BA/sound panels) or in the local `panels/ components/ modules/`. Every depiction was shown regardless.
- **The flag is NOT serialized by `/otus/:id/inventory/images`** (the endpoint `useImageStore` uses) — its depiction sub-objects carry only `id, label, depiction_type, depiction_object_id`. It IS on `GET /api/v1/depictions` (`_attributes.json.jbuilder`, filterable by `otu_id[]` + `otu_scope[]` + `image_id[]`) and `/depictions/gallery`.
- **`GET /images?metadata_depiction=false` is unusable** — TW's `Queries::Image::Filter#metadata_depiction_facet` does `where.not(depictions: {is_metadata_depiction: true})`, which in PG also excludes NULL-flag depictions (the common case). Tested against sfg: 344 of 1308 project images returned vs. 3 for `metadata_depiction=true`. Any client filter must read the raw flag from `/depictions`, not this param.
- Project currently has only **3** data depictions total (2 of which also have a normal `Otu` depiction on the same image).

Done:
- **PanelGallery** (OTU gallery) now hides any image that has a data depiction (`is_metadata_depiction === true`) unless the flag is on an `Otu` depiction. An unflagged `Otu` depiction on the same image does NOT keep it — a label photo routinely gets linked to both the CollectionObject and the OTU with only the CO depiction ticked (e.g. OTU 716458 images 1183915/1183916). Extra `GET /depictions?otu_id[]=X&otu_scope[]=all&otu_scope[]=coordinate_otus` call → `dropIdsFromDepictions()` → filters both `twImages` and the subordinate-taxa fallback (which fetches `/depictions?image_id[]=…` for its sampled ids). Graceful no-op on failure. Trade-off: a genuine habitus shot that happens to be flagged on some CO depiction is also hidden — fix the flag in TW.
- **CO modal (DwcTable)** — left as-is; CO data depictions already appear there via DWC `associatedMedia` (= `collection_object.images`, unfiltered).

Still open / not done:
- DwcTable / GalleryViewer could *label* the CO's data depictions as "Labels & documentation" rather than mixing them with habitus shots (needs per-image flag in DwcTable — extra calls, touches 4 call sites). Low priority given only 3 exist.
- PanelSpecimenOccurrences media filter/thumbnails not reviewed for this.
