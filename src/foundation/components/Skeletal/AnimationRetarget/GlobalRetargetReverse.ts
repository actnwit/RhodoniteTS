/* eslint-disable prettier/prettier */
import { ISceneGraphEntity } from '../../../helpers/EntityHelper';
import { IVector3, MathUtil, Matrix44, Quaternion, Vector3 } from '../../../math';
import { IQuaternion } from '../../../math/IQuaternion';
import { Is } from '../../../misc/Is';
import { IAnimationRetarget } from './AnimationRetarget';

export class GlobalRetargetReverse implements IAnimationRetarget {
  private __srcEntity: ISceneGraphEntity;
  static readonly __rev = Quaternion.fromAxisAngle(Vector3.fromCopy3(0, 1, 0), Math.PI);

  constructor(srcEntity: ISceneGraphEntity) {
    this.__srcEntity = srcEntity;
  }

  getSrcPGRestQ(srcEntity: ISceneGraphEntity) {
    let srcPGRestQ: IQuaternion;
    const parent = srcEntity.getSceneGraph().parent;
    if (Is.exist(parent)) {
      srcPGRestQ = parent.getRotationRest((sg) => {
        const parent = sg.parent;
        if (Is.exist(parent)) {
          const vrm = parent.entity.tryToGetVrm();
          return Is.exist(vrm);
        } else {
          return true;
        }
      });
    } else {
      srcPGRestQ = Quaternion.identity();
    }

    return srcPGRestQ;
  }

  getDstPGRestQ(dstEntity: ISceneGraphEntity) {
    let dstPGRestQ: IQuaternion;
    const parent = dstEntity.getSceneGraph().parent;
    if (Is.exist(parent)) {
      dstPGRestQ = parent.getRotationRest((sg) => {
        const parent = sg.parent;
        if (Is.exist(parent)) {
          const vrm = parent.entity.tryToGetVrm();
          return Is.exist(vrm);
        } else {
          return true;
        }
      });
    } else {
      dstPGRestQ = Quaternion.identity();
    }

    return dstPGRestQ;
  }

  retargetQuaternion(dstEntity: ISceneGraphEntity): IQuaternion {
    const srcEntity = this.__srcEntity;

    // extract global retarget quaternion
    const srcPoseQ = srcEntity.getTransform().localRotationInner;
    const srcRestQ = srcEntity.getTransform().localRotationRestInner;
    const srcPGRestQ = this.getSrcPGRestQ(srcEntity);

    const animQ = Quaternion.multiply(
      srcPGRestQ,
      Quaternion.multiply(
        srcPoseQ,
        Quaternion.multiply(Quaternion.invert(srcRestQ), Quaternion.invert(srcPGRestQ))
      )
    );

    // retarget quaternion to local pose
    const dstRestQ = dstEntity.getTransform().localRotationRestInner;
    const dstPgRestQ = this.getDstPGRestQ(dstEntity);

    const tgtPoseQ = Quaternion.multiply(
      Quaternion.invert(dstPgRestQ),
      Quaternion.multiply(animQ, Quaternion.multiply(dstPgRestQ, dstRestQ))
    );

    const tgtPoseQRev = Quaternion.multiply(
      Quaternion.multiply(GlobalRetargetReverse.__rev, tgtPoseQ),
      Quaternion.invert(GlobalRetargetReverse.__rev)
    );

    return tgtPoseQRev;
  }

  retargetTranslate(dstEntity: ISceneGraphEntity): IVector3 {
    const srcEntity = this.__srcEntity;

    // extract global retarget translate
    const srcPoseT = srcEntity.getTransform().localPositionInner;
    const srcRestT = srcEntity.getTransform().localPositionRestInner;
    const srcPGRestQ = this.getSrcPGRestQ(srcEntity);
    const srcDelta = Vector3.subtract(srcPoseT, srcRestT);
    const AnimT = srcPGRestQ.transformVector3(srcDelta);

    // retarget translate to local pose
    const dstRestT = dstEntity.getTransform().localPositionRestInner;
    const dstPgRestQ = this.getDstPGRestQ(dstEntity);

    const dstPoseT = Vector3.add(dstPgRestQ.transformVector3Inverse(AnimT), dstRestT);

    if (srcEntity.uniqueName.indexOf('hips') >= 0) {
      const dstPoseT2 = Vector3.multiply(dstPoseT, srcEntity.parent!.scale.x);
      const dstPoseTRev = GlobalRetargetReverse.__rev.transformVector3(dstPoseT2);
      return dstPoseTRev;
    }
    return dstPoseT;
  }

  retargetScale(dstEntity: ISceneGraphEntity): IVector3 {
    const srcEntity = this.__srcEntity;

    return srcEntity.getTransform().localScaleInner;
  }
}
