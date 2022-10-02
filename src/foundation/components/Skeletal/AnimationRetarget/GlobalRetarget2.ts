/* eslint-disable prettier/prettier */
import {ISceneGraphEntity} from '../../../helpers/EntityHelper';
import { IVector3, Matrix44, Quaternion, Vector3 } from '../../../math';
import {IQuaternion} from '../../../math/IQuaternion';
import { Is } from '../../../misc/Is';
import {IAnimationRetarget} from './AnimationRetarget';

export class GlobalRetarget2 implements IAnimationRetarget {
  private __srcEntity: ISceneGraphEntity;

  constructor(srcEntity: ISceneGraphEntity) {
    this.__srcEntity = srcEntity;
  }

  retargetQuaternion(
    dstEntity: ISceneGraphEntity
  ): IQuaternion {
    const srcEntity = this.__srcEntity;
    const srcInverseBindMatrix = Is.exist(srcEntity.tryToGetAnimation()) ? srcEntity.tryToGetAnimation()!.inverseBindMatrix! : Matrix44.identity();
    const srcWorldMatrix = srcEntity.getSceneGraph().worldMatrixInner;

    // const localMatrix = Matrix44.multiply(srcInverseBindMatrix, srcWorldMatrix);
    const localMatrix = Matrix44.multiply(srcWorldMatrix, srcInverseBindMatrix);
    const dstWorldMatrix = Is.exist(dstEntity.tryToGetAnimation()?.inverseBindMatrix) ? Matrix44.invert(dstEntity.tryToGetAnimation()!.inverseBindMatrix! as Matrix44) : Matrix44.identity();
    const dstInverseParentMatrix = Is.exist(dstEntity.getSceneGraph().parent?.entity.tryToGetAnimation()?.inverseBindMatrix) ?
      dstEntity.getSceneGraph().parent!.entity.tryToGetAnimation()!.inverseBindMatrix! : Matrix44.identity();

    // const localMatrix2 =
    //   Matrix44.multiply(dstWorldMatrix,
    //     Matrix44.multiply(
    //       localMatrix,
    //       dstInverseParentMatrix));
    const localMatrix2 =
      Matrix44.multiply(dstInverseParentMatrix,
        Matrix44.multiply(
          localMatrix,
          dstWorldMatrix));

    const quaternion = Quaternion.fromMatrix(localMatrix2);

    return quaternion;
  }

  retargetTranslate(
    dstEntity: ISceneGraphEntity
  ): IVector3 {
    const srcEntity = this.__srcEntity;
    const srcInverseBindMatrix = Is.exist(srcEntity.tryToGetAnimation()) ? srcEntity.tryToGetAnimation()!.inverseBindMatrix! : Matrix44.identity();
    const srcWorldMatrix = srcEntity.getSceneGraph().worldMatrixInner;

    // const localMatrix = Matrix44.multiply(srcInverseBindMatrix, srcWorldMatrix);
    const localMatrix = Matrix44.multiply(srcWorldMatrix, srcInverseBindMatrix);
    const dstWorldMatrix = Is.exist(dstEntity.tryToGetAnimation()?.inverseBindMatrix) ? Matrix44.invert(dstEntity.tryToGetAnimation()!.inverseBindMatrix! as Matrix44) : Matrix44.identity();
    const dstInverseParentMatrix = Is.exist(dstEntity.getSceneGraph().parent?.entity.tryToGetAnimation()?.inverseBindMatrix) ?
      dstEntity.getSceneGraph().parent!.entity.tryToGetAnimation()!.inverseBindMatrix! : Matrix44.identity();

    // const localMatrix2 =
    //   Matrix44.multiply(dstWorldMatrix,
    //     Matrix44.multiply(
    //       localMatrix,
    //       dstInverseParentMatrix));
    const localMatrix2 =
      Matrix44.multiply(dstInverseParentMatrix,
        Matrix44.multiply(
          localMatrix,
          dstWorldMatrix));

    const translate = localMatrix2.getTranslate();

    return translate;
  }

  retargetScale(
    dstEntity: ISceneGraphEntity
  ): IVector3 {
    const srcEntity = this.__srcEntity;

    return srcEntity.getTransform().scaleInner;
  }
}
