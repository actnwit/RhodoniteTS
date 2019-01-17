export default class Gltf2Importer {
    private static __instance;
    private constructor();
    import(uri: string, options?: {}): Promise<any>;
    _getOptions(defaultOptions: any, json: glTF2, options: any): ImporterOpition;
    _loadAsTextJson(gltfJson: glTF2, uri: string, options: ImporterOpition, defaultOptions: {}): Promise<any>;
    _loadInner(arrayBufferBinary: ArrayBuffer | undefined, basePath: string, gltfJson: glTF2, options: ImporterOpition): Promise<{}[]>;
    _loadJsonContent(gltfJson: glTF2, options: ImporterOpition): void;
    _loadDependenciesOfScenes(gltfJson: glTF2): void;
    _loadDependenciesOfNodes(gltfJson: glTF2): void;
    _loadDependenciesOfMeshes(gltfJson: glTF2): void;
    _loadDependenciesOfMaterials(gltfJson: glTF2): void;
    _loadDependenciesOfTextures(gltfJson: glTF2): void;
    _loadDependenciesOfJoints(gltfJson: glTF2): void;
    _loadDependenciesOfAnimations(gltfJson: glTF2): void;
    _loadDependenciesOfAccessors(gltfJson: glTF2): void;
    _loadDependenciesOfBufferViews(gltfJson: glTF2): void;
    _mergeExtendedJson(gltfJson: glTF2, extendedData: any): void;
    _loadResources(arrayBufferBinary: ArrayBuffer, basePath: string, gltfJson: glTF2, options: ImporterOpition, resources: {
        shaders: any[];
        buffers: any[];
        images: any[];
    }): Promise<{}[]>;
    _accessBinaryAsImage(bufferViewStr: string, json: any, arrayBuffer: ArrayBuffer, mimeType: string): string;
    _sliceBufferViewToArrayBuffer(json: any, bufferViewStr: string, arrayBuffer: ArrayBuffer): ArrayBuffer;
    _accessArrayBufferAsImage(arrayBuffer: ArrayBuffer, imageType: string): string;
    _getImageType(imageType: string): string;
    static getInstance(): Gltf2Importer;
}
