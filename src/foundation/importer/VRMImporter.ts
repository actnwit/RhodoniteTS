export default class VRMImporter {
  private static __instance: VRMImporter;

  private constructor() {
  }

  /**
   * Import VRM file.
   */
  async import(uri: string) {

  }

  static getInstance() {
    if (!this.__instance) {
      this.__instance = new VRMImporter();
    }
    return this.__instance;
  }

}
