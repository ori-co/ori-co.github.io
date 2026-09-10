---
name: check-content
description: Lint the website content (assets/data FR/EN JSON, index.html filters, referenced images). Checks FR/EN parity, valid colours, missing or wrongly-cased files, git-ignored files, and portfolio filters. Use after any edit to assets/data/, to the portfolio filters in index.html, or after adding/renaming images, and before proposing a commit message.
allowed-tools: Bash(node .claude/skills/check-content/check-content.mjs*)
---

# check-content

Run from the repo root:

```sh
node .claude/skills/check-content/check-content.mjs
```

Options:

- `--heavy`: list every referenced image over 1 MB. By default they are collapsed into one summary line.
- `--only <path> [<path>…]`: report heavy images only for the given paths (e.g. the images you just added).

Exit code `1` means at least one error.

## What it checks

| Check | Level |
|---|---|
| JSON syntax of the 8 data files | error |
| FR and EN have the same keys and the same array lengths | error |
| Language-neutral fields are identical in FR and EN (`id`, `filterTags`, `img`, `svg`, `gallery`, `video`, `color`, `url`, `type`, `study`, `wip`, `variant`, `current`, `edu`, `linkedin`, `formspreeId`, `initials`, `num`) | error |
| Every `color` is `ocre`, `cyan` or `violet`, and defined in `style.css` | error |
| Projects: required fields, unique `id` | error |
| Every `assets/…` path (JSON values, `src`/`href` inside HTML strings, `index.html`) exists **with the exact case**. GitHub Pages is case-sensitive, Windows is not | error |
| No referenced file is git-ignored (e.g. `assets/video/`), since it wouldn't be deployed | error |
| Each filter button `fb-<tag>` has a label in both `ui.json` | error |
| Filter labels without a button, filterTags without a button, buttons matching no project | warning |
| Kebab-case project ids, link types with an icon, `values[].variant` CSS classes | warning |
| Images over 1 MB | warning |

## How to act on the results

- **Errors**: fix them if they come from your own change. If they were already there, report them to the user instead of silently fixing unrelated content.
- **Warnings**: mention the relevant ones to the user in one or two lines, and don't fix them unasked. Known warnings at the time of writing: the `fb-education` filter matches no project, and many images are over 1 MB.
- The script is read-only and never modifies files.
