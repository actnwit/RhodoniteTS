import {
  __publicField
} from "./chunk-MHR6JRBZ.js";

// node_modules/.pnpm/ktx-parse@2.0.0/node_modules/ktx-parse/dist/index.mjs
var KHR_SUPERCOMPRESSION_NONE = 0;
var KHR_SUPERCOMPRESSION_BASISLZ = 1;
var KHR_SUPERCOMPRESSION_ZSTD = 2;
var KHR_SUPERCOMPRESSION_ZLIB = 3;
var KHR_DF_KHR_DESCRIPTORTYPE_BASICFORMAT = 0;
var KHR_DF_VENDORID_KHRONOS = 0;
var KHR_DF_VERSION = 2;
var KHR_DF_MODEL_UNSPECIFIED = 0;
var KHR_DF_MODEL_RGBSDA = 1;
var KHR_DF_MODEL_ETC1 = 160;
var KHR_DF_MODEL_ETC2 = 161;
var KHR_DF_MODEL_ASTC = 162;
var KHR_DF_MODEL_ETC1S = 163;
var KHR_DF_MODEL_UASTC = 166;
var KHR_DF_FLAG_ALPHA_STRAIGHT = 0;
var KHR_DF_FLAG_ALPHA_PREMULTIPLIED = 1;
var KHR_DF_TRANSFER_UNSPECIFIED = 0;
var KHR_DF_TRANSFER_LINEAR = 1;
var KHR_DF_TRANSFER_SRGB = 2;
var KHR_DF_TRANSFER_ITU = 3;
var KHR_DF_TRANSFER_NTSC = 4;
var KHR_DF_TRANSFER_SLOG = 5;
var KHR_DF_TRANSFER_SLOG2 = 6;
var KHR_DF_TRANSFER_BT1886 = 7;
var KHR_DF_TRANSFER_HLG_OETF = 8;
var KHR_DF_TRANSFER_HLG_EOTF = 9;
var KHR_DF_TRANSFER_PQ_EOTF = 10;
var KHR_DF_TRANSFER_PQ_OETF = 11;
var KHR_DF_TRANSFER_DCIP3 = 12;
var KHR_DF_TRANSFER_PAL_OETF = 13;
var KHR_DF_TRANSFER_PAL625_EOTF = 14;
var KHR_DF_TRANSFER_ST240 = 15;
var KHR_DF_TRANSFER_ACESCC = 16;
var KHR_DF_TRANSFER_ACESCCT = 17;
var KHR_DF_TRANSFER_ADOBERGB = 18;
var KHR_DF_PRIMARIES_UNSPECIFIED = 0;
var KHR_DF_PRIMARIES_BT709 = 1;
var KHR_DF_PRIMARIES_BT601_EBU = 2;
var KHR_DF_PRIMARIES_BT601_SMPTE = 3;
var KHR_DF_PRIMARIES_BT2020 = 4;
var KHR_DF_PRIMARIES_CIEXYZ = 5;
var KHR_DF_PRIMARIES_ACES = 6;
var KHR_DF_PRIMARIES_ACESCC = 7;
var KHR_DF_PRIMARIES_NTSC1953 = 8;
var KHR_DF_PRIMARIES_PAL525 = 9;
var KHR_DF_PRIMARIES_DISPLAYP3 = 10;
var KHR_DF_PRIMARIES_ADOBERGB = 11;
var KHR_DF_CHANNEL_RGBSDA_RED = 0;
var KHR_DF_CHANNEL_RGBSDA_GREEN = 1;
var KHR_DF_CHANNEL_RGBSDA_BLUE = 2;
var KHR_DF_CHANNEL_RGBSDA_STENCIL = 13;
var KHR_DF_CHANNEL_RGBSDA_DEPTH = 14;
var KHR_DF_CHANNEL_RGBSDA_ALPHA = 15;
var KHR_DF_SAMPLE_DATATYPE_FLOAT = 128;
var KHR_DF_SAMPLE_DATATYPE_SIGNED = 64;
var KHR_DF_SAMPLE_DATATYPE_EXPONENT = 32;
var KHR_DF_SAMPLE_DATATYPE_LINEAR = 16;
var VK_FORMAT_UNDEFINED = 0;
var VK_FORMAT_R4G4_UNORM_PACK8 = 1;
var VK_FORMAT_R4G4B4A4_UNORM_PACK16 = 2;
var VK_FORMAT_B4G4R4A4_UNORM_PACK16 = 3;
var VK_FORMAT_R5G6B5_UNORM_PACK16 = 4;
var VK_FORMAT_B5G6R5_UNORM_PACK16 = 5;
var VK_FORMAT_R5G5B5A1_UNORM_PACK16 = 6;
var VK_FORMAT_B5G5R5A1_UNORM_PACK16 = 7;
var VK_FORMAT_A1R5G5B5_UNORM_PACK16 = 8;
var VK_FORMAT_R8_UNORM = 9;
var VK_FORMAT_R8_SNORM = 10;
var VK_FORMAT_R8_UINT = 13;
var VK_FORMAT_R8_SINT = 14;
var VK_FORMAT_R8_SRGB = 15;
var VK_FORMAT_R8G8_UNORM = 16;
var VK_FORMAT_R8G8_SNORM = 17;
var VK_FORMAT_R8G8_UINT = 20;
var VK_FORMAT_R8G8_SINT = 21;
var VK_FORMAT_R8G8_SRGB = 22;
var VK_FORMAT_R8G8B8_UNORM = 23;
var VK_FORMAT_R8G8B8_SNORM = 24;
var VK_FORMAT_R8G8B8_UINT = 27;
var VK_FORMAT_R8G8B8_SINT = 28;
var VK_FORMAT_R8G8B8_SRGB = 29;
var VK_FORMAT_B8G8R8_UNORM = 30;
var VK_FORMAT_B8G8R8_SNORM = 31;
var VK_FORMAT_B8G8R8_UINT = 34;
var VK_FORMAT_B8G8R8_SINT = 35;
var VK_FORMAT_B8G8R8_SRGB = 36;
var VK_FORMAT_R8G8B8A8_UNORM = 37;
var VK_FORMAT_R8G8B8A8_SNORM = 38;
var VK_FORMAT_R8G8B8A8_UINT = 41;
var VK_FORMAT_R8G8B8A8_SINT = 42;
var VK_FORMAT_R8G8B8A8_SRGB = 43;
var VK_FORMAT_B8G8R8A8_UNORM = 44;
var VK_FORMAT_B8G8R8A8_SNORM = 45;
var VK_FORMAT_B8G8R8A8_UINT = 48;
var VK_FORMAT_B8G8R8A8_SINT = 49;
var VK_FORMAT_B8G8R8A8_SRGB = 50;
var VK_FORMAT_A2R10G10B10_UNORM_PACK32 = 58;
var VK_FORMAT_A2R10G10B10_SNORM_PACK32 = 59;
var VK_FORMAT_A2R10G10B10_UINT_PACK32 = 62;
var VK_FORMAT_A2R10G10B10_SINT_PACK32 = 63;
var VK_FORMAT_A2B10G10R10_UNORM_PACK32 = 64;
var VK_FORMAT_A2B10G10R10_SNORM_PACK32 = 65;
var VK_FORMAT_A2B10G10R10_UINT_PACK32 = 68;
var VK_FORMAT_A2B10G10R10_SINT_PACK32 = 69;
var VK_FORMAT_R16_UNORM = 70;
var VK_FORMAT_R16_SNORM = 71;
var VK_FORMAT_R16_UINT = 74;
var VK_FORMAT_R16_SINT = 75;
var VK_FORMAT_R16_SFLOAT = 76;
var VK_FORMAT_R16G16_UNORM = 77;
var VK_FORMAT_R16G16_SNORM = 78;
var VK_FORMAT_R16G16_UINT = 81;
var VK_FORMAT_R16G16_SINT = 82;
var VK_FORMAT_R16G16_SFLOAT = 83;
var VK_FORMAT_R16G16B16_UNORM = 84;
var VK_FORMAT_R16G16B16_SNORM = 85;
var VK_FORMAT_R16G16B16_UINT = 88;
var VK_FORMAT_R16G16B16_SINT = 89;
var VK_FORMAT_R16G16B16_SFLOAT = 90;
var VK_FORMAT_R16G16B16A16_UNORM = 91;
var VK_FORMAT_R16G16B16A16_SNORM = 92;
var VK_FORMAT_R16G16B16A16_UINT = 95;
var VK_FORMAT_R16G16B16A16_SINT = 96;
var VK_FORMAT_R16G16B16A16_SFLOAT = 97;
var VK_FORMAT_R32_UINT = 98;
var VK_FORMAT_R32_SINT = 99;
var VK_FORMAT_R32_SFLOAT = 100;
var VK_FORMAT_R32G32_UINT = 101;
var VK_FORMAT_R32G32_SINT = 102;
var VK_FORMAT_R32G32_SFLOAT = 103;
var VK_FORMAT_R32G32B32_UINT = 104;
var VK_FORMAT_R32G32B32_SINT = 105;
var VK_FORMAT_R32G32B32_SFLOAT = 106;
var VK_FORMAT_R32G32B32A32_UINT = 107;
var VK_FORMAT_R32G32B32A32_SINT = 108;
var VK_FORMAT_R32G32B32A32_SFLOAT = 109;
var VK_FORMAT_R64_UINT = 110;
var VK_FORMAT_R64_SINT = 111;
var VK_FORMAT_R64_SFLOAT = 112;
var VK_FORMAT_R64G64_UINT = 113;
var VK_FORMAT_R64G64_SINT = 114;
var VK_FORMAT_R64G64_SFLOAT = 115;
var VK_FORMAT_R64G64B64_UINT = 116;
var VK_FORMAT_R64G64B64_SINT = 117;
var VK_FORMAT_R64G64B64_SFLOAT = 118;
var VK_FORMAT_R64G64B64A64_UINT = 119;
var VK_FORMAT_R64G64B64A64_SINT = 120;
var VK_FORMAT_R64G64B64A64_SFLOAT = 121;
var VK_FORMAT_B10G11R11_UFLOAT_PACK32 = 122;
var VK_FORMAT_E5B9G9R9_UFLOAT_PACK32 = 123;
var VK_FORMAT_D16_UNORM = 124;
var VK_FORMAT_X8_D24_UNORM_PACK32 = 125;
var VK_FORMAT_D32_SFLOAT = 126;
var VK_FORMAT_S8_UINT = 127;
var VK_FORMAT_D16_UNORM_S8_UINT = 128;
var VK_FORMAT_D24_UNORM_S8_UINT = 129;
var VK_FORMAT_D32_SFLOAT_S8_UINT = 130;
var VK_FORMAT_BC1_RGB_UNORM_BLOCK = 131;
var VK_FORMAT_BC1_RGB_SRGB_BLOCK = 132;
var VK_FORMAT_BC1_RGBA_UNORM_BLOCK = 133;
var VK_FORMAT_BC1_RGBA_SRGB_BLOCK = 134;
var VK_FORMAT_BC2_UNORM_BLOCK = 135;
var VK_FORMAT_BC2_SRGB_BLOCK = 136;
var VK_FORMAT_BC3_UNORM_BLOCK = 137;
var VK_FORMAT_BC3_SRGB_BLOCK = 138;
var VK_FORMAT_BC4_UNORM_BLOCK = 139;
var VK_FORMAT_BC4_SNORM_BLOCK = 140;
var VK_FORMAT_BC5_UNORM_BLOCK = 141;
var VK_FORMAT_BC5_SNORM_BLOCK = 142;
var VK_FORMAT_BC6H_UFLOAT_BLOCK = 143;
var VK_FORMAT_BC6H_SFLOAT_BLOCK = 144;
var VK_FORMAT_BC7_UNORM_BLOCK = 145;
var VK_FORMAT_BC7_SRGB_BLOCK = 146;
var VK_FORMAT_ETC2_R8G8B8_UNORM_BLOCK = 147;
var VK_FORMAT_ETC2_R8G8B8_SRGB_BLOCK = 148;
var VK_FORMAT_ETC2_R8G8B8A1_UNORM_BLOCK = 149;
var VK_FORMAT_ETC2_R8G8B8A1_SRGB_BLOCK = 150;
var VK_FORMAT_ETC2_R8G8B8A8_UNORM_BLOCK = 151;
var VK_FORMAT_ETC2_R8G8B8A8_SRGB_BLOCK = 152;
var VK_FORMAT_EAC_R11_UNORM_BLOCK = 153;
var VK_FORMAT_EAC_R11_SNORM_BLOCK = 154;
var VK_FORMAT_EAC_R11G11_UNORM_BLOCK = 155;
var VK_FORMAT_EAC_R11G11_SNORM_BLOCK = 156;
var VK_FORMAT_ASTC_4x4_UNORM_BLOCK = 157;
var VK_FORMAT_ASTC_4x4_SRGB_BLOCK = 158;
var VK_FORMAT_ASTC_5x4_UNORM_BLOCK = 159;
var VK_FORMAT_ASTC_5x4_SRGB_BLOCK = 160;
var VK_FORMAT_ASTC_5x5_UNORM_BLOCK = 161;
var VK_FORMAT_ASTC_5x5_SRGB_BLOCK = 162;
var VK_FORMAT_ASTC_6x5_UNORM_BLOCK = 163;
var VK_FORMAT_ASTC_6x5_SRGB_BLOCK = 164;
var VK_FORMAT_ASTC_6x6_UNORM_BLOCK = 165;
var VK_FORMAT_ASTC_6x6_SRGB_BLOCK = 166;
var VK_FORMAT_ASTC_8x5_UNORM_BLOCK = 167;
var VK_FORMAT_ASTC_8x5_SRGB_BLOCK = 168;
var VK_FORMAT_ASTC_8x6_UNORM_BLOCK = 169;
var VK_FORMAT_ASTC_8x6_SRGB_BLOCK = 170;
var VK_FORMAT_ASTC_8x8_UNORM_BLOCK = 171;
var VK_FORMAT_ASTC_8x8_SRGB_BLOCK = 172;
var VK_FORMAT_ASTC_10x5_UNORM_BLOCK = 173;
var VK_FORMAT_ASTC_10x5_SRGB_BLOCK = 174;
var VK_FORMAT_ASTC_10x6_UNORM_BLOCK = 175;
var VK_FORMAT_ASTC_10x6_SRGB_BLOCK = 176;
var VK_FORMAT_ASTC_10x8_UNORM_BLOCK = 177;
var VK_FORMAT_ASTC_10x8_SRGB_BLOCK = 178;
var VK_FORMAT_ASTC_10x10_UNORM_BLOCK = 179;
var VK_FORMAT_ASTC_10x10_SRGB_BLOCK = 180;
var VK_FORMAT_ASTC_12x10_UNORM_BLOCK = 181;
var VK_FORMAT_ASTC_12x10_SRGB_BLOCK = 182;
var VK_FORMAT_ASTC_12x12_UNORM_BLOCK = 183;
var VK_FORMAT_ASTC_12x12_SRGB_BLOCK = 184;
var VK_FORMAT_R10X6_UNORM_PACK16 = 1000156007;
var VK_FORMAT_R10X6G10X6_UNORM_2PACK16 = 1000156008;
var VK_FORMAT_R10X6G10X6B10X6A10X6_UNORM_4PACK16 = 1000156009;
var VK_FORMAT_G10X6B10X6G10X6R10X6_422_UNORM_4PACK16 = 1000156010;
var VK_FORMAT_B10X6G10X6R10X6G10X6_422_UNORM_4PACK16 = 1000156011;
var VK_FORMAT_R12X4_UNORM_PACK16 = 1000156017;
var VK_FORMAT_R12X4G12X4_UNORM_2PACK16 = 1000156018;
var VK_FORMAT_R12X4G12X4B12X4A12X4_UNORM_4PACK16 = 1000156019;
var VK_FORMAT_G12X4B12X4G12X4R12X4_422_UNORM_4PACK16 = 1000156020;
var VK_FORMAT_B12X4G12X4R12X4G12X4_422_UNORM_4PACK16 = 1000156021;
var VK_FORMAT_PVRTC1_2BPP_UNORM_BLOCK_IMG = 1000054e3;
var VK_FORMAT_PVRTC1_4BPP_UNORM_BLOCK_IMG = 1000054001;
var VK_FORMAT_PVRTC2_2BPP_UNORM_BLOCK_IMG = 1000054002;
var VK_FORMAT_PVRTC2_4BPP_UNORM_BLOCK_IMG = 1000054003;
var VK_FORMAT_PVRTC1_2BPP_SRGB_BLOCK_IMG = 1000054004;
var VK_FORMAT_PVRTC1_4BPP_SRGB_BLOCK_IMG = 1000054005;
var VK_FORMAT_PVRTC2_2BPP_SRGB_BLOCK_IMG = 1000054006;
var VK_FORMAT_PVRTC2_4BPP_SRGB_BLOCK_IMG = 1000054007;
var VK_FORMAT_ASTC_4x4_SFLOAT_BLOCK_EXT = 1000066e3;
var VK_FORMAT_ASTC_5x4_SFLOAT_BLOCK_EXT = 1000066001;
var VK_FORMAT_ASTC_5x5_SFLOAT_BLOCK_EXT = 1000066002;
var VK_FORMAT_ASTC_6x5_SFLOAT_BLOCK_EXT = 1000066003;
var VK_FORMAT_ASTC_6x6_SFLOAT_BLOCK_EXT = 1000066004;
var VK_FORMAT_ASTC_8x5_SFLOAT_BLOCK_EXT = 1000066005;
var VK_FORMAT_ASTC_8x6_SFLOAT_BLOCK_EXT = 1000066006;
var VK_FORMAT_ASTC_8x8_SFLOAT_BLOCK_EXT = 1000066007;
var VK_FORMAT_ASTC_10x5_SFLOAT_BLOCK_EXT = 1000066008;
var VK_FORMAT_ASTC_10x6_SFLOAT_BLOCK_EXT = 1000066009;
var VK_FORMAT_ASTC_10x8_SFLOAT_BLOCK_EXT = 1000066010;
var VK_FORMAT_ASTC_10x10_SFLOAT_BLOCK_EXT = 1000066011;
var VK_FORMAT_ASTC_12x10_SFLOAT_BLOCK_EXT = 1000066012;
var VK_FORMAT_ASTC_12x12_SFLOAT_BLOCK_EXT = 1000066013;
var VK_FORMAT_A4R4G4B4_UNORM_PACK16_EXT = 100034e4;
var VK_FORMAT_A4B4G4R4_UNORM_PACK16_EXT = 1000340001;
function createDefaultContainer() {
  return {
    vkFormat: 0,
    typeSize: 1,
    pixelWidth: 0,
    pixelHeight: 0,
    pixelDepth: 0,
    layerCount: 0,
    faceCount: 1,
    levelCount: 0,
    supercompressionScheme: 0,
    levels: [],
    dataFormatDescriptor: [{
      vendorId: 0,
      descriptorType: 0,
      versionNumber: 2,
      colorModel: 0,
      colorPrimaries: 1,
      transferFunction: 2,
      flags: 0,
      texelBlockDimension: [
        0,
        0,
        0,
        0
      ],
      bytesPlane: [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      samples: []
    }],
    keyValue: {},
    globalData: null
  };
}
var BufferReader = class {
  constructor(data, byteOffset, byteLength, littleEndian) {
    __publicField(this, "_dataView");
    __publicField(this, "_littleEndian");
    __publicField(this, "_offset");
    this._dataView = new DataView(data.buffer, data.byteOffset + byteOffset, byteLength);
    this._littleEndian = littleEndian;
    this._offset = 0;
  }
  _nextUint8() {
    const value = this._dataView.getUint8(this._offset);
    this._offset += 1;
    return value;
  }
  _nextUint16() {
    const value = this._dataView.getUint16(this._offset, this._littleEndian);
    this._offset += 2;
    return value;
  }
  _nextUint32() {
    const value = this._dataView.getUint32(this._offset, this._littleEndian);
    this._offset += 4;
    return value;
  }
  _nextUint64() {
    const value = this._dataView.getUint32(this._offset, this._littleEndian) + 2 ** 32 * this._dataView.getUint32(this._offset + 4, this._littleEndian);
    this._offset += 8;
    return value;
  }
  _nextInt32() {
    const value = this._dataView.getInt32(this._offset, this._littleEndian);
    this._offset += 4;
    return value;
  }
  _nextUint8Array(len) {
    const value = new Uint8Array(this._dataView.buffer, this._dataView.byteOffset + this._offset, len);
    this._offset += len;
    return value;
  }
  _skip(bytes) {
    this._offset += bytes;
    return this;
  }
  _scan(maxByteLength, term = 0) {
    const byteOffset = this._offset;
    let byteLength = 0;
    while (this._dataView.getUint8(this._offset) !== term && byteLength < maxByteLength) {
      byteLength++;
      this._offset++;
    }
    if (byteLength < maxByteLength) this._offset++;
    return new Uint8Array(this._dataView.buffer, this._dataView.byteOffset + byteOffset, byteLength);
  }
};
var KTX_WRITER = `KTX-Parse v2.0.0`;
var NUL = new Uint8Array([0]);
var KTX2_ID = [
  171,
  75,
  84,
  88,
  32,
  50,
  48,
  187,
  13,
  10,
  26,
  10
];
function encodeText(text) {
  return new TextEncoder().encode(text);
}
function decodeText(buffer) {
  return new TextDecoder().decode(buffer);
}
function concat(buffers) {
  let totalByteLength = 0;
  for (const buffer of buffers) totalByteLength += buffer.byteLength;
  const result = new Uint8Array(totalByteLength);
  let byteOffset = 0;
  for (const buffer of buffers) {
    result.set(new Uint8Array(buffer), byteOffset);
    byteOffset += buffer.byteLength;
  }
  return result;
}
function toView(view) {
  if (view instanceof Uint8Array) return view;
  if (view instanceof ArrayBuffer) return new Uint8Array(view);
  return new Uint8Array(view.buffer, view.byteOffset, view.byteLength / Uint8Array.BYTES_PER_ELEMENT);
}
function leastCommonMultiple(a, b) {
  const max = Math.max(a, b);
  const min = Math.min(a, b);
  let lcm = max;
  while (lcm % min !== 0) lcm += max;
  return lcm;
}
function getPadding(v, n = 4) {
  return Math.ceil(v / n) * n - v;
}
function getBlockByteLength(container) {
  return container.levels[0].levelData.byteLength / getBlockCount(container, 0);
}
function getBlockCount(container, levelIndex) {
  let blockCount = 1;
  const pixelDimensions = [
    container.pixelWidth,
    container.pixelHeight,
    container.pixelDepth
  ];
  const blockDimensions = getBlockDimensions(container);
  for (let i = 0; i < 3; i++) if (pixelDimensions[i] > 0) {
    const dimBlockCount = Math.ceil(Math.floor(pixelDimensions[i] * 2 ** -levelIndex) / blockDimensions[i]);
    blockCount *= Math.max(1, dimBlockCount);
  }
  if (container.layerCount > 0) blockCount *= container.layerCount;
  if (container.faceCount > 0) blockCount *= container.faceCount;
  return blockCount;
}
function getBlockDimensions(container) {
  const [x, y, z] = container.dataFormatDescriptor[0].texelBlockDimension;
  return [
    x + 1,
    y + 1,
    z + 1
  ];
}
function read(data) {
  const bytes = data;
  const id = new Uint8Array(bytes.buffer, bytes.byteOffset, KTX2_ID.length);
  if (id[0] !== KTX2_ID[0] || id[1] !== KTX2_ID[1] || id[2] !== KTX2_ID[2] || id[3] !== KTX2_ID[3] || id[4] !== KTX2_ID[4] || id[5] !== KTX2_ID[5] || id[6] !== KTX2_ID[6] || id[7] !== KTX2_ID[7] || id[8] !== KTX2_ID[8] || id[9] !== KTX2_ID[9] || id[10] !== KTX2_ID[10] || id[11] !== KTX2_ID[11]) throw new Error("Missing KTX 2.0 identifier.");
  const container = createDefaultContainer();
  const headerByteLength = 17 * Uint32Array.BYTES_PER_ELEMENT;
  const headerReader = new BufferReader(bytes, KTX2_ID.length, headerByteLength, true);
  container.vkFormat = headerReader._nextUint32();
  container.typeSize = headerReader._nextUint32();
  container.pixelWidth = headerReader._nextUint32();
  container.pixelHeight = headerReader._nextUint32();
  container.pixelDepth = headerReader._nextUint32();
  container.layerCount = headerReader._nextUint32();
  container.faceCount = headerReader._nextUint32();
  container.levelCount = headerReader._nextUint32();
  container.supercompressionScheme = headerReader._nextUint32();
  const dfdByteOffset = headerReader._nextUint32();
  const dfdByteLength = headerReader._nextUint32();
  const kvdByteOffset = headerReader._nextUint32();
  const kvdByteLength = headerReader._nextUint32();
  const sgdByteOffset = headerReader._nextUint64();
  const sgdByteLength = headerReader._nextUint64();
  const levelByteLength = Math.max(container.levelCount, 1) * 3 * 8;
  const levelReader = new BufferReader(bytes, KTX2_ID.length + headerByteLength, levelByteLength, true);
  for (let i = 0, il = Math.max(container.levelCount, 1); i < il; i++) container.levels.push({
    levelData: new Uint8Array(bytes.buffer, bytes.byteOffset + levelReader._nextUint64(), levelReader._nextUint64()),
    uncompressedByteLength: levelReader._nextUint64()
  });
  const dfdReader = new BufferReader(bytes, dfdByteOffset, dfdByteLength, true);
  dfdReader._skip(4);
  const vendorId = dfdReader._nextUint16();
  const descriptorType = dfdReader._nextUint16();
  const versionNumber = dfdReader._nextUint16();
  const descriptorBlockSize = dfdReader._nextUint16();
  const dfd = {
    vendorId,
    descriptorType,
    versionNumber,
    colorModel: dfdReader._nextUint8(),
    colorPrimaries: dfdReader._nextUint8(),
    transferFunction: dfdReader._nextUint8(),
    flags: dfdReader._nextUint8(),
    texelBlockDimension: [
      dfdReader._nextUint8(),
      dfdReader._nextUint8(),
      dfdReader._nextUint8(),
      dfdReader._nextUint8()
    ],
    bytesPlane: [
      dfdReader._nextUint8(),
      dfdReader._nextUint8(),
      dfdReader._nextUint8(),
      dfdReader._nextUint8(),
      dfdReader._nextUint8(),
      dfdReader._nextUint8(),
      dfdReader._nextUint8(),
      dfdReader._nextUint8()
    ],
    samples: []
  };
  const numSamples = (descriptorBlockSize / 4 - 6) / 4;
  for (let i = 0; i < numSamples; i++) {
    const sample = {
      bitOffset: dfdReader._nextUint16(),
      bitLength: dfdReader._nextUint8(),
      channelType: dfdReader._nextUint8(),
      samplePosition: [
        dfdReader._nextUint8(),
        dfdReader._nextUint8(),
        dfdReader._nextUint8(),
        dfdReader._nextUint8()
      ],
      sampleLower: Number.NEGATIVE_INFINITY,
      sampleUpper: Number.POSITIVE_INFINITY
    };
    if (sample.channelType & 64) {
      sample.sampleLower = dfdReader._nextInt32();
      sample.sampleUpper = dfdReader._nextInt32();
    } else {
      sample.sampleLower = dfdReader._nextUint32();
      sample.sampleUpper = dfdReader._nextUint32();
    }
    dfd.samples[i] = sample;
  }
  container.dataFormatDescriptor.length = 0;
  container.dataFormatDescriptor.push(dfd);
  const kvdReader = new BufferReader(bytes, kvdByteOffset, kvdByteLength, true);
  while (kvdReader._offset < kvdByteLength) {
    const keyValueByteLength = kvdReader._nextUint32();
    const keyData = kvdReader._scan(keyValueByteLength);
    const key = decodeText(keyData);
    container.keyValue[key] = kvdReader._nextUint8Array(keyValueByteLength - keyData.byteLength - 1);
    if (key.match(/^ktx/i)) {
      const text = decodeText(container.keyValue[key]);
      container.keyValue[key] = text.substring(0, text.lastIndexOf("\0"));
    }
    const kvPadding = keyValueByteLength % 4 ? 4 - keyValueByteLength % 4 : 0;
    kvdReader._skip(kvPadding);
  }
  if (sgdByteLength <= 0) return container;
  const sgdReader = new BufferReader(bytes, sgdByteOffset, sgdByteLength, true);
  const endpointCount = sgdReader._nextUint16();
  const selectorCount = sgdReader._nextUint16();
  const endpointsByteLength = sgdReader._nextUint32();
  const selectorsByteLength = sgdReader._nextUint32();
  const tablesByteLength = sgdReader._nextUint32();
  const extendedByteLength = sgdReader._nextUint32();
  const imageDescs = [];
  for (let i = 0, il = Math.max(container.levelCount, 1); i < il; i++) imageDescs.push({
    imageFlags: sgdReader._nextUint32(),
    rgbSliceByteOffset: sgdReader._nextUint32(),
    rgbSliceByteLength: sgdReader._nextUint32(),
    alphaSliceByteOffset: sgdReader._nextUint32(),
    alphaSliceByteLength: sgdReader._nextUint32()
  });
  const endpointsByteOffset = sgdByteOffset + sgdReader._offset;
  const selectorsByteOffset = endpointsByteOffset + endpointsByteLength;
  const tablesByteOffset = selectorsByteOffset + selectorsByteLength;
  const extendedByteOffset = tablesByteOffset + tablesByteLength;
  container.globalData = {
    endpointCount,
    selectorCount,
    imageDescs,
    endpointsData: new Uint8Array(bytes.buffer, bytes.byteOffset + endpointsByteOffset, endpointsByteLength),
    selectorsData: new Uint8Array(bytes.buffer, bytes.byteOffset + selectorsByteOffset, selectorsByteLength),
    tablesData: new Uint8Array(bytes.buffer, bytes.byteOffset + tablesByteOffset, tablesByteLength),
    extendedData: new Uint8Array(bytes.buffer, bytes.byteOffset + extendedByteOffset, extendedByteLength)
  };
  return container;
}
var DEFAULT_OPTIONS = { keepWriter: false };
function write(container, options = {}) {
  options = {
    ...DEFAULT_OPTIONS,
    ...options
  };
  let sgdBuffer = new Uint8Array(/* @__PURE__ */ new ArrayBuffer(0));
  if (container.globalData) {
    const sgdHeaderBuffer = /* @__PURE__ */ new ArrayBuffer(20 + container.globalData.imageDescs.length * 5 * 4);
    const sgdHeaderView = new DataView(sgdHeaderBuffer);
    sgdHeaderView.setUint16(0, container.globalData.endpointCount, true);
    sgdHeaderView.setUint16(2, container.globalData.selectorCount, true);
    sgdHeaderView.setUint32(4, container.globalData.endpointsData.byteLength, true);
    sgdHeaderView.setUint32(8, container.globalData.selectorsData.byteLength, true);
    sgdHeaderView.setUint32(12, container.globalData.tablesData.byteLength, true);
    sgdHeaderView.setUint32(16, container.globalData.extendedData.byteLength, true);
    for (let i = 0; i < container.globalData.imageDescs.length; i++) {
      const imageDesc = container.globalData.imageDescs[i];
      sgdHeaderView.setUint32(20 + i * 5 * 4 + 0, imageDesc.imageFlags, true);
      sgdHeaderView.setUint32(20 + i * 5 * 4 + 4, imageDesc.rgbSliceByteOffset, true);
      sgdHeaderView.setUint32(20 + i * 5 * 4 + 8, imageDesc.rgbSliceByteLength, true);
      sgdHeaderView.setUint32(20 + i * 5 * 4 + 12, imageDesc.alphaSliceByteOffset, true);
      sgdHeaderView.setUint32(20 + i * 5 * 4 + 16, imageDesc.alphaSliceByteLength, true);
    }
    sgdBuffer = concat([
      toView(sgdHeaderBuffer),
      container.globalData.endpointsData,
      container.globalData.selectorsData,
      container.globalData.tablesData,
      container.globalData.extendedData
    ]);
  }
  const keyValueData = [];
  const keyValueList = Object.entries({
    ...container.keyValue,
    ...!options.keepWriter && { KTXwriter: KTX_WRITER }
  });
  keyValueList.sort((a, b) => a[0] > b[0] ? 1 : -1);
  for (const [key, value] of keyValueList) {
    const keyData = encodeText(key);
    const valueData = typeof value === "string" ? concat([encodeText(value), NUL]) : value;
    const kvByteLength = keyData.byteLength + 1 + valueData.byteLength;
    const kvPadding = getPadding(kvByteLength, 4);
    keyValueData.push(concat([
      toView(new Uint32Array([kvByteLength])),
      keyData,
      NUL,
      valueData,
      new Uint8Array(kvPadding).fill(0)
    ]));
  }
  const kvdBuffer = concat(keyValueData);
  if (container.dataFormatDescriptor.length !== 1 || container.dataFormatDescriptor[0].descriptorType !== 0) throw new Error("Only BASICFORMAT Data Format Descriptor output supported.");
  const dfd = container.dataFormatDescriptor[0];
  const dfdBuffer = /* @__PURE__ */ new ArrayBuffer(28 + dfd.samples.length * 16);
  const dfdView = new DataView(dfdBuffer);
  const descriptorBlockSize = 24 + dfd.samples.length * 16;
  dfdView.setUint32(0, dfdBuffer.byteLength, true);
  dfdView.setUint16(4, dfd.vendorId, true);
  dfdView.setUint16(6, dfd.descriptorType, true);
  dfdView.setUint16(8, dfd.versionNumber, true);
  dfdView.setUint16(10, descriptorBlockSize, true);
  dfdView.setUint8(12, dfd.colorModel);
  dfdView.setUint8(13, dfd.colorPrimaries);
  dfdView.setUint8(14, dfd.transferFunction);
  dfdView.setUint8(15, dfd.flags);
  if (!Array.isArray(dfd.texelBlockDimension)) throw new Error("texelBlockDimension is now an array. For dimensionality `d`, set `d - 1`.");
  dfdView.setUint8(16, dfd.texelBlockDimension[0]);
  dfdView.setUint8(17, dfd.texelBlockDimension[1]);
  dfdView.setUint8(18, dfd.texelBlockDimension[2]);
  dfdView.setUint8(19, dfd.texelBlockDimension[3]);
  for (let i = 0; i < 8; i++) dfdView.setUint8(20 + i, dfd.bytesPlane[i]);
  for (let i = 0; i < dfd.samples.length; i++) {
    const sample = dfd.samples[i];
    const sampleByteOffset = 28 + i * 16;
    dfdView.setUint16(sampleByteOffset + 0, sample.bitOffset, true);
    dfdView.setUint8(sampleByteOffset + 2, sample.bitLength);
    dfdView.setUint8(sampleByteOffset + 3, sample.channelType);
    dfdView.setUint8(sampleByteOffset + 4, sample.samplePosition[0]);
    dfdView.setUint8(sampleByteOffset + 5, sample.samplePosition[1]);
    dfdView.setUint8(sampleByteOffset + 6, sample.samplePosition[2]);
    dfdView.setUint8(sampleByteOffset + 7, sample.samplePosition[3]);
    if (sample.channelType & 64) {
      dfdView.setInt32(sampleByteOffset + 8, sample.sampleLower, true);
      dfdView.setInt32(sampleByteOffset + 12, sample.sampleUpper, true);
    } else {
      dfdView.setUint32(sampleByteOffset + 8, sample.sampleLower, true);
      dfdView.setUint32(sampleByteOffset + 12, sample.sampleUpper, true);
    }
  }
  const dfdByteOffset = KTX2_ID.length + 68 + container.levels.length * 3 * 8;
  const kvdByteOffset = dfdByteOffset + dfdBuffer.byteLength;
  let sgdByteOffset = sgdBuffer.byteLength > 0 ? kvdByteOffset + kvdBuffer.byteLength : 0;
  if (sgdByteOffset % 8) sgdByteOffset += 8 - sgdByteOffset % 8;
  const levelData = [];
  const levelIndex = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(container.levels.length * 3 * 8));
  const levelDataByteOffsets = new Uint32Array(container.levels.length);
  let levelAlign = 0;
  if (container.supercompressionScheme === 0) levelAlign = leastCommonMultiple(getBlockByteLength(container), 4);
  let levelDataByteOffset = (sgdByteOffset || kvdByteOffset + kvdBuffer.byteLength) + sgdBuffer.byteLength;
  for (let i = container.levels.length - 1; i >= 0; i--) {
    if (levelDataByteOffset % levelAlign) {
      const paddingBytes = getPadding(levelDataByteOffset, levelAlign);
      levelData.push(new Uint8Array(paddingBytes));
      levelDataByteOffset += paddingBytes;
    }
    const level = container.levels[i];
    levelData.push(level.levelData);
    levelDataByteOffsets[i] = levelDataByteOffset;
    levelDataByteOffset += level.levelData.byteLength;
  }
  for (let i = 0; i < container.levels.length; i++) {
    const level = container.levels[i];
    levelIndex.setBigUint64(i * 24 + 0, BigInt(levelDataByteOffsets[i]), true);
    levelIndex.setBigUint64(i * 24 + 8, BigInt(level.levelData.byteLength), true);
    levelIndex.setBigUint64(i * 24 + 16, BigInt(level.uncompressedByteLength), true);
  }
  const headerBuffer = /* @__PURE__ */ new ArrayBuffer(68);
  const headerView = new DataView(headerBuffer);
  headerView.setUint32(0, container.vkFormat, true);
  headerView.setUint32(4, container.typeSize, true);
  headerView.setUint32(8, container.pixelWidth, true);
  headerView.setUint32(12, container.pixelHeight, true);
  headerView.setUint32(16, container.pixelDepth, true);
  headerView.setUint32(20, container.layerCount, true);
  headerView.setUint32(24, container.faceCount, true);
  headerView.setUint32(28, container.levelCount, true);
  headerView.setUint32(32, container.supercompressionScheme, true);
  headerView.setUint32(36, dfdByteOffset, true);
  headerView.setUint32(40, dfdBuffer.byteLength, true);
  headerView.setUint32(44, kvdByteOffset, true);
  headerView.setUint32(48, kvdBuffer.byteLength, true);
  headerView.setBigUint64(52, BigInt(sgdBuffer.byteLength > 0 ? sgdByteOffset : 0), true);
  headerView.setBigUint64(60, BigInt(sgdBuffer.byteLength), true);
  return new Uint8Array(concat([
    new Uint8Array(KTX2_ID),
    toView(headerBuffer),
    toView(levelIndex.buffer),
    toView(dfdBuffer),
    kvdBuffer,
    sgdByteOffset > 0 ? toView(new ArrayBuffer(sgdByteOffset - (kvdByteOffset + kvdBuffer.byteLength))) : toView(/* @__PURE__ */ new ArrayBuffer(0)),
    sgdBuffer,
    ...levelData
  ]));
}
export {
  KHR_DF_CHANNEL_RGBSDA_ALPHA,
  KHR_DF_CHANNEL_RGBSDA_BLUE,
  KHR_DF_CHANNEL_RGBSDA_DEPTH,
  KHR_DF_CHANNEL_RGBSDA_GREEN,
  KHR_DF_CHANNEL_RGBSDA_RED,
  KHR_DF_CHANNEL_RGBSDA_STENCIL,
  KHR_DF_FLAG_ALPHA_PREMULTIPLIED,
  KHR_DF_FLAG_ALPHA_STRAIGHT,
  KHR_DF_KHR_DESCRIPTORTYPE_BASICFORMAT,
  KHR_DF_MODEL_ASTC,
  KHR_DF_MODEL_ETC1,
  KHR_DF_MODEL_ETC1S,
  KHR_DF_MODEL_ETC2,
  KHR_DF_MODEL_RGBSDA,
  KHR_DF_MODEL_UASTC,
  KHR_DF_MODEL_UNSPECIFIED,
  KHR_DF_PRIMARIES_ACES,
  KHR_DF_PRIMARIES_ACESCC,
  KHR_DF_PRIMARIES_ADOBERGB,
  KHR_DF_PRIMARIES_BT2020,
  KHR_DF_PRIMARIES_BT601_EBU,
  KHR_DF_PRIMARIES_BT601_SMPTE,
  KHR_DF_PRIMARIES_BT709,
  KHR_DF_PRIMARIES_CIEXYZ,
  KHR_DF_PRIMARIES_DISPLAYP3,
  KHR_DF_PRIMARIES_NTSC1953,
  KHR_DF_PRIMARIES_PAL525,
  KHR_DF_PRIMARIES_UNSPECIFIED,
  KHR_DF_SAMPLE_DATATYPE_EXPONENT,
  KHR_DF_SAMPLE_DATATYPE_FLOAT,
  KHR_DF_SAMPLE_DATATYPE_LINEAR,
  KHR_DF_SAMPLE_DATATYPE_SIGNED,
  KHR_DF_TRANSFER_ACESCC,
  KHR_DF_TRANSFER_ACESCCT,
  KHR_DF_TRANSFER_ADOBERGB,
  KHR_DF_TRANSFER_BT1886,
  KHR_DF_TRANSFER_DCIP3,
  KHR_DF_TRANSFER_HLG_EOTF,
  KHR_DF_TRANSFER_HLG_OETF,
  KHR_DF_TRANSFER_ITU,
  KHR_DF_TRANSFER_LINEAR,
  KHR_DF_TRANSFER_NTSC,
  KHR_DF_TRANSFER_PAL625_EOTF,
  KHR_DF_TRANSFER_PAL_OETF,
  KHR_DF_TRANSFER_PQ_EOTF,
  KHR_DF_TRANSFER_PQ_OETF,
  KHR_DF_TRANSFER_SLOG,
  KHR_DF_TRANSFER_SLOG2,
  KHR_DF_TRANSFER_SRGB,
  KHR_DF_TRANSFER_ST240,
  KHR_DF_TRANSFER_UNSPECIFIED,
  KHR_DF_VENDORID_KHRONOS,
  KHR_DF_VERSION,
  KHR_SUPERCOMPRESSION_BASISLZ,
  KHR_SUPERCOMPRESSION_NONE,
  KHR_SUPERCOMPRESSION_ZLIB,
  KHR_SUPERCOMPRESSION_ZSTD,
  VK_FORMAT_A1R5G5B5_UNORM_PACK16,
  VK_FORMAT_A2B10G10R10_SINT_PACK32,
  VK_FORMAT_A2B10G10R10_SNORM_PACK32,
  VK_FORMAT_A2B10G10R10_UINT_PACK32,
  VK_FORMAT_A2B10G10R10_UNORM_PACK32,
  VK_FORMAT_A2R10G10B10_SINT_PACK32,
  VK_FORMAT_A2R10G10B10_SNORM_PACK32,
  VK_FORMAT_A2R10G10B10_UINT_PACK32,
  VK_FORMAT_A2R10G10B10_UNORM_PACK32,
  VK_FORMAT_A4B4G4R4_UNORM_PACK16_EXT,
  VK_FORMAT_A4R4G4B4_UNORM_PACK16_EXT,
  VK_FORMAT_ASTC_10x10_SFLOAT_BLOCK_EXT,
  VK_FORMAT_ASTC_10x10_SRGB_BLOCK,
  VK_FORMAT_ASTC_10x10_UNORM_BLOCK,
  VK_FORMAT_ASTC_10x5_SFLOAT_BLOCK_EXT,
  VK_FORMAT_ASTC_10x5_SRGB_BLOCK,
  VK_FORMAT_ASTC_10x5_UNORM_BLOCK,
  VK_FORMAT_ASTC_10x6_SFLOAT_BLOCK_EXT,
  VK_FORMAT_ASTC_10x6_SRGB_BLOCK,
  VK_FORMAT_ASTC_10x6_UNORM_BLOCK,
  VK_FORMAT_ASTC_10x8_SFLOAT_BLOCK_EXT,
  VK_FORMAT_ASTC_10x8_SRGB_BLOCK,
  VK_FORMAT_ASTC_10x8_UNORM_BLOCK,
  VK_FORMAT_ASTC_12x10_SFLOAT_BLOCK_EXT,
  VK_FORMAT_ASTC_12x10_SRGB_BLOCK,
  VK_FORMAT_ASTC_12x10_UNORM_BLOCK,
  VK_FORMAT_ASTC_12x12_SFLOAT_BLOCK_EXT,
  VK_FORMAT_ASTC_12x12_SRGB_BLOCK,
  VK_FORMAT_ASTC_12x12_UNORM_BLOCK,
  VK_FORMAT_ASTC_4x4_SFLOAT_BLOCK_EXT,
  VK_FORMAT_ASTC_4x4_SRGB_BLOCK,
  VK_FORMAT_ASTC_4x4_UNORM_BLOCK,
  VK_FORMAT_ASTC_5x4_SFLOAT_BLOCK_EXT,
  VK_FORMAT_ASTC_5x4_SRGB_BLOCK,
  VK_FORMAT_ASTC_5x4_UNORM_BLOCK,
  VK_FORMAT_ASTC_5x5_SFLOAT_BLOCK_EXT,
  VK_FORMAT_ASTC_5x5_SRGB_BLOCK,
  VK_FORMAT_ASTC_5x5_UNORM_BLOCK,
  VK_FORMAT_ASTC_6x5_SFLOAT_BLOCK_EXT,
  VK_FORMAT_ASTC_6x5_SRGB_BLOCK,
  VK_FORMAT_ASTC_6x5_UNORM_BLOCK,
  VK_FORMAT_ASTC_6x6_SFLOAT_BLOCK_EXT,
  VK_FORMAT_ASTC_6x6_SRGB_BLOCK,
  VK_FORMAT_ASTC_6x6_UNORM_BLOCK,
  VK_FORMAT_ASTC_8x5_SFLOAT_BLOCK_EXT,
  VK_FORMAT_ASTC_8x5_SRGB_BLOCK,
  VK_FORMAT_ASTC_8x5_UNORM_BLOCK,
  VK_FORMAT_ASTC_8x6_SFLOAT_BLOCK_EXT,
  VK_FORMAT_ASTC_8x6_SRGB_BLOCK,
  VK_FORMAT_ASTC_8x6_UNORM_BLOCK,
  VK_FORMAT_ASTC_8x8_SFLOAT_BLOCK_EXT,
  VK_FORMAT_ASTC_8x8_SRGB_BLOCK,
  VK_FORMAT_ASTC_8x8_UNORM_BLOCK,
  VK_FORMAT_B10G11R11_UFLOAT_PACK32,
  VK_FORMAT_B10X6G10X6R10X6G10X6_422_UNORM_4PACK16,
  VK_FORMAT_B12X4G12X4R12X4G12X4_422_UNORM_4PACK16,
  VK_FORMAT_B4G4R4A4_UNORM_PACK16,
  VK_FORMAT_B5G5R5A1_UNORM_PACK16,
  VK_FORMAT_B5G6R5_UNORM_PACK16,
  VK_FORMAT_B8G8R8A8_SINT,
  VK_FORMAT_B8G8R8A8_SNORM,
  VK_FORMAT_B8G8R8A8_SRGB,
  VK_FORMAT_B8G8R8A8_UINT,
  VK_FORMAT_B8G8R8A8_UNORM,
  VK_FORMAT_B8G8R8_SINT,
  VK_FORMAT_B8G8R8_SNORM,
  VK_FORMAT_B8G8R8_SRGB,
  VK_FORMAT_B8G8R8_UINT,
  VK_FORMAT_B8G8R8_UNORM,
  VK_FORMAT_BC1_RGBA_SRGB_BLOCK,
  VK_FORMAT_BC1_RGBA_UNORM_BLOCK,
  VK_FORMAT_BC1_RGB_SRGB_BLOCK,
  VK_FORMAT_BC1_RGB_UNORM_BLOCK,
  VK_FORMAT_BC2_SRGB_BLOCK,
  VK_FORMAT_BC2_UNORM_BLOCK,
  VK_FORMAT_BC3_SRGB_BLOCK,
  VK_FORMAT_BC3_UNORM_BLOCK,
  VK_FORMAT_BC4_SNORM_BLOCK,
  VK_FORMAT_BC4_UNORM_BLOCK,
  VK_FORMAT_BC5_SNORM_BLOCK,
  VK_FORMAT_BC5_UNORM_BLOCK,
  VK_FORMAT_BC6H_SFLOAT_BLOCK,
  VK_FORMAT_BC6H_UFLOAT_BLOCK,
  VK_FORMAT_BC7_SRGB_BLOCK,
  VK_FORMAT_BC7_UNORM_BLOCK,
  VK_FORMAT_D16_UNORM,
  VK_FORMAT_D16_UNORM_S8_UINT,
  VK_FORMAT_D24_UNORM_S8_UINT,
  VK_FORMAT_D32_SFLOAT,
  VK_FORMAT_D32_SFLOAT_S8_UINT,
  VK_FORMAT_E5B9G9R9_UFLOAT_PACK32,
  VK_FORMAT_EAC_R11G11_SNORM_BLOCK,
  VK_FORMAT_EAC_R11G11_UNORM_BLOCK,
  VK_FORMAT_EAC_R11_SNORM_BLOCK,
  VK_FORMAT_EAC_R11_UNORM_BLOCK,
  VK_FORMAT_ETC2_R8G8B8A1_SRGB_BLOCK,
  VK_FORMAT_ETC2_R8G8B8A1_UNORM_BLOCK,
  VK_FORMAT_ETC2_R8G8B8A8_SRGB_BLOCK,
  VK_FORMAT_ETC2_R8G8B8A8_UNORM_BLOCK,
  VK_FORMAT_ETC2_R8G8B8_SRGB_BLOCK,
  VK_FORMAT_ETC2_R8G8B8_UNORM_BLOCK,
  VK_FORMAT_G10X6B10X6G10X6R10X6_422_UNORM_4PACK16,
  VK_FORMAT_G12X4B12X4G12X4R12X4_422_UNORM_4PACK16,
  VK_FORMAT_PVRTC1_2BPP_SRGB_BLOCK_IMG,
  VK_FORMAT_PVRTC1_2BPP_UNORM_BLOCK_IMG,
  VK_FORMAT_PVRTC1_4BPP_SRGB_BLOCK_IMG,
  VK_FORMAT_PVRTC1_4BPP_UNORM_BLOCK_IMG,
  VK_FORMAT_PVRTC2_2BPP_SRGB_BLOCK_IMG,
  VK_FORMAT_PVRTC2_2BPP_UNORM_BLOCK_IMG,
  VK_FORMAT_PVRTC2_4BPP_SRGB_BLOCK_IMG,
  VK_FORMAT_PVRTC2_4BPP_UNORM_BLOCK_IMG,
  VK_FORMAT_R10X6G10X6B10X6A10X6_UNORM_4PACK16,
  VK_FORMAT_R10X6G10X6_UNORM_2PACK16,
  VK_FORMAT_R10X6_UNORM_PACK16,
  VK_FORMAT_R12X4G12X4B12X4A12X4_UNORM_4PACK16,
  VK_FORMAT_R12X4G12X4_UNORM_2PACK16,
  VK_FORMAT_R12X4_UNORM_PACK16,
  VK_FORMAT_R16G16B16A16_SFLOAT,
  VK_FORMAT_R16G16B16A16_SINT,
  VK_FORMAT_R16G16B16A16_SNORM,
  VK_FORMAT_R16G16B16A16_UINT,
  VK_FORMAT_R16G16B16A16_UNORM,
  VK_FORMAT_R16G16B16_SFLOAT,
  VK_FORMAT_R16G16B16_SINT,
  VK_FORMAT_R16G16B16_SNORM,
  VK_FORMAT_R16G16B16_UINT,
  VK_FORMAT_R16G16B16_UNORM,
  VK_FORMAT_R16G16_SFLOAT,
  VK_FORMAT_R16G16_SINT,
  VK_FORMAT_R16G16_SNORM,
  VK_FORMAT_R16G16_UINT,
  VK_FORMAT_R16G16_UNORM,
  VK_FORMAT_R16_SFLOAT,
  VK_FORMAT_R16_SINT,
  VK_FORMAT_R16_SNORM,
  VK_FORMAT_R16_UINT,
  VK_FORMAT_R16_UNORM,
  VK_FORMAT_R32G32B32A32_SFLOAT,
  VK_FORMAT_R32G32B32A32_SINT,
  VK_FORMAT_R32G32B32A32_UINT,
  VK_FORMAT_R32G32B32_SFLOAT,
  VK_FORMAT_R32G32B32_SINT,
  VK_FORMAT_R32G32B32_UINT,
  VK_FORMAT_R32G32_SFLOAT,
  VK_FORMAT_R32G32_SINT,
  VK_FORMAT_R32G32_UINT,
  VK_FORMAT_R32_SFLOAT,
  VK_FORMAT_R32_SINT,
  VK_FORMAT_R32_UINT,
  VK_FORMAT_R4G4B4A4_UNORM_PACK16,
  VK_FORMAT_R4G4_UNORM_PACK8,
  VK_FORMAT_R5G5B5A1_UNORM_PACK16,
  VK_FORMAT_R5G6B5_UNORM_PACK16,
  VK_FORMAT_R64G64B64A64_SFLOAT,
  VK_FORMAT_R64G64B64A64_SINT,
  VK_FORMAT_R64G64B64A64_UINT,
  VK_FORMAT_R64G64B64_SFLOAT,
  VK_FORMAT_R64G64B64_SINT,
  VK_FORMAT_R64G64B64_UINT,
  VK_FORMAT_R64G64_SFLOAT,
  VK_FORMAT_R64G64_SINT,
  VK_FORMAT_R64G64_UINT,
  VK_FORMAT_R64_SFLOAT,
  VK_FORMAT_R64_SINT,
  VK_FORMAT_R64_UINT,
  VK_FORMAT_R8G8B8A8_SINT,
  VK_FORMAT_R8G8B8A8_SNORM,
  VK_FORMAT_R8G8B8A8_SRGB,
  VK_FORMAT_R8G8B8A8_UINT,
  VK_FORMAT_R8G8B8A8_UNORM,
  VK_FORMAT_R8G8B8_SINT,
  VK_FORMAT_R8G8B8_SNORM,
  VK_FORMAT_R8G8B8_SRGB,
  VK_FORMAT_R8G8B8_UINT,
  VK_FORMAT_R8G8B8_UNORM,
  VK_FORMAT_R8G8_SINT,
  VK_FORMAT_R8G8_SNORM,
  VK_FORMAT_R8G8_SRGB,
  VK_FORMAT_R8G8_UINT,
  VK_FORMAT_R8G8_UNORM,
  VK_FORMAT_R8_SINT,
  VK_FORMAT_R8_SNORM,
  VK_FORMAT_R8_SRGB,
  VK_FORMAT_R8_UINT,
  VK_FORMAT_R8_UNORM,
  VK_FORMAT_S8_UINT,
  VK_FORMAT_UNDEFINED,
  VK_FORMAT_X8_D24_UNORM_PACK32,
  createDefaultContainer,
  read,
  write
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL2t0eC1wYXJzZUAyLjAuMC9ub2RlX21vZHVsZXMva3R4LXBhcnNlL3NyYy9jb25zdGFudHMudHMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL2t0eC1wYXJzZUAyLjAuMC9ub2RlX21vZHVsZXMva3R4LXBhcnNlL3NyYy9jcmVhdGUtZGVmYXVsdC1jb250YWluZXIudHMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL2t0eC1wYXJzZUAyLjAuMC9ub2RlX21vZHVsZXMva3R4LXBhcnNlL3NyYy9idWZmZXItcmVhZGVyLnRzIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS9rdHgtcGFyc2VAMi4wLjAvbm9kZV9tb2R1bGVzL2t0eC1wYXJzZS9zcmMvY29uc3RhbnRzLWludGVybmFsLnRzIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS9rdHgtcGFyc2VAMi4wLjAvbm9kZV9tb2R1bGVzL2t0eC1wYXJzZS9zcmMvdXRpbC50cyIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvLnBucG0va3R4LXBhcnNlQDIuMC4wL25vZGVfbW9kdWxlcy9rdHgtcGFyc2Uvc3JjL3JlYWQudHMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL2t0eC1wYXJzZUAyLjAuMC9ub2RlX21vZHVsZXMva3R4LXBhcnNlL3NyYy93cml0ZS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBLVFgyIEhlYWRlci5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5leHBvcnQgY29uc3QgS0hSX1NVUEVSQ09NUFJFU1NJT05fTk9ORSA9IDA7XG5leHBvcnQgY29uc3QgS0hSX1NVUEVSQ09NUFJFU1NJT05fQkFTSVNMWiA9IDE7XG5leHBvcnQgY29uc3QgS0hSX1NVUEVSQ09NUFJFU1NJT05fWlNURCA9IDI7XG5leHBvcnQgY29uc3QgS0hSX1NVUEVSQ09NUFJFU1NJT05fWkxJQiA9IDM7XG5cbmV4cG9ydCB0eXBlIFN1cGVyY29tcHJlc3Npb24gPVxuXHR8IHR5cGVvZiBLSFJfU1VQRVJDT01QUkVTU0lPTl9OT05FXG5cdHwgdHlwZW9mIEtIUl9TVVBFUkNPTVBSRVNTSU9OX0JBU0lTTFpcblx0fCB0eXBlb2YgS0hSX1NVUEVSQ09NUFJFU1NJT05fWlNURFxuXHR8IHR5cGVvZiBLSFJfU1VQRVJDT01QUkVTU0lPTl9aTElCO1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIERhdGEgRm9ybWF0IERlc2NyaXB0b3IgKERGRCkuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZXhwb3J0IGNvbnN0IEtIUl9ERl9LSFJfREVTQ1JJUFRPUlRZUEVfQkFTSUNGT1JNQVQgPSAwO1xuZXhwb3J0IGNvbnN0IEtIUl9ERl9WRU5ET1JJRF9LSFJPTk9TID0gMDtcbmV4cG9ydCBjb25zdCBLSFJfREZfVkVSU0lPTiA9IDI7XG5cbmV4cG9ydCBjb25zdCBLSFJfREZfTU9ERUxfVU5TUEVDSUZJRUQgPSAwO1xuZXhwb3J0IGNvbnN0IEtIUl9ERl9NT0RFTF9SR0JTREEgPSAxO1xuLy8gLi4uXG5leHBvcnQgY29uc3QgS0hSX0RGX01PREVMX0VUQzEgPSAxNjA7XG5leHBvcnQgY29uc3QgS0hSX0RGX01PREVMX0VUQzIgPSAxNjE7XG5leHBvcnQgY29uc3QgS0hSX0RGX01PREVMX0FTVEMgPSAxNjI7XG5leHBvcnQgY29uc3QgS0hSX0RGX01PREVMX0VUQzFTID0gMTYzO1xuZXhwb3J0IGNvbnN0IEtIUl9ERl9NT0RFTF9VQVNUQyA9IDE2NjtcblxuZXhwb3J0IGNvbnN0IEtIUl9ERl9GTEFHX0FMUEhBX1NUUkFJR0hUID0gMDtcbmV4cG9ydCBjb25zdCBLSFJfREZfRkxBR19BTFBIQV9QUkVNVUxUSVBMSUVEID0gMTtcblxuZXhwb3J0IGNvbnN0IEtIUl9ERl9UUkFOU0ZFUl9VTlNQRUNJRklFRCA9IDA7XG5leHBvcnQgY29uc3QgS0hSX0RGX1RSQU5TRkVSX0xJTkVBUiA9IDE7XG5leHBvcnQgY29uc3QgS0hSX0RGX1RSQU5TRkVSX1NSR0IgPSAyO1xuZXhwb3J0IGNvbnN0IEtIUl9ERl9UUkFOU0ZFUl9JVFUgPSAzO1xuZXhwb3J0IGNvbnN0IEtIUl9ERl9UUkFOU0ZFUl9OVFNDID0gNDtcbmV4cG9ydCBjb25zdCBLSFJfREZfVFJBTlNGRVJfU0xPRyA9IDU7XG5leHBvcnQgY29uc3QgS0hSX0RGX1RSQU5TRkVSX1NMT0cyID0gNjtcbmV4cG9ydCBjb25zdCBLSFJfREZfVFJBTlNGRVJfQlQxODg2ID0gNztcbmV4cG9ydCBjb25zdCBLSFJfREZfVFJBTlNGRVJfSExHX09FVEYgPSA4O1xuZXhwb3J0IGNvbnN0IEtIUl9ERl9UUkFOU0ZFUl9ITEdfRU9URiA9IDk7XG5leHBvcnQgY29uc3QgS0hSX0RGX1RSQU5TRkVSX1BRX0VPVEYgPSAxMDtcbmV4cG9ydCBjb25zdCBLSFJfREZfVFJBTlNGRVJfUFFfT0VURiA9IDExO1xuZXhwb3J0IGNvbnN0IEtIUl9ERl9UUkFOU0ZFUl9EQ0lQMyA9IDEyO1xuZXhwb3J0IGNvbnN0IEtIUl9ERl9UUkFOU0ZFUl9QQUxfT0VURiA9IDEzO1xuZXhwb3J0IGNvbnN0IEtIUl9ERl9UUkFOU0ZFUl9QQUw2MjVfRU9URiA9IDE0O1xuZXhwb3J0IGNvbnN0IEtIUl9ERl9UUkFOU0ZFUl9TVDI0MCA9IDE1O1xuZXhwb3J0IGNvbnN0IEtIUl9ERl9UUkFOU0ZFUl9BQ0VTQ0MgPSAxNjtcbmV4cG9ydCBjb25zdCBLSFJfREZfVFJBTlNGRVJfQUNFU0NDVCA9IDE3O1xuZXhwb3J0IGNvbnN0IEtIUl9ERl9UUkFOU0ZFUl9BRE9CRVJHQiA9IDE4O1xuXG5leHBvcnQgdHlwZSBUcmFuc2ZlciA9XG5cdHwgdHlwZW9mIEtIUl9ERl9UUkFOU0ZFUl9VTlNQRUNJRklFRFxuXHR8IHR5cGVvZiBLSFJfREZfVFJBTlNGRVJfTElORUFSXG5cdHwgdHlwZW9mIEtIUl9ERl9UUkFOU0ZFUl9TUkdCXG5cdHwgdHlwZW9mIEtIUl9ERl9UUkFOU0ZFUl9JVFVcblx0fCB0eXBlb2YgS0hSX0RGX1RSQU5TRkVSX05UU0Ncblx0fCB0eXBlb2YgS0hSX0RGX1RSQU5TRkVSX1NMT0dcblx0fCB0eXBlb2YgS0hSX0RGX1RSQU5TRkVSX1NMT0cyXG5cdHwgdHlwZW9mIEtIUl9ERl9UUkFOU0ZFUl9CVDE4ODZcblx0fCB0eXBlb2YgS0hSX0RGX1RSQU5TRkVSX0hMR19PRVRGXG5cdHwgdHlwZW9mIEtIUl9ERl9UUkFOU0ZFUl9ITEdfRU9URlxuXHR8IHR5cGVvZiBLSFJfREZfVFJBTlNGRVJfUFFfRU9URlxuXHR8IHR5cGVvZiBLSFJfREZfVFJBTlNGRVJfUFFfT0VURlxuXHR8IHR5cGVvZiBLSFJfREZfVFJBTlNGRVJfRENJUDNcblx0fCB0eXBlb2YgS0hSX0RGX1RSQU5TRkVSX1BBTF9PRVRGXG5cdHwgdHlwZW9mIEtIUl9ERl9UUkFOU0ZFUl9QQUw2MjVfRU9URlxuXHR8IHR5cGVvZiBLSFJfREZfVFJBTlNGRVJfU1QyNDBcblx0fCB0eXBlb2YgS0hSX0RGX1RSQU5TRkVSX0FDRVNDQ1xuXHR8IHR5cGVvZiBLSFJfREZfVFJBTlNGRVJfQUNFU0NDVFxuXHR8IHR5cGVvZiBLSFJfREZfVFJBTlNGRVJfQURPQkVSR0I7XG5cbmV4cG9ydCBjb25zdCBLSFJfREZfUFJJTUFSSUVTX1VOU1BFQ0lGSUVEID0gMDtcbmV4cG9ydCBjb25zdCBLSFJfREZfUFJJTUFSSUVTX0JUNzA5ID0gMTtcbmV4cG9ydCBjb25zdCBLSFJfREZfUFJJTUFSSUVTX0JUNjAxX0VCVSA9IDI7XG5leHBvcnQgY29uc3QgS0hSX0RGX1BSSU1BUklFU19CVDYwMV9TTVBURSA9IDM7XG5leHBvcnQgY29uc3QgS0hSX0RGX1BSSU1BUklFU19CVDIwMjAgPSA0O1xuZXhwb3J0IGNvbnN0IEtIUl9ERl9QUklNQVJJRVNfQ0lFWFlaID0gNTtcbmV4cG9ydCBjb25zdCBLSFJfREZfUFJJTUFSSUVTX0FDRVMgPSA2O1xuZXhwb3J0IGNvbnN0IEtIUl9ERl9QUklNQVJJRVNfQUNFU0NDID0gNztcbmV4cG9ydCBjb25zdCBLSFJfREZfUFJJTUFSSUVTX05UU0MxOTUzID0gODtcbmV4cG9ydCBjb25zdCBLSFJfREZfUFJJTUFSSUVTX1BBTDUyNSA9IDk7XG5leHBvcnQgY29uc3QgS0hSX0RGX1BSSU1BUklFU19ESVNQTEFZUDMgPSAxMDtcbmV4cG9ydCBjb25zdCBLSFJfREZfUFJJTUFSSUVTX0FET0JFUkdCID0gMTE7XG5cbmV4cG9ydCB0eXBlIFByaW1hcmllcyA9XG5cdHwgdHlwZW9mIEtIUl9ERl9QUklNQVJJRVNfVU5TUEVDSUZJRURcblx0fCB0eXBlb2YgS0hSX0RGX1BSSU1BUklFU19CVDcwOVxuXHR8IHR5cGVvZiBLSFJfREZfUFJJTUFSSUVTX0JUNjAxX0VCVVxuXHR8IHR5cGVvZiBLSFJfREZfUFJJTUFSSUVTX0JUNjAxX1NNUFRFXG5cdHwgdHlwZW9mIEtIUl9ERl9QUklNQVJJRVNfQlQyMDIwXG5cdHwgdHlwZW9mIEtIUl9ERl9QUklNQVJJRVNfQ0lFWFlaXG5cdHwgdHlwZW9mIEtIUl9ERl9QUklNQVJJRVNfQUNFU1xuXHR8IHR5cGVvZiBLSFJfREZfUFJJTUFSSUVTX0FDRVNDQ1xuXHR8IHR5cGVvZiBLSFJfREZfUFJJTUFSSUVTX05UU0MxOTUzXG5cdHwgdHlwZW9mIEtIUl9ERl9QUklNQVJJRVNfUEFMNTI1XG5cdHwgdHlwZW9mIEtIUl9ERl9QUklNQVJJRVNfRElTUExBWVAzXG5cdHwgdHlwZW9mIEtIUl9ERl9QUklNQVJJRVNfQURPQkVSR0I7XG5cbmV4cG9ydCBjb25zdCBLSFJfREZfQ0hBTk5FTF9SR0JTREFfUkVEID0gMDtcbmV4cG9ydCBjb25zdCBLSFJfREZfQ0hBTk5FTF9SR0JTREFfR1JFRU4gPSAxO1xuZXhwb3J0IGNvbnN0IEtIUl9ERl9DSEFOTkVMX1JHQlNEQV9CTFVFID0gMjtcbmV4cG9ydCBjb25zdCBLSFJfREZfQ0hBTk5FTF9SR0JTREFfU1RFTkNJTCA9IDEzO1xuZXhwb3J0IGNvbnN0IEtIUl9ERl9DSEFOTkVMX1JHQlNEQV9ERVBUSCA9IDE0O1xuZXhwb3J0IGNvbnN0IEtIUl9ERl9DSEFOTkVMX1JHQlNEQV9BTFBIQSA9IDE1O1xuXG5leHBvcnQgdHlwZSBDaGFubmVsID1cblx0fCB0eXBlb2YgS0hSX0RGX0NIQU5ORUxfUkdCU0RBX1JFRFxuXHR8IHR5cGVvZiBLSFJfREZfQ0hBTk5FTF9SR0JTREFfR1JFRU5cblx0fCB0eXBlb2YgS0hSX0RGX0NIQU5ORUxfUkdCU0RBX0JMVUVcblx0fCB0eXBlb2YgS0hSX0RGX0NIQU5ORUxfUkdCU0RBX1NURU5DSUxcblx0fCB0eXBlb2YgS0hSX0RGX0NIQU5ORUxfUkdCU0RBX0RFUFRIXG5cdHwgdHlwZW9mIEtIUl9ERl9DSEFOTkVMX1JHQlNEQV9BTFBIQTtcblxuZXhwb3J0IGNvbnN0IEtIUl9ERl9TQU1QTEVfREFUQVRZUEVfRkxPQVQgPSAweDgwO1xuZXhwb3J0IGNvbnN0IEtIUl9ERl9TQU1QTEVfREFUQVRZUEVfU0lHTkVEID0gMHg0MDtcbmV4cG9ydCBjb25zdCBLSFJfREZfU0FNUExFX0RBVEFUWVBFX0VYUE9ORU5UID0gMHgyMDtcbmV4cG9ydCBjb25zdCBLSFJfREZfU0FNUExFX0RBVEFUWVBFX0xJTkVBUiA9IDB4MTA7XG5cbmV4cG9ydCB0eXBlIFNhbXBsZURhdGF0eXBlID1cblx0fCB0eXBlb2YgS0hSX0RGX1NBTVBMRV9EQVRBVFlQRV9GTE9BVFxuXHR8IHR5cGVvZiBLSFJfREZfU0FNUExFX0RBVEFUWVBFX1NJR05FRFxuXHR8IHR5cGVvZiBLSFJfREZfU0FNUExFX0RBVEFUWVBFX0VYUE9ORU5UXG5cdHwgdHlwZW9mIEtIUl9ERl9TQU1QTEVfREFUQVRZUEVfTElORUFSO1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFZLIEZPUk1BVC5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5leHBvcnQgY29uc3QgVktfRk9STUFUX1VOREVGSU5FRCA9IDA7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX1I0RzRfVU5PUk1fUEFDSzggPSAxO1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9SNEc0QjRBNF9VTk9STV9QQUNLMTYgPSAyO1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9CNEc0UjRBNF9VTk9STV9QQUNLMTYgPSAzO1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9SNUc2QjVfVU5PUk1fUEFDSzE2ID0gNDtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfQjVHNlI1X1VOT1JNX1BBQ0sxNiA9IDU7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX1I1RzVCNUExX1VOT1JNX1BBQ0sxNiA9IDY7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0I1RzVSNUExX1VOT1JNX1BBQ0sxNiA9IDc7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0ExUjVHNUI1X1VOT1JNX1BBQ0sxNiA9IDg7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX1I4X1VOT1JNID0gOTtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfUjhfU05PUk0gPSAxMDtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfUjhfVUlOVCA9IDEzO1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9SOF9TSU5UID0gMTQ7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX1I4X1NSR0IgPSAxNTtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfUjhHOF9VTk9STSA9IDE2O1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9SOEc4X1NOT1JNID0gMTc7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX1I4RzhfVUlOVCA9IDIwO1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9SOEc4X1NJTlQgPSAyMTtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfUjhHOF9TUkdCID0gMjI7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX1I4RzhCOF9VTk9STSA9IDIzO1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9SOEc4QjhfU05PUk0gPSAyNDtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfUjhHOEI4X1VJTlQgPSAyNztcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfUjhHOEI4X1NJTlQgPSAyODtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfUjhHOEI4X1NSR0IgPSAyOTtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfQjhHOFI4X1VOT1JNID0gMzA7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0I4RzhSOF9TTk9STSA9IDMxO1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9COEc4UjhfVUlOVCA9IDM0O1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9COEc4UjhfU0lOVCA9IDM1O1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9COEc4UjhfU1JHQiA9IDM2O1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9SOEc4QjhBOF9VTk9STSA9IDM3O1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9SOEc4QjhBOF9TTk9STSA9IDM4O1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9SOEc4QjhBOF9VSU5UID0gNDE7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX1I4RzhCOEE4X1NJTlQgPSA0MjtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfUjhHOEI4QThfU1JHQiA9IDQzO1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9COEc4UjhBOF9VTk9STSA9IDQ0O1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9COEc4UjhBOF9TTk9STSA9IDQ1O1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9COEc4UjhBOF9VSU5UID0gNDg7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0I4RzhSOEE4X1NJTlQgPSA0OTtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfQjhHOFI4QThfU1JHQiA9IDUwO1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9BMlIxMEcxMEIxMF9VTk9STV9QQUNLMzIgPSA1ODtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfQTJSMTBHMTBCMTBfU05PUk1fUEFDSzMyID0gNTk7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0EyUjEwRzEwQjEwX1VJTlRfUEFDSzMyID0gNjI7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0EyUjEwRzEwQjEwX1NJTlRfUEFDSzMyID0gNjM7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0EyQjEwRzEwUjEwX1VOT1JNX1BBQ0szMiA9IDY0O1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9BMkIxMEcxMFIxMF9TTk9STV9QQUNLMzIgPSA2NTtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfQTJCMTBHMTBSMTBfVUlOVF9QQUNLMzIgPSA2ODtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfQTJCMTBHMTBSMTBfU0lOVF9QQUNLMzIgPSA2OTtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfUjE2X1VOT1JNID0gNzA7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX1IxNl9TTk9STSA9IDcxO1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9SMTZfVUlOVCA9IDc0O1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9SMTZfU0lOVCA9IDc1O1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9SMTZfU0ZMT0FUID0gNzY7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX1IxNkcxNl9VTk9STSA9IDc3O1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9SMTZHMTZfU05PUk0gPSA3ODtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfUjE2RzE2X1VJTlQgPSA4MTtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfUjE2RzE2X1NJTlQgPSA4MjtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfUjE2RzE2X1NGTE9BVCA9IDgzO1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9SMTZHMTZCMTZfVU5PUk0gPSA4NDtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfUjE2RzE2QjE2X1NOT1JNID0gODU7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX1IxNkcxNkIxNl9VSU5UID0gODg7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX1IxNkcxNkIxNl9TSU5UID0gODk7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX1IxNkcxNkIxNl9TRkxPQVQgPSA5MDtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfUjE2RzE2QjE2QTE2X1VOT1JNID0gOTE7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX1IxNkcxNkIxNkExNl9TTk9STSA9IDkyO1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9SMTZHMTZCMTZBMTZfVUlOVCA9IDk1O1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9SMTZHMTZCMTZBMTZfU0lOVCA9IDk2O1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9SMTZHMTZCMTZBMTZfU0ZMT0FUID0gOTc7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX1IzMl9VSU5UID0gOTg7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX1IzMl9TSU5UID0gOTk7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX1IzMl9TRkxPQVQgPSAxMDA7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX1IzMkczMl9VSU5UID0gMTAxO1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9SMzJHMzJfU0lOVCA9IDEwMjtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfUjMyRzMyX1NGTE9BVCA9IDEwMztcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfUjMyRzMyQjMyX1VJTlQgPSAxMDQ7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX1IzMkczMkIzMl9TSU5UID0gMTA1O1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9SMzJHMzJCMzJfU0ZMT0FUID0gMTA2O1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9SMzJHMzJCMzJBMzJfVUlOVCA9IDEwNztcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfUjMyRzMyQjMyQTMyX1NJTlQgPSAxMDg7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX1IzMkczMkIzMkEzMl9TRkxPQVQgPSAxMDk7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX1I2NF9VSU5UID0gMTEwO1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9SNjRfU0lOVCA9IDExMTtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfUjY0X1NGTE9BVCA9IDExMjtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfUjY0RzY0X1VJTlQgPSAxMTM7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX1I2NEc2NF9TSU5UID0gMTE0O1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9SNjRHNjRfU0ZMT0FUID0gMTE1O1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9SNjRHNjRCNjRfVUlOVCA9IDExNjtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfUjY0RzY0QjY0X1NJTlQgPSAxMTc7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX1I2NEc2NEI2NF9TRkxPQVQgPSAxMTg7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX1I2NEc2NEI2NEE2NF9VSU5UID0gMTE5O1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9SNjRHNjRCNjRBNjRfU0lOVCA9IDEyMDtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfUjY0RzY0QjY0QTY0X1NGTE9BVCA9IDEyMTtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfQjEwRzExUjExX1VGTE9BVF9QQUNLMzIgPSAxMjI7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0U1QjlHOVI5X1VGTE9BVF9QQUNLMzIgPSAxMjM7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0QxNl9VTk9STSA9IDEyNDtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfWDhfRDI0X1VOT1JNX1BBQ0szMiA9IDEyNTtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfRDMyX1NGTE9BVCA9IDEyNjtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfUzhfVUlOVCA9IDEyNztcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfRDE2X1VOT1JNX1M4X1VJTlQgPSAxMjg7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0QyNF9VTk9STV9TOF9VSU5UID0gMTI5O1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9EMzJfU0ZMT0FUX1M4X1VJTlQgPSAxMzA7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0JDMV9SR0JfVU5PUk1fQkxPQ0sgPSAxMzE7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0JDMV9SR0JfU1JHQl9CTE9DSyA9IDEzMjtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfQkMxX1JHQkFfVU5PUk1fQkxPQ0sgPSAxMzM7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0JDMV9SR0JBX1NSR0JfQkxPQ0sgPSAxMzQ7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0JDMl9VTk9STV9CTE9DSyA9IDEzNTtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfQkMyX1NSR0JfQkxPQ0sgPSAxMzY7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0JDM19VTk9STV9CTE9DSyA9IDEzNztcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfQkMzX1NSR0JfQkxPQ0sgPSAxMzg7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0JDNF9VTk9STV9CTE9DSyA9IDEzOTtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfQkM0X1NOT1JNX0JMT0NLID0gMTQwO1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9CQzVfVU5PUk1fQkxPQ0sgPSAxNDE7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0JDNV9TTk9STV9CTE9DSyA9IDE0MjtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfQkM2SF9VRkxPQVRfQkxPQ0sgPSAxNDM7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0JDNkhfU0ZMT0FUX0JMT0NLID0gMTQ0O1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9CQzdfVU5PUk1fQkxPQ0sgPSAxNDU7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0JDN19TUkdCX0JMT0NLID0gMTQ2O1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9FVEMyX1I4RzhCOF9VTk9STV9CTE9DSyA9IDE0NztcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfRVRDMl9SOEc4QjhfU1JHQl9CTE9DSyA9IDE0ODtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfRVRDMl9SOEc4QjhBMV9VTk9STV9CTE9DSyA9IDE0OTtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfRVRDMl9SOEc4QjhBMV9TUkdCX0JMT0NLID0gMTUwO1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9FVEMyX1I4RzhCOEE4X1VOT1JNX0JMT0NLID0gMTUxO1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9FVEMyX1I4RzhCOEE4X1NSR0JfQkxPQ0sgPSAxNTI7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0VBQ19SMTFfVU5PUk1fQkxPQ0sgPSAxNTM7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0VBQ19SMTFfU05PUk1fQkxPQ0sgPSAxNTQ7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0VBQ19SMTFHMTFfVU5PUk1fQkxPQ0sgPSAxNTU7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0VBQ19SMTFHMTFfU05PUk1fQkxPQ0sgPSAxNTY7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0FTVENfNHg0X1VOT1JNX0JMT0NLID0gMTU3O1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9BU1RDXzR4NF9TUkdCX0JMT0NLID0gMTU4O1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9BU1RDXzV4NF9VTk9STV9CTE9DSyA9IDE1OTtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfQVNUQ181eDRfU1JHQl9CTE9DSyA9IDE2MDtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfQVNUQ181eDVfVU5PUk1fQkxPQ0sgPSAxNjE7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0FTVENfNXg1X1NSR0JfQkxPQ0sgPSAxNjI7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0FTVENfNng1X1VOT1JNX0JMT0NLID0gMTYzO1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9BU1RDXzZ4NV9TUkdCX0JMT0NLID0gMTY0O1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9BU1RDXzZ4Nl9VTk9STV9CTE9DSyA9IDE2NTtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfQVNUQ182eDZfU1JHQl9CTE9DSyA9IDE2NjtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfQVNUQ184eDVfVU5PUk1fQkxPQ0sgPSAxNjc7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0FTVENfOHg1X1NSR0JfQkxPQ0sgPSAxNjg7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0FTVENfOHg2X1VOT1JNX0JMT0NLID0gMTY5O1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9BU1RDXzh4Nl9TUkdCX0JMT0NLID0gMTcwO1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9BU1RDXzh4OF9VTk9STV9CTE9DSyA9IDE3MTtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfQVNUQ184eDhfU1JHQl9CTE9DSyA9IDE3MjtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfQVNUQ18xMHg1X1VOT1JNX0JMT0NLID0gMTczO1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9BU1RDXzEweDVfU1JHQl9CTE9DSyA9IDE3NDtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfQVNUQ18xMHg2X1VOT1JNX0JMT0NLID0gMTc1O1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9BU1RDXzEweDZfU1JHQl9CTE9DSyA9IDE3NjtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfQVNUQ18xMHg4X1VOT1JNX0JMT0NLID0gMTc3O1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9BU1RDXzEweDhfU1JHQl9CTE9DSyA9IDE3ODtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfQVNUQ18xMHgxMF9VTk9STV9CTE9DSyA9IDE3OTtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfQVNUQ18xMHgxMF9TUkdCX0JMT0NLID0gMTgwO1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9BU1RDXzEyeDEwX1VOT1JNX0JMT0NLID0gMTgxO1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9BU1RDXzEyeDEwX1NSR0JfQkxPQ0sgPSAxODI7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0FTVENfMTJ4MTJfVU5PUk1fQkxPQ0sgPSAxODM7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0FTVENfMTJ4MTJfU1JHQl9CTE9DSyA9IDE4NDtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfUjEwWDZfVU5PUk1fUEFDSzE2ID0gMTAwMDE1NjAwNztcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfUjEwWDZHMTBYNl9VTk9STV8yUEFDSzE2ID0gMTAwMDE1NjAwODtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfUjEwWDZHMTBYNkIxMFg2QTEwWDZfVU5PUk1fNFBBQ0sxNiA9IDEwMDAxNTYwMDk7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0cxMFg2QjEwWDZHMTBYNlIxMFg2XzQyMl9VTk9STV80UEFDSzE2ID0gMTAwMDE1NjAxMDtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfQjEwWDZHMTBYNlIxMFg2RzEwWDZfNDIyX1VOT1JNXzRQQUNLMTYgPSAxMDAwMTU2MDExO1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9SMTJYNF9VTk9STV9QQUNLMTYgPSAxMDAwMTU2MDE3O1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9SMTJYNEcxMlg0X1VOT1JNXzJQQUNLMTYgPSAxMDAwMTU2MDE4O1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9SMTJYNEcxMlg0QjEyWDRBMTJYNF9VTk9STV80UEFDSzE2ID0gMTAwMDE1NjAxOTtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfRzEyWDRCMTJYNEcxMlg0UjEyWDRfNDIyX1VOT1JNXzRQQUNLMTYgPSAxMDAwMTU2MDIwO1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9CMTJYNEcxMlg0UjEyWDRHMTJYNF80MjJfVU5PUk1fNFBBQ0sxNiA9IDEwMDAxNTYwMjE7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX1BWUlRDMV8yQlBQX1VOT1JNX0JMT0NLX0lNRyA9IDEwMDAwNTQwMDA7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX1BWUlRDMV80QlBQX1VOT1JNX0JMT0NLX0lNRyA9IDEwMDAwNTQwMDE7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX1BWUlRDMl8yQlBQX1VOT1JNX0JMT0NLX0lNRyA9IDEwMDAwNTQwMDI7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX1BWUlRDMl80QlBQX1VOT1JNX0JMT0NLX0lNRyA9IDEwMDAwNTQwMDM7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX1BWUlRDMV8yQlBQX1NSR0JfQkxPQ0tfSU1HID0gMTAwMDA1NDAwNDtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfUFZSVEMxXzRCUFBfU1JHQl9CTE9DS19JTUcgPSAxMDAwMDU0MDA1O1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9QVlJUQzJfMkJQUF9TUkdCX0JMT0NLX0lNRyA9IDEwMDAwNTQwMDY7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX1BWUlRDMl80QlBQX1NSR0JfQkxPQ0tfSU1HID0gMTAwMDA1NDAwNztcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfQVNUQ180eDRfU0ZMT0FUX0JMT0NLX0VYVCA9IDEwMDAwNjYwMDA7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0FTVENfNXg0X1NGTE9BVF9CTE9DS19FWFQgPSAxMDAwMDY2MDAxO1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9BU1RDXzV4NV9TRkxPQVRfQkxPQ0tfRVhUID0gMTAwMDA2NjAwMjtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfQVNUQ182eDVfU0ZMT0FUX0JMT0NLX0VYVCA9IDEwMDAwNjYwMDM7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0FTVENfNng2X1NGTE9BVF9CTE9DS19FWFQgPSAxMDAwMDY2MDA0O1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9BU1RDXzh4NV9TRkxPQVRfQkxPQ0tfRVhUID0gMTAwMDA2NjAwNTtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfQVNUQ184eDZfU0ZMT0FUX0JMT0NLX0VYVCA9IDEwMDAwNjYwMDY7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0FTVENfOHg4X1NGTE9BVF9CTE9DS19FWFQgPSAxMDAwMDY2MDA3O1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9BU1RDXzEweDVfU0ZMT0FUX0JMT0NLX0VYVCA9IDEwMDAwNjYwMDg7XG5leHBvcnQgY29uc3QgVktfRk9STUFUX0FTVENfMTB4Nl9TRkxPQVRfQkxPQ0tfRVhUID0gMTAwMDA2NjAwOTtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfQVNUQ18xMHg4X1NGTE9BVF9CTE9DS19FWFQgPSAxMDAwMDY2MDEwO1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9BU1RDXzEweDEwX1NGTE9BVF9CTE9DS19FWFQgPSAxMDAwMDY2MDExO1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9BU1RDXzEyeDEwX1NGTE9BVF9CTE9DS19FWFQgPSAxMDAwMDY2MDEyO1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9BU1RDXzEyeDEyX1NGTE9BVF9CTE9DS19FWFQgPSAxMDAwMDY2MDEzO1xuZXhwb3J0IGNvbnN0IFZLX0ZPUk1BVF9BNFI0RzRCNF9VTk9STV9QQUNLMTZfRVhUID0gMTAwMDM0MDAwMDtcbmV4cG9ydCBjb25zdCBWS19GT1JNQVRfQTRCNEc0UjRfVU5PUk1fUEFDSzE2X0VYVCA9IDEwMDAzNDAwMDE7XG5cbmV4cG9ydCB0eXBlIFZLRm9ybWF0ID1cblx0fCB0eXBlb2YgVktfRk9STUFUX1VOREVGSU5FRFxuXHR8IHR5cGVvZiBWS19GT1JNQVRfUjRHNF9VTk9STV9QQUNLOFxuXHR8IHR5cGVvZiBWS19GT1JNQVRfUjRHNEI0QTRfVU5PUk1fUEFDSzE2XG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9CNEc0UjRBNF9VTk9STV9QQUNLMTZcblx0fCB0eXBlb2YgVktfRk9STUFUX1I1RzZCNV9VTk9STV9QQUNLMTZcblx0fCB0eXBlb2YgVktfRk9STUFUX0I1RzZSNV9VTk9STV9QQUNLMTZcblx0fCB0eXBlb2YgVktfRk9STUFUX1I1RzVCNUExX1VOT1JNX1BBQ0sxNlxuXHR8IHR5cGVvZiBWS19GT1JNQVRfQjVHNVI1QTFfVU5PUk1fUEFDSzE2XG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9BMVI1RzVCNV9VTk9STV9QQUNLMTZcblx0fCB0eXBlb2YgVktfRk9STUFUX1I4X1VOT1JNXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9SOF9TTk9STVxuXHR8IHR5cGVvZiBWS19GT1JNQVRfUjhfVUlOVFxuXHR8IHR5cGVvZiBWS19GT1JNQVRfUjhfU0lOVFxuXHR8IHR5cGVvZiBWS19GT1JNQVRfUjhfU1JHQlxuXHR8IHR5cGVvZiBWS19GT1JNQVRfUjhHOF9VTk9STVxuXHR8IHR5cGVvZiBWS19GT1JNQVRfUjhHOF9TTk9STVxuXHR8IHR5cGVvZiBWS19GT1JNQVRfUjhHOF9VSU5UXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9SOEc4X1NJTlRcblx0fCB0eXBlb2YgVktfRk9STUFUX1I4RzhfU1JHQlxuXHR8IHR5cGVvZiBWS19GT1JNQVRfUjhHOEI4X1VOT1JNXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9SOEc4QjhfU05PUk1cblx0fCB0eXBlb2YgVktfRk9STUFUX1I4RzhCOF9VSU5UXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9SOEc4QjhfU0lOVFxuXHR8IHR5cGVvZiBWS19GT1JNQVRfUjhHOEI4X1NSR0Jcblx0fCB0eXBlb2YgVktfRk9STUFUX0I4RzhSOF9VTk9STVxuXHR8IHR5cGVvZiBWS19GT1JNQVRfQjhHOFI4X1NOT1JNXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9COEc4UjhfVUlOVFxuXHR8IHR5cGVvZiBWS19GT1JNQVRfQjhHOFI4X1NJTlRcblx0fCB0eXBlb2YgVktfRk9STUFUX0I4RzhSOF9TUkdCXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9SOEc4QjhBOF9VTk9STVxuXHR8IHR5cGVvZiBWS19GT1JNQVRfUjhHOEI4QThfU05PUk1cblx0fCB0eXBlb2YgVktfRk9STUFUX1I4RzhCOEE4X1VJTlRcblx0fCB0eXBlb2YgVktfRk9STUFUX1I4RzhCOEE4X1NJTlRcblx0fCB0eXBlb2YgVktfRk9STUFUX1I4RzhCOEE4X1NSR0Jcblx0fCB0eXBlb2YgVktfRk9STUFUX0I4RzhSOEE4X1VOT1JNXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9COEc4UjhBOF9TTk9STVxuXHR8IHR5cGVvZiBWS19GT1JNQVRfQjhHOFI4QThfVUlOVFxuXHR8IHR5cGVvZiBWS19GT1JNQVRfQjhHOFI4QThfU0lOVFxuXHR8IHR5cGVvZiBWS19GT1JNQVRfQjhHOFI4QThfU1JHQlxuXHR8IHR5cGVvZiBWS19GT1JNQVRfQTJSMTBHMTBCMTBfVU5PUk1fUEFDSzMyXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9BMlIxMEcxMEIxMF9TTk9STV9QQUNLMzJcblx0fCB0eXBlb2YgVktfRk9STUFUX0EyUjEwRzEwQjEwX1VJTlRfUEFDSzMyXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9BMlIxMEcxMEIxMF9TSU5UX1BBQ0szMlxuXHR8IHR5cGVvZiBWS19GT1JNQVRfQTJCMTBHMTBSMTBfVU5PUk1fUEFDSzMyXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9BMkIxMEcxMFIxMF9TTk9STV9QQUNLMzJcblx0fCB0eXBlb2YgVktfRk9STUFUX0EyQjEwRzEwUjEwX1VJTlRfUEFDSzMyXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9BMkIxMEcxMFIxMF9TSU5UX1BBQ0szMlxuXHR8IHR5cGVvZiBWS19GT1JNQVRfUjE2X1VOT1JNXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9SMTZfU05PUk1cblx0fCB0eXBlb2YgVktfRk9STUFUX1IxNl9VSU5UXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9SMTZfU0lOVFxuXHR8IHR5cGVvZiBWS19GT1JNQVRfUjE2X1NGTE9BVFxuXHR8IHR5cGVvZiBWS19GT1JNQVRfUjE2RzE2X1VOT1JNXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9SMTZHMTZfU05PUk1cblx0fCB0eXBlb2YgVktfRk9STUFUX1IxNkcxNl9VSU5UXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9SMTZHMTZfU0lOVFxuXHR8IHR5cGVvZiBWS19GT1JNQVRfUjE2RzE2X1NGTE9BVFxuXHR8IHR5cGVvZiBWS19GT1JNQVRfUjE2RzE2QjE2X1VOT1JNXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9SMTZHMTZCMTZfU05PUk1cblx0fCB0eXBlb2YgVktfRk9STUFUX1IxNkcxNkIxNl9VSU5UXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9SMTZHMTZCMTZfU0lOVFxuXHR8IHR5cGVvZiBWS19GT1JNQVRfUjE2RzE2QjE2X1NGTE9BVFxuXHR8IHR5cGVvZiBWS19GT1JNQVRfUjE2RzE2QjE2QTE2X1VOT1JNXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9SMTZHMTZCMTZBMTZfU05PUk1cblx0fCB0eXBlb2YgVktfRk9STUFUX1IxNkcxNkIxNkExNl9VSU5UXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9SMTZHMTZCMTZBMTZfU0lOVFxuXHR8IHR5cGVvZiBWS19GT1JNQVRfUjE2RzE2QjE2QTE2X1NGTE9BVFxuXHR8IHR5cGVvZiBWS19GT1JNQVRfUjMyX1VJTlRcblx0fCB0eXBlb2YgVktfRk9STUFUX1IzMl9TSU5UXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9SMzJfU0ZMT0FUXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9SMzJHMzJfVUlOVFxuXHR8IHR5cGVvZiBWS19GT1JNQVRfUjMyRzMyX1NJTlRcblx0fCB0eXBlb2YgVktfRk9STUFUX1IzMkczMl9TRkxPQVRcblx0fCB0eXBlb2YgVktfRk9STUFUX1IzMkczMkIzMl9VSU5UXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9SMzJHMzJCMzJfU0lOVFxuXHR8IHR5cGVvZiBWS19GT1JNQVRfUjMyRzMyQjMyX1NGTE9BVFxuXHR8IHR5cGVvZiBWS19GT1JNQVRfUjMyRzMyQjMyQTMyX1VJTlRcblx0fCB0eXBlb2YgVktfRk9STUFUX1IzMkczMkIzMkEzMl9TSU5UXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9SMzJHMzJCMzJBMzJfU0ZMT0FUXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9SNjRfVUlOVFxuXHR8IHR5cGVvZiBWS19GT1JNQVRfUjY0X1NJTlRcblx0fCB0eXBlb2YgVktfRk9STUFUX1I2NF9TRkxPQVRcblx0fCB0eXBlb2YgVktfRk9STUFUX1I2NEc2NF9VSU5UXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9SNjRHNjRfU0lOVFxuXHR8IHR5cGVvZiBWS19GT1JNQVRfUjY0RzY0X1NGTE9BVFxuXHR8IHR5cGVvZiBWS19GT1JNQVRfUjY0RzY0QjY0X1VJTlRcblx0fCB0eXBlb2YgVktfRk9STUFUX1I2NEc2NEI2NF9TSU5UXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9SNjRHNjRCNjRfU0ZMT0FUXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9SNjRHNjRCNjRBNjRfVUlOVFxuXHR8IHR5cGVvZiBWS19GT1JNQVRfUjY0RzY0QjY0QTY0X1NJTlRcblx0fCB0eXBlb2YgVktfRk9STUFUX1I2NEc2NEI2NEE2NF9TRkxPQVRcblx0fCB0eXBlb2YgVktfRk9STUFUX0IxMEcxMVIxMV9VRkxPQVRfUEFDSzMyXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9FNUI5RzlSOV9VRkxPQVRfUEFDSzMyXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9EMTZfVU5PUk1cblx0fCB0eXBlb2YgVktfRk9STUFUX1g4X0QyNF9VTk9STV9QQUNLMzJcblx0fCB0eXBlb2YgVktfRk9STUFUX0QzMl9TRkxPQVRcblx0fCB0eXBlb2YgVktfRk9STUFUX1M4X1VJTlRcblx0fCB0eXBlb2YgVktfRk9STUFUX0QxNl9VTk9STV9TOF9VSU5UXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9EMjRfVU5PUk1fUzhfVUlOVFxuXHR8IHR5cGVvZiBWS19GT1JNQVRfRDMyX1NGTE9BVF9TOF9VSU5UXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9CQzFfUkdCX1VOT1JNX0JMT0NLXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9CQzFfUkdCX1NSR0JfQkxPQ0tcblx0fCB0eXBlb2YgVktfRk9STUFUX0JDMV9SR0JBX1VOT1JNX0JMT0NLXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9CQzFfUkdCQV9TUkdCX0JMT0NLXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9CQzJfVU5PUk1fQkxPQ0tcblx0fCB0eXBlb2YgVktfRk9STUFUX0JDMl9TUkdCX0JMT0NLXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9CQzNfVU5PUk1fQkxPQ0tcblx0fCB0eXBlb2YgVktfRk9STUFUX0JDM19TUkdCX0JMT0NLXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9CQzRfVU5PUk1fQkxPQ0tcblx0fCB0eXBlb2YgVktfRk9STUFUX0JDNF9TTk9STV9CTE9DS1xuXHR8IHR5cGVvZiBWS19GT1JNQVRfQkM1X1VOT1JNX0JMT0NLXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9CQzVfU05PUk1fQkxPQ0tcblx0fCB0eXBlb2YgVktfRk9STUFUX0JDNkhfVUZMT0FUX0JMT0NLXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9CQzZIX1NGTE9BVF9CTE9DS1xuXHR8IHR5cGVvZiBWS19GT1JNQVRfQkM3X1VOT1JNX0JMT0NLXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9CQzdfU1JHQl9CTE9DS1xuXHR8IHR5cGVvZiBWS19GT1JNQVRfRVRDMl9SOEc4QjhfVU5PUk1fQkxPQ0tcblx0fCB0eXBlb2YgVktfRk9STUFUX0VUQzJfUjhHOEI4X1NSR0JfQkxPQ0tcblx0fCB0eXBlb2YgVktfRk9STUFUX0VUQzJfUjhHOEI4QTFfVU5PUk1fQkxPQ0tcblx0fCB0eXBlb2YgVktfRk9STUFUX0VUQzJfUjhHOEI4QTFfU1JHQl9CTE9DS1xuXHR8IHR5cGVvZiBWS19GT1JNQVRfRVRDMl9SOEc4QjhBOF9VTk9STV9CTE9DS1xuXHR8IHR5cGVvZiBWS19GT1JNQVRfRVRDMl9SOEc4QjhBOF9TUkdCX0JMT0NLXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9FQUNfUjExX1VOT1JNX0JMT0NLXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9FQUNfUjExX1NOT1JNX0JMT0NLXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9FQUNfUjExRzExX1VOT1JNX0JMT0NLXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9FQUNfUjExRzExX1NOT1JNX0JMT0NLXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9BU1RDXzR4NF9VTk9STV9CTE9DS1xuXHR8IHR5cGVvZiBWS19GT1JNQVRfQVNUQ180eDRfU1JHQl9CTE9DS1xuXHR8IHR5cGVvZiBWS19GT1JNQVRfQVNUQ181eDRfVU5PUk1fQkxPQ0tcblx0fCB0eXBlb2YgVktfRk9STUFUX0FTVENfNXg0X1NSR0JfQkxPQ0tcblx0fCB0eXBlb2YgVktfRk9STUFUX0FTVENfNXg1X1VOT1JNX0JMT0NLXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9BU1RDXzV4NV9TUkdCX0JMT0NLXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9BU1RDXzZ4NV9VTk9STV9CTE9DS1xuXHR8IHR5cGVvZiBWS19GT1JNQVRfQVNUQ182eDVfU1JHQl9CTE9DS1xuXHR8IHR5cGVvZiBWS19GT1JNQVRfQVNUQ182eDZfVU5PUk1fQkxPQ0tcblx0fCB0eXBlb2YgVktfRk9STUFUX0FTVENfNng2X1NSR0JfQkxPQ0tcblx0fCB0eXBlb2YgVktfRk9STUFUX0FTVENfOHg1X1VOT1JNX0JMT0NLXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9BU1RDXzh4NV9TUkdCX0JMT0NLXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9BU1RDXzh4Nl9VTk9STV9CTE9DS1xuXHR8IHR5cGVvZiBWS19GT1JNQVRfQVNUQ184eDZfU1JHQl9CTE9DS1xuXHR8IHR5cGVvZiBWS19GT1JNQVRfQVNUQ184eDhfVU5PUk1fQkxPQ0tcblx0fCB0eXBlb2YgVktfRk9STUFUX0FTVENfOHg4X1NSR0JfQkxPQ0tcblx0fCB0eXBlb2YgVktfRk9STUFUX0FTVENfMTB4NV9VTk9STV9CTE9DS1xuXHR8IHR5cGVvZiBWS19GT1JNQVRfQVNUQ18xMHg1X1NSR0JfQkxPQ0tcblx0fCB0eXBlb2YgVktfRk9STUFUX0FTVENfMTB4Nl9VTk9STV9CTE9DS1xuXHR8IHR5cGVvZiBWS19GT1JNQVRfQVNUQ18xMHg2X1NSR0JfQkxPQ0tcblx0fCB0eXBlb2YgVktfRk9STUFUX0FTVENfMTB4OF9VTk9STV9CTE9DS1xuXHR8IHR5cGVvZiBWS19GT1JNQVRfQVNUQ18xMHg4X1NSR0JfQkxPQ0tcblx0fCB0eXBlb2YgVktfRk9STUFUX0FTVENfMTB4MTBfVU5PUk1fQkxPQ0tcblx0fCB0eXBlb2YgVktfRk9STUFUX0FTVENfMTB4MTBfU1JHQl9CTE9DS1xuXHR8IHR5cGVvZiBWS19GT1JNQVRfQVNUQ18xMngxMF9VTk9STV9CTE9DS1xuXHR8IHR5cGVvZiBWS19GT1JNQVRfQVNUQ18xMngxMF9TUkdCX0JMT0NLXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9BU1RDXzEyeDEyX1VOT1JNX0JMT0NLXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9BU1RDXzEyeDEyX1NSR0JfQkxPQ0tcblx0fCB0eXBlb2YgVktfRk9STUFUX1IxMFg2X1VOT1JNX1BBQ0sxNlxuXHR8IHR5cGVvZiBWS19GT1JNQVRfUjEwWDZHMTBYNl9VTk9STV8yUEFDSzE2XG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9SMTBYNkcxMFg2QjEwWDZBMTBYNl9VTk9STV80UEFDSzE2XG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9HMTBYNkIxMFg2RzEwWDZSMTBYNl80MjJfVU5PUk1fNFBBQ0sxNlxuXHR8IHR5cGVvZiBWS19GT1JNQVRfQjEwWDZHMTBYNlIxMFg2RzEwWDZfNDIyX1VOT1JNXzRQQUNLMTZcblx0fCB0eXBlb2YgVktfRk9STUFUX1IxMlg0X1VOT1JNX1BBQ0sxNlxuXHR8IHR5cGVvZiBWS19GT1JNQVRfUjEyWDRHMTJYNF9VTk9STV8yUEFDSzE2XG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9SMTJYNEcxMlg0QjEyWDRBMTJYNF9VTk9STV80UEFDSzE2XG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9HMTJYNEIxMlg0RzEyWDRSMTJYNF80MjJfVU5PUk1fNFBBQ0sxNlxuXHR8IHR5cGVvZiBWS19GT1JNQVRfQjEyWDRHMTJYNFIxMlg0RzEyWDRfNDIyX1VOT1JNXzRQQUNLMTZcblx0fCB0eXBlb2YgVktfRk9STUFUX1BWUlRDMV8yQlBQX1VOT1JNX0JMT0NLX0lNR1xuXHR8IHR5cGVvZiBWS19GT1JNQVRfUFZSVEMxXzRCUFBfVU5PUk1fQkxPQ0tfSU1HXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9QVlJUQzJfMkJQUF9VTk9STV9CTE9DS19JTUdcblx0fCB0eXBlb2YgVktfRk9STUFUX1BWUlRDMl80QlBQX1VOT1JNX0JMT0NLX0lNR1xuXHR8IHR5cGVvZiBWS19GT1JNQVRfUFZSVEMxXzJCUFBfU1JHQl9CTE9DS19JTUdcblx0fCB0eXBlb2YgVktfRk9STUFUX1BWUlRDMV80QlBQX1NSR0JfQkxPQ0tfSU1HXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9QVlJUQzJfMkJQUF9TUkdCX0JMT0NLX0lNR1xuXHR8IHR5cGVvZiBWS19GT1JNQVRfUFZSVEMyXzRCUFBfU1JHQl9CTE9DS19JTUdcblx0fCB0eXBlb2YgVktfRk9STUFUX0FTVENfNHg0X1NGTE9BVF9CTE9DS19FWFRcblx0fCB0eXBlb2YgVktfRk9STUFUX0FTVENfNXg0X1NGTE9BVF9CTE9DS19FWFRcblx0fCB0eXBlb2YgVktfRk9STUFUX0FTVENfNXg1X1NGTE9BVF9CTE9DS19FWFRcblx0fCB0eXBlb2YgVktfRk9STUFUX0FTVENfNng1X1NGTE9BVF9CTE9DS19FWFRcblx0fCB0eXBlb2YgVktfRk9STUFUX0FTVENfNng2X1NGTE9BVF9CTE9DS19FWFRcblx0fCB0eXBlb2YgVktfRk9STUFUX0FTVENfOHg1X1NGTE9BVF9CTE9DS19FWFRcblx0fCB0eXBlb2YgVktfRk9STUFUX0FTVENfOHg2X1NGTE9BVF9CTE9DS19FWFRcblx0fCB0eXBlb2YgVktfRk9STUFUX0FTVENfOHg4X1NGTE9BVF9CTE9DS19FWFRcblx0fCB0eXBlb2YgVktfRk9STUFUX0FTVENfMTB4NV9TRkxPQVRfQkxPQ0tfRVhUXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9BU1RDXzEweDZfU0ZMT0FUX0JMT0NLX0VYVFxuXHR8IHR5cGVvZiBWS19GT1JNQVRfQVNUQ18xMHg4X1NGTE9BVF9CTE9DS19FWFRcblx0fCB0eXBlb2YgVktfRk9STUFUX0FTVENfMTB4MTBfU0ZMT0FUX0JMT0NLX0VYVFxuXHR8IHR5cGVvZiBWS19GT1JNQVRfQVNUQ18xMngxMF9TRkxPQVRfQkxPQ0tfRVhUXG5cdHwgdHlwZW9mIFZLX0ZPUk1BVF9BU1RDXzEyeDEyX1NGTE9BVF9CTE9DS19FWFRcblx0fCB0eXBlb2YgVktfRk9STUFUX0E0UjRHNEI0X1VOT1JNX1BBQ0sxNl9FWFRcblx0fCB0eXBlb2YgVktfRk9STUFUX0E0QjRHNFI0X1VOT1JNX1BBQ0sxNl9FWFQ7XG4iLCAiaW1wb3J0IHtcblx0S0hSX0RGX0ZMQUdfQUxQSEFfU1RSQUlHSFQsXG5cdEtIUl9ERl9LSFJfREVTQ1JJUFRPUlRZUEVfQkFTSUNGT1JNQVQsXG5cdEtIUl9ERl9NT0RFTF9VTlNQRUNJRklFRCxcblx0S0hSX0RGX1BSSU1BUklFU19CVDcwOSxcblx0S0hSX0RGX1RSQU5TRkVSX1NSR0IsXG5cdEtIUl9ERl9WRU5ET1JJRF9LSFJPTk9TLFxuXHRLSFJfREZfVkVSU0lPTixcblx0S0hSX1NVUEVSQ09NUFJFU1NJT05fTk9ORSxcblx0VktfRk9STUFUX1VOREVGSU5FRCxcbn0gZnJvbSAnLi9jb25zdGFudHMuanMnO1xuaW1wb3J0IHR5cGUgeyBLVFgyQ29udGFpbmVyIH0gZnJvbSAnLi9jb250YWluZXIuanMnO1xuXG4vKipcbiAqIENyZWF0ZXMgYSAnZGVmYXVsdCcge0BsaW5rIEtUWDJDb250YWluZXJ9IG9iamVjdCwgaW5pdGlhbGl6ZWQgd2l0aCBjb21tb25cbiAqIGNvbmZpZ3VyYXRpb24gd2ZvciBCVDcwOSBwcmltYXJpZXMgYW5kIHNSR0IgdHJhbnNmZXIsIHdpdGhvdXQgcGl4ZWwgZGF0YS5cbiAqIFRoZXJlJ3Mgbm90aGluZyBwYXJ0aWN1bGFybHkgc3BlY2lhbCBhYm91dCB0aGUgJ2RlZmF1bHQnIGNvbnRhaW5lcjsgY3JlYXRpbmdcbiAqIHRoZSBLVFgyQ29udGFpbmVyIG9iamVjdCBleHBsaWNpdGx5IGlzIGFsc28gZmluZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZURlZmF1bHRDb250YWluZXIoKTogS1RYMkNvbnRhaW5lciB7XG5cdHJldHVybiB7XG5cdFx0dmtGb3JtYXQ6IFZLX0ZPUk1BVF9VTkRFRklORUQsXG5cdFx0dHlwZVNpemU6IDEsXG5cdFx0cGl4ZWxXaWR0aDogMCxcblx0XHRwaXhlbEhlaWdodDogMCxcblx0XHRwaXhlbERlcHRoOiAwLFxuXHRcdGxheWVyQ291bnQ6IDAsXG5cdFx0ZmFjZUNvdW50OiAxLFxuXHRcdGxldmVsQ291bnQ6IDAsXG5cdFx0c3VwZXJjb21wcmVzc2lvblNjaGVtZTogS0hSX1NVUEVSQ09NUFJFU1NJT05fTk9ORSxcblx0XHRsZXZlbHM6IFtdLFxuXHRcdGRhdGFGb3JtYXREZXNjcmlwdG9yOiBbXG5cdFx0XHR7XG5cdFx0XHRcdHZlbmRvcklkOiBLSFJfREZfVkVORE9SSURfS0hST05PUyxcblx0XHRcdFx0ZGVzY3JpcHRvclR5cGU6IEtIUl9ERl9LSFJfREVTQ1JJUFRPUlRZUEVfQkFTSUNGT1JNQVQsXG5cdFx0XHRcdHZlcnNpb25OdW1iZXI6IEtIUl9ERl9WRVJTSU9OLFxuXHRcdFx0XHRjb2xvck1vZGVsOiBLSFJfREZfTU9ERUxfVU5TUEVDSUZJRUQsXG5cdFx0XHRcdGNvbG9yUHJpbWFyaWVzOiBLSFJfREZfUFJJTUFSSUVTX0JUNzA5LFxuXHRcdFx0XHR0cmFuc2ZlckZ1bmN0aW9uOiBLSFJfREZfVFJBTlNGRVJfU1JHQixcblx0XHRcdFx0ZmxhZ3M6IEtIUl9ERl9GTEFHX0FMUEhBX1NUUkFJR0hULFxuXHRcdFx0XHR0ZXhlbEJsb2NrRGltZW5zaW9uOiBbMCwgMCwgMCwgMF0sXG5cdFx0XHRcdGJ5dGVzUGxhbmU6IFswLCAwLCAwLCAwLCAwLCAwLCAwLCAwXSxcblx0XHRcdFx0c2FtcGxlczogW10sXG5cdFx0XHR9LFxuXHRcdF0sXG5cdFx0a2V5VmFsdWU6IHt9LFxuXHRcdGdsb2JhbERhdGE6IG51bGwsXG5cdH07XG59XG4iLCAiZXhwb3J0IGNsYXNzIEJ1ZmZlclJlYWRlciB7XG5cdHByaXZhdGUgX2RhdGFWaWV3OiBEYXRhVmlldzxBcnJheUJ1ZmZlcj47XG5cdHByaXZhdGUgX2xpdHRsZUVuZGlhbjogYm9vbGVhbjtcblx0cHVibGljIF9vZmZzZXQ6IG51bWJlcjtcblxuXHRjb25zdHJ1Y3RvcihkYXRhOiBVaW50OEFycmF5PEFycmF5QnVmZmVyPiwgYnl0ZU9mZnNldDogbnVtYmVyLCBieXRlTGVuZ3RoOiBudW1iZXIsIGxpdHRsZUVuZGlhbjogYm9vbGVhbikge1xuXHRcdHRoaXMuX2RhdGFWaWV3ID0gbmV3IERhdGFWaWV3KGRhdGEuYnVmZmVyLCBkYXRhLmJ5dGVPZmZzZXQgKyBieXRlT2Zmc2V0LCBieXRlTGVuZ3RoKTtcblx0XHR0aGlzLl9saXR0bGVFbmRpYW4gPSBsaXR0bGVFbmRpYW47XG5cdFx0dGhpcy5fb2Zmc2V0ID0gMDtcblx0fVxuXG5cdF9uZXh0VWludDgoKTogbnVtYmVyIHtcblx0XHRjb25zdCB2YWx1ZSA9IHRoaXMuX2RhdGFWaWV3LmdldFVpbnQ4KHRoaXMuX29mZnNldCk7XG5cdFx0dGhpcy5fb2Zmc2V0ICs9IDE7XG5cdFx0cmV0dXJuIHZhbHVlO1xuXHR9XG5cblx0X25leHRVaW50MTYoKTogbnVtYmVyIHtcblx0XHRjb25zdCB2YWx1ZSA9IHRoaXMuX2RhdGFWaWV3LmdldFVpbnQxNih0aGlzLl9vZmZzZXQsIHRoaXMuX2xpdHRsZUVuZGlhbik7XG5cdFx0dGhpcy5fb2Zmc2V0ICs9IDI7XG5cdFx0cmV0dXJuIHZhbHVlO1xuXHR9XG5cblx0X25leHRVaW50MzIoKTogbnVtYmVyIHtcblx0XHRjb25zdCB2YWx1ZSA9IHRoaXMuX2RhdGFWaWV3LmdldFVpbnQzMih0aGlzLl9vZmZzZXQsIHRoaXMuX2xpdHRsZUVuZGlhbik7XG5cdFx0dGhpcy5fb2Zmc2V0ICs9IDQ7XG5cdFx0cmV0dXJuIHZhbHVlO1xuXHR9XG5cblx0X25leHRVaW50NjQoKTogbnVtYmVyIHtcblx0XHRjb25zdCBsZWZ0ID0gdGhpcy5fZGF0YVZpZXcuZ2V0VWludDMyKHRoaXMuX29mZnNldCwgdGhpcy5fbGl0dGxlRW5kaWFuKTtcblx0XHRjb25zdCByaWdodCA9IHRoaXMuX2RhdGFWaWV3LmdldFVpbnQzMih0aGlzLl9vZmZzZXQgKyA0LCB0aGlzLl9saXR0bGVFbmRpYW4pO1xuXHRcdC8vIFRPRE8oY2xlYW51cCk6IEp1c3QgdGVzdCB0aGlzLi4uXG5cdFx0Ly8gY29uc3QgdmFsdWUgPSB0aGlzLl9saXR0bGVFbmRpYW4gPyBsZWZ0ICsgKDIgKiogMzIgKiByaWdodCkgOiAoMiAqKiAzMiAqIGxlZnQpICsgcmlnaHQ7XG5cdFx0Y29uc3QgdmFsdWUgPSBsZWZ0ICsgMiAqKiAzMiAqIHJpZ2h0O1xuXHRcdHRoaXMuX29mZnNldCArPSA4O1xuXHRcdHJldHVybiB2YWx1ZTtcblx0fVxuXG5cdF9uZXh0SW50MzIoKTogbnVtYmVyIHtcblx0XHRjb25zdCB2YWx1ZSA9IHRoaXMuX2RhdGFWaWV3LmdldEludDMyKHRoaXMuX29mZnNldCwgdGhpcy5fbGl0dGxlRW5kaWFuKTtcblx0XHR0aGlzLl9vZmZzZXQgKz0gNDtcblx0XHRyZXR1cm4gdmFsdWU7XG5cdH1cblxuXHRfbmV4dFVpbnQ4QXJyYXkobGVuOiBudW1iZXIpOiBVaW50OEFycmF5PEFycmF5QnVmZmVyPiB7XG5cdFx0Y29uc3QgdmFsdWUgPSBuZXcgVWludDhBcnJheSh0aGlzLl9kYXRhVmlldy5idWZmZXIsIHRoaXMuX2RhdGFWaWV3LmJ5dGVPZmZzZXQgKyB0aGlzLl9vZmZzZXQsIGxlbik7XG5cdFx0dGhpcy5fb2Zmc2V0ICs9IGxlbjtcblx0XHRyZXR1cm4gdmFsdWU7XG5cdH1cblxuXHRfc2tpcChieXRlczogbnVtYmVyKTogdGhpcyB7XG5cdFx0dGhpcy5fb2Zmc2V0ICs9IGJ5dGVzO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblx0X3NjYW4obWF4Qnl0ZUxlbmd0aDogbnVtYmVyLCB0ZXJtID0gMHgwMCk6IFVpbnQ4QXJyYXk8QXJyYXlCdWZmZXI+IHtcblx0XHRjb25zdCBieXRlT2Zmc2V0ID0gdGhpcy5fb2Zmc2V0O1xuXHRcdGxldCBieXRlTGVuZ3RoID0gMDtcblx0XHR3aGlsZSAodGhpcy5fZGF0YVZpZXcuZ2V0VWludDgodGhpcy5fb2Zmc2V0KSAhPT0gdGVybSAmJiBieXRlTGVuZ3RoIDwgbWF4Qnl0ZUxlbmd0aCkge1xuXHRcdFx0Ynl0ZUxlbmd0aCsrO1xuXHRcdFx0dGhpcy5fb2Zmc2V0Kys7XG5cdFx0fVxuXG5cdFx0aWYgKGJ5dGVMZW5ndGggPCBtYXhCeXRlTGVuZ3RoKSB0aGlzLl9vZmZzZXQrKztcblxuXHRcdHJldHVybiBuZXcgVWludDhBcnJheSh0aGlzLl9kYXRhVmlldy5idWZmZXIsIHRoaXMuX2RhdGFWaWV3LmJ5dGVPZmZzZXQgKyBieXRlT2Zmc2V0LCBieXRlTGVuZ3RoKTtcblx0fVxufVxuIiwgIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gQ29tbW9uLlxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vIEB0cy1leHBlY3QtZXJyb3IgSW5qZWN0ZWQgYXQgYnVpbGQtdGltZSBmcm9tICRucG1fcGFja2FnZV92ZXJzaW9uLlxuZXhwb3J0IGNvbnN0IFBBQ0tBR0VfVkVSU0lPTjogc3RyaW5nID0gaW1wb3J0Lm1ldGEuZW52LlBBQ0tBR0VfVkVSU0lPTjtcblxuZXhwb3J0IGNvbnN0IEtUWF9XUklURVI6IHN0cmluZyA9IGBLVFgtUGFyc2UgdiR7UEFDS0FHRV9WRVJTSU9OfWA7XG5cbmV4cG9ydCBjb25zdCBOVUw6IFVpbnQ4QXJyYXk8QXJyYXlCdWZmZXI+ID0gbmV3IFVpbnQ4QXJyYXkoWzB4MDBdKTtcblxuZXhwb3J0IHR5cGUgdmVjMyA9IFtudW1iZXIsIG51bWJlciwgbnVtYmVyXTtcbmV4cG9ydCB0eXBlIHZlYzIgPSBbbnVtYmVyLCBudW1iZXIsIG51bWJlcl07XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gS1RYMiBIZWFkZXIuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZXhwb3J0IGNvbnN0IEtUWDJfSUQ6IG51bWJlcltdID0gW1xuXHQvLyAnwrQnLCAnSycsICdUJywgJ1gnLCAnMicsICcwJywgJ8KqJywgJ1xccicsICdcXG4nLCAnXFx4MUEnLCAnXFxuJ1xuXHQweGFiLCAweDRiLCAweDU0LCAweDU4LCAweDIwLCAweDMyLCAweDMwLCAweGJiLCAweDBkLCAweDBhLCAweDFhLCAweDBhLFxuXTtcblxuZXhwb3J0IGNvbnN0IEhFQURFUl9CWVRFX0xFTkdUSCA9IDY4OyAvLyAxMyAqIDQgKyAyICogOFxuIiwgImltcG9ydCB7XG5cdFZLX0ZPUk1BVF9BU1RDXzR4NF9TUkdCX0JMT0NLLFxuXHRWS19GT1JNQVRfQVNUQ180eDRfVU5PUk1fQkxPQ0ssXG5cdFZLX0ZPUk1BVF9BU1RDXzV4NF9TUkdCX0JMT0NLLFxuXHRWS19GT1JNQVRfQVNUQ181eDRfVU5PUk1fQkxPQ0ssXG5cdFZLX0ZPUk1BVF9BU1RDXzV4NV9TUkdCX0JMT0NLLFxuXHRWS19GT1JNQVRfQVNUQ181eDVfVU5PUk1fQkxPQ0ssXG5cdFZLX0ZPUk1BVF9BU1RDXzZ4NV9TUkdCX0JMT0NLLFxuXHRWS19GT1JNQVRfQVNUQ182eDVfVU5PUk1fQkxPQ0ssXG5cdFZLX0ZPUk1BVF9BU1RDXzZ4Nl9TUkdCX0JMT0NLLFxuXHRWS19GT1JNQVRfQVNUQ182eDZfVU5PUk1fQkxPQ0ssXG5cdFZLX0ZPUk1BVF9BU1RDXzh4NV9TUkdCX0JMT0NLLFxuXHRWS19GT1JNQVRfQVNUQ184eDVfVU5PUk1fQkxPQ0ssXG5cdFZLX0ZPUk1BVF9BU1RDXzh4Nl9TUkdCX0JMT0NLLFxuXHRWS19GT1JNQVRfQVNUQ184eDZfVU5PUk1fQkxPQ0ssXG5cdFZLX0ZPUk1BVF9BU1RDXzh4OF9TUkdCX0JMT0NLLFxuXHRWS19GT1JNQVRfQVNUQ184eDhfVU5PUk1fQkxPQ0ssXG5cdFZLX0ZPUk1BVF9BU1RDXzEweDVfU1JHQl9CTE9DSyxcblx0VktfRk9STUFUX0FTVENfMTB4NV9VTk9STV9CTE9DSyxcblx0VktfRk9STUFUX0FTVENfMTB4Nl9TUkdCX0JMT0NLLFxuXHRWS19GT1JNQVRfQVNUQ18xMHg2X1VOT1JNX0JMT0NLLFxuXHRWS19GT1JNQVRfQVNUQ18xMHg4X1NSR0JfQkxPQ0ssXG5cdFZLX0ZPUk1BVF9BU1RDXzEweDhfVU5PUk1fQkxPQ0ssXG5cdFZLX0ZPUk1BVF9BU1RDXzEweDEwX1NSR0JfQkxPQ0ssXG5cdFZLX0ZPUk1BVF9BU1RDXzEweDEwX1VOT1JNX0JMT0NLLFxuXHRWS19GT1JNQVRfQVNUQ18xMngxMF9TUkdCX0JMT0NLLFxuXHRWS19GT1JNQVRfQVNUQ18xMngxMF9VTk9STV9CTE9DSyxcblx0VktfRk9STUFUX0FTVENfMTJ4MTJfU1JHQl9CTE9DSyxcblx0VktfRk9STUFUX0FTVENfMTJ4MTJfVU5PUk1fQkxPQ0ssXG5cdFZLX0ZPUk1BVF9CQzFfUkdCX1VOT1JNX0JMT0NLLFxuXHRWS19GT1JNQVRfQkM3X1NSR0JfQkxPQ0ssXG5cdFZLX0ZPUk1BVF9FQUNfUjExRzExX1NOT1JNX0JMT0NLLFxuXHRWS19GT1JNQVRfRVRDMl9SOEc4QjhfVU5PUk1fQkxPQ0ssXG5cdFZLX0ZPUk1BVF9QVlJUQzFfMkJQUF9TUkdCX0JMT0NLX0lNRyxcblx0VktfRk9STUFUX1BWUlRDMV8yQlBQX1VOT1JNX0JMT0NLX0lNRyxcblx0VktfRk9STUFUX1BWUlRDMV80QlBQX1NSR0JfQkxPQ0tfSU1HLFxuXHRWS19GT1JNQVRfUFZSVEMxXzRCUFBfVU5PUk1fQkxPQ0tfSU1HLFxuXHRWS19GT1JNQVRfUFZSVEMyXzJCUFBfU1JHQl9CTE9DS19JTUcsXG5cdFZLX0ZPUk1BVF9QVlJUQzJfMkJQUF9VTk9STV9CTE9DS19JTUcsXG5cdFZLX0ZPUk1BVF9QVlJUQzJfNEJQUF9TUkdCX0JMT0NLX0lNRyxcblx0VktfRk9STUFUX1BWUlRDMl80QlBQX1VOT1JNX0JMT0NLX0lNRyxcblx0VktfRk9STUFUX1VOREVGSU5FRCxcblx0dHlwZSBWS0Zvcm1hdCxcbn0gZnJvbSAnLi9jb25zdGFudHMuanMnO1xuaW1wb3J0IHR5cGUgeyB2ZWMzIH0gZnJvbSAnLi9jb25zdGFudHMtaW50ZXJuYWwuanMnO1xuaW1wb3J0IHR5cGUgeyBLVFgyQ29udGFpbmVyIH0gZnJvbSAnLi9jb250YWluZXIuanMnO1xuXG4vKiogRW5jb2RlcyB0ZXh0IHRvIGFuIEFycmF5QnVmZmVyLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZVRleHQodGV4dDogc3RyaW5nKTogVWludDhBcnJheTxBcnJheUJ1ZmZlcj4ge1xuXHRyZXR1cm4gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKHRleHQpIGFzIFVpbnQ4QXJyYXk8QXJyYXlCdWZmZXI+O1xufVxuXG4vKiogRGVjb2RlcyBhbiBBcnJheUJ1ZmZlciB0byB0ZXh0LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZVRleHQoYnVmZmVyOiBVaW50OEFycmF5PEFycmF5QnVmZmVyPik6IHN0cmluZyB7XG5cdHJldHVybiBuZXcgVGV4dERlY29kZXIoKS5kZWNvZGUoYnVmZmVyKTtcbn1cblxuLyoqIENvbmNhdGVuYXRlcyBOIGJ5dGUgYXJyYXlzLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbmNhdChidWZmZXJzOiBVaW50OEFycmF5PEFycmF5QnVmZmVyPltdKTogVWludDhBcnJheTxBcnJheUJ1ZmZlcj4ge1xuXHRsZXQgdG90YWxCeXRlTGVuZ3RoID0gMDtcblx0Zm9yIChjb25zdCBidWZmZXIgb2YgYnVmZmVycykge1xuXHRcdHRvdGFsQnl0ZUxlbmd0aCArPSBidWZmZXIuYnl0ZUxlbmd0aDtcblx0fVxuXG5cdGNvbnN0IHJlc3VsdCA9IG5ldyBVaW50OEFycmF5KHRvdGFsQnl0ZUxlbmd0aCk7XG5cdGxldCBieXRlT2Zmc2V0ID0gMDtcblxuXHRmb3IgKGNvbnN0IGJ1ZmZlciBvZiBidWZmZXJzKSB7XG5cdFx0cmVzdWx0LnNldChuZXcgVWludDhBcnJheShidWZmZXIpLCBieXRlT2Zmc2V0KTtcblx0XHRieXRlT2Zmc2V0ICs9IGJ1ZmZlci5ieXRlTGVuZ3RoO1xuXHR9XG5cblx0cmV0dXJuIHJlc3VsdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvVmlldyh2aWV3OiBBcnJheUJ1ZmZlciB8IEFycmF5QnVmZmVyVmlldyk6IFVpbnQ4QXJyYXk8QXJyYXlCdWZmZXI+IHtcblx0aWYgKHZpZXcgaW5zdGFuY2VvZiBVaW50OEFycmF5KSB7XG5cdFx0cmV0dXJuIHZpZXcgYXMgVWludDhBcnJheTxBcnJheUJ1ZmZlcj47XG5cdH1cblx0aWYgKHZpZXcgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuXHRcdHJldHVybiBuZXcgVWludDhBcnJheSh2aWV3KTtcblx0fVxuXHRyZXR1cm4gbmV3IFVpbnQ4QXJyYXk8QXJyYXlCdWZmZXI+KFxuXHRcdHZpZXcuYnVmZmVyIGFzIEFycmF5QnVmZmVyLFxuXHRcdHZpZXcuYnl0ZU9mZnNldCxcblx0XHR2aWV3LmJ5dGVMZW5ndGggLyBVaW50OEFycmF5LkJZVEVTX1BFUl9FTEVNRU5ULFxuXHQpO1xufVxuXG4vKiogUmV0dXJucyB0aGUgbGVhc3QgY29tbW9uIG11bHRpcGxlIChMQ00pIGZvciB0d28gcG9zaXRpdmUgaW50ZWdlcnMuICovXG5leHBvcnQgZnVuY3Rpb24gbGVhc3RDb21tb25NdWx0aXBsZShhOiBudW1iZXIsIGI6IG51bWJlcik6IG51bWJlciB7XG5cdGNvbnN0IG1heCA9IE1hdGgubWF4KGEsIGIpO1xuXHRjb25zdCBtaW4gPSBNYXRoLm1pbihhLCBiKTtcblx0bGV0IGxjbSA9IG1heDtcblxuXHR3aGlsZSAobGNtICUgbWluICE9PSAwKSB7XG5cdFx0bGNtICs9IG1heDtcblx0fVxuXG5cdHJldHVybiBsY207XG59XG5cbi8qKlxuICogUmV0dXJucyBhbW91bnQgb2YgcGFkZGluZywgaW4gYnl0ZXMsIHJlcXVpcmVkIHRvIHBhZCBhIHZhbHVlIFYgdG8gTi1ieXRlXG4gKiBib3VuZGFyaWVzLiBCb3RoIFYgYW5kIE4gbXVzdCBiZSBwb3NpdGl2ZSBpbnRlZ2Vycy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhZGRpbmcodjogbnVtYmVyLCBuID0gNCk6IG51bWJlciB7XG5cdHJldHVybiBNYXRoLmNlaWwodiAvIG4pICogbiAtIHY7XG59XG5cbi8qKiBSZXR1cm5zIGJ5dGUgbGVuZ3RoIHBlciB0ZXhlbCBibG9jay4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRCbG9ja0J5dGVMZW5ndGgoY29udGFpbmVyOiBLVFgyQ29udGFpbmVyKTogbnVtYmVyIHtcblx0cmV0dXJuIGNvbnRhaW5lci5sZXZlbHNbMF0ubGV2ZWxEYXRhLmJ5dGVMZW5ndGggLyBnZXRCbG9ja0NvdW50KGNvbnRhaW5lciwgMCk7XG59XG5cbi8qKlxuICogUmV0dXJucyB0b3RhbCBudW1iZXIgb2YgYmxvY2tzIGZvciBnaXZlbiBsZXZlbC4gRm9yIFZLX0ZPUk1BVF9VTkRFRklORUQsIERGRCBpcyByZXF1aXJlZC5cbiAqXG4gKiBSZWZlcmVuY2VzOlxuICogLSBodHRwczovL2dpdGh1Yi5raHJvbm9zLm9yZy9LVFgtU3BlY2lmaWNhdGlvbi9rdHhzcGVjLnYyLmh0bWwjbGV2ZWxJbWFnZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEJsb2NrQ291bnQoY29udGFpbmVyOiBLVFgyQ29udGFpbmVyLCBsZXZlbEluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuXHRsZXQgYmxvY2tDb3VudCA9IDE7XG5cblx0Y29uc3QgcGl4ZWxEaW1lbnNpb25zID0gW2NvbnRhaW5lci5waXhlbFdpZHRoLCBjb250YWluZXIucGl4ZWxIZWlnaHQsIGNvbnRhaW5lci5waXhlbERlcHRoXTtcblx0Y29uc3QgYmxvY2tEaW1lbnNpb25zID0gZ2V0QmxvY2tEaW1lbnNpb25zKGNvbnRhaW5lcik7XG5cblx0Zm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspIHtcblx0XHRpZiAocGl4ZWxEaW1lbnNpb25zW2ldID4gMCkge1xuXHRcdFx0Y29uc3QgZGltQmxvY2tDb3VudCA9IE1hdGguY2VpbChNYXRoLmZsb29yKHBpeGVsRGltZW5zaW9uc1tpXSAqIDIgKiogLWxldmVsSW5kZXgpIC8gYmxvY2tEaW1lbnNpb25zW2ldKTtcblx0XHRcdGJsb2NrQ291bnQgKj0gTWF0aC5tYXgoMSwgZGltQmxvY2tDb3VudCk7XG5cdFx0fVxuXHR9XG5cblx0aWYgKGNvbnRhaW5lci5sYXllckNvdW50ID4gMCkge1xuXHRcdGJsb2NrQ291bnQgKj0gY29udGFpbmVyLmxheWVyQ291bnQ7XG5cdH1cblxuXHRpZiAoY29udGFpbmVyLmZhY2VDb3VudCA+IDApIHtcblx0XHRibG9ja0NvdW50ICo9IGNvbnRhaW5lci5mYWNlQ291bnQ7XG5cdH1cblxuXHRyZXR1cm4gYmxvY2tDb3VudDtcbn1cblxuLyoqXG4gKiBHaXZlbiBhIEtUWDIgY29udGFpbmVyLCByZXR1cm5zIGJsb2NrIGRpbWVuc2lvbnMgYXMgW3dpZHRoLCBoZWlnaHQsIGRlcHRoXS4gUmVxdWlyZXMgdmFsaWQgREZELlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0QmxvY2tEaW1lbnNpb25zKGNvbnRhaW5lcjogS1RYMkNvbnRhaW5lcik6IHZlYzMge1xuXHRjb25zdCBbeCwgeSwgel0gPSBjb250YWluZXIuZGF0YUZvcm1hdERlc2NyaXB0b3JbMF0udGV4ZWxCbG9ja0RpbWVuc2lvbjtcblx0cmV0dXJuIFt4ICsgMSwgeSArIDEsIHogKyAxXTtcbn1cblxuLyoqXG4gKiBHaXZlbiBgdmtGb3JtYXRgLCByZXR1cm5zIGJsb2NrIGRpbWVuc2lvbnMgYXMgW3dpZHRoLCBoZWlnaHQsIGRlcHRoXS4gRG9lcyBub3Qgc3VwcG9ydFxuICogVktfRk9STUFUX1VOREVGSU5FRC5cbiAqXG4gKiBSZWZlcmVuY2VzOlxuICogLSBodHRwczovL2dpdGh1Yi5raHJvbm9zLm9yZy9LVFgtU3BlY2lmaWNhdGlvbi9rdHhzcGVjLnYyLmh0bWwjX21pcHBhZGRpbmdcbiAqIC0gaHR0cHM6Ly9yZWdpc3RyeS5raHJvbm9zLm9yZy92dWxrYW4vc3BlY3MvMS4yLWV4dGVuc2lvbnMvaHRtbC92a3NwZWMuaHRtbCNmb3JtYXRzLWNvbXBhdGliaWxpdHlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEJsb2NrRGltZW5zaW9uc0J5VktGb3JtYXQodmtGb3JtYXQ6IFZLRm9ybWF0KTogdmVjMyB7XG5cdGlmICh2a0Zvcm1hdCA9PT0gVktfRk9STUFUX1VOREVGSU5FRCkge1xuXHRcdHRocm93IG5ldyBFcnJvcignVW5rbm93biBibG9jayBkaW1lbnNpb25zIGZvciBWS19GT1JNQVRfVU5ERUZJTkVELicpO1xuXHR9XG5cdGlmICh2a0Zvcm1hdCA+PSBWS19GT1JNQVRfQkMxX1JHQl9VTk9STV9CTE9DSyAmJiB2a0Zvcm1hdCA8PSBWS19GT1JNQVRfQkM3X1NSR0JfQkxPQ0spIHtcblx0XHRyZXR1cm4gWzQsIDQsIDFdO1xuXHR9XG5cdGlmICh2a0Zvcm1hdCA+PSBWS19GT1JNQVRfRVRDMl9SOEc4QjhfVU5PUk1fQkxPQ0sgJiYgdmtGb3JtYXQgPD0gVktfRk9STUFUX0VBQ19SMTFHMTFfU05PUk1fQkxPQ0spIHtcblx0XHRyZXR1cm4gWzQsIDQsIDFdO1xuXHR9XG5cdGlmICh2a0Zvcm1hdCA9PT0gVktfRk9STUFUX0FTVENfNHg0X1VOT1JNX0JMT0NLIHx8IHZrRm9ybWF0ID09PSBWS19GT1JNQVRfQVNUQ180eDRfU1JHQl9CTE9DSykge1xuXHRcdHJldHVybiBbNCwgNCwgMV07XG5cdH1cblx0aWYgKHZrRm9ybWF0ID09PSBWS19GT1JNQVRfQVNUQ181eDRfVU5PUk1fQkxPQ0sgfHwgdmtGb3JtYXQgPT09IFZLX0ZPUk1BVF9BU1RDXzV4NF9TUkdCX0JMT0NLKSB7XG5cdFx0cmV0dXJuIFs1LCA0LCAxXTtcblx0fVxuXHRpZiAodmtGb3JtYXQgPT09IFZLX0ZPUk1BVF9BU1RDXzV4NV9VTk9STV9CTE9DSyB8fCB2a0Zvcm1hdCA9PT0gVktfRk9STUFUX0FTVENfNXg1X1NSR0JfQkxPQ0spIHtcblx0XHRyZXR1cm4gWzUsIDUsIDFdO1xuXHR9XG5cdGlmICh2a0Zvcm1hdCA9PT0gVktfRk9STUFUX0FTVENfNng1X1VOT1JNX0JMT0NLIHx8IHZrRm9ybWF0ID09PSBWS19GT1JNQVRfQVNUQ182eDVfU1JHQl9CTE9DSykge1xuXHRcdHJldHVybiBbNiwgNSwgMV07XG5cdH1cblx0aWYgKHZrRm9ybWF0ID09PSBWS19GT1JNQVRfQVNUQ182eDZfVU5PUk1fQkxPQ0sgfHwgdmtGb3JtYXQgPT09IFZLX0ZPUk1BVF9BU1RDXzZ4Nl9TUkdCX0JMT0NLKSB7XG5cdFx0cmV0dXJuIFs2LCA2LCAxXTtcblx0fVxuXHRpZiAodmtGb3JtYXQgPT09IFZLX0ZPUk1BVF9BU1RDXzh4NV9VTk9STV9CTE9DSyB8fCB2a0Zvcm1hdCA9PT0gVktfRk9STUFUX0FTVENfOHg1X1NSR0JfQkxPQ0spIHtcblx0XHRyZXR1cm4gWzgsIDUsIDFdO1xuXHR9XG5cdGlmICh2a0Zvcm1hdCA9PT0gVktfRk9STUFUX0FTVENfOHg2X1VOT1JNX0JMT0NLIHx8IHZrRm9ybWF0ID09PSBWS19GT1JNQVRfQVNUQ184eDZfU1JHQl9CTE9DSykge1xuXHRcdHJldHVybiBbOCwgNiwgMV07XG5cdH1cblx0aWYgKHZrRm9ybWF0ID09PSBWS19GT1JNQVRfQVNUQ184eDhfVU5PUk1fQkxPQ0sgfHwgdmtGb3JtYXQgPT09IFZLX0ZPUk1BVF9BU1RDXzh4OF9TUkdCX0JMT0NLKSB7XG5cdFx0cmV0dXJuIFs4LCA4LCAxXTtcblx0fVxuXHRpZiAodmtGb3JtYXQgPT09IFZLX0ZPUk1BVF9BU1RDXzEweDVfVU5PUk1fQkxPQ0sgfHwgdmtGb3JtYXQgPT09IFZLX0ZPUk1BVF9BU1RDXzEweDVfU1JHQl9CTE9DSykge1xuXHRcdHJldHVybiBbMTAsIDUsIDFdO1xuXHR9XG5cdGlmICh2a0Zvcm1hdCA9PT0gVktfRk9STUFUX0FTVENfMTB4Nl9VTk9STV9CTE9DSyB8fCB2a0Zvcm1hdCA9PT0gVktfRk9STUFUX0FTVENfMTB4Nl9TUkdCX0JMT0NLKSB7XG5cdFx0cmV0dXJuIFsxMCwgNiwgMV07XG5cdH1cblx0aWYgKHZrRm9ybWF0ID09PSBWS19GT1JNQVRfQVNUQ18xMHg4X1VOT1JNX0JMT0NLIHx8IHZrRm9ybWF0ID09PSBWS19GT1JNQVRfQVNUQ18xMHg4X1NSR0JfQkxPQ0spIHtcblx0XHRyZXR1cm4gWzEwLCA4LCAxXTtcblx0fVxuXHRpZiAodmtGb3JtYXQgPT09IFZLX0ZPUk1BVF9BU1RDXzEweDEwX1VOT1JNX0JMT0NLIHx8IHZrRm9ybWF0ID09PSBWS19GT1JNQVRfQVNUQ18xMHgxMF9TUkdCX0JMT0NLKSB7XG5cdFx0cmV0dXJuIFsxMCwgMTAsIDFdO1xuXHR9XG5cdGlmICh2a0Zvcm1hdCA9PT0gVktfRk9STUFUX0FTVENfMTJ4MTBfVU5PUk1fQkxPQ0sgfHwgdmtGb3JtYXQgPT09IFZLX0ZPUk1BVF9BU1RDXzEyeDEwX1NSR0JfQkxPQ0spIHtcblx0XHRyZXR1cm4gWzEyLCAxMCwgMV07XG5cdH1cblx0aWYgKHZrRm9ybWF0ID09PSBWS19GT1JNQVRfQVNUQ18xMngxMl9VTk9STV9CTE9DSyB8fCB2a0Zvcm1hdCA9PT0gVktfRk9STUFUX0FTVENfMTJ4MTJfU1JHQl9CTE9DSykge1xuXHRcdHJldHVybiBbMTIsIDEyLCAxXTtcblx0fVxuXHRpZiAoXG5cdFx0dmtGb3JtYXQgPT09IFZLX0ZPUk1BVF9QVlJUQzFfMkJQUF9VTk9STV9CTE9DS19JTUcgfHxcblx0XHR2a0Zvcm1hdCA9PT0gVktfRk9STUFUX1BWUlRDMV8yQlBQX1NSR0JfQkxPQ0tfSU1HIHx8XG5cdFx0dmtGb3JtYXQgPT09IFZLX0ZPUk1BVF9QVlJUQzJfMkJQUF9VTk9STV9CTE9DS19JTUcgfHxcblx0XHR2a0Zvcm1hdCA9PT0gVktfRk9STUFUX1BWUlRDMl8yQlBQX1NSR0JfQkxPQ0tfSU1HXG5cdCkge1xuXHRcdHJldHVybiBbOCwgNCwgMV07XG5cdH1cblx0aWYgKFxuXHRcdHZrRm9ybWF0ID09PSBWS19GT1JNQVRfUFZSVEMxXzRCUFBfVU5PUk1fQkxPQ0tfSU1HIHx8XG5cdFx0dmtGb3JtYXQgPT09IFZLX0ZPUk1BVF9QVlJUQzFfNEJQUF9TUkdCX0JMT0NLX0lNRyB8fFxuXHRcdHZrRm9ybWF0ID09PSBWS19GT1JNQVRfUFZSVEMyXzRCUFBfVU5PUk1fQkxPQ0tfSU1HIHx8XG5cdFx0dmtGb3JtYXQgPT09IFZLX0ZPUk1BVF9QVlJUQzJfNEJQUF9TUkdCX0JMT0NLX0lNR1xuXHQpIHtcblx0XHRyZXR1cm4gWzQsIDQsIDFdO1xuXHR9XG5cdHJldHVybiBbMSwgMSwgMV07XG59XG4iLCAiaW1wb3J0IHsgQnVmZmVyUmVhZGVyIH0gZnJvbSAnLi9idWZmZXItcmVhZGVyLmpzJztcbmltcG9ydCB7IEtIUl9ERl9TQU1QTEVfREFUQVRZUEVfU0lHTkVELCB0eXBlIFN1cGVyY29tcHJlc3Npb24sIHR5cGUgVktGb3JtYXQgfSBmcm9tICcuL2NvbnN0YW50cy5qcyc7XG5pbXBvcnQgeyBLVFgyX0lEIH0gZnJvbSAnLi9jb25zdGFudHMtaW50ZXJuYWwuanMnO1xuaW1wb3J0IHR5cGUgeyBLVFgyQmFzaWNGb3JtYXRTYW1wbGUsIEtUWDJDb250YWluZXIsIEtUWDJEYXRhRm9ybWF0RGVzY3JpcHRvckJhc2ljRm9ybWF0IH0gZnJvbSAnLi9jb250YWluZXIuanMnO1xuaW1wb3J0IHsgY3JlYXRlRGVmYXVsdENvbnRhaW5lciB9IGZyb20gJy4vY3JlYXRlLWRlZmF1bHQtY29udGFpbmVyLmpzJztcbmltcG9ydCB7IGRlY29kZVRleHQgfSBmcm9tICcuL3V0aWwuanMnO1xuXG4vKipcbiAqIFBhcnNlcyBhIEtUWCAyLjAgZmlsZSwgcmV0dXJuaW5nIGFuIHVucGFja2VkIHtAbGluayBLVFgyQ29udGFpbmVyfSBpbnN0YW5jZSB3aXRoIGFsbCBhc3NvY2lhdGVkXG4gKiBkYXRhLiBSZXR1cm5lZCBtaXAgbGV2ZWxzIGFuZCBvdGhlciB0eXBlZCBhcnJheXMgYXJlIHBvaW50ZXJzIGludG8gdGhlIHNvdXJjZSBidWZmZXIsIG5vdFxuICogZGVlcCBjb3BpZXMg4oCUIHVzZSBjYXV0aW9uIGlmIG92ZXJ3cml0aW5nIGJ5dGVzIG9mIHRoZSBzb3VyY2UgYnVmZmVyIGxhdGVyLlxuICpcbiAqIEBwYXJhbSBkYXRhIEJ5dGVzIG9mIEtUWCAyLjAgZmlsZSwgYXMgVWludDhBcnJheSBvciBCdWZmZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWFkKGRhdGE6IFVpbnQ4QXJyYXkpOiBLVFgyQ29udGFpbmVyIHtcblx0Y29uc3QgYnl0ZXMgPSBkYXRhIGFzIFVpbnQ4QXJyYXk8QXJyYXlCdWZmZXI+O1xuXG5cdC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXHQvLyBLVFggMi4wIElkZW50aWZpZXIuXG5cdC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5cdGNvbnN0IGlkID0gbmV3IFVpbnQ4QXJyYXkoYnl0ZXMuYnVmZmVyLCBieXRlcy5ieXRlT2Zmc2V0LCBLVFgyX0lELmxlbmd0aCk7XG5cdGlmIChcblx0XHRpZFswXSAhPT0gS1RYMl9JRFswXSB8fCAvLyAnwrQnXG5cdFx0aWRbMV0gIT09IEtUWDJfSURbMV0gfHwgLy8gJ0snXG5cdFx0aWRbMl0gIT09IEtUWDJfSURbMl0gfHwgLy8gJ1QnXG5cdFx0aWRbM10gIT09IEtUWDJfSURbM10gfHwgLy8gJ1gnXG5cdFx0aWRbNF0gIT09IEtUWDJfSURbNF0gfHwgLy8gJyAnXG5cdFx0aWRbNV0gIT09IEtUWDJfSURbNV0gfHwgLy8gJzInXG5cdFx0aWRbNl0gIT09IEtUWDJfSURbNl0gfHwgLy8gJzAnXG5cdFx0aWRbN10gIT09IEtUWDJfSURbN10gfHwgLy8gJ8KqJ1xuXHRcdGlkWzhdICE9PSBLVFgyX0lEWzhdIHx8IC8vICdcXHInXG5cdFx0aWRbOV0gIT09IEtUWDJfSURbOV0gfHwgLy8gJ1xcbidcblx0XHRpZFsxMF0gIT09IEtUWDJfSURbMTBdIHx8IC8vICdcXHgxQSdcblx0XHRpZFsxMV0gIT09IEtUWDJfSURbMTFdIC8vICdcXG4nXG5cdCkge1xuXHRcdHRocm93IG5ldyBFcnJvcignTWlzc2luZyBLVFggMi4wIGlkZW50aWZpZXIuJyk7XG5cdH1cblxuXHRjb25zdCBjb250YWluZXIgPSBjcmVhdGVEZWZhdWx0Q29udGFpbmVyKCk7XG5cblx0Ly8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cdC8vIEhlYWRlci5cblx0Ly8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblx0Y29uc3QgaGVhZGVyQnl0ZUxlbmd0aCA9IDE3ICogVWludDMyQXJyYXkuQllURVNfUEVSX0VMRU1FTlQ7XG5cdGNvbnN0IGhlYWRlclJlYWRlciA9IG5ldyBCdWZmZXJSZWFkZXIoYnl0ZXMsIEtUWDJfSUQubGVuZ3RoLCBoZWFkZXJCeXRlTGVuZ3RoLCB0cnVlKTtcblxuXHRjb250YWluZXIudmtGb3JtYXQgPSBoZWFkZXJSZWFkZXIuX25leHRVaW50MzIoKSBhcyBWS0Zvcm1hdDtcblx0Y29udGFpbmVyLnR5cGVTaXplID0gaGVhZGVyUmVhZGVyLl9uZXh0VWludDMyKCk7XG5cdGNvbnRhaW5lci5waXhlbFdpZHRoID0gaGVhZGVyUmVhZGVyLl9uZXh0VWludDMyKCk7XG5cdGNvbnRhaW5lci5waXhlbEhlaWdodCA9IGhlYWRlclJlYWRlci5fbmV4dFVpbnQzMigpO1xuXHRjb250YWluZXIucGl4ZWxEZXB0aCA9IGhlYWRlclJlYWRlci5fbmV4dFVpbnQzMigpO1xuXHRjb250YWluZXIubGF5ZXJDb3VudCA9IGhlYWRlclJlYWRlci5fbmV4dFVpbnQzMigpO1xuXHRjb250YWluZXIuZmFjZUNvdW50ID0gaGVhZGVyUmVhZGVyLl9uZXh0VWludDMyKCk7XG5cdGNvbnRhaW5lci5sZXZlbENvdW50ID0gaGVhZGVyUmVhZGVyLl9uZXh0VWludDMyKCk7XG5cblx0Y29udGFpbmVyLnN1cGVyY29tcHJlc3Npb25TY2hlbWUgPSBoZWFkZXJSZWFkZXIuX25leHRVaW50MzIoKSBhcyBTdXBlcmNvbXByZXNzaW9uO1xuXG5cdGNvbnN0IGRmZEJ5dGVPZmZzZXQgPSBoZWFkZXJSZWFkZXIuX25leHRVaW50MzIoKTtcblx0Y29uc3QgZGZkQnl0ZUxlbmd0aCA9IGhlYWRlclJlYWRlci5fbmV4dFVpbnQzMigpO1xuXHRjb25zdCBrdmRCeXRlT2Zmc2V0ID0gaGVhZGVyUmVhZGVyLl9uZXh0VWludDMyKCk7XG5cdGNvbnN0IGt2ZEJ5dGVMZW5ndGggPSBoZWFkZXJSZWFkZXIuX25leHRVaW50MzIoKTtcblx0Y29uc3Qgc2dkQnl0ZU9mZnNldCA9IGhlYWRlclJlYWRlci5fbmV4dFVpbnQ2NCgpO1xuXHRjb25zdCBzZ2RCeXRlTGVuZ3RoID0gaGVhZGVyUmVhZGVyLl9uZXh0VWludDY0KCk7XG5cblx0Ly8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cdC8vIExldmVsIEluZGV4LlxuXHQvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXHRjb25zdCBsZXZlbEJ5dGVMZW5ndGggPSBNYXRoLm1heChjb250YWluZXIubGV2ZWxDb3VudCwgMSkgKiAzICogODtcblx0Y29uc3QgbGV2ZWxSZWFkZXIgPSBuZXcgQnVmZmVyUmVhZGVyKGJ5dGVzLCBLVFgyX0lELmxlbmd0aCArIGhlYWRlckJ5dGVMZW5ndGgsIGxldmVsQnl0ZUxlbmd0aCwgdHJ1ZSk7XG5cblx0Zm9yIChsZXQgaSA9IDAsIGlsID0gTWF0aC5tYXgoY29udGFpbmVyLmxldmVsQ291bnQsIDEpOyBpIDwgaWw7IGkrKykge1xuXHRcdGNvbnRhaW5lci5sZXZlbHMucHVzaCh7XG5cdFx0XHRsZXZlbERhdGE6IG5ldyBVaW50OEFycmF5KGJ5dGVzLmJ1ZmZlciwgYnl0ZXMuYnl0ZU9mZnNldCArIGxldmVsUmVhZGVyLl9uZXh0VWludDY0KCksIGxldmVsUmVhZGVyLl9uZXh0VWludDY0KCkpLFxuXHRcdFx0dW5jb21wcmVzc2VkQnl0ZUxlbmd0aDogbGV2ZWxSZWFkZXIuX25leHRVaW50NjQoKSxcblx0XHR9KTtcblx0fVxuXG5cdC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXHQvLyBEYXRhIEZvcm1hdCBEZXNjcmlwdG9yIChERkQpLlxuXHQvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXHRjb25zdCBkZmRSZWFkZXIgPSBuZXcgQnVmZmVyUmVhZGVyKGJ5dGVzLCBkZmRCeXRlT2Zmc2V0LCBkZmRCeXRlTGVuZ3RoLCB0cnVlKTtcblxuXHRkZmRSZWFkZXIuX3NraXAoNCk7IC8vIHRvdGFsU2l6ZVxuXHRjb25zdCB2ZW5kb3JJZCA9IGRmZFJlYWRlci5fbmV4dFVpbnQxNigpO1xuXHRjb25zdCBkZXNjcmlwdG9yVHlwZSA9IGRmZFJlYWRlci5fbmV4dFVpbnQxNigpO1xuXHRjb25zdCB2ZXJzaW9uTnVtYmVyID0gZGZkUmVhZGVyLl9uZXh0VWludDE2KCk7XG5cdGNvbnN0IGRlc2NyaXB0b3JCbG9ja1NpemUgPSBkZmRSZWFkZXIuX25leHRVaW50MTYoKTtcblx0Y29uc3QgY29sb3JNb2RlbCA9IGRmZFJlYWRlci5fbmV4dFVpbnQ4KCk7XG5cdGNvbnN0IGNvbG9yUHJpbWFyaWVzID0gZGZkUmVhZGVyLl9uZXh0VWludDgoKTtcblx0Y29uc3QgdHJhbnNmZXJGdW5jdGlvbiA9IGRmZFJlYWRlci5fbmV4dFVpbnQ4KCk7XG5cdGNvbnN0IGZsYWdzID0gZGZkUmVhZGVyLl9uZXh0VWludDgoKTtcblxuXHRjb25zdCB0ZXhlbEJsb2NrRGltZW5zaW9uID0gW1xuXHRcdGRmZFJlYWRlci5fbmV4dFVpbnQ4KCksXG5cdFx0ZGZkUmVhZGVyLl9uZXh0VWludDgoKSxcblx0XHRkZmRSZWFkZXIuX25leHRVaW50OCgpLFxuXHRcdGRmZFJlYWRlci5fbmV4dFVpbnQ4KCksXG5cdF0gYXMgS1RYMkRhdGFGb3JtYXREZXNjcmlwdG9yQmFzaWNGb3JtYXRbJ3RleGVsQmxvY2tEaW1lbnNpb24nXTtcblxuXHRjb25zdCBieXRlc1BsYW5lID0gW1xuXHRcdGRmZFJlYWRlci5fbmV4dFVpbnQ4KCksXG5cdFx0ZGZkUmVhZGVyLl9uZXh0VWludDgoKSxcblx0XHRkZmRSZWFkZXIuX25leHRVaW50OCgpLFxuXHRcdGRmZFJlYWRlci5fbmV4dFVpbnQ4KCksXG5cdFx0ZGZkUmVhZGVyLl9uZXh0VWludDgoKSxcblx0XHRkZmRSZWFkZXIuX25leHRVaW50OCgpLFxuXHRcdGRmZFJlYWRlci5fbmV4dFVpbnQ4KCksXG5cdFx0ZGZkUmVhZGVyLl9uZXh0VWludDgoKSxcblx0XSBhcyBLVFgyRGF0YUZvcm1hdERlc2NyaXB0b3JCYXNpY0Zvcm1hdFsnYnl0ZXNQbGFuZSddO1xuXG5cdGNvbnN0IHNhbXBsZXMgPSBbXSBhcyBLVFgyQmFzaWNGb3JtYXRTYW1wbGVbXTtcblxuXHRjb25zdCBkZmQ6IEtUWDJEYXRhRm9ybWF0RGVzY3JpcHRvckJhc2ljRm9ybWF0ID0ge1xuXHRcdHZlbmRvcklkLFxuXHRcdGRlc2NyaXB0b3JUeXBlLFxuXHRcdHZlcnNpb25OdW1iZXIsXG5cdFx0Y29sb3JNb2RlbCxcblx0XHRjb2xvclByaW1hcmllcyxcblx0XHR0cmFuc2ZlckZ1bmN0aW9uLFxuXHRcdGZsYWdzLFxuXHRcdHRleGVsQmxvY2tEaW1lbnNpb24sXG5cdFx0Ynl0ZXNQbGFuZSxcblx0XHRzYW1wbGVzLFxuXHR9O1xuXG5cdGNvbnN0IHNhbXBsZVN0YXJ0ID0gNjtcblx0Y29uc3Qgc2FtcGxlV29yZHMgPSA0O1xuXHRjb25zdCBudW1TYW1wbGVzID0gKGRlc2NyaXB0b3JCbG9ja1NpemUgLyA0IC0gc2FtcGxlU3RhcnQpIC8gc2FtcGxlV29yZHM7XG5cblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBudW1TYW1wbGVzOyBpKyspIHtcblx0XHRjb25zdCBzYW1wbGUgPSB7XG5cdFx0XHRiaXRPZmZzZXQ6IGRmZFJlYWRlci5fbmV4dFVpbnQxNigpLFxuXHRcdFx0Yml0TGVuZ3RoOiBkZmRSZWFkZXIuX25leHRVaW50OCgpLFxuXHRcdFx0Y2hhbm5lbFR5cGU6IGRmZFJlYWRlci5fbmV4dFVpbnQ4KCksXG5cdFx0XHRzYW1wbGVQb3NpdGlvbjogW2RmZFJlYWRlci5fbmV4dFVpbnQ4KCksIGRmZFJlYWRlci5fbmV4dFVpbnQ4KCksIGRmZFJlYWRlci5fbmV4dFVpbnQ4KCksIGRmZFJlYWRlci5fbmV4dFVpbnQ4KCldLFxuXHRcdFx0c2FtcGxlTG93ZXI6IE51bWJlci5ORUdBVElWRV9JTkZJTklUWSxcblx0XHRcdHNhbXBsZVVwcGVyOiBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksXG5cdFx0fTtcblxuXHRcdGlmIChzYW1wbGUuY2hhbm5lbFR5cGUgJiBLSFJfREZfU0FNUExFX0RBVEFUWVBFX1NJR05FRCkge1xuXHRcdFx0c2FtcGxlLnNhbXBsZUxvd2VyID0gZGZkUmVhZGVyLl9uZXh0SW50MzIoKTtcblx0XHRcdHNhbXBsZS5zYW1wbGVVcHBlciA9IGRmZFJlYWRlci5fbmV4dEludDMyKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHNhbXBsZS5zYW1wbGVMb3dlciA9IGRmZFJlYWRlci5fbmV4dFVpbnQzMigpO1xuXHRcdFx0c2FtcGxlLnNhbXBsZVVwcGVyID0gZGZkUmVhZGVyLl9uZXh0VWludDMyKCk7XG5cdFx0fVxuXG5cdFx0ZGZkLnNhbXBsZXNbaV0gPSBzYW1wbGU7XG5cdH1cblxuXHRjb250YWluZXIuZGF0YUZvcm1hdERlc2NyaXB0b3IubGVuZ3RoID0gMDtcblx0Y29udGFpbmVyLmRhdGFGb3JtYXREZXNjcmlwdG9yLnB1c2goZGZkKTtcblxuXHQvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblx0Ly8gS2V5L1ZhbHVlIERhdGEgKEtWRCkuXG5cdC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5cdGNvbnN0IGt2ZFJlYWRlciA9IG5ldyBCdWZmZXJSZWFkZXIoYnl0ZXMsIGt2ZEJ5dGVPZmZzZXQsIGt2ZEJ5dGVMZW5ndGgsIHRydWUpO1xuXG5cdHdoaWxlIChrdmRSZWFkZXIuX29mZnNldCA8IGt2ZEJ5dGVMZW5ndGgpIHtcblx0XHRjb25zdCBrZXlWYWx1ZUJ5dGVMZW5ndGggPSBrdmRSZWFkZXIuX25leHRVaW50MzIoKTtcblx0XHRjb25zdCBrZXlEYXRhID0ga3ZkUmVhZGVyLl9zY2FuKGtleVZhbHVlQnl0ZUxlbmd0aCk7XG5cdFx0Y29uc3Qga2V5ID0gZGVjb2RlVGV4dChrZXlEYXRhKTtcblxuXHRcdGNvbnRhaW5lci5rZXlWYWx1ZVtrZXldID0ga3ZkUmVhZGVyLl9uZXh0VWludDhBcnJheShrZXlWYWx1ZUJ5dGVMZW5ndGggLSBrZXlEYXRhLmJ5dGVMZW5ndGggLSAxKTtcblxuXHRcdGlmIChrZXkubWF0Y2goL15rdHgvaSkpIHtcblx0XHRcdGNvbnN0IHRleHQgPSBkZWNvZGVUZXh0KGNvbnRhaW5lci5rZXlWYWx1ZVtrZXldIGFzIFVpbnQ4QXJyYXk8QXJyYXlCdWZmZXI+KTtcblx0XHRcdGNvbnRhaW5lci5rZXlWYWx1ZVtrZXldID0gdGV4dC5zdWJzdHJpbmcoMCwgdGV4dC5sYXN0SW5kZXhPZignXFx4MDAnKSk7XG5cdFx0fVxuXG5cdFx0Y29uc3Qga3ZQYWRkaW5nID0ga2V5VmFsdWVCeXRlTGVuZ3RoICUgNCA/IDQgLSAoa2V5VmFsdWVCeXRlTGVuZ3RoICUgNCkgOiAwOyAvLyBhbGlnbig0KVxuXHRcdC8vIDQtYnl0ZSBhbGlnbm1lbnQuXG5cdFx0a3ZkUmVhZGVyLl9za2lwKGt2UGFkZGluZyk7XG5cdH1cblxuXHQvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblx0Ly8gU3VwZXJjb21wcmVzc2lvbiBHbG9iYWwgRGF0YSAoU0dEKS5cblx0Ly8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblx0aWYgKHNnZEJ5dGVMZW5ndGggPD0gMCkgcmV0dXJuIGNvbnRhaW5lcjtcblxuXHRjb25zdCBzZ2RSZWFkZXIgPSBuZXcgQnVmZmVyUmVhZGVyKGJ5dGVzLCBzZ2RCeXRlT2Zmc2V0LCBzZ2RCeXRlTGVuZ3RoLCB0cnVlKTtcblxuXHRjb25zdCBlbmRwb2ludENvdW50ID0gc2dkUmVhZGVyLl9uZXh0VWludDE2KCk7XG5cdGNvbnN0IHNlbGVjdG9yQ291bnQgPSBzZ2RSZWFkZXIuX25leHRVaW50MTYoKTtcblx0Y29uc3QgZW5kcG9pbnRzQnl0ZUxlbmd0aCA9IHNnZFJlYWRlci5fbmV4dFVpbnQzMigpO1xuXHRjb25zdCBzZWxlY3RvcnNCeXRlTGVuZ3RoID0gc2dkUmVhZGVyLl9uZXh0VWludDMyKCk7XG5cdGNvbnN0IHRhYmxlc0J5dGVMZW5ndGggPSBzZ2RSZWFkZXIuX25leHRVaW50MzIoKTtcblx0Y29uc3QgZXh0ZW5kZWRCeXRlTGVuZ3RoID0gc2dkUmVhZGVyLl9uZXh0VWludDMyKCk7XG5cblx0Y29uc3QgaW1hZ2VEZXNjcyA9IFtdO1xuXHRmb3IgKGxldCBpID0gMCwgaWwgPSBNYXRoLm1heChjb250YWluZXIubGV2ZWxDb3VudCwgMSk7IGkgPCBpbDsgaSsrKSB7XG5cdFx0aW1hZ2VEZXNjcy5wdXNoKHtcblx0XHRcdGltYWdlRmxhZ3M6IHNnZFJlYWRlci5fbmV4dFVpbnQzMigpLFxuXHRcdFx0cmdiU2xpY2VCeXRlT2Zmc2V0OiBzZ2RSZWFkZXIuX25leHRVaW50MzIoKSxcblx0XHRcdHJnYlNsaWNlQnl0ZUxlbmd0aDogc2dkUmVhZGVyLl9uZXh0VWludDMyKCksXG5cdFx0XHRhbHBoYVNsaWNlQnl0ZU9mZnNldDogc2dkUmVhZGVyLl9uZXh0VWludDMyKCksXG5cdFx0XHRhbHBoYVNsaWNlQnl0ZUxlbmd0aDogc2dkUmVhZGVyLl9uZXh0VWludDMyKCksXG5cdFx0fSk7XG5cdH1cblxuXHRjb25zdCBlbmRwb2ludHNCeXRlT2Zmc2V0ID0gc2dkQnl0ZU9mZnNldCArIHNnZFJlYWRlci5fb2Zmc2V0O1xuXHRjb25zdCBzZWxlY3RvcnNCeXRlT2Zmc2V0ID0gZW5kcG9pbnRzQnl0ZU9mZnNldCArIGVuZHBvaW50c0J5dGVMZW5ndGg7XG5cdGNvbnN0IHRhYmxlc0J5dGVPZmZzZXQgPSBzZWxlY3RvcnNCeXRlT2Zmc2V0ICsgc2VsZWN0b3JzQnl0ZUxlbmd0aDtcblx0Y29uc3QgZXh0ZW5kZWRCeXRlT2Zmc2V0ID0gdGFibGVzQnl0ZU9mZnNldCArIHRhYmxlc0J5dGVMZW5ndGg7XG5cblx0Y29uc3QgZW5kcG9pbnRzRGF0YSA9IG5ldyBVaW50OEFycmF5KGJ5dGVzLmJ1ZmZlciwgYnl0ZXMuYnl0ZU9mZnNldCArIGVuZHBvaW50c0J5dGVPZmZzZXQsIGVuZHBvaW50c0J5dGVMZW5ndGgpO1xuXHRjb25zdCBzZWxlY3RvcnNEYXRhID0gbmV3IFVpbnQ4QXJyYXkoYnl0ZXMuYnVmZmVyLCBieXRlcy5ieXRlT2Zmc2V0ICsgc2VsZWN0b3JzQnl0ZU9mZnNldCwgc2VsZWN0b3JzQnl0ZUxlbmd0aCk7XG5cdGNvbnN0IHRhYmxlc0RhdGEgPSBuZXcgVWludDhBcnJheShieXRlcy5idWZmZXIsIGJ5dGVzLmJ5dGVPZmZzZXQgKyB0YWJsZXNCeXRlT2Zmc2V0LCB0YWJsZXNCeXRlTGVuZ3RoKTtcblx0Y29uc3QgZXh0ZW5kZWREYXRhID0gbmV3IFVpbnQ4QXJyYXkoYnl0ZXMuYnVmZmVyLCBieXRlcy5ieXRlT2Zmc2V0ICsgZXh0ZW5kZWRCeXRlT2Zmc2V0LCBleHRlbmRlZEJ5dGVMZW5ndGgpO1xuXG5cdGNvbnRhaW5lci5nbG9iYWxEYXRhID0ge1xuXHRcdGVuZHBvaW50Q291bnQsXG5cdFx0c2VsZWN0b3JDb3VudCxcblx0XHRpbWFnZURlc2NzLFxuXHRcdGVuZHBvaW50c0RhdGEsXG5cdFx0c2VsZWN0b3JzRGF0YSxcblx0XHR0YWJsZXNEYXRhLFxuXHRcdGV4dGVuZGVkRGF0YSxcblx0fTtcblxuXHRyZXR1cm4gY29udGFpbmVyO1xufVxuIiwgImltcG9ydCB7XG5cdEtIUl9ERl9LSFJfREVTQ1JJUFRPUlRZUEVfQkFTSUNGT1JNQVQsXG5cdEtIUl9ERl9TQU1QTEVfREFUQVRZUEVfU0lHTkVELFxuXHRLSFJfU1VQRVJDT01QUkVTU0lPTl9OT05FLFxufSBmcm9tICcuL2NvbnN0YW50cy5qcyc7XG5pbXBvcnQgeyBIRUFERVJfQllURV9MRU5HVEgsIEtUWF9XUklURVIsIEtUWDJfSUQsIE5VTCB9IGZyb20gJy4vY29uc3RhbnRzLWludGVybmFsLmpzJztcbmltcG9ydCB0eXBlIHsgS1RYMkNvbnRhaW5lciB9IGZyb20gJy4vY29udGFpbmVyLmpzJztcbmltcG9ydCB7IGNvbmNhdCwgZW5jb2RlVGV4dCwgZ2V0QmxvY2tCeXRlTGVuZ3RoLCBnZXRQYWRkaW5nLCBsZWFzdENvbW1vbk11bHRpcGxlLCB0b1ZpZXcgfSBmcm9tICcuL3V0aWwuanMnO1xuXG5pbnRlcmZhY2UgV3JpdGVPcHRpb25zIHtcblx0a2VlcFdyaXRlcj86IGJvb2xlYW47XG59XG5jb25zdCBERUZBVUxUX09QVElPTlM6IFdyaXRlT3B0aW9ucyA9IHsga2VlcFdyaXRlcjogZmFsc2UgfTtcblxuLyoqXG4gKiBTZXJpYWxpemVzIGEge0BsaW5rIEtUWDJDb250YWluZXJ9IGluc3RhbmNlIHRvIGEgS1RYIDIuMCBmaWxlLiBNaXAgbGV2ZWxzIGFuZCBvdGhlciBiaW5hcnkgZGF0YVxuICogYXJlIGNvcGllZCBpbnRvIHRoZSByZXN1bHRpbmcgVWludDhBcnJheSwgc28gdGhlIG9yaWdpbmFsIGNvbnRhaW5lciBjYW4gc2FmZWx5IGJlIGVkaXRlZCBvclxuICogZGVzdHJveWVkIGFmdGVyIGl0IGlzIHNlcmlhbGl6ZWQuXG4gKlxuICogT3B0aW9uczpcbiAqIC0ga2VlcFdyaXRlcjogSWYgdHJ1ZSwgJ0tUWFdyaXRlcicga2V5L3ZhbHVlIGZpZWxkIGlzIHdyaXR0ZW4gYXMgcHJvdmlkZWQgYnkgdGhlIGNvbnRhaW5lci5cbiAqIFx0XHRPdGhlcndpc2UsIGEgc3RyaW5nIGZvciB0aGUgY3VycmVudCBrdHgtcGFyc2UgdmVyc2lvbiBpcyBnZW5lcmF0ZWQuIERlZmF1bHQ6IGZhbHNlLlxuICpcbiAqIEBwYXJhbSBjb250YWluZXJcbiAqIEBwYXJhbSBvcHRpb25zXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZShjb250YWluZXI6IEtUWDJDb250YWluZXIsIG9wdGlvbnM6IFdyaXRlT3B0aW9ucyA9IHt9KTogVWludDhBcnJheTxBcnJheUJ1ZmZlcj4ge1xuXHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdHlsZS9ub1BhcmFtZXRlckFzc2lnbjogTWVyZ2luZyBkZWZhdWx0cyBvbmx5LlxuXHRvcHRpb25zID0geyAuLi5ERUZBVUxUX09QVElPTlMsIC4uLm9wdGlvbnMgfTtcblxuXHQvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblx0Ly8gU3VwZXJjb21wcmVzc2lvbiBHbG9iYWwgRGF0YSAoU0dEKS5cblx0Ly8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblx0bGV0IHNnZEJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KG5ldyBBcnJheUJ1ZmZlcigwKSk7XG5cdGlmIChjb250YWluZXIuZ2xvYmFsRGF0YSkge1xuXHRcdGNvbnN0IHNnZEhlYWRlckJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcigyMCArIGNvbnRhaW5lci5nbG9iYWxEYXRhLmltYWdlRGVzY3MubGVuZ3RoICogNSAqIDQpO1xuXHRcdGNvbnN0IHNnZEhlYWRlclZpZXcgPSBuZXcgRGF0YVZpZXcoc2dkSGVhZGVyQnVmZmVyKTtcblx0XHRzZ2RIZWFkZXJWaWV3LnNldFVpbnQxNigwLCBjb250YWluZXIuZ2xvYmFsRGF0YS5lbmRwb2ludENvdW50LCB0cnVlKTtcblx0XHRzZ2RIZWFkZXJWaWV3LnNldFVpbnQxNigyLCBjb250YWluZXIuZ2xvYmFsRGF0YS5zZWxlY3RvckNvdW50LCB0cnVlKTtcblx0XHRzZ2RIZWFkZXJWaWV3LnNldFVpbnQzMig0LCBjb250YWluZXIuZ2xvYmFsRGF0YS5lbmRwb2ludHNEYXRhLmJ5dGVMZW5ndGgsIHRydWUpO1xuXHRcdHNnZEhlYWRlclZpZXcuc2V0VWludDMyKDgsIGNvbnRhaW5lci5nbG9iYWxEYXRhLnNlbGVjdG9yc0RhdGEuYnl0ZUxlbmd0aCwgdHJ1ZSk7XG5cdFx0c2dkSGVhZGVyVmlldy5zZXRVaW50MzIoMTIsIGNvbnRhaW5lci5nbG9iYWxEYXRhLnRhYmxlc0RhdGEuYnl0ZUxlbmd0aCwgdHJ1ZSk7XG5cdFx0c2dkSGVhZGVyVmlldy5zZXRVaW50MzIoMTYsIGNvbnRhaW5lci5nbG9iYWxEYXRhLmV4dGVuZGVkRGF0YS5ieXRlTGVuZ3RoLCB0cnVlKTtcblxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgY29udGFpbmVyLmdsb2JhbERhdGEuaW1hZ2VEZXNjcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0Y29uc3QgaW1hZ2VEZXNjID0gY29udGFpbmVyLmdsb2JhbERhdGEuaW1hZ2VEZXNjc1tpXTtcblx0XHRcdHNnZEhlYWRlclZpZXcuc2V0VWludDMyKDIwICsgaSAqIDUgKiA0ICsgMCwgaW1hZ2VEZXNjLmltYWdlRmxhZ3MsIHRydWUpO1xuXHRcdFx0c2dkSGVhZGVyVmlldy5zZXRVaW50MzIoMjAgKyBpICogNSAqIDQgKyA0LCBpbWFnZURlc2MucmdiU2xpY2VCeXRlT2Zmc2V0LCB0cnVlKTtcblx0XHRcdHNnZEhlYWRlclZpZXcuc2V0VWludDMyKDIwICsgaSAqIDUgKiA0ICsgOCwgaW1hZ2VEZXNjLnJnYlNsaWNlQnl0ZUxlbmd0aCwgdHJ1ZSk7XG5cdFx0XHRzZ2RIZWFkZXJWaWV3LnNldFVpbnQzMigyMCArIGkgKiA1ICogNCArIDEyLCBpbWFnZURlc2MuYWxwaGFTbGljZUJ5dGVPZmZzZXQsIHRydWUpO1xuXHRcdFx0c2dkSGVhZGVyVmlldy5zZXRVaW50MzIoMjAgKyBpICogNSAqIDQgKyAxNiwgaW1hZ2VEZXNjLmFscGhhU2xpY2VCeXRlTGVuZ3RoLCB0cnVlKTtcblx0XHR9XG5cblx0XHRzZ2RCdWZmZXIgPSBjb25jYXQoW1xuXHRcdFx0dG9WaWV3KHNnZEhlYWRlckJ1ZmZlciksXG5cdFx0XHRjb250YWluZXIuZ2xvYmFsRGF0YS5lbmRwb2ludHNEYXRhLFxuXHRcdFx0Y29udGFpbmVyLmdsb2JhbERhdGEuc2VsZWN0b3JzRGF0YSxcblx0XHRcdGNvbnRhaW5lci5nbG9iYWxEYXRhLnRhYmxlc0RhdGEsXG5cdFx0XHRjb250YWluZXIuZ2xvYmFsRGF0YS5leHRlbmRlZERhdGEsXG5cdFx0XSk7XG5cdH1cblxuXHQvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblx0Ly8gS2V5L1ZhbHVlIERhdGEgKEtWRCkuXG5cdC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5cdGNvbnN0IGtleVZhbHVlRGF0YTogVWludDhBcnJheTxBcnJheUJ1ZmZlcj5bXSA9IFtdO1xuXHRjb25zdCBrZXlWYWx1ZUxpc3QgPSBPYmplY3QuZW50cmllcyh7XG5cdFx0Li4uY29udGFpbmVyLmtleVZhbHVlLFxuXHRcdC4uLighb3B0aW9ucy5rZWVwV3JpdGVyICYmIHsgS1RYd3JpdGVyOiBLVFhfV1JJVEVSIH0pLFxuXHR9KTtcblxuXHRrZXlWYWx1ZUxpc3Quc29ydCgoYSwgYikgPT4gKGFbMF0gPiBiWzBdID8gMSA6IC0xKSk7XG5cblx0Zm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2Yga2V5VmFsdWVMaXN0KSB7XG5cdFx0Y29uc3Qga2V5RGF0YSA9IGVuY29kZVRleHQoa2V5KTtcblx0XHRjb25zdCB2YWx1ZURhdGEgPSB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnID8gY29uY2F0KFtlbmNvZGVUZXh0KHZhbHVlKSwgTlVMXSkgOiB2YWx1ZTtcblx0XHRjb25zdCBrdkJ5dGVMZW5ndGggPSBrZXlEYXRhLmJ5dGVMZW5ndGggKyAxICsgdmFsdWVEYXRhLmJ5dGVMZW5ndGg7XG5cdFx0Y29uc3Qga3ZQYWRkaW5nID0gZ2V0UGFkZGluZyhrdkJ5dGVMZW5ndGgsIDQpOyAvLyBhbGlnbig0KVxuXHRcdGtleVZhbHVlRGF0YS5wdXNoKFxuXHRcdFx0Y29uY2F0KFtcblx0XHRcdFx0dG9WaWV3KG5ldyBVaW50MzJBcnJheShba3ZCeXRlTGVuZ3RoXSkpLFxuXHRcdFx0XHRrZXlEYXRhLFxuXHRcdFx0XHROVUwsXG5cdFx0XHRcdHZhbHVlRGF0YSxcblx0XHRcdFx0bmV3IFVpbnQ4QXJyYXkoa3ZQYWRkaW5nKS5maWxsKDB4MDApLCAvLyBhbGlnbig0KVxuXHRcdFx0XSksXG5cdFx0KTtcblx0fVxuXG5cdGNvbnN0IGt2ZEJ1ZmZlciA9IGNvbmNhdChrZXlWYWx1ZURhdGEpO1xuXG5cdC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXHQvLyBEYXRhIEZvcm1hdCBEZXNjcmlwdG9yIChERkQpLlxuXHQvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXHRpZiAoXG5cdFx0Y29udGFpbmVyLmRhdGFGb3JtYXREZXNjcmlwdG9yLmxlbmd0aCAhPT0gMSB8fFxuXHRcdGNvbnRhaW5lci5kYXRhRm9ybWF0RGVzY3JpcHRvclswXS5kZXNjcmlwdG9yVHlwZSAhPT0gS0hSX0RGX0tIUl9ERVNDUklQVE9SVFlQRV9CQVNJQ0ZPUk1BVFxuXHQpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ09ubHkgQkFTSUNGT1JNQVQgRGF0YSBGb3JtYXQgRGVzY3JpcHRvciBvdXRwdXQgc3VwcG9ydGVkLicpO1xuXHR9XG5cblx0Y29uc3QgZGZkID0gY29udGFpbmVyLmRhdGFGb3JtYXREZXNjcmlwdG9yWzBdO1xuXG5cdGNvbnN0IGRmZEJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcigyOCArIGRmZC5zYW1wbGVzLmxlbmd0aCAqIDE2KTtcblx0Y29uc3QgZGZkVmlldyA9IG5ldyBEYXRhVmlldyhkZmRCdWZmZXIpO1xuXHRjb25zdCBkZXNjcmlwdG9yQmxvY2tTaXplID0gMjQgKyBkZmQuc2FtcGxlcy5sZW5ndGggKiAxNjtcblxuXHRkZmRWaWV3LnNldFVpbnQzMigwLCBkZmRCdWZmZXIuYnl0ZUxlbmd0aCwgdHJ1ZSk7XG5cdGRmZFZpZXcuc2V0VWludDE2KDQsIGRmZC52ZW5kb3JJZCwgdHJ1ZSk7XG5cdGRmZFZpZXcuc2V0VWludDE2KDYsIGRmZC5kZXNjcmlwdG9yVHlwZSwgdHJ1ZSk7XG5cdGRmZFZpZXcuc2V0VWludDE2KDgsIGRmZC52ZXJzaW9uTnVtYmVyLCB0cnVlKTtcblx0ZGZkVmlldy5zZXRVaW50MTYoMTAsIGRlc2NyaXB0b3JCbG9ja1NpemUsIHRydWUpO1xuXG5cdGRmZFZpZXcuc2V0VWludDgoMTIsIGRmZC5jb2xvck1vZGVsKTtcblx0ZGZkVmlldy5zZXRVaW50OCgxMywgZGZkLmNvbG9yUHJpbWFyaWVzKTtcblx0ZGZkVmlldy5zZXRVaW50OCgxNCwgZGZkLnRyYW5zZmVyRnVuY3Rpb24pO1xuXHRkZmRWaWV3LnNldFVpbnQ4KDE1LCBkZmQuZmxhZ3MpO1xuXG5cdGlmICghQXJyYXkuaXNBcnJheShkZmQudGV4ZWxCbG9ja0RpbWVuc2lvbikpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ3RleGVsQmxvY2tEaW1lbnNpb24gaXMgbm93IGFuIGFycmF5LiBGb3IgZGltZW5zaW9uYWxpdHkgYGRgLCBzZXQgYGQgLSAxYC4nKTtcblx0fVxuXG5cdGRmZFZpZXcuc2V0VWludDgoMTYsIGRmZC50ZXhlbEJsb2NrRGltZW5zaW9uWzBdKTtcblx0ZGZkVmlldy5zZXRVaW50OCgxNywgZGZkLnRleGVsQmxvY2tEaW1lbnNpb25bMV0pO1xuXHRkZmRWaWV3LnNldFVpbnQ4KDE4LCBkZmQudGV4ZWxCbG9ja0RpbWVuc2lvblsyXSk7XG5cdGRmZFZpZXcuc2V0VWludDgoMTksIGRmZC50ZXhlbEJsb2NrRGltZW5zaW9uWzNdKTtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IDg7IGkrKykgZGZkVmlldy5zZXRVaW50OCgyMCArIGksIGRmZC5ieXRlc1BsYW5lW2ldKTtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IGRmZC5zYW1wbGVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0Y29uc3Qgc2FtcGxlID0gZGZkLnNhbXBsZXNbaV07XG5cdFx0Y29uc3Qgc2FtcGxlQnl0ZU9mZnNldCA9IDI4ICsgaSAqIDE2O1xuXG5cdFx0ZGZkVmlldy5zZXRVaW50MTYoc2FtcGxlQnl0ZU9mZnNldCArIDAsIHNhbXBsZS5iaXRPZmZzZXQsIHRydWUpO1xuXHRcdGRmZFZpZXcuc2V0VWludDgoc2FtcGxlQnl0ZU9mZnNldCArIDIsIHNhbXBsZS5iaXRMZW5ndGgpO1xuXHRcdGRmZFZpZXcuc2V0VWludDgoc2FtcGxlQnl0ZU9mZnNldCArIDMsIHNhbXBsZS5jaGFubmVsVHlwZSk7XG5cblx0XHRkZmRWaWV3LnNldFVpbnQ4KHNhbXBsZUJ5dGVPZmZzZXQgKyA0LCBzYW1wbGUuc2FtcGxlUG9zaXRpb25bMF0pO1xuXHRcdGRmZFZpZXcuc2V0VWludDgoc2FtcGxlQnl0ZU9mZnNldCArIDUsIHNhbXBsZS5zYW1wbGVQb3NpdGlvblsxXSk7XG5cdFx0ZGZkVmlldy5zZXRVaW50OChzYW1wbGVCeXRlT2Zmc2V0ICsgNiwgc2FtcGxlLnNhbXBsZVBvc2l0aW9uWzJdKTtcblx0XHRkZmRWaWV3LnNldFVpbnQ4KHNhbXBsZUJ5dGVPZmZzZXQgKyA3LCBzYW1wbGUuc2FtcGxlUG9zaXRpb25bM10pO1xuXG5cdFx0aWYgKHNhbXBsZS5jaGFubmVsVHlwZSAmIEtIUl9ERl9TQU1QTEVfREFUQVRZUEVfU0lHTkVEKSB7XG5cdFx0XHRkZmRWaWV3LnNldEludDMyKHNhbXBsZUJ5dGVPZmZzZXQgKyA4LCBzYW1wbGUuc2FtcGxlTG93ZXIsIHRydWUpO1xuXHRcdFx0ZGZkVmlldy5zZXRJbnQzMihzYW1wbGVCeXRlT2Zmc2V0ICsgMTIsIHNhbXBsZS5zYW1wbGVVcHBlciwgdHJ1ZSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGRmZFZpZXcuc2V0VWludDMyKHNhbXBsZUJ5dGVPZmZzZXQgKyA4LCBzYW1wbGUuc2FtcGxlTG93ZXIsIHRydWUpO1xuXHRcdFx0ZGZkVmlldy5zZXRVaW50MzIoc2FtcGxlQnl0ZU9mZnNldCArIDEyLCBzYW1wbGUuc2FtcGxlVXBwZXIsIHRydWUpO1xuXHRcdH1cblx0fVxuXG5cdC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXHQvLyBEYXRhIGFsaWdubWVudC5cblx0Ly8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblx0Y29uc3QgZGZkQnl0ZU9mZnNldCA9IEtUWDJfSUQubGVuZ3RoICsgSEVBREVSX0JZVEVfTEVOR1RIICsgY29udGFpbmVyLmxldmVscy5sZW5ndGggKiAzICogODtcblx0Y29uc3Qga3ZkQnl0ZU9mZnNldCA9IGRmZEJ5dGVPZmZzZXQgKyBkZmRCdWZmZXIuYnl0ZUxlbmd0aDtcblx0bGV0IHNnZEJ5dGVPZmZzZXQgPSBzZ2RCdWZmZXIuYnl0ZUxlbmd0aCA+IDAgPyBrdmRCeXRlT2Zmc2V0ICsga3ZkQnVmZmVyLmJ5dGVMZW5ndGggOiAwO1xuXHRpZiAoc2dkQnl0ZU9mZnNldCAlIDgpIHNnZEJ5dGVPZmZzZXQgKz0gOCAtIChzZ2RCeXRlT2Zmc2V0ICUgOCk7IC8vIGFsaWduKDgpXG5cblx0Ly8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cdC8vIExldmVsIEluZGV4LlxuXHQvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXHRjb25zdCBsZXZlbERhdGE6IFVpbnQ4QXJyYXk8QXJyYXlCdWZmZXI+W10gPSBbXTtcblx0Y29uc3QgbGV2ZWxJbmRleCA9IG5ldyBEYXRhVmlldyhuZXcgQXJyYXlCdWZmZXIoY29udGFpbmVyLmxldmVscy5sZW5ndGggKiAzICogOCkpO1xuXHRjb25zdCBsZXZlbERhdGFCeXRlT2Zmc2V0cyA9IG5ldyBVaW50MzJBcnJheShjb250YWluZXIubGV2ZWxzLmxlbmd0aCk7XG5cblx0bGV0IGxldmVsQWxpZ24gPSAwO1xuXHRpZiAoY29udGFpbmVyLnN1cGVyY29tcHJlc3Npb25TY2hlbWUgPT09IEtIUl9TVVBFUkNPTVBSRVNTSU9OX05PTkUpIHtcblx0XHRsZXZlbEFsaWduID0gbGVhc3RDb21tb25NdWx0aXBsZShnZXRCbG9ja0J5dGVMZW5ndGgoY29udGFpbmVyKSwgNCk7XG5cdH1cblxuXHQvLyBMZXZlbCBkYXRhIGlzIG9yZGVyZWQgc21hbGwg4oaSIGxhcmdlLlxuXHRsZXQgbGV2ZWxEYXRhQnl0ZU9mZnNldCA9IChzZ2RCeXRlT2Zmc2V0IHx8IGt2ZEJ5dGVPZmZzZXQgKyBrdmRCdWZmZXIuYnl0ZUxlbmd0aCkgKyBzZ2RCdWZmZXIuYnl0ZUxlbmd0aDtcblx0Zm9yIChsZXQgaSA9IGNvbnRhaW5lci5sZXZlbHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcblx0XHQvLyBMZXZlbCBwYWRkaW5nLlxuXHRcdGlmIChsZXZlbERhdGFCeXRlT2Zmc2V0ICUgbGV2ZWxBbGlnbikge1xuXHRcdFx0Y29uc3QgcGFkZGluZ0J5dGVzID0gZ2V0UGFkZGluZyhsZXZlbERhdGFCeXRlT2Zmc2V0LCBsZXZlbEFsaWduKTtcblx0XHRcdGxldmVsRGF0YS5wdXNoKG5ldyBVaW50OEFycmF5KHBhZGRpbmdCeXRlcykpO1xuXHRcdFx0bGV2ZWxEYXRhQnl0ZU9mZnNldCArPSBwYWRkaW5nQnl0ZXM7XG5cdFx0fVxuXG5cdFx0Ly8gTGV2ZWwgZGF0YS5cblx0XHRjb25zdCBsZXZlbCA9IGNvbnRhaW5lci5sZXZlbHNbaV07XG5cdFx0bGV2ZWxEYXRhLnB1c2gobGV2ZWwubGV2ZWxEYXRhKTtcblx0XHRsZXZlbERhdGFCeXRlT2Zmc2V0c1tpXSA9IGxldmVsRGF0YUJ5dGVPZmZzZXQ7XG5cdFx0bGV2ZWxEYXRhQnl0ZU9mZnNldCArPSBsZXZlbC5sZXZlbERhdGEuYnl0ZUxlbmd0aDtcblx0fVxuXG5cdC8vIExldmVsIGluZGV4IGlzIG9yZGVyZWQgbGFyZ2Ug4oaSIHNtYWxsLlxuXHRmb3IgKGxldCBpID0gMDsgaSA8IGNvbnRhaW5lci5sZXZlbHMubGVuZ3RoOyBpKyspIHtcblx0XHRjb25zdCBsZXZlbCA9IGNvbnRhaW5lci5sZXZlbHNbaV07XG5cdFx0bGV2ZWxJbmRleC5zZXRCaWdVaW50NjQoaSAqIDI0ICsgMCwgQmlnSW50KGxldmVsRGF0YUJ5dGVPZmZzZXRzW2ldKSwgdHJ1ZSk7XG5cdFx0bGV2ZWxJbmRleC5zZXRCaWdVaW50NjQoaSAqIDI0ICsgOCwgQmlnSW50KGxldmVsLmxldmVsRGF0YS5ieXRlTGVuZ3RoKSwgdHJ1ZSk7XG5cdFx0bGV2ZWxJbmRleC5zZXRCaWdVaW50NjQoaSAqIDI0ICsgMTYsIEJpZ0ludChsZXZlbC51bmNvbXByZXNzZWRCeXRlTGVuZ3RoKSwgdHJ1ZSk7XG5cdH1cblxuXHQvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblx0Ly8gSGVhZGVyLlxuXHQvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXHRjb25zdCBoZWFkZXJCdWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIoSEVBREVSX0JZVEVfTEVOR1RIKTtcblx0Y29uc3QgaGVhZGVyVmlldyA9IG5ldyBEYXRhVmlldyhoZWFkZXJCdWZmZXIpO1xuXHRoZWFkZXJWaWV3LnNldFVpbnQzMigwLCBjb250YWluZXIudmtGb3JtYXQsIHRydWUpO1xuXHRoZWFkZXJWaWV3LnNldFVpbnQzMig0LCBjb250YWluZXIudHlwZVNpemUsIHRydWUpO1xuXHRoZWFkZXJWaWV3LnNldFVpbnQzMig4LCBjb250YWluZXIucGl4ZWxXaWR0aCwgdHJ1ZSk7XG5cdGhlYWRlclZpZXcuc2V0VWludDMyKDEyLCBjb250YWluZXIucGl4ZWxIZWlnaHQsIHRydWUpO1xuXHRoZWFkZXJWaWV3LnNldFVpbnQzMigxNiwgY29udGFpbmVyLnBpeGVsRGVwdGgsIHRydWUpO1xuXHRoZWFkZXJWaWV3LnNldFVpbnQzMigyMCwgY29udGFpbmVyLmxheWVyQ291bnQsIHRydWUpO1xuXHRoZWFkZXJWaWV3LnNldFVpbnQzMigyNCwgY29udGFpbmVyLmZhY2VDb3VudCwgdHJ1ZSk7XG5cdGhlYWRlclZpZXcuc2V0VWludDMyKDI4LCBjb250YWluZXIubGV2ZWxDb3VudCwgdHJ1ZSk7XG5cdGhlYWRlclZpZXcuc2V0VWludDMyKDMyLCBjb250YWluZXIuc3VwZXJjb21wcmVzc2lvblNjaGVtZSwgdHJ1ZSk7XG5cblx0aGVhZGVyVmlldy5zZXRVaW50MzIoMzYsIGRmZEJ5dGVPZmZzZXQsIHRydWUpO1xuXHRoZWFkZXJWaWV3LnNldFVpbnQzMig0MCwgZGZkQnVmZmVyLmJ5dGVMZW5ndGgsIHRydWUpO1xuXHRoZWFkZXJWaWV3LnNldFVpbnQzMig0NCwga3ZkQnl0ZU9mZnNldCwgdHJ1ZSk7XG5cdGhlYWRlclZpZXcuc2V0VWludDMyKDQ4LCBrdmRCdWZmZXIuYnl0ZUxlbmd0aCwgdHJ1ZSk7XG5cdGhlYWRlclZpZXcuc2V0QmlnVWludDY0KDUyLCBCaWdJbnQoc2dkQnVmZmVyLmJ5dGVMZW5ndGggPiAwID8gc2dkQnl0ZU9mZnNldCA6IDApLCB0cnVlKTtcblx0aGVhZGVyVmlldy5zZXRCaWdVaW50NjQoNjAsIEJpZ0ludChzZ2RCdWZmZXIuYnl0ZUxlbmd0aCksIHRydWUpO1xuXG5cdC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXHQvLyBDb21wb3NlLlxuXHQvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXHRyZXR1cm4gbmV3IFVpbnQ4QXJyYXkoXG5cdFx0Y29uY2F0KFtcblx0XHRcdG5ldyBVaW50OEFycmF5KEtUWDJfSUQpLFxuXHRcdFx0dG9WaWV3KGhlYWRlckJ1ZmZlciksXG5cdFx0XHR0b1ZpZXcobGV2ZWxJbmRleC5idWZmZXIpLFxuXHRcdFx0dG9WaWV3KGRmZEJ1ZmZlciksXG5cdFx0XHRrdmRCdWZmZXIsXG5cdFx0XHRzZ2RCeXRlT2Zmc2V0ID4gMFxuXHRcdFx0XHQ/IHRvVmlldyhuZXcgQXJyYXlCdWZmZXIoc2dkQnl0ZU9mZnNldCAtIChrdmRCeXRlT2Zmc2V0ICsga3ZkQnVmZmVyLmJ5dGVMZW5ndGgpKSkgLy8gYWxpZ24oOClcblx0XHRcdFx0OiB0b1ZpZXcobmV3IEFycmF5QnVmZmVyKDApKSxcblx0XHRcdHNnZEJ1ZmZlcixcblx0XHRcdC4uLmxldmVsRGF0YSxcblx0XHRdKSxcblx0KTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7O0FBSUEsSUFBYSw0QkFBNEI7QUFDekMsSUFBYSwrQkFBK0I7QUFDNUMsSUFBYSw0QkFBNEI7QUFDekMsSUFBYSw0QkFBNEI7QUFZekMsSUFBYSx3Q0FBd0M7QUFDckQsSUFBYSwwQkFBMEI7QUFDdkMsSUFBYSxpQkFBaUI7QUFFOUIsSUFBYSwyQkFBMkI7QUFDeEMsSUFBYSxzQkFBc0I7QUFFbkMsSUFBYSxvQkFBb0I7QUFDakMsSUFBYSxvQkFBb0I7QUFDakMsSUFBYSxvQkFBb0I7QUFDakMsSUFBYSxxQkFBcUI7QUFDbEMsSUFBYSxxQkFBcUI7QUFFbEMsSUFBYSw2QkFBNkI7QUFDMUMsSUFBYSxrQ0FBa0M7QUFFL0MsSUFBYSw4QkFBOEI7QUFDM0MsSUFBYSx5QkFBeUI7QUFDdEMsSUFBYSx1QkFBdUI7QUFDcEMsSUFBYSxzQkFBc0I7QUFDbkMsSUFBYSx1QkFBdUI7QUFDcEMsSUFBYSx1QkFBdUI7QUFDcEMsSUFBYSx3QkFBd0I7QUFDckMsSUFBYSx5QkFBeUI7QUFDdEMsSUFBYSwyQkFBMkI7QUFDeEMsSUFBYSwyQkFBMkI7QUFDeEMsSUFBYSwwQkFBMEI7QUFDdkMsSUFBYSwwQkFBMEI7QUFDdkMsSUFBYSx3QkFBd0I7QUFDckMsSUFBYSwyQkFBMkI7QUFDeEMsSUFBYSw4QkFBOEI7QUFDM0MsSUFBYSx3QkFBd0I7QUFDckMsSUFBYSx5QkFBeUI7QUFDdEMsSUFBYSwwQkFBMEI7QUFDdkMsSUFBYSwyQkFBMkI7QUF1QnhDLElBQWEsK0JBQStCO0FBQzVDLElBQWEseUJBQXlCO0FBQ3RDLElBQWEsNkJBQTZCO0FBQzFDLElBQWEsK0JBQStCO0FBQzVDLElBQWEsMEJBQTBCO0FBQ3ZDLElBQWEsMEJBQTBCO0FBQ3ZDLElBQWEsd0JBQXdCO0FBQ3JDLElBQWEsMEJBQTBCO0FBQ3ZDLElBQWEsNEJBQTRCO0FBQ3pDLElBQWEsMEJBQTBCO0FBQ3ZDLElBQWEsNkJBQTZCO0FBQzFDLElBQWEsNEJBQTRCO0FBZ0J6QyxJQUFhLDRCQUE0QjtBQUN6QyxJQUFhLDhCQUE4QjtBQUMzQyxJQUFhLDZCQUE2QjtBQUMxQyxJQUFhLGdDQUFnQztBQUM3QyxJQUFhLDhCQUE4QjtBQUMzQyxJQUFhLDhCQUE4QjtBQVUzQyxJQUFhLCtCQUErQjtBQUM1QyxJQUFhLGdDQUFnQztBQUM3QyxJQUFhLGtDQUFrQztBQUMvQyxJQUFhLGdDQUFnQztBQVk3QyxJQUFhLHNCQUFzQjtBQUNuQyxJQUFhLDZCQUE2QjtBQUMxQyxJQUFhLGtDQUFrQztBQUMvQyxJQUFhLGtDQUFrQztBQUMvQyxJQUFhLGdDQUFnQztBQUM3QyxJQUFhLGdDQUFnQztBQUM3QyxJQUFhLGtDQUFrQztBQUMvQyxJQUFhLGtDQUFrQztBQUMvQyxJQUFhLGtDQUFrQztBQUMvQyxJQUFhLHFCQUFxQjtBQUNsQyxJQUFhLHFCQUFxQjtBQUNsQyxJQUFhLG9CQUFvQjtBQUNqQyxJQUFhLG9CQUFvQjtBQUNqQyxJQUFhLG9CQUFvQjtBQUNqQyxJQUFhLHVCQUF1QjtBQUNwQyxJQUFhLHVCQUF1QjtBQUNwQyxJQUFhLHNCQUFzQjtBQUNuQyxJQUFhLHNCQUFzQjtBQUNuQyxJQUFhLHNCQUFzQjtBQUNuQyxJQUFhLHlCQUF5QjtBQUN0QyxJQUFhLHlCQUF5QjtBQUN0QyxJQUFhLHdCQUF3QjtBQUNyQyxJQUFhLHdCQUF3QjtBQUNyQyxJQUFhLHdCQUF3QjtBQUNyQyxJQUFhLHlCQUF5QjtBQUN0QyxJQUFhLHlCQUF5QjtBQUN0QyxJQUFhLHdCQUF3QjtBQUNyQyxJQUFhLHdCQUF3QjtBQUNyQyxJQUFhLHdCQUF3QjtBQUNyQyxJQUFhLDJCQUEyQjtBQUN4QyxJQUFhLDJCQUEyQjtBQUN4QyxJQUFhLDBCQUEwQjtBQUN2QyxJQUFhLDBCQUEwQjtBQUN2QyxJQUFhLDBCQUEwQjtBQUN2QyxJQUFhLDJCQUEyQjtBQUN4QyxJQUFhLDJCQUEyQjtBQUN4QyxJQUFhLDBCQUEwQjtBQUN2QyxJQUFhLDBCQUEwQjtBQUN2QyxJQUFhLDBCQUEwQjtBQUN2QyxJQUFhLHFDQUFxQztBQUNsRCxJQUFhLHFDQUFxQztBQUNsRCxJQUFhLG9DQUFvQztBQUNqRCxJQUFhLG9DQUFvQztBQUNqRCxJQUFhLHFDQUFxQztBQUNsRCxJQUFhLHFDQUFxQztBQUNsRCxJQUFhLG9DQUFvQztBQUNqRCxJQUFhLG9DQUFvQztBQUNqRCxJQUFhLHNCQUFzQjtBQUNuQyxJQUFhLHNCQUFzQjtBQUNuQyxJQUFhLHFCQUFxQjtBQUNsQyxJQUFhLHFCQUFxQjtBQUNsQyxJQUFhLHVCQUF1QjtBQUNwQyxJQUFhLHlCQUF5QjtBQUN0QyxJQUFhLHlCQUF5QjtBQUN0QyxJQUFhLHdCQUF3QjtBQUNyQyxJQUFhLHdCQUF3QjtBQUNyQyxJQUFhLDBCQUEwQjtBQUN2QyxJQUFhLDRCQUE0QjtBQUN6QyxJQUFhLDRCQUE0QjtBQUN6QyxJQUFhLDJCQUEyQjtBQUN4QyxJQUFhLDJCQUEyQjtBQUN4QyxJQUFhLDZCQUE2QjtBQUMxQyxJQUFhLCtCQUErQjtBQUM1QyxJQUFhLCtCQUErQjtBQUM1QyxJQUFhLDhCQUE4QjtBQUMzQyxJQUFhLDhCQUE4QjtBQUMzQyxJQUFhLGdDQUFnQztBQUM3QyxJQUFhLHFCQUFxQjtBQUNsQyxJQUFhLHFCQUFxQjtBQUNsQyxJQUFhLHVCQUF1QjtBQUNwQyxJQUFhLHdCQUF3QjtBQUNyQyxJQUFhLHdCQUF3QjtBQUNyQyxJQUFhLDBCQUEwQjtBQUN2QyxJQUFhLDJCQUEyQjtBQUN4QyxJQUFhLDJCQUEyQjtBQUN4QyxJQUFhLDZCQUE2QjtBQUMxQyxJQUFhLDhCQUE4QjtBQUMzQyxJQUFhLDhCQUE4QjtBQUMzQyxJQUFhLGdDQUFnQztBQUM3QyxJQUFhLHFCQUFxQjtBQUNsQyxJQUFhLHFCQUFxQjtBQUNsQyxJQUFhLHVCQUF1QjtBQUNwQyxJQUFhLHdCQUF3QjtBQUNyQyxJQUFhLHdCQUF3QjtBQUNyQyxJQUFhLDBCQUEwQjtBQUN2QyxJQUFhLDJCQUEyQjtBQUN4QyxJQUFhLDJCQUEyQjtBQUN4QyxJQUFhLDZCQUE2QjtBQUMxQyxJQUFhLDhCQUE4QjtBQUMzQyxJQUFhLDhCQUE4QjtBQUMzQyxJQUFhLGdDQUFnQztBQUM3QyxJQUFhLG9DQUFvQztBQUNqRCxJQUFhLG1DQUFtQztBQUNoRCxJQUFhLHNCQUFzQjtBQUNuQyxJQUFhLGdDQUFnQztBQUM3QyxJQUFhLHVCQUF1QjtBQUNwQyxJQUFhLG9CQUFvQjtBQUNqQyxJQUFhLDhCQUE4QjtBQUMzQyxJQUFhLDhCQUE4QjtBQUMzQyxJQUFhLCtCQUErQjtBQUM1QyxJQUFhLGdDQUFnQztBQUM3QyxJQUFhLCtCQUErQjtBQUM1QyxJQUFhLGlDQUFpQztBQUM5QyxJQUFhLGdDQUFnQztBQUM3QyxJQUFhLDRCQUE0QjtBQUN6QyxJQUFhLDJCQUEyQjtBQUN4QyxJQUFhLDRCQUE0QjtBQUN6QyxJQUFhLDJCQUEyQjtBQUN4QyxJQUFhLDRCQUE0QjtBQUN6QyxJQUFhLDRCQUE0QjtBQUN6QyxJQUFhLDRCQUE0QjtBQUN6QyxJQUFhLDRCQUE0QjtBQUN6QyxJQUFhLDhCQUE4QjtBQUMzQyxJQUFhLDhCQUE4QjtBQUMzQyxJQUFhLDRCQUE0QjtBQUN6QyxJQUFhLDJCQUEyQjtBQUN4QyxJQUFhLG9DQUFvQztBQUNqRCxJQUFhLG1DQUFtQztBQUNoRCxJQUFhLHNDQUFzQztBQUNuRCxJQUFhLHFDQUFxQztBQUNsRCxJQUFhLHNDQUFzQztBQUNuRCxJQUFhLHFDQUFxQztBQUNsRCxJQUFhLGdDQUFnQztBQUM3QyxJQUFhLGdDQUFnQztBQUM3QyxJQUFhLG1DQUFtQztBQUNoRCxJQUFhLG1DQUFtQztBQUNoRCxJQUFhLGlDQUFpQztBQUM5QyxJQUFhLGdDQUFnQztBQUM3QyxJQUFhLGlDQUFpQztBQUM5QyxJQUFhLGdDQUFnQztBQUM3QyxJQUFhLGlDQUFpQztBQUM5QyxJQUFhLGdDQUFnQztBQUM3QyxJQUFhLGlDQUFpQztBQUM5QyxJQUFhLGdDQUFnQztBQUM3QyxJQUFhLGlDQUFpQztBQUM5QyxJQUFhLGdDQUFnQztBQUM3QyxJQUFhLGlDQUFpQztBQUM5QyxJQUFhLGdDQUFnQztBQUM3QyxJQUFhLGlDQUFpQztBQUM5QyxJQUFhLGdDQUFnQztBQUM3QyxJQUFhLGlDQUFpQztBQUM5QyxJQUFhLGdDQUFnQztBQUM3QyxJQUFhLGtDQUFrQztBQUMvQyxJQUFhLGlDQUFpQztBQUM5QyxJQUFhLGtDQUFrQztBQUMvQyxJQUFhLGlDQUFpQztBQUM5QyxJQUFhLGtDQUFrQztBQUMvQyxJQUFhLGlDQUFpQztBQUM5QyxJQUFhLG1DQUFtQztBQUNoRCxJQUFhLGtDQUFrQztBQUMvQyxJQUFhLG1DQUFtQztBQUNoRCxJQUFhLGtDQUFrQztBQUMvQyxJQUFhLG1DQUFtQztBQUNoRCxJQUFhLGtDQUFrQztBQUMvQyxJQUFhLCtCQUErQjtBQUM1QyxJQUFhLHFDQUFxQztBQUNsRCxJQUFhLCtDQUErQztBQUM1RCxJQUFhLG1EQUFtRDtBQUNoRSxJQUFhLG1EQUFtRDtBQUNoRSxJQUFhLCtCQUErQjtBQUM1QyxJQUFhLHFDQUFxQztBQUNsRCxJQUFhLCtDQUErQztBQUM1RCxJQUFhLG1EQUFtRDtBQUNoRSxJQUFhLG1EQUFtRDtBQUNoRSxJQUFhLHdDQUF3QztBQUNyRCxJQUFhLHdDQUF3QztBQUNyRCxJQUFhLHdDQUF3QztBQUNyRCxJQUFhLHdDQUF3QztBQUNyRCxJQUFhLHVDQUF1QztBQUNwRCxJQUFhLHVDQUF1QztBQUNwRCxJQUFhLHVDQUF1QztBQUNwRCxJQUFhLHVDQUF1QztBQUNwRCxJQUFhLHNDQUFzQztBQUNuRCxJQUFhLHNDQUFzQztBQUNuRCxJQUFhLHNDQUFzQztBQUNuRCxJQUFhLHNDQUFzQztBQUNuRCxJQUFhLHNDQUFzQztBQUNuRCxJQUFhLHNDQUFzQztBQUNuRCxJQUFhLHNDQUFzQztBQUNuRCxJQUFhLHNDQUFzQztBQUNuRCxJQUFhLHVDQUF1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
