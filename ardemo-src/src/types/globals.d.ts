// Global declarations for 8thWall ECS + XR8 engine
// These are available at runtime via CDN scripts; not imported.

declare const XR8: {
  addCameraPipelineModule: (module: any) => void
  XrController: {
    configure: (opts: { imageTargetData: any[] }) => void
    pipelineModule: () => any
  }
  GlTextureRenderer: { pipelineModule: () => any }
  run: (opts: { canvas: HTMLCanvasElement }) => void
}

declare const LandingPage: {
  pipelineModule: () => any
}

// ECS world interface (subset used in our components)
interface ECSWorld {
  events: {
    addListener: (event: string, handler: (data: any) => void) => void
    removeListener: (event: string, handler: (data: any) => void) => void
    emit: (event: string, data?: any) => void
  }
  createEntity: () => number
  destroyEntity: (eid: number) => void
  setParent: (eid: number, parentEid: number) => void
  getParent: (eid: number) => number | null
  getChildren: (eid: number) => number[]
  setPosition: (eid: number, pos: { x: number; y: number; z: number }) => void
  setScale: (eid: number, scale: { x: number; y: number; z: number }) => void
  physics?: {
    applyImpulse: (eid: number, impulse: { x: number; y: number; z: number }) => void
    setGravity: (gravity: { x: number; y: number; z: number }) => void
  }
  spaces: {
    loadSpace: (spaceId: string) => void
  }
}

interface ECSComponent {
  eid: number
  world: ECSWorld
  schemaAttribute: {
    get: (eid: number) => Record<string, any>
    set: (eid: number, values: Record<string, any>) => void
    cursor: (eid: number) => Record<string, any>
  }
  dataAttribute?: {
    get: (eid: number) => Record<string, any>
    set: (eid: number, values: Record<string, any>) => void
    cursor: (eid: number) => Record<string, any>
  }
}

interface ColliderShapeEnum {
  Sphere: number
  Box: number
  Capsule: number
  Cylinder: number
}

declare const ecs: {
  registerComponent: (config: {
    name: string
    schema?: Record<string, any>
    schemaDefaults?: Record<string, any>
    data?: Record<string, any>
    dataDefaults?: Record<string, any>
    add?: (component: ECSComponent) => void
    tick?: (component: ECSComponent) => void
    remove?: (component: ECSComponent) => void
    stateMachine?: (component: ECSComponent) => Record<string, any>
  }) => any

  Hidden: {
    set: (world: ECSWorld, eid: number, opts?: { opacity?: number }) => void
    remove: (world: ECSWorld, eid: number) => void
    has: (world: ECSWorld, eid: number) => boolean
    toggle: (world: ECSWorld, eid: number) => void
  }

  Collider: {
    set: (world: ECSWorld, eid: number, opts: {
      mass?: number
      shape?: number
      radius?: number
      halfExtents?: { x: number; y: number; z: number }
      restitution?: number
      friction?: number
    }) => void
    remove: (world: ECSWorld, eid: number) => void
    has: (world: ECSWorld, eid: number) => boolean
  }

  ColliderShape: ColliderShapeEnum

  Material: {
    set: (world: ECSWorld, eid: number, opts: {
      r?: number; g?: number; b?: number; a?: number
      roughness?: number; metalness?: number
      emissiveR?: number; emissiveG?: number; emissiveB?: number
    }) => void
  }

  SphereGeometry: {
    set: (world: ECSWorld, eid: number, opts: { radius: number }) => void
  }

  BoxGeometry: {
    set: (world: ECSWorld, eid: number, opts: {
      width: number; height: number; depth: number
    }) => void
  }

  CylinderGeometry: {
    set: (world: ECSWorld, eid: number, opts: {
      radiusTop: number; radiusBottom: number; height: number; segments?: number
    }) => void
  }

  schema: {
    string: (opts?: { default?: string }) => any
    boolean: (opts?: { default?: boolean }) => any
    f32: (opts?: { default?: number }) => any
    i32: (opts?: { default?: number }) => any
    entity: any
    array: (itemType: any) => any
  }

  application: {
    init: (scene: any) => void
    getScene: () => any
  }
}
