import type { GltfFileBuffers, GltfLoadOption } from '../../types';
import type { RnPromiseCallback } from '../misc/RnPromise';
import { Expression } from '../renderer/Expression';
import type { Engine } from '../system/Engine';
/**
 * Importer class which can import GLTF and VRM files.
 * Supports multiple formats including glTF 1.0/2.0, GLB, VRM 0.x/1.0, and Draco compressed files.
 */
export declare class GltfImporter {
    /**
     * Private constructor to prevent direct instantiation.
     * This class is designed to be used as a static utility class.
     */
    private constructor();
    /**
     * Import GLTF or VRM file from a URL.
     * Automatically detects the file format and uses the appropriate importer.
     *
     * @param engine - The engine instance
     * @param url - The URL of the glTF/VRM file to import
     * @param options - Optional loading configuration. The files property is ignored for URL imports
     * @param callback - Optional callback function for progress tracking
     * @returns A Promise that resolves to an Expression containing:
     *          - renderPasses[0]: model entities
     *          - renderPasses[1]: model outlines (if applicable)
     * @throws Will reject the promise if the file cannot be fetched or parsed
     */
    static importFromUrl(engine: Engine, url: string, options?: GltfLoadOption, callback?: RnPromiseCallback): Promise<Expression>;
    /**
     * Import GLTF or VRM from pre-loaded ArrayBuffers.
     * Useful when you have already loaded the file data and want to avoid additional network requests.
     *
     * @param files - A map of file names to ArrayBuffers. File names should include extensions and match URIs used in the glTF
     * @param options - Optional loading configuration. If using the files option, keys must match the URIs of the ArrayBuffer values
     * @param callback - Optional callback function for progress tracking
     * @returns A Promise that resolves to an Expression containing:
     *          - renderPasses[0]: model entities
     *          - renderPasses[1]: model outlines (if applicable)
     * @throws Will reject the promise if the files cannot be parsed or are in an unsupported format
     */
    static importFromArrayBuffers(engine: Engine, files: GltfFileBuffers, options?: GltfLoadOption, callback?: RnPromiseCallback): Promise<Expression>;
    /**
     * Initialize and validate the loading options.
     * Sets default values for missing options and performs necessary transformations.
     *
     * @param options - The original options object, may be undefined
     * @returns A fully initialized GltfLoadOption object with all required properties
     * @private
     */
    private static __initOptions;
    /**
     * Set render passes to the expression object.
     * Creates a new expression if one doesn't exist, or updates the existing one.
     *
     * @param renderPasses - Array of render passes to add to the expression
     * @param options - Loading options containing the optional expression
     * @returns The expression object with render passes configured
     * @private
     */
    private static __setRenderPassesToExpression;
    /**
     * Check if the given file extension is supported by the importer.
     *
     * @param fileExtension - The file extension to validate (without the dot)
     * @returns True if the extension is supported (gltf, glb, vrm, drc), false otherwise
     * @private
     */
    private static __isValidExtension;
    /**
     * Determine if an ArrayBuffer contains GLB (binary glTF) data.
     * Checks the magic number at the beginning of the buffer.
     *
     * @param arrayBuffer - The ArrayBuffer to examine
     * @returns True if the buffer contains GLB data, false otherwise
     * @private
     */
    private static __isGlb;
    /**
     * Extract the glTF version from a GLB ArrayBuffer.
     * Reads the version field from the GLB header.
     *
     * @param glbArrayBuffer - The GLB ArrayBuffer to examine
     * @returns The glTF version number (typically 1 or 2)
     * @private
     */
    private static __getGlbVersion;
    /**
     * Determine the glTF version from parsed JSON data.
     * Examines the asset.version field to determine if it's glTF 1.0 or 2.0.
     *
     * @param gltfJson - The parsed glTF JSON object
     * @returns 2 for glTF 2.0, 1 for glTF 1.0 or older versions
     * @private
     */
    private static __getGltfVersion;
    /**
     * Detect the model file type and import using the appropriate importer.
     * Handles different file formats including glTF, GLB, VRM, and Draco compressed files.
     *
     * @param fileName - Name of the file being imported
     * @param renderPasses - Array of render passes to add imported entities to
     * @param options - Loading options and configuration
     * @param uri - URI of the file for reference
     * @param callback - Optional callback for progress tracking
     * @returns A Result indicating success or failure of the import operation
     * @private
     */
    private static __detectTheModelFileTypeAndImport;
    /**
     * Determine the file type from the file name and options.
     * Uses either the explicitly provided file type or auto-detects from the file content.
     *
     * @param fileName - Name of the file to analyze
     * @param options - Loading options containing file data
     * @param optionalFileType - Optional explicit file type override
     * @returns The detected or specified FileType
     * @private
     */
    private static __getFileTypeFromFilePromise;
}
