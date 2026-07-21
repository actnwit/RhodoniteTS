import type { IQuaternion } from '../math/IQuaternion';
import type { IVector3 } from '../math/IVector';
export type ResolvedBoxTransform = {
    halfExtents: IVector3;
    rotation: IQuaternion;
    approximated: boolean;
};
export type ResolvedAxialTransform = {
    halfHeight: number;
    radius: number;
    rotation: IQuaternion;
    approximated: boolean;
};
/** Resolves S * R for a box, falling back to a conservative entity-local AABB when it contains shear. */
export declare function resolveScaledBox(size: IVector3, localRotation: IQuaternion, scale: IVector3): ResolvedBoxTransform;
/** Resolves a scaled cylinder to a containing circular cylinder aligned with its transformed local Y axis. */
export declare function resolveScaledCylinder(height: number, radius: number, localRotation: IQuaternion, scale: IVector3): ResolvedAxialTransform;
/** Resolves a scaled capsule using its transformed segment and a sphere containing the scaled end caps. */
export declare function resolveScaledCapsule(height: number, radius: number, localRotation: IQuaternion, scale: IVector3): ResolvedAxialTransform;
