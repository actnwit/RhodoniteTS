import { ISceneGraphEntity } from '../helpers/EntityHelper';
import { GltfLoadOption, RnM2 } from '../../types';
import { RenderPass } from '../renderer/RenderPass';
import { Texture } from '../textures/Texture';
import { Vrm1 } from '../../types/VRM1';
import { Err, IResult } from '../misc/Result';
export declare class VrmImporter {
    private constructor();
    static __importVRM(gltfModel: RnM2, renderPasses: RenderPass[]): Promise<void>;
    static _readVRMHumanoidInfo(gltfModel: Vrm1, rootEntity?: ISceneGraphEntity): void;
    static _readSpringBone(gltfModel: Vrm1): void;
    private static __addPhysicsComponentRecursively;
    static _createTextures(gltfModel: RnM2): Texture[];
    private static __initializeMToonMaterialProperties;
    static _getOptions(options?: GltfLoadOption): GltfLoadOption;
    /**
     * For VRM file only
     * Generate JSON.
     */
    static importJsonOfVRM(uri: string, options?: GltfLoadOption): Promise<IResult<Vrm1, Err<RnM2, undefined>>>;
    static __importVRM0x(gltfModel: RnM2, renderPasses: RenderPass[]): Promise<void>;
}
