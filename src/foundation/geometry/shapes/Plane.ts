import type { Size } from '../../../types/CommonTypes';
import { PrimitiveMode } from '../../definitions/PrimitiveMode';
import { VertexAttribute } from '../../definitions/VertexAttribute';
import { type IAnyPrimitiveDescriptor, Primitive } from '../Primitive';
import { IShape } from './IShape';

/**
 * Interface describing the configuration options for creating a plane geometry
 * @interface PlaneDescriptor
 * @extends IAnyPrimitiveDescriptor
 */
export interface PlaneDescriptor extends IAnyPrimitiveDescriptor {
  /** the length of U(X)-axis direction */
  width?: Size;
  /** the length of V(Y)-axis direction */
  height?: Size;
  /** number of spans in U(X)-axis direction */
  uSpan?: Size;
  /** number of spans in V(Y)-axis direction */
  vSpan?: Size;
  /** draw uSpan times vSpan number of textures */
  isUVRepeat?: boolean;
  /** draw textures by flipping on the V(Y)-axis */
  flipTextureCoordinateY?: boolean;
}

/**
 * A class for generating plane geometry with customizable dimensions and tessellation
 *
 * The Plane class creates a rectangular mesh that lies in the XZ plane (Y=0) by default.
 * It supports various configuration options including size, subdivision, and texture mapping.
 *
 * @class Plane
 * @extends IShape
 */
export class Plane extends IShape {
  /**
   * Generates a plane geometry with the specified parameters
   *
   * Creates a rectangular plane mesh with configurable width, height, and tessellation.
   * The plane is generated in the XZ plane with Y=0, centered at the origin.
   * Supports texture coordinate generation with optional UV repetition and Y-axis flipping.
   *
   * @param _desc - Configuration object containing plane generation parameters
   * @param _desc.width - The width of the plane along the X-axis (default: 1)
   * @param _desc.height - The height of the plane along the Z-axis (default: 1)
   * @param _desc.uSpan - Number of subdivisions along the U(X)-axis (default: 1)
   * @param _desc.vSpan - Number of subdivisions along the V(Z)-axis (default: 1)
   * @param _desc.isUVRepeat - Whether to repeat texture coordinates instead of normalizing (default: false)
   * @param _desc.flipTextureCoordinateY - Whether to flip texture coordinates along the V-axis (default: false)
   * @param _desc.material - Optional material to assign to the generated geometry
   *
   * @returns void
   *
   * @example
   * ```typescript
   * const plane = new Plane();
   * plane.generate({
   *   width: 2,
   *   height: 2,
   *   uSpan: 4,
   *   vSpan: 4,
   *   isUVRepeat: false,
   *   flipTextureCoordinateY: true
   * });
   * ```
   */
  public generate(_desc: PlaneDescriptor): void {
    const desc = {
      width: _desc.width ?? 1,
      height: _desc.height ?? 1,
      uSpan: _desc.uSpan ?? 1,
      vSpan: _desc.vSpan ?? 1,
      isUVRepeat: _desc.isUVRepeat ?? false,
      flipTextureCoordinateY: _desc.flipTextureCoordinateY ?? false,
      material: _desc.material,
    };

    const positions = [];

    for (let i = 0; i <= desc.vSpan; i++) {
      for (let j = 0; j <= desc.uSpan; j++) {
        positions.push((j / desc.uSpan - 1 / 2) * desc.width);
        positions.push(0);
        positions.push((i / desc.vSpan - 1 / 2) * desc.height);
      }
    }

    const indices = [];
    for (let i = 0; i < desc.vSpan; i++) {
      let degenerate_left_index = 0;
      let degenerate_right_index = 0;
      for (let j = 0; j <= desc.uSpan; j++) {
        indices.push(i * (desc.uSpan + 1) + j);
        indices.push((i + 1) * (desc.uSpan + 1) + j);
        if (j === 0) {
          degenerate_left_index = (i + 1) * (desc.uSpan + 1) + j;
        } else if (j === desc.uSpan) {
          degenerate_right_index = (i + 1) * (desc.uSpan + 1) + j;
        }
      }
      indices.push(degenerate_right_index);
      indices.push(degenerate_left_index);
    }

    const normals = [];
    for (let i = 0; i <= desc.vSpan; i++) {
      for (let j = 0; j <= desc.uSpan; j++) {
        normals.push(0);
        normals.push(1);
        normals.push(0);
      }
    }

    const texcoords = [];
    for (let i = 0; i <= desc.vSpan; i++) {
      const i_ = desc.flipTextureCoordinateY ? i : desc.vSpan - i;

      for (let j = 0; j <= desc.uSpan; j++) {
        if (desc.isUVRepeat) {
          texcoords.push(j);
          texcoords.push(i_);
        } else {
          texcoords.push(j / desc.uSpan);
          texcoords.push(i_ / desc.vSpan);
        }
      }
    }

    // Check Size
    const attributeSemantics = [VertexAttribute.Position.XYZ, VertexAttribute.Normal.XYZ, VertexAttribute.Texcoord0.XY];
    const primitiveMode = PrimitiveMode.TriangleStrip;
    const attributes = [new Float32Array(positions), new Float32Array(normals), new Float32Array(texcoords)];

    this.copyVertexData({
      attributes,
      attributeSemantics,
      primitiveMode,
      indices: new Uint16Array(indices),
      material: desc?.material,
    });
  }
}
