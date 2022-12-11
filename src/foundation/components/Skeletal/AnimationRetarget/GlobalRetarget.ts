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

  getSrcRestQ(srcEntity: ISceneGraphEntity) {
    const srcRestQ = srcEntity.getTransform().quaternionRestInner;

    return srcRestQ;
  }

  getSrcPGRestQ(srcEntity: ISceneGraphEntity) {
    let srcPGRestQ: IQuaternion;
    const parent = srcEntity.getSceneGraph().parent;
    if (Is.exist(parent)) {
      srcPGRestQ = parent.quaternionRest;
    } else {
      srcPGRestQ = Quaternion.identity();
    }

    return srcPGRestQ;
  }

  getDstPGRestQ(dstEntity: ISceneGraphEntity) {
    let dstPGRestQ: IQuaternion;
    const parent = dstEntity.getSceneGraph().parent;
    if (Is.exist(parent)) {
      dstPGRestQ = parent.quaternionRest;
    } else {
      dstPGRestQ = Quaternion.identity();
    }

    return dstPGRestQ;
  }

  retargetQuaternion(
    dstEntity: ISceneGraphEntity
  ): IQuaternion {
    const srcEntity = this.__srcEntity;

    // extract global retarget quaternion
    const srcPoseQ = srcEntity.getTransform().quaternionInner;
    const srcRestQ = this.getSrcRestQ(srcEntity);
    const srcPGRestQ = this.getSrcPGRestQ(srcEntity);

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
    const dstRestQ = dstEntity.getTransform().quaternionRestInner;
    const dstPgRestQ = this.getDstPGRestQ(dstEntity);

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

    return (tgtPoseQ);
  }

  retargetTranslate(
    dstEntity: ISceneGraphEntity
  ): IVector3 {
    const srcEntity = this.__srcEntity;

    // extract global retarget translate
    const srcPoseT = srcEntity.getTransform().translateInner;
    const srcRestT = srcEntity.getTransform().translateRestInner;
    const srcPGRestQ = this.getSrcPGRestQ(srcEntity);
    const srcDelta = Vector3.subtract(srcPoseT, srcRestT);
    const AnimT = srcPGRestQ.transformVector3(srcDelta);

    // retarget translate to local pose
    const dstRestT = dstEntity.getTransform().translateRestInner;
    const dstPgRestQ = this.getDstPGRestQ(dstEntity);

    const dstPoseT =
      Vector3.add(
        dstPgRestQ.transformVector3Inverse(AnimT),
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
