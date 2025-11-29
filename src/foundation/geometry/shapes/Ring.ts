import type { Count } from '../../../types/CommonTypes';
import { PrimitiveMode } from '../../definitions/PrimitiveMode';
import { VertexAttribute } from '../../definitions/VertexAttribute';
import type { IAnyPrimitiveDescriptor } from '../Primitive';
import { IShape } from './IShape';

/**
 * Type definition for ring axis orientation
 */
export type RingAxis = 'x' | 'y' | 'z';

/**
 * Descriptor for generating a ring primitive.
 */
export interface RingDescriptor extends IAnyPrimitiveDescriptor {
  /**
   * The radius of the ring (distance from center to middle of the ring band).
   * @defaultValue 1
   */
  radius?: number;

  /**
   * The thickness of the ring band (half-width on each side of the radius).
   * @defaultValue 0.1
   */
  thickness?: number;

  /**
   * Number of segments that form the ring circumference.
   * @defaultValue 64
   */
  segments?: Count;

  /**
   * The axis perpendicular to the ring plane.
   * - 'x': Ring lies in the YZ plane
   * - 'y': Ring lies in the XZ plane
   * - 'z': Ring lies in the XY plane
   * @defaultValue 'y'
   */
  axis?: RingAxis;
}

/**
 * Ring primitive that creates a flat ring (annulus) shape.
 *
 * The ring is generated as a triangle strip with an outer and inner edge,
 * lying flat perpendicular to the specified axis.
 *
 * @example
 * ```typescript
 * const ring = new Ring();
 * ring.generate({
 *   radius: 2,
 *   thickness: 0.3,
 *   segments: 32,
 *   axis: 'y'
 * });
 * ```
 */
export class Ring extends IShape {
  /**
   * Generates vertex buffers for a ring shape.
   * @param _desc - Ring descriptor with geometry options.
   */
  public generate(_desc: RingDescriptor): void {
    const desc = {
      radius: _desc.radius ?? 1,
      thickness: _desc.thickness ?? 0.1,
      segments: Math.max(3, _desc.segments ?? 64),
      axis: _desc.axis ?? 'y',
      material: _desc.material,
    };

    const positions: number[] = [];
    const normals: number[] = [];
    const texcoords: number[] = [];

    const outer = desc.radius + desc.thickness;
    const inner = Math.max(desc.radius - desc.thickness, 0.0001);

    for (let i = 0; i <= desc.segments; i++) {
      const theta = (i / desc.segments) * Math.PI * 2;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);

      const u = i / desc.segments;

      if (desc.axis === 'x') {
        // Ring in YZ plane, normal along X
        positions.push(0, outer * cos, outer * sin);
        positions.push(0, inner * cos, inner * sin);
        normals.push(1, 0, 0);
        normals.push(1, 0, 0);
      } else if (desc.axis === 'y') {
        // Ring in XZ plane, normal along Y
        positions.push(outer * cos, 0, outer * sin);
        positions.push(inner * cos, 0, inner * sin);
        normals.push(0, 1, 0);
        normals.push(0, 1, 0);
      } else {
        // Ring in XY plane, normal along Z
        positions.push(outer * cos, outer * sin, 0);
        positions.push(inner * cos, inner * sin, 0);
        normals.push(0, 0, 1);
        normals.push(0, 0, 1);
      }

      // Outer edge texcoord
      texcoords.push(u, 1);
      // Inner edge texcoord
      texcoords.push(u, 0);
    }

    this.copyVertexData({
      attributes: [new Float32Array(positions), new Float32Array(normals), new Float32Array(texcoords)],
      attributeSemantics: [VertexAttribute.Position.XYZ, VertexAttribute.Normal.XYZ, VertexAttribute.Texcoord0.XY],
      primitiveMode: PrimitiveMode.TriangleStrip,
      material: desc.material,
    });
  }
}
