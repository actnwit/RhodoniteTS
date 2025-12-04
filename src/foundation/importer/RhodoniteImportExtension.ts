import { EffekseerComponent, type IEffekseerEntityMethods } from '../../effekseer/EffekseerComponent';
import type { AnimationSampler, AnimationTrackName } from '../../types/AnimationTypes';
import type {
  RnM2,
  RnM2ExtensionsEffekseerEffect,
  RnM2ExtensionsEffekseerTimeline,
  RnM2ExtensionsEffekseerTimelineItem,
} from '../../types/RnM2';
import {
  AnimationComponent,
  type IAnimationEntityMethods,
  type ISceneGraphEntityMethods,
  type ITransformEntityMethods,
  WellKnownComponentTIDs,
} from '../components';
import type { IEntity } from '../core';
import { EntityRepository } from '../core/EntityRepository';
import { AnimationInterpolation } from '../definitions';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import { AnimatedScalar } from '../math/AnimatedScalar';
import { DataUtil } from '../misc/DataUtil';
import { Is } from '../misc/Is';
import { Logger } from '../misc/Logger';
import type { Engine } from '../system/Engine';

/**
 * Extension class for importing Rhodonite-specific features from RnM2 format files.
 * Handles billboard and Effekseer effect imports.
 */
export class RhodoniteImportExtension {
  /**
   * Imports billboard configuration from RnM2 format and applies it to scene graph entities.
   * Processes the RHODONITE_billboard extension to enable billboard rendering for specified nodes.
   *
   * @param gltfJson - The RnM2 format JSON data containing billboard extension information
   * @param groups - Array of scene graph entities corresponding to nodes in the RnM2 data
   */
  static importBillboard(gltfJson: RnM2, groups: ISceneGraphEntity[]) {
    const RHODONITE_billboard = 'RHODONITE_billboard';
    if (
      Is.not.exist(gltfJson.extensionsUsed) ||
      gltfJson.extensionsUsed.findIndex(extension => {
        return RHODONITE_billboard === extension;
      }) === -1
    ) {
      return;
    }

    for (const node_i in gltfJson.nodes) {
      const group = groups[node_i];
      const nodeJson = gltfJson.nodes[node_i];
      const sceneGraphComponent = group.getSceneGraph();
      if (nodeJson.extensions !== undefined) {
        if (nodeJson.extensions.RHODONITE_billboard !== undefined) {
          if (nodeJson.extensions.RHODONITE_billboard.isBillboard === true) {
            sceneGraphComponent.isBillboard = true;
          }
        }
      }
    }
  }

  /**
   * Imports Effekseer effects from RnM2 format and creates corresponding Effekseer components.
   * Processes the RHODONITE_effekseer extension to load particle effects with their configurations.
   *
   * @param gltfJson - The RnM2 format JSON data containing Effekseer extension information
   * @param rootGroup - The root scene graph entity that contains all imported entities
   */
  static importEffect(engine: Engine, gltfJson: RnM2, rootGroup: ISceneGraphEntity) {
    const RHODONITE_effekseer = 'RHODONITE_effekseer';
    if (
      Is.not.exist(gltfJson.extensions) ||
      Is.not.exist(gltfJson.extensions.RHODONITE_effekseer) ||
      gltfJson.extensionsUsed.findIndex(extension => {
        return RHODONITE_effekseer === extension;
      }) === -1
    ) {
      return;
    }
    const entities = rootGroup.getTagValue('rnEntities') as ISceneGraphEntity[];
    const effects = gltfJson.extensions.RHODONITE_effekseer.effects as RnM2ExtensionsEffekseerEffect[];

    for (const effect of effects) {
      const entity = entities[effect.node];
      const effekseerEntity = engine.entityRepository.addComponentToEntity(EffekseerComponent, entity);
      const effekseerComponent = effekseerEntity.getEffekseer();
      effekseerComponent.playJustAfterLoaded = true;
      // effekseerComponent.randomSeed = 1;
      effekseerComponent.isLoop = true;
      if (Is.exist(effect.bufferView)) {
        const rnm2Buffer = gltfJson.buffers[0];
        rnm2Buffer.bufferPromise!.then((arrayBufferOfBuffer: ArrayBuffer) => {
          const imageUint8Array = DataUtil.createUint8ArrayFromBufferViewInfo(
            gltfJson,
            effect.bufferView!,
            arrayBufferOfBuffer
          );
          effekseerComponent.arrayBuffer = (imageUint8Array.buffer as ArrayBuffer).slice(
            imageUint8Array.byteOffset,
            imageUint8Array.byteOffset + imageUint8Array.byteLength
          );
          effekseerComponent.type = 'efkpkg';
        });
      } else if (Is.exist(effect.uri)) {
        effekseerComponent.uri = effect.uri;
        effekseerComponent.type = 'efk';
      } else {
        Logger.default.error('No real effect data.');
      }

      createEffekseerAnimation(engine, effekseerEntity, effect);
    }
  }
}

/**
 * Creates animation data for Effekseer effects based on timeline information.
 * Processes timeline events to control effect playback timing and creates animation components.
 *
 * @param entity - The entity with Effekseer component to add animation to
 * @param effect - The effect data containing timeline information
 */
function createEffekseerAnimation(
  engine: Engine,
  entity: IEntity & ITransformEntityMethods & ISceneGraphEntityMethods & IEffekseerEntityMethods,
  effect: RnM2ExtensionsEffekseerEffect
) {
  const effekseerComponent = entity.getComponentByComponentTID(
    WellKnownComponentTIDs.EffekseerComponentTID
  ) as EffekseerComponent;
  if (Is.exist(effekseerComponent)) {
    effekseerComponent.playJustAfterLoaded = true;
    effekseerComponent.isLoop = true;

    if (Is.exist(effect.timelines)) {
      const timelines = effect.timelines as RnM2ExtensionsEffekseerTimeline[];
      for (const timeline of timelines) {
        const values = timeline.values as RnM2ExtensionsEffekseerTimelineItem[];
        const timelineName = timeline.name;
        const timelineValues = values.map(value => {
          return {
            input: value.input,
            event: value.event,
          };
        });
        let animationComponent = entity.tryToGetAnimation();
        let animationEntity:
          | (IEntity &
              ITransformEntityMethods &
              ISceneGraphEntityMethods &
              IEffekseerEntityMethods &
              IAnimationEntityMethods)
          | undefined;
        if (Is.not.exist(animationComponent)) {
          animationEntity = engine.entityRepository.addComponentToEntity(AnimationComponent, entity);
        }
        animationComponent = animationEntity!.getAnimation();
        const animationSamplers = new Map<AnimationTrackName, AnimationSampler>();
        const trackName = Is.exist(timelineName) ? timelineName : 'Default';
        animationSamplers.set(trackName, {
          input: new Float32Array(timelineValues.map(value => value.input)),
          output: new Float32Array(timelineValues.map(value => (value.event === 'play' ? 1 : 0))),
          outputComponentN: 1,
          interpolationMethod: AnimationInterpolation.Step,
        });
        const newAnimatedValue = new AnimatedScalar(animationSamplers, trackName);
        animationComponent.setAnimation('effekseer', newAnimatedValue);
      }
    }
  }
}
