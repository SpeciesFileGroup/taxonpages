# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Internationalization. A site can be served in several languages by adding `config/i18n.yml`. Without that file a site stays single-locale and ships no extra JavaScript. See the developer guide.
  - The default locale keeps its unprefixed URLs (`/about`) and the others are served under a prefix (`/es/about`), so links already published keep resolving.
  - Interface strings come from message catalogs (`locales/<locale>.yml`), merged across core, NPM packages, local panels and modules, and the site itself. Panels, modules, and plugins can ship their own.
  - Config values are translatable one value at a time: a string in `header.yml`, `copyright.yml`, `project.yml`, `metadata.yml`, `tracker.yml`, `news.yml`, or a tab label or panel `bind` value in `taxa_page.yml` may be replaced by a map of locales. Existing config files stay valid as they are.
  - Pages are translated with a filename suffix (`about.es.md`). A page with no variant is served as it is.
  - Common names are ordered by the reader's language, `<html lang>` follows the active locale, and `hreflang` alternates are emitted for every configured locale.
- Setup wizard: a `Languages` section that writes `config/i18n.yml` and warns before removing a locale, one input per locale on every translatable field, and a `Translations` section listing every translatable value with its status in each language. Modules and panels opt a field in with `"translatable": true` in `setup.schema.json`.

### Fixed

- Taxa page: a panel's `rank_group` in `taxa_page.yml` had no effect and now applies, overriding the rank group a panel declares for itself. Config that previously did nothing will start hiding panels; tab-level `rank_group` is unchanged.

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
