import {
  KTX2ChannelETC1S,
  KTX2ChannelUASTC,
  KTX2Container,
  KTX2DataFormatDescriptorBasicFormat,
  KTX2GlobalDataBasisLZ,
  KTX2Model,
  KTX2SupercompressionScheme,
  KTX2Transfer,
  read,
} from 'ktx-parse';
import CGAPIResourceRepository from '../../foundation/renderer/CGAPIResourceRepository';
import WebGLContextWrapper from '../WebGLContextWrapper';
import {TextureData} from '../WebGLResourceRepository';
import {
  CompressionTextureType,
  CompressionTextureTypeEnum,
} from '../../foundation/definitions/CompressionTextureType';
import {ZSTDDecoder} from 'zstddec';

const CompressedTextureFormat = {
  ETC1S: 0,
  UASTC4x4: 1,
} as const;
type CompressedTextureFormat =
  typeof CompressedTextureFormat[keyof typeof CompressedTextureFormat];

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
type TranscodeTarget = typeof TranscodeTarget[keyof typeof TranscodeTarget];

interface KTX2GlobalDataBasisLZImageDesc {
  imageFlags: number;
  rgbSliceByteOffset: number;
  rgbSliceByteLength: number;
  alphaSliceByteOffset: number;
  alphaSliceByteLength: number;
}

declare const MSC_TRANSCODER: any;

export default class KTX2TextureLoader {
  private static __instance: KTX2TextureLoader;

  // TODO: create type of __mscTranscoderModule
  private static __mscTranscoderModule: any;
  private static __zstdDecoder: ZSTDDecoder;

  private __mscTranscoderPromise: Promise<void>;

  constructor() {
    if (typeof MSC_TRANSCODER === 'undefined') {
      console.error(
        'Failed to call MSC_TRANSCODER() function. Please check to import msc_basis_transcoder.js.'
      );
    }
    this.__mscTranscoderPromise = this.__loadMSCTranscoder();
  }

  // ----- Public Methods -----------------------------------------------------

  static getInstance() {
    if (!this.__instance) {
      this.__instance = new KTX2TextureLoader();
    }
    return this.__instance;
  }

  transcode(uint8Array: Uint8Array) {
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

    if (
      ktx2Container.supercompressionScheme === KTX2SupercompressionScheme.ZSTD
    ) {
      if (KTX2TextureLoader.__zstdDecoder == null) {
        KTX2TextureLoader.__zstdDecoder = new ZSTDDecoder();
      }

      return KTX2TextureLoader.__zstdDecoder.init().then(() => {
        return this.__mscTranscoderPromise.then(() => {
          return this.__transcodeData(ktx2Container);
        });
      });
    } else {
      return this.__mscTranscoderPromise.then(() => {
        return this.__transcodeData(ktx2Container);
      });
    }
  }

  // ----- Private Methods ----------------------------------------------------

  private __loadMSCTranscoder(): Promise<void> {
    // load msc_basis_transcoder once
    return new Promise(resolve => {
      if (KTX2TextureLoader.__mscTranscoderModule) {
        resolve();
      }

      MSC_TRANSCODER().then((transcoderModule: any) => {
        transcoderModule.initTranscoders();
        KTX2TextureLoader.__mscTranscoderModule = transcoderModule;
        resolve();
      });
    });
  }

  private __getDeviceDependentParameters(hasAlpha: boolean) {
    const webGLResourceRepository =
      CGAPIResourceRepository.getWebGLResourceRepository();
    const glw =
      webGLResourceRepository.currentWebGLContextWrapper as WebGLContextWrapper;

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

    return {transcodeTargetStr, compressionTextureType};
  }

  private __parse(uint8Array: Uint8Array): KTX2Container {
    // The parser can detect an invalid identifier.
    return read(uint8Array);
  }

