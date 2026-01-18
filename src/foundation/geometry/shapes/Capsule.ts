import type { Count } from '../../../types/CommonTypes';
import { PrimitiveMode } from '../../definitions/PrimitiveMode';
import { VertexAttribute } from '../../definitions/VertexAttribute';
import { Vector3 } from '../../math/Vector3';
import { Logger } from '../../misc/Logger';
import type { PhysicsProperty } from '../../physics/PhysicsProperty';
import { type IAnyPrimitiveDescriptor, Primitive } from '../Primitive';
import { IShape } from './IShape';

/**
 * The argument descriptor for Capsule primitives
 */
export interface CapsuleDescriptor extends IAnyPrimitiveDescriptor {
  /**
   * The radius of the capsule (half-spheres and cylinder).
   * @default 0.5
   */
  radius?: number;

  /**
   * The height of the capsule (distance between the centers of the two half-spheres).
   * @default 1
   */
  height?: number;

  /**
   * The number of segments that define the capsule's width (horizontal divisions).
   * @default 16
   */
  widthSegments?: Count;

  /**
   * The number of segments that define the capsule's height (vertical divisions for each half-sphere).
   * @default 8
   */
  heightSegments?: Count;

  /**
   * Physics properties associated with the capsule, such as mass and collision settings.
   */
  physics?: PhysicsProperty;
}

/**
 * Capsule class for generating capsule geometry with customizable parameters.
 * A capsule consists of a cylinder with hemispherical caps at both ends.
 * The capsule is oriented along the Y-axis, with the center at the origin.
 */
export class Capsule extends IShape {
  /**
   * Generates capsule geometry with the specified parameters
   *
   * @param _desc - The capsule descriptor containing generation parameters
   * @param _desc.radius - The radius of the capsule (default: 0.5)
   * @param _desc.height - The height of the cylinder part (default: 1)
   * @param _desc.widthSegments - The number of horizontal segments (default: 16)
   * @param _desc.heightSegments - The number of vertical segments for each hemisphere (default: 8)
   * @param _desc.material - The material to apply to the capsule
   *
   * @remarks
   * This method generates vertex positions, texture coordinates, normals, and indices
   * for a capsule shape. The capsule is centered at the origin with its axis along the Y-axis.
   * The total height of the capsule is (height + 2 * radius).
   *
   * If the radius is zero or nearly zero, it will be clamped to 0.001 for safety.
   *
   * @example
   * ```typescript
   * const capsule = new Capsule();
   * capsule.generate({
   *   radius: 0.5,
   *   height: 2.0,
   *   widthSegments: 24,
   *   heightSegments: 12,
   *   material: myMaterial
   * });
   * ```
   */
  generate(_desc: CapsuleDescriptor) {
    const desc = {
      radius: _desc.radius ?? 0.5,
      height: _desc.height ?? 1,
      widthSegments: _desc.widthSegments ?? 16,
      heightSegments: _desc.heightSegments ?? 8,
      material: _desc.material,
    };

    if (Math.abs(desc.radius) < Number.EPSILON) {
      Logger.default.warn(
        'The argument radius is zero / nearly zero. Rn will take the radius as 0.001 for safety. Check your code.'
      );
      desc.radius = 0.001;
    }

    const positions: number[] = [];
    const texcoords: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];

    const halfHeight = desc.height / 2;

    // Generate top hemisphere (from top pole to equator)
    for (let lat = 0; lat <= desc.heightSegments; lat++) {
      const theta = (lat * Math.PI) / (2 * desc.heightSegments);
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      for (let lon = 0; lon <= desc.widthSegments; lon++) {
        const phi = (lon * 2 * Math.PI) / desc.widthSegments;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        const x = desc.radius * cosPhi * sinTheta;
        const y = desc.radius * cosTheta + halfHeight;
        const z = desc.radius * sinPhi * sinTheta;

        positions.push(x, y, z);

        const u = 1 - lon / desc.widthSegments;
        const v = lat / (desc.heightSegments * 2 + 1);
        texcoords.push(u, v);

        const normal = Vector3.normalize(Vector3.fromCopy3(cosPhi * sinTheta, cosTheta, sinPhi * sinTheta));
        normals.push(normal.x, normal.y, normal.z);
      }
    }

    // Generate cylinder part
    for (let lat = 1; lat < desc.heightSegments; lat++) {
      const t = lat / desc.heightSegments;
      const y = halfHeight - t * desc.height;

      for (let lon = 0; lon <= desc.widthSegments; lon++) {
        const phi = (lon * 2 * Math.PI) / desc.widthSegments;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        const x = desc.radius * cosPhi;
        const z = desc.radius * sinPhi;

        positions.push(x, y, z);

        const u = 1 - lon / desc.widthSegments;
        const v = (desc.heightSegments + lat) / (desc.heightSegments * 2 + desc.heightSegments);
        texcoords.push(u, v);

        normals.push(cosPhi, 0, sinPhi);
      }
    }

    // Generate bottom hemisphere (from equator to bottom pole)
    for (let lat = 0; lat <= desc.heightSegments; lat++) {
      const theta = Math.PI / 2 + (lat * Math.PI) / (2 * desc.heightSegments);
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      for (let lon = 0; lon <= desc.widthSegments; lon++) {
        const phi = (lon * 2 * Math.PI) / desc.widthSegments;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        const x = desc.radius * cosPhi * sinTheta;
        const y = desc.radius * cosTheta - halfHeight;
        const z = desc.radius * sinPhi * sinTheta;

        positions.push(x, y, z);

        const u = 1 - lon / desc.widthSegments;
        const v = (desc.heightSegments * 2 + lat) / (desc.heightSegments * 3 + 1);
        texcoords.push(u, v);

        const normal = Vector3.normalize(Vector3.fromCopy3(cosPhi * sinTheta, cosTheta, sinPhi * sinTheta));
        normals.push(normal.x, normal.y, normal.z);
      }
    }

    // Calculate total number of latitude rows
    const topHemisphereRows = desc.heightSegments + 1;
    const cylinderRows = desc.heightSegments - 1;
    const bottomHemisphereRows = desc.heightSegments + 1;
    const totalRows = topHemisphereRows + cylinderRows + bottomHemisphereRows;

    // Generate indices
    for (let lat = 0; lat < totalRows - 1; lat++) {
      for (let lon = 0; lon < desc.widthSegments; lon++) {
        const first = lat * (desc.widthSegments + 1) + lon;
        const second = first + desc.widthSegments + 1;

        indices.push(first + 1, second, first);
        indices.push(first + 1, second + 1, second);
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
