import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'disc-reveal',
  add :(world, cursor) => {
    const eid = cursor.eid
    world.events.addListener(world.events.globalId, ecs.input.SCREEN_TOUCH_END, (e: any) => {
      if (e.target !== eid) return
      for (const childEid of world.getChildren(eid)) {
        ecs.Hidden.remove(world, childEid)
      }
    })
  },
})
