import type {
  KHRImplicitBoxSize,
  KHRImplicitShape,
  KHRImplicitShapes,
  KHRPhysicsMaterial,
  KHRPhysicsRigidBodies,
  KHRPhysicsRigidBodiesNode,
  RnM2,
} from '../../types';
import { PhysicsComponent } from '../components/Physics/PhysicsComponent';
import { ShapeComponent } from '../components/Shape/ShapeComponent';
import { normalizeShapeDescriptor, type ShapeDescriptor } from '../geometry/Shape';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import { Vector3 } from '../math/Vector3';
import { Logger } from '../misc/Logger';
import { RapierPhysicsStrategy } from '../physics/Rapier/RapierPhysicsStrategy';

const KHR_IMPLICIT_SHAPES = 'KHR_implicit_shapes';
const KHR_PHYSICS_RIGID_BODIES = 'KHR_physics_rigid_bodies';
const DEFAULT_BOX_SIZE: KHRImplicitBoxSize = [1, 1, 1];
const DEFAULT_SPHERE_RADIUS = 0.5;
const DEFAULT_HEIGHT = 0.5;
const DEFAULT_RADIUS = 0.25;
const DEFAULT_DYNAMIC_FRICTION = 0.6;
const DEFAULT_RESTITUTION = 0;

export interface NormalizedKhrBoxCollider {
  nodeIndex: number;
  shapeIndex: number;
  size: KHRImplicitBoxSize;
  dynamicFriction: number;
  restitution: number;
}

export interface KhrBoxColliderCollection {
  colliders: NormalizedKhrBoxCollider[];
  warnings: string[];
}

export interface NormalizedKhrCollider {
  nodeIndex: number;
  shapeIndex: number;
  descriptor: ShapeDescriptor;
  dynamicFriction: number;
  restitution: number;
}

export interface KhrColliderCollection {
  colliders: NormalizedKhrCollider[];
  warnings: string[];
}

function isFiniteNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function normalizeKhrShape(shape: KHRImplicitShape): ShapeDescriptor | undefined {
  const parameterNames = ['plane', 'sphere', 'box', 'cylinder', 'capsule'] as const;
  const suppliedParameters = parameterNames.filter(name => shape[name] != null);
  if (suppliedParameters.some(name => name !== shape.type) || suppliedParameters.length > 1) {
    return undefined;
  }

  try {
    if (shape.type === 'box') {
      const size = shape.box?.size ?? DEFAULT_BOX_SIZE;
      if (size.length !== 3) {
        return undefined;
      }
      return normalizeShapeDescriptor({ type: 'box', size: Vector3.fromCopyArray(size) });
    }
    if (shape.type === 'sphere') {
      return normalizeShapeDescriptor({ type: 'sphere', radius: shape.sphere?.radius ?? DEFAULT_SPHERE_RADIUS });
    }
    if (shape.type === 'cylinder') {
      return normalizeShapeDescriptor({
        type: 'cylinder',
        height: shape.cylinder?.height ?? DEFAULT_HEIGHT,
        radiusBottom: shape.cylinder?.radiusBottom ?? DEFAULT_RADIUS,
        radiusTop: shape.cylinder?.radiusTop ?? DEFAULT_RADIUS,
      });
    }
    if (shape.type === 'capsule') {
      return normalizeShapeDescriptor({
        type: 'capsule',
        height: shape.capsule?.height ?? DEFAULT_HEIGHT,
        radiusBottom: shape.capsule?.radiusBottom ?? DEFAULT_RADIUS,
        radiusTop: shape.capsule?.radiusTop ?? DEFAULT_RADIUS,
      });
    }
  } catch (_error) {
    return undefined;
  }
  return undefined;
}

