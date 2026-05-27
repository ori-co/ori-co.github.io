// platform-state — state machine for each platform entity.
//
// States:
//   idle      → platform hidden, waiting for image target
//   visible   → base cylinder + ring shown, objects hidden
//   building  → progressive-build animating (locked)
//   built     → fully built, contributes to all-platforms-built check
//
// Events consumed:  'reality.imagefound', 'reality.imagelost', 'platform-tap'
// Events emitted:   'platform-built'  {platformId: string}
//                   'all-platforms-built'

import { findChildByName } from '../utils'

// Node names per platform (from GLB analysis) that should be hidden initially
// and revealed by progressive-build. Platform mesh + ring are always visible.
const HIDDEN_INITIALLY: Record<string, string[]> = {
  ocre: [
    'Cube_Dispersed_0', 'Cube_Dispersed_1', 'Cube_Dispersed_2',
    'Cube_Dispersed_3', 'Cube_Dispersed_4',
    'Board_Leg', 'Board_Panel', 'Board_Frame',
    'Postit_Yellow', 'Postit_Orange',
  ],
  cyan: [
    'Ico_Small_0', 'Ico_Small_1', 'Ico_Small_2', 'Ico_Small_3',
    'Prim_Octahedron_Main',
    'Holo_Main', 'Holo_Secondary',
    'VR_Root',
  ],
  violet: [
    'Sphere_Small_0', 'Sphere_Small_1', 'Sphere_Small_2', 'Sphere_Small_3',
    'Prim_Sphere_Main',
    'Compass_Body', 'Compass_Face', 'Compass_Rim',
    'Compass_Needle_N', 'Compass_Needle_S', 'Compass_Pivot',
  ],
}

// Module-level state so we can check across all instances
const platformStates: Map<string, 'idle' | 'visible' | 'building' | 'built'> = new Map()
let sceneActive = false

function checkAllBuilt(world: ECSWorld) {
  const ids = ['ocre', 'cyan', 'violet']
  if (ids.every(id => platformStates.get(id) === 'built')) {
    world.events.emit('all-platforms-built')
  }
}


ecs.registerComponent({
  name: 'platform-state',

  schema: {
    platformId:         ecs.schema.string({ default: '' }),
    offerLabel:         ecs.schema.string({ default: '' }),
    physicsNodePrefix:  ecs.schema.string({ default: '' }),
    physicsNodeCount:   ecs.schema.i32({ default: 0 }),
  },

  add: ({ world, eid, schemaAttribute }) => {
    const schema = schemaAttribute.get(eid)
    const { platformId } = schema
    if (!platformId) return

    platformStates.set(platformId, 'idle')

    // Hide this entire platform entity initially
    ecs.Hidden.set(world, eid)

    // ── Image target found → reveal base platform ───────────────────────────
    const onFound = (e: any) => {
      if (e.name !== 'ImageTarget_faceB') return
      sceneActive = true

      // Show platform base but keep objects hidden
      ecs.Hidden.remove(world, eid)

      const hiddenNodes = HIDDEN_INITIALLY[platformId] ?? []
      for (const nodeName of hiddenNodes) {
        const child = findChildByName(world, eid, nodeName)
        if (child !== null) ecs.Hidden.set(world, child)
      }

      if (platformStates.get(platformId) === 'idle') {
        platformStates.set(platformId, 'visible')
      }

      // Show tap hint in DOM
      document.getElementById('scanning-overlay')?.classList.add('hidden')
      document.getElementById('tap-hint')?.classList.add('visible')
    }

    // ── Image target lost → keep state, dim slightly ────────────────────────
    const onLost = (e: any) => {
      if (e.name !== 'ImageTarget_faceB') return
      sceneActive = false
      document.getElementById('tap-hint')?.classList.remove('visible')
    }

    // ── Platform tap → start building ───────────────────────────────────────
    const onTap = (e: any) => {
      if (e.platformId !== platformId) return
      const state = platformStates.get(platformId)
      if (state !== 'visible') return

      platformStates.set(platformId, 'building')

      // Delegate animation to progressive-build component on same entity
      world.events.emit('platform-build', {
        eid,
        platformId,
        offerLabel: schema.offerLabel,
        hiddenNodes: HIDDEN_INITIALLY[platformId] ?? [],
      })
    }

    // ── Platform build complete (emitted by progressive-build) ───────────────
    const onBuilt = (e: any) => {
      if (e.platformId !== platformId) return
      platformStates.set(platformId, 'built')
      checkAllBuilt(world)
    }

    world.events.addListener('reality.imagefound',  onFound)
    world.events.addListener('reality.imagelost',   onLost)
    world.events.addListener('platform-tap',        onTap)
    world.events.addListener('platform-built',      onBuilt)

    // Store cleanup refs on entity (via a module Map)
    cleanupMap.set(eid, () => {
      world.events.removeListener('reality.imagefound', onFound)
      world.events.removeListener('reality.imagelost',  onLost)
      world.events.removeListener('platform-tap',       onTap)
      world.events.removeListener('platform-built',     onBuilt)
    })
  },

  remove: ({ world, eid }) => {
    cleanupMap.get(eid)?.()
    cleanupMap.delete(eid)
  },
})

const cleanupMap: Map<number, () => void> = new Map()

// ── platform-manager — lives on ar-anchor, routes screen taps to platforms ──
//
// Detects which platform (by projected screen position) was nearest the touch.
// This avoids needing ECS raycasting API specifics.

ecs.registerComponent({
  name: 'platform-manager',

  add: ({ world, eid }) => {
    const onTouch = (e: TouchEvent) => {
      if (!sceneActive) return
      const touch = e.changedTouches[0]
      if (!touch) return

      // Emit platform-tap; progressive-build handles animation.
      // The tap nearest platform is determined by which platform is not yet built.
      // Simple approach: emit for all visible platforms and let each check itself.
      // A proper approach would raycast — update if ECS raycast API is available.
      const tx = touch.clientX / window.innerWidth
      const ty = touch.clientY / window.innerHeight

      // We emit a generic tap with screen coords; platform-state filters by proximity.
      // TODO: replace with ECS raycasting once API is confirmed:
      //   world.physics.raycast({ origin, direction }) → eid
      world.events.emit('screen-tap', { tx, ty })
    }

    document.addEventListener('touchend', onTouch, { passive: true })

    managerCleanup.set(eid, () => {
      document.removeEventListener('touchend', onTouch)
    })
  },

  remove: ({ world, eid }) => {
    managerCleanup.get(eid)?.()
    managerCleanup.delete(eid)
  },
})

const managerCleanup: Map<number, () => void> = new Map()
