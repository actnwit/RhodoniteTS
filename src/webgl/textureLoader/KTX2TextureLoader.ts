import {KTX2Container, KTX2Model, KTX2Transfer, read} from 'ktx-parse';
import CGAPIResourceRepository from '../../foundation/renderer/CGAPIResourceRepository';
import WebGLContextWrapper from '../WebGLContextWrapper';
import {TextureData} from '../WebGLResourceRepository';
import {
  CompressionTextureType,
  CompressionTextureTypeEnum,
} from '../../foundation/definitions/CompressionTextureType';

enum CompressedTextureFormat {
  ETC1S = 0,
  UASTC4x4 = 1,
}

enum TranscodeTarget {
  ETC1_RGB,
  BC1_RGB,
  BC4_R,
  BC5_RG,
  BC3_RGBA,
  PVRTC1_4_RGB,
  PVRTC1_4_RGBA,
  BC7_RGBA,
  BC7_M6_RGB,
  BC7_M5_RGBA,
  ETC2_RGBA,
  ASTC_4x4_RGBA,
  RGBA32,
  RGB565,
  BGR565,
  RGBA4444,
  PVRTC2_4_RGB,
  PVRTC2_4_RGBA,
  EAC_R11,
  EAC_RG11,
}

declare const MSC_TRANSCODER: any;

export default class KTX2TextureLoader {
  private static __instance: KTX2TextureLoader;

  // TODO: create type of __mscTranscoderModule
  private static __mscTranscoderModule: any;

  private __transcodeTarget: TranscodeTarget;
  private __compressionTextureType: CompressionTextureTypeEnum;

  private __mscTranscoderPromise: Promise<void>;

  constructor() {
    if (typeof MSC_TRANSCODER === 'undefined') {
      console.error(
        'Failed to call MSC_TRANSCODER() function. Please check to import msc_basis_transcoder.js.'
      );
    }
    this.__mscTranscoderPromise = this.__loadMSCTranscoder();

    const {transcodeTarget, compressionTextureType} =
      this.__getDeviceDependentParameters();
    this.__transcodeTarget = transcodeTarget;
    this.__compressionTextureType = compressionTextureType;
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

    // TODO: support super compressions
    return this.__mscTranscoderPromise.then(() => {
      return this.__transcodeData(ktx2Container);
    });
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

  private __getDeviceDependentParameters() {
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

    let transcodeTarget;
    let compressionTextureType;
    if (astc) {
      transcodeTarget = TranscodeTarget.ASTC_4x4_RGBA;
      compressionTextureType = CompressionTextureType.ASTC_RGBA_4x4;
    } else if (bptc) {
      transcodeTarget = TranscodeTarget.BC7_RGBA;
      compressionTextureType = CompressionTextureType.BPTC_RGBA;
    } else if (s3tc) {
      // TODO: no-alpha case
      transcodeTarget = TranscodeTarget.BC3_RGBA;
      compressionTextureType = CompressionTextureType.S3TC_RGBA_DXT5;
    } else if (pvrtc) {
      // TODO: no-alpha case
      transcodeTarget = TranscodeTarget.PVRTC1_4_RGBA;
      compressionTextureType = CompressionTextureType.PVRTC_RGBA_4BPPV1;
    } else if (etc2) {
      // TODO: no-alpha case
      transcodeTarget = TranscodeTarget.ETC2_RGBA;
      compressionTextureType = CompressionTextureType.ETC2_RGBA8_EAC;
    } else if (etc1) {
      transcodeTarget = TranscodeTarget.ETC1_RGB;
      compressionTextureType = CompressionTextureType.ETC1_RGB;
    } else {
      transcodeTarget = TranscodeTarget.RGBA32;
      compressionTextureType = CompressionTextureType.RGBA8_EXT;
    }

    return {transcodeTarget, compressionTextureType};
  }

  private __parse(uint8Array: Uint8Array): KTX2Container {
    // The parser can detect an invalid identifier.
    return read(uint8Array);
  }

  private __transcodeData(ktx2Container: KTX2Container) {
    const width = ktx2Container.pixelWidth;
    const height = ktx2Container.pixelHeight;
    const faceCount = ktx2Container.faceCount; // faceCount is 6 if the transcoded data is a cube map (not support yet)

    const dfd = ktx2Container.dataFormatDescriptor[0];
    const compressedTextureFormat =
      dfd.colorModel === KTX2Model.UASTC
        ? CompressedTextureFormat.UASTC4x4
        : CompressedTextureFormat.ETC1S;

    //  TODO: compute hasAlpha
    const hasAlpha = true;
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

    // TODO: change value depending on having Alpha and so on
    const transcodeTargetStr = TranscodeTarget[this.__transcodeTarget];
    const transcodeTarget =
      transcoderModule.TranscodeTarget[transcodeTargetStr];
    const compressionTextureType = this.__compressionTextureType;

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

      const levelBuffer = ktx2Container.levels[level].levelData;
      const levelUncompressedByteLength =
        ktx2Container.levels[level].uncompressedByteLength;

      for (let faceIndex = 0; faceIndex < faceCount; faceIndex++) {
        let result: any;

        // TODO: support the other texture format
        if (compressedTextureFormat === CompressedTextureFormat.UASTC4x4) {
          imageInfo.flags = 0;
          imageInfo.rgbByteOffset = 0;
          imageInfo.rgbByteLength = levelUncompressedByteLength;
          imageInfo.alphaByteOffset = 0;
          imageInfo.alphaByteLength = 0;

          result = transcoder.transcodeImage(
            transcodeTarget,
            levelBuffer,
            imageInfo,
            0,
            hasAlpha,
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
}
