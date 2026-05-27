// gyro-physics — maps device tilt to lateral impulses on physics objects,
// constrained to a cylinder above their platform.
//
// DeviceOrientationEvent.beta  = tilt front/back  (-180..180)
// DeviceOrientationEvent.gamma = tilt left/right  (-90..90)
//
// Applied per-frame as a constant force (not impulse) so objects drift
// lazily with gravity and bounce back via cylinder boundary.
//
// Cylinder constraint: if object's XZ distance from platform center > radius,
// apply an inward velocity correction each frame.

import { findChildByName } from '../utils'

interface GyroState {
  beta: number
  gamma: number
  physicsEids: number[]
  cylinderCx: number
  cylinderCz: number
  cylinderR: number
  active: boolean
}

const gyroStates: Map<number, GyroState> = new Map()

// Shared orientation listener — one instance updates all gyroStates
let orientationListening = false
let lastBeta = 0
let lastGamma = 0

function startOrientationListener() {
  if (orientationListening) return
  orientationListening = true

  window.addEventListener('deviceorientation', (e: DeviceOrientationEvent) => {
    lastBeta  = e.beta  ?? 0
    lastGamma = e.gamma ?? 0
  }, { passive: true })
}

ecs.registerComponent({
  name: 'gyro-physics',

  schema: {
    cylinderRadius:  ecs.schema.f32({ default: 0.7 }),
    cylinderCenterX: ecs.schema.f32({ default: 0 }),
    cylinderCenterZ: ecs.schema.f32({ default: 0 }),
  },

  add: ({ world, eid, schemaAttribute }) => {
    const s = schemaAttribute.get(eid)

    gyroStates.set(eid, {
      beta: 0, gamma: 0,
      physicsEids: [],   // resolved on first tick (GLB may not be loaded yet)
      cylinderCx: s.cylinderCenterX,
      cylinderCz: s.cylinderCenterZ,
      cylinderR:  s.cylinderRadius,
      active: false,
    })

    startOrientationListener()

    // Only apply physics once the platform has been built
    world.events.addListener('platform-built', (e: any) => {
      const state = gyroStates.get(eid)
      if (!state) return

      // Find physics entities now (model should be fully loaded)
      // We read physicsNodePrefix from expanse via schemaAttribute
      // TODO: physicsNodePrefix + physicsNodeCount are on platform-state, not gyro-physics.
      // A simple workaround: scan all children and collect those with Collider.
      const children = world.getChildren(eid)
      state.physicsEids = children.filter(c => ecs.Collider.has(world, c))
      state.active = true
    })
  },

  tick: ({ world, eid }) => {
    const state = gyroStates.get(eid)
    if (!state?.active || state.physicsEids.length === 0) return

    // Normalise device tilt to force vector (-1..1 range)
    const fx = (lastGamma / 45) * 0.04   // left/right → X force
    const fz = (lastBeta  / 45) * 0.04   // front/back → Z force

    for (const pEid of state.physicsEids) {
      // Apply lateral impulse via physics API
      // TODO: replace with exact API once @8thwall/ecs types are confirmed
      world.physics?.applyImpulse(pEid, { x: fx, y: 0, z: fz })

      // Cylinder boundary: push objects back if outside radius
      // We read position via world.getPosition if available
      const pos = (world as any).getPosition?.(pEid)
      if (!pos) continue

      const dx = pos.x - state.cylinderCx
      const dz = pos.z - state.cylinderCz
      const dist = Math.sqrt(dx * dx + dz * dz)

      if (dist > state.cylinderR) {
        // Inward correction impulse proportional to overshoot
        const overshoot = dist - state.cylinderR
        const nx = dx / dist
        const nz = dz / dist
        world.physics?.applyImpulse(pEid, {
          x: -nx * overshoot * 0.08,
          y: 0,
          z: -nz * overshoot * 0.08,
        })
      }
    }
  },

  remove: ({ world, eid }) => {
    gyroStates.delete(eid)
  },
})
