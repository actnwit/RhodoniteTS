/* eslint-disable prettier/prettier */
import type { ISceneGraphEntity } from '../../../helpers/EntityHelper';
import { type IVector3, Quaternion, Vector3 } from '../../../math';
import type { IQuaternion } from '../../../math/IQuaternion';
import { Is } from '../../../misc/Is';
import type { IAnimationRetarget } from './AnimationRetarget';

/**
 * Global retarget reverse implementation for animation retargeting.
 * This class handles the reverse retargeting of animations from source to destination entities
 * with global coordinate system considerations and 180-degree rotation reversal.
 */
export class GlobalRetargetReverse implements IAnimationRetarget {
  private __srcEntity: ISceneGraphEntity;
  static readonly __rev = Quaternion.fromAxisAngle(Vector3.fromCopy3(0, 1, 0), Math.PI);

  /**
   * Creates a new GlobalRetargetReverse instance.
   * @param srcEntity - The source entity from which animation data will be retargeted
   */
  constructor(srcEntity: ISceneGraphEntity) {
    this.__srcEntity = srcEntity;
  }

  /**
   * Gets the source entity used for retargeting.
   * @returns The source scene graph entity
   */
  getEntity(): ISceneGraphEntity {
    return this.__srcEntity;
  }

  /**
   * Gets the parent global rest quaternion for the source entity.
   * This method traverses up the hierarchy to find the parent's rest rotation
   * for entities that have VRM components.
   * @param srcEntity - The source entity to get parent global rest quaternion for
   * @returns The parent global rest quaternion, or identity quaternion if no parent exists
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
   * Gets the parent global rest quaternion for the destination entity.
   * This method traverses up the hierarchy to find the parent's rest rotation
   * for entities that have VRM components.
   * @param dstEntity - The destination entity to get parent global rest quaternion for
   * @returns The parent global rest quaternion, or identity quaternion if no parent exists
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
   * Retargets the quaternion rotation from source entity to destination entity.
   * This method extracts the global animation quaternion from the source entity,
   * then applies it to the destination entity's local coordinate system with
   * a 180-degree Y-axis rotation reversal.
   * @param dstEntity - The destination entity to apply the retargeted rotation to
   * @returns The retargeted quaternion with reverse rotation applied
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

    const tgtPoseQRev = Quaternion.multiply(
      Quaternion.multiply(GlobalRetargetReverse.__rev, tgtPoseQ),
      Quaternion.invert(GlobalRetargetReverse.__rev)
    );

    return tgtPoseQRev;
  }

  /**
   * Retargets the translation from source entity to destination entity.
   * This method extracts the global animation translation from the source entity,
   * scales it according to the destination entity's proportions, then applies
   * a 180-degree Y-axis rotation reversal.
   * @param dstEntity - The destination entity to apply the retargeted translation to
   * @returns The retargeted translation vector with reverse rotation applied
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

    const dstPoseTRev = GlobalRetargetReverse.__rev.transformVector3(dstPoseT);
    return dstPoseTRev;
  }

  /**
   * Retargets the scale from source entity to destination entity.
   * Currently, this method simply returns the source entity's local scale
   * without any modifications or transformations.
   * @param dstEntity - The destination entity (currently unused)
   * @returns The source entity's local scale vector
   */
  retargetScale(_dstEntity: ISceneGraphEntity): IVector3 {
    const srcEntity = this.__srcEntity;

    return srcEntity.getTransform().localScaleInner;
  }
}
