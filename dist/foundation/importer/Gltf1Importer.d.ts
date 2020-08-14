import { glTF1, GltfLoadOption } from "../../commontypes/glTF";
export default class Gltf1Importer {
    private static __instance;
    private constructor();
    /**
     * the method to load glTF1 file.
     * @param uri - uri of glTF file
     * @param options - options for loading process
     * @returns a glTF2 based JSON pre-processed
     */
    import(uri: string, options?: GltfLoadOption): Promise<any>;
    private __loadFromArrayBuffer;
    _getOptions(defaultOptions: any, json: glTF1, options: any): GltfLoadOption;
    _loadAsBinaryJson(dataView: DataView, isLittleEndian: boolean, arrayBuffer: ArrayBuffer, options: GltfLoadOption, defaultOptions: GltfLoadOption, basePath: string): Promise<any>;
    _loadAsTextJson(gltfJson: glTF1, options: GltfLoadOption, defaultOptions: GltfLoadOption, basePath: string): Promise<any>;
    _loadInner(uint8array: Uint8Array | undefined, basePath: string, gltfJson: glTF1, options: GltfLoadOption): Promise<unknown[]>;
    _loadJsonContent(gltfJson: glTF1, options: GltfLoadOption): void;
    private _convertToGltf2LikeStructure;
    private __createProperty;
    _loadDependenciesOfScenes(gltfJson: glTF1): void;
    _loadDependenciesOfNodes(gltfJson: glTF1): void;
    _loadDependenciesOfMeshes(gltfJson: glTF1): void;
    _isKHRMaterialsCommon(materialJson: any): boolean;
    _loadDependenciesOfMaterials(gltfJson: glTF1): void;
    _loadDependenciesOfTextures(gltfJson: glTF1): void;
    _loadDependenciesOfJoints(gltfJson: glTF1): void;
    _loadDependenciesOfAnimations(gltfJson: glTF1): void;
    _loadDependenciesOfAccessors(gltfJson: glTF1): void;
    _loadDependenciesOfBufferViews(gltfJson: glTF1): void;
    _mergeExtendedJson(gltfJson: glTF1, extendedData: any): void;
    _loadResources(uint8Array: Uint8Array, basePath: string, gltfJson: glTF1, options: GltfLoadOption, resources: {
        shaders: any[];
        buffers: any[];
        images: any[];
    }): Promise<any[]>;
    private __containsFileName;
    private __getFullPathOfFileName;
    static getInstance(): Gltf1Importer;
}
