import type { AxisDescriptor } from '../geometry/shapes/Axis';
import { type CapsuleDescriptor } from '../geometry/shapes/Capsule';
import { type ConeDescriptor } from '../geometry/shapes/Cone';
import { type CubeDescriptor } from '../geometry/shapes/Cube';
import { type CylinderDescriptor } from '../geometry/shapes/Cylinder';
import { type GridDescriptor } from '../geometry/shapes/Grid';
import type { IShape } from '../geometry/shapes/IShape';
import { type JointDescriptor } from '../geometry/shapes/Joint';
import { type LineDescriptor } from '../geometry/shapes/Line';
import { type PlaneDescriptor } from '../geometry/shapes/Plane';
import { type RingDescriptor } from '../geometry/shapes/Ring';
import { type SphereDescriptor } from '../geometry/shapes/Sphere';
import type { Engine } from '../system/Engine';
import type { IMeshEntity } from './EntityHelper';
/**
 * Creates a plane mesh entity with configurable orientation.
 *
 * @param engine - The engine instance
 * @param desc - Configuration object for the plane
 * @param desc.direction - The orientation of the plane ('xz', 'xy', or 'yz'). Defaults to 'xz'
 * @returns A mesh entity representing the plane
 *
 * @example
 * ```typescript
 * // Create a horizontal plane (default)
 * const horizontalPlane = createPlane();
 *
 * // Create a vertical plane facing forward
 * const verticalPlane = createPlane({ direction: 'xy' });
 * ```
 */
declare const createPlane: (engine: Engine, desc?: PlaneDescriptor & {
    direction?: 'xz' | 'xy' | 'yz';
}) => IMeshEntity;
/**
 * Creates a line mesh entity.
 *
 * @param engine - The engine instance
 * @param desc - Configuration object for the line geometry
 * @returns A mesh entity representing the line
 *
 * @example
 * ```typescript
 * const line = createLine({
 *   startPoint: Vector3.fromCopy3(0, 0, 0),
 *   endPoint: Vector3.fromCopy3(1, 1, 1)
 * });
 * ```
 */
declare const createLine: (engine: Engine, desc?: LineDescriptor) => IMeshEntity;
/**
 * Creates a grid mesh entity for visual reference.
 *
 * @param engine - The engine instance
 * @param desc - Configuration object for the grid geometry
 * @returns A mesh entity representing the grid
 *
 * @example
 * ```typescript
 * const grid = createGrid({
 *   size: 10,
 *   divisions: 20
 * });
 * ```
 */
declare const createGrid: (engine: Engine, desc?: GridDescriptor) => IMeshEntity;
/**
 * Creates a cone mesh entity.
 *
 * @param engine - The engine instance
 * @param desc - Configuration object for the cone geometry
 * @returns A mesh entity representing the cone
 *
 * @example
 * ```typescript
 * const cone = createCone({
 *   radius: 0.2,
 *   height: 0.5,
 *   includeBase: false,
 * });
 * ```
 */
declare const createCone: (engine: Engine, desc?: ConeDescriptor) => IMeshEntity;
/** Creates a centered cylinder or truncated-cone mesh entity. */
declare const createCylinder: (engine: Engine, desc?: CylinderDescriptor) => IMeshEntity;
/**
 * Creates a cube mesh entity with optional physics simulation.
 *
 * @param engine - The engine instance
 * @param desc - Configuration object for the cube geometry and physics properties
 * @returns A mesh entity representing the cube, with physics component if specified
 *
 * @example
 * ```typescript
 * // Create a simple cube
 * const cube = createCube({ widthVector: Vector3.fromCopy3(2, 2, 2) });
 *
 * // Create a cube with physics
 * const physicsCube = createCube({
 *   widthVector: Vector3.fromCopy3(1, 1, 1),
 *   physics: {
 *     use: true,
 *     move: true,
 *     density: 1.0,
 *     friction: 0.5,
 *     restitution: 0.3
 *   }
 * });
 * ```
 */
declare const createCube: (engine: Engine, desc?: CubeDescriptor) => IMeshEntity;
/**
 * Creates multiple cube mesh entities efficiently by sharing the same mesh geometry.
 * This is more performance-friendly than creating individual cubes when you need many instances.
 *
 * @param numberToCreate - The number of cube entities to create
 * @param desc - Configuration object for the cube geometry and physics properties
 * @returns An array of mesh entities representing the cubes
 *
 * @example
 * ```typescript
 * // Create 100 cubes for instancing
 * const cubes = createCubes(100, {
 *   widthVector: Vector3.fromCopy3(0.5, 0.5, 0.5),
 *   physics: { use: true, move: true }
 * });
 *
 * // Position them individually
 * cubes.forEach((cube, index) => {
 *   cube.localPosition = Vector3.fromCopy3(index % 10, 0, Math.floor(index / 10));
 * });
 * ```
 */
declare const createCubes: (engine: Engine, numberToCreate: number, desc?: CubeDescriptor) => IMeshEntity[];
/**
 * Creates a sphere mesh entity with optional physics simulation.
 *
 * @param engine - The engine instance
 * @param desc - Configuration object for the sphere geometry and physics properties
 * @returns A mesh entity representing the sphere, with physics component if specified
 *
 * @example
 * ```typescript
 * // Create a simple sphere
 * const sphere = createSphere({ radius: 2.0 });
 *
 * // Create a sphere with physics
 * const physicsSphere = createSphere({
 *   radius: 1.0,
 *   physics: {
 *     use: true,
 *     move: true,
 *     density: 0.8,
 *     friction: 0.4,
 *     restitution: 0.9
 *   }
 * });
 * ```
 */
