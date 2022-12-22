import * as Rn from './index';
export declare const ProcessApproach: Readonly<{
    isDataTextureApproach: (processApproach: Rn.ProcessApproachClass) => boolean;
    isUniformApproach: (processApproach: Rn.ProcessApproachClass) => boolean;
    None: Rn.ProcessApproachClass;
    Uniform: Rn.ProcessApproachClass;
    DataTexture: Rn.ProcessApproachClass;
    isWebGL2Approach: (processApproach: Rn.ProcessApproachClass) => boolean;
}>;
export declare const System: typeof Rn.System;
export declare const MeshHelper: Readonly<{
    createPlane: (desc?: Rn.PlaneDescriptor & {
        direction?: "xz" | "xy" | "yz" | undefined;
    }) => Rn.IMeshEntity;
    createLine: (desc?: Rn.LineDescriptor) => Rn.IMeshEntity;
    createGrid: (desc?: Rn.GridDescriptor) => Rn.IMeshEntity;
    createCube: (desc?: Rn.CubeDescriptor) => Rn.IMeshEntity;
    createSphere: (desc?: Rn.SphereDescriptor) => Rn.IMeshEntity;
    createJoint: (desc?: Rn.IAnyPrimitiveDescriptor) => Rn.IMeshEntity;
    createAxis: (desc?: Rn.AxisDescriptor) => Rn.IMeshEntity;
    createShape: (primitive: Rn.IShape) => Rn.IMeshEntity;
}>;
export declare const Vector3: typeof Rn.Vector3;
export default Rn;
