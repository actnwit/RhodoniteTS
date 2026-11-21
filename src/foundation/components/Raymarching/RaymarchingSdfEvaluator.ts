import type { NodeJSON, NodeJSONNode } from '../../../types/NodeJSON';
import { AABB } from '../../math/AABB';
import type { IMatrix44 } from '../../math/IMatrix';
import { Matrix44 } from '../../math/Matrix44';
import { Vector3 } from '../../math/Vector3';

/**
 * Resolves a material parameter used by a Uniform shader node.
 *
 * The raymarching material is owned by the application, so the engine cannot
 * look it up directly. Applications that change uniform values at runtime can
 * provide this callback to keep the CPU-side SDF evaluation in sync.
 */
export type RaymarchingUniformValueProvider = (name: string) => unknown;

/**
 * Options for {@link RaymarchingSdfEvaluator.marchRay}.
 */
export type RaymarchingRaycastOptions = {
  /** Maximum distance along the ray to march. Defaults to 10000. */
  maxDistance?: number;
  /** Maximum number of sphere-tracing steps. Defaults to 256. */
  maxSteps?: number;
  /** Distance threshold that counts as a surface hit. Defaults to 0.001. */
  epsilon?: number;
};

/**
 * Result of a CPU-side SDF raycast.
 */
export type RaymarchingRaycastHit = {
  /** Distance along the ray from the origin. */
  t: number;
  /** Hit position in world space. */
  position: Vector3;
};

const ZERO = Vector3.fromCopy3(0, 0, 0);
const ONE = Vector3.fromCopy3(1, 1, 1);
const IDENTITY_MATRIX = Matrix44.fromCopyMatrix44(Matrix44.identity());

const REPEAT_AXES: Record<string, { x: boolean; y: boolean; z: boolean }> = {
  SdRepeat: { x: true, y: true, z: true },
  SdRepeatX: { x: true, y: false, z: false },
  SdRepeatY: { x: false, y: true, z: false },
  SdRepeatZ: { x: false, y: false, z: true },
  SdRepeatXY: { x: true, y: true, z: false },
  SdRepeatYZ: { x: false, y: true, z: true },
  SdRepeatZX: { x: true, y: false, z: true },
};

/**
 * Evaluates the SDF graph stored in `RaymarchingComponent.rrnJson`.
 *
 * The graph is evaluated in the same space as the raymarching shader:
 * `InitialPosition` is the world-space ray position, and
 * `SdApplyWorldMatrix` maps positions into the component entity's local space
 * with the inverse world matrix. The evaluator supports the SDF node set that
 * the raymarching node editor exposes.
 *
 * Bounds are conservative. A graph that contains an infinite primitive
 * (`SdBar*`, `SdTube*`) or an infinite repetition (`SdRepeat*`) has no finite
 * bounds and {@link calcBounds} returns null. Picking still works for those
 * graphs because sphere tracing does not require bounds.
 */
export class RaymarchingSdfEvaluator {
  private __nodes = new Map<string, NodeJSONNode>();
  private __inputLinks = new Map<string, Map<string, string>>();
  private __outputNodes: NodeJSONNode[] = [];
  private __worldMatrix: Matrix44;
  private __inverseWorldMatrix: Matrix44;
  private __uniformValueProvider?: RaymarchingUniformValueProvider;

  private __scalarCache = new Map<string, number | null>();
  private __vec3Cache = new Map<string, Vector3 | null>();
  private __transformCache = new Map<string, Matrix44 | null>();
  private __inverseTransformCache = new Map<string, Matrix44 | null>();
  private __boundsCache = new Map<string, AABB | null>();
  private __positionChainCache = new Map<string, Matrix44 | null>();

  /**
   * Creates an evaluator for one raymarching component.
   * @param nodeJson - The node graph stored in `RaymarchingComponent.rrnJson`
   * @param worldMatrix - The component entity's world matrix (`sceneGraph.matrixInner`)
   * @param uniformValueProvider - Optional resolver for Uniform node values
   */
  constructor(nodeJson: NodeJSON, worldMatrix: IMatrix44, uniformValueProvider?: RaymarchingUniformValueProvider) {
    this.__worldMatrix = Matrix44.fromCopyMatrix44(worldMatrix);
    this.__inverseWorldMatrix = Matrix44.invert(this.__worldMatrix);
    this.__uniformValueProvider = uniformValueProvider;

    for (const node of nodeJson.nodes) {
      this.__nodes.set(node.id, node);
    }
    for (const connection of nodeJson.connections) {
      let links = this.__inputLinks.get(connection.to.id);
      if (links == null) {
        links = new Map();
        this.__inputLinks.set(connection.to.id, links);
      }
      links.set(connection.to.portName, connection.from.id);
    }
    this.__outputNodes = nodeJson.nodes.filter(node => node.name === 'OutUnion' || node.name === 'OutDistance');
  }

