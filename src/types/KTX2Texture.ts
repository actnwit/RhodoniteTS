export type TextureFormat = {value: number};
type _TextureFormat = {
  ETC1S: TextureFormat;
  UASTC4x4: TextureFormat;
};

export type TranscodeTarget = {value: number};
type _TranscodeTarget = {
  ETC1_RGB: TranscodeTarget;
  BC1_RGB: TranscodeTarget;
  BC4_R: TranscodeTarget;
  BC5_RG: TranscodeTarget;
  BC3_RGBA: TranscodeTarget;
  PVRTC1_4_RGB: TranscodeTarget;
  PVRTC1_4_RGBA: TranscodeTarget;
  BC7_RGBA: TranscodeTarget;
  BC7_M6_RGB: TranscodeTarget;
  BC7_M5_RGBA: TranscodeTarget;
  ETC2_RGBA: TranscodeTarget;
  ASTC_4x4_RGBA: TranscodeTarget;
  RGBA32: TranscodeTarget;
  RGB565: TranscodeTarget;
  BGR565: TranscodeTarget;
  RGBA4444: TranscodeTarget;
  PVRTC2_4_RGB: TranscodeTarget;
  PVRTC2_4_RGBA: TranscodeTarget;
  EAC_R11: TranscodeTarget;
  EAC_RG11: TranscodeTarget;
};

export declare class ImageInfo {
  constructor(
    textureFormat: TextureFormat,
    levelWidth: number,
    levelHeight: number,
    level: number
  );
  numBlocksX: number;
  numBlocksY: number;
  flags: number;
  rgbByteOffset: number;
  rgbByteLength: number;
  alphaByteOffset: number;
  alphaByteLength: number;
}

type _ImageInfo = new (
  textureFormat: TextureFormat,
  levelWidth: number,
  levelHeight: number,
  level: number
) => ImageInfo;

export type TranscodedImage = {
  transcodedImage: {
    get_typed_memory_view: () => Uint8Array;
    delete: () => void;
  };
};

export declare class UastcImageTranscoder {
  transcodeImage: (
    transcodeTarget: TranscodeTarget,
    faceBuffer: Uint8Array,
    imageInfo: ImageInfo,
    decodeFlags: 0,
    hasAlpha: boolean,
    isVideo: boolean
  ) => TranscodedImage | undefined;
}

export declare class BasisLzEtc1sImageTranscoder {
  transcodeImage: (
    transcodeTarget: TranscodeTarget,
    faceBuffer: Uint8Array,
    imageInfo: ImageInfo,
    decodeFlags: 0,
    isVideo: boolean
  ) => TranscodedImage | undefined;
  decodePalettes: (
    numEndpoints: number,
    endpoints: Uint8Array,
    numSelectors: number,
    selectors: Uint8Array
  ) => void;
  decodeTables: (tables: Uint8Array) => void;
}

export type MscTranscoderModule = {
  initTranscoders: () => void;
  TextureFormat: _TextureFormat;
  TranscodeTarget: _TranscodeTarget;
  ImageInfo: _ImageInfo;
  UastcImageTranscoder: new () => UastcImageTranscoder;
  BasisLzEtc1sImageTranscoder: new () => BasisLzEtc1sImageTranscoder;
};

export type MSC_TRANSCODER = () => Promise<MscTranscoderModule>;
