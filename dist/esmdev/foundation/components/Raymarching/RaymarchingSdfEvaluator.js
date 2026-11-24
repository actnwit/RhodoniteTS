// src/foundation/components/Raymarching/RaymarchingSdfEvaluator.ts
import { AABB } from "../../math/AABB.js";
import { Matrix44 } from "../../math/Matrix44.js";
import { Vector3 } from "../../math/Vector3.js";
var ZERO = Vector3.fromCopy3(0, 0, 0);
var ONE = Vector3.fromCopy3(1, 1, 1);
var DEFAULT_CAPSULE_POINT_A = Vector3.fromCopy3(0, -0.5, 0);
var DEFAULT_CAPSULE_POINT_B = Vector3.fromCopy3(0, 0.5, 0);
var IDENTITY_MATRIX = Matrix44.fromCopyMatrix44(Matrix44.identity());
var REPEAT_AXES = {
  SdRepeat: { x: true, y: true, z: true },
  SdRepeatX: { x: true, y: false, z: false },
  SdRepeatY: { x: false, y: true, z: false },
  SdRepeatZ: { x: false, y: false, z: true },
  SdRepeatXY: { x: true, y: true, z: false },
  SdRepeatYZ: { x: false, y: true, z: true },
  SdRepeatZX: { x: true, y: false, z: true }
};
var NON_LINEAR_ROTATED_AXES = {
  TwistX: "yz",
  TwistY: "xz",
  TwistZ: "xy",
  BendXY: "xy",
  BendXZ: "xz",
  BendYZ: "yz",
  BendYX: "xy",
  BendZX: "xz",
  BendZY: "yz"
};
var _RaymarchingSdfEvaluator = class _RaymarchingSdfEvaluator {
  /**
   * Creates an evaluator for one raymarching component.
   * @param nodeJson - The node graph stored in `RaymarchingComponent.rrnJson`
   * @param worldMatrix - The component entity's world matrix (`sceneGraph.matrixInner`)
   * @param uniformValueProvider - Optional resolver for Uniform node values
   */
  constructor(nodeJson, worldMatrix, uniformValueProvider) {
    this.__nodes = /* @__PURE__ */ new Map();
    this.__inputLinks = /* @__PURE__ */ new Map();
    this.__outputNodes = [];
    this.__scalarCache = /* @__PURE__ */ new Map();
    this.__vec3Cache = /* @__PURE__ */ new Map();
    this.__transformCache = /* @__PURE__ */ new Map();
    this.__inverseTransformCache = /* @__PURE__ */ new Map();
    this.__boundsCache = /* @__PURE__ */ new Map();
    this.__positionChainCache = /* @__PURE__ */ new Map();
    this.__terminalTransformScaleCache = /* @__PURE__ */ new Map();
    this.__distanceScaleFactor = 1;
    this.__usesWorldMatrix = false;
    this.__worldMatrix = Matrix44.fromCopyMatrix44(worldMatrix);
    this.__inverseWorldMatrix = Matrix44.invert(this.__worldMatrix);
    this.__uniformValueProvider = uniformValueProvider;
    for (const node of nodeJson.nodes) {
      this.__nodes.set(node.id, node);
    }
    for (const connection of nodeJson.connections) {
      let links = this.__inputLinks.get(connection.to.id);
      if (links == null) {
        links = /* @__PURE__ */ new Map();
        this.__inputLinks.set(connection.to.id, links);
      }
      links.set(connection.to.portName, connection.from.id);
    }
    this.__outputNodes = nodeJson.nodes.filter((node) => node.name === "OutUnion" || node.name === "OutDistance");
    const world = this.__worldMatrix;
    const axisX = [world.m00, world.m10, world.m20];
    const axisY = [world.m01, world.m11, world.m21];
    const axisZ = [world.m02, world.m12, world.m22];
    const lenX = Math.hypot(axisX[0], axisX[1], axisX[2]);
    const lenY = Math.hypot(axisY[0], axisY[1], axisY[2]);
    const lenZ = Math.hypot(axisZ[0], axisZ[1], axisZ[2]);
    const orthoError = Math.abs(axisX[0] * axisY[0] + axisX[1] * axisY[1] + axisX[2] * axisY[2]) + Math.abs(axisX[0] * axisZ[0] + axisX[1] * axisZ[1] + axisX[2] * axisZ[2]) + Math.abs(axisY[0] * axisZ[0] + axisY[1] * axisZ[1] + axisY[2] * axisZ[2]);
    const orthoTolerance = 1e-4 * (lenX * lenY + lenX * lenZ + lenY * lenZ);
    let localToWorldScale;
    if (orthoError <= orthoTolerance) {
      localToWorldScale = Math.min(lenX, lenY, lenZ);
    } else {
      const inverse = this.__inverseWorldMatrix;
      const frobeniusSq = inverse.m00 ** 2 + inverse.m10 ** 2 + inverse.m20 ** 2 + inverse.m01 ** 2 + inverse.m11 ** 2 + inverse.m21 ** 2 + inverse.m02 ** 2 + inverse.m12 ** 2 + inverse.m22 ** 2;
      localToWorldScale = 1 / Math.sqrt(Math.max(frobeniusSq, 1e-8));
    }
    this.__distanceScaleFactor = Math.max(Math.min(1, localToWorldScale), 1e-4);
    this.__usesWorldMatrix = this.__outputNodes.some((node) => this.__distanceNodeUsesWorldMatrix(node, /* @__PURE__ */ new Set()));
  }
  /**
   * Returns true when the distance subtree of a node contains SdApplyWorldMatrix.
   * The rendering shader applies the world-space distance correction to a component
   * whose graph uses it, so the CPU evaluator does the same.
   * @param node - Root of the distance subtree
   * @param visited - Node ids already visited
   */
  __distanceNodeUsesWorldMatrix(node, visited) {
    if (node.name === "SdApplyWorldMatrix") {
      return true;
    }
    if (visited.has(node.id)) {
      return false;
    }
    visited.add(node.id);
    const links = this.__inputLinks.get(node.id);
    if (links == null) {
      return false;
    }
    for (const fromId of links.values()) {
      const inputNode = this.__nodes.get(fromId);
      if (inputNode != null && this.__distanceNodeUsesWorldMatrix(inputNode, visited)) {
        return true;
      }
    }
    return false;
  }
  /**
   * Calculates a conservative world-space AABB of the SDF graph.
   * @returns The world-space bounds, or null when the graph is unbounded or
   * contains a node the evaluator does not understand.
   */
  calcBounds() {
    if (this.__outputNodes.length === 0) {
      return null;
    }
    const merged = new AABB();
    for (const output of this.__outputNodes) {
      const bounds = this.__evalBoundsNode(output);
      if (bounds == null || bounds.isVanilla()) {
        return null;
      }
      merged.mergeAABB(bounds);
    }
    return merged.isVanilla() ? null : merged;
  }
  /**
   * Returns the sphere primitive when the graph evaluates to a single sphere.
   *
   * The center and radius are expressed in the evaluator's output space
   * (the space produced by this evaluator's world matrix). Any transform chain
   * before the sphere is folded into the result. A non-uniform local scale is
   * approximated by the largest axis scale so the returned sphere contains the
   * resulting ellipsoid.
   *
   * @returns The sphere primitive, or null for any other graph
   */
  calcSphere() {
    var _a;
    if (this.__outputNodes.length !== 1) {
      return null;
    }
    const output = this.__outputNodes[0];
    const inputNode = (_a = this.__inputNode(output.id, "in1")) != null ? _a : this.__inputNode(output.id, "value");
    if (inputNode == null || inputNode.name !== "SdSphere") {
      return null;
    }
    const radius = this.__readScalarInput(inputNode, "radius", 1);
    if (radius == null) {
      return null;
    }
    const positionNode = this.__inputNode(inputNode.id, "position");
    if (positionNode == null) {
      return null;
    }
    if (this.__positionChainHasNonLinearNode(positionNode)) {
      return null;
    }
    const chain = this.__positionChainToWorld(positionNode);
    if (chain == null) {
      return null;
    }
    const center = chain.multiplyVector3(ZERO);
    const axisX = Vector3.subtract(chain.multiplyVector3(Vector3.fromCopy3(1, 0, 0)), center);
    const axisY = Vector3.subtract(chain.multiplyVector3(Vector3.fromCopy3(0, 1, 0)), center);
    const axisZ = Vector3.subtract(chain.multiplyVector3(Vector3.fromCopy3(0, 0, 1)), center);
    const scaleX = Math.hypot(axisX.x, axisY.x, axisZ.x);
    const scaleY = Math.hypot(axisX.y, axisY.y, axisZ.y);
    const scaleZ = Math.hypot(axisX.z, axisY.z, axisZ.z);
    const maxScale = Math.max(scaleX, scaleY, scaleZ);
    const sphereRadius = Math.abs(radius) * maxScale;
    if (!Number.isFinite(sphereRadius) || sphereRadius <= 0) {
      return null;
    }
    return {
      center,
      radius: sphereRadius,
      usesWorldMatrix: this.__positionChainUsesWorldMatrix(positionNode)
    };
  }
  /**
   * Evaluates the signed distance at a world-space point.
   *
   * When the graph is evaluated through `SdApplyWorldMatrix`, the returned value is
   * converted into a conservative world-space distance (the local distance times a
   * lower bound of the smallest singular value of the component's world matrix),
   * matching the distance the raymarching shader marches with. `SdApplyTransform`
   * nodes in a terminal's subtree scale its distance by their smallest axis scale,
   * again matching the shader.
   *
   * @param pointInWorld - The point to evaluate
   * @returns The signed distance, or null when the graph is unsupported
   */
  evalDistanceAt(pointInWorld) {
    if (this.__outputNodes.length === 0) {
      return null;
    }
    let distance = Number.POSITIVE_INFINITY;
    for (const output of this.__outputNodes) {
      const value = this.__evalDistanceNode(output, pointInWorld);
      if (value == null) {
        return null;
      }
      const transformScale = this.__terminalTransformScale(output);
      if (transformScale == null) {
        return null;
      }
      distance = Math.min(distance, value * transformScale);
    }
    if (!Number.isFinite(distance)) {
      return null;
    }
    return this.__usesWorldMatrix ? distance * this.__distanceScaleFactor : distance;
  }
  /**
   * Returns the conservative local-to-world scale of the `SdApplyTransform` nodes
   * that feed a terminal node's distance subtree.
   *
   * A transform node scaled below 1 makes the distances of its subtree larger than
   * the matching world distances. The factor is the product of the reachable nodes'
   * smallest axis scales (a valid lower bound for nested chains), clamped to [1e-4, 1].
   *
   * @param terminal - The OutUnion / OutDistance node
   * @returns The scale, or null when a transform scale cannot be evaluated
   */
  __terminalTransformScale(terminal) {
    if (this.__terminalTransformScaleCache.has(terminal.id)) {
      return this.__terminalTransformScaleCache.get(terminal.id);
    }
    let scale = 1;
    const visited = /* @__PURE__ */ new Set();
    const stack = [];
    const pushSpatialInputs = (nodeId) => {
      const links = this.__inputLinks.get(nodeId);
      if (links == null) {
        return;
      }
      for (const [portName, fromId] of links) {
        if (_RaymarchingSdfEvaluator.__SPATIAL_INPUT_PORTS.has(portName)) {
          stack.push(fromId);
        }
      }
    };
    pushSpatialInputs(terminal.id);
    while (stack.length > 0) {
      const nodeId = stack.pop();
      if (visited.has(nodeId)) {
        continue;
      }
      visited.add(nodeId);
      const node = this.__nodes.get(nodeId);
      if (node == null) {
        continue;
      }
      if (node.name === "SdApplyTransform") {
        const transformScale = this.__readVec3Input(node, "scale", ONE);
        if (transformScale == null) {
          this.__terminalTransformScaleCache.set(terminal.id, null);
          return null;
        }
        const axisScale = Math.min(Math.abs(transformScale.x), Math.abs(transformScale.y), Math.abs(transformScale.z));
        scale *= Math.max(Math.min(1, axisScale), 1e-4);
      }
      pushSpatialInputs(nodeId);
    }
    this.__terminalTransformScaleCache.set(terminal.id, scale);
    return scale;
  }
  /**
   * Marches a ray against the SDF graph.
   * @param originInWorld - Ray origin in world space
   * @param directionInWorld - Ray direction in world space
   * @param options - Marching options
   * @returns The hit, null for a miss, or undefined when the graph is unsupported
   */
  marchRay(originInWorld, directionInWorld, options = {}) {
    var _a, _b, _c;
    const length = directionInWorld.length();
    if (!Number.isFinite(length) || length === 0) {
      return null;
    }
    const direction = Vector3.multiply(directionInWorld, 1 / length);
    let tStart = 0;
    let tEnd = (_a = options.maxDistance) != null ? _a : 1e4;
    const bounds = this.calcBounds();
    if (bounds != null) {
      const interval = _RaymarchingSdfEvaluator.intersectRayAabb(originInWorld, direction, bounds);
      if (interval == null) {
        return null;
      }
      tStart = Math.max(tStart, interval[0]);
      tEnd = Math.min(tEnd, interval[1]);
      if (tEnd < tStart) {
        return null;
      }
    }
    const epsilon = (_b = options.epsilon) != null ? _b : 1e-3;
    const maxSteps = (_c = options.maxSteps) != null ? _c : 256;
    let t = tStart;
    for (let i = 0; i < maxSteps; i++) {
      const point = Vector3.fromCopy3(
        originInWorld.x + direction.x * t,
        originInWorld.y + direction.y * t,
        originInWorld.z + direction.z * t
      );
      const distance = this.evalDistanceAt(point);
      if (distance == null) {
        return void 0;
      }
      if (distance < epsilon) {
        return { t, position: point };
      }
      t += Math.max(Math.abs(distance), epsilon * 0.1);
      if (t > tEnd) {
        return null;
      }
    }
    return null;
  }
  __inputNode(nodeId, portName) {
    var _a;
    const fromId = (_a = this.__inputLinks.get(nodeId)) == null ? void 0 : _a.get(portName);
    return fromId == null ? void 0 : this.__nodes.get(fromId);
  }
  __controlValue(node, key) {
    var _a, _b;
    return (_b = (_a = node.controls) == null ? void 0 : _a[key]) == null ? void 0 : _b.value;
  }
  __toNumber(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (value != null && typeof value === "object") {
      const x = value.x;
      if (typeof x === "number" && Number.isFinite(x)) {
        return x;
      }
    }
    return null;
  }
  __toVector3(value) {
    if (Array.isArray(value) && value.length >= 3) {
      const x = value[0];
      const y = value[1];
      const z = value[2];
      if (typeof x === "number" && Number.isFinite(x) && typeof y === "number" && Number.isFinite(y) && typeof z === "number" && Number.isFinite(z)) {
        return Vector3.fromCopy3(x, y, z);
      }
      return null;
    }
    if (value != null && typeof value === "object") {
      const vector = value;
      if (typeof vector.x === "number" && Number.isFinite(vector.x) && typeof vector.y === "number" && Number.isFinite(vector.y) && typeof vector.z === "number" && Number.isFinite(vector.z)) {
        return Vector3.fromCopy3(vector.x, vector.y, vector.z);
      }
    }
    return null;
  }
  __uniformValue(name) {
    if (this.__uniformValueProvider == null) {
      return void 0;
    }
    try {
      return this.__uniformValueProvider(name);
    } catch {
      return void 0;
    }
  }
  __readScalarNodeValue(node) {
    var _a, _b;
    switch (node.name) {
      case "ConstantScalarFloat":
      case "ConstantScalarUint":
        return this.__toNumber(this.__controlValue(node, "in1"));
      case "ConstantScalarBool": {
        const value = this.__controlValue(node, "in1");
        if (typeof value === "boolean") {
          return value ? 1 : 0;
        }
        return this.__toNumber(value);
      }
      case "UniformScalarFloat": {
        const name = (_b = (_a = node.controls) == null ? void 0 : _a.name) == null ? void 0 : _b.value;
        if (typeof name === "string") {
          const value = this.__toNumber(this.__uniformValue(name));
          if (value != null) {
            return value;
          }
        }
        return this.__toNumber(this.__controlValue(node, "initialValue"));
      }
      default:
        return null;
    }
  }
  __readVec3NodeValue(node) {
    var _a, _b;
    switch (node.name) {
      case "ConstantVector3Float": {
        const x = this.__toNumber(this.__controlValue(node, "in1"));
        const y = this.__toNumber(this.__controlValue(node, "in2"));
        const z = this.__toNumber(this.__controlValue(node, "in3"));
        if (x == null || y == null || z == null) {
          return null;
        }
        return Vector3.fromCopy3(x, y, z);
      }
      case "UniformVector3Float": {
        const name = (_b = (_a = node.controls) == null ? void 0 : _a.name) == null ? void 0 : _b.value;
        if (typeof name === "string") {
          const value = this.__toVector3(this.__uniformValue(name));
          if (value != null) {
            return value;
          }
        }
        const x = this.__toNumber(this.__controlValue(node, "initialX"));
        const y = this.__toNumber(this.__controlValue(node, "initialY"));
        const z = this.__toNumber(this.__controlValue(node, "initialZ"));
        if (x == null || y == null || z == null) {
          return null;
        }
        return Vector3.fromCopy3(x, y, z);
      }
      default:
        return null;
    }
  }
  __readScalarInput(node, portName, fallback) {
    const cacheKey = `${node.id}:${portName}`;
    if (this.__scalarCache.has(cacheKey)) {
      return this.__scalarCache.get(cacheKey);
    }
    const source = this.__inputNode(node.id, portName);
    const value = source == null ? fallback : this.__readScalarNodeValue(source);
    this.__scalarCache.set(cacheKey, value);
    return value;
  }
  __readVec3Input(node, portName, fallback) {
    const cacheKey = `${node.id}:${portName}`;
    if (this.__vec3Cache.has(cacheKey)) {
      return this.__vec3Cache.get(cacheKey);
    }
    const source = this.__inputNode(node.id, portName);
    const value = source == null ? fallback : this.__readVec3NodeValue(source);
    this.__vec3Cache.set(cacheKey, value);
    return value;
  }
  __getTransform(node) {
    if (this.__transformCache.has(node.id)) {
      return this.__transformCache.get(node.id);
    }
    const translation = this.__readVec3Input(node, "translation", ZERO);
    const euler = this.__readVec3Input(node, "xyzEulerAngles", ZERO);
    const scale = this.__readVec3Input(node, "scale", ONE);
    let transform = null;
    if (translation != null && euler != null && scale != null) {
      const rotation = Matrix44.multiply(
        Matrix44.rotateX(-euler.x),
        Matrix44.multiply(Matrix44.rotateY(-euler.y), Matrix44.rotateZ(-euler.z))
      );
      transform = Matrix44.multiply(
        Matrix44.translate(translation),
        Matrix44.multiply(rotation, Matrix44.scale(scale))
      );
    }
    this.__transformCache.set(node.id, transform);
    return transform;
  }
  __getInverseTransform(node) {
    if (this.__inverseTransformCache.has(node.id)) {
      return this.__inverseTransformCache.get(node.id);
    }
    const transform = this.__getTransform(node);
    const inverse = transform == null ? null : Matrix44.invert(transform);
    this.__inverseTransformCache.set(node.id, inverse);
    return inverse;
  }
  __evalPositionForDistance(node, pointInWorld) {
    const positionNode = this.__inputNode(node.id, "position");
    if (positionNode == null) {
      return ZERO;
    }
    return this.__evalPositionOutput(positionNode, pointInWorld);
  }
  __evalPositionOutput(node, pointInWorld) {
    switch (node.name) {
      case "InitialPosition":
        return pointInWorld;
      case "SdApplyTransform": {
        const parent = this.__inputNode(node.id, "position");
        const input = parent == null ? ZERO : this.__evalPositionOutput(parent, pointInWorld);
        if (input == null) {
          return null;
        }
        const inverse = this.__getInverseTransform(node);
        return inverse == null ? null : inverse.multiplyVector3(input);
      }
      case "SdApplyWorldMatrix": {
        const parent = this.__inputNode(node.id, "position");
        const input = parent == null ? ZERO : this.__evalPositionOutput(parent, pointInWorld);
        if (input == null) {
          return null;
        }
        return this.__inverseWorldMatrix.multiplyVector3(input);
      }
      case "SdRepeat":
      case "SdRepeatX":
      case "SdRepeatY":
      case "SdRepeatZ":
      case "SdRepeatXY":
      case "SdRepeatYZ":
      case "SdRepeatZX": {
        const parent = this.__inputNode(node.id, "position");
        const input = parent == null ? ZERO : this.__evalPositionOutput(parent, pointInWorld);
        if (input == null) {
          return null;
        }
        const interval = this.__readScalarInput(node, "interval", 1);
        if (interval == null || interval === 0) {
          return null;
        }
        const axes = REPEAT_AXES[node.name];
        const wrap = (value, enabled) => {
          if (!enabled) {
            return value;
          }
          const scaled = value / interval;
          return (scaled - Math.floor(scaled) - 0.5) * interval;
        };
        return Vector3.fromCopy3(wrap(input.x, axes.x), wrap(input.y, axes.y), wrap(input.z, axes.z));
      }
      case "TwistX": {
        const parent = this.__inputNode(node.id, "position");
        const input = parent == null ? ZERO : this.__evalPositionOutput(parent, pointInWorld);
        if (input == null) {
          return null;
        }
        const strength = this.__readScalarInput(node, "strength", 0.5);
        if (strength == null) {
          return null;
        }
        const angle = strength * input.x;
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return Vector3.fromCopy3(input.x, c * input.y - s * input.z, s * input.y + c * input.z);
      }
      case "TwistY": {
        const parent = this.__inputNode(node.id, "position");
        const input = parent == null ? ZERO : this.__evalPositionOutput(parent, pointInWorld);
        if (input == null) {
          return null;
        }
        const strength = this.__readScalarInput(node, "strength", 0.5);
        if (strength == null) {
          return null;
        }
        const angle = strength * input.y;
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return Vector3.fromCopy3(c * input.x - s * input.z, input.y, s * input.x + c * input.z);
      }
      case "TwistZ": {
        const parent = this.__inputNode(node.id, "position");
        const input = parent == null ? ZERO : this.__evalPositionOutput(parent, pointInWorld);
        if (input == null) {
          return null;
        }
        const strength = this.__readScalarInput(node, "strength", 0.5);
        if (strength == null) {
          return null;
        }
        const angle = strength * input.z;
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return Vector3.fromCopy3(c * input.x - s * input.y, s * input.x + c * input.y, input.z);
      }
      case "BendXY": {
        const parent = this.__inputNode(node.id, "position");
        const input = parent == null ? ZERO : this.__evalPositionOutput(parent, pointInWorld);
        if (input == null) {
          return null;
        }
        const strength = this.__readScalarInput(node, "strength", 0.5);
        if (strength == null) {
          return null;
        }
        const angle = strength * input.x;
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return Vector3.fromCopy3(c * input.x - s * input.y, s * input.x + c * input.y, input.z);
      }
      case "BendXZ": {
        const parent = this.__inputNode(node.id, "position");
        const input = parent == null ? ZERO : this.__evalPositionOutput(parent, pointInWorld);
        if (input == null) {
          return null;
        }
        const strength = this.__readScalarInput(node, "strength", 0.5);
        if (strength == null) {
          return null;
        }
        const angle = strength * input.x;
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return Vector3.fromCopy3(c * input.x - s * input.z, input.y, s * input.x + c * input.z);
      }
      case "BendYZ": {
        const parent = this.__inputNode(node.id, "position");
        const input = parent == null ? ZERO : this.__evalPositionOutput(parent, pointInWorld);
        if (input == null) {
          return null;
        }
        const strength = this.__readScalarInput(node, "strength", 0.5);
        if (strength == null) {
          return null;
        }
        const angle = strength * input.y;
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return Vector3.fromCopy3(input.x, c * input.y - s * input.z, s * input.y + c * input.z);
      }
      case "BendYX": {
        const parent = this.__inputNode(node.id, "position");
        const input = parent == null ? ZERO : this.__evalPositionOutput(parent, pointInWorld);
        if (input == null) {
          return null;
        }
        const strength = this.__readScalarInput(node, "strength", 0.5);
        if (strength == null) {
          return null;
        }
        const angle = strength * input.y;
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return Vector3.fromCopy3(s * input.y + c * input.x, c * input.y - s * input.x, input.z);
      }
      case "BendZX": {
        const parent = this.__inputNode(node.id, "position");
        const input = parent == null ? ZERO : this.__evalPositionOutput(parent, pointInWorld);
        if (input == null) {
          return null;
        }
        const strength = this.__readScalarInput(node, "strength", 0.5);
        if (strength == null) {
          return null;
        }
        const angle = strength * input.z;
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return Vector3.fromCopy3(s * input.z + c * input.x, input.y, c * input.z - s * input.x);
      }
      case "BendZY": {
        const parent = this.__inputNode(node.id, "position");
        const input = parent == null ? ZERO : this.__evalPositionOutput(parent, pointInWorld);
        if (input == null) {
          return null;
        }
        const strength = this.__readScalarInput(node, "strength", 0.5);
        if (strength == null) {
          return null;
        }
        const angle = strength * input.z;
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return Vector3.fromCopy3(input.x, s * input.z + c * input.y, c * input.z - s * input.y);
      }
      default:
        return null;
    }
  }
  __evalDistanceNode(node, pointInWorld) {
    var _a;
    switch (node.name) {
      case "SdSphere": {
        const position = this.__evalPositionForDistance(node, pointInWorld);
        const radius = this.__readScalarInput(node, "radius", 1);
        if (position == null || radius == null) {
          return null;
        }
        return position.length() - radius;
      }
      case "SdBox": {
        const position = this.__evalPositionForDistance(node, pointInWorld);
        const size = this.__readVec3Input(node, "size", ONE);
        if (position == null || size == null) {
          return null;
        }
        const qx = Math.abs(position.x) - size.x;
        const qy = Math.abs(position.y) - size.y;
        const qz = Math.abs(position.z) - size.z;
        return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, Math.max(qy, qz)), 0);
      }
      case "SdTorus": {
        const position = this.__evalPositionForDistance(node, pointInWorld);
        const radius = this.__readScalarInput(node, "radius", 1);
        const tubeRadius = this.__readScalarInput(node, "tubeRadius", 0.25);
        if (position == null || radius == null || tubeRadius == null) {
          return null;
        }
        return Math.hypot(Math.hypot(position.x, position.z) - radius, position.y) - tubeRadius;
      }
      case "SdCapsule": {
        const position = this.__evalPositionForDistance(node, pointInWorld);
        const pointA = this.__readVec3Input(node, "pointA", DEFAULT_CAPSULE_POINT_A);
        const pointB = this.__readVec3Input(node, "pointB", DEFAULT_CAPSULE_POINT_B);
        const radius = this.__readScalarInput(node, "radius", 0.5);
        if (position == null || pointA == null || pointB == null || radius == null) {
          return null;
        }
        const paX = position.x - pointA.x;
        const paY = position.y - pointA.y;
        const paZ = position.z - pointA.z;
        const baX = pointB.x - pointA.x;
        const baY = pointB.y - pointA.y;
        const baZ = pointB.z - pointA.z;
        const denominator = baX * baX + baY * baY + baZ * baZ;
        let h = 0;
        if (denominator > 0) {
          h = Math.min(Math.max((paX * baX + paY * baY + paZ * baZ) / denominator, 0), 1);
        }
        return Math.hypot(paX - baX * h, paY - baY * h, paZ - baZ * h) - radius;
      }
      case "SdRoundBox": {
        const position = this.__evalPositionForDistance(node, pointInWorld);
        const size = this.__readVec3Input(node, "size", ONE);
        const radius = this.__readScalarInput(node, "radius", 0.25);
        if (position == null || size == null || radius == null) {
          return null;
        }
        const qx = Math.abs(position.x) - size.x;
        const qy = Math.abs(position.y) - size.y;
        const qz = Math.abs(position.z) - size.z;
        return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) - radius;
      }
      case "SdBarX": {
        const position = this.__evalPositionForDistance(node, pointInWorld);
        const width = this.__readScalarInput(node, "width", 1);
        if (position == null || width == null) {
          return null;
        }
        return Math.hypot(Math.max(Math.abs(position.y) - width, 0), Math.max(Math.abs(position.z) - width, 0));
      }
      case "SdBarY": {
        const position = this.__evalPositionForDistance(node, pointInWorld);
        const width = this.__readScalarInput(node, "width", 1);
        if (position == null || width == null) {
          return null;
        }
        return Math.hypot(Math.max(Math.abs(position.x) - width, 0), Math.max(Math.abs(position.z) - width, 0));
      }
      case "SdBarZ": {
        const position = this.__evalPositionForDistance(node, pointInWorld);
        const width = this.__readScalarInput(node, "width", 1);
        if (position == null || width == null) {
          return null;
        }
        return Math.hypot(Math.max(Math.abs(position.x) - width, 0), Math.max(Math.abs(position.y) - width, 0));
      }
      case "SdTubeX": {
        const position = this.__evalPositionForDistance(node, pointInWorld);
        const width = this.__readScalarInput(node, "width", 1);
        if (position == null || width == null) {
          return null;
        }
        return Math.hypot(position.y, position.z) - width;
      }
      case "SdTubeY": {
        const position = this.__evalPositionForDistance(node, pointInWorld);
        const width = this.__readScalarInput(node, "width", 1);
        if (position == null || width == null) {
          return null;
        }
        return Math.hypot(position.x, position.z) - width;
      }
      case "SdTubeZ": {
        const position = this.__evalPositionForDistance(node, pointInWorld);
        const width = this.__readScalarInput(node, "width", 1);
        if (position == null || width == null) {
          return null;
        }
        return Math.hypot(position.x, position.y) - width;
      }
      case "OpUnion": {
        const lhsNode = this.__inputNode(node.id, "lhs");
        const rhsNode = this.__inputNode(node.id, "rhs");
        if (lhsNode == null || rhsNode == null) {
          return null;
        }
        const lhs = this.__evalDistanceNode(lhsNode, pointInWorld);
        const rhs = this.__evalDistanceNode(rhsNode, pointInWorld);
        if (lhs == null || rhs == null) {
          return null;
        }
        return Math.min(lhs, rhs);
      }
      case "OpSubtraction": {
        const baseNode = this.__inputNode(node.id, "base");
        const subtractorNode = this.__inputNode(node.id, "subtractor");
        if (baseNode == null || subtractorNode == null) {
          return null;
        }
        const base = this.__evalDistanceNode(baseNode, pointInWorld);
        const subtractor = this.__evalDistanceNode(subtractorNode, pointInWorld);
        if (base == null || subtractor == null) {
          return null;
        }
        return Math.max(base, -subtractor);
      }
      case "OpSmoothUnion":
      case "OpSmoothIntersection": {
        const lhsNode = this.__inputNode(node.id, "lhs");
        const rhsNode = this.__inputNode(node.id, "rhs");
        if (lhsNode == null || rhsNode == null) {
          return null;
        }
        const lhs = this.__evalDistanceNode(lhsNode, pointInWorld);
        const rhs = this.__evalDistanceNode(rhsNode, pointInWorld);
        if (lhs == null || rhs == null) {
          return null;
        }
        const smoothness = this.__readScalarInput(node, "smoothness", 0.1);
        if (smoothness == null) {
          return null;
        }
        const k = Math.max(smoothness, 1e-4);
        if (node.name === "OpSmoothUnion") {
          const h2 = Math.min(Math.max(0.5 + 0.5 * (rhs - lhs) / k, 0), 1);
          return rhs + (lhs - rhs) * h2 - k * h2 * (1 - h2);
        }
        const h = Math.min(Math.max(0.5 - 0.5 * (rhs - lhs) / k, 0), 1);
        return rhs + (lhs - rhs) * h + k * h * (1 - h);
      }
      case "OpSmoothSubtraction": {
        const baseNode = this.__inputNode(node.id, "base");
        const subtractorNode = this.__inputNode(node.id, "subtractor");
        if (baseNode == null || subtractorNode == null) {
          return null;
        }
        const base = this.__evalDistanceNode(baseNode, pointInWorld);
        const subtractor = this.__evalDistanceNode(subtractorNode, pointInWorld);
        if (base == null || subtractor == null) {
          return null;
        }
        const smoothness = this.__readScalarInput(node, "smoothness", 0.1);
        if (smoothness == null) {
          return null;
        }
        const k = Math.max(smoothness, 1e-4);
        const h = Math.min(Math.max(0.5 - 0.5 * (subtractor + base) / k, 0), 1);
        return base + (-subtractor - base) * h + k * h * (1 - h);
      }
      case "OutUnion":
      case "OutDistance": {
        const inputNode = (_a = this.__inputNode(node.id, "in1")) != null ? _a : this.__inputNode(node.id, "value");
        return inputNode == null ? null : this.__evalDistanceNode(inputNode, pointInWorld);
      }
      default:
        return this.__readScalarNodeValue(node);
    }
  }
  __evalBoundsNode(node) {
    var _a;
    if (this.__boundsCache.has(node.id)) {
      const cached = this.__boundsCache.get(node.id);
      return cached == null ? null : cached.clone();
    }
    let bounds = null;
    switch (node.name) {
      case "SdSphere": {
        const radius = this.__readScalarInput(node, "radius", 1);
        bounds = radius == null ? null : this.__evalSphereBounds(node, Math.abs(radius));
        break;
      }
      case "SdBox": {
        const size = this.__readVec3Input(node, "size", ONE);
        if (size != null) {
          bounds = this.__evalPrimitiveBounds(
            node,
            Vector3.fromCopy3(Math.abs(size.x), Math.abs(size.y), Math.abs(size.z))
          );
        }
        break;
      }
      case "SdTorus": {
        const radius = this.__readScalarInput(node, "radius", 1);
        const tubeRadius = this.__readScalarInput(node, "tubeRadius", 0.25);
        if (radius != null && tubeRadius != null) {
          const outer = Math.abs(radius) + Math.abs(tubeRadius);
          const inner = Math.abs(tubeRadius);
          bounds = this.__evalPrimitiveBounds(node, Vector3.fromCopy3(outer, inner, outer));
        }
        break;
      }
      case "SdCapsule": {
        const pointA = this.__readVec3Input(node, "pointA", DEFAULT_CAPSULE_POINT_A);
        const pointB = this.__readVec3Input(node, "pointB", DEFAULT_CAPSULE_POINT_B);
        const radius = this.__readScalarInput(node, "radius", 0.5);
        if (pointA != null && pointB != null && radius != null) {
          const r = Math.abs(radius);
          bounds = this.__evalPrimitiveBounds(
            node,
            Vector3.fromCopy3(
              Math.max(Math.abs(pointA.x), Math.abs(pointB.x)) + r,
              Math.max(Math.abs(pointA.y), Math.abs(pointB.y)) + r,
              Math.max(Math.abs(pointA.z), Math.abs(pointB.z)) + r
            )
          );
        }
        break;
      }
      case "SdRoundBox": {
        const size = this.__readVec3Input(node, "size", ONE);
        const radius = this.__readScalarInput(node, "radius", 0.25);
        if (size != null && radius != null) {
          const r = Math.abs(radius);
          bounds = this.__evalPrimitiveBounds(
            node,
            Vector3.fromCopy3(Math.abs(size.x) + r, Math.abs(size.y) + r, Math.abs(size.z) + r)
          );
        }
        break;
      }
      case "SdBarX":
      case "SdBarY":
      case "SdBarZ":
      case "SdTubeX":
      case "SdTubeY":
      case "SdTubeZ":
        bounds = null;
        break;
      case "OpUnion": {
        const lhsNode = this.__inputNode(node.id, "lhs");
        const rhsNode = this.__inputNode(node.id, "rhs");
        if (lhsNode != null && rhsNode != null) {
          const lhs = this.__evalBoundsNode(lhsNode);
          const rhs = this.__evalBoundsNode(rhsNode);
          if (lhs != null && rhs != null) {
            bounds = lhs;
            bounds.mergeAABB(rhs);
          }
        }
        break;
      }
      case "OpSubtraction": {
        const baseNode = this.__inputNode(node.id, "base");
        bounds = baseNode == null ? null : this.__evalBoundsNode(baseNode);
        break;
      }
      case "OpSmoothUnion": {
        const lhsNode = this.__inputNode(node.id, "lhs");
        const rhsNode = this.__inputNode(node.id, "rhs");
        const smoothness = this.__readScalarInput(node, "smoothness", 0.1);
        if (lhsNode != null && rhsNode != null && smoothness != null) {
          const lhs = this.__evalBoundsNode(lhsNode);
          const rhs = this.__evalBoundsNode(rhsNode);
          if (lhs != null && rhs != null) {
            const merged = lhs.clone();
            merged.mergeAABB(rhs);
            const k = Math.abs(smoothness);
            const expanded = new AABB();
            expanded.addPosition(
              Vector3.fromCopy3(merged.minPoint.x - k, merged.minPoint.y - k, merged.minPoint.z - k)
            );
            expanded.addPosition(
              Vector3.fromCopy3(merged.maxPoint.x + k, merged.maxPoint.y + k, merged.maxPoint.z + k)
            );
            bounds = expanded;
          }
        }
        break;
      }
      case "OpSmoothSubtraction": {
        const baseNode = this.__inputNode(node.id, "base");
        bounds = baseNode == null ? null : this.__evalBoundsNode(baseNode);
        break;
      }
      case "OpSmoothIntersection": {
        const lhsNode = this.__inputNode(node.id, "lhs");
        const rhsNode = this.__inputNode(node.id, "rhs");
        if (lhsNode != null && rhsNode != null) {
          const lhs = this.__evalBoundsNode(lhsNode);
          const rhs = this.__evalBoundsNode(rhsNode);
          if (lhs != null && rhs != null) {
            const minX = Math.max(lhs.minPoint.x, rhs.minPoint.x);
            const minY = Math.max(lhs.minPoint.y, rhs.minPoint.y);
            const minZ = Math.max(lhs.minPoint.z, rhs.minPoint.z);
            const maxX = Math.min(lhs.maxPoint.x, rhs.maxPoint.x);
            const maxY = Math.min(lhs.maxPoint.y, rhs.maxPoint.y);
            const maxZ = Math.min(lhs.maxPoint.z, rhs.maxPoint.z);
            if (minX <= maxX && minY <= maxY && minZ <= maxZ) {
              const box = new AABB();
              box.addPosition(Vector3.fromCopy3(minX, minY, minZ));
              box.addPosition(Vector3.fromCopy3(maxX, maxY, maxZ));
              bounds = box;
            }
          }
        }
        break;
      }
      case "OutUnion":
      case "OutDistance": {
        const inputNode = (_a = this.__inputNode(node.id, "in1")) != null ? _a : this.__inputNode(node.id, "value");
        bounds = inputNode == null ? null : this.__evalBoundsNode(inputNode);
        break;
      }
      default:
        bounds = null;
    }
    this.__boundsCache.set(node.id, bounds == null ? null : bounds.clone());
    return bounds;
  }
  /**
   * Returns the exact AABB of a sphere transformed by the position chain.
   * The transformed shape is an ellipsoid, whose extent along each world axis
   * is the radius times the length of the corresponding row of the linear part.
   */
  __evalSphereBounds(node, radius) {
    const positionNode = this.__inputNode(node.id, "position");
    if (positionNode == null) {
      return null;
    }
    const chain = this.__positionChainToWorld(positionNode);
    if (chain == null) {
      return null;
    }
    const center = chain.multiplyVector3(ZERO);
    const axisX = Vector3.subtract(chain.multiplyVector3(Vector3.fromCopy3(1, 0, 0)), center);
    const axisY = Vector3.subtract(chain.multiplyVector3(Vector3.fromCopy3(0, 1, 0)), center);
    const axisZ = Vector3.subtract(chain.multiplyVector3(Vector3.fromCopy3(0, 0, 1)), center);
    const extentX = radius * Math.hypot(axisX.x, axisY.x, axisZ.x);
    const extentY = radius * Math.hypot(axisX.y, axisY.y, axisZ.y);
    const extentZ = radius * Math.hypot(axisX.z, axisY.z, axisZ.z);
    const bounds = new AABB();
    bounds.addPosition(Vector3.fromCopy3(center.x - extentX, center.y - extentY, center.z - extentZ));
    bounds.addPosition(Vector3.fromCopy3(center.x + extentX, center.y + extentY, center.z + extentZ));
    return this.__expandBoundsForNonLinearChain(node, bounds);
  }
  __evalPrimitiveBounds(node, halfExtents) {
    const positionNode = this.__inputNode(node.id, "position");
    if (positionNode == null) {
      return null;
    }
    const chain = this.__positionChainToWorld(positionNode);
    if (chain == null) {
      return null;
    }
    const localBounds = new AABB();
    localBounds.addPosition(Vector3.fromCopy3(-halfExtents.x, -halfExtents.y, -halfExtents.z));
    localBounds.addPosition(Vector3.fromCopy3(halfExtents.x, halfExtents.y, halfExtents.z));
    const worldBounds = new AABB();
    AABB.multiplyMatrixTo(chain, localBounds, worldBounds);
    if (worldBounds.isVanilla()) {
      return null;
    }
    return this.__expandBoundsForNonLinearChain(node, worldBounds);
  }
  /**
   * Returns true when a position chain contains a non-linear domain node
   * (TwistX/Y/Z or BendXY/XZ/YZ/YX/ZX/ZY), which cannot be represented by a matrix.
   */
  __positionChainHasNonLinearNode(node) {
    const visited = /* @__PURE__ */ new Set();
    const stack = [node];
    while (stack.length > 0) {
      const current = stack.pop();
      if (visited.has(current.id)) {
        continue;
      }
      visited.add(current.id);
      if (current.name in NON_LINEAR_ROTATED_AXES) {
        return true;
      }
      const parent = this.__inputNode(current.id, "position");
      if (parent != null) {
        stack.push(parent);
      }
    }
    return false;
  }
  /**
   * Expands primitive bounds for non-linear domain nodes in the position chain.
   * The chain folds them in as identity, so the extents of the rotated axis pair
   * are widened to the radius around the rotation axis (a conservative bound for
   * any angle).
   */
  __expandBoundsForNonLinearChain(node, bounds) {
    const positionNode = this.__inputNode(node.id, "position");
    if (positionNode == null || !this.__positionChainHasNonLinearNode(positionNode)) {
      return bounds;
    }
    const rotatedAxes = /* @__PURE__ */ new Set();
    const visited = /* @__PURE__ */ new Set();
    const stack = [positionNode];
    while (stack.length > 0) {
      const current = stack.pop();
      if (visited.has(current.id)) {
        continue;
      }
      visited.add(current.id);
      const axes = NON_LINEAR_ROTATED_AXES[current.name];
      if (axes != null) {
        rotatedAxes.add(axes);
      }
      const parent = this.__inputNode(current.id, "position");
      if (parent != null) {
        stack.push(parent);
      }
    }
    const min = bounds.minPoint;
    const max = bounds.maxPoint;
    let minX = min.x;
    let maxX = max.x;
    let minY = min.y;
    let maxY = max.y;
    let minZ = min.z;
    let maxZ = max.z;
    if (rotatedAxes.has("yz")) {
      const rho = Math.hypot(Math.max(Math.abs(minY), Math.abs(maxY)), Math.max(Math.abs(minZ), Math.abs(maxZ)));
      minY = -rho;
      maxY = rho;
      minZ = -rho;
      maxZ = rho;
    }
    if (rotatedAxes.has("xz")) {
      const rho = Math.hypot(Math.max(Math.abs(minX), Math.abs(maxX)), Math.max(Math.abs(minZ), Math.abs(maxZ)));
      minX = -rho;
      maxX = rho;
      minZ = -rho;
      maxZ = rho;
    }
    if (rotatedAxes.has("xy")) {
      const rho = Math.hypot(Math.max(Math.abs(minX), Math.abs(maxX)), Math.max(Math.abs(minY), Math.abs(maxY)));
      minX = -rho;
      maxX = rho;
      minY = -rho;
      maxY = rho;
    }
    const expanded = new AABB();
    expanded.addPosition(Vector3.fromCopy3(minX, minY, minZ));
    expanded.addPosition(Vector3.fromCopy3(maxX, maxY, maxZ));
    return expanded;
  }
  /**
   * Returns true when a position chain contains SdApplyWorldMatrix.
   * A graph without this node is authored in world space and does not follow
   * the component entity transform.
   */
  __positionChainUsesWorldMatrix(node) {
    const visited = /* @__PURE__ */ new Set();
    let current = node;
    while (current != null && !visited.has(current.id)) {
      if (current.name === "SdApplyWorldMatrix") {
        return true;
      }
      visited.add(current.id);
      current = this.__inputNode(current.id, "position");
    }
    return false;
  }
  /**
   * Returns the matrix that maps the output space of a position node to world space.
   * `SdApplyTransform` and `SdApplyWorldMatrix` store the inverse transform in the
   * position chain, so the forward transform is the composition `parent * transform`.
   */
  __positionChainToWorld(node) {
    if (this.__positionChainCache.has(node.id)) {
      return this.__positionChainCache.get(node.id);
    }
    let chain = null;
    switch (node.name) {
      case "InitialPosition":
        chain = Matrix44.fromCopyMatrix44(IDENTITY_MATRIX);
        break;
      case "SdApplyTransform": {
        const parent = this.__inputNode(node.id, "position");
        const parentChain = parent == null ? null : this.__positionChainToWorld(parent);
        const transform = this.__getTransform(node);
        if (parentChain != null && transform != null) {
          chain = Matrix44.multiply(parentChain, transform);
        }
        break;
      }
      case "SdApplyWorldMatrix": {
        const parent = this.__inputNode(node.id, "position");
        const parentChain = parent == null ? null : this.__positionChainToWorld(parent);
        if (parentChain != null) {
          chain = Matrix44.multiply(parentChain, this.__worldMatrix);
        }
        break;
      }
      case "TwistX":
      case "TwistY":
      case "TwistZ":
      case "BendXY":
      case "BendXZ":
      case "BendYZ":
      case "BendYX":
      case "BendZX":
      case "BendZY": {
        const parent = this.__inputNode(node.id, "position");
        chain = parent == null ? Matrix44.fromCopyMatrix44(IDENTITY_MATRIX) : this.__positionChainToWorld(parent);
        break;
      }
      default:
        chain = null;
    }
    this.__positionChainCache.set(node.id, chain);
    return chain;
  }
  /**
   * Intersects a normalized ray with an AABB.
   * @returns The entry and exit distances, or null when the ray misses
   */
  static intersectRayAabb(origin, direction, aabb) {
    const mins = [aabb.minPoint.x, aabb.minPoint.y, aabb.minPoint.z];
    const maxs = [aabb.maxPoint.x, aabb.maxPoint.y, aabb.maxPoint.z];
    const origins = [origin.x, origin.y, origin.z];
    const directions = [direction.x, direction.y, direction.z];
    let tMin = -Number.POSITIVE_INFINITY;
    let tMax = Number.POSITIVE_INFINITY;
    for (let i = 0; i < 3; i++) {
      const o = origins[i];
      const d = directions[i];
      if (Math.abs(d) < 1e-12) {
        if (o < mins[i] || o > maxs[i]) {
          return null;
        }
        continue;
      }
      const inverse = 1 / d;
      let t1 = (mins[i] - o) * inverse;
      let t2 = (maxs[i] - o) * inverse;
      if (t1 > t2) {
        const tmp = t1;
        t1 = t2;
        t2 = tmp;
      }
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMax < tMin) {
        return null;
      }
    }
    return [tMin, tMax];
  }
};
/**
 * Input ports that carry the SDF's spatial data (position or distance). The same
 * set is followed by the shared shader when it links `SdApplyTransform` scale
 * globals to a terminal.
 */
