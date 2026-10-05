import * as ecs from '@8thwall/ecs'
import {registerPlatform, platformRevealed} from './platform-progress'

// Children with a GLB animation clip are held on frame 0 while hidden,
// then played from the start when the disc is tapped.
const hasClip = (world, eid) => (
  ecs.GltfModel.has(world, eid) && !!ecs.GltfModel.get(world, eid).animationClip
)

ecs.registerComponent({
  name: 'disc-reveal',
  // Empty but required: without a schema, Studio saves the component with no
  // `parameters` and crashes when duplicating the entity.
  schema: {},
  add :(world, component) => {
    const eid = component.eid
    console.log('[disc-reveal] initialized, eid:', eid)
    registerPlatform(eid)
    for (const childEid of world.getChildren(eid)) {
        world.getEntity(childEid).hide()
        if (hasClip(world, childEid)) {
          ecs.GltfModel.mutate(world, childEid, (model) => {
            model.paused = true
            model.time = 0
          })
        }
      }

    let revealed = false
    world.events.addListener(eid, ecs.input.SCREEN_TOUCH_START, () => {
      if (revealed) return
      revealed = true
      console.log('[disc-reveal] tap on disc! showing children...')
      for (const childEid of world.getChildren(eid)) {
        world.getEntity(childEid).show()
        if (hasClip(world, childEid)) {
          console.log('[disc-reveal] playing animation on', childEid)
          ecs.GltfModel.mutate(world, childEid, (model) => {
            model.time = 0
            model.paused = false
          })
        }
      }
      platformRevealed(eid)
    })
  },
})
