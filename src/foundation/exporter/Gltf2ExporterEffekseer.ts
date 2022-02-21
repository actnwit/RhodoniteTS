import EffekseerComponent from '../../effekseer/EffekseerComponent';
import {Gltf2Ex} from '../../types/glTF2ForOutput';
import {
  RnM2ExtensionEffekseer,
  RnM2ExtensionsEffekseerEffect,
} from '../../types/RnM2';
import {WellKnownComponentTIDs} from '../components/WellKnownComponentTIDs';
import {IGroupEntity} from '../helpers/EntityHelper';
import {Is} from '../misc/Is';
import {createAndAddGltf2BufferView} from './Gltf2Exporter';

export function createEffekseer(json: Gltf2Ex, entities: IGroupEntity[]) {
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
        console.error('no real effect data.');
      }
      effects.push(effekseer);
    }
  }

  if (effekseerExists) {
    json.extensions!.Rhodonite_Effekseer = {
      effects: effects,
    } as RnM2ExtensionEffekseer;
    json.extensionsUsed!.push('Rhodonite_Effekseer');
  }
}
