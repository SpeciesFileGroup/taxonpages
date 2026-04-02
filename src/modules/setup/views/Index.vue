<template>
  <div
    class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6 overflow-hidden"
  >
    <div class="max-w-3xl w-full space-y-8">
      <header class="text-center">
        <h1
          class="text-5xl font-bold text-slate-800 mb-3 intro-anim"
          style="--anim-delay: 1"
        >
          Welcome to TaxonPages
        </h1>
        <p
          class="text-xl text-slate-500 intro-anim"
          style="--anim-delay: 2"
        >
          Configure your TaxonWorks API connection to get started.
        </p>
      </header>

      <div
        class="intro-anim"
        style="--anim-delay: 3"
      >
        <SetupMethodCard
          title="Setup Wizard"
          :recommended="true"
          description="Use the interactive wizard to configure your TaxonWorks connection, style, and installed packages — all from a visual interface. Available only for local development."
        >
          <ol
            class="text-sm text-slate-600 space-y-2 mb-6 list-decimal list-inside"
          >
            <li>
              Run the setup wizard:
              <CopyableCode text="npm run setup" />
            </li>
            <li>
              Follow the on-screen steps to set your API URL and project token
            </li>
            <li>
              Save your changes — the dev server will restart automatically
            </li>
          </ol>

          <InfoBox>
            The wizard also lets you customize styles and manage installed
            packages — ideal for first-time setup.
          </InfoBox>
        </SetupMethodCard>
      </div>

      <div
        class="intro-anim"
        style="--anim-delay: 4"
      >
        <SetupMethodCard
          title="Manual Configuration"
          description="Edit the configuration file directly. Useful for advanced users, CI environments, or quick edits."
        >
          <p class="text-sm text-slate-600 mb-4">
            Open
            <code class="px-1.5 py-0.5 bg-slate-100 rounded text-xs font-mono"
              >config/api.yml</code
            >
            in your project root and set the following values:
          </p>

          <CodeBlock />

          <InfoBox>
            Replace <strong>url</strong> with your TaxonWorks instance API
            endpoint and <strong>project_token</strong> with the token from your
            TaxonWorks project. After saving, the development server will
            restart automatically.
          </InfoBox>
        </SetupMethodCard>
      </div>
    </div>
  </div>
</template>

<script setup>
import SetupMethodCard from '../components/SetupMethodCard.vue'
import CodeBlock from '../components/CodeBlock.vue'
import InfoBox from '../components/InfoBox.vue'
import CopyableCode from '../components/CopyableCode.vue'
</script>

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
