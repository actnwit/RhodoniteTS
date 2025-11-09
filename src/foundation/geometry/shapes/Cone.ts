import type { Count } from '../../../types/CommonTypes';
import { PrimitiveMode } from '../../definitions/PrimitiveMode';
import { VertexAttribute } from '../../definitions/VertexAttribute';
import type { IAnyPrimitiveDescriptor } from '../Primitive';
import { IShape } from './IShape';

/**
 * Descriptor for generating a cone primitive.
 */
export interface ConeDescriptor extends IAnyPrimitiveDescriptor {
  /**
   * Radius of the cone base.
   * @defaultValue 0.1
   */
  radius?: number;
  /**
   * Height of the cone measured along the +Y axis.
   * @defaultValue 0.25
   */
  height?: number;
  /**
   * Number of radial segments that form the cone circumference.
   * @defaultValue 12
   */
  radialSegments?: Count;
  /**
   * Whether to generate a base disk that caps the cone.
   * @defaultValue true
   */
  includeBase?: boolean;
}

/**
 * Cone primitive aligned along the +Y axis (base on the XZ plane, tip along +Y).
 */
export class Cone extends IShape {
  /**
   * Generates vertex buffers for a cone shape.
   * @param _desc - Cone descriptor with geometry options.
   */
  public generate(_desc: ConeDescriptor): void {
    const desc = {
      radius: _desc.radius ?? 0.1,
      height: _desc.height ?? 0.25,
      radialSegments: Math.max(3, _desc.radialSegments ?? 12),
      includeBase: _desc.includeBase ?? true,
      material: _desc.material,
    };

    const positions: number[] = [];
    const normals: number[] = [];
    const texcoords: number[] = [];
    const indices: number[] = [];

    const slope = desc.radius / desc.height;

    // Side vertices (base ring)
    for (let i = 0; i < desc.radialSegments; i++) {
      const theta = (i / desc.radialSegments) * Math.PI * 2;
      const cosTheta = Math.cos(theta);
      const sinTheta = Math.sin(theta);
      const x = desc.radius * cosTheta;
      const z = desc.radius * sinTheta;
      positions.push(x, 0, z);
      const len = Math.hypot(cosTheta, slope, sinTheta);
      normals.push(cosTheta / len, slope / len, sinTheta / len);
      texcoords.push(i / desc.radialSegments, 0);
    }

    // Tip vertex
    const tipIndex = positions.length / 3;
    positions.push(0, desc.height, 0);
    normals.push(0, 1, 0);
    texcoords.push(0.5, 1);

    // Side indices
    for (let i = 0; i < desc.radialSegments; i++) {
      const curr = i;
      const next = (i + 1) % desc.radialSegments;
      indices.push(curr, next, tipIndex);
    }

    if (desc.includeBase) {
      const baseCenterIndex = positions.length / 3;
      positions.push(0, 0, 0);
      normals.push(0, -1, 0);
      texcoords.push(0.5, 0.5);

      const baseStartIndex = positions.length / 3;
      for (let i = 0; i < desc.radialSegments; i++) {
        const theta = (i / desc.radialSegments) * Math.PI * 2;
        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);
        const x = desc.radius * cosTheta;
        const z = desc.radius * sinTheta;
        positions.push(x, 0, z);
        normals.push(0, -1, 0);
        texcoords.push(cosTheta * 0.5 + 0.5, sinTheta * 0.5 + 0.5);
      }

      for (let i = 0; i < desc.radialSegments; i++) {
        const curr = baseStartIndex + i;
        const next = baseStartIndex + ((i + 1) % desc.radialSegments);
        // Reverse winding to keep the normal facing -Y
        indices.push(baseCenterIndex, next, curr);
      }
    }

    this.copyVertexData({
      attributes: [new Float32Array(positions), new Float32Array(normals), new Float32Array(texcoords)],
      attributeSemantics: [VertexAttribute.Position.XYZ, VertexAttribute.Normal.XYZ, VertexAttribute.Texcoord0.XY],
      primitiveMode: PrimitiveMode.Triangles,
      indices: new Uint16Array(indices),
      material: desc.material,
    });
  }
}
