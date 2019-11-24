import { GltfLoadOption } from "../../types/glTF";
import Expression from "../renderer/Expression";
import { VRM } from "../../types/VRM";
/**
 * Importer class which can import GLTF and VRM.
 */
export default class GltfImporter {
    private static __instance;
    private constructor();
    static getInstance(): GltfImporter;
    /**
     * For VRM file only
     * Generate JSON.
     */
    importJsonOfVRM(uri: string, options?: GltfLoadOption): Promise<VRM>;
    /**
     * Import GLTF or VRM file.
     */
    import(uri: string, options?: GltfLoadOption): Promise<Expression>;
    private __importModel;
    private __setupRenderPasses;
    private __importVRM;
    private __getOptions;
    private readVRMHumanoidInfo;
    private readSpringBone;
    private addPhysicsComponentRecursively;
    private __createTextures;
    private __existOutlineMaterial;
    private __initializeMaterialProperties;
    private __initializeMToonMaterialProperties;
    private __initializeForUndefinedProperty;
}
