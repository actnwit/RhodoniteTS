import { ISceneGraphEntity } from '../helpers';
import { Quaternion } from '../math/Quaternion';
import { Vector3 } from '../math/Vector3';

export class VrmRollConstraint {
  private __srcEntity: ISceneGraphEntity;
  private __dstEntity: ISceneGraphEntity;
  private __rollAxis: 'X' | 'Y' | 'Z';
  private __weight: number;

  constructor(
    sourceEntity: ISceneGraphEntity,
    rollAxis: 'X' | 'Y' | 'Z',
    weight: number,
    distEntity: ISceneGraphEntity
  ) {
    this.__srcEntity = sourceEntity;
    this.__rollAxis = rollAxis;
    this.__weight = weight;
    this.__dstEntity = distEntity;
  }

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
