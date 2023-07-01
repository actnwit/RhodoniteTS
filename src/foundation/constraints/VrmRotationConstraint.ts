import { ISceneGraphEntity } from '../helpers/EntityHelper';
import { Quaternion } from '../math';
import { IVrmConstraint } from './IVrmConstraint';

export class VrmRotationConstraint implements IVrmConstraint {
  private __srcEntity: ISceneGraphEntity;
  private __dstEntity: ISceneGraphEntity;
  private __weight: number;

  constructor(srcEntity: ISceneGraphEntity, weight: number, dstEntity: ISceneGraphEntity) {
    this.__srcEntity = srcEntity;
    this.__weight = weight;
    this.__dstEntity = dstEntity;
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
