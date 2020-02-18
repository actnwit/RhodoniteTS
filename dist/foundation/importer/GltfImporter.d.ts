import Entity from "../core/Entity";
import { GltfLoadOption, glTF2 } from "../../commontypes/glTF";
import Texture from "../textures/Texture";
import Expression from "../renderer/Expression";
import { VRM } from "../../commontypes/VRM";
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
    _getOptions(options: GltfLoadOption | undefined): GltfLoadOption;
    _readVRMHumanoidInfo(gltfModel: VRM, rootEntity?: Entity): void;
    _readSpringBone(rootEntity: Entity, gltfModel: VRM): void;
    private addPhysicsComponentRecursively;
    _createTextures(gltfModel: glTF2): Texture[];
    _existOutlineMaterial(extensionsVRM: any): boolean;
    _initializeMaterialProperties(gltfModel: glTF2, texturesLength: number): void;
    private __initializeMToonMaterialProperties;
    private __initializeForUndefinedProperty;
}
