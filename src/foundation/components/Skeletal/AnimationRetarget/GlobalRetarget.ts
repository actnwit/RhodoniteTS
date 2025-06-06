/* eslint-disable prettier/prettier */
import { ISceneGraphEntity } from '../../../helpers/EntityHelper';
import { IVector3, Matrix44, Quaternion, Vector3 } from '../../../math';
import { IQuaternion } from '../../../math/IQuaternion';
import { Is } from '../../../misc/Is';
import { IAnimationRetarget } from './AnimationRetarget';

/**
 * Global retargeting implementation for animation retargeting.
 * This class handles retargeting of animations from one entity to another using global space transformations.
 */
export class GlobalRetarget implements IAnimationRetarget {
  private __srcEntity: ISceneGraphEntity;

  /**
   * Creates a new GlobalRetarget instance.
   * @param srcEntity - The source entity to retarget animations from
   */
  constructor(srcEntity: ISceneGraphEntity) {
    this.__srcEntity = srcEntity;
  }

  /**
   * Gets the source entity for retargeting.
   * @returns The source scene graph entity
   */
  getEntity(): ISceneGraphEntity {
    return this.__srcEntity;
  }

  /**
   * Gets the parent's global rest quaternion for the source entity.
   * This is used to transform from local space to global space for the source.
   * @param srcEntity - The source entity to get parent global rest quaternion for
   * @returns The parent's global rest quaternion, or identity if no parent exists
   */
  getSrcPGRestQ(srcEntity: ISceneGraphEntity) {
    let srcPGRestQ: IQuaternion;
    const parent = srcEntity.getSceneGraph().parent;
    if (Is.exist(parent)) {
      srcPGRestQ = parent.getRotationRest(sg => {
        return Is.exist(sg.entity.tryToGetVrm());
      });
    } else {
      srcPGRestQ = Quaternion.identity();
    }

    return srcPGRestQ;
  }

  /**
   * Gets the parent's global rest quaternion for the destination entity.
   * This is used to transform from global space to local space for the destination.
   * @param dstEntity - The destination entity to get parent global rest quaternion for
   * @returns The parent's global rest quaternion, or identity if no parent exists
   */
  getDstPGRestQ(dstEntity: ISceneGraphEntity) {
    let dstPGRestQ: IQuaternion;
    const parent = dstEntity.getSceneGraph().parent;
    if (Is.exist(parent)) {
      dstPGRestQ = parent.getRotationRest(sg => {
        return Is.exist(sg.entity.tryToGetVrm());
      });
    } else {
      dstPGRestQ = Quaternion.identity();
    }

    return dstPGRestQ;
  }

  /**
   * Retargets rotation from the source entity to the destination entity.
   * The method extracts the global animation quaternion from the source and applies it to the destination.
   * @param dstEntity - The destination entity to apply the retargeted rotation to
   * @returns The retargeted local rotation quaternion for the destination entity
   */
  retargetQuaternion(dstEntity: ISceneGraphEntity): IQuaternion {
    const srcEntity = this.__srcEntity;

    // extract global retarget quaternion
    const srcPoseQ = srcEntity.getTransform().localRotationInner;
    const srcRestQ = srcEntity.getTransform().localRotationRestInner;
    const srcPGRestQ = this.getSrcPGRestQ(srcEntity);

    const animQ = Quaternion.multiply(
      srcPGRestQ,
      Quaternion.multiply(srcPoseQ, Quaternion.multiply(Quaternion.invert(srcRestQ), Quaternion.invert(srcPGRestQ)))
    );

    // retarget quaternion to local pose
    const dstRestQ = dstEntity.getTransform().localRotationRestInner;
    const dstPgRestQ = this.getDstPGRestQ(dstEntity);

    const tgtPoseQ = Quaternion.multiply(
      Quaternion.invert(dstPgRestQ),
      Quaternion.multiply(animQ, Quaternion.multiply(dstPgRestQ, dstRestQ))
    );

    return tgtPoseQ;
  }

  /**
   * Retargets translation from the source entity to the destination entity.
   * The method extracts the global animation translation from the source, scales it appropriately,
   * and applies it to the destination entity.
   * @param dstEntity - The destination entity to apply the retargeted translation to
   * @returns The retargeted local position vector for the destination entity
   */
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

    // scale animation translate to match dst scale
    const scale = dstRestT.length() / srcRestT.length();
    const scaledAnimT = Vector3.multiply(AnimT, scale);

    const dstPoseT = Vector3.add(dstPgRestQ.transformVector3Inverse(scaledAnimT), dstRestT);

    return dstPoseT;
  }

  /**
   * Retargets scale from the source entity to the destination entity.
   * Currently returns the source entity's local scale directly without modification.
   * @param dstEntity - The destination entity (not used in current implementation)
   * @returns The source entity's local scale vector
   */
  retargetScale(dstEntity: ISceneGraphEntity): IVector3 {
    const srcEntity = this.__srcEntity;

    return srcEntity.getTransform().localScaleInner;
  }
}
