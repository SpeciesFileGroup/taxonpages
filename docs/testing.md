# Testing

TaxonPages is tested with [Vitest](https://vitest.dev) and
[Vue Test Utils](https://test-utils.vuejs.org). This guide is for contributors
to TaxonPages itself.

## Running tests

| Command                 | What it does                                                    |
| ----------------------- | --------------------------------------------------------------- |
| `npm test`              | Run every test once                                             |
| `npm run test:watch`    | Re-run affected tests on change                                 |
| `npm run test:coverage` | Run once with coverage; fails if a threshold is not met         |
| `npm run test:build`    | Build a scaffolded site (SPA and SSR) and query its SSR server  |

Run a single file or test by name:

```bash
npx vitest run tests/src/i18n/locale.test.js
npx vitest run -t "local package override"
```

The coverage report is written to `coverage/` (open `coverage/index.html`).

`npm publish` runs `npm test` and `npm run test:build` first (`prepublishOnly`)
and aborts if either fails.

CI (`.github/workflows/test.yml`) runs `test:coverage` and `test:build` on the
minimum Node version in `engines` and on the current LTS.

## Where tests go

Tests live in `tests/`, mirroring the source tree, never next to the code:
`src/` and `cli/` are published to npm.

```
tests/
  helpers/project.js    createProject() and fixture builders
  helpers/app.js        loadRouter(): the real router for a given configuration
  stubs/                stand-ins for build-time virtual modules
  src/…                 tests for src/…   (tests/src/i18n/locale.test.js)
  cli/…                 tests for cli/…   (tests/cli/setup/routes/config.test.js)
  architecture/         rules about the codebase itself
  build/                build smoke tests (npm run test:build only)
```

Name files `<source name>.test.js`.

## Which kind of test

- **Unit** (the default): pure functions such as config parsing, locale/URL
  mapping, package discovery, and the setup wizard's value model. They run in
  Node, as SSR does, so a module that touches `window` or `document` at import
  time fails there too.
- **Component**: Vue components with behaviour of their own. Put
  `// @vitest-environment happy-dom` on the file's first line. Assert what a
  user sees and does (text, `aria-*` attributes, emitted events, storage),
  never CSS classes or markup structure.
- **Integration**: Vite plugins (call `transform`/`load` directly), Express
  routes (mount the router on port 0 and use `fetch`), and CLI commands against a
  fixture project on disk.
- **Build** (`tests/build/`): real `taxonpages build` / `build:ssr` runs. They
  are slow, so add one only for what nothing smaller can catch.

There is no browser (E2E) suite: the SSR smoke test covers serving pages.

Code that reads `__APP_ENV__` gets `{}` by default (`tests/setup.js`). Override
it with `vi.stubGlobal('__APP_ENV__', {...})`. If the module reads it at import
time, also call `vi.resetModules()` and import it dynamically after the stub.

Anything that needs routing should use the real router rather than a
hand-written one: `loadRouter(config, url)` from `tests/helpers/app.js` sets
the configuration and the browser URL, then returns `src/router` (DOM
environment only). File-based routes from `~/pages` do not exist under test.
To add some, mock the virtual module:

```js
vi.mock('vue-router/auto-routes', () => ({
  routes: [{ path: '/about', name: '/about', component: {} }]
}))
```

Mock as little as possible, and only at the edges: npm, the network. Tests must
not use the internet or a real TaxonWorks server.

## Fixture projects, modules and panels

Never use the repository's own `config/`, `panels/` or a real package as a
fixture. Build a throwaway project with `createProject()`. It is written to the
OS temp dir and deleted after each test:

```js
import { createProject, npmPackage, panelEntry } from '../helpers/project.js'

const root = createProject({
  // Only direct dependencies are discovered
  'package.json': { dependencies: { 'taxonpages-panel-foo': '*' } },

  // An NPM panel
  'node_modules/taxonpages-panel-foo/package.json': npmPackage('taxonpages-panel-foo', { type: 'panel' }),
  'node_modules/taxonpages-panel-foo/src/main.js': panelEntry('panel:foo'),

  // A local panel and a local module
  'panels/Local/main.js': panelEntry('panel:local'),
  'modules/blog/router/index.js': 'export default []',

  // Config: strings are written as is, objects as JSON
  'config/i18n.yml': 'i18n:\n  locales: [en, es]'
})
```

Then pass `root` as `projectRoot` to the code under test. Use `writeFiles(root,
{...})` to add files later, for example to simulate `npm install` in a mocked
`execFileSync`.

## Coverage

Thresholds in `vitest.config.js` are floors set a few points under the measured
coverage. They are strictest for package discovery and the Vite plugins
(`src/plugins/vite`), i18n and `cli/utils`. Raise them when coverage grows. Do
not lower them to make a change pass, and do not write tests just to move the
number.

## Known bugs

A known bug that is not fixed yet is recorded as `it.fails(...)` with a comment.
The test fails once the bug is fixed; then drop `.fails`.

When fixing a bug, first add a test that fails without the fix.
