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
            v-if="k.otusCount"
            class="border border-base-muted rounded px-2 py-0.5"
          >{{ k.otusCount }} taxa</span>
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

const loading = ref(true)
const keys = ref([])

// Pull the taxon-name markup ("<i>Strophosoma</i> Billberg, 1820") out of an OTU
// object_tag, dropping the otu_tag wrapper and the trailing valid-name ✓ so it
// matches the key page's full_name_tag rendering.
function scopeNameFromObjectTag(tag) {
  if (!tag) return null
  const m = String(tag).match(/<span class="otu_tag_taxon_name"[^>]*>([\s\S]*?)<\/span>/)
  return m ? m[1].trim() : null
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

    // Scope taxon name (italic) for every key's scope OTU in one bulk call —
    // the /leads row carries otu_id, object_tag carries the marked-up name.
    const otuIds = [...new Set(rows.map((r) => r.otu_id).filter(Boolean))]
    let nameByOtuId = new Map()
    if (otuIds.length) {
      try {
        const params = new URLSearchParams()
        otuIds.forEach((id) => params.append('otu_id[]', id))
        const { data: otus } = await makeAPIRequest.get(`/otus?${params.toString()}`)
        nameByOtuId = new Map(
          (Array.isArray(otus) ? otus : []).map((o) => [o.id, scopeNameFromObjectTag(o.object_tag)])
        )
      } catch {
        // leave empty — scope falls back to the plain (still linked) text
      }
    }

    keys.value = rows.map((r, i) => ({
      id: r.id,
      title: metas[i].title || r.text || `Key ${r.id}`,
      scope: metas[i].taxonomic_scope || null,
      // scope OTU (route target) + its italic name, matching the key page header
      otuId: r.otu_id || null,
      scopeHtml: nameByOtuId.get(r.otu_id) || null,
      // Primary source = origin_citation only (the citation flagged is_original
      // in TaxonWorks). No fallback — a key with no flagged original citation
      // shows no "Primary source" line.
      citation: metas[i].origin_citation || null,
      description: r.description || null,
      coupletsCount: r.couplets_count || null,
      otusCount: r.otus_count || null,
      updatedInWords: r.key_updated_at_in_words || null
    }))
  } catch {
    keys.value = []
  } finally {
    loading.value = false
  }
})
</script>
