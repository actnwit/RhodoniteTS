import type { ShapeComponent } from '../components/Shape/ShapeComponent';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import type { Engine } from '../system/Engine';

/** Rigid body and collider settings of a shape bound to the physics world. */
export type ShapePhysicsOptions = {
  move: boolean;
  density: number;
  friction: number;
  restitution: number;
};

/**
 * The physics engine integration used by engine-side code that must not depend on a specific physics engine.
 *
 * @remarks
 * A physics engine registers its backend when it is initialized (`RapierPhysicsStrategy.initialize()`), so the
 * render loop, `PhysicsComponent`, `CharacterControllerComponent` and `MeshHelper` reach the physics engine only
 * through this registry. Applications that do not use physics then do not bundle the physics engine integration.
 *
 * @internal
 */
export interface PhysicsBackend {
  /** Advances the physics world of the engine by one frame. Called once per frame by the physics components. */
  update(frameId: number | undefined, deltaTime: number, engine: Engine): void;
  /** Releases the per-Engine physics state when the engine is destroyed. */
  cleanupForEngine(engine: Engine): void;
  /**
   * Adds a PhysicsComponent to an entity that has a ShapeComponent, and binds its shapes as a rigid body.
   * @returns The entity, extended with the PhysicsComponent methods
   */
  bindShapePhysics(
    entity: ISceneGraphEntity,
    shapeComponent: ShapeComponent,
    options: ShapePhysicsOptions
  ): ISceneGraphEntity;
}

let __physicsBackend: PhysicsBackend | undefined;

/**
 * Registers the physics backend. Called by the physics engine integration when it is initialized.
 * @internal
 */
export function _setPhysicsBackend(backend: PhysicsBackend | undefined): void {
  __physicsBackend = backend;
}

/**
 * Returns the registered physics backend, or undefined when no physics engine has been initialized.
 * @internal
 */
export function _getPhysicsBackend(): PhysicsBackend | undefined {
  return __physicsBackend;
}

/**
 * Returns the registered physics backend.
 * @throws If no physics engine has been initialized
 * @internal
 */
export function _getRequiredPhysicsBackend(): PhysicsBackend {
  if (__physicsBackend == null) {
    throw new Error('RapierPhysicsStrategy.initialize(RAPIER) must be called before use.');
  }
  return __physicsBackend;
}
