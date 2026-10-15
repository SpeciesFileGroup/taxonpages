// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import FacetOrder from '@/modules/DwCFilter/components/Facet/FacetOrder.vue'
import SelectInput from '@/components/Input/SelectInput.global.vue'
import InputText from '@/components/Input/InputText.global.vue'
import VButton from '@/components/Button/VButton.global.vue'

function mountFacet(parameters = {}) {
  return mount(FacetOrder, {
    props: {
      modelValue: parameters,
      'onUpdate:modelValue': () => {}
    },
    global: {
      components: { SelectInput, InputText, VButton },
      stubs: { IconTrash: true, IconPlusCircle: true },
      mocks: { $t: (key) => key }
    }
  })
}

function rowRanks(wrapper) {
  return wrapper.findAll('select').map((select) => select.element.value)
}

describe('FacetOrder', () => {
  it('starts with a single empty row when no rank is set', () => {
    const wrapper = mountFacet()

    expect(rowRanks(wrapper)).toEqual(['kingdom'])
    expect(wrapper.find('input').element.value).toBe('')
  })

  it('offers subfamily, tribe and subtribe as ranks', () => {
    const wrapper = mountFacet()
    const options = wrapper.findAll('option').map((o) => o.element.value)

    expect(options).toEqual(
      expect.arrayContaining(['subfamily', 'tribe', 'subtribe'])
    )
  })

  it('builds one row per rank already present in the parameters', () => {
    const wrapper = mountFacet({ family: 'Aphididae', tribe: 'Aphidini' })

    expect(rowRanks(wrapper)).toEqual(['family', 'tribe'])
  })

  it('writes the value under the selected rank and moves it on rank change', async () => {
    const parameters = {}
    const wrapper = mountFacet(parameters)

    await wrapper.find('input').setValue('Aphididae')
    expect(parameters).toEqual({ kingdom: 'Aphididae' })

    await wrapper.find('select').setValue('subtribe')
    expect(parameters).toEqual({ subtribe: 'Aphididae' })
  })

  it('drops the parameter when the value is cleared', async () => {
    const parameters = { genus: 'Aphis' }
    const wrapper = mountFacet(parameters)

    await wrapper.find('input').setValue('')
    expect(parameters).toEqual({})
  })

  it('adds rows with unused ranks and removes them with their parameter', async () => {
    const parameters = { kingdom: 'Animalia' }
    const wrapper = mountFacet(parameters)
    const addButton = () =>
      wrapper.findAll('button').find((b) => b.text().includes('add'))

    await addButton().trigger('click')
    expect(rowRanks(wrapper)).toEqual(['kingdom', 'phylum'])

    // A rank used by one row is not offered by the others
    const secondRowOptions = wrapper
      .findAll('select')[1]
      .findAll('option')
      .map((o) => o.element.value)
    expect(secondRowOptions).not.toContain('kingdom')

    const removeButtons = wrapper
      .findAll('button')
      .filter((b) => b.attributes('title') === 'dwc_filter.classification_remove')
    await removeButtons[0].trigger('click')

    expect(rowRanks(wrapper)).toEqual(['phylum'])
    expect(parameters).toEqual({})
  })

  it('rebuilds rows when the parameters object is replaced', async () => {
    const wrapper = mountFacet({ genus: 'Aphis' })

    await wrapper.setProps({ modelValue: {} })
    await nextTick()

    expect(rowRanks(wrapper)).toEqual(['kingdom'])
  })
})
