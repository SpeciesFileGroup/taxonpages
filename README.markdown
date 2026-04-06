# TaxonPages

TaxonPages is a tool to serve taxon pages. At present it draws data from TaxonWorks' API, however we seek to keep the TaxonPages platform agnostic therefor facilitating the modular addition of functionality that may reference data from any biodiversity data-serving API.

## Status Warning

TaxonPages software is in active development and changes are expected that will cause the early first-adopters' instances to require rebuilding by refreshing one's forked branch using `git pull`. A first _stable version_ is expected by Spring 2023.

## Usage

1. Click on "Fork" button to create your own repository from this.
2. Uncheck `Copy the setup branch only` and press `Save`
3. After create your repo, go to `Settings > Pages`, on "Build and deployment - Source" select `GitHub Actions`.
4. Go to `Actions` tab and press `I understand my workflows, go ahead and enable them` button
5. Open `router.yml` file and change `base_url` to the name of your repository.
6. After a couple of minutes, your public page should be available at `https://<your_user_name>.github.io/<your_repo_name>`

### Setup

1. Switch to `setup` branch in your TaxonPages repository.
2. We provide some settings by default to setup your public pages, but API parameters are required and must be configured to get the data from your TaxonWorks project.

```yaml
# config/api.yml
---
url: https://<your.taxonworks.server>/api/v1
project_token: yourprojecttoken
```

3. Push the changes after update the configuration files inside `setup` branch
4. GitHub actions will build TaxonPages with the current configuration in `setup` branch and publish it to the `gh-pages` branch

# Install

Follow this steps to run TaxonPages in your local machine.

