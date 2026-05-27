// connection-line — draws animated dashed connections between the 3 platform
// centres once all-platforms-built fires.
//
// Implementation: 3 pairs of thin cylinder segments positioned between each
// platform centre at world-space coordinates, then animated via opacity pulse
// and a secondary "travelling dot" entity on each line.
//
// Platform world positions (Blender units, before scale-root 0.12):
//   ocre   [  0,  0, -1.8 ]
//   cyan   [ -1.8, 0,  1.2 ]
//   violet [  1.8, 0,  1.2 ]
// Y is adjusted to hover slightly above the platform cylinder top (~0.25 BU).

// We represent the three connections as pairs
interface LineConfig {
  fromId: string
  toId: string
  // midpoint world position (Blender units, parent-relative)
  midX: number; midY: number; midZ: number
  // rotation (euler Y in radians) to point the cylinder from→to
  rotY: number
  // length in Blender units
  length: number
}

// Pre-calculated from GLB node positions (platforms sit at Y=0, top ~0.25 BU high)
const Y_HOVER = 0.35

const LINE_CONFIGS: LineConfig[] = [
  // ocre [0,Y,-1.8] ↔ cyan [-1.8,Y,1.2]
  {
    fromId: 'platform-ocre', toId: 'platform-cyan',
    midX: -0.9, midY: Y_HOVER, midZ: -0.3,
    rotY: Math.atan2(-1.8 - 0, 1.2 - (-1.8)),  // ≈ 1.107 rad
    length: Math.sqrt(1.8 * 1.8 + 3 * 3),       // ≈ 3.50
  },
  // ocre [0,Y,-1.8] ↔ violet [1.8,Y,1.2]
  {
    fromId: 'platform-ocre', toId: 'platform-violet',
    midX: 0.9, midY: Y_HOVER, midZ: -0.3,
    rotY: Math.atan2(1.8 - 0, 1.2 - (-1.8)),    // ≈ -1.107 rad (mirror)
    length: Math.sqrt(1.8 * 1.8 + 3 * 3),
  },
  // cyan [-1.8,Y,1.2] ↔ violet [1.8,Y,1.2]
  {
    fromId: 'platform-cyan', toId: 'platform-violet',
    midX: 0, midY: Y_HOVER, midZ: 1.2,
    rotY: 0,
    length: 3.6,
  },
]

const DASH_COUNT = 8          // number of dash segments per connection
const DASH_RADIUS = 0.012     // cylinder radius (Blender units)
const SEGMENT_FRACTION = 0.5  // fraction of spacing that is solid vs gap

ecs.registerComponent({
  name: 'connection-line',

  add: ({ world, eid }) => {
    // Start hidden — reveal on all-platforms-built
    ecs.Hidden.set(world, eid)

    const onAllBuilt = () => {
      ecs.Hidden.remove(world, eid)

      // Spawn dash entities as children of the connection entity
      for (const cfg of LINE_CONFIGS) {
        spawnDashedLine(world, eid, cfg)
      }

      // Animate opacity pulse on this entity (all children inherit)
      startPulse(world, eid)
    }

    world.events.addListener('all-platforms-built', onAllBuilt)

    lineCleanup.set(eid, () => {
      world.events.removeListener('all-platforms-built', onAllBuilt)
    })
  },

  remove: ({ world, eid }) => {
    lineCleanup.get(eid)?.()
    lineCleanup.delete(eid)
  },
})

function spawnDashedLine(world: ECSWorld, parentEid: number, cfg: LineConfig) {
  const spacing = cfg.length / DASH_COUNT
  const dashLen  = spacing * SEGMENT_FRACTION

  for (let i = 0; i < DASH_COUNT; i++) {
    // Position along the line from 'from' to 'to'
    const t = (i + 0.5) / DASH_COUNT   // centre of this dash segment
    const dashEid = world.createEntity()
    world.setParent(dashEid, parentEid)

    // Interpolate position between from-centre and to-centre
    // from: treat as offset from midpoint using negative half-length
    const offsetX = Math.sin(cfg.rotY) * (t - 0.5) * cfg.length
    const offsetZ = Math.cos(cfg.rotY) * (t - 0.5) * cfg.length
    world.setPosition(dashEid, {
      x: cfg.midX + offsetX,
      y: cfg.midY,
      z: cfg.midZ + offsetZ,
    })

    // Thin cylinder for the dash
    ecs.CylinderGeometry.set(world, dashEid, {
      radiusTop:    DASH_RADIUS,
      radiusBottom: DASH_RADIUS,
      height:       dashLen,
      segments:     6,
    })

    // Colour: alternate between the two platform colours
    const isOdd = i % 2 === 0
    const [r, g, b] = isOdd
      ? [0.36, 0.78, 0.75]   // cyan-ish
      : [0.55, 0.44, 0.80]   // violet-ish
    ecs.Material.set(world, dashEid, { r, g, b, a: 0.7 })

    // Rotate cylinder to align along the line (X axis = length by default in ECS)
    // TODO: verify cylinder orientation in @8thwall/ecs; may need Z-axis rotation
    ;(world as any).setRotation?.(dashEid, { x: 0, y: cfg.rotY, z: Math.PI / 2 })
  }
}

// Gentle opacity pulse — animates the Material alpha on the connection entity's
// children using a sine wave. Uses requestAnimationFrame.
function startPulse(world: ECSWorld, eid: number) {
  const baseAlpha = 0.7
  const pulseAmp  = 0.25
  const pulseHz   = 0.6   // cycles per second

  let running = true
  const tick = () => {
    if (!running) return
    const a = baseAlpha + Math.sin(performance.now() * 0.001 * pulseHz * Math.PI * 2) * pulseAmp
    // Apply to all child entities
    const children = world.getChildren(eid)
    for (const c of children) {
      ecs.Material.set(world, c, { a: Math.max(0.1, a) })
    }
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)

  pulseStops.set(eid, () => { running = false })
}

const lineCleanup: Map<number, () => void> = new Map()
const pulseStops:  Map<number, () => void> = new Map()
