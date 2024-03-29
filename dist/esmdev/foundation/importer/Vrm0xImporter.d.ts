import { Vrm0x } from '../../types/VRM0x';
import { ISceneGraphEntity } from '../helpers/EntityHelper';
import { GltfLoadOption, RnM2 } from '../../types';
import { RenderPass } from '../renderer/RenderPass';
import { Texture } from '../textures/Texture';
import { Err, Result } from '../misc/Result';
import { Sampler } from '../textures/Sampler';
/**
 * The VRM Importer class.
 * This class will be integrated into GltfImporter.
 */
export declare class Vrm0xImporter {
    private constructor();
    /**
     * Import VRM file.
     */
    static importFromUri(uri: string, options?: GltfLoadOption): Promise<Result<ISceneGraphEntity[], Err<RnM2, undefined>>>;
    /**
     * For VRM file only
     * Generate JSON.
     */
    static importJsonOfVRM(uri: string, options?: GltfLoadOption): Promise<Result<Vrm0x, Err<RnM2, undefined>>>;
    static __importVRM0x(gltfModel: RnM2, renderPasses: RenderPass[]): Promise<void>;
    static _readBlendShapeGroup(gltfModel: Vrm0x, rootEntity: ISceneGraphEntity): void;
    static _readVRMHumanoidInfo(gltfModel: Vrm0x, rootEntity?: ISceneGraphEntity): void;
    static _readSpringBone(gltfModel: Vrm0x): void;
    private static __addSpringBoneRecursively;
    private static __addPhysicsComponent;
    static _createTextures(gltfModel: RnM2): Texture[];
    static _createSamplers(gltfModel: RnM2): Sampler[];
    static _existOutlineMaterial(extensionsVRM: any): boolean;
    static _initializeMaterialProperties(gltfModel: RnM2, texturesLength: number): void;
    private static __initializeMToonMaterialProperties;
    private static __initializeForUndefinedProperty;
    static _getOptions(options?: GltfLoadOption): GltfLoadOption;
}
