#!/usr/bin/env node
// Sets the text of the "Version#" entity in ardemo-studio/src/.expanse.json. Touches nothing else.
// Usage (from anywhere): node .claude/skills/ardemo-deploy/set-version.mjs "V1.8 - What changed"

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const SCENE = join(ROOT, 'ardemo-studio', 'src', '.expanse.json')

const fail = msg => { console.error(`ERROR  ${msg}`); process.exit(1) }

const label = process.argv.slice(2).join(' ').trim()
if (!label) fail('usage: set-version.mjs "<label>"')

const raw = readFileSync(SCENE, 'utf8')
const scene = JSON.parse(raw)
// Studio writes the file as JSON.stringify(…, null, 2). If that ever changes, abort rather than reformat the whole scene.
const serialize = s => JSON.stringify(s, null, 2) + (raw.endsWith('\n') ? '\n' : '')
if (serialize(scene) !== raw) fail('.expanse.json is not in the expected format: edit Version# in Studio instead')

const matches = Object.values(scene.objects || {}).filter(e => e.name === 'Version#' && e.ui)
if (matches.length !== 1) fail(`expected exactly one "Version#" UI entity, found ${matches.length}`)

const before = matches[0].ui.text
if (before === label) { console.log(`Version# is already "${label}"`); process.exit(0) }
matches[0].ui.text = label
writeFileSync(SCENE, serialize(scene))
console.log(`Version#: "${before}" → "${label}"`)
