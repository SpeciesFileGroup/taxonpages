<template>
  <section class="bg-base-foreground p-4 py-10">
    <div class="prose !container mx-auto dark:prose-invert">
      <h2>Find out more</h2>
      <p>
        Find out more on this new public version of OSF. Learn how to
        collaborate with the Orthoptera Species File project. Contact
        information, technical details, and more are available at
        <RouterLink to="about">About.</RouterLink>
      </p>
      <h2>Format for referencing this website</h2>
      <p>
        When referencing this website, please use the following format:
        Cigliano, M.M., H. Braun, D.C. Eades & D. Otte. Orthoptera Species File
        [retrieval date]. &lt;
        <a :href="project_url">
          {{ project_url }}
        </a>
        &gt;
      </p>

      <h2>Terms of use</h2>

      <p>
        Except where otherwise noted, content on this site is licensed under a
        the terms of the
        <a href="https://creativecommons.org/licenses/by/4.0/"
          >Creative Commons Attribution License (CC-BY)</a
        >. Images are by default open-access under the terms of the
        <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
          >CC BY-NC-SA license</a
        >, unless stated otherwise
      </p>
    </div>
  </section>
</template>

<script setup>
const { project_url } = __APP_ENV__
</script>
