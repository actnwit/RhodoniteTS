import EffekseerComponent from '../../effekseer/EffekseerComponent';
import {RnM2, RnM2ExtensionsEffekseerEffect} from '../../types/RnM2';
import EntityRepository from '../core/EntityRepository';
import {IGroupEntity} from '../helpers/EntityHelper';
import DataUtil from '../misc/DataUtil';
import {Is} from '../misc/Is';

export default class RhodoniteImportExtension {
  private static __instance: RhodoniteImportExtension;

  static importEffect(gltfJson: RnM2, rootGroup: IGroupEntity) {
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
    const entities = rootGroup.getTagValue('rnEntities') as IGroupEntity[];
    const effects = gltfJson.extensions.RHODONITE_effekseer
      .effects as RnM2ExtensionsEffekseerEffect[];

    for (const effect of effects) {
      const entity = entities[effect.node];
      const effekseerEntity =
        EntityRepository.getInstance().addComponentToEntity(
          EffekseerComponent,
          entity
        );
      const effekseerComponent = effekseerEntity.getEffekseer();
      effekseerComponent.playJustAfterLoaded = true;
      effekseerComponent.randomSeed = 1;
      effekseerComponent.isLoop = false;
      if (Is.exist(effect.bufferView)) {
        const rnm2Buffer = gltfJson.buffers[0];
        rnm2Buffer.bufferPromise!.then((arrayBufferOfBuffer: ArrayBuffer) => {
          const imageUint8Array = DataUtil.createUint8ArrayFromBufferViewInfo(
            gltfJson,
            effect.bufferView!,
            arrayBufferOfBuffer
          );
          effekseerComponent.arrayBuffer = imageUint8Array;
          effekseerComponent.type = 'efkpkg';
        });
      } else if (Is.exist(effect.uri)) {
        effekseerComponent.uri = effect.uri;
        effekseerComponent.type = 'efk';
      } else {
        console.error('No real effect data.');
      }
      const Unzip = require('zlibjs/bin/unzip.min').Zlib.Unzip;
      EffekseerComponent.Unzip = Unzip;
    }
  }
}