1. Install [NodeJS](https://nodejs.org/en/download/)
2. We recommend you to fork this repository to keep getting updates. Use [GIT](https://git-scm.com/) to clone the repo.

```
git clone https://github.com/<your_username>/<your_repository_name>.git
```

But if you don't want to fork it, you can clone directly from this

```
git clone https://github.com/SpeciesFileGroup/taxonpages.git
```

3. Go to `taxonpages` folder and enter the following commands to copy the software to your `setup` branch

```
git checkout main
git checkout setup
git checkout main .
git reset
git checkout .
```

5. Setup `config/api.yml` with the API server configuration

6. Install node dependencies

```
npm install
```

## Start TaxonPages

```
npm run dev
```

TaxonPages will be running at http://localhost:5173/

# NPM Installation (CLI)

As an alternative to cloning the repository, you can use the TaxonPages CLI to scaffold and manage your project.

### Requirements

- [Node.js](https://nodejs.org/en/download/) >= 18.0.0

### Quick start

Create a new project using `npx` (no global install needed):

```
npx @sfgrp/taxonpages init my-project
cd my-project
npm install
```

Edit `config/api.yml` with your TaxonWorks API URL and project token, then start the development server:

```
npm run dev
```

Your site will be running at http://localhost:5173/

### Global installation

If you prefer to have the CLI available globally:

```
npm install -g @sfgrp/taxonpages
```

Then you can use it directly:

```
taxonpages init my-project
```

### CLI Commands

All commands are available through `npm run` scripts in your project or directly via the `taxonpages` CLI:

| Command                            | npm script          | Description                                        |
| ---------------------------------- | ------------------- | -------------------------------------------------- |
| `taxonpages init [directory]`      | —                   | Scaffold a new TaxonPages project                  |
| `taxonpages dev`                   | `npm run dev`       | Start development server (SPA mode, port 5173)     |
| `taxonpages dev:ssr`               | `npm run dev:ssr`   | Start SSR development server (port 6173)           |
| `taxonpages build`                 | `npm run build`     | Build for production (SPA mode)                    |
| `taxonpages build:ssr`             | `npm run build:ssr` | Build for production (SSR mode)                    |
| `taxonpages serve`                 | `npm run serve`     | Start production SSR server (port 6173)            |
| `taxonpages preview`               | `npm run preview`   | Preview production build locally (port 4173)       |
| `taxonpages package list`          | —                   | List all discovered plugins, panels, and modules   |
| `taxonpages package add <name>`    | —                   | Install a TaxonPages package and auto-configure it |
| `taxonpages package remove <name>` | —                   | Uninstall a package and clean up config            |
| `taxonpages package unpack <name>` | —                   | Unpack an NPM package into a local directory       |
| `taxonpages setup`                 | —                   | Start the web-based configuration interface        |

### Example workflow

```
npx @sfgrp/taxonpages init my-project
cd my-project
npm install
# Edit config/api.yml with your API settings
npm run dev
```

# Customization

## Pages

TaxonPages out of the box support markdown and vue for content sites. Add your content pages inside `pages` folder. By default, TaxonPages use the file name to create the route.
For example, if the filename is "contributors.md" the route to access it will be http://yourtaxonpagessite/contributors

### Markdown pages

This software use [vite-plugin-md](https://github.com/antfu/vite-plugin-md) to render pages in Markdown format, the engine of this plugin is [markdown-it](https://github.com/markdown-it/markdown-it). For plugins and other configuration you can refer to this section https://github.com/antfu/vite-plugin-md#configuration--options

Example: `welcome.md` file

```
---
name: 'Charles Darwin'
---

# Welcome, {{ name }}!
```

To use TaxonPage internal variables in `config/*.yml`, you can either do so by adding the prefix {{ app:var_name }} or use the script tag in your markdown page and get them from the global object `__APP_ENV__`

#### Prefix

```markdown
# Welcome to {{ app:project_name }}!
```

#### Script tag

```javascript
# Welcome to {{ project_name }}!

<script setup>
const { project_name } = __APP_ENV__
</script>
```

#### Components

TaxonPages global components are enable in your markdown pages, by default we provide a set of global components that you don't need to import them to use it. You can see the list of this global components [here](#global-components)

### Style

If you want to change the color palette, you can edit `/config/style/theme.css` file. Colors use CSS custom properties with the `--tp-` prefix and support any valid CSS color format (`rgb()`, `hsl()`, `oklch()`, hex, etc.):

```css
:root {
  --tp-primary: #047857;
  --tp-secondary: rgb(3, 105, 161);
}

.dark {
  --tp-primary: #171717;
  --tp-secondary: hsl(199, 89%, 48%);
}
```

TaxonPages uses [Tailwind CSS v4](https://tailwindcss.com/docs) for styling. The default theme configuration is defined in CSS using `@theme` directives. If you want to customize the Tailwind configuration (e.g., override theme values or add typography styles), create a `config/vendor/tailwind.css` file. This file imports the base TaxonPages theme and lets you add overrides:

```css
@import '@/assets/css/tailwind.css';

/* Override theme colors */
@theme {
  --color-primary-color: rgb(25, 100, 200);
}

/* Customize typography prose styles */
.prose p {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  line-height: 1.5;
}
```

## Analytics

TaxonPages has out-of-the-box support for the following list of analytics services:

```yaml
analytics_services:
  enableDev: false # Set true to work in development mode
  analytics:   # Google Analytics
    - id: 'G-XXXXX'
  gtm:         # Google Tag Manager
    - id: 'GTM-XXXXX'
  pixel:       # Facebook Pixel
    - id: 'XXXXXXX'
  retargeting: # VK Retargeting
    - id: 'VK-RTRG-XXXXXX-XXXXX',
  linkedin:    # Linkedin Insight
    - id: 'XXXXXXX'
  tongji:      # Baidu Tongji
    - id: 'XXXXXXX',
  metrica:     # Yendex Metrica
    - id: 'XXXXXXX',
  microsoft:   # Microsoft Analytics
    id: 'XXXXXXX'
  hotjar:      # Hotjar Analytics
    id: 'XXXXXXX',
  fullStory:   # Full story Analytics
    org: 'X-XXXXXX-XXX'
  tiktok:      # TikTok Pixel Analytics
    id: 'XXXXXXX'
```

# Deep dive into TaxonPages

## Access internal configuration vars

To access the configuration in \*.yml files, we provide a global object that contains all the configuration values. This variable can be used in either JavaScript, Vue, or Markdown files. To access these values you must use the `__APP_ENV__` variable:

```javascript
const { project_name } = __APP_ENV__
// or
const projectName = __APP_ENV__.project_name
```

## Taxa Page

### Layout

To modify the position of the panels in the layout of the Taxa page, edit the `taxa_page.yml` file. There you can add/move/remove panels from the layout, also you can add new tabs and include new panels there. If you want to make some tabs visible or not depending the rank group, you can include `rankGroup`

```yaml
taxa_page:
  overview:
    panels:
      - - - panel:gallery
          - panel:type
          - panel:type-specimen
          - panel:nomenclature
          - panel:nomenclature-references

        - - panel:map
          - panel:descendants
          - panel:content
          - panel:statistics
#
# An example of a new tab:
#
# type_specimens:
#   rank_group: ['SpeciesGroup']
#   panels:
#     - - - panel:specimen-records
```

### Lifecycle hooks (Experimental feature)

The `onCreatePage` and `onSSRPageCreate` functions allow you to execute code at the time the taxa page is created. `onSSRPageCreate` will be executed only on the server side in SSR mode. To make use of them it is necessary to include them in a file object called `pages/otus.config.js`. Both functions accept `otu`, `taxon`, `route` and `router` objects as parameters. Since `onCreatePage` runs on Taxa page component, it is possible to use hooks like `onMounted` or `onBeforeMount` inside it

```javascript
export default {
  onSSRCreatePage: async ({ otu, taxon, route, router }) => {
    // Your code here
  },

  onCreatePage: ({ otu, taxon, route, router }) => {
    // Your code here
  }
}
```

### Customizing the Layout

The application comes with a default layout that includes a header and a footer. If you'd like to replace this layout with your own, you can do so by creating a custom layout file.

Steps to replace the default layout

1. In the root folder of your project, create a new folder called `layouts` (if it doesn't already exist).
2. Inside this folder, create a file named default.vue.
3. Define your custom layout structure inside this file as needed.

Example of layouts/default.vue

```vuejs
<template>
  <div>
    <slot />
  </div>
</template>
```

This custom layout will replace the default one and be applied throughout the application. You can include your own elements, such as a navigation bar or footer, as needed.

#### Using Multiple Layouts

In addition to replacing the default layout, you can create multiple layouts by adding more .vue files inside the layout folder. You can then specify which layout to use for a specific page by setting the layout name in the meta property of the `<route>` tag in your Single File Component (SFC).

JSON5:

```js
<route>
{
  meta: {
    layout: 'custom'
  }
}
</route>
```

YAML:

```yaml
<route lang="yaml">
meta:
  layout: custom
</route>
```

### External panels

To add panels in Taxa pages, create a folder called `panels` in your `setup` branch, and inside it create another folder for your panel. For example: `panels/PanelTest`

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

#### Panel configuration schema

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

The field types are the same used in the setup UI: `string`, `number`, `boolean`, `select`, `array`, and `object`.

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

Panels without a `setup.schema.json` still use the raw JSON bind editor as before

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

### External modules

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
      `https://xeno-canto.org/api/3/recordings?${params}`
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
const response = await fetch(
  `/api/xeno-canto/recordings?${new URLSearchParams({ query: name })}`
)
const data = await response.json()
```

### Hot reload

In development mode (`dev:ssr`), route files are watched for changes and reloaded automatically without restarting the server.

## NPM panels and modules

In addition to local `panels/` and `modules/` folders, TaxonPages can discover panels and modules installed as NPM packages. This allows the community to publish and share reusable extensions.

### Package sources and priority

Panels and modules can come from three sources. When a name conflict occurs, the higher-priority source wins:

| Priority    | Source        | Location                                     |
| ----------- | ------------- | -------------------------------------------- |
| 1 (highest) | Local folders | `panels/*` and `modules/*` in your project   |
| 2           | NPM packages  | `node_modules/` with a `taxonpages` manifest |
| 3 (lowest)  | Core          | Built into `@sfgrp/taxonpages`               |

If you have a local panel with the same base name as an NPM package, the local version takes precedence and a warning is logged at startup.

### Installing an NPM panel

The easiest way is to use the `package add` command, which installs the package and adds its panel ID to `config/taxa_page.yml` automatically:

```bash
taxonpages package add @vendor/taxonpages-panel-inaturalist
```

If `config/taxa_page.yml` does not exist yet, the command will prompt you to create it from the default template.

You can also install manually with `npm install` and reference the panel ID in `config/taxa_page.yml` yourself:

```bash
npm install @vendor/taxonpages-panel-inaturalist
```

```yaml
taxa_page:
  overview:
    panels:
      - - - panel:gallery
          - panel:inaturalist
          - panel:map
```

Restart the dev server. The panel appears in the layout.

### Installing an NPM module

```bash
taxonpages package add @vendor/taxonpages-module-bibliography
```

Module routes register automatically — no YAML configuration needed. Restart the dev server and the new routes are available.

### Removing an NPM package

```bash
taxonpages package remove @vendor/taxonpages-panel-inaturalist
```

This uninstalls the NPM package and removes all references to its panel ID from `config/taxa_page.yml`.

### Listing installed packages

Use the `package list` command to see all discovered panels and modules:

```bash
taxonpages package list
```

Example output:

```
  TaxonPages — Installed packages

  PANELS
  ├─ PanelScrutiny                  (local) ~/panels/PanelScrutiny
  ├─ PaneliNaturalist               (npm)   @vendor/taxonpages-panel-inaturalist@1.0.0

  MODULES
  ├─ bibliography                   (npm)   @vendor/taxonpages-module-bibliography@2.1.0

  2 npm, 1 local
```

### Disabling a package

Add the package name to a `disabled` list in any `config/*.yml` file:

```yaml
packages:
  disabled:
    - '@vendor/taxonpages-panel-inaturalist'
```

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

### When to use a plugin vs a panel/module

| Extension type | Use when you want to...                            |
| -------------- | -------------------------------------------------- |
| Panel          | Add a UI panel to taxon pages                      |
| Module         | Add new routes/pages                               |
| Plugin         | Modify the build pipeline, server, Vue app, or CLI |

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

### Creating a plugin (for developers)

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

## Creating NPM panels (for developers)

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

| Field         | Type                                 | Required | Description                                                                                                                                                            |
| ------------- | ------------------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`        | `"panel"`, `"module"`, or `"plugin"` | Yes      | Declares the package type.                                                                                                                                             |
| `entry`       | `string`                             | No       | Relative path to the entry file. Defaults to `./src/main.js` for panels, `./src/router/index.js` for modules, `./src/plugin.js` for plugins.                           |
| `schema`      | `object`                             | No       | Configuration schema for the `taxonpages setup` UI. See [Package configuration schema](#package-configuration-schema).                                                 |
| `setupSchema` | `string`                             | No       | Relative path to the panel bind configuration schema file. Defaults to `./setup.schema.json`. See [Panel bind configuration schema](#panel-bind-configuration-schema). |

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

NPM panels can include a `setup.schema.json` file to provide a schema-driven form for per-instance bind configuration in the `taxonpages setup` layout editor. This is different from the [Package configuration schema](#package-configuration-schema), which stores global settings in separate YAML files accessible via `__APP_ENV__`.

| Feature     | `setup.schema.json` (bind config)                                     | `taxonpages.schema` (package config)      |
| ----------- | --------------------------------------------------------------------- | ----------------------------------------- |
| **Scope**   | Per-instance (each placement in the layout can have different values) | Global (shared across the entire project) |
| **Storage** | `bind` object in `taxa_page.yml`                                      | Separate YAML file in `config/`           |
| **Access**  | Via component props (`v-bind`)                                        | Via `__APP_ENV__` global                  |
| **UI**      | Config button in the layout editor                                    | Dedicated section in the setup sidebar    |

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

## Creating NPM modules (for developers)

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

## Package configuration schema

NPM packages can define a configuration schema so their settings appear in the `taxonpages setup` web interface. The schema is declared in the `taxonpages.schema` field of `package.json`.

When a package includes a schema, the setup UI automatically renders a form for its settings under the appropriate group (Modules for modules, Shared Components for panels with shared config).

### Schema structure

The schema describes which YAML config file to write to, a human-readable label, and the fields the user can configure:

```json
{
  "taxonpages": {
    "type": "panel",
    "entry": "./src/main.js",
    "schema": {
      "file": "inaturalist.yml",
      "label": "iNaturalist",
      "description": "iNaturalist panel settings",
      "fields": {
        "per_page": {
          "type": "number",
          "label": "Results Per Page",
          "default": 10
        },
        "show_photos": {
          "type": "boolean",
          "label": "Show Photos",
          "default": true
        }
      }
    }
  }
}
```

The configuration values are stored in `config/<file>` (e.g. `config/inaturalist.yml`) and are accessible at runtime via the `__APP_ENV__` global object.

### Schema properties

| Property      | Type     | Required | Description                                          |
| ------------- | -------- | -------- | ---------------------------------------------------- |
| `file`        | `string` | Yes      | YAML filename in `config/` where settings are stored |
| `label`       | `string` | Yes      | Display name shown in the setup UI sidebar           |
| `description` | `string` | No       | Short description shown below the section heading    |
| `fields`      | `object` | Yes      | Map of config keys to field definitions              |

### Field types

Each field in `fields` is keyed by the YAML property name and describes how it should be rendered:

| Property      | Type       | Description                                                        |
| ------------- | ---------- | ------------------------------------------------------------------ |
| `type`        | `string`   | One of: `string`, `number`, `boolean`, `select`, `array`, `object` |
| `label`       | `string`   | Display label for the field                                        |
| `description` | `string`   | Help text shown below the label                                    |
| `placeholder` | `string`   | Placeholder text for string/number inputs                          |
| `default`     | `any`      | Default value                                                      |
| `required`    | `boolean`  | Whether the field is required                                      |
| `options`     | `string[]` | Options list (only for `select` type)                              |
| `items`       | `object`   | Item definition (only for `array` type)                            |
| `fields`      | `object`   | Nested field definitions (only for `object` type)                  |

### Array fields

For arrays of simple values, `items` should specify the value type:

```json
{
  "blocked_taxa": {
    "type": "array",
    "label": "Blocked Taxa IDs",
    "items": { "type": "number" }
  }
}
```

For arrays of objects, `items` should contain field definitions for each property:

```json
{
  "data_sources": {
    "type": "array",
    "label": "Data Sources",
    "items": {
      "name": { "type": "string", "label": "Name" },
      "url": { "type": "string", "label": "API URL" },
      "enabled": { "type": "boolean", "label": "Enabled" }
    }
  }
}
```

### Object fields

Use `object` type with nested `fields` for grouped settings:

```json
{
  "display": {
    "type": "object",
    "label": "Display Options",
    "fields": {
      "theme": {
        "type": "select",
        "label": "Theme",
        "options": ["light", "dark", "auto"],
        "default": "light"
      },
      "max_items": {
        "type": "number",
        "label": "Max Items",
        "default": 20
      }
    }
  }
}
```

### Complete example: panel with schema

```json
{
  "name": "@vendor/taxonpages-panel-inaturalist",
  "version": "1.0.0",
  "taxonpages": {
    "type": "panel",
    "entry": "./src/main.js",
    "schema": {
      "file": "inaturalist.yml",
      "label": "iNaturalist",
      "description": "Configure the iNaturalist observations panel",
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
        "place_id": {
          "type": "string",
          "label": "Place ID",
          "description": "iNaturalist place ID to filter observations",
          "placeholder": "e.g. 1234"
        },
        "quality_grade": {
          "type": "select",
          "label": "Quality Grade",
          "options": ["any", "research", "needs_id"],
          "default": "any"
        }
      }
    }
  }
}
```

This would generate a `config/inaturalist.yml` file:

```yaml
per_page: 10
show_photos: true
place_id: '1234'
quality_grade: research
```

And the values are accessible in the panel component:

```javascript
const { per_page, show_photos } = __APP_ENV__
```

### Complete example: module with schema

```json
{
  "name": "@vendor/taxonpages-module-bibliography",
  "version": "1.0.0",
  "taxonpages": {
    "type": "module",
    "entry": "./src/router/index.js",
    "schema": {
      "file": "bibliography.yml",
      "label": "Bibliography",
      "description": "Bibliography module settings",
      "fields": {
        "bibliography": {
          "type": "object",
          "label": "Bibliography Settings",
          "fields": {
            "items_per_page": {
              "type": "number",
              "label": "Items Per Page",
              "default": 25
            },
            "show_abstract": {
              "type": "boolean",
              "label": "Show Abstract",
              "default": false
            },
            "citation_style": {
              "type": "select",
              "label": "Citation Style",
              "options": ["apa", "chicago", "mla"],
              "default": "apa"
            }
          }
        }
      }
    }
  }
}
```

## Defining global components

TaxonPages provides an auto-import component from `src/components` and `/components` folders using special extensions for it. Some objects and functions are only present in the browser and not in the NodeJs server environment. When you run code that is not supported by the server, it ends up crashing. Some JavaScript libraries like `Leaflet` use the `document` or `window` object, which do not exist in the node environment. To handle this problem, TaxonPages provides 2 ways to import the components.

### Client Side only (CSR):

This auto import method will only load the component on the client side, while on the server it will create a fake empty component, which will be used later on the client side to be replaced by the original one when the hydration process occurs. To define this type of import, the component name must contain the word `.client.` before `.vue` extension.

Example: `MyAmazingComponent.client.vue`

### Global (CSR & SSR)

This auto-import method will load the component both client and server side. To define this type of import, the component must contain the word `.client.` before the `.vue` extension.

Example: `MyAmazingComponent.global.vue`

### Global components

TaxonPages provides a set of global components that could be used to create your own panels or pages. Here is the complete list:

| Component             | Description                                    | Props                                                                                                                    |
| --------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `<AnimationOpacity/>` | Add an opacity animation for a child component |                                                                                                                          |
| `<Autocomplete/>`     | Used to perform searches in TaxonWorks         | [Link](https://github.com/SpeciesFileGroup/taxonpages/blob/main/src/components/Autocomplete/Autocomplete.global.vue#L42) |
| `<AutocompleteOtu/>`  | A specific autocomplete for OTU search         |                                                                                                                          |
| `<ClientOnly/>`       | Render child components only from client side  |                                                                                                                          |
| `<VButton/>`          | Button component                               |                                                                                                                          |
| `<VCard/>`            | Card component style                           |                                                                                                                          |
| `<VCardContent/>`     | Card content body                              |                                                                                                                          |
| `<VCardHeader/>`      | Card Header                                    |                                                                                                                          |
| `<VClipboard/>`       | Copy a text to clipboard                       |                                                                                                                          |
| `<Dropdown/>`         | Dropdown menu                                  |                                                                                                                          |
| `<GalleryImage/>`     |                                                | [Link](https://github.com/SpeciesFileGroup/taxonpages/blob/main/src/components/Gallery/GalleryImage.global.vue#L40)      |
| `<ImageViewer/>`      |                                                |                                                                                                                          |
| `<TrackerReport/>`    | Show trackers to report issues                 | [Link](https://github.com/SpeciesFileGroup/taxonpages/blob/main/src/components/TrackerReport.global.vue#L47)             |
| `<TabMenu/>`          |                                                |                                                                                                                          |
| `<TabItem/>`          |                                                |                                                                                                                          |
| `<VMap/>`             | Interactive map that use Leaflet library       |                                                                                                                          |
| `<VModal/>`           | Create lightboxes                              |                                                                                                                          |
| `<VSkeleton/>`        | Content loading placeholder                    |                                                                                                                          |
| `<VSpinner/>`         | Loading spinner                                |                                                                                                                          |
| `<VTable/>`           |                                                |                                                                                                                          |
| `<VTableBody/>`       |                                                |                                                                                                                          |
| `<VTableBodyCell/>`   |                                                |                                                                                                                          |
| `<VTableBodyRow/>`    |                                                |                                                                                                                          |
| `<VTableHeader/>`     |                                                |                                                                                                                          |
| `<VTableHeaderCell/>` |                                                |                                                                                                                          |
| `<VTableHeaderRow/>`  |                                                |                                                                                                                          |

| Icons                |
| -------------------- |
| `<IconArrowDown/>`   |
| `<IconArrowLeft/>`   |
| `<IconArrowRight/>`  |
| `<IconCheck/>`       |
| `<IconClipboard/>`   |
| `<IconClose/>`       |
| `<IconDocument/>`    |
| `<IconDownload/>`    |
| `<IconHamburger/>`   |
| `<IconJson/>`        |
| `<IconMinusCircle/>` |
| `<IconPlusCircle/>`  |
| `<IconSearch/>`      |
| `<IconTrash/>`       |
| `<IconWarning/>`     |
