// Scientific-name rendering for lead targets.
//
// A lead only carries `target_label` as a flat string ("Polyteles Germar, 1829"),
// so italicising it wholesale also italicises the author + year. TaxonWorks already
// exposes the correct split on the taxon name:
//   cached_html         → "<i>Polyteles</i>"   (name only, italic markup)
//   cached_author_year  → "Germar, 1829"        (roman)
// which is what the vanilla OTU page renders via `full_name_tag` / `cached_html`.
//
// If the OTU carries its own `name` (a free-text label — "Brentidae (except
// Nanophyinae)", "Mesophyletidae: Aepyceratinae ✝"), that wins over the linked
// taxon name: it's shown verbatim, roman, with no separate author-year. Otherwise
// the `target_label` would read "Brentidae Billberg, 1820: Brentidae (except
// Nanophyinae)" and the taxon-name split would silently drop the qualifier.
//
// Instantiated once in KeyView, provided as `keyTaxonNames`; TaxonLink injects it and
// falls back to the plain label for any OTU not in the map. KeyView is reused across
// /key/:id navigations, so `reset()` must be called on each load — otherwise the
// `started` latch keeps the first key's names and every later key falls back to the
// wholesale-italic label.

import { reactive, watch } from 'vue'
import { makeAPIRequest } from '@/utils/request'

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function useKeyTaxonNames(terminalOtusRef) {
  // otuId -> { html, authorYear, plain }
  const map = reactive({})
  let started = false
  let gen = 0 // bumped by reset(); an in-flight resolve() from an older gen must not write

  // Called by KeyView.load() before the next key's tree is built, so the
  // terminalOtusRef watch below re-resolves for the new key.
  function reset() {
    for (const k of Object.keys(map)) delete map[k]
    started = false
    gen++
  }

  async function resolve(otuIds) {
    if (started) return
    started = true
    const myGen = gen
    try {
      const oq = new URLSearchParams()
      otuIds.forEach((id) => oq.append('otu_id[]', id))
      oq.set('per', '1000')
      const { data: otus } = await makeAPIRequest.get(`/otus?${oq.toString()}`)
      if (myGen !== gen) return // superseded by a reset() during the fetch

      const otuList = Array.isArray(otus) ? otus : []

      // OTUs whose own `name` is the label to show — no taxon-name lookup needed.
      for (const o of otuList) {
        if (o.name) {
          map[o.id] = { html: escHtml(o.name), authorYear: '', plain: o.name }
        }
      }

      // The rest resolve through their linked taxon name.
      const otuByTnId = {}
      const tnIds = []
      for (const o of otuList) {
        if (!o.name && o.taxon_name_id != null) {
          otuByTnId[o.taxon_name_id] = o.id
          tnIds.push(o.taxon_name_id)
        }
      }
      if (!tnIds.length) return

      const tq = new URLSearchParams()
      tnIds.forEach((id) => tq.append('taxon_name_id[]', id))
      tq.set('per', '1000')
      const { data: tns } = await makeAPIRequest.get(`/taxon_names?${tq.toString()}`)

      // Superseded by a reset() (key-to-key nav) while awaiting — don't write the
      // previous key's names into the map the new key's resolve() now owns.
      if (myGen !== gen) return

      for (const t of Array.isArray(tns) ? tns : []) {
        const otuId = otuByTnId[t.id]
        if (otuId == null) continue
        map[otuId] = {
          html: t.cached_html || '',
          authorYear: t.cached_author_year || '',
          plain: t.cached || ''
        }
      }
    } catch {
      // leave map empty — TaxonLink falls back to the plain label
    }
  }

  watch(
    terminalOtusRef,
    (list) => {
      const ids = [...new Set((list || []).map((t) => t.id).filter((v) => v != null))]
      if (ids.length) resolve(ids)
    },
    { immediate: true }
  )

  return { map, reset }
}
