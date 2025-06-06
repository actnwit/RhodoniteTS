import type { Count } from '../../../types/CommonTypes';
import { PrimitiveMode } from '../../definitions/PrimitiveMode';
import { VertexAttribute } from '../../definitions/VertexAttribute';
import { Vector3 } from '../../math/Vector3';
import { Logger } from '../../misc/Logger';
import type { PhysicsProperty } from '../../physics/PhysicsProperty';
import { type IAnyPrimitiveDescriptor, Primitive } from '../Primitive';
import { IShape } from './IShape';

/**
 * The argument descriptor for Sphere primitives
 */
export interface SphereDescriptor extends IAnyPrimitiveDescriptor {
  /**
   * The radius of the sphere.
   * @default 1
   */
  radius?: number;

  /**
   * The number of segments that define the sphere's width (horizontal divisions).
   * @default 10
   */
  widthSegments?: Count;

  /**
   * The number of segments that define the sphere's height (vertical divisions).
   * @default 10
   */
  heightSegments?: Count;

  /**
   * Indicates whether to invert the normals of the sphere's surface.
   * @default false
   */
  inverseNormal?: boolean;

  /**
   * Physics properties associated with the sphere, such as mass and collision settings.
   */
  physics?: PhysicsProperty;
}

/**
 * Sphere class for generating spherical geometry with customizable parameters
 */
export class Sphere extends IShape {
  /**
   * Generates sphere geometry with the specified parameters
   *
   * @param _desc - The sphere descriptor containing generation parameters
   * @param _desc.radius - The radius of the sphere (default: 1)
   * @param _desc.widthSegments - The number of horizontal segments (default: 10)
   * @param _desc.heightSegments - The number of vertical segments (default: 10)
   * @param _desc.material - The material to apply to the sphere
   * @param _desc.inverseNormal - Whether to invert the normals (default: false)
   *
   * @remarks
   * This method generates vertex positions, texture coordinates, normals, and indices
   * for a UV sphere using spherical coordinates. The sphere is centered at the origin.
   *
   * If the radius is zero or nearly zero, it will be clamped to 0.001 for safety.
   * A small shift value is applied to avoid singularities at the poles.
   *
   * The texture coordinates are mapped so that u ranges from 0 to 1 (longitude)
   * and v ranges from 0 to 1 (latitude).
   *
   * @example
   * ```typescript
   * const sphere = new Sphere();
   * sphere.generate({
   *   radius: 2.0,
   *   widthSegments: 20,
   *   heightSegments: 20,
   *   material: myMaterial
   * });
   * ```
   */
  generate(_desc: SphereDescriptor) {
    const desc = {
      radius: _desc.radius ?? 1,
      widthSegments: _desc.widthSegments ?? 10,
      heightSegments: _desc.heightSegments ?? 10,
      material: _desc.material,
      inverseNormal: _desc.inverseNormal ?? false,
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
        normals.push(desc.inverseNormal ? -normal.x : normal.x);
        normals.push(desc.inverseNormal ? -normal.y : normal.y);
        normals.push(desc.inverseNormal ? -normal.z : normal.z);
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

    const attributeSemantics = [VertexAttribute.Position.XYZ, VertexAttribute.Normal.XYZ, VertexAttribute.Texcoord0.XY];
    const primitiveMode = PrimitiveMode.Triangles;
    const attributes = [new Float32Array(positions), new Float32Array(normals), new Float32Array(texcoords)];

    this.copyVertexData({
      attributes,
      attributeSemantics,
      primitiveMode,
      indices: new Uint16Array(indices),
      material: desc.material,
    });
  }
}
