import { GltfLoadOption, RnM2 } from '../../types';
import { RnM2Vrma } from '../../types/RnM2Vrma';
import { HumanBoneNames, NodeId } from '../../types/VRMC_vrm_animation';
import { Is } from '../misc/Is';
import { Gltf2Importer } from './Gltf2Importer';

export class VrmaImporter {
  static async importFromUrl(url: string): Promise<RnM2Vrma> {
    const promise = new Promise<RnM2Vrma>(async (resolve, reject) => {
      const options: GltfLoadOption = {};

      try {
        const result = await Gltf2Importer.importFromUrl(url, options);
        this.readHumanoid(result as RnM2Vrma);
        resolve(result as RnM2Vrma);
      } catch (error) {
        reject(error);
      }
    });

    return promise;
  }

  static async importFromArrayBuffer(
    arrayBuffer: ArrayBuffer
  ): Promise<RnM2Vrma> {
    const promise = new Promise<RnM2Vrma>(async (resolve, reject) => {
      const options: GltfLoadOption = {};

      try {
        const result = await Gltf2Importer.importFromArrayBuffers({ 'data.glb': arrayBuffer }, options);
        this.readHumanoid(result as RnM2Vrma);
        resolve(result as RnM2Vrma);
      } catch (error) {
        reject(error);
      }
    });

    return promise;
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
