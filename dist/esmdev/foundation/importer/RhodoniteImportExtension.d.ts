import { RnM2 } from '../../types/RnM2';
import { ISceneGraphEntity } from '../helpers/EntityHelper';
export declare class RhodoniteImportExtension {
    private static __instance;
    static importBillboard(gltfJson: RnM2, groups: ISceneGraphEntity[]): void;
    static importEffect(gltfJson: RnM2, rootGroup: ISceneGraphEntity): void;
}
