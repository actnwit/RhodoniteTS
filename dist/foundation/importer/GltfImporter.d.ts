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
     * @param uris uri or array of uri of glTF file
     * @param options options for loading process where if you use files option, key name of files must be uri of the value array buffer
     * @returns gltf expression where:
     *            renderPasses[0]: model entities
     *            renderPasses[1]: model outlines
     */
    import(uris: string | string[], options?: GltfLoadOption): Promise<Expression>;
    private __initOptions;
    private __setRenderPassesToExpression;
    private __importMultipleModels;
    private __isValidExtension;
    private __importToRenderPassesFromUriPromise;
    private __importToRenderPassesFromArrayBufferPromise;
    private __getFileTypeFromFilePromise;
    private __importVRM;
    _getOptions(options?: GltfLoadOption): GltfLoadOption;
    _readVRMHumanoidInfo(gltfModel: VRM, rootEntity?: Entity): void;
    _readSpringBone(rootEntity: Entity, gltfModel: VRM): void;
    private addPhysicsComponentRecursively;
    _createTextures(gltfModel: glTF2): Texture[];
    _existOutlineMaterial(extensionsVRM: any): boolean;
    _initializeMaterialProperties(gltfModel: glTF2, texturesLength: number): void;
    private __initializeMToonMaterialProperties;
    private __initializeForUndefinedProperty;
}
