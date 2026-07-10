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
import { PhysicsShape } from '../definitions/PhysicsShapeType';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import { Vector3 } from '../math/Vector3';
import { Logger } from '../misc/Logger';
import { RapierPhysicsStrategy } from '../physics/Rapier/RapierPhysicsStrategy';

const KHR_IMPLICIT_SHAPES = 'KHR_implicit_shapes';
const KHR_PHYSICS_RIGID_BODIES = 'KHR_physics_rigid_bodies';
const DEFAULT_BOX_SIZE: KHRImplicitBoxSize = [1, 1, 1];
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

function isFiniteNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function normalizeBoxSize(shape: KHRImplicitShape): KHRImplicitBoxSize | undefined {
  if (shape.type !== 'box') {
    return undefined;
  }

  const parameterNames = ['plane', 'sphere', 'box', 'cylinder', 'capsule'] as const;
  const suppliedParameters = parameterNames.filter(name => shape[name] != null);
  if (suppliedParameters.some(name => name !== 'box') || suppliedParameters.length > 1) {
    return undefined;
  }

  const size = shape.box?.size ?? DEFAULT_BOX_SIZE;
  if (size.length !== 3 || !size.every(component => Number.isFinite(component) && component > 0)) {
    return undefined;
  }

  return [size[0], size[1], size[2]];
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

/**
 * Resolves the supported static box colliders without mutating the glTF model.
 * Unsupported or malformed collider declarations are returned as diagnostics.
 */
export function collectKhrStaticBoxColliders(gltfModel: RnM2): KhrBoxColliderCollection {
  const warnings: string[] = [];
  const colliders: NormalizedKhrBoxCollider[] = [];
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

    const size = normalizeBoxSize(shape);
    if (size == null) {
      const reason = shape.type === 'box' ? 'invalid box shape' : `unsupported shape type '${shape.type}'`;
      warnings.push(`${KHR_PHYSICS_RIGID_BODIES}: node ${nodeIndex} references ${reason}; its collider was skipped.`);
      continue;
    }

    const material = normalizeMaterial(collider.physicsMaterial, rigidBodiesExtension, warnings, nodeIndex);
    colliders.push({
      nodeIndex,
      shapeIndex,
      size,
      dynamicFriction: material.dynamicFriction,
      restitution: material.restitution,
    });
  }

  return { colliders, warnings };
}

/**
 * Creates Rapier fixed bodies for supported KHR_physics_rigid_bodies colliders.
 */
export function setupKhrStaticBoxColliders(gltfModel: RnM2, rnEntities: ISceneGraphEntity[]): void {
  const collection = collectKhrStaticBoxColliders(gltfModel);
  for (const warning of collection.warnings) {
    Logger.default.warn(warning);
  }

  if (collection.colliders.length === 0) {
    return;
  }

  if (!RapierPhysicsStrategy.isInitialized) {
    Logger.default.warn(
      `${KHR_PHYSICS_RIGID_BODIES}: Rapier is not initialized; ${collection.colliders.length} collider(s) were skipped.`
    );
    return;
  }

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

    const sceneGraph = entity.getSceneGraph();
    const worldScale = sceneGraph.scale;
    const absoluteWorldScale = Vector3.fromCopy3(
      Math.abs(worldScale.x),
      Math.abs(worldScale.y),
      Math.abs(worldScale.z)
    );
    const strategy = new RapierPhysicsStrategy();
    strategy.setShape(
      {
        type: PhysicsShape.Box,
        size: Vector3.fromCopyArray(collider.size),
        position: sceneGraph.position,
        rotation: sceneGraph.eulerAngles,
        move: false,
        density: 1,
        friction: collider.dynamicFriction,
        restitution: collider.restitution,
      },
      entity,
      absoluteWorldScale
    );

    const physicsEntity = entity.engine.entityRepository.addComponentToEntity(PhysicsComponent, entity);
    physicsEntity.getPhysics().setStrategy(strategy);
  }
}
