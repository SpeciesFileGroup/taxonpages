let registry = null

export function loadLayoutSlots() {
  if (registry) return registry

  const files = import.meta.glob(
    [
      '@/modules/**/layout.js',
      '~/modules/**/layout.js',
      '~/panels/*/layout.js',
      '~/layout.js'
    ],
    {
      eager: true,
      import: 'default'
    }
  )

  registry = makeSlotRegistry(files)

  return registry
}

function makeSlotRegistry(files) {
  const registry = {}

  Object.values(files).forEach((contributions) => {
    if (!contributions) return

    Object.entries(contributions).forEach(([region, value]) => {
      const entries = Array.isArray(value) ? value : [value]

      entries.forEach((entry) => {
        const slot =
          entry && entry.component ? entry : { component: entry, order: 0 }

        if (!slot.component) return

        if (!registry[region]) {
          registry[region] = []
        }

        registry[region].push({
          component: slot.component,
          order: slot.order ?? 0,
          bind: slot.bind,
          meta: slot.meta
        })
      })
    })
  })

  Object.keys(registry).forEach((region) => {
    registry[region].sort((a, b) => a.order - b.order)
  })

  return registry
}
