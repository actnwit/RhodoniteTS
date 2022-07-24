import { RnM2 } from '../../types/RnM2';
import { Texture } from '../textures/Texture';
import { Expression } from '../renderer/Expression';
import { VRM } from '../../types/VRM';
import { ISceneGraphEntity } from '../helpers/EntityHelper';
import { GltfFileBuffers, GltfLoadOption } from '../../types';
import { RnPromiseCallback } from '../misc/RnPromise';
/**
 * Importer class which can import GLTF and VRM.
 */
export declare class GltfImporter {
    private constructor();
    /**
     * For VRM file only
     * Generate JSON.
     */
    static importJsonOfVRM(uri: string, options?: GltfLoadOption): Promise<VRM | undefined>;
    /**
     * Import GLTF or VRM file.
     * @param uris uri or array of uri of glTF file
     * @param options options for loading process where the files property is ignored
     * @returns gltf expression where:
     *            renderPasses[0]: model entities
     *            renderPasses[1]: model outlines
     */
    static import(uris: string | string[], options?: GltfLoadOption, callback?: RnPromiseCallback): Promise<Expression>;
    /**
     * Import GLTF or VRM file.
     * @param uris uri or array of uri of glTF file
     * @param options options for loading process where if you use files option, key name of files must be uri of the value array buffer
     * @returns gltf expression where:
     *            renderPasses[0]: model entities
     *            renderPasses[1]: model outlines
     */
    static importFromArrayBuffers(files: GltfFileBuffers, options?: GltfLoadOption, callback?: RnPromiseCallback): Promise<Expression>;
    private static __initOptions;
    private static __setRenderPassesToExpression;
    private static __importMultipleModelsFromUri;
    private static __importMultipleModelsFromArrayBuffers;
    private static __isValidExtension;
    private static __importToRenderPassesFromUriPromise;
    private static __isGlb;
    private static __getGlbVersion;
    private static __getGltfVersion;
    private static __importToRenderPassesFromArrayBufferPromise;
    private static __getFileTypeFromFilePromise;
    private static __importVRM;
    static _getOptions(options?: GltfLoadOption): GltfLoadOption;
    static _readVRMHumanoidInfo(gltfModel: VRM, rootEntity?: ISceneGraphEntity): void;
    static _readSpringBone(rootEntity: ISceneGraphEntity, gltfModel: VRM): void;
    private static addPhysicsComponentRecursively;
    static _createTextures(gltfModel: RnM2): Texture[];
    static _existOutlineMaterial(extensionsVRM: any): boolean;
    static _initializeMaterialProperties(gltfModel: RnM2, texturesLength: number): void;
    private static __initializeMToonMaterialProperties;
    private static __initializeForUndefinedProperty;
}
