/* eslint-disable prettier/prettier */
import {ISceneGraphEntity} from '../../../helpers/EntityHelper';
import { IVector3, Matrix44, Quaternion, Vector3 } from '../../../math';
import {IQuaternion} from '../../../math/IQuaternion';
import {IAnimationRetarget} from './AnimationRetarget';

export class GlobalRetarget implements IAnimationRetarget {
  retargetQuaternion(
    srcEntity: ISceneGraphEntity,
    dstEntity: ISceneGraphEntity
  ): IQuaternion {
    const srcPoseQ = srcEntity.getTransform().quaternionInner;
    const srcRestQ = srcEntity.tryToGetAnimation()!.restQuaternion;
    const srcPGRestQ = srcEntity.getSceneGraph().parent!.entity.tryToGetAnimation()!.globalRestQuaternion;

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

    const dstRestQ = dstEntity.tryToGetAnimation()!.restQuaternion;
    const dstPgRestQ = dstEntity.getSceneGraph().parent!.entity.tryToGetAnimation()!.globalRestQuaternion;

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
    srcEntity: ISceneGraphEntity,
    dstEntity: ISceneGraphEntity
  ): IVector3 {
    const pose = srcEntity.getTransform().translateInner;
    const rest = srcEntity.tryToGetAnimation()!.restTranslate;
    const delta = Vector3.subtract(pose, rest);

    const parentPgRest = srcEntity.getSceneGraph().parent!.entity.tryToGetAnimation()!.globalRestQuaternion;
    const dstPose = Matrix44.fromCopyQuaternion(parentPgRest).multiplyVector3(delta);

    return dstPose;
  }

  retargetScale(
    srcEntity: ISceneGraphEntity,
    dstEntity: ISceneGraphEntity
  ): IVector3 {
    return srcEntity.getTransform().scaleInner;
  }
}
