import { GltfImporter } from './GltfImporter';
import { Gltf2Importer } from './Gltf2Importer';
import {GltfLoadOption} from '../../types/RnM2';
import { ModelConverter } from './ModelConverter';
import {Is} from '../misc/Is';
import {VRM} from '../../types/VRM';
import {ISceneGraphEntity} from '../helpers/EntityHelper';

/**
 * The VRM Importer class.
 * This class will be integrated into GltfImporter.
 */
export default class VrmImporter {
  private constructor() {}

  /**
   * Import VRM file.
   */
  public static async import(
    uri: string,
    options?: GltfLoadOption
  ): Promise<ISceneGraphEntity[]> {
    options = GltfImporter._getOptions(options);

    const gltfModel = await Gltf2Importer.import(uri, options);
    if (Is.not.exist(gltfModel)) {
      return [];
    }

    const textures = GltfImporter._createTextures(gltfModel);
    const defaultMaterialHelperArgumentArray =
      gltfModel.asset.extras?.rnLoaderOptions
        ?.defaultMaterialHelperArgumentArray;
    if (Is.exist(defaultMaterialHelperArgumentArray)) {
      defaultMaterialHelperArgumentArray[0].textures = textures;
    }

    GltfImporter._initializeMaterialProperties(gltfModel, textures.length);

    // setup rootGroup
    let rootGroups;
    const rootGroupMain = ModelConverter.convertToRhodoniteObject(gltfModel!);

    const existOutline = GltfImporter._existOutlineMaterial(
      gltfModel.extensions.VRM
    );
    if (existOutline) {
      if (Is.exist(defaultMaterialHelperArgumentArray)) {
        defaultMaterialHelperArgumentArray[0].isOutline = true;
      }
      const rootGroupOutline =
        ModelConverter.convertToRhodoniteObject(gltfModel);

      rootGroups = [rootGroupMain, rootGroupOutline];
    } else {
      rootGroups = [rootGroupMain];
    }
    GltfImporter._readSpringBone(rootGroupMain, gltfModel as VRM);
    GltfImporter._readVRMHumanoidInfo(gltfModel as VRM, rootGroupMain);

    return rootGroups;
  }
}
