# TaxonPages

TaxonPages is a tool to serve taxon pages. At present it draws data from TaxonWorks' API, however we seek to keep the TaxonPages platform agnostic therefor facilitating the modular addition of functionality that may reference data from any biodiversity data-serving API.

## Status Warning

TaxonPages software is in active development and changes are expected that will cause the early first-adopters' instances to require rebuilding by refreshing one's forked branch using `git pull`. A first _stable version_ is expected by Spring 2023.

## Usage

1. Click on "Fork" button to create your own repository from this.
2. Uncheck `Copy the setup branch only` and press `Save`
3. After create your repo, go to `Settings > Pages`, on "Branch" select `gh-pages` and `/(root)`. Then press save
4. Open `router.yml` file and change `base_url` to the name of your repository.
5. After a couple of minutes, your public page should be available at `https://<your_user_name>.github.io/<your_repo_name>`

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

3. Go to `taxonpages` folder and switch to `main` branch

```
cd taxonpages
git checkout main
```

4. [Download](https://github.com/SpeciesFileGroup/taxonpages/archive/refs/heads/setup.zip) configuration branch and paste `config` and `pages` folders inside taxonpages folder.

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

## Panels

### Panel layout

To modify the position of the panels in the layout of the Taxa page, edit the `taxa_page.yml` file

```yaml
taxa_page_overview:
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
```

### External panels

To add panels in Taxa pages, create a folder called `panels` in your `setup` branch, and inside it create another folder for your panel. For example: `panels/PanelTest`

In `PanelTest` folder, create a `main.js` file, with the following structure:

```javascript
import MyPanelComponent from './MyPanelComponent.vue'

Export default {
   id: 'panel:test', // ID to identify this panel
   component: MyPanelComponent, // Vue component for your panel
   available: ['HigherClassificationGroup', 'FamilyGroup', 'GenusGroup', 'SpeciesGroup'] // <-- OPTIONAL: This will define for which rank group will be available, remove it if your panel will be available for all.
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
        - panel:content
        - panel:statistics
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
