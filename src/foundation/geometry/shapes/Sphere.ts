import { IAnyPrimitiveDescriptor, Primitive } from '../Primitive';
import { VertexAttribute } from '../../definitions/VertexAttribute';
import { PrimitiveMode } from '../../definitions/PrimitiveMode';
import { Vector3 } from '../../math/Vector3';
import { Count } from '../../../types/CommonTypes';
import { IShape } from './IShape';
import { PhysicsProperty } from '../../physics/PhysicsProperty';
import { Logger } from '../../misc/Logger';

/**
 * The argument descriptor for Plane primitives
 */
export interface SphereDescriptor extends IAnyPrimitiveDescriptor {
  /** radius */
  radius?: number;
  /** the number of segments for width direction */
  widthSegments?: Count;
  /** the number of segments for height direction */
  heightSegments?: Count;

  physics?: PhysicsProperty;
}

/**
 * Sphere class
 */
export class Sphere extends IShape {
  constructor() {
    super();
  }

  generate(_desc: SphereDescriptor) {
    const desc = {
      radius: _desc.radius ?? 1,
      widthSegments: _desc.widthSegments ?? 10,
      heightSegments: _desc.heightSegments ?? 10,
      material: _desc.material,
    };
    const positions = [];
    const texcoords = [];
    const normals = [];

    if (Math.abs(desc.radius) < Number.EPSILON) {
      Logger.warn(
        'The argument radius is zero / nearly zero. Rn will take the radius as 0.001 for safety. Check your code.'
      );
      desc.radius = 0.001;
    }

    const shiftValue = 0.00001; // for avoid Singular point
    for (let latNumber = 0; latNumber <= desc.heightSegments; latNumber++) {
      const theta = (latNumber * Math.PI) / desc.heightSegments + shiftValue;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      for (let longNumber = 0; longNumber <= desc.widthSegments; longNumber++) {
        const phi = (longNumber * 2 * Math.PI) / desc.widthSegments;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        const x = desc.radius * cosPhi * sinTheta;
        const y = desc.radius * cosTheta;
        const z = desc.radius * sinPhi * sinTheta;
        const position = Vector3.fromCopyArray([x, y, z]);
        positions.push(x);
        positions.push(y);
        positions.push(z);
        const u = 1 - longNumber / desc.widthSegments;
        const v = latNumber / desc.heightSegments;
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
    for (let latNumber = 0; latNumber < desc.heightSegments; latNumber++) {
      for (let longNumber = 0; longNumber < desc.widthSegments; longNumber++) {
        const first = latNumber * (desc.widthSegments + 1) + longNumber;
        const second = first + desc.widthSegments + 1;

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
      material: desc.material,
    });
  }
}
