// progressive-build — animates platform objects appearing in sequence on tap.
//
// Listens for 'platform-build' {eid, platformId, offerLabel, hiddenNodes}.
// Reveals child entities one-by-one with a scale 0→1 tween, then emits
// 'platform-built' {platformId}.
//
// Scale animation uses requestAnimationFrame with a simple ease-out curve
// (no dependency on Three.js or GSAP — pure ECS + DOM timing).

import { findChildByName } from '../utils'

// Build sequences per platform (order of reveal, grouped by visual priority)
const BUILD_SEQUENCES: Record<string, string[][]> = {
  ocre: [
    // Step 1: the board structure
    ['Board_Leg', 'Board_Panel', 'Board_Frame'],
    // Step 2: post-its pop in
    ['Postit_Yellow', 'Postit_Orange'],
    // Step 3: dispersed cubes (physics objects)
    ['Cube_Dispersed_0', 'Cube_Dispersed_1', 'Cube_Dispersed_2',
     'Cube_Dispersed_3', 'Cube_Dispersed_4'],
  ],
  cyan: [
    // Step 1: VR headset appears
    ['VR_Root'],
    // Step 2: octahedron + holo planes
    ['Prim_Octahedron_Main', 'Holo_Main', 'Holo_Secondary'],
    // Step 3: physics icospheres
    ['Ico_Small_0', 'Ico_Small_1', 'Ico_Small_2', 'Ico_Small_3'],
  ],
  violet: [
    // Step 1: compass
    ['Compass_Body', 'Compass_Face', 'Compass_Rim',
     'Compass_Needle_N', 'Compass_Needle_S', 'Compass_Pivot'],
    // Step 2: primary sphere
    ['Prim_Sphere_Main'],
    // Step 3: small physics spheres
    ['Sphere_Small_0', 'Sphere_Small_1', 'Sphere_Small_2', 'Sphere_Small_3'],
  ],
}

const STEP_DELAY_MS = 280   // delay between each step
const TWEEN_DURATION = 220  // ms for each scale 0→1 tween

// Ease-out cubic
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// Animate scale of an entity from 0 → 1 over TWEEN_DURATION ms
function tweenIn(world: ECSWorld, eid: number): Promise<void> {
  return new Promise(resolve => {
    const start = performance.now()
    const step = () => {
      const t = Math.min((performance.now() - start) / TWEEN_DURATION, 1)
      const s = easeOut(t)
      world.setScale(eid, { x: s, y: s, z: s })
      if (t < 1) {
        requestAnimationFrame(step)
      } else {
        resolve()
      }
    }
    // Start hidden (scale 0), make visible
    ecs.Hidden.remove(world, eid)
    world.setScale(eid, { x: 0, y: 0, z: 0 })
    requestAnimationFrame(step)
  })
}

async function runBuildSequence(
  world: ECSWorld,
  eid: number,
  platformId: string,
  offerLabel: string,
) {
  const steps = BUILD_SEQUENCES[platformId]
  if (!steps) return

  for (const group of steps) {
    // Reveal all entities in this group simultaneously
    await Promise.all(
      group.map(nodeName => {
        const child = findChildByName(world, eid, nodeName)
        if (child === null) return Promise.resolve()
        return tweenIn(world, child)
      })
    )
    // Wait before next step
    await delay(STEP_DELAY_MS)
  }

  // Show label in DOM overlay
  showPlatformLabel(platformId, offerLabel)

  // Notify state machine
  world.events.emit('platform-built', { platformId })
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── Label DOM overlay (one per platform, positioned at top of screen) ────────
const LABEL_COLORS: Record<string, string> = {
  ocre:   '#C8A86C',
  cyan:   '#5BC8C0',
  violet: '#9B8EC4',
}

function showPlatformLabel(platformId: string, text: string) {
  const existing = document.getElementById(`label-${platformId}`)
  if (existing) return

  const el = document.createElement('div')
  el.id = `label-${platformId}`
  el.style.cssText = `
    position: fixed;
    top: 72px;
    left: 50%;
    transform: translateX(-50%);
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${LABEL_COLORS[platformId] ?? '#DDDBD6'};
    background: rgba(28,30,34,0.75);
    padding: 5px 14px;
    border-radius: 20px;
    border: 1px solid ${LABEL_COLORS[platformId] ?? 'rgba(221,219,214,0.2)'}44;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    opacity: 0;
    transition: opacity 0.4s;
    pointer-events: none;
    z-index: 15;
    white-space: nowrap;
  `
  el.textContent = text
  document.body.appendChild(el)

  requestAnimationFrame(() => {
    el.style.opacity = '1'
  })

  // Auto-hide after 3s
  setTimeout(() => {
    el.style.opacity = '0'
    setTimeout(() => el.remove(), 400)
  }, 3000)
}

ecs.registerComponent({
  name: 'progressive-build',

  add: ({ world, eid }) => {
    const onBuild = (e: any) => {
      if (e.eid !== eid) return
      runBuildSequence(world, eid, e.platformId, e.offerLabel)
    }

    world.events.addListener('platform-build', onBuild)

    pbCleanup.set(eid, () => {
      world.events.removeListener('platform-build', onBuild)
    })
  },

  remove: ({ world, eid }) => {
    pbCleanup.get(eid)?.()
    pbCleanup.delete(eid)
  },
})

const pbCleanup: Map<number, () => void> = new Map()
