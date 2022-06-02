<template>
  <footer class="footer text-white bottom-0 border-t border-gray-200 bg-zinc-800 pl-4 pr-4">
    <div class="container mx-auto text-sm pt-2 pb-4">
      <div class="pt-4 pb-4">
        {{ VITE_PAGE_PROJECT_AUTHORS }}
        {{ VITE_PAGE_PROJECT_CITATION }}
        <span v-if="VITE_PAGE_PROJECT_URL">
          &lt;
          <a
            class="text-blue-500"
            :href="VITE_PAGE_PROJECT_URL"
          >
            {{ VITE_PAGE_PROJECT_URL }} 
          </a>
          &gt;
        </span>
      </div>
      <div class="flex items-center text-xs">
        <component 
          :is="VITE_PAGE_FOOTER_COPYRIGHT_IMAGE_LINK
            ? 'a'
            : 'span'"
          :href="VITE_PAGE_FOOTER_COPYRIGHT_IMAGE_LINK"
        >
          <img
            v-if="VITE_PAGE_FOOTER_COPYRIGHT_IMAGE"
            class="mr-2"
            :src="VITE_PAGE_FOOTER_COPYRIGHT_IMAGE"
          >
        </component>
        <p>{{ VITE_PAGE_FOOTER_COPYRIGHT_TEXT }}</p>
      </div>

      <hr class="mt-3 mb-3 border-gray-500">

      <div class="flex justify-between text-xs">
        <div class="flex items-center">
          <img
            width="123"
            :src="TWLogo"
            title="TaxonWorks"
          >
          <span class="ml-2 mr-2">|</span>
          <span>
            The engine of this website and database is powered by 
            <a 
              target="_blank"
              href="https://taxonworks.org/"
            >
              TaxonWorks
            </a>
          </span>
        </div>
      </div>
    </div>
  </footer>
</template>
<script setup>

import TWLogo from '@/assets/images/taxonworks_full_logo.svg?url'

const {
  VITE_PAGE_PROJECT_AUTHORS,
  VITE_PAGE_PROJECT_CITATION,
  VITE_PAGE_PROJECT_URL,
  VITE_PAGE_FOOTER_COPYRIGHT_TEXT,
  VITE_PAGE_FOOTER_COPYRIGHT_IMAGE,
  VITE_PAGE_FOOTER_COPYRIGHT_IMAGE_LINK,
} = import.meta.env

</script>
