import { glTF2, GltfLoadOption } from "../../commontypes/glTF";
/**
 * The glTF2 Importer class.
 */
export default class Gltf2Importer {
    private static __instance;
    private constructor();
    /**
     * Import glTF2 file or arraybuffers.
     * @param uri - uri of glTF file
     * @param options - options for loading process
     * @returns a glTF2 based JSON pre-processed
     */
    import(uri: string, options?: GltfLoadOption): Promise<any>;
    private __loadFromArrayBuffer;
    _getOptions(defaultOptions: any, json: glTF2, options: any): GltfLoadOption;
    _loadAsBinaryJson(dataView: DataView, isLittleEndian: boolean, arrayBuffer: ArrayBuffer, options: GltfLoadOption, defaultOptions: GltfLoadOption, basePath: string): Promise<any>;
    _loadAsTextJson(gltfJson: glTF2, options: GltfLoadOption, defaultOptions: GltfLoadOption, basePath: string): Promise<glTF2>;
    _loadInner(uint8array: Uint8Array | undefined, basePath: string, gltfJson: glTF2, options: GltfLoadOption): Promise<unknown[]>;
    _loadJsonContent(gltfJson: glTF2, options: GltfLoadOption): void;
    _loadDependenciesOfScenes(gltfJson: glTF2): void;
    _loadDependenciesOfNodes(gltfJson: glTF2): void;
    _loadDependenciesOfMeshes(gltfJson: glTF2): void;
    private _checkRnGltfLoaderOptionsExist;
    _loadDependenciesOfMaterials(gltfJson: glTF2): void;
    _loadDependenciesOfTextures(gltfJson: glTF2): void;
    _loadDependenciesOfJoints(gltfJson: glTF2): void;
    _loadDependenciesOfAnimations(gltfJson: glTF2): void;
    _loadDependenciesOfAccessors(gltfJson: glTF2): void;
    _loadDependenciesOfBufferViews(gltfJson: glTF2): void;
    _mergeExtendedJson(gltfJson: glTF2, extendedData: any): void;
    _loadResources(uint8Array: Uint8Array, basePath: string, gltfJson: glTF2, options: GltfLoadOption, resources: {
        shaders: any[];
        buffers: any[];
        images: any[];
    }): Promise<void | unknown[]>;
    private __containsFileName;
    private __getFullPathOfFileName;
    static getInstance(): Gltf2Importer;
}
