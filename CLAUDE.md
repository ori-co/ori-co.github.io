# CLAUDE.md

Project docs: [README.md](README.md) (website) and [ardemo-studio/README.md](ardemo-studio/README.md) (WebAR demo). Read the relevant one before changing anything.

## Rules

- **Never commit or push.** When work is done, propose a commit message only.
- **Website = vanilla HTML/CSS/JS, no build step.** Don't add frameworks, bundlers or npm dependencies at the root.
- **Content is bilingual.** Any change in `assets/data/fr/` must be mirrored in `assets/data/en/` (and vice versa).
- JSON `color` values are CSS variable names: only `ocre`, `cyan`, `violet`.
- **Never edit `ardemo/` by hand.** It is a copy of `ardemo-studio/dist/`, see "Build & deploy" in the AR README.
- `ardemo-studio/src/.expanse.json` is written by 8thWall Studio. Prefer asking the user to change the scene in Studio over hand-editing it. Exception: the `Version#` label, via `.claude/skills/ardemo-deploy/set-version.mjs`.
- Before writing 8thWall ECS code, read the "ECS gotchas" table in [ardemo-studio/README.md](ardemo-studio/README.md#ecs-gotchas).
- AR work follows [ardemo-studio/TODO.md](ardemo-studio/TODO.md) one step at a time, validated on the real device (Samsung Galaxy A06).
- The user communicates in French. Project docs (README files, this file) are in English.

## Project skills (`.claude/skills/`)

- `/check-content`: lint the FR/EN data, image paths and filters. Run it after any content change.
- `/add-project`: add a portfolio project (images, SVG, FR + EN entries).
- `/ardemo-deploy`: pre-flight checks, build and copy to `ardemo/`. Only on explicit request.
