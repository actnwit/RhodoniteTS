import { GltfLoadOption, RnM2 } from '../../types';
import { RnM2Vrma } from '../../types/RnM2Vrma';
import { HumanBoneNames, NodeId } from '../../types/VRMC_vrm_animation';
import { Is } from '../misc/Is';
import { Err, Result, Ok, assertIsOk } from '../misc/Result';
import { Gltf2Importer } from './Gltf2Importer';

export class VrmaImporter {
  static async importFromUri(uri: string): Promise<Result<RnM2Vrma, Err<RnM2, undefined>>> {
    const options: GltfLoadOption = {};

    const result = await Gltf2Importer.importFromUri(uri, options);
    if (result.isErr()) {
      return new Err({
        message: 'Failed to import VRM file.',
        error: result,
      });
    }

    assertIsOk(result);
    const gltfJson: RnM2Vrma = result.get() as RnM2Vrma;
    this.readHumanoid(gltfJson);

    return new Ok(gltfJson as RnM2Vrma);
  }

  static async importFromArrayBuffer(
    arrayBuffer: ArrayBuffer
  ): Promise<Result<RnM2Vrma, Err<RnM2, undefined>>> {
    const options: GltfLoadOption = {};

    const result = await Gltf2Importer.importFromArrayBuffers({ 'data.glb': arrayBuffer }, options);
    if (result.isErr()) {
      return new Err({
        message: 'Failed to import VRM file.',
        error: result,
      });
    }

    assertIsOk(result);
    const gltfJson: RnM2Vrma = result.get() as RnM2Vrma;
    this.readHumanoid(gltfJson);

    return new Ok(gltfJson as RnM2Vrma);
  }

  static readHumanoid(rnm: RnM2Vrma) {
    const humanBones = rnm.extensions.VRMC_vrm_animation.humanoid?.humanBones;
    if (Is.not.exist(humanBones)) {
      return;
    }

    const humanoidBoneNameMap = new Map<NodeId, HumanBoneNames>();
    rnm.extensions.VRMC_vrm_animation.humanoidBoneNameMap = humanoidBoneNameMap;

    for (const boneName in humanBones) {
      const node = humanBones[boneName as HumanBoneNames];
      humanoidBoneNameMap.set(node.node, boneName as HumanBoneNames);
    }
  }
}
