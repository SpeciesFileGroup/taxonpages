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

Shared setup UI components like `PanelConfigEditor` are available via Vue's `inject`:

```javascript
import { inject } from 'vue'

const PanelConfigEditor = inject('tp:PanelConfigEditor')
```

The Tailwind CSS utility classes used in the setup wizard are available in custom editor components.

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
taxonpages package add @vendor/taxonpages-plugin-react
```

Or install manually:

```bash
npm install @vendor/taxonpages-plugin-react
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
    - '@vendor/taxonpages-plugin-react'
```

### Creating a plugin

A plugin is an NPM package with `"type": "plugin"` in the `taxonpages` manifest:

```json
{
  "name": "@vendor/taxonpages-plugin-react",
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

Plugins that need to extend the Vue app (e.g., register a Vue plugin like i18n) should provide a `vueSetup.js` file in the plugin directory:

```
taxonpages-plugin-i18n/
├── package.json
└── src/
    ├── plugin.js       # Plugin factory (vite hook, etc.)
    └── vueSetup.js     # Vue app setup (auto-discovered)
```

```javascript
// src/vueSetup.js — note: this file is NOT inside the plugin.js factory
import { createI18n } from 'vue-i18n'

export default function (app, { router, store }) {
  const i18n = createI18n({
    /* ... */
  })
  app.use(i18n)
}
```

The `vueSetup.js` file is discovered automatically if it exists in the plugin's root directory. It exports a default function that receives the Vue app instance and `{ router, store }`.

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

### Example: React support plugin

A minimal plugin that adds React/JSX compilation support:

```javascript
// src/plugin.js
import react from '@vitejs/plugin-react'

export default function ({ configuration }) {
  return {
    name: 'react',

    vite() {
      return {
        plugins: [react()],
        optimizeDeps: {
          include: ['react', 'react-dom']
        }
      }
    }
  }
}
```

Once installed, `.jsx` and `.tsx` files compile anywhere in the project. React-based panels would use a Vue wrapper component to mount a React root inside the existing panel system.

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
