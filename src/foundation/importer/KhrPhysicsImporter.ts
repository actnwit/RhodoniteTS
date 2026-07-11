import type {
  KHRImplicitBoxSize,
  KHRImplicitShape,
  KHRImplicitShapes,
  KHRPhysicsMaterial,
  KHRPhysicsMotion,
  KHRPhysicsRigidBodies,
  KHRPhysicsRigidBodiesNode,
  RnM2,
} from '../../types';
import { PhysicsComponent } from '../components/Physics/PhysicsComponent';
import { ShapeComponent } from '../components/Shape/ShapeComponent';
import { normalizeShapeDescriptor, type ShapeDescriptor } from '../geometry/Shape';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import type { IMatrix44 } from '../math/IMatrix';
import { Matrix44 } from '../math/Matrix44';
import { Quaternion } from '../math/Quaternion';
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

export interface NormalizedKhrBodyCollider extends NormalizedKhrCollider {
  localPosition: Vector3;
  localRotation: Quaternion;
}

export interface NormalizedKhrRigidBodyGroup {
  bodyNodeIndex: number;
  motion?: KHRPhysicsMotion;
  colliders: NormalizedKhrBodyCollider[];
}

export interface KhrRigidBodyGroupCollection {
  groups: NormalizedKhrRigidBodyGroup[];
  warnings: string[];
}

function isFiniteNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function normalizeMotion(
  motion: KHRPhysicsMotion | undefined,
  warnings: string[],
  nodeIndex: number
): KHRPhysicsMotion | undefined {
  if (motion == null) {
    return undefined;
  }
  const normalized: KHRPhysicsMotion = {
    isKinematic: motion.isKinematic,
    centerOfMass: motion.centerOfMass,
    inertiaDiagonal: motion.inertiaDiagonal,
    inertiaOrientation: motion.inertiaOrientation,
  };
  if (motion.mass != null) {
    if (!Number.isFinite(motion.mass) || motion.mass < 0) {
      warnings.push(`${KHR_PHYSICS_RIGID_BODIES}: motion node ${nodeIndex} has invalid mass; it is ignored.`);
    } else if (motion.mass === 0) {
      warnings.push(
        `${KHR_PHYSICS_RIGID_BODIES}: motion node ${nodeIndex} uses infinite mass (mass: 0), which is not yet supported; mass is derived from collider density.`
      );
    } else {
      normalized.mass = motion.mass;
    }
  }
  for (const name of ['linearVelocity', 'angularVelocity'] as const) {
    const value = motion[name];
    if (value == null) {
      continue;
    }
    if (value.length !== 3 || value.some(component => !Number.isFinite(component))) {
      warnings.push(`${KHR_PHYSICS_RIGID_BODIES}: motion node ${nodeIndex} has invalid ${name}; it is ignored.`);
    } else {
      normalized[name] = [...value];
    }
  }
  if (motion.gravityFactor != null) {
    if (!Number.isFinite(motion.gravityFactor)) {
      warnings.push(`${KHR_PHYSICS_RIGID_BODIES}: motion node ${nodeIndex} has invalid gravityFactor; it is ignored.`);
    } else {
      normalized.gravityFactor = motion.gravityFactor;
    }
  }
  return normalized;
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

function createNodeLocalMatrix(node: RnM2['nodes'][number]): Matrix44 {
  if (node.matrix != null) {
    return Matrix44.fromCopyArrayColumnMajor(node.matrix);
  }
  const translation = Vector3.fromCopyArray(node.translation ?? [0, 0, 0]);
  const rotation = Quaternion.fromCopyArray(node.rotation ?? [0, 0, 0, 1]);
  const scale = Vector3.fromCopyArray(node.scale ?? [1, 1, 1]);
  return Matrix44.multiply(
    Matrix44.multiply(Matrix44.translate(translation), Matrix44.fromCopyQuaternion(rotation)),
    Matrix44.scale(scale)
  );
}

function scaleDescriptor(descriptor: ShapeDescriptor, scale: Vector3): ShapeDescriptor {
  const x = Math.abs(scale.x);
  const y = Math.abs(scale.y);
  const z = Math.abs(scale.z);
  if (descriptor.type === 'box') {
    return normalizeShapeDescriptor({
      type: 'box',
      size: Vector3.fromCopy3(descriptor.size.x * x, descriptor.size.y * y, descriptor.size.z * z),
    });
  }
  if (descriptor.type === 'sphere') {
    return normalizeShapeDescriptor({ type: 'sphere', radius: descriptor.radius * Math.max(x, y, z) });
  }
  if (descriptor.type === 'cylinder') {
    const radialScale = Math.max(x, z);
    return normalizeShapeDescriptor({
      type: 'cylinder',
      height: descriptor.height * y,
      radiusBottom: descriptor.radiusBottom * radialScale,
      radiusTop: descriptor.radiusTop * radialScale,
    });
  }
  const radialScale = Math.max(x, y, z);
  return normalizeShapeDescriptor({
    type: 'capsule',
    height: descriptor.height * y,
    radiusBottom: descriptor.radiusBottom * radialScale,
    radiusTop: descriptor.radiusTop * radialScale,
  });
}

function hasShear(matrix: IMatrix44, scale: Vector3): boolean {
  if (scale.x === 0 || scale.y === 0 || scale.z === 0) {
    return false;
  }
  const xy = (matrix.m00 * matrix.m01 + matrix.m10 * matrix.m11 + matrix.m20 * matrix.m21) / (scale.x * scale.y);
  const xz = (matrix.m00 * matrix.m02 + matrix.m10 * matrix.m12 + matrix.m20 * matrix.m22) / (scale.x * scale.z);
  const yz = (matrix.m01 * matrix.m02 + matrix.m11 * matrix.m12 + matrix.m21 * matrix.m22) / (scale.y * scale.z);
  return Math.abs(xy) > 0.000001 || Math.abs(xz) > 0.000001 || Math.abs(yz) > 0.000001;
}

/** Resolves collider ownership and body-relative transforms according to the KHR node hierarchy rules. */
export function collectKhrRigidBodyGroups(gltfModel: RnM2): KhrRigidBodyGroupCollection {
  const warnings: string[] = [];
  const groups = new Map<number, NormalizedKhrRigidBodyGroup>();
  const parentIndices = new Array<number | undefined>(gltfModel.nodes.length);
  for (let parentIndex = 0; parentIndex < gltfModel.nodes.length; parentIndex++) {
    for (const childIndex of gltfModel.nodes[parentIndex].children ?? []) {
      parentIndices[childIndex] = parentIndex;
    }
  }
  const localMatrices = gltfModel.nodes.map(createNodeLocalMatrix);
  const worldMatrices = new Map<number, Matrix44>();
  const getWorldMatrix = (nodeIndex: number): Matrix44 => {
    const cached = worldMatrices.get(nodeIndex);
    if (cached != null) {
      return cached;
    }
    const parentIndex = parentIndices[nodeIndex];
    const matrix =
      parentIndex == null
        ? localMatrices[nodeIndex]
        : Matrix44.multiply(getWorldMatrix(parentIndex), localMatrices[nodeIndex]);
    worldMatrices.set(nodeIndex, matrix);
    return matrix;
  };
  const implicitShapesExtension = gltfModel.extensions?.[KHR_IMPLICIT_SHAPES] as KHRImplicitShapes | undefined;
  const rigidBodiesExtension = gltfModel.extensions?.[KHR_PHYSICS_RIGID_BODIES] as KHRPhysicsRigidBodies | undefined;
  const sourceDescriptors = new Map<number, ShapeDescriptor>();

  for (let nodeIndex = 0; nodeIndex < gltfModel.nodes.length; nodeIndex++) {
    const nodeExtension = gltfModel.nodes[nodeIndex].extensions?.[KHR_PHYSICS_RIGID_BODIES] as
      | KHRPhysicsRigidBodiesNode
      | undefined;
    const collider = nodeExtension?.collider;
    if (collider == null) {
      continue;
    }
    if (collider.collisionFilter != null) {
      warnings.push(
        `${KHR_PHYSICS_RIGID_BODIES}: collider node ${nodeIndex} uses an unsupported collisionFilter; the filter is ignored.`
      );
    }
    const geometry = collider.geometry;
    if (geometry == null || geometry.shape == null || geometry.mesh != null) {
      warnings.push(
        `${KHR_PHYSICS_RIGID_BODIES}: node ${nodeIndex} must reference exactly one implicit shape; its collider was skipped.`
      );
      continue;
    }
    const shapeIndex = geometry.shape;
    const implicitShape = implicitShapesExtension?.shapes?.[shapeIndex];
    if (!Number.isInteger(shapeIndex) || shapeIndex < 0 || implicitShape == null) {
      warnings.push(
        `${KHR_PHYSICS_RIGID_BODIES}: node ${nodeIndex} references missing implicit shape ${shapeIndex}; its collider was skipped.`
      );
      continue;
    }
    let sourceDescriptor = sourceDescriptors.get(shapeIndex);
    if (sourceDescriptor == null) {
      sourceDescriptor = normalizeKhrShape(implicitShape);
      if (sourceDescriptor != null) {
        sourceDescriptors.set(shapeIndex, sourceDescriptor);
      }
    }
    if (sourceDescriptor == null) {
      const isBuiltIn = ['box', 'sphere', 'cylinder', 'capsule'].includes(implicitShape.type);
      const reason = isBuiltIn
        ? `invalid ${implicitShape.type} shape`
        : `unsupported shape type '${implicitShape.type}'`;
      warnings.push(`${KHR_PHYSICS_RIGID_BODIES}: node ${nodeIndex} references ${reason}; its collider was skipped.`);
      continue;
    }

    let bodyNodeIndex = nodeIndex;
    let motion: KHRPhysicsMotion | undefined;
    let ancestorIndex: number | undefined = nodeIndex;
    while (ancestorIndex != null) {
      const ancestorExtension = gltfModel.nodes[ancestorIndex].extensions?.[KHR_PHYSICS_RIGID_BODIES] as
        | KHRPhysicsRigidBodiesNode
        | undefined;
      if (ancestorExtension?.motion != null) {
        bodyNodeIndex = ancestorIndex;
        motion = ancestorExtension.motion;
        break;
      }
      ancestorIndex = parentIndices[ancestorIndex];
    }

    const relativeMatrix =
      bodyNodeIndex === nodeIndex
        ? Matrix44.identity()
        : Matrix44.multiply(Matrix44.invert(getWorldMatrix(bodyNodeIndex)), getWorldMatrix(nodeIndex));
    const relativeScale = relativeMatrix.getScale();
    if (relativeMatrix.determinant() < 0) {
      warnings.push(
        `${KHR_PHYSICS_RIGID_BODIES}: collider node ${nodeIndex} has reflected body-relative scale; absolute dimensions are used.`
      );
    }
    if (hasShear(relativeMatrix, relativeScale)) {
      warnings.push(
        `${KHR_PHYSICS_RIGID_BODIES}: collider node ${nodeIndex} has body-relative shear; its transform is approximated as TRS.`
      );
    }
    const nonUniform =
      Math.abs(relativeScale.x - relativeScale.y) > 0.000001 || Math.abs(relativeScale.y - relativeScale.z) > 0.000001;
    if (nonUniform && sourceDescriptor.type !== 'box') {
      warnings.push(
        `${KHR_PHYSICS_RIGID_BODIES}: collider node ${nodeIndex} has non-uniform body-relative scale; its ${sourceDescriptor.type} shape is conservatively approximated.`
      );
    }
    const descriptor =
      bodyNodeIndex === nodeIndex ? sourceDescriptor : scaleDescriptor(sourceDescriptor, relativeScale);
    const material = normalizeMaterial(collider.physicsMaterial, rigidBodiesExtension, warnings, nodeIndex);
    let group = groups.get(bodyNodeIndex);
    if (group == null) {
      group = { bodyNodeIndex, motion: normalizeMotion(motion, warnings, bodyNodeIndex), colliders: [] };
      groups.set(bodyNodeIndex, group);
      if (motion != null) {
        const unsupported = ['centerOfMass', 'inertiaDiagonal', 'inertiaOrientation'].filter(
          name => motion[name as keyof KHRPhysicsMotion] != null
        );
        if (unsupported.length > 0) {
          warnings.push(
            `${KHR_PHYSICS_RIGID_BODIES}: motion node ${bodyNodeIndex} uses unsupported mass properties (${unsupported.join(', ')}); they are ignored.`
          );
        }
      }
    }
    group.colliders.push({
      nodeIndex,
      shapeIndex,
      descriptor,
      dynamicFriction: material.dynamicFriction,
      restitution: material.restitution,
      localPosition: relativeMatrix.getTranslate(),
      localRotation: Quaternion.fromMatrix(relativeMatrix.getRotate()),
    });
  }
  return { groups: [...groups.values()], warnings };
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
  const collection = collectKhrRigidBodyGroups(gltfModel);
  for (const warning of collection.warnings) {
    Logger.default.warn(warning);
  }

  if (collection.groups.length === 0) {
    return;
  }

  const bindings: Array<{
    group: NormalizedKhrRigidBodyGroup;
    entity: ISceneGraphEntity;
    shapeComponent: ShapeComponent;
    shapeIndices: number[];
  }> = [];

  for (const group of collection.groups) {
    const entity = rnEntities[group.bodyNodeIndex];
    if (entity == null) {
      Logger.default.warn(
        `${KHR_PHYSICS_RIGID_BODIES}: Rhodonite entity for body node ${group.bodyNodeIndex} was not found.`
      );
      continue;
    }
    if (entity.tryToGetPhysics() != null) {
      Logger.default.warn(
        `${KHR_PHYSICS_RIGID_BODIES}: body node ${group.bodyNodeIndex} already has a PhysicsComponent; its colliders were skipped.`
      );
      continue;
    }
    const shapeComponent =
      entity.tryToGetShape() ?? entity.engine.entityRepository.addComponentToEntity(ShapeComponent, entity).getShape();
    const shapeIndices = group.colliders.map(collider =>
      shapeComponent.addShape(collider.descriptor, {
        position: collider.localPosition,
        rotation: collider.localRotation,
      })
    );
    bindings.push({ group, entity, shapeComponent, shapeIndices });
  }

  if (!RapierPhysicsStrategy.isInitialized) {
    const colliderCount = bindings.reduce((sum, binding) => sum + binding.shapeIndices.length, 0);
    Logger.default.warn(
      `${KHR_PHYSICS_RIGID_BODIES}: Rapier is not initialized; ${colliderCount} physics binding(s) were skipped.`
    );
    return;
  }

  for (const binding of bindings) {
    const physicsEntity = binding.entity.engine.entityRepository.addComponentToEntity(PhysicsComponent, binding.entity);
    const physicsComponent = physicsEntity.getPhysics();
    physicsComponent.setStrategy(new RapierPhysicsStrategy());
    physicsComponent.setMotionProperty({
      move: binding.group.motion != null,
      isKinematic: binding.group.motion?.isKinematic ?? false,
      mass: binding.group.motion?.mass,
      linearVelocity:
        binding.group.motion?.linearVelocity == null
          ? undefined
          : Vector3.fromCopyArray(binding.group.motion.linearVelocity),
      angularVelocity:
        binding.group.motion?.angularVelocity == null
          ? undefined
          : Vector3.fromCopyArray(binding.group.motion.angularVelocity),
      gravityFactor: binding.group.motion?.gravityFactor,
    });
    for (let i = 0; i < binding.group.colliders.length; i++) {
      const collider = binding.group.colliders[i];
      physicsComponent.bindShape({
        shapeComponent: binding.shapeComponent,
        shapeIndex: binding.shapeIndices[i],
        body: {
          move: binding.group.motion != null,
          isKinematic: binding.group.motion?.isKinematic ?? false,
          density: 1,
        },
        collider: {
          friction: collider.dynamicFriction,
          restitution: collider.restitution,
        },
      });
    }
  }
}

/** @deprecated Use setupKhrStaticColliders. */
export function setupKhrStaticBoxColliders(gltfModel: RnM2, rnEntities: ISceneGraphEntity[]): void {
  setupKhrStaticColliders(gltfModel, rnEntities);
}