declare const createSphere: (engine: Engine, desc?: SphereDescriptor) => IMeshEntity;
/**
 * Creates multiple sphere mesh entities efficiently by sharing the same mesh geometry.
 * This is more performance-friendly than creating individual spheres when you need many instances.
 *
 * @param numberToCreate - The number of sphere entities to create
 * @param desc - Configuration object for the sphere geometry and physics properties
 * @returns An array of mesh entities representing the spheres
 *
 * @example
 * ```typescript
 * // Create 50 spheres for a particle system
 * const spheres = createSpheres(50, {
 *   radius: 0.2,
 *   physics: { use: true, move: true, density: 0.5 }
 * });
 *
 * // Scatter them randomly
 * spheres.forEach(sphere => {
 *   sphere.localPosition = Vector3.fromCopy3(
 *     Math.random() * 10 - 5,
 *     Math.random() * 10,
 *     Math.random() * 10 - 5
 *   );
 * });
 * ```
 */
declare const createSpheres: (engine: Engine, numberToCreate: number, desc?: SphereDescriptor) => IMeshEntity[];
/**
 * Creates a joint mesh entity for skeletal animation or mechanical connections.
 *
 * @param engine - The engine instance
 * @param desc - Configuration object for the joint geometry
 * @returns A mesh entity representing the joint
 *
 * @example
 * ```typescript
 * const joint = createJoint({
 *   radius: 0.1,
 *   length: 2.0
 * });
 * ```
 */
declare const createJoint: (engine: Engine, desc?: JointDescriptor) => IMeshEntity;
/**
 * Creates an axis mesh entity for coordinate system visualization.
 * Typically displays X, Y, and Z axes with different colors.
 *
 * @param engine - The engine instance
 * @param desc - Configuration object for the axis geometry
 * @returns A mesh entity representing the coordinate axes
 *
 * @example
 * ```typescript
 * const worldAxis = createAxis({
 *   length: 5.0,
 *   thickness: 0.1
 * });
 * ```
 */
declare const createAxis: (engine: Engine, desc?: AxisDescriptor) => IMeshEntity;
/**
 * Creates a ring (annulus) mesh entity.
 *
 * @param engine - The engine instance
 * @param desc - Configuration object for the ring geometry
 * @param desc.radius - The radius of the ring (center to middle of band). Defaults to 1
 * @param desc.thickness - The thickness of the ring band. Defaults to 0.1
 * @param desc.segments - Number of segments forming the circumference. Defaults to 64
 * @param desc.axis - The axis perpendicular to the ring plane ('x', 'y', or 'z'). Defaults to 'y'
 * @returns A mesh entity representing the ring
 *
 * @example
 * ```typescript
 * // Create a horizontal ring (default, in XZ plane)
 * const ring = createRing({ radius: 2, thickness: 0.2 });
 *
 * // Create a vertical ring in YZ plane
 * const verticalRing = createRing({
 *   radius: 1.5,
 *   thickness: 0.1,
 *   segments: 32,
 *   axis: 'x'
 * });
 * ```
 */
declare const createRing: (engine: Engine, desc?: RingDescriptor) => IMeshEntity;
/**
 * Creates a capsule mesh entity.
 * A capsule is a cylinder with hemispherical caps at both ends.
 *
 * @param engine - The engine instance
 * @param desc - Configuration object for the capsule geometry
 * @param desc.radius - The radius of the capsule (hemispheres and cylinder). Defaults to 0.5
 * @param desc.height - The height of the cylinder part (distance between hemisphere centers). Defaults to 1
 * @param desc.widthSegments - Number of horizontal segments. Defaults to 16
 * @param desc.heightSegments - Number of vertical segments for each hemisphere. Defaults to 8
 * @returns A mesh entity representing the capsule
 *
 * @example
 * ```typescript
 * // Create a simple capsule
 * const capsule = createCapsule({ radius: 0.5, height: 2.0 });
 *
 * // Create a detailed capsule
 * const detailedCapsule = createCapsule({
 *   radius: 0.3,
 *   height: 1.5,
 *   widthSegments: 24,
 *   heightSegments: 12
 * });
 * ```
 */
declare const createCapsule: (engine: Engine, desc?: CapsuleDescriptor) => IMeshEntity;
/**
 * Creates a mesh entity from a primitive shape.
 * This is a utility function used internally by other creation methods.
 *
 * @param engine - The engine instance
 * @param primitive - The primitive shape to convert into a mesh entity
 * @returns A mesh entity containing the primitive shape
 *
 * @example
 * ```typescript
 * const customPrimitive = new CustomShape();
 * customPrimitive.generate(config);
 * const entity = createShape(customPrimitive);
 * ```
 */
declare function createShape(engine: Engine, primitive: IShape): IMeshEntity;
export declare const MeshHelper: Readonly<{
    createPlane: typeof createPlane;
    createLine: typeof createLine;
    createGrid: typeof createGrid;
    createCone: typeof createCone;
    createCylinder: typeof createCylinder;
    createCube: typeof createCube;
    createCubes: typeof createCubes;
    createSphere: typeof createSphere;
    createSpheres: typeof createSpheres;
    createCapsule: typeof createCapsule;
    createJoint: typeof createJoint;
    createAxis: typeof createAxis;
    createRing: typeof createRing;
    createShape: typeof createShape;
}>;
export {};
