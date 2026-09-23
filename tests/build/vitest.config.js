import baseConfig from '../../vitest.config.js'

// Build smoke tests: real SPA and SSR builds of a scaffolded project. Slow, so
// they run with `npm run test:build` (and in CI), not with `npm test`.
// Spread rather than mergeConfig, which would concatenate `include`.
export default {
  ...baseConfig,
  test: {
    ...baseConfig.test,
    include: ['tests/build/**/*.test.js'],
    exclude: [],
    testTimeout: 300_000,
    hookTimeout: 300_000
  }
}
