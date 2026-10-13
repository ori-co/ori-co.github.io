import * as ecs from '@8thwall/ecs'

const {quat, vec3} = ecs.math

// Rotation set in Studio, captured on `add`, per label.
const baseRotations = new Map()

// Turns the label around its own normal (its local Z axis) so its text stays upright on
// screen while the camera orbits the card. The label keeps its plane, so it still sits in
// the scene with perspective instead of facing the screen like a sticker.
// Uses the screen's up direction, not the camera position: it stays well defined when the
// camera is right above the label.
ecs.registerComponent({
  name: 'label-billboard',
  // Empty but required: without a schema, Studio saves the component with no
  // `parameters` and crashes when duplicating the entity.
  schema: {},
  add: (world, component) => {
    const q = ecs.Quaternion.get(world, component.eid)
    baseRotations.set(component.eid, quat.xyzw(q.x, q.y, q.z, q.w))
  },
  tick: (world, component) => {
    const eid = component.eid
    const base = baseRotations.get(eid)
    const cameraEid = world.camera.getActiveEid()
    if (!base || !cameraEid) return

    // Screen up, expressed in the label's frame as set in Studio.
    const screenUp = world.transform.getWorldQuaternion(cameraEid).timesVec(vec3.up())
    const parentEid = world.getParent(eid)
    const inParent = parentEid
      ? world.transform.getWorldQuaternion(parentEid).inv().timesVec(screenUp)
      : screenUp
    const up = base.inv().timesVec(inParent)

    // Screen up nearly along the label's normal: card seen edge-on, keep the last rotation.
    if (Math.hypot(up.x, up.y) < 0.1) return

    // Angle around local Z that brings the label's +Y onto the screen up direction.
    const r = base.times(quat.zRadians(Math.atan2(-up.x, up.y)))
    world.setQuaternion(eid, r.x, r.y, r.z, r.w)
  },
  remove: (world, component) => {
    baseRotations.delete(component.eid)
  },
})
