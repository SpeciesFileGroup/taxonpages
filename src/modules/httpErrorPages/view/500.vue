<template>
  <div class="container mx-auto text-center relative top-1/4">
    <h1 class="text-7xl text-base-lighter">500</h1>
    <p>{{ $t('http_errors.server_error.title') }}</p>
    <p
      class="m-4 my-10 text-xl"
      v-html="$t('http_errors.server_error.body')"
    />
  </div>
</template>
