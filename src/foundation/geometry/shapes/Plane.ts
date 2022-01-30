import {IAnyPrimitiveDescriptor, Primitive} from '../Primitive';
import {VertexAttribute} from '../../definitions/VertexAttribute';
import {PrimitiveMode} from '../../definitions/PrimitiveMode';
import {Size} from '../../../types/CommonTypes';
import {IShape} from './IShape';

export interface PlaneDescriptor extends IAnyPrimitiveDescriptor {
  /** the length of U(X)-axis direction */
  width: Size;
  /** the length of V(Y)-axis direction */
  height: Size;
  /** number of spans in U(X)-axis direction */
  uSpan: Size;
  /** number of spans in V(Y)-axis direction */
  vSpan: Size;
  /** draw uSpan times vSpan number of textures */
  isUVRepeat: boolean;
  /** draw textures by flipping on the V(Y)-axis */
  flipTextureCoordinateY?: boolean;
}

/**
 * Plane class
 *
 */
export class Plane extends Primitive implements IShape {
  /**
   * Generates a plane object
   * @param desc a descriptor object of a Plane
   */
  public generate(desc: PlaneDescriptor): void {
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
    const attributeSemantics = [
      VertexAttribute.Position.XYZ,
      VertexAttribute.Normal.XYZ,
      VertexAttribute.Texcoord0.XY,
    ];
    const primitiveMode = PrimitiveMode.TriangleStrip;
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
      material: desc?.material,
    });
  }
}
