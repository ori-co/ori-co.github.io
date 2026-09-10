---
name: ardemo-deploy
description: Check, build and deploy the WebAR demo. Runs pre-flight checks on ardemo-studio (image targets, scene, assets, Version#), builds it, replaces ardemo/ with the fresh build and proposes a commit message. Overwrites ardemo/, so only run on explicit request.
disable-model-invocation: true
argument-hint: "[Version# label, e.g. \"V1.8 - Platform animation\"]"
allowed-tools: Bash(node .claude/skills/ardemo-deploy/preflight.mjs*)
---

# ardemo-deploy

Deploys `ardemo-studio/` to `ardemo/`, which GitHub Pages serves at <https://ori-co.github.io/ardemo/>. Background: [ardemo-studio/README.md](../../../ardemo-studio/README.md#build--deploy).

**Never commit or push.** The last step proposes a commit message only.

Label given by the user: `$ARGUMENTS`

## 0. Version# label (only if a label was given above)

1. Ask the user to **save the scene in Studio** first. Otherwise their unsaved changes and this edit would conflict.
2. Set the label. The script changes only the `Version#` text in `src/.expanse.json` and aborts if the file isn't in the expected format:
   ```sh
   node .claude/skills/ardemo-deploy/set-version.mjs "<label>"
   ```
3. Tell the user that if Studio is open, it may still show the old text until the project is reloaded. Saving from that stale state could bring the old label back. How Studio handles external edits hasn't been verified, so ask them to check the label in Studio after the deploy.

If no label was given, skip this step. The pre-flight will flag a Version# that hasn't changed.

## 1. Pre-flight

```sh
node .claude/skills/ardemo-deploy/preflight.mjs
```

Read-only. It checks that:

- every image target required by `src/app.js` exists, along with its 4 images;
- each scene Image Target entity tracks a target that `app.js` actually loads (the names must match, or nothing is detected and no error is shown);
- the GLB files referenced by the scene exist, and the scene's custom components are registered in `src/`;
- `node_modules/` is installed;
- the `Version#` text is not already the deployed one (looked up in `ardemo/bundle.js`).

It also warns about image targets and assets that are unused but would still be deployed.

What to do next:

- **Any ERROR** → stop. Explain each error to the user and how to fix it. Scene issues (target name, entities) are fixed **by the user in 8thWall Studio**: don't hand-edit `src/.expanse.json` (the only exception is the Version# text, via `set-version.mjs`). Only fix `src/app.js` yourself if the user agrees.
- **"Version# … is already the deployed version"** → ask the user (AskUserQuestion) for a new label (then run step 0 and rerun the pre-flight), or deploy anyway.
- **Other warnings** → list them briefly and continue unless the user objects.
- Remind the user to **save the scene in Studio** before the build: the build reads `src/.expanse.json` from disk.

## 2. Build

From the repo root (Bash tool, POSIX). webpack resolves paths from the current directory, so the build must run inside `ardemo-studio/`:

```sh
rm -rf ardemo-studio/dist
cd ardemo-studio && npm run build
```

`dist/` is removed first because the build never cleans it, and old targets or assets would pile up and get deployed. If the build fails, show the relevant part of the error, stop and don't touch `ardemo/`.

## 3. Replace `ardemo/`

`ardemo/` contains nothing but build output:

```sh
rm -rf ardemo && cp -r ardemo-studio/dist ardemo
```

## 4. Verify

```sh
diff -rq ardemo-studio/dist ardemo                  # must print nothing
git status --short ardemo | cut -c1-2 | sort | uniq -c   # summary: M modified, D deleted, ?? new
```

Also check that the `Version#` text shown by the pre-flight appears in `ardemo/bundle.js`.

## 5. Hand over to the user

Give a short summary: version deployed, files changed in `ardemo/` (counts), warnings you skipped. Then:

- Propose a commit message. The repo convention is the Version# text, e.g. `V1.7 - Full card target`. Remind the user to commit `ardemo-studio/` and `ardemo/` together.
- After the push: open <https://ori-co.github.io/ardemo/> **on the real device** (Samsung Galaxy A06) and check the version number on screen. If the old one still shows, it is the GitHub Pages / browser cache: wait a minute and reload.
