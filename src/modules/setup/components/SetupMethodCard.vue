<template>
  <section
    class="bg-white rounded-2xl shadow-md border border-slate-200 p-8 transition-shadow hover:shadow-lg"
  >
    <div class="flex items-center gap-3 mb-2">
      <h2 class="text-lg font-semibold text-slate-800">{{ title }}</h2>
      <span
        v-if="recommended"
        class="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700"
      >
        Recommended
      </span>
    </div>

    <p class="text-sm text-slate-500 mb-5">{{ description }}</p>

    <slot />
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  recommended: { type: Boolean, default: false }
})
</script>
