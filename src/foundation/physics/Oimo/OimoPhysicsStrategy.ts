import type { Config } from '../../core/Config';
import { PhysicsShape } from '../../definitions/PhysicsShapeType';
import type { ShapeDescriptor, ShapeInstance } from '../../geometry/Shape';
import type { ISceneGraphEntity } from '../../helpers';
import { type IQuaternion, type IVector3, MathUtil, Matrix44, Quaternion } from '../../math';
import { Vector3 } from '../../math/Vector3';
import { Is } from '../../misc/Is';
import { Logger } from '../../misc/Logger';
import type {
  PhysicsBodyProperty,
  PhysicsColliderProperty,
  PhysicsMotionProperty,
  PhysicsPropertyInner,
} from '../PhysicsProperty';
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
  private __shapeLocalPosition: IVector3 = Vector3.zero();
  private __shapeLocalRotation: IQuaternion = Quaternion.identity();
  private __worldScale: IVector3 = Vector3.one();
  private __usesShapeInstance = false;
  private __shapeType?: ShapeDescriptor['type'];

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
    this.__usesShapeInstance = false;
    this.__shapeType = undefined;
    this.__shapeLocalPosition = Vector3.zero();
    this.__shapeLocalRotation = Quaternion.identity();
    this.__worldScale = Vector3.one();
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
    this.__body?.remove();
    this.__body = world.add(this.__property);
    this.__entity = entity;
  }

  setShapeInstance(
    shape: ShapeInstance,
    body: PhysicsBodyProperty,
    collider: PhysicsColliderProperty,
    entity: ISceneGraphEntity,
    worldScale: IVector3 = Vector3.one(),
    motion?: PhysicsMotionProperty
  ): void {
    if (collider.isSensor) {
      throw new Error('OimoPhysicsStrategy does not support sensor colliders.');
    }
    if (
      (collider.collisionGroup != null && collider.collisionGroup !== 0xffff) ||
      (collider.collisionMask != null && collider.collisionMask !== 0xffff)
    ) {
      throw new Error('OimoPhysicsStrategy does not support collision groups.');
    }
    if (
      motion?.mass != null ||
      motion?.centerOfMass != null ||
      motion?.inertiaDiagonal != null ||
      motion?.inertiaOrientation != null ||
      motion?.linearVelocity != null ||
      motion?.angularVelocity != null ||
      motion?.gravityFactor != null
    ) {
      throw new Error('OimoPhysicsStrategy does not support rigid-body motion parameters.');
    }
    if (body.isKinematic) {
      throw new Error('OimoPhysicsStrategy does not support kinematic generic shape bodies.');
    }
    if (shape.shape.type === 'capsule') {
      throw new Error('OimoPhysicsStrategy does not support capsule shapes.');
    }
    let localSize: IVector3;
    let physicsType: string;
    if (shape.shape.type === 'box') {
      localSize = shape.shape.size;
      physicsType = PhysicsShape.Box.str.toLowerCase();
    } else if (shape.shape.type === 'sphere') {
      localSize = Vector3.fromCopy3(shape.shape.radius, shape.shape.radius, shape.shape.radius);
      physicsType = PhysicsShape.Sphere.str.toLowerCase();
    } else {
      const radius = Math.max(shape.shape.radiusBottom, shape.shape.radiusTop);
      if (shape.shape.radiusBottom !== shape.shape.radiusTop) {
        Logger.default.warn(
          `Oimo approximates asymmetric cylinder radii (${shape.shape.radiusBottom}, ${shape.shape.radiusTop}) with the maximum radius.`
        );
      }
      localSize = Vector3.fromCopy3(radius, shape.shape.height, radius);
      physicsType = 'cylinder';
    }
    this.__localScale = Vector3.fromCopy3(localSize.x, localSize.y, localSize.z);
    this.__shapeLocalPosition = Vector3.fromCopy3(shape.localPosition.x, shape.localPosition.y, shape.localPosition.z);
    this.__shapeLocalRotation = Quaternion.fromCopy4(
      shape.localRotation.x,
      shape.localRotation.y,
      shape.localRotation.z,
      shape.localRotation.w
    );
    this.__worldScale = Vector3.fromCopy3(Math.abs(worldScale.x), Math.abs(worldScale.y), Math.abs(worldScale.z));
    this.__usesShapeInstance = true;
    this.__shapeType = shape.shape.type;
    this.__entity = entity;

    const pose = this.__toBodyPose(entity.getSceneGraph().position, entity.getSceneGraph().getQuaternionRecursively());
    const bodyEuler = pose.rotation.toEulerAngles();
    const radialScale = Math.max(this.__worldScale.x, this.__worldScale.z);
    const scaledSize =
      shape.shape.type === 'cylinder'
        ? [localSize.x * radialScale, localSize.y * this.__worldScale.y, localSize.z * radialScale]
        : [localSize.x * this.__worldScale.x, localSize.y * this.__worldScale.y, localSize.z * this.__worldScale.z];
    this.__property = {
      type: physicsType,
      size: scaledSize,
      pos: [pose.position.x, pose.position.y, pose.position.z],
      rot: [
        MathUtil.radianToDegree(bodyEuler.x),
        MathUtil.radianToDegree(bodyEuler.y),
        MathUtil.radianToDegree(bodyEuler.z),
      ],
      move: body.move,
      density: body.density,
      friction: collider.friction,
      restitution: collider.restitution,
    };
    this.__body?.remove();
    this.__body = OimoPhysicsStrategy.__world.add(this.__property);
  }

  clearShapeInstances(): void {
    this.__body?.remove();
    this.__body = undefined;
    this.__entity = undefined;
    this.__property = undefined;
    this.__usesShapeInstance = false;
    this.__shapeType = undefined;
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
    const bodyRotation = Quaternion.fromCopy4(rot.x, rot.y, rot.z, rot.w);
    if (this.__usesShapeInstance) {
      const entityRotation = Quaternion.multiply(bodyRotation, Quaternion.invert(this.__shapeLocalRotation));
      const scaledOffset = Vector3.multiplyVector(this.__shapeLocalPosition, this.__worldScale);
      const worldOffset = Vector3.multiplyQuaternion(entityRotation, scaledOffset);
      this.__entity
        .getSceneGraph()
        .setPositionWithoutPhysics(
          Vector3.fromCopy3(pos.x - worldOffset.x, pos.y - worldOffset.y, pos.z - worldOffset.z)
        );
      this.__entity.getSceneGraph().setRotationWithoutPhysics(entityRotation);
    } else {
      this.__entity.getSceneGraph().setPositionWithoutPhysics(Vector3.fromCopy3(pos.x, pos.y, pos.z));
      this.__entity.getSceneGraph().setRotationWithoutPhysics(bodyRotation);
    }
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
    const pose = this.__usesShapeInstance
      ? this.__toBodyPose(worldPosition, this.__entity.getSceneGraph().getQuaternionRecursively())
      : { position: worldPosition, rotation: this.__entity.getSceneGraph().getQuaternionRecursively() };
    const bodyEuler = pose.rotation.toEulerAngles();
    this.__property = {
      type: prop.type,
      size: [prop.size[0], prop.size[1], prop.size[2]],
      pos: [pose.position.x, pose.position.y, pose.position.z],
      rot: [
        MathUtil.radianToDegree(bodyEuler.x),
        MathUtil.radianToDegree(bodyEuler.y),
        MathUtil.radianToDegree(bodyEuler.z),
      ],
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
    const entityRotation = Quaternion.fromMatrix(Matrix44.rotateXYZ(eulerAngles.x, eulerAngles.y, eulerAngles.z));
    const pose = this.__usesShapeInstance
      ? this.__toBodyPose(this.__entity.getSceneGraph().position, entityRotation)
      : { position: this.__body.getPosition(), rotation: entityRotation };
    const bodyEuler = pose.rotation.toEulerAngles();
    this.__body.remove();
    const prop = this.__property;
    this.__property = {
      type: prop.type,
      size: [prop.size[0], prop.size[1], prop.size[2]],
      pos: [pose.position.x, pose.position.y, pose.position.z],
      rot: [
        MathUtil.radianToDegree(bodyEuler.x),
        MathUtil.radianToDegree(bodyEuler.y),
        MathUtil.radianToDegree(bodyEuler.z),
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
    this.__worldScale = Vector3.fromCopy3(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z));
    const pose = this.__usesShapeInstance
      ? this.__toBodyPose(
          this.__entity.getSceneGraph().position,
          this.__entity.getSceneGraph().getQuaternionRecursively()
        )
      : {
          position: this.__body.getPosition(),
          rotation: this.__entity.getSceneGraph().getQuaternionRecursively(),
        };
    const bodyEuler = pose.rotation.toEulerAngles();
    this.__body.remove();
    const prop = this.__property;
    const radialScale = Math.max(this.__worldScale.x, this.__worldScale.z);
    const scaledSize =
      this.__shapeType === 'cylinder'
        ? [
            this.__localScale.x * radialScale,
            this.__localScale.y * this.__worldScale.y,
            this.__localScale.z * radialScale,
          ]
        : [
            this.__localScale.x * this.__worldScale.x,
            this.__localScale.y * this.__worldScale.y,
            this.__localScale.z * this.__worldScale.z,
          ];
    this.__property = {
      type: prop.type,
      size: scaledSize,
      pos: [pose.position.x, pose.position.y, pose.position.z],
      rot: [
        MathUtil.radianToDegree(bodyEuler.x),
        MathUtil.radianToDegree(bodyEuler.y),
        MathUtil.radianToDegree(bodyEuler.z),
      ],
      move: prop.move,
      density: prop.density,
      friction: prop.friction,
      restitution: prop.restitution,
    };
    this.__body = world.add(this.__property);
  }

  private __toBodyPose(entityPosition: IVector3, entityRotation: IQuaternion) {
    const scaledOffset = Vector3.multiplyVector(this.__shapeLocalPosition, this.__worldScale);
    const worldOffset = Vector3.multiplyQuaternion(entityRotation, scaledOffset);
    return {
      position: Vector3.fromCopy3(
        entityPosition.x + worldOffset.x,
        entityPosition.y + worldOffset.y,
        entityPosition.z + worldOffset.z
      ),
      rotation: Quaternion.multiply(entityRotation, this.__shapeLocalRotation),
    };
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
