# ori-co.github.io

Freelance portfolio of Oriane Cosson, served by GitHub Pages at <https://ori-co.github.io>.

The site is plain HTML/CSS/JS with no framework, no bundler and no build step. Content lives in JSON files (FR + EN) and is rendered client-side.

The repo also hosts a WebAR demo (8thWall), documented separately in [ardemo-studio/README.md](ardemo-studio/README.md).

## Repository layout

```
/
├── index.html            # Single HTML shell: 3 pages + project modal + lightbox
├── assets/
│   ├── css/style.css     # All styles + design tokens
│   ├── js/main.js        # All logic: data loading, rendering, navigation
│   ├── data/
│   │   ├── fr/           # French content  (default language)
│   │   └── en/           # English content (same files, same structure)
│   ├── img/              # Photos (projects/, maker/, about/, offers/, …)
│   ├── svg/              # Illustrations + overlays (projects/, maker/, about/, …)
│   └── video/            # ⚠ git-ignored — not deployed (see Known gotchas)
├── ardemo/               # Generated WebAR build, served at /ardemo/ — never edit by hand
└── ardemo-studio/        # WebAR sources (8thWall Studio project)
```

## Run locally

The JSON content is loaded with `fetch()`, so opening `index.html` straight from disk (`file://`) won't work. Serve the folder over HTTP instead:

```sh
npx serve .
# or
python -m http.server 8000
```

## Architecture

### `index.html`

- Three `.page` blocks: `#page-home`, `#page-portfolio`, `#page-about`. Only the one with the `.active` class is visible.
- A project modal (`#proj-modal`) and an image lightbox (`#lightbox`).
- The markup is mostly empty containers with an `id`. JavaScript fills in every piece of text.
- Event handlers are inline (`onclick="showPage('portfolio')"`), so the functions in `main.js` are globals.

### `assets/js/main.js`

On load, it reads the language from `localStorage.lang` (default `fr`), then fetches four files in parallel:

```
assets/data/<lang>/profile.json ─┐
assets/data/<lang>/offres.json  ─┤
assets/data/<lang>/projects.json─┼─► renderUI · renderProfile · renderOffres
assets/data/<lang>/ui.json      ─┘   renderProjects · renderSkills · renderValues · renderMaker
```

Other entry points:

| Function | Role |
|---|---|
| `showPage(name)` | Switches the active page and nav link (`home` / `portfolio` / `about`) |
| `fp(tag, btn)` | Portfolio filter: shows tiles whose `data-tags` contains `tag` |
| `toggleLang()` | Flips `localStorage.lang` between `fr` and `en`, then reloads the page |
| `openProject(id)` / `closeProjModal()` | Fills and opens the project modal from `projects.json` |
| `openLightbox(i)` / `lbNav(dir)` / `closeLightbox()` | Image viewer, shared by the project gallery and the maker grid |

Keyboard: `Esc` closes the lightbox or the modal, and `←` / `→` navigate the lightbox.

### `assets/css/style.css`

Dark theme. Design tokens are declared on `:root`:

| Token | Value | Use |
|---|---|---|
| `--bg` / `--surface` / `--surface2` | `#1C1E22` / `#23262B` / `#2A2D33` | Backgrounds |
| `--text` / `--muted` / `--border` | `#DDDBD6` / `#999` / `#2E3138` | Text, lines |
| `--ocre` | `#C8A86C` | Accent 1 |
| `--cyan` | `#5BC8C0` | Accent 2 |
| `--violet` | `#9B8EC4` | Accent 3 |

Fonts: **Syne** (headings) and **DM Mono** (labels), both loaded from Google Fonts in `index.html`.

Every `color` field in the JSON data is the name of one of these CSS variables, used as `var(--<color>)`. The only valid values are **`ocre`, `cyan`, `violet`**.

## Content & i18n

All text is stored in `assets/data/fr/` and `assets/data/en/`. Both folders hold the same four files with the same structure.

> **Rule: every content change must be made in both `fr/` and `en/`.**

| File | Contains |
|---|---|
| `ui.json` | Interface labels: nav, buttons, section labels, filter names, form labels, modal headings, `lang` |
| `profile.json` | Identity (`name`, `initials`, `role`, `linkedin`, `formspreeId`, `copyright`), `hero`, `contact`, `about` |
| `offres.json` | The three offers on the home page |
| `projects.json` | Portfolio projects |

### `profile.json › about`

