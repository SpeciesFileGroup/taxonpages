<template>
  <footer
    class="footer text-white bottom-0 border-gray-200 bg-zinc-800 pl-4 pr-4"
  >
    <div class="container mx-auto text-sm pt-2 pb-4">
      <div class="pt-4 pb-2">
        {{ project_authors }}
        {{ project_citation }}.
        <ClientOnly>
          <span>Retrieved on {{ currentDate }}</span>
        </ClientOnly>
        <span v-if="currentUrl">
          at
          <a
            class="text-secondary-color"
            :href="currentUrl"
          >
            {{ currentUrl }}
          </a>
        </span>
      </div>
      <div class="flex items-center text-xs gap-2">
        <component
          :is="copyright_image_link ? 'a' : 'span'"
          :href="copyright_image_link"
          class="min-w-fit"
        >
          <img
            v-if="copyright_image"
            :src="copyright_image"
            alt="copyright"
          />
        </component>
        <span>{{ copyright_text }}</span>
      </div>

      <hr class="mt-3 mb-3 border-gray-500" />

      <div class="flex flex-col sm:flex-row justify-between gap-4">
        <div class="[&>*:not(:last-child)]:after:content-['|'] [&>*:not(:last-child)]:after:mx-1">
          <span>
            Data provided by
            <a
              class="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 font-medium"
              target="_blank"
              href="https://taxonworks.org/"
            >
              TaxonWorks
            </a>
          </span>
          <span>
            Pages by
            <a
              class="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 font-medium"
              target="_blank"
              href="https://github.com/SpeciesFileGroup/taxonpages"
            >
              TaxonPages
            </a>
          </span>
          <span>
            Support (Services) by
            <a
              class="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 font-medium"
              target="_blank"
              href="https://speciesfilegroup.org"
            >
              Species File Group
            </a>
          </span>
          <FooterAnalytics class="italic"/>
        </div>
        <TrackerReport
          icon
          label="Report a problem"
          button-class="flex gap-2 items-center pl-0 pr-0 pt-0 pb-0 self-end"
        />
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import FooterAnalytics from '@/components/Footer/FooterAnalytics.vue'

const {
  project_authors,
  project_citation,
  project_url,
  copyright_text,
  copyright_image,
  copyright_image_link,
  hash_mode
} = __APP_ENV__

const currentDate = new Date().toISOString().split('T')[0]
const route = useRoute()

const currentUrl = computed(() => {
  const projectUrl = (project_url || '').replace(/\/$/, '')

  if (!projectUrl.length) {
    return ''
  }

  return hash_mode
    ? projectUrl + '/#' + route.fullPath
    : projectUrl + route.fullPath
})
</script>
