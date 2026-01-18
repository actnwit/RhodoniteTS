import type { Config } from '../../core/Config';
import type { ISceneGraphEntity } from '../../helpers';
import { type IVector3, MathUtil, Quaternion } from '../../math';
import { Vector3 } from '../../math/Vector3';
import { Is } from '../../misc/Is';
import type { PhysicsPropertyInner } from '../PhysicsProperty';
import type { PhysicsStrategy } from '../PhysicsStrategy';
import type { PhysicsWorldProperty } from '../PhysicsWorldProperty';

declare const OIMO: any;

/**
 * Physics strategy implementation using the Oimo.js physics engine.
 * This class provides physics simulation capabilities for 3D objects in the scene.
 * It implements the PhysicsStrategy interface to integrate with the Rhodonite framework.
 */
export class OimoPhysicsStrategy implements PhysicsStrategy {
  /**
   * Global physics world properties shared across all instances.
   * Contains gravity settings and randomization options.
   */
  static __worldProperty: PhysicsWorldProperty = {
    gravity: Vector3.fromCopy3(0, -9.8, 0),
    random: true,
  };

  /**
   * The shared Oimo physics world instance.
   * All physics bodies are added to this single world for simulation.
   */
  static __world: any;

  /**
   * The Oimo physics body associated with this strategy instance.
   */
  private __body: any;

  /**
   * The scene graph entity that this physics strategy is attached to.
   */
  private __entity?: ISceneGraphEntity;

  /**
   * Cached physics properties used for body recreation when needed.
   */
  private __property: any;

  /**
   * The original local scale of the physics shape before any transformations.
   */
  private __localScale: IVector3 = Vector3.one();

  /**
   * Creates a new OimoPhysicsStrategy instance.
   * Initializes the shared Oimo physics world if it doesn't exist yet.
   */
  constructor() {
    if (Is.not.exist(OimoPhysicsStrategy.__world)) {
      const world = new OIMO.World({
        timestep: 1 / 60,
        iterations: 8,
        broadphase: 2,
        worldscale: 1,
        random: OimoPhysicsStrategy.__worldProperty.random,
        info: false,
        gravity: [
          OimoPhysicsStrategy.__worldProperty.gravity.x,
          OimoPhysicsStrategy.__worldProperty.gravity.y,
          OimoPhysicsStrategy.__worldProperty.gravity.z,
        ],
      });
      OimoPhysicsStrategy.__world = world;
    }
  }

  /**
   * Sets up the physics shape for the given entity with specified properties.
   * Creates a physics body in the Oimo world with the provided configuration.
   *
   * @param prop - The physics properties defining the shape, size, position, and material properties
   * @param entity - The scene graph entity to associate with this physics body
   */
  setShape(prop: PhysicsPropertyInner, entity: ISceneGraphEntity) {
    const world = OimoPhysicsStrategy.__world;
    this.__localScale = prop.size;
    this.__property = {
      type: prop.type.str.toLowerCase(),
      size: [prop.size.x, prop.size.y, prop.size.z],
      pos: [prop.position.x, prop.position.y, prop.position.z],
      rot: [prop.rotation.x, prop.rotation.y, prop.rotation.z],
      move: prop.move,
      density: prop.density,
      friction: prop.friction,
      restitution: prop.restitution,
    };
    this.__body = world.add(this.__property);
    this.__entity = entity;
  }

  /**
   * Updates the associated entity's transform based on the physics body's current state.
   * This method should be called each frame to synchronize the visual representation
   * with the physics simulation results.
   */
  update(_config: Config): void {
    if (this.__entity === undefined) {
      return;
    }
    const pos = this.__body.getPosition();
    const rot = this.__body.getQuaternion();
    this.__entity.getSceneGraph().setPositionWithoutPhysics(Vector3.fromCopy3(pos.x, pos.y, pos.z));
    this.__entity.getSceneGraph().setRotationWithoutPhysics(Quaternion.fromCopy4(rot.x, rot.y, rot.z, rot.w));
  }

  /**
   * Sets the world position of the physics body.
   * Recreates the physics body with the new position while preserving other properties.
   *
   * @param worldPosition - The new world position to set for the physics body
   */
  setPosition(worldPosition: IVector3): void {
    const world = OimoPhysicsStrategy.__world;
    if (this.__entity === undefined) {
      return;
    }
    this.__body.remove();
    const prop = this.__property;
    this.__property = {
      type: prop.type,
      size: [prop.size[0], prop.size[1], prop.size[2]],
      pos: [worldPosition.x, worldPosition.y, worldPosition.z],
      rot: [this.__entity.eulerAngles.x, this.__entity.eulerAngles.y, this.__entity.eulerAngles.z],
      move: prop.move,
      density: prop.density,
      friction: prop.friction,
      restitution: prop.restitution,
    };
    this.__body = world.add(this.__property);
  }

  /**
   * Sets the rotation of the physics body using Euler angles.
   * Recreates the physics body with the new rotation while preserving other properties.
   *
   * @param eulerAngles - The new Euler angles (in radians) to set for the physics body
   */
  setEulerAngle(eulerAngles: IVector3): void {
    const world = OimoPhysicsStrategy.__world;
    if (this.__entity === undefined) {
      return;
    }
    const pos = this.__body.getPosition();
    this.__body.remove();
    const prop = this.__property;
    this.__property = {
      type: prop.type,
      size: [prop.size[0], prop.size[1], prop.size[2]],
      pos: [pos.x, pos.y, pos.z],
      rot: [
        MathUtil.radianToDegree(eulerAngles.x),
        MathUtil.radianToDegree(eulerAngles.y),
        MathUtil.radianToDegree(eulerAngles.z),
      ],
      move: prop.move,
      density: prop.density,
      friction: prop.friction,
      restitution: prop.restitution,
    };
    this.__body = world.add(this.__property);
  }

  /**
   * Sets the scale of the physics body.
   * Recreates the physics body with the new scale applied to the original local scale
   * while preserving other properties.
   *
   * @param scale - The scale factors to apply to the physics body's dimensions
   */
  setScale(scale: IVector3): void {
    const world = OimoPhysicsStrategy.__world;
    if (this.__entity === undefined) {
      return;
    }
    const pos = this.__body.getPosition();
    this.__body.remove();
    const prop = this.__property;
    this.__property = {
      type: prop.type,
      size: [this.__localScale.x * scale.x, this.__localScale.y * scale.y, this.__localScale.z * scale.z],
      pos: [pos.x, pos.y, pos.z],
      rot: [this.__entity.eulerAngles.x, this.__entity.eulerAngles.y, this.__entity.eulerAngles.z],
      move: prop.move,
      density: prop.density,
      friction: prop.friction,
      restitution: prop.restitution,
    };
    this.__body = world.add(this.__property);
  }

  /**
   * Advances the physics simulation by one time step.
   * This static method should be called once per frame to update all physics bodies
   * in the shared world. It processes collisions, applies forces, and updates positions.
   */
  static update(): void {
    if (Is.exist(OimoPhysicsStrategy.__world)) {
      OimoPhysicsStrategy.__world.step();
    }
  }
}
