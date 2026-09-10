#!/usr/bin/env node
// Lints the website content: FR/EN parity, colours, referenced files, portfolio filters.
// Usage (from anywhere): node .claude/skills/check-content/check-content.mjs [--heavy] [--only <path>…]
//   --heavy   list every image over 1 MB (default: one summary line)
//   --only    report heavy images only for these paths (e.g. the images you just added)
// Exit code 1 if there is at least one error.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const LANGS = ['fr', 'en']
const FILES = ['ui', 'profile', 'offres', 'projects']
const COLORS = ['ocre', 'cyan', 'violet']
const LINK_TYPES = ['web', 'youtube', 'github']
const REQUIRED_PROJECT_FIELDS = ['id', 'filterTags', 'img', 'svg', 'year', 'name', 'desc', 'labels']
// Keys whose value must be identical in every language (paths, ids, colours, flags…)
const NEUTRAL_KEYS = new Set([
  'id', 'filterTags', 'img', 'svg', 'gallery', 'video', 'color', 'url', 'type',
  'study', 'wip', 'variant', 'current', 'edu', 'linkedin', 'formspreeId', 'initials', 'num',
])
const HEAVY_BYTES = 1024 * 1024

const args = process.argv.slice(2)
const listHeavy = args.includes('--heavy')
const onlyIdx = args.indexOf('--only')
const only = onlyIdx >= 0 ? new Set(args.slice(onlyIdx + 1).map(p => p.replace(/\\/g, '/'))) : null

const errors = []
const warnings = []
const err = msg => errors.push(msg)
const warn = msg => warnings.push(msg)
const read = rel => readFileSync(join(ROOT, rel), 'utf8')