function normalizeMaterial(
  materialIndex: number | undefined,
  extension: KHRPhysicsRigidBodies | undefined,
  warnings: string[],
  nodeIndex: number
) {
  if (materialIndex == null) {
    return {
      dynamicFriction: DEFAULT_DYNAMIC_FRICTION,
      restitution: DEFAULT_RESTITUTION,
    };
  }

  const material: KHRPhysicsMaterial | undefined = extension?.physicsMaterials?.[materialIndex];
  if (material == null) {
    warnings.push(
      `${KHR_PHYSICS_RIGID_BODIES}: node ${nodeIndex} references missing physics material ${materialIndex}; defaults are used.`
    );
    return {
      dynamicFriction: DEFAULT_DYNAMIC_FRICTION,
      restitution: DEFAULT_RESTITUTION,
    };
  }

  const dynamicFriction = material.dynamicFriction ?? DEFAULT_DYNAMIC_FRICTION;
  const restitution = material.restitution ?? DEFAULT_RESTITUTION;
  if (!isFiniteNonNegative(dynamicFriction) || !isFiniteNonNegative(restitution)) {
    warnings.push(`${KHR_PHYSICS_RIGID_BODIES}: node ${nodeIndex} has an invalid physics material; defaults are used.`);
    return {
      dynamicFriction: DEFAULT_DYNAMIC_FRICTION,
      restitution: DEFAULT_RESTITUTION,
    };
  }

  return { dynamicFriction, restitution };
}

/** Resolves supported static implicit-shape colliders without mutating the glTF model. */
export function collectKhrStaticColliders(gltfModel: RnM2): KhrColliderCollection {
  const warnings: string[] = [];
  const colliders: NormalizedKhrCollider[] = [];
  const implicitShapesExtension = gltfModel.extensions?.[KHR_IMPLICIT_SHAPES] as KHRImplicitShapes | undefined;
  const rigidBodiesExtension = gltfModel.extensions?.[KHR_PHYSICS_RIGID_BODIES] as KHRPhysicsRigidBodies | undefined;

  for (let nodeIndex = 0; nodeIndex < gltfModel.nodes.length; nodeIndex++) {
    const node = gltfModel.nodes[nodeIndex];
    const nodeExtension = node.extensions?.[KHR_PHYSICS_RIGID_BODIES] as KHRPhysicsRigidBodiesNode | undefined;
    const collider = nodeExtension?.collider;
    if (collider == null) {
      continue;
    }

    if (nodeExtension?.motion != null) {
      warnings.push(
        `${KHR_PHYSICS_RIGID_BODIES}: dynamic motion on node ${nodeIndex} is not supported yet; its collider was skipped.`
      );
      continue;
    }

    const geometry = collider.geometry;
    if (geometry == null || geometry.shape == null || geometry.mesh != null) {
      warnings.push(
        `${KHR_PHYSICS_RIGID_BODIES}: node ${nodeIndex} must reference exactly one implicit shape; its collider was skipped.`
      );
      continue;
    }

    const shapeIndex = geometry.shape;
    const shape = implicitShapesExtension?.shapes?.[shapeIndex];
    if (!Number.isInteger(shapeIndex) || shapeIndex < 0 || shape == null) {
      warnings.push(
        `${KHR_PHYSICS_RIGID_BODIES}: node ${nodeIndex} references missing implicit shape ${shapeIndex}; its collider was skipped.`
      );
      continue;
    }

    const descriptor = normalizeKhrShape(shape);
    if (descriptor == null) {
      const isBuiltIn = ['box', 'sphere', 'cylinder', 'capsule'].includes(shape.type);
      const reason = isBuiltIn ? `invalid ${shape.type} shape` : `unsupported shape type '${shape.type}'`;
      warnings.push(`${KHR_PHYSICS_RIGID_BODIES}: node ${nodeIndex} references ${reason}; its collider was skipped.`);
      continue;
    }

    const material = normalizeMaterial(collider.physicsMaterial, rigidBodiesExtension, warnings, nodeIndex);
    colliders.push({
      nodeIndex,
      shapeIndex,
      descriptor,
      dynamicFriction: material.dynamicFriction,
      restitution: material.restitution,
    });
  }

  return { colliders, warnings };
}

