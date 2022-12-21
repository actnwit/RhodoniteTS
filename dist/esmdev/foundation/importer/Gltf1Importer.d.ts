import { RnM2, RnM2Material } from '../../types/RnM2';
import { glTF1 } from '../../types/glTF1';
import { GltfFileBuffers, GltfLoadOption } from '../../types';
import { RnPromiseCallback } from '../misc/RnPromise';
export declare class Gltf1Importer {
    private constructor();
    /**
     * the method to load glTF1 file.
     * @param uri - uri of glTF file
     * @param options - options for loading process
     * @returns a glTF2 based JSON pre-processed
     */
    static import(uri: string, options?: GltfLoadOption): Promise<RnM2>;
    static importGltfOrGlbFromFile(uri: string, options?: GltfLoadOption): Promise<RnM2 | undefined>;
    /**
     * Import glTF1 array buffer.
     * @param arrayBuffer .gltf/.glb file in ArrayBuffer
     * @param otherFiles other resource files data in ArrayBuffers
     * @param options options for loading process (Optional)
     * @param uri .gltf file's uri (Optional)
     * @returns a glTF2 based JSON pre-processed
     */
    static importGltfOrGlbFromArrayBuffers(arrayBuffer: ArrayBuffer, otherFiles: GltfFileBuffers, options?: GltfLoadOption, uri?: string): Promise<RnM2>;
    static _getOptions(defaultOptions: GltfLoadOption, json: glTF1, options: GltfLoadOption): GltfLoadOption;
    static importGlb(arrayBuffer: ArrayBuffer, files: GltfFileBuffers, options: GltfLoadOption): Promise<RnM2>;
    static importGltf(gltfJson: glTF1, files: GltfFileBuffers, options: GltfLoadOption, uri?: string, callback?: RnPromiseCallback): Promise<RnM2>;
    static _loadInner(gltfJson: glTF1, files: GltfFileBuffers, options: GltfLoadOption, uint8array?: Uint8Array, basePath?: string): Promise<(glTF1 | void)[][]>;
    static _loadJsonContent(gltfJson: glTF1): void;
    private static _convertToGltf2LikeStructure;
    private static __createProperty;
    static _loadDependenciesOfScenes(gltfJson: glTF1): void;
    static _loadDependenciesOfNodes(gltfJson: glTF1): void;
    static _loadDependenciesOfMeshes(gltfJson: glTF1): void;
    static _isKHRMaterialsCommon(materialJson: RnM2Material): boolean;
    static _loadDependenciesOfMaterials(gltfJson: glTF1): void;
    static _loadDependenciesOfTextures(gltfJson: glTF1): void;
    static _loadDependenciesOfJoints(gltfJson: glTF1): void;
    static _loadDependenciesOfAnimations(gltfJson: glTF1): void;
    static _loadDependenciesOfAccessors(gltfJson: glTF1): void;
    static _loadDependenciesOfBufferViews(gltfJson: glTF1): void;
    static _mergeExtendedJson(gltfJson: glTF1, extendedData: ArrayBuffer | string | object): void;
    static _loadResources(uint8Array: Uint8Array, gltfJson: glTF1, files: GltfFileBuffers, options: GltfLoadOption, basePath?: string): Promise<(glTF1 | void)[]>;
    private static __containsFileName;
    private static __getFullPathOfFileName;
    private static __loadImageUri;
}
