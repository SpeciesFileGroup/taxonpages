# About
This document is listing feature requests for TaxonWorks, based on needs that arise from how our project is using TaxonPages (including custom panels)

## Dichotomous keys
- Leads should be able to have alternate values, with a language (similar to sources, that can have translated titles). Alternate values with a set language would allow to have a key in its original language, and an english translation. Currently, we just dump both texts into the same field. If alternate values are delivered via API, a TaxonPages user would be able to switch language for the whole key, or check the original text for a specific couplet in case there is doubt about the translation. Extra nice: If the "New key" task would have UI features that facilitate multi language data entry. More convenient than using the radial annotator on each lead.
- Leads should have rich formatting and data links, just as contents and news

## Keys — API
- **`leads#api_index` (`GET /api/v1/leads`) drops keys whose root lead isn't the most-recently-edited node.**
  `Lead.roots_with_data` builds `key_updated_at = MAX(descendant.updated_at)` per root, then
  `root_leads` joins the whole `leads` table `ON leads_updated_at.key_updated_at = leads.updated_at`
  and `api_index` adds `.where(is_public: true)`. The row that survives the join is whichever lead
  was edited last; only the *root* lead carries `is_public: true` (children are `nil`), so a public
  key is listed **only while its root is the last-touched lead in the key**. Editing any couplet
  hides the key from the public "all keys" list until the root is re-saved. There is no other
  project-wide endpoint for dichotomous keys (`/leads/key/:id` needs the id; `/otus/:id/inventory/keys`
  is per-OTU and only matches keys scoped to / keying-out that exact OTU).
  Fix: apply the `is_public` filter to the root leads *before* the updated-at join, or compute
  `key_updated_by` with a correlated subquery that doesn't gate row selection.
  Workaround for curators: after editing couplets, re-save the root lead.
