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
    let srcRestQ: IQuaternion;
    if(Is.exist(srcEntity.tryToGetAnimation())) {
      srcRestQ = srcEntity.tryToGetAnimation()!.restQuaternion;
    } else {
      srcRestQ = srcEntity.getTransform().quaternionInner;
      console.log("!!!!!!!!!!!!!!")
    }

    return srcRestQ;
  }

  getSrcPGRestQ(srcEntity: ISceneGraphEntity) {
    let srcPGRestQ: IQuaternion;
    // if (Is.exist(srcEntity.getSceneGraph().parent?.entity.tryToGetAnimation())) {
    //   srcPGRestQ = srcEntity.getSceneGraph().parent!.entity.tryToGetAnimation()!.globalRestQuaternion;
    // } else {
    //   srcPGRestQ = Quaternion.fromMatrix(srcEntity.getSceneGraph().parent!.entity.getSceneGraph().worldMatrixInner);
    //   console.log("@@@@@@@@@@@@@@@@@@@@");
    // }
    const parent = srcEntity.getSceneGraph().parent;
    if (Is.exist(parent)) {
      srcPGRestQ = parent.entity.getGlobalRestQuaternion();
    } else {
      srcPGRestQ = Quaternion.identity();
      console.log("#################################");
    }

    return srcPGRestQ;
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
    const dstRestQ = Is.exist(dstEntity.tryToGetAnimation()) ? dstEntity.tryToGetAnimation()!.restQuaternion : dstEntity.getTransform().quaternionInner;
    // const dstPgRestQ = Is.exist(dstEntity.getSceneGraph().parent?.entity.tryToGetAnimation()) ?
    //   Quaternion.fromMatrix(dstEntity.getSceneGraph().parent!.entity.tryToGetAnimation()!.globalRestMatrix) :
    //   Quaternion.fromMatrix(dstEntity.getSceneGraph().parent!.entity.getSceneGraph().worldMatrixInner);
    const dstPgRestQ = Is.exist(dstEntity.getSceneGraph().parent?.entity.tryToGetAnimation()) ?
      dstEntity.getSceneGraph().parent!.entity.tryToGetAnimation()!.globalRestQuaternion :
      Quaternion.fromMatrix(dstEntity.getSceneGraph().parent!.entity.getSceneGraph().worldMatrixInner);

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
    const srcRestT = Is.exist(srcEntity.tryToGetAnimation()) ? srcEntity.tryToGetAnimation()!.restTranslate : srcEntity.getTransform().translateInner;
    // const srcPGRestQ = Is.exist(srcEntity.getSceneGraph().parent?.entity.tryToGetAnimation()) ?
    //   Quaternion.fromMatrix(srcEntity.getSceneGraph().parent!.entity.tryToGetAnimation()!.globalRestMatrix) :
    //   Quaternion.fromMatrix(srcEntity.getSceneGraph().parent!.entity.getSceneGraph().worldMatrixInner) as Quaternion;
    const srcPGRestQ = Is.exist(srcEntity.getSceneGraph().parent?.entity.tryToGetAnimation()) ?
      srcEntity.getSceneGraph().parent!.entity.tryToGetAnimation()!.globalRestQuaternion :
      Quaternion.fromMatrix(srcEntity.getSceneGraph().parent!.entity.getSceneGraph().worldMatrixInner) as Quaternion;
    const srcDelta = Vector3.subtract(srcPoseT, srcRestT);
    const AnimT = srcPGRestQ.transformVector3(srcDelta);

    // retarget translate to local pose
    const dstRestT = Is.exist(dstEntity.tryToGetAnimation()) ? dstEntity.tryToGetAnimation()!.restTranslate : dstEntity.getTransform().translateInner;
    // const dstPgRestQ = Is.exist(dstEntity.getSceneGraph().parent?.entity.tryToGetAnimation()) ?
    //   Quaternion.fromMatrix(dstEntity.getSceneGraph().parent!.entity.tryToGetAnimation()!.globalRestMatrix) :
    //   Quaternion.fromMatrix(dstEntity.getSceneGraph().parent!.entity.getSceneGraph().worldMatrixInner)
    const dstPgRestQ = Is.exist(dstEntity.getSceneGraph().parent?.entity.tryToGetAnimation()) ?
      dstEntity.getSceneGraph().parent!.entity.tryToGetAnimation()!.globalRestQuaternion :
      Quaternion.fromMatrix(dstEntity.getSceneGraph().parent!.entity.getSceneGraph().worldMatrixInner)

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
