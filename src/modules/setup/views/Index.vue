<template>
  <div
    class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6"
  >
    <div class="max-w-2xl w-full">
      <div class="text-center mb-10">
        <h1 class="text-5xl font-bold text-slate-800 mb-3">
          Welcome to TaxonPages
        </h1>
        <p class="text-xl text-slate-500">You're almost there!</p>
      </div>

      <div class="bg-white rounded-2xl shadow-md border border-slate-200 p-8">
        <div class="flex items-center gap-3 mb-4">
          <span
            class="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-600 text-sm font-bold"
            >!</span
          >
          <h2 class="text-lg font-semibold text-slate-700">
            API configuration required
          </h2>
        </div>

        <p class="text-slate-600 mb-6">
          To connect your TaxonPages site to a TaxonWorks project, edit the file
          <code
            class="px-2 py-1 bg-slate-100 rounded text-sm font-mono text-slate-800"
            >config/api.yml</code
          >
          in your project root:
        </p>

        <div class="bg-slate-800 rounded-xl p-5 mb-6 overflow-x-auto">
          <pre
            class="text-sm font-mono leading-relaxed"
          ><span class="text-slate-500"># config/api.yml</span>
<span class="text-emerald-400">url</span><span class="text-slate-300">: </span><span class="text-amber-300">https://sfg.taxonworks.org/api/v1</span>
<span class="text-emerald-400">project_token</span><span class="text-slate-300">: </span><span class="text-amber-300">YOUR_PROJECT_TOKEN_HERE</span></pre>
        </div>

        <div class="flex items-start gap-3 bg-slate-50 rounded-xl p-4">
          <span class="text-slate-400 mt-0.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
            </svg>
          </span>
          <p class="text-sm text-slate-600">
            Replace the <strong>url</strong> with your TaxonWorks instance API
            endpoint and <strong>project_token</strong> with the token from your
            TaxonWorks project. After saving, the development server will
            restart automatically.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
