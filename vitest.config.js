import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import Vue from '@vitejs/plugin-vue'

const root = fileURLToPath(new URL('.', import.meta.url))

/**
 * Test configuration.
 *
 * Deliberately independent of cli/utils/resolveConfig.js: getViteConfig reads
 * the current project's config/, discovers packages and writes Tailwind
 * sources, none of which a test run should depend on or touch.
 *
 * The default environment is node, which doubles as an SSR-safety check for
 * every module a test imports. Component tests opt into a DOM per file with
 * `// @vitest-environment happy-dom`.
 */
export default defineConfig({
  plugins: [Vue()],

  resolve: {
    alias: [
      { find: '@', replacement: resolve(root, 'src') },
      // No user project exists under test: `~/` globs resolve to nothing.
      { find: '~', replacement: resolve(root, 'tests/.no-project') },
      // Generated from ~/pages by the router plugin, which does not run here.
      {
        find: /^vue-router\/auto-routes$/,
        replacement: resolve(root, 'tests/stubs/autoRoutes.js')
      }
    ]
  },

  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    exclude: ['tests/build/**'],
    setupFiles: ['tests/setup.js'],
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,vue}', 'cli/**/*.{js,vue}', 'server.js'],
      exclude: ['src/assets/**', 'src/components/Icon/**'],
      reporter: ['text-summary', 'text', 'html', 'json-summary'],
      // Floors a few points under the measured baseline: they catch a drop in
      // the areas that matter most, not a percentage to chase. Raise them as
      // coverage grows; never lower them to make a change pass.
      thresholds: {
        lines: 17,
        branches: 19,
        functions: 13,
        statements: 17,
        'src/plugins/vite/**': { lines: 75, branches: 65, functions: 70, statements: 75 },
        'src/i18n/**': { lines: 60, branches: 65, functions: 50, statements: 60 },
        'cli/utils/**': { lines: 80, branches: 65, functions: 70, statements: 75 }
      }
    }
  }
})
