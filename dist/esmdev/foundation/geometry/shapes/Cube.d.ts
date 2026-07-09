import type { IColorRgba } from '../../math/IColor';
import type { IVector3 } from '../../math/IVector';
import type { PhysicsProperty } from '../../physics/PhysicsProperty';
import type { IAnyPrimitiveDescriptor } from '../Primitive';
import { IShape } from './IShape';
/**
 * Descriptor interface for creating a cube primitive
 */
export interface CubeDescriptor extends IAnyPrimitiveDescriptor {
    /** three width (width, height, depth) in (x, y, z) */
    widthVector?: IVector3;
    /** color */
    color?: IColorRgba;
    physics?: PhysicsProperty;
}
/**
 * The Cube Primitive class for generating 3D cube geometry
 *
 * This class provides functionality to create cube primitives with customizable
 * dimensions, colors, and materials. The cube is generated with proper vertex
 * attributes including positions, normals, texture coordinates, and optional colors.
 */
export declare class Cube extends IShape {
    /**
     * Generates a cube primitive with specified parameters
     *
     * Creates a cube geometry with 24 vertices (4 per face) and 12 triangles (2 per face).
     * The cube is centered at the origin and extends in both positive and negative
     * directions along each axis based on the width vector.
     *
     * @param _desc - The cube descriptor containing generation parameters
     * @param _desc.widthVector - The dimensions of the cube in x, y, z directions (defaults to 1,1,1)
     * @param _desc.color - Optional color to apply to all vertices of the cube
     * @param _desc.material - Material to assign to the generated cube primitive
     *
     * @example
     * ```typescript
     * const cube = new Cube();
     * cube.generate({
     *   widthVector: Vector3.fromCopy3(2, 1, 1),
     *   color: { r: 1, g: 0, b: 0, a: 1 },
     *   material: myMaterial
     * });
     * ```
     */
    generate(_desc: CubeDescriptor): void;
}
