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
    const srcRestQ = Is.exist(srcEntity.tryToGetAnimation()) ? srcEntity.tryToGetAnimation()!.restQuaternion : srcEntity.getTransform().quaternionInner;
    // const srcRestQ = Is.exist(srcEntity.tryToGetAnimation()) ? srcEntity.tryToGetAnimation()!.restQuaternion : Quaternion.identity();
    const srcPGRestQ = Is.exist(srcEntity.getSceneGraph().parent?.entity.tryToGetAnimation()) ?
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
    // const animQ =
    //   Quaternion.multiply(
    //     srcPGRestQ,
    //       Quaternion.multiply(
    //         srcPoseQ,
    //           Quaternion.multiply(
    //             Quaternion.invert(srcRestQ),
    //               Quaternion.invert(srcPGRestQ)
    //           )
    //       )
    //   );
    // const animQ =
    //   Quaternion.multiply(
    //     Quaternion.invert(srcPGRestQ),
    //       Quaternion.multiply(
    //             Quaternion.invert(srcRestQ),
    //           Quaternion.multiply(
    //             srcPoseQ,
    //             srcPGRestQ,
    //           )
    //       )
    //   );

    // retarget quaternion to local pose
    const dstRestQ = Is.exist(dstEntity.tryToGetAnimation()) ? dstEntity.tryToGetAnimation()!.restQuaternion : dstEntity.getTransform().quaternionInner;
    // const dstRestQ = Is.exist(dstEntity.tryToGetAnimation()) ? dstEntity.tryToGetAnimation()!.restQuaternion : Quaternion.identity();
    const dstPgRestQ = Is.exist(dstEntity.getSceneGraph().parent?.entity.tryToGetAnimation()) ?
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
    // const tgtPoseQ =
    //   Quaternion.multiply(
    //     Quaternion.invert(dstPgRestQ),
    //       Quaternion.multiply(
    //         animQ,
    //           Quaternion.multiply(
    //             dstRestQ,
    //             dstPgRestQ
    //           )
    //       )
    //   );
    // const tgtPoseQ =
    //   Quaternion.multiply(
    //     dstRestQ,
    //       Quaternion.multiply(
    //         dstPgRestQ,
    //           Quaternion.multiply(
    //             animQ,
    //             Quaternion.invert(dstPgRestQ),
    //           )
    //       )
    //   );
    // const tgtPoseQ =
    //   Quaternion.multiply(
    //     dstPgRestQ,
    //       Quaternion.multiply(
    //         dstRestQ,
    //           Quaternion.multiply(
    //             animQ,
    //             Quaternion.invert(dstPgRestQ),
    //           )
    //       )
    //   );

    return tgtPoseQ;
  }

  retargetTranslate(
    dstEntity: ISceneGraphEntity
  ): IVector3 {
    const srcEntity = this.__srcEntity;

    // extract global retarget translate
    const srcPoseT = srcEntity.getTransform().translateInner;
    const srcRestT = Is.exist(srcEntity.tryToGetAnimation()) ? srcEntity.tryToGetAnimation()!.restTranslate : srcEntity.getTransform().translateInner;
    const srcPGRestQ = Is.exist(srcEntity.getSceneGraph().parent?.entity.tryToGetAnimation()) ?
      srcEntity.getSceneGraph().parent!.entity.tryToGetAnimation()!.globalRestQuaternion :
      Quaternion.identity();
    const srcDelta = Vector3.subtract(srcPoseT, srcRestT);
    const AnimT = Matrix44.fromCopyQuaternion(srcPGRestQ).multiplyVector3(srcDelta);

    // retarget translate to local pose
    const dstRestT = Is.exist(dstEntity.tryToGetAnimation()) ? dstEntity.tryToGetAnimation()!.restTranslate : dstEntity.getTransform().translateInner;
    const dstPgRestQ = Is.exist(dstEntity.getSceneGraph().parent?.entity.tryToGetAnimation()) ?
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
