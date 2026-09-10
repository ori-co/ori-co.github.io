---
name: add-project
description: Add a new project to the portfolio. Gathers the info, copies and renames the images, creates the tile SVG, writes the FR entry and its EN translation in both projects.json files, then runs check-content. Use when the user wants to add (or fully rewrite) a portfolio project.
argument-hint: "[project name or folder of images]"
---

# add-project

Adds one entry to `assets/data/fr/projects.json` **and** `assets/data/en/projects.json`, with its images. The data schema is documented in [README.md](../../../README.md#projectsjson). Talk to the user in French.

## 1. Gather the information

Start from what the user already gave (arguments, pasted text, image folder). Read both `projects.json` files and the filter buttons in `index.html` (`id="fb-<tag>"`) so you know the existing projects and tags.

| Field | Notes |
|---|---|
| `name` | Project name |
| `year` | `"YYYY · Context"`, e.g. `"2023 · Aéronautique · Bourget"` |
| `desc` | 1 sentence, shown on the tile |
| `fullDesc` | Context, what was built, key technologies |
| `filterTags` | Existing tags only, unless the user wants a new filter (see step 5) |
| `labels` | 1 to 3 short tags. The first coloured one sets the modal accent colour |
| `tech` | Technologies, proper names |
| `links` | Optional. `type`: `web` \| `youtube` \| `github` |
| images | 1 tile image + gallery images (source paths) |
| `study` / `wip` | Default `false` |

Rules:

- **Never invent facts**: clients, dates, events, figures, results. You may rephrase and structure what the user gave. For anything missing, ask.
- Use AskUserQuestion for choices: `filterTags` (multiSelect over the existing tags) and the accent colour (`ocre` / `cyan` / `violet`). In the existing data, ocre = 3D, cyan = AR / VR, violet = AI / LLM.
- `video` stays `null`. `assets/video/` is git-ignored, so a local video wouldn't be deployed. If the user wants one, flag it and suggest a YouTube link instead.

## 2. id and position

- `id`: kebab-case from the name (`[a-z0-9-]`), unique across the projects.
- Array order is display order, and projects are sorted by year, most recent first. Insert at the matching index, at **the same index in both files**. Ask the user if it's ambiguous.

## 3. Images

- **Copy** (never move) the user's files to `assets/img/projects/`:
  - tile: `<id>.<ext>`;
  - gallery: `<id>_1.<ext>`, `<id>_2.<ext>`, …
- Use lowercase extensions and no spaces or accents in file names. GitHub Pages is case-sensitive.
- `gallery` lists the gallery images (you may include the tile image). If it's empty, the modal shows the tile image.
- Report the size of each copied image. For any image over 1 MB, ask the user before resizing, and never overwrite their source file:
  ```sh
  ffmpeg -y -i "<src>" -vf "scale='min(1920,iw)':-2" -q:v 3 "assets/img/projects/<name>.jpg"
  ```
  This caps the width at 1920 px and outputs JPEG. It's fine for photos; keep PNG for screenshots with text.

## 4. Tile SVG

`assets/svg/projects/<id>.svg` is **required**: the tile renders it with no fallback, so a missing file shows as a broken image. If the user doesn't provide one, create one in the style of the existing files (read 1 or 2 in `assets/svg/projects/` first):

- `viewBox="0 0 400 200"`, background `<rect width="400" height="200" fill="#23262B"/>`;
- a few thin abstract shapes (circles, lines, polylines) loosely evoking the project;
- strokes in `#C8A86C` / `#5BC8C0` / `#9B8EC4`, `stroke-width` 0.5 to 1, `opacity` 0.2 to 0.4, no fill;
- ~1 KB, no text, no embedded images.

## 5. Write the entries

- **Edit the JSON files by hand** (Edit tool) and match the existing formatting: 2-space indent, `filterTags` on one line, one `{ "text": …, "color": … }` per line in `labels`. Never rewrite a whole file with `JSON.stringify`, as it would reformat everything and bloat the diff.
- FR first, following the house style of `fullDesc`:
  ```html
  <p><strong>Contexte :</strong> …</p><p>…</p><ul><li>…</li></ul>
  ```
  Use `<strong>` on key terms and technologies. French typography puts a space before `:`.
- EN: translate every text field (`year` context, `desc`, `fullDesc` with `Context:` and no space before the colon, `labels[].text` e.g. `IA` → `AI`, `links[].label`). Keep proper names and `tech` as is.
- Language-neutral fields must be **identical** in FR and EN: `id`, `filterTags`, `img`, `svg`, `gallery`, `video`, `labels[].color`, `links[].url`, `links[].type`, `study`, `wip`.
- New filter tag: add `<button class="fb" id="fb-<tag>" onclick="fp('<tag>',this)"></button>` inside `.filters` in `index.html`, plus the label under `portfolio.filters` in **both** `ui.json` files.

## 6. Check

Run `/check-content`, restricting the heavy-image report to the new files:

```sh
node .claude/skills/check-content/check-content.mjs --only assets/img/projects/<id>.jpg assets/img/projects/<id>_1.jpg
```

Fix every error caused by your change. Leave pre-existing warnings alone.

## 7. Hand over

- Show the FR and EN texts (`year`, `desc`, `fullDesc`) so the user can proofread them. The translation is yours, so they should check it.
- List the files added and modified.
- Tell them how to preview: `npx serve .`, then Portfolio → the new tile → modal, in both languages (FR/EN button).
- Propose a commit message, e.g. `Add <name> project`. **Don't commit.**
