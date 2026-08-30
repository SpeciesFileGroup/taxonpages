// Scientific-name rendering for lead targets.
//
// A lead only carries `target_label` as a flat string ("Polyteles Germar, 1829"),
// so italicising it wholesale also italicises the author + year. TaxonWorks already
// exposes the correct split on the taxon name:
//   cached_html         → "<i>Polyteles</i>"   (name only, italic markup)
//   cached_author_year  → "Germar, 1829"        (roman)
// which is what the vanilla OTU page renders via `full_name_tag` / `cached_html`.
//
// Instantiated once in KeyView, provided as `keyTaxonNames`; TaxonLink injects it and
// falls back to the plain label for any OTU not in the map. KeyView is reused across
// /key/:id navigations, so `reset()` must be called on each load — otherwise the
// `started` latch keeps the first key's names and every later key falls back to the
// wholesale-italic label.

import { reactive, watch } from 'vue'
import { makeAPIRequest } from '@/utils/request'

export function useKeyTaxonNames(terminalOtusRef) {
  // otuId -> { html, authorYear, plain }
  const map = reactive({})
  let started = false

  // Called by KeyView.load() before the next key's tree is built, so the
  // terminalOtusRef watch below re-resolves for the new key.
  function reset() {
    for (const k of Object.keys(map)) delete map[k]
    started = false
  }

  async function resolve(otuIds) {
    if (started) return
    started = true
    try {
      const oq = new URLSearchParams()
      otuIds.forEach((id) => oq.append('otu_id[]', id))
      oq.set('per', '1000')
      const { data: otus } = await makeAPIRequest.get(`/otus?${oq.toString()}`)

      const otuByTnId = {}
      const tnIds = []
      for (const o of Array.isArray(otus) ? otus : []) {
        if (o.taxon_name_id != null) {
          otuByTnId[o.taxon_name_id] = o.id
          tnIds.push(o.taxon_name_id)
        }
      }
      if (!tnIds.length) return

      const tq = new URLSearchParams()
      tnIds.forEach((id) => tq.append('taxon_name_id[]', id))
      tq.set('per', '1000')
      const { data: tns } = await makeAPIRequest.get(`/taxon_names?${tq.toString()}`)

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
