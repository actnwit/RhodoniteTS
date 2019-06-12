import Material from "../materials/Material";
export default interface ILoaderExtension {
    generateMaterial?(): void;
    isNeededToUseThisMaterial?(gltfJson: glTF2): boolean;
    setupMaterial?(gltfJson: glTF2, materialJson: any, material: Material): void;
}
