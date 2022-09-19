# TaxonPages
TaxonPages is a tool to serve taxon pages for TaxonWorks projects.

## Status Warning
TaxonPages software is in active development and changes are expected that will cause the early first-adopters' instances to require rebuilding by refreshing one's forked branch. A first _stable version_ is expected by Spring 2023.

## Usage

1. Click on "Fork" button to create your own repository from this.
2. Uncheck `Copy the setup branch only` and press `Save`
3. After create your repo, go to `Settings > Pages`, on "Branch" select `gh-pages` and `/(root)`. Then press save
4. After a couple of minutes, your public page should be available at `https://<yourusername>.github.io/taxonpages`

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

## Customization

### Pages

TaxonPages out of the box support markdown and vue for content sites. Add your content pages inside `pages` folder. By default, TaxonPages use the file name to create the route.
For example, if the filename is "contributors.md" the route to access it will be http://yourtaxonpagessite/contributors

### Style

If you want to change the color palette, you can edit  `/config/style/theme.css` file, colors must be in RGB format.
TaxonPages use [TailwindCSS](https://tailwindcss.com/docs/configuration) framework for the style. We already provide default settings for colors and markdown. If you want to make any change to your configuration, you must do so in the `config/vendor/tailwind.config.js` file. This file uses the TaxonPages configuration as a default. It is possible to overwrite it as long as you use it as a preset.
