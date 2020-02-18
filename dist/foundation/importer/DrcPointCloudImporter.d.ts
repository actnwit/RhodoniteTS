import { glTF2, GltfLoadOption } from "../../commontypes/glTF";
/**
 * The draco Importer class.
 */
export default class DrcPointCloudImporter {
    private static __instance;
    private constructor();
    /**
     * Import Draco file of point cloud type.
     * WEIGHTS_0 and JOINTS_0 attribute and all the mesh type and is not support yet.
     * @param uri - uri of glTF file
     * @param options - options for loading process
     * @returns a glTF2 based JSON pre-processed
     */
    importPointCloud(uri: string, options?: GltfLoadOption): Promise<void | glTF2>;
    private __loadFromArrayBuffer;
    _getOptions(defaultOptions: any, json: glTF2, options: any): GltfLoadOption;
    _loadAsBinaryJson(dataView: DataView, isLittleEndian: boolean, arrayBuffer: ArrayBuffer, options: GltfLoadOption, defaultOptions: GltfLoadOption, uri?: string): Promise<any>;
    _loadAsTextJson(gltfJson: glTF2, options: GltfLoadOption, defaultOptions: GltfLoadOption, uri?: string): Promise<glTF2>;
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
    }): Promise<void | void[]>;
    static getInstance(): DrcPointCloudImporter;
    private __decodeDraco;
    private __decodeBuffer;
    private __decodedBufferToJSON;
    private __convertBufferToURI;
    /**
     * Import Draco file of point cloud type.
     * WEIGHTS_0 and JOINTS_0 attribute and all the mesh type and is not support yet.
     * @param uri - uri of glTF file
     * @param options - options for loading process
     * @returns a primitive of Rhodonite object
     */
    importPointCloudToPrimitive(uri: string, options: GltfLoadOption): Promise<any>;
    private __decodeDracoDirect;
    private __getGeometryFromDracoBuffer;
    private __getPositions;
    private __getColors;
    private __getNormals;
    private __getTextureCoords;
}
