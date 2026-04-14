# TaxonPages

TaxonPages is a tool to serve taxon pages. At present it draws data from TaxonWorks' API, however we seek to keep the TaxonPages platform agnostic therefor facilitating the modular addition of functionality that may reference data from any biodiversity data-serving API.

## Installation

TaxonPages is distributed as an NPM package. Use the `taxonpages` CLI to scaffold and manage your project.

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

## CLI Commands

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
| `taxonpages package outdated`      | —                   | Check installed packages for available updates     |
| `taxonpages update`                | —                   | Update TaxonPages to the latest version            |
| `taxonpages setup`                 | —                   | Start the web-based configuration interface        |

### Example workflow

```
npx @sfgrp/taxonpages init my-project
cd my-project
npm install
# Edit config/api.yml with your API settings
npm run dev
```

## Documentation

- **[User Guide](docs/user-guide.md)** — Configure your site: pages, theme, analytics, layout, taxa page panels, and installing extensions from NPM.
- **[Developer Guide](docs/developer-guide.md)** — Build and publish your own panels, modules, and plugins for the TaxonPages ecosystem.

## License

TaxonPages is released under the MIT License. See [LICENSE](LICENSE) for details.
