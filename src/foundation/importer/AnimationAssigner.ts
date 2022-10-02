import {RnM2} from '../../types/RnM2';
import {ModelConverter} from './ModelConverter';
import {EntityRepository} from '../core/EntityRepository';
import {AnimationComponent} from '../components/Animation/AnimationComponent';
import {AnimationInterpolation} from '../definitions/AnimationInterpolation';
import {Index} from '../../types/CommonTypes';
import {Vrm0x} from '../../types/VRM0x';
import {Is} from '../misc/Is';
import {ISceneGraphEntity} from '../helpers/EntityHelper';
import { AbsoluteAnimation, GlobalRetarget } from '../components';
import { Vrm1 } from '../../types/VRM1';

type RetargetMode = 'none' | 'global' | 'absolute';

export class AnimationAssigner {
  private static __instance: AnimationAssigner;

  assignAnimation(
    rootEntity: ISceneGraphEntity,
    gltfModel: RnM2,
    vrmModel: Vrm0x | Vrm1,
    isSameSkeleton: boolean,
    retargetMode: RetargetMode = 'none',
    srcRootEntityForRetarget?: ISceneGraphEntity
  ) {
    this.__setupAnimationForSameSkeleton(
      rootEntity,
      gltfModel,
      vrmModel,
      isSameSkeleton,
      retargetMode,
      srcRootEntityForRetarget
    );

    return rootEntity;
  }

  private constructor() {}

  /**
   * The static method to get singleton instance of this class.
   * @return The singleton instance of ModelConverter class
   */
  static getInstance(): AnimationAssigner {
    if (!this.__instance) {
      this.__instance = new AnimationAssigner();
    }
    return this.__instance;
  }

  private __getCorrespondingEntity(
    rootEntity: ISceneGraphEntity,
    gltfModel: RnM2,
    vrmModel: Vrm0x | Vrm1,
    nodeIndex: Index,
    nodeName: string | undefined,
    isSameSkeleton: boolean
  ) {
    if (isSameSkeleton) {
      // isSameSkeleton is true, so we find joints from joints name.
      const rnEntities = rootEntity.getTagValue('rnEntitiesByNames')! as Map<
        string,
        ISceneGraphEntity
      >;
      const node = gltfModel.nodes[nodeIndex];
      const rnEntity = rnEntities.get(node.name!);
      return rnEntity;
    } else {
      // isSameSkeleton is false, so we find joints from humanoid bone mapping data
      if (Is.exist(vrmModel.extensions.VRM)) {
        // VRM0.x
        const humanBones = vrmModel.extensions.VRM.humanoid.humanBones;
        let humanoidBoneName: string | undefined;
        const srcMapNodeIdName: Map<number, string> = new Map();
        const srcMapNodeNameName: Map<string, string> = new Map();
        for (const bone of humanBones) {
          srcMapNodeIdName.set(bone.node, bone.bone);
          srcMapNodeNameName.set(bone.name!, bone.bone);
        }
        if (nodeName != null) {
          humanoidBoneName = srcMapNodeNameName.get(nodeName);
          if (humanoidBoneName == null) {
            humanoidBoneName = srcMapNodeIdName.get(nodeIndex)!;
          }
        }
        const dstMapNameNodeId = rootEntity.getTagValue(
          'humanoid_map_name_nodeId'
        )! as Map<string, number>;
        const dstBoneNodeId = dstMapNameNodeId.get(humanoidBoneName!);
        if (dstBoneNodeId != null) {
          const rnEntities = rootEntity.getTagValue(
            'rnEntities'
          )! as ISceneGraphEntity[];
          return rnEntities[dstBoneNodeId];
        } else {
          return void 0;
        }
      } else if (Is.exist(vrmModel.extensions.VRMC_vrm)) {
        // VRM1.0
        const humanBones = vrmModel.extensions.VRMC_vrm.humanoid.humanBones;
        let humanoidBoneName: string | undefined;
        const srcMapNodeIdName: Map<number, string> = new Map();
        for (const boneName in humanBones) {
          const bone = humanBones[boneName];
          srcMapNodeIdName.set(bone.node, boneName);
        }
        if (nodeName != null) {
          humanoidBoneName = srcMapNodeIdName.get(nodeIndex)!;
        }
        const dstMapNameNodeId = rootEntity.getTagValue(
          'humanoid_map_name_nodeId'
        )! as Map<string, number>;
        const dstBoneNodeId = dstMapNameNodeId.get(humanoidBoneName!);
        if (dstBoneNodeId != null) {
          const rnEntities = rootEntity.getTagValue(
            'rnEntities'
          )! as ISceneGraphEntity[];
          return rnEntities[dstBoneNodeId];
        } else {
          return void 0;
        }
      }
      return void 0;
    }
  }

