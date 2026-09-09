# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.7.2] - 2026-09-09

### Changed

- Update packages

## [0.7.1] - 2026-09-09

### Added

- `taxonpages doctor`, a new command that checks your project for known dependency problems. Right now it reports libraries installed twice: if something pulls in a second copy of Vue, Vue Router, Pinia or unhead, it lists each version and where it lives. Your site keeps working, TaxonPages resolves the conflict on its own, so this is information rather than an emergency: it lets you report the problem to the author of the package that brought the extra copy, since that package is now running against a version it was not built for. It exits with an error code when it finds something, so you can also run it in CI. If you write panels, modules or plugins yourself, the new "Shared dependencies" section of the developer guide explains how to declare these libraries so this never happens.

### Fixed

- Panels and plugins that broke for no apparent reason should now work. If you installed a panel or plugin and it failed with an error like `getActivePinia() was called with no active Pinia`, or the page title stopped updating, the cause was usually the same: the package brought its own copy of a library TaxonPages already provides (Vue, Vue Router, Pinia or unhead). Two copies were loaded at once and could not see each other's data. TaxonPages now makes sure a single copy of each is used. Nothing to change in your site, reinstall or rebuild and the problem is gone. Previously this protection was applied to only one of the two bundles an SSR site produces, the one that runs on the server. That is why an SSR page could render correctly and then break the moment it finished loading in the browser. It now covers every command: `dev`, `dev:ssr`, `build`, `build:ssr`, `preview` and the setup wizard.

## [0.7.0] - 2026-09-01

### Added

- Taxa page regions: panels can now be placed outside the tab layout, in named regions of the taxon page — next to the taxon name, next to the rank, beside the download buttons, below the title bar, at the bottom of the header, and above the content shared by every tab. Regions are configured under `taxa_page_regions`, a key of its own next to `taxa_page` in `taxa_page.yml`, and entries take the same shape used in the tab layout: a bare panel id, or an object with `bind`, `rank_group` and `order`. A panel listed only in a region is not rendered in any tab. Panels receive the same props in both places, so one component can serve both. Unknown region names and unknown panel ids are reported in the console and skipped. See the layout section of the developer guide for the region list and the data each one guarantees.
- Layout slots: an entry in a `layout.js` file can now carry `bind`, the props passed to the contributed component, and `meta`, an arbitrary object the layout registry carries through without interpreting, so a module can attach its own rules to a contribution. The taxon page uses `meta.rankGroup` to restrict a contribution to certain rank groups.

### Changed

- Taxa page header: the taxon name heading is now wrapped in a flex row together with the `taxa_page:header:taxonname:after` region, so contributed content renders next to the name without becoming part of the `<h1>`. This keeps the heading's accessible name limited to the taxon name and keeps the markup valid when a contributed panel renders block-level content. Sites with custom CSS targeting the markup around the heading may need to adjust it.

### Fixed

- Layout slots: a `layout.js` file placed in a local `panels/*` folder is now discovered. Previously only panels installed from NPM could contribute to a layout region, so the same panel behaved differently depending on where it came from.

## [0.6.8] - 2026-08-26

### Added

- Panel nomenclature references: `title` configuration setting

### Changed

- Updated dependencies

## [0.6.7] - 2026-08-13

### Added

- Header navigation: a `link` in `header.yml` can now be an external URL. Links open in the same tab by default, an entry can set `target: _blank`.

## [0.6.6] - 2026-08-12

### Changed

- Favicon: icons placed in the project's `public/` folder (`favicon.svg`, `favicon.ico`, `apple-touch-icon.png`) are now linked from the document head automatically, with no configuration. The generated tags apply `base_url`, so the icon is also found when the site is deployed under a sub-path — previously it relied on the browser's implicit request for `/favicon.ico`, which ignores the sub-path and produced no icon at all. See the theming section of the user guide.

## [0.6.5] - 2026-08-12

### Added

- Fonts: the typeface can now be changed. A project can create a `config/vendor/fonts.css` that replaces the built-in font stylesheet, so its own webfont is loaded and Inter is no longer requested. The family is exposed as the `--tp-font-main` and can also be set from `config/style/theme.css`.

### Fixed

- Panel priority: panels from the project's `panels/` folder and from NPM packages now override built-in panels that declare the same id, following the source priority described in the developer guide. Previously the built-in panel always won, so a local or NPM panel reusing a core id was silently ignored. This is what makes it possible to replace a built-in panel without writing a `taxa_page.yml`. Note that sites reusing a core panel id by accident will now render the overriding panel instead of the built-in one.

### Changed

- Taxa page layout: a panel id listed in `taxa_page.yml` that no panel declares is now reported in the console and skipped, instead of rendering an empty component.

## [0.6.4] - 2026-08-07

### Fixed

- Panel Descendants: the expanded branches of the tree are kept when navigating back to a previously visited OTU page, and their already loaded children are no longer requested again.
- Panel nomenclature references: made URLs clickable for DOI

[#368]: https://github.com/SpeciesFileGroup/taxonpages/issues/368
[#364]: https://github.com/SpeciesFileGroup/taxonpages/pull/364

## [0.6.3] - 2026-07-08

### Added

- Gallery carousel: optional `citations` prop that fetches image citations and shows the original citation (`Depicted in:`) in the carousel label.

## [0.6.2] - 2026-07-02

### Fixed

- Missing taxon names in panel type designation.

## [0.6.1] - 2026-07-01

### Fixed

- Loading a config `.yml` file that only contains comments no longer throws with js-yaml 5. Empty, whitespace-only, and comment-only config files are now treated as having no overrides.

## [0.6.0] - 2026-06-26

### Added

- Layout regions: modules and the project root can inject components into named regions of the main layout (`header:before`, `header:after`, `main:before`, `footer:before`) through a `layout.js` file. See the developer guide.
- News module: a dismissible announcement bar above the main navigation, configured in `news.yml`. Dismissed announcements are remembered per browser.

## [0.5.5] - 2026-06-03

### Added

- `package update` command to update the project's packages from the CLI.
- Migration guide (`docs/migration.md`).

### Changed

- Panel References: Unified reference rendering across the References panel and citation rows. [#361]
- Updated the default theme styles.
- Updated the plugin example in the developer guide.
- Updated dependencies.

### Fixed

- Panel Biological associations: Added missing links for anatomical parts and collection objects with taxon determinations.

[#361]: https://github.com/SpeciesFileGroup/taxonpages/issues/361

## [0.5.4] - 2026-05-13

### Fixed

- Prevent `taxonpages` from being discovered as a transitive dependency.

### Changed

- Updated dependencies.

## [0.5.3] - 2026-05-13

### Changed

- Renamed the Citations panel to the References panel.

## [0.5.2] - 2026-05-11

### Changed

- Updated the link color in the gallery carousel.

## [0.5.1] - 2026-05-11

### Fixed

- Prevent prose styles from applying a margin to the image carousel.

## [0.5.0] - 2026-05-11

- Start of the 0.5.x release series.
