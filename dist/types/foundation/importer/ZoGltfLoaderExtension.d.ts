import Material from "../materials/Material";
import ILoaderExtension from "./ILoaderExtension";
export default class ZoGltfLoaderExtension implements ILoaderExtension {
    private static __instance;
    private constructor();
    /**
     * The static method to get singleton instance of this class.
     * @return The singleton instance of ZoGltfLoaderExtension class
     */
    static getInstance(): ZoGltfLoaderExtension;
    generateMaterial(): Material;
    isNeededToUseThisMaterial(gltfJson: glTF2): boolean;
    setupMaterial(gltfJson: glTF2, materialJson_: any, material: Material): void;
}
