<template>
  <footer class="footer text-white bottom-0 border-gray-200 bg-zinc-800 pl-4 pr-4">
    <div class="container mx-auto text-sm pt-2 pb-4">
      <div class="pt-4 pb-2">
        {{ project_authors }}
        {{ project_citation }}
        <span v-if="project_url">
          &lt;
          <a
            class="text-secondary-color"
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

      <div class="flex items-center">
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

        <span class="ml-2 mr-2">|</span>

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
        <span class="ml-2 mr-2">|</span>
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
      </div>
    </div>
  </footer>
</template>
<script setup>

const {
  project_authors,
  project_citation,
  project_url,
  copyright_text,
  copyright_image,
  copyright_image_link
} = __APP_ENV__

</script>