function report() {
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`
  console.log(`check-content: ${plural(errors.length, 'error')}, ${plural(warnings.length, 'warning')}`)
  errors.forEach(m => console.log(`ERROR  ${m}`))
  warnings.forEach(m => console.log(`WARN   ${m}`))
  process.exit(errors.length ? 1 : 0)
}

// ── Load ──────────────────────────────────────────────────────────────
const data = {}
for (const lang of LANGS) {
  data[lang] = {}
  for (const f of FILES) {
    const rel = `assets/data/${lang}/${f}.json`
    try { data[lang][f] = JSON.parse(read(rel)) } catch (e) { err(`${rel}: ${e.message}`) }
  }
}
if (errors.length) report()
const indexHtml = read('index.html')
const css = read('assets/css/style.css')

// ── 1. FR/EN parity ───────────────────────────────────────────────────
const kind = v => (Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v)
const itemLabel = (v, i) => (v && typeof v === 'object' && v.id ? `[${i}:${v.id}]` : `[${i}]`)

function compare(fr, en, path) {
  if (kind(fr) !== kind(en)) return err(`${path}: type differs (fr: ${kind(fr)}, en: ${kind(en)})`)
  if (kind(fr) === 'array') {
    if (fr.length !== en.length) err(`${path}: ${fr.length} items in fr, ${en.length} in en`)
    for (let i = 0; i < Math.min(fr.length, en.length); i++) compare(fr[i], en[i], path + itemLabel(fr[i], i))
  } else if (kind(fr) === 'object') {
    for (const k of new Set([...Object.keys(fr), ...Object.keys(en)])) {
      const p = `${path}.${k}`
      if (!(k in fr)) err(`${p}: missing in fr`)
      else if (!(k in en)) err(`${p}: missing in en`)
      else if (NEUTRAL_KEYS.has(k) && JSON.stringify(fr[k]) !== JSON.stringify(en[k]))
        err(`${p}: must be identical in fr and en (fr: ${JSON.stringify(fr[k])}, en: ${JSON.stringify(en[k])})`)
      else compare(fr[k], en[k], p)
    }
  }
}
for (const f of FILES) compare(data.fr[f], data.en[f], f)

// ── 2. Colours ────────────────────────────────────────────────────────
for (const c of COLORS) if (!new RegExp(`--${c}\\s*:`).test(css)) err(`style.css: CSS variable --${c} is not defined`)

function walk(v, path, visit) {
  visit(v, path)
  if (Array.isArray(v)) v.forEach((x, i) => walk(x, path + itemLabel(x, i), visit))
  else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => walk(x, `${path}.${k}`, visit))
}
for (const lang of LANGS) for (const f of FILES) {
  walk(data[lang][f], `${lang}/${f}`, (v, path) => {
    if (path.endsWith('.color') && !COLORS.includes(v)) err(`${path}: "${v}" is not a valid color (${COLORS.join(' | ')})`)
  })
}

// ── 3. Projects ───────────────────────────────────────────────────────
const projects = data.fr.projects
const seen = new Set()
projects.forEach((p, i) => {
  const where = `projects${itemLabel(p, i)}`
  for (const f of REQUIRED_PROJECT_FIELDS) if (p[f] === undefined || p[f] === '') err(`${where}: missing required field "${f}"`)
  if (seen.has(p.id)) err(`${where}: duplicate id "${p.id}"`)
  seen.add(p.id)
  if (p.id && !/^[a-z0-9-]+$/.test(p.id)) warn(`${where}: id should be kebab-case (it is used inside an onclick attribute)`)
  for (const l of p.links || []) if (l.type && !LINK_TYPES.includes(l.type)) warn(`${where}: link type "${l.type}" has no icon (${LINK_TYPES.join(' | ')})`)
})
for (const v of data.fr.profile.about?.values || [])
  if (!new RegExp(`\\.${v.variant}\\b`).test(css)) warn(`profile.about.values: variant "${v.variant}" has no CSS class in style.css`)

// ── 4. Portfolio filters ──────────────────────────────────────────────
const buttons = new Set([...indexHtml.matchAll(/id="fb-([\w-]+)"/g)].map(m => m[1]))
const usedTags = new Set(projects.flatMap(p => p.filterTags || []))
for (const lang of LANGS) {
  const labels = data[lang].ui.portfolio?.filters || {}
  for (const b of buttons) if (!labels[b]) err(`${lang}/ui.portfolio.filters: no label for filter button "fb-${b}" (button would be empty)`)
  for (const k of Object.keys(labels)) if (!buttons.has(k)) warn(`${lang}/ui.portfolio.filters.${k}: no matching button id="fb-${k}" in index.html`)
}
for (const t of usedTags) if (!buttons.has(t)) warn(`filterTag "${t}" is used by a project but has no filter button in index.html`)
for (const b of buttons) if (b !== 'all' && !usedTags.has(b)) warn(`filter "fb-${b}" matches no project (clicking it shows an empty grid)`)

// ── 5. Referenced files ───────────────────────────────────────────────
const refs = new Map() // path → first place it is referenced
const addRef = (p, where) => {
  let clean = p.split(/[?#]/)[0]
  try { clean = decodeURI(clean) } catch {}
  if (!refs.has(clean)) refs.set(clean, where)
}
const EMBEDDED = /(?:src|href)=["'](assets\/[^"']+)["']/g
for (const lang of LANGS) for (const f of FILES) {
  walk(data[lang][f], `${lang}/${f}`, (v, path) => {
    if (typeof v !== 'string') return
    if (v.startsWith('assets/')) addRef(v, path)
    for (const m of v.matchAll(EMBEDDED)) addRef(m[1], path)
  })
}
for (const m of indexHtml.matchAll(EMBEDDED)) addRef(m[1], 'index.html')

// Resolve with exact case: Windows is case-insensitive, GitHub Pages is not.
function actualCase(rel) {
  let dir = ROOT
  const out = []
  for (const seg of rel.split('/')) {
    let entries
    try { entries = readdirSync(dir) } catch { return null }
    const hit = entries.includes(seg) ? seg : entries.find(e => e.toLowerCase() === seg.toLowerCase())
    if (!hit) return null
    out.push(hit)
    dir = join(dir, hit)
  }
  return out.join('/')
}

const existing = []
const heavy = []
const mb = bytes => `${(bytes / HEAVY_BYTES).toFixed(1)} MB`
for (const [p, where] of refs) {
  const actual = actualCase(p)
  if (!actual) err(`${where}: file not found "${p}"`)
  else if (actual !== p) err(`${where}: case mismatch "${p}" (on disk: "${actual}"), breaks on GitHub Pages`)
  else {
    existing.push(p)
    const size = statSync(join(ROOT, p)).size
    if (size > HEAVY_BYTES && /\.(png|jpe?g|webp|gif)$/i.test(p) && (!only || only.has(p))) heavy.push({ p, where, size })
  }
}

heavy.sort((a, b) => b.size - a.size)
if (listHeavy || only) heavy.forEach(h => warn(`${h.where}: heavy image "${h.p}" (${mb(h.size)})`))
else if (heavy.length) {
  const total = heavy.reduce((s, h) => s + h.size, 0)
  const top = heavy.slice(0, 3).map(h => `${h.p} (${mb(h.size)})`).join(', ')
  warn(`${heavy.length} images over 1 MB (${mb(total)} in total). Largest: ${top}. Run with --heavy for the full list`)
}

const git = spawnSync('git', ['check-ignore', '--stdin'], { cwd: ROOT, input: existing.join('\n'), encoding: 'utf8' })
if (git.error || git.status > 1) warn('git check-ignore failed: skipped the git-ignored check')
else for (const p of git.stdout.split('\n').filter(Boolean))
  err(`${refs.get(p)}: "${p}" is git-ignored, so it won't be deployed`)

report()
