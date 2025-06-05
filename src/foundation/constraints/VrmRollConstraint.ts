import { ISceneGraphEntity } from '../helpers';
import { Quaternion } from '../math/Quaternion';
import { Vector3 } from '../math/Vector3';

/**
 * VrmRollConstraint is a constraint that applies roll rotation from a source entity
 * to a destination entity around a specified axis. This constraint is commonly used
 * in VRM character rigs to transfer rotational motion while maintaining specific
 * axis constraints.
 */
export class VrmRollConstraint {
  private __srcEntity: ISceneGraphEntity;
  private __dstEntity: ISceneGraphEntity;
  private __rollAxis: 'X' | 'Y' | 'Z';
  private __weight: number;

  /**
   * Creates a new VrmRollConstraint instance.
   *
   * @param srcEntity - The source entity whose rotation will be used as input
   * @param rollAxis - The axis around which the roll constraint operates ('X', 'Y', or 'Z')
   * @param weight - The blend weight of the constraint (0.0 = no effect, 1.0 = full effect)
   * @param dstEntity - The destination entity that will receive the constrained rotation
   */
  constructor(
    srcEntity: ISceneGraphEntity,
    rollAxis: 'X' | 'Y' | 'Z',
    weight: number,
    dstEntity: ISceneGraphEntity
  ) {
    this.__srcEntity = srcEntity;
    this.__rollAxis = rollAxis;
    this.__weight = weight;
    this.__dstEntity = dstEntity;
    this.__dstEntity.getTransform()._backupTransformAsRest();
  }

  /**
   * Gets the unit vector for the specified roll axis.
   *
   * @param rollAxis - The axis identifier ('X', 'Y', or 'Z')
   * @returns A Vector3 representing the unit vector for the specified axis
   * @throws Error if an invalid axis is provided
   */
  getAxisVector(rollAxis: 'X' | 'Y' | 'Z') {
    switch (rollAxis) {
      case 'X':
        return Vector3.fromCopy3(1, 0, 0);
      case 'Y':
        return Vector3.fromCopy3(0, 1, 0);
      case 'Z':
        return Vector3.fromCopy3(0, 0, 1);
      default:
        throw new Error('Invalid roll axis');
    }
  }

  /**
   * Updates the constraint by calculating and applying the roll rotation
   * from the source entity to the destination entity. This method should
   * be called each frame to maintain the constraint relationship.
   *
   * The algorithm:
   * 1. Calculates the delta rotation of the source entity from its rest pose
   * 2. Transforms this rotation into the destination entity's coordinate space
   * 3. Projects the rotation onto the specified roll axis
   * 4. Applies the weighted result to the destination entity
   */
  update() {
    const deltaSrcQuat = Quaternion.multiply(
      Quaternion.invert(this.__srcEntity.localRotationRestInner),
      this.__srcEntity.localRotationInner
    );
    const deltaSrcQuatInParent = Quaternion.multiply(
      Quaternion.multiply(this.__srcEntity.localRotationRestInner, deltaSrcQuat),
      Quaternion.invert(this.__srcEntity.localRotationRestInner)
    );
    const deltaSrcQuatInDst = Quaternion.multiply(
      Quaternion.multiply(
        Quaternion.invert(this.__dstEntity.localRotationRestInner),
        deltaSrcQuatInParent
      ),
      this.__dstEntity.localRotationRestInner
    );

    const rollAxis = this.getAxisVector(this.__rollAxis);
    const toVec = deltaSrcQuatInDst.transformVector3(rollAxis);
    const fromToQuat = Quaternion.fromToRotation(rollAxis, toVec);

    const targetQuat = Quaternion.lerp(
      this.__dstEntity.localRotationRestInner,
      Quaternion.multiply(
        Quaternion.multiply(this.__dstEntity.localRotationRestInner, Quaternion.invert(fromToQuat)),
        deltaSrcQuatInDst
      ),
      this.__weight
    );

    this.__dstEntity.localRotation = targetQuat;
  }
}
