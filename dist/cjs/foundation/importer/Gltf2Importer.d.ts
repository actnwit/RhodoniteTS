import { RnM2 } from '../../types/RnM2';
import { RnPromise, RnPromiseCallback } from '../misc/RnPromise';
import { GltfFileBuffers, GltfLoadOption } from '../../types';
import { IResult } from '../misc/Result';
/**
 * The glTF2 Importer class.
 */
export declare class Gltf2Importer {
    private constructor();
    /**
     * Import glTF2 file
     * @param uri - uri of glTF file
     * @param options - options for loading process
     * @returns a glTF2 based JSON pre-processed
     */
    static importFromUri(uri: string, options?: GltfLoadOption): Promise<IResult<RnM2, undefined>>;
    static importFromArrayBuffers(files: GltfFileBuffers, options?: GltfLoadOption): Promise<IResult<RnM2, undefined>>;
    /**
     * Import glTF2 array buffer.
     * @param arrayBuffer .gltf/.glb file in ArrayBuffer
     * @param otherFiles other resource files data in ArrayBuffers
     * @param options options for loading process (Optional)
     * @param uri .gltf file's uri (Optional)
     * @returns a glTF2 based JSON pre-processed
     */
    static _importGltfOrGlbFromArrayBuffers(arrayBuffer: ArrayBuffer, otherFiles: GltfFileBuffers, options?: GltfLoadOption, uri?: string): Promise<IResult<RnM2, undefined>>;
    static _getOptions(defaultOptions: GltfLoadOption, json: RnM2, options: GltfLoadOption): GltfLoadOption;
    static _importGlb(arrayBuffer: ArrayBuffer, files: GltfFileBuffers, options: GltfLoadOption): Promise<RnM2>;
    static _importGltf(gltfJson: RnM2, fileArrayBuffers: GltfFileBuffers, options: GltfLoadOption, uri?: string, callback?: RnPromiseCallback): Promise<RnM2>;
    static _loadInner(gltfJson: RnM2, files: GltfFileBuffers, options: GltfLoadOption, uint8arrayOfGlb?: Uint8Array, basePath?: string, callback?: RnPromiseCallback): RnPromise<any[]>;
    static _loadJsonContent(gltfJson: RnM2): void;
    static _loadDependenciesOfScenes(gltfJson: RnM2): void;
    static _loadDependenciesOfNodes(gltfJson: RnM2): void;
    static _loadDependenciesOfMeshes(gltfJson: RnM2): void;
    private static _checkRnGltfLoaderOptionsExist;
    static _loadDependenciesOfMaterials(gltfJson: RnM2): void;
    static _loadDependenciesOfTextures(gltfJson: RnM2): void;
    static _loadDependenciesOfJoints(gltfJson: RnM2): void;
    static _loadDependenciesOfAnimations(gltfJson: RnM2): void;
    static _loadDependenciesOfAccessors(gltfJson: RnM2): void;
    static _loadDependenciesOfBufferViews(gltfJson: RnM2): void;
    static _mergeExtendedJson(gltfJson: RnM2, extendedData: ArrayBuffer | string | object): void;
    static _loadResources(uint8ArrayOfGlb: Uint8Array, gltfJson: RnM2, files: GltfFileBuffers, options: GltfLoadOption, basePath?: string, callback?: RnPromiseCallback): RnPromise<any[]>;
    private static __containsFileName;
    private static __getFullPathOfFileName;
    private static __loadImageUri;
}
