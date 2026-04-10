# User Guide

This guide covers everything a site operator needs to configure, customize, and run a TaxonPages instance. For creating your own panels, modules, or plugins, see the [Developer Guide](developer-guide.md).

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

TaxonPages global components are enable in your markdown pages, by default we provide a set of global components that you don't need to import them to use it. You can see the list of this global components in [Global components reference](#global-components-reference).

## Style

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

## Installing panels and modules from NPM

In addition to local `panels/` and `modules/` folders, TaxonPages can discover panels and modules installed as NPM packages. This allows the community to publish and share reusable extensions.

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

### Checking for updates

Use `package outdated` to query the npm registry and see which installed TaxonPages packages have a newer version available:

```bash
taxonpages package outdated
```

Example output:

```
  TaxonPages — Package updates

  PACKAGE                          TYPE      INSTALLED   LATEST      STATUS
  @vendor/taxonpages-panel-inat    panel     1.0.0       1.2.0       Update available
  @vendor/taxonpages-module-bib    module    2.1.0       2.1.0       Up to date

  1 update available.
```

### Updating a package

To update an individual package to its latest version, use `npm install` directly:

```bash
npm install @vendor/taxonpages-panel-inaturalist@latest
```

This preserves the package's entry in `config/taxa_page.yml` and leaves any bind configuration untouched. Restart the dev server after updating.

### Updating TaxonPages

To update the TaxonPages framework itself to the latest release:

```bash
taxonpages update
```

This checks the npm registry for a newer version of `@sfgrp/taxonpages` and installs it in the current project.

### Disabling a package

Add the package name to a `disabled` list in any `config/*.yml` file:

```yaml
packages:
  disabled:
    - '@vendor/taxonpages-panel-inaturalist'
```

## Global components reference

TaxonPages provides a set of global components that could be used in your markdown pages, custom layouts, and panels without importing them. Here is the complete list:

| Component             | Description                                    | Props                                                                                                                    |
| --------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `<AnimationOpacity/>` | Add an opacity animation for a child component |                                                                                                                          |
| `<Autocomplete/>`     | Used to perform searches in TaxonWorks         | [Link](https://github.com/SpeciesFileGroup/taxonpages/blob/main/src/components/Autocomplete/Autocomplete.global.vue#L42) |
| `<AutocompleteOtu/>`  | A specific autocomplete for OTU search         |                                                                                                                          |
| `<ClientOnly/>`       | Render child components only from client side  |                                                                                                                          |
| `<VButton/>`          | Button component                               |                                                                                                                          |
| `<VCard/>`            | Card component style                           |                                                                                                                          |
| `<VCardContent/>`     | Card content body                               |                                                                                                                          |
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

### Icons

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
