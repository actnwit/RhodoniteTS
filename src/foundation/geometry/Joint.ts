import Vector3 from '../../foundation/math/Vector3';
import {Primitive} from '../../foundation/geometry/Primitive';
import {PrimitiveMode} from '../definitions/PrimitiveMode';
import {VertexAttribute} from '../definitions/VertexAttribute';
import Material from '../materials/core/Material';

export interface JointDescriptor {
  /** attach a rhodonite material to this plane(the default material is the classicUberMaterial */
  material?: Material;
}

/**
 * the Joint class
 */
export class Joint extends Primitive {
  private __worldPositionOfThisJoint = Vector3.fromCopyArray3([0, 0, 1]);
  private __worldPositionOfParentJoint = Vector3.fromCopyArray3([0, 0, 0]);
  private __width = 1;

  /**
   * Generates a joint object
   */
  public generate(desc: JointDescriptor): void {
    const length = Vector3.lengthBtw(
      this.__worldPositionOfThisJoint,
      this.__worldPositionOfParentJoint
    );
    const arrowWidth = this.__width;
    const arrowheadLength = length / 7.5;
    const arrowStickLength = length - arrowheadLength;

    const deltaVec = Vector3.subtract(
      this.__worldPositionOfParentJoint,
      this.__worldPositionOfThisJoint
    );
    let directionToParent = Vector3.fromCopyArray3([0, 1, 0]);
    if (!deltaVec.isEqual(Vector3.zero())) {
      directionToParent = Vector3.normalize(
        Vector3.subtract(
          this.__worldPositionOfParentJoint,
          this.__worldPositionOfThisJoint
        )
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
    const crossVector = Vector3.multiply(
      Vector3.normalize(Vector3.cross(directionToParent, dummyVector)),
      arrowWidth
    );
    const crossVector2 = Vector3.multiply(
      Vector3.normalize(Vector3.cross(directionToParent, crossVector)),
      arrowWidth
    );
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
