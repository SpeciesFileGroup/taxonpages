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
          <span class="text-base-soft">Scope: </span><span v-html="k.scope" />
        </p>
        <p
          v-if="k.citation"
          class="mt-1 text-sm text-base-content [&_i]:italic"
          v-html="sanitizeAndLinkifyHtml(k.citation)"
        />
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
    // One batched citations call: root-lead citation per key (the key id IS the
    // root lead id). Used to fill the "Primary source" line for keys whose
    // citation isn't flagged is_original in TaxonWorks (A15).
    const cq = new URLSearchParams()
    cq.set('citation_object_type', 'Lead')
    cq.append('extend[]', 'source')
    rows.forEach((r) => cq.append('citation_object_id[]', r.id))
    const citesByLead = {}
    try {
      const { data: cites } = await makeAPIRequest.get(`/citations?${cq.toString()}`)
      for (const c of Array.isArray(cites) ? cites : []) {
        ;(citesByLead[String(c.citation_object_id)] ||= []).push(c)
      }
    } catch (e) {
      /* leave empty */
    }

    keys.value = rows.map((r, i) => ({
      id: r.id,
      title: metas[i].title || r.text || `Key ${r.id}`,
      scope: metas[i].taxonomic_scope || null,
      citation:
        metas[i].origin_citation ||
        citesByLead[String(r.id)]?.[0]?.source?.cached ||
        null,
      description: r.description || null,
      coupletsCount: r.couplets_count || null,
      otusCount: r.otus_count || null,
      updatedInWords: r.key_updated_at_in_words || null
    }))
  } catch (e) {
    keys.value = []
  } finally {
    loading.value = false
  }
})
</script>
