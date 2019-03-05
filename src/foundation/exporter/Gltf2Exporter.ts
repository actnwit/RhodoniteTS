export default class Gltf2Exporter {
  private static __instance: Gltf2Exporter;

  private constructor() {
  }

  static getInstance() {
    if (!this.__instance) {
      this.__instance = new Gltf2Exporter();
    }
    return this.__instance;
  }
}
