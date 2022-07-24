import { Primitive } from '../geometry/Primitive';
import { RnM2 } from '../../types/RnM2';
import { GltfLoadOption } from '../../types';
/**
 * The draco Importer class.
 */
export declare class DrcPointCloudImporter {
    private static __instance;
    private constructor();
    /**
     * Import draco file of point cloud type
     * WEIGHTS_0 and JOINTS_0 attribute and all the mesh type and is not support yet.
     * @param uri - uri of drc file
     * @param options - options for loading process
     * @returns a glTF2 based JSON pre-processed
     */
    importPointCloud(uri: string, options?: GltfLoadOption): Promise<void | RnM2>;
    /**
     * Import the specified array buffer of draco file where the type must be point cloud.
     * WEIGHTS_0 and JOINTS_0 attribute and all the mesh type and is not support yet.
     * @param uri - uri of drc file
     * @param arrayBuffer - fetched array buffer of drc file
     * @param options - options for loading process
     * @returns a glTF2 based JSON pre-processed
     */
    importArrayBuffer(uri: string, arrayBuffer: ArrayBuffer, options?: GltfLoadOption): Promise<void | RnM2>;
    private __loadFromArrayBuffer;
    _getOptions(defaultOptions: any, json: RnM2, options: any): GltfLoadOption;
    _loadAsBinaryJson(dataView: DataView, isLittleEndian: boolean, arrayBuffer: ArrayBuffer, options: GltfLoadOption, defaultOptions: GltfLoadOption, basePath: string): Promise<any>;
    _loadAsTextJson(gltfJson: RnM2, options: GltfLoadOption, defaultOptions: GltfLoadOption, basePath: string): Promise<RnM2>;
    _loadInner(uint8array: Uint8Array | undefined, basePath: string, gltfJson: RnM2, options: GltfLoadOption): Promise<(void | (void | ArrayBuffer)[])[]>;
    _loadJsonContent(gltfJson: RnM2, options: GltfLoadOption): void;
    _loadDependenciesOfScenes(gltfJson: RnM2): void;
    _loadDependenciesOfNodes(gltfJson: RnM2): void;
    _loadDependenciesOfMeshes(gltfJson: RnM2): void;
    private _checkRnGltfLoaderOptionsExist;
    _loadDependenciesOfMaterials(gltfJson: RnM2): void;
    _loadDependenciesOfTextures(gltfJson: RnM2): void;
    _loadDependenciesOfJoints(gltfJson: RnM2): void;
    _loadDependenciesOfAnimations(gltfJson: RnM2): void;
    _loadDependenciesOfAccessors(gltfJson: RnM2): void;
    _loadDependenciesOfBufferViews(gltfJson: RnM2): void;
    _mergeExtendedJson(gltfJson: RnM2, extendedData: any): void;
    _loadResources(uint8Array: Uint8Array, basePath: string, gltfJson: RnM2, options: GltfLoadOption, resources: {
        shaders: any[];
        buffers: any[];
        images: any[];
    }): Promise<void | (void | ArrayBuffer)[]>;
    static getInstance(): DrcPointCloudImporter;
    private __decodeDraco;
    private __decodeBuffer;
    private __decodedBufferToJSON;
    private __setBuffersToJSON;
    private __convertBufferToURI;
    private __setAccessorsAndBufferViewsToJSON;
    private __setMeshesToJSON;
    /**
     * Import Draco file of point cloud type.
     * WEIGHTS_0 and JOINTS_0 attribute and all the mesh type and is not support yet.
     * @param uri - uri of glTF file
     * @returns a primitive of Rhodonite object
     */
    importPointCloudToPrimitive(uri: string): Promise<Primitive>;
    private __decodeDracoToPrimitive;
    private __getGeometryFromDracoBuffer;
    private __getPositions;
    private __getColors;
    private __getNormals;
    private __getTextureCoords;
}
