import type {Eid} from '@8thwall/ecs'

// Counts the platforms opened through disc-reveal. When every registered platform
// has been opened at least once, tells the HTML overlay (index.html) with
// 'ar-all-platforms-revealed' on window. Fires once.
const registered = new Set<Eid>()
const revealed = new Set<Eid>()
let done = false

export const registerPlatform = (eid: Eid) => {
  registered.add(eid)
}

export const platformRevealed = (eid: Eid) => {
  if (done || revealed.has(eid)) return
  revealed.add(eid)
  console.log(`[platform-progress] ${revealed.size}/${registered.size}`)
  if (revealed.size < registered.size) return
  done = true
  window.dispatchEvent(new CustomEvent('ar-all-platforms-revealed'))
}
