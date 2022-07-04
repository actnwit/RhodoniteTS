import { EffekseerComponent, IEffekseerEntityMethods } from '../../effekseer/EffekseerComponent';
import {RnM2, RnM2ExtensionsEffekseerEffect, RnM2ExtensionsEffekseerTimeline, RnM2ExtensionsEffekseerTimelineItem} from '../../types/RnM2';
import { AnimationComponent, IAnimationEntityMethods, ISceneGraphEntityMethods, ITransformEntityMethods, WellKnownComponentTIDs } from '../components';
import { IEntity } from '../core';
import { EntityRepository } from '../core/EntityRepository';
import { AnimationInterpolation } from '../definitions';
import {ISceneGraphEntity} from '../helpers/EntityHelper';
import { DataUtil } from '../misc/DataUtil';
import {Is} from '../misc/Is';

export class RhodoniteImportExtension {
  private static __instance: RhodoniteImportExtension;

  static importEffect(gltfJson: RnM2, rootGroup: ISceneGraphEntity) {
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
    const effects = gltfJson.extensions.RHODONITE_effekseer
      .effects as RnM2ExtensionsEffekseerEffect[];

    for (const effect of effects) {
      const entity = entities[effect.node];
      const effekseerEntity = EntityRepository.addComponentToEntity(
        EffekseerComponent,
        entity
      );
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
          effekseerComponent.arrayBuffer = imageUint8Array.buffer.slice(
            imageUint8Array.byteOffset,
            imageUint8Array.byteOffset + imageUint8Array.byteLength
          );
          effekseerComponent.type = 'efkpkg';
        });
      } else if (Is.exist(effect.uri)) {
        effekseerComponent.uri = effect.uri;
        effekseerComponent.type = 'efk';
      } else {
        console.error('No real effect data.');
      }

      createEffekseerAnimation(effekseerEntity, effect);

      const Unzip = require('zlibjs/bin/unzip.min').Zlib.Unzip;
      EffekseerComponent.Unzip = Unzip;
    }
  }
}

function createEffekseerAnimation(entity: IEntity & ITransformEntityMethods & ISceneGraphEntityMethods & IEffekseerEntityMethods, effect: RnM2ExtensionsEffekseerEffect) {
  const effekseerComponent = entity.getComponentByComponentTID(WellKnownComponentTIDs.EffekseerComponentTID) as EffekseerComponent;
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
            event: value.event
          };
        });
        let animationComponent = entity.tryToGetAnimation();
        let animationEntity: (IEntity & ITransformEntityMethods & ISceneGraphEntityMethods & IEffekseerEntityMethods & IAnimationEntityMethods) | undefined;
        if (Is.not.exist(animationComponent)) {
          animationEntity = EntityRepository.addComponentToEntity(
            AnimationComponent,
            entity
          );
        }
        animationComponent = animationEntity!.getAnimation();
        animationComponent.setAnimation(
          Is.exist(timelineName) ? timelineName : 'Default',
          'effekseer',
          new Float32Array(timelineValues.map(value => value.input)),
          new Float32Array(timelineValues.map(value => {
            if (value.event === 'play') {
              return 1;
            } else if (value.event === 'pause') {
              return 0;
            } else {
              return 0;
            }
          })),
          1,
          AnimationInterpolation.Step,
          true);
      }
    }
  }
}
