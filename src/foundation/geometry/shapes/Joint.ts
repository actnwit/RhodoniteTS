import { Vector3 } from '../../math/Vector3';
import { IAnyPrimitiveDescriptor, Primitive } from '../Primitive';
import { PrimitiveMode } from '../../definitions/PrimitiveMode';
import { VertexAttribute } from '../../definitions/VertexAttribute';
import { IShape } from './IShape';

export type JointDescriptor = IAnyPrimitiveDescriptor;

/**
 * The Joint class represents a 3D joint visualization that creates an arrow-like shape
 * connecting two world positions, typically used for displaying skeletal connections
 * or hierarchical relationships in 3D space.
 */
export class Joint extends IShape {
  /** The world position of this joint (the starting point of the arrow) */
  private __worldPositionOfThisJoint = Vector3.fromCopyArray3([0, 0, 1]);

  /** The world position of the parent joint (the ending point of the arrow) */
  private __worldPositionOfParentJoint = Vector3.fromCopyArray3([0, 0, 0]);

  /** The width of the arrow shape */
  private __width = 1;

  /**
   * Generates a 3D joint visualization as an arrow-like shape connecting two points.
   * The joint is rendered as a combination of pyramidal shapes and connecting lines,
   * creating a visual representation of the connection between this joint and its parent.
   *
   * @param desc - The primitive descriptor containing material and other rendering properties
   *
   * @remarks
   * The generated shape consists of:
   * - A long pyramid extending from this joint towards the parent
   * - A connecting plane section
   * - A short pyramid at the parent joint position
   * All rendered as line segments for wireframe visualization
   */
  public generate(desc: JointDescriptor): void {
    const length = Vector3.lengthBtw(this.__worldPositionOfThisJoint, this.__worldPositionOfParentJoint);
    const arrowWidth = this.__width;
    const arrowheadLength = length / 7.5;
    const arrowStickLength = length - arrowheadLength;

    const deltaVec = Vector3.subtract(this.__worldPositionOfParentJoint, this.__worldPositionOfThisJoint);
    let directionToParent = Vector3.fromCopyArray3([0, 1, 0]);
    if (!deltaVec.isEqual(Vector3.zero())) {
      directionToParent = Vector3.normalize(
        Vector3.subtract(this.__worldPositionOfParentJoint, this.__worldPositionOfThisJoint)
      );
    }
    const arrowStickPosition = Vector3.add(
      this.__worldPositionOfThisJoint,
      Vector3.multiply(directionToParent, arrowStickLength)
    );

    let dummyVector = Vector3.fromCopyArray3([0, 1, 0]);
    let dummyVector2 = Vector3.fromCopyArray3([0, -1, 0]);
    if (Math.abs(Vector3.dot(directionToParent, dummyVector)) > 0.4) {
      dummyVector = Vector3.fromCopyArray3([1, 0, 0]);
      dummyVector2 = Vector3.fromCopyArray3([-1, 0, 0]);
    }
    if (Math.abs(Vector3.dot(directionToParent, dummyVector)) > 0.4) {
      dummyVector = Vector3.fromCopyArray3([0, 0, 1]);
      dummyVector2 = Vector3.fromCopyArray3([0, 0, -1]);
    }
    const crossVector = Vector3.multiply(Vector3.normalize(Vector3.cross(directionToParent, dummyVector)), arrowWidth);
    const crossVector2 = Vector3.multiply(Vector3.normalize(Vector3.cross(directionToParent, crossVector)), arrowWidth);
    const crossVector3 = Vector3.multiply(
      Vector3.normalize(Vector3.cross(directionToParent, dummyVector2)),
      arrowWidth
    );
    const crossVector4 = Vector3.multiply(
      Vector3.normalize(Vector3.cross(directionToParent, crossVector3)),
      arrowWidth
    );

    const crossPosition = Vector3.add(arrowStickPosition, crossVector);
    const crossPosition2 = Vector3.add(arrowStickPosition, crossVector2);
    const crossPosition3 = Vector3.add(arrowStickPosition, crossVector3);
    const crossPosition4 = Vector3.add(arrowStickPosition, crossVector4);

    const pos: Vector3[] = [];

    // Long Pyramid
    pos.push(this.__worldPositionOfThisJoint);
    pos.push(crossPosition);

    pos.push(this.__worldPositionOfThisJoint);
    pos.push(crossPosition2);

    pos.push(this.__worldPositionOfThisJoint);
    pos.push(crossPosition3);

    pos.push(this.__worldPositionOfThisJoint);
    pos.push(crossPosition4);

    // Plane
    pos.push(crossPosition);
    pos.push(crossPosition2);

    pos.push(crossPosition2);
    pos.push(crossPosition3);
    pos.push(crossPosition3);
    pos.push(crossPosition4);
    pos.push(crossPosition4);
    pos.push(crossPosition);

    // Short Pyramid
    pos.push(this.__worldPositionOfParentJoint);
    pos.push(crossPosition);

    pos.push(this.__worldPositionOfParentJoint);
    pos.push(crossPosition2);

    pos.push(this.__worldPositionOfParentJoint);
    pos.push(crossPosition3);

    pos.push(this.__worldPositionOfParentJoint);
    pos.push(crossPosition4);

    const positions: number[] = [];
    pos.map(vec => {
      Array.prototype.push.apply(positions, vec.flattenAsArray());
    });

    const attributes = [new Float32Array(positions)];

    // Check Size
    const attributeSemantics = [VertexAttribute.Position.XYZ];

    this.copyVertexData({
      attributes,
      attributeSemantics,
      primitiveMode: PrimitiveMode.Lines,
      material: desc?.material,
    });
  }
}
