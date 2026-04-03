<template>
  <div
    class="min-h-[70vh] h-full bg-linear-to-br from-base-background to-base-muted/30 flex items-center justify-center px-6 py-16"
  >
    <div class="max-w-2xl w-full space-y-12">
      <header class="text-center space-y-5">
        <h1
          class="text-4xl sm:text-5xl font-bold text-base-content tracking-tight intro-anim"
          style="--anim-delay: 1"
        >
          Welcome to TaxonPages
        </h1>
        <p
          class="text-lg sm:text-xl text-base-soft leading-relaxed intro-anim"
          style="--anim-delay: 2"
        >
          A modern, open-source framework for building beautiful biodiversity
          taxon pages powered by Species File Group.
        </p>
      </header>

      <div
        class="intro-anim"
        style="--anim-delay: 3"
      >
        <div
          class="mx-auto max-w-lg rounded-2xl border border-base-border/60 bg-base-foreground/50 shadow-md p-8 transition-shadow hover:shadow-lg"
        >
          <h2 class="text-base font-semibold text-base-content mb-3">
            Getting started
          </h2>
          <p class="text-sm text-base-soft leading-relaxed">
            This is the default home page. To replace it, create an
            <code
              class="px-1.5 py-0.5 rounded bg-base-muted/60 text-secondary text-xs font-mono"
              >index.md</code
            >
            or
            <code
              class="px-1.5 py-0.5 rounded bg-base-muted/60 text-secondary text-xs font-mono"
              >index.vue</code
            >
            file inside the
            <code
              class="px-1.5 py-0.5 rounded bg-base-muted/60 text-secondary text-xs font-mono"
              >/pages</code
            >
            directory. Your new page will automatically take the place of this
            one.
          </p>

          <hr class="my-5 border-base-border/40" />

          <div class="flex items-start gap-3">
            <svg
              class="w-5 h-5 text-secondary mt-0.5 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
              />
            </svg>
            <p class="text-sm text-base-soft leading-relaxed">
              You can use Markdown for simple content pages or Vue single-file
              components for full interactivity. Check the
              <a
                href="https://github.com/SpeciesFileGroup/taxonpages/tree/package"
                target="_blank"
                rel="noopener noreferrer"
                class="text-secondary hover:opacity-80"
                >documentation</a
              >
              for more details.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.intro-anim {
  opacity: 0;
  transform: translateY(60px) scale(0.97);
  animation: parallax-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: calc(var(--anim-delay) * 0.15s + 0.2s);
}

@keyframes parallax-in {
  0% {
    opacity: 0;
    transform: translateY(60px) scale(0.97);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .intro-anim {
    opacity: 1;
    transform: none;
    animation: none;
  }
}
</style>
