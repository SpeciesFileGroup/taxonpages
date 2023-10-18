---
layout: blank
---
<GalleryCarousel :depiction-id= "" height="470px">
  <div class="flex flex-col justify-center items-center w-full h-full bg-black bg-opacity-25 text-white gap-4 px-4 box-border">
    <span class="text-4xl font-medium">{{ app:project_name }}</span>
    <p class="text-lg sm:text-xl">A comprehensive source of knowledge on the world’s stoneflies, curated by the Plecoptera Species File group</p>
    <div class="mx-auto flex flex-col items-center mt-6 sm:mt-10 w-full ">
      <autocomplete-otu class="w-full sm:w-96 text-base-content ml-2 sm:ml-0" placeholder="Search by taxon name" autofocus/>
        <p class="text-sm sm:text-base"><em>Try searching any taxa from order <router-link to="/otus/890815">Plecoptera</router-link> to subspecies!</p>
      </em>
    </div>
  
  </div>
</GalleryCarousel>    

<div class="container mx-auto my-8 px-4 md:px-0 box-border">

# {{frontmatter.title}}
_{{frontmatter.lead}}_

## Overview
Welcome to *{{ frontmatter.project }}*, a website of taxon pages generated from the {{ frontmatter.project }} Project, a comprehensive collaborative effort managed in [TaxonWorks](https://taxonworks.org). 

## Get started!
<autocomplete-otu class="w-80"/>

## Announcements
* 5/1/2022 - We've grown!  
* 1/1/2022 - Our website is live!

## Find out more
Learn how to collaborate with the {{ frontmatter.title }} project. Contact information, technical details, and more are available at [About](/about).
