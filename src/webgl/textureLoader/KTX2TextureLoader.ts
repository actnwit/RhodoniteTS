import {
  KTX2ChannelETC1S,
  KTX2ChannelUASTC,
  type KTX2Container,
  type KTX2DataFormatDescriptorBasicFormat,
  type KTX2GlobalDataBasisLZ,
  KTX2Model,
  KTX2SupercompressionScheme,
  KTX2Transfer,
  read,
} from 'ktx-parse';
import { ZSTDDecoder } from 'zstddec';
import {
  CompressionTextureType,
  type CompressionTextureTypeEnum,
} from '../../foundation/definitions/CompressionTextureType';
import { ProcessApproach } from '../../foundation/definitions/ProcessApproach';
import { Logger } from '../../foundation/misc/Logger';
import { CGAPIResourceRepository } from '../../foundation/renderer/CGAPIResourceRepository';
import type { Engine } from '../../foundation/system/Engine';
import { EngineState } from '../../foundation/system/EngineState';
import type {
  BasisLzEtc1sImageTranscoder,
  MSC_TRANSCODER_TYPE,
  MscTranscoderModule,
  TranscodedImage,
  UastcImageTranscoder,
} from '../../types/KTX2Texture';
import type { WebGLContextWrapper } from '../WebGLContextWrapper';
import type { TextureData } from '../WebGLResourceRepository';

const CompressedTextureFormat = {
  ETC1S: 0,
  UASTC4x4: 1,
} as const;
type CompressedTextureFormat = (typeof CompressedTextureFormat)[keyof typeof CompressedTextureFormat];

const TranscodeTarget = {
  ETC1_RGB: 'ETC1_RGB',
  BC1_RGB: 'BC1_RGB',
  BC4_R: 'BC4_R',
  BC5_RG: 'BC5_RG',
  BC3_RGBA: 'BC3_RGBA',
  PVRTC1_4_RGB: 'PVRTC1_4_RGB',
  PVRTC1_4_RGBA: 'PVRTC1_4_RGBA',
  BC7_RGBA: 'BC7_RGBA',
  BC7_M6_RGB: 'BC7_M6_RGB',
  BC7_M5_RGBA: 'BC7_M5_RGBA',
  ETC2_RGBA: 'ETC2_RGBA',
  ASTC_4x4_RGBA: 'ASTC_4x4_RGBA',
  RGBA32: 'RGBA32',
  RGB565: 'RGB565',
  BGR565: 'BGR565',
  RGBA4444: 'RGBA4444',
  PVRTC2_4_RGB: 'PVRTC2_4_RGB',
  PVRTC2_4_RGBA: 'PVRTC2_4_RGBA',
  EAC_R11: 'EAC_R11',
  EAC_RG11: 'EAC_RG11',
} as const;
type TranscodeTarget = (typeof TranscodeTarget)[keyof typeof TranscodeTarget];

interface KTX2GlobalDataBasisLZImageDesc {
  imageFlags: number;
  rgbSliceByteOffset: number;
  rgbSliceByteLength: number;
  alphaSliceByteOffset: number;
  alphaSliceByteLength: number;
}

declare const MSC_TRANSCODER: MSC_TRANSCODER_TYPE;

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
export class KTX2TextureLoader {
  private static __instance: KTX2TextureLoader;

  // TODO: create type of __mscTranscoderModule
  private static __mscTranscoderModule: MscTranscoderModule;
  private static __zstdDecoder: ZSTDDecoder;

  private __mscTranscoderPromise: Promise<void>;

  /**
   * Creates a new KTX2TextureLoader instance.
   *
   * Initializes the MSC transcoder module required for texture transcoding.
   * Logs an error if the MSC_TRANSCODER function is not available.
   */
  constructor() {
    if (typeof MSC_TRANSCODER === 'undefined') {
      Logger.error('Failed to call MSC_TRANSCODER() function. Please check to import msc_basis_transcoder.js.');
    }
    this.__mscTranscoderPromise = this.__loadMSCTranscoder();
  }

