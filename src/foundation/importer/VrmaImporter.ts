import { GltfLoadOption, RnM2 } from '../../types';
import { RnM2Vrma } from '../../types/RnM2Vrma';
import { HumanBoneNames, NodeId } from '../../types/VRMC_vrm_animation';
import { Is } from '../misc/Is';
import { Gltf2Importer } from './Gltf2Importer';

/**
 * A utility class for importing VRMA (VRM Animation) files.
 *
 * VRMA is an extension format for VRM that adds animation capabilities,
 * allowing for the import and processing of humanoid animation data.
 * This class provides static methods to import VRMA files from various sources
 * and processes the humanoid bone mapping for efficient animation playback.
 *
 * @remarks
 * This class extends the functionality of Gltf2Importer to handle VRMA-specific
 * features, particularly the VRMC_vrm_animation extension that contains
 * humanoid bone definitions and animation data.
 *
 * @example
 * ```typescript
 * // Import from URL
 * const vrmaData = await VrmaImporter.importFromUrl('https://example.com/animation.vrma');
 *
 * // Import from file buffer
 * const fileBuffer = await file.arrayBuffer();
 * const vrmaData = await VrmaImporter.importFromArrayBuffer(fileBuffer);
 * ```
 */
export class VrmaImporter {
  /**
   * Imports a VRMA (VRM Animation) file from a URL.
   *
   * @param url - The URL of the VRMA file to import
   * @returns A Promise that resolves to the imported VRMA data structure
   * @throws Will reject the promise if the import fails or the URL is invalid
   *
   * @example
   * ```typescript
   * const vrmaData = await VrmaImporter.importFromUrl('https://example.com/animation.vrma');
   * ```
   */
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

  /**
   * Imports a VRMA (VRM Animation) file from an ArrayBuffer.
   *
   * @param arrayBuffer - The ArrayBuffer containing the VRMA file data
   * @returns A Promise that resolves to the imported VRMA data structure
   * @throws Will reject the promise if the import fails or the ArrayBuffer is invalid
   *
   * @example
   * ```typescript
   * const fileBuffer = await file.arrayBuffer();
   * const vrmaData = await VrmaImporter.importFromArrayBuffer(fileBuffer);
   * ```
   */
  static async importFromArrayBuffer(arrayBuffer: ArrayBuffer): Promise<RnM2Vrma> {
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

  /**
   * Reads and processes the humanoid bone data from a VRMA file.
   * Creates a mapping between node IDs and human bone names for easier bone lookup.
   *
   * @param rnm - The RnM2Vrma object containing the VRMA data
   * @returns void - This method modifies the input object in place
   *
   * @remarks
   * This method extracts humanoid bone information from the VRMC_vrm_animation extension
   * and creates a reverse mapping from node IDs to bone names for efficient bone queries.
   * If no humanoid bones are found, the method returns early without processing.
   */
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
