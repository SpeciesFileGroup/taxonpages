/**
 * Turning the `taxa_page` configuration into renderable tab layouts.
 *
 * Free of import.meta.glob and __APP_ENV__: constants/layouts.js collects the
 * panel entries and the configuration, and hands them in here.
 */

/**
 * Index panel entries by id. The first entry to declare an id wins, so the
 * caller controls precedence by ordering (user panels before core ones).
 *
 * @param {Array<{id: string}>} entries - Default exports of panel main.js files
 * @returns {Map<string, object>}
 */
export function makePanelRegistry(entries) {
  const panelsById = new Map()

  for (const entry of entries) {
    if (entry?.id && !panelsById.has(entry.id)) {
      panelsById.set(entry.id, entry)
    }
  }

  return panelsById
}

/**
 * Resolve one tab's rows/columns of panel references into panel entries.
 *
 * A reference is a panel id, or an object with an `id` plus overrides (`bind`,
 * `rank_group`). Unknown ids are reported and dropped rather than breaking the
 * page.
 *
 * @param {Array<Array<Array<string|object>>>} panelLayout
 * @param {Map<string, object>} panelsById
 * @returns {Array<Array<Array<object>>>}
 */
export function parsePanelConfiguration(panelLayout, panelsById) {
  return panelLayout.map((row) =>
    row.map((col) =>
      col
        .map((panel) => {
          const isPanelKey = typeof panel === 'string'
          const { rank_group, ...panelObj } = isPanelKey
            ? { id: panel }
            : { ...panel }
          const entry = panelsById.get(panelObj.id)

          if (!entry) {
            console.error(
              `[taxonpages] Unknown panel id "${panelObj.id}" in the taxa_page ` +
                `configuration. No panel declares it, so it will not be rendered.`
            )
            return null
          }

          return {
            ...entry,
            ...panelObj,
            ...(Array.isArray(rank_group) && { rankGroup: rank_group })
          }
        })
        .filter(Boolean)
    )
  )
}

/**
 * Build every tab layout from the `taxa_page` configuration.
 *
 * @param {object} tabsLayout - `taxa_page`, keyed by tab
 * @param {Map<string, object>} panelsById
 * @returns {Record<string, {panels: Array, rankGroup: string[], label: *}>}
 */
export function buildTabLayouts(tabsLayout, panelsById) {
  const layouts = {}

  for (const key in tabsLayout) {
    const tabLayout = tabsLayout[key]

    layouts[key] = {
      panels: parsePanelConfiguration(tabLayout?.panels || {}, panelsById),
      rankGroup: tabLayout.rank_group || [],
      label: tabLayout.label
    }
  }

  return layouts
}
