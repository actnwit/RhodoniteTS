// src/webgl/textureLoader/KTX2TextureLoader.ts
import {
  KHR_DF_MODEL_UASTC,
  KHR_DF_TRANSFER_SRGB,
  KHR_SUPERCOMPRESSION_BASISLZ,
  KHR_SUPERCOMPRESSION_ZSTD,
  read
} from "../../_deps/ktx-parse.js";
import { ZSTDDecoder } from "../../_deps/zstddec.js";
import {
  CompressionTextureType
} from "../../foundation/definitions/CompressionTextureType.js";
import { ProcessApproach } from "../../foundation/definitions/ProcessApproach.js";
import { Logger } from "../../foundation/misc/Logger.js";
var KTX2ChannelETC1S = {
  RGB: 0,
  RRR: 3,
  GGG: 4,
  AAA: 15
};
var KTX2ChannelUASTC = {
  RGB: 0,
  RGBA: 3,
  RRR: 4,
  RRRG: 5
};
var CompressedTextureFormat = {
  ETC1S: 0,
  UASTC4x4: 1
};
var TranscodeTarget = {
  ETC1_RGB: "ETC1_RGB",
  BC1_RGB: "BC1_RGB",
  BC4_R: "BC4_R",
  BC5_RG: "BC5_RG",
  BC3_RGBA: "BC3_RGBA",
  PVRTC1_4_RGB: "PVRTC1_4_RGB",
  PVRTC1_4_RGBA: "PVRTC1_4_RGBA",
  BC7_RGBA: "BC7_RGBA",
  BC7_M6_RGB: "BC7_M6_RGB",
  BC7_M5_RGBA: "BC7_M5_RGBA",
  ETC2_RGBA: "ETC2_RGBA",
  ASTC_4x4_RGBA: "ASTC_4x4_RGBA",
  RGBA32: "RGBA32",
  RGB565: "RGB565",
  BGR565: "BGR565",
  RGBA4444: "RGBA4444",
  PVRTC2_4_RGB: "PVRTC2_4_RGB",
  PVRTC2_4_RGBA: "PVRTC2_4_RGBA",
  EAC_R11: "EAC_R11",
  EAC_RG11: "EAC_RG11"
};
var KTX2TextureLoader = class _KTX2TextureLoader {
  /**
   * Creates a new KTX2TextureLoader instance.
   *
   * Initializes the MSC transcoder module required for texture transcoding.
   * Logs an error if the MSC_TRANSCODER function is not available.
   */
  constructor() {
    if (typeof MSC_TRANSCODER === "undefined") {
      Logger.default.error("Failed to call MSC_TRANSCODER() function. Please check to import msc_basis_transcoder.js.");
    }
    this.iF = this.lF();
  }
  /**
   * Gets the singleton instance of KTX2TextureLoader.
   *
   * @returns The singleton KTX2TextureLoader instance
   */
  static getInstance() {
    if (!this.Yi) {
      this.Yi = new _KTX2TextureLoader();
    }
    return this.Yi;
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
  transcode(engine, uint8Array) {
    const ktx2Container = this.mF(uint8Array);
    if (ktx2Container.pixelDepth > 0) {
      throw new Error("Only 2D textures are currently supported");
    }
    if (ktx2Container.layerCount > 1) {
      throw new Error("Array textures are not currently supported");
    }
    if (ktx2Container.faceCount > 1) {
      throw new Error("Cube textures are not currently supported");
    }
    if (ktx2Container.supercompressionScheme === KHR_SUPERCOMPRESSION_ZSTD) {
      if (_KTX2TextureLoader.gF == null) {
        _KTX2TextureLoader.gF = new ZSTDDecoder();
      }
      return _KTX2TextureLoader.gF.init().then(() => {
        return this.iF.then(() => {
          return this.kF(engine, ktx2Container);
        });
      });
    }
    return this.iF.then(() => {
      return this.kF(engine, ktx2Container);
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
  lF() {
    return new Promise((resolve) => {
      if (_KTX2TextureLoader.hF) {
        resolve();
      }
      MSC_TRANSCODER().then((transcoderModule) => {
        transcoderModule.initTranscoders();
        _KTX2TextureLoader.hF = transcoderModule;
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
  nF(engine, hasAlpha) {
    const webGLResourceRepository = engine.webglResourceRepository;
    const glw = webGLResourceRepository.currentWebGLContextWrapper;
    const astc = glw.webgl2ExtCTAstc || glw.webgl1ExtCTAstc;
    const bptc = glw.webgl2ExtCTBptc || glw.webgl1ExtCTBptc;
    const s3tc = glw.webgl2ExtCTS3tc || glw.webgl1ExtCTS3tc;
    const pvrtc = glw.webgl2ExtCTPvrtc || glw.webgl1ExtCTPvrtc;
    const etc2 = glw.webgl2ExtCTEtc || glw.webgl1ExtCTEtc;
    const etc1 = glw.webgl2ExtCTEtc1 || glw.webgl1ExtCTEtc1;
    let transcodeTargetStr;
    let compressionTextureType;
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
  oF(engine, hasAlpha) {
    const webGpuResourceRepository = engine.webGpuResourceRepository;
    const adapter = webGpuResourceRepository.getWebGpuDeviceWrapper().gpuAdapter;
    const astc = adapter.features.has("texture-compression-astc");
    const s3tc = adapter.features.has("texture-compression-bc");
    const etc2 = adapter.features.has("texture-compression-etc2");
    let transcodeTargetStr;
    let compressionTextureType;
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
  mF(uint8Array) {
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
  kF(engine, ktx2Container) {
    var _a;
    const width = ktx2Container.pixelWidth;
    const height = ktx2Container.pixelHeight;
    const faceCount = ktx2Container.faceCount;
    const imageDescs = (_a = ktx2Container.globalData) == null ? void 0 : _a.imageDescs;
    const dfd = ktx2Container.dataFormatDescriptor[0];
    const compressedTextureFormat = dfd.colorModel === KHR_DF_MODEL_UASTC ? CompressedTextureFormat.UASTC4x4 : CompressedTextureFormat.ETC1S;
    const hasAlpha = this.pF(dfd, compressedTextureFormat);
    const isVideo = false;
    const transcoderModule = _KTX2TextureLoader.hF;
    const transcoder = compressedTextureFormat === CompressedTextureFormat.UASTC4x4 ? new transcoderModule.UastcImageTranscoder() : new transcoderModule.BasisLzEtc1sImageTranscoder();
    const textureFormat = compressedTextureFormat === CompressedTextureFormat.UASTC4x4 ? transcoderModule.TextureFormat.UASTC4x4 : transcoderModule.TextureFormat.ETC1S;
    const { transcodeTargetStr, compressionTextureType } = engine.engineState.currentProcessApproach === ProcessApproach.WebGPU ? this.oF(engine, hasAlpha) : this.nF(engine, hasAlpha);
    const transcodeTarget = transcoderModule.TranscodeTarget[transcodeTargetStr];
    const mipmapData = [];
    const transcodedData = {
      width,
      height,
      compressionTextureType,
      mipmapData,
      needGammaCorrection: dfd.transferFunction !== KHR_DF_TRANSFER_SRGB
    };
    for (let level = 0; level < ktx2Container.levels.length; level++) {
      const levelWidth = Math.max(1, width >> level);
      const levelHeight = Math.max(1, height >> level);
      const imageInfo = new transcoderModule.ImageInfo(textureFormat, levelWidth, levelHeight, level);
      let levelBuffer = ktx2Container.levels[level].levelData;
      const levelUncompressedByteLength = ktx2Container.levels[level].uncompressedByteLength;
      const levelBufferByteLength = imageInfo.numBlocksX * imageInfo.numBlocksY * dfd.bytesPlane[0];
      if (ktx2Container.supercompressionScheme === KHR_SUPERCOMPRESSION_ZSTD) {
        levelBuffer = new Uint8Array(
          _KTX2TextureLoader.gF.decode(
            new Uint8Array(levelBuffer.buffer, levelBuffer.byteOffset, levelBuffer.byteLength),
            levelUncompressedByteLength
          )
        );
      }
      let faceBufferByteOffset = 0;
      const firstImageDescIndexInLevel = level * Math.max(ktx2Container.layerCount, 1) * faceCount * Math.max(ktx2Container.pixelDepth, 1);
      for (let faceIndex = 0; faceIndex < faceCount; faceIndex++) {
        let imageDesc = null;
        let faceBuffer;
        if (ktx2Container.supercompressionScheme === KHR_SUPERCOMPRESSION_BASISLZ) {
          imageDesc = imageDescs == null ? void 0 : imageDescs[firstImageDescIndexInLevel + faceIndex];
          faceBuffer = new Uint8Array(
            levelBuffer.buffer,
            levelBuffer.byteOffset + imageDesc.rgbSliceByteOffset,
            imageDesc.rgbSliceByteLength + imageDesc.alphaSliceByteLength
          );
        } else {
          faceBuffer = new Uint8Array(
            levelBuffer.buffer,
            levelBuffer.byteOffset + faceBufferByteOffset,
            levelBufferByteLength
          );
          faceBufferByteOffset += levelBufferByteLength;
        }
        let result;
        if (compressedTextureFormat === CompressedTextureFormat.UASTC4x4) {
          imageInfo.flags = 0;
          imageInfo.rgbByteOffset = 0;
          imageInfo.rgbByteLength = levelUncompressedByteLength;
          imageInfo.alphaByteOffset = 0;
          imageInfo.alphaByteLength = 0;
          result = transcoder.transcodeImage(
            transcodeTarget,
            faceBuffer,
            imageInfo,
            0,
            hasAlpha,
            isVideo
          );
        } else {
          const sgd = ktx2Container.globalData;
          const basisTranscoder = transcoder;
          basisTranscoder.decodePalettes(sgd.endpointCount, sgd.endpointsData, sgd.selectorCount, sgd.selectorsData);
          basisTranscoder.decodeTables(sgd.tablesData);
          imageInfo.flags = imageDesc.imageFlags;
          imageInfo.rgbByteOffset = 0;
          imageInfo.rgbByteLength = imageDesc.rgbSliceByteLength;
          imageInfo.alphaByteOffset = imageDesc.alphaSliceByteOffset > 0 ? imageDesc.rgbSliceByteLength : 0;
          imageInfo.alphaByteLength = imageDesc.alphaSliceByteLength;
          result = basisTranscoder.transcodeImage(transcodeTarget, faceBuffer, imageInfo, 0, isVideo);
        }
        if ((result == null ? void 0 : result.transcodedImage) != null) {
          const transcodedTextureBuffer = result.transcodedImage.get_typed_memory_view().slice();
          result.transcodedImage.delete();
          const mipmap = {
            level,
            width: levelWidth,
            height: levelHeight,
            buffer: transcodedTextureBuffer
          };
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
  pF(dfd, compressedTextureFormat) {
    if (compressedTextureFormat === CompressedTextureFormat.UASTC4x4) {
      return _KTX2TextureLoader.jF(dfd.samples[0]) === KTX2ChannelUASTC.RGBA;
    }
    return dfd.samples.length === 2 && (_KTX2TextureLoader.jF(dfd.samples[0]) === KTX2ChannelETC1S.AAA || _KTX2TextureLoader.jF(dfd.samples[1]) === KTX2ChannelETC1S.AAA);
  }
  /**
   * Returns the KHR_DF channel ID of a DFD sample.
   *
   * ktx-parse v2 renamed the former `channelID` property to `channelType`.
   * The property is read in a version tolerant way so that both ktx-parse
   * generations keep working for consumers that supply custom DFD samples.
   *
   * @param sample - A basic format sample of the data format descriptor
   * @returns The numeric KHR_DF channel ID
   * @private
   */
  static jF(sample) {
    var _a, _b;
    const versionTolerantSample = sample;
    return (_b = (_a = versionTolerantSample.channelType) != null ? _a : versionTolerantSample.channelID) != null ? _b : 0;
  }
};
export {
  KTX2TextureLoader
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL3dlYmdsL3RleHR1cmVMb2FkZXIvS1RYMlRleHR1cmVMb2FkZXIudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7XG4gIEtIUl9ERl9NT0RFTF9VQVNUQyxcbiAgS0hSX0RGX1RSQU5TRkVSX1NSR0IsXG4gIEtIUl9TVVBFUkNPTVBSRVNTSU9OX0JBU0lTTFosXG4gIEtIUl9TVVBFUkNPTVBSRVNTSU9OX1pTVEQsXG4gIHR5cGUgS1RYMkJhc2ljRm9ybWF0U2FtcGxlLFxuICB0eXBlIEtUWDJDb250YWluZXIsXG4gIHR5cGUgS1RYMkRhdGFGb3JtYXREZXNjcmlwdG9yQmFzaWNGb3JtYXQsXG4gIHR5cGUgS1RYMkdsb2JhbERhdGFCYXNpc0xaLFxuICByZWFkLFxufSBmcm9tICdrdHgtcGFyc2UnO1xuaW1wb3J0IHsgWlNURERlY29kZXIgfSBmcm9tICd6c3RkZGVjJztcbmltcG9ydCB7XG4gIENvbXByZXNzaW9uVGV4dHVyZVR5cGUsXG4gIHR5cGUgQ29tcHJlc3Npb25UZXh0dXJlVHlwZUVudW0sXG59IGZyb20gJy4uLy4uL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvQ29tcHJlc3Npb25UZXh0dXJlVHlwZSc7XG5pbXBvcnQgeyBQcm9jZXNzQXBwcm9hY2ggfSBmcm9tICcuLi8uLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL1Byb2Nlc3NBcHByb2FjaCc7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICcuLi8uLi9mb3VuZGF0aW9uL21pc2MvTG9nZ2VyJztcbmltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSAnLi4vLi4vZm91bmRhdGlvbi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB0eXBlIHtcbiAgQmFzaXNMekV0YzFzSW1hZ2VUcmFuc2NvZGVyLFxuICBNU0NfVFJBTlNDT0RFUl9UWVBFLFxuICBNc2NUcmFuc2NvZGVyTW9kdWxlLFxuICBUcmFuc2NvZGVkSW1hZ2UsXG4gIFVhc3RjSW1hZ2VUcmFuc2NvZGVyLFxufSBmcm9tICcuLi8uLi90eXBlcy9LVFgyVGV4dHVyZSc7XG5pbXBvcnQgdHlwZSB7IFdlYkdMQ29udGV4dFdyYXBwZXIgfSBmcm9tICcuLi9XZWJHTENvbnRleHRXcmFwcGVyJztcbmltcG9ydCB0eXBlIHsgVGV4dHVyZURhdGEgfSBmcm9tICcuLi9XZWJHTFJlc291cmNlUmVwb3NpdG9yeSc7XG5cbi8qKlxuICogS0hSX0RGIGNoYW5uZWwgSURzIHVzZWQgYnkgdGhlIGRhdGEgZm9ybWF0IGRlc2NyaXB0b3JzIG9mIEJhc2lzIFVuaXZlcnNhbCB0ZXh0dXJlcy5cbiAqXG4gKiBUaGVzZSB2YWx1ZXMgYXJlIGRlZmluZWQgYnkgdGhlIEtUWDIgc3BlY2lmaWNhdGlvbiAoS0hSX0RGX0NIQU5ORUxfKikgYW5kIGFyZSBrZXB0XG4gKiBsb2NhbCBiZWNhdXNlIGt0eC1wYXJzZSB2MiBubyBsb25nZXIgZXhwb3J0cyB0aGUgZGVkaWNhdGVkIGVudW1zIGZvciB0aGVtLlxuICovXG5jb25zdCBLVFgyQ2hhbm5lbEVUQzFTID0ge1xuICBSR0I6IDAsXG4gIFJSUjogMyxcbiAgR0dHOiA0LFxuICBBQUE6IDE1LFxufSBhcyBjb25zdDtcbmNvbnN0IEtUWDJDaGFubmVsVUFTVEMgPSB7XG4gIFJHQjogMCxcbiAgUkdCQTogMyxcbiAgUlJSOiA0LFxuICBSUlJHOiA1LFxufSBhcyBjb25zdDtcblxuY29uc3QgQ29tcHJlc3NlZFRleHR1cmVGb3JtYXQgPSB7XG4gIEVUQzFTOiAwLFxuICBVQVNUQzR4NDogMSxcbn0gYXMgY29uc3Q7XG50eXBlIENvbXByZXNzZWRUZXh0dXJlRm9ybWF0ID0gKHR5cGVvZiBDb21wcmVzc2VkVGV4dHVyZUZvcm1hdClba2V5b2YgdHlwZW9mIENvbXByZXNzZWRUZXh0dXJlRm9ybWF0XTtcblxuY29uc3QgVHJhbnNjb2RlVGFyZ2V0ID0ge1xuICBFVEMxX1JHQjogJ0VUQzFfUkdCJyxcbiAgQkMxX1JHQjogJ0JDMV9SR0InLFxuICBCQzRfUjogJ0JDNF9SJyxcbiAgQkM1X1JHOiAnQkM1X1JHJyxcbiAgQkMzX1JHQkE6ICdCQzNfUkdCQScsXG4gIFBWUlRDMV80X1JHQjogJ1BWUlRDMV80X1JHQicsXG4gIFBWUlRDMV80X1JHQkE6ICdQVlJUQzFfNF9SR0JBJyxcbiAgQkM3X1JHQkE6ICdCQzdfUkdCQScsXG4gIEJDN19NNl9SR0I6ICdCQzdfTTZfUkdCJyxcbiAgQkM3X001X1JHQkE6ICdCQzdfTTVfUkdCQScsXG4gIEVUQzJfUkdCQTogJ0VUQzJfUkdCQScsXG4gIEFTVENfNHg0X1JHQkE6ICdBU1RDXzR4NF9SR0JBJyxcbiAgUkdCQTMyOiAnUkdCQTMyJyxcbiAgUkdCNTY1OiAnUkdCNTY1JyxcbiAgQkdSNTY1OiAnQkdSNTY1JyxcbiAgUkdCQTQ0NDQ6ICdSR0JBNDQ0NCcsXG4gIFBWUlRDMl80X1JHQjogJ1BWUlRDMl80X1JHQicsXG4gIFBWUlRDMl80X1JHQkE6ICdQVlJUQzJfNF9SR0JBJyxcbiAgRUFDX1IxMTogJ0VBQ19SMTEnLFxuICBFQUNfUkcxMTogJ0VBQ19SRzExJyxcbn0gYXMgY29uc3Q7XG50eXBlIFRyYW5zY29kZVRhcmdldCA9ICh0eXBlb2YgVHJhbnNjb2RlVGFyZ2V0KVtrZXlvZiB0eXBlb2YgVHJhbnNjb2RlVGFyZ2V0XTtcblxuaW50ZXJmYWNlIEtUWDJHbG9iYWxEYXRhQmFzaXNMWkltYWdlRGVzYyB7XG4gIGltYWdlRmxhZ3M6IG51bWJlcjtcbiAgcmdiU2xpY2VCeXRlT2Zmc2V0OiBudW1iZXI7XG4gIHJnYlNsaWNlQnl0ZUxlbmd0aDogbnVtYmVyO1xuICBhbHBoYVNsaWNlQnl0ZU9mZnNldDogbnVtYmVyO1xuICBhbHBoYVNsaWNlQnl0ZUxlbmd0aDogbnVtYmVyO1xufVxuXG5kZWNsYXJlIGNvbnN0IE1TQ19UUkFOU0NPREVSOiBNU0NfVFJBTlNDT0RFUl9UWVBFO1xuXG4vKipcbiAqIEEgdGV4dHVyZSBsb2FkZXIgZm9yIEtUWDIgZm9ybWF0IGZpbGVzIHRoYXQgaGFuZGxlcyB0cmFuc2NvZGluZyBvZiBjb21wcmVzc2VkIHRleHR1cmUgZGF0YS5cbiAqXG4gKiBLVFgyIGlzIGEgY29udGFpbmVyIGZvcm1hdCBmb3IgR1BVIHRleHR1cmVzIHRoYXQgc3VwcG9ydHMgdmFyaW91cyBjb21wcmVzc2lvbiBmb3JtYXRzXG4gKiBpbmNsdWRpbmcgQmFzaXMgVW5pdmVyc2FsIChFVEMxUyBhbmQgVUFTVEMpLiBUaGlzIGxvYWRlciBjYW4gdHJhbnNjb2RlIEtUWDIgdGV4dHVyZXNcbiAqIHRvIGRldmljZS1zcGVjaWZpYyBmb3JtYXRzIGJhc2VkIG9uIGF2YWlsYWJsZSBHUFUgZXh0ZW5zaW9ucy5cbiAqXG4gKiBUaGUgbG9hZGVyIHN1cHBvcnRzOlxuICogLSBFVEMxUyBhbmQgVUFTVEM0eDQgY29tcHJlc3NlZCBmb3JtYXRzXG4gKiAtIE11bHRpcGxlIHRhcmdldCBmb3JtYXRzIChBU1RDLCBCQywgRVRDLCBQVlJUQywgZXRjLilcbiAqIC0gWlNURCBzdXBlcmNvbXByZXNzaW9uXG4gKiAtIE1pcG1hcCBnZW5lcmF0aW9uXG4gKiAtIEJvdGggV2ViR0wgYW5kIFdlYkdQVSByZW5kZXJpbmcgY29udGV4dHNcbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHlwZXNjcmlwdFxuICogY29uc3QgbG9hZGVyID0gS1RYMlRleHR1cmVMb2FkZXIuZ2V0SW5zdGFuY2UoKTtcbiAqIGNvbnN0IHRleHR1cmVEYXRhID0gYXdhaXQgbG9hZGVyLnRyYW5zY29kZShrdHgyQXJyYXlCdWZmZXIpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBLVFgyVGV4dHVyZUxvYWRlciB7XG4gIHByaXZhdGUgc3RhdGljIF9faW5zdGFuY2U6IEtUWDJUZXh0dXJlTG9hZGVyO1xuXG4gIC8vIFRPRE86IGNyZWF0ZSB0eXBlIG9mIF9fbXNjVHJhbnNjb2Rlck1vZHVsZVxuICBwcml2YXRlIHN0YXRpYyBfX21zY1RyYW5zY29kZXJNb2R1bGU6IE1zY1RyYW5zY29kZXJNb2R1bGU7XG4gIHByaXZhdGUgc3RhdGljIF9fenN0ZERlY29kZXI6IFpTVEREZWNvZGVyO1xuXG4gIHByaXZhdGUgX19tc2NUcmFuc2NvZGVyUHJvbWlzZTogUHJvbWlzZTx2b2lkPjtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBLVFgyVGV4dHVyZUxvYWRlciBpbnN0YW5jZS5cbiAgICpcbiAgICogSW5pdGlhbGl6ZXMgdGhlIE1TQyB0cmFuc2NvZGVyIG1vZHVsZSByZXF1aXJlZCBmb3IgdGV4dHVyZSB0cmFuc2NvZGluZy5cbiAgICogTG9ncyBhbiBlcnJvciBpZiB0aGUgTVNDX1RSQU5TQ09ERVIgZnVuY3Rpb24gaXMgbm90IGF2YWlsYWJsZS5cbiAgICovXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIGlmICh0eXBlb2YgTVNDX1RSQU5TQ09ERVIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcignRmFpbGVkIHRvIGNhbGwgTVNDX1RSQU5TQ09ERVIoKSBmdW5jdGlvbi4gUGxlYXNlIGNoZWNrIHRvIGltcG9ydCBtc2NfYmFzaXNfdHJhbnNjb2Rlci5qcy4nKTtcbiAgICB9XG4gICAgdGhpcy5fX21zY1RyYW5zY29kZXJQcm9taXNlID0gdGhpcy5fX2xvYWRNU0NUcmFuc2NvZGVyKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgc2luZ2xldG9uIGluc3RhbmNlIG9mIEtUWDJUZXh0dXJlTG9hZGVyLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgc2luZ2xldG9uIEtUWDJUZXh0dXJlTG9hZGVyIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgZ2V0SW5zdGFuY2UoKSB7XG4gICAgaWYgKCF0aGlzLl9faW5zdGFuY2UpIHtcbiAgICAgIHRoaXMuX19pbnN0YW5jZSA9IG5ldyBLVFgyVGV4dHVyZUxvYWRlcigpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fX2luc3RhbmNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFRyYW5zY29kZXMgYSBLVFgyIHRleHR1cmUgZnJvbSB0aGUgcHJvdmlkZWQgYnl0ZSBhcnJheS5cbiAgICpcbiAgICogVGhpcyBtZXRob2QgcGFyc2VzIHRoZSBLVFgyIGNvbnRhaW5lciwgdmFsaWRhdGVzIGl0cyBmb3JtYXQgY29uc3RyYWludHMsXG4gICAqIGFuZCB0cmFuc2NvZGVzIHRoZSB0ZXh0dXJlIGRhdGEgdG8gYSBmb3JtYXQgc3VpdGFibGUgZm9yIHRoZSBjdXJyZW50IEdQVS5cbiAgICpcbiAgICogQHBhcmFtIHVpbnQ4QXJyYXkgLSBUaGUgS1RYMiB0ZXh0dXJlIGRhdGEgYXMgYSBVaW50OEFycmF5XG4gICAqIEByZXR1cm5zIEEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIHRoZSB0cmFuc2NvZGVkIHRleHR1cmUgZGF0YVxuICAgKiBAdGhyb3dzIEVycm9yIGlmIHRoZSB0ZXh0dXJlIGZvcm1hdCBpcyBub3Qgc3VwcG9ydGVkICgzRCB0ZXh0dXJlcywgYXJyYXkgdGV4dHVyZXMsIG9yIGN1YmUgdGV4dHVyZXMpXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3Qga3R4MkRhdGEgPSBuZXcgVWludDhBcnJheShidWZmZXIpO1xuICAgKiBjb25zdCB0ZXh0dXJlRGF0YSA9IGF3YWl0IGxvYWRlci50cmFuc2NvZGUoa3R4MkRhdGEpO1xuICAgKiBgYGBcbiAgICovXG4gIHRyYW5zY29kZShlbmdpbmU6IEVuZ2luZSwgdWludDhBcnJheTogVWludDhBcnJheSkge1xuICAgIGNvbnN0IGt0eDJDb250YWluZXIgPSB0aGlzLl9fcGFyc2UodWludDhBcnJheSk7XG5cbiAgICBpZiAoa3R4MkNvbnRhaW5lci5waXhlbERlcHRoID4gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdPbmx5IDJEIHRleHR1cmVzIGFyZSBjdXJyZW50bHkgc3VwcG9ydGVkJyk7XG4gICAgfVxuXG4gICAgaWYgKGt0eDJDb250YWluZXIubGF5ZXJDb3VudCA+IDEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQXJyYXkgdGV4dHVyZXMgYXJlIG5vdCBjdXJyZW50bHkgc3VwcG9ydGVkJyk7XG4gICAgfVxuXG4gICAgaWYgKGt0eDJDb250YWluZXIuZmFjZUNvdW50ID4gMSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDdWJlIHRleHR1cmVzIGFyZSBub3QgY3VycmVudGx5IHN1cHBvcnRlZCcpO1xuICAgIH1cblxuICAgIGlmIChrdHgyQ29udGFpbmVyLnN1cGVyY29tcHJlc3Npb25TY2hlbWUgPT09IEtIUl9TVVBFUkNPTVBSRVNTSU9OX1pTVEQpIHtcbiAgICAgIGlmIChLVFgyVGV4dHVyZUxvYWRlci5fX3pzdGREZWNvZGVyID09IG51bGwpIHtcbiAgICAgICAgS1RYMlRleHR1cmVMb2FkZXIuX196c3RkRGVjb2RlciA9IG5ldyBaU1RERGVjb2RlcigpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gS1RYMlRleHR1cmVMb2FkZXIuX196c3RkRGVjb2Rlci5pbml0KCkudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fbXNjVHJhbnNjb2RlclByb21pc2UudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuX190cmFuc2NvZGVEYXRhKGVuZ2luZSwga3R4MkNvbnRhaW5lcik7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9fbXNjVHJhbnNjb2RlclByb21pc2UudGhlbigoKSA9PiB7XG4gICAgICByZXR1cm4gdGhpcy5fX3RyYW5zY29kZURhdGEoZW5naW5lLCBrdHgyQ29udGFpbmVyKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyBhbmQgaW5pdGlhbGl6ZXMgdGhlIE1TQyAoQmFzaXMgVW5pdmVyc2FsKSB0cmFuc2NvZGVyIG1vZHVsZS5cbiAgICpcbiAgICogVGhpcyBtZXRob2QgZW5zdXJlcyB0aGUgdHJhbnNjb2RlciBpcyBsb2FkZWQgb25seSBvbmNlIGFuZCBpbml0aWFsaXplc1xuICAgKiB0aGUgdHJhbnNjb2RlciBmdW5jdGlvbnMgcmVxdWlyZWQgZm9yIHRleHR1cmUgZGVjb21wcmVzc2lvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgdHJhbnNjb2RlciBpcyByZWFkeVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX2xvYWRNU0NUcmFuc2NvZGVyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgIGlmIChLVFgyVGV4dHVyZUxvYWRlci5fX21zY1RyYW5zY29kZXJNb2R1bGUpIHtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfVxuXG4gICAgICBNU0NfVFJBTlNDT0RFUigpLnRoZW4oKHRyYW5zY29kZXJNb2R1bGU6IE1zY1RyYW5zY29kZXJNb2R1bGUpID0+IHtcbiAgICAgICAgdHJhbnNjb2Rlck1vZHVsZS5pbml0VHJhbnNjb2RlcnMoKTtcbiAgICAgICAgS1RYMlRleHR1cmVMb2FkZXIuX19tc2NUcmFuc2NvZGVyTW9kdWxlID0gdHJhbnNjb2Rlck1vZHVsZTtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyB0aGUgb3B0aW1hbCB0cmFuc2NvZGluZyBwYXJhbWV0ZXJzIGZvciBXZWJHTCBjb250ZXh0cy5cbiAgICpcbiAgICogQW5hbHl6ZXMgYXZhaWxhYmxlIFdlYkdMIGV4dGVuc2lvbnMgdG8gc2VsZWN0IHRoZSBiZXN0IGNvbXByZXNzaW9uIGZvcm1hdFxuICAgKiBhbmQgdHJhbnNjb2RpbmcgdGFyZ2V0IGJhc2VkIG9uIEdQVSBjYXBhYmlsaXRpZXMuIFByaW9yaXRpemVzIGZvcm1hdHMgaW5cbiAgICogb3JkZXIgb2YgcXVhbGl0eTogQVNUQyA+IEJQVEMgPiBTM1RDID4gUFZSVEMgPiBFVEMyID4gRVRDMSA+IFJHQkEzMi5cbiAgICpcbiAgICogQHBhcmFtIGhhc0FscGhhIC0gV2hldGhlciB0aGUgdGV4dHVyZSBjb250YWlucyBhbHBoYSBjaGFubmVsIGRhdGFcbiAgICogQHJldHVybnMgQW4gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIHRyYW5zY29kaW5nIHRhcmdldCBzdHJpbmcgYW5kIGNvbXByZXNzaW9uIHR5cGVcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgX19nZXREZXZpY2VEZXBlbmRlbnRQYXJhbWV0ZXJzV2ViR0woZW5naW5lOiBFbmdpbmUsIGhhc0FscGhhOiBib29sZWFuKSB7XG4gICAgY29uc3Qgd2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkgPSBlbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgY29uc3QgZ2x3ID0gd2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkuY3VycmVudFdlYkdMQ29udGV4dFdyYXBwZXIgYXMgV2ViR0xDb250ZXh0V3JhcHBlcjtcblxuICAgIGNvbnN0IGFzdGMgPSBnbHcud2ViZ2wyRXh0Q1RBc3RjIHx8IGdsdy53ZWJnbDFFeHRDVEFzdGM7XG4gICAgY29uc3QgYnB0YyA9IGdsdy53ZWJnbDJFeHRDVEJwdGMgfHwgZ2x3LndlYmdsMUV4dENUQnB0YztcbiAgICBjb25zdCBzM3RjID0gZ2x3LndlYmdsMkV4dENUUzN0YyB8fCBnbHcud2ViZ2wxRXh0Q1RTM3RjO1xuICAgIGNvbnN0IHB2cnRjID0gZ2x3LndlYmdsMkV4dENUUHZydGMgfHwgZ2x3LndlYmdsMUV4dENUUHZydGM7XG4gICAgY29uc3QgZXRjMiA9IGdsdy53ZWJnbDJFeHRDVEV0YyB8fCBnbHcud2ViZ2wxRXh0Q1RFdGM7XG4gICAgY29uc3QgZXRjMSA9IGdsdy53ZWJnbDJFeHRDVEV0YzEgfHwgZ2x3LndlYmdsMUV4dENURXRjMTtcblxuICAgIGxldCB0cmFuc2NvZGVUYXJnZXRTdHI6IFRyYW5zY29kZVRhcmdldDtcbiAgICBsZXQgY29tcHJlc3Npb25UZXh0dXJlVHlwZTogQ29tcHJlc3Npb25UZXh0dXJlVHlwZUVudW07XG4gICAgaWYgKGFzdGMpIHtcbiAgICAgIHRyYW5zY29kZVRhcmdldFN0ciA9IFRyYW5zY29kZVRhcmdldC5BU1RDXzR4NF9SR0JBO1xuICAgICAgY29tcHJlc3Npb25UZXh0dXJlVHlwZSA9IENvbXByZXNzaW9uVGV4dHVyZVR5cGUuQVNUQ19SR0JBXzR4NDtcbiAgICB9IGVsc2UgaWYgKGJwdGMpIHtcbiAgICAgIHRyYW5zY29kZVRhcmdldFN0ciA9IFRyYW5zY29kZVRhcmdldC5CQzdfUkdCQTtcbiAgICAgIGNvbXByZXNzaW9uVGV4dHVyZVR5cGUgPSBDb21wcmVzc2lvblRleHR1cmVUeXBlLkJQVENfUkdCQTtcbiAgICB9IGVsc2UgaWYgKHMzdGMpIHtcbiAgICAgIGlmIChoYXNBbHBoYSkge1xuICAgICAgICB0cmFuc2NvZGVUYXJnZXRTdHIgPSBUcmFuc2NvZGVUYXJnZXQuQkMzX1JHQkE7XG4gICAgICAgIGNvbXByZXNzaW9uVGV4dHVyZVR5cGUgPSBDb21wcmVzc2lvblRleHR1cmVUeXBlLlMzVENfUkdCQV9EWFQ1O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHJhbnNjb2RlVGFyZ2V0U3RyID0gVHJhbnNjb2RlVGFyZ2V0LkJDMV9SR0I7XG4gICAgICAgIGNvbXByZXNzaW9uVGV4dHVyZVR5cGUgPSBDb21wcmVzc2lvblRleHR1cmVUeXBlLlMzVENfUkdCX0RYVDE7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChwdnJ0Yykge1xuICAgICAgaWYgKGhhc0FscGhhKSB7XG4gICAgICAgIHRyYW5zY29kZVRhcmdldFN0ciA9IFRyYW5zY29kZVRhcmdldC5QVlJUQzFfNF9SR0JBO1xuICAgICAgICBjb21wcmVzc2lvblRleHR1cmVUeXBlID0gQ29tcHJlc3Npb25UZXh0dXJlVHlwZS5QVlJUQ19SR0JBXzRCUFBWMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyYW5zY29kZVRhcmdldFN0ciA9IFRyYW5zY29kZVRhcmdldC5QVlJUQzFfNF9SR0I7XG4gICAgICAgIGNvbXByZXNzaW9uVGV4dHVyZVR5cGUgPSBDb21wcmVzc2lvblRleHR1cmVUeXBlLlBWUlRDX1JHQl80QlBQVjE7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChldGMyKSB7XG4gICAgICBpZiAoaGFzQWxwaGEpIHtcbiAgICAgICAgdHJhbnNjb2RlVGFyZ2V0U3RyID0gVHJhbnNjb2RlVGFyZ2V0LkVUQzJfUkdCQTtcbiAgICAgICAgY29tcHJlc3Npb25UZXh0dXJlVHlwZSA9IENvbXByZXNzaW9uVGV4dHVyZVR5cGUuRVRDMl9SR0JBOF9FQUM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0cmFuc2NvZGVUYXJnZXRTdHIgPSBUcmFuc2NvZGVUYXJnZXQuRVRDMV9SR0I7XG4gICAgICAgIGNvbXByZXNzaW9uVGV4dHVyZVR5cGUgPSBDb21wcmVzc2lvblRleHR1cmVUeXBlLkVUQzJfUkdCODtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGV0YzEpIHtcbiAgICAgIHRyYW5zY29kZVRhcmdldFN0ciA9IFRyYW5zY29kZVRhcmdldC5FVEMxX1JHQjtcbiAgICAgIGNvbXByZXNzaW9uVGV4dHVyZVR5cGUgPSBDb21wcmVzc2lvblRleHR1cmVUeXBlLkVUQzFfUkdCO1xuICAgIH0gZWxzZSB7XG4gICAgICB0cmFuc2NvZGVUYXJnZXRTdHIgPSBUcmFuc2NvZGVUYXJnZXQuUkdCQTMyO1xuICAgICAgY29tcHJlc3Npb25UZXh0dXJlVHlwZSA9IENvbXByZXNzaW9uVGV4dHVyZVR5cGUuUkdCQThfRVhUO1xuICAgIH1cblxuICAgIHJldHVybiB7IHRyYW5zY29kZVRhcmdldFN0ciwgY29tcHJlc3Npb25UZXh0dXJlVHlwZSB9O1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgdGhlIG9wdGltYWwgdHJhbnNjb2RpbmcgcGFyYW1ldGVycyBmb3IgV2ViR1BVIGNvbnRleHRzLlxuICAgKlxuICAgKiBBbmFseXplcyBhdmFpbGFibGUgV2ViR1BVIHRleHR1cmUgY29tcHJlc3Npb24gZmVhdHVyZXMgdG8gc2VsZWN0IHRoZSBiZXN0XG4gICAqIGNvbXByZXNzaW9uIGZvcm1hdCBhbmQgdHJhbnNjb2RpbmcgdGFyZ2V0LiBQcmlvcml0aXplcyBmb3JtYXRzIGluIG9yZGVyXG4gICAqIG9mIHF1YWxpdHk6IEFTVEMgPiBCQyAoUzNUQykgPiBFVEMyID4gUkdCQTMyLlxuICAgKlxuICAgKiBAcGFyYW0gaGFzQWxwaGEgLSBXaGV0aGVyIHRoZSB0ZXh0dXJlIGNvbnRhaW5zIGFscGhhIGNoYW5uZWwgZGF0YVxuICAgKiBAcmV0dXJucyBBbiBvYmplY3QgY29udGFpbmluZyB0aGUgdHJhbnNjb2RpbmcgdGFyZ2V0IHN0cmluZyBhbmQgY29tcHJlc3Npb24gdHlwZVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX2dldERldmljZURlcGVuZGVudFBhcmFtZXRlcnNXZWJHUFUoZW5naW5lOiBFbmdpbmUsIGhhc0FscGhhOiBib29sZWFuKSB7XG4gICAgY29uc3Qgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5ID0gZW5naW5lLndlYkdwdVJlc291cmNlUmVwb3NpdG9yeTtcbiAgICBjb25zdCBhZGFwdGVyID0gd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LmdldFdlYkdwdURldmljZVdyYXBwZXIoKS5ncHVBZGFwdGVyO1xuXG4gICAgY29uc3QgYXN0YyA9IGFkYXB0ZXIuZmVhdHVyZXMuaGFzKCd0ZXh0dXJlLWNvbXByZXNzaW9uLWFzdGMnKTtcbiAgICBjb25zdCBzM3RjID0gYWRhcHRlci5mZWF0dXJlcy5oYXMoJ3RleHR1cmUtY29tcHJlc3Npb24tYmMnKTtcbiAgICBjb25zdCBldGMyID0gYWRhcHRlci5mZWF0dXJlcy5oYXMoJ3RleHR1cmUtY29tcHJlc3Npb24tZXRjMicpO1xuXG4gICAgbGV0IHRyYW5zY29kZVRhcmdldFN0cjogVHJhbnNjb2RlVGFyZ2V0O1xuICAgIGxldCBjb21wcmVzc2lvblRleHR1cmVUeXBlOiBDb21wcmVzc2lvblRleHR1cmVUeXBlRW51bTtcbiAgICBpZiAoYXN0Yykge1xuICAgICAgdHJhbnNjb2RlVGFyZ2V0U3RyID0gVHJhbnNjb2RlVGFyZ2V0LkFTVENfNHg0X1JHQkE7XG4gICAgICBjb21wcmVzc2lvblRleHR1cmVUeXBlID0gQ29tcHJlc3Npb25UZXh0dXJlVHlwZS5BU1RDX1JHQkFfNHg0O1xuICAgIH0gZWxzZSBpZiAoczN0Yykge1xuICAgICAgaWYgKGhhc0FscGhhKSB7XG4gICAgICAgIHRyYW5zY29kZVRhcmdldFN0ciA9IFRyYW5zY29kZVRhcmdldC5CQzNfUkdCQTtcbiAgICAgICAgY29tcHJlc3Npb25UZXh0dXJlVHlwZSA9IENvbXByZXNzaW9uVGV4dHVyZVR5cGUuUzNUQ19SR0JBX0RYVDU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0cmFuc2NvZGVUYXJnZXRTdHIgPSBUcmFuc2NvZGVUYXJnZXQuQkMxX1JHQjtcbiAgICAgICAgY29tcHJlc3Npb25UZXh0dXJlVHlwZSA9IENvbXByZXNzaW9uVGV4dHVyZVR5cGUuUzNUQ19SR0JfRFhUMTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGV0YzIpIHtcbiAgICAgIGlmIChoYXNBbHBoYSkge1xuICAgICAgICB0cmFuc2NvZGVUYXJnZXRTdHIgPSBUcmFuc2NvZGVUYXJnZXQuRVRDMl9SR0JBO1xuICAgICAgICBjb21wcmVzc2lvblRleHR1cmVUeXBlID0gQ29tcHJlc3Npb25UZXh0dXJlVHlwZS5FVEMyX1JHQkE4X0VBQztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyYW5zY29kZVRhcmdldFN0ciA9IFRyYW5zY29kZVRhcmdldC5FVEMxX1JHQjtcbiAgICAgICAgY29tcHJlc3Npb25UZXh0dXJlVHlwZSA9IENvbXByZXNzaW9uVGV4dHVyZVR5cGUuRVRDMl9SR0I4O1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0cmFuc2NvZGVUYXJnZXRTdHIgPSBUcmFuc2NvZGVUYXJnZXQuUkdCQTMyO1xuICAgICAgY29tcHJlc3Npb25UZXh0dXJlVHlwZSA9IENvbXByZXNzaW9uVGV4dHVyZVR5cGUuUkdCQThfRVhUO1xuICAgIH1cblxuICAgIHJldHVybiB7IHRyYW5zY29kZVRhcmdldFN0ciwgY29tcHJlc3Npb25UZXh0dXJlVHlwZSB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlcyBhIEtUWDIgY29udGFpbmVyIGZyb20gdGhlIHByb3ZpZGVkIGJ5dGUgYXJyYXkuXG4gICAqXG4gICAqIFVzZXMgdGhlIGt0eC1wYXJzZSBsaWJyYXJ5IHRvIHJlYWQgYW5kIHZhbGlkYXRlIHRoZSBLVFgyIGZpbGUgZm9ybWF0LlxuICAgKiBUaGUgcGFyc2VyIGF1dG9tYXRpY2FsbHkgZGV0ZWN0cyBpbnZhbGlkIGlkZW50aWZpZXJzIGFuZCB0aHJvd3MgZXJyb3JzXG4gICAqIGZvciBtYWxmb3JtZWQgZmlsZXMuXG4gICAqXG4gICAqIEBwYXJhbSB1aW50OEFycmF5IC0gVGhlIHJhdyBLVFgyIGZpbGUgZGF0YVxuICAgKiBAcmV0dXJucyBUaGUgcGFyc2VkIEtUWDIgY29udGFpbmVyIHdpdGggYWxsIG1ldGFkYXRhIGFuZCB0ZXh0dXJlIGRhdGFcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgX19wYXJzZSh1aW50OEFycmF5OiBVaW50OEFycmF5KTogS1RYMkNvbnRhaW5lciB7XG4gICAgcmV0dXJuIHJlYWQodWludDhBcnJheSk7XG4gIH1cblxuICAvKipcbiAgICogVHJhbnNjb2RlcyB0aGUgdGV4dHVyZSBkYXRhIGZyb20gdGhlIEtUWDIgY29udGFpbmVyIHRvIHRoZSB0YXJnZXQgZm9ybWF0LlxuICAgKlxuICAgKiBUaGlzIG1ldGhvZCBoYW5kbGVzIHRoZSBjb3JlIHRyYW5zY29kaW5nIGxvZ2ljLCBpbmNsdWRpbmc6XG4gICAqIC0gRGV0ZXJtaW5pbmcgdGhlIHNvdXJjZSBjb21wcmVzc2lvbiBmb3JtYXQgKEVUQzFTIG9yIFVBU1RDNHg0KVxuICAgKiAtIFNlbGVjdGluZyB0aGUgYXBwcm9wcmlhdGUgdHJhbnNjb2RlciBhbmQgdGFyZ2V0IGZvcm1hdFxuICAgKiAtIFByb2Nlc3NpbmcgYWxsIG1pcG1hcCBsZXZlbHNcbiAgICogLSBIYW5kbGluZyBaU1REIGRlY29tcHJlc3Npb24gaWYgbmVlZGVkXG4gICAqIC0gTWFuYWdpbmcgQmFzaXMgVW5pdmVyc2FsIHBhbGV0dGUgYW5kIHRhYmxlIGRhdGEgZm9yIEVUQzFTXG4gICAqXG4gICAqIEBwYXJhbSBrdHgyQ29udGFpbmVyIC0gVGhlIHBhcnNlZCBLVFgyIGNvbnRhaW5lclxuICAgKiBAcmV0dXJucyBUaGUgdHJhbnNjb2RlZCB0ZXh0dXJlIGRhdGEgd2l0aCBhbGwgbWlwbWFwIGxldmVsc1xuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX3RyYW5zY29kZURhdGEoZW5naW5lOiBFbmdpbmUsIGt0eDJDb250YWluZXI6IEtUWDJDb250YWluZXIpIHtcbiAgICBjb25zdCB3aWR0aCA9IGt0eDJDb250YWluZXIucGl4ZWxXaWR0aDtcbiAgICBjb25zdCBoZWlnaHQgPSBrdHgyQ29udGFpbmVyLnBpeGVsSGVpZ2h0O1xuICAgIGNvbnN0IGZhY2VDb3VudCA9IGt0eDJDb250YWluZXIuZmFjZUNvdW50OyAvLyBmYWNlQ291bnQgaXMgNiBpZiB0aGUgdHJhbnNjb2RlZCBkYXRhIGlzIGEgY3ViZSBtYXAgKG5vdCBzdXBwb3J0IHlldClcblxuICAgIGNvbnN0IGltYWdlRGVzY3MgPSBrdHgyQ29udGFpbmVyLmdsb2JhbERhdGE/LmltYWdlRGVzY3M7XG5cbiAgICBjb25zdCBkZmQgPSBrdHgyQ29udGFpbmVyLmRhdGFGb3JtYXREZXNjcmlwdG9yWzBdO1xuICAgIGNvbnN0IGNvbXByZXNzZWRUZXh0dXJlRm9ybWF0ID1cbiAgICAgIGRmZC5jb2xvck1vZGVsID09PSBLSFJfREZfTU9ERUxfVUFTVEMgPyBDb21wcmVzc2VkVGV4dHVyZUZvcm1hdC5VQVNUQzR4NCA6IENvbXByZXNzZWRUZXh0dXJlRm9ybWF0LkVUQzFTO1xuXG4gICAgY29uc3QgaGFzQWxwaGEgPSB0aGlzLl9faGFzQWxwaGEoZGZkLCBjb21wcmVzc2VkVGV4dHVyZUZvcm1hdCk7XG4gICAgY29uc3QgaXNWaWRlbyA9IGZhbHNlO1xuXG4gICAgY29uc3QgdHJhbnNjb2Rlck1vZHVsZSA9IEtUWDJUZXh0dXJlTG9hZGVyLl9fbXNjVHJhbnNjb2Rlck1vZHVsZTtcbiAgICBjb25zdCB0cmFuc2NvZGVyID1cbiAgICAgIGNvbXByZXNzZWRUZXh0dXJlRm9ybWF0ID09PSBDb21wcmVzc2VkVGV4dHVyZUZvcm1hdC5VQVNUQzR4NFxuICAgICAgICA/IG5ldyB0cmFuc2NvZGVyTW9kdWxlLlVhc3RjSW1hZ2VUcmFuc2NvZGVyKClcbiAgICAgICAgOiBuZXcgdHJhbnNjb2Rlck1vZHVsZS5CYXNpc0x6RXRjMXNJbWFnZVRyYW5zY29kZXIoKTtcbiAgICBjb25zdCB0ZXh0dXJlRm9ybWF0ID1cbiAgICAgIGNvbXByZXNzZWRUZXh0dXJlRm9ybWF0ID09PSBDb21wcmVzc2VkVGV4dHVyZUZvcm1hdC5VQVNUQzR4NFxuICAgICAgICA/IHRyYW5zY29kZXJNb2R1bGUuVGV4dHVyZUZvcm1hdC5VQVNUQzR4NFxuICAgICAgICA6IHRyYW5zY29kZXJNb2R1bGUuVGV4dHVyZUZvcm1hdC5FVEMxUztcblxuICAgIGNvbnN0IHsgdHJhbnNjb2RlVGFyZ2V0U3RyLCBjb21wcmVzc2lvblRleHR1cmVUeXBlIH0gPVxuICAgICAgZW5naW5lLmVuZ2luZVN0YXRlLmN1cnJlbnRQcm9jZXNzQXBwcm9hY2ggPT09IFByb2Nlc3NBcHByb2FjaC5XZWJHUFVcbiAgICAgICAgPyB0aGlzLl9fZ2V0RGV2aWNlRGVwZW5kZW50UGFyYW1ldGVyc1dlYkdQVShlbmdpbmUsIGhhc0FscGhhKVxuICAgICAgICA6IHRoaXMuX19nZXREZXZpY2VEZXBlbmRlbnRQYXJhbWV0ZXJzV2ViR0woZW5naW5lLCBoYXNBbHBoYSk7XG5cbiAgICBjb25zdCB0cmFuc2NvZGVUYXJnZXQgPSB0cmFuc2NvZGVyTW9kdWxlLlRyYW5zY29kZVRhcmdldFt0cmFuc2NvZGVUYXJnZXRTdHJdO1xuXG4gICAgY29uc3QgbWlwbWFwRGF0YTogVGV4dHVyZURhdGFbXSA9IFtdO1xuICAgIGNvbnN0IHRyYW5zY29kZWREYXRhID0ge1xuICAgICAgd2lkdGgsXG4gICAgICBoZWlnaHQsXG4gICAgICBjb21wcmVzc2lvblRleHR1cmVUeXBlLFxuICAgICAgbWlwbWFwRGF0YSxcbiAgICAgIG5lZWRHYW1tYUNvcnJlY3Rpb246IGRmZC50cmFuc2ZlckZ1bmN0aW9uICE9PSBLSFJfREZfVFJBTlNGRVJfU1JHQixcbiAgICB9O1xuXG4gICAgZm9yIChsZXQgbGV2ZWwgPSAwOyBsZXZlbCA8IGt0eDJDb250YWluZXIubGV2ZWxzLmxlbmd0aDsgbGV2ZWwrKykge1xuICAgICAgY29uc3QgbGV2ZWxXaWR0aCA9IE1hdGgubWF4KDEsIHdpZHRoID4+IGxldmVsKTtcbiAgICAgIGNvbnN0IGxldmVsSGVpZ2h0ID0gTWF0aC5tYXgoMSwgaGVpZ2h0ID4+IGxldmVsKTtcblxuICAgICAgY29uc3QgaW1hZ2VJbmZvID0gbmV3IHRyYW5zY29kZXJNb2R1bGUuSW1hZ2VJbmZvKHRleHR1cmVGb3JtYXQsIGxldmVsV2lkdGgsIGxldmVsSGVpZ2h0LCBsZXZlbCk7XG5cbiAgICAgIGxldCBsZXZlbEJ1ZmZlcjogVWludDhBcnJheTxBcnJheUJ1ZmZlcj4gPSBrdHgyQ29udGFpbmVyLmxldmVsc1tsZXZlbF0ubGV2ZWxEYXRhO1xuICAgICAgY29uc3QgbGV2ZWxVbmNvbXByZXNzZWRCeXRlTGVuZ3RoID0ga3R4MkNvbnRhaW5lci5sZXZlbHNbbGV2ZWxdLnVuY29tcHJlc3NlZEJ5dGVMZW5ndGg7XG4gICAgICBjb25zdCBsZXZlbEJ1ZmZlckJ5dGVMZW5ndGggPSBpbWFnZUluZm8ubnVtQmxvY2tzWCAqIGltYWdlSW5mby5udW1CbG9ja3NZICogZGZkLmJ5dGVzUGxhbmVbMF07XG5cbiAgICAgIGlmIChrdHgyQ29udGFpbmVyLnN1cGVyY29tcHJlc3Npb25TY2hlbWUgPT09IEtIUl9TVVBFUkNPTVBSRVNTSU9OX1pTVEQpIHtcbiAgICAgICAgbGV2ZWxCdWZmZXIgPSBuZXcgVWludDhBcnJheShcbiAgICAgICAgICBLVFgyVGV4dHVyZUxvYWRlci5fX3pzdGREZWNvZGVyLmRlY29kZShcbiAgICAgICAgICAgIG5ldyBVaW50OEFycmF5KGxldmVsQnVmZmVyLmJ1ZmZlciwgbGV2ZWxCdWZmZXIuYnl0ZU9mZnNldCwgbGV2ZWxCdWZmZXIuYnl0ZUxlbmd0aCksXG4gICAgICAgICAgICBsZXZlbFVuY29tcHJlc3NlZEJ5dGVMZW5ndGhcbiAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGxldCBmYWNlQnVmZmVyQnl0ZU9mZnNldCA9IDA7XG4gICAgICBjb25zdCBmaXJzdEltYWdlRGVzY0luZGV4SW5MZXZlbCA9XG4gICAgICAgIGxldmVsICogTWF0aC5tYXgoa3R4MkNvbnRhaW5lci5sYXllckNvdW50LCAxKSAqIGZhY2VDb3VudCAqIE1hdGgubWF4KGt0eDJDb250YWluZXIucGl4ZWxEZXB0aCwgMSk7XG5cbiAgICAgIGZvciAobGV0IGZhY2VJbmRleCA9IDA7IGZhY2VJbmRleCA8IGZhY2VDb3VudDsgZmFjZUluZGV4KyspIHtcbiAgICAgICAgbGV0IGltYWdlRGVzYzogS1RYMkdsb2JhbERhdGFCYXNpc0xaSW1hZ2VEZXNjIHwgbnVsbCA9IG51bGw7XG4gICAgICAgIGxldCBmYWNlQnVmZmVyOiBVaW50OEFycmF5PEFycmF5QnVmZmVyPjtcbiAgICAgICAgaWYgKGt0eDJDb250YWluZXIuc3VwZXJjb21wcmVzc2lvblNjaGVtZSA9PT0gS0hSX1NVUEVSQ09NUFJFU1NJT05fQkFTSVNMWikge1xuICAgICAgICAgIGltYWdlRGVzYyA9IGltYWdlRGVzY3M/LltmaXJzdEltYWdlRGVzY0luZGV4SW5MZXZlbCArIGZhY2VJbmRleF0gYXMgS1RYMkdsb2JhbERhdGFCYXNpc0xaSW1hZ2VEZXNjO1xuXG4gICAgICAgICAgZmFjZUJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KFxuICAgICAgICAgICAgbGV2ZWxCdWZmZXIuYnVmZmVyLFxuICAgICAgICAgICAgbGV2ZWxCdWZmZXIuYnl0ZU9mZnNldCArIGltYWdlRGVzYy5yZ2JTbGljZUJ5dGVPZmZzZXQsXG4gICAgICAgICAgICBpbWFnZURlc2MucmdiU2xpY2VCeXRlTGVuZ3RoICsgaW1hZ2VEZXNjLmFscGhhU2xpY2VCeXRlTGVuZ3RoXG4gICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmYWNlQnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkoXG4gICAgICAgICAgICBsZXZlbEJ1ZmZlci5idWZmZXIsXG4gICAgICAgICAgICBsZXZlbEJ1ZmZlci5ieXRlT2Zmc2V0ICsgZmFjZUJ1ZmZlckJ5dGVPZmZzZXQsXG4gICAgICAgICAgICBsZXZlbEJ1ZmZlckJ5dGVMZW5ndGhcbiAgICAgICAgICApO1xuICAgICAgICAgIGZhY2VCdWZmZXJCeXRlT2Zmc2V0ICs9IGxldmVsQnVmZmVyQnl0ZUxlbmd0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCByZXN1bHQ6IFRyYW5zY29kZWRJbWFnZSB8IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKGNvbXByZXNzZWRUZXh0dXJlRm9ybWF0ID09PSBDb21wcmVzc2VkVGV4dHVyZUZvcm1hdC5VQVNUQzR4NCkge1xuICAgICAgICAgIGltYWdlSW5mby5mbGFncyA9IDA7XG4gICAgICAgICAgaW1hZ2VJbmZvLnJnYkJ5dGVPZmZzZXQgPSAwO1xuICAgICAgICAgIGltYWdlSW5mby5yZ2JCeXRlTGVuZ3RoID0gbGV2ZWxVbmNvbXByZXNzZWRCeXRlTGVuZ3RoO1xuICAgICAgICAgIGltYWdlSW5mby5hbHBoYUJ5dGVPZmZzZXQgPSAwO1xuICAgICAgICAgIGltYWdlSW5mby5hbHBoYUJ5dGVMZW5ndGggPSAwO1xuXG4gICAgICAgICAgcmVzdWx0ID0gKHRyYW5zY29kZXIgYXMgVWFzdGNJbWFnZVRyYW5zY29kZXIpLnRyYW5zY29kZUltYWdlKFxuICAgICAgICAgICAgdHJhbnNjb2RlVGFyZ2V0LFxuICAgICAgICAgICAgZmFjZUJ1ZmZlcixcbiAgICAgICAgICAgIGltYWdlSW5mbyxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICBoYXNBbHBoYSxcbiAgICAgICAgICAgIGlzVmlkZW9cbiAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IHNnZCA9IGt0eDJDb250YWluZXIuZ2xvYmFsRGF0YSBhcyBLVFgyR2xvYmFsRGF0YUJhc2lzTFo7XG4gICAgICAgICAgY29uc3QgYmFzaXNUcmFuc2NvZGVyID0gdHJhbnNjb2RlciBhcyBCYXNpc0x6RXRjMXNJbWFnZVRyYW5zY29kZXI7XG4gICAgICAgICAgYmFzaXNUcmFuc2NvZGVyLmRlY29kZVBhbGV0dGVzKHNnZC5lbmRwb2ludENvdW50LCBzZ2QuZW5kcG9pbnRzRGF0YSwgc2dkLnNlbGVjdG9yQ291bnQsIHNnZC5zZWxlY3RvcnNEYXRhKTtcbiAgICAgICAgICBiYXNpc1RyYW5zY29kZXIuZGVjb2RlVGFibGVzKHNnZC50YWJsZXNEYXRhKTtcblxuICAgICAgICAgIGltYWdlSW5mby5mbGFncyA9IGltYWdlRGVzYyEuaW1hZ2VGbGFncztcbiAgICAgICAgICBpbWFnZUluZm8ucmdiQnl0ZU9mZnNldCA9IDA7XG4gICAgICAgICAgaW1hZ2VJbmZvLnJnYkJ5dGVMZW5ndGggPSBpbWFnZURlc2MhLnJnYlNsaWNlQnl0ZUxlbmd0aDtcbiAgICAgICAgICBpbWFnZUluZm8uYWxwaGFCeXRlT2Zmc2V0ID0gaW1hZ2VEZXNjIS5hbHBoYVNsaWNlQnl0ZU9mZnNldCA+IDAgPyBpbWFnZURlc2MhLnJnYlNsaWNlQnl0ZUxlbmd0aCA6IDA7XG4gICAgICAgICAgaW1hZ2VJbmZvLmFscGhhQnl0ZUxlbmd0aCA9IGltYWdlRGVzYyEuYWxwaGFTbGljZUJ5dGVMZW5ndGg7XG5cbiAgICAgICAgICByZXN1bHQgPSBiYXNpc1RyYW5zY29kZXIudHJhbnNjb2RlSW1hZ2UodHJhbnNjb2RlVGFyZ2V0LCBmYWNlQnVmZmVyLCBpbWFnZUluZm8sIDAsIGlzVmlkZW8pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJlc3VsdD8udHJhbnNjb2RlZEltYWdlICE9IG51bGwpIHtcbiAgICAgICAgICBjb25zdCB0cmFuc2NvZGVkVGV4dHVyZUJ1ZmZlciA9IHJlc3VsdC50cmFuc2NvZGVkSW1hZ2UuZ2V0X3R5cGVkX21lbW9yeV92aWV3KCkuc2xpY2UoKTtcbiAgICAgICAgICByZXN1bHQudHJhbnNjb2RlZEltYWdlLmRlbGV0ZSgpO1xuXG4gICAgICAgICAgY29uc3QgbWlwbWFwID0ge1xuICAgICAgICAgICAgbGV2ZWwsXG4gICAgICAgICAgICB3aWR0aDogbGV2ZWxXaWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogbGV2ZWxIZWlnaHQsXG4gICAgICAgICAgICBidWZmZXI6IHRyYW5zY29kZWRUZXh0dXJlQnVmZmVyLFxuICAgICAgICAgIH0gYXMgVGV4dHVyZURhdGE7XG4gICAgICAgICAgbWlwbWFwRGF0YS5wdXNoKG1pcG1hcCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJhbnNjb2RlZERhdGE7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSB0ZXh0dXJlIGNvbnRhaW5zIGFscGhhIGNoYW5uZWwgZGF0YS5cbiAgICpcbiAgICogRm9yIFVBU1RDNHg0IGZvcm1hdCwgY2hlY2tzIGlmIHRoZSBjaGFubmVsIElEIGluZGljYXRlcyBSR0JBIGRhdGEuXG4gICAqIEZvciBFVEMxUyBmb3JtYXQsIGNoZWNrcyBpZiBhbnkgc2FtcGxlIGNvbnRhaW5zIGFscGhhIGNoYW5uZWwgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBkZmQgLSBUaGUgZGF0YSBmb3JtYXQgZGVzY3JpcHRvciBmcm9tIHRoZSBLVFgyIGNvbnRhaW5lclxuICAgKiBAcGFyYW0gY29tcHJlc3NlZFRleHR1cmVGb3JtYXQgLSBUaGUgY29tcHJlc3Npb24gZm9ybWF0IChFVEMxUyBvciBVQVNUQzR4NClcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgdGV4dHVyZSBoYXMgYWxwaGEgY2hhbm5lbCBkYXRhLCBmYWxzZSBvdGhlcndpc2VcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgX19oYXNBbHBoYShkZmQ6IEtUWDJEYXRhRm9ybWF0RGVzY3JpcHRvckJhc2ljRm9ybWF0LCBjb21wcmVzc2VkVGV4dHVyZUZvcm1hdDogQ29tcHJlc3NlZFRleHR1cmVGb3JtYXQpIHtcbiAgICBpZiAoY29tcHJlc3NlZFRleHR1cmVGb3JtYXQgPT09IENvbXByZXNzZWRUZXh0dXJlRm9ybWF0LlVBU1RDNHg0KSB7XG4gICAgICByZXR1cm4gS1RYMlRleHR1cmVMb2FkZXIuX19nZXRDaGFubmVsVHlwZShkZmQuc2FtcGxlc1swXSkgPT09IEtUWDJDaGFubmVsVUFTVEMuUkdCQTtcbiAgICB9XG4gICAgcmV0dXJuIChcbiAgICAgIGRmZC5zYW1wbGVzLmxlbmd0aCA9PT0gMiAmJlxuICAgICAgKEtUWDJUZXh0dXJlTG9hZGVyLl9fZ2V0Q2hhbm5lbFR5cGUoZGZkLnNhbXBsZXNbMF0pID09PSBLVFgyQ2hhbm5lbEVUQzFTLkFBQSB8fFxuICAgICAgICBLVFgyVGV4dHVyZUxvYWRlci5fX2dldENoYW5uZWxUeXBlKGRmZC5zYW1wbGVzWzFdKSA9PT0gS1RYMkNoYW5uZWxFVEMxUy5BQUEpXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBLSFJfREYgY2hhbm5lbCBJRCBvZiBhIERGRCBzYW1wbGUuXG4gICAqXG4gICAqIGt0eC1wYXJzZSB2MiByZW5hbWVkIHRoZSBmb3JtZXIgYGNoYW5uZWxJRGAgcHJvcGVydHkgdG8gYGNoYW5uZWxUeXBlYC5cbiAgICogVGhlIHByb3BlcnR5IGlzIHJlYWQgaW4gYSB2ZXJzaW9uIHRvbGVyYW50IHdheSBzbyB0aGF0IGJvdGgga3R4LXBhcnNlXG4gICAqIGdlbmVyYXRpb25zIGtlZXAgd29ya2luZyBmb3IgY29uc3VtZXJzIHRoYXQgc3VwcGx5IGN1c3RvbSBERkQgc2FtcGxlcy5cbiAgICpcbiAgICogQHBhcmFtIHNhbXBsZSAtIEEgYmFzaWMgZm9ybWF0IHNhbXBsZSBvZiB0aGUgZGF0YSBmb3JtYXQgZGVzY3JpcHRvclxuICAgKiBAcmV0dXJucyBUaGUgbnVtZXJpYyBLSFJfREYgY2hhbm5lbCBJRFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZXRDaGFubmVsVHlwZShzYW1wbGU6IEtUWDJCYXNpY0Zvcm1hdFNhbXBsZSkge1xuICAgIGNvbnN0IHZlcnNpb25Ub2xlcmFudFNhbXBsZSA9IHNhbXBsZSBhcyB1bmtub3duIGFzIHsgY2hhbm5lbFR5cGU/OiBudW1iZXI7IGNoYW5uZWxJRD86IG51bWJlciB9O1xuICAgIHJldHVybiB2ZXJzaW9uVG9sZXJhbnRTYW1wbGUuY2hhbm5lbFR5cGUgPz8gdmVyc2lvblRvbGVyYW50U2FtcGxlLmNoYW5uZWxJRCA/PyAwO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQUE7QUFBQSxFQUNFO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFLQTtBQUFBLE9BQ0s7QUFDUCxTQUFTLG1CQUFtQjtBQUM1QjtBQUFBLEVBQ0U7QUFBQSxPQUVLO0FBQ1AsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyxjQUFjO0FBa0J2QixJQUFNLG1CQUFtQjtBQUFBLEVBQ3ZCLEtBQUs7QUFBQSxFQUNMLEtBQUs7QUFBQSxFQUNMLEtBQUs7QUFBQSxFQUNMLEtBQUs7QUFDUDtBQUNBLElBQU0sbUJBQW1CO0FBQUEsRUFDdkIsS0FBSztBQUFBLEVBQ0wsTUFBTTtBQUFBLEVBQ04sS0FBSztBQUFBLEVBQ0wsTUFBTTtBQUNSO0FBRUEsSUFBTSwwQkFBMEI7QUFBQSxFQUM5QixPQUFPO0FBQUEsRUFDUCxVQUFVO0FBQ1o7QUFHQSxJQUFNLGtCQUFrQjtBQUFBLEVBQ3RCLFVBQVU7QUFBQSxFQUNWLFNBQVM7QUFBQSxFQUNULE9BQU87QUFBQSxFQUNQLFFBQVE7QUFBQSxFQUNSLFVBQVU7QUFBQSxFQUNWLGNBQWM7QUFBQSxFQUNkLGVBQWU7QUFBQSxFQUNmLFVBQVU7QUFBQSxFQUNWLFlBQVk7QUFBQSxFQUNaLGFBQWE7QUFBQSxFQUNiLFdBQVc7QUFBQSxFQUNYLGVBQWU7QUFBQSxFQUNmLFFBQVE7QUFBQSxFQUNSLFFBQVE7QUFBQSxFQUNSLFFBQVE7QUFBQSxFQUNSLFVBQVU7QUFBQSxFQUNWLGNBQWM7QUFBQSxFQUNkLGVBQWU7QUFBQSxFQUNmLFNBQVM7QUFBQSxFQUNULFVBQVU7QUFDWjtBQWlDTyxJQUFNLG9CQUFOLE1BQU0sbUJBQWtCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFlN0IsY0FBYztBQUNaLFFBQUksT0FBTyxtQkFBbUIsYUFBYTtBQUN6QyxhQUFPLFFBQVEsTUFBTSwyRkFBMkY7QUFBQSxJQUNsSDtBQUNBLFNBQUtBLEtBQXlCLEtBQUtDLEdBQW9CO0FBQUEsRUFDekQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxPQUFPLGNBQWM7QUFDbkIsUUFBSSxDQUFDLEtBQUtDLElBQVk7QUFDcEIsV0FBS0EsS0FBYSxJQUFJLG1CQUFrQjtBQUFBLElBQzFDO0FBQ0EsV0FBTyxLQUFLQTtBQUFBLEVBQ2Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBa0JBLFVBQVUsUUFBZ0IsWUFBd0I7QUFDaEQsVUFBTSxnQkFBZ0IsS0FBS0MsR0FBUSxVQUFVO0FBRTdDLFFBQUksY0FBYyxhQUFhLEdBQUc7QUFDaEMsWUFBTSxJQUFJLE1BQU0sMENBQTBDO0FBQUEsSUFDNUQ7QUFFQSxRQUFJLGNBQWMsYUFBYSxHQUFHO0FBQ2hDLFlBQU0sSUFBSSxNQUFNLDRDQUE0QztBQUFBLElBQzlEO0FBRUEsUUFBSSxjQUFjLFlBQVksR0FBRztBQUMvQixZQUFNLElBQUksTUFBTSwyQ0FBMkM7QUFBQSxJQUM3RDtBQUVBLFFBQUksY0FBYywyQkFBMkIsMkJBQTJCO0FBQ3RFLFVBQUksbUJBQWtCQyxNQUFpQixNQUFNO0FBQzNDLDJCQUFrQkEsS0FBZ0IsSUFBSSxZQUFZO0FBQUEsTUFDcEQ7QUFFQSxhQUFPLG1CQUFrQkEsR0FBYyxLQUFLLEVBQUUsS0FBSyxNQUFNO0FBQ3ZELGVBQU8sS0FBS0osR0FBdUIsS0FBSyxNQUFNO0FBQzVDLGlCQUFPLEtBQUtLLEdBQWdCLFFBQVEsYUFBYTtBQUFBLFFBQ25ELENBQUM7QUFBQSxNQUNILENBQUM7QUFBQSxJQUNIO0FBQ0EsV0FBTyxLQUFLTCxHQUF1QixLQUFLLE1BQU07QUFDNUMsYUFBTyxLQUFLSyxHQUFnQixRQUFRLGFBQWE7QUFBQSxJQUNuRCxDQUFDO0FBQUEsRUFDSDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBV1FKLEtBQXFDO0FBQzNDLFdBQU8sSUFBSSxRQUFRLGFBQVc7QUFDNUIsVUFBSSxtQkFBa0JLLElBQXVCO0FBQzNDLGdCQUFRO0FBQUEsTUFDVjtBQUVBLHFCQUFlLEVBQUUsS0FBSyxDQUFDLHFCQUEwQztBQUMvRCx5QkFBaUIsZ0JBQWdCO0FBQ2pDLDJCQUFrQkEsS0FBd0I7QUFDMUMsZ0JBQVE7QUFBQSxNQUNWLENBQUM7QUFBQSxJQUNILENBQUM7QUFBQSxFQUNIO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBYVFDLEdBQW9DLFFBQWdCLFVBQW1CO0FBQzdFLFVBQU0sMEJBQTBCLE9BQU87QUFDdkMsVUFBTSxNQUFNLHdCQUF3QjtBQUVwQyxVQUFNLE9BQU8sSUFBSSxtQkFBbUIsSUFBSTtBQUN4QyxVQUFNLE9BQU8sSUFBSSxtQkFBbUIsSUFBSTtBQUN4QyxVQUFNLE9BQU8sSUFBSSxtQkFBbUIsSUFBSTtBQUN4QyxVQUFNLFFBQVEsSUFBSSxvQkFBb0IsSUFBSTtBQUMxQyxVQUFNLE9BQU8sSUFBSSxrQkFBa0IsSUFBSTtBQUN2QyxVQUFNLE9BQU8sSUFBSSxtQkFBbUIsSUFBSTtBQUV4QyxRQUFJO0FBQ0osUUFBSTtBQUNKLFFBQUksTUFBTTtBQUNSLDJCQUFxQixnQkFBZ0I7QUFDckMsK0JBQXlCLHVCQUF1QjtBQUFBLElBQ2xELFdBQVcsTUFBTTtBQUNmLDJCQUFxQixnQkFBZ0I7QUFDckMsK0JBQXlCLHVCQUF1QjtBQUFBLElBQ2xELFdBQVcsTUFBTTtBQUNmLFVBQUksVUFBVTtBQUNaLDZCQUFxQixnQkFBZ0I7QUFDckMsaUNBQXlCLHVCQUF1QjtBQUFBLE1BQ2xELE9BQU87QUFDTCw2QkFBcUIsZ0JBQWdCO0FBQ3JDLGlDQUF5Qix1QkFBdUI7QUFBQSxNQUNsRDtBQUFBLElBQ0YsV0FBVyxPQUFPO0FBQ2hCLFVBQUksVUFBVTtBQUNaLDZCQUFxQixnQkFBZ0I7QUFDckMsaUNBQXlCLHVCQUF1QjtBQUFBLE1BQ2xELE9BQU87QUFDTCw2QkFBcUIsZ0JBQWdCO0FBQ3JDLGlDQUF5Qix1QkFBdUI7QUFBQSxNQUNsRDtBQUFBLElBQ0YsV0FBVyxNQUFNO0FBQ2YsVUFBSSxVQUFVO0FBQ1osNkJBQXFCLGdCQUFnQjtBQUNyQyxpQ0FBeUIsdUJBQXVCO0FBQUEsTUFDbEQsT0FBTztBQUNMLDZCQUFxQixnQkFBZ0I7QUFDckMsaUNBQXlCLHVCQUF1QjtBQUFBLE1BQ2xEO0FBQUEsSUFDRixXQUFXLE1BQU07QUFDZiwyQkFBcUIsZ0JBQWdCO0FBQ3JDLCtCQUF5Qix1QkFBdUI7QUFBQSxJQUNsRCxPQUFPO0FBQ0wsMkJBQXFCLGdCQUFnQjtBQUNyQywrQkFBeUIsdUJBQXVCO0FBQUEsSUFDbEQ7QUFFQSxXQUFPLEVBQUUsb0JBQW9CLHVCQUF1QjtBQUFBLEVBQ3REO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBYVFDLEdBQXFDLFFBQWdCLFVBQW1CO0FBQzlFLFVBQU0sMkJBQTJCLE9BQU87QUFDeEMsVUFBTSxVQUFVLHlCQUF5Qix1QkFBdUIsRUFBRTtBQUVsRSxVQUFNLE9BQU8sUUFBUSxTQUFTLElBQUksMEJBQTBCO0FBQzVELFVBQU0sT0FBTyxRQUFRLFNBQVMsSUFBSSx3QkFBd0I7QUFDMUQsVUFBTSxPQUFPLFFBQVEsU0FBUyxJQUFJLDBCQUEwQjtBQUU1RCxRQUFJO0FBQ0osUUFBSTtBQUNKLFFBQUksTUFBTTtBQUNSLDJCQUFxQixnQkFBZ0I7QUFDckMsK0JBQXlCLHVCQUF1QjtBQUFBLElBQ2xELFdBQVcsTUFBTTtBQUNmLFVBQUksVUFBVTtBQUNaLDZCQUFxQixnQkFBZ0I7QUFDckMsaUNBQXlCLHVCQUF1QjtBQUFBLE1BQ2xELE9BQU87QUFDTCw2QkFBcUIsZ0JBQWdCO0FBQ3JDLGlDQUF5Qix1QkFBdUI7QUFBQSxNQUNsRDtBQUFBLElBQ0YsV0FBVyxNQUFNO0FBQ2YsVUFBSSxVQUFVO0FBQ1osNkJBQXFCLGdCQUFnQjtBQUNyQyxpQ0FBeUIsdUJBQXVCO0FBQUEsTUFDbEQsT0FBTztBQUNMLDZCQUFxQixnQkFBZ0I7QUFDckMsaUNBQXlCLHVCQUF1QjtBQUFBLE1BQ2xEO0FBQUEsSUFDRixPQUFPO0FBQ0wsMkJBQXFCLGdCQUFnQjtBQUNyQywrQkFBeUIsdUJBQXVCO0FBQUEsSUFDbEQ7QUFFQSxXQUFPLEVBQUUsb0JBQW9CLHVCQUF1QjtBQUFBLEVBQ3REO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBYVFMLEdBQVEsWUFBdUM7QUFDckQsV0FBTyxLQUFLLFVBQVU7QUFBQSxFQUN4QjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQWdCUUUsR0FBZ0IsUUFBZ0IsZUFBOEI7QUFsV3hFO0FBbVdJLFVBQU0sUUFBUSxjQUFjO0FBQzVCLFVBQU0sU0FBUyxjQUFjO0FBQzdCLFVBQU0sWUFBWSxjQUFjO0FBRWhDLFVBQU0sY0FBYSxtQkFBYyxlQUFkLG1CQUEwQjtBQUU3QyxVQUFNLE1BQU0sY0FBYyxxQkFBcUIsQ0FBQztBQUNoRCxVQUFNLDBCQUNKLElBQUksZUFBZSxxQkFBcUIsd0JBQXdCLFdBQVcsd0JBQXdCO0FBRXJHLFVBQU0sV0FBVyxLQUFLSSxHQUFXLEtBQUssdUJBQXVCO0FBQzdELFVBQU0sVUFBVTtBQUVoQixVQUFNLG1CQUFtQixtQkFBa0JIO0FBQzNDLFVBQU0sYUFDSiw0QkFBNEIsd0JBQXdCLFdBQ2hELElBQUksaUJBQWlCLHFCQUFxQixJQUMxQyxJQUFJLGlCQUFpQiw0QkFBNEI7QUFDdkQsVUFBTSxnQkFDSiw0QkFBNEIsd0JBQXdCLFdBQ2hELGlCQUFpQixjQUFjLFdBQy9CLGlCQUFpQixjQUFjO0FBRXJDLFVBQU0sRUFBRSxvQkFBb0IsdUJBQXVCLElBQ2pELE9BQU8sWUFBWSwyQkFBMkIsZ0JBQWdCLFNBQzFELEtBQUtFLEdBQXFDLFFBQVEsUUFBUSxJQUMxRCxLQUFLRCxHQUFvQyxRQUFRLFFBQVE7QUFFL0QsVUFBTSxrQkFBa0IsaUJBQWlCLGdCQUFnQixrQkFBa0I7QUFFM0UsVUFBTSxhQUE0QixDQUFDO0FBQ25DLFVBQU0saUJBQWlCO0FBQUEsTUFDckI7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBLHFCQUFxQixJQUFJLHFCQUFxQjtBQUFBLElBQ2hEO0FBRUEsYUFBUyxRQUFRLEdBQUcsUUFBUSxjQUFjLE9BQU8sUUFBUSxTQUFTO0FBQ2hFLFlBQU0sYUFBYSxLQUFLLElBQUksR0FBRyxTQUFTLEtBQUs7QUFDN0MsWUFBTSxjQUFjLEtBQUssSUFBSSxHQUFHLFVBQVUsS0FBSztBQUUvQyxZQUFNLFlBQVksSUFBSSxpQkFBaUIsVUFBVSxlQUFlLFlBQVksYUFBYSxLQUFLO0FBRTlGLFVBQUksY0FBdUMsY0FBYyxPQUFPLEtBQUssRUFBRTtBQUN2RSxZQUFNLDhCQUE4QixjQUFjLE9BQU8sS0FBSyxFQUFFO0FBQ2hFLFlBQU0sd0JBQXdCLFVBQVUsYUFBYSxVQUFVLGFBQWEsSUFBSSxXQUFXLENBQUM7QUFFNUYsVUFBSSxjQUFjLDJCQUEyQiwyQkFBMkI7QUFDdEUsc0JBQWMsSUFBSTtBQUFBLFVBQ2hCLG1CQUFrQkgsR0FBYztBQUFBLFlBQzlCLElBQUksV0FBVyxZQUFZLFFBQVEsWUFBWSxZQUFZLFlBQVksVUFBVTtBQUFBLFlBQ2pGO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBRUEsVUFBSSx1QkFBdUI7QUFDM0IsWUFBTSw2QkFDSixRQUFRLEtBQUssSUFBSSxjQUFjLFlBQVksQ0FBQyxJQUFJLFlBQVksS0FBSyxJQUFJLGNBQWMsWUFBWSxDQUFDO0FBRWxHLGVBQVMsWUFBWSxHQUFHLFlBQVksV0FBVyxhQUFhO0FBQzFELFlBQUksWUFBbUQ7QUFDdkQsWUFBSTtBQUNKLFlBQUksY0FBYywyQkFBMkIsOEJBQThCO0FBQ3pFLHNCQUFZLHlDQUFhLDZCQUE2QjtBQUV0RCx1QkFBYSxJQUFJO0FBQUEsWUFDZixZQUFZO0FBQUEsWUFDWixZQUFZLGFBQWEsVUFBVTtBQUFBLFlBQ25DLFVBQVUscUJBQXFCLFVBQVU7QUFBQSxVQUMzQztBQUFBLFFBQ0YsT0FBTztBQUNMLHVCQUFhLElBQUk7QUFBQSxZQUNmLFlBQVk7QUFBQSxZQUNaLFlBQVksYUFBYTtBQUFBLFlBQ3pCO0FBQUEsVUFDRjtBQUNBLGtDQUF3QjtBQUFBLFFBQzFCO0FBRUEsWUFBSTtBQUNKLFlBQUksNEJBQTRCLHdCQUF3QixVQUFVO0FBQ2hFLG9CQUFVLFFBQVE7QUFDbEIsb0JBQVUsZ0JBQWdCO0FBQzFCLG9CQUFVLGdCQUFnQjtBQUMxQixvQkFBVSxrQkFBa0I7QUFDNUIsb0JBQVUsa0JBQWtCO0FBRTVCLG1CQUFVLFdBQW9DO0FBQUEsWUFDNUM7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQSxRQUNGLE9BQU87QUFDTCxnQkFBTSxNQUFNLGNBQWM7QUFDMUIsZ0JBQU0sa0JBQWtCO0FBQ3hCLDBCQUFnQixlQUFlLElBQUksZUFBZSxJQUFJLGVBQWUsSUFBSSxlQUFlLElBQUksYUFBYTtBQUN6RywwQkFBZ0IsYUFBYSxJQUFJLFVBQVU7QUFFM0Msb0JBQVUsUUFBUSxVQUFXO0FBQzdCLG9CQUFVLGdCQUFnQjtBQUMxQixvQkFBVSxnQkFBZ0IsVUFBVztBQUNyQyxvQkFBVSxrQkFBa0IsVUFBVyx1QkFBdUIsSUFBSSxVQUFXLHFCQUFxQjtBQUNsRyxvQkFBVSxrQkFBa0IsVUFBVztBQUV2QyxtQkFBUyxnQkFBZ0IsZUFBZSxpQkFBaUIsWUFBWSxXQUFXLEdBQUcsT0FBTztBQUFBLFFBQzVGO0FBRUEsYUFBSSxpQ0FBUSxvQkFBbUIsTUFBTTtBQUNuQyxnQkFBTSwwQkFBMEIsT0FBTyxnQkFBZ0Isc0JBQXNCLEVBQUUsTUFBTTtBQUNyRixpQkFBTyxnQkFBZ0IsT0FBTztBQUU5QixnQkFBTSxTQUFTO0FBQUEsWUFDYjtBQUFBLFlBQ0EsT0FBTztBQUFBLFlBQ1AsUUFBUTtBQUFBLFlBQ1IsUUFBUTtBQUFBLFVBQ1Y7QUFDQSxxQkFBVyxLQUFLLE1BQU07QUFBQSxRQUN4QjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBRUEsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFhUUssR0FBVyxLQUEwQyx5QkFBa0Q7QUFDN0csUUFBSSw0QkFBNEIsd0JBQXdCLFVBQVU7QUFDaEUsYUFBTyxtQkFBa0JDLEdBQWlCLElBQUksUUFBUSxDQUFDLENBQUMsTUFBTSxpQkFBaUI7QUFBQSxJQUNqRjtBQUNBLFdBQ0UsSUFBSSxRQUFRLFdBQVcsTUFDdEIsbUJBQWtCQSxHQUFpQixJQUFJLFFBQVEsQ0FBQyxDQUFDLE1BQU0saUJBQWlCLE9BQ3ZFLG1CQUFrQkEsR0FBaUIsSUFBSSxRQUFRLENBQUMsQ0FBQyxNQUFNLGlCQUFpQjtBQUFBLEVBRTlFO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBYUEsT0FBZUEsR0FBaUIsUUFBK0I7QUF2Z0JqRTtBQXdnQkksVUFBTSx3QkFBd0I7QUFDOUIsWUFBTyxpQ0FBc0IsZ0JBQXRCLFlBQXFDLHNCQUFzQixjQUEzRCxZQUF3RTtBQUFBLEVBQ2pGO0FBQ0Y7IiwKICAibmFtZXMiOiBbIl9fbXNjVHJhbnNjb2RlclByb21pc2UiLCAiX19sb2FkTVNDVHJhbnNjb2RlciIsICJfX2luc3RhbmNlIiwgIl9fcGFyc2UiLCAiX196c3RkRGVjb2RlciIsICJfX3RyYW5zY29kZURhdGEiLCAiX19tc2NUcmFuc2NvZGVyTW9kdWxlIiwgIl9fZ2V0RGV2aWNlRGVwZW5kZW50UGFyYW1ldGVyc1dlYkdMIiwgIl9fZ2V0RGV2aWNlRGVwZW5kZW50UGFyYW1ldGVyc1dlYkdQVSIsICJfX2hhc0FscGhhIiwgIl9fZ2V0Q2hhbm5lbFR5cGUiXQp9Cg==
