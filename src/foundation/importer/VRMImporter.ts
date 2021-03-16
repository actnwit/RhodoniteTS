import GltfImporter from './GltfImporter';
import Gltf2Importer from './Gltf2Importer';
import {GltfLoadOption} from '../../types/glTF';
import ModelConverter from './ModelConverter';

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
  async import(uri: string, options?: GltfLoadOption) {
    const gltfImporter = GltfImporter.getInstance();
    options = gltfImporter._getOptions(options);

    const gltf2Importer = Gltf2Importer.getInstance();
    const gltfModel = await gltf2Importer.import(uri, options);

    const textures = gltfImporter._createTextures(gltfModel);
    const defaultMaterialHelperArgumentArray =
      gltfModel.asset.extras.rnLoaderOptions.defaultMaterialHelperArgumentArray;
    defaultMaterialHelperArgumentArray[0].textures = textures;

    gltfImporter._initializeMaterialProperties(gltfModel, textures.length);

    // setup rootGroup
    let rootGroups;
    const modelConverter = ModelConverter.getInstance();
    const rootGroupMain = modelConverter.convertToRhodoniteObject(gltfModel);

    const existOutline = gltfImporter._existOutlineMaterial(
      gltfModel.extensions.VRM
    );
    if (existOutline) {
      defaultMaterialHelperArgumentArray[0].isOutline = true;
      const rootGroupOutline = modelConverter.convertToRhodoniteObject(
        gltfModel
      );

      rootGroups = [rootGroupMain, rootGroupOutline];
    } else {
      rootGroups = [rootGroupMain];
    }
    gltfImporter._readSpringBone(rootGroupMain, gltfModel);
    gltfImporter._readVRMHumanoidInfo(gltfModel, rootGroupMain);

    return rootGroups;
  }
}
