<template>
    <div class="h-full">
      <SectionLandscape />
      <SectionData />
      <hr class="border-base-muted" />
      <SectionDescription />
      <SectionAuthor class="shadow-sm" />
      <hr class="border-base-muted" />
  
      <SectionAnnouncements />
      <SectionTerms class="drop-shadow" />
    </div>
  </template>
  <script setup>
  import SectionData from './components/Section/SectionData.vue'
  import SectionLandscape from './components/Section/SectionLandscape.vue'
  import SectionDescription from './components/Section/SectionDescription.vue'
  import SectionTerms from './components/Section/SectionTerms.vue'
  import SectionAnnouncements from './components/Section/SectionAnnouncements.vue'
  </script>