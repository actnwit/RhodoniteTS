import { ISceneGraphEntity } from '../helpers/EntityHelper';
import { GltfLoadOption } from '../../types';
/**
 * The VRM Importer class.
 * This class will be integrated into GltfImporter.
 */
export declare class VrmImporter {
    private constructor();
    /**
     * Import VRM file.
     */
    static import(uri: string, options?: GltfLoadOption): Promise<ISceneGraphEntity[]>;
}
