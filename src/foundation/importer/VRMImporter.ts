import GltfImporter from './GltfImporter';
import Gltf2Importer from './Gltf2Importer';
import {GltfLoadOption} from '../../types/glTF';
import ModelConverter from './ModelConverter';
import { Is } from '../misc/Is';
import Entity from '../core/Entity';
import { VRM } from '../../types/VRM';

/**
 * The VRM Importer class.
 * This class will be integrated into GltfImporter.
 */
export default class VRMImporter {
  private static __instance: VRMImporter;

  private constructor() {}

  static getInstance() {
    if (!this.__instance) {
      this.__instance = new VRMImporter();
    }
    return this.__instance;
  }

  /**
   * Import VRM file.
   */
  async import(uri: string, options?: GltfLoadOption): Promise<Entity[]> {
    const gltfImporter = GltfImporter.getInstance();
    options = gltfImporter._getOptions(options);

    const gltf2Importer = Gltf2Importer.getInstance();
    const gltfModel = await gltf2Importer.import(uri, options);
    if (Is.not.exist(gltfModel)) {
      return [];
    }

    const textures = gltfImporter._createTextures(gltfModel);
    const defaultMaterialHelperArgumentArray =
      gltfModel.asset.extras?.rnLoaderOptions?.defaultMaterialHelperArgumentArray;
    if (Is.exist(defaultMaterialHelperArgumentArray)) {
      defaultMaterialHelperArgumentArray[0].textures = textures;
    }

    gltfImporter._initializeMaterialProperties(gltfModel, textures.length);

    // setup rootGroup
    let rootGroups;
    const modelConverter = ModelConverter.getInstance();
    const rootGroupMain = modelConverter.convertToRhodoniteObject(gltfModel!);

    const existOutline = gltfImporter._existOutlineMaterial(
      gltfModel.extensions.VRM
    );
    if (existOutline) {
      if (Is.exist(defaultMaterialHelperArgumentArray)) {
        defaultMaterialHelperArgumentArray[0].isOutline = true;
      }
      const rootGroupOutline =
        modelConverter.convertToRhodoniteObject(gltfModel);

      rootGroups = [rootGroupMain, rootGroupOutline];
    } else {
      rootGroups = [rootGroupMain];
    }
    gltfImporter._readSpringBone(rootGroupMain, gltfModel as VRM);
    gltfImporter._readVRMHumanoidInfo(gltfModel as VRM, rootGroupMain);

    return rootGroups;
  }
}
