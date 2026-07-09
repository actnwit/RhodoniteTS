import { type CompressionTextureTypeEnum } from '../../foundation/definitions/CompressionTextureType';
import type { Engine } from '../../foundation/system/Engine';
import type { TextureData } from '../WebGLResourceRepository';
/**
 * A texture loader for KTX2 format files that handles transcoding of compressed texture data.
 *
 * KTX2 is a container format for GPU textures that supports various compression formats
 * including Basis Universal (ETC1S and UASTC). This loader can transcode KTX2 textures
 * to device-specific formats based on available GPU extensions.
 *
 * The loader supports:
 * - ETC1S and UASTC4x4 compressed formats
 * - Multiple target formats (ASTC, BC, ETC, PVRTC, etc.)
 * - ZSTD supercompression
 * - Mipmap generation
 * - Both WebGL and WebGPU rendering contexts
 *
 * @example
 * ```typescript
 * const loader = KTX2TextureLoader.getInstance();
 * const textureData = await loader.transcode(ktx2ArrayBuffer);
 * ```
 */
export declare class KTX2TextureLoader {
    private static __instance;
    private static __mscTranscoderModule;
    private static __zstdDecoder;
    private __mscTranscoderPromise;
    /**
     * Creates a new KTX2TextureLoader instance.
     *
     * Initializes the MSC transcoder module required for texture transcoding.
     * Logs an error if the MSC_TRANSCODER function is not available.
     */
    constructor();
    /**
     * Gets the singleton instance of KTX2TextureLoader.
     *
     * @returns The singleton KTX2TextureLoader instance
     */
    static getInstance(): KTX2TextureLoader;
    /**
     * Transcodes a KTX2 texture from the provided byte array.
     *
     * This method parses the KTX2 container, validates its format constraints,
     * and transcodes the texture data to a format suitable for the current GPU.
     *
     * @param uint8Array - The KTX2 texture data as a Uint8Array
     * @returns A promise that resolves to the transcoded texture data
     * @throws Error if the texture format is not supported (3D textures, array textures, or cube textures)
     *
     * @example
     * ```typescript
     * const ktx2Data = new Uint8Array(buffer);
     * const textureData = await loader.transcode(ktx2Data);
     * ```
     */
    transcode(engine: Engine, uint8Array: Uint8Array): Promise<{
        width: number;
        height: number;
        compressionTextureType: CompressionTextureTypeEnum;
        mipmapData: TextureData[];
        needGammaCorrection: boolean;
    }>;
    /**
     * Loads and initializes the MSC (Basis Universal) transcoder module.
     *
     * This method ensures the transcoder is loaded only once and initializes
     * the transcoder functions required for texture decompression.
     *
     * @returns A promise that resolves when the transcoder is ready
     * @private
     */
    private __loadMSCTranscoder;
    /**
     * Determines the optimal transcoding parameters for WebGL contexts.
     *
     * Analyzes available WebGL extensions to select the best compression format
     * and transcoding target based on GPU capabilities. Prioritizes formats in
     * order of quality: ASTC > BPTC > S3TC > PVRTC > ETC2 > ETC1 > RGBA32.
     *
     * @param hasAlpha - Whether the texture contains alpha channel data
     * @returns An object containing the transcoding target string and compression type
     * @private
     */
    private __getDeviceDependentParametersWebGL;
    /**
     * Determines the optimal transcoding parameters for WebGPU contexts.
     *
     * Analyzes available WebGPU texture compression features to select the best
     * compression format and transcoding target. Prioritizes formats in order
     * of quality: ASTC > BC (S3TC) > ETC2 > RGBA32.
     *
     * @param hasAlpha - Whether the texture contains alpha channel data
     * @returns An object containing the transcoding target string and compression type
     * @private
     */
    private __getDeviceDependentParametersWebGPU;
    /**
     * Parses a KTX2 container from the provided byte array.
     *
     * Uses the ktx-parse library to read and validate the KTX2 file format.
     * The parser automatically detects invalid identifiers and throws errors
     * for malformed files.
     *
     * @param uint8Array - The raw KTX2 file data
     * @returns The parsed KTX2 container with all metadata and texture data
     * @private
     */
    private __parse;
    /**
     * Transcodes the texture data from the KTX2 container to the target format.
     *
     * This method handles the core transcoding logic, including:
     * - Determining the source compression format (ETC1S or UASTC4x4)
     * - Selecting the appropriate transcoder and target format
     * - Processing all mipmap levels
     * - Handling ZSTD decompression if needed
     * - Managing Basis Universal palette and table data for ETC1S
     *
     * @param ktx2Container - The parsed KTX2 container
     * @returns The transcoded texture data with all mipmap levels
     * @private
     */
    private __transcodeData;
    /**
     * Determines whether the texture contains alpha channel data.
     *
     * For UASTC4x4 format, checks if the channel ID indicates RGBA data.
     * For ETC1S format, checks if any sample contains alpha channel information.
     *
     * @param dfd - The data format descriptor from the KTX2 container
     * @param compressedTextureFormat - The compression format (ETC1S or UASTC4x4)
     * @returns True if the texture has alpha channel data, false otherwise
     * @private
     */
    private __hasAlpha;
}
