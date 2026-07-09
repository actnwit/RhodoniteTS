import { type Gltf2 } from '../../types/glTF2';
import type { Gltf2Ex } from '../../types/glTF2ForOutput';
import type { Tag } from '../core/RnObject';
import type { IMeshEntity, ISceneGraphEntity } from '../helpers/EntityHelper';
import type { Engine } from '../system/Engine';
export declare const GLTF2_EXPORT_GLTF = "glTF";
export declare const GLTF2_EXPORT_GLB = "glTF-Binary";
export declare const GLTF2_EXPORT_DRACO = "glTF-Draco";
export declare const GLTF2_EXPORT_EMBEDDED = "glTF-Embedded";
export declare const GLTF2_EXPORT_NO_DOWNLOAD = "No-Download";
/**
 * glTF2 Export Type definitions
 */
export type Gltf2ExportType = typeof GLTF2_EXPORT_GLTF | typeof GLTF2_EXPORT_GLB | typeof GLTF2_EXPORT_DRACO | typeof GLTF2_EXPORT_EMBEDDED | typeof GLTF2_EXPORT_NO_DOWNLOAD;
/**
 * Configuration options for glTF2 export process
 */
export interface Gltf2ExporterArguments {
    /** Target entities to export. If specified, includes their descendants in the output */
    entities?: ISceneGraphEntity[];
    /** Export format type */
    type: Gltf2ExportType;
    /** Tags to exclude from export */
    excludeTags?: Tag[];
}
/**
 * The glTF2 format Exporter class.
 *
 * This class provides functionality to export Rhodonite scene data to glTF 2.0 format.
 * It supports various export formats including .gltf, .glb, and embedded formats.
 */
