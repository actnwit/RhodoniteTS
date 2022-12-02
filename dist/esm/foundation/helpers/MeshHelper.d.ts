import { PlaneDescriptor } from '../geometry/shapes/Plane';
import { AxisDescriptor } from '../geometry/shapes/Axis';
import { IShape } from '../geometry/shapes/IShape';
import { LineDescriptor } from '../geometry/shapes/Line';
import { GridDescriptor } from '../geometry/shapes/Grid';
import { CubeDescriptor } from '../geometry/shapes/Cube';
import { SphereDescriptor } from '../geometry/shapes/Sphere';
import { JointDescriptor } from '../geometry/shapes/Joint';
declare function createShape(primitive: IShape): import("./EntityHelper").IMeshEntity;
export declare const MeshHelper: Readonly<{
    createPlane: (desc?: PlaneDescriptor & {
        direction?: 'xz' | 'xy' | 'yz';
    }) => import("./EntityHelper").IMeshEntity;
    createLine: (desc?: LineDescriptor) => import("./EntityHelper").IMeshEntity;
    createGrid: (desc?: GridDescriptor) => import("./EntityHelper").IMeshEntity;
    createCube: (desc?: CubeDescriptor) => import("./EntityHelper").IMeshEntity;
    createSphere: (desc?: SphereDescriptor) => import("./EntityHelper").IMeshEntity;
    createJoint: (desc?: JointDescriptor) => import("./EntityHelper").IMeshEntity;
    createAxis: (desc?: AxisDescriptor) => import("./EntityHelper").IMeshEntity;
    createShape: typeof createShape;
}>;
export {};
