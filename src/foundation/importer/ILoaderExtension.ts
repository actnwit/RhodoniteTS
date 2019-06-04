import Material from "../materials/Material";

export default interface ILoaderExtension {
  generateMaterial?(): void;
  setupMaterial?(gltfJson: glTF2, materialJson: any, material: Material): void;
}
