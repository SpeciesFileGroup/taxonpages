<template>
  <footer
    class="footer text-white bottom-0 border-gray-200 bg-zinc-800 pl-4 pr-4"
  >
    <div class="container mx-auto text-sm pt-2 pb-4">
      <FooterCitation />
      <FooterCopyright />

      <hr class="mt-3 mb-3 border-gray-500" />

      <div class="flex flex-col sm:flex-row justify-between gap-4">
        <div
          class="[&>*:not(:last-child)]:after:content-['|'] [&>*:not(:last-child)]:after:mx-1"
        >
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
          <FooterAnalytics class="italic" />
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
import FooterCitation from '@/components/Footer/FooterCitation.vue'
import FooterCopyright from '@/components/Footer/FooterCopyright.vue'
import FooterAnalytics from '@/components/Footer/FooterAnalytics.vue'
</script>
