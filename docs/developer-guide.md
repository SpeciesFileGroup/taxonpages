# Developer Guide

This guide covers how to extend TaxonPages with your own panels, modules, and plugins — both as local extensions inside a project and as NPM packages published to the ecosystem.

For configuring and operating a TaxonPages site, see the [User Guide](user-guide.md).

## Extension types

TaxonPages can be extended in three ways. Each addresses a different need:

| Extension type | Use when you want to...                            |
| -------------- | -------------------------------------------------- |
| Panel          | Add a UI panel to taxon pages                      |
| Module         | Add new routes/pages                               |
| Plugin         | Modify the build pipeline, server, Vue app, or CLI |

### Package sources and priority

Panels and modules can come from three sources. When a name conflict occurs, the higher-priority source wins:

| Priority    | Source        | Location                                     |
| ----------- | ------------- | -------------------------------------------- |
| 1 (highest) | Local folders | `panels/*` and `modules/*` in your project   |
| 2           | NPM packages  | `node_modules/` with a `taxonpages` manifest |
| 3 (lowest)  | Core          | Built into `@sfgrp/taxonpages`               |

If you have a local panel with the same base name as an NPM package, the local version takes precedence and a warning is logged at startup.

## External panels

To add panels in Taxa pages, create a folder called `panels` in your project root, and inside it create another folder for your panel. For example: `panels/PanelTest`

In `PanelTest` folder, create a `main.js` file, with the following structure:

```javascript
import MyPanelComponent from './MyPanelComponent.vue'

export default {
  id: 'panel:test', // ID to identify this panel
  component: MyPanelComponent, // Vue component for your panel
  rankGroup: [
    'HigherClassificationGroup',
    'FamilyGroup',
    'GenusGroup',
    'SpeciesGroup'
  ] // <-- OPTIONAL: This will define for which rank group will be available, remove it if your panel will be available for all.
}
```

This file is used to load your panel component in taxa page. Use the `id` to include and define the position in the layout in `taxa_page.yml`.

```yaml
taxa_page_overview:
  panels:
    - - - panel:gallery
        - panel:test # <--- Your new panel
        - panel:type
        - panel:type-specimen
        - panel:nomenclature
        - panel:nomenclature-references

      - - panel:map
        - panel:descendants
        - panel:scrutiny
        - panel:content
        - panel:keys
        - panel:etymology
        - panel:gbif
        - panel:statistics
        - panel:sounds
```

### Panel configuration schema

Panels can include a `setup.schema.json` file alongside `main.js` to provide a schema-driven configuration form in the `taxonpages setup` layout editor. When a schema is present, the layout editor shows a **config** button that opens a proper form instead of the raw JSON bind editor.

Create `panels/PanelTest/setup.schema.json`:

```json
{
  "label": "Test Panel Settings",
  "fields": {
    "show_images": {
      "type": "boolean",
      "label": "Show Images",
      "description": "Display thumbnail images alongside results",
      "default": true
    },
    "max_results": {
      "type": "number",
      "label": "Max Results",
      "default": 10
    }
  }
}
```

