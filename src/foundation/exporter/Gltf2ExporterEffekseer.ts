import {Gltf2Ex} from '../../types/glTF2ForOutput';
import {
  RnM2ExtensionEffekseer,
  RnM2ExtensionsEffekseerEffect,
} from '../../types/RnM2';
import {WellKnownComponentTIDs} from '../components/WellKnownComponentTIDs';
import {IGroupEntity} from '../helpers/EntityHelper';
import {Is} from '../misc/Is';

export function createEffekseer(json: Gltf2Ex, entities: IGroupEntity[]) {
  let effekseerExists = false;
  const effects: RnM2ExtensionsEffekseerEffect[] = [];
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    const effekseerComponent = entity.getComponentByComponentTID(
      WellKnownComponentTIDs.EffekseerComponentTID
    );
    if (Is.exist(effekseerComponent)) {
      effekseerExists = true;

      const effekseer: RnM2ExtensionsEffekseerEffect = {
        node: i,
        name: effekseerComponent.uniqueName,
      };
      effects.push(effekseer);
      // [
      //   {
      //     "node": 0, // Required
      //     "name": "Homing_Laser01", // Optional
      //     "uri": "Laser01.efk", // Optional
      //     "bufferView": 0 // Optional, The index of the bufferView that contains the effect. This field **MUST NOT** be defined when `uri` is defined.
      //   },
      // ]
    }
  }

  if (effekseerExists) {
    json.extensions!.Rhodonite_Effekseer = {
      effects: effects,
    } as RnM2ExtensionEffekseer;
  }
}
