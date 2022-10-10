import { Expression } from '../renderer/Expression';
import { GltfFileBuffers, GltfLoadOption } from '../../types';
import { RnPromiseCallback } from '../misc/RnPromise';
import { Err, IResult } from '../misc/Result';
/**
 * Importer class which can import GLTF and VRM.
 */
export declare class GltfImporter {
    private constructor();
    /**
     * Import GLTF or VRM file.
     * @param uris uri or array of uri of glTF file
     * @param options options for loading process where the files property is ignored
     * @returns gltf expression where:
     *            renderPasses[0]: model entities
     *            renderPasses[1]: model outlines
     */
    static importFromUri(uri: string, options?: GltfLoadOption, callback?: RnPromiseCallback): Promise<IResult<Expression, Err<ArrayBuffer, unknown>>>;
    /**
     * Import GLTF or VRM from ArrayBuffers.
     * @param files ArrayBuffers of glTF/VRM files
     * @param options options for loading process where if you use files option, key name of files must be uri of the value array buffer
     * @returns gltf expression where:
     *            renderPasses[0]: model entities
     *            renderPasses[1]: model outlines
     */
    static importFromArrayBuffers(files: GltfFileBuffers, options?: GltfLoadOption, callback?: RnPromiseCallback): Promise<IResult<Expression, never>>;
    private static __initOptions;
    private static __setRenderPassesToExpression;
    private static __isValidExtension;
    private static __isGlb;
    private static __getGlbVersion;
    private static __getGltfVersion;
    private static __detectTheModelFileTypeAndImport;
    private static __getFileTypeFromFilePromise;
}
