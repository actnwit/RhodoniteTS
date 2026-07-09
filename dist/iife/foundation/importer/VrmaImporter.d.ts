import type { RnM2Vrma } from '../../types/RnM2Vrma';
/**
 * A utility class for importing VRMA (VRM Animation) files.
 *
 * VRMA is an extension format for VRM that adds animation capabilities,
 * allowing for the import and processing of humanoid animation data.
 * This class provides static methods to import VRMA files from various sources
 * and processes the humanoid bone mapping for efficient animation playback.
 *
 * @remarks
 * This class extends the functionality of Gltf2Importer to handle VRMA-specific
 * features, particularly the VRMC_vrm_animation extension that contains
 * humanoid bone definitions and animation data.
 *
 * @example
 * ```typescript
 * // Import from URL
 * const vrmaData = await VrmaImporter.importFromUrl('https://example.com/animation.vrma');
 *
 * // Import from file buffer
 * const fileBuffer = await file.arrayBuffer();
 * const vrmaData = await VrmaImporter.importFromArrayBuffer(fileBuffer);
 * ```
 */
export declare class VrmaImporter {
    /**
     * Imports a VRMA (VRM Animation) file from a URL.
     *
     * @param url - The URL of the VRMA file to import
     * @returns A Promise that resolves to the imported VRMA data structure
     * @throws Will reject the promise if the import fails or the URL is invalid
     *
     * @example
     * ```typescript
     * const vrmaData = await VrmaImporter.importFromUrl('https://example.com/animation.vrma');
     * ```
     */
    static importFromUrl(url: string): Promise<RnM2Vrma>;
    /**
     * Imports a VRMA (VRM Animation) file from an ArrayBuffer.
     *
     * @param arrayBuffer - The ArrayBuffer containing the VRMA file data
     * @returns A Promise that resolves to the imported VRMA data structure
     * @throws Will reject the promise if the import fails or the ArrayBuffer is invalid
     *
     * @example
     * ```typescript
     * const fileBuffer = await file.arrayBuffer();
     * const vrmaData = await VrmaImporter.importFromArrayBuffer(fileBuffer);
     * ```
     */
    static importFromArrayBuffer(arrayBuffer: ArrayBuffer): Promise<RnM2Vrma>;
    /**
     * Reads and processes the humanoid bone data from a VRMA file.
     * Creates a mapping between node IDs and human bone names for easier bone lookup.
     *
     * @param rnm - The RnM2Vrma object containing the VRMA data
     * @returns void - This method modifies the input object in place
     *
     * @remarks
     * This method extracts humanoid bone information from the VRMC_vrm_animation extension
     * and creates a reverse mapping from node IDs to bone names for efficient bone queries.
     * If no humanoid bones are found, the method returns early without processing.
     */
    static readHumanoid(rnm: RnM2Vrma): void;
}
