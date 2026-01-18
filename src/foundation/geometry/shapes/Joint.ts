import { PrimitiveMode } from '../../definitions/PrimitiveMode';
import { VertexAttribute } from '../../definitions/VertexAttribute';
import type { IVector3 } from '../../math/IVector';
import { Vector3 } from '../../math/Vector3';
import type { Accessor } from '../../memory/Accessor';
import type { IAnyPrimitiveDescriptor } from '../Primitive';
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

  private static readonly __lineSegmentCount = 12;
  private static readonly __componentsPerVertex = 3;
  private __positionsBuffer = new Float32Array(Joint.__lineSegmentCount * 2 * Joint.__componentsPerVertex);

  private __positionAccessor?: Accessor;

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
    const positions = this.__updatePositionsBuffer();

    this.copyVertexData({
      attributes: [positions],
      attributeSemantics: [VertexAttribute.Position.XYZ],
      primitiveMode: PrimitiveMode.Lines,
      material: desc?.material,
    });

    this.__positionAccessor = this.getAttribute(VertexAttribute.Position.XYZ);
  }

  /**
   * Updates the joint geometry to connect the specified world positions.
   * @param worldPositionOfThisJoint - world-space position of this joint
   * @param worldPositionOfParentJoint - world-space position of the parent joint
   * @param width - optional width override for the joint visualization
   */
  setWorldPositions(worldPositionOfThisJoint: IVector3, worldPositionOfParentJoint: IVector3, width?: number): void {
    this.__worldPositionOfThisJoint = Vector3.fromCopyVector3(worldPositionOfThisJoint);
    this.__worldPositionOfParentJoint = Vector3.fromCopyVector3(worldPositionOfParentJoint);
    if (width !== undefined) {
      this.__width = width;
    }
    this.__applyPositionsToAccessor();
  }

  private __applyPositionsToAccessor() {
    if (this.__positionAccessor == null) {
      return;
    }
    const positions = this.__updatePositionsBuffer();
    const vertexCount = positions.length / Joint.__componentsPerVertex;
    for (let i = 0; i < vertexCount; i++) {
      const baseIndex = i * Joint.__componentsPerVertex;
      this.__positionAccessor.setVec3(i, positions[baseIndex], positions[baseIndex + 1], positions[baseIndex + 2], {});
    }
  }

  private __updatePositionsBuffer(): Float32Array {
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

    const buffer = this.__positionsBuffer;
    let offset = 0;

    const writeVector = (vec: Vector3) => {
      buffer[offset++] = vec.x;
      buffer[offset++] = vec.y;
      buffer[offset++] = vec.z;
    };

    const writeLine = (start: Vector3, end: Vector3) => {
      writeVector(start);
      writeVector(end);
    };

    // Long Pyramid
    writeLine(this.__worldPositionOfThisJoint, crossPosition);
    writeLine(this.__worldPositionOfThisJoint, crossPosition2);
    writeLine(this.__worldPositionOfThisJoint, crossPosition3);
    writeLine(this.__worldPositionOfThisJoint, crossPosition4);

    // Plane
    writeLine(crossPosition, crossPosition2);
    writeLine(crossPosition2, crossPosition3);
    writeLine(crossPosition3, crossPosition4);
    writeLine(crossPosition4, crossPosition);

    // Short Pyramid
    writeLine(this.__worldPositionOfParentJoint, crossPosition);
    writeLine(this.__worldPositionOfParentJoint, crossPosition2);
    writeLine(this.__worldPositionOfParentJoint, crossPosition3);
    writeLine(this.__worldPositionOfParentJoint, crossPosition4);

    return buffer;
  }
}
