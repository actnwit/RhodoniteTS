import type { GltfLoadOption } from '../../types';
import type { RnM2 } from '../../types/RnM2';
import { Primitive } from '../geometry/Primitive';
import { Err, type Result } from '../misc/Result';
import type { Engine } from '../system/Engine';
/**
 * The Draco Point Cloud Importer class for importing and decoding Draco compressed point cloud files.
 * This class provides functionality to import Draco files and convert them to glTF2 format or Rhodonite primitives.
 * Currently supports point cloud geometry only - mesh types, WEIGHTS_0, and JOINTS_0 attributes are not supported.
 */
export declare class DrcPointCloudImporter {
    private static __instance;
    /**
     * Private constructor to enforce singleton pattern.
     */
    private constructor();
    /**
     * Imports a Draco point cloud file from a URI and converts it to glTF2 format.
     * This method supports both direct file URIs and file collections passed through options.
     *
     * @param uri - The URI of the .drc file to import
     * @param options - Optional loading configuration including file collections and processing options
     * @returns A Promise that resolves to a Result containing the glTF2 JSON or an error
     *
     * @example
     * ```typescript
     * const importer = DrcPointCloudImporter.getInstance();
     * const result = await importer.importPointCloud('path/to/pointcloud.drc');
     * if (result.isOk()) {
     *   const gltfJson = result.get();
     *   // Process the glTF JSON
     * }
     * ```
     */
    importPointCloud(uri: string, options?: GltfLoadOption): Promise<Result<RnM2, Err<ArrayBuffer, unknown>>>;
    /**
     * Imports a Draco point cloud from an ArrayBuffer and converts it to glTF2 format.
     * This method is useful when you already have the file data in memory.
     *
     * @param uri - The original URI of the file (used for base path calculation)
     * @param arrayBuffer - The ArrayBuffer containing the Draco file data
     * @param options - Optional loading configuration
     * @returns A Promise that resolves to the glTF2 JSON or rejects with an error
     *
     * @example
     * ```typescript
     * const importer = DrcPointCloudImporter.getInstance();
     * const buffer = await fetch('pointcloud.drc').then(r => r.arrayBuffer());
     * const gltfJson = await importer.importArrayBuffer('pointcloud.drc', buffer);
     * ```
     */
    importArrayBuffer(uri: string, arrayBuffer: ArrayBuffer, options?: GltfLoadOption): Promise<void | RnM2>;
    /**
     * Internal method to load and process ArrayBuffer data.
     * Determines whether the data is binary glTF or text JSON format and processes accordingly.
     *
     * @param arrayBuffer - The ArrayBuffer containing the file data
     * @param defaultOptions - Default loading options
     * @param basePath - Base path for resolving relative URIs
     * @param options - Additional loading options
     * @returns A Promise that resolves to the processed glTF JSON
     * @private
     */
    private __loadFromArrayBuffer;
    /**
     * Merges default options with JSON-embedded options and user-provided options.
     * Priority: user options > JSON embedded options > default options.
     *
     * @param defaultOptions - The default loading options
     * @param json - The glTF JSON that may contain embedded options
     * @param options - User-provided options
     * @returns The merged options object
     * @private
     */
    _getOptions(defaultOptions: any, json: RnM2, options: any): GltfLoadOption;
    /**
     * Processes binary glTF data by extracting JSON chunk and binary data.
     * Validates the glTF binary format and delegates to appropriate loading methods.
     *
     * @param dataView - DataView for reading binary data
     * @param isLittleEndian - Whether the data is in little-endian format
     * @param arrayBuffer - The complete ArrayBuffer containing the glTF data
     * @param options - Loading options
     * @param defaultOptions - Default loading options
     * @param basePath - Base path for resolving relative URIs
     * @returns A Promise that resolves to the processed glTF JSON
     * @private
     */
    _loadAsBinaryJson(dataView: DataView, isLittleEndian: boolean, arrayBuffer: ArrayBuffer, options: GltfLoadOption, defaultOptions: GltfLoadOption, basePath: string): Promise<any>;
    /**
     * Processes text-based glTF JSON data.
     * Sets up asset information and delegates to internal loading methods.
     *
     * @param gltfJson - The parsed glTF JSON object
     * @param options - Loading options
     * @param defaultOptions - Default loading options
     * @param basePath - Base path for resolving relative URIs
     * @returns A Promise that resolves to the processed glTF JSON
     * @private
     */
    _loadAsTextJson(gltfJson: RnM2, options: GltfLoadOption, defaultOptions: GltfLoadOption, basePath: string): Promise<RnM2>;
    /**
     * Internal loading method that coordinates resource loading and JSON content processing.
     * Runs resource loading and JSON processing in parallel for better performance.
     *
     * @param uint8array - Binary data for embedded resources (optional)
     * @param basePath - Base path for resolving relative URIs
     * @param gltfJson - The glTF JSON object to process
     * @param options - Loading options
     * @returns A Promise that resolves when all loading is complete
     * @private
     */
    _loadInner(uint8array: Uint8Array | undefined, basePath: string, gltfJson: RnM2, options: GltfLoadOption): Promise<(void | (void | ArrayBuffer)[])[]>;
    /**
     * Processes glTF JSON content by loading dependencies for all major components.
     * This method establishes object references between different glTF components.
     *
     * @param gltfJson - The glTF JSON object to process
     * @param options - Loading options
     * @private
     */
    _loadJsonContent(gltfJson: RnM2, _options: GltfLoadOption): void;
    /**
     * Establishes object references between scenes and their nodes.
     * Populates the nodesObjects array with actual node objects.
     *
     * @param gltfJson - The glTF JSON object containing scenes
     * @private
     */
    _loadDependenciesOfScenes(gltfJson: RnM2): void;
    /**
     * Establishes object references for nodes including hierarchy, meshes, skins, cameras, and lights.
     * This method creates the complete node dependency graph.
     *
     * @param gltfJson - The glTF JSON object containing nodes
     * @private
     */
    _loadDependenciesOfNodes(gltfJson: RnM2): void;
    /**
     * Establishes object references for meshes and their primitives.
     * Links materials, attributes, indices, and morph targets to their respective objects.
     *
     * @param gltfJson - The glTF JSON object containing meshes
     * @private
     */
    _loadDependenciesOfMeshes(gltfJson: RnM2): void;
    /**
     * Checks if Rhodonite-specific glTF loader options exist in the asset extras.
     *
     * @param gltfModel - The glTF model to check
     * @returns True if Rhodonite loader options exist, false otherwise
     * @private
     */
    private _checkRnGltfLoaderOptionsExist;
    /**
     * Establishes object references for materials and their textures.
     * Links PBR textures, normal maps, occlusion maps, and emissive textures.
     * Also handles extension-specific texture processing.
     *
     * @param gltfJson - The glTF JSON object containing materials
     * @private
     */
    _loadDependenciesOfMaterials(gltfJson: RnM2): void;
    /**
     * Establishes object references for textures, linking samplers and image sources.
     *
     * @param gltfJson - The glTF JSON object containing textures
     * @private
     */
    _loadDependenciesOfTextures(gltfJson: RnM2): void;
    /**
     * Establishes object references for skeletal animation joints and skins.
     * Links skeleton nodes, inverse bind matrices, and joint hierarchies.
     *
     * @param gltfJson - The glTF JSON object containing skins
     * @private
     */
    _loadDependenciesOfJoints(gltfJson: RnM2): void;
    /**
     * Establishes object references for animations, channels, and samplers.
     * Links animation data with target nodes and handles special cases for rotations and weights.
     *
     * @param gltfJson - The glTF JSON object containing animations
     * @private
     */
    _loadDependenciesOfAnimations(gltfJson: RnM2): void;
    /**
     * Establishes object references for accessors and their buffer views.
     * Also handles sparse accessor data if present.
     *
     * @param gltfJson - The glTF JSON object containing accessors
     * @private
     */
    _loadDependenciesOfAccessors(gltfJson: RnM2): void;
    /**
     * Establishes object references between buffer views and their underlying buffers.
     *
     * @param gltfJson - The glTF JSON object containing buffer views
     * @private
     */
    _loadDependenciesOfBufferViews(gltfJson: RnM2): void;
    /**
     * Merges extended JSON data into the main glTF JSON object.
     * Supports ArrayBuffer, string, or object formats for extended data.
     *
     * @param gltfJson - The main glTF JSON object to merge into
     * @param extendedData - Additional data to merge (ArrayBuffer, string, or object)
     * @private
     */
    _mergeExtendedJson(gltfJson: RnM2, extendedData: any): void;
    /**
     * Loads external resources (buffers and images) referenced by the glTF JSON.
     * Handles various URI formats including data URIs, file references, and embedded binary data.
     *
     * @param uint8Array - Binary data for embedded resources
     * @param basePath - Base path for resolving relative URIs
     * @param gltfJson - The glTF JSON object containing resource references
     * @param options - Loading options including file collections
     * @param resources - Object to store loaded resources
     * @returns A Promise that resolves when all resources are loaded
     * @private
     */
    _loadResources(uint8Array: Uint8Array, basePath: string, gltfJson: RnM2, options: GltfLoadOption, resources: {
        shaders: any[];
        buffers: any[];
        images: any[];
    }): Promise<void | (void | ArrayBuffer)[]>;
    /**
     * Gets the singleton instance of the DrcPointCloudImporter.
     * Creates a new instance if one doesn't exist.
     *
     * @returns The singleton instance of DrcPointCloudImporter
     */
    static getInstance(): DrcPointCloudImporter;
    /**
     * Decodes a Draco compressed file and converts it to glTF2 format.
     * This is the main entry point for Draco decoding operations.
     *
     * @param arrayBuffer - The ArrayBuffer containing Draco compressed data
     * @param defaultOptions - Default loading options
     * @param basePath - Base path for resolving relative URIs
     * @param options - Additional loading options
     * @returns A Promise that resolves to the glTF2 JSON object
     * @private
     */
    private __decodeDraco;
    /**
     * Decodes a Draco compressed buffer and extracts geometry data.
     * Handles both point cloud and mesh geometry types, but only supports point clouds.
     *
     * @param arrayBuffer - The ArrayBuffer containing Draco compressed data
     * @returns A Promise that resolves to the decoded geometry data as JSON
     * @private
     */
    private __decodeBuffer;
    /**
     * Converts decoded Draco buffer data to glTF2 JSON format.
     * Creates a complete glTF2 structure with nodes, scenes, materials, and geometry data.
     *
     * @param buffer - The decoded Float32Array containing vertex data
     * @param numPoints - Number of points in the point cloud
     * @param attributeNames - Array of attribute names (POSITION, COLOR, etc.)
     * @param attributeComponents - Array of component counts for each attribute
     * @returns A Promise that resolves to the glTF2 JSON object
     * @private
     */
    private __decodedBufferToJSON;
    /**
     * Sets buffer data in the glTF JSON by converting the Float32Array to a data URI.
     *
     * @param buffer - The Float32Array containing vertex data
     * @param json - The glTF JSON object to modify
     * @returns A Promise that resolves when the buffer is set
     * @private
     */
    private __setBuffersToJSON;
    /**
     * Converts an ArrayBuffer to a data URI for embedding in glTF JSON.
     *
     * @param arrayBuffer - The ArrayBuffer to convert
     * @returns A Promise that resolves to the data URI string
     * @private
     */
    private __convertBufferToURI;
    /**
     * Creates accessor and buffer view definitions for the glTF JSON.
     * Defines how to interpret the binary data for each vertex attribute.
     *
     * @param numPoints - Number of points in the point cloud
     * @param attributeNames - Array of attribute names
     * @param attributeComponents - Array of component counts for each attribute
     * @param json - The glTF JSON object to modify
     * @private
     */
    private __setAccessorsAndBufferViewsToJSON;
    /**
     * Creates mesh definitions for the glTF JSON with point cloud primitives.
     * Maps Draco attribute names to glTF attribute semantics.
     *
     * @param attributeNames - Array of attribute names from Draco
     * @param json - The glTF JSON object to modify
     * @private
     */
    private __setMeshesToJSON;
    /**
     * Imports a Draco point cloud file and converts it directly to a Rhodonite Primitive.
     * This method bypasses glTF conversion for direct primitive creation.
     *
     * @param uri - The URI of the .drc file to import
     * @returns A Promise that resolves to a Rhodonite Primitive object
     *
     * @example
     * ```typescript
     * const importer = DrcPointCloudImporter.getInstance();
     * const primitive = await importer.importPointCloudToPrimitive('path/to/pointcloud.drc');
     * // Use the primitive directly in Rhodonite
     * ```
     */
    importPointCloudToPrimitive(engine: Engine, uri: string): Promise<Primitive>;
    /**
     * Decodes a Draco compressed ArrayBuffer directly to a Rhodonite Primitive.
     * This method provides the most direct path from Draco data to Rhodonite geometry.
     * Note: Tangent attributes are not currently supported.
     *
     * @param arrayBuffer - The ArrayBuffer containing Draco compressed data
     * @returns The decoded Rhodonite Primitive
     * @private
     */
    private __decodeDracoToPrimitive;
    /**
     * Extracts and validates Draco geometry from a compressed buffer.
     * Supports both triangular mesh and point cloud geometry types.
     *
     * @param draco - The Draco decoder module instance
     * @param decoder - The Draco decoder instance
     * @param arrayBuffer - The ArrayBuffer containing compressed geometry
     * @returns The decoded Draco geometry object, or undefined if decoding fails
     * @private
     */
    private __getGeometryFromDracoBuffer;
    /**
     * Extracts position attribute data from Draco geometry.
     * Position data is required for all point clouds.
     *
     * @param draco - The Draco decoder module instance
     * @param decoder - The Draco decoder instance
     * @param dracoGeometry - The decoded Draco geometry
     * @param attributeCompositionTypes - Array to store composition types
     * @param attributeSemantics - Array to store attribute semantics
     * @param attributes - Array to store attribute data
     * @returns The extracted position data as Float32Array
     * @private
     */
    private __getPositions;
    /**
     * Extracts color attribute data from Draco geometry if present.
     * Handles both RGB and RGBA color formats, ensuring RGBA output.
     *
     * @param draco - The Draco decoder module instance
     * @param decoder - The Draco decoder instance
     * @param dracoGeometry - The decoded Draco geometry
     * @param attributeCompositionTypes - Array to store composition types
     * @param attributeSemantics - Array to store attribute semantics
     * @param attributes - Array to store attribute data
     * @returns The extracted color data as Float32Array, or null if not present
     * @private
     */
    private __getColors;
    /**
     * Extracts normal attribute data from Draco geometry if present.
     * Normal vectors are used for lighting calculations.
     *
     * @param draco - The Draco decoder module instance
     * @param decoder - The Draco decoder instance
     * @param dracoGeometry - The decoded Draco geometry
     * @param attributeCompositionTypes - Array to store composition types
     * @param attributeSemantics - Array to store attribute semantics
     * @param attributes - Array to store attribute data
     * @returns The extracted normal data as Float32Array, or null if not present
     * @private
     */
    private __getNormals;
    /**
     * Extracts texture coordinate attribute data from Draco geometry if present.
     * Texture coordinates are used for mapping textures onto geometry.
     *
     * @param draco - The Draco decoder module instance
     * @param decoder - The Draco decoder instance
     * @param dracoGeometry - The decoded Draco geometry
     * @param attributeCompositionTypes - Array to store composition types
     * @param attributeSemantics - Array to store attribute semantics
     * @param attributes - Array to store attribute data
     * @returns The extracted texture coordinate data as Float32Array, or null if not present
     * @private
     */
    private __getTextureCoords;
}
