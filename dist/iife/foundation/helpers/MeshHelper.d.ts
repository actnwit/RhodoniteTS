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
    createPlane: (engine: Engine, desc?: PlaneDescriptor & {
        direction?: 'xz' | 'xy' | 'yz';
    }) => IMeshEntity;
    createLine: (engine: Engine, desc?: LineDescriptor) => IMeshEntity;
    createGrid: (engine: Engine, desc?: GridDescriptor) => IMeshEntity;
    createCone: (engine: Engine, desc?: ConeDescriptor) => IMeshEntity;
    createCylinder: (engine: Engine, desc?: CylinderDescriptor) => IMeshEntity;
    createCube: (engine: Engine, desc?: CubeDescriptor) => IMeshEntity;
    createCubes: (engine: Engine, numberToCreate: number, desc?: CubeDescriptor) => IMeshEntity[];
    createSphere: (engine: Engine, desc?: SphereDescriptor) => IMeshEntity;
    createSpheres: (engine: Engine, numberToCreate: number, desc?: SphereDescriptor) => IMeshEntity[];
    createCapsule: (engine: Engine, desc?: CapsuleDescriptor) => IMeshEntity;
    createJoint: (engine: Engine, desc?: JointDescriptor) => IMeshEntity;
    createAxis: (engine: Engine, desc?: AxisDescriptor) => IMeshEntity;
    createRing: (engine: Engine, desc?: RingDescriptor) => IMeshEntity;
    createShape: typeof createShape;
}>;
export {};
