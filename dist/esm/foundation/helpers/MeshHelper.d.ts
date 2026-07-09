import type { AxisDescriptor } from '../geometry/shapes/Axis';
import { type CapsuleDescriptor } from '../geometry/shapes/Capsule';
import { type ConeDescriptor } from '../geometry/shapes/Cone';
import { type CubeDescriptor } from '../geometry/shapes/Cube';
import { type GridDescriptor } from '../geometry/shapes/Grid';
import type { IShape } from '../geometry/shapes/IShape';
import { type JointDescriptor } from '../geometry/shapes/Joint';
import { type LineDescriptor } from '../geometry/shapes/Line';
import { type PlaneDescriptor } from '../geometry/shapes/Plane';
import { type RingDescriptor } from '../geometry/shapes/Ring';
import { type SphereDescriptor } from '../geometry/shapes/Sphere';
import type { Engine } from '../system/Engine';
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
declare function createShape(engine: Engine, primitive: IShape): import("./EntityHelper").IMeshEntity;
export declare const MeshHelper: Readonly<{
    createPlane: (engine: Engine, desc?: PlaneDescriptor & {
        direction?: 'xz' | 'xy' | 'yz';
    }) => import("./EntityHelper").IMeshEntity;
    createLine: (engine: Engine, desc?: LineDescriptor) => import("./EntityHelper").IMeshEntity;
    createGrid: (engine: Engine, desc?: GridDescriptor) => import("./EntityHelper").IMeshEntity;
    createCone: (engine: Engine, desc?: ConeDescriptor) => import("./EntityHelper").IMeshEntity;
    createCube: (engine: Engine, desc?: CubeDescriptor) => import("./EntityHelper").IMeshEntity;
    createCubes: (engine: Engine, numberToCreate: number, desc?: CubeDescriptor) => import("./EntityHelper").IMeshEntity[];
    createSphere: (engine: Engine, desc?: SphereDescriptor) => import("./EntityHelper").IMeshEntity;
    createSpheres: (engine: Engine, numberToCreate: number, desc?: SphereDescriptor) => import("./EntityHelper").IMeshEntity[];
    createCapsule: (engine: Engine, desc?: CapsuleDescriptor) => import("./EntityHelper").IMeshEntity;
    createJoint: (engine: Engine, desc?: JointDescriptor) => import("./EntityHelper").IMeshEntity;
    createAxis: (engine: Engine, desc?: AxisDescriptor) => import("./EntityHelper").IMeshEntity;
    createRing: (engine: Engine, desc?: RingDescriptor) => import("./EntityHelper").IMeshEntity;
    createShape: typeof createShape;
}>;
export {};