  /**
   * Calculates a conservative world-space AABB of the SDF graph.
   * @returns The world-space bounds, or null when the graph is unbounded or
   * contains a node the evaluator does not understand.
   */
  calcBounds(): AABB | null {
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
   * Evaluates the signed distance at a world-space point.
   * @param pointInWorld - The point to evaluate
   * @returns The signed distance, or null when the graph is unsupported
   */
  evalDistanceAt(pointInWorld: Vector3): number | null {
    if (this.__outputNodes.length === 0) {
      return null;
    }

    let distance = Number.POSITIVE_INFINITY;
    for (const output of this.__outputNodes) {
      const value = this.__evalDistanceNode(output, pointInWorld);
      if (value == null) {
        return null;
      }
      distance = Math.min(distance, value);
    }

    return Number.isFinite(distance) ? distance : null;
  }

  /**
   * Marches a ray against the SDF graph.
   * @param originInWorld - Ray origin in world space
   * @param directionInWorld - Ray direction in world space
   * @param options - Marching options
   * @returns The hit, null for a miss, or undefined when the graph is unsupported
   */
  marchRay(
    originInWorld: Vector3,
    directionInWorld: Vector3,
    options: RaymarchingRaycastOptions = {}
  ): RaymarchingRaycastHit | null | undefined {
    const length = directionInWorld.length();
    if (!Number.isFinite(length) || length === 0) {
      return null;
    }
    const direction = Vector3.multiply(directionInWorld, 1 / length);

    let tStart = 0;
    let tEnd = options.maxDistance ?? 10000;

    const bounds = this.calcBounds();
    if (bounds != null) {
      const interval = RaymarchingSdfEvaluator.intersectRayAabb(originInWorld, direction, bounds);
      if (interval == null) {
        return null;
      }
      tStart = Math.max(tStart, interval[0]);
      tEnd = Math.min(tEnd, interval[1]);
      if (tEnd < tStart) {
        return null;
      }
    }

    const epsilon = options.epsilon ?? 0.001;
    const maxSteps = options.maxSteps ?? 256;
    let t = tStart;

    for (let i = 0; i < maxSteps; i++) {
      const point = Vector3.fromCopy3(
        originInWorld.x + direction.x * t,
        originInWorld.y + direction.y * t,
        originInWorld.z + direction.z * t
      );
      const distance = this.evalDistanceAt(point);
      if (distance == null) {
        return undefined;
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

  private __inputNode(nodeId: string, portName: string): NodeJSONNode | undefined {
    const fromId = this.__inputLinks.get(nodeId)?.get(portName);
    return fromId == null ? undefined : this.__nodes.get(fromId);
  }

  private __controlValue(node: NodeJSONNode, key: string): unknown {
    return node.controls?.[key]?.value;
  }

  private __toNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (value != null && typeof value === 'object') {
      const x = (value as { x?: unknown }).x;
      if (typeof x === 'number' && Number.isFinite(x)) {
        return x;
      }
    }
    return null;
  }

  private __toVector3(value: unknown): Vector3 | null {
    if (Array.isArray(value) && value.length >= 3) {
      const x = value[0];
      const y = value[1];
      const z = value[2];
      if (
        typeof x === 'number' &&
        Number.isFinite(x) &&
        typeof y === 'number' &&
        Number.isFinite(y) &&
        typeof z === 'number' &&
        Number.isFinite(z)
      ) {
        return Vector3.fromCopy3(x, y, z);
      }
      return null;
    }
    if (value != null && typeof value === 'object') {
      const vector = value as { x?: unknown; y?: unknown; z?: unknown };
      if (
        typeof vector.x === 'number' &&
        Number.isFinite(vector.x) &&
        typeof vector.y === 'number' &&
        Number.isFinite(vector.y) &&
        typeof vector.z === 'number' &&
        Number.isFinite(vector.z)
      ) {
        return Vector3.fromCopy3(vector.x, vector.y, vector.z);
      }
    }
    return null;
  }

  private __uniformValue(name: string): unknown {
    if (this.__uniformValueProvider == null) {
      return undefined;
    }
    try {
      return this.__uniformValueProvider(name);
    } catch {
      return undefined;
    }
  }

  private __readScalarNodeValue(node: NodeJSONNode): number | null {
    switch (node.name) {
      case 'ConstantScalarFloat':
      case 'ConstantScalarUint':
        return this.__toNumber(this.__controlValue(node, 'in1'));
      case 'ConstantScalarBool': {
        const value = this.__controlValue(node, 'in1');
        if (typeof value === 'boolean') {
          return value ? 1 : 0;
        }
        return this.__toNumber(value);
      }
      case 'UniformScalarFloat': {
        const name = node.controls?.name?.value;
        if (typeof name === 'string') {
          const value = this.__toNumber(this.__uniformValue(name));
          if (value != null) {
            return value;
          }
        }
        return this.__toNumber(this.__controlValue(node, 'initialValue'));
      }
      default:
        return null;
    }
  }

  private __readVec3NodeValue(node: NodeJSONNode): Vector3 | null {
    switch (node.name) {
      case 'ConstantVector3Float': {
        const x = this.__toNumber(this.__controlValue(node, 'in1'));
        const y = this.__toNumber(this.__controlValue(node, 'in2'));
        const z = this.__toNumber(this.__controlValue(node, 'in3'));
        if (x == null || y == null || z == null) {
          return null;
        }
        return Vector3.fromCopy3(x, y, z);
      }
      case 'UniformVector3Float': {
        const name = node.controls?.name?.value;
        if (typeof name === 'string') {
          const value = this.__toVector3(this.__uniformValue(name));
          if (value != null) {
            return value;
          }
        }
        const x = this.__toNumber(this.__controlValue(node, 'initialX'));
        const y = this.__toNumber(this.__controlValue(node, 'initialY'));
        const z = this.__toNumber(this.__controlValue(node, 'initialZ'));
        if (x == null || y == null || z == null) {
          return null;
        }
        return Vector3.fromCopy3(x, y, z);
      }
      default:
        return null;
    }
  }

  private __readScalarInput(node: NodeJSONNode, portName: string, fallback: number): number | null {
    const cacheKey = `${node.id}:${portName}`;
    if (this.__scalarCache.has(cacheKey)) {
      return this.__scalarCache.get(cacheKey)!;
    }

    const source = this.__inputNode(node.id, portName);
    const value = source == null ? fallback : this.__readScalarNodeValue(source);

    this.__scalarCache.set(cacheKey, value);
    return value;
  }

  private __readVec3Input(node: NodeJSONNode, portName: string, fallback: Vector3): Vector3 | null {
    const cacheKey = `${node.id}:${portName}`;
    if (this.__vec3Cache.has(cacheKey)) {
      return this.__vec3Cache.get(cacheKey)!;
    }

    const source = this.__inputNode(node.id, portName);
    const value = source == null ? fallback : this.__readVec3NodeValue(source);

    this.__vec3Cache.set(cacheKey, value);
    return value;
  }

  private __getTransform(node: NodeJSONNode): Matrix44 | null {
    if (this.__transformCache.has(node.id)) {
      return this.__transformCache.get(node.id)!;
    }

    const translation = this.__readVec3Input(node, 'translation', ZERO);
    const euler = this.__readVec3Input(node, 'xyzEulerAngles', ZERO);
    const scale = this.__readVec3Input(node, 'scale', ONE);

    let transform: Matrix44 | null = null;
    if (translation != null && euler != null && scale != null) {
      // Match createTransformMatrix in RaymarchingShaderPart:
      // rotateX(euler.x) * rotateY(euler.y) * rotateZ(euler.z).
      //
      // The shader builds each rotation with a column-major mat3 constructor
      // whose arguments are the standard rotation matrix written in row-major
      // order. The resulting GLSL/WGSL matrix is therefore the transpose of
      // Matrix44.rotateX/Y/Z, which equals the rotation by the negated angle.
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

  private __getInverseTransform(node: NodeJSONNode): Matrix44 | null {
    if (this.__inverseTransformCache.has(node.id)) {
      return this.__inverseTransformCache.get(node.id)!;
    }

    const transform = this.__getTransform(node);
    const inverse = transform == null ? null : Matrix44.invert(transform);
    this.__inverseTransformCache.set(node.id, inverse);
    return inverse;
  }

  private __evalPositionForDistance(node: NodeJSONNode, pointInWorld: Vector3): Vector3 | null {
    const positionNode = this.__inputNode(node.id, 'position');
    if (positionNode == null) {
      // An unconnected position socket uses its default value (0, 0, 0).
      return ZERO;
    }
    return this.__evalPositionOutput(positionNode, pointInWorld);
  }

  private __evalPositionOutput(node: NodeJSONNode, pointInWorld: Vector3): Vector3 | null {
    switch (node.name) {
      case 'InitialPosition':
        return pointInWorld;
      case 'SdApplyTransform': {
        const parent = this.__inputNode(node.id, 'position');
        const input = parent == null ? ZERO : this.__evalPositionOutput(parent, pointInWorld);
        if (input == null) {
          return null;
        }
        const inverse = this.__getInverseTransform(node);
        return inverse == null ? null : inverse.multiplyVector3(input);
      }
      case 'SdApplyWorldMatrix': {
        const parent = this.__inputNode(node.id, 'position');
        const input = parent == null ? ZERO : this.__evalPositionOutput(parent, pointInWorld);
        if (input == null) {
          return null;
        }
        return this.__inverseWorldMatrix.multiplyVector3(input);
      }
      case 'SdRepeat':
      case 'SdRepeatX':
      case 'SdRepeatY':
      case 'SdRepeatZ':
      case 'SdRepeatXY':
      case 'SdRepeatYZ':
      case 'SdRepeatZX': {
        const parent = this.__inputNode(node.id, 'position');
        const input = parent == null ? ZERO : this.__evalPositionOutput(parent, pointInWorld);
        if (input == null) {
          return null;
        }
        const interval = this.__readScalarInput(node, 'interval', 1);
        if (interval == null || interval === 0) {
          return null;
        }
        const axes = REPEAT_AXES[node.name];
        const wrap = (value: number, enabled: boolean) => {
          if (!enabled) {
            return value;
          }
          const scaled = value / interval;
          return (scaled - Math.floor(scaled) - 0.5) * interval;
        };
        return Vector3.fromCopy3(wrap(input.x, axes.x), wrap(input.y, axes.y), wrap(input.z, axes.z));
      }
      default:
        return null;
    }
  }

  private __evalDistanceNode(node: NodeJSONNode, pointInWorld: Vector3): number | null {
    switch (node.name) {
      case 'SdSphere': {
        const position = this.__evalPositionForDistance(node, pointInWorld);
        const radius = this.__readScalarInput(node, 'radius', 1);
        if (position == null || radius == null) {
          return null;
        }
        return position.length() - radius;
      }
      case 'SdBox': {
        const position = this.__evalPositionForDistance(node, pointInWorld);
        const size = this.__readVec3Input(node, 'size', ONE);
        if (position == null || size == null) {
          return null;
        }
        const qx = Math.abs(position.x) - size.x;
        const qy = Math.abs(position.y) - size.y;
        const qz = Math.abs(position.z) - size.z;
        return (
          Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, Math.max(qy, qz)), 0)
        );
      }
      case 'SdBarX': {
        const position = this.__evalPositionForDistance(node, pointInWorld);
        const width = this.__readScalarInput(node, 'width', 1);
        if (position == null || width == null) {
          return null;
        }
        return Math.hypot(Math.max(Math.abs(position.y) - width, 0), Math.max(Math.abs(position.z) - width, 0));
      }
      case 'SdBarY': {
        const position = this.__evalPositionForDistance(node, pointInWorld);
        const width = this.__readScalarInput(node, 'width', 1);
        if (position == null || width == null) {
          return null;
        }
        return Math.hypot(Math.max(Math.abs(position.x) - width, 0), Math.max(Math.abs(position.z) - width, 0));
      }
      case 'SdBarZ': {
        const position = this.__evalPositionForDistance(node, pointInWorld);
        const width = this.__readScalarInput(node, 'width', 1);
        if (position == null || width == null) {
          return null;
        }
        return Math.hypot(Math.max(Math.abs(position.x) - width, 0), Math.max(Math.abs(position.y) - width, 0));
      }
      case 'SdTubeX': {
        const position = this.__evalPositionForDistance(node, pointInWorld);
        const width = this.__readScalarInput(node, 'width', 1);
        if (position == null || width == null) {
          return null;
        }
        return Math.hypot(position.y, position.z) - width;
      }
      case 'SdTubeY': {
        const position = this.__evalPositionForDistance(node, pointInWorld);
        const width = this.__readScalarInput(node, 'width', 1);
        if (position == null || width == null) {
          return null;
        }
        return Math.hypot(position.x, position.z) - width;
      }
      case 'SdTubeZ': {
        const position = this.__evalPositionForDistance(node, pointInWorld);
        const width = this.__readScalarInput(node, 'width', 1);
        if (position == null || width == null) {
          return null;
        }
        return Math.hypot(position.x, position.y) - width;
      }
      case 'OpUnion': {
        const lhsNode = this.__inputNode(node.id, 'lhs');
        const rhsNode = this.__inputNode(node.id, 'rhs');
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
      case 'OpSubtraction': {
        const baseNode = this.__inputNode(node.id, 'base');
        const subtractorNode = this.__inputNode(node.id, 'subtractor');
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
      case 'OutUnion':
      case 'OutDistance': {
        const inputNode = this.__inputNode(node.id, 'in1') ?? this.__inputNode(node.id, 'value');
        return inputNode == null ? null : this.__evalDistanceNode(inputNode, pointInWorld);
      }
      default:
        return this.__readScalarNodeValue(node);
    }
  }

  private __evalBoundsNode(node: NodeJSONNode): AABB | null {
    if (this.__boundsCache.has(node.id)) {
      const cached = this.__boundsCache.get(node.id)!;
      return cached == null ? null : cached.clone();
    }

    let bounds: AABB | null = null;
    switch (node.name) {
      case 'SdSphere': {
        const radius = this.__readScalarInput(node, 'radius', 1);
        bounds = radius == null ? null : this.__evalSphereBounds(node, Math.abs(radius));
        break;
      }
      case 'SdBox': {
        const size = this.__readVec3Input(node, 'size', ONE);
        if (size != null) {
          bounds = this.__evalPrimitiveBounds(
            node,
            Vector3.fromCopy3(Math.abs(size.x), Math.abs(size.y), Math.abs(size.z))
          );
        }
        break;
      }
      case 'SdBarX':
      case 'SdBarY':
      case 'SdBarZ':
      case 'SdTubeX':
      case 'SdTubeY':
      case 'SdTubeZ':
        // Infinite along the bar/tube axis.
        bounds = null;
        break;
      case 'OpUnion': {
        const lhsNode = this.__inputNode(node.id, 'lhs');
        const rhsNode = this.__inputNode(node.id, 'rhs');
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
      case 'OpSubtraction': {
        // base - subtractor is a subset of base.
        const baseNode = this.__inputNode(node.id, 'base');
        bounds = baseNode == null ? null : this.__evalBoundsNode(baseNode);
        break;
      }
      case 'OutUnion':
      case 'OutDistance': {
        const inputNode = this.__inputNode(node.id, 'in1') ?? this.__inputNode(node.id, 'value');
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
  private __evalSphereBounds(node: NodeJSONNode, radius: number): AABB | null {
    const positionNode = this.__inputNode(node.id, 'position');
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
    return bounds;
  }

  private __evalPrimitiveBounds(node: NodeJSONNode, halfExtents: Vector3): AABB | null {
    const positionNode = this.__inputNode(node.id, 'position');
    if (positionNode == null) {
      // A primitive without a position source is a constant field, not a shape.
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
    return worldBounds.isVanilla() ? null : worldBounds;
  }

  /**
   * Returns the matrix that maps the output space of a position node to world space.
   * `SdApplyTransform` and `SdApplyWorldMatrix` store the inverse transform in the
   * position chain, so the forward transform is the composition `parent * transform`.
   */
  private __positionChainToWorld(node: NodeJSONNode): Matrix44 | null {
    if (this.__positionChainCache.has(node.id)) {
      return this.__positionChainCache.get(node.id)!;
    }

    let chain: Matrix44 | null = null;
    switch (node.name) {
      case 'InitialPosition':
        chain = Matrix44.fromCopyMatrix44(IDENTITY_MATRIX);
        break;
      case 'SdApplyTransform': {
        const parent = this.__inputNode(node.id, 'position');
        const parentChain = parent == null ? null : this.__positionChainToWorld(parent);
        const transform = this.__getTransform(node);
        if (parentChain != null && transform != null) {
          chain = Matrix44.multiply(parentChain, transform);
        }
        break;
      }
      case 'SdApplyWorldMatrix': {
        const parent = this.__inputNode(node.id, 'position');
        const parentChain = parent == null ? null : this.__positionChainToWorld(parent);
        if (parentChain != null) {
          chain = Matrix44.multiply(parentChain, this.__worldMatrix);
        }
        break;
      }
      default:
        // Repeat nodes create infinite repetitions and have no finite world AABB.
        chain = null;
    }

    this.__positionChainCache.set(node.id, chain);
    return chain;
  }

  /**
   * Intersects a normalized ray with an AABB.
   * @returns The entry and exit distances, or null when the ray misses
   */
  static intersectRayAabb(origin: Vector3, direction: Vector3, aabb: AABB): [number, number] | null {
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
}
