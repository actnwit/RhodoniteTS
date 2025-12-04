import { type EffekseerComponent, IEffekseerEntityMethods } from '../../effekseer/EffekseerComponent';
import type {
  RnM2ExtensionEffekseer,
  RnM2ExtensionsEffekseerEffect,
  RnM2ExtensionsEffekseerTimeline,
  RnM2ExtensionsEffekseerTimelineItem,
} from '../../types/RnM2';
import type { Gltf2Ex } from '../../types/glTF2ForOutput';
import { WellKnownComponentTIDs } from '../components/WellKnownComponentTIDs';
import type { IEntity } from '../core';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import { Is } from '../misc/Is';
import { Logger } from '../misc/Logger';
import { createAndAddGltf2BufferView } from './Gltf2ExporterOps';

/**
 * Creates and adds Effekseer extension data to the glTF 2.0 export JSON.
 * This function processes all entities with Effekseer components and exports their
 * effect data, including buffer views for effect files and animation timelines.
 *
 * @param json - The glTF 2.0 export JSON object to modify
 * @param entities - Array of scene graph entities to process for Effekseer components
 */
export function createEffekseer(json: Gltf2Ex, entities: ISceneGraphEntity[]) {
  let effekseerExists = false;
  const bufferIdx = json.extras.bufferViewByteLengthAccumulatedArray.length - 1;
  const effects: RnM2ExtensionsEffekseerEffect[] = [];
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    const effekseerComponent = entity.getComponentByComponentTID(
      WellKnownComponentTIDs.EffekseerComponentTID
    ) as EffekseerComponent;
    if (Is.exist(effekseerComponent)) {
      effekseerExists = true;

      const effekseer: RnM2ExtensionsEffekseerEffect = {
        node: i,
        name: effekseerComponent.uniqueName,
      };

      if (Is.exist(effekseerComponent.arrayBuffer)) {
        const gltf2BufferView = createAndAddGltf2BufferView(
          json,
          bufferIdx,
          new Uint8Array(effekseerComponent.arrayBuffer)
        );
        effekseer.bufferView = json.bufferViews.indexOf(gltf2BufferView);
      } else if (Is.exist(effekseerComponent.uri)) {
        effekseer.uri = effekseerComponent.uri;
      } else {
        Logger.default.error('no real effect data.');
      }

      __createEffekseerTimeline(effekseerComponent.entity, effekseer);

      effects.push(effekseer);
    }
  }

  if (effekseerExists) {
    json.extensions!.RHODONITE_effekseer = {
      version: '1.0',
      effects: effects,
    } as RnM2ExtensionEffekseer;
    json.extensionsUsed!.push('RHODONITE_effekseer');
  }
}

/**
 * Creates animation timeline data for Effekseer effects from entity animation components.
 * This function extracts animation tracks that control Effekseer playback state and
 * converts them into timeline format for the glTF extension.
 *
 * @param entity - The entity containing animation data
 * @param effekseer - The Effekseer effect object to add timeline data to
 * @private
 */
function __createEffekseerTimeline(entity: IEntity, effekseer: RnM2ExtensionsEffekseerEffect) {
  const animationComponent = entity.tryToGetAnimation();
  if (Is.exist(animationComponent)) {
    const trackNames = animationComponent.getAnimationTrackNames();
    const timelines: RnM2ExtensionsEffekseerTimeline[] = [];
    for (const trackName of trackNames) {
      if (animationComponent.hasAnimation(trackName, 'effekseer')) {
        const rnAnimationTrack = animationComponent.getAnimationChannelsOfTrack();
        if (Is.exist(rnAnimationTrack)) {
          const rnChannels = rnAnimationTrack.values();
          for (const rnChannel of rnChannels) {
            const pathName = rnChannel.target.pathName;
            if (pathName === 'effekseer') {
              const animatedValue = rnChannel.animatedValue;
              for (const trackName of animatedValue.getAllTrackNames()) {
                const inputArray = animatedValue.getAnimationSampler(trackName).input;
                const values: RnM2ExtensionsEffekseerTimelineItem[] = [];
                for (let i = 0; i < inputArray.length; i++) {
                  const input = inputArray[i];
                  const output = animatedValue.getAnimationSampler(trackName).output[i];
                  const timelineItem: RnM2ExtensionsEffekseerTimelineItem = {
                    input: input,
                    event: output > 0.5 ? 'play' : 'pause',
                  };
                  values.push(timelineItem);
                }
                const timeline: RnM2ExtensionsEffekseerTimeline = {
                  name: trackName,
                  values: values,
                };
                timelines.push(timeline);
              }
            }
          }
        }
      }
    }
    effekseer.timelines = timelines;
  }
}
