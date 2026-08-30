<template>
  <div class="container mx-auto py-6">
    <h1 class="text-2xl font-semibold text-base-content mb-4">Keys</h1>

    <VSpinner v-if="loading" />
    <p
      v-else-if="!keys.length"
      class="text-base-soft"
    >No public keys in this project.</p>

    <ul
      v-else
      class="space-y-4"
    >
      <li
        v-for="k in keys"
        :key="k.id"
        class="rounded-lg border border-base-muted bg-base-foreground p-4 sm:p-5"
      >
        <RouterLink
          :to="{ name: 'dichotomous-key', params: { id: k.id } }"
          class="text-lg text-base-content hover:underline hover:text-secondary [&_i]:italic"
          v-html="k.title"
        />
        <p
          v-if="k.scope"
          class="mt-1 text-sm text-base-content [&_i]:italic"
        >
          <span class="text-base-soft">Scope: </span><RouterLink
            v-if="k.otuId"
            :to="{ name: 'otus-id', params: { id: k.otuId } }"
            target="_blank"
            rel="noopener"
            class="text-secondary hover:underline"
          ><span
            v-if="k.scopeHtml"
            v-html="k.scopeHtml"
          /><template v-else>{{ k.scope }}</template></RouterLink><span
            v-else-if="k.scopeHtml"
            v-html="k.scopeHtml"
          /><template v-else>{{ k.scope }}</template>
        </p>
        <p
          v-if="k.citation"
          class="mt-1 text-sm text-base-content [&_i]:italic"
        >
          <span class="text-base-soft">Primary source: </span><span v-html="sanitizeAndLinkifyHtml(k.citation)" />
        </p>
        <p
          v-if="k.description"
          class="mt-1 text-sm text-base-content"
        >{{ k.description }}</p>
        <div class="mt-2 flex flex-wrap gap-2 text-xs text-base-soft">
          <span
            v-if="k.coupletsCount"
            class="border border-base-muted rounded px-2 py-0.5"
          >{{ k.coupletsCount }} couplets</span>
          <span
            v-if="k.taxaCount"
            class="border border-base-muted rounded px-2 py-0.5"
          >{{ k.taxaCount }} taxa</span>
          <span
            v-if="k.updatedInWords"
            class="border border-base-muted rounded px-2 py-0.5"
          >updated {{ k.updatedInWords }} ago</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { makeAPIRequest } from '@/utils/request'
import { sanitizeAndLinkifyHtml } from '@/utils'
import { rankIndex } from './lib/completeness.js'

const loading = ref(true)
const keys = ref([])

// Pull the marked-up scope name ("<i>Adosomus</i> Faust, 1904", "Entimini
// Schönherr, 1823") out of an OTU object_tag: the inner HTML of the
// otu_tag_taxon_name / otu_tag_otu_name span, author-year kept, verbatim. The
// trailing valid-name ✓ sits outside that inner span, so matching to the first
// </span> already excludes it. `[^>]*>` after the class name tolerates the
// span's other attributes (title=…) and any extra classes; the otu_name
// alternative covers name-only OTUs with no linked taxon name.
// (PanelBiologicalAssociationsV2 matches the same span but reduces it to the
//  italic construct + "sp." — a different name policy, kept separate on purpose.)
function scopeNameFromObjectTag(tag) {
  if (!tag) return null
  const m = String(tag).match(/otu_tag_(?:taxon_name|otu_name)[^>]*>([\s\S]*?)<\/span>/)
  return m ? m[1].trim() || null : null
}

