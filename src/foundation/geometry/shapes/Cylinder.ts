import type { Count } from '../../../types/CommonTypes';
import { PrimitiveMode } from '../../definitions/PrimitiveMode';
import { VertexAttribute } from '../../definitions/VertexAttribute';
import type { IAnyPrimitiveDescriptor } from '../Primitive';
import { IShape } from './IShape';

/** Descriptor for a capped cylinder or truncated cone aligned with the Y axis. */
export interface CylinderDescriptor extends IAnyPrimitiveDescriptor {
  radiusBottom?: number;
  radiusTop?: number;
  height?: number;
  radialSegments?: Count;
  includeCaps?: boolean;
}

/** A centered, capped cylinder that also supports different top and bottom radii. */
export class Cylinder extends IShape {
  public generate(_desc: CylinderDescriptor = {}): void {
    const radiusBottom = _desc.radiusBottom ?? 0.5;
    const radiusTop = _desc.radiusTop ?? 0.5;
    const height = _desc.height ?? 1;
    const requestedRadialSegments = _desc.radialSegments ?? 16;
    if (!Number.isFinite(requestedRadialSegments) || !Number.isInteger(requestedRadialSegments)) {
      throw new Error('Cylinder radialSegments must be a finite integer.');
    }
    const radialSegments = Math.max(3, requestedRadialSegments);
    const includeCaps = _desc.includeCaps ?? true;
    if (
      !Number.isFinite(radiusBottom) ||
      !Number.isFinite(radiusTop) ||
      !Number.isFinite(height) ||
      radiusBottom < 0 ||
      radiusTop < 0 ||
      (radiusBottom === 0 && radiusTop === 0) ||
      height <= 0
    ) {
      throw new Error('Cylinder dimensions must be finite, with positive height and at least one positive radius.');
    }

    const positions: number[] = [];
    const normals: number[] = [];
    const texcoords: number[] = [];
    const indices: number[] = [];
    const halfHeight = height / 2;
    const slope = (radiusBottom - radiusTop) / height;

    for (let i = 0; i < radialSegments; i++) {
      const theta = (i / radialSegments) * Math.PI * 2;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      const normalLength = Math.hypot(cos, slope, sin);
      positions.push(radiusBottom * cos, -halfHeight, radiusBottom * sin);
      normals.push(cos / normalLength, slope / normalLength, sin / normalLength);
      texcoords.push(i / radialSegments, 0);
      positions.push(radiusTop * cos, halfHeight, radiusTop * sin);
      normals.push(cos / normalLength, slope / normalLength, sin / normalLength);
      texcoords.push(i / radialSegments, 1);
    }
    for (let i = 0; i < radialSegments; i++) {
      const next = (i + 1) % radialSegments;
      const bottom = i * 2;
      const top = bottom + 1;
      const nextBottom = next * 2;
      const nextTop = nextBottom + 1;
      indices.push(bottom, top, nextBottom, nextBottom, top, nextTop);
    }

    if (includeCaps) {
      this.__appendCap(-halfHeight, radiusBottom, -1, radialSegments, positions, normals, texcoords, indices);
      this.__appendCap(halfHeight, radiusTop, 1, radialSegments, positions, normals, texcoords, indices);
    }

    const indexArray = positions.length / 3 > 0x10000 ? new Uint32Array(indices) : new Uint16Array(indices);

    this.copyVertexData({
      attributes: [new Float32Array(positions), new Float32Array(normals), new Float32Array(texcoords)],
      attributeSemantics: [VertexAttribute.Position.XYZ, VertexAttribute.Normal.XYZ, VertexAttribute.Texcoord0.XY],
      primitiveMode: PrimitiveMode.Triangles,
      indices: indexArray,
      material: _desc.material,
    });
  }

  private __appendCap(
    y: number,
    radius: number,
    normalY: -1 | 1,
    radialSegments: number,
    positions: number[],
    normals: number[],
    texcoords: number[],
    indices: number[]
  ): void {
    if (radius === 0) {
      return;
    }
    const center = positions.length / 3;
    positions.push(0, y, 0);
    normals.push(0, normalY, 0);
    texcoords.push(0.5, 0.5);
    const ring = positions.length / 3;
    for (let i = 0; i < radialSegments; i++) {
      const theta = (i / radialSegments) * Math.PI * 2;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      positions.push(radius * cos, y, radius * sin);
      normals.push(0, normalY, 0);
      texcoords.push(cos * 0.5 + 0.5, sin * 0.5 + 0.5);
    }
    for (let i = 0; i < radialSegments; i++) {
      const current = ring + i;
      const next = ring + ((i + 1) % radialSegments);
      if (normalY > 0) {
        indices.push(center, next, current);
      } else {
        indices.push(center, current, next);
      }
    }
  }
}
