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
  </script>