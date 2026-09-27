// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import Breadcrumb from '@/modules/otus/components/Breadcrumb/Breadcrumb.vue'

function mountBreadcrumb(list) {
  return mount(Breadcrumb, {
    props: { list, current: { full_name_tag: '<i>Aus bus</i>' } },
    global: {
      stubs: { RouterLink: RouterLinkStub, IconArrowRight: true },
      mocks: { $t: (key) => key }
    }
  })
}

describe('Breadcrumb', () => {
  it('links every parent to its page', () => {
    const wrapper = mountBreadcrumb({ Root: [{ id: 1 }], Aus: [{ id: 2 }] })

    expect(wrapper.findAllComponents(RouterLinkStub).map((l) => l.props('to'))).toEqual([
      { name: 'otus-id', params: { id: 1 } },
      { name: 'otus-id', params: { id: 2 } }
    ])
  })

  it('shows a parent without an id as text', () => {
    const wrapper = mountBreadcrumb({ Root: [{ name: null }], Aus: [{ id: 2 }] })
    const links = wrapper.findAllComponents(RouterLinkStub)

    expect(links).toHaveLength(1)
    expect(links[0].text()).toBe('Aus')
    expect(wrapper.text()).toContain('Root')
  })
})