_RaymarchingSdfEvaluator.__SPATIAL_INPUT_PORTS = /* @__PURE__ */ new Set([
  "position",
  "lhs",
  "rhs",
  "base",
  "subtractor",
  "value",
  "in1"
]);
var RaymarchingSdfEvaluator = _RaymarchingSdfEvaluator;
export {
  RaymarchingSdfEvaluator
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vY29tcG9uZW50cy9SYXltYXJjaGluZy9SYXltYXJjaGluZ1NkZkV2YWx1YXRvci50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBOb2RlSlNPTiwgTm9kZUpTT05Ob2RlIH0gZnJvbSAnLi4vLi4vLi4vdHlwZXMvTm9kZUpTT04nO1xuaW1wb3J0IHsgQUFCQiB9IGZyb20gJy4uLy4uL21hdGgvQUFCQic7XG5pbXBvcnQgdHlwZSB7IElNYXRyaXg0NCB9IGZyb20gJy4uLy4uL21hdGgvSU1hdHJpeCc7XG5pbXBvcnQgeyBNYXRyaXg0NCB9IGZyb20gJy4uLy4uL21hdGgvTWF0cml4NDQnO1xuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJy4uLy4uL21hdGgvVmVjdG9yMyc7XG5cbi8qKlxuICogUmVzb2x2ZXMgYSBtYXRlcmlhbCBwYXJhbWV0ZXIgdXNlZCBieSBhIFVuaWZvcm0gc2hhZGVyIG5vZGUuXG4gKlxuICogVGhlIHJheW1hcmNoaW5nIG1hdGVyaWFsIGlzIG93bmVkIGJ5IHRoZSBhcHBsaWNhdGlvbiwgc28gdGhlIGVuZ2luZSBjYW5ub3RcbiAqIGxvb2sgaXQgdXAgZGlyZWN0bHkuIEFwcGxpY2F0aW9ucyB0aGF0IGNoYW5nZSB1bmlmb3JtIHZhbHVlcyBhdCBydW50aW1lIGNhblxuICogcHJvdmlkZSB0aGlzIGNhbGxiYWNrIHRvIGtlZXAgdGhlIENQVS1zaWRlIFNERiBldmFsdWF0aW9uIGluIHN5bmMuXG4gKi9cbmV4cG9ydCB0eXBlIFJheW1hcmNoaW5nVW5pZm9ybVZhbHVlUHJvdmlkZXIgPSAobmFtZTogc3RyaW5nKSA9PiB1bmtub3duO1xuXG4vKipcbiAqIE9wdGlvbnMgZm9yIHtAbGluayBSYXltYXJjaGluZ1NkZkV2YWx1YXRvci5tYXJjaFJheX0uXG4gKi9cbmV4cG9ydCB0eXBlIFJheW1hcmNoaW5nUmF5Y2FzdE9wdGlvbnMgPSB7XG4gIC8qKiBNYXhpbXVtIGRpc3RhbmNlIGFsb25nIHRoZSByYXkgdG8gbWFyY2guIERlZmF1bHRzIHRvIDEwMDAwLiAqL1xuICBtYXhEaXN0YW5jZT86IG51bWJlcjtcbiAgLyoqIE1heGltdW0gbnVtYmVyIG9mIHNwaGVyZS10cmFjaW5nIHN0ZXBzLiBEZWZhdWx0cyB0byAyNTYuICovXG4gIG1heFN0ZXBzPzogbnVtYmVyO1xuICAvKiogRGlzdGFuY2UgdGhyZXNob2xkIHRoYXQgY291bnRzIGFzIGEgc3VyZmFjZSBoaXQuIERlZmF1bHRzIHRvIDAuMDAxLiAqL1xuICBlcHNpbG9uPzogbnVtYmVyO1xufTtcblxuLyoqXG4gKiBSZXN1bHQgb2YgYSBDUFUtc2lkZSBTREYgcmF5Y2FzdC5cbiAqL1xuZXhwb3J0IHR5cGUgUmF5bWFyY2hpbmdSYXljYXN0SGl0ID0ge1xuICAvKiogRGlzdGFuY2UgYWxvbmcgdGhlIHJheSBmcm9tIHRoZSBvcmlnaW4uICovXG4gIHQ6IG51bWJlcjtcbiAgLyoqIEhpdCBwb3NpdGlvbiBpbiB3b3JsZCBzcGFjZS4gKi9cbiAgcG9zaXRpb246IFZlY3RvcjM7XG59O1xuXG4vKipcbiAqIEEgc2luZ2xlIHNwaGVyZSBwcmltaXRpdmUgZXh0cmFjdGVkIGZyb20gYW4gU0RGIGdyYXBoLlxuICovXG5leHBvcnQgdHlwZSBSYXltYXJjaGluZ1NwaGVyZVByaW1pdGl2ZSA9IHtcbiAgLyoqIFNwaGVyZSBjZW50ZXIgaW4gdGhlIGV2YWx1YXRvcidzIG91dHB1dCBzcGFjZS4gKi9cbiAgY2VudGVyOiBWZWN0b3IzO1xuICAvKiogQ29uc2VydmF0aXZlIHNwaGVyZSByYWRpdXMgaW4gdGhlIGV2YWx1YXRvcidzIG91dHB1dCBzcGFjZS4gKi9cbiAgcmFkaXVzOiBudW1iZXI7XG4gIC8qKiBXaGV0aGVyIHRoZSBzcGhlcmUncyBwb3NpdGlvbiBjaGFpbiBjb250YWlucyBTZEFwcGx5V29ybGRNYXRyaXguICovXG4gIHVzZXNXb3JsZE1hdHJpeDogYm9vbGVhbjtcbn07XG5cbmNvbnN0IFpFUk8gPSBWZWN0b3IzLmZyb21Db3B5MygwLCAwLCAwKTtcbmNvbnN0IE9ORSA9IFZlY3RvcjMuZnJvbUNvcHkzKDEsIDEsIDEpO1xuY29uc3QgREVGQVVMVF9DQVBTVUxFX1BPSU5UX0EgPSBWZWN0b3IzLmZyb21Db3B5MygwLCAtMC41LCAwKTtcbmNvbnN0IERFRkFVTFRfQ0FQU1VMRV9QT0lOVF9CID0gVmVjdG9yMy5mcm9tQ29weTMoMCwgMC41LCAwKTtcbmNvbnN0IElERU5USVRZX01BVFJJWCA9IE1hdHJpeDQ0LmZyb21Db3B5TWF0cml4NDQoTWF0cml4NDQuaWRlbnRpdHkoKSk7XG5cbmNvbnN0IFJFUEVBVF9BWEVTOiBSZWNvcmQ8c3RyaW5nLCB7IHg6IGJvb2xlYW47IHk6IGJvb2xlYW47IHo6IGJvb2xlYW4gfT4gPSB7XG4gIFNkUmVwZWF0OiB7IHg6IHRydWUsIHk6IHRydWUsIHo6IHRydWUgfSxcbiAgU2RSZXBlYXRYOiB7IHg6IHRydWUsIHk6IGZhbHNlLCB6OiBmYWxzZSB9LFxuICBTZFJlcGVhdFk6IHsgeDogZmFsc2UsIHk6IHRydWUsIHo6IGZhbHNlIH0sXG4gIFNkUmVwZWF0WjogeyB4OiBmYWxzZSwgeTogZmFsc2UsIHo6IHRydWUgfSxcbiAgU2RSZXBlYXRYWTogeyB4OiB0cnVlLCB5OiB0cnVlLCB6OiBmYWxzZSB9LFxuICBTZFJlcGVhdFlaOiB7IHg6IGZhbHNlLCB5OiB0cnVlLCB6OiB0cnVlIH0sXG4gIFNkUmVwZWF0Wlg6IHsgeDogdHJ1ZSwgeTogZmFsc2UsIHo6IHRydWUgfSxcbn07XG5cbi8qKlxuICogTm9uLWxpbmVhciBkb21haW4gbm9kZXMgY2Fubm90IGJlIHJlcHJlc2VudGVkIGJ5IGEgbWF0cml4LlxuICogTWFwcyBlYWNoIG5vZGUgdG8gdGhlIHBhaXIgb2YgYXhlcyBpdHMgcm90YXRpb24gbWl4ZXMuXG4gKi9cbmNvbnN0IE5PTl9MSU5FQVJfUk9UQVRFRF9BWEVTOiBSZWNvcmQ8c3RyaW5nLCAneXonIHwgJ3h6JyB8ICd4eSc+ID0ge1xuICBUd2lzdFg6ICd5eicsXG4gIFR3aXN0WTogJ3h6JyxcbiAgVHdpc3RaOiAneHknLFxuICBCZW5kWFk6ICd4eScsXG4gIEJlbmRYWjogJ3h6JyxcbiAgQmVuZFlaOiAneXonLFxuICBCZW5kWVg6ICd4eScsXG4gIEJlbmRaWDogJ3h6JyxcbiAgQmVuZFpZOiAneXonLFxufTtcblxuLyoqXG4gKiBFdmFsdWF0ZXMgdGhlIFNERiBncmFwaCBzdG9yZWQgaW4gYFJheW1hcmNoaW5nQ29tcG9uZW50LnJybkpzb25gLlxuICpcbiAqIFRoZSBncmFwaCBpcyBldmFsdWF0ZWQgaW4gdGhlIHNhbWUgc3BhY2UgYXMgdGhlIHJheW1hcmNoaW5nIHNoYWRlcjpcbiAqIGBJbml0aWFsUG9zaXRpb25gIGlzIHRoZSB3b3JsZC1zcGFjZSByYXkgcG9zaXRpb24sIGFuZFxuICogYFNkQXBwbHlXb3JsZE1hdHJpeGAgbWFwcyBwb3NpdGlvbnMgaW50byB0aGUgY29tcG9uZW50IGVudGl0eSdzIGxvY2FsIHNwYWNlXG4gKiB3aXRoIHRoZSBpbnZlcnNlIHdvcmxkIG1hdHJpeC4gVGhlIGV2YWx1YXRvciBzdXBwb3J0cyB0aGUgU0RGIG5vZGUgc2V0IHRoYXRcbiAqIHRoZSByYXltYXJjaGluZyBub2RlIGVkaXRvciBleHBvc2VzLlxuICpcbiAqIEJvdW5kcyBhcmUgY29uc2VydmF0aXZlLiBBIGdyYXBoIHRoYXQgY29udGFpbnMgYW4gaW5maW5pdGUgcHJpbWl0aXZlXG4gKiAoYFNkQmFyKmAsIGBTZFR1YmUqYCkgb3IgYW4gaW5maW5pdGUgcmVwZXRpdGlvbiAoYFNkUmVwZWF0KmApIGhhcyBubyBmaW5pdGVcbiAqIGJvdW5kcyBhbmQge0BsaW5rIGNhbGNCb3VuZHN9IHJldHVybnMgbnVsbC4gUGlja2luZyBzdGlsbCB3b3JrcyBmb3IgdGhvc2VcbiAqIGdyYXBocyBiZWNhdXNlIHNwaGVyZSB0cmFjaW5nIGRvZXMgbm90IHJlcXVpcmUgYm91bmRzLlxuICovXG5leHBvcnQgY2xhc3MgUmF5bWFyY2hpbmdTZGZFdmFsdWF0b3Ige1xuICBwcml2YXRlIF9fbm9kZXMgPSBuZXcgTWFwPHN0cmluZywgTm9kZUpTT05Ob2RlPigpO1xuICBwcml2YXRlIF9faW5wdXRMaW5rcyA9IG5ldyBNYXA8c3RyaW5nLCBNYXA8c3RyaW5nLCBzdHJpbmc+PigpO1xuICBwcml2YXRlIF9fb3V0cHV0Tm9kZXM6IE5vZGVKU09OTm9kZVtdID0gW107XG4gIHByaXZhdGUgX193b3JsZE1hdHJpeDogTWF0cml4NDQ7XG4gIHByaXZhdGUgX19pbnZlcnNlV29ybGRNYXRyaXg6IE1hdHJpeDQ0O1xuICBwcml2YXRlIF9fdW5pZm9ybVZhbHVlUHJvdmlkZXI/OiBSYXltYXJjaGluZ1VuaWZvcm1WYWx1ZVByb3ZpZGVyO1xuXG4gIHByaXZhdGUgX19zY2FsYXJDYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXIgfCBudWxsPigpO1xuICBwcml2YXRlIF9fdmVjM0NhY2hlID0gbmV3IE1hcDxzdHJpbmcsIFZlY3RvcjMgfCBudWxsPigpO1xuICBwcml2YXRlIF9fdHJhbnNmb3JtQ2FjaGUgPSBuZXcgTWFwPHN0cmluZywgTWF0cml4NDQgfCBudWxsPigpO1xuICBwcml2YXRlIF9faW52ZXJzZVRyYW5zZm9ybUNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIE1hdHJpeDQ0IHwgbnVsbD4oKTtcbiAgcHJpdmF0ZSBfX2JvdW5kc0NhY2hlID0gbmV3IE1hcDxzdHJpbmcsIEFBQkIgfCBudWxsPigpO1xuICBwcml2YXRlIF9fcG9zaXRpb25DaGFpbkNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIE1hdHJpeDQ0IHwgbnVsbD4oKTtcbiAgcHJpdmF0ZSBfX3Rlcm1pbmFsVHJhbnNmb3JtU2NhbGVDYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXIgfCBudWxsPigpO1xuICBwcml2YXRlIF9fZGlzdGFuY2VTY2FsZUZhY3RvciA9IDE7XG4gIHByaXZhdGUgX191c2VzV29ybGRNYXRyaXggPSBmYWxzZTtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBldmFsdWF0b3IgZm9yIG9uZSByYXltYXJjaGluZyBjb21wb25lbnQuXG4gICAqIEBwYXJhbSBub2RlSnNvbiAtIFRoZSBub2RlIGdyYXBoIHN0b3JlZCBpbiBgUmF5bWFyY2hpbmdDb21wb25lbnQucnJuSnNvbmBcbiAgICogQHBhcmFtIHdvcmxkTWF0cml4IC0gVGhlIGNvbXBvbmVudCBlbnRpdHkncyB3b3JsZCBtYXRyaXggKGBzY2VuZUdyYXBoLm1hdHJpeElubmVyYClcbiAgICogQHBhcmFtIHVuaWZvcm1WYWx1ZVByb3ZpZGVyIC0gT3B0aW9uYWwgcmVzb2x2ZXIgZm9yIFVuaWZvcm0gbm9kZSB2YWx1ZXNcbiAgICovXG4gIGNvbnN0cnVjdG9yKG5vZGVKc29uOiBOb2RlSlNPTiwgd29ybGRNYXRyaXg6IElNYXRyaXg0NCwgdW5pZm9ybVZhbHVlUHJvdmlkZXI/OiBSYXltYXJjaGluZ1VuaWZvcm1WYWx1ZVByb3ZpZGVyKSB7XG4gICAgdGhpcy5fX3dvcmxkTWF0cml4ID0gTWF0cml4NDQuZnJvbUNvcHlNYXRyaXg0NCh3b3JsZE1hdHJpeCk7XG4gICAgdGhpcy5fX2ludmVyc2VXb3JsZE1hdHJpeCA9IE1hdHJpeDQ0LmludmVydCh0aGlzLl9fd29ybGRNYXRyaXgpO1xuICAgIHRoaXMuX191bmlmb3JtVmFsdWVQcm92aWRlciA9IHVuaWZvcm1WYWx1ZVByb3ZpZGVyO1xuXG4gICAgZm9yIChjb25zdCBub2RlIG9mIG5vZGVKc29uLm5vZGVzKSB7XG4gICAgICB0aGlzLl9fbm9kZXMuc2V0KG5vZGUuaWQsIG5vZGUpO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGNvbm5lY3Rpb24gb2Ygbm9kZUpzb24uY29ubmVjdGlvbnMpIHtcbiAgICAgIGxldCBsaW5rcyA9IHRoaXMuX19pbnB1dExpbmtzLmdldChjb25uZWN0aW9uLnRvLmlkKTtcbiAgICAgIGlmIChsaW5rcyA9PSBudWxsKSB7XG4gICAgICAgIGxpbmtzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLl9faW5wdXRMaW5rcy5zZXQoY29ubmVjdGlvbi50by5pZCwgbGlua3MpO1xuICAgICAgfVxuICAgICAgbGlua3Muc2V0KGNvbm5lY3Rpb24udG8ucG9ydE5hbWUsIGNvbm5lY3Rpb24uZnJvbS5pZCk7XG4gICAgfVxuICAgIHRoaXMuX19vdXRwdXROb2RlcyA9IG5vZGVKc29uLm5vZGVzLmZpbHRlcihub2RlID0+IG5vZGUubmFtZSA9PT0gJ091dFVuaW9uJyB8fCBub2RlLm5hbWUgPT09ICdPdXREaXN0YW5jZScpO1xuXG4gICAgLy8gVGhlIGdyYXBoJ3MgZGlzdGFuY2UgaXMgZXZhbHVhdGVkIGluIHRoZSBzcGFjZSBwcm9kdWNlZCBieSBTZEFwcGx5V29ybGRNYXRyaXgsXG4gICAgLy8gc28gaXQgaGFzIHRvIGJlIGNvbnZlcnRlZCB0byBhIGNvbnNlcnZhdGl2ZSB3b3JsZC1zcGFjZSBkaXN0YW5jZS4gVGhlIGZhY3RvciBpc1xuICAgIC8vIGEgbG93ZXIgYm91bmQgb2YgdGhlIHNtYWxsZXN0IHNpbmd1bGFyIHZhbHVlIG9mIHRoZSB3b3JsZCBtYXRyaXggTSwgbWlycm9yaW5nXG4gICAgLy8gcm5SYXltYXJjaERpc3RhbmNlU2NhbGUgaW4gdGhlIHNoYXJlZCBzaGFkZXI6XG4gICAgLy8gLSBGb3IgYSByb3RhdGlvbiBhbmQgYSAobm9uLXVuaWZvcm0pIHNjYWxlLCB0aGUgY29sdW1uIGxlbmd0aHMgYXJlIHRoZSBzaW5ndWxhclxuICAgIC8vICAgdmFsdWVzLCBzbyB0aGVpciBtaW5pbXVtIGlzIGV4YWN0LlxuICAgIC8vIC0gQSBzaGVhcmVkIG1hdHJpeCAoYSBub24tdW5pZm9ybWx5IHNjYWxlZCBwYXJlbnQgd2l0aCBhIHJvdGF0ZWQgY2hpbGQpIHVzZXNcbiAgICAvLyAgIDEvfHxNXi0xfHxfRiwgYSBsb3dlciBib3VuZCBvZiB0aGUgc21hbGxlc3Qgc2luZ3VsYXIgdmFsdWUuXG4gICAgY29uc3Qgd29ybGQgPSB0aGlzLl9fd29ybGRNYXRyaXg7XG4gICAgY29uc3QgYXhpc1ggPSBbd29ybGQubTAwLCB3b3JsZC5tMTAsIHdvcmxkLm0yMF07XG4gICAgY29uc3QgYXhpc1kgPSBbd29ybGQubTAxLCB3b3JsZC5tMTEsIHdvcmxkLm0yMV07XG4gICAgY29uc3QgYXhpc1ogPSBbd29ybGQubTAyLCB3b3JsZC5tMTIsIHdvcmxkLm0yMl07XG4gICAgY29uc3QgbGVuWCA9IE1hdGguaHlwb3QoYXhpc1hbMF0sIGF4aXNYWzFdLCBheGlzWFsyXSk7XG4gICAgY29uc3QgbGVuWSA9IE1hdGguaHlwb3QoYXhpc1lbMF0sIGF4aXNZWzFdLCBheGlzWVsyXSk7XG4gICAgY29uc3QgbGVuWiA9IE1hdGguaHlwb3QoYXhpc1pbMF0sIGF4aXNaWzFdLCBheGlzWlsyXSk7XG4gICAgY29uc3Qgb3J0aG9FcnJvciA9XG4gICAgICBNYXRoLmFicyhheGlzWFswXSAqIGF4aXNZWzBdICsgYXhpc1hbMV0gKiBheGlzWVsxXSArIGF4aXNYWzJdICogYXhpc1lbMl0pICtcbiAgICAgIE1hdGguYWJzKGF4aXNYWzBdICogYXhpc1pbMF0gKyBheGlzWFsxXSAqIGF4aXNaWzFdICsgYXhpc1hbMl0gKiBheGlzWlsyXSkgK1xuICAgICAgTWF0aC5hYnMoYXhpc1lbMF0gKiBheGlzWlswXSArIGF4aXNZWzFdICogYXhpc1pbMV0gKyBheGlzWVsyXSAqIGF4aXNaWzJdKTtcbiAgICBjb25zdCBvcnRob1RvbGVyYW5jZSA9IDAuMDAwMSAqIChsZW5YICogbGVuWSArIGxlblggKiBsZW5aICsgbGVuWSAqIGxlblopO1xuICAgIGxldCBsb2NhbFRvV29ybGRTY2FsZTogbnVtYmVyO1xuICAgIGlmIChvcnRob0Vycm9yIDw9IG9ydGhvVG9sZXJhbmNlKSB7XG4gICAgICBsb2NhbFRvV29ybGRTY2FsZSA9IE1hdGgubWluKGxlblgsIGxlblksIGxlblopO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBpbnZlcnNlID0gdGhpcy5fX2ludmVyc2VXb3JsZE1hdHJpeDtcbiAgICAgIGNvbnN0IGZyb2Jlbml1c1NxID1cbiAgICAgICAgaW52ZXJzZS5tMDAgKiogMiArXG4gICAgICAgIGludmVyc2UubTEwICoqIDIgK1xuICAgICAgICBpbnZlcnNlLm0yMCAqKiAyICtcbiAgICAgICAgaW52ZXJzZS5tMDEgKiogMiArXG4gICAgICAgIGludmVyc2UubTExICoqIDIgK1xuICAgICAgICBpbnZlcnNlLm0yMSAqKiAyICtcbiAgICAgICAgaW52ZXJzZS5tMDIgKiogMiArXG4gICAgICAgIGludmVyc2UubTEyICoqIDIgK1xuICAgICAgICBpbnZlcnNlLm0yMiAqKiAyO1xuICAgICAgbG9jYWxUb1dvcmxkU2NhbGUgPSAxIC8gTWF0aC5zcXJ0KE1hdGgubWF4KGZyb2Jlbml1c1NxLCAwLjAwMDAwMDAxKSk7XG4gICAgfVxuICAgIHRoaXMuX19kaXN0YW5jZVNjYWxlRmFjdG9yID0gTWF0aC5tYXgoTWF0aC5taW4oMSwgbG9jYWxUb1dvcmxkU2NhbGUpLCAwLjAwMDEpO1xuICAgIHRoaXMuX191c2VzV29ybGRNYXRyaXggPSB0aGlzLl9fb3V0cHV0Tm9kZXMuc29tZShub2RlID0+IHRoaXMuX19kaXN0YW5jZU5vZGVVc2VzV29ybGRNYXRyaXgobm9kZSwgbmV3IFNldCgpKSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0cnVlIHdoZW4gdGhlIGRpc3RhbmNlIHN1YnRyZWUgb2YgYSBub2RlIGNvbnRhaW5zIFNkQXBwbHlXb3JsZE1hdHJpeC5cbiAgICogVGhlIHJlbmRlcmluZyBzaGFkZXIgYXBwbGllcyB0aGUgd29ybGQtc3BhY2UgZGlzdGFuY2UgY29ycmVjdGlvbiB0byBhIGNvbXBvbmVudFxuICAgKiB3aG9zZSBncmFwaCB1c2VzIGl0LCBzbyB0aGUgQ1BVIGV2YWx1YXRvciBkb2VzIHRoZSBzYW1lLlxuICAgKiBAcGFyYW0gbm9kZSAtIFJvb3Qgb2YgdGhlIGRpc3RhbmNlIHN1YnRyZWVcbiAgICogQHBhcmFtIHZpc2l0ZWQgLSBOb2RlIGlkcyBhbHJlYWR5IHZpc2l0ZWRcbiAgICovXG4gIHByaXZhdGUgX19kaXN0YW5jZU5vZGVVc2VzV29ybGRNYXRyaXgobm9kZTogTm9kZUpTT05Ob2RlLCB2aXNpdGVkOiBTZXQ8c3RyaW5nPik6IGJvb2xlYW4ge1xuICAgIGlmIChub2RlLm5hbWUgPT09ICdTZEFwcGx5V29ybGRNYXRyaXgnKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHZpc2l0ZWQuaGFzKG5vZGUuaWQpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZpc2l0ZWQuYWRkKG5vZGUuaWQpO1xuICAgIGNvbnN0IGxpbmtzID0gdGhpcy5fX2lucHV0TGlua3MuZ2V0KG5vZGUuaWQpO1xuICAgIGlmIChsaW5rcyA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGZvciAoY29uc3QgZnJvbUlkIG9mIGxpbmtzLnZhbHVlcygpKSB7XG4gICAgICBjb25zdCBpbnB1dE5vZGUgPSB0aGlzLl9fbm9kZXMuZ2V0KGZyb21JZCk7XG4gICAgICBpZiAoaW5wdXROb2RlICE9IG51bGwgJiYgdGhpcy5fX2Rpc3RhbmNlTm9kZVVzZXNXb3JsZE1hdHJpeChpbnB1dE5vZGUsIHZpc2l0ZWQpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlcyBhIGNvbnNlcnZhdGl2ZSB3b3JsZC1zcGFjZSBBQUJCIG9mIHRoZSBTREYgZ3JhcGguXG4gICAqIEByZXR1cm5zIFRoZSB3b3JsZC1zcGFjZSBib3VuZHMsIG9yIG51bGwgd2hlbiB0aGUgZ3JhcGggaXMgdW5ib3VuZGVkIG9yXG4gICAqIGNvbnRhaW5zIGEgbm9kZSB0aGUgZXZhbHVhdG9yIGRvZXMgbm90IHVuZGVyc3RhbmQuXG4gICAqL1xuICBjYWxjQm91bmRzKCk6IEFBQkIgfCBudWxsIHtcbiAgICBpZiAodGhpcy5fX291dHB1dE5vZGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgbWVyZ2VkID0gbmV3IEFBQkIoKTtcbiAgICBmb3IgKGNvbnN0IG91dHB1dCBvZiB0aGlzLl9fb3V0cHV0Tm9kZXMpIHtcbiAgICAgIGNvbnN0IGJvdW5kcyA9IHRoaXMuX19ldmFsQm91bmRzTm9kZShvdXRwdXQpO1xuICAgICAgaWYgKGJvdW5kcyA9PSBudWxsIHx8IGJvdW5kcy5pc1ZhbmlsbGEoKSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIG1lcmdlZC5tZXJnZUFBQkIoYm91bmRzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbWVyZ2VkLmlzVmFuaWxsYSgpID8gbnVsbCA6IG1lcmdlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBzcGhlcmUgcHJpbWl0aXZlIHdoZW4gdGhlIGdyYXBoIGV2YWx1YXRlcyB0byBhIHNpbmdsZSBzcGhlcmUuXG4gICAqXG4gICAqIFRoZSBjZW50ZXIgYW5kIHJhZGl1cyBhcmUgZXhwcmVzc2VkIGluIHRoZSBldmFsdWF0b3IncyBvdXRwdXQgc3BhY2VcbiAgICogKHRoZSBzcGFjZSBwcm9kdWNlZCBieSB0aGlzIGV2YWx1YXRvcidzIHdvcmxkIG1hdHJpeCkuIEFueSB0cmFuc2Zvcm0gY2hhaW5cbiAgICogYmVmb3JlIHRoZSBzcGhlcmUgaXMgZm9sZGVkIGludG8gdGhlIHJlc3VsdC4gQSBub24tdW5pZm9ybSBsb2NhbCBzY2FsZSBpc1xuICAgKiBhcHByb3hpbWF0ZWQgYnkgdGhlIGxhcmdlc3QgYXhpcyBzY2FsZSBzbyB0aGUgcmV0dXJuZWQgc3BoZXJlIGNvbnRhaW5zIHRoZVxuICAgKiByZXN1bHRpbmcgZWxsaXBzb2lkLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgc3BoZXJlIHByaW1pdGl2ZSwgb3IgbnVsbCBmb3IgYW55IG90aGVyIGdyYXBoXG4gICAqL1xuICBjYWxjU3BoZXJlKCk6IFJheW1hcmNoaW5nU3BoZXJlUHJpbWl0aXZlIHwgbnVsbCB7XG4gICAgaWYgKHRoaXMuX19vdXRwdXROb2Rlcy5sZW5ndGggIT09IDEpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IG91dHB1dCA9IHRoaXMuX19vdXRwdXROb2Rlc1swXTtcbiAgICBjb25zdCBpbnB1dE5vZGUgPSB0aGlzLl9faW5wdXROb2RlKG91dHB1dC5pZCwgJ2luMScpID8/IHRoaXMuX19pbnB1dE5vZGUob3V0cHV0LmlkLCAndmFsdWUnKTtcbiAgICBpZiAoaW5wdXROb2RlID09IG51bGwgfHwgaW5wdXROb2RlLm5hbWUgIT09ICdTZFNwaGVyZScpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IHJhZGl1cyA9IHRoaXMuX19yZWFkU2NhbGFySW5wdXQoaW5wdXROb2RlLCAncmFkaXVzJywgMSk7XG4gICAgaWYgKHJhZGl1cyA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBwb3NpdGlvbk5vZGUgPSB0aGlzLl9faW5wdXROb2RlKGlucHV0Tm9kZS5pZCwgJ3Bvc2l0aW9uJyk7XG4gICAgaWYgKHBvc2l0aW9uTm9kZSA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgaWYgKHRoaXMuX19wb3NpdGlvbkNoYWluSGFzTm9uTGluZWFyTm9kZShwb3NpdGlvbk5vZGUpKSB7XG4gICAgICAvLyBBIHR3aXN0ZWQgb3IgYmVudCBzcGhlcmUgaXMgbm90IGEgc3BoZXJlIGFueW1vcmUuXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgY2hhaW4gPSB0aGlzLl9fcG9zaXRpb25DaGFpblRvV29ybGQocG9zaXRpb25Ob2RlKTtcbiAgICBpZiAoY2hhaW4gPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgY2VudGVyID0gY2hhaW4ubXVsdGlwbHlWZWN0b3IzKFpFUk8pO1xuICAgIGNvbnN0IGF4aXNYID0gVmVjdG9yMy5zdWJ0cmFjdChjaGFpbi5tdWx0aXBseVZlY3RvcjMoVmVjdG9yMy5mcm9tQ29weTMoMSwgMCwgMCkpLCBjZW50ZXIpO1xuICAgIGNvbnN0IGF4aXNZID0gVmVjdG9yMy5zdWJ0cmFjdChjaGFpbi5tdWx0aXBseVZlY3RvcjMoVmVjdG9yMy5mcm9tQ29weTMoMCwgMSwgMCkpLCBjZW50ZXIpO1xuICAgIGNvbnN0IGF4aXNaID0gVmVjdG9yMy5zdWJ0cmFjdChjaGFpbi5tdWx0aXBseVZlY3RvcjMoVmVjdG9yMy5mcm9tQ29weTMoMCwgMCwgMSkpLCBjZW50ZXIpO1xuXG4gICAgY29uc3Qgc2NhbGVYID0gTWF0aC5oeXBvdChheGlzWC54LCBheGlzWS54LCBheGlzWi54KTtcbiAgICBjb25zdCBzY2FsZVkgPSBNYXRoLmh5cG90KGF4aXNYLnksIGF4aXNZLnksIGF4aXNaLnkpO1xuICAgIGNvbnN0IHNjYWxlWiA9IE1hdGguaHlwb3QoYXhpc1gueiwgYXhpc1kueiwgYXhpc1oueik7XG4gICAgY29uc3QgbWF4U2NhbGUgPSBNYXRoLm1heChzY2FsZVgsIHNjYWxlWSwgc2NhbGVaKTtcbiAgICBjb25zdCBzcGhlcmVSYWRpdXMgPSBNYXRoLmFicyhyYWRpdXMpICogbWF4U2NhbGU7XG4gICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUoc3BoZXJlUmFkaXVzKSB8fCBzcGhlcmVSYWRpdXMgPD0gMCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNlbnRlcixcbiAgICAgIHJhZGl1czogc3BoZXJlUmFkaXVzLFxuICAgICAgdXNlc1dvcmxkTWF0cml4OiB0aGlzLl9fcG9zaXRpb25DaGFpblVzZXNXb3JsZE1hdHJpeChwb3NpdGlvbk5vZGUpLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogRXZhbHVhdGVzIHRoZSBzaWduZWQgZGlzdGFuY2UgYXQgYSB3b3JsZC1zcGFjZSBwb2ludC5cbiAgICpcbiAgICogV2hlbiB0aGUgZ3JhcGggaXMgZXZhbHVhdGVkIHRocm91Z2ggYFNkQXBwbHlXb3JsZE1hdHJpeGAsIHRoZSByZXR1cm5lZCB2YWx1ZSBpc1xuICAgKiBjb252ZXJ0ZWQgaW50byBhIGNvbnNlcnZhdGl2ZSB3b3JsZC1zcGFjZSBkaXN0YW5jZSAodGhlIGxvY2FsIGRpc3RhbmNlIHRpbWVzIGFcbiAgICogbG93ZXIgYm91bmQgb2YgdGhlIHNtYWxsZXN0IHNpbmd1bGFyIHZhbHVlIG9mIHRoZSBjb21wb25lbnQncyB3b3JsZCBtYXRyaXgpLFxuICAgKiBtYXRjaGluZyB0aGUgZGlzdGFuY2UgdGhlIHJheW1hcmNoaW5nIHNoYWRlciBtYXJjaGVzIHdpdGguIGBTZEFwcGx5VHJhbnNmb3JtYFxuICAgKiBub2RlcyBpbiBhIHRlcm1pbmFsJ3Mgc3VidHJlZSBzY2FsZSBpdHMgZGlzdGFuY2UgYnkgdGhlaXIgc21hbGxlc3QgYXhpcyBzY2FsZSxcbiAgICogYWdhaW4gbWF0Y2hpbmcgdGhlIHNoYWRlci5cbiAgICpcbiAgICogQHBhcmFtIHBvaW50SW5Xb3JsZCAtIFRoZSBwb2ludCB0byBldmFsdWF0ZVxuICAgKiBAcmV0dXJucyBUaGUgc2lnbmVkIGRpc3RhbmNlLCBvciBudWxsIHdoZW4gdGhlIGdyYXBoIGlzIHVuc3VwcG9ydGVkXG4gICAqL1xuICBldmFsRGlzdGFuY2VBdChwb2ludEluV29ybGQ6IFZlY3RvcjMpOiBudW1iZXIgfCBudWxsIHtcbiAgICBpZiAodGhpcy5fX291dHB1dE5vZGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgbGV0IGRpc3RhbmNlID0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xuICAgIGZvciAoY29uc3Qgb3V0cHV0IG9mIHRoaXMuX19vdXRwdXROb2Rlcykge1xuICAgICAgY29uc3QgdmFsdWUgPSB0aGlzLl9fZXZhbERpc3RhbmNlTm9kZShvdXRwdXQsIHBvaW50SW5Xb3JsZCk7XG4gICAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHRyYW5zZm9ybVNjYWxlID0gdGhpcy5fX3Rlcm1pbmFsVHJhbnNmb3JtU2NhbGUob3V0cHV0KTtcbiAgICAgIGlmICh0cmFuc2Zvcm1TY2FsZSA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgZGlzdGFuY2UgPSBNYXRoLm1pbihkaXN0YW5jZSwgdmFsdWUgKiB0cmFuc2Zvcm1TY2FsZSk7XG4gICAgfVxuXG4gICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUoZGlzdGFuY2UpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX191c2VzV29ybGRNYXRyaXggPyBkaXN0YW5jZSAqIHRoaXMuX19kaXN0YW5jZVNjYWxlRmFjdG9yIDogZGlzdGFuY2U7XG4gIH1cblxuICAvKipcbiAgICogSW5wdXQgcG9ydHMgdGhhdCBjYXJyeSB0aGUgU0RGJ3Mgc3BhdGlhbCBkYXRhIChwb3NpdGlvbiBvciBkaXN0YW5jZSkuIFRoZSBzYW1lXG4gICAqIHNldCBpcyBmb2xsb3dlZCBieSB0aGUgc2hhcmVkIHNoYWRlciB3aGVuIGl0IGxpbmtzIGBTZEFwcGx5VHJhbnNmb3JtYCBzY2FsZVxuICAgKiBnbG9iYWxzIHRvIGEgdGVybWluYWwuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfX1NQQVRJQUxfSU5QVVRfUE9SVFMgPSBuZXcgU2V0KFtcbiAgICAncG9zaXRpb24nLFxuICAgICdsaHMnLFxuICAgICdyaHMnLFxuICAgICdiYXNlJyxcbiAgICAnc3VidHJhY3RvcicsXG4gICAgJ3ZhbHVlJyxcbiAgICAnaW4xJyxcbiAgXSk7XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGNvbnNlcnZhdGl2ZSBsb2NhbC10by13b3JsZCBzY2FsZSBvZiB0aGUgYFNkQXBwbHlUcmFuc2Zvcm1gIG5vZGVzXG4gICAqIHRoYXQgZmVlZCBhIHRlcm1pbmFsIG5vZGUncyBkaXN0YW5jZSBzdWJ0cmVlLlxuICAgKlxuICAgKiBBIHRyYW5zZm9ybSBub2RlIHNjYWxlZCBiZWxvdyAxIG1ha2VzIHRoZSBkaXN0YW5jZXMgb2YgaXRzIHN1YnRyZWUgbGFyZ2VyIHRoYW5cbiAgICogdGhlIG1hdGNoaW5nIHdvcmxkIGRpc3RhbmNlcy4gVGhlIGZhY3RvciBpcyB0aGUgcHJvZHVjdCBvZiB0aGUgcmVhY2hhYmxlIG5vZGVzJ1xuICAgKiBzbWFsbGVzdCBheGlzIHNjYWxlcyAoYSB2YWxpZCBsb3dlciBib3VuZCBmb3IgbmVzdGVkIGNoYWlucyksIGNsYW1wZWQgdG8gWzFlLTQsIDFdLlxuICAgKlxuICAgKiBAcGFyYW0gdGVybWluYWwgLSBUaGUgT3V0VW5pb24gLyBPdXREaXN0YW5jZSBub2RlXG4gICAqIEByZXR1cm5zIFRoZSBzY2FsZSwgb3IgbnVsbCB3aGVuIGEgdHJhbnNmb3JtIHNjYWxlIGNhbm5vdCBiZSBldmFsdWF0ZWRcbiAgICovXG4gIHByaXZhdGUgX190ZXJtaW5hbFRyYW5zZm9ybVNjYWxlKHRlcm1pbmFsOiBOb2RlSlNPTk5vZGUpOiBudW1iZXIgfCBudWxsIHtcbiAgICBpZiAodGhpcy5fX3Rlcm1pbmFsVHJhbnNmb3JtU2NhbGVDYWNoZS5oYXModGVybWluYWwuaWQpKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX3Rlcm1pbmFsVHJhbnNmb3JtU2NhbGVDYWNoZS5nZXQodGVybWluYWwuaWQpITtcbiAgICB9XG5cbiAgICBsZXQgc2NhbGUgPSAxO1xuICAgIGNvbnN0IHZpc2l0ZWQgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBjb25zdCBzdGFjazogc3RyaW5nW10gPSBbXTtcbiAgICBjb25zdCBwdXNoU3BhdGlhbElucHV0cyA9IChub2RlSWQ6IHN0cmluZykgPT4ge1xuICAgICAgY29uc3QgbGlua3MgPSB0aGlzLl9faW5wdXRMaW5rcy5nZXQobm9kZUlkKTtcbiAgICAgIGlmIChsaW5rcyA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGZvciAoY29uc3QgW3BvcnROYW1lLCBmcm9tSWRdIG9mIGxpbmtzKSB7XG4gICAgICAgIGlmIChSYXltYXJjaGluZ1NkZkV2YWx1YXRvci5fX1NQQVRJQUxfSU5QVVRfUE9SVFMuaGFzKHBvcnROYW1lKSkge1xuICAgICAgICAgIHN0YWNrLnB1c2goZnJvbUlkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICBwdXNoU3BhdGlhbElucHV0cyh0ZXJtaW5hbC5pZCk7XG4gICAgd2hpbGUgKHN0YWNrLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IG5vZGVJZCA9IHN0YWNrLnBvcCgpITtcbiAgICAgIGlmICh2aXNpdGVkLmhhcyhub2RlSWQpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgdmlzaXRlZC5hZGQobm9kZUlkKTtcbiAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLl9fbm9kZXMuZ2V0KG5vZGVJZCk7XG4gICAgICBpZiAobm9kZSA9PSBudWxsKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKG5vZGUubmFtZSA9PT0gJ1NkQXBwbHlUcmFuc2Zvcm0nKSB7XG4gICAgICAgIGNvbnN0IHRyYW5zZm9ybVNjYWxlID0gdGhpcy5fX3JlYWRWZWMzSW5wdXQobm9kZSwgJ3NjYWxlJywgT05FKTtcbiAgICAgICAgaWYgKHRyYW5zZm9ybVNjYWxlID09IG51bGwpIHtcbiAgICAgICAgICB0aGlzLl9fdGVybWluYWxUcmFuc2Zvcm1TY2FsZUNhY2hlLnNldCh0ZXJtaW5hbC5pZCwgbnVsbCk7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYXhpc1NjYWxlID0gTWF0aC5taW4oTWF0aC5hYnModHJhbnNmb3JtU2NhbGUueCksIE1hdGguYWJzKHRyYW5zZm9ybVNjYWxlLnkpLCBNYXRoLmFicyh0cmFuc2Zvcm1TY2FsZS56KSk7XG4gICAgICAgIHNjYWxlICo9IE1hdGgubWF4KE1hdGgubWluKDEsIGF4aXNTY2FsZSksIDAuMDAwMSk7XG4gICAgICB9XG4gICAgICBwdXNoU3BhdGlhbElucHV0cyhub2RlSWQpO1xuICAgIH1cblxuICAgIHRoaXMuX190ZXJtaW5hbFRyYW5zZm9ybVNjYWxlQ2FjaGUuc2V0KHRlcm1pbmFsLmlkLCBzY2FsZSk7XG4gICAgcmV0dXJuIHNjYWxlO1xuICB9XG5cbiAgLyoqXG4gICAqIE1hcmNoZXMgYSByYXkgYWdhaW5zdCB0aGUgU0RGIGdyYXBoLlxuICAgKiBAcGFyYW0gb3JpZ2luSW5Xb3JsZCAtIFJheSBvcmlnaW4gaW4gd29ybGQgc3BhY2VcbiAgICogQHBhcmFtIGRpcmVjdGlvbkluV29ybGQgLSBSYXkgZGlyZWN0aW9uIGluIHdvcmxkIHNwYWNlXG4gICAqIEBwYXJhbSBvcHRpb25zIC0gTWFyY2hpbmcgb3B0aW9uc1xuICAgKiBAcmV0dXJucyBUaGUgaGl0LCBudWxsIGZvciBhIG1pc3MsIG9yIHVuZGVmaW5lZCB3aGVuIHRoZSBncmFwaCBpcyB1bnN1cHBvcnRlZFxuICAgKi9cbiAgbWFyY2hSYXkoXG4gICAgb3JpZ2luSW5Xb3JsZDogVmVjdG9yMyxcbiAgICBkaXJlY3Rpb25JbldvcmxkOiBWZWN0b3IzLFxuICAgIG9wdGlvbnM6IFJheW1hcmNoaW5nUmF5Y2FzdE9wdGlvbnMgPSB7fVxuICApOiBSYXltYXJjaGluZ1JheWNhc3RIaXQgfCBudWxsIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBsZW5ndGggPSBkaXJlY3Rpb25JbldvcmxkLmxlbmd0aCgpO1xuICAgIGlmICghTnVtYmVyLmlzRmluaXRlKGxlbmd0aCkgfHwgbGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgZGlyZWN0aW9uID0gVmVjdG9yMy5tdWx0aXBseShkaXJlY3Rpb25JbldvcmxkLCAxIC8gbGVuZ3RoKTtcblxuICAgIGxldCB0U3RhcnQgPSAwO1xuICAgIGxldCB0RW5kID0gb3B0aW9ucy5tYXhEaXN0YW5jZSA/PyAxMDAwMDtcblxuICAgIGNvbnN0IGJvdW5kcyA9IHRoaXMuY2FsY0JvdW5kcygpO1xuICAgIGlmIChib3VuZHMgIT0gbnVsbCkge1xuICAgICAgY29uc3QgaW50ZXJ2YWwgPSBSYXltYXJjaGluZ1NkZkV2YWx1YXRvci5pbnRlcnNlY3RSYXlBYWJiKG9yaWdpbkluV29ybGQsIGRpcmVjdGlvbiwgYm91bmRzKTtcbiAgICAgIGlmIChpbnRlcnZhbCA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgdFN0YXJ0ID0gTWF0aC5tYXgodFN0YXJ0LCBpbnRlcnZhbFswXSk7XG4gICAgICB0RW5kID0gTWF0aC5taW4odEVuZCwgaW50ZXJ2YWxbMV0pO1xuICAgICAgaWYgKHRFbmQgPCB0U3RhcnQpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgZXBzaWxvbiA9IG9wdGlvbnMuZXBzaWxvbiA/PyAwLjAwMTtcbiAgICBjb25zdCBtYXhTdGVwcyA9IG9wdGlvbnMubWF4U3RlcHMgPz8gMjU2O1xuICAgIGxldCB0ID0gdFN0YXJ0O1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtYXhTdGVwczsgaSsrKSB7XG4gICAgICBjb25zdCBwb2ludCA9IFZlY3RvcjMuZnJvbUNvcHkzKFxuICAgICAgICBvcmlnaW5JbldvcmxkLnggKyBkaXJlY3Rpb24ueCAqIHQsXG4gICAgICAgIG9yaWdpbkluV29ybGQueSArIGRpcmVjdGlvbi55ICogdCxcbiAgICAgICAgb3JpZ2luSW5Xb3JsZC56ICsgZGlyZWN0aW9uLnogKiB0XG4gICAgICApO1xuICAgICAgY29uc3QgZGlzdGFuY2UgPSB0aGlzLmV2YWxEaXN0YW5jZUF0KHBvaW50KTtcbiAgICAgIGlmIChkaXN0YW5jZSA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgICBpZiAoZGlzdGFuY2UgPCBlcHNpbG9uKSB7XG4gICAgICAgIHJldHVybiB7IHQsIHBvc2l0aW9uOiBwb2ludCB9O1xuICAgICAgfVxuICAgICAgdCArPSBNYXRoLm1heChNYXRoLmFicyhkaXN0YW5jZSksIGVwc2lsb24gKiAwLjEpO1xuICAgICAgaWYgKHQgPiB0RW5kKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2lucHV0Tm9kZShub2RlSWQ6IHN0cmluZywgcG9ydE5hbWU6IHN0cmluZyk6IE5vZGVKU09OTm9kZSB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgZnJvbUlkID0gdGhpcy5fX2lucHV0TGlua3MuZ2V0KG5vZGVJZCk/LmdldChwb3J0TmFtZSk7XG4gICAgcmV0dXJuIGZyb21JZCA9PSBudWxsID8gdW5kZWZpbmVkIDogdGhpcy5fX25vZGVzLmdldChmcm9tSWQpO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2NvbnRyb2xWYWx1ZShub2RlOiBOb2RlSlNPTk5vZGUsIGtleTogc3RyaW5nKTogdW5rbm93biB7XG4gICAgcmV0dXJuIG5vZGUuY29udHJvbHM/LltrZXldPy52YWx1ZTtcbiAgfVxuXG4gIHByaXZhdGUgX190b051bWJlcih2YWx1ZTogdW5rbm93bik6IG51bWJlciB8IG51bGwge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInICYmIE51bWJlci5pc0Zpbml0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgaWYgKHZhbHVlICE9IG51bGwgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgY29uc3QgeCA9ICh2YWx1ZSBhcyB7IHg/OiB1bmtub3duIH0pLng7XG4gICAgICBpZiAodHlwZW9mIHggPT09ICdudW1iZXInICYmIE51bWJlci5pc0Zpbml0ZSh4KSkge1xuICAgICAgICByZXR1cm4geDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBwcml2YXRlIF9fdG9WZWN0b3IzKHZhbHVlOiB1bmtub3duKTogVmVjdG9yMyB8IG51bGwge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSAmJiB2YWx1ZS5sZW5ndGggPj0gMykge1xuICAgICAgY29uc3QgeCA9IHZhbHVlWzBdO1xuICAgICAgY29uc3QgeSA9IHZhbHVlWzFdO1xuICAgICAgY29uc3QgeiA9IHZhbHVlWzJdO1xuICAgICAgaWYgKFxuICAgICAgICB0eXBlb2YgeCA9PT0gJ251bWJlcicgJiZcbiAgICAgICAgTnVtYmVyLmlzRmluaXRlKHgpICYmXG4gICAgICAgIHR5cGVvZiB5ID09PSAnbnVtYmVyJyAmJlxuICAgICAgICBOdW1iZXIuaXNGaW5pdGUoeSkgJiZcbiAgICAgICAgdHlwZW9mIHogPT09ICdudW1iZXInICYmXG4gICAgICAgIE51bWJlci5pc0Zpbml0ZSh6KVxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiBWZWN0b3IzLmZyb21Db3B5Myh4LCB5LCB6KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAodmFsdWUgIT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICBjb25zdCB2ZWN0b3IgPSB2YWx1ZSBhcyB7IHg/OiB1bmtub3duOyB5PzogdW5rbm93bjsgej86IHVua25vd24gfTtcbiAgICAgIGlmIChcbiAgICAgICAgdHlwZW9mIHZlY3Rvci54ID09PSAnbnVtYmVyJyAmJlxuICAgICAgICBOdW1iZXIuaXNGaW5pdGUodmVjdG9yLngpICYmXG4gICAgICAgIHR5cGVvZiB2ZWN0b3IueSA9PT0gJ251bWJlcicgJiZcbiAgICAgICAgTnVtYmVyLmlzRmluaXRlKHZlY3Rvci55KSAmJlxuICAgICAgICB0eXBlb2YgdmVjdG9yLnogPT09ICdudW1iZXInICYmXG4gICAgICAgIE51bWJlci5pc0Zpbml0ZSh2ZWN0b3IueilcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gVmVjdG9yMy5mcm9tQ29weTModmVjdG9yLngsIHZlY3Rvci55LCB2ZWN0b3Iueik7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBfX3VuaWZvcm1WYWx1ZShuYW1lOiBzdHJpbmcpOiB1bmtub3duIHtcbiAgICBpZiAodGhpcy5fX3VuaWZvcm1WYWx1ZVByb3ZpZGVyID09IG51bGwpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICByZXR1cm4gdGhpcy5fX3VuaWZvcm1WYWx1ZVByb3ZpZGVyKG5hbWUpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9fcmVhZFNjYWxhck5vZGVWYWx1ZShub2RlOiBOb2RlSlNPTk5vZGUpOiBudW1iZXIgfCBudWxsIHtcbiAgICBzd2l0Y2ggKG5vZGUubmFtZSkge1xuICAgICAgY2FzZSAnQ29uc3RhbnRTY2FsYXJGbG9hdCc6XG4gICAgICBjYXNlICdDb25zdGFudFNjYWxhclVpbnQnOlxuICAgICAgICByZXR1cm4gdGhpcy5fX3RvTnVtYmVyKHRoaXMuX19jb250cm9sVmFsdWUobm9kZSwgJ2luMScpKTtcbiAgICAgIGNhc2UgJ0NvbnN0YW50U2NhbGFyQm9vbCc6IHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSB0aGlzLl9fY29udHJvbFZhbHVlKG5vZGUsICdpbjEnKTtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgcmV0dXJuIHZhbHVlID8gMSA6IDA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX190b051bWJlcih2YWx1ZSk7XG4gICAgICB9XG4gICAgICBjYXNlICdVbmlmb3JtU2NhbGFyRmxvYXQnOiB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBub2RlLmNvbnRyb2xzPy5uYW1lPy52YWx1ZTtcbiAgICAgICAgaWYgKHR5cGVvZiBuYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gdGhpcy5fX3RvTnVtYmVyKHRoaXMuX191bmlmb3JtVmFsdWUobmFtZSkpO1xuICAgICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl9fdG9OdW1iZXIodGhpcy5fX2NvbnRyb2xWYWx1ZShub2RlLCAnaW5pdGlhbFZhbHVlJykpO1xuICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfX3JlYWRWZWMzTm9kZVZhbHVlKG5vZGU6IE5vZGVKU09OTm9kZSk6IFZlY3RvcjMgfCBudWxsIHtcbiAgICBzd2l0Y2ggKG5vZGUubmFtZSkge1xuICAgICAgY2FzZSAnQ29uc3RhbnRWZWN0b3IzRmxvYXQnOiB7XG4gICAgICAgIGNvbnN0IHggPSB0aGlzLl9fdG9OdW1iZXIodGhpcy5fX2NvbnRyb2xWYWx1ZShub2RlLCAnaW4xJykpO1xuICAgICAgICBjb25zdCB5ID0gdGhpcy5fX3RvTnVtYmVyKHRoaXMuX19jb250cm9sVmFsdWUobm9kZSwgJ2luMicpKTtcbiAgICAgICAgY29uc3QgeiA9IHRoaXMuX190b051bWJlcih0aGlzLl9fY29udHJvbFZhbHVlKG5vZGUsICdpbjMnKSk7XG4gICAgICAgIGlmICh4ID09IG51bGwgfHwgeSA9PSBudWxsIHx8IHogPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBWZWN0b3IzLmZyb21Db3B5Myh4LCB5LCB6KTtcbiAgICAgIH1cbiAgICAgIGNhc2UgJ1VuaWZvcm1WZWN0b3IzRmxvYXQnOiB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBub2RlLmNvbnRyb2xzPy5uYW1lPy52YWx1ZTtcbiAgICAgICAgaWYgKHR5cGVvZiBuYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gdGhpcy5fX3RvVmVjdG9yMyh0aGlzLl9fdW5pZm9ybVZhbHVlKG5hbWUpKTtcbiAgICAgICAgICBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCB4ID0gdGhpcy5fX3RvTnVtYmVyKHRoaXMuX19jb250cm9sVmFsdWUobm9kZSwgJ2luaXRpYWxYJykpO1xuICAgICAgICBjb25zdCB5ID0gdGhpcy5fX3RvTnVtYmVyKHRoaXMuX19jb250cm9sVmFsdWUobm9kZSwgJ2luaXRpYWxZJykpO1xuICAgICAgICBjb25zdCB6ID0gdGhpcy5fX3RvTnVtYmVyKHRoaXMuX19jb250cm9sVmFsdWUobm9kZSwgJ2luaXRpYWxaJykpO1xuICAgICAgICBpZiAoeCA9PSBudWxsIHx8IHkgPT0gbnVsbCB8fCB6ID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gVmVjdG9yMy5mcm9tQ29weTMoeCwgeSwgeik7XG4gICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9fcmVhZFNjYWxhcklucHV0KG5vZGU6IE5vZGVKU09OTm9kZSwgcG9ydE5hbWU6IHN0cmluZywgZmFsbGJhY2s6IG51bWJlcik6IG51bWJlciB8IG51bGwge1xuICAgIGNvbnN0IGNhY2hlS2V5ID0gYCR7bm9kZS5pZH06JHtwb3J0TmFtZX1gO1xuICAgIGlmICh0aGlzLl9fc2NhbGFyQ2FjaGUuaGFzKGNhY2hlS2V5KSkge1xuICAgICAgcmV0dXJuIHRoaXMuX19zY2FsYXJDYWNoZS5nZXQoY2FjaGVLZXkpITtcbiAgICB9XG5cbiAgICBjb25zdCBzb3VyY2UgPSB0aGlzLl9faW5wdXROb2RlKG5vZGUuaWQsIHBvcnROYW1lKTtcbiAgICBjb25zdCB2YWx1ZSA9IHNvdXJjZSA9PSBudWxsID8gZmFsbGJhY2sgOiB0aGlzLl9fcmVhZFNjYWxhck5vZGVWYWx1ZShzb3VyY2UpO1xuXG4gICAgdGhpcy5fX3NjYWxhckNhY2hlLnNldChjYWNoZUtleSwgdmFsdWUpO1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIHByaXZhdGUgX19yZWFkVmVjM0lucHV0KG5vZGU6IE5vZGVKU09OTm9kZSwgcG9ydE5hbWU6IHN0cmluZywgZmFsbGJhY2s6IFZlY3RvcjMpOiBWZWN0b3IzIHwgbnVsbCB7XG4gICAgY29uc3QgY2FjaGVLZXkgPSBgJHtub2RlLmlkfToke3BvcnROYW1lfWA7XG4gICAgaWYgKHRoaXMuX192ZWMzQ2FjaGUuaGFzKGNhY2hlS2V5KSkge1xuICAgICAgcmV0dXJuIHRoaXMuX192ZWMzQ2FjaGUuZ2V0KGNhY2hlS2V5KSE7XG4gICAgfVxuXG4gICAgY29uc3Qgc291cmNlID0gdGhpcy5fX2lucHV0Tm9kZShub2RlLmlkLCBwb3J0TmFtZSk7XG4gICAgY29uc3QgdmFsdWUgPSBzb3VyY2UgPT0gbnVsbCA/IGZhbGxiYWNrIDogdGhpcy5fX3JlYWRWZWMzTm9kZVZhbHVlKHNvdXJjZSk7XG5cbiAgICB0aGlzLl9fdmVjM0NhY2hlLnNldChjYWNoZUtleSwgdmFsdWUpO1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIHByaXZhdGUgX19nZXRUcmFuc2Zvcm0obm9kZTogTm9kZUpTT05Ob2RlKTogTWF0cml4NDQgfCBudWxsIHtcbiAgICBpZiAodGhpcy5fX3RyYW5zZm9ybUNhY2hlLmhhcyhub2RlLmlkKSkge1xuICAgICAgcmV0dXJuIHRoaXMuX190cmFuc2Zvcm1DYWNoZS5nZXQobm9kZS5pZCkhO1xuICAgIH1cblxuICAgIGNvbnN0IHRyYW5zbGF0aW9uID0gdGhpcy5fX3JlYWRWZWMzSW5wdXQobm9kZSwgJ3RyYW5zbGF0aW9uJywgWkVSTyk7XG4gICAgY29uc3QgZXVsZXIgPSB0aGlzLl9fcmVhZFZlYzNJbnB1dChub2RlLCAneHl6RXVsZXJBbmdsZXMnLCBaRVJPKTtcbiAgICBjb25zdCBzY2FsZSA9IHRoaXMuX19yZWFkVmVjM0lucHV0KG5vZGUsICdzY2FsZScsIE9ORSk7XG5cbiAgICBsZXQgdHJhbnNmb3JtOiBNYXRyaXg0NCB8IG51bGwgPSBudWxsO1xuICAgIGlmICh0cmFuc2xhdGlvbiAhPSBudWxsICYmIGV1bGVyICE9IG51bGwgJiYgc2NhbGUgIT0gbnVsbCkge1xuICAgICAgLy8gTWF0Y2ggY3JlYXRlVHJhbnNmb3JtTWF0cml4IGluIFJheW1hcmNoaW5nU2hhZGVyUGFydDpcbiAgICAgIC8vIHJvdGF0ZVgoZXVsZXIueCkgKiByb3RhdGVZKGV1bGVyLnkpICogcm90YXRlWihldWxlci56KS5cbiAgICAgIC8vXG4gICAgICAvLyBUaGUgc2hhZGVyIGJ1aWxkcyBlYWNoIHJvdGF0aW9uIHdpdGggYSBjb2x1bW4tbWFqb3IgbWF0MyBjb25zdHJ1Y3RvclxuICAgICAgLy8gd2hvc2UgYXJndW1lbnRzIGFyZSB0aGUgc3RhbmRhcmQgcm90YXRpb24gbWF0cml4IHdyaXR0ZW4gaW4gcm93LW1ham9yXG4gICAgICAvLyBvcmRlci4gVGhlIHJlc3VsdGluZyBHTFNML1dHU0wgbWF0cml4IGlzIHRoZXJlZm9yZSB0aGUgdHJhbnNwb3NlIG9mXG4gICAgICAvLyBNYXRyaXg0NC5yb3RhdGVYL1kvWiwgd2hpY2ggZXF1YWxzIHRoZSByb3RhdGlvbiBieSB0aGUgbmVnYXRlZCBhbmdsZS5cbiAgICAgIGNvbnN0IHJvdGF0aW9uID0gTWF0cml4NDQubXVsdGlwbHkoXG4gICAgICAgIE1hdHJpeDQ0LnJvdGF0ZVgoLWV1bGVyLngpLFxuICAgICAgICBNYXRyaXg0NC5tdWx0aXBseShNYXRyaXg0NC5yb3RhdGVZKC1ldWxlci55KSwgTWF0cml4NDQucm90YXRlWigtZXVsZXIueikpXG4gICAgICApO1xuICAgICAgdHJhbnNmb3JtID0gTWF0cml4NDQubXVsdGlwbHkoXG4gICAgICAgIE1hdHJpeDQ0LnRyYW5zbGF0ZSh0cmFuc2xhdGlvbiksXG4gICAgICAgIE1hdHJpeDQ0Lm11bHRpcGx5KHJvdGF0aW9uLCBNYXRyaXg0NC5zY2FsZShzY2FsZSkpXG4gICAgICApO1xuICAgIH1cblxuICAgIHRoaXMuX190cmFuc2Zvcm1DYWNoZS5zZXQobm9kZS5pZCwgdHJhbnNmb3JtKTtcbiAgICByZXR1cm4gdHJhbnNmb3JtO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2dldEludmVyc2VUcmFuc2Zvcm0obm9kZTogTm9kZUpTT05Ob2RlKTogTWF0cml4NDQgfCBudWxsIHtcbiAgICBpZiAodGhpcy5fX2ludmVyc2VUcmFuc2Zvcm1DYWNoZS5oYXMobm9kZS5pZCkpIHtcbiAgICAgIHJldHVybiB0aGlzLl9faW52ZXJzZVRyYW5zZm9ybUNhY2hlLmdldChub2RlLmlkKSE7XG4gICAgfVxuXG4gICAgY29uc3QgdHJhbnNmb3JtID0gdGhpcy5fX2dldFRyYW5zZm9ybShub2RlKTtcbiAgICBjb25zdCBpbnZlcnNlID0gdHJhbnNmb3JtID09IG51bGwgPyBudWxsIDogTWF0cml4NDQuaW52ZXJ0KHRyYW5zZm9ybSk7XG4gICAgdGhpcy5fX2ludmVyc2VUcmFuc2Zvcm1DYWNoZS5zZXQobm9kZS5pZCwgaW52ZXJzZSk7XG4gICAgcmV0dXJuIGludmVyc2U7XG4gIH1cblxuICBwcml2YXRlIF9fZXZhbFBvc2l0aW9uRm9yRGlzdGFuY2Uobm9kZTogTm9kZUpTT05Ob2RlLCBwb2ludEluV29ybGQ6IFZlY3RvcjMpOiBWZWN0b3IzIHwgbnVsbCB7XG4gICAgY29uc3QgcG9zaXRpb25Ob2RlID0gdGhpcy5fX2lucHV0Tm9kZShub2RlLmlkLCAncG9zaXRpb24nKTtcbiAgICBpZiAocG9zaXRpb25Ob2RlID09IG51bGwpIHtcbiAgICAgIC8vIEFuIHVuY29ubmVjdGVkIHBvc2l0aW9uIHNvY2tldCB1c2VzIGl0cyBkZWZhdWx0IHZhbHVlICgwLCAwLCAwKS5cbiAgICAgIHJldHVybiBaRVJPO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fX2V2YWxQb3NpdGlvbk91dHB1dChwb3NpdGlvbk5vZGUsIHBvaW50SW5Xb3JsZCk7XG4gIH1cblxuICBwcml2YXRlIF9fZXZhbFBvc2l0aW9uT3V0cHV0KG5vZGU6IE5vZGVKU09OTm9kZSwgcG9pbnRJbldvcmxkOiBWZWN0b3IzKTogVmVjdG9yMyB8IG51bGwge1xuICAgIHN3aXRjaCAobm9kZS5uYW1lKSB7XG4gICAgICBjYXNlICdJbml0aWFsUG9zaXRpb24nOlxuICAgICAgICByZXR1cm4gcG9pbnRJbldvcmxkO1xuICAgICAgY2FzZSAnU2RBcHBseVRyYW5zZm9ybSc6IHtcbiAgICAgICAgY29uc3QgcGFyZW50ID0gdGhpcy5fX2lucHV0Tm9kZShub2RlLmlkLCAncG9zaXRpb24nKTtcbiAgICAgICAgY29uc3QgaW5wdXQgPSBwYXJlbnQgPT0gbnVsbCA/IFpFUk8gOiB0aGlzLl9fZXZhbFBvc2l0aW9uT3V0cHV0KHBhcmVudCwgcG9pbnRJbldvcmxkKTtcbiAgICAgICAgaWYgKGlucHV0ID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpbnZlcnNlID0gdGhpcy5fX2dldEludmVyc2VUcmFuc2Zvcm0obm9kZSk7XG4gICAgICAgIHJldHVybiBpbnZlcnNlID09IG51bGwgPyBudWxsIDogaW52ZXJzZS5tdWx0aXBseVZlY3RvcjMoaW5wdXQpO1xuICAgICAgfVxuICAgICAgY2FzZSAnU2RBcHBseVdvcmxkTWF0cml4Jzoge1xuICAgICAgICBjb25zdCBwYXJlbnQgPSB0aGlzLl9faW5wdXROb2RlKG5vZGUuaWQsICdwb3NpdGlvbicpO1xuICAgICAgICBjb25zdCBpbnB1dCA9IHBhcmVudCA9PSBudWxsID8gWkVSTyA6IHRoaXMuX19ldmFsUG9zaXRpb25PdXRwdXQocGFyZW50LCBwb2ludEluV29ybGQpO1xuICAgICAgICBpZiAoaW5wdXQgPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl9faW52ZXJzZVdvcmxkTWF0cml4Lm11bHRpcGx5VmVjdG9yMyhpbnB1dCk7XG4gICAgICB9XG4gICAgICBjYXNlICdTZFJlcGVhdCc6XG4gICAgICBjYXNlICdTZFJlcGVhdFgnOlxuICAgICAgY2FzZSAnU2RSZXBlYXRZJzpcbiAgICAgIGNhc2UgJ1NkUmVwZWF0Wic6XG4gICAgICBjYXNlICdTZFJlcGVhdFhZJzpcbiAgICAgIGNhc2UgJ1NkUmVwZWF0WVonOlxuICAgICAgY2FzZSAnU2RSZXBlYXRaWCc6IHtcbiAgICAgICAgY29uc3QgcGFyZW50ID0gdGhpcy5fX2lucHV0Tm9kZShub2RlLmlkLCAncG9zaXRpb24nKTtcbiAgICAgICAgY29uc3QgaW5wdXQgPSBwYXJlbnQgPT0gbnVsbCA/IFpFUk8gOiB0aGlzLl9fZXZhbFBvc2l0aW9uT3V0cHV0KHBhcmVudCwgcG9pbnRJbldvcmxkKTtcbiAgICAgICAgaWYgKGlucHV0ID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpbnRlcnZhbCA9IHRoaXMuX19yZWFkU2NhbGFySW5wdXQobm9kZSwgJ2ludGVydmFsJywgMSk7XG4gICAgICAgIGlmIChpbnRlcnZhbCA9PSBudWxsIHx8IGludGVydmFsID09PSAwKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYXhlcyA9IFJFUEVBVF9BWEVTW25vZGUubmFtZV07XG4gICAgICAgIGNvbnN0IHdyYXAgPSAodmFsdWU6IG51bWJlciwgZW5hYmxlZDogYm9vbGVhbikgPT4ge1xuICAgICAgICAgIGlmICghZW5hYmxlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBzY2FsZWQgPSB2YWx1ZSAvIGludGVydmFsO1xuICAgICAgICAgIHJldHVybiAoc2NhbGVkIC0gTWF0aC5mbG9vcihzY2FsZWQpIC0gMC41KSAqIGludGVydmFsO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gVmVjdG9yMy5mcm9tQ29weTMod3JhcChpbnB1dC54LCBheGVzLngpLCB3cmFwKGlucHV0LnksIGF4ZXMueSksIHdyYXAoaW5wdXQueiwgYXhlcy56KSk7XG4gICAgICB9XG4gICAgICBjYXNlICdUd2lzdFgnOiB7XG4gICAgICAgIGNvbnN0IHBhcmVudCA9IHRoaXMuX19pbnB1dE5vZGUobm9kZS5pZCwgJ3Bvc2l0aW9uJyk7XG4gICAgICAgIGNvbnN0IGlucHV0ID0gcGFyZW50ID09IG51bGwgPyBaRVJPIDogdGhpcy5fX2V2YWxQb3NpdGlvbk91dHB1dChwYXJlbnQsIHBvaW50SW5Xb3JsZCk7XG4gICAgICAgIGlmIChpbnB1dCA9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc3RyZW5ndGggPSB0aGlzLl9fcmVhZFNjYWxhcklucHV0KG5vZGUsICdzdHJlbmd0aCcsIDAuNSk7XG4gICAgICAgIGlmIChzdHJlbmd0aCA9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYW5nbGUgPSBzdHJlbmd0aCAqIGlucHV0Lng7XG4gICAgICAgIGNvbnN0IGMgPSBNYXRoLmNvcyhhbmdsZSk7XG4gICAgICAgIGNvbnN0IHMgPSBNYXRoLnNpbihhbmdsZSk7XG4gICAgICAgIHJldHVybiBWZWN0b3IzLmZyb21Db3B5MyhpbnB1dC54LCBjICogaW5wdXQueSAtIHMgKiBpbnB1dC56LCBzICogaW5wdXQueSArIGMgKiBpbnB1dC56KTtcbiAgICAgIH1cbiAgICAgIGNhc2UgJ1R3aXN0WSc6IHtcbiAgICAgICAgY29uc3QgcGFyZW50ID0gdGhpcy5fX2lucHV0Tm9kZShub2RlLmlkLCAncG9zaXRpb24nKTtcbiAgICAgICAgY29uc3QgaW5wdXQgPSBwYXJlbnQgPT0gbnVsbCA/IFpFUk8gOiB0aGlzLl9fZXZhbFBvc2l0aW9uT3V0cHV0KHBhcmVudCwgcG9pbnRJbldvcmxkKTtcbiAgICAgICAgaWYgKGlucHV0ID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzdHJlbmd0aCA9IHRoaXMuX19yZWFkU2NhbGFySW5wdXQobm9kZSwgJ3N0cmVuZ3RoJywgMC41KTtcbiAgICAgICAgaWYgKHN0cmVuZ3RoID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhbmdsZSA9IHN0cmVuZ3RoICogaW5wdXQueTtcbiAgICAgICAgY29uc3QgYyA9IE1hdGguY29zKGFuZ2xlKTtcbiAgICAgICAgY29uc3QgcyA9IE1hdGguc2luKGFuZ2xlKTtcbiAgICAgICAgcmV0dXJuIFZlY3RvcjMuZnJvbUNvcHkzKGMgKiBpbnB1dC54IC0gcyAqIGlucHV0LnosIGlucHV0LnksIHMgKiBpbnB1dC54ICsgYyAqIGlucHV0LnopO1xuICAgICAgfVxuICAgICAgY2FzZSAnVHdpc3RaJzoge1xuICAgICAgICBjb25zdCBwYXJlbnQgPSB0aGlzLl9faW5wdXROb2RlKG5vZGUuaWQsICdwb3NpdGlvbicpO1xuICAgICAgICBjb25zdCBpbnB1dCA9IHBhcmVudCA9PSBudWxsID8gWkVSTyA6IHRoaXMuX19ldmFsUG9zaXRpb25PdXRwdXQocGFyZW50LCBwb2ludEluV29ybGQpO1xuICAgICAgICBpZiAoaW5wdXQgPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHN0cmVuZ3RoID0gdGhpcy5fX3JlYWRTY2FsYXJJbnB1dChub2RlLCAnc3RyZW5ndGgnLCAwLjUpO1xuICAgICAgICBpZiAoc3RyZW5ndGggPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGFuZ2xlID0gc3RyZW5ndGggKiBpbnB1dC56O1xuICAgICAgICBjb25zdCBjID0gTWF0aC5jb3MoYW5nbGUpO1xuICAgICAgICBjb25zdCBzID0gTWF0aC5zaW4oYW5nbGUpO1xuICAgICAgICByZXR1cm4gVmVjdG9yMy5mcm9tQ29weTMoYyAqIGlucHV0LnggLSBzICogaW5wdXQueSwgcyAqIGlucHV0LnggKyBjICogaW5wdXQueSwgaW5wdXQueik7XG4gICAgICB9XG4gICAgICBjYXNlICdCZW5kWFknOiB7XG4gICAgICAgIGNvbnN0IHBhcmVudCA9IHRoaXMuX19pbnB1dE5vZGUobm9kZS5pZCwgJ3Bvc2l0aW9uJyk7XG4gICAgICAgIGNvbnN0IGlucHV0ID0gcGFyZW50ID09IG51bGwgPyBaRVJPIDogdGhpcy5fX2V2YWxQb3NpdGlvbk91dHB1dChwYXJlbnQsIHBvaW50SW5Xb3JsZCk7XG4gICAgICAgIGlmIChpbnB1dCA9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc3RyZW5ndGggPSB0aGlzLl9fcmVhZFNjYWxhcklucHV0KG5vZGUsICdzdHJlbmd0aCcsIDAuNSk7XG4gICAgICAgIGlmIChzdHJlbmd0aCA9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYW5nbGUgPSBzdHJlbmd0aCAqIGlucHV0Lng7XG4gICAgICAgIGNvbnN0IGMgPSBNYXRoLmNvcyhhbmdsZSk7XG4gICAgICAgIGNvbnN0IHMgPSBNYXRoLnNpbihhbmdsZSk7XG4gICAgICAgIHJldHVybiBWZWN0b3IzLmZyb21Db3B5MyhjICogaW5wdXQueCAtIHMgKiBpbnB1dC55LCBzICogaW5wdXQueCArIGMgKiBpbnB1dC55LCBpbnB1dC56KTtcbiAgICAgIH1cbiAgICAgIGNhc2UgJ0JlbmRYWic6IHtcbiAgICAgICAgY29uc3QgcGFyZW50ID0gdGhpcy5fX2lucHV0Tm9kZShub2RlLmlkLCAncG9zaXRpb24nKTtcbiAgICAgICAgY29uc3QgaW5wdXQgPSBwYXJlbnQgPT0gbnVsbCA/IFpFUk8gOiB0aGlzLl9fZXZhbFBvc2l0aW9uT3V0cHV0KHBhcmVudCwgcG9pbnRJbldvcmxkKTtcbiAgICAgICAgaWYgKGlucHV0ID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzdHJlbmd0aCA9IHRoaXMuX19yZWFkU2NhbGFySW5wdXQobm9kZSwgJ3N0cmVuZ3RoJywgMC41KTtcbiAgICAgICAgaWYgKHN0cmVuZ3RoID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhbmdsZSA9IHN0cmVuZ3RoICogaW5wdXQueDtcbiAgICAgICAgY29uc3QgYyA9IE1hdGguY29zKGFuZ2xlKTtcbiAgICAgICAgY29uc3QgcyA9IE1hdGguc2luKGFuZ2xlKTtcbiAgICAgICAgcmV0dXJuIFZlY3RvcjMuZnJvbUNvcHkzKGMgKiBpbnB1dC54IC0gcyAqIGlucHV0LnosIGlucHV0LnksIHMgKiBpbnB1dC54ICsgYyAqIGlucHV0LnopO1xuICAgICAgfVxuICAgICAgY2FzZSAnQmVuZFlaJzoge1xuICAgICAgICBjb25zdCBwYXJlbnQgPSB0aGlzLl9faW5wdXROb2RlKG5vZGUuaWQsICdwb3NpdGlvbicpO1xuICAgICAgICBjb25zdCBpbnB1dCA9IHBhcmVudCA9PSBudWxsID8gWkVSTyA6IHRoaXMuX19ldmFsUG9zaXRpb25PdXRwdXQocGFyZW50LCBwb2ludEluV29ybGQpO1xuICAgICAgICBpZiAoaW5wdXQgPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHN0cmVuZ3RoID0gdGhpcy5fX3JlYWRTY2FsYXJJbnB1dChub2RlLCAnc3RyZW5ndGgnLCAwLjUpO1xuICAgICAgICBpZiAoc3RyZW5ndGggPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGFuZ2xlID0gc3RyZW5ndGggKiBpbnB1dC55O1xuICAgICAgICBjb25zdCBjID0gTWF0aC5jb3MoYW5nbGUpO1xuICAgICAgICBjb25zdCBzID0gTWF0aC5zaW4oYW5nbGUpO1xuICAgICAgICByZXR1cm4gVmVjdG9yMy5mcm9tQ29weTMoaW5wdXQueCwgYyAqIGlucHV0LnkgLSBzICogaW5wdXQueiwgcyAqIGlucHV0LnkgKyBjICogaW5wdXQueik7XG4gICAgICB9XG4gICAgICBjYXNlICdCZW5kWVgnOiB7XG4gICAgICAgIGNvbnN0IHBhcmVudCA9IHRoaXMuX19pbnB1dE5vZGUobm9kZS5pZCwgJ3Bvc2l0aW9uJyk7XG4gICAgICAgIGNvbnN0IGlucHV0ID0gcGFyZW50ID09IG51bGwgPyBaRVJPIDogdGhpcy5fX2V2YWxQb3NpdGlvbk91dHB1dChwYXJlbnQsIHBvaW50SW5Xb3JsZCk7XG4gICAgICAgIGlmIChpbnB1dCA9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc3RyZW5ndGggPSB0aGlzLl9fcmVhZFNjYWxhcklucHV0KG5vZGUsICdzdHJlbmd0aCcsIDAuNSk7XG4gICAgICAgIGlmIChzdHJlbmd0aCA9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYW5nbGUgPSBzdHJlbmd0aCAqIGlucHV0Lnk7XG4gICAgICAgIGNvbnN0IGMgPSBNYXRoLmNvcyhhbmdsZSk7XG4gICAgICAgIGNvbnN0IHMgPSBNYXRoLnNpbihhbmdsZSk7XG4gICAgICAgIHJldHVybiBWZWN0b3IzLmZyb21Db3B5MyhzICogaW5wdXQueSArIGMgKiBpbnB1dC54LCBjICogaW5wdXQueSAtIHMgKiBpbnB1dC54LCBpbnB1dC56KTtcbiAgICAgIH1cbiAgICAgIGNhc2UgJ0JlbmRaWCc6IHtcbiAgICAgICAgY29uc3QgcGFyZW50ID0gdGhpcy5fX2lucHV0Tm9kZShub2RlLmlkLCAncG9zaXRpb24nKTtcbiAgICAgICAgY29uc3QgaW5wdXQgPSBwYXJlbnQgPT0gbnVsbCA/IFpFUk8gOiB0aGlzLl9fZXZhbFBvc2l0aW9uT3V0cHV0KHBhcmVudCwgcG9pbnRJbldvcmxkKTtcbiAgICAgICAgaWYgKGlucHV0ID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzdHJlbmd0aCA9IHRoaXMuX19yZWFkU2NhbGFySW5wdXQobm9kZSwgJ3N0cmVuZ3RoJywgMC41KTtcbiAgICAgICAgaWYgKHN0cmVuZ3RoID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhbmdsZSA9IHN0cmVuZ3RoICogaW5wdXQuejtcbiAgICAgICAgY29uc3QgYyA9IE1hdGguY29zKGFuZ2xlKTtcbiAgICAgICAgY29uc3QgcyA9IE1hdGguc2luKGFuZ2xlKTtcbiAgICAgICAgcmV0dXJuIFZlY3RvcjMuZnJvbUNvcHkzKHMgKiBpbnB1dC56ICsgYyAqIGlucHV0LngsIGlucHV0LnksIGMgKiBpbnB1dC56IC0gcyAqIGlucHV0LngpO1xuICAgICAgfVxuICAgICAgY2FzZSAnQmVuZFpZJzoge1xuICAgICAgICBjb25zdCBwYXJlbnQgPSB0aGlzLl9faW5wdXROb2RlKG5vZGUuaWQsICdwb3NpdGlvbicpO1xuICAgICAgICBjb25zdCBpbnB1dCA9IHBhcmVudCA9PSBudWxsID8gWkVSTyA6IHRoaXMuX19ldmFsUG9zaXRpb25PdXRwdXQocGFyZW50LCBwb2ludEluV29ybGQpO1xuICAgICAgICBpZiAoaW5wdXQgPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHN0cmVuZ3RoID0gdGhpcy5fX3JlYWRTY2FsYXJJbnB1dChub2RlLCAnc3RyZW5ndGgnLCAwLjUpO1xuICAgICAgICBpZiAoc3RyZW5ndGggPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGFuZ2xlID0gc3RyZW5ndGggKiBpbnB1dC56O1xuICAgICAgICBjb25zdCBjID0gTWF0aC5jb3MoYW5nbGUpO1xuICAgICAgICBjb25zdCBzID0gTWF0aC5zaW4oYW5nbGUpO1xuICAgICAgICByZXR1cm4gVmVjdG9yMy5mcm9tQ29weTMoaW5wdXQueCwgcyAqIGlucHV0LnogKyBjICogaW5wdXQueSwgYyAqIGlucHV0LnogLSBzICogaW5wdXQueSk7XG4gICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9fZXZhbERpc3RhbmNlTm9kZShub2RlOiBOb2RlSlNPTk5vZGUsIHBvaW50SW5Xb3JsZDogVmVjdG9yMyk6IG51bWJlciB8IG51bGwge1xuICAgIHN3aXRjaCAobm9kZS5uYW1lKSB7XG4gICAgICBjYXNlICdTZFNwaGVyZSc6IHtcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSB0aGlzLl9fZXZhbFBvc2l0aW9uRm9yRGlzdGFuY2Uobm9kZSwgcG9pbnRJbldvcmxkKTtcbiAgICAgICAgY29uc3QgcmFkaXVzID0gdGhpcy5fX3JlYWRTY2FsYXJJbnB1dChub2RlLCAncmFkaXVzJywgMSk7XG4gICAgICAgIGlmIChwb3NpdGlvbiA9PSBudWxsIHx8IHJhZGl1cyA9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBvc2l0aW9uLmxlbmd0aCgpIC0gcmFkaXVzO1xuICAgICAgfVxuICAgICAgY2FzZSAnU2RCb3gnOiB7XG4gICAgICAgIGNvbnN0IHBvc2l0aW9uID0gdGhpcy5fX2V2YWxQb3NpdGlvbkZvckRpc3RhbmNlKG5vZGUsIHBvaW50SW5Xb3JsZCk7XG4gICAgICAgIGNvbnN0IHNpemUgPSB0aGlzLl9fcmVhZFZlYzNJbnB1dChub2RlLCAnc2l6ZScsIE9ORSk7XG4gICAgICAgIGlmIChwb3NpdGlvbiA9PSBudWxsIHx8IHNpemUgPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHF4ID0gTWF0aC5hYnMocG9zaXRpb24ueCkgLSBzaXplLng7XG4gICAgICAgIGNvbnN0IHF5ID0gTWF0aC5hYnMocG9zaXRpb24ueSkgLSBzaXplLnk7XG4gICAgICAgIGNvbnN0IHF6ID0gTWF0aC5hYnMocG9zaXRpb24ueikgLSBzaXplLno7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgTWF0aC5oeXBvdChNYXRoLm1heChxeCwgMCksIE1hdGgubWF4KHF5LCAwKSwgTWF0aC5tYXgocXosIDApKSArIE1hdGgubWluKE1hdGgubWF4KHF4LCBNYXRoLm1heChxeSwgcXopKSwgMClcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGNhc2UgJ1NkVG9ydXMnOiB7XG4gICAgICAgIGNvbnN0IHBvc2l0aW9uID0gdGhpcy5fX2V2YWxQb3NpdGlvbkZvckRpc3RhbmNlKG5vZGUsIHBvaW50SW5Xb3JsZCk7XG4gICAgICAgIGNvbnN0IHJhZGl1cyA9IHRoaXMuX19yZWFkU2NhbGFySW5wdXQobm9kZSwgJ3JhZGl1cycsIDEpO1xuICAgICAgICBjb25zdCB0dWJlUmFkaXVzID0gdGhpcy5fX3JlYWRTY2FsYXJJbnB1dChub2RlLCAndHViZVJhZGl1cycsIDAuMjUpO1xuICAgICAgICBpZiAocG9zaXRpb24gPT0gbnVsbCB8fCByYWRpdXMgPT0gbnVsbCB8fCB0dWJlUmFkaXVzID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gTWF0aC5oeXBvdChNYXRoLmh5cG90KHBvc2l0aW9uLngsIHBvc2l0aW9uLnopIC0gcmFkaXVzLCBwb3NpdGlvbi55KSAtIHR1YmVSYWRpdXM7XG4gICAgICB9XG4gICAgICBjYXNlICdTZENhcHN1bGUnOiB7XG4gICAgICAgIGNvbnN0IHBvc2l0aW9uID0gdGhpcy5fX2V2YWxQb3NpdGlvbkZvckRpc3RhbmNlKG5vZGUsIHBvaW50SW5Xb3JsZCk7XG4gICAgICAgIGNvbnN0IHBvaW50QSA9IHRoaXMuX19yZWFkVmVjM0lucHV0KG5vZGUsICdwb2ludEEnLCBERUZBVUxUX0NBUFNVTEVfUE9JTlRfQSk7XG4gICAgICAgIGNvbnN0IHBvaW50QiA9IHRoaXMuX19yZWFkVmVjM0lucHV0KG5vZGUsICdwb2ludEInLCBERUZBVUxUX0NBUFNVTEVfUE9JTlRfQik7XG4gICAgICAgIGNvbnN0IHJhZGl1cyA9IHRoaXMuX19yZWFkU2NhbGFySW5wdXQobm9kZSwgJ3JhZGl1cycsIDAuNSk7XG4gICAgICAgIGlmIChwb3NpdGlvbiA9PSBudWxsIHx8IHBvaW50QSA9PSBudWxsIHx8IHBvaW50QiA9PSBudWxsIHx8IHJhZGl1cyA9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcGFYID0gcG9zaXRpb24ueCAtIHBvaW50QS54O1xuICAgICAgICBjb25zdCBwYVkgPSBwb3NpdGlvbi55IC0gcG9pbnRBLnk7XG4gICAgICAgIGNvbnN0IHBhWiA9IHBvc2l0aW9uLnogLSBwb2ludEEuejtcbiAgICAgICAgY29uc3QgYmFYID0gcG9pbnRCLnggLSBwb2ludEEueDtcbiAgICAgICAgY29uc3QgYmFZID0gcG9pbnRCLnkgLSBwb2ludEEueTtcbiAgICAgICAgY29uc3QgYmFaID0gcG9pbnRCLnogLSBwb2ludEEuejtcbiAgICAgICAgY29uc3QgZGVub21pbmF0b3IgPSBiYVggKiBiYVggKyBiYVkgKiBiYVkgKyBiYVogKiBiYVo7XG4gICAgICAgIGxldCBoID0gMDtcbiAgICAgICAgaWYgKGRlbm9taW5hdG9yID4gMCkge1xuICAgICAgICAgIGggPSBNYXRoLm1pbihNYXRoLm1heCgocGFYICogYmFYICsgcGFZICogYmFZICsgcGFaICogYmFaKSAvIGRlbm9taW5hdG9yLCAwKSwgMSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIE1hdGguaHlwb3QocGFYIC0gYmFYICogaCwgcGFZIC0gYmFZICogaCwgcGFaIC0gYmFaICogaCkgLSByYWRpdXM7XG4gICAgICB9XG4gICAgICBjYXNlICdTZFJvdW5kQm94Jzoge1xuICAgICAgICBjb25zdCBwb3NpdGlvbiA9IHRoaXMuX19ldmFsUG9zaXRpb25Gb3JEaXN0YW5jZShub2RlLCBwb2ludEluV29ybGQpO1xuICAgICAgICBjb25zdCBzaXplID0gdGhpcy5fX3JlYWRWZWMzSW5wdXQobm9kZSwgJ3NpemUnLCBPTkUpO1xuICAgICAgICBjb25zdCByYWRpdXMgPSB0aGlzLl9fcmVhZFNjYWxhcklucHV0KG5vZGUsICdyYWRpdXMnLCAwLjI1KTtcbiAgICAgICAgaWYgKHBvc2l0aW9uID09IG51bGwgfHwgc2l6ZSA9PSBudWxsIHx8IHJhZGl1cyA9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcXggPSBNYXRoLmFicyhwb3NpdGlvbi54KSAtIHNpemUueDtcbiAgICAgICAgY29uc3QgcXkgPSBNYXRoLmFicyhwb3NpdGlvbi55KSAtIHNpemUueTtcbiAgICAgICAgY29uc3QgcXogPSBNYXRoLmFicyhwb3NpdGlvbi56KSAtIHNpemUuejtcbiAgICAgICAgcmV0dXJuIE1hdGguaHlwb3QoTWF0aC5tYXgocXgsIDApLCBNYXRoLm1heChxeSwgMCksIE1hdGgubWF4KHF6LCAwKSkgLSByYWRpdXM7XG4gICAgICB9XG4gICAgICBjYXNlICdTZEJhclgnOiB7XG4gICAgICAgIGNvbnN0IHBvc2l0aW9uID0gdGhpcy5fX2V2YWxQb3NpdGlvbkZvckRpc3RhbmNlKG5vZGUsIHBvaW50SW5Xb3JsZCk7XG4gICAgICAgIGNvbnN0IHdpZHRoID0gdGhpcy5fX3JlYWRTY2FsYXJJbnB1dChub2RlLCAnd2lkdGgnLCAxKTtcbiAgICAgICAgaWYgKHBvc2l0aW9uID09IG51bGwgfHwgd2lkdGggPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBNYXRoLmh5cG90KE1hdGgubWF4KE1hdGguYWJzKHBvc2l0aW9uLnkpIC0gd2lkdGgsIDApLCBNYXRoLm1heChNYXRoLmFicyhwb3NpdGlvbi56KSAtIHdpZHRoLCAwKSk7XG4gICAgICB9XG4gICAgICBjYXNlICdTZEJhclknOiB7XG4gICAgICAgIGNvbnN0IHBvc2l0aW9uID0gdGhpcy5fX2V2YWxQb3NpdGlvbkZvckRpc3RhbmNlKG5vZGUsIHBvaW50SW5Xb3JsZCk7XG4gICAgICAgIGNvbnN0IHdpZHRoID0gdGhpcy5fX3JlYWRTY2FsYXJJbnB1dChub2RlLCAnd2lkdGgnLCAxKTtcbiAgICAgICAgaWYgKHBvc2l0aW9uID09IG51bGwgfHwgd2lkdGggPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBNYXRoLmh5cG90KE1hdGgubWF4KE1hdGguYWJzKHBvc2l0aW9uLngpIC0gd2lkdGgsIDApLCBNYXRoLm1heChNYXRoLmFicyhwb3NpdGlvbi56KSAtIHdpZHRoLCAwKSk7XG4gICAgICB9XG4gICAgICBjYXNlICdTZEJhclonOiB7XG4gICAgICAgIGNvbnN0IHBvc2l0aW9uID0gdGhpcy5fX2V2YWxQb3NpdGlvbkZvckRpc3RhbmNlKG5vZGUsIHBvaW50SW5Xb3JsZCk7XG4gICAgICAgIGNvbnN0IHdpZHRoID0gdGhpcy5fX3JlYWRTY2FsYXJJbnB1dChub2RlLCAnd2lkdGgnLCAxKTtcbiAgICAgICAgaWYgKHBvc2l0aW9uID09IG51bGwgfHwgd2lkdGggPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBNYXRoLmh5cG90KE1hdGgubWF4KE1hdGguYWJzKHBvc2l0aW9uLngpIC0gd2lkdGgsIDApLCBNYXRoLm1heChNYXRoLmFicyhwb3NpdGlvbi55KSAtIHdpZHRoLCAwKSk7XG4gICAgICB9XG4gICAgICBjYXNlICdTZFR1YmVYJzoge1xuICAgICAgICBjb25zdCBwb3NpdGlvbiA9IHRoaXMuX19ldmFsUG9zaXRpb25Gb3JEaXN0YW5jZShub2RlLCBwb2ludEluV29ybGQpO1xuICAgICAgICBjb25zdCB3aWR0aCA9IHRoaXMuX19yZWFkU2NhbGFySW5wdXQobm9kZSwgJ3dpZHRoJywgMSk7XG4gICAgICAgIGlmIChwb3NpdGlvbiA9PSBudWxsIHx8IHdpZHRoID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gTWF0aC5oeXBvdChwb3NpdGlvbi55LCBwb3NpdGlvbi56KSAtIHdpZHRoO1xuICAgICAgfVxuICAgICAgY2FzZSAnU2RUdWJlWSc6IHtcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSB0aGlzLl9fZXZhbFBvc2l0aW9uRm9yRGlzdGFuY2Uobm9kZSwgcG9pbnRJbldvcmxkKTtcbiAgICAgICAgY29uc3Qgd2lkdGggPSB0aGlzLl9fcmVhZFNjYWxhcklucHV0KG5vZGUsICd3aWR0aCcsIDEpO1xuICAgICAgICBpZiAocG9zaXRpb24gPT0gbnVsbCB8fCB3aWR0aCA9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIE1hdGguaHlwb3QocG9zaXRpb24ueCwgcG9zaXRpb24ueikgLSB3aWR0aDtcbiAgICAgIH1cbiAgICAgIGNhc2UgJ1NkVHViZVonOiB7XG4gICAgICAgIGNvbnN0IHBvc2l0aW9uID0gdGhpcy5fX2V2YWxQb3NpdGlvbkZvckRpc3RhbmNlKG5vZGUsIHBvaW50SW5Xb3JsZCk7XG4gICAgICAgIGNvbnN0IHdpZHRoID0gdGhpcy5fX3JlYWRTY2FsYXJJbnB1dChub2RlLCAnd2lkdGgnLCAxKTtcbiAgICAgICAgaWYgKHBvc2l0aW9uID09IG51bGwgfHwgd2lkdGggPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBNYXRoLmh5cG90KHBvc2l0aW9uLngsIHBvc2l0aW9uLnkpIC0gd2lkdGg7XG4gICAgICB9XG4gICAgICBjYXNlICdPcFVuaW9uJzoge1xuICAgICAgICBjb25zdCBsaHNOb2RlID0gdGhpcy5fX2lucHV0Tm9kZShub2RlLmlkLCAnbGhzJyk7XG4gICAgICAgIGNvbnN0IHJoc05vZGUgPSB0aGlzLl9faW5wdXROb2RlKG5vZGUuaWQsICdyaHMnKTtcbiAgICAgICAgaWYgKGxoc05vZGUgPT0gbnVsbCB8fCByaHNOb2RlID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBsaHMgPSB0aGlzLl9fZXZhbERpc3RhbmNlTm9kZShsaHNOb2RlLCBwb2ludEluV29ybGQpO1xuICAgICAgICBjb25zdCByaHMgPSB0aGlzLl9fZXZhbERpc3RhbmNlTm9kZShyaHNOb2RlLCBwb2ludEluV29ybGQpO1xuICAgICAgICBpZiAobGhzID09IG51bGwgfHwgcmhzID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gTWF0aC5taW4obGhzLCByaHMpO1xuICAgICAgfVxuICAgICAgY2FzZSAnT3BTdWJ0cmFjdGlvbic6IHtcbiAgICAgICAgY29uc3QgYmFzZU5vZGUgPSB0aGlzLl9faW5wdXROb2RlKG5vZGUuaWQsICdiYXNlJyk7XG4gICAgICAgIGNvbnN0IHN1YnRyYWN0b3JOb2RlID0gdGhpcy5fX2lucHV0Tm9kZShub2RlLmlkLCAnc3VidHJhY3RvcicpO1xuICAgICAgICBpZiAoYmFzZU5vZGUgPT0gbnVsbCB8fCBzdWJ0cmFjdG9yTm9kZSA9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYmFzZSA9IHRoaXMuX19ldmFsRGlzdGFuY2VOb2RlKGJhc2VOb2RlLCBwb2ludEluV29ybGQpO1xuICAgICAgICBjb25zdCBzdWJ0cmFjdG9yID0gdGhpcy5fX2V2YWxEaXN0YW5jZU5vZGUoc3VidHJhY3Rvck5vZGUsIHBvaW50SW5Xb3JsZCk7XG4gICAgICAgIGlmIChiYXNlID09IG51bGwgfHwgc3VidHJhY3RvciA9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIE1hdGgubWF4KGJhc2UsIC1zdWJ0cmFjdG9yKTtcbiAgICAgIH1cbiAgICAgIGNhc2UgJ09wU21vb3RoVW5pb24nOlxuICAgICAgY2FzZSAnT3BTbW9vdGhJbnRlcnNlY3Rpb24nOiB7XG4gICAgICAgIGNvbnN0IGxoc05vZGUgPSB0aGlzLl9faW5wdXROb2RlKG5vZGUuaWQsICdsaHMnKTtcbiAgICAgICAgY29uc3QgcmhzTm9kZSA9IHRoaXMuX19pbnB1dE5vZGUobm9kZS5pZCwgJ3JocycpO1xuICAgICAgICBpZiAobGhzTm9kZSA9PSBudWxsIHx8IHJoc05vZGUgPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGxocyA9IHRoaXMuX19ldmFsRGlzdGFuY2VOb2RlKGxoc05vZGUsIHBvaW50SW5Xb3JsZCk7XG4gICAgICAgIGNvbnN0IHJocyA9IHRoaXMuX19ldmFsRGlzdGFuY2VOb2RlKHJoc05vZGUsIHBvaW50SW5Xb3JsZCk7XG4gICAgICAgIGlmIChsaHMgPT0gbnVsbCB8fCByaHMgPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHNtb290aG5lc3MgPSB0aGlzLl9fcmVhZFNjYWxhcklucHV0KG5vZGUsICdzbW9vdGhuZXNzJywgMC4xKTtcbiAgICAgICAgaWYgKHNtb290aG5lc3MgPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGsgPSBNYXRoLm1heChzbW9vdGhuZXNzLCAwLjAwMDEpO1xuICAgICAgICBpZiAobm9kZS5uYW1lID09PSAnT3BTbW9vdGhVbmlvbicpIHtcbiAgICAgICAgICBjb25zdCBoID0gTWF0aC5taW4oTWF0aC5tYXgoMC41ICsgKDAuNSAqIChyaHMgLSBsaHMpKSAvIGssIDApLCAxKTtcbiAgICAgICAgICByZXR1cm4gcmhzICsgKGxocyAtIHJocykgKiBoIC0gayAqIGggKiAoMSAtIGgpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGggPSBNYXRoLm1pbihNYXRoLm1heCgwLjUgLSAoMC41ICogKHJocyAtIGxocykpIC8gaywgMCksIDEpO1xuICAgICAgICByZXR1cm4gcmhzICsgKGxocyAtIHJocykgKiBoICsgayAqIGggKiAoMSAtIGgpO1xuICAgICAgfVxuICAgICAgY2FzZSAnT3BTbW9vdGhTdWJ0cmFjdGlvbic6IHtcbiAgICAgICAgY29uc3QgYmFzZU5vZGUgPSB0aGlzLl9faW5wdXROb2RlKG5vZGUuaWQsICdiYXNlJyk7XG4gICAgICAgIGNvbnN0IHN1YnRyYWN0b3JOb2RlID0gdGhpcy5fX2lucHV0Tm9kZShub2RlLmlkLCAnc3VidHJhY3RvcicpO1xuICAgICAgICBpZiAoYmFzZU5vZGUgPT0gbnVsbCB8fCBzdWJ0cmFjdG9yTm9kZSA9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYmFzZSA9IHRoaXMuX19ldmFsRGlzdGFuY2VOb2RlKGJhc2VOb2RlLCBwb2ludEluV29ybGQpO1xuICAgICAgICBjb25zdCBzdWJ0cmFjdG9yID0gdGhpcy5fX2V2YWxEaXN0YW5jZU5vZGUoc3VidHJhY3Rvck5vZGUsIHBvaW50SW5Xb3JsZCk7XG4gICAgICAgIGlmIChiYXNlID09IG51bGwgfHwgc3VidHJhY3RvciA9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc21vb3RobmVzcyA9IHRoaXMuX19yZWFkU2NhbGFySW5wdXQobm9kZSwgJ3Ntb290aG5lc3MnLCAwLjEpO1xuICAgICAgICBpZiAoc21vb3RobmVzcyA9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgayA9IE1hdGgubWF4KHNtb290aG5lc3MsIDAuMDAwMSk7XG4gICAgICAgIGNvbnN0IGggPSBNYXRoLm1pbihNYXRoLm1heCgwLjUgLSAoMC41ICogKHN1YnRyYWN0b3IgKyBiYXNlKSkgLyBrLCAwKSwgMSk7XG4gICAgICAgIHJldHVybiBiYXNlICsgKC1zdWJ0cmFjdG9yIC0gYmFzZSkgKiBoICsgayAqIGggKiAoMSAtIGgpO1xuICAgICAgfVxuICAgICAgY2FzZSAnT3V0VW5pb24nOlxuICAgICAgY2FzZSAnT3V0RGlzdGFuY2UnOiB7XG4gICAgICAgIGNvbnN0IGlucHV0Tm9kZSA9IHRoaXMuX19pbnB1dE5vZGUobm9kZS5pZCwgJ2luMScpID8/IHRoaXMuX19pbnB1dE5vZGUobm9kZS5pZCwgJ3ZhbHVlJyk7XG4gICAgICAgIHJldHVybiBpbnB1dE5vZGUgPT0gbnVsbCA/IG51bGwgOiB0aGlzLl9fZXZhbERpc3RhbmNlTm9kZShpbnB1dE5vZGUsIHBvaW50SW5Xb3JsZCk7XG4gICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gdGhpcy5fX3JlYWRTY2FsYXJOb2RlVmFsdWUobm9kZSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfX2V2YWxCb3VuZHNOb2RlKG5vZGU6IE5vZGVKU09OTm9kZSk6IEFBQkIgfCBudWxsIHtcbiAgICBpZiAodGhpcy5fX2JvdW5kc0NhY2hlLmhhcyhub2RlLmlkKSkge1xuICAgICAgY29uc3QgY2FjaGVkID0gdGhpcy5fX2JvdW5kc0NhY2hlLmdldChub2RlLmlkKSE7XG4gICAgICByZXR1cm4gY2FjaGVkID09IG51bGwgPyBudWxsIDogY2FjaGVkLmNsb25lKCk7XG4gICAgfVxuXG4gICAgbGV0IGJvdW5kczogQUFCQiB8IG51bGwgPSBudWxsO1xuICAgIHN3aXRjaCAobm9kZS5uYW1lKSB7XG4gICAgICBjYXNlICdTZFNwaGVyZSc6IHtcbiAgICAgICAgY29uc3QgcmFkaXVzID0gdGhpcy5fX3JlYWRTY2FsYXJJbnB1dChub2RlLCAncmFkaXVzJywgMSk7XG4gICAgICAgIGJvdW5kcyA9IHJhZGl1cyA9PSBudWxsID8gbnVsbCA6IHRoaXMuX19ldmFsU3BoZXJlQm91bmRzKG5vZGUsIE1hdGguYWJzKHJhZGl1cykpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ1NkQm94Jzoge1xuICAgICAgICBjb25zdCBzaXplID0gdGhpcy5fX3JlYWRWZWMzSW5wdXQobm9kZSwgJ3NpemUnLCBPTkUpO1xuICAgICAgICBpZiAoc2l6ZSAhPSBudWxsKSB7XG4gICAgICAgICAgYm91bmRzID0gdGhpcy5fX2V2YWxQcmltaXRpdmVCb3VuZHMoXG4gICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgVmVjdG9yMy5mcm9tQ29weTMoTWF0aC5hYnMoc2l6ZS54KSwgTWF0aC5hYnMoc2l6ZS55KSwgTWF0aC5hYnMoc2l6ZS56KSlcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnU2RUb3J1cyc6IHtcbiAgICAgICAgY29uc3QgcmFkaXVzID0gdGhpcy5fX3JlYWRTY2FsYXJJbnB1dChub2RlLCAncmFkaXVzJywgMSk7XG4gICAgICAgIGNvbnN0IHR1YmVSYWRpdXMgPSB0aGlzLl9fcmVhZFNjYWxhcklucHV0KG5vZGUsICd0dWJlUmFkaXVzJywgMC4yNSk7XG4gICAgICAgIGlmIChyYWRpdXMgIT0gbnVsbCAmJiB0dWJlUmFkaXVzICE9IG51bGwpIHtcbiAgICAgICAgICBjb25zdCBvdXRlciA9IE1hdGguYWJzKHJhZGl1cykgKyBNYXRoLmFicyh0dWJlUmFkaXVzKTtcbiAgICAgICAgICBjb25zdCBpbm5lciA9IE1hdGguYWJzKHR1YmVSYWRpdXMpO1xuICAgICAgICAgIGJvdW5kcyA9IHRoaXMuX19ldmFsUHJpbWl0aXZlQm91bmRzKG5vZGUsIFZlY3RvcjMuZnJvbUNvcHkzKG91dGVyLCBpbm5lciwgb3V0ZXIpKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ1NkQ2Fwc3VsZSc6IHtcbiAgICAgICAgY29uc3QgcG9pbnRBID0gdGhpcy5fX3JlYWRWZWMzSW5wdXQobm9kZSwgJ3BvaW50QScsIERFRkFVTFRfQ0FQU1VMRV9QT0lOVF9BKTtcbiAgICAgICAgY29uc3QgcG9pbnRCID0gdGhpcy5fX3JlYWRWZWMzSW5wdXQobm9kZSwgJ3BvaW50QicsIERFRkFVTFRfQ0FQU1VMRV9QT0lOVF9CKTtcbiAgICAgICAgY29uc3QgcmFkaXVzID0gdGhpcy5fX3JlYWRTY2FsYXJJbnB1dChub2RlLCAncmFkaXVzJywgMC41KTtcbiAgICAgICAgaWYgKHBvaW50QSAhPSBudWxsICYmIHBvaW50QiAhPSBudWxsICYmIHJhZGl1cyAhPSBudWxsKSB7XG4gICAgICAgICAgLy8gQ29uc2VydmF0aXZlIGJvdW5kIGFyb3VuZCB0aGUgb3JpZ2luOiB0aGUgc2VnbWVudCBlbmRwb2ludHMgZXhwYW5kZWQgYnkgdGhlIHJhZGl1cy5cbiAgICAgICAgICBjb25zdCByID0gTWF0aC5hYnMocmFkaXVzKTtcbiAgICAgICAgICBib3VuZHMgPSB0aGlzLl9fZXZhbFByaW1pdGl2ZUJvdW5kcyhcbiAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICBWZWN0b3IzLmZyb21Db3B5MyhcbiAgICAgICAgICAgICAgTWF0aC5tYXgoTWF0aC5hYnMocG9pbnRBLngpLCBNYXRoLmFicyhwb2ludEIueCkpICsgcixcbiAgICAgICAgICAgICAgTWF0aC5tYXgoTWF0aC5hYnMocG9pbnRBLnkpLCBNYXRoLmFicyhwb2ludEIueSkpICsgcixcbiAgICAgICAgICAgICAgTWF0aC5tYXgoTWF0aC5hYnMocG9pbnRBLnopLCBNYXRoLmFicyhwb2ludEIueikpICsgclxuICAgICAgICAgICAgKVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdTZFJvdW5kQm94Jzoge1xuICAgICAgICBjb25zdCBzaXplID0gdGhpcy5fX3JlYWRWZWMzSW5wdXQobm9kZSwgJ3NpemUnLCBPTkUpO1xuICAgICAgICBjb25zdCByYWRpdXMgPSB0aGlzLl9fcmVhZFNjYWxhcklucHV0KG5vZGUsICdyYWRpdXMnLCAwLjI1KTtcbiAgICAgICAgaWYgKHNpemUgIT0gbnVsbCAmJiByYWRpdXMgIT0gbnVsbCkge1xuICAgICAgICAgIGNvbnN0IHIgPSBNYXRoLmFicyhyYWRpdXMpO1xuICAgICAgICAgIGJvdW5kcyA9IHRoaXMuX19ldmFsUHJpbWl0aXZlQm91bmRzKFxuICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgIFZlY3RvcjMuZnJvbUNvcHkzKE1hdGguYWJzKHNpemUueCkgKyByLCBNYXRoLmFicyhzaXplLnkpICsgciwgTWF0aC5hYnMoc2l6ZS56KSArIHIpXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ1NkQmFyWCc6XG4gICAgICBjYXNlICdTZEJhclknOlxuICAgICAgY2FzZSAnU2RCYXJaJzpcbiAgICAgIGNhc2UgJ1NkVHViZVgnOlxuICAgICAgY2FzZSAnU2RUdWJlWSc6XG4gICAgICBjYXNlICdTZFR1YmVaJzpcbiAgICAgICAgLy8gSW5maW5pdGUgYWxvbmcgdGhlIGJhci90dWJlIGF4aXMuXG4gICAgICAgIGJvdW5kcyA9IG51bGw7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnT3BVbmlvbic6IHtcbiAgICAgICAgY29uc3QgbGhzTm9kZSA9IHRoaXMuX19pbnB1dE5vZGUobm9kZS5pZCwgJ2xocycpO1xuICAgICAgICBjb25zdCByaHNOb2RlID0gdGhpcy5fX2lucHV0Tm9kZShub2RlLmlkLCAncmhzJyk7XG4gICAgICAgIGlmIChsaHNOb2RlICE9IG51bGwgJiYgcmhzTm9kZSAhPSBudWxsKSB7XG4gICAgICAgICAgY29uc3QgbGhzID0gdGhpcy5fX2V2YWxCb3VuZHNOb2RlKGxoc05vZGUpO1xuICAgICAgICAgIGNvbnN0IHJocyA9IHRoaXMuX19ldmFsQm91bmRzTm9kZShyaHNOb2RlKTtcbiAgICAgICAgICBpZiAobGhzICE9IG51bGwgJiYgcmhzICE9IG51bGwpIHtcbiAgICAgICAgICAgIGJvdW5kcyA9IGxocztcbiAgICAgICAgICAgIGJvdW5kcy5tZXJnZUFBQkIocmhzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdPcFN1YnRyYWN0aW9uJzoge1xuICAgICAgICAvLyBiYXNlIC0gc3VidHJhY3RvciBpcyBhIHN1YnNldCBvZiBiYXNlLlxuICAgICAgICBjb25zdCBiYXNlTm9kZSA9IHRoaXMuX19pbnB1dE5vZGUobm9kZS5pZCwgJ2Jhc2UnKTtcbiAgICAgICAgYm91bmRzID0gYmFzZU5vZGUgPT0gbnVsbCA/IG51bGwgOiB0aGlzLl9fZXZhbEJvdW5kc05vZGUoYmFzZU5vZGUpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ09wU21vb3RoVW5pb24nOiB7XG4gICAgICAgIGNvbnN0IGxoc05vZGUgPSB0aGlzLl9faW5wdXROb2RlKG5vZGUuaWQsICdsaHMnKTtcbiAgICAgICAgY29uc3QgcmhzTm9kZSA9IHRoaXMuX19pbnB1dE5vZGUobm9kZS5pZCwgJ3JocycpO1xuICAgICAgICBjb25zdCBzbW9vdGhuZXNzID0gdGhpcy5fX3JlYWRTY2FsYXJJbnB1dChub2RlLCAnc21vb3RobmVzcycsIDAuMSk7XG4gICAgICAgIGlmIChsaHNOb2RlICE9IG51bGwgJiYgcmhzTm9kZSAhPSBudWxsICYmIHNtb290aG5lc3MgIT0gbnVsbCkge1xuICAgICAgICAgIGNvbnN0IGxocyA9IHRoaXMuX19ldmFsQm91bmRzTm9kZShsaHNOb2RlKTtcbiAgICAgICAgICBjb25zdCByaHMgPSB0aGlzLl9fZXZhbEJvdW5kc05vZGUocmhzTm9kZSk7XG4gICAgICAgICAgaWYgKGxocyAhPSBudWxsICYmIHJocyAhPSBudWxsKSB7XG4gICAgICAgICAgICBjb25zdCBtZXJnZWQgPSBsaHMuY2xvbmUoKTtcbiAgICAgICAgICAgIG1lcmdlZC5tZXJnZUFBQkIocmhzKTtcbiAgICAgICAgICAgIC8vIFRoZSBzbW9vdGggYmxlbmQgY2FuIGV4dGVuZCBzbGlnaHRseSBvdXRzaWRlIHRoZSB1bmlvbiBvZiB0aGUgaW5wdXRzLlxuICAgICAgICAgICAgY29uc3QgayA9IE1hdGguYWJzKHNtb290aG5lc3MpO1xuICAgICAgICAgICAgY29uc3QgZXhwYW5kZWQgPSBuZXcgQUFCQigpO1xuICAgICAgICAgICAgZXhwYW5kZWQuYWRkUG9zaXRpb24oXG4gICAgICAgICAgICAgIFZlY3RvcjMuZnJvbUNvcHkzKG1lcmdlZC5taW5Qb2ludC54IC0gaywgbWVyZ2VkLm1pblBvaW50LnkgLSBrLCBtZXJnZWQubWluUG9pbnQueiAtIGspXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgZXhwYW5kZWQuYWRkUG9zaXRpb24oXG4gICAgICAgICAgICAgIFZlY3RvcjMuZnJvbUNvcHkzKG1lcmdlZC5tYXhQb2ludC54ICsgaywgbWVyZ2VkLm1heFBvaW50LnkgKyBrLCBtZXJnZWQubWF4UG9pbnQueiArIGspXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgYm91bmRzID0gZXhwYW5kZWQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnT3BTbW9vdGhTdWJ0cmFjdGlvbic6IHtcbiAgICAgICAgLy8gYmFzZSAtIHN1YnRyYWN0b3IgaXMgYSBzdWJzZXQgb2YgYmFzZS5cbiAgICAgICAgY29uc3QgYmFzZU5vZGUgPSB0aGlzLl9faW5wdXROb2RlKG5vZGUuaWQsICdiYXNlJyk7XG4gICAgICAgIGJvdW5kcyA9IGJhc2VOb2RlID09IG51bGwgPyBudWxsIDogdGhpcy5fX2V2YWxCb3VuZHNOb2RlKGJhc2VOb2RlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdPcFNtb290aEludGVyc2VjdGlvbic6IHtcbiAgICAgICAgY29uc3QgbGhzTm9kZSA9IHRoaXMuX19pbnB1dE5vZGUobm9kZS5pZCwgJ2xocycpO1xuICAgICAgICBjb25zdCByaHNOb2RlID0gdGhpcy5fX2lucHV0Tm9kZShub2RlLmlkLCAncmhzJyk7XG4gICAgICAgIGlmIChsaHNOb2RlICE9IG51bGwgJiYgcmhzTm9kZSAhPSBudWxsKSB7XG4gICAgICAgICAgY29uc3QgbGhzID0gdGhpcy5fX2V2YWxCb3VuZHNOb2RlKGxoc05vZGUpO1xuICAgICAgICAgIGNvbnN0IHJocyA9IHRoaXMuX19ldmFsQm91bmRzTm9kZShyaHNOb2RlKTtcbiAgICAgICAgICBpZiAobGhzICE9IG51bGwgJiYgcmhzICE9IG51bGwpIHtcbiAgICAgICAgICAgIGNvbnN0IG1pblggPSBNYXRoLm1heChsaHMubWluUG9pbnQueCwgcmhzLm1pblBvaW50LngpO1xuICAgICAgICAgICAgY29uc3QgbWluWSA9IE1hdGgubWF4KGxocy5taW5Qb2ludC55LCByaHMubWluUG9pbnQueSk7XG4gICAgICAgICAgICBjb25zdCBtaW5aID0gTWF0aC5tYXgobGhzLm1pblBvaW50LnosIHJocy5taW5Qb2ludC56KTtcbiAgICAgICAgICAgIGNvbnN0IG1heFggPSBNYXRoLm1pbihsaHMubWF4UG9pbnQueCwgcmhzLm1heFBvaW50LngpO1xuICAgICAgICAgICAgY29uc3QgbWF4WSA9IE1hdGgubWluKGxocy5tYXhQb2ludC55LCByaHMubWF4UG9pbnQueSk7XG4gICAgICAgICAgICBjb25zdCBtYXhaID0gTWF0aC5taW4obGhzLm1heFBvaW50LnosIHJocy5tYXhQb2ludC56KTtcbiAgICAgICAgICAgIGlmIChtaW5YIDw9IG1heFggJiYgbWluWSA8PSBtYXhZICYmIG1pblogPD0gbWF4Wikge1xuICAgICAgICAgICAgICBjb25zdCBib3ggPSBuZXcgQUFCQigpO1xuICAgICAgICAgICAgICBib3guYWRkUG9zaXRpb24oVmVjdG9yMy5mcm9tQ29weTMobWluWCwgbWluWSwgbWluWikpO1xuICAgICAgICAgICAgICBib3guYWRkUG9zaXRpb24oVmVjdG9yMy5mcm9tQ29weTMobWF4WCwgbWF4WSwgbWF4WikpO1xuICAgICAgICAgICAgICBib3VuZHMgPSBib3g7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnT3V0VW5pb24nOlxuICAgICAgY2FzZSAnT3V0RGlzdGFuY2UnOiB7XG4gICAgICAgIGNvbnN0IGlucHV0Tm9kZSA9IHRoaXMuX19pbnB1dE5vZGUobm9kZS5pZCwgJ2luMScpID8/IHRoaXMuX19pbnB1dE5vZGUobm9kZS5pZCwgJ3ZhbHVlJyk7XG4gICAgICAgIGJvdW5kcyA9IGlucHV0Tm9kZSA9PSBudWxsID8gbnVsbCA6IHRoaXMuX19ldmFsQm91bmRzTm9kZShpbnB1dE5vZGUpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGJvdW5kcyA9IG51bGw7XG4gICAgfVxuXG4gICAgdGhpcy5fX2JvdW5kc0NhY2hlLnNldChub2RlLmlkLCBib3VuZHMgPT0gbnVsbCA/IG51bGwgOiBib3VuZHMuY2xvbmUoKSk7XG4gICAgcmV0dXJuIGJvdW5kcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBleGFjdCBBQUJCIG9mIGEgc3BoZXJlIHRyYW5zZm9ybWVkIGJ5IHRoZSBwb3NpdGlvbiBjaGFpbi5cbiAgICogVGhlIHRyYW5zZm9ybWVkIHNoYXBlIGlzIGFuIGVsbGlwc29pZCwgd2hvc2UgZXh0ZW50IGFsb25nIGVhY2ggd29ybGQgYXhpc1xuICAgKiBpcyB0aGUgcmFkaXVzIHRpbWVzIHRoZSBsZW5ndGggb2YgdGhlIGNvcnJlc3BvbmRpbmcgcm93IG9mIHRoZSBsaW5lYXIgcGFydC5cbiAgICovXG4gIHByaXZhdGUgX19ldmFsU3BoZXJlQm91bmRzKG5vZGU6IE5vZGVKU09OTm9kZSwgcmFkaXVzOiBudW1iZXIpOiBBQUJCIHwgbnVsbCB7XG4gICAgY29uc3QgcG9zaXRpb25Ob2RlID0gdGhpcy5fX2lucHV0Tm9kZShub2RlLmlkLCAncG9zaXRpb24nKTtcbiAgICBpZiAocG9zaXRpb25Ob2RlID09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGNoYWluID0gdGhpcy5fX3Bvc2l0aW9uQ2hhaW5Ub1dvcmxkKHBvc2l0aW9uTm9kZSk7XG4gICAgaWYgKGNoYWluID09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGNlbnRlciA9IGNoYWluLm11bHRpcGx5VmVjdG9yMyhaRVJPKTtcbiAgICBjb25zdCBheGlzWCA9IFZlY3RvcjMuc3VidHJhY3QoY2hhaW4ubXVsdGlwbHlWZWN0b3IzKFZlY3RvcjMuZnJvbUNvcHkzKDEsIDAsIDApKSwgY2VudGVyKTtcbiAgICBjb25zdCBheGlzWSA9IFZlY3RvcjMuc3VidHJhY3QoY2hhaW4ubXVsdGlwbHlWZWN0b3IzKFZlY3RvcjMuZnJvbUNvcHkzKDAsIDEsIDApKSwgY2VudGVyKTtcbiAgICBjb25zdCBheGlzWiA9IFZlY3RvcjMuc3VidHJhY3QoY2hhaW4ubXVsdGlwbHlWZWN0b3IzKFZlY3RvcjMuZnJvbUNvcHkzKDAsIDAsIDEpKSwgY2VudGVyKTtcblxuICAgIGNvbnN0IGV4dGVudFggPSByYWRpdXMgKiBNYXRoLmh5cG90KGF4aXNYLngsIGF4aXNZLngsIGF4aXNaLngpO1xuICAgIGNvbnN0IGV4dGVudFkgPSByYWRpdXMgKiBNYXRoLmh5cG90KGF4aXNYLnksIGF4aXNZLnksIGF4aXNaLnkpO1xuICAgIGNvbnN0IGV4dGVudFogPSByYWRpdXMgKiBNYXRoLmh5cG90KGF4aXNYLnosIGF4aXNZLnosIGF4aXNaLnopO1xuXG4gICAgY29uc3QgYm91bmRzID0gbmV3IEFBQkIoKTtcbiAgICBib3VuZHMuYWRkUG9zaXRpb24oVmVjdG9yMy5mcm9tQ29weTMoY2VudGVyLnggLSBleHRlbnRYLCBjZW50ZXIueSAtIGV4dGVudFksIGNlbnRlci56IC0gZXh0ZW50WikpO1xuICAgIGJvdW5kcy5hZGRQb3NpdGlvbihWZWN0b3IzLmZyb21Db3B5MyhjZW50ZXIueCArIGV4dGVudFgsIGNlbnRlci55ICsgZXh0ZW50WSwgY2VudGVyLnogKyBleHRlbnRaKSk7XG4gICAgcmV0dXJuIHRoaXMuX19leHBhbmRCb3VuZHNGb3JOb25MaW5lYXJDaGFpbihub2RlLCBib3VuZHMpO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2V2YWxQcmltaXRpdmVCb3VuZHMobm9kZTogTm9kZUpTT05Ob2RlLCBoYWxmRXh0ZW50czogVmVjdG9yMyk6IEFBQkIgfCBudWxsIHtcbiAgICBjb25zdCBwb3NpdGlvbk5vZGUgPSB0aGlzLl9faW5wdXROb2RlKG5vZGUuaWQsICdwb3NpdGlvbicpO1xuICAgIGlmIChwb3NpdGlvbk5vZGUgPT0gbnVsbCkge1xuICAgICAgLy8gQSBwcmltaXRpdmUgd2l0aG91dCBhIHBvc2l0aW9uIHNvdXJjZSBpcyBhIGNvbnN0YW50IGZpZWxkLCBub3QgYSBzaGFwZS5cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGNoYWluID0gdGhpcy5fX3Bvc2l0aW9uQ2hhaW5Ub1dvcmxkKHBvc2l0aW9uTm9kZSk7XG4gICAgaWYgKGNoYWluID09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGxvY2FsQm91bmRzID0gbmV3IEFBQkIoKTtcbiAgICBsb2NhbEJvdW5kcy5hZGRQb3NpdGlvbihWZWN0b3IzLmZyb21Db3B5MygtaGFsZkV4dGVudHMueCwgLWhhbGZFeHRlbnRzLnksIC1oYWxmRXh0ZW50cy56KSk7XG4gICAgbG9jYWxCb3VuZHMuYWRkUG9zaXRpb24oVmVjdG9yMy5mcm9tQ29weTMoaGFsZkV4dGVudHMueCwgaGFsZkV4dGVudHMueSwgaGFsZkV4dGVudHMueikpO1xuXG4gICAgY29uc3Qgd29ybGRCb3VuZHMgPSBuZXcgQUFCQigpO1xuICAgIEFBQkIubXVsdGlwbHlNYXRyaXhUbyhjaGFpbiwgbG9jYWxCb3VuZHMsIHdvcmxkQm91bmRzKTtcbiAgICBpZiAod29ybGRCb3VuZHMuaXNWYW5pbGxhKCkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fX2V4cGFuZEJvdW5kc0Zvck5vbkxpbmVhckNoYWluKG5vZGUsIHdvcmxkQm91bmRzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRydWUgd2hlbiBhIHBvc2l0aW9uIGNoYWluIGNvbnRhaW5zIGEgbm9uLWxpbmVhciBkb21haW4gbm9kZVxuICAgKiAoVHdpc3RYL1kvWiBvciBCZW5kWFkvWFovWVovWVgvWlgvWlkpLCB3aGljaCBjYW5ub3QgYmUgcmVwcmVzZW50ZWQgYnkgYSBtYXRyaXguXG4gICAqL1xuICBwcml2YXRlIF9fcG9zaXRpb25DaGFpbkhhc05vbkxpbmVhck5vZGUobm9kZTogTm9kZUpTT05Ob2RlKTogYm9vbGVhbiB7XG4gICAgY29uc3QgdmlzaXRlZCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGNvbnN0IHN0YWNrOiBOb2RlSlNPTk5vZGVbXSA9IFtub2RlXTtcbiAgICB3aGlsZSAoc3RhY2subGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgY3VycmVudCA9IHN0YWNrLnBvcCgpITtcbiAgICAgIGlmICh2aXNpdGVkLmhhcyhjdXJyZW50LmlkKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHZpc2l0ZWQuYWRkKGN1cnJlbnQuaWQpO1xuICAgICAgaWYgKGN1cnJlbnQubmFtZSBpbiBOT05fTElORUFSX1JPVEFURURfQVhFUykge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBhcmVudCA9IHRoaXMuX19pbnB1dE5vZGUoY3VycmVudC5pZCwgJ3Bvc2l0aW9uJyk7XG4gICAgICBpZiAocGFyZW50ICE9IG51bGwpIHtcbiAgICAgICAgc3RhY2sucHVzaChwYXJlbnQpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogRXhwYW5kcyBwcmltaXRpdmUgYm91bmRzIGZvciBub24tbGluZWFyIGRvbWFpbiBub2RlcyBpbiB0aGUgcG9zaXRpb24gY2hhaW4uXG4gICAqIFRoZSBjaGFpbiBmb2xkcyB0aGVtIGluIGFzIGlkZW50aXR5LCBzbyB0aGUgZXh0ZW50cyBvZiB0aGUgcm90YXRlZCBheGlzIHBhaXJcbiAgICogYXJlIHdpZGVuZWQgdG8gdGhlIHJhZGl1cyBhcm91bmQgdGhlIHJvdGF0aW9uIGF4aXMgKGEgY29uc2VydmF0aXZlIGJvdW5kIGZvclxuICAgKiBhbnkgYW5nbGUpLlxuICAgKi9cbiAgcHJpdmF0ZSBfX2V4cGFuZEJvdW5kc0Zvck5vbkxpbmVhckNoYWluKG5vZGU6IE5vZGVKU09OTm9kZSwgYm91bmRzOiBBQUJCKTogQUFCQiB7XG4gICAgY29uc3QgcG9zaXRpb25Ob2RlID0gdGhpcy5fX2lucHV0Tm9kZShub2RlLmlkLCAncG9zaXRpb24nKTtcbiAgICBpZiAocG9zaXRpb25Ob2RlID09IG51bGwgfHwgIXRoaXMuX19wb3NpdGlvbkNoYWluSGFzTm9uTGluZWFyTm9kZShwb3NpdGlvbk5vZGUpKSB7XG4gICAgICByZXR1cm4gYm91bmRzO1xuICAgIH1cblxuICAgIGNvbnN0IHJvdGF0ZWRBeGVzID0gbmV3IFNldDwneXonIHwgJ3h6JyB8ICd4eSc+KCk7XG4gICAgY29uc3QgdmlzaXRlZCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGNvbnN0IHN0YWNrOiBOb2RlSlNPTk5vZGVbXSA9IFtwb3NpdGlvbk5vZGVdO1xuICAgIHdoaWxlIChzdGFjay5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBjdXJyZW50ID0gc3RhY2sucG9wKCkhO1xuICAgICAgaWYgKHZpc2l0ZWQuaGFzKGN1cnJlbnQuaWQpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgdmlzaXRlZC5hZGQoY3VycmVudC5pZCk7XG4gICAgICBjb25zdCBheGVzID0gTk9OX0xJTkVBUl9ST1RBVEVEX0FYRVNbY3VycmVudC5uYW1lXTtcbiAgICAgIGlmIChheGVzICE9IG51bGwpIHtcbiAgICAgICAgcm90YXRlZEF4ZXMuYWRkKGF4ZXMpO1xuICAgICAgfVxuICAgICAgY29uc3QgcGFyZW50ID0gdGhpcy5fX2lucHV0Tm9kZShjdXJyZW50LmlkLCAncG9zaXRpb24nKTtcbiAgICAgIGlmIChwYXJlbnQgIT0gbnVsbCkge1xuICAgICAgICBzdGFjay5wdXNoKHBhcmVudCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgbWluID0gYm91bmRzLm1pblBvaW50O1xuICAgIGNvbnN0IG1heCA9IGJvdW5kcy5tYXhQb2ludDtcbiAgICBsZXQgbWluWCA9IG1pbi54O1xuICAgIGxldCBtYXhYID0gbWF4Lng7XG4gICAgbGV0IG1pblkgPSBtaW4ueTtcbiAgICBsZXQgbWF4WSA9IG1heC55O1xuICAgIGxldCBtaW5aID0gbWluLno7XG4gICAgbGV0IG1heFogPSBtYXguejtcbiAgICBpZiAocm90YXRlZEF4ZXMuaGFzKCd5eicpKSB7XG4gICAgICBjb25zdCByaG8gPSBNYXRoLmh5cG90KE1hdGgubWF4KE1hdGguYWJzKG1pblkpLCBNYXRoLmFicyhtYXhZKSksIE1hdGgubWF4KE1hdGguYWJzKG1pblopLCBNYXRoLmFicyhtYXhaKSkpO1xuICAgICAgbWluWSA9IC1yaG87XG4gICAgICBtYXhZID0gcmhvO1xuICAgICAgbWluWiA9IC1yaG87XG4gICAgICBtYXhaID0gcmhvO1xuICAgIH1cbiAgICBpZiAocm90YXRlZEF4ZXMuaGFzKCd4eicpKSB7XG4gICAgICBjb25zdCByaG8gPSBNYXRoLmh5cG90KE1hdGgubWF4KE1hdGguYWJzKG1pblgpLCBNYXRoLmFicyhtYXhYKSksIE1hdGgubWF4KE1hdGguYWJzKG1pblopLCBNYXRoLmFicyhtYXhaKSkpO1xuICAgICAgbWluWCA9IC1yaG87XG4gICAgICBtYXhYID0gcmhvO1xuICAgICAgbWluWiA9IC1yaG87XG4gICAgICBtYXhaID0gcmhvO1xuICAgIH1cbiAgICBpZiAocm90YXRlZEF4ZXMuaGFzKCd4eScpKSB7XG4gICAgICBjb25zdCByaG8gPSBNYXRoLmh5cG90KE1hdGgubWF4KE1hdGguYWJzKG1pblgpLCBNYXRoLmFicyhtYXhYKSksIE1hdGgubWF4KE1hdGguYWJzKG1pblkpLCBNYXRoLmFicyhtYXhZKSkpO1xuICAgICAgbWluWCA9IC1yaG87XG4gICAgICBtYXhYID0gcmhvO1xuICAgICAgbWluWSA9IC1yaG87XG4gICAgICBtYXhZID0gcmhvO1xuICAgIH1cblxuICAgIGNvbnN0IGV4cGFuZGVkID0gbmV3IEFBQkIoKTtcbiAgICBleHBhbmRlZC5hZGRQb3NpdGlvbihWZWN0b3IzLmZyb21Db3B5MyhtaW5YLCBtaW5ZLCBtaW5aKSk7XG4gICAgZXhwYW5kZWQuYWRkUG9zaXRpb24oVmVjdG9yMy5mcm9tQ29weTMobWF4WCwgbWF4WSwgbWF4WikpO1xuICAgIHJldHVybiBleHBhbmRlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRydWUgd2hlbiBhIHBvc2l0aW9uIGNoYWluIGNvbnRhaW5zIFNkQXBwbHlXb3JsZE1hdHJpeC5cbiAgICogQSBncmFwaCB3aXRob3V0IHRoaXMgbm9kZSBpcyBhdXRob3JlZCBpbiB3b3JsZCBzcGFjZSBhbmQgZG9lcyBub3QgZm9sbG93XG4gICAqIHRoZSBjb21wb25lbnQgZW50aXR5IHRyYW5zZm9ybS5cbiAgICovXG4gIHByaXZhdGUgX19wb3NpdGlvbkNoYWluVXNlc1dvcmxkTWF0cml4KG5vZGU6IE5vZGVKU09OTm9kZSk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHZpc2l0ZWQgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBsZXQgY3VycmVudDogTm9kZUpTT05Ob2RlIHwgdW5kZWZpbmVkID0gbm9kZTtcbiAgICB3aGlsZSAoY3VycmVudCAhPSBudWxsICYmICF2aXNpdGVkLmhhcyhjdXJyZW50LmlkKSkge1xuICAgICAgaWYgKGN1cnJlbnQubmFtZSA9PT0gJ1NkQXBwbHlXb3JsZE1hdHJpeCcpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICB2aXNpdGVkLmFkZChjdXJyZW50LmlkKTtcbiAgICAgIGN1cnJlbnQgPSB0aGlzLl9faW5wdXROb2RlKGN1cnJlbnQuaWQsICdwb3NpdGlvbicpO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgbWF0cml4IHRoYXQgbWFwcyB0aGUgb3V0cHV0IHNwYWNlIG9mIGEgcG9zaXRpb24gbm9kZSB0byB3b3JsZCBzcGFjZS5cbiAgICogYFNkQXBwbHlUcmFuc2Zvcm1gIGFuZCBgU2RBcHBseVdvcmxkTWF0cml4YCBzdG9yZSB0aGUgaW52ZXJzZSB0cmFuc2Zvcm0gaW4gdGhlXG4gICAqIHBvc2l0aW9uIGNoYWluLCBzbyB0aGUgZm9yd2FyZCB0cmFuc2Zvcm0gaXMgdGhlIGNvbXBvc2l0aW9uIGBwYXJlbnQgKiB0cmFuc2Zvcm1gLlxuICAgKi9cbiAgcHJpdmF0ZSBfX3Bvc2l0aW9uQ2hhaW5Ub1dvcmxkKG5vZGU6IE5vZGVKU09OTm9kZSk6IE1hdHJpeDQ0IHwgbnVsbCB7XG4gICAgaWYgKHRoaXMuX19wb3NpdGlvbkNoYWluQ2FjaGUuaGFzKG5vZGUuaWQpKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX3Bvc2l0aW9uQ2hhaW5DYWNoZS5nZXQobm9kZS5pZCkhO1xuICAgIH1cblxuICAgIGxldCBjaGFpbjogTWF0cml4NDQgfCBudWxsID0gbnVsbDtcbiAgICBzd2l0Y2ggKG5vZGUubmFtZSkge1xuICAgICAgY2FzZSAnSW5pdGlhbFBvc2l0aW9uJzpcbiAgICAgICAgY2hhaW4gPSBNYXRyaXg0NC5mcm9tQ29weU1hdHJpeDQ0KElERU5USVRZX01BVFJJWCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnU2RBcHBseVRyYW5zZm9ybSc6IHtcbiAgICAgICAgY29uc3QgcGFyZW50ID0gdGhpcy5fX2lucHV0Tm9kZShub2RlLmlkLCAncG9zaXRpb24nKTtcbiAgICAgICAgY29uc3QgcGFyZW50Q2hhaW4gPSBwYXJlbnQgPT0gbnVsbCA/IG51bGwgOiB0aGlzLl9fcG9zaXRpb25DaGFpblRvV29ybGQocGFyZW50KTtcbiAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gdGhpcy5fX2dldFRyYW5zZm9ybShub2RlKTtcbiAgICAgICAgaWYgKHBhcmVudENoYWluICE9IG51bGwgJiYgdHJhbnNmb3JtICE9IG51bGwpIHtcbiAgICAgICAgICBjaGFpbiA9IE1hdHJpeDQ0Lm11bHRpcGx5KHBhcmVudENoYWluLCB0cmFuc2Zvcm0pO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnU2RBcHBseVdvcmxkTWF0cml4Jzoge1xuICAgICAgICBjb25zdCBwYXJlbnQgPSB0aGlzLl9faW5wdXROb2RlKG5vZGUuaWQsICdwb3NpdGlvbicpO1xuICAgICAgICBjb25zdCBwYXJlbnRDaGFpbiA9IHBhcmVudCA9PSBudWxsID8gbnVsbCA6IHRoaXMuX19wb3NpdGlvbkNoYWluVG9Xb3JsZChwYXJlbnQpO1xuICAgICAgICBpZiAocGFyZW50Q2hhaW4gIT0gbnVsbCkge1xuICAgICAgICAgIGNoYWluID0gTWF0cml4NDQubXVsdGlwbHkocGFyZW50Q2hhaW4sIHRoaXMuX193b3JsZE1hdHJpeCk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdUd2lzdFgnOlxuICAgICAgY2FzZSAnVHdpc3RZJzpcbiAgICAgIGNhc2UgJ1R3aXN0Wic6XG4gICAgICBjYXNlICdCZW5kWFknOlxuICAgICAgY2FzZSAnQmVuZFhaJzpcbiAgICAgIGNhc2UgJ0JlbmRZWic6XG4gICAgICBjYXNlICdCZW5kWVgnOlxuICAgICAgY2FzZSAnQmVuZFpYJzpcbiAgICAgIGNhc2UgJ0JlbmRaWSc6IHtcbiAgICAgICAgLy8gTm9uLWxpbmVhciBkb21haW4gbm9kZXMgY2Fubm90IGJlIHJlcHJlc2VudGVkIGJ5IGEgbWF0cml4LiBGb3IgYm91bmRzIHRoZXkgYXJlXG4gICAgICAgIC8vIGZvbGRlZCBpbiBhcyBpZGVudGl0eSBhbmQgZXhwYW5kZWQgY29uc2VydmF0aXZlbHkgYnkgX19leHBhbmRCb3VuZHNGb3JOb25MaW5lYXJDaGFpbi5cbiAgICAgICAgLy8gY2FsY1NwaGVyZSgpIHJlamVjdHMgZ3JhcGhzIHRoYXQgY29udGFpbiB0aGVtLCBzbyBleGFjdCBwaWNraW5nIGlzIG5vdCBhZmZlY3RlZC5cbiAgICAgICAgY29uc3QgcGFyZW50ID0gdGhpcy5fX2lucHV0Tm9kZShub2RlLmlkLCAncG9zaXRpb24nKTtcbiAgICAgICAgY2hhaW4gPSBwYXJlbnQgPT0gbnVsbCA/IE1hdHJpeDQ0LmZyb21Db3B5TWF0cml4NDQoSURFTlRJVFlfTUFUUklYKSA6IHRoaXMuX19wb3NpdGlvbkNoYWluVG9Xb3JsZChwYXJlbnQpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIC8vIFJlcGVhdCBub2RlcyBjcmVhdGUgaW5maW5pdGUgcmVwZXRpdGlvbnMgYW5kIGhhdmUgbm8gZmluaXRlIHdvcmxkIEFBQkIuXG4gICAgICAgIGNoYWluID0gbnVsbDtcbiAgICB9XG5cbiAgICB0aGlzLl9fcG9zaXRpb25DaGFpbkNhY2hlLnNldChub2RlLmlkLCBjaGFpbik7XG4gICAgcmV0dXJuIGNoYWluO1xuICB9XG5cbiAgLyoqXG4gICAqIEludGVyc2VjdHMgYSBub3JtYWxpemVkIHJheSB3aXRoIGFuIEFBQkIuXG4gICAqIEByZXR1cm5zIFRoZSBlbnRyeSBhbmQgZXhpdCBkaXN0YW5jZXMsIG9yIG51bGwgd2hlbiB0aGUgcmF5IG1pc3Nlc1xuICAgKi9cbiAgc3RhdGljIGludGVyc2VjdFJheUFhYmIob3JpZ2luOiBWZWN0b3IzLCBkaXJlY3Rpb246IFZlY3RvcjMsIGFhYmI6IEFBQkIpOiBbbnVtYmVyLCBudW1iZXJdIHwgbnVsbCB7XG4gICAgY29uc3QgbWlucyA9IFthYWJiLm1pblBvaW50LngsIGFhYmIubWluUG9pbnQueSwgYWFiYi5taW5Qb2ludC56XTtcbiAgICBjb25zdCBtYXhzID0gW2FhYmIubWF4UG9pbnQueCwgYWFiYi5tYXhQb2ludC55LCBhYWJiLm1heFBvaW50LnpdO1xuICAgIGNvbnN0IG9yaWdpbnMgPSBbb3JpZ2luLngsIG9yaWdpbi55LCBvcmlnaW4uel07XG4gICAgY29uc3QgZGlyZWN0aW9ucyA9IFtkaXJlY3Rpb24ueCwgZGlyZWN0aW9uLnksIGRpcmVjdGlvbi56XTtcblxuICAgIGxldCB0TWluID0gLU51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcbiAgICBsZXQgdE1heCA9IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgICBjb25zdCBvID0gb3JpZ2luc1tpXTtcbiAgICAgIGNvbnN0IGQgPSBkaXJlY3Rpb25zW2ldO1xuICAgICAgaWYgKE1hdGguYWJzKGQpIDwgMWUtMTIpIHtcbiAgICAgICAgaWYgKG8gPCBtaW5zW2ldIHx8IG8gPiBtYXhzW2ldKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGludmVyc2UgPSAxIC8gZDtcbiAgICAgIGxldCB0MSA9IChtaW5zW2ldIC0gbykgKiBpbnZlcnNlO1xuICAgICAgbGV0IHQyID0gKG1heHNbaV0gLSBvKSAqIGludmVyc2U7XG4gICAgICBpZiAodDEgPiB0Mikge1xuICAgICAgICBjb25zdCB0bXAgPSB0MTtcbiAgICAgICAgdDEgPSB0MjtcbiAgICAgICAgdDIgPSB0bXA7XG4gICAgICB9XG4gICAgICB0TWluID0gTWF0aC5tYXgodE1pbiwgdDEpO1xuICAgICAgdE1heCA9IE1hdGgubWluKHRNYXgsIHQyKTtcbiAgICAgIGlmICh0TWF4IDwgdE1pbikge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gW3RNaW4sIHRNYXhdO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxZQUFZO0FBRXJCLFNBQVMsZ0JBQWdCO0FBQ3pCLFNBQVMsZUFBZTtBQTZDeEIsSUFBTSxPQUFPLFFBQVEsVUFBVSxHQUFHLEdBQUcsQ0FBQztBQUN0QyxJQUFNLE1BQU0sUUFBUSxVQUFVLEdBQUcsR0FBRyxDQUFDO0FBQ3JDLElBQU0sMEJBQTBCLFFBQVEsVUFBVSxHQUFHLE1BQU0sQ0FBQztBQUM1RCxJQUFNLDBCQUEwQixRQUFRLFVBQVUsR0FBRyxLQUFLLENBQUM7QUFDM0QsSUFBTSxrQkFBa0IsU0FBUyxpQkFBaUIsU0FBUyxTQUFTLENBQUM7QUFFckUsSUFBTSxjQUFzRTtBQUFBLEVBQzFFLFVBQVUsRUFBRSxHQUFHLE1BQU0sR0FBRyxNQUFNLEdBQUcsS0FBSztBQUFBLEVBQ3RDLFdBQVcsRUFBRSxHQUFHLE1BQU0sR0FBRyxPQUFPLEdBQUcsTUFBTTtBQUFBLEVBQ3pDLFdBQVcsRUFBRSxHQUFHLE9BQU8sR0FBRyxNQUFNLEdBQUcsTUFBTTtBQUFBLEVBQ3pDLFdBQVcsRUFBRSxHQUFHLE9BQU8sR0FBRyxPQUFPLEdBQUcsS0FBSztBQUFBLEVBQ3pDLFlBQVksRUFBRSxHQUFHLE1BQU0sR0FBRyxNQUFNLEdBQUcsTUFBTTtBQUFBLEVBQ3pDLFlBQVksRUFBRSxHQUFHLE9BQU8sR0FBRyxNQUFNLEdBQUcsS0FBSztBQUFBLEVBQ3pDLFlBQVksRUFBRSxHQUFHLE1BQU0sR0FBRyxPQUFPLEdBQUcsS0FBSztBQUMzQztBQU1BLElBQU0sMEJBQThEO0FBQUEsRUFDbEUsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFB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S0FBSyxJQUFJLEtBQUs7QUFDNUMsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsT0FBTyxpQkFBaUIsUUFBaUIsV0FBb0IsTUFBcUM7QUFDaEcsVUFBTSxPQUFPLENBQUMsS0FBSyxTQUFTLEdBQUcsS0FBSyxTQUFTLEdBQUcsS0FBSyxTQUFTLENBQUM7QUFDL0QsVUFBTSxPQUFPLENBQUMsS0FBSyxTQUFTLEdBQUcsS0FBSyxTQUFTLEdBQUcsS0FBSyxTQUFTLENBQUM7QUFDL0QsVUFBTSxVQUFVLENBQUMsT0FBTyxHQUFHLE9BQU8sR0FBRyxPQUFPLENBQUM7QUFDN0MsVUFBTSxhQUFhLENBQUMsVUFBVSxHQUFHLFVBQVUsR0FBRyxVQUFVLENBQUM7QUFFekQsUUFBSSxPQUFPLENBQUMsT0FBTztBQUNuQixRQUFJLE9BQU8sT0FBTztBQUVsQixhQUFTLElBQUksR0FBRyxJQUFJLEdBQUcsS0FBSztBQUMxQixZQUFNLElBQUksUUFBUSxDQUFDO0FBQ25CLFlBQU0sSUFBSSxXQUFXLENBQUM7QUFDdEIsVUFBSSxLQUFLLElBQUksQ0FBQyxJQUFJLE9BQU87QUFDdkIsWUFBSSxJQUFJLEtBQUssQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLEdBQUc7QUFDOUIsaUJBQU87QUFBQSxRQUNUO0FBQ0E7QUFBQSxNQUNGO0FBRUEsWUFBTSxVQUFVLElBQUk7QUFDcEIsVUFBSSxNQUFNLEtBQUssQ0FBQyxJQUFJLEtBQUs7QUFDekIsVUFBSSxNQUFNLEtBQUssQ0FBQyxJQUFJLEtBQUs7QUFDekIsVUFBSSxLQUFLLElBQUk7QUFDWCxjQUFNLE1BQU07QUFDWixhQUFLO0FBQ0wsYUFBSztBQUFBLE1BQ1A7QUFDQSxhQUFPLEtBQUssSUFBSSxNQUFNLEVBQUU7QUFDeEIsYUFBTyxLQUFLLElBQUksTUFBTSxFQUFFO0FBQ3hCLFVBQUksT0FBTyxNQUFNO0FBQ2YsZUFBTztBQUFBLE1BQ1Q7QUFBQSxJQUNGO0FBRUEsV0FBTyxDQUFDLE1BQU0sSUFBSTtBQUFBLEVBQ3BCO0FBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBcjFDYSx5QkE0T2Esd0JBQXdCLG9CQUFJLElBQUk7QUFBQSxFQUN0RDtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUNGLENBQUM7QUFwUEksSUFBTSwwQkFBTjsiLAogICJuYW1lcyI6IFsiaCJdCn0K
