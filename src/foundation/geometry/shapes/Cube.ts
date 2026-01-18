import { PrimitiveMode } from '../../definitions/PrimitiveMode';
import { VertexAttribute } from '../../definitions/VertexAttribute';
import type { IColorRgba } from '../../math/IColor';
import type { IVector3 } from '../../math/IVector';
import { Vector3 } from '../../math/Vector3';
import { Is } from '../../misc/Is';
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
export class Cube extends IShape {
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
  public generate(_desc: CubeDescriptor): void {
    const desc = {
      widthVector: _desc.widthVector ?? Vector3.fromCopy3(1, 1, 1),
      color: _desc.color,
      material: _desc.material,
    };
    // prettier-ignore
    const indices = [
      3, 1, 0, 2, 1, 3, 4, 5, 7, 7, 5, 6, 8, 9, 11, 11, 9, 10, 15, 13, 12, 14, 13, 15, 19, 17, 16, 18, 17, 19, 20, 21,
      23, 23, 21, 22,
    ];

    // prettier-ignore
    const positions = [
      // upper
      -desc.widthVector.x / 2,
      desc.widthVector.y / 2,
      -desc.widthVector.z / 2,
      desc.widthVector.x / 2,
      desc.widthVector.y / 2,
      -desc.widthVector.z / 2,
      desc.widthVector.x / 2,
      desc.widthVector.y / 2,
      desc.widthVector.z / 2,
      -desc.widthVector.x / 2,
      desc.widthVector.y / 2,
      desc.widthVector.z / 2,
      // lower
      -desc.widthVector.x / 2,
      -desc.widthVector.y / 2,
      -desc.widthVector.z / 2,
      desc.widthVector.x / 2,
      -desc.widthVector.y / 2,
      -desc.widthVector.z / 2,
      desc.widthVector.x / 2,
      -desc.widthVector.y / 2,
      desc.widthVector.z / 2,
      -desc.widthVector.x / 2,
      -desc.widthVector.y / 2,
      desc.widthVector.z / 2,
      // front
      -desc.widthVector.x / 2,
      -desc.widthVector.y / 2,
      desc.widthVector.z / 2,
      desc.widthVector.x / 2,
      -desc.widthVector.y / 2,
      desc.widthVector.z / 2,
      desc.widthVector.x / 2,
      desc.widthVector.y / 2,
      desc.widthVector.z / 2,
      -desc.widthVector.x / 2,
      desc.widthVector.y / 2,
      desc.widthVector.z / 2,
      // back
      -desc.widthVector.x / 2,
      -desc.widthVector.y / 2,
      -desc.widthVector.z / 2,
      desc.widthVector.x / 2,
      -desc.widthVector.y / 2,
      -desc.widthVector.z / 2,
      desc.widthVector.x / 2,
      desc.widthVector.y / 2,
      -desc.widthVector.z / 2,
      -desc.widthVector.x / 2,
      desc.widthVector.y / 2,
      -desc.widthVector.z / 2,
      // right
      desc.widthVector.x / 2,
      -desc.widthVector.y / 2,
      -desc.widthVector.z / 2,
      desc.widthVector.x / 2,
      -desc.widthVector.y / 2,
      desc.widthVector.z / 2,
      desc.widthVector.x / 2,
      desc.widthVector.y / 2,
      desc.widthVector.z / 2,
      desc.widthVector.x / 2,
      desc.widthVector.y / 2,
      -desc.widthVector.z / 2,
      // left
      -desc.widthVector.x / 2,
      -desc.widthVector.y / 2,
      -desc.widthVector.z / 2,
      -desc.widthVector.x / 2,
      -desc.widthVector.y / 2,
      desc.widthVector.z / 2,
      -desc.widthVector.x / 2,
      desc.widthVector.y / 2,
      desc.widthVector.z / 2,
      -desc.widthVector.x / 2,
      desc.widthVector.y / 2,
      -desc.widthVector.z / 2,
    ];

    // prettier-ignore
    const colors = Is.not.exist(desc.color)
      ? []
      : [
          desc.color.r,
          desc.color.g,
          desc.color.b,
          desc.color.a,
          desc.color.r,
          desc.color.g,
          desc.color.b,
          desc.color.a,
          desc.color.r,
          desc.color.g,
          desc.color.b,
          desc.color.a,
          desc.color.r,
          desc.color.g,
          desc.color.b,
          desc.color.a,

          desc.color.r,
          desc.color.g,
          desc.color.b,
          desc.color.a,
          desc.color.r,
          desc.color.g,
          desc.color.b,
          desc.color.a,
          desc.color.r,
          desc.color.g,
          desc.color.b,
          desc.color.a,
          desc.color.r,
          desc.color.g,
          desc.color.b,
          desc.color.a,

          desc.color.r,
          desc.color.g,
          desc.color.b,
          desc.color.a,
          desc.color.r,
          desc.color.g,
          desc.color.b,
          desc.color.a,
          desc.color.r,
          desc.color.g,
          desc.color.b,
          desc.color.a,
          desc.color.r,
          desc.color.g,
          desc.color.b,
          desc.color.a,

          desc.color.r,
          desc.color.g,
          desc.color.b,
          desc.color.a,
          desc.color.r,
          desc.color.g,
          desc.color.b,
          desc.color.a,
          desc.color.r,
          desc.color.g,
          desc.color.b,
          desc.color.a,
          desc.color.r,
          desc.color.g,
          desc.color.b,
          desc.color.a,

          desc.color.r,
          desc.color.g,
          desc.color.b,
          desc.color.a,
          desc.color.r,
          desc.color.g,
          desc.color.b,
          desc.color.a,
          desc.color.r,
          desc.color.g,
          desc.color.b,
          desc.color.a,
          desc.color.r,
          desc.color.g,
          desc.color.b,
          desc.color.a,

          desc.color.r,
          desc.color.g,
          desc.color.b,
          desc.color.a,
          desc.color.r,
          desc.color.g,
          desc.color.b,
          desc.color.a,
          desc.color.r,
          desc.color.g,
          desc.color.b,
          desc.color.a,
          desc.color.r,
          desc.color.g,
          desc.color.b,
          desc.color.a,
        ];

    // prettier-ignore
    const texcoords = [
      // upper
      0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,

      // lower
      0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,

      // front
      0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,

      // back
      0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,

      // right
      0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,

      // left
      0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    ];

    // prettier-ignore
    const normals = [
      // upper
      0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
      // lower
      0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
      // front
      0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
      // back
      0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
      // right
      1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
      // left
      -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
    ];

    /// Check Size ///
    const attributeSemantics = [VertexAttribute.Position.XYZ, VertexAttribute.Normal.XYZ, VertexAttribute.Texcoord0.XY];
    const attributes = [new Float32Array(positions), new Float32Array(normals), new Float32Array(texcoords)];
    if (Is.exist(desc.color)) {
      attributeSemantics.push(VertexAttribute.Color0.XYZ);
      attributes.push(new Float32Array(colors));
    }
    const primitiveMode = PrimitiveMode.Triangles;

    this.copyVertexData({
      attributes,
      attributeSemantics,
      primitiveMode,
      indices: new Uint16Array(indices),
      material: desc.material,
    });
  }
}
