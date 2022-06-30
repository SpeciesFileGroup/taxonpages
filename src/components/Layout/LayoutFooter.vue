<template>
  <footer class="footer text-white bottom-0 border-gray-200 bg-zinc-800 pl-4 pr-4">
    <div class="container mx-auto text-sm pt-2 pb-4">
      <div class="pt-4 pb-4">
        {{ project_authors }}
        {{ project_citation }}
        <span v-if="project_url">
          &lt;
          <a
            class="text-primary-500"
            :href="project_url"
          >
            {{ project_url }} 
          </a>
          &gt;
        </span>
      </div>
      <div class="flex items-center text-xs">
        <component 
          :is="copyright_image_link
            ? 'a'
            : 'span'"
          :href="copyright_image_link"
        >
          <img
            v-if="copyright_image"
            class="mr-2"
            :src="copyright_image"
          >
        </component>
        <p>{{ copyright_text }}</p>
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
import projectConfiguration from '@/config/project.yml'
import copyrightConfiguration from '@/config/copyright.yml'

const {
  project_authors,
  project_citation,
  project_url
} = projectConfiguration

const {
  copyright_text,
  copyright_image,
  copyright_image_link
} = copyrightConfiguration

</script>