onMounted(async () => {
  try {
    const { data: list } = await makeAPIRequest.get('/leads')
    const rows = Array.isArray(list) ? list : []
    // One metadata call per key (there are only a handful) for scope + citation,
    // which the /leads list row does not carry.
    const metas = await Promise.all(
      rows.map((r) =>
        makeAPIRequest
          .get(`/leads/key/${r.id}`)
          .then((res) => res.data?.metadata || {})
          .catch(() => ({}))
      )
    )

    // Scope taxon (marked-up name + rank) for every key's scope OTU. The /leads
    // row carries otu_id; /otus gives object_tag (the name) + taxon_name_id, and
    // a second batched call resolves those to ranks (for sorting).
    const otuIds = [...new Set(rows.map((r) => r.otu_id).filter(Boolean))]
    const nameByOtuId = new Map()
    const rankIdxByOtuId = new Map()
    if (otuIds.length) {
      try {
        const oq = new URLSearchParams()
        otuIds.forEach((id) => oq.append('otu_id[]', id))
        oq.set('per', '1000') // one scope OTU per key — don't let /otus' default 50 truncate
        const { data: otus } = await makeAPIRequest.get(`/otus?${oq.toString()}`)

        const tnIdByOtuId = new Map()
        for (const o of Array.isArray(otus) ? otus : []) {
          nameByOtuId.set(o.id, scopeNameFromObjectTag(o.object_tag))
          if (o.taxon_name_id != null) tnIdByOtuId.set(o.id, o.taxon_name_id)
        }

        const tnIds = [...new Set(tnIdByOtuId.values())]
        if (tnIds.length) {
          const tq = new URLSearchParams()
          tnIds.forEach((id) => tq.append('taxon_name_id[]', id))
          tq.set('per', '1000')
          const { data: tns } = await makeAPIRequest.get(`/taxon_names?${tq.toString()}`)
          const rankByTnId = new Map(
            (Array.isArray(tns) ? tns : []).map((t) => [t.id, t.rank || t.rank_string])
          )
          for (const [otuId, tnId] of tnIdByOtuId) {
            rankIdxByOtuId.set(otuId, rankIndex(rankByTnId.get(tnId)))
          }
        }
      } catch {
        // leave empty — scope falls back to the plain (still linked) text, no sort key
      }
    }

    keys.value = rows
      .map((r, i) => ({
        id: r.id,
        title: metas[i].title || r.text || `Key ${r.id}`,
        scope: metas[i].taxonomic_scope || null,
        // scope OTU (route target) + its italic name, matching the key page header
        otuId: r.otu_id || null,
        scopeHtml: nameByOtuId.get(r.otu_id) || null,
        // Coarse->fine index of the scope taxon's rank; -1 (unknown) sorts last.
        scopeRankIdx: rankIdxByOtuId.get(r.otu_id) ?? -1,
        // Primary source = origin_citation only (the citation flagged is_original
        // in TaxonWorks). No fallback — a key with no flagged original citation
        // shows no "Primary source" line.
        citation: metas[i].origin_citation || null,
        description: r.description || null,
        coupletsCount: r.couplets_count || null,
        // /leads' otus_count = distinct OTUs across every lead + lead_item, which
        // includes the root's scope OTU (r.otu_id) when the key has one. Subtract
        // that so the pill counts only what the key distinguishes; a scope-less
        // key (r.otu_id null) has nothing to subtract.
        taxaCount: r.otus_count
          ? Math.max(0, r.otus_count - (r.otu_id ? 1 : 0))
          : null,
        updatedInWords: r.key_updated_at_in_words || null
      }))
      // Highest rank first (coarsest scope on top); unknown rank last. Within a
      // rank, the larger key (more couplets) first; then by title.
      .sort((a, b) => {
        const ra = a.scopeRankIdx < 0 ? Infinity : a.scopeRankIdx
        const rb = b.scopeRankIdx < 0 ? Infinity : b.scopeRankIdx
        if (ra !== rb) return ra - rb
        if ((a.coupletsCount || 0) !== (b.coupletsCount || 0)) {
          return (b.coupletsCount || 0) - (a.coupletsCount || 0)
        }
        return String(a.title).localeCompare(String(b.title))
      })
  } catch {
    keys.value = []
  } finally {
    loading.value = false
  }
})
</script>