The field types are the same used in the setup UI: `string`, `number`, `boolean`, `select`, `array`, and `object`. See [Field types](#field-types) for full details.

Configuration values are stored in the panel's `bind` object in `taxa_page.yml`:

```yaml
taxa_page:
  overview:
    panels:
      - - - id: panel:test
            bind:
              show_images: true
              max_results: 20
```

Without a setup.schema.json, panels can still accept bind values by declaring them manually in taxa_page.yml, but there is no UI to edit them from the wizard. Providing a schema is the recommended path for any panel that needs per-instance configuration.

## External modules

Modules add new pages and routes to TaxonPages. Create a folder called `modules` in your project root, and inside it create a folder for your module with a `router/` directory:

```
modules/
└── my-feature/
    ├── router/
    │   └── index.js
    ├── views/
    │   └── index.vue
    └── components/
        └── MyWidget.global.vue   # Optional: auto-registered globally
```

The router file must default-export an array of [Vue Router route records](https://router.vuejs.org/api/#routerecordraw):

```javascript
// modules/my-feature/router/index.js
export default [
  {
    name: 'my-feature',
    path: '/my-feature',
    component: () => import('../views/index.vue')
  }
]
```

Module routes register automatically at startup. No YAML configuration is needed.

### Module configuration schema

Modules can provide a `setup.schema.json` file in their root directory to add a configuration section to the `taxonpages setup` web interface. The setup wizard discovers these schemas automatically from core modules, local modules, and NPM packages.

#### Field-based configuration

For simple settings, define `fields` in your schema. The setup wizard auto-renders a form:

```json
{
  "file": "my_feature.yml",
  "label": "My Feature",
  "description": "Configure my feature module",
  "configKey": "my_feature",
  "fields": {
    "enabled": {
      "type": "boolean",
      "label": "Enabled",
      "default": true
    },
    "items_per_page": {
      "type": "number",
      "label": "Items Per Page",
      "default": 10
    },
    "display_mode": {
      "type": "select",
      "label": "Display Mode",
      "options": ["list", "grid", "cards"],
      "default": "list"
    }
  }
}
```

| Property      | Type     | Required | Description                                                               |
| ------------- | -------- | -------- | ------------------------------------------------------------------------- |
| `file`        | `string` | Yes      | YAML filename in `config/` where settings are stored                      |
| `label`       | `string` | Yes      | Display name shown in the setup UI sidebar                                |
| `description` | `string` | No       | Short description shown below the section heading                         |
| `configKey`   | `string` | No       | Root key in the YAML file. Defaults to filename without extension         |
| `fields`      | `object` | Yes      | Map of config keys to field definitions (see [Field types](#field-types)) |

The configuration values are stored in `config/<file>` and accessible at runtime via the `__APP_ENV__` global object.

##### Translatable fields

A `string` field whose value is text the reader sees can be marked
`translatable`. On a multi-locale site the setup wizard then offers one input
per configured locale and writes the locale map described in
[Translating site content](#translating-site-content):

```json
{
  "title": {
    "type": "string",
    "label": "Title",
    "translatable": true
  }
}
```

Mark a field only if your component resolves it through `localize` or
`localizeDeep` — otherwise the wizard offers a translation that never renders.
Leave identity unmarked: URLs, ids, and anything cited elsewhere.

The flag changes nothing for a single-locale site. The wizard still shows one
input and still writes a plain string, so a field can be marked before any
locale is configured.

You do not need the flag for the wizard to *recognise* an existing translation:
a value that is already a locale map is edited as one either way, so config
written by hand is never flattened. What the flag adds is the ability to create
a translation from the UI, and it is also what lets the wizard recognise text
left behind for a locale that has since been removed from `config/i18n.yml`.

#### Custom editor component

When the auto-generated form is not enough (e.g., drag-and-drop layout builders, visual editors, or complex interactive UIs), modules can provide a custom Vue component as the settings editor:

```
modules/
└── my-feature/
    ├── setup.schema.json
    ├── setup/
    │   └── MyEditor.vue        # Custom settings editor
    ├── router/
    │   └── index.js
    └── ...
```

```json
{
  "file": "my_feature.yml",
  "label": "My Feature",
  "description": "Configure my feature module",
  "editor": "custom",
  "component": "./setup/MyEditor.vue",
  "configKey": "my_feature"
}
```

| Property    | Type     | Required | Description                                                 |
| ----------- | -------- | -------- | ----------------------------------------------------------- |
| `editor`    | `string` | Yes      | Must be `"custom"` to enable custom editor                  |
| `component` | `string` | Yes      | Path to the Vue component, relative to the module directory |
| `file`      | `string` | Yes      | YAML filename in `config/` where settings are stored        |
| `configKey` | `string` | No       | Root key in the YAML file                                   |

Custom editors are loaded as virtual modules (`virtual:editor/<name>`) so they participate in Vite's normal module graph. The setup wizard passes configuration methods as props, so custom editors do not need to import from the setup client directly:

| Prop                | Type       | Description                                               |
| ------------------- | ---------- | --------------------------------------------------------- |
| `section`           | `Object`   | The section definition from the schema                    |
| `configData`        | `Object`   | Reactive object with all loaded config files              |
| `setConfigValue`    | `Function` | `(filename, key, value)` — sets a config value            |
| `saveConfig`        | `Function` | `(filename)` — saves a config file                        |
| `hasUnsavedChanges` | `Function` | `(filename)` — returns whether a file has unsaved changes |

```vue
<template>
  <div class="tp-card p-5">
    <p>Current value: {{ configData[section.file]?.[configKey] }}</p>

    <button
      class="tp-btn tp-btn-primary"
      :disabled="!hasUnsavedChanges(section.file)"
      @click="saveConfig(section.file)"
    >
      Save
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  section: { type: Object, required: true },
  configData: { type: Object, required: true },
  setConfigValue: { type: Function, required: true },
  saveConfig: { type: Function, required: true },
  hasUnsavedChanges: { type: Function, required: true }
})

const configKey = computed(
  () => props.section.configKey || props.section.file.replace('.yml', '')
)
</script>
```

Shared setup UI components are registered globally, so a custom editor can use
them without importing anything:

| Component               | Purpose                                                        |
| ----------------------- | -------------------------------------------------------------- |
| `SwModal`               | Modal dialog                                                    |
| `SwPanelConfigEditor`   | Form for a panel's `bind` values, driven by its `setup.schema.json` |
| `SwTranslatableField`   | Text input with one value per locale (see [Translatable fields](#translatable-fields)) |
| `SwTranslatedText`      | Read-only display of a value that may be translated             |

```vue
<SwTranslatableField
  :field="{ placeholder: 'Section heading' }"
  :model-value="value"
  @update:model-value="update($event)"
/>

<!-- Labelling something you are not editing here -->
<SwTranslatedText :value="tab.label" :fallback="tabKey" />
```

Both are safe to use unconditionally: on a single-locale site the field renders
a single input and emits a plain string, so there is no need to branch on
whether the site is translated. Reach for `SwTranslatedText` anywhere a config
value is only being shown — a plain `{{ tab.label }}` renders a translated value
as `[object Object]`.

> **Do not import from the wizard client.** A custom editor lives in a module,
> and a module is built by the main application as well as by the wizard —
> Tailwind scans it either way. The `@setup` alias only exists while
> `taxonpages setup` is running, so an import through it fails to resolve during
> `taxonpages dev` and `taxonpages build`, taking the whole site's dependency
> scan down with it. Use the globally registered components above instead.

The Tailwind CSS utility classes used in the setup wizard are available in custom editor components.

## Injecting into the layout

Modules can render their own components in named regions of the main application layout — for example, an announcement bar above the navigation — without editing any core file.

### How it works

A package contributes to the layout by adding a `layout.js` file at its root that default-exports a map of region names to components:

```javascript
// modules/my-feature/layout.js
import AnnouncementBar from './components/AnnouncementBar.vue'

export default {
  'header:before': AnnouncementBar
}
```

These files are discovered automatically from local panels (`panels/*/layout.js`), local modules (`modules/*/layout.js`), NPM packages (`layout.js` at the package root), and the project root (`layout.js` in your project). Every component contributed to a region is rendered, so multiple packages can target the same region.

### Global regions

Global regions belong to the application shell and have no prefix.

| Region          | Position                      |
| --------------- | ----------------------------- |
| `header:before` | Above the main navigation bar |
| `header:after`  | Below the main navigation bar |
| `main:before`   | Top of the main content area  |
| `footer:before` | Above the footer              |

### Taxon page regions

The taxon page exposes its own regions, prefixed with `taxa_page:`. Unlike the
global ones, they can also be filled from configuration, and the components they
render receive the page's data as props.

Region names read `<scope>:<area>:<anchor>:<position>`, where `before` / `after`
place a component outside the anchor and `start` / `end` place it inside, at the
beginning or the end.

| Region                             | Position                                              | Data       |
| ---------------------------------- | ----------------------------------------------------- | ---------- |
| `taxa_page:header:rank:after`      | Next to the rank, inline                               | Loaded     |
| `taxa_page:header:taxonname:after` | Next to the taxon name, inline                         | Loaded     |
| `taxa_page:header:taxoninfo:end`   | End of the taxon name block, below the common names    | Loaded     |
| `taxa_page:header:actions:end`     | Next to the download buttons                           | May be null |
| `taxa_page:header:titlebar:after`  | Below the title bar, full width                        | May be null |
| `taxa_page:header:end`             | Bottom of the page header, below the tabs              | May be null |
| `taxa_page:content:start`          | Top of the content area, on every tab                  | May be null |

Components contributed to these regions receive `taxon`, `taxonId`, `otu` and
`otuId` as props. The **Data** column says whether those are guaranteed to be
populated: the first three regions render only once the page has loaded, while
the rest render from the first frame, so their components must tolerate `taxon`
and `otu` being `null`. During SSR every region renders after the data has been
fetched; the null case happens on the client, before the request resolves.

### Placing panels in a taxon page region

A region can also be filled from `config/taxa_page.yml`, using the same panels
you place in tabs. Region configuration lives under `taxa_page_regions`, a key
of its own next to `taxa_page`:

```yaml
taxa_page:
  overview:
    panels:
      - - - panel:gallery

taxa_page_regions:
  taxa_page:header:taxonname:after:
    - panel:tags
  taxa_page:header:titlebar:after:
    - id: panel:annotations
      rank_group: [SpeciesGroup]
      order: 10
      bind:
        variant: inline
```

Entries take the same shape as in the tab layout: a bare panel id, or an object
with `bind` (props passed to the component), `rank_group` (restricts the panel
to certain rank groups) and `order` (lower renders first). A panel placed in a
region is not rendered in any tab unless you also list it there.

Panels rendered in a region get the same props they get in a tab, so the same
component can serve both places. Since regions are usually inline, a panel meant
for both should let the site choose its presentation rather than always wrapping
itself in a `VCard`:

```vue
<template>
  <component :is="variant === 'inline' ? 'span' : VCard">
    <!-- ... -->
  </component>
</template>
```

Unknown region names and unknown panel ids are reported on the console at
startup and are not rendered.

### Ordering and multiple components

A region can also receive an array, and each entry can set an `order` (lower renders first) to control placement when several packages contribute to the same region:

```javascript
import AnnouncementBar from './components/AnnouncementBar.vue'

export default {
  'header:before': [{ component: AnnouncementBar, order: 10 }]
}
```

A bare component is treated as `{ component, order: 0 }`.

An entry can also carry `bind` (props passed to the component) and `meta`. The
layout registry never interprets `meta`: it is carried through untouched so a
module can attach its own rules to a contribution. The taxon page uses it for
rank filtering:

```javascript
export default {
  'taxa_page:header:taxonname:after': [
    {
      component: ConservationStatus,
      order: 10,
      meta: { rankGroup: ['SpeciesGroup'] }
    }
  ]
}
```

### Notes

- Components contributed to a global region receive no props. They should read their own configuration (e.g. from `__APP_ENV__`) and manage their own state. Taxon page regions are the exception: they pass `taxon`, `taxonId`, `otu` and `otuId`.
- For browser-only behavior such as reading `localStorage`, wrap the markup in `<ClientOnly>` to avoid SSR hydration mismatches, the same way core components do.
- Adding a region is backwards compatible, but renaming or removing one breaks every site and package that targets it. New regions are added on demand rather than up front.

## Server Routes (API Proxy)

TaxonPages supports user-defined server-side API routes, useful for proxying external APIs that require tokens or sensitive credentials. This keeps secrets on the server and avoids exposing them to the browser.

Server routes are only available in SSR mode (`dev:ssr` / `serve`).

### Creating a route

Create a `server/routes/` directory in your project root. Each `.js` file becomes an API endpoint, where the filename determines the URL prefix:

```
server/
└── routes/
    └── xeno-canto.js   →  /api/xeno-canto/*
```

Each file must export a default function that receives a context object and returns an Express Router:

```javascript
// server/routes/xeno-canto.js
export default function ({ env, router }) {
  const r = router()

  r.get('/recordings', async (req, res) => {
    const { query } = req.query

    if (!query) {
      return res.status(400).json({ error: 'Missing query parameter' })
    }

    const params = new URLSearchParams({
      query,
      key: env.TAXONPAGES_XENO_CANTO_API_KEY
    })

    const response = await fetch(
      `https://xeno-canto.org/api/3/recordings?${decodeURIComponent(params)}`
    )

    res.status(response.status).json(await response.json())
  })

  return r
}
```

### Environment variables

Store sensitive credentials in a `.env` file at the project root. Only variables prefixed with `TAXONPAGES_` are loaded and available in route handlers via `ctx.env`:

```
# .env
TAXONPAGES_XENO_CANTO_API_KEY=your_key_here
```

The `.env` file supports the same variants as Vite: `.env`, `.env.local`, `.env.development`, `.env.production`.

Environment variables set on the host (e.g., in production deployments) take precedence over `.env` file values. These variables are never exposed to the client.

### Context object

The route factory function receives a context object with the following properties:

| Property      | Type       | Description                                        |
| ------------- | ---------- | -------------------------------------------------- |
| `env`         | `object`   | Environment variables prefixed with `TAXONPAGES_`  |
| `router`      | `function` | Factory that returns a new Express Router instance |
| `projectRoot` | `string`   | Absolute path to the user's project directory      |

### Calling from the frontend

From your Vue components, call the route using the `/api/<filename>/` prefix:

```javascript
const params = new URLSearchParams({ query: name })
const response = await fetch(
  `/api/xeno-canto/recordings?${decodeURIComponent(params)}`
)
const data = await response.json()
```

### Hot reload

In development mode (`dev:ssr`), route files are watched for changes and reloaded automatically without restarting the server.

## Customizing existing NPM packages

### Unpacking an NPM package for customization

If you want to customize an NPM package, you can unpack it into your local project directory using the `package unpack` command:

```bash
taxonpages package unpack @vendor/taxonpages-panel-inaturalist
```

This copies the package source into `panels/inaturalist/` (for panels) or `modules/bibliography/` (for modules), where you can edit the files directly. The command will also offer to uninstall the NPM package, since the local copy takes priority.

If the package has its own dependencies, the command will list them so you can ensure they remain installed in your project.

### Overriding an NPM panel locally

To customize a panel installed from NPM, create a local panel folder with the same base name. For example, if the NPM package is `@vendor/taxonpages-panel-foo`, create `panels/foo/main.js`. The local version takes priority.

## Plugins

Plugins extend TaxonPages at the framework level — they can modify the Vite build pipeline, add Express middleware, register Vue plugins, or add CLI commands. Unlike panels and modules (which add content), plugins modify how TaxonPages itself works.

### Installing a plugin

```bash
taxonpages package add @vendor/taxonpages-plugin-sitemap
```

Or install manually:

```bash
npm install @vendor/taxonpages-plugin-sitemap
```

Plugins are discovered automatically at startup from `node_modules` using the same mechanism as panels and modules. Restart the dev server after installing.

### Local plugins

For development or project-specific plugins, create a `plugins/` directory in your project root:

```
plugins/
└── my-plugin/
    └── plugin.js
```

Local plugins take priority over NPM plugins with the same name.

### Disabling a plugin

Same as panels and modules — add the package name to the `disabled` list:

```yaml
packages:
  disabled:
    - '@vendor/taxonpages-plugin-sitemap'
```

### Creating a plugin

A plugin is an NPM package with `"type": "plugin"` in the `taxonpages` manifest:

```json
{
  "name": "@vendor/taxonpages-plugin-sitemap",
  "version": "1.0.0",
  "taxonpages": {
    "type": "plugin",
    "entry": "./src/plugin.js"
  },
  "peerDependencies": {
    "@sfgrp/taxonpages": ">=0.3.0"
  }
}
```

The entry file must export a default function (the plugin factory) that receives a context object and returns a descriptor with optional hooks:

```javascript
// src/plugin.js
export default function ({ projectRoot, packageRoot, configuration, logger }) {
  return {
    name: 'my-plugin',

    // Extend the Vite configuration (returns config to merge)
    vite(config) {
      return {
        plugins: [
          /* additional Vite plugins */
        ],
        optimizeDeps: { include: ['some-lib'] }
      }
    },

    // Add Express middleware or routes (SSR mode only)
    server(app, { isProd }) {
      app.use('/my-endpoint', (req, res) => {
        /* ... */
      })
    },

    // Add CLI commands
    cli(program) {
      program
        .command('my-command')
        .description('Does something')
        .action(() => {
          /* ... */
        })
    }
  }
}
```

All hooks are optional. A plugin only needs to implement the hooks it uses.

### Available hooks

| Hook       | When it runs                           | Receives                      | Returns                     |
| ---------- | -------------------------------------- | ----------------------------- | --------------------------- |
| `vite()`   | During Vite config resolution          | Core Vite config object       | Config object to deep-merge |
| `server()` | After API routes, before SSR catch-all | Express app, `{ isProd }`     | Nothing                     |
| `cli()`    | Before `program.parse()` in the CLI    | Commander.js program instance | Nothing                     |

The `vite()` hook merges returned config additively. Protected keys (`root`, `base`, `resolve.alias`) cannot be overridden by plugins.

### Vue app setup

Plugins that need to extend the Vue app (e.g., register a Vue plugin or a
global directive) should provide a `vueSetup.js` file in the plugin directory:

```
taxonpages-plugin-tooltip/
├── package.json
└── src/
    ├── plugin.js       # Plugin factory (vite hook, etc.)
    └── vueSetup.js     # Vue app setup (auto-discovered)
```

```javascript
// src/vueSetup.js — note: this file is NOT inside the plugin.js factory
import TooltipDirective from './TooltipDirective.js'

export default function (app, { router, store, i18n }) {
  app.directive('tooltip', TooltipDirective)
}
```

The `vueSetup.js` file is discovered automatically if it exists in the plugin's root directory. It exports a default function that receives the Vue app instance and `{ router, store, i18n }`.

> **Do not install your own i18n instance here.** TaxonPages creates one in
> core and passes it as `i18n`, so a second instance would shadow it and
> detach your strings from the site's locale. To translate a plugin's own
> strings, ship a `locales/<locale>.yml` catalog instead — it is merged into
> the core catalog automatically.

### Plugin context

The factory function receives a context object:

| Property        | Type     | Description                                       |
| --------------- | -------- | ------------------------------------------------- |
| `projectRoot`   | `string` | Absolute path to the user's project directory     |
| `packageRoot`   | `string` | Absolute path to the TaxonPages package directory |
| `configuration` | `object` | Loaded YAML configuration (`__APP_ENV__` values)  |
| `logger`        | `object` | Namespaced logger with `info`, `warn`, `error`    |

### Naming convention

```
taxonpages-plugin-<name>              # unscoped
@<vendor>/taxonpages-plugin-<name>    # scoped
```

### Example: Sitemap plugin

A minimal plugin that generates a `sitemap.xml` at build time by wrapping an existing Vite plugin:

```javascript
// src/plugin.js
import Sitemap from 'vite-plugin-sitemap'

export default function ({ configuration }) {
  return {
    name: 'sitemap',

    vite() {
      return {
        plugins: [
          Sitemap({
            hostname: configuration.site_url || 'https://example.com'
          })
        ]
      }
    }
  }
}
```

Once installed, `sitemap.xml` is emitted to the build output alongside the rest of the assets. This pattern — wrapping a third-party Vite plugin behind the `vite()` hook — is the most common shape for build-time plugins.

## Shared dependencies

TaxonPages owns the runtime: it creates the Vue app, the router, the Pinia instance, the i18n
instance and the unhead context, and every panel, module and plugin runs inside them. Those
libraries keep module-scoped state, so two copies loaded side by side break in ways that are
hard to read — `getActivePinia() was called with no active Pinia` from a store that looks
correctly written, `injectHead()` returning nothing, or `Need to install with the app.use`
from a component whose `useI18n()` call is plainly correct.

**Declare them as `peerDependencies`, never as `dependencies`:**

```json
{
  "peerDependencies": {
    "@sfgrp/taxonpages": ">=0.7.0",
    "pinia": "^4.0.0",
    "vue": "^3.5.0"
  },
  "devDependencies": {
    "pinia": "^4.0.0",
    "vue": "^3.5.0"
  }
}
```

Add them to `devDependencies` too, with the same range, so the package still builds and tests
on its own.

**Keep the peer range wide — a caret, never an exact version.** `"pinia": "^4.0.0"` overlaps with
whatever 4.x TaxonPages resolves to, so npm installs one copy that satisfies both. `"pinia":
"4.0.1"` overlaps with nothing else, and npm does not report that as an error: it hoists your
pinned copy to the top of the tree and pushes TaxonPages' own copy into a nested folder. You end
up with two copies anyway, and TaxonPages runs against the version *you* pinned. Use the widest
range the API you depend on allows.

A package that lists `vue`, `vue-router`, `pinia`, `@unhead/vue`, `unhead` or `vue-i18n` under
`dependencies` with a range that conflicts with the one TaxonPages declares makes npm install a
second, nested copy instead of sharing the hoisted one. Declared as a peer dependency with an
overlapping range, npm installs a single copy that satisfies both and the problem never appears.

TaxonPages also passes these packages to Vite's `resolve.dedupe`, so a duplicate that does reach
`node_modules` is collapsed to a single copy when the site is bundled. That keeps sites working,
but it silently runs the offending package against a version it was not built for, so it is a
safety net rather than a fix. Run `taxonpages doctor` to see whether a project is affected: it
reports every duplicated library with the version and path of each copy, and exits non-zero when
it finds one, so it can be used as a check in CI.

## Creating NPM panels

This section explains how to create and publish a TaxonPages panel as an NPM package.

### Package structure

```
taxonpages-panel-inaturalist/
├── package.json
├── src/
│   ├── main.js                   # Entry point (same contract as local panels)
│   ├── PanelINaturalist.vue      # Vue component
│   ├── setup.schema.json         # Optional: panel bind configuration schema
│   └── composables/
│       └── useINaturalist.js     # Optional: composable logic
└── README.md
```

### package.json

The `taxonpages` field in `package.json` is required. It tells TaxonPages what type of package this is and where to find the entry point.

```json
{
  "name": "@vendor/taxonpages-panel-inaturalist",
  "version": "1.0.0",
  "description": "iNaturalist observations panel for TaxonPages",
  "type": "module",
  "main": "./src/main.js",
  "taxonpages": {
    "type": "panel",
    "entry": "./src/main.js"
  },
  "files": ["src/"],
  "peerDependencies": {
    "@sfgrp/taxonpages": ">=0.1.0"
  },
  "keywords": ["taxonpages", "taxonpages-panel"]
}
```

#### The `taxonpages` manifest field

| Field         | Type                                 | Required | Description                                                                                                                                         |
| ------------- | ------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`        | `"panel"`, `"module"`, or `"plugin"` | Yes      | Declares the package type.                                                                                                                          |
| `entry`       | `string`                             | No       | Relative path to the entry file. Defaults to `./src/main.js` for panels, `./src/router/index.js` for modules, `./src/plugin.js` for plugins.        |
| `setupSchema` | `string`                             | No       | Relative path to the setup schema file. Defaults to `./setup.schema.json`. See [Panel bind configuration schema](#panel-bind-configuration-schema). |

> **Security:** TaxonPages only loads packages declared as direct dependencies in the project's root `package.json` (`dependencies`, `devDependencies`, or `optionalDependencies`). Transitive dependencies are ignored even if they declare a `taxonpages` manifest. This prevents a compromised transitive dependency from registering itself as a plugin. If a transitive dependency declares the manifest, a warning is logged so you can investigate.

### Entry point (main.js)

The entry point uses the same contract as local panels:

```javascript
import PanelINaturalist from './PanelINaturalist.vue'

export default {
  id: 'panel:inaturalist',
  component: PanelINaturalist,
  rankGroup: []
}
```

| Field       | Type          | Required | Description                                                                                  |
| ----------- | ------------- | -------- | -------------------------------------------------------------------------------------------- |
| `id`        | `string`      | Yes      | Unique identifier, conventionally `panel:<name>`. Referenced in `taxa_page.yml`.             |
| `component` | Vue component | Yes      | The Vue component to render.                                                                 |
| `rankGroup` | `string[]`    | No       | Restrict to specific taxonomic rank groups. Empty array or omitted means show for all ranks. |

### Panel component

Panel components receive these props from the layout system:

```vue
<script setup>
const props = defineProps({
  otuId: { type: [String, Number], default: null },
  otu: { type: Object, default: null },
  taxonId: { type: [String, Number], default: null },
  taxon: { type: Object, default: null },
  panelKey: { type: String, default: '' },
  bind: { type: Object, default: () => ({}) }
})
</script>
```

### Example panel component

```vue
<template>
  <div>
    <h3>iNaturalist Observations</h3>
    <ul v-if="observations.length">
      <li
        v-for="obs in observations"
        :key="obs.id"
      >
        {{ obs.species_guess }} — {{ obs.observed_on }}
      </li>
    </ul>
    <p v-else-if="loading">Loading...</p>
    <p v-else>No observations found.</p>
  </div>
</template>

<script setup>
import { ref, watchEffect } from 'vue'

const props = defineProps({
  taxon: { type: Object, default: null },
  otu: { type: Object, default: null },
  otuId: { type: [String, Number], default: null },
  taxonId: { type: [String, Number], default: null },
  panelKey: { type: String, default: '' },
  bind: { type: Object, default: () => ({}) }
})

const observations = ref([])
const loading = ref(false)

watchEffect(async () => {
  if (!props.taxon?.name) return
  loading.value = true

  const res = await fetch(
    `https://api.inaturalist.org/v1/observations?taxon_name=${encodeURIComponent(props.taxon.name)}&per_page=10`
  )
  const data = await res.json()
  observations.value = data.results || []
  loading.value = false
})
</script>
```

### Including global components in a panel package

NPM packages can ship auto-registered components. Any `*.global.vue` or `*.client.vue` files inside the package are discovered and registered automatically.

```
taxonpages-panel-inaturalist/
└── src/
    ├── main.js
    ├── PanelINaturalist.vue
    └── components/
        └── ObservationCard.global.vue   # Available as <ObservationCard> everywhere
```

### Panel bind configuration schema

NPM panels can include a `setup.schema.json` file to provide a schema-driven form for per-instance bind configuration in the `taxonpages setup` layout editor. Each placement of the panel in the layout can have its own values, which are stored in the `bind` object under the panel entry in `taxa_page.yml` and passed to the component as props via `v-bind`.

By default, the setup server looks for `setup.schema.json` at the package root. You can specify a custom path using the `setupSchema` field in the `taxonpages` manifest:

```json
{
  "taxonpages": {
    "type": "panel",
    "entry": "./src/main.js",
    "setupSchema": "./src/setup.schema.json"
  }
}
```

The schema file format is the same as for local panels:

```json
{
  "label": "iNaturalist Settings",
  "fields": {
    "per_page": {
      "type": "number",
      "label": "Results Per Page",
      "default": 10
    },
    "show_photos": {
      "type": "boolean",
      "label": "Show Observation Photos",
      "default": true
    },
    "quality_grade": {
      "type": "select",
      "label": "Quality Grade",
      "options": ["any", "research", "needs_id"],
      "default": "any"
    }
  }
}
```

The resulting configuration in `taxa_page.yml`:

```yaml
taxa_page:
  overview:
    panels:
      - - - id: panel:inaturalist
            bind:
              per_page: 10
              show_photos: true
              quality_grade: research
```

The bind values are passed as props to the panel component via `v-bind`, so declare matching props in your component:

```vue
<script setup>
const props = defineProps({
  otuId: { type: [String, Number], default: null },
  otu: { type: Object, default: null },
  taxon: { type: Object, default: null },
  per_page: { type: Number, default: 10 },
  show_photos: { type: Boolean, default: true },
  quality_grade: { type: String, default: 'any' }
})
</script>
```

### Naming convention

The recommended naming pattern is:

```
taxonpages-panel-<name>              # unscoped
@<vendor>/taxonpages-panel-<name>    # scoped
```

This convention is not strictly enforced (packages with other names but a valid `taxonpages` manifest still load), but following it helps with discoverability via `npm search`.

## Creating NPM modules

### Package structure

```
taxonpages-module-bibliography/
├── package.json
├── src/
│   ├── router/
│   │   └── index.js              # Entry point: route definitions
│   ├── views/
│   │   └── Bibliography.vue
│   └── components/
│       └── CitationCard.global.vue
└── README.md
```

### package.json

```json
{
  "name": "@vendor/taxonpages-module-bibliography",
  "version": "1.0.0",
  "description": "Bibliography module for TaxonPages",
  "type": "module",
  "main": "./src/router/index.js",
  "taxonpages": {
    "type": "module",
    "entry": "./src/router/index.js"
  },
  "files": ["src/"],
  "peerDependencies": {
    "@sfgrp/taxonpages": ">=0.1.0"
  },
  "keywords": ["taxonpages", "taxonpages-module"]
}
```

### Router entry point

Same contract as local modules — default-export an array of Vue Router route records:

```javascript
// src/router/index.js
export default [
  {
    name: 'bibliography',
    path: '/bibliography',
    component: () => import('../views/Bibliography.vue')
  }
]
```

Module routes merge automatically into the application router. No YAML configuration is needed.

### Naming convention

```
taxonpages-module-<name>              # unscoped
@<vendor>/taxonpages-module-<name>    # scoped
```

### Custom setup editor for NPM modules

NPM modules can also provide a custom editor component for the setup wizard. Add a `setup.schema.json` file at the module root (or the path specified by `setupSchema` in the manifest) with the `editor` and `component` fields:

```
taxonpages-module-specimens/
├── package.json
├── src/
│   ├── router/
│   │   └── index.js
│   ├── setup/
│   │   └── LayoutEditor.vue        # Custom settings editor
│   └── views/
│       └── Specimens.vue
└── setup.schema.json
```

```json
{
  "file": "specimen_page.yml",
  "label": "Specimen Page",
  "description": "Panel layout for specimen pages",
  "editor": "custom",
  "component": "./src/setup/LayoutEditor.vue",
  "configKey": "specimen_page"
}
```

The component path is relative to the module's root directory. The custom editor component follows the same contract as local modules — it receives configuration props (`section`, `configData`, `setConfigValue`, `saveConfig`, `hasUnsavedChanges`) from the setup wizard. See [Custom editor component](#custom-editor-component) for details.

## Defining global components

TaxonPages provides an auto-import component from `src/components` and `/components` folders using special extensions for it. Some objects and functions are only present in the browser and not in the NodeJs server environment. When you run code that is not supported by the server, it ends up crashing. Some JavaScript libraries like `Leaflet` use the `document` or `window` object, which do not exist in the node environment. To handle this problem, TaxonPages provides 2 ways to import the components.

### Client Side only (CSR)

This auto import method will only load the component on the client side, while on the server it will create a fake empty component, which will be used later on the client side to be replaced by the original one when the hydration process occurs. To define this type of import, the component name must contain the word `.client.` before `.vue` extension.

Example: `MyAmazingComponent.client.vue`

### Global (CSR & SSR)

This auto-import method will load the component both client and server side. To define this type of import, the component must contain the word `.global.` before the `.vue` extension.

Example: `MyAmazingComponent.global.vue`

### From NPM packages

Both `.global.vue` and `.client.vue` files declared inside an NPM panel or module package are auto-registered the same way as local ones — they become usable across the entire application (other panels, modules, markdown pages, custom layouts) without manual imports.

Unlike local projects, where global components must live under a `components/` folder, an NPM package can place `.global.vue` / `.client.vue` files in **any subdirectory** of the package. Discovery is recursive from the package root.

## Internationalization

i18n is part of the core, not a plugin. A site with no `config/i18n.yml` runs
single-locale in English with no locale prefix and no extra JavaScript, so
nothing below is mandatory.

### Translating your own strings

Ship a `locales/<locale>.yml` catalog in your panel, module, or plugin. It is
discovered and merged automatically — there is nothing to register:

```
panels/PanelTest/
├── main.js
├── PanelTest.vue
└── locales/
    ├── en.yml
    └── es.yml
```

Namespace keys by your package id so they cannot collide:

```yaml
# panels/PanelTest/locales/en.yml
panel:
  test:
    title: Test panel
    empty: Nothing to show
```

```vue
<h2>{{ $t('panel.test.title') }}</h2>
```

Use `$t` in templates. In `<script setup>`, get it from `useI18n()`:

```javascript
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
```

Catalogs merge in ascending priority: core, then NPM packages, then local
`panels/` and `modules/`, then the site's own `~/locales/<locale>.yml`. A site
can therefore override any string a package ships by redefining its key —
the same local-wins-over-npm rule that applies to components.

A key missing from the active locale falls back to the fallback locale, then to
the default. **A missing translation never blocks a feature** — ship the English
key and translate later.

### Dates

Do not format dates yourself: a component cannot know the reader's locale, and
a formatter pinned to one is a bug. Keep `Date` objects in your data and render
them with `$d(value, 'long')`.

### Linking across locales

`<RouterLink>` always stays inside the active locale — the locale prefix is the
router's history base, so every link is prefixed for you and no existing link
needs changing. To point *at another* locale (a language switcher), build the
path with `localePath()` and use a plain `<a>`, since crossing locales is a
document navigation, not a route change:

```javascript
import { localePath } from '@/i18n/locale.js'

localePath('/about', 'es', __APP_ENV__) // -> '/es/about'
```

### Translating site content

Two things a site maintainer owns can be translated, both opt-in.

**Config values.** Replace a string with a map of locales. A plain string stays
a plain string, so existing config needs no migration:

```yaml
# config/header.yml
header_links:
  - label: Home                        # untranslated, still fine
    link: /
  - label:
      en: News
      es: Noticias
    link: /news
```

This works for `header_links` labels (including submenus), `header_logo_text`,
`copyright_text`, `project_name`, `metadata` entries, `news_module.announcements`
messages, and in `taxa_page.yml` for tab `label`s and panel `bind` values.

A map is read as a translation only when *every* key is a locale you configured
in `config/i18n.yml`. That is deliberate: `bind: { id: 5 }` must not be mistaken
for a translation into Indonesian.

These values can also be edited from `taxonpages setup`, which shows one input
per locale and reports how many are filled. A field belonging to your own
module or panel needs `"translatable": true` in its `setup.schema.json` to be
offered there — see [Translatable fields](#translatable-fields).

`project_citation` and `project_authors` are **not** localized — they are how
the site is cited in the literature.

**Pages.** Add a sibling file with the locale in its name:

```
pages/
├── about.md         # default locale
├── about.es.md      # Spanish
└── grants.md        # no translation — /es/grants serves this
```

The suffix is opt-in per page and the fallback is simply the absence of a file:
nothing to configure, nothing to keep in sync.

The extension does not have to match: `home.vue` is translated by `home.es.md`
just as well, which is usually what you want — a translator writes markdown, not
a component. A translated file whose base page does not exist (a typo, or a page
since renamed) is reported at startup rather than silently ignored.

### What is not translated

Scientific names, authorships, and citations are nomenclature: they are
language-independent by rule and must never be run through `t()`. The same goes
for slugs and URLs — a taxon page is `/es/otus/761985`, never a translated
slug. Its identity is the id.

### Common names

Common names are the one piece of remote data that is genuinely multilingual:
TaxonWorks tags each with a language. Names in the reader's language are shown
first; the rest stay visible, with the language as a tooltip.

Note the API reports the language as an ISO 639-2 *English name* — `"English"`,
`"Japanese"`, `"Spanish; Castilian"` — or `null`, never a code.
`src/i18n/languageTags.js` maps those to BCP-47 tags for the languages that have
an ISO 639-1 code, which are the ones a site can configure as a locale. A
language outside that list is not an error: its name still labels the value, it
simply never matches a locale. Add entries there if you need more.

### Adding a locale

List it in `config/i18n.yml` and add `<locale>.yml` catalogs. Routes for the new
prefix appear on their own; anything untranslated falls back. A locale that is
10% translated is useful on day one.

`taxonpages setup` has a **Languages** section that writes this file: it picks
locales, sets which one is served on unprefixed URLs, and warns before removing
a locale by listing the config values, pages, and catalogs that would stop being
shown. Removing a locale never deletes any of them — adding it back restores
everything.

A site with no `config/i18n.yml` is single-locale and pays nothing for i18n, so
the section offers to remove the file rather than leaving a defaulted one
behind.

Alongside it, a **Translations** section lists every translatable value across
all config files with its status in each language, filterable to what one
language is still missing. It appears only once a site has more than one
locale.

It finds values two ways, and the difference is visible in what it can tell
you. Fields a schema marks `translatable` are listed whether or not they have
been translated, so they can be reported as missing. Everything else is found
by looking for values that already *are* locale maps — which is how
`taxa_page.yml` tab labels and panel `bind` values appear, since a custom
editor declares no fields. The consequence is that a tab label that has never
been translated cannot be listed as missing: nothing declares it ahead of time.