  private __isHips(
    rootEntity: ISceneGraphEntity,
    vrmModel: Vrm0x | Vrm1,
    nodeIndex: Index
  ) {
    const srcMapNodeIdName: Map<number, string> = new Map();
    if (Is.exist(vrmModel.extensions.VRM)) {
      const humanBones = vrmModel.extensions.VRM.humanoid.humanBones;
      for (const bone of humanBones) {
        srcMapNodeIdName.set(bone.node, bone.bone);
      }
    } else if (Is.exist(vrmModel.extensions.VRMC_vrm)) {
      const humanBones = vrmModel.extensions.VRMC_vrm.humanoid.humanBones;
      for (const boneName in humanBones) {
        const bone = humanBones[boneName];
        srcMapNodeIdName.set(bone.node, boneName);
      }
    }
    const dstMapNameNodeId = rootEntity.getTagValue(
      'humanoid_map_name_nodeId'
    )! as Map<string, number>;
    const humanoidBoneName = srcMapNodeIdName.get(nodeIndex)!;
    if (humanoidBoneName === 'hips') {
      return true;
    } else {
      return false;
    }
  }

  private __setupAnimationForSameSkeleton(
    rootEntity: ISceneGraphEntity,
    gltfModel: RnM2,
    vrmModel: Vrm0x | Vrm1,
    isSameSkeleton: boolean,
    retargetMode: RetargetMode,
    srcRootEntityForRetarget?: ISceneGraphEntity
  ) {
    if (gltfModel.animations) {
      for (const animation of gltfModel.animations) {
        for (const sampler of animation.samplers) {
          ModelConverter._readBinaryFromAccessorAndSetItToAccessorExtras(
            sampler.inputObject!
          );
          ModelConverter._readBinaryFromAccessorAndSetItToAccessorExtras(
            sampler.outputObject!
          );
        }
      }
    }

    if (gltfModel.animations && gltfModel.animations.length > 0) {
      for (const animation of gltfModel.animations) {
        for (const channel of animation.channels) {
          // get animation data
          const animInputArray =
            channel.samplerObject?.inputObject?.extras!.typedDataArray;
          const animOutputArray =
            channel.samplerObject?.outputObject?.extras!.typedDataArray;
          const interpolation =
            channel.samplerObject!.interpolation != null
              ? channel.samplerObject!.interpolation
              : 'LINEAR';

          // find the corresponding joint entity
          const node = gltfModel.nodes[channel.target!.node!];
          const rnEntity = this.__getCorrespondingEntity(
            rootEntity,
            gltfModel,
            vrmModel,
            channel.target!.node!,
            node.name,
            isSameSkeleton
          );
          if (rnEntity) {
            const newRnEntity = EntityRepository.addComponentToEntity(
              AnimationComponent,
              rnEntity
            );
            const animationComponent = newRnEntity.getAnimation();

            // apply animation data to the target joint entity
            let animationAttributeType = 'translate';
            if (channel.target!.path === 'translation') {
              animationAttributeType = 'translate';
            } else if (channel.target!.path! === 'rotation') {
              animationAttributeType = 'quaternion';
            } else {
              animationAttributeType = channel.target!.path;
            }
            if (animationAttributeType === 'quaternion') {
              animationComponent.setAnimation(
                Is.exist(animation.name) ? animation.name! : 'Untitled',
                animationAttributeType,
                animInputArray!,
                animOutputArray!,
                4, // Quaternion
                AnimationInterpolation.fromString(interpolation)
              );
            } else if (
              animationAttributeType === 'translate' &&
              this.__isHips(rootEntity, vrmModel, channel.target!.node!)
            ) {
              animationComponent.setAnimation(
                Is.exist(animation.name) ? animation.name! : 'Untitled',
                animationAttributeType,
                animInputArray!,
                animOutputArray!,
                3, // translate
                AnimationInterpolation.fromString(interpolation)
              );
            }

            if (retargetMode !== 'none' && Is.exist(srcRootEntityForRetarget)) {
              const gltfEntity =
                gltfModel.extras.rnEntities[channel.target!.node!];
              const globalRetarget =
                retargetMode === 'global'
                  ? new GlobalRetarget(gltfEntity)
                  : new AbsoluteAnimation(gltfEntity);
              animationComponent._animationRetarget = globalRetarget;
            }
          }
        }
      }
    }
  }
}
