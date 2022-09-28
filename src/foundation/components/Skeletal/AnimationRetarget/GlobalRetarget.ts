/* eslint-disable prettier/prettier */
import {ISceneGraphEntity} from '../../../helpers/EntityHelper';
import { IVector3, Matrix44, Quaternion, Vector3 } from '../../../math';
import {IQuaternion} from '../../../math/IQuaternion';
import { Is } from '../../../misc/Is';
import {IAnimationRetarget} from './AnimationRetarget';

export class GlobalRetarget implements IAnimationRetarget {
  private __srcEntity: ISceneGraphEntity;

  constructor(srcEntity: ISceneGraphEntity) {
    this.__srcEntity = srcEntity;
  }

  retargetQuaternion(
    dstEntity: ISceneGraphEntity
  ): IQuaternion {
    const srcEntity = this.__srcEntity;

    // extract global retarget quaternion
    const srcPoseQ = srcEntity.getTransform().quaternionInner;
    const srcRestQ = srcEntity.tryToGetAnimation()!.restQuaternion;
    const srcPGRestQ = Is.exist(srcEntity.getSceneGraph().parent) ?
      srcEntity.getSceneGraph().parent!.entity.tryToGetAnimation()!.globalRestQuaternion :
      Quaternion.identity();

    const animQ =
      Quaternion.multiply(
        srcPGRestQ,
          Quaternion.multiply(
            srcPoseQ,
              Quaternion.multiply(
                Quaternion.invert(srcRestQ),
                  Quaternion.invert(srcPGRestQ)
              )
          )
      );

    // retarget quaternion to local pose
    const dstRestQ = dstEntity.tryToGetAnimation()!.restQuaternion;
    const dstPgRestQ = Is.exist(dstEntity.getSceneGraph().parent) ?
      dstEntity.getSceneGraph().parent!.entity.tryToGetAnimation()!.globalRestQuaternion :
      Quaternion.identity();

    const tgtPoseQ =
      Quaternion.multiply(
        Quaternion.invert(dstPgRestQ),
          Quaternion.multiply(
            animQ,
              Quaternion.multiply(
                dstPgRestQ,
                  dstRestQ
              )
          )
      );

    return tgtPoseQ;
  }

  retargetTranslate(
    dstEntity: ISceneGraphEntity
  ): IVector3 {
    const srcEntity = this.__srcEntity;

    // extract global retarget translate
    const srcPoseT = srcEntity.getTransform().translateInner;
    const srcRestT = srcEntity.tryToGetAnimation()!.restTranslate;
    const srcPGRestQ = Is.exist(srcEntity.getSceneGraph().parent) ?
      srcEntity.getSceneGraph().parent!.entity.tryToGetAnimation()!.globalRestQuaternion :
      Quaternion.identity();
    const srcDelta = Vector3.subtract(srcPoseT, srcRestT);
    const AnimT = Matrix44.fromCopyQuaternion(srcPGRestQ).multiplyVector3(srcDelta);

    // retarget translate to local pose
    const dstRestT = dstEntity.tryToGetAnimation()!.restTranslate;
    const dstPgRestQ = Is.exist(dstEntity.getSceneGraph().parent) ?
      dstEntity.getSceneGraph().parent!.entity.tryToGetAnimation()!.globalRestQuaternion :
      Quaternion.identity();

    const dstPoseT =
      Vector3.add(
        Matrix44.fromCopyQuaternion(Quaternion.invert(dstPgRestQ)).multiplyVector3(AnimT),
          dstRestT
        );

    return dstPoseT;
  }

  retargetScale(
    dstEntity: ISceneGraphEntity
  ): IVector3 {
    const srcEntity = this.__srcEntity;

    return srcEntity.getTransform().scaleInner;
  }
}