export declare class Gltf2Exporter {
    private constructor();
    private static __materialToGltfMaterialIndices;
    private static __lightComponentToLightIndex;
    private static __cameraComponentToCameraIndex;
    private static __exportedPointerTargetsByTrack;
    private static __warnedMaterialSemantics;
    /**
     * Exports scene data from the Rhodonite system in glTF2 format.
     *
     * This is the main entry point for glTF2 export functionality. It processes
     * the scene graph, materials, animations, and other data to create a complete
     * glTF2 output in the specified format.
     *
     * @param filename - The target output filename (without extension)
     * @param option - Export configuration options
     * @returns Promise that resolves to the generated glTF2 ArrayBuffer
     *
     * @example
     * ```typescript
     * const buffer = await Gltf2Exporter.export('myScene', {
     *   type: GLTF2_EXPORT_GLB,
     *   entities: [rootEntity]
     * });
     * ```
     */
    static export(engine: Engine, filename: string, option?: Gltf2ExporterArguments): Promise<ArrayBuffer>;
    /**
     * Collects target entities for export, including their descendants.
     *
     * This method processes the entity hierarchy to determine which entities should
     * be included in the export. It handles tag-based filtering and ensures that
     * hierarchical relationships are preserved.
     *
     * @param option - Export configuration options containing entity filters
     * @returns Object containing collected entities and top-level entities
     */
    private static __collectEntities;
    /**
     * Creates the base structure of the glTF2 JSON document.
     *
     * Initializes the fundamental glTF2 structure with required fields like asset,
     * buffers, and empty arrays for various glTF2 components. Sets up the metadata
     * and prepares the document for content population.
     *
     * @param filename - Target output filename for generating URIs
     * @returns Object containing the initialized JSON structure and processed filename
     */
    private static __createJsonBase;
    /**
     * Creates glTF2 BufferViews and Accessors for all geometry and animation data.
     *
     * This method processes mesh geometry, animation data, and skeletal information
     * to create the necessary buffer views and accessors required for glTF2 format.
     * It handles data deduplication and proper memory layout.
     *
     * @param json - The glTF2 JSON document to populate
     * @param entities - Array of entities to process for buffer creation
     */
    static __createBufferViewsAndAccessors(json: Gltf2Ex, entities: ISceneGraphEntity[]): void;
    private static __createAnimationData;
    /**
     * Creates glTF2 nodes representing the scene graph structure.
     *
     * Converts Rhodonite entities into glTF2 nodes, preserving hierarchical relationships,
     * transformations, and component associations (meshes, cameras, skins). Handles
     * special cases like billboard nodes and blend shape weights.
     *
     * @param json - The glTF2 JSON document to populate with nodes
     * @param entities - All entities to convert to nodes
     * @param topLevelEntities - Root-level entities for the scene
     */
    static __createNodes(json: Gltf2Ex, entities: ISceneGraphEntity[], topLevelEntities: ISceneGraphEntity[]): void;
    private static __exportLight;
    private static __ensureLightsExtension;
    private static __ensureExtensionUsed;
    private static __registerMaterialIndex;
    private static __shouldEmitPointerTarget;
    private static __resolveAnimationTarget;
    private static __resolveMaterialAnimationTarget;
    private static __findMaterialIndicesForAnimatedValue;
    private static __resolveLightAnimationTarget;
    private static __resolveCameraAnimationTarget;
    private static __getMaterialPointerSuffix;
    private static __logUnsupportedMaterialSemantic;
    private static __getCameraPointerSuffix;
    /**
     * Creates glTF2 materials and textures from Rhodonite materials.
     *
     * Processes all materials used by mesh entities, converting Rhodonite material
     * properties to glTF2 PBR format. Handles texture extraction, optimization,
     * and proper format conversion including support for various material extensions.
     *
     * @param json - The glTF2 JSON document to populate with materials
     * @param entities - Mesh entities containing materials to convert
     * @param option - Export options affecting material processing
     * @returns Promise that resolves when all materials and textures are processed
     */
    static __createMaterials(json: Gltf2Ex, entities: IMeshEntity[], option: Gltf2ExporterArguments): Promise<any[]>;
    private static __processMeshPrimitives;
    private static __exportMaterialVariants;
    private static __ensureVariantIndex;
    private static __ensureMaterialVariantsExtension;
    private static __createMaterialFromRhodonite;
    /**
     * Sets up the RHODONITE_materials_node extension for node-based materials.
     *
     * @param material - The glTF material to add the extension to
     * @param rnMaterial - The Rhodonite material containing node-based shader data
     * @param json - The glTF JSON document
     * @param promises - Array to collect async operations
     * @param bufferIdx - The buffer index for texture data
     * @param option - Export options
     */
    private static __setupNodeBasedMaterialExtension;
    /**
     * Processes texture parameters from a node-based material and exports them to glTF format.
     *
     * @param rnMaterial - The Rhodonite material containing texture parameters
     * @param json - The glTF JSON document
     * @param promises - Array to collect async operations
     * @param bufferIdx - The buffer index for texture data
     * @param option - Export options
     * @returns Object mapping texture names to their glTF texture indices
     */
    private static __processNodeBasedMaterialTextures;
    private static __setupMaterial;
    private static __processParameters;
    /**
     * Creates the binary buffer containing all mesh, animation, and texture data.
     *
     * Consolidates all buffer views into a single binary buffer with proper
     * alignment and padding according to glTF2 specification. Handles data
     * copying and memory layout optimization.
     *
     * @param json - The glTF2 JSON document containing buffer view definitions
     * @returns ArrayBuffer containing the consolidated binary data
     */
    private static __createBinary;
    /**
     * Initiates download of the exported glTF2 data as a .glb file.
     *
     * Creates a downloadable .glb file containing the complete glTF2 scene
     * in binary format. Uses browser download API to save the file locally.
     *
     * @param json - The glTF2 JSON document
     * @param filename - Base filename for the download
     * @param arraybuffer - Binary data buffer containing the .glb file
     */
    static __downloadGlb(_json: Gltf2, filename: string, arraybuffer: ArrayBuffer): void;
    /**
     * Placeholder method for future glTF2 ArrayBuffer export functionality.
     *
     * This method is reserved for implementing glTF2 export that returns
     * an ArrayBuffer without triggering a download.
     */
    exportGlbAsArrayBuffer(): void;
    /**
     * Initiates download of the exported glTF2 data as separate .gltf and .bin files.
     *
     * Creates downloadable .gltf (JSON) and .bin (binary) files representing
     * the complete glTF2 scene in text format with external binary references.
     *
     * @param json - The glTF2 JSON document
     * @param filename - Base filename for the downloads
     * @param arraybuffer - Binary data buffer for the .bin file
     */
    static __downloadGltf(json: Gltf2, filename: string, arraybuffer: ArrayBuffer): void;
}
