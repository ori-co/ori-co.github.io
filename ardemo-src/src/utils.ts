// Shared utilities for ECS component files.

export function findChildByName(
  world: ECSWorld,
  parentEid: number,
  name: string,
): number | null {
  const children = world.getChildren(parentEid)
  for (const child of children) {
    if ((world as any).getName?.(child) === name) return child
    const nested = findChildByName(world, child, name)
    if (nested !== null) return nested
  }
  return null
}
