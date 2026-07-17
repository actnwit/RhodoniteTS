import type { IQuaternion, IVector3 } from '../math';
export type BoxShapeDescriptor = {
    readonly type: 'box';
    readonly size: IVector3;
};
export type SphereShapeDescriptor = {
    readonly type: 'sphere';
    readonly radius: number;
};
export type CylinderShapeDescriptor = {
    readonly type: 'cylinder';
    /** Total height along the local Y axis. */
    readonly height: number;
    readonly radiusBottom: number;
    readonly radiusTop: number;
};
export type CapsuleShapeDescriptor = {
    readonly type: 'capsule';
    /** Distance between the centers of the two capping spheres. */
    readonly height: number;
    readonly radiusBottom: number;
    readonly radiusTop: number;
};
export type ShapeDescriptor = BoxShapeDescriptor | SphereShapeDescriptor | CylinderShapeDescriptor | CapsuleShapeDescriptor;
export type ShapeLocalTransform = {
    readonly position?: IVector3;
    readonly rotation?: IQuaternion;
};
export type ShapeInstance = {
    readonly shape: ShapeDescriptor;
    readonly localPosition: IVector3;
    readonly localRotation: IQuaternion;
};
/** Creates or validates an immutable, shareable shape descriptor. */
export declare function normalizeShapeDescriptor(descriptor: ShapeDescriptor): ShapeDescriptor;
