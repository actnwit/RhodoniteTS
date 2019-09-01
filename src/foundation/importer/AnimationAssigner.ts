import Entity from "../core/Entity";
import { glTF2 } from "../../types/glTF";
import ModelConverter from "./ModelConverter";
import EntityRepository from "../core/EntityRepository";
import AnimationComponent from "../components/AnimationComponent";
import { Animation } from "../definitions/Animation";

export default class AnimationAssigner {
  private static __instance: AnimationAssigner;

  assignAnimation(rootEntity: Entity, json: glTF2) {
    const rnEntitiesByNames = rootEntity.getTagValue('rnEntitiesByNames')! as Map<string, Entity>;

    this._setupAnimation(json, rnEntitiesByNames);

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

  _setupAnimation(gltfModel: glTF2, rnEntities: Map<string, Entity>) {
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

          const node = gltfModel.nodes[channel.target.nodeIndex];
          let rnEntity = rnEntities.get(node.name);
          if (rnEntity) {
            entityRepository.addComponentsToEntity([AnimationComponent], rnEntity.entityUID);
            const animationComponent = rnEntity.getComponent(AnimationComponent) as AnimationComponent;
            if (animationComponent) {
              animationComponent.setAnimation(animationAttributeName, animInputArray, animOutputArray, Animation.fromString(interpolation));
            }
          }
        }
      }
    }
  }

}
