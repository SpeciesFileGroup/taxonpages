# User Guide

> Documents `@sfgrp/taxonpages` **v0.5.4**. Component names, props, and configuration keys may differ on other versions, check the version installed in your project with `npm ls @sfgrp/taxonpages`.

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

### Fonts

The default typeface is [Inter](https://fonts.google.com/specimen/Inter), loaded from Google Fonts. To use a different one, create a `config/vendor/fonts.css` file. It **replaces** the built-in font stylesheet, so Inter is no longer requested at all:

```css
@import url('https://fonts.googleapis.com/css2?family=Lora:wght@400..700&display=swap');

:root {
  --tp-font-main: 'Lora', Georgia, serif;
}
```

Both parts matter: the `@import` (or an `@font-face` rule, if you self-host the files in `public/`) loads the typeface, and `--tp-font-main` tells the theme to use it. Keep the `@import` as the first line — CSS requires `@import` rules to precede every other rule, and a misplaced one is silently dropped.

To use a font that is already available (a system font, or one you load elsewhere) you can set `--tp-font-main` in `config/style/theme.css` instead, alongside the colors, and skip this file entirely.

### Favicon

Favicons are picked up by convention — there is nothing to configure. Drop any of these files into your project's `public/` folder and they are linked from the document head:

| File                    | Used for                                    |
| ----------------------- | ------------------------------------------- |
| `favicon.svg`           | Modern browsers, scales to any size         |
| `favicon.ico`           | Fallback for older browsers                 |
| `apple-touch-icon.png`  | iOS home screen shortcuts (180×180 px)      |

You can ship more than one: browsers pick the format they support. Providing both `favicon.svg` and `favicon.ico` covers everything.

The `<link>` tags are generated with your `base_url` applied, which matters when the site is deployed under a sub-path — a browser looking for a favicon on its own always asks for `/favicon.ico` at the domain root and would miss it.

If you need an icon from a different location, such as a CDN, add your own `index.html` at the project root with the `<link>` tags you want; TaxonPages uses it in place of the built-in one.

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

To modify the position of the panels in the layout of the Taxa page, edit the `taxa_page.yml` file. There you can add/move/remove panels from the layout, also you can add new tabs and include new panels there. If you want to make some tabs visible or not depending the rank group, you can include `rank_group`

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

TaxonPages registers a set of components globally, so you can use them in any markdown page, custom layout, panel, or module without importing them. Every `.vue` file matching `src/components/**/*.global.vue` in the core, plus the same pattern under your project's `components/` and `modules/*/components/` folders, is auto-registered using the filename (minus the `.global` suffix) as the tag name.

**Local overrides.** If you create a component file in your project with the same name as a core component (for example `components/VButton.global.vue`), it replaces the core one application-wide. This is the recommended way to customize a built-in component's look without forking TaxonPages.

**SSR.** Components with the `.client.vue` suffix (currently `<VMap/>`) are registered only on the client and rendered as async components, so they will not appear in the server-rendered HTML. Wrap them in `<ClientOnly/>` if you also need to render placeholders during SSR.

### Layout & structure

| Component           | Description                                                                                                       | Key props / slots                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `<VCard/>`          | Outer container for a card. Applies the theme's border, shadow, and rounded corners.                              | Default slot.                                                                              |
| `<VCardHeader/>`    | Header row inside a card, with a divider beneath it.                                                              | Default slot.                                                                              |
| `<VCardContent/>`   | Padded body inside a card. Place after `<VCardHeader/>`.                                                          | Default slot.                                                                              |
| `<TabMenu/>`        | Horizontal tab bar. Wraps a list of `<TabItem/>` elements.                                                        | Default slot.                                                                              |
| `<TabItem/>`        | Single tab. Uses Vue Router under the hood and gets the active state automatically.                               | `to` (String\|Object, required) — route target, same shape as `<RouterLink :to>`.          |
| `<MarkdownLayout/>` | Internal wrapper that applies the theme's typography (`prose`) styles to a markdown page. Selects between `fullwidth`, `blank`, and the default layout based on the page's frontmatter. You generally don't need to use it directly. | `tag` (String, default `'div'`), `frontmatter` (Object, required). |

### Form controls

| Component           | Description                                                                                       | Key props / events                                                                                                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<VButton/>`        | Theme-aware button with solid, outline, and ghost styles.                                          | `variant` (`'primary'\|'secondary'\|'danger'\|'success'\|'warning'`, default `'primary'`), `size` (`'xs'\|'sm'\|'md'\|'lg'\|'xl'`), `outline` (Boolean), `ghost` (Boolean), `circle` (Boolean). Default slot for the label. |
| `<ButtonExpand/>`   | Toggle button rendered as a plus/minus icon. Two-way binds to a boolean.                          | `v-model` (Boolean, required).                                                                                                                                                                                              |
| `<VToggle/>`        | Switch-style on/off control.                                                                       | `v-model` (Boolean), `size` (`'sm'\|'md'\|'lg'`, default `'md'`), `disabled` (Boolean). Default slot for the label.                                                                                                         |
| `<InputText/>`      | Theme-styled text input. Two-way binds to a string/number.                                         | `v-model` (String\|Number), `value` (String\|Number — uncontrolled alternative).                                                                                                                                            |
| `<SelectInput/>`    | Theme-styled `<select>`. Place `<option>` elements in the default slot.                            | `v-model` (String\|Number), `value` (String\|Number). Default slot.                                                                                                                                                         |
| `<Autocomplete/>`   | Generic autocomplete bound to a TaxonWorks endpoint. Emits `select` with the chosen item.          | `url` (String, required), `queryParam` (String, default `'term'`), `params` (Object), `label` (String — property to render), `placeholder` (String), `autofocus` (Boolean), `retainInput` (Boolean). Emits: `select`.       |
| `<AutocompleteOtu/>`| OTU-specific autocomplete. Searches `/otus/autocomplete` and, on selection, navigates to the OTU's default tab. | `autofocus` (Boolean).                                                                                                                                                                                                      |
| `<VClipboard/>`     | Circular icon button that copies a string to the clipboard, with a check-mark confirmation state.  | `text` (String, required), `delay` (Number, default `2000` ms).                                                                                                                                                             |
| `<VPagination/>`    | Page-number pager with first/previous/next/last controls.                                          | `v-model` (Number — current page, required), `total` (Number, required), `per` (Number, required), `rangePages` (Number, default `5`). Emits: `select`.                                                                     |
| `<VPaginationInfo/>`| Compact "X – Y of N records" text, designed to sit next to `<VPagination/>`.                       | `pagination` (Object: `{ page, per, total }`, required).                                                                                                                                                                    |

### Feedback & state

| Component             | Description                                                                                                  | Key props / slots                                                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `<VBadge/>`           | Small pill/chip used to tag values (counts, status…).                                                        | `color` (`'primary'\|'secondary'\|'gray'\|'red'\|'yellow'\|'green'\|'blue'\|'indigo'\|'purple'\|'pink'`), `shape` (`'rounded'\|'pill'\|'square'`), `size` (`'xs'\|'sm'\|'md'\|'lg'\|'xl'`), `weight` (`'normal'\|'medium'\|'semibold'`). Default slot. |
| `<VSpinner/>`         | Animated loading overlay positioned over its parent (or full-screen).                                        | `fullScreen` (Boolean), `target` (String — CSS selector to overlay), `legend` (String), `showLegend` (Boolean), `showSpinner` (Boolean), `spinnerPosition` (`'top'\|'right'\|'bottom'\|'left'`), `logoSize` (Object), `logoClass` (String), `legendClass` (String), `legendStyle` (Object), `resize` (Boolean). |
| `<VSkeleton/>`        | Loading placeholder. Renders shimmering bars whenever its default slot is empty.                             | `lines` (Number, default `1`), `class` (String).                                                                                                                   |
| `<AnimationOpacity/>` | Transition wrapper that fades and scales a child in/out on mount/unmount.                                    | Wraps a single child in the default slot.                                                                                                                          |
| `<VModal/>`           | Centered dialog with backdrop, focus trap, Esc-to-close, and body-scroll lock.                                | `ariaLabel` (String, default `'Dialog'`), `containerClass` (String). Slots: default body, `#header`, `#footer`. Emits: `close`.                                    |

### Data display

| Component             | Description                                                                          | Key props / slots                                  |
| --------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------- |
| `<VTable/>`           | Themed wrapper around a native `<table>`. Compose with the cell components below.    | Default slot.                                      |
| `<VTableHeader/>`     | Themed `<thead>`.                                                                    | Default slot.                                      |
| `<VTableHeaderRow/>`  | `<tr>` inside the header.                                                            | Default slot.                                      |
| `<VTableHeaderCell/>` | Themed `<th>` with padding.                                                          | Default slot.                                      |
| `<VTableBody/>`       | Themed `<tbody>`.                                                                    | Default slot.                                      |
| `<VTableBodyRow/>`    | `<tr>` inside the body, with hover and bottom-border styles.                         | Default slot.                                      |
| `<VTableBodyCell/>`   | `<td>` with consistent padding.                                                      | Default slot.                                      |
| `<Dropdown/>`         | Click-to-open menu with full keyboard navigation (arrows, Esc) and click-outside support. | `items` (Array of `{ label, action }`, default `[]`). Slot: `#button` for the trigger. |

### Media

| Component             | Description                                                                                                              | Key props / events                                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<GalleryImage/>`     | Two-pane gallery: main image plus thumbnail strip. Opens `<ImageViewer/>` on click.                                      | `images` (Array of image objects).                                                                                                                              |
| `<GalleryCarousel/>`  | Auto-rotating depiction viewer. Fetches depictions by ID and cycles through them.                                        | `depictionId` (Array), `interval` (Number, ms, default `10000`), `height` (String, default `'550px'`). Default slot rendered as an overlay on top of the image. |
| `<GalleryMosaic/>`    | Responsive grid of depictions linked to their OTUs.                                                                      | `depictionId` (Array), `imageHeight` (String, default `'112px'`), `imageWidth` (String, default `'200px'`), `wrap` (Boolean), `label` (Boolean).                |
| `<ImageGroupPreview/>`| Preview row of up to N images with a "+more" overlay; emits `select` with the clicked item.                              | `images` (Array, required), `maxVisible` (Number, default `4`), `imageClass` (String). Emits: `select` (`{ image, index }`).                                    |
| `<ImageViewer/>`      | Full-screen image viewer with keyboard navigation, thumbnail strip, and attribution metadata.                            | `index` (Number, required), `images` (Array), `next` (Boolean), `previous` (Boolean). Emits: `close`, `next`, `previous`, `selectIndex`.                        |
| `<VMap/>`             | Interactive Leaflet map with optional clustering, GeoJSON layers, and editing tools (Geoman). **Client-only**, wrap in `<ClientOnly/>` if used inside SSR-rendered content. | `geojson` (Object), `center` (Array `[lat, lng]`), `zoom` (Number, default `18`), `maxZoom`/`minZoom` (Number), `cluster` (Boolean), `controls` (Boolean), `dragging` (Boolean), `width`/`height` (String), `geojsonOptions` (Function). Emits: `add:layer`, `edit:layer`, `layer:drag`, `layer:update`, `draw:start`, `geojson`, `geojson:ready`, `zoom:change`, `zoom:start`. Exposes: `clearDrawLayers()`, `getMapObject()`, `resizeMap()`. |

### Utilities

| Component          | Description                                                                                                                                                                                | Key props / slots                                                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `<AddressMaker/>`  | Spam-resistant `mailto:` link. Pass the username, host, and TLD as separate strings; the component renders the address with visual separators and assembles `mailto:` only on click.       | `items` (Array of strings, required, e.g. `['alice', 'example', 'org']`).                                                                                    |
| `<ProjectStats/>`  | Pulls `/stats` from the configured TaxonWorks API and renders the requested counters (taxon_names, otus, …).                                                                               | `data` (Array of stat keys), `tag` (String, default `'span'`). Default slot is scoped with `{ type, value }` per stat.                                       |
| `<TrackerReport/>` | Opens a modal listing the trackers from `config/tracker.yml`. If no trackers are configured, falls back to opening the TaxonPages GitHub issue tracker.                                   | `label` (String), `icon` (Boolean — show GitHub icon), `iconClass` (Array), `buttonClass` (String), `tag` (String, default `'button'`).                       |
| `<ClientOnly/>`    | Renders its slot only after the component has mounted in the browser. Use to wrap code that depends on `window`/`document` or to defer client-only libraries from SSR.                     | Default slot.                                                                                                                                                |

### Icons

All icons accept any SVG-compatible attribute (`class`, `aria-hidden`, …). Pick a size with Tailwind utilities such as `class="w-5 h-5"`.

| Navigation             | Status / feedback     | Media controls          | Misc                  |
| ---------------------- | --------------------- | ----------------------- | --------------------- |
| `<IconArrowUp/>`       | `<IconCheck/>`        | `<IconPlay/>`           | `<IconClipboard/>`    |
| `<IconArrowDown/>`     | `<IconClose/>`        | `<IconPause/>`          | `<IconDocument/>`     |
| `<IconArrowLeft/>`     | `<IconWarning/>`      | `<IconSpeakerWave/>`    | `<IconDownload/>`     |
| `<IconArrowRight/>`    | `<IconInformation/>`  | `<IconSpeakerX/>`       | `<IconFiles/>`        |
| `<IconHamburger/>`     | `<IconMinusCircle/>`  |                         | `<IconGithub/>`       |
| `<IconSearch/>`        | `<IconPlusCircle/>`   |                         | `<IconJson/>`         |
|                        | `<IconTrash/>`        |                         | `<IconCalendar/>`     |
