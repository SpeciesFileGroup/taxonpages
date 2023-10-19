---
layout: blank
---
<GalleryCarousel :depiction-id= "blank" height="500px">
  <div class="flex flex-col justify-center items-center w-full h-full bg-black bg-opacity-25 text-white gap-4 px-4 box-border">
    <span class="text-4xl font-medium">{{ app:project_name }}</span>
    <p class="text-lg sm:text-xl">A comprehensive database for the Darwin Wasps of the world</p>
    <div class="mx-auto flex flex-col items-center mt-6 sm:mt-10 w-full ">
      <autocomplete-otu class="w-full sm:w-96 text-base-content ml-2 sm:ml-0" placeholder="Search by taxon name" autofocus/>
    </em>
    </div>
  </div>
</GalleryCarousel>    

<div class="container mx-auto my-8 px-4 md:px-0 box-border">

# {{frontmatter.title}}
_{{frontmatter.lead}}_

## Overview
Welcome to the WID (World Ichneumonidae Daatabase), a website of taxon pages generated from the World Ichneumonidae Database Project, a comprehensive collaborative effort managed in [TaxonWorks](https://taxonworks.org). 

## Get started!
<autocomplete-Geographicarea class="w-80"/>

## Announcements
* 5/1/2022 - We've grown!  
* 1/1/2022 - Our website is live!

## Find out more
Learn how to collaborate with the {{ frontmatter.title }} project. Contact information, technical details, and more are available at [About](/about).
