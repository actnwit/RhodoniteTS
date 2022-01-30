import {IAnyPrimitiveDescriptor, Primitive} from '../Primitive';
import {VertexAttribute} from '../../definitions/VertexAttribute';
import {PrimitiveMode} from '../../definitions/PrimitiveMode';
import Vector3 from '../../math/Vector3';
import {Count} from '../../../types/CommonTypes';
import {IShape} from './IShape';

/**
 * The argument descriptor for Plane primitives
 */
export interface SphereDescriptor extends IAnyPrimitiveDescriptor {
  /** radius */
  radius: number;
  /** the number of segments for width direction */
  widthSegments: Count;
  /** the number of segments for height direction */
  heightSegments: Count;
}

/**
 * Sphere class
 */
export class Sphere extends IShape {
  constructor() {
    super();
  }

  generate({
    radius,
    widthSegments,
    heightSegments,
    material,
  }: SphereDescriptor) {
    const positions = [];
    const texcoords = [];
    const normals = [];

    if (Math.abs(radius) < Number.EPSILON) {
      console.warn(
        'The argument radius is zero / nearly zero. Rn will take the radius as 0.001 for safety. Check your code.'
      );
      radius = 0.001;
    }

    const shiftValue = 0.00001; // for avoid Singular point
    for (let latNumber = 0; latNumber <= heightSegments; latNumber++) {
      const theta = (latNumber * Math.PI) / heightSegments + shiftValue;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      for (let longNumber = 0; longNumber <= widthSegments; longNumber++) {
        const phi = (longNumber * 2 * Math.PI) / widthSegments;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        const x = radius * cosPhi * sinTheta;
        const y = radius * cosTheta;
        const z = radius * sinPhi * sinTheta;
        const position = Vector3.fromCopyArray([x, y, z]);
        positions.push(x);
        positions.push(y);
        positions.push(z);
        const u = 1 - longNumber / widthSegments;
        const v = latNumber / heightSegments;
        texcoords.push(u);
        texcoords.push(v);
        const normal = Vector3.normalize(position);
        normals.push(normal.x);
        normals.push(normal.y);
        normals.push(normal.z);
      }
    }

    // first    first+1
    //    +-------+
    //    |     / |
    //    |   /   |
    //    | /     |
    //    +-------+
    // second   second+1
    //
    const indices = [];
    for (let latNumber = 0; latNumber < heightSegments; latNumber++) {
      for (let longNumber = 0; longNumber < widthSegments; longNumber++) {
        const first = latNumber * (widthSegments + 1) + longNumber;
        const second = first + widthSegments + 1;

        indices.push(first + 1);
        indices.push(second);
        indices.push(first);

        indices.push(first + 1);
        indices.push(second + 1);
        indices.push(second);
      }
    }

    const attributeSemantics = [
      VertexAttribute.Position.XYZ,
      VertexAttribute.Normal.XYZ,
      VertexAttribute.Texcoord0.XY,
    ];
    const primitiveMode = PrimitiveMode.Triangles;
    const attributes = [
      new Float32Array(positions),
      new Float32Array(normals),
      new Float32Array(texcoords),
    ];

    this.copyVertexData({
      attributes,
      attributeSemantics,
      primitiveMode,
      indices: new Uint16Array(indices),
      material,
    });
  }
}
