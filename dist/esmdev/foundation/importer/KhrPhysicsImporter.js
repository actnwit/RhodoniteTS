// src/foundation/importer/KhrPhysicsImporter.ts
import { PhysicsComponent } from "../components/Physics/PhysicsComponent.js";
import { ShapeComponent } from "../components/Shape/ShapeComponent.js";
import { TriggerComponent } from "../components/Trigger/TriggerComponent.js";
import { normalizeShapeDescriptor } from "../geometry/Shape.js";
import { Matrix44 } from "../math/Matrix44.js";
import { Quaternion } from "../math/Quaternion.js";
import { Vector3 } from "../math/Vector3.js";
import { Logger } from "../misc/Logger.js";
var rapierPhysicsStrategyClass;
var rapierPhysicsStrategyPromise;
var KHR_IMPLICIT_SHAPES = "KHR_implicit_shapes";
var KHR_PHYSICS_RIGID_BODIES = "KHR_physics_rigid_bodies";
var DEFAULT_BOX_SIZE = [1, 1, 1];
var DEFAULT_SPHERE_RADIUS = 0.5;
var DEFAULT_HEIGHT = 0.5;
var DEFAULT_RADIUS = 0.25;
var DEFAULT_DYNAMIC_FRICTION = 0.6;
var DEFAULT_RESTITUTION = 0;
var FALLBACK_COLLISION_GROUP = 32768;
var ALL_COLLISION_GROUPS = 65535;
var MAX_KHR_FILTER_PROFILES = 15;
function isFiniteNonNegative(value) {
  return Number.isFinite(value) && value >= 0;
}
function normalizeCollisionFilterProfile(filter, warnings, filterIndex) {
  var _a;
  if (filter.collideWithSystems != null && filter.notCollideWithSystems != null) {
    warnings.push(
      `${KHR_PHYSICS_RIGID_BODIES}: collision filter ${filterIndex} defines both collideWithSystems and notCollideWithSystems; fallback collision is used.`
    );
    return void 0;
  }
  const normalizeStrings = (value, propertyName) => {
    if (value == null) {
      return [];
    }
    if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
      warnings.push(
        `${KHR_PHYSICS_RIGID_BODIES}: collision filter ${filterIndex} has invalid ${propertyName}; fallback collision is used.`
      );
      return void 0;
    }
    return [...new Set(value)].sort();
  };
  const collisionSystems = normalizeStrings(filter.collisionSystems, "collisionSystems");
  const targetSource = (_a = filter.collideWithSystems) != null ? _a : filter.notCollideWithSystems;
  const targetSystems = normalizeStrings(
    targetSource,
    filter.collideWithSystems != null ? "collideWithSystems" : "notCollideWithSystems"
  );
  if (collisionSystems == null || targetSystems == null) {
    return void 0;
  }
  return {
    collisionSystems,
    mode: filter.collideWithSystems != null ? "allow" : filter.notCollideWithSystems != null ? "deny" : "all",
    targetSystems
  };
}
function collisionFilterProfileKey(profile) {
  return JSON.stringify([profile.collisionSystems, profile.mode, profile.targetSystems]);
}
function profilePermits(profile, other) {
  if (profile.mode === "all") {
    return true;
  }
  const targets = new Set(profile.targetSystems);
  if (profile.mode === "allow") {
    return other.collisionSystems.some((system) => targets.has(system));
  }
  return other.collisionSystems.every((system) => !targets.has(system));
}
function resolveCollisionFilters(groups, extension, warnings) {
  var _a;
  const profileByKey = /* @__PURE__ */ new Map();
  const resolvedByFilterIndex = /* @__PURE__ */ new Map();
  let overflowWarned = false;
  for (const group of groups.values()) {
    for (const collider of group.colliders) {
      const filterIndex = collider.collisionFilterIndex;
      if (filterIndex == null) {
        continue;
      }
      let resolved = resolvedByFilterIndex.get(filterIndex);
      if (!resolvedByFilterIndex.has(filterIndex)) {
        const source = (_a = extension == null ? void 0 : extension.collisionFilters) == null ? void 0 : _a[filterIndex];
        if (!Number.isInteger(filterIndex) || filterIndex < 0 || source == null) {
          warnings.push(
            `${KHR_PHYSICS_RIGID_BODIES}: collider node ${collider.nodeIndex} references missing collision filter ${filterIndex}; fallback collision is used.`
          );
          resolvedByFilterIndex.set(filterIndex, void 0);
        } else {
          const profile = normalizeCollisionFilterProfile(source, warnings, filterIndex);
          if (profile != null) {
            const key = collisionFilterProfileKey(profile);
            resolved = profileByKey.get(key);
            if (resolved == null && profileByKey.size < MAX_KHR_FILTER_PROFILES) {
              resolved = { profile, bit: 1 << profileByKey.size };
              profileByKey.set(key, resolved);
            } else if (resolved == null && !overflowWarned) {
              warnings.push(
                `${KHR_PHYSICS_RIGID_BODIES}: more than ${MAX_KHR_FILTER_PROFILES} collision filter profiles are used; profile ${filterIndex} and subsequent overflow profiles use fallback collision.`
              );
              overflowWarned = true;
            }
          }
          resolvedByFilterIndex.set(filterIndex, resolved);
        }
      }
      if (resolved != null) {
        collider.collisionGroup = resolved.bit;
      }
    }
  }
  const profiles = [...profileByKey.values()];
  for (const group of groups.values()) {
    for (const collider of group.colliders) {
      const resolved = collider.collisionFilterIndex == null ? void 0 : resolvedByFilterIndex.get(collider.collisionFilterIndex);
      if (resolved == null) {
        collider.collisionGroup = FALLBACK_COLLISION_GROUP;
        collider.collisionMask = ALL_COLLISION_GROUPS;
        continue;
      }
      let mask = FALLBACK_COLLISION_GROUP;
      for (const other of profiles) {
        if (profilePermits(resolved.profile, other.profile) && profilePermits(other.profile, resolved.profile)) {
          mask |= other.bit;
        }
      }
      collider.collisionMask = mask;
    }
  }
}
function normalizeMotion(motion, warnings, nodeIndex) {
  if (motion == null) {
    return void 0;
  }
  const normalized = {
    isKinematic: motion.isKinematic
  };
  if (motion.mass != null) {
    if (!Number.isFinite(motion.mass) || motion.mass < 0) {
      warnings.push(`${KHR_PHYSICS_RIGID_BODIES}: motion node ${nodeIndex} has invalid mass; it is ignored.`);
    } else {
      normalized.mass = motion.mass;
    }
  }
  for (const name of ["centerOfMass", "linearVelocity", "angularVelocity"]) {
    const value = motion[name];
    if (value == null) {
      continue;
    }
    if (!Array.isArray(value) || value.length !== 3 || value.some((component) => !Number.isFinite(component))) {
      warnings.push(`${KHR_PHYSICS_RIGID_BODIES}: motion node ${nodeIndex} has invalid ${name}; it is ignored.`);
    } else {
      normalized[name] = [...value];
    }
  }
  if (motion.inertiaDiagonal != null) {
    if (!Array.isArray(motion.inertiaDiagonal) || motion.inertiaDiagonal.length !== 3 || motion.inertiaDiagonal.some((component) => !Number.isFinite(component) || component < 0)) {
      warnings.push(
        `${KHR_PHYSICS_RIGID_BODIES}: motion node ${nodeIndex} has invalid inertiaDiagonal; it is ignored.`
      );
    } else {
      normalized.inertiaDiagonal = [...motion.inertiaDiagonal];
    }
  }
  if (motion.inertiaOrientation != null) {
    const value = motion.inertiaOrientation;
    const hasValidComponents = Array.isArray(value) && value.length === 4 && value.every((component) => Number.isFinite(component));
    const lengthSquared = hasValidComponents ? value.reduce((sum, component) => sum + component * component, 0) : 0;
    if (!hasValidComponents || lengthSquared === 0) {
      warnings.push(
        `${KHR_PHYSICS_RIGID_BODIES}: motion node ${nodeIndex} has invalid inertiaOrientation; it is ignored.`
      );
    } else {
      const inverseLength = 1 / Math.sqrt(lengthSquared);
      normalized.inertiaOrientation = value.map((component) => component * inverseLength);
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
function normalizeKhrShape(shape) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p;
  const parameterNames = ["plane", "sphere", "box", "cylinder", "capsule"];
  const suppliedParameters = parameterNames.filter((name) => shape[name] != null);
  if (suppliedParameters.some((name) => name !== shape.type) || suppliedParameters.length > 1) {
    return void 0;
  }
  try {
    if (shape.type === "box") {
      const size = (_b = (_a = shape.box) == null ? void 0 : _a.size) != null ? _b : DEFAULT_BOX_SIZE;
      if (size.length !== 3) {
        return void 0;
      }
      return normalizeShapeDescriptor({ type: "box", size: Vector3.fromCopyArray(size) });
    }
    if (shape.type === "sphere") {
      return normalizeShapeDescriptor({ type: "sphere", radius: (_d = (_c = shape.sphere) == null ? void 0 : _c.radius) != null ? _d : DEFAULT_SPHERE_RADIUS });
    }
    if (shape.type === "cylinder") {
      return normalizeShapeDescriptor({
        type: "cylinder",
        height: (_f = (_e = shape.cylinder) == null ? void 0 : _e.height) != null ? _f : DEFAULT_HEIGHT,
        radiusBottom: (_h = (_g = shape.cylinder) == null ? void 0 : _g.radiusBottom) != null ? _h : DEFAULT_RADIUS,
        radiusTop: (_j = (_i = shape.cylinder) == null ? void 0 : _i.radiusTop) != null ? _j : DEFAULT_RADIUS
      });
    }
    if (shape.type === "capsule") {
      return normalizeShapeDescriptor({
        type: "capsule",
        height: (_l = (_k = shape.capsule) == null ? void 0 : _k.height) != null ? _l : DEFAULT_HEIGHT,
        radiusBottom: (_n = (_m = shape.capsule) == null ? void 0 : _m.radiusBottom) != null ? _n : DEFAULT_RADIUS,
        radiusTop: (_p = (_o = shape.capsule) == null ? void 0 : _o.radiusTop) != null ? _p : DEFAULT_RADIUS
      });
    }
  } catch (_error) {
    return void 0;
  }
  return void 0;
}
function normalizeMaterial(materialIndex, extension, warnings, nodeIndex) {
  var _a, _b, _c;
  if (materialIndex == null) {
    return {
      dynamicFriction: DEFAULT_DYNAMIC_FRICTION,
      restitution: DEFAULT_RESTITUTION
    };
  }
  const material = (_a = extension == null ? void 0 : extension.physicsMaterials) == null ? void 0 : _a[materialIndex];
  if (material == null) {
    warnings.push(
      `${KHR_PHYSICS_RIGID_BODIES}: node ${nodeIndex} references missing physics material ${materialIndex}; defaults are used.`
    );
    return {
      dynamicFriction: DEFAULT_DYNAMIC_FRICTION,
      restitution: DEFAULT_RESTITUTION
    };
  }
  const dynamicFriction = (_b = material.dynamicFriction) != null ? _b : DEFAULT_DYNAMIC_FRICTION;
  const restitution = (_c = material.restitution) != null ? _c : DEFAULT_RESTITUTION;
  if (!isFiniteNonNegative(dynamicFriction) || !isFiniteNonNegative(restitution)) {
    warnings.push(`${KHR_PHYSICS_RIGID_BODIES}: node ${nodeIndex} has an invalid physics material; defaults are used.`);
    return {
      dynamicFriction: DEFAULT_DYNAMIC_FRICTION,
      restitution: DEFAULT_RESTITUTION
    };
  }
  return { dynamicFriction, restitution };
}
function createNodeLocalMatrix(node) {
  var _a, _b, _c;
  if (node.matrix != null) {
    return Matrix44.fromCopyArrayColumnMajor(node.matrix);
  }
  const translation = Vector3.fromCopyArray((_a = node.translation) != null ? _a : [0, 0, 0]);
  const rotation = Quaternion.fromCopyArray((_b = node.rotation) != null ? _b : [0, 0, 0, 1]);
  const scale = Vector3.fromCopyArray((_c = node.scale) != null ? _c : [1, 1, 1]);
  return Matrix44.multiply(
    Matrix44.multiply(Matrix44.translate(translation), Matrix44.fromCopyQuaternion(rotation)),
    Matrix44.scale(scale)
  );
}
function scaleDescriptor(descriptor, scale) {
  const x = Math.abs(scale.x);
  const y = Math.abs(scale.y);
  const z = Math.abs(scale.z);
  if (descriptor.type === "box") {
    return normalizeShapeDescriptor({
      type: "box",
      size: Vector3.fromCopy3(descriptor.size.x * x, descriptor.size.y * y, descriptor.size.z * z)
    });
  }
  if (descriptor.type === "sphere") {
    return normalizeShapeDescriptor({ type: "sphere", radius: descriptor.radius * Math.max(x, y, z) });
  }
  if (descriptor.type === "cylinder") {
    const radialScale2 = Math.max(x, z);
    return normalizeShapeDescriptor({
      type: "cylinder",
      height: descriptor.height * y,
      radiusBottom: descriptor.radiusBottom * radialScale2,
      radiusTop: descriptor.radiusTop * radialScale2
    });
  }
  const radialScale = Math.max(x, y, z);
  return normalizeShapeDescriptor({
    type: "capsule",
    height: descriptor.height * y,
    radiusBottom: descriptor.radiusBottom * radialScale,
    radiusTop: descriptor.radiusTop * radialScale
  });
}
function hasShear(matrix, scale) {
  if (scale.x === 0 || scale.y === 0 || scale.z === 0) {
    return false;
  }
  const xy = (matrix.m00 * matrix.m01 + matrix.m10 * matrix.m11 + matrix.m20 * matrix.m21) / (scale.x * scale.y);
  const xz = (matrix.m00 * matrix.m02 + matrix.m10 * matrix.m12 + matrix.m20 * matrix.m22) / (scale.x * scale.z);
  const yz = (matrix.m01 * matrix.m02 + matrix.m11 * matrix.m12 + matrix.m21 * matrix.m22) / (scale.y * scale.z);
  return Math.abs(xy) > 1e-6 || Math.abs(xz) > 1e-6 || Math.abs(yz) > 1e-6;
}
function collectKhrRigidBodyGroups(gltfModel) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
  const warnings = [];
  const groups = /* @__PURE__ */ new Map();
  const parentIndices = new Array(gltfModel.nodes.length);
  for (let parentIndex = 0; parentIndex < gltfModel.nodes.length; parentIndex++) {
    for (const childIndex of (_a = gltfModel.nodes[parentIndex].children) != null ? _a : []) {
      parentIndices[childIndex] = parentIndex;
    }
  }
  const localMatrices = gltfModel.nodes.map(createNodeLocalMatrix);
  const worldMatrices = /* @__PURE__ */ new Map();
  const getWorldMatrix = (nodeIndex) => {
    const cached = worldMatrices.get(nodeIndex);
    if (cached != null) {
      return cached;
    }
    const parentIndex = parentIndices[nodeIndex];
    const matrix = parentIndex == null ? localMatrices[nodeIndex] : Matrix44.multiply(getWorldMatrix(parentIndex), localMatrices[nodeIndex]);
    worldMatrices.set(nodeIndex, matrix);
    return matrix;
  };
  const implicitShapesExtension = (_b = gltfModel.extensions) == null ? void 0 : _b[KHR_IMPLICIT_SHAPES];
  const rigidBodiesExtension = (_c = gltfModel.extensions) == null ? void 0 : _c[KHR_PHYSICS_RIGID_BODIES];
  const sourceDescriptors = /* @__PURE__ */ new Map();
  const declarations = [];
  const claimedTriggerNodes = /* @__PURE__ */ new Set();
  const isDescendantOf = (nodeIndex, ancestorIndex) => {
    let current = parentIndices[nodeIndex];
    while (current != null) {
      if (current === ancestorIndex) return true;
      current = parentIndices[current];
    }
    return false;
  };
  for (let nodeIndex = 0; nodeIndex < gltfModel.nodes.length; nodeIndex++) {
    const extension = (_d = gltfModel.nodes[nodeIndex].extensions) == null ? void 0 : _d[KHR_PHYSICS_RIGID_BODIES];
    if ((extension == null ? void 0 : extension.collider) != null) {
      declarations.push({ nodeIndex, collider: extension.collider, isSensor: false });
    }
    const trigger = extension == null ? void 0 : extension.trigger;
    if ((trigger == null ? void 0 : trigger.nodes) == null) continue;
    if (trigger.geometry != null) {
      warnings.push(
        `${KHR_PHYSICS_RIGID_BODIES}: trigger node ${nodeIndex} defines both geometry and nodes; it was skipped.`
      );
      continue;
    }
    for (const childIndex of new Set(trigger.nodes)) {
      const childTrigger = (_f = (_e = gltfModel.nodes[childIndex]) == null ? void 0 : _e.extensions) == null ? void 0 : _f[KHR_PHYSICS_RIGID_BODIES];
      if (!Number.isInteger(childIndex) || !isDescendantOf(childIndex, nodeIndex) || ((_g = childTrigger == null ? void 0 : childTrigger.trigger) == null ? void 0 : _g.geometry) == null) {
        warnings.push(
          `${KHR_PHYSICS_RIGID_BODIES}: compound trigger node ${nodeIndex} references invalid descendant ${childIndex}; it was ignored.`
        );
        continue;
      }
      if (childTrigger.trigger.nodes != null) {
        warnings.push(`${KHR_PHYSICS_RIGID_BODIES}: nested compound trigger node ${childIndex} is not supported.`);
        continue;
      }
      claimedTriggerNodes.add(childIndex);
      declarations.push({
        nodeIndex: childIndex,
        collider: {
          geometry: childTrigger.trigger.geometry,
          collisionFilter: (_h = childTrigger.trigger.collisionFilter) != null ? _h : trigger.collisionFilter
        },
        isSensor: true,
        triggerNodeIndex: nodeIndex
      });
    }
  }
  for (let nodeIndex = 0; nodeIndex < gltfModel.nodes.length; nodeIndex++) {
    if (claimedTriggerNodes.has(nodeIndex)) continue;
    const trigger = (_j = (_i = gltfModel.nodes[nodeIndex].extensions) == null ? void 0 : _i[KHR_PHYSICS_RIGID_BODIES]) == null ? void 0 : _j.trigger;
    if ((trigger == null ? void 0 : trigger.geometry) != null && trigger.nodes == null) {
      declarations.push({
        nodeIndex,
        collider: { geometry: trigger.geometry, collisionFilter: trigger.collisionFilter },
        isSensor: true,
        triggerNodeIndex: nodeIndex
      });
    }
  }
  for (const declaration of declarations) {
    const nodeIndex = declaration.nodeIndex;
    const collider = declaration.collider;
    const geometry = collider.geometry;
    if (geometry == null || geometry.shape == null || geometry.mesh != null) {
      warnings.push(
        `${KHR_PHYSICS_RIGID_BODIES}: node ${nodeIndex} must reference exactly one implicit shape; its collider was skipped.`
      );
      continue;
    }
    const shapeIndex = geometry.shape;
    const implicitShape = (_k = implicitShapesExtension == null ? void 0 : implicitShapesExtension.shapes) == null ? void 0 : _k[shapeIndex];
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
      const isBuiltIn = ["box", "sphere", "cylinder", "capsule"].includes(implicitShape.type);
      const reason = isBuiltIn ? `invalid ${implicitShape.type} shape` : `unsupported shape type '${implicitShape.type}'`;
      warnings.push(`${KHR_PHYSICS_RIGID_BODIES}: node ${nodeIndex} references ${reason}; its collider was skipped.`);
      continue;
    }
    let bodyNodeIndex = nodeIndex;
    let motion;
    let ancestorIndex = nodeIndex;
    while (ancestorIndex != null) {
      const ancestorExtension = (_l = gltfModel.nodes[ancestorIndex].extensions) == null ? void 0 : _l[KHR_PHYSICS_RIGID_BODIES];
      if ((ancestorExtension == null ? void 0 : ancestorExtension.motion) != null) {
        bodyNodeIndex = ancestorIndex;
        motion = ancestorExtension.motion;
        break;
      }
      ancestorIndex = parentIndices[ancestorIndex];
    }
    const relativeMatrix = bodyNodeIndex === nodeIndex ? Matrix44.identity() : Matrix44.multiply(Matrix44.invert(getWorldMatrix(bodyNodeIndex)), getWorldMatrix(nodeIndex));
    const relativeScale = relativeMatrix.getScale();
    if (relativeScale.x === 0 || relativeScale.y === 0 || relativeScale.z === 0) {
      warnings.push(
        `${KHR_PHYSICS_RIGID_BODIES}: collider node ${nodeIndex} has zero body-relative scale; its collider was skipped.`
      );
      continue;
    }
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
    const nonUniform = Math.abs(relativeScale.x - relativeScale.y) > 1e-6 || Math.abs(relativeScale.y - relativeScale.z) > 1e-6;
    if (nonUniform && sourceDescriptor.type !== "box") {
      warnings.push(
        `${KHR_PHYSICS_RIGID_BODIES}: collider node ${nodeIndex} has non-uniform body-relative scale; its ${sourceDescriptor.type} shape is conservatively approximated.`
      );
    }
    const descriptor = bodyNodeIndex === nodeIndex ? sourceDescriptor : scaleDescriptor(sourceDescriptor, relativeScale);
    const material = normalizeMaterial(collider.physicsMaterial, rigidBodiesExtension, warnings, nodeIndex);
    let group = groups.get(bodyNodeIndex);
    if (group == null) {
      group = { bodyNodeIndex, motion: normalizeMotion(motion, warnings, bodyNodeIndex), colliders: [] };
      groups.set(bodyNodeIndex, group);
    }
    group.colliders.push({
      nodeIndex,
      shapeIndex,
      descriptor,
      dynamicFriction: material.dynamicFriction,
      restitution: material.restitution,
      collisionGroup: FALLBACK_COLLISION_GROUP,
      collisionMask: ALL_COLLISION_GROUPS,
      collisionFilterIndex: collider.collisionFilter,
      isSensor: declaration.isSensor,
      triggerNodeIndex: declaration.triggerNodeIndex,
      localPosition: relativeMatrix.getTranslate(),
      localRotation: Quaternion.fromMatrix(relativeMatrix)
    });
  }
  resolveCollisionFilters(groups, rigidBodiesExtension, warnings);
  return { groups: [...groups.values()], warnings };
}
function collectKhrStaticColliders(gltfModel) {
  var _a, _b, _c, _d;
  const warnings = [];
  const colliders = [];
  const implicitShapesExtension = (_a = gltfModel.extensions) == null ? void 0 : _a[KHR_IMPLICIT_SHAPES];
  const rigidBodiesExtension = (_b = gltfModel.extensions) == null ? void 0 : _b[KHR_PHYSICS_RIGID_BODIES];
  for (let nodeIndex = 0; nodeIndex < gltfModel.nodes.length; nodeIndex++) {
    const node = gltfModel.nodes[nodeIndex];
    const nodeExtension = (_c = node.extensions) == null ? void 0 : _c[KHR_PHYSICS_RIGID_BODIES];
    const collider = nodeExtension == null ? void 0 : nodeExtension.collider;
    if (collider == null) {
      continue;
    }
    if ((nodeExtension == null ? void 0 : nodeExtension.motion) != null) {
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
    const shape = (_d = implicitShapesExtension == null ? void 0 : implicitShapesExtension.shapes) == null ? void 0 : _d[shapeIndex];
    if (!Number.isInteger(shapeIndex) || shapeIndex < 0 || shape == null) {
      warnings.push(
        `${KHR_PHYSICS_RIGID_BODIES}: node ${nodeIndex} references missing implicit shape ${shapeIndex}; its collider was skipped.`
      );
      continue;
    }
    const descriptor = normalizeKhrShape(shape);
    if (descriptor == null) {
      const isBuiltIn = ["box", "sphere", "cylinder", "capsule"].includes(shape.type);
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
      collisionGroup: FALLBACK_COLLISION_GROUP,
      collisionMask: ALL_COLLISION_GROUPS
    });
  }
  return { colliders, warnings };
}
function collectKhrStaticBoxColliders(gltfModel) {
  const collection = collectKhrStaticColliders(gltfModel);
  const colliders = [];
  const warnings = [...collection.warnings];
  for (const collider of collection.colliders) {
    if (collider.descriptor.type !== "box") {
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
      restitution: collider.restitution
    });
  }
  return { colliders, warnings };
}
function hasKhrPhysicsExtension(gltfModel) {
  var _a;
  return ((_a = gltfModel.extensionsUsed) == null ? void 0 : _a.includes(KHR_PHYSICS_RIGID_BODIES)) === true;
}
async function preloadKhrPhysicsSupport(gltfModel) {
  if (!hasKhrPhysicsExtension(gltfModel)) {
    return;
  }
  if (rapierPhysicsStrategyClass != null) {
    return;
  }
  if (rapierPhysicsStrategyPromise == null) {
    rapierPhysicsStrategyPromise = import("../physics/Rapier/RapierPhysicsStrategy.js").then((module) => {
      rapierPhysicsStrategyClass = module.RapierPhysicsStrategy;
    });
  }
  await rapierPhysicsStrategyPromise;
}
function setupKhrStaticColliders(gltfModel, rnEntities) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
  const collection = collectKhrRigidBodyGroups(gltfModel);
  for (const warning of collection.warnings) {
    Logger.default.warn(warning);
  }
  if (collection.groups.length === 0) {
    return;
  }
  const bindings = [];
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
    const shapeComponent = (_a = entity.tryToGetShape()) != null ? _a : entity.engine.entityRepository.addComponentToEntity(ShapeComponent, entity).getShape();
    const shapeIndices = group.colliders.map(
      (collider) => shapeComponent.addShape(collider.descriptor, {
        position: collider.localPosition,
        rotation: collider.localRotation
      })
    );
    bindings.push({ group, entity, shapeComponent, shapeIndices });
  }
  const RapierPhysicsStrategy = rapierPhysicsStrategyClass;
  if (RapierPhysicsStrategy == null || !RapierPhysicsStrategy.isInitialized) {
    const colliderCount = bindings.reduce((sum, binding) => sum + binding.shapeIndices.length, 0);
    Logger.default.warn(
      `${KHR_PHYSICS_RIGID_BODIES}: Rapier is not loaded or not initialized; ${colliderCount} physics binding(s) were skipped.`
    );
    return;
  }
  for (const binding of bindings) {
    const physicsEntity = binding.entity.engine.entityRepository.addComponentToEntity(PhysicsComponent, binding.entity);
    const physicsComponent = physicsEntity.getPhysics();
    physicsComponent.setStrategy(new RapierPhysicsStrategy());
    physicsComponent.setMotionProperty({
      move: binding.group.motion != null,
      isKinematic: (_c = (_b = binding.group.motion) == null ? void 0 : _b.isKinematic) != null ? _c : false,
      mass: (_d = binding.group.motion) == null ? void 0 : _d.mass,
      centerOfMass: ((_e = binding.group.motion) == null ? void 0 : _e.centerOfMass) == null ? void 0 : Vector3.fromCopyArray(binding.group.motion.centerOfMass),
      inertiaDiagonal: ((_f = binding.group.motion) == null ? void 0 : _f.inertiaDiagonal) == null ? void 0 : Vector3.fromCopyArray(binding.group.motion.inertiaDiagonal),
      inertiaOrientation: ((_g = binding.group.motion) == null ? void 0 : _g.inertiaOrientation) == null ? void 0 : Quaternion.fromCopyArray(binding.group.motion.inertiaOrientation),
      linearVelocity: ((_h = binding.group.motion) == null ? void 0 : _h.linearVelocity) == null ? void 0 : Vector3.fromCopyArray(binding.group.motion.linearVelocity),
      angularVelocity: ((_i = binding.group.motion) == null ? void 0 : _i.angularVelocity) == null ? void 0 : Vector3.fromCopyArray(binding.group.motion.angularVelocity),
      gravityFactor: (_j = binding.group.motion) == null ? void 0 : _j.gravityFactor
    });
    for (let i = 0; i < binding.group.colliders.length; i++) {
      const collider = binding.group.colliders[i];
      const bindingId = physicsComponent.bindShape({
        shapeComponent: binding.shapeComponent,
        shapeIndex: binding.shapeIndices[i],
        body: {
          move: binding.group.motion != null,
          isKinematic: (_l = (_k = binding.group.motion) == null ? void 0 : _k.isKinematic) != null ? _l : false,
          density: 1
        },
        collider: {
          friction: collider.dynamicFriction,
          restitution: collider.restitution,
          collisionGroup: collider.collisionGroup,
          collisionMask: collider.collisionMask,
          isSensor: collider.isSensor
        }
      });
      if (collider.isSensor && collider.triggerNodeIndex != null) {
        const triggerEntity = rnEntities[collider.triggerNodeIndex];
        if (triggerEntity == null) {
          Logger.default.warn(
            `${KHR_PHYSICS_RIGID_BODIES}: Rhodonite entity for trigger node ${collider.triggerNodeIndex} was not found.`
          );
          continue;
        }
        const triggerComponent = (_m = triggerEntity.tryToGetTrigger()) != null ? _m : triggerEntity.engine.entityRepository.addComponentToEntity(TriggerComponent, triggerEntity).getTrigger();
        triggerComponent._registerSensorBinding(binding.entity.entityUID, bindingId);
      }
    }
  }
}
function setupKhrStaticBoxColliders(gltfModel, rnEntities) {
  setupKhrStaticColliders(gltfModel, rnEntities);
}
export {
  collectKhrRigidBodyGroups,
  collectKhrStaticBoxColliders,
  collectKhrStaticColliders,
  hasKhrPhysicsExtension,
  preloadKhrPhysicsSupport,
  setupKhrStaticBoxColliders,
  setupKhrStaticColliders
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vaW1wb3J0ZXIvS2hyUGh5c2ljc0ltcG9ydGVyLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7XG4gIEtIUkltcGxpY2l0Qm94U2l6ZSxcbiAgS0hSSW1wbGljaXRTaGFwZSxcbiAgS0hSSW1wbGljaXRTaGFwZXMsXG4gIEtIUlBoeXNpY3NDb2xsaXNpb25GaWx0ZXIsXG4gIEtIUlBoeXNpY3NHZW9tZXRyeSxcbiAgS0hSUGh5c2ljc01hdGVyaWFsLFxuICBLSFJQaHlzaWNzTW90aW9uLFxuICBLSFJQaHlzaWNzUmlnaWRCb2RpZXMsXG4gIEtIUlBoeXNpY3NSaWdpZEJvZGllc05vZGUsXG4gIFJuTTIsXG59IGZyb20gJy4uLy4uL3R5cGVzJztcbmltcG9ydCB7IFBoeXNpY3NDb21wb25lbnQgfSBmcm9tICcuLi9jb21wb25lbnRzL1BoeXNpY3MvUGh5c2ljc0NvbXBvbmVudCc7XG5pbXBvcnQgeyBTaGFwZUNvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvU2hhcGUvU2hhcGVDb21wb25lbnQnO1xuaW1wb3J0IHsgVHJpZ2dlckNvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvVHJpZ2dlci9UcmlnZ2VyQ29tcG9uZW50JztcbmltcG9ydCB7IG5vcm1hbGl6ZVNoYXBlRGVzY3JpcHRvciwgdHlwZSBTaGFwZURlc2NyaXB0b3IgfSBmcm9tICcuLi9nZW9tZXRyeS9TaGFwZSc7XG5pbXBvcnQgdHlwZSB7IElTY2VuZUdyYXBoRW50aXR5IH0gZnJvbSAnLi4vaGVscGVycy9FbnRpdHlIZWxwZXInO1xuaW1wb3J0IHR5cGUgeyBJTWF0cml4NDQgfSBmcm9tICcuLi9tYXRoL0lNYXRyaXgnO1xuaW1wb3J0IHsgTWF0cml4NDQgfSBmcm9tICcuLi9tYXRoL01hdHJpeDQ0JztcbmltcG9ydCB7IFF1YXRlcm5pb24gfSBmcm9tICcuLi9tYXRoL1F1YXRlcm5pb24nO1xuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJy4uL21hdGgvVmVjdG9yMyc7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICcuLi9taXNjL0xvZ2dlcic7XG5cbnR5cGUgUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Q2xhc3MgPSB0eXBlb2YgaW1wb3J0KCcuLi9waHlzaWNzL1JhcGllci9SYXBpZXJQaHlzaWNzU3RyYXRlZ3knKS5SYXBpZXJQaHlzaWNzU3RyYXRlZ3k7XG5cbi8qKlxuICogVGhlIFJhcGllciBzdHJhdGVneSBpcyBsb2FkZWQgb24gZGVtYW5kLiBJbXBvcnRpbmcgaXQgc3RhdGljYWxseSB3b3VsZCBtYWtlIGV2ZXJ5IGdsVEYgYXBwbGljYXRpb24gdGhhdFxuICogaW5jbHVkZXMgdGhlIGltcG9ydGVyIHBheSBmb3IgdGhlIHBoeXNpY3MgZW5naW5lIGludGVncmF0aW9uIGV2ZW4gd2hlbiBubyBtb2RlbCB1c2VzIEtIUl9waHlzaWNzX3JpZ2lkX2JvZGllcy5cbiAqL1xubGV0IHJhcGllclBoeXNpY3NTdHJhdGVneUNsYXNzOiBSYXBpZXJQaHlzaWNzU3RyYXRlZ3lDbGFzcyB8IHVuZGVmaW5lZDtcbmxldCByYXBpZXJQaHlzaWNzU3RyYXRlZ3lQcm9taXNlOiBQcm9taXNlPHZvaWQ+IHwgdW5kZWZpbmVkO1xuXG5jb25zdCBLSFJfSU1QTElDSVRfU0hBUEVTID0gJ0tIUl9pbXBsaWNpdF9zaGFwZXMnO1xuY29uc3QgS0hSX1BIWVNJQ1NfUklHSURfQk9ESUVTID0gJ0tIUl9waHlzaWNzX3JpZ2lkX2JvZGllcyc7XG5jb25zdCBERUZBVUxUX0JPWF9TSVpFOiBLSFJJbXBsaWNpdEJveFNpemUgPSBbMSwgMSwgMV07XG5jb25zdCBERUZBVUxUX1NQSEVSRV9SQURJVVMgPSAwLjU7XG5jb25zdCBERUZBVUxUX0hFSUdIVCA9IDAuNTtcbmNvbnN0IERFRkFVTFRfUkFESVVTID0gMC4yNTtcbmNvbnN0IERFRkFVTFRfRFlOQU1JQ19GUklDVElPTiA9IDAuNjtcbmNvbnN0IERFRkFVTFRfUkVTVElUVVRJT04gPSAwO1xuY29uc3QgRkFMTEJBQ0tfQ09MTElTSU9OX0dST1VQID0gMHg4MDAwO1xuY29uc3QgQUxMX0NPTExJU0lPTl9HUk9VUFMgPSAweGZmZmY7XG5jb25zdCBNQVhfS0hSX0ZJTFRFUl9QUk9GSUxFUyA9IDE1O1xuXG50eXBlIE5vcm1hbGl6ZWRDb2xsaXNpb25GaWx0ZXJQcm9maWxlID0ge1xuICBjb2xsaXNpb25TeXN0ZW1zOiByZWFkb25seSBzdHJpbmdbXTtcbiAgbW9kZTogJ2FsbCcgfCAnYWxsb3cnIHwgJ2RlbnknO1xuICB0YXJnZXRTeXN0ZW1zOiByZWFkb25seSBzdHJpbmdbXTtcbn07XG5cbmV4cG9ydCBpbnRlcmZhY2UgTm9ybWFsaXplZEtockJveENvbGxpZGVyIHtcbiAgbm9kZUluZGV4OiBudW1iZXI7XG4gIHNoYXBlSW5kZXg6IG51bWJlcjtcbiAgc2l6ZTogS0hSSW1wbGljaXRCb3hTaXplO1xuICBkeW5hbWljRnJpY3Rpb246IG51bWJlcjtcbiAgcmVzdGl0dXRpb246IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBLaHJCb3hDb2xsaWRlckNvbGxlY3Rpb24ge1xuICBjb2xsaWRlcnM6IE5vcm1hbGl6ZWRLaHJCb3hDb2xsaWRlcltdO1xuICB3YXJuaW5nczogc3RyaW5nW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTm9ybWFsaXplZEtockNvbGxpZGVyIHtcbiAgbm9kZUluZGV4OiBudW1iZXI7XG4gIHNoYXBlSW5kZXg6IG51bWJlcjtcbiAgZGVzY3JpcHRvcjogU2hhcGVEZXNjcmlwdG9yO1xuICBkeW5hbWljRnJpY3Rpb246IG51bWJlcjtcbiAgcmVzdGl0dXRpb246IG51bWJlcjtcbiAgY29sbGlzaW9uR3JvdXA6IG51bWJlcjtcbiAgY29sbGlzaW9uTWFzazogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEtockNvbGxpZGVyQ29sbGVjdGlvbiB7XG4gIGNvbGxpZGVyczogTm9ybWFsaXplZEtockNvbGxpZGVyW107XG4gIHdhcm5pbmdzOiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBOb3JtYWxpemVkS2hyQm9keUNvbGxpZGVyIGV4dGVuZHMgTm9ybWFsaXplZEtockNvbGxpZGVyIHtcbiAgbG9jYWxQb3NpdGlvbjogVmVjdG9yMztcbiAgbG9jYWxSb3RhdGlvbjogUXVhdGVybmlvbjtcbiAgLyoqIEBpbnRlcm5hbCBJbmRleCB1c2VkIHdoaWxlIHJlc29sdmluZyB0aGUgc2NlbmUtd2lkZSBmaWx0ZXIgdGFibGUuICovXG4gIGNvbGxpc2lvbkZpbHRlckluZGV4PzogbnVtYmVyO1xuICBpc1NlbnNvcj86IGJvb2xlYW47XG4gIHRyaWdnZXJOb2RlSW5kZXg/OiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTm9ybWFsaXplZEtoclJpZ2lkQm9keUdyb3VwIHtcbiAgYm9keU5vZGVJbmRleDogbnVtYmVyO1xuICBtb3Rpb24/OiBLSFJQaHlzaWNzTW90aW9uO1xuICBjb2xsaWRlcnM6IE5vcm1hbGl6ZWRLaHJCb2R5Q29sbGlkZXJbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBLaHJSaWdpZEJvZHlHcm91cENvbGxlY3Rpb24ge1xuICBncm91cHM6IE5vcm1hbGl6ZWRLaHJSaWdpZEJvZHlHcm91cFtdO1xuICB3YXJuaW5nczogc3RyaW5nW107XG59XG5cbmZ1bmN0aW9uIGlzRmluaXRlTm9uTmVnYXRpdmUodmFsdWU6IG51bWJlcik6IGJvb2xlYW4ge1xuICByZXR1cm4gTnVtYmVyLmlzRmluaXRlKHZhbHVlKSAmJiB2YWx1ZSA+PSAwO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVDb2xsaXNpb25GaWx0ZXJQcm9maWxlKFxuICBmaWx0ZXI6IEtIUlBoeXNpY3NDb2xsaXNpb25GaWx0ZXIsXG4gIHdhcm5pbmdzOiBzdHJpbmdbXSxcbiAgZmlsdGVySW5kZXg6IG51bWJlclxuKTogTm9ybWFsaXplZENvbGxpc2lvbkZpbHRlclByb2ZpbGUgfCB1bmRlZmluZWQge1xuICBpZiAoZmlsdGVyLmNvbGxpZGVXaXRoU3lzdGVtcyAhPSBudWxsICYmIGZpbHRlci5ub3RDb2xsaWRlV2l0aFN5c3RlbXMgIT0gbnVsbCkge1xuICAgIHdhcm5pbmdzLnB1c2goXG4gICAgICBgJHtLSFJfUEhZU0lDU19SSUdJRF9CT0RJRVN9OiBjb2xsaXNpb24gZmlsdGVyICR7ZmlsdGVySW5kZXh9IGRlZmluZXMgYm90aCBjb2xsaWRlV2l0aFN5c3RlbXMgYW5kIG5vdENvbGxpZGVXaXRoU3lzdGVtczsgZmFsbGJhY2sgY29sbGlzaW9uIGlzIHVzZWQuYFxuICAgICk7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICBjb25zdCBub3JtYWxpemVTdHJpbmdzID0gKHZhbHVlOiB1bmtub3duLCBwcm9wZXJ0eU5hbWU6IHN0cmluZyk6IHN0cmluZ1tdIHwgdW5kZWZpbmVkID0+IHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpIHx8IHZhbHVlLnNvbWUoaXRlbSA9PiB0eXBlb2YgaXRlbSAhPT0gJ3N0cmluZycpKSB7XG4gICAgICB3YXJuaW5ncy5wdXNoKFxuICAgICAgICBgJHtLSFJfUEhZU0lDU19SSUdJRF9CT0RJRVN9OiBjb2xsaXNpb24gZmlsdGVyICR7ZmlsdGVySW5kZXh9IGhhcyBpbnZhbGlkICR7cHJvcGVydHlOYW1lfTsgZmFsbGJhY2sgY29sbGlzaW9uIGlzIHVzZWQuYFxuICAgICAgKTtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiBbLi4ubmV3IFNldCh2YWx1ZSldLnNvcnQoKTtcbiAgfTtcbiAgY29uc3QgY29sbGlzaW9uU3lzdGVtcyA9IG5vcm1hbGl6ZVN0cmluZ3MoZmlsdGVyLmNvbGxpc2lvblN5c3RlbXMsICdjb2xsaXNpb25TeXN0ZW1zJyk7XG4gIGNvbnN0IHRhcmdldFNvdXJjZSA9IGZpbHRlci5jb2xsaWRlV2l0aFN5c3RlbXMgPz8gZmlsdGVyLm5vdENvbGxpZGVXaXRoU3lzdGVtcztcbiAgY29uc3QgdGFyZ2V0U3lzdGVtcyA9IG5vcm1hbGl6ZVN0cmluZ3MoXG4gICAgdGFyZ2V0U291cmNlLFxuICAgIGZpbHRlci5jb2xsaWRlV2l0aFN5c3RlbXMgIT0gbnVsbCA/ICdjb2xsaWRlV2l0aFN5c3RlbXMnIDogJ25vdENvbGxpZGVXaXRoU3lzdGVtcydcbiAgKTtcbiAgaWYgKGNvbGxpc2lvblN5c3RlbXMgPT0gbnVsbCB8fCB0YXJnZXRTeXN0ZW1zID09IG51bGwpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG4gIHJldHVybiB7XG4gICAgY29sbGlzaW9uU3lzdGVtcyxcbiAgICBtb2RlOiBmaWx0ZXIuY29sbGlkZVdpdGhTeXN0ZW1zICE9IG51bGwgPyAnYWxsb3cnIDogZmlsdGVyLm5vdENvbGxpZGVXaXRoU3lzdGVtcyAhPSBudWxsID8gJ2RlbnknIDogJ2FsbCcsXG4gICAgdGFyZ2V0U3lzdGVtcyxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29sbGlzaW9uRmlsdGVyUHJvZmlsZUtleShwcm9maWxlOiBOb3JtYWxpemVkQ29sbGlzaW9uRmlsdGVyUHJvZmlsZSk6IHN0cmluZyB7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeShbcHJvZmlsZS5jb2xsaXNpb25TeXN0ZW1zLCBwcm9maWxlLm1vZGUsIHByb2ZpbGUudGFyZ2V0U3lzdGVtc10pO1xufVxuXG5mdW5jdGlvbiBwcm9maWxlUGVybWl0cyhwcm9maWxlOiBOb3JtYWxpemVkQ29sbGlzaW9uRmlsdGVyUHJvZmlsZSwgb3RoZXI6IE5vcm1hbGl6ZWRDb2xsaXNpb25GaWx0ZXJQcm9maWxlKTogYm9vbGVhbiB7XG4gIGlmIChwcm9maWxlLm1vZGUgPT09ICdhbGwnKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgY29uc3QgdGFyZ2V0cyA9IG5ldyBTZXQocHJvZmlsZS50YXJnZXRTeXN0ZW1zKTtcbiAgaWYgKHByb2ZpbGUubW9kZSA9PT0gJ2FsbG93Jykge1xuICAgIHJldHVybiBvdGhlci5jb2xsaXNpb25TeXN0ZW1zLnNvbWUoc3lzdGVtID0+IHRhcmdldHMuaGFzKHN5c3RlbSkpO1xuICB9XG4gIHJldHVybiBvdGhlci5jb2xsaXNpb25TeXN0ZW1zLmV2ZXJ5KHN5c3RlbSA9PiAhdGFyZ2V0cy5oYXMoc3lzdGVtKSk7XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVDb2xsaXNpb25GaWx0ZXJzKFxuICBncm91cHM6IE1hcDxudW1iZXIsIE5vcm1hbGl6ZWRLaHJSaWdpZEJvZHlHcm91cD4sXG4gIGV4dGVuc2lvbjogS0hSUGh5c2ljc1JpZ2lkQm9kaWVzIHwgdW5kZWZpbmVkLFxuICB3YXJuaW5nczogc3RyaW5nW11cbik6IHZvaWQge1xuICBjb25zdCBwcm9maWxlQnlLZXkgPSBuZXcgTWFwPHN0cmluZywgeyBwcm9maWxlOiBOb3JtYWxpemVkQ29sbGlzaW9uRmlsdGVyUHJvZmlsZTsgYml0OiBudW1iZXIgfT4oKTtcbiAgY29uc3QgcmVzb2x2ZWRCeUZpbHRlckluZGV4ID0gbmV3IE1hcDxcbiAgICBudW1iZXIsXG4gICAgeyBwcm9maWxlOiBOb3JtYWxpemVkQ29sbGlzaW9uRmlsdGVyUHJvZmlsZTsgYml0OiBudW1iZXIgfSB8IHVuZGVmaW5lZFxuICA+KCk7XG4gIGxldCBvdmVyZmxvd1dhcm5lZCA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgZ3JvdXAgb2YgZ3JvdXBzLnZhbHVlcygpKSB7XG4gICAgZm9yIChjb25zdCBjb2xsaWRlciBvZiBncm91cC5jb2xsaWRlcnMpIHtcbiAgICAgIGNvbnN0IGZpbHRlckluZGV4ID0gY29sbGlkZXIuY29sbGlzaW9uRmlsdGVySW5kZXg7XG4gICAgICBpZiAoZmlsdGVySW5kZXggPT0gbnVsbCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGxldCByZXNvbHZlZCA9IHJlc29sdmVkQnlGaWx0ZXJJbmRleC5nZXQoZmlsdGVySW5kZXgpO1xuICAgICAgaWYgKCFyZXNvbHZlZEJ5RmlsdGVySW5kZXguaGFzKGZpbHRlckluZGV4KSkge1xuICAgICAgICBjb25zdCBzb3VyY2UgPSBleHRlbnNpb24/LmNvbGxpc2lvbkZpbHRlcnM/LltmaWx0ZXJJbmRleF07XG4gICAgICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihmaWx0ZXJJbmRleCkgfHwgZmlsdGVySW5kZXggPCAwIHx8IHNvdXJjZSA9PSBudWxsKSB7XG4gICAgICAgICAgd2FybmluZ3MucHVzaChcbiAgICAgICAgICAgIGAke0tIUl9QSFlTSUNTX1JJR0lEX0JPRElFU306IGNvbGxpZGVyIG5vZGUgJHtjb2xsaWRlci5ub2RlSW5kZXh9IHJlZmVyZW5jZXMgbWlzc2luZyBjb2xsaXNpb24gZmlsdGVyICR7ZmlsdGVySW5kZXh9OyBmYWxsYmFjayBjb2xsaXNpb24gaXMgdXNlZC5gXG4gICAgICAgICAgKTtcbiAgICAgICAgICByZXNvbHZlZEJ5RmlsdGVySW5kZXguc2V0KGZpbHRlckluZGV4LCB1bmRlZmluZWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IHByb2ZpbGUgPSBub3JtYWxpemVDb2xsaXNpb25GaWx0ZXJQcm9maWxlKHNvdXJjZSwgd2FybmluZ3MsIGZpbHRlckluZGV4KTtcbiAgICAgICAgICBpZiAocHJvZmlsZSAhPSBudWxsKSB7XG4gICAgICAgICAgICBjb25zdCBrZXkgPSBjb2xsaXNpb25GaWx0ZXJQcm9maWxlS2V5KHByb2ZpbGUpO1xuICAgICAgICAgICAgcmVzb2x2ZWQgPSBwcm9maWxlQnlLZXkuZ2V0KGtleSk7XG4gICAgICAgICAgICBpZiAocmVzb2x2ZWQgPT0gbnVsbCAmJiBwcm9maWxlQnlLZXkuc2l6ZSA8IE1BWF9LSFJfRklMVEVSX1BST0ZJTEVTKSB7XG4gICAgICAgICAgICAgIHJlc29sdmVkID0geyBwcm9maWxlLCBiaXQ6IDEgPDwgcHJvZmlsZUJ5S2V5LnNpemUgfTtcbiAgICAgICAgICAgICAgcHJvZmlsZUJ5S2V5LnNldChrZXksIHJlc29sdmVkKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzb2x2ZWQgPT0gbnVsbCAmJiAhb3ZlcmZsb3dXYXJuZWQpIHtcbiAgICAgICAgICAgICAgd2FybmluZ3MucHVzaChcbiAgICAgICAgICAgICAgICBgJHtLSFJfUEhZU0lDU19SSUdJRF9CT0RJRVN9OiBtb3JlIHRoYW4gJHtNQVhfS0hSX0ZJTFRFUl9QUk9GSUxFU30gY29sbGlzaW9uIGZpbHRlciBwcm9maWxlcyBhcmUgdXNlZDsgcHJvZmlsZSAke2ZpbHRlckluZGV4fSBhbmQgc3Vic2VxdWVudCBvdmVyZmxvdyBwcm9maWxlcyB1c2UgZmFsbGJhY2sgY29sbGlzaW9uLmBcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgb3ZlcmZsb3dXYXJuZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXNvbHZlZEJ5RmlsdGVySW5kZXguc2V0KGZpbHRlckluZGV4LCByZXNvbHZlZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChyZXNvbHZlZCAhPSBudWxsKSB7XG4gICAgICAgIGNvbGxpZGVyLmNvbGxpc2lvbkdyb3VwID0gcmVzb2x2ZWQuYml0O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHByb2ZpbGVzID0gWy4uLnByb2ZpbGVCeUtleS52YWx1ZXMoKV07XG4gIGZvciAoY29uc3QgZ3JvdXAgb2YgZ3JvdXBzLnZhbHVlcygpKSB7XG4gICAgZm9yIChjb25zdCBjb2xsaWRlciBvZiBncm91cC5jb2xsaWRlcnMpIHtcbiAgICAgIGNvbnN0IHJlc29sdmVkID1cbiAgICAgICAgY29sbGlkZXIuY29sbGlzaW9uRmlsdGVySW5kZXggPT0gbnVsbCA/IHVuZGVmaW5lZCA6IHJlc29sdmVkQnlGaWx0ZXJJbmRleC5nZXQoY29sbGlkZXIuY29sbGlzaW9uRmlsdGVySW5kZXgpO1xuICAgICAgaWYgKHJlc29sdmVkID09IG51bGwpIHtcbiAgICAgICAgY29sbGlkZXIuY29sbGlzaW9uR3JvdXAgPSBGQUxMQkFDS19DT0xMSVNJT05fR1JPVVA7XG4gICAgICAgIGNvbGxpZGVyLmNvbGxpc2lvbk1hc2sgPSBBTExfQ09MTElTSU9OX0dST1VQUztcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBsZXQgbWFzayA9IEZBTExCQUNLX0NPTExJU0lPTl9HUk9VUDtcbiAgICAgIGZvciAoY29uc3Qgb3RoZXIgb2YgcHJvZmlsZXMpIHtcbiAgICAgICAgaWYgKHByb2ZpbGVQZXJtaXRzKHJlc29sdmVkLnByb2ZpbGUsIG90aGVyLnByb2ZpbGUpICYmIHByb2ZpbGVQZXJtaXRzKG90aGVyLnByb2ZpbGUsIHJlc29sdmVkLnByb2ZpbGUpKSB7XG4gICAgICAgICAgbWFzayB8PSBvdGhlci5iaXQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbGxpZGVyLmNvbGxpc2lvbk1hc2sgPSBtYXNrO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBub3JtYWxpemVNb3Rpb24oXG4gIG1vdGlvbjogS0hSUGh5c2ljc01vdGlvbiB8IHVuZGVmaW5lZCxcbiAgd2FybmluZ3M6IHN0cmluZ1tdLFxuICBub2RlSW5kZXg6IG51bWJlclxuKTogS0hSUGh5c2ljc01vdGlvbiB8IHVuZGVmaW5lZCB7XG4gIGlmIChtb3Rpb24gPT0gbnVsbCkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgY29uc3Qgbm9ybWFsaXplZDogS0hSUGh5c2ljc01vdGlvbiA9IHtcbiAgICBpc0tpbmVtYXRpYzogbW90aW9uLmlzS2luZW1hdGljLFxuICB9O1xuICBpZiAobW90aW9uLm1hc3MgIT0gbnVsbCkge1xuICAgIGlmICghTnVtYmVyLmlzRmluaXRlKG1vdGlvbi5tYXNzKSB8fCBtb3Rpb24ubWFzcyA8IDApIHtcbiAgICAgIHdhcm5pbmdzLnB1c2goYCR7S0hSX1BIWVNJQ1NfUklHSURfQk9ESUVTfTogbW90aW9uIG5vZGUgJHtub2RlSW5kZXh9IGhhcyBpbnZhbGlkIG1hc3M7IGl0IGlzIGlnbm9yZWQuYCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5vcm1hbGl6ZWQubWFzcyA9IG1vdGlvbi5tYXNzO1xuICAgIH1cbiAgfVxuICBmb3IgKGNvbnN0IG5hbWUgb2YgWydjZW50ZXJPZk1hc3MnLCAnbGluZWFyVmVsb2NpdHknLCAnYW5ndWxhclZlbG9jaXR5J10gYXMgY29uc3QpIHtcbiAgICBjb25zdCB2YWx1ZSA9IG1vdGlvbltuYW1lXTtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZSkgfHwgdmFsdWUubGVuZ3RoICE9PSAzIHx8IHZhbHVlLnNvbWUoY29tcG9uZW50ID0+ICFOdW1iZXIuaXNGaW5pdGUoY29tcG9uZW50KSkpIHtcbiAgICAgIHdhcm5pbmdzLnB1c2goYCR7S0hSX1BIWVNJQ1NfUklHSURfQk9ESUVTfTogbW90aW9uIG5vZGUgJHtub2RlSW5kZXh9IGhhcyBpbnZhbGlkICR7bmFtZX07IGl0IGlzIGlnbm9yZWQuYCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5vcm1hbGl6ZWRbbmFtZV0gPSBbLi4udmFsdWVdO1xuICAgIH1cbiAgfVxuICBpZiAobW90aW9uLmluZXJ0aWFEaWFnb25hbCAhPSBudWxsKSB7XG4gICAgaWYgKFxuICAgICAgIUFycmF5LmlzQXJyYXkobW90aW9uLmluZXJ0aWFEaWFnb25hbCkgfHxcbiAgICAgIG1vdGlvbi5pbmVydGlhRGlhZ29uYWwubGVuZ3RoICE9PSAzIHx8XG4gICAgICBtb3Rpb24uaW5lcnRpYURpYWdvbmFsLnNvbWUoY29tcG9uZW50ID0+ICFOdW1iZXIuaXNGaW5pdGUoY29tcG9uZW50KSB8fCBjb21wb25lbnQgPCAwKVxuICAgICkge1xuICAgICAgd2FybmluZ3MucHVzaChcbiAgICAgICAgYCR7S0hSX1BIWVNJQ1NfUklHSURfQk9ESUVTfTogbW90aW9uIG5vZGUgJHtub2RlSW5kZXh9IGhhcyBpbnZhbGlkIGluZXJ0aWFEaWFnb25hbDsgaXQgaXMgaWdub3JlZC5gXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBub3JtYWxpemVkLmluZXJ0aWFEaWFnb25hbCA9IFsuLi5tb3Rpb24uaW5lcnRpYURpYWdvbmFsXTtcbiAgICB9XG4gIH1cbiAgaWYgKG1vdGlvbi5pbmVydGlhT3JpZW50YXRpb24gIT0gbnVsbCkge1xuICAgIGNvbnN0IHZhbHVlID0gbW90aW9uLmluZXJ0aWFPcmllbnRhdGlvbjtcbiAgICBjb25zdCBoYXNWYWxpZENvbXBvbmVudHMgPVxuICAgICAgQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID09PSA0ICYmIHZhbHVlLmV2ZXJ5KGNvbXBvbmVudCA9PiBOdW1iZXIuaXNGaW5pdGUoY29tcG9uZW50KSk7XG4gICAgY29uc3QgbGVuZ3RoU3F1YXJlZCA9IGhhc1ZhbGlkQ29tcG9uZW50cyA/IHZhbHVlLnJlZHVjZSgoc3VtLCBjb21wb25lbnQpID0+IHN1bSArIGNvbXBvbmVudCAqIGNvbXBvbmVudCwgMCkgOiAwO1xuICAgIGlmICghaGFzVmFsaWRDb21wb25lbnRzIHx8IGxlbmd0aFNxdWFyZWQgPT09IDApIHtcbiAgICAgIHdhcm5pbmdzLnB1c2goXG4gICAgICAgIGAke0tIUl9QSFlTSUNTX1JJR0lEX0JPRElFU306IG1vdGlvbiBub2RlICR7bm9kZUluZGV4fSBoYXMgaW52YWxpZCBpbmVydGlhT3JpZW50YXRpb247IGl0IGlzIGlnbm9yZWQuYFxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgaW52ZXJzZUxlbmd0aCA9IDEgLyBNYXRoLnNxcnQobGVuZ3RoU3F1YXJlZCk7XG4gICAgICBub3JtYWxpemVkLmluZXJ0aWFPcmllbnRhdGlvbiA9IHZhbHVlLm1hcChjb21wb25lbnQgPT4gY29tcG9uZW50ICogaW52ZXJzZUxlbmd0aCk7XG4gICAgfVxuICB9XG4gIGlmIChtb3Rpb24uZ3Jhdml0eUZhY3RvciAhPSBudWxsKSB7XG4gICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUobW90aW9uLmdyYXZpdHlGYWN0b3IpKSB7XG4gICAgICB3YXJuaW5ncy5wdXNoKGAke0tIUl9QSFlTSUNTX1JJR0lEX0JPRElFU306IG1vdGlvbiBub2RlICR7bm9kZUluZGV4fSBoYXMgaW52YWxpZCBncmF2aXR5RmFjdG9yOyBpdCBpcyBpZ25vcmVkLmApO1xuICAgIH0gZWxzZSB7XG4gICAgICBub3JtYWxpemVkLmdyYXZpdHlGYWN0b3IgPSBtb3Rpb24uZ3Jhdml0eUZhY3RvcjtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5vcm1hbGl6ZWQ7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUtoclNoYXBlKHNoYXBlOiBLSFJJbXBsaWNpdFNoYXBlKTogU2hhcGVEZXNjcmlwdG9yIHwgdW5kZWZpbmVkIHtcbiAgY29uc3QgcGFyYW1ldGVyTmFtZXMgPSBbJ3BsYW5lJywgJ3NwaGVyZScsICdib3gnLCAnY3lsaW5kZXInLCAnY2Fwc3VsZSddIGFzIGNvbnN0O1xuICBjb25zdCBzdXBwbGllZFBhcmFtZXRlcnMgPSBwYXJhbWV0ZXJOYW1lcy5maWx0ZXIobmFtZSA9PiBzaGFwZVtuYW1lXSAhPSBudWxsKTtcbiAgaWYgKHN1cHBsaWVkUGFyYW1ldGVycy5zb21lKG5hbWUgPT4gbmFtZSAhPT0gc2hhcGUudHlwZSkgfHwgc3VwcGxpZWRQYXJhbWV0ZXJzLmxlbmd0aCA+IDEpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBpZiAoc2hhcGUudHlwZSA9PT0gJ2JveCcpIHtcbiAgICAgIGNvbnN0IHNpemUgPSBzaGFwZS5ib3g/LnNpemUgPz8gREVGQVVMVF9CT1hfU0laRTtcbiAgICAgIGlmIChzaXplLmxlbmd0aCAhPT0gMykge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5vcm1hbGl6ZVNoYXBlRGVzY3JpcHRvcih7IHR5cGU6ICdib3gnLCBzaXplOiBWZWN0b3IzLmZyb21Db3B5QXJyYXkoc2l6ZSkgfSk7XG4gICAgfVxuICAgIGlmIChzaGFwZS50eXBlID09PSAnc3BoZXJlJykge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZVNoYXBlRGVzY3JpcHRvcih7IHR5cGU6ICdzcGhlcmUnLCByYWRpdXM6IHNoYXBlLnNwaGVyZT8ucmFkaXVzID8/IERFRkFVTFRfU1BIRVJFX1JBRElVUyB9KTtcbiAgICB9XG4gICAgaWYgKHNoYXBlLnR5cGUgPT09ICdjeWxpbmRlcicpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVTaGFwZURlc2NyaXB0b3Ioe1xuICAgICAgICB0eXBlOiAnY3lsaW5kZXInLFxuICAgICAgICBoZWlnaHQ6IHNoYXBlLmN5bGluZGVyPy5oZWlnaHQgPz8gREVGQVVMVF9IRUlHSFQsXG4gICAgICAgIHJhZGl1c0JvdHRvbTogc2hhcGUuY3lsaW5kZXI/LnJhZGl1c0JvdHRvbSA/PyBERUZBVUxUX1JBRElVUyxcbiAgICAgICAgcmFkaXVzVG9wOiBzaGFwZS5jeWxpbmRlcj8ucmFkaXVzVG9wID8/IERFRkFVTFRfUkFESVVTLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChzaGFwZS50eXBlID09PSAnY2Fwc3VsZScpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVTaGFwZURlc2NyaXB0b3Ioe1xuICAgICAgICB0eXBlOiAnY2Fwc3VsZScsXG4gICAgICAgIGhlaWdodDogc2hhcGUuY2Fwc3VsZT8uaGVpZ2h0ID8/IERFRkFVTFRfSEVJR0hULFxuICAgICAgICByYWRpdXNCb3R0b206IHNoYXBlLmNhcHN1bGU/LnJhZGl1c0JvdHRvbSA/PyBERUZBVUxUX1JBRElVUyxcbiAgICAgICAgcmFkaXVzVG9wOiBzaGFwZS5jYXBzdWxlPy5yYWRpdXNUb3AgPz8gREVGQVVMVF9SQURJVVMsXG4gICAgICB9KTtcbiAgICB9XG4gIH0gY2F0Y2ggKF9lcnJvcikge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplTWF0ZXJpYWwoXG4gIG1hdGVyaWFsSW5kZXg6IG51bWJlciB8IHVuZGVmaW5lZCxcbiAgZXh0ZW5zaW9uOiBLSFJQaHlzaWNzUmlnaWRCb2RpZXMgfCB1bmRlZmluZWQsXG4gIHdhcm5pbmdzOiBzdHJpbmdbXSxcbiAgbm9kZUluZGV4OiBudW1iZXJcbikge1xuICBpZiAobWF0ZXJpYWxJbmRleCA9PSBudWxsKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGR5bmFtaWNGcmljdGlvbjogREVGQVVMVF9EWU5BTUlDX0ZSSUNUSU9OLFxuICAgICAgcmVzdGl0dXRpb246IERFRkFVTFRfUkVTVElUVVRJT04sXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IG1hdGVyaWFsOiBLSFJQaHlzaWNzTWF0ZXJpYWwgfCB1bmRlZmluZWQgPSBleHRlbnNpb24/LnBoeXNpY3NNYXRlcmlhbHM/LlttYXRlcmlhbEluZGV4XTtcbiAgaWYgKG1hdGVyaWFsID09IG51bGwpIHtcbiAgICB3YXJuaW5ncy5wdXNoKFxuICAgICAgYCR7S0hSX1BIWVNJQ1NfUklHSURfQk9ESUVTfTogbm9kZSAke25vZGVJbmRleH0gcmVmZXJlbmNlcyBtaXNzaW5nIHBoeXNpY3MgbWF0ZXJpYWwgJHttYXRlcmlhbEluZGV4fTsgZGVmYXVsdHMgYXJlIHVzZWQuYFxuICAgICk7XG4gICAgcmV0dXJuIHtcbiAgICAgIGR5bmFtaWNGcmljdGlvbjogREVGQVVMVF9EWU5BTUlDX0ZSSUNUSU9OLFxuICAgICAgcmVzdGl0dXRpb246IERFRkFVTFRfUkVTVElUVVRJT04sXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IGR5bmFtaWNGcmljdGlvbiA9IG1hdGVyaWFsLmR5bmFtaWNGcmljdGlvbiA/PyBERUZBVUxUX0RZTkFNSUNfRlJJQ1RJT047XG4gIGNvbnN0IHJlc3RpdHV0aW9uID0gbWF0ZXJpYWwucmVzdGl0dXRpb24gPz8gREVGQVVMVF9SRVNUSVRVVElPTjtcbiAgaWYgKCFpc0Zpbml0ZU5vbk5lZ2F0aXZlKGR5bmFtaWNGcmljdGlvbikgfHwgIWlzRmluaXRlTm9uTmVnYXRpdmUocmVzdGl0dXRpb24pKSB7XG4gICAgd2FybmluZ3MucHVzaChgJHtLSFJfUEhZU0lDU19SSUdJRF9CT0RJRVN9OiBub2RlICR7bm9kZUluZGV4fSBoYXMgYW4gaW52YWxpZCBwaHlzaWNzIG1hdGVyaWFsOyBkZWZhdWx0cyBhcmUgdXNlZC5gKTtcbiAgICByZXR1cm4ge1xuICAgICAgZHluYW1pY0ZyaWN0aW9uOiBERUZBVUxUX0RZTkFNSUNfRlJJQ1RJT04sXG4gICAgICByZXN0aXR1dGlvbjogREVGQVVMVF9SRVNUSVRVVElPTixcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIHsgZHluYW1pY0ZyaWN0aW9uLCByZXN0aXR1dGlvbiB9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVOb2RlTG9jYWxNYXRyaXgobm9kZTogUm5NMlsnbm9kZXMnXVtudW1iZXJdKTogTWF0cml4NDQge1xuICBpZiAobm9kZS5tYXRyaXggIT0gbnVsbCkge1xuICAgIHJldHVybiBNYXRyaXg0NC5mcm9tQ29weUFycmF5Q29sdW1uTWFqb3Iobm9kZS5tYXRyaXgpO1xuICB9XG4gIGNvbnN0IHRyYW5zbGF0aW9uID0gVmVjdG9yMy5mcm9tQ29weUFycmF5KG5vZGUudHJhbnNsYXRpb24gPz8gWzAsIDAsIDBdKTtcbiAgY29uc3Qgcm90YXRpb24gPSBRdWF0ZXJuaW9uLmZyb21Db3B5QXJyYXkobm9kZS5yb3RhdGlvbiA/PyBbMCwgMCwgMCwgMV0pO1xuICBjb25zdCBzY2FsZSA9IFZlY3RvcjMuZnJvbUNvcHlBcnJheShub2RlLnNjYWxlID8/IFsxLCAxLCAxXSk7XG4gIHJldHVybiBNYXRyaXg0NC5tdWx0aXBseShcbiAgICBNYXRyaXg0NC5tdWx0aXBseShNYXRyaXg0NC50cmFuc2xhdGUodHJhbnNsYXRpb24pLCBNYXRyaXg0NC5mcm9tQ29weVF1YXRlcm5pb24ocm90YXRpb24pKSxcbiAgICBNYXRyaXg0NC5zY2FsZShzY2FsZSlcbiAgKTtcbn1cblxuZnVuY3Rpb24gc2NhbGVEZXNjcmlwdG9yKGRlc2NyaXB0b3I6IFNoYXBlRGVzY3JpcHRvciwgc2NhbGU6IFZlY3RvcjMpOiBTaGFwZURlc2NyaXB0b3Ige1xuICBjb25zdCB4ID0gTWF0aC5hYnMoc2NhbGUueCk7XG4gIGNvbnN0IHkgPSBNYXRoLmFicyhzY2FsZS55KTtcbiAgY29uc3QgeiA9IE1hdGguYWJzKHNjYWxlLnopO1xuICBpZiAoZGVzY3JpcHRvci50eXBlID09PSAnYm94Jykge1xuICAgIHJldHVybiBub3JtYWxpemVTaGFwZURlc2NyaXB0b3Ioe1xuICAgICAgdHlwZTogJ2JveCcsXG4gICAgICBzaXplOiBWZWN0b3IzLmZyb21Db3B5MyhkZXNjcmlwdG9yLnNpemUueCAqIHgsIGRlc2NyaXB0b3Iuc2l6ZS55ICogeSwgZGVzY3JpcHRvci5zaXplLnogKiB6KSxcbiAgICB9KTtcbiAgfVxuICBpZiAoZGVzY3JpcHRvci50eXBlID09PSAnc3BoZXJlJykge1xuICAgIHJldHVybiBub3JtYWxpemVTaGFwZURlc2NyaXB0b3IoeyB0eXBlOiAnc3BoZXJlJywgcmFkaXVzOiBkZXNjcmlwdG9yLnJhZGl1cyAqIE1hdGgubWF4KHgsIHksIHopIH0pO1xuICB9XG4gIGlmIChkZXNjcmlwdG9yLnR5cGUgPT09ICdjeWxpbmRlcicpIHtcbiAgICBjb25zdCByYWRpYWxTY2FsZSA9IE1hdGgubWF4KHgsIHopO1xuICAgIHJldHVybiBub3JtYWxpemVTaGFwZURlc2NyaXB0b3Ioe1xuICAgICAgdHlwZTogJ2N5bGluZGVyJyxcbiAgICAgIGhlaWdodDogZGVzY3JpcHRvci5oZWlnaHQgKiB5LFxuICAgICAgcmFkaXVzQm90dG9tOiBkZXNjcmlwdG9yLnJhZGl1c0JvdHRvbSAqIHJhZGlhbFNjYWxlLFxuICAgICAgcmFkaXVzVG9wOiBkZXNjcmlwdG9yLnJhZGl1c1RvcCAqIHJhZGlhbFNjYWxlLFxuICAgIH0pO1xuICB9XG4gIGNvbnN0IHJhZGlhbFNjYWxlID0gTWF0aC5tYXgoeCwgeSwgeik7XG4gIHJldHVybiBub3JtYWxpemVTaGFwZURlc2NyaXB0b3Ioe1xuICAgIHR5cGU6ICdjYXBzdWxlJyxcbiAgICBoZWlnaHQ6IGRlc2NyaXB0b3IuaGVpZ2h0ICogeSxcbiAgICByYWRpdXNCb3R0b206IGRlc2NyaXB0b3IucmFkaXVzQm90dG9tICogcmFkaWFsU2NhbGUsXG4gICAgcmFkaXVzVG9wOiBkZXNjcmlwdG9yLnJhZGl1c1RvcCAqIHJhZGlhbFNjYWxlLFxuICB9KTtcbn1cblxuZnVuY3Rpb24gaGFzU2hlYXIobWF0cml4OiBJTWF0cml4NDQsIHNjYWxlOiBWZWN0b3IzKTogYm9vbGVhbiB7XG4gIGlmIChzY2FsZS54ID09PSAwIHx8IHNjYWxlLnkgPT09IDAgfHwgc2NhbGUueiA9PT0gMCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjb25zdCB4eSA9IChtYXRyaXgubTAwICogbWF0cml4Lm0wMSArIG1hdHJpeC5tMTAgKiBtYXRyaXgubTExICsgbWF0cml4Lm0yMCAqIG1hdHJpeC5tMjEpIC8gKHNjYWxlLnggKiBzY2FsZS55KTtcbiAgY29uc3QgeHogPSAobWF0cml4Lm0wMCAqIG1hdHJpeC5tMDIgKyBtYXRyaXgubTEwICogbWF0cml4Lm0xMiArIG1hdHJpeC5tMjAgKiBtYXRyaXgubTIyKSAvIChzY2FsZS54ICogc2NhbGUueik7XG4gIGNvbnN0IHl6ID0gKG1hdHJpeC5tMDEgKiBtYXRyaXgubTAyICsgbWF0cml4Lm0xMSAqIG1hdHJpeC5tMTIgKyBtYXRyaXgubTIxICogbWF0cml4Lm0yMikgLyAoc2NhbGUueSAqIHNjYWxlLnopO1xuICByZXR1cm4gTWF0aC5hYnMoeHkpID4gMC4wMDAwMDEgfHwgTWF0aC5hYnMoeHopID4gMC4wMDAwMDEgfHwgTWF0aC5hYnMoeXopID4gMC4wMDAwMDE7XG59XG5cbi8qKiBSZXNvbHZlcyBjb2xsaWRlciBvd25lcnNoaXAgYW5kIGJvZHktcmVsYXRpdmUgdHJhbnNmb3JtcyBhY2NvcmRpbmcgdG8gdGhlIEtIUiBub2RlIGhpZXJhcmNoeSBydWxlcy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb2xsZWN0S2hyUmlnaWRCb2R5R3JvdXBzKGdsdGZNb2RlbDogUm5NMik6IEtoclJpZ2lkQm9keUdyb3VwQ29sbGVjdGlvbiB7XG4gIGNvbnN0IHdhcm5pbmdzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBncm91cHMgPSBuZXcgTWFwPG51bWJlciwgTm9ybWFsaXplZEtoclJpZ2lkQm9keUdyb3VwPigpO1xuICBjb25zdCBwYXJlbnRJbmRpY2VzID0gbmV3IEFycmF5PG51bWJlciB8IHVuZGVmaW5lZD4oZ2x0Zk1vZGVsLm5vZGVzLmxlbmd0aCk7XG4gIGZvciAobGV0IHBhcmVudEluZGV4ID0gMDsgcGFyZW50SW5kZXggPCBnbHRmTW9kZWwubm9kZXMubGVuZ3RoOyBwYXJlbnRJbmRleCsrKSB7XG4gICAgZm9yIChjb25zdCBjaGlsZEluZGV4IG9mIGdsdGZNb2RlbC5ub2Rlc1twYXJlbnRJbmRleF0uY2hpbGRyZW4gPz8gW10pIHtcbiAgICAgIHBhcmVudEluZGljZXNbY2hpbGRJbmRleF0gPSBwYXJlbnRJbmRleDtcbiAgICB9XG4gIH1cbiAgY29uc3QgbG9jYWxNYXRyaWNlcyA9IGdsdGZNb2RlbC5ub2Rlcy5tYXAoY3JlYXRlTm9kZUxvY2FsTWF0cml4KTtcbiAgY29uc3Qgd29ybGRNYXRyaWNlcyA9IG5ldyBNYXA8bnVtYmVyLCBNYXRyaXg0ND4oKTtcbiAgY29uc3QgZ2V0V29ybGRNYXRyaXggPSAobm9kZUluZGV4OiBudW1iZXIpOiBNYXRyaXg0NCA9PiB7XG4gICAgY29uc3QgY2FjaGVkID0gd29ybGRNYXRyaWNlcy5nZXQobm9kZUluZGV4KTtcbiAgICBpZiAoY2FjaGVkICE9IG51bGwpIHtcbiAgICAgIHJldHVybiBjYWNoZWQ7XG4gICAgfVxuICAgIGNvbnN0IHBhcmVudEluZGV4ID0gcGFyZW50SW5kaWNlc1tub2RlSW5kZXhdO1xuICAgIGNvbnN0IG1hdHJpeCA9XG4gICAgICBwYXJlbnRJbmRleCA9PSBudWxsXG4gICAgICAgID8gbG9jYWxNYXRyaWNlc1tub2RlSW5kZXhdXG4gICAgICAgIDogTWF0cml4NDQubXVsdGlwbHkoZ2V0V29ybGRNYXRyaXgocGFyZW50SW5kZXgpLCBsb2NhbE1hdHJpY2VzW25vZGVJbmRleF0pO1xuICAgIHdvcmxkTWF0cmljZXMuc2V0KG5vZGVJbmRleCwgbWF0cml4KTtcbiAgICByZXR1cm4gbWF0cml4O1xuICB9O1xuICBjb25zdCBpbXBsaWNpdFNoYXBlc0V4dGVuc2lvbiA9IGdsdGZNb2RlbC5leHRlbnNpb25zPy5bS0hSX0lNUExJQ0lUX1NIQVBFU10gYXMgS0hSSW1wbGljaXRTaGFwZXMgfCB1bmRlZmluZWQ7XG4gIGNvbnN0IHJpZ2lkQm9kaWVzRXh0ZW5zaW9uID0gZ2x0Zk1vZGVsLmV4dGVuc2lvbnM/LltLSFJfUEhZU0lDU19SSUdJRF9CT0RJRVNdIGFzIEtIUlBoeXNpY3NSaWdpZEJvZGllcyB8IHVuZGVmaW5lZDtcbiAgY29uc3Qgc291cmNlRGVzY3JpcHRvcnMgPSBuZXcgTWFwPG51bWJlciwgU2hhcGVEZXNjcmlwdG9yPigpO1xuXG4gIGNvbnN0IGRlY2xhcmF0aW9uczogQXJyYXk8e1xuICAgIG5vZGVJbmRleDogbnVtYmVyO1xuICAgIGNvbGxpZGVyOiB7IGdlb21ldHJ5OiBLSFJQaHlzaWNzR2VvbWV0cnk7IHBoeXNpY3NNYXRlcmlhbD86IG51bWJlcjsgY29sbGlzaW9uRmlsdGVyPzogbnVtYmVyIH07XG4gICAgaXNTZW5zb3I6IGJvb2xlYW47XG4gICAgdHJpZ2dlck5vZGVJbmRleD86IG51bWJlcjtcbiAgfT4gPSBbXTtcbiAgY29uc3QgY2xhaW1lZFRyaWdnZXJOb2RlcyA9IG5ldyBTZXQ8bnVtYmVyPigpO1xuICBjb25zdCBpc0Rlc2NlbmRhbnRPZiA9IChub2RlSW5kZXg6IG51bWJlciwgYW5jZXN0b3JJbmRleDogbnVtYmVyKTogYm9vbGVhbiA9PiB7XG4gICAgbGV0IGN1cnJlbnQgPSBwYXJlbnRJbmRpY2VzW25vZGVJbmRleF07XG4gICAgd2hpbGUgKGN1cnJlbnQgIT0gbnVsbCkge1xuICAgICAgaWYgKGN1cnJlbnQgPT09IGFuY2VzdG9ySW5kZXgpIHJldHVybiB0cnVlO1xuICAgICAgY3VycmVudCA9IHBhcmVudEluZGljZXNbY3VycmVudF07XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcbiAgZm9yIChsZXQgbm9kZUluZGV4ID0gMDsgbm9kZUluZGV4IDwgZ2x0Zk1vZGVsLm5vZGVzLmxlbmd0aDsgbm9kZUluZGV4KyspIHtcbiAgICBjb25zdCBleHRlbnNpb24gPSBnbHRmTW9kZWwubm9kZXNbbm9kZUluZGV4XS5leHRlbnNpb25zPy5bS0hSX1BIWVNJQ1NfUklHSURfQk9ESUVTXSBhc1xuICAgICAgfCBLSFJQaHlzaWNzUmlnaWRCb2RpZXNOb2RlXG4gICAgICB8IHVuZGVmaW5lZDtcbiAgICBpZiAoZXh0ZW5zaW9uPy5jb2xsaWRlciAhPSBudWxsKSB7XG4gICAgICBkZWNsYXJhdGlvbnMucHVzaCh7IG5vZGVJbmRleCwgY29sbGlkZXI6IGV4dGVuc2lvbi5jb2xsaWRlciwgaXNTZW5zb3I6IGZhbHNlIH0pO1xuICAgIH1cbiAgICBjb25zdCB0cmlnZ2VyID0gZXh0ZW5zaW9uPy50cmlnZ2VyO1xuICAgIGlmICh0cmlnZ2VyPy5ub2RlcyA9PSBudWxsKSBjb250aW51ZTtcbiAgICBpZiAodHJpZ2dlci5nZW9tZXRyeSAhPSBudWxsKSB7XG4gICAgICB3YXJuaW5ncy5wdXNoKFxuICAgICAgICBgJHtLSFJfUEhZU0lDU19SSUdJRF9CT0RJRVN9OiB0cmlnZ2VyIG5vZGUgJHtub2RlSW5kZXh9IGRlZmluZXMgYm90aCBnZW9tZXRyeSBhbmQgbm9kZXM7IGl0IHdhcyBza2lwcGVkLmBcbiAgICAgICk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBjaGlsZEluZGV4IG9mIG5ldyBTZXQodHJpZ2dlci5ub2RlcykpIHtcbiAgICAgIGNvbnN0IGNoaWxkVHJpZ2dlciA9IGdsdGZNb2RlbC5ub2Rlc1tjaGlsZEluZGV4XT8uZXh0ZW5zaW9ucz8uW0tIUl9QSFlTSUNTX1JJR0lEX0JPRElFU10gYXNcbiAgICAgICAgfCBLSFJQaHlzaWNzUmlnaWRCb2RpZXNOb2RlXG4gICAgICAgIHwgdW5kZWZpbmVkO1xuICAgICAgaWYgKFxuICAgICAgICAhTnVtYmVyLmlzSW50ZWdlcihjaGlsZEluZGV4KSB8fFxuICAgICAgICAhaXNEZXNjZW5kYW50T2YoY2hpbGRJbmRleCwgbm9kZUluZGV4KSB8fFxuICAgICAgICBjaGlsZFRyaWdnZXI/LnRyaWdnZXI/Lmdlb21ldHJ5ID09IG51bGxcbiAgICAgICkge1xuICAgICAgICB3YXJuaW5ncy5wdXNoKFxuICAgICAgICAgIGAke0tIUl9QSFlTSUNTX1JJR0lEX0JPRElFU306IGNvbXBvdW5kIHRyaWdnZXIgbm9kZSAke25vZGVJbmRleH0gcmVmZXJlbmNlcyBpbnZhbGlkIGRlc2NlbmRhbnQgJHtjaGlsZEluZGV4fTsgaXQgd2FzIGlnbm9yZWQuYFxuICAgICAgICApO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChjaGlsZFRyaWdnZXIudHJpZ2dlci5ub2RlcyAhPSBudWxsKSB7XG4gICAgICAgIHdhcm5pbmdzLnB1c2goYCR7S0hSX1BIWVNJQ1NfUklHSURfQk9ESUVTfTogbmVzdGVkIGNvbXBvdW5kIHRyaWdnZXIgbm9kZSAke2NoaWxkSW5kZXh9IGlzIG5vdCBzdXBwb3J0ZWQuYCk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY2xhaW1lZFRyaWdnZXJOb2Rlcy5hZGQoY2hpbGRJbmRleCk7XG4gICAgICBkZWNsYXJhdGlvbnMucHVzaCh7XG4gICAgICAgIG5vZGVJbmRleDogY2hpbGRJbmRleCxcbiAgICAgICAgY29sbGlkZXI6IHtcbiAgICAgICAgICBnZW9tZXRyeTogY2hpbGRUcmlnZ2VyLnRyaWdnZXIuZ2VvbWV0cnksXG4gICAgICAgICAgY29sbGlzaW9uRmlsdGVyOiBjaGlsZFRyaWdnZXIudHJpZ2dlci5jb2xsaXNpb25GaWx0ZXIgPz8gdHJpZ2dlci5jb2xsaXNpb25GaWx0ZXIsXG4gICAgICAgIH0sXG4gICAgICAgIGlzU2Vuc29yOiB0cnVlLFxuICAgICAgICB0cmlnZ2VyTm9kZUluZGV4OiBub2RlSW5kZXgsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgZm9yIChsZXQgbm9kZUluZGV4ID0gMDsgbm9kZUluZGV4IDwgZ2x0Zk1vZGVsLm5vZGVzLmxlbmd0aDsgbm9kZUluZGV4KyspIHtcbiAgICBpZiAoY2xhaW1lZFRyaWdnZXJOb2Rlcy5oYXMobm9kZUluZGV4KSkgY29udGludWU7XG4gICAgY29uc3QgdHJpZ2dlciA9IChcbiAgICAgIGdsdGZNb2RlbC5ub2Rlc1tub2RlSW5kZXhdLmV4dGVuc2lvbnM/LltLSFJfUEhZU0lDU19SSUdJRF9CT0RJRVNdIGFzIEtIUlBoeXNpY3NSaWdpZEJvZGllc05vZGUgfCB1bmRlZmluZWRcbiAgICApPy50cmlnZ2VyO1xuICAgIGlmICh0cmlnZ2VyPy5nZW9tZXRyeSAhPSBudWxsICYmIHRyaWdnZXIubm9kZXMgPT0gbnVsbCkge1xuICAgICAgZGVjbGFyYXRpb25zLnB1c2goe1xuICAgICAgICBub2RlSW5kZXgsXG4gICAgICAgIGNvbGxpZGVyOiB7IGdlb21ldHJ5OiB0cmlnZ2VyLmdlb21ldHJ5LCBjb2xsaXNpb25GaWx0ZXI6IHRyaWdnZXIuY29sbGlzaW9uRmlsdGVyIH0sXG4gICAgICAgIGlzU2Vuc29yOiB0cnVlLFxuICAgICAgICB0cmlnZ2VyTm9kZUluZGV4OiBub2RlSW5kZXgsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBmb3IgKGNvbnN0IGRlY2xhcmF0aW9uIG9mIGRlY2xhcmF0aW9ucykge1xuICAgIGNvbnN0IG5vZGVJbmRleCA9IGRlY2xhcmF0aW9uLm5vZGVJbmRleDtcbiAgICBjb25zdCBjb2xsaWRlciA9IGRlY2xhcmF0aW9uLmNvbGxpZGVyO1xuICAgIGNvbnN0IGdlb21ldHJ5ID0gY29sbGlkZXIuZ2VvbWV0cnk7XG4gICAgaWYgKGdlb21ldHJ5ID09IG51bGwgfHwgZ2VvbWV0cnkuc2hhcGUgPT0gbnVsbCB8fCBnZW9tZXRyeS5tZXNoICE9IG51bGwpIHtcbiAgICAgIHdhcm5pbmdzLnB1c2goXG4gICAgICAgIGAke0tIUl9QSFlTSUNTX1JJR0lEX0JPRElFU306IG5vZGUgJHtub2RlSW5kZXh9IG11c3QgcmVmZXJlbmNlIGV4YWN0bHkgb25lIGltcGxpY2l0IHNoYXBlOyBpdHMgY29sbGlkZXIgd2FzIHNraXBwZWQuYFxuICAgICAgKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBzaGFwZUluZGV4ID0gZ2VvbWV0cnkuc2hhcGU7XG4gICAgY29uc3QgaW1wbGljaXRTaGFwZSA9IGltcGxpY2l0U2hhcGVzRXh0ZW5zaW9uPy5zaGFwZXM/LltzaGFwZUluZGV4XTtcbiAgICBpZiAoIU51bWJlci5pc0ludGVnZXIoc2hhcGVJbmRleCkgfHwgc2hhcGVJbmRleCA8IDAgfHwgaW1wbGljaXRTaGFwZSA9PSBudWxsKSB7XG4gICAgICB3YXJuaW5ncy5wdXNoKFxuICAgICAgICBgJHtLSFJfUEhZU0lDU19SSUdJRF9CT0RJRVN9OiBub2RlICR7bm9kZUluZGV4fSByZWZlcmVuY2VzIG1pc3NpbmcgaW1wbGljaXQgc2hhcGUgJHtzaGFwZUluZGV4fTsgaXRzIGNvbGxpZGVyIHdhcyBza2lwcGVkLmBcbiAgICAgICk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgbGV0IHNvdXJjZURlc2NyaXB0b3IgPSBzb3VyY2VEZXNjcmlwdG9ycy5nZXQoc2hhcGVJbmRleCk7XG4gICAgaWYgKHNvdXJjZURlc2NyaXB0b3IgPT0gbnVsbCkge1xuICAgICAgc291cmNlRGVzY3JpcHRvciA9IG5vcm1hbGl6ZUtoclNoYXBlKGltcGxpY2l0U2hhcGUpO1xuICAgICAgaWYgKHNvdXJjZURlc2NyaXB0b3IgIT0gbnVsbCkge1xuICAgICAgICBzb3VyY2VEZXNjcmlwdG9ycy5zZXQoc2hhcGVJbmRleCwgc291cmNlRGVzY3JpcHRvcik7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChzb3VyY2VEZXNjcmlwdG9yID09IG51bGwpIHtcbiAgICAgIGNvbnN0IGlzQnVpbHRJbiA9IFsnYm94JywgJ3NwaGVyZScsICdjeWxpbmRlcicsICdjYXBzdWxlJ10uaW5jbHVkZXMoaW1wbGljaXRTaGFwZS50eXBlKTtcbiAgICAgIGNvbnN0IHJlYXNvbiA9IGlzQnVpbHRJblxuICAgICAgICA/IGBpbnZhbGlkICR7aW1wbGljaXRTaGFwZS50eXBlfSBzaGFwZWBcbiAgICAgICAgOiBgdW5zdXBwb3J0ZWQgc2hhcGUgdHlwZSAnJHtpbXBsaWNpdFNoYXBlLnR5cGV9J2A7XG4gICAgICB3YXJuaW5ncy5wdXNoKGAke0tIUl9QSFlTSUNTX1JJR0lEX0JPRElFU306IG5vZGUgJHtub2RlSW5kZXh9IHJlZmVyZW5jZXMgJHtyZWFzb259OyBpdHMgY29sbGlkZXIgd2FzIHNraXBwZWQuYCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBsZXQgYm9keU5vZGVJbmRleCA9IG5vZGVJbmRleDtcbiAgICBsZXQgbW90aW9uOiBLSFJQaHlzaWNzTW90aW9uIHwgdW5kZWZpbmVkO1xuICAgIGxldCBhbmNlc3RvckluZGV4OiBudW1iZXIgfCB1bmRlZmluZWQgPSBub2RlSW5kZXg7XG4gICAgd2hpbGUgKGFuY2VzdG9ySW5kZXggIT0gbnVsbCkge1xuICAgICAgY29uc3QgYW5jZXN0b3JFeHRlbnNpb24gPSBnbHRmTW9kZWwubm9kZXNbYW5jZXN0b3JJbmRleF0uZXh0ZW5zaW9ucz8uW0tIUl9QSFlTSUNTX1JJR0lEX0JPRElFU10gYXNcbiAgICAgICAgfCBLSFJQaHlzaWNzUmlnaWRCb2RpZXNOb2RlXG4gICAgICAgIHwgdW5kZWZpbmVkO1xuICAgICAgaWYgKGFuY2VzdG9yRXh0ZW5zaW9uPy5tb3Rpb24gIT0gbnVsbCkge1xuICAgICAgICBib2R5Tm9kZUluZGV4ID0gYW5jZXN0b3JJbmRleDtcbiAgICAgICAgbW90aW9uID0gYW5jZXN0b3JFeHRlbnNpb24ubW90aW9uO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGFuY2VzdG9ySW5kZXggPSBwYXJlbnRJbmRpY2VzW2FuY2VzdG9ySW5kZXhdO1xuICAgIH1cblxuICAgIGNvbnN0IHJlbGF0aXZlTWF0cml4ID1cbiAgICAgIGJvZHlOb2RlSW5kZXggPT09IG5vZGVJbmRleFxuICAgICAgICA/IE1hdHJpeDQ0LmlkZW50aXR5KClcbiAgICAgICAgOiBNYXRyaXg0NC5tdWx0aXBseShNYXRyaXg0NC5pbnZlcnQoZ2V0V29ybGRNYXRyaXgoYm9keU5vZGVJbmRleCkpLCBnZXRXb3JsZE1hdHJpeChub2RlSW5kZXgpKTtcbiAgICBjb25zdCByZWxhdGl2ZVNjYWxlID0gcmVsYXRpdmVNYXRyaXguZ2V0U2NhbGUoKTtcbiAgICBpZiAocmVsYXRpdmVTY2FsZS54ID09PSAwIHx8IHJlbGF0aXZlU2NhbGUueSA9PT0gMCB8fCByZWxhdGl2ZVNjYWxlLnogPT09IDApIHtcbiAgICAgIHdhcm5pbmdzLnB1c2goXG4gICAgICAgIGAke0tIUl9QSFlTSUNTX1JJR0lEX0JPRElFU306IGNvbGxpZGVyIG5vZGUgJHtub2RlSW5kZXh9IGhhcyB6ZXJvIGJvZHktcmVsYXRpdmUgc2NhbGU7IGl0cyBjb2xsaWRlciB3YXMgc2tpcHBlZC5gXG4gICAgICApO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmIChyZWxhdGl2ZU1hdHJpeC5kZXRlcm1pbmFudCgpIDwgMCkge1xuICAgICAgd2FybmluZ3MucHVzaChcbiAgICAgICAgYCR7S0hSX1BIWVNJQ1NfUklHSURfQk9ESUVTfTogY29sbGlkZXIgbm9kZSAke25vZGVJbmRleH0gaGFzIHJlZmxlY3RlZCBib2R5LXJlbGF0aXZlIHNjYWxlOyBhYnNvbHV0ZSBkaW1lbnNpb25zIGFyZSB1c2VkLmBcbiAgICAgICk7XG4gICAgfVxuICAgIGlmIChoYXNTaGVhcihyZWxhdGl2ZU1hdHJpeCwgcmVsYXRpdmVTY2FsZSkpIHtcbiAgICAgIHdhcm5pbmdzLnB1c2goXG4gICAgICAgIGAke0tIUl9QSFlTSUNTX1JJR0lEX0JPRElFU306IGNvbGxpZGVyIG5vZGUgJHtub2RlSW5kZXh9IGhhcyBib2R5LXJlbGF0aXZlIHNoZWFyOyBpdHMgdHJhbnNmb3JtIGlzIGFwcHJveGltYXRlZCBhcyBUUlMuYFxuICAgICAgKTtcbiAgICB9XG4gICAgY29uc3Qgbm9uVW5pZm9ybSA9XG4gICAgICBNYXRoLmFicyhyZWxhdGl2ZVNjYWxlLnggLSByZWxhdGl2ZVNjYWxlLnkpID4gMC4wMDAwMDEgfHwgTWF0aC5hYnMocmVsYXRpdmVTY2FsZS55IC0gcmVsYXRpdmVTY2FsZS56KSA+IDAuMDAwMDAxO1xuICAgIGlmIChub25Vbmlmb3JtICYmIHNvdXJjZURlc2NyaXB0b3IudHlwZSAhPT0gJ2JveCcpIHtcbiAgICAgIHdhcm5pbmdzLnB1c2goXG4gICAgICAgIGAke0tIUl9QSFlTSUNTX1JJR0lEX0JPRElFU306IGNvbGxpZGVyIG5vZGUgJHtub2RlSW5kZXh9IGhhcyBub24tdW5pZm9ybSBib2R5LXJlbGF0aXZlIHNjYWxlOyBpdHMgJHtzb3VyY2VEZXNjcmlwdG9yLnR5cGV9IHNoYXBlIGlzIGNvbnNlcnZhdGl2ZWx5IGFwcHJveGltYXRlZC5gXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCBkZXNjcmlwdG9yID1cbiAgICAgIGJvZHlOb2RlSW5kZXggPT09IG5vZGVJbmRleCA/IHNvdXJjZURlc2NyaXB0b3IgOiBzY2FsZURlc2NyaXB0b3Ioc291cmNlRGVzY3JpcHRvciwgcmVsYXRpdmVTY2FsZSk7XG4gICAgY29uc3QgbWF0ZXJpYWwgPSBub3JtYWxpemVNYXRlcmlhbChjb2xsaWRlci5waHlzaWNzTWF0ZXJpYWwsIHJpZ2lkQm9kaWVzRXh0ZW5zaW9uLCB3YXJuaW5ncywgbm9kZUluZGV4KTtcbiAgICBsZXQgZ3JvdXAgPSBncm91cHMuZ2V0KGJvZHlOb2RlSW5kZXgpO1xuICAgIGlmIChncm91cCA9PSBudWxsKSB7XG4gICAgICBncm91cCA9IHsgYm9keU5vZGVJbmRleCwgbW90aW9uOiBub3JtYWxpemVNb3Rpb24obW90aW9uLCB3YXJuaW5ncywgYm9keU5vZGVJbmRleCksIGNvbGxpZGVyczogW10gfTtcbiAgICAgIGdyb3Vwcy5zZXQoYm9keU5vZGVJbmRleCwgZ3JvdXApO1xuICAgIH1cbiAgICBncm91cC5jb2xsaWRlcnMucHVzaCh7XG4gICAgICBub2RlSW5kZXgsXG4gICAgICBzaGFwZUluZGV4LFxuICAgICAgZGVzY3JpcHRvcixcbiAgICAgIGR5bmFtaWNGcmljdGlvbjogbWF0ZXJpYWwuZHluYW1pY0ZyaWN0aW9uLFxuICAgICAgcmVzdGl0dXRpb246IG1hdGVyaWFsLnJlc3RpdHV0aW9uLFxuICAgICAgY29sbGlzaW9uR3JvdXA6IEZBTExCQUNLX0NPTExJU0lPTl9HUk9VUCxcbiAgICAgIGNvbGxpc2lvbk1hc2s6IEFMTF9DT0xMSVNJT05fR1JPVVBTLFxuICAgICAgY29sbGlzaW9uRmlsdGVySW5kZXg6IGNvbGxpZGVyLmNvbGxpc2lvbkZpbHRlcixcbiAgICAgIGlzU2Vuc29yOiBkZWNsYXJhdGlvbi5pc1NlbnNvcixcbiAgICAgIHRyaWdnZXJOb2RlSW5kZXg6IGRlY2xhcmF0aW9uLnRyaWdnZXJOb2RlSW5kZXgsXG4gICAgICBsb2NhbFBvc2l0aW9uOiByZWxhdGl2ZU1hdHJpeC5nZXRUcmFuc2xhdGUoKSxcbiAgICAgIGxvY2FsUm90YXRpb246IFF1YXRlcm5pb24uZnJvbU1hdHJpeChyZWxhdGl2ZU1hdHJpeCksXG4gICAgfSk7XG4gIH1cbiAgcmVzb2x2ZUNvbGxpc2lvbkZpbHRlcnMoZ3JvdXBzLCByaWdpZEJvZGllc0V4dGVuc2lvbiwgd2FybmluZ3MpO1xuICByZXR1cm4geyBncm91cHM6IFsuLi5ncm91cHMudmFsdWVzKCldLCB3YXJuaW5ncyB9O1xufVxuXG4vKiogUmVzb2x2ZXMgc3VwcG9ydGVkIHN0YXRpYyBpbXBsaWNpdC1zaGFwZSBjb2xsaWRlcnMgd2l0aG91dCBtdXRhdGluZyB0aGUgZ2xURiBtb2RlbC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb2xsZWN0S2hyU3RhdGljQ29sbGlkZXJzKGdsdGZNb2RlbDogUm5NMik6IEtockNvbGxpZGVyQ29sbGVjdGlvbiB7XG4gIGNvbnN0IHdhcm5pbmdzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBjb2xsaWRlcnM6IE5vcm1hbGl6ZWRLaHJDb2xsaWRlcltdID0gW107XG4gIGNvbnN0IGltcGxpY2l0U2hhcGVzRXh0ZW5zaW9uID0gZ2x0Zk1vZGVsLmV4dGVuc2lvbnM/LltLSFJfSU1QTElDSVRfU0hBUEVTXSBhcyBLSFJJbXBsaWNpdFNoYXBlcyB8IHVuZGVmaW5lZDtcbiAgY29uc3QgcmlnaWRCb2RpZXNFeHRlbnNpb24gPSBnbHRmTW9kZWwuZXh0ZW5zaW9ucz8uW0tIUl9QSFlTSUNTX1JJR0lEX0JPRElFU10gYXMgS0hSUGh5c2ljc1JpZ2lkQm9kaWVzIHwgdW5kZWZpbmVkO1xuXG4gIGZvciAobGV0IG5vZGVJbmRleCA9IDA7IG5vZGVJbmRleCA8IGdsdGZNb2RlbC5ub2Rlcy5sZW5ndGg7IG5vZGVJbmRleCsrKSB7XG4gICAgY29uc3Qgbm9kZSA9IGdsdGZNb2RlbC5ub2Rlc1tub2RlSW5kZXhdO1xuICAgIGNvbnN0IG5vZGVFeHRlbnNpb24gPSBub2RlLmV4dGVuc2lvbnM/LltLSFJfUEhZU0lDU19SSUdJRF9CT0RJRVNdIGFzIEtIUlBoeXNpY3NSaWdpZEJvZGllc05vZGUgfCB1bmRlZmluZWQ7XG4gICAgY29uc3QgY29sbGlkZXIgPSBub2RlRXh0ZW5zaW9uPy5jb2xsaWRlcjtcbiAgICBpZiAoY29sbGlkZXIgPT0gbnVsbCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKG5vZGVFeHRlbnNpb24/Lm1vdGlvbiAhPSBudWxsKSB7XG4gICAgICB3YXJuaW5ncy5wdXNoKFxuICAgICAgICBgJHtLSFJfUEhZU0lDU19SSUdJRF9CT0RJRVN9OiBkeW5hbWljIG1vdGlvbiBvbiBub2RlICR7bm9kZUluZGV4fSBpcyBub3Qgc3VwcG9ydGVkIHlldDsgaXRzIGNvbGxpZGVyIHdhcyBza2lwcGVkLmBcbiAgICAgICk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBnZW9tZXRyeSA9IGNvbGxpZGVyLmdlb21ldHJ5O1xuICAgIGlmIChnZW9tZXRyeSA9PSBudWxsIHx8IGdlb21ldHJ5LnNoYXBlID09IG51bGwgfHwgZ2VvbWV0cnkubWVzaCAhPSBudWxsKSB7XG4gICAgICB3YXJuaW5ncy5wdXNoKFxuICAgICAgICBgJHtLSFJfUEhZU0lDU19SSUdJRF9CT0RJRVN9OiBub2RlICR7bm9kZUluZGV4fSBtdXN0IHJlZmVyZW5jZSBleGFjdGx5IG9uZSBpbXBsaWNpdCBzaGFwZTsgaXRzIGNvbGxpZGVyIHdhcyBza2lwcGVkLmBcbiAgICAgICk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBzaGFwZUluZGV4ID0gZ2VvbWV0cnkuc2hhcGU7XG4gICAgY29uc3Qgc2hhcGUgPSBpbXBsaWNpdFNoYXBlc0V4dGVuc2lvbj8uc2hhcGVzPy5bc2hhcGVJbmRleF07XG4gICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKHNoYXBlSW5kZXgpIHx8IHNoYXBlSW5kZXggPCAwIHx8IHNoYXBlID09IG51bGwpIHtcbiAgICAgIHdhcm5pbmdzLnB1c2goXG4gICAgICAgIGAke0tIUl9QSFlTSUNTX1JJR0lEX0JPRElFU306IG5vZGUgJHtub2RlSW5kZXh9IHJlZmVyZW5jZXMgbWlzc2luZyBpbXBsaWNpdCBzaGFwZSAke3NoYXBlSW5kZXh9OyBpdHMgY29sbGlkZXIgd2FzIHNraXBwZWQuYFxuICAgICAgKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGRlc2NyaXB0b3IgPSBub3JtYWxpemVLaHJTaGFwZShzaGFwZSk7XG4gICAgaWYgKGRlc2NyaXB0b3IgPT0gbnVsbCkge1xuICAgICAgY29uc3QgaXNCdWlsdEluID0gWydib3gnLCAnc3BoZXJlJywgJ2N5bGluZGVyJywgJ2NhcHN1bGUnXS5pbmNsdWRlcyhzaGFwZS50eXBlKTtcbiAgICAgIGNvbnN0IHJlYXNvbiA9IGlzQnVpbHRJbiA/IGBpbnZhbGlkICR7c2hhcGUudHlwZX0gc2hhcGVgIDogYHVuc3VwcG9ydGVkIHNoYXBlIHR5cGUgJyR7c2hhcGUudHlwZX0nYDtcbiAgICAgIHdhcm5pbmdzLnB1c2goYCR7S0hSX1BIWVNJQ1NfUklHSURfQk9ESUVTfTogbm9kZSAke25vZGVJbmRleH0gcmVmZXJlbmNlcyAke3JlYXNvbn07IGl0cyBjb2xsaWRlciB3YXMgc2tpcHBlZC5gKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IG1hdGVyaWFsID0gbm9ybWFsaXplTWF0ZXJpYWwoY29sbGlkZXIucGh5c2ljc01hdGVyaWFsLCByaWdpZEJvZGllc0V4dGVuc2lvbiwgd2FybmluZ3MsIG5vZGVJbmRleCk7XG4gICAgY29sbGlkZXJzLnB1c2goe1xuICAgICAgbm9kZUluZGV4LFxuICAgICAgc2hhcGVJbmRleCxcbiAgICAgIGRlc2NyaXB0b3IsXG4gICAgICBkeW5hbWljRnJpY3Rpb246IG1hdGVyaWFsLmR5bmFtaWNGcmljdGlvbixcbiAgICAgIHJlc3RpdHV0aW9uOiBtYXRlcmlhbC5yZXN0aXR1dGlvbixcbiAgICAgIGNvbGxpc2lvbkdyb3VwOiBGQUxMQkFDS19DT0xMSVNJT05fR1JPVVAsXG4gICAgICBjb2xsaXNpb25NYXNrOiBBTExfQ09MTElTSU9OX0dST1VQUyxcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiB7IGNvbGxpZGVycywgd2FybmluZ3MgfTtcbn1cblxuLyoqIEBkZXByZWNhdGVkIFVzZSBjb2xsZWN0S2hyU3RhdGljQ29sbGlkZXJzLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3RLaHJTdGF0aWNCb3hDb2xsaWRlcnMoZ2x0Zk1vZGVsOiBSbk0yKTogS2hyQm94Q29sbGlkZXJDb2xsZWN0aW9uIHtcbiAgY29uc3QgY29sbGVjdGlvbiA9IGNvbGxlY3RLaHJTdGF0aWNDb2xsaWRlcnMoZ2x0Zk1vZGVsKTtcbiAgY29uc3QgY29sbGlkZXJzOiBOb3JtYWxpemVkS2hyQm94Q29sbGlkZXJbXSA9IFtdO1xuICBjb25zdCB3YXJuaW5ncyA9IFsuLi5jb2xsZWN0aW9uLndhcm5pbmdzXTtcbiAgZm9yIChjb25zdCBjb2xsaWRlciBvZiBjb2xsZWN0aW9uLmNvbGxpZGVycykge1xuICAgIGlmIChjb2xsaWRlci5kZXNjcmlwdG9yLnR5cGUgIT09ICdib3gnKSB7XG4gICAgICB3YXJuaW5ncy5wdXNoKFxuICAgICAgICBgJHtLSFJfUEhZU0lDU19SSUdJRF9CT0RJRVN9OiBub2RlICR7Y29sbGlkZXIubm9kZUluZGV4fSByZWZlcmVuY2VzIHVuc3VwcG9ydGVkIHNoYXBlIHR5cGUgJyR7Y29sbGlkZXIuZGVzY3JpcHRvci50eXBlfSc7IGl0cyBjb2xsaWRlciB3YXMgc2tpcHBlZC5gXG4gICAgICApO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGNvbGxpZGVycy5wdXNoKHtcbiAgICAgIG5vZGVJbmRleDogY29sbGlkZXIubm9kZUluZGV4LFxuICAgICAgc2hhcGVJbmRleDogY29sbGlkZXIuc2hhcGVJbmRleCxcbiAgICAgIHNpemU6IFtjb2xsaWRlci5kZXNjcmlwdG9yLnNpemUueCwgY29sbGlkZXIuZGVzY3JpcHRvci5zaXplLnksIGNvbGxpZGVyLmRlc2NyaXB0b3Iuc2l6ZS56XSxcbiAgICAgIGR5bmFtaWNGcmljdGlvbjogY29sbGlkZXIuZHluYW1pY0ZyaWN0aW9uLFxuICAgICAgcmVzdGl0dXRpb246IGNvbGxpZGVyLnJlc3RpdHV0aW9uLFxuICAgIH0pO1xuICB9XG4gIHJldHVybiB7IGNvbGxpZGVycywgd2FybmluZ3MgfTtcbn1cblxuLyoqIFdoZXRoZXIgdGhlIG1vZGVsIHVzZXMgdGhlIEtIUl9waHlzaWNzX3JpZ2lkX2JvZGllcyBleHRlbnNpb24uICovXG5leHBvcnQgZnVuY3Rpb24gaGFzS2hyUGh5c2ljc0V4dGVuc2lvbihnbHRmTW9kZWw6IFJuTTIpOiBib29sZWFuIHtcbiAgcmV0dXJuIGdsdGZNb2RlbC5leHRlbnNpb25zVXNlZD8uaW5jbHVkZXMoS0hSX1BIWVNJQ1NfUklHSURfQk9ESUVTKSA9PT0gdHJ1ZTtcbn1cblxuLyoqXG4gKiBMb2FkcyB0aGUgUmFwaWVyIHBoeXNpY3Mgc3RyYXRlZ3kgd2hlbiB0aGUgbW9kZWwgYWN0dWFsbHkgdXNlcyBLSFJfcGh5c2ljc19yaWdpZF9ib2RpZXMuXG4gKiBUaGUgaW1wb3J0ZXIgY2FsbHMgdGhpcyBiZWZvcmUgYHNldHVwS2hyU3RhdGljQ29sbGlkZXJzYCwgc28gdGhlIHN5bmNocm9ub3VzIHNldHVwIGNhbiB1c2UgdGhlIGxvYWRlZCBjbGFzcy5cbiAqIEBpbnRlcm5hbFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcHJlbG9hZEtoclBoeXNpY3NTdXBwb3J0KGdsdGZNb2RlbDogUm5NMik6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoIWhhc0toclBoeXNpY3NFeHRlbnNpb24oZ2x0Zk1vZGVsKSkge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAocmFwaWVyUGh5c2ljc1N0cmF0ZWd5Q2xhc3MgIT0gbnVsbCkge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAocmFwaWVyUGh5c2ljc1N0cmF0ZWd5UHJvbWlzZSA9PSBudWxsKSB7XG4gICAgcmFwaWVyUGh5c2ljc1N0cmF0ZWd5UHJvbWlzZSA9IGltcG9ydCgnLi4vcGh5c2ljcy9SYXBpZXIvUmFwaWVyUGh5c2ljc1N0cmF0ZWd5JykudGhlbihtb2R1bGUgPT4ge1xuICAgICAgcmFwaWVyUGh5c2ljc1N0cmF0ZWd5Q2xhc3MgPSBtb2R1bGUuUmFwaWVyUGh5c2ljc1N0cmF0ZWd5O1xuICAgIH0pO1xuICB9XG4gIGF3YWl0IHJhcGllclBoeXNpY3NTdHJhdGVneVByb21pc2U7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBSYXBpZXIgZml4ZWQgYm9kaWVzIGZvciBzdXBwb3J0ZWQgS0hSX3BoeXNpY3NfcmlnaWRfYm9kaWVzIGNvbGxpZGVycy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldHVwS2hyU3RhdGljQ29sbGlkZXJzKGdsdGZNb2RlbDogUm5NMiwgcm5FbnRpdGllczogSVNjZW5lR3JhcGhFbnRpdHlbXSk6IHZvaWQge1xuICBjb25zdCBjb2xsZWN0aW9uID0gY29sbGVjdEtoclJpZ2lkQm9keUdyb3VwcyhnbHRmTW9kZWwpO1xuICBmb3IgKGNvbnN0IHdhcm5pbmcgb2YgY29sbGVjdGlvbi53YXJuaW5ncykge1xuICAgIExvZ2dlci5kZWZhdWx0Lndhcm4od2FybmluZyk7XG4gIH1cblxuICBpZiAoY29sbGVjdGlvbi5ncm91cHMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgYmluZGluZ3M6IEFycmF5PHtcbiAgICBncm91cDogTm9ybWFsaXplZEtoclJpZ2lkQm9keUdyb3VwO1xuICAgIGVudGl0eTogSVNjZW5lR3JhcGhFbnRpdHk7XG4gICAgc2hhcGVDb21wb25lbnQ6IFNoYXBlQ29tcG9uZW50O1xuICAgIHNoYXBlSW5kaWNlczogbnVtYmVyW107XG4gIH0+ID0gW107XG5cbiAgZm9yIChjb25zdCBncm91cCBvZiBjb2xsZWN0aW9uLmdyb3Vwcykge1xuICAgIGNvbnN0IGVudGl0eSA9IHJuRW50aXRpZXNbZ3JvdXAuYm9keU5vZGVJbmRleF07XG4gICAgaWYgKGVudGl0eSA9PSBudWxsKSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC53YXJuKFxuICAgICAgICBgJHtLSFJfUEhZU0lDU19SSUdJRF9CT0RJRVN9OiBSaG9kb25pdGUgZW50aXR5IGZvciBib2R5IG5vZGUgJHtncm91cC5ib2R5Tm9kZUluZGV4fSB3YXMgbm90IGZvdW5kLmBcbiAgICAgICk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKGVudGl0eS50cnlUb0dldFBoeXNpY3MoKSAhPSBudWxsKSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC53YXJuKFxuICAgICAgICBgJHtLSFJfUEhZU0lDU19SSUdJRF9CT0RJRVN9OiBib2R5IG5vZGUgJHtncm91cC5ib2R5Tm9kZUluZGV4fSBhbHJlYWR5IGhhcyBhIFBoeXNpY3NDb21wb25lbnQ7IGl0cyBjb2xsaWRlcnMgd2VyZSBza2lwcGVkLmBcbiAgICAgICk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3Qgc2hhcGVDb21wb25lbnQgPVxuICAgICAgZW50aXR5LnRyeVRvR2V0U2hhcGUoKSA/PyBlbnRpdHkuZW5naW5lLmVudGl0eVJlcG9zaXRvcnkuYWRkQ29tcG9uZW50VG9FbnRpdHkoU2hhcGVDb21wb25lbnQsIGVudGl0eSkuZ2V0U2hhcGUoKTtcbiAgICBjb25zdCBzaGFwZUluZGljZXMgPSBncm91cC5jb2xsaWRlcnMubWFwKGNvbGxpZGVyID0+XG4gICAgICBzaGFwZUNvbXBvbmVudC5hZGRTaGFwZShjb2xsaWRlci5kZXNjcmlwdG9yLCB7XG4gICAgICAgIHBvc2l0aW9uOiBjb2xsaWRlci5sb2NhbFBvc2l0aW9uLFxuICAgICAgICByb3RhdGlvbjogY29sbGlkZXIubG9jYWxSb3RhdGlvbixcbiAgICAgIH0pXG4gICAgKTtcbiAgICBiaW5kaW5ncy5wdXNoKHsgZ3JvdXAsIGVudGl0eSwgc2hhcGVDb21wb25lbnQsIHNoYXBlSW5kaWNlcyB9KTtcbiAgfVxuXG4gIGNvbnN0IFJhcGllclBoeXNpY3NTdHJhdGVneSA9IHJhcGllclBoeXNpY3NTdHJhdGVneUNsYXNzO1xuICBpZiAoUmFwaWVyUGh5c2ljc1N0cmF0ZWd5ID09IG51bGwgfHwgIVJhcGllclBoeXNpY3NTdHJhdGVneS5pc0luaXRpYWxpemVkKSB7XG4gICAgY29uc3QgY29sbGlkZXJDb3VudCA9IGJpbmRpbmdzLnJlZHVjZSgoc3VtLCBiaW5kaW5nKSA9PiBzdW0gKyBiaW5kaW5nLnNoYXBlSW5kaWNlcy5sZW5ndGgsIDApO1xuICAgIExvZ2dlci5kZWZhdWx0Lndhcm4oXG4gICAgICBgJHtLSFJfUEhZU0lDU19SSUdJRF9CT0RJRVN9OiBSYXBpZXIgaXMgbm90IGxvYWRlZCBvciBub3QgaW5pdGlhbGl6ZWQ7ICR7Y29sbGlkZXJDb3VudH0gcGh5c2ljcyBiaW5kaW5nKHMpIHdlcmUgc2tpcHBlZC5gXG4gICAgKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBmb3IgKGNvbnN0IGJpbmRpbmcgb2YgYmluZGluZ3MpIHtcbiAgICBjb25zdCBwaHlzaWNzRW50aXR5ID0gYmluZGluZy5lbnRpdHkuZW5naW5lLmVudGl0eVJlcG9zaXRvcnkuYWRkQ29tcG9uZW50VG9FbnRpdHkoUGh5c2ljc0NvbXBvbmVudCwgYmluZGluZy5lbnRpdHkpO1xuICAgIGNvbnN0IHBoeXNpY3NDb21wb25lbnQgPSBwaHlzaWNzRW50aXR5LmdldFBoeXNpY3MoKTtcbiAgICBwaHlzaWNzQ29tcG9uZW50LnNldFN0cmF0ZWd5KG5ldyBSYXBpZXJQaHlzaWNzU3RyYXRlZ3koKSk7XG4gICAgcGh5c2ljc0NvbXBvbmVudC5zZXRNb3Rpb25Qcm9wZXJ0eSh7XG4gICAgICBtb3ZlOiBiaW5kaW5nLmdyb3VwLm1vdGlvbiAhPSBudWxsLFxuICAgICAgaXNLaW5lbWF0aWM6IGJpbmRpbmcuZ3JvdXAubW90aW9uPy5pc0tpbmVtYXRpYyA/PyBmYWxzZSxcbiAgICAgIG1hc3M6IGJpbmRpbmcuZ3JvdXAubW90aW9uPy5tYXNzLFxuICAgICAgY2VudGVyT2ZNYXNzOlxuICAgICAgICBiaW5kaW5nLmdyb3VwLm1vdGlvbj8uY2VudGVyT2ZNYXNzID09IG51bGxcbiAgICAgICAgICA/IHVuZGVmaW5lZFxuICAgICAgICAgIDogVmVjdG9yMy5mcm9tQ29weUFycmF5KGJpbmRpbmcuZ3JvdXAubW90aW9uLmNlbnRlck9mTWFzcyksXG4gICAgICBpbmVydGlhRGlhZ29uYWw6XG4gICAgICAgIGJpbmRpbmcuZ3JvdXAubW90aW9uPy5pbmVydGlhRGlhZ29uYWwgPT0gbnVsbFxuICAgICAgICAgID8gdW5kZWZpbmVkXG4gICAgICAgICAgOiBWZWN0b3IzLmZyb21Db3B5QXJyYXkoYmluZGluZy5ncm91cC5tb3Rpb24uaW5lcnRpYURpYWdvbmFsKSxcbiAgICAgIGluZXJ0aWFPcmllbnRhdGlvbjpcbiAgICAgICAgYmluZGluZy5ncm91cC5tb3Rpb24/LmluZXJ0aWFPcmllbnRhdGlvbiA9PSBudWxsXG4gICAgICAgICAgPyB1bmRlZmluZWRcbiAgICAgICAgICA6IFF1YXRlcm5pb24uZnJvbUNvcHlBcnJheShiaW5kaW5nLmdyb3VwLm1vdGlvbi5pbmVydGlhT3JpZW50YXRpb24pLFxuICAgICAgbGluZWFyVmVsb2NpdHk6XG4gICAgICAgIGJpbmRpbmcuZ3JvdXAubW90aW9uPy5saW5lYXJWZWxvY2l0eSA9PSBudWxsXG4gICAgICAgICAgPyB1bmRlZmluZWRcbiAgICAgICAgICA6IFZlY3RvcjMuZnJvbUNvcHlBcnJheShiaW5kaW5nLmdyb3VwLm1vdGlvbi5saW5lYXJWZWxvY2l0eSksXG4gICAgICBhbmd1bGFyVmVsb2NpdHk6XG4gICAgICAgIGJpbmRpbmcuZ3JvdXAubW90aW9uPy5hbmd1bGFyVmVsb2NpdHkgPT0gbnVsbFxuICAgICAgICAgID8gdW5kZWZpbmVkXG4gICAgICAgICAgOiBWZWN0b3IzLmZyb21Db3B5QXJyYXkoYmluZGluZy5ncm91cC5tb3Rpb24uYW5ndWxhclZlbG9jaXR5KSxcbiAgICAgIGdyYXZpdHlGYWN0b3I6IGJpbmRpbmcuZ3JvdXAubW90aW9uPy5ncmF2aXR5RmFjdG9yLFxuICAgIH0pO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYmluZGluZy5ncm91cC5jb2xsaWRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGNvbGxpZGVyID0gYmluZGluZy5ncm91cC5jb2xsaWRlcnNbaV07XG4gICAgICBjb25zdCBiaW5kaW5nSWQgPSBwaHlzaWNzQ29tcG9uZW50LmJpbmRTaGFwZSh7XG4gICAgICAgIHNoYXBlQ29tcG9uZW50OiBiaW5kaW5nLnNoYXBlQ29tcG9uZW50LFxuICAgICAgICBzaGFwZUluZGV4OiBiaW5kaW5nLnNoYXBlSW5kaWNlc1tpXSxcbiAgICAgICAgYm9keToge1xuICAgICAgICAgIG1vdmU6IGJpbmRpbmcuZ3JvdXAubW90aW9uICE9IG51bGwsXG4gICAgICAgICAgaXNLaW5lbWF0aWM6IGJpbmRpbmcuZ3JvdXAubW90aW9uPy5pc0tpbmVtYXRpYyA/PyBmYWxzZSxcbiAgICAgICAgICBkZW5zaXR5OiAxLFxuICAgICAgICB9LFxuICAgICAgICBjb2xsaWRlcjoge1xuICAgICAgICAgIGZyaWN0aW9uOiBjb2xsaWRlci5keW5hbWljRnJpY3Rpb24sXG4gICAgICAgICAgcmVzdGl0dXRpb246IGNvbGxpZGVyLnJlc3RpdHV0aW9uLFxuICAgICAgICAgIGNvbGxpc2lvbkdyb3VwOiBjb2xsaWRlci5jb2xsaXNpb25Hcm91cCxcbiAgICAgICAgICBjb2xsaXNpb25NYXNrOiBjb2xsaWRlci5jb2xsaXNpb25NYXNrLFxuICAgICAgICAgIGlzU2Vuc29yOiBjb2xsaWRlci5pc1NlbnNvcixcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgaWYgKGNvbGxpZGVyLmlzU2Vuc29yICYmIGNvbGxpZGVyLnRyaWdnZXJOb2RlSW5kZXggIT0gbnVsbCkge1xuICAgICAgICBjb25zdCB0cmlnZ2VyRW50aXR5ID0gcm5FbnRpdGllc1tjb2xsaWRlci50cmlnZ2VyTm9kZUluZGV4XTtcbiAgICAgICAgaWYgKHRyaWdnZXJFbnRpdHkgPT0gbnVsbCkge1xuICAgICAgICAgIExvZ2dlci5kZWZhdWx0Lndhcm4oXG4gICAgICAgICAgICBgJHtLSFJfUEhZU0lDU19SSUdJRF9CT0RJRVN9OiBSaG9kb25pdGUgZW50aXR5IGZvciB0cmlnZ2VyIG5vZGUgJHtjb2xsaWRlci50cmlnZ2VyTm9kZUluZGV4fSB3YXMgbm90IGZvdW5kLmBcbiAgICAgICAgICApO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRyaWdnZXJDb21wb25lbnQgPVxuICAgICAgICAgIHRyaWdnZXJFbnRpdHkudHJ5VG9HZXRUcmlnZ2VyKCkgPz9cbiAgICAgICAgICB0cmlnZ2VyRW50aXR5LmVuZ2luZS5lbnRpdHlSZXBvc2l0b3J5LmFkZENvbXBvbmVudFRvRW50aXR5KFRyaWdnZXJDb21wb25lbnQsIHRyaWdnZXJFbnRpdHkpLmdldFRyaWdnZXIoKTtcbiAgICAgICAgdHJpZ2dlckNvbXBvbmVudC5fcmVnaXN0ZXJTZW5zb3JCaW5kaW5nKGJpbmRpbmcuZW50aXR5LmVudGl0eVVJRCwgYmluZGluZ0lkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqIEBkZXByZWNhdGVkIFVzZSBzZXR1cEtoclN0YXRpY0NvbGxpZGVycy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXR1cEtoclN0YXRpY0JveENvbGxpZGVycyhnbHRmTW9kZWw6IFJuTTIsIHJuRW50aXRpZXM6IElTY2VuZUdyYXBoRW50aXR5W10pOiB2b2lkIHtcbiAgc2V0dXBLaHJTdGF0aWNDb2xsaWRlcnMoZ2x0Zk1vZGVsLCBybkVudGl0aWVzKTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFZQSxTQUFTLHdCQUF3QjtBQUNqQyxTQUFTLHNCQUFzQjtBQUMvQixTQUFTLHdCQUF3QjtBQUNqQyxTQUFTLGdDQUFzRDtBQUcvRCxTQUFTLGdCQUFnQjtBQUN6QixTQUFTLGtCQUFrQjtBQUMzQixTQUFTLGVBQWU7QUFDeEIsU0FBUyxjQUFjO0FBUXZCLElBQUk7QUFDSixJQUFJO0FBRUosSUFBTSxzQkFBc0I7QUFDNUIsSUFBTSwyQkFBMkI7QUFDakMsSUFBTSxtQkFBdUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUNyRCxJQUFNLHdCQUF3QjtBQUM5QixJQUFNLGlCQUFpQjtBQUN2QixJQUFNLGlCQUFpQjtBQUN2QixJQUFNLDJCQUEyQjtBQUNqQyxJQUFNLHNCQUFzQjtBQUM1QixJQUFNLDJCQUEyQjtBQUNqQyxJQUFNLHVCQUF1QjtBQUM3QixJQUFNLDBCQUEwQjtBQXdEaEMsU0FBUyxvQkFBb0IsT0FBd0I7QUFDbkQsU0FBTyxPQUFPLFNBQVMsS0FBSyxLQUFLLFNBQVM7QUFDNUM7QUFFQSxTQUFTLGdDQUNQLFFBQ0EsVUFDQSxhQUM4QztBQTFHaEQ7QUEyR0UsTUFBSSxPQUFPLHNCQUFzQixRQUFRLE9BQU8seUJBQXlCLE1BQU07QUFDN0UsYUFBUztBQUFBLE1BQ1AsR0FBRyx3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
