<template>
  <component :is="currentLayout">
    <router-view />
  </component>
</template>

<script setup>
import { useHead } from '@unhead/vue'
import favicons from 'virtual:taxonpages-favicons'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { loadUserLayouts } from './utils'
import { localePath } from '@/i18n/locale.js'
import { resolveI18nConfig } from '@/i18n/config.js'
import { useLocalizedConfig } from '@/i18n/useLocalizedConfig'
import ApplicationLayout from '@/layout/Application.vue'

const DEFAULT_LAYOUT = 'default'
const route = useRoute()
const userLayouts = loadUserLayouts()

const currentLayout = computed(() => {
  const layouts = {
    [DEFAULT_LAYOUT]: ApplicationLayout,
    ...userLayouts
  }

  return layouts[route.meta?.layout || DEFAULT_LAYOUT] || ApplicationLayout
})

const { locale } = useI18n()
const { locales, defaultLocale, isMultiLocale } = resolveI18nConfig(__APP_ENV__)

// hreflang wants fully-qualified URLs. project_url is the site's own public
// address, already used to build the citation URL; without it the best we can
// do is a path, which crawlers tolerate.
const origin = (__APP_ENV__.project_url || '').replace(/\/$/, '')
const hrefFor = (code) => origin + localePath(route.path, code, __APP_ENV__)

// Alternates are derived from the current route, never hand-written, so they
// cannot drift from the routes that actually exist. A single-locale site emits
// none: they would say nothing.
const alternateLinks = computed(() => {
  if (!isMultiLocale) return []

  return [
    ...locales.map((code) => ({
      rel: 'alternate',
      hreflang: code,
      href: hrefFor(code)
    })),
    {
      rel: 'alternate',
      hreflang: 'x-default',
      href: hrefFor(defaultLocale)
    }
  ]
})

// Title and meta are site-author config, so they can carry translations too.
const { c, cDeep } = useLocalizedConfig()

const links = computed(() => [...favicons, ...alternateLinks.value])

useHead({
  title: c(__APP_ENV__.project_name),
  meta: cDeep(__APP_ENV__.metadata),
  htmlAttrs: { lang: locale },
  link: links
})
</script>
