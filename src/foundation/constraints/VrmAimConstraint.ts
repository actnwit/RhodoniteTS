import { ISceneGraphEntity } from '../helpers/EntityHelper';
import { Quaternion } from '../math';
import { Vector3 } from '../math/Vector3';
import { Is } from '../misc/Is';

/**
 * VrmAimConstraint is a constraint that aims a node at a target.
 */
export class VrmAimConstraint {
  private __srcEntity: ISceneGraphEntity;
  private __dstEntity: ISceneGraphEntity;
  private __aimAxis:
    | 'PositiveX'
    | 'NegativeX'
    | 'PositiveY'
    | 'NegativeY'
    | 'PositiveZ'
    | 'NegativeZ';
  private __weight: number;

  constructor(
    srcEntity: ISceneGraphEntity,
    aimAxis: 'PositiveX' | 'NegativeX' | 'PositiveY' | 'NegativeY' | 'PositiveZ' | 'NegativeZ',
    weight: number,
    dstEntity: ISceneGraphEntity
  ) {
    this.__srcEntity = srcEntity;
    this.__aimAxis = aimAxis;
    this.__weight = weight;
    this.__dstEntity = dstEntity;
    this.__dstEntity.getTransform()._backupTransformAsRest();
  }

  getAxisVector(
    aimAxis: 'PositiveX' | 'NegativeX' | 'PositiveY' | 'NegativeY' | 'PositiveZ' | 'NegativeZ'
  ) {
    switch (aimAxis) {
      case 'PositiveX':
        return Vector3.fromCopy3(1, 0, 0);
      case 'NegativeX':
        return Vector3.fromCopy3(-1, 0, 0);
      case 'PositiveY':
        return Vector3.fromCopy3(0, 1, 0);
      case 'NegativeY':
        return Vector3.fromCopy3(0, -1, 0);
      case 'PositiveZ':
        return Vector3.fromCopy3(0, 0, 1);
      case 'NegativeZ':
        return Vector3.fromCopy3(0, 0, -1);
      default:
        throw new Error('Invalid roll axis');
    }
  }

  update() {
    const aimAxis = this.getAxisVector(this.__aimAxis);
    const dstParentWorldQuat = Is.exist(this.__dstEntity.getSceneGraph().parent)
      ? this.__dstEntity.getSceneGraph().parent!.rotation
      : Quaternion.identity();
    const dstRestQuat = this.__dstEntity.localRotationRestInner;
    const fromVec = Quaternion.multiply(dstParentWorldQuat, dstRestQuat).transformVector3(aimAxis);
    const toVec = Vector3.normalize(
      Vector3.subtract(this.__srcEntity.position, this.__dstEntity.position)
    );
    const fromToQuat = Quaternion.fromToRotation(fromVec, toVec);

    const targetQuat = Quaternion.lerp(
      dstRestQuat,
      Quaternion.multiply(
        Quaternion.multiply(
          Quaternion.multiply(Quaternion.invert(dstParentWorldQuat), fromToQuat),
          dstParentWorldQuat
        ),
        dstRestQuat
      ),
      this.__weight
    );

    this.__dstEntity.localRotation = targetQuat;
  }
}
