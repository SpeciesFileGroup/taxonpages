// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TranslatableField from '../../../../../cli/setup/client/components/TranslatableField.vue'
import { useI18nConfig } from '../../../../../cli/setup/client/composables/useI18nConfig.js'

// The i18n settings are shared module state, normally loaded from /api/i18n.
function setLocales(locales) {
  const [defaultLocale] = locales

  useI18nConfig().state.value = {
    defaultLocale,
    locales,
    isMultiLocale: locales.length > 1,
    configuration: { i18n: { default_locale: defaultLocale, locales } }
  }
}

const mountField = (modelValue) =>
  mount(TranslatableField, { props: { field: { placeholder: 'Label' }, modelValue } })

beforeEach(() => setLocales(['en']))

describe('TranslatableField', () => {
  it('is a single plain input emitting strings on a single-locale site', async () => {
    const wrapper = mountField('Home')

    expect(wrapper.findAll('input')).toHaveLength(1)
    expect(wrapper.text()).not.toContain('Translations')

    await wrapper.find('input').setValue('House')

    expect(wrapper.emitted('update:modelValue')).toEqual([['House']])
  })

  it('adds a translation next to the default text on a multi-locale site', async () => {
    setLocales(['en', 'es'])
    const wrapper = mountField('Home')

    expect(wrapper.text()).toContain('1/2')

    await wrapper.find('button').trigger('click')
    const [, spanish] = wrapper.findAll('input')
    await spanish.setValue('Inicio')

    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([{ en: 'Home', es: 'Inicio' }])
  })

  it('shows existing translations without a click', () => {
    setLocales(['en', 'es'])
    const wrapper = mountField({ en: 'Home', es: 'Inicio' })

    expect(wrapper.findAll('input').map((i) => i.element.value)).toEqual(['Home', 'Inicio'])
  })

  // Text for a removed locale is never rendered by the site; the wizard must
  // surface it rather than silently keep or drop it.
  it('surfaces and can remove text for a locale no longer configured', async () => {
    const wrapper = mountField({ en: 'Home', fr: 'Accueil' })

    expect(wrapper.text()).toContain('1 unconfigured')

    await wrapper.find('button[title="Remove this translation"]').trigger('click')

    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['Home'])
  })
})
