# Migrating from the legacy TaxonPages to the NPM package

This guide is for sites that were created from the **old** TaxonPages
version, the one where you forked
`SpeciesFileGroup/taxonpages`, edited the `setup` branch and let a
GitHub Action merge `main` + `setup` into a deployable build.

TaxonPages is now distributed as an NPM package
([`@sfgrp/taxonpages`](https://www.npmjs.com/package/@sfgrp/taxonpages))
and the user-facing repository is reduced to a thin configuration
project: [SpeciesFileGroup/taxonpages-config](https://github.com/SpeciesFileGroup/taxonpages-config).

The goals of this migration are:

- Keep `setup` as the configuration branch (the same branch you have
  been editing), but stop relying on `main` for the TaxonPages source
  code. `main` is no longer touched by the build, leaving it
  untouched also means a future upstream sync (for example, when the
  package branch is merged into upstream `main`) can be pulled in
  cleanly without colliding with your configuration.
- Add a `package.json` that pulls TaxonPages from NPM.
- Update `config/style/theme.css` to use the new CSS custom property
  names and the new color value format.

You do **not** lose your configuration: the files inside `config/`,
`pages/` and `public/` keep the same locations and (with the exception
of `theme.css`) the same syntax.

---

## 1. Before you start

1. Make sure all your customizations live on the `setup` branch (this
   is where the legacy workflow expected user edits, and where they
   will keep living after the migration).
2. The migration happens entirely on the `setup` branch, `main` is
   not touched, so any future upstream change to it can still be
   pulled in without colliding with your configuration.


---

## 2. What actually needs to change

Most of the `setup` branch stays exactly as it is. The configuration
YAML files, the markdown pages and the static assets keep the same
names and syntax, so you don't need to touch them.

In practice, only **five** changes are required:

| Change                                     | File                                |
| ------------------------------------------ | ----------------------------------- |
| **Delete** (legacy build script)           | `.github/workflows/gh-pages.yml`    |
| **Delete** (legacy Tailwind config)        | `config/vendor/tailwind.config.cjs` |
| **Create** (declares the NPM package)      | `package.json`                      |
| **Create** (new deploy workflow)           | `.github/workflows/deploy.yml`      |
| **Create** (new Tailwind entry point)      | `config/vendor/tailwind.css`        |
| **Rewrite** (new variable names + format)  | `config/style/theme.css`            |

`.gitignore` should also be updated, the legacy version uses an
allow-list pattern that no longer matches the new project layout.

The file contents you need to paste are all included below in §4 and
§6, so you don't need to clone or download anything.

For reference, the resulting `setup` branch should look like this:

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml          # NEW — replaces gh-pages.yml
├── config/
│   ├── ...                     # Your configuration files
│   ├── style/
│   │   └── theme.css           # UPDATED — new variable names + format
│   └── vendor/
│       └── tailwind.css        # NEW — replaces tailwind.config.cjs
├── pages/
│   ├── home.md
│   └── about.md
├── panels/                     # If you have custom panels
├── modules/                    # If you have custom modules
├── public/                     # (unchanged — your static assets)
├── .gitignore                  # UPDATED
├── README.md
└── package.json                # NEW
```

Anything not in this list, most importantly the old `gh-pages.yml`
workflow and the old `tailwind.config.cjs`, should be removed.

---

## 3. Files to remove

On the `setup` branch, delete:

| Path                                | Reason                                                                                                |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `.github/workflows/gh-pages.yml`    | Replaced by `.github/workflows/deploy.yml`.                                                           |
| `config/vendor/tailwind.config.cjs` | Tailwind v4 is configured via CSS now. Replaced by `config/vendor/tailwind.css`.                      |

You do **not** need to delete the `setup` branch, it is still the
branch that drives the deploy. `main` is no longer involved in the
build and can be left as-is (or used to track upstream TaxonPages
without affecting your site).

---

## 4. Files to add

Create each of the files below directly in your repository, copy and
paste the contents from this guide. None of them depend on your
project; they are pure scaffolding.

If you are using the GitHub web interface, you can create any file
(including one inside a folder that does not exist yet) with **Add
file → Create new file** and typing the path you want, for example
`.github/workflows/deploy.yml`. Then paste the content, scroll down
and commit directly to `setup`.

### 4.1 `package.json`

```json
{
  "name": "taxonpages-config",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "taxonpages dev",
    "dev:ssr": "taxonpages dev:ssr",
    "build": "taxonpages build",
    "build:ssr": "taxonpages build:ssr",
    "serve": "taxonpages serve",
    "preview": "taxonpages preview",
    "setup": "taxonpages setup"
  },
  "dependencies": {
    "@sfgrp/taxonpages": "latest"
  }
}
```

The `taxonpages` binary comes from the `@sfgrp/taxonpages` package and
exposes every script you used to run through the old root scripts
(`dev`, `build`, `preview`, …) plus the new web-based
`setup` wizard.

### 4.2 `.github/workflows/deploy.yml`

This is the new build-and-deploy workflow. It is triggered on every
push to `setup`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - setup
  workflow_dispatch:

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6

      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm install

      # Reinstall explicitly to bypass any committed package-lock.json
      # and guarantee every deploy uses the latest published version.
      - name: Install latest TaxonPages version
        run: npm install @sfgrp/taxonpages

      - name: Build public view
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v5
        with:
          path: ./dist

  deploy:
    needs: build
    permissions:
      pages: write
      id-token: write

    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v5
```

### 4.3 `config/vendor/tailwind.css`

This file replaces the legacy `config/vendor/tailwind.config.cjs`.
Tailwind v4 is configured via CSS, and TaxonPages re-exports its
internal Tailwind setup so you only need to extend it:

```css
@import '@/assets/css/tailwind.css';

/*
 * User Tailwind CSS overrides
 *
 * Add your custom @theme overrides or additional styles below.
 * The base TaxonPages theme is imported above.
 *
 * Example — override theme colors:
 *
 * @theme {
 *   --color-primary-color: rgb(25, 100, 200);
 * }
 *
 * Example — customize typography prose styles:
 *
 * .prose li {
 *   margin-top: 0.1428571em;
 *   margin-bottom: 0.1428571em;
 * }
 */
```

### 4.4 `.gitignore`

The legacy `.gitignore` used an *allow-list* pattern
(`*` + `!config/**`) because the repository contained the whole
TaxonPages source. With the NPM package, the repository only contains
your configuration, so you can switch to a normal Node ignore list:

```gitignore
node_modules
.DS_Store
dist
*.local
.env
.vite
```

## 5. Files that need no migration

These files behave **exactly** as they did in the legacy version,
same name, same location, same schema. You do not need to touch them
to migrate. Leave whatever values you already have:

- `config/api.yml`
- `config/copyright.yml`
- `config/header.yml`
- `config/maps.yml`
- `config/metadata.yml`
- `config/project.yml`
- `config/router.yml`
- `config/tracker.yml`
- Everything under `modules/`
- Everything under `pages/`
- Everything under `panels/`
- Everything under `public/` (images, `CNAME`, etc.)

---

## 6. Updating `config/style/theme.css`

This is the largest content change. Two things changed at the same
time:

1. **Variable names.** The `--color-*` prefix was replaced with
   `--tp-*`, and a number of new tokens were added (cards, footer,
   tree, shadow, field occurrence, asserted-absent).
2. **Value format.** The old file stored colors as bare comma-
   separated channels (`255, 255, 255`) so they could be fed into
   `rgb(var(--color-x) / <alpha>)` by Tailwind. The new file stores
   **complete CSS color values** — `rgb(255, 255, 255)`, `#ffffff`,
   `hsl(...)`, `oklch(...)`, etc. — so anything CSS accepts as a
   color works.

### 6.1 Variable-name mapping

| Legacy name (`--color-…`)         | New name (`--tp-…`)                          |
| --------------------------------- | -------------------------------------------- |
| `--color-primary`                 | `--tp-primary`                               |
| `--color-primary-content`         | `--tp-primary-content`                       |
| `--color-secondary`               | `--tp-secondary`                             |
| `--color-secondary-content`       | `--tp-secondary-content`                     |
| `--color-base-background`         | `--tp-base-background`                       |
| `--color-base-foreground`         | `--tp-base-foreground`                       |
| `--color-base-muted`              | `--tp-base-muted`                            |
| `--color-base-soft`               | `--tp-base-soft`                             |
| `--color-base-lighter`            | `--tp-base-lighter`                          |
| `--color-base-border`             | `--tp-base-border`                           |
| `--color-base-content`            | `--tp-base-content`                          |
| `--color-map-georeference`        | `--tp-map-georeference`                      |
| `--color-map-aggregate`           | `--tp-map-aggregate`                         |
| `--color-map-asserted`            | `--tp-map-asserted`                          |
| `--color-map-type-material`       | `--tp-map-type-material`                     |
| `--color-map-collection-object`   | `--tp-map-collection-object`                 |
| `--color-scrollbar-thumb`         | `--tp-scrollbar-thumb`                       |
| `--color-scrollbar-track`         | `--tp-scrollbar-track`                       |
| `--color-map-shape-opacity`       | `--tp-map-shape-opacity` *(unitless, unchanged)* |
| `--color-map-marker-opacity`      | `--tp-map-marker-opacity` *(unitless, unchanged)* |

### 6.2 Value-format mapping

Replace every bare-channel value with a valid CSS color. The most
mechanical translation is to wrap the existing triplet in `rgb(...)`,
but any CSS color notation now works.

| Legacy form                       | New form (any of these works)                    |
| --------------------------------- | ------------------------------------------------ |
| `--color-primary: 0, 0, 0;`       | `--tp-primary: rgb(0, 0, 0);`                    |
|                                   | `--tp-primary: #000000;`                         |
|                                   | `--tp-primary: hsl(0 0% 0%);`                    |
| `--color-secondary: 14, 165, 233;`| `--tp-secondary: rgb(14, 165, 233);`             |
| `--color-base-background: 245, 247, 251;` | `--tp-base-background: rgb(245, 247, 251);` |
| `--color-card-shadow:` *(new)*    | `--tp-card-shadow: rgba(8, 47, 73, 0.08);`       |

Important consequences of this change:

- You no longer need to remember that values are RGB channels. Use
  whatever notation you prefer: hex, `rgb()`, `rgba()`, `hsl()`,
  `oklch()`, `color()`.

### 6.3 Before / after example

Old `config/style/theme.css` (legacy):

```css
:root {
  --color-primary: 0, 0, 0;
  --color-primary-content: 255, 255, 255;

  --color-secondary: 14, 165, 233;
  --color-secondary-content: 255, 255, 255;

  --color-base-background: 245, 247, 251;
  --color-base-foreground: 255, 255, 255;
  --color-base-content: 0, 0, 0;
  /* … */
}

.dark {
  --color-primary: 23, 23, 23;
  /* … */
}
```

New `config/style/theme.css`:

```css
:root {
  --tp-primary: rgb(0, 0, 0);
  --tp-primary-content: rgb(255, 255, 255);

  --tp-secondary: rgb(14, 165, 233);
  --tp-secondary-content: rgb(255, 255, 255);

  --tp-base-background: rgb(245, 247, 251);
  --tp-base-foreground: rgb(255, 255, 255);
  --tp-base-content: rgb(0, 0, 0);
  /* … */
}

.dark {
  --tp-primary: rgb(23, 23, 23);
  /* … */
}
```

---

## 7. Step-by-step migration checklist

In both paths, `setup` stays as the configuration branch and `main`
is no longer involved in the build.

### Path A: using the GitHub website only (recommended)

You can do the whole migration from the GitHub website. You don't
need to clone or download anything, every file you have to create
is included as a code block in §4 and §6 of this guide, ready to
copy and paste. All you need is a web browser.

#### A.1 Open your repository on the `setup` branch

1. Open your TaxonPages repository on GitHub.
2. Use the branch selector (top-left of the file list) and switch to
   **`setup`**. From now on, every change you commit will go to
   `setup` only, leave `main` alone.

#### A.2 Delete the obsolete files

For each of the two files below, click it in your repository, then
click the **trash icon** in the top-right of the file view and
scroll down to **Commit changes** (directly to `setup`):

- `.github/workflows/gh-pages.yml`
- `config/vendor/tailwind.config.cjs`

#### A.3 Create the new files

For each file in the list below, in your repository (still on
`setup`):

1. Click **Add file → Create new file**.
2. In the filename box at the top, type the **full path**, including
   any folders. Typing `/` automatically creates a folder. For
   example, typing `.github/workflows/deploy.yml` creates the
   `.github` and `workflows` folders if they don't exist yet.
3. Paste the contents from this guide.
4. Scroll down to **Commit new file** (directly to `setup`).

Files to create:

| Path                              | Paste the contents from                |
| --------------------------------- | -------------------------------------- |
| `package.json`                    | [§4.1](#41-packagejson)                |
| `.github/workflows/deploy.yml`    | [§4.2](#42-githubworkflowsdeployyml)   |
| `config/vendor/tailwind.css`      | [§4.3](#43-configvendortailwindcss)    |

#### A.4 Update `.gitignore`

Click on the existing `.gitignore` file, click the pencil icon
(**Edit this file**), select everything and replace it with the
content shown in [§4.4](#44-gitignore). Commit to `setup`.

#### A.5 Rewrite `config/style/theme.css`

Open `config/style/theme.css`, click the pencil icon, select
everything and replace it with a translated version that follows the
rules in [§6 Updating `config/style/theme.css`](#6-updating-configstyletheme.css).
Commit to `setup`.

> If you only customized a couple of colors in the legacy theme and
> are happy with the package defaults for everything else, you can
> reduce `config/style/theme.css` to a minimal file (e.g. only a
> couple of `--tp-primary` / `--tp-secondary` overrides), anything
> you leave out falls back to the package theme.

#### A.7 Verify the deploy

Open the **Actions** tab. You should see a **Deploy to GitHub Pages**
run starting (or already finished from the previous commits). When
it finishes (green check), your site is live at the URL shown in
**Settings → Pages**. From now on, every commit to `setup`
re-deploys the site automatically, no more merging branches, no
local build.

---

## 8. Verifying the migration

After the first deploy succeeds (look for a green check in the
**Actions** tab of your repository):

- Open the live site and check that colors look right in both light
  and dark mode. The new theme adds tokens for cards, the footer,
  and the taxon tree, if you left them unset, the package defaults
  apply.
- If something looks off, open `config/style/theme.css` on the
  `setup` branch from the GitHub website, edit the offending
  variable, and commit. Each commit re-deploys automatically.
- Optional (for users comfortable with Node.js): clone the
  repository locally and run `npm install` followed by `npm run dev`
  to preview changes before committing. The same project also
  exposes a web-based setup wizard at `npm run setup`, which writes
  most of the files in `config/` for you through a graphical
  interface.

## 9. Where to go next

- [`taxonpages-config` template repository](https://github.com/SpeciesFileGroup/taxonpages-config)
- [TaxonPages User Guide](https://github.com/SpeciesFileGroup/taxonpages/blob/package/docs/user-guide.md)
- [TaxonPages Developer Guide](https://github.com/SpeciesFileGroup/taxonpages/blob/package/docs/developer-guide.md)
  — authoring local panels, modules, and plugins
- `npx taxonpages package add <name>` — install community panels and
  modules from NPM (replaces the old practice of pasting code into
  the source tree).
