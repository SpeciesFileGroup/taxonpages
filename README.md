# TaxonPages
TaxonPages is a tool to serve taxon pages.

## Usage

Click on "Use this template" button to create your own repository from this

### Setup - Github Pages

1. Switch to `config` branch in your TaxonPages repository.
2. We provide some settings by default to setup your public pages, but API parameters are required and must be configured to get the data from your TaxonWorks project.

```yaml
# config/api.yml
---
  url: https://<your.taxonworks.server>/api/v1
  project_token: yourprojecttoken
```
3. Push the changes after update the configuration files inside `config` branch
4. GitHub actions will build TaxonPages with the current configuration in `config` branch and publish it to the `gh-pages` branch

# Install

Follow this steps to run TaxonPages in your local machine.

1. Install [NodeJS](https://nodejs.org/en/download/)
2. Fork this repository and clone it, or clone this repository using [GIT](https://git-scm.com/):

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

### Pages

TaxonPages provides the ability to add content sites. Add your content inside "Pages", these files must be in markdown format or vue component. Markdown files support HTML and VueJS components
By default, TaxonPages takes the name of your files to create the route.
For example, if you create a file named "contributors.md" the route to access it will be http://yourtaxonpagessite/contributors


### Style

TaxonPages use [TailwindCSS](https://tailwindcss.com/docs/configuration) framework for the style. We already provide default settings for colors and markdowns. If you want to make any changes to your configuration, you must do so in the `config/vendor/tailwind.config.js` file. This file uses the TaxonPages configuration as a default. It is possible to overwrite it as long as you use it as a preset.