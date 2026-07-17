import type { Array3 } from './CommonTypes';
import type { Gltf2AnyObject } from './glTF2';
export interface KHRImplicitShapeProperty {
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
}
export interface KHRImplicitPlane extends KHRImplicitShapeProperty {
    doubleSided?: boolean;
    sizeX?: number;
    sizeZ?: number;
}
export interface KHRImplicitSphere extends KHRImplicitShapeProperty {
    radius?: number;
}
export interface KHRImplicitBox extends KHRImplicitShapeProperty {
    size?: Array3<number>;
}
export interface KHRImplicitCylinder extends KHRImplicitShapeProperty {
    height?: number;
    radiusBottom?: number;
    radiusTop?: number;
}
export interface KHRImplicitCapsule extends KHRImplicitShapeProperty {
    height?: number;
    radiusBottom?: number;
    radiusTop?: number;
}
/**
 * A shape resource declared by KHR_implicit_shapes.
 *
 * Shape parameter objects are optional because the extension schemas only
 * require `type`; consumers apply the schema defaults when the matching
 * parameter object is omitted.
 */
export interface KHRImplicitShape extends KHRImplicitShapeProperty {
    type: 'plane' | 'sphere' | 'box' | 'cylinder' | 'capsule' | (string & {});
    name?: string;
    plane?: KHRImplicitPlane;
    sphere?: KHRImplicitSphere;
    box?: KHRImplicitBox;
    cylinder?: KHRImplicitCylinder;
    capsule?: KHRImplicitCapsule;
}
export interface KHRImplicitShapes extends KHRImplicitShapeProperty {
    shapes: KHRImplicitShape[];
}
export type KHRImplicitBoxSize = Array3<number>;
