<template>
  <div
    class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6"
  >
    <div class="max-w-3xl w-full space-y-8">
      <header class="text-center">
        <div class="flex justify-center mb-5">
          <div class="leaf-container">
            <svg
              class="leaf-icon"
              xmlns="http://www.w3.org/2000/svg"
              width="56"
              height="56"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8c0 5.5-4.78 10-10 10Z"
              />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          </div>
        </div>

        <h1 class="text-5xl font-bold text-slate-800 mb-3">
          Welcome to TaxonPages
        </h1>
        <p class="text-xl text-slate-500">
          Configure your TaxonWorks API connection to get started.
        </p>
      </header>

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
            <CopyableCode text="npx @sfgrp/taxonpages setup" />
          </li>
          <li>
            Follow the on-screen steps to set your API URL and project token
          </li>
          <li>Save your changes — the dev server will restart automatically</li>
        </ol>

        <InfoBox>
          The wizard also lets you customize styles and manage installed
          packages — ideal for first-time setup.
        </InfoBox>
      </SetupMethodCard>

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
          TaxonWorks project. After saving, the development server will restart
          automatically.
        </InfoBox>
      </SetupMethodCard>
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
/* Option 1: Gear — slow spin with emerald glow */
.gear-container {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(16, 185, 129, 0.1) 0%,
    transparent 70%
  );
}

.gear-icon {
  color: #10b981;
  animation: gear-spin 8s linear infinite;
  filter: drop-shadow(0 0 6px rgba(16, 185, 129, 0.3));
}

@keyframes gear-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Option 4: Leaf — gentle sway with emerald tones */
.leaf-container {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(16, 185, 129, 0.1) 0%,
    transparent 70%
  );
}

.leaf-icon {
  color: #10b981;
  animation: leaf-sway 3s ease-in-out infinite;
  transform-origin: bottom center;
  filter: drop-shadow(0 0 6px rgba(16, 185, 129, 0.3));
}

@keyframes leaf-sway {
  0%,
  100% {
    transform: rotate(-6deg);
  }
  50% {
    transform: rotate(6deg);
  }
}
</style>
