import Entity from '../core/Entity';
import {glTF2} from '../../types/glTF';
import ModelConverter from './ModelConverter';
import EntityRepository from '../core/EntityRepository';
import AnimationComponent from '../components/AnimationComponent';
import {AnimationInterpolation} from '../definitions/AnimationInterpolation';
import {Index} from '../../types/CommonTypes';
import {VRM} from '../../types/VRM';
import {Is} from '../misc/Is';

export default class AnimationAssigner {
  private static __instance: AnimationAssigner;

  assignAnimation(
    rootEntity: Entity,
    gltfModel: glTF2,
    vrmModel: VRM,
    isSameSkeleton = false
  ) {
    this.__setupAnimationForSameSkeleton(
      rootEntity,
      gltfModel,
      vrmModel,
      isSameSkeleton
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
    rootEntity: Entity,
    gltfModel: glTF2,
    vrmModel: VRM,
    nodeIndex: Index,
    nodeName: string | undefined,
    isSameSkeleton: boolean
  ) {
    if (isSameSkeleton) {
      const rnEntities = rootEntity.getTagValue('rnEntitiesByNames')! as Map<
        string,
        Entity
      >;
      const node = gltfModel.nodes[nodeIndex];
      const rnEntity = rnEntities.get(node.name!);
      return rnEntity;
    } else {
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
    for (const bone of humanBones) {
      srcMapNodeIdName.set(bone.node, bone.bone);
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
    rootEntity: Entity,
    gltfModel: glTF2,
    vrmModel: VRM,
    isSameSkeleton: boolean
  ) {
    if (gltfModel.animations) {
      const modelConverter = ModelConverter.getInstance();

      for (const animation of gltfModel.animations) {
        for (const sampler of animation.samplers) {
          modelConverter._accessBinaryWithAccessor(sampler.input);
          modelConverter._accessBinaryWithAccessor(sampler.output);
        }
      }
    }

    const entityRepository = EntityRepository.getInstance();

    if (gltfModel.animations && gltfModel.animations.length > 0) {
      for (const animation of gltfModel.animations) {
        for (const channel of animation.channels) {
          const animInputArray = channel.sampler.input.extras.typedDataArray;
          const animOutputArray = channel.sampler.output.extras.typedDataArray;
          const interpolation =
            channel.sampler.interpolation != null
              ? channel.sampler.interpolation
              : 'LINEAR';

          let animationAttributeType = '';
          if (channel.target.path === 'translation') {
            animationAttributeType = 'translate';
          } else if (channel.target.path === 'rotation') {
            animationAttributeType = 'quaternion';
          } else {
            animationAttributeType = channel.target.path;
          }
          const node = gltfModel.nodes[channel.target.nodeIndex!];
          const rnEntity = this.__getCorrespondingEntity(
            rootEntity,
            gltfModel,
            vrmModel,
            channel.target.nodeIndex!,
            node.name,
            isSameSkeleton
          );
          if (rnEntity) {
            entityRepository.addComponentsToEntity(
              [AnimationComponent],
              rnEntity.entityUID
            );
            const animationComponent = rnEntity.getComponent(
              AnimationComponent
            ) as AnimationComponent;
            if (animationComponent) {
              if (animationAttributeType === 'quaternion') {
                animationComponent.setAnimation(
                  Is.exist(animation.name) ? animation.name! : 'Untitled',
                  animationAttributeType,
                  animInputArray,
                  animOutputArray,
                  AnimationInterpolation.fromString(interpolation)
                );
              } else if (
                animationAttributeType === 'translate' &&
                this.__isHips(rootEntity, vrmModel, channel.target.nodeIndex!)
              ) {
                animationComponent.setAnimation(
                  Is.exist(animation.name) ? animation.name! : 'Untitled',
                  animationAttributeType,
                  animInputArray,
                  animOutputArray,
                  AnimationInterpolation.fromString(interpolation)
                );
              }
            }
          }
        }
      }
    }
  }
}
