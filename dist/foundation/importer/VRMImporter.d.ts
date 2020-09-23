import { GltfLoadOption } from "../../commontypes/glTF";
/**
 * The VRM Importer class.
 * This class will be integrated into GltfImporter.
 */
export default class VRMImporter {
    private static __instance;
    private constructor();
    static getInstance(): VRMImporter;
    /**
     * Import VRM file.
     */
    import(uri: string, options?: GltfLoadOption): Promise<import("../core/Entity").default[]>;
}
