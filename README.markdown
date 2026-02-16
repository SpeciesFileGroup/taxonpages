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

| Command                          | npm script          | Description                                        |
| -------------------------------- | ------------------- | -------------------------------------------------- |
| `taxonpages init [directory]`    | —                   | Scaffold a new TaxonPages project                  |
| `taxonpages dev`                 | `npm run dev`       | Start development server (SPA mode, port 5173)     |
| `taxonpages dev:ssr`             | `npm run dev:ssr`   | Start SSR development server (port 6173)           |
| `taxonpages build`               | `npm run build`     | Build for production (SPA mode)                    |
| `taxonpages build:ssr`           | `npm run build:ssr` | Build for production (SSR mode)                    |
| `taxonpages serve`               | `npm run serve`     | Start production SSR server (port 6173)            |
| `taxonpages preview`             | `npm run preview`   | Preview production build locally (port 4173)       |
| `taxonpages package list`        | —                   | List all discovered panels and modules             |
| `taxonpages package add <name>`  | —                   | Install a TaxonPages package and auto-configure it |
| `taxonpages package remove <name>` | —                 | Uninstall a package and clean up config            |

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

If you want to change the color palette, you can edit `/config/style/theme.css` file, colors must be in RGB format.
TaxonPages use [TailwindCSS](https://tailwindcss.com/docs/configuration) framework for the style. We already provide default settings for colors and markdown. If you want to make any change to your configuration, you must do so in the `config/vendor/tailwind.config.js` file. This file uses the TaxonPages configuration as a default. It is possible to overwrite it as long as you use it as a preset.

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

This file is used to load your panel component in taxa page. Use the `id` to include and define the position in the layout in `taxa_page.yml`

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

### Overriding an NPM panel locally

To customize a panel installed from NPM, create a local panel folder with the same base name. For example, if the NPM package is `@vendor/taxonpages-panel-foo`, create `panels/foo/main.js`. The local version takes priority.

## Creating NPM panels (for developers)

This section explains how to create and publish a TaxonPages panel as an NPM package.

### Package structure

```
taxonpages-panel-inaturalist/
├── package.json
├── src/
│   ├── main.js                   # Entry point (same contract as local panels)
│   ├── PanelINaturalist.vue      # Vue component
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

| Field   | Type                    | Required | Description                                                                                                   |
| ------- | ----------------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| `type`  | `"panel"` or `"module"` | Yes      | Declares the package type.                                                                                    |
| `entry` | `string`                | No       | Relative path to the entry file. Defaults to `./src/main.js` for panels, `./src/router/index.js` for modules. |

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
