import type { GltfFileBuffers, GltfLoadOption } from '../../types';
import type { RnM2 } from '../../types/RnM2';
import { type Result } from '../misc/Result';
import { RnPromise, type RnPromiseCallback } from '../misc/RnPromise';
/**
 * The glTF2 Importer class for loading and processing glTF 2.0 files.
 * Supports both .gltf (JSON) and .glb (binary) formats with comprehensive
 * extension support and resource loading capabilities.
 */
export declare class Gltf2Importer {
    private constructor();
    /**
     * Imports a glTF2 file from a URL and processes it into RnM2 format.
     * Automatically detects whether the file is in .gltf or .glb format.
     *
     * @param url - The URL of the glTF file to import
     * @param options - Optional configuration for the loading process
     * @returns A Promise that resolves to the processed glTF2 data in RnM2 format
     * @throws Will reject if the file cannot be fetched or processed
     *
     * @example
     * ```typescript
     * const gltfData = await Gltf2Importer.importFromUrl('path/to/model.gltf', {
     *   cameraComponent: CameraComponent,
     *   lightComponent: LightComponent
     * });
     * ```
     */
    static importFromUrl(url: string, options?: GltfLoadOption): Promise<RnM2>;
    /**
     * Imports glTF2 data from a collection of ArrayBuffer files.
     * Automatically identifies the main glTF or GLB file from the provided files.
     *
     * @param files - A collection of file buffers where keys are filenames and values are ArrayBuffers
     * @param options - Optional configuration for the loading process
     * @returns A Promise that resolves to the processed glTF2 data in RnM2 format
     * @throws Will reject if no glTF or GLB file is found in the provided files
     *
     * @example
     * ```typescript
     * const files = {
     *   'model.gltf': gltfBuffer,
     *   'texture.jpg': textureBuffer
     * };
     * const gltfData = await Gltf2Importer.importFromArrayBuffers(files);
     * ```
     */
    static importFromArrayBuffers(files: GltfFileBuffers, options?: GltfLoadOption): Promise<RnM2>;
    /**
     * Internal method to import glTF2 data from ArrayBuffer, handling both .gltf and .glb formats.
     * Determines the file format by checking the magic number and processes accordingly.
     *
     * @param arrayBuffer - The main glTF/GLB file as ArrayBuffer
     * @param otherFiles - Additional resource files (textures, bins) as ArrayBuffers
     * @param options - Optional configuration for the loading process
     * @param uri - Optional URI of the glTF file for resolving relative paths
     * @returns A Result containing the processed RnM2 data or an error
     *
     * @internal
     */
    static _importGltfOrGlbFromArrayBuffers(arrayBuffer: ArrayBuffer, otherFiles: GltfFileBuffers, options?: GltfLoadOption, uri?: string): Promise<Result<RnM2, undefined>>;
    /**
     * Merges default options with glTF asset extras and user-provided options.
     * Handles loader extension initialization based on the extension name.
     *
     * @param defaultOptions - The base default options to merge into
     * @param json - The glTF JSON data that may contain loader options in asset.extras
     * @param options - User-provided options to override defaults
     * @returns The merged and processed options object
     *
     * @internal
     */
    static _getOptions(defaultOptions: GltfLoadOption, json: RnM2, options: GltfLoadOption): GltfLoadOption;
    /**
     * Imports and processes a binary glTF (.glb) file from ArrayBuffer.
     * Validates the GLB format, extracts JSON and binary chunks, and processes the content.
     *
     * @param arrayBuffer - The GLB file data as ArrayBuffer
     * @param files - Additional resource files for resolving dependencies
     * @param options - Configuration options for the loading process
     * @returns A Promise that resolves to the processed glTF2 data in RnM2 format
     * @throws Will throw if the GLB format is invalid or unsupported
     *
     * @internal
     */
    static _importGlb(arrayBuffer: ArrayBuffer, files: GltfFileBuffers, options: GltfLoadOption): Promise<RnM2>;
    /**
     * Imports and processes a JSON glTF (.gltf) file with external resources.
     * Handles resource loading from external files and applies processing options.
     *
     * @param gltfJson - The parsed glTF JSON data
     * @param fileArrayBuffers - Collection of external resource files
     * @param options - Configuration options for the loading process
     * @param uri - Optional base URI for resolving relative resource paths
     * @param callback - Optional callback for progress tracking
     * @returns A Promise that resolves to the processed glTF2 data in RnM2 format
     *
     * @internal
     */
    static _importGltf(gltfJson: RnM2, fileArrayBuffers: GltfFileBuffers, options: GltfLoadOption, uri?: string, callback?: RnPromiseCallback): Promise<RnM2>;
    /**
     * Orchestrates the loading of resources and JSON content processing.
     * Creates promises for both resource loading and JSON dependency resolution.
     *
     * @param gltfJson - The glTF JSON data to process
     * @param files - Collection of resource files
     * @param options - Loading configuration options
     * @param uint8arrayOfGlb - Optional binary data from GLB file
     * @param basePath - Optional base path for resolving relative URIs
     * @param callback - Optional progress callback
     * @returns A Promise that resolves when all loading operations complete
     *
     * @internal
     */
    static _loadInner(gltfJson: RnM2, files: GltfFileBuffers, options: GltfLoadOption, uint8arrayOfGlb?: Uint8Array, basePath?: string, callback?: RnPromiseCallback): RnPromise<any[]>;
    /**
     * Processes the glTF JSON content by resolving all internal dependencies.
     * Sets up object references between scenes, nodes, meshes, materials, textures, etc.
     *
     * @param gltfJson - The glTF JSON data to process
     *
     * @internal
     */
    static _loadJsonContent(gltfJson: RnM2): void;
    /**
     * Resolves dependencies for glTF scenes by linking node references.
     * Creates nodesObjects array with direct references to node objects.
     *
     * @param gltfJson - The glTF JSON data containing scenes
     *
     * @internal
     */
    static _loadDependenciesOfScenes(gltfJson: RnM2): void;
    /**
     * Resolves dependencies for glTF nodes including hierarchy, meshes, skins, cameras, and lights.
     * Establishes parent-child relationships and links to associated objects.
     *
     * @param gltfJson - The glTF JSON data containing nodes
     *
     * @internal
     */
    static _loadDependenciesOfNodes(gltfJson: RnM2): void;
    /**
     * Resolves dependencies for glTF meshes including materials, attributes, indices, and morph targets.
     * Handles material variants and creates direct object references for efficient access.
     *
     * @param gltfJson - The glTF JSON data containing meshes
     *
     * @internal
     */
    static _loadDependenciesOfMeshes(gltfJson: RnM2): void;
    /**
     * Checks if the glTF model contains Rhodonite-specific loader options in asset extras.
     *
     * @param gltfModel - The glTF model to check
     * @returns True if rnLoaderOptions exist in asset.extras, false otherwise
     *
     * @internal
     */
    private static _checkRnGltfLoaderOptionsExist;
    /**
     * Resolves dependencies for glTF materials including all texture references.
     * Handles PBR textures, normal maps, occlusion, emissive, and various extensions
     * like clearcoat, transmission, sheen, specular, iridescence, anisotropy, and MToon.
     *
     * @param gltfJson - The glTF JSON data containing materials
     *
     * @internal
     */
    static _loadDependenciesOfMaterials(gltfJson: RnM2): void;
    private static _loadBasicMaterialTextures;
    private static _loadMaterialExtensions;
    private static _loadKHRExtensions;
    private static _loadVRMCExtensions;
    /**
     * Resolves dependencies for glTF textures including samplers and image sources.
     * Handles KHR_texture_basisu extension for Basis Universal texture compression.
     *
     * @param gltfJson - The glTF JSON data containing textures
     *
     * @internal
     */
    static _loadDependenciesOfTextures(gltfJson: RnM2): void;
    /**
     * Resolves dependencies for glTF skins including skeleton, joints, and inverse bind matrices.
     * Sets up the skeletal animation structure with proper object references.
     *
     * @param gltfJson - The glTF JSON data containing skins
     *
     * @internal
     */
    static _loadDependenciesOfJoints(gltfJson: RnM2): void;
    /**
     * Resolves dependencies for glTF animations including channels, samplers, and targets.
     * Handles different interpolation modes and sets up animation data structures.
     *
     * @param gltfJson - The glTF JSON data containing animations
     *
     * @internal
     */
    static _loadDependenciesOfAnimations(gltfJson: RnM2): void;
    /**
     * Resolves dependencies for glTF accessors including buffer views and sparse data.
     * Links accessors to their underlying buffer data for vertex attributes and indices.
     *
     * @param gltfJson - The glTF JSON data containing accessors
     *
     * @internal
     */
    static _loadDependenciesOfAccessors(gltfJson: RnM2): void;
    /**
     * Resolves dependencies for glTF buffer views by linking them to their buffers.
     * Establishes the connection between buffer views and the actual buffer data.
     *
     * @param gltfJson - The glTF JSON data containing buffer views
     *
     * @internal
     */
    static _loadDependenciesOfBufferViews(gltfJson: RnM2): void;
    /**
     * Merges extended JSON data into the main glTF JSON structure.
     * Supports ArrayBuffer, string, or object formats for extended data.
     *
     * @param gltfJson - The main glTF JSON to merge into
     * @param extendedData - Additional data to merge (ArrayBuffer, string, or object)
     *
     * @internal
     */
    static _mergeExtendedJson(gltfJson: RnM2, extendedData: ArrayBuffer | string | object): void;
    /**
     * Loads all external resources referenced by the glTF file including buffers and images.
     * Handles various URI formats including data URIs, file references, and embedded data.
     * Supports multiple image formats including Basis Universal and KTX2 compression.
     *
     * @param uint8ArrayOfGlb - Binary data from GLB file (if applicable)
     * @param gltfJson - The glTF JSON data containing resource references
     * @param files - Collection of external files to load from
     * @param options - Loading configuration options
     * @param basePath - Base path for resolving relative URIs
     * @param callback - Optional progress callback
     * @returns A Promise that resolves when all resources are loaded
     *
     * @internal
     */
    static _loadResources(uint8ArrayOfGlb: Uint8Array, gltfJson: RnM2, files: GltfFileBuffers, _options: GltfLoadOption, basePath?: string, callback?: RnPromiseCallback): RnPromise<any[]>;
    /**
     * Loads .rmn shader node JSON files for RHODONITE_materials_node extension.
     *
     * @param gltfJson - The glTF JSON data containing materials with the extension
     * @param files - Collection of external files that may contain .rmn data
     * @param basePath - Base path for resolving relative URIs
     * @returns Array of promises that resolve when .rmn files are loaded
     *
     * @private
     * @internal
     */
    private static __loadRhodoniteMaterialsNodeResources;
    /**
     * Checks if a specific filename exists in the provided files collection.
     * Compares only the filename part, ignoring directory paths.
     *
     * @param optionsFiles - Collection of files to search in
     * @param filename - The filename to search for
     * @returns True if the filename is found, false otherwise
     *
     * @private
     * @internal
     */
    private static __containsFileName;
    /**
     * Retrieves the full path of a file by its filename from the files collection.
     * Returns the complete key (path) that corresponds to the given filename.
     *
     * @param optionsFiles - Collection of files to search in
     * @param filename - The filename to find the full path for
     * @returns The full path if found, undefined otherwise
     *
     * @private
     * @internal
     */
    private static __getFullPathOfFileName;
    /**
     * Loads an image from a URI and processes it based on the image format.
     * Supports standard images, Basis Universal (.basis), and KTX2 compressed textures.
     * Handles both direct URIs and data embedded in the files collection.
     *
     * @param imageUri - The URI of the image to load
     * @param imageJson - The glTF image object to populate with loaded data
     * @param files - Collection of files that may contain the image data
     * @returns A Promise that resolves to the populated image object
     *
     * @private
     * @internal
     */
    private static __loadImageUri;
}
