import Gltf2Importer from "./Gltf2Importer";
import { GltfLoadOption } from "../../types/glTF";

export default class VRMImporter {
  private static __instance: VRMImporter;

  private constructor() {
  }

  /**
   * Import VRM file.
   */
  async import(uri: string, options?: GltfLoadOption) {
    const gltf2Importer = Gltf2Importer.getInstance();
    const response = await gltf2Importer.import(uri, options);
    return response;
  }

  static getInstance() {
    if (!this.__instance) {
      this.__instance = new VRMImporter();
    }
    return this.__instance;
  }

}
