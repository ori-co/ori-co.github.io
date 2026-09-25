import * as ecs from '@8thwall/ecs'
import {registerPlatform, platformRevealed} from './platform-progress'

ecs.registerComponent({
  name: 'disc-reveal',
  add :(world, component) => {
    const eid = component.eid
    console.log('[disc-reveal] initialized, eid:', eid)
    registerPlatform(eid)
    for (const childEid of world.getChildren(eid)) {
        world.getEntity(childEid).hide()
      }

    world.events.addListener(eid, ecs.input.SCREEN_TOUCH_START, () => {
      console.log('[disc-reveal] tap on disc! showing children...')
      for (const childEid of world.getChildren(eid)) {
        world.getEntity(childEid).show()
      }
      platformRevealed(eid)
    })
  },
})
