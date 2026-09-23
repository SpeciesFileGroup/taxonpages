import { describe, it, expect } from 'vitest'
import { makeSlotRegistry } from '@/utils/loadLayoutSlots.js'

const A = { name: 'A' }
const B = { name: 'B' }
const C = { name: 'C' }

// Contributions come from layout.js files in core modules, local and NPM
// panels/modules, and the site root.
describe('makeSlotRegistry', () => {
  it('accepts bare components, slot objects and lists of either', () => {
    const registry = makeSlotRegistry({
      '/core/news/layout.js': { 'header:before': A },
      '/panels/x/layout.js': {
        'header:before': { component: B, order: -1, bind: { size: 2 }, meta: { m: 1 } },
        footer: [C, { component: A, order: 5 }]
      }
    })

    expect(registry['header:before']).toEqual([
      { component: B, order: -1, bind: { size: 2 }, meta: { m: 1 } },
      { component: A, order: 0, bind: undefined, meta: undefined }
    ])
    expect(registry.footer.map((s) => s.component)).toEqual([C, A])
  })

  it('skips empty files and empty entries', () => {
    const registry = makeSlotRegistry({
      '/a/layout.js': undefined,
      '/b/layout.js': { footer: [null, undefined] }
    })

    expect(registry).toEqual({})
  })
})