  private __transcodeData(ktx2Container: KTX2Container) {
    const width = ktx2Container.pixelWidth;
    const height = ktx2Container.pixelHeight;
    const faceCount = ktx2Container.faceCount; // faceCount is 6 if the transcoded data is a cube map (not support yet)

    const imageDescs = ktx2Container.globalData?.imageDescs;

    const dfd = ktx2Container.dataFormatDescriptor[0];
    const compressedTextureFormat =
      dfd.colorModel === KTX2Model.UASTC
        ? CompressedTextureFormat.UASTC4x4
        : CompressedTextureFormat.ETC1S;

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

    const {transcodeTargetStr, compressionTextureType} =
      this.__getDeviceDependentParameters(hasAlpha);

    const transcodeTarget =
      transcoderModule.TranscodeTarget[transcodeTargetStr];

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

      const imageInfo = new transcoderModule.ImageInfo(
        textureFormat,
        levelWidth,
        levelHeight,
        level
      );

      let levelBuffer = ktx2Container.levels[level].levelData;
      const levelUncompressedByteLength =
        ktx2Container.levels[level].uncompressedByteLength;
      const levelBufferByteLength =
        imageInfo.numBlocksX * imageInfo.numBlocksY * dfd.bytesPlane[0];

      if (
        ktx2Container.supercompressionScheme === KTX2SupercompressionScheme.ZSTD
      ) {
        levelBuffer = KTX2TextureLoader.__zstdDecoder.decode(
          levelBuffer,
          levelUncompressedByteLength
        );
      }

      let faceBufferByteOffset = 0;
      const firstImageDescIndexInLevel =
        level *
        Math.max(ktx2Container.layerCount, 1) *
        faceCount *
        Math.max(ktx2Container.pixelDepth, 1);

      for (let faceIndex = 0; faceIndex < faceCount; faceIndex++) {
        let imageDesc: KTX2GlobalDataBasisLZImageDesc | null = null;
        let faceBuffer: Uint8Array;
        if (
          ktx2Container.supercompressionScheme ===
          KTX2SupercompressionScheme.BASISLZ
        ) {
          imageDesc = imageDescs?.[
            firstImageDescIndexInLevel + faceIndex
          ] as KTX2GlobalDataBasisLZImageDesc;

          faceBuffer = new Uint8Array(
            levelBuffer,
            imageDesc.rgbSliceByteOffset,
            imageDesc.rgbSliceByteLength + imageDesc.alphaSliceByteLength
          );
        } else {
          faceBuffer = new Uint8Array(
            levelBuffer,
            faceBufferByteOffset,
            levelBufferByteLength
          );
          faceBufferByteOffset += levelBufferByteLength;
        }

        let result: any;
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
          const sgd = ktx2Container.globalData as KTX2GlobalDataBasisLZ;
          transcoder.decodePalettes(
            sgd.endpointCount,
            sgd.endpointsData,
            sgd.selectorCount,
            sgd.selectorsData
          );
          transcoder.decodeTables(sgd.tablesData);

          imageInfo.flags = imageDesc!.imageFlags;
          imageInfo.rgbByteOffset = 0;
          imageInfo.rgbByteLength = imageDesc!.rgbSliceByteLength;
          imageInfo.alphaByteOffset =
            imageDesc!.alphaSliceByteOffset > 0
              ? imageDesc!.rgbSliceByteLength
              : 0;
          imageInfo.alphaByteLength = imageDesc!.alphaSliceByteLength;

          result = transcoder.transcodeImage(
            transcodeTarget,
            faceBuffer,
            imageInfo,
            0,
            isVideo
          );
        }

        if (result?.transcodedImage != null) {
          const transcodedTextureBuffer = result.transcodedImage
            .get_typed_memory_view()
            .slice() as ArrayBufferView;
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

  private __hasAlpha(
    dfd: KTX2DataFormatDescriptorBasicFormat,
    compressedTextureFormat: CompressedTextureFormat
  ) {
    if (compressedTextureFormat === CompressedTextureFormat.UASTC4x4) {
      return dfd.samples[0].channelID === KTX2ChannelUASTC.RGBA;
    } else {
      return (
        dfd.samples.length === 2 &&
        (dfd.samples[0].channelID === KTX2ChannelETC1S.AAA ||
          dfd.samples[1].channelID === KTX2ChannelETC1S.AAA)
      );
    }
  }
}