  /**
   * Gets the singleton instance of KTX2TextureLoader.
   *
   * @returns The singleton KTX2TextureLoader instance
   */
  static getInstance() {
    if (!this.__instance) {
      this.__instance = new KTX2TextureLoader();
    }
    return this.__instance;
  }

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
  transcode(engine: Engine, uint8Array: Uint8Array) {
    const ktx2Container = this.__parse(uint8Array);

    if (ktx2Container.pixelDepth > 0) {
      throw new Error('Only 2D textures are currently supported');
    }

    if (ktx2Container.layerCount > 1) {
      throw new Error('Array textures are not currently supported');
    }

    if (ktx2Container.faceCount > 1) {
      throw new Error('Cube textures are not currently supported');
    }

    if (ktx2Container.supercompressionScheme === KTX2SupercompressionScheme.ZSTD) {
      if (KTX2TextureLoader.__zstdDecoder == null) {
        KTX2TextureLoader.__zstdDecoder = new ZSTDDecoder();
      }

      return KTX2TextureLoader.__zstdDecoder.init().then(() => {
        return this.__mscTranscoderPromise.then(() => {
          return this.__transcodeData(engine, ktx2Container);
        });
      });
    }
    return this.__mscTranscoderPromise.then(() => {
      return this.__transcodeData(engine, ktx2Container);
    });
  }

