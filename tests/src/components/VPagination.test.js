// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import VPagination from '@/components/Pagination/VPagination.global.vue'

function mountPagination(props) {
  return mount(VPagination, {
    props: { total: 100, per: 10, modelValue: 1, ...props },
    global: { mocks: { $t: (key) => key } }
  })
}

const pageButtons = (wrapper) =>
  wrapper.findAll('button').filter((b) => /^Go to page/.test(b.attributes('aria-label')))

describe('VPagination', () => {
  it('marks the current page and disables backwards navigation on page 1', () => {
    const wrapper = mountPagination()
    const current = wrapper.find('[aria-current="page"]')

    expect(current.text()).toBe('1')
    expect(wrapper.find('[aria-label="component.pagination.first"]').attributes()).toHaveProperty('disabled')
    expect(wrapper.find('[aria-label="component.pagination.previous"]').attributes()).toHaveProperty('disabled')
  })

  it('shows only the pages within range of the current one', () => {
    const wrapper = mountPagination({ modelValue: 5, rangePages: 2 })

    expect(pageButtons(wrapper).map((b) => b.text())).toEqual(['4', '5', '6'])
  })

  it('emits the selected page through v-model and select', async () => {
    const wrapper = mountPagination({ modelValue: 3 })

    await wrapper.find('[aria-label="Go to page 4"]').trigger('click')
    await wrapper.find('[aria-label="component.pagination.previous"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[4], [2]])
    expect(wrapper.emitted('select')).toEqual([[4], [2]])
  })

  it('renders no pages when there are no results', () => {
    const wrapper = mountPagination({ total: 0 })

    expect(pageButtons(wrapper)).toHaveLength(0)
  })
})
