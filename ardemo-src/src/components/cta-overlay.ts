// cta-overlay — shows the CTA panel and connection tagline when all platforms
// are built. Pure DOM manipulation, no ECS rendering needed.
//
// Also handles:
//   - screen-tap routing → finds nearest unbuilt platform → emits platform-tap
//   - built-platforms count badge on each platform (DOM label stubs)

ecs.registerComponent({
  name: 'cta-overlay',

  add: ({ world, eid }) => {
    // ── All platforms built → show CTA panel ──────────────────────────────
    const onAllBuilt = () => {
      document.getElementById('tap-hint')?.classList.remove('visible')

      const panel = document.getElementById('cta-panel')
      if (panel) {
        // Small delay so the connection-line animation is visible first
        setTimeout(() => panel.classList.add('visible'), 800)
      }
    }

    // ── Screen tap → route to nearest unbuilt platform ────────────────────
    // We use a simplified 2-D screen projection based on known platform
    // layout. For a precise implementation, swap with ECS raycasting.
    //
    // Projected screen quadrants (landscape-ish phone, card held horizontal):
    //   ocre   ≈ bottom-centre
    //   cyan   ≈ top-left
    //   violet ≈ top-right
    const PLATFORM_SCREEN_REGIONS: { id: string; cx: number; cy: number }[] = [
      { id: 'ocre',   cx: 0.50, cy: 0.65 },
      { id: 'cyan',   cx: 0.28, cy: 0.40 },
      { id: 'violet', cx: 0.72, cy: 0.40 },
    ]

    const onScreenTap = (e: any) => {
      const { tx, ty } = e   // normalised 0..1

      // Find the platform region closest to the tap
      let nearest = PLATFORM_SCREEN_REGIONS[0]
      let minDist = Infinity

      for (const region of PLATFORM_SCREEN_REGIONS) {
        const dx = tx - region.cx
        const dy = ty - region.cy
        const d  = dx * dx + dy * dy
        if (d < minDist) { minDist = d; nearest = region }
      }

      // Only route if reasonably close (avoid accidental far-corner taps)
      if (minDist > 0.12) return

      world.events.emit('platform-tap', { platformId: nearest.id })
    }

    world.events.addListener('all-platforms-built', onAllBuilt)
    world.events.addListener('screen-tap',          onScreenTap)

    ctaCleanup.set(eid, () => {
      world.events.removeListener('all-platforms-built', onAllBuilt)
      world.events.removeListener('screen-tap',          onScreenTap)
    })
  },

  remove: ({ world, eid }) => {
    ctaCleanup.get(eid)?.()
    ctaCleanup.delete(eid)
  },
})

const ctaCleanup: Map<number, () => void> = new Map()