  /**
   * Loads and initializes the MSC (Basis Universal) transcoder module.
   *
   * This method ensures the transcoder is loaded only once and initializes
   * the transcoder functions required for texture decompression.
   *
   * @returns A promise that resolves when the transcoder is ready
   * @private
   */
  private __loadMSCTranscoder(): Promise<void> {
    return new Promise(resolve => {
      if (KTX2TextureLoader.__mscTranscoderModule) {
        resolve();
      }

      MSC_TRANSCODER().then((transcoderModule: MscTranscoderModule) => {
        transcoderModule.initTranscoders();
        KTX2TextureLoader.__mscTranscoderModule = transcoderModule;
        resolve();
      });
    });
  }

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
  private __getDeviceDependentParametersWebGL(engine: Engine, hasAlpha: boolean) {
    const webGLResourceRepository = engine.webglResourceRepository;
    const glw = webGLResourceRepository.currentWebGLContextWrapper as WebGLContextWrapper;

    const astc = glw.webgl2ExtCTAstc || glw.webgl1ExtCTAstc;
    const bptc = glw.webgl2ExtCTBptc || glw.webgl1ExtCTBptc;
    const s3tc = glw.webgl2ExtCTS3tc || glw.webgl1ExtCTS3tc;
    const pvrtc = glw.webgl2ExtCTPvrtc || glw.webgl1ExtCTPvrtc;
    const etc2 = glw.webgl2ExtCTEtc || glw.webgl1ExtCTEtc;
    const etc1 = glw.webgl2ExtCTEtc1 || glw.webgl1ExtCTEtc1;

    let transcodeTargetStr: TranscodeTarget;
    let compressionTextureType: CompressionTextureTypeEnum;
    if (astc) {
      transcodeTargetStr = TranscodeTarget.ASTC_4x4_RGBA;
      compressionTextureType = CompressionTextureType.ASTC_RGBA_4x4;
    } else if (bptc) {
      transcodeTargetStr = TranscodeTarget.BC7_RGBA;
      compressionTextureType = CompressionTextureType.BPTC_RGBA;
    } else if (s3tc) {
      if (hasAlpha) {
        transcodeTargetStr = TranscodeTarget.BC3_RGBA;
        compressionTextureType = CompressionTextureType.S3TC_RGBA_DXT5;
      } else {
        transcodeTargetStr = TranscodeTarget.BC1_RGB;
        compressionTextureType = CompressionTextureType.S3TC_RGB_DXT1;
      }
    } else if (pvrtc) {
      if (hasAlpha) {
        transcodeTargetStr = TranscodeTarget.PVRTC1_4_RGBA;
        compressionTextureType = CompressionTextureType.PVRTC_RGBA_4BPPV1;
      } else {
        transcodeTargetStr = TranscodeTarget.PVRTC1_4_RGB;
        compressionTextureType = CompressionTextureType.PVRTC_RGB_4BPPV1;
      }
    } else if (etc2) {
      if (hasAlpha) {
        transcodeTargetStr = TranscodeTarget.ETC2_RGBA;
        compressionTextureType = CompressionTextureType.ETC2_RGBA8_EAC;
      } else {
        transcodeTargetStr = TranscodeTarget.ETC1_RGB;
        compressionTextureType = CompressionTextureType.ETC2_RGB8;
      }
    } else if (etc1) {
      transcodeTargetStr = TranscodeTarget.ETC1_RGB;
      compressionTextureType = CompressionTextureType.ETC1_RGB;
    } else {
      transcodeTargetStr = TranscodeTarget.RGBA32;
      compressionTextureType = CompressionTextureType.RGBA8_EXT;
    }

    return { transcodeTargetStr, compressionTextureType };
  }

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
  private __getDeviceDependentParametersWebGPU(engine: Engine, hasAlpha: boolean) {
    const webGpuResourceRepository = engine.webGpuResourceRepository;
    const adapter = webGpuResourceRepository.getWebGpuDeviceWrapper().gpuAdapter;

    const astc = adapter.features.has('texture-compression-astc');
    const s3tc = adapter.features.has('texture-compression-bc');
    const etc2 = adapter.features.has('texture-compression-etc2');

    let transcodeTargetStr: TranscodeTarget;
    let compressionTextureType: CompressionTextureTypeEnum;
    if (astc) {
      transcodeTargetStr = TranscodeTarget.ASTC_4x4_RGBA;
      compressionTextureType = CompressionTextureType.ASTC_RGBA_4x4;
    } else if (s3tc) {
      if (hasAlpha) {
        transcodeTargetStr = TranscodeTarget.BC3_RGBA;
        compressionTextureType = CompressionTextureType.S3TC_RGBA_DXT5;
      } else {
        transcodeTargetStr = TranscodeTarget.BC1_RGB;
        compressionTextureType = CompressionTextureType.S3TC_RGB_DXT1;
      }
    } else if (etc2) {
      if (hasAlpha) {
        transcodeTargetStr = TranscodeTarget.ETC2_RGBA;
        compressionTextureType = CompressionTextureType.ETC2_RGBA8_EAC;
      } else {
        transcodeTargetStr = TranscodeTarget.ETC1_RGB;
        compressionTextureType = CompressionTextureType.ETC2_RGB8;
      }
    } else {
      transcodeTargetStr = TranscodeTarget.RGBA32;
      compressionTextureType = CompressionTextureType.RGBA8_EXT;
    }

    return { transcodeTargetStr, compressionTextureType };
  }

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
  private __parse(uint8Array: Uint8Array): KTX2Container {
    return read(uint8Array);
  }

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
  private __transcodeData(engine: Engine, ktx2Container: KTX2Container) {
    const width = ktx2Container.pixelWidth;
    const height = ktx2Container.pixelHeight;
    const faceCount = ktx2Container.faceCount; // faceCount is 6 if the transcoded data is a cube map (not support yet)

    const imageDescs = ktx2Container.globalData?.imageDescs;

    const dfd = ktx2Container.dataFormatDescriptor[0];
    const compressedTextureFormat =
      dfd.colorModel === KTX2Model.UASTC ? CompressedTextureFormat.UASTC4x4 : CompressedTextureFormat.ETC1S;

    const hasAlpha = this.__hasAlpha(dfd, compressedTextureFormat);
    const isVideo = false;

    const transcoderModule = KTX2TextureLoader.__mscTranscoderModule;
    const transcoder =
      compressedTextureFormat === CompressedTextureFormat.UASTC4x4
        ? new transcoderModule.UastcImageTranscoder()
        : new transcoderModule.BasisLzEtc1sImageTranscoder();
    const textureFormat =
      compressedTextureFormat === CompressedTextureFormat.UASTC4x4
        ? transcoderModule.TextureFormat.UASTC4x4
        : transcoderModule.TextureFormat.ETC1S;

    const { transcodeTargetStr, compressionTextureType } =
      EngineState.currentProcessApproach === ProcessApproach.WebGPU
        ? this.__getDeviceDependentParametersWebGPU(engine, hasAlpha)
        : this.__getDeviceDependentParametersWebGL(engine, hasAlpha);

    const transcodeTarget = transcoderModule.TranscodeTarget[transcodeTargetStr];

    const mipmapData: TextureData[] = [];
    const transcodedData = {
      width,
      height,
      compressionTextureType,
      mipmapData,
      needGammaCorrection: dfd.transferFunction !== KTX2Transfer.SRGB,
    };

    for (let level = 0; level < ktx2Container.levels.length; level++) {
      const levelWidth = Math.max(1, width >> level);
      const levelHeight = Math.max(1, height >> level);

      const imageInfo = new transcoderModule.ImageInfo(textureFormat, levelWidth, levelHeight, level);

      let levelBuffer = ktx2Container.levels[level].levelData;
      const levelUncompressedByteLength = ktx2Container.levels[level].uncompressedByteLength;
      const levelBufferByteLength = imageInfo.numBlocksX * imageInfo.numBlocksY * dfd.bytesPlane[0];

      if (ktx2Container.supercompressionScheme === KTX2SupercompressionScheme.ZSTD) {
        levelBuffer = KTX2TextureLoader.__zstdDecoder.decode(levelBuffer, levelUncompressedByteLength);
      }

      let faceBufferByteOffset = 0;
      const firstImageDescIndexInLevel =
        level * Math.max(ktx2Container.layerCount, 1) * faceCount * Math.max(ktx2Container.pixelDepth, 1);

      for (let faceIndex = 0; faceIndex < faceCount; faceIndex++) {
        let imageDesc: KTX2GlobalDataBasisLZImageDesc | null = null;
        let faceBuffer: Uint8Array;
        if (ktx2Container.supercompressionScheme === KTX2SupercompressionScheme.BASISLZ) {
          imageDesc = imageDescs?.[firstImageDescIndexInLevel + faceIndex] as KTX2GlobalDataBasisLZImageDesc;

          faceBuffer = new Uint8Array(
            levelBuffer as unknown as ArrayBuffer,
            imageDesc.rgbSliceByteOffset,
            imageDesc.rgbSliceByteLength + imageDesc.alphaSliceByteLength
          );
        } else {
          faceBuffer = new Uint8Array(
            levelBuffer as unknown as ArrayBuffer,
            faceBufferByteOffset,
            levelBufferByteLength
          );
          faceBufferByteOffset += levelBufferByteLength;
        }

        let result: TranscodedImage | undefined;
        if (compressedTextureFormat === CompressedTextureFormat.UASTC4x4) {
          imageInfo.flags = 0;
          imageInfo.rgbByteOffset = 0;
          imageInfo.rgbByteLength = levelUncompressedByteLength;
          imageInfo.alphaByteOffset = 0;
          imageInfo.alphaByteLength = 0;

          result = (transcoder as UastcImageTranscoder).transcodeImage(
            transcodeTarget,
            faceBuffer,
            imageInfo,
            0,
            hasAlpha,
            isVideo
          );
        } else {
          const sgd = ktx2Container.globalData as KTX2GlobalDataBasisLZ;
          const basisTranscoder = transcoder as BasisLzEtc1sImageTranscoder;
          basisTranscoder.decodePalettes(sgd.endpointCount, sgd.endpointsData, sgd.selectorCount, sgd.selectorsData);
          basisTranscoder.decodeTables(sgd.tablesData);

          imageInfo.flags = imageDesc!.imageFlags;
          imageInfo.rgbByteOffset = 0;
          imageInfo.rgbByteLength = imageDesc!.rgbSliceByteLength;
          imageInfo.alphaByteOffset = imageDesc!.alphaSliceByteOffset > 0 ? imageDesc!.rgbSliceByteLength : 0;
          imageInfo.alphaByteLength = imageDesc!.alphaSliceByteLength;

          result = basisTranscoder.transcodeImage(transcodeTarget, faceBuffer, imageInfo, 0, isVideo);
        }

        if (result?.transcodedImage != null) {
          const transcodedTextureBuffer = result.transcodedImage.get_typed_memory_view().slice();
          result.transcodedImage.delete();

          const mipmap = {
            level,
            width: levelWidth,
            height: levelHeight,
            buffer: transcodedTextureBuffer,
          } as TextureData;
          mipmapData.push(mipmap);
        }
      }
    }

    return transcodedData;
  }

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
  private __hasAlpha(dfd: KTX2DataFormatDescriptorBasicFormat, compressedTextureFormat: CompressedTextureFormat) {
    if (compressedTextureFormat === CompressedTextureFormat.UASTC4x4) {
      return dfd.samples[0].channelID === KTX2ChannelUASTC.RGBA;
    }
    return (
      dfd.samples.length === 2 &&
      (dfd.samples[0].channelID === KTX2ChannelETC1S.AAA || dfd.samples[1].channelID === KTX2ChannelETC1S.AAA)
    );
  }
}
