import Entity from "../core/Entity";
import { glTF2 } from "../../types/glTF";
import ModelConverter from "./ModelConverter";
import EntityRepository from "../core/EntityRepository";
import AnimationComponent from "../components/AnimationComponent";
import { Animation } from "../definitions/Animation";
import { Index } from "../../types/CommonTypes";
import { VRM } from "./VRMImporter";

export default class AnimationAssigner {
  private static __instance: AnimationAssigner;

  assignAnimation(rootEntity: Entity, gltfModel: glTF2, vrmModel: VRM, isSameSkeleton = false) {

    this.__setupAnimationForSameSkeleton(rootEntity, gltfModel, vrmModel, isSameSkeleton);

    return rootEntity;
  }

  private constructor() {
  }

  /**
   * The static method to get singleton instance of this class.
   * @return The singleton instance of ModelConverter class
   */
  static getInstance(): AnimationAssigner{
    if (!this.__instance) {
      this.__instance = new AnimationAssigner();
    }
    return this.__instance;
  }

  private __getCorrespondingEntity(rootEntity: Entity, gltfModel: glTF2, vrmModel: VRM, nodeIndex: Index, isSameSkeleton: boolean) {
    if (isSameSkeleton) {
      const rnEntities = rootEntity.getTagValue('rnEntitiesByNames')! as Map<string, Entity>;
      const node = gltfModel.nodes[nodeIndex];
      let rnEntity = rnEntities.get(node.name!);
      return rnEntity;
    } else {
      const humanBones = vrmModel.extensions.VRM.humanoid.humanBones;
      const srcMapNodeIdName: Map<number, string> = new Map();
      for (let bone of humanBones) {
        srcMapNodeIdName.set(bone.node, bone.bone);
      }
      const dstMapNameNodeId = rootEntity.getTagValue('humanoid_map_name_nodeId')! as Map<string, number>;
      const humanoidBoneName = srcMapNodeIdName.get(nodeIndex)!;
      const dstBoneNodeId = dstMapNameNodeId.get(humanoidBoneName);
      if (dstBoneNodeId != null) {
        const rnEntities = rootEntity.getTagValue('rnEntities')! as Entity[];
        return rnEntities[dstBoneNodeId];
      } else {
        return void 0;
      }
    }
  }

  private __isHips(rootEntity: Entity, vrmModel: VRM, nodeIndex: Index) {
    const humanBones = vrmModel.extensions.VRM.humanoid.humanBones;
    const srcMapNodeIdName: Map<number, string> = new Map();
    for (let bone of humanBones) {
      srcMapNodeIdName.set(bone.node, bone.bone);
    }
    const dstMapNameNodeId = rootEntity.getTagValue('humanoid_map_name_nodeId')! as Map<string, number>;
    const humanoidBoneName = srcMapNodeIdName.get(nodeIndex)!;
    if (humanoidBoneName === 'hips') {
      return true;
    } else {
      return false;
    }
  }

  private __setupAnimationForSameSkeleton(rootEntity: Entity, gltfModel: glTF2, vrmModel: VRM, isSameSkeleton: boolean) {
    if (gltfModel.animations) {
      const modelConverter = ModelConverter.getInstance();

      for (let animation of gltfModel.animations) {
        for (let sampler of animation.samplers) {
          modelConverter._accessBinaryWithAccessor(sampler.input);
          modelConverter._accessBinaryWithAccessor(sampler.output);
        }
      }
    }

    const entityRepository = EntityRepository.getInstance();

    if (gltfModel.animations) {
      for (let animation of gltfModel.animations) {

        for (let channel of animation.channels) {
          const animInputArray = channel.sampler.input.extras.typedDataArray;
          const animOutputArray = channel.sampler.output.extras.typedDataArray;
          const interpolation = (channel.sampler.interpolation != null) ? channel.sampler.interpolation : 'LINEAR';

          let animationAttributeName = '';
          if (channel.target.path === 'translation') {
            animationAttributeName = 'translate';
          } else if (channel.target.path === 'rotation') {
            animationAttributeName = 'quaternion';
          } else {
            animationAttributeName = channel.target.path;
          }

          const rnEntity = this.__getCorrespondingEntity(rootEntity, gltfModel, vrmModel, channel.target.nodeIndex!, isSameSkeleton);
          if (rnEntity) {
            entityRepository.addComponentsToEntity([AnimationComponent], rnEntity.entityUID);
            const animationComponent = rnEntity.getComponent(AnimationComponent) as AnimationComponent;
            if (animationComponent) {
              if (animationAttributeName === 'quaternion') {
                animationComponent.setAnimation(animationAttributeName, animInputArray, animOutputArray, Animation.fromString(interpolation));
              } else if (animationAttributeName === 'translate' && this.__isHips(rootEntity, vrmModel, channel.target.nodeIndex!)) {
                animationComponent.setAnimation(animationAttributeName, animInputArray, animOutputArray, Animation.fromString(interpolation));
              }
            }
          }
        }
      }
    }
  }

}
