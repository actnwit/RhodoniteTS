import { ISceneGraphEntity } from '../helpers/EntityHelper';
import { Quaternion } from '../math';
import { IVrmConstraint } from './IVrmConstraint';

/**
 * VrmRotationConstraint is a constraint that rotates a node to match the rotation of another node.
 */
export class VrmRotationConstraint implements IVrmConstraint {
  private __srcEntity: ISceneGraphEntity;
  private __dstEntity: ISceneGraphEntity;
  private __weight: number;

  constructor(srcEntity: ISceneGraphEntity, weight: number, dstEntity: ISceneGraphEntity) {
    this.__srcEntity = srcEntity;
    this.__weight = weight;
    this.__dstEntity = dstEntity;
    this.__dstEntity.getTransform()._backupTransformAsRest();
  }

  update(): void {
    const srcDeltaQuat = Quaternion.multiply(
      Quaternion.invert(this.__srcEntity.localRotationRestInner),
      this.__srcEntity.localRotationInner
    );

    const targetQuat = Quaternion.lerp(
      this.__dstEntity.localRotationRestInner,
      Quaternion.multiply(this.__dstEntity.localRotationRestInner, srcDeltaQuat),
      this.__weight
    );

    this.__dstEntity.localRotation = targetQuat;
  }
}
