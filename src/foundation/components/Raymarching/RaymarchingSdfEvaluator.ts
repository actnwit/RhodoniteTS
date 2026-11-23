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

/**
 * A single sphere primitive extracted from an SDF graph.
 */
export type RaymarchingSpherePrimitive = {
  /** Sphere center in the evaluator's output space. */
  center: Vector3;
  /** Conservative sphere radius in the evaluator's output space. */
  radius: number;
  /** Whether the sphere's position chain contains SdApplyWorldMatrix. */
  usesWorldMatrix: boolean;
};

const ZERO = Vector3.fromCopy3(0, 0, 0);
const ONE = Vector3.fromCopy3(1, 1, 1);
const DEFAULT_CAPSULE_POINT_A = Vector3.fromCopy3(0, -0.5, 0);
const DEFAULT_CAPSULE_POINT_B = Vector3.fromCopy3(0, 0.5, 0);
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
 * Non-linear domain nodes cannot be represented by a matrix.
 * Maps each node to the pair of axes its rotation mixes.
 */
const NON_LINEAR_ROTATED_AXES: Record<string, 'yz' | 'xz' | 'xy'> = {
  TwistX: 'yz',
  TwistY: 'xz',
  TwistZ: 'xy',
  BendXY: 'xy',
  BendXZ: 'xz',
  BendYZ: 'yz',
  BendYX: 'xy',
  BendZX: 'xz',
  BendZY: 'yz',
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
  private __terminalTransformScaleCache = new Map<string, number | null>();
  private __distanceScaleFactor = 1;
  private __usesWorldMatrix = false;

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

    // The graph's distance is evaluated in the space produced by SdApplyWorldMatrix,
    // so it has to be converted to a conservative world-space distance. The factor is
    // a lower bound of the smallest singular value of the world matrix M, mirroring
    // rnRaymarchDistanceScale in the shared shader:
    // - For a rotation and a (non-uniform) scale, the column lengths are the singular
    //   values, so their minimum is exact.
    // - A sheared matrix (a non-uniformly scaled parent with a rotated child) uses
    //   1/||M^-1||_F, a lower bound of the smallest singular value.
    const world = this.__worldMatrix;
    const axisX = [world.m00, world.m10, world.m20];
    const axisY = [world.m01, world.m11, world.m21];
    const axisZ = [world.m02, world.m12, world.m22];
    const lenX = Math.hypot(axisX[0], axisX[1], axisX[2]);
    const lenY = Math.hypot(axisY[0], axisY[1], axisY[2]);
    const lenZ = Math.hypot(axisZ[0], axisZ[1], axisZ[2]);
    const orthoError =
      Math.abs(axisX[0] * axisY[0] + axisX[1] * axisY[1] + axisX[2] * axisY[2]) +
      Math.abs(axisX[0] * axisZ[0] + axisX[1] * axisZ[1] + axisX[2] * axisZ[2]) +
      Math.abs(axisY[0] * axisZ[0] + axisY[1] * axisZ[1] + axisY[2] * axisZ[2]);
    const orthoTolerance = 0.0001 * (lenX * lenY + lenX * lenZ + lenY * lenZ);
    let localToWorldScale: number;
    if (orthoError <= orthoTolerance) {
      localToWorldScale = Math.min(lenX, lenY, lenZ);
    } else {
      const inverse = this.__inverseWorldMatrix;
      const frobeniusSq =
        inverse.m00 ** 2 +
        inverse.m10 ** 2 +
        inverse.m20 ** 2 +
        inverse.m01 ** 2 +
        inverse.m11 ** 2 +
        inverse.m21 ** 2 +
        inverse.m02 ** 2 +
        inverse.m12 ** 2 +
        inverse.m22 ** 2;
      localToWorldScale = 1 / Math.sqrt(Math.max(frobeniusSq, 0.00000001));
    }
    this.__distanceScaleFactor = Math.max(Math.min(1, localToWorldScale), 0.0001);
    this.__usesWorldMatrix = this.__outputNodes.some(node => this.__distanceNodeUsesWorldMatrix(node, new Set()));
  }

  /**
   * Returns true when the distance subtree of a node contains SdApplyWorldMatrix.
   * The rendering shader applies the world-space distance correction to a component
   * whose graph uses it, so the CPU evaluator does the same.
   * @param node - Root of the distance subtree
   * @param visited - Node ids already visited
   */
  private __distanceNodeUsesWorldMatrix(node: NodeJSONNode, visited: Set<string>): boolean {
    if (node.name === 'SdApplyWorldMatrix') {
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
  calcSphere(): RaymarchingSpherePrimitive | null {
    if (this.__outputNodes.length !== 1) {
      return null;
    }

    const output = this.__outputNodes[0];
    const inputNode = this.__inputNode(output.id, 'in1') ?? this.__inputNode(output.id, 'value');
    if (inputNode == null || inputNode.name !== 'SdSphere') {
      return null;
    }

    const radius = this.__readScalarInput(inputNode, 'radius', 1);
    if (radius == null) {
      return null;
    }

    const positionNode = this.__inputNode(inputNode.id, 'position');
    if (positionNode == null) {
      return null;
    }
    if (this.__positionChainHasNonLinearNode(positionNode)) {
      // A twisted or bent sphere is not a sphere anymore.
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
      usesWorldMatrix: this.__positionChainUsesWorldMatrix(positionNode),
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
   * Input ports that carry the SDF's spatial data (position or distance). The same
   * set is followed by the shared shader when it links `SdApplyTransform` scale
   * globals to a terminal.
   */
  private static readonly __SPATIAL_INPUT_PORTS = new Set([
    'position',
    'lhs',
    'rhs',
    'base',
    'subtractor',
    'value',
    'in1',
  ]);

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
  private __terminalTransformScale(terminal: NodeJSONNode): number | null {
    if (this.__terminalTransformScaleCache.has(terminal.id)) {
      return this.__terminalTransformScaleCache.get(terminal.id)!;
    }

    let scale = 1;
    const visited = new Set<string>();
    const stack: string[] = [];
    const pushSpatialInputs = (nodeId: string) => {
      const links = this.__inputLinks.get(nodeId);
      if (links == null) {
        return;
      }
      for (const [portName, fromId] of links) {
        if (RaymarchingSdfEvaluator.__SPATIAL_INPUT_PORTS.has(portName)) {
          stack.push(fromId);
        }
      }
    };

    pushSpatialInputs(terminal.id);
    while (stack.length > 0) {
      const nodeId = stack.pop()!;
      if (visited.has(nodeId)) {
        continue;
      }
      visited.add(nodeId);
      const node = this.__nodes.get(nodeId);
      if (node == null) {
        continue;
      }
      if (node.name === 'SdApplyTransform') {
        const transformScale = this.__readVec3Input(node, 'scale', ONE);
        if (transformScale == null) {
          this.__terminalTransformScaleCache.set(terminal.id, null);
          return null;
        }
        const axisScale = Math.min(Math.abs(transformScale.x), Math.abs(transformScale.y), Math.abs(transformScale.z));
        scale *= Math.max(Math.min(1, axisScale), 0.0001);
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
      case 'TwistX': {
        const parent = this.__inputNode(node.id, 'position');
        const input = parent == null ? ZERO : this.__evalPositionOutput(parent, pointInWorld);
        if (input == null) {
          return null;
        }
        const strength = this.__readScalarInput(node, 'strength', 0.5);
        if (strength == null) {
          return null;
        }
        const angle = strength * input.x;
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return Vector3.fromCopy3(input.x, c * input.y - s * input.z, s * input.y + c * input.z);
      }
      case 'TwistY': {
        const parent = this.__inputNode(node.id, 'position');
        const input = parent == null ? ZERO : this.__evalPositionOutput(parent, pointInWorld);
        if (input == null) {
          return null;
        }
        const strength = this.__readScalarInput(node, 'strength', 0.5);
        if (strength == null) {
          return null;
        }
        const angle = strength * input.y;
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return Vector3.fromCopy3(c * input.x - s * input.z, input.y, s * input.x + c * input.z);
      }
      case 'TwistZ': {
        const parent = this.__inputNode(node.id, 'position');
        const input = parent == null ? ZERO : this.__evalPositionOutput(parent, pointInWorld);
        if (input == null) {
          return null;
        }
        const strength = this.__readScalarInput(node, 'strength', 0.5);
        if (strength == null) {
          return null;
        }
        const angle = strength * input.z;
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return Vector3.fromCopy3(c * input.x - s * input.y, s * input.x + c * input.y, input.z);
      }
      case 'BendXY': {
        const parent = this.__inputNode(node.id, 'position');
        const input = parent == null ? ZERO : this.__evalPositionOutput(parent, pointInWorld);
        if (input == null) {
          return null;
        }
        const strength = this.__readScalarInput(node, 'strength', 0.5);
        if (strength == null) {
          return null;
        }
        const angle = strength * input.x;
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return Vector3.fromCopy3(c * input.x - s * input.y, s * input.x + c * input.y, input.z);
      }
      case 'BendXZ': {
        const parent = this.__inputNode(node.id, 'position');
        const input = parent == null ? ZERO : this.__evalPositionOutput(parent, pointInWorld);
        if (input == null) {
          return null;
        }
        const strength = this.__readScalarInput(node, 'strength', 0.5);
        if (strength == null) {
          return null;
        }
        const angle = strength * input.x;
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return Vector3.fromCopy3(c * input.x - s * input.z, input.y, s * input.x + c * input.z);
      }
      case 'BendYZ': {
        const parent = this.__inputNode(node.id, 'position');
        const input = parent == null ? ZERO : this.__evalPositionOutput(parent, pointInWorld);
        if (input == null) {
          return null;
        }
        const strength = this.__readScalarInput(node, 'strength', 0.5);
        if (strength == null) {
          return null;
        }
        const angle = strength * input.y;
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return Vector3.fromCopy3(input.x, c * input.y - s * input.z, s * input.y + c * input.z);
      }
      case 'BendYX': {
        const parent = this.__inputNode(node.id, 'position');
        const input = parent == null ? ZERO : this.__evalPositionOutput(parent, pointInWorld);
        if (input == null) {
          return null;
        }
        const strength = this.__readScalarInput(node, 'strength', 0.5);
        if (strength == null) {
          return null;
        }
        const angle = strength * input.y;
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return Vector3.fromCopy3(s * input.y + c * input.x, c * input.y - s * input.x, input.z);
      }
      case 'BendZX': {
        const parent = this.__inputNode(node.id, 'position');
        const input = parent == null ? ZERO : this.__evalPositionOutput(parent, pointInWorld);
        if (input == null) {
          return null;
        }
        const strength = this.__readScalarInput(node, 'strength', 0.5);
        if (strength == null) {
          return null;
        }
        const angle = strength * input.z;
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return Vector3.fromCopy3(s * input.z + c * input.x, input.y, c * input.z - s * input.x);
      }
      case 'BendZY': {
        const parent = this.__inputNode(node.id, 'position');
        const input = parent == null ? ZERO : this.__evalPositionOutput(parent, pointInWorld);
        if (input == null) {
          return null;
        }
        const strength = this.__readScalarInput(node, 'strength', 0.5);
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
      case 'SdTorus': {
        const position = this.__evalPositionForDistance(node, pointInWorld);
        const radius = this.__readScalarInput(node, 'radius', 1);
        const tubeRadius = this.__readScalarInput(node, 'tubeRadius', 0.25);
        if (position == null || radius == null || tubeRadius == null) {
          return null;
        }
        return Math.hypot(Math.hypot(position.x, position.z) - radius, position.y) - tubeRadius;
      }
      case 'SdCapsule': {
        const position = this.__evalPositionForDistance(node, pointInWorld);
        const pointA = this.__readVec3Input(node, 'pointA', DEFAULT_CAPSULE_POINT_A);
        const pointB = this.__readVec3Input(node, 'pointB', DEFAULT_CAPSULE_POINT_B);
        const radius = this.__readScalarInput(node, 'radius', 0.5);
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
      case 'SdRoundBox': {
        const position = this.__evalPositionForDistance(node, pointInWorld);
        const size = this.__readVec3Input(node, 'size', ONE);
        const radius = this.__readScalarInput(node, 'radius', 0.25);
        if (position == null || size == null || radius == null) {
          return null;
        }
        const qx = Math.abs(position.x) - size.x;
        const qy = Math.abs(position.y) - size.y;
        const qz = Math.abs(position.z) - size.z;
        return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) - radius;
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
      case 'OpSmoothUnion':
      case 'OpSmoothIntersection': {
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
        const smoothness = this.__readScalarInput(node, 'smoothness', 0.1);
        if (smoothness == null) {
          return null;
        }
        const k = Math.max(smoothness, 0.0001);
        if (node.name === 'OpSmoothUnion') {
          const h = Math.min(Math.max(0.5 + (0.5 * (rhs - lhs)) / k, 0), 1);
          return rhs + (lhs - rhs) * h - k * h * (1 - h);
        }
        const h = Math.min(Math.max(0.5 - (0.5 * (rhs - lhs)) / k, 0), 1);
        return rhs + (lhs - rhs) * h + k * h * (1 - h);
      }
      case 'OpSmoothSubtraction': {
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
        const smoothness = this.__readScalarInput(node, 'smoothness', 0.1);
        if (smoothness == null) {
          return null;
        }
        const k = Math.max(smoothness, 0.0001);
        const h = Math.min(Math.max(0.5 - (0.5 * (subtractor + base)) / k, 0), 1);
        return base + (-subtractor - base) * h + k * h * (1 - h);
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
      case 'SdTorus': {
        const radius = this.__readScalarInput(node, 'radius', 1);
        const tubeRadius = this.__readScalarInput(node, 'tubeRadius', 0.25);
        if (radius != null && tubeRadius != null) {
          const outer = Math.abs(radius) + Math.abs(tubeRadius);
          const inner = Math.abs(tubeRadius);
          bounds = this.__evalPrimitiveBounds(node, Vector3.fromCopy3(outer, inner, outer));
        }
        break;
      }
      case 'SdCapsule': {
        const pointA = this.__readVec3Input(node, 'pointA', DEFAULT_CAPSULE_POINT_A);
        const pointB = this.__readVec3Input(node, 'pointB', DEFAULT_CAPSULE_POINT_B);
        const radius = this.__readScalarInput(node, 'radius', 0.5);
        if (pointA != null && pointB != null && radius != null) {
          // Conservative bound around the origin: the segment endpoints expanded by the radius.
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
      case 'SdRoundBox': {
        const size = this.__readVec3Input(node, 'size', ONE);
        const radius = this.__readScalarInput(node, 'radius', 0.25);
        if (size != null && radius != null) {
          const r = Math.abs(radius);
          bounds = this.__evalPrimitiveBounds(
            node,
            Vector3.fromCopy3(Math.abs(size.x) + r, Math.abs(size.y) + r, Math.abs(size.z) + r)
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
      case 'OpSmoothUnion': {
        const lhsNode = this.__inputNode(node.id, 'lhs');
        const rhsNode = this.__inputNode(node.id, 'rhs');
        const smoothness = this.__readScalarInput(node, 'smoothness', 0.1);
        if (lhsNode != null && rhsNode != null && smoothness != null) {
          const lhs = this.__evalBoundsNode(lhsNode);
          const rhs = this.__evalBoundsNode(rhsNode);
          if (lhs != null && rhs != null) {
            const merged = lhs.clone();
            merged.mergeAABB(rhs);
            // The smooth blend can extend slightly outside the union of the inputs.
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
      case 'OpSmoothSubtraction': {
        // base - subtractor is a subset of base.
        const baseNode = this.__inputNode(node.id, 'base');
        bounds = baseNode == null ? null : this.__evalBoundsNode(baseNode);
        break;
      }
      case 'OpSmoothIntersection': {
        const lhsNode = this.__inputNode(node.id, 'lhs');
        const rhsNode = this.__inputNode(node.id, 'rhs');
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
    return this.__expandBoundsForNonLinearChain(node, bounds);
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
    if (worldBounds.isVanilla()) {
      return null;
    }
    return this.__expandBoundsForNonLinearChain(node, worldBounds);
  }

  /**
   * Returns true when a position chain contains a non-linear domain node
   * (TwistX/Y/Z or BendXY/XZ/YZ/YX/ZX/ZY), which cannot be represented by a matrix.
   */
  private __positionChainHasNonLinearNode(node: NodeJSONNode): boolean {
    const visited = new Set<string>();
    const stack: NodeJSONNode[] = [node];
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (visited.has(current.id)) {
        continue;
      }
      visited.add(current.id);
      if (current.name in NON_LINEAR_ROTATED_AXES) {
        return true;
      }
      const parent = this.__inputNode(current.id, 'position');
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
  private __expandBoundsForNonLinearChain(node: NodeJSONNode, bounds: AABB): AABB {
    const positionNode = this.__inputNode(node.id, 'position');
    if (positionNode == null || !this.__positionChainHasNonLinearNode(positionNode)) {
      return bounds;
    }

    const rotatedAxes = new Set<'yz' | 'xz' | 'xy'>();
    const visited = new Set<string>();
    const stack: NodeJSONNode[] = [positionNode];
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (visited.has(current.id)) {
        continue;
      }
      visited.add(current.id);
      const axes = NON_LINEAR_ROTATED_AXES[current.name];
      if (axes != null) {
        rotatedAxes.add(axes);
      }
      const parent = this.__inputNode(current.id, 'position');
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
    if (rotatedAxes.has('yz')) {
      const rho = Math.hypot(Math.max(Math.abs(minY), Math.abs(maxY)), Math.max(Math.abs(minZ), Math.abs(maxZ)));
      minY = -rho;
      maxY = rho;
      minZ = -rho;
      maxZ = rho;
    }
    if (rotatedAxes.has('xz')) {
      const rho = Math.hypot(Math.max(Math.abs(minX), Math.abs(maxX)), Math.max(Math.abs(minZ), Math.abs(maxZ)));
      minX = -rho;
      maxX = rho;
      minZ = -rho;
      maxZ = rho;
    }
    if (rotatedAxes.has('xy')) {
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
  private __positionChainUsesWorldMatrix(node: NodeJSONNode): boolean {
    const visited = new Set<string>();
    let current: NodeJSONNode | undefined = node;
    while (current != null && !visited.has(current.id)) {
      if (current.name === 'SdApplyWorldMatrix') {
        return true;
      }
      visited.add(current.id);
      current = this.__inputNode(current.id, 'position');
    }
    return false;
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
      case 'TwistX':
      case 'TwistY':
      case 'TwistZ':
      case 'BendXY':
      case 'BendXZ':
      case 'BendYZ':
      case 'BendYX':
      case 'BendZX':
      case 'BendZY': {
        // Non-linear domain nodes cannot be represented by a matrix. For bounds they are
        // folded in as identity and expanded conservatively by __expandBoundsForNonLinearChain.
        // calcSphere() rejects graphs that contain them, so exact picking is not affected.
        const parent = this.__inputNode(node.id, 'position');
        chain = parent == null ? Matrix44.fromCopyMatrix44(IDENTITY_MATRIX) : this.__positionChainToWorld(parent);
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
