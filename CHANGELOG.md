# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

- Panel priority: panels from the project's `panels/` folder and from NPM packages now override built-in panels that declare the same id, following the source priority described in the developer guide. Previously the built-in panel always won, so a local or NPM panel reusing a core id was silently ignored. This is what makes it possible to replace a built-in panel without writing a `taxa_page.yml`. Note that sites reusing a core panel id by accident will now render the overriding panel instead of the built-in one.
- Taxa page layout: a panel id listed in `taxa_page.yml` that no panel declares is now reported in the console and skipped, instead of rendering an empty component.
- Fonts: the typeface can now be changed. A project can create a `config/vendor/fonts.css` that replaces the built-in font stylesheet, so its own webfont is loaded and Inter is no longer requested. The family is exposed as the `--tp-font-main` and can also be set from `config/style/theme.css`.

## [0.6.3] - 2026-07-07

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
