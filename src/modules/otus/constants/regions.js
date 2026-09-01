import { loadLayoutSlots } from '@/utils'
import { panelsById } from './layouts.js'

/**
 * Regions the taxon page exposes. Every key is a public identifier: sites and
 * packages target them from `taxa_page_regions` and from `layout.js`, so a
 * region can be added but never renamed or removed without breaking them.
 *
 * `loaded` tells whether `taxon` and `otu` are guaranteed to be populated when
 * the region renders. Regions marked `false` render from the first frame, so
 * their components must tolerate both being `null`.
 */
export const TAXA_PAGE_REGIONS = {
  'taxa_page:header:rank:after': {
    label: 'Next to the rank',
    loaded: true
  },
  'taxa_page:header:taxonname:after': {
    label: 'Next to the taxon name',
    loaded: true
  },
  'taxa_page:header:taxoninfo:end': {
    label: 'End of the taxon name block',
    loaded: true
  },
  'taxa_page:header:actions:end': {
    label: 'Next to the download buttons',
    loaded: false
  },
  'taxa_page:header:titlebar:after': {
    label: 'Below the title bar, full width',
    loaded: false
  },
  'taxa_page:header:end': {
    label: 'Bottom of the page header',
    loaded: false
  },
  'taxa_page:content:start': {
    label: 'Top of the content area, on every tab',
    loaded: false
  }
}

const { taxa_page_regions: regionsConfig } = __APP_ENV__

/**
 * Entries contributed through `layout.js` files, restricted to the regions
 * this module owns. Global regions keep being resolved by LayoutOutlet itself.
 */
function slotEntriesFor(region) {
  return loadLayoutSlots()[region] || []
}

/**
 * Resolve one `taxa_page_regions` entry against the panel registry.
 * Accepts either a bare panel id or an object with `bind`, `order` and
 * `rank_group`.
 */
function makeConfigEntry(entry, region) {
  const isPanelKey = typeof entry === 'string'
  const config = isPanelKey ? { id: entry } : { ...entry }
  const panel = panelsById.get(config.id)

  if (!panel) {
    console.error(
      `[taxonpages] Unknown panel id "${config.id}" in the taxa_page_regions ` +
        `configuration for region "${region}". No panel declares it, so it ` +
        `will not be rendered.`
    )
    return null
  }

  return {
    component: panel.component,
    order: config.order ?? 0,
    bind: { panelKey: config.id, ...config.bind },
    meta: {
      id: config.id,
      rankGroup: config.rank_group ?? panel.rankGroup ?? []
    }
  }
}

function makeRegistry() {
  const registry = {}

  for (const region of Object.keys(TAXA_PAGE_REGIONS)) {
    const configured = (regionsConfig?.[region] || [])
      .map((entry) => makeConfigEntry(entry, region))
      .filter(Boolean)

    const entries = [...slotEntriesFor(region), ...configured]

    if (entries.length) {
      registry[region] = entries.sort((a, b) => a.order - b.order)
    }
  }

  for (const region of Object.keys(regionsConfig || {})) {
    if (!TAXA_PAGE_REGIONS[region]) {
      console.error(
        `[taxonpages] Unknown region "${region}" in the taxa_page_regions ` +
          `configuration. Known regions: ${Object.keys(TAXA_PAGE_REGIONS).join(', ')}.`
      )
    }
  }

  return registry
}

const registry = makeRegistry()

export function getRegionEntries(region) {
  return registry[region] || []
}