| Key | Shape |
|---|---|
| `heroTitleHtml` | HTML string |
| `bio` | Array of paragraphs (HTML allowed) |
| `timeline` | `{ period, title, detail, current?, edu? }`. `current` highlights the entry and `edu` styles it as education |
| `skills` | `{ category, color, items[] }` |
| `values` | `{ variant: "vc1" \| "vc2" \| "vc3", title, desc }` (the variant is a CSS class) |
| `maker` | `{ img, svg, label }`. The SVG is overlaid on the photo at 25 % opacity |

### `offres.json`

```jsonc
{ "num": "01", "color": "ocre", "title": "…", "desc": "…", "tags": ["…"] }
```

### `projects.json`

```jsonc
{
  "id": "polarpod",                        // unique, used by openProject()
  "filterTags": ["3d", "ia", "mediation"], // must match the fb-<tag> buttons in index.html
  "img": "assets/img/projects/polarpod.png",  // tile photo
  "svg": "assets/svg/projects/polarpod.svg",  // tile illustration
  "year": "2024 · Médiation scientifique",
  "name": "PolarPod 3.0",
  "desc": "Short text shown on the tile.",
  "labels": [{ "text": "3D", "color": "ocre" }, { "text": "Médiation" }], // color is optional
  "study": false,           // true → "★ étude" badge
  "wip": false,             // true → greyed-out tile, not clickable
  "fullDesc": "<p>…</p>",   // HTML, modal body (falls back to desc)
  "tech": ["React.js", "Three.js"], // "// stack" section of the modal
  "gallery": ["assets/img/projects/polarpod_1.png"], // modal images (falls back to img)
  "video": null,            // optional path to an .mp4
  "links": [{ "label": "…", "url": "https://…", "type": "web" }] // type: web | youtube | github
}
```

## How-to

### Add a project to the portfolio

1. Add the tile image to `assets/img/projects/<id>.png|jpg` and the gallery images as `<id>_1.png`, `<id>_2.png`, ….
2. Add the tile illustration to `assets/svg/projects/<id>.svg`.
3. Add an entry to **both** `assets/data/fr/projects.json` and `assets/data/en/projects.json`, with the same `id`, `filterTags`, paths and `color` values.
4. Array order is display order.
5. Serve locally, then check the tile, each filter and the modal in both languages.

### Add a portfolio filter

1. In `index.html`, add a button inside `.filters`: `<button class="fb" id="fb-<tag>" onclick="fp('<tag>',this)"></button>`.
2. Add the label under `portfolio.filters.<tag>` in **both** `ui.json` files.
3. Add `<tag>` to the `filterTags` of the relevant projects.

### Other common edits

| Edit | Where |
|---|---|
| Add a maker photo | Image in `assets/img/maker/`, SVG in `assets/svg/maker/`, entry in `profile.json › about.maker` (×2) |
| Edit an offer | `offres.json` (×2) |
| Change the LinkedIn URL / contact form ID | `profile.json › linkedin` / `formspreeId` (×2) |
| Change a colour | `:root` tokens in `style.css` |

## Contact form

No backend. On submit, `main.js` POSTs `{ name, email, mission, message }` as JSON to `https://formspree.io/f/<formspreeId>`. Messages arrive through the Formspree account tied to that ID. The mission list comes from `profile.json › contact.missionTypes`.

## Deployment

GitHub Pages serves the `main` branch as is: **pushing to `main` puts the site online**, and there's no CI to wait for.

For the WebAR demo (`/ardemo/`), see [ardemo-studio/README.md](ardemo-studio/README.md#build--deploy).

## Known gotchas

- **Trusted HTML only.** `hero.titleHtml`, `about.heroTitleHtml`, `about.bio` and `fullDesc` are injected with `innerHTML`. In fact most rendered fields go through template strings without escaping.
- **Some French strings are hard-coded in `main.js`**, not in `ui.json`: the `— Sélectionner —` placeholder of the mission select, the `★ étude` badge, and the form status messages (FR/EN ternary on `_ui.lang`).
- **`assets/video/` is git-ignored**, so any video placed there is not deployed. Before filling a project's `video` field, host the file somewhere that is deployed (and adjust `.gitignore` if needed). No project uses `video` today.
- **Filter buttons are hard-coded** in `index.html`, while their labels come from `ui.json`. A key in `ui.json` without a matching `fb-<tag>` button is silently ignored.
- **Image fallbacks.** Most `<img>` tags have `onerror="this.style.display='none'"`, so a wrong path hides the image instead of throwing an error. Check the Network tab when an image "disappears".
