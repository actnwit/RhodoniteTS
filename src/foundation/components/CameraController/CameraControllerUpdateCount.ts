import type { Engine } from '../../system/Engine';

/**
 * The camera controller update counter, kept in its own module.
 *
 * CameraComponent and MeshRendererComponent include the counter in their dirty checks, so they must not import
 * CameraControllerComponent itself (that would pull the orbit/walk-through controllers into every application).
 * CameraControllerComponent writes the counter and provides the public `getUpdateCount` API.
 */
const updateCountMap = new Map<Engine, number>();

/** @internal */
export function _setCameraControllerUpdateCount(engine: Engine, count: number): void {
  updateCountMap.set(engine, count);
}

/** @internal */
export function _getCameraControllerUpdateCount(engine: Engine): number {
  return updateCountMap.get(engine) ?? 0;
}

/** @internal */
export function _deleteCameraControllerUpdateCount(engine: Engine): void {
  updateCountMap.delete(engine);
}