/** @deprecated Use collectKhrStaticColliders. */
export function collectKhrStaticBoxColliders(gltfModel: RnM2): KhrBoxColliderCollection {
  const collection = collectKhrStaticColliders(gltfModel);
  const colliders: NormalizedKhrBoxCollider[] = [];
  const warnings = [...collection.warnings];
  for (const collider of collection.colliders) {
    if (collider.descriptor.type !== 'box') {
      warnings.push(
        `${KHR_PHYSICS_RIGID_BODIES}: node ${collider.nodeIndex} references unsupported shape type '${collider.descriptor.type}'; its collider was skipped.`
      );
      continue;
    }
    colliders.push({
      nodeIndex: collider.nodeIndex,
      shapeIndex: collider.shapeIndex,
      size: [collider.descriptor.size.x, collider.descriptor.size.y, collider.descriptor.size.z],
      dynamicFriction: collider.dynamicFriction,
      restitution: collider.restitution,
    });
  }
  return { colliders, warnings };
}

/**
 * Creates Rapier fixed bodies for supported KHR_physics_rigid_bodies colliders.
 */
export function setupKhrStaticColliders(gltfModel: RnM2, rnEntities: ISceneGraphEntity[]): void {
  const collection = collectKhrStaticColliders(gltfModel);
  for (const warning of collection.warnings) {
    Logger.default.warn(warning);
  }

  if (collection.colliders.length === 0) {
    return;
  }

  const sharedDescriptors = new Map<number, ShapeDescriptor>();
  const bindings: Array<{
    collider: NormalizedKhrCollider;
    entity: ISceneGraphEntity;
    shapeComponent: ShapeComponent;
    shapeIndex: number;
  }> = [];

  for (const collider of collection.colliders) {
    const entity = rnEntities[collider.nodeIndex];
    if (entity == null) {
      Logger.default.warn(
        `${KHR_PHYSICS_RIGID_BODIES}: Rhodonite entity for node ${collider.nodeIndex} was not found.`
      );
      continue;
    }
    if (entity.tryToGetPhysics() != null) {
      Logger.default.warn(
        `${KHR_PHYSICS_RIGID_BODIES}: node ${collider.nodeIndex} already has a PhysicsComponent; its collider was skipped.`
      );
      continue;
    }

    let descriptor = sharedDescriptors.get(collider.shapeIndex);
    if (descriptor == null) {
      descriptor = collider.descriptor;
      sharedDescriptors.set(collider.shapeIndex, descriptor);
    }
    const shapeComponent =
      entity.tryToGetShape() ?? entity.engine.entityRepository.addComponentToEntity(ShapeComponent, entity).getShape();
    const shapeIndex = shapeComponent.addShape(descriptor);
    bindings.push({ collider, entity, shapeComponent, shapeIndex });
  }

  if (!RapierPhysicsStrategy.isInitialized) {
    Logger.default.warn(
      `${KHR_PHYSICS_RIGID_BODIES}: Rapier is not initialized; ${bindings.length} physics binding(s) were skipped.`
    );
    return;
  }

  for (const binding of bindings) {
    const physicsEntity = binding.entity.engine.entityRepository.addComponentToEntity(PhysicsComponent, binding.entity);
    const physicsComponent = physicsEntity.getPhysics();
    physicsComponent.setStrategy(new RapierPhysicsStrategy());
    physicsComponent.bindShape({
      shapeComponent: binding.shapeComponent,
      shapeIndex: binding.shapeIndex,
      body: { move: false, density: 1 },
      collider: {
        friction: binding.collider.dynamicFriction,
        restitution: binding.collider.restitution,
      },
    });
  }
}

/** @deprecated Use setupKhrStaticColliders. */
export function setupKhrStaticBoxColliders(gltfModel: RnM2, rnEntities: ISceneGraphEntity[]): void {
  setupKhrStaticColliders(gltfModel, rnEntities);
}
