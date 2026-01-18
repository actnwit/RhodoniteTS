import type {
  AnimationChannel,
  AnimationPathName,
  AnimationSampler,
  AnimationTrackName,
} from '../../types/AnimationTypes';
import type { Array1to4, Byte, Count, Index, VectorAndSquareMatrixComponentN } from '../../types/CommonTypes';
import type {
  Gltf2,
  Gltf2AccessorCompositionTypeString,
  Gltf2Animation,
  Gltf2AnimationChannel,
  Gltf2AnimationPathName,
  Gltf2AnimationSampler,
  Gltf2AttributeBlendShapes,
  Gltf2Attributes,
  Gltf2Mesh,
  Gltf2Primitive,
  Gltf2Skin,
} from '../../types/glTF2';
import type {
  Gltf2AccessorEx,
  Gltf2BufferViewEx,
  Gltf2Ex,
  Gltf2ImageEx,
  Gltf2MaterialEx,
} from '../../types/glTF2ForOutput';
import { GL_ARRAY_BUFFER, GL_ELEMENT_ARRAY_BUFFER } from '../../types/WebGLConstants';
import { BufferUse, type ComponentTypeEnum, type CompositionTypeEnum } from '../definitions';
import { ComponentType, type Gltf2AccessorComponentType } from '../definitions/ComponentType';
import { CompositionType } from '../definitions/CompositionType';
import { PrimitiveMode } from '../definitions/PrimitiveMode';
import type { VertexAttributeSemanticsJoinedString } from '../definitions/VertexAttribute';
import { VertexAttribute } from '../definitions/VertexAttribute';
import type { Primitive } from '../geometry/Primitive';
import type { IAnimationEntity, IMeshEntity, ISkeletalEntity } from '../helpers/EntityHelper';
import type { Material } from '../materials/core/Material';
import type { Vector3 } from '../math/Vector3';
import { Vector4 } from '../math/Vector4';
import { Accessor } from '../memory/Accessor';
import { Buffer } from '../memory/Buffer';
import { BufferView } from '../memory/BufferView';
import { DataUtil } from '../misc/DataUtil';
import { Is } from '../misc/Is';

/**
 * Creates a new glTF 2.0 buffer view and adds it to the provided glTF JSON object.
 * This function manages buffer view creation with proper byte alignment and offset calculation.
 *
 * @param json - The glTF 2.0 JSON object to add the buffer view to
 * @param bufferIdx - The index of the buffer that this buffer view will reference
 * @param uint8Array - The raw binary data to be stored in this buffer view
 * @returns The created buffer view object with extended properties
 *
 * @remarks
 * This function automatically handles:
 * - Calculating the correct byte offset based on accumulated buffer view lengths
 * - Adding necessary padding bytes for proper alignment (4-byte alignment)
 * - Updating the accumulated byte length tracking for the specified buffer
 * - Adding the buffer view to the glTF JSON structure
 *
 * @example
 * ```typescript
 * const gltf = createEmptyGltf2();
 * const vertexData = new Uint8Array([1, 2, 3, 4]);
 * const bufferView = createAndAddGltf2BufferView(gltf, 0, vertexData);
 * ```
 */
export function createAndAddGltf2BufferView(
  json: Gltf2Ex,
  bufferIdx: Index,
  uint8Array: Uint8Array
): Gltf2BufferViewEx {
  const bufferViewByteLengthAccumulated = json.extras.bufferViewByteLengthAccumulatedArray[bufferIdx];
  const gltfBufferViewEx: Gltf2BufferViewEx = {
    buffer: bufferIdx,
    byteLength: uint8Array.byteLength,
    byteOffset: bufferViewByteLengthAccumulated,
    extras: {
      uint8Array,
    },
  };

  const nextBufferViewBytesLengthAccumulated =
    DataUtil.addPaddingBytes(gltfBufferViewEx.byteLength, 4) + bufferViewByteLengthAccumulated;

  json.bufferViews.push(gltfBufferViewEx);
  json.extras.bufferViewByteLengthAccumulatedArray[bufferIdx] = nextBufferViewBytesLengthAccumulated;
  return gltfBufferViewEx;
}

/**
 * Accumulates buffer view byte length with proper alignment.
 *
 * Calculates the total accumulated byte length for a buffer view, including
 * necessary padding bytes for 4-byte alignment. Used to track buffer offsets
 * when creating multiple buffer views in sequence.
 *
 * @param bufferViewByteLengthAccumulatedArray - Array tracking accumulated lengths per buffer
 * @param bufferIdxToSet - Index of the target buffer
 * @param gltf2BufferView - The buffer view to accumulate
 * @returns Updated accumulated byte length
 */
export function accumulateBufferViewByteLength(
  bufferViewByteLengthAccumulatedArray: number[],
  bufferIdxToSet: number,
  gltf2BufferView: Gltf2BufferViewEx
): number {
  const bufferViewLengthAligned = Is.exist(bufferViewByteLengthAccumulatedArray[bufferIdxToSet])
    ? bufferViewByteLengthAccumulatedArray[bufferIdxToSet] + DataUtil.addPaddingBytes(gltf2BufferView.byteLength, 4)
    : DataUtil.addPaddingBytes(gltf2BufferView.byteLength, 4);

  return bufferViewLengthAligned;
}

/**
 * Converts Rhodonite animation path names to glTF2 format.
 *
 * @param path - The Rhodonite animation path name
 * @returns The corresponding glTF2 animation path name
 * @throws Error if the path name is invalid
 */
export function convertToGltfAnimationPathName(path: AnimationPathName): Gltf2AnimationPathName {
  switch (path) {
    case 'translate':
      return 'translation';
    case 'quaternion':
      return 'rotation';
    case 'scale':
      return 'scale';
    case 'weights':
      return 'weights';
    // case 'effekseer':
    //   return 'effekseer';
    default:
      throw new Error('Invalid Path Name');
  }
}

/**
 * Aligns accessor byte offset to 4-byte boundaries.
 *
 * glTF2 specification requires that accessor byte offsets be aligned to
 * 4-byte boundaries for optimal performance and compatibility.
 *
 * @param byteOffset - Byte offset that may not be aligned
 * @returns Aligned byte offset
 */
export function alignAccessorByteOffsetTo4Bytes(byteOffset: Byte): Byte {
  const alignSize = 4;
  if (byteOffset % 4 === 0) {
    return byteOffset;
  }
  return byteOffset + (alignSize - (byteOffset % alignSize));
}

/**
 * Aligns buffer view byte stride to 4-byte boundaries.
 *
 * For performance and compatibility reasons, bufferView.byteStride must be
 * a multiple of 4 for vertex attributes.
 *
 * @param byteStride - Byte stride that may not be aligned
 * @returns Aligned byte stride
 *
 * @see https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#data-alignment
 */
export function alignBufferViewByteStrideTo4Bytes(byteStride: Byte): Byte {
  const alignSize = 4;
  if (byteStride % 4 === 0) {
    return byteStride;
  }
  const byteStrideAlgined = byteStride + (alignSize - (byteStride % alignSize));

  return byteStrideAlgined;
}

/**
 * Type guard for checking if an ArrayBufferView has numeric array properties.
 */
export type NumericArrayBufferView = ArrayBufferView & { length: number; [index: number]: number };

/**
 * Type guard function to check if an ArrayBufferView is a numeric array buffer view.
 *
 * @param view - The ArrayBufferView to check
 * @returns True if the view has numeric array properties
 */
export function isNumericArrayBufferView(view: ArrayBufferView): view is NumericArrayBufferView {
  return typeof (view as any).length === 'number';
}

export interface AnimationChannelTargetResolution {
  path: Gltf2AnimationPathName;
  node?: number;
  extensions?: Record<string, unknown>;
}

export type AnimationChannelTargetOverride = AnimationChannelTargetResolution | AnimationChannelTargetResolution[];

export interface AnimationExportOptions {
  resolveAnimationTarget?: (args: {
    channel: AnimationChannel;
    entityIdx: Index;
    trackName: string;
  }) => AnimationChannelTargetOverride | null | undefined;
}

/**
 * Creates a glTF2 animation channel from Rhodonite animation data.
 *
 * @param channel - The Rhodonite animation channel
 * @param samplerIdx - Current sampler index
 * @param animation - The glTF2 animation to add the channel to
 * @param entityIdx - Index of the target entity
 * @returns Updated sampler index
 */
export function createGltf2AnimationChannel(
  channel: AnimationChannel,
  samplerIdx: Index,
  animation: Gltf2Animation,
  entityIdx: Index,
  targetOverride?: AnimationChannelTargetOverride
): Index {
  const pathName = channel.target.pathName as AnimationPathName;
  const overrides = Array.isArray(targetOverride) ? targetOverride : targetOverride ? [targetOverride] : undefined;

  if (overrides?.length) {
    for (const override of overrides) {
      const target: Gltf2AnimationChannel['target'] = {
        path: override.path,
      };
      if (typeof override.node === 'number') {
        target.node = override.node;
      }
      if (Is.exist(override.extensions)) {
        target.extensions = override.extensions;
      }
      animation.channels.push({
        sampler: samplerIdx,
        target,
      });
    }
  } else {
    const channelJson: Gltf2AnimationChannel = {
      sampler: samplerIdx,
      target: {
        path: convertToGltfAnimationPathName(pathName),
        node: entityIdx,
      },
    };
    animation.channels.push(channelJson);
  }

  return samplerIdx + 1;
}

/**
 * Creates a glTF2 animation sampler from Rhodonite sampler data.
 *
 * @param inputAccessorIdx - Index of the input (time) accessor
 * @param outputAccessorIdx - Index of the output (value) accessor
 * @param sampler - The Rhodonite animation sampler
 * @param animation - The glTF2 animation to add the sampler to
 */
export function createGltf2AnimationSampler(
  inputAccessorIdx: number,
  outputAccessorIdx: number,
  sampler: AnimationSampler,
  animation: Gltf2Animation
): void {
  const samplerJson: Gltf2AnimationSampler = {
    input: inputAccessorIdx,
    output: outputAccessorIdx,
    interpolation: sampler.interpolationMethod.GltfString,
  };
  animation.samplers.push(samplerJson);
}

/**
 * Aligns buffer view byte length to proper boundaries.
 *
 * Calculates the aligned end position of a buffer view and returns the delta
 * needed to align it properly. Used to maintain proper memory alignment when
 * creating multiple buffer views sequentially.
 *
 * @param bufferViewByteLengthAccumulated - Current accumulated byte length
 * @param bufferView - The buffer view to align
 * @returns Delta value for alignment (non-negative)
 */
export function alignBufferViewByteLength(
  bufferViewByteLengthAccumulated: number,
  bufferView: Gltf2BufferViewEx
): number {
  const bufferViewEnd = bufferView.byteOffset + bufferView.byteLength;
  const alignedEnd = bufferViewEnd + DataUtil.calcPaddingBytes(bufferViewEnd, 4);
  const delta = alignedEnd - bufferViewByteLengthAccumulated;
  return delta >= 0 ? delta : 0;
}

/**
 * Resolves the byteStride to be written to a glTF bufferView for vertex attributes.
 *
 * Prefers the bufferView's explicit stride or accessor stride when available and
 * guarantees the result is large enough for the accessor's element width and aligned
 * to 4 bytes to satisfy glTF requirements.
 *
 * @param rnBufferView - Source buffer view
 * @param rnAccessor - Accessor that references the buffer view
 * @returns The resolved stride in bytes or undefined when stride should be omitted
 */
export function resolveVertexAttributeByteStride(rnBufferView: BufferView, rnAccessor: Accessor): Byte | undefined {
  const candidates: number[] = [];
  const defaultStride = rnBufferView.defaultByteStride;
  if (defaultStride > 0) {
    candidates.push(defaultStride);
  }
  const accessorStride = rnAccessor.byteStride;
  if (accessorStride > 0) {
    candidates.push(accessorStride);
  }
  const elementSize = rnAccessor.elementSizeInBytes;
  if (elementSize > 0) {
    candidates.push(elementSize);
  }

  if (candidates.length === 0) {
    return undefined;
  }

  const resolved = Math.max(...candidates);
  const aligned = alignBufferViewByteStrideTo4Bytes(resolved as Byte);

  return aligned < elementSize ? elementSize : aligned;
}

/**
 * Generates a complete glTF2 Binary (.glb) ArrayBuffer from JSON and binary data.
 *
 * Combines the glTF2 JSON document and binary buffer into a single .glb file
 * following the glTF2 binary format specification. Handles proper chunk
 * alignment and header construction.
 *
 * @param json - The glTF2 JSON document to embed
 * @param arraybuffer - Binary data buffer to include
 * @returns Complete .glb file as ArrayBuffer
 */
export function generateGlbArrayBuffer(json: Gltf2, arraybuffer: ArrayBuffer): ArrayBuffer {
  const headerBytes = 12; // 12byte-header

  // .glb file
  json.buffers![0].uri = undefined;
  let jsonStr = JSON.stringify(json, null, 2);
  let jsonArrayBuffer = DataUtil.stringToBuffer(jsonStr);
  const paddingBytes = DataUtil.calcPaddingBytes(jsonArrayBuffer.byteLength, 4);
  if (paddingBytes > 0) {
    for (let i = 0; i < paddingBytes; i++) {
      jsonStr += ' ';
    }
    jsonArrayBuffer = DataUtil.stringToBuffer(jsonStr);
  }
  const jsonChunkLength = jsonArrayBuffer.byteLength;
  const headerAndChunk0 = headerBytes + 4 + 4 + jsonChunkLength; // Chunk-0
  const totalBytes = headerAndChunk0 + 4 + 4 + arraybuffer.byteLength; // Chunk-1

  const glbArrayBuffer = new ArrayBuffer(totalBytes);
  const dataView = new DataView(glbArrayBuffer);
  dataView.setUint32(0, 0x46546c67, true);
  dataView.setUint32(4, 2, true);
  dataView.setUint32(8, totalBytes, true);
  dataView.setUint32(12, jsonArrayBuffer.byteLength, true);
  dataView.setUint32(16, 0x4e4f534a, true);

  DataUtil.copyArrayBufferAs4Bytes({
    src: jsonArrayBuffer,
    dist: glbArrayBuffer,
    srcByteOffset: 0,
    copyByteLength: jsonArrayBuffer.byteLength,
    distByteOffset: 20,
  });
  DataUtil.copyArrayBufferAs4Bytes({
    src: arraybuffer,
    dist: glbArrayBuffer,
    srcByteOffset: 0,
    copyByteLength: arraybuffer.byteLength,
    distByteOffset: 20 + jsonChunkLength + 8,
  });
  dataView.setUint32(headerAndChunk0, arraybuffer.byteLength, true);
  dataView.setUint32(headerAndChunk0 + 4, 0x004e4942, true);
  return glbArrayBuffer;
}

/**
 * Type definition for buffer view byte length calculation parameters.
 */
export type BufferViewByteLengthDesc = {
  /** Byte offset of the accessor within the buffer view */
  accessorByteOffset: Byte;
  /** Number of elements in the accessor */
  accessorCount: Count;
  /** Byte stride of the buffer view */
  bufferViewByteStride: Byte;
  /** Byte offset of the buffer view within the buffer */
  bufferViewByteOffset: Byte;
  /** Size in bytes of each component */
  sizeOfComponent: Byte;
  /** Number of components per element */
  numberOfComponents: number;
};

/**
 * Calculates BufferView byte length and byte offset according to glTF2 specification.
 *
 * Ensures proper data alignment for performance and compatibility. Each element
 * of a vertex attribute must be aligned to 4-byte boundaries inside a bufferView.
 *
 * @param params - Parameters for calculation including offsets and sizes
 * @returns Object containing fixed byte length and offset values
 *
 * @see https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#data-alignment
 */
export function calcBufferViewByteLengthAndByteOffset({
  accessorByteOffset,
  accessorCount,
  bufferViewByteStride,
  bufferViewByteOffset,
  sizeOfComponent,
  numberOfComponents,
}: BufferViewByteLengthDesc): {
  fixedBufferViewByteLength: Byte;
  fixedBufferViewByteOffset: Byte;
} {
  // When byteStride of the referenced bufferView is not defined,
  // it means that accessor elements are tightly packed,
  //   i.e., effective stride equals the size of the element.
  const effectiveByteStride = bufferViewByteStride === 0 ? sizeOfComponent * numberOfComponents : bufferViewByteStride;

  // When byteStride is defined,
  //   it MUST be a multiple of the size of the accessor's component type.
  if (bufferViewByteStride % sizeOfComponent !== 0) {
    throw Error(
      "glTF2: When byteStride is defined, it MUST be a multiple of the size of the accessor's component type."
    );
  }

  // MUST be 4 bytes aligned
  const effectiveByteStrideAligned = alignBufferViewByteStrideTo4Bytes(effectiveByteStride);
  // MUST be 4 bytes aligned
  const alignedAccessorByteOffset = alignAccessorByteOffsetTo4Bytes(accessorByteOffset);

  // calc BufferView byteLength as following,
  //
  //  Each accessor MUST fit its bufferView, i.e.,
  //  ```
  //  accessor.byteOffset + EFFECTIVE_BYTE_STRIDE * (accessor.count - 1) + SIZE_OF_COMPONENT * NUMBER_OF_COMPONENTS
  //  ```
  //   MUST be less than or equal to bufferView.length.
  const bufferViewByteLength =
    alignedAccessorByteOffset + effectiveByteStrideAligned * (accessorCount - 1) + sizeOfComponent * numberOfComponents;

  // The offset of an accessor into a bufferView (i.e., accessor.byteOffset)
  //   and the offset of an accessor into a buffer (i.e., accessor.byteOffset + bufferView.byteOffset)
  //     MUST be a multiple of the size of the accessor's component type.
  const valByteLength = sizeOfComponent * numberOfComponents;
  const sumByteOffset = alignedAccessorByteOffset + bufferViewByteOffset;
  const paddingByte = valByteLength - (sumByteOffset % valByteLength);
  const fixedBufferViewByteOffset = bufferViewByteOffset + paddingByte;

  // MUST be 4 bytes aligned
  const alignedBufferViewByteOffset = alignAccessorByteOffsetTo4Bytes(fixedBufferViewByteOffset);

  const fixedBufferViewByteLength = bufferViewByteLength;
  return {
    fixedBufferViewByteLength,
    fixedBufferViewByteOffset: alignedBufferViewByteOffset,
  };
}

/**
 * Clamps a weight value to the valid range [0, 1].
 *
 * @param value - The weight value to clamp
 * @returns Clamped value between 0 and 1
 */
export function clampWeight(value: number): number {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

/**
 * Sanitizes a skin weight value to ensure it's valid.
 *
 * Ensures the weight is finite, non-negative, and within the valid range [0, 1].
 *
 * @param weight - The weight value to sanitize
 * @returns Object containing the sanitized value and whether it was mutated
 */
export function sanitizeSkinWeight(weight: number): { value: number; mutated: boolean } {
  if (!Number.isFinite(weight) || weight < 0) {
    return { value: 0, mutated: weight !== 0 };
  }
  if (weight > 1) {
    return { value: 1, mutated: true };
  }
  return { value: weight, mutated: false };
}

/**
 * Gets the maximum value for a normalized unsigned component type.
 *
 * @param componentType - The component type enum
 * @returns Maximum value for the component type
 */
export function getNormalizedUnsignedComponentMax(componentType: ComponentTypeEnum): number {
  if (componentType === ComponentType.UnsignedByte) {
    return 255;
  }
  if (componentType === ComponentType.UnsignedShort) {
    return 65535;
  }
  if (componentType === ComponentType.UnsignedInt) {
    return 4294967295;
  }
  return 1;
}

/**
 * Creates an unsigned typed array based on the component type.
 *
 * @param componentType - The component type enum
 * @param length - The length of the array to create
 * @returns The created typed array
 * @throws Error if the component type is not supported
 */
export function createUnsignedTypedArray(
  componentType: ComponentTypeEnum,
  length: number
): Uint8Array | Uint16Array | Uint32Array {
  if (componentType === ComponentType.UnsignedByte) {
    return new Uint8Array(length);
  }
  if (componentType === ComponentType.UnsignedShort) {
    return new Uint16Array(length);
  }
  if (componentType === ComponentType.UnsignedInt) {
    return new Uint32Array(length);
  }
  throw new Error('Unsupported component type for normalized weights');
}

/**
 * Parameters for creating a glTF2 accessor.
 */
export interface Gltf2AccessorDesc {
  /** Index of the buffer view */
  bufferViewIdx: Index;
  /** Byte offset within the buffer view */
  accessorByteOffset: Byte;
  /** Component type (e.g., FLOAT, UNSIGNED_SHORT) */
  componentType: ComponentTypeEnum;
  /** Number of elements */
  count: Count;
  /** Composition type (e.g., VEC3, MAT4) */
  compositionType: CompositionTypeEnum;
  /** Minimum values for each component */
  min?: Array1to4<number>;
  /** Maximum values for each component */
  max?: Array1to4<number>;
}

/**
 * Parameters for creating a glTF2 buffer view.
 */
export interface Gltf2BufferViewDesc {
  /** Index of the buffer */
  bufferIdx: Index;
  /** Byte offset within the buffer */
  bufferViewByteOffset: Byte;
  /** Accessor byte offset within the buffer view */
  accessorByteOffset: Byte;
  /** Number of accessor elements */
  accessorCount: Count;
  /** Byte stride of the buffer view */
  bufferViewByteStride: Byte;
  /** Component type */
  componentType: ComponentTypeEnum;
  /** Composition type */
  compositionType: CompositionTypeEnum;
  /** Raw data as Uint8Array */
  uint8Array: Uint8Array;
}

/**
 * Calculates the accessor index for deduplication purposes.
 *
 * @param existingUniqueRnAccessors - Array of unique accessors
 * @param rnAccessor - The accessor to find
 * @returns Index of the accessor or -1 if not found
 */
export function calcAccessorIdxToSet(existingUniqueRnAccessors: Accessor[], rnAccessor: Accessor): number {
  const accessorIdx = existingUniqueRnAccessors.findIndex(accessor => {
    return accessor.isSame(rnAccessor);
  });
  return accessorIdx;
}

/**
 * Finds the index of an existing buffer view in the cache.
 *
 * @param existingUniqueRnBufferViews - Array of unique buffer views
 * @param rnBufferView - The buffer view to search for
 * @returns Index of the buffer view or -1 if not found
 */
export function findBufferViewIdx(existingUniqueRnBufferViews: BufferView[], rnBufferView: BufferView): number {
  const bufferViewIdx = existingUniqueRnBufferViews.findIndex(bufferView => bufferView.isSame(rnBufferView));
  return bufferViewIdx;
}

/**
 * Calculates the buffer index for deduplication purposes.
 *
 * @param existingUniqueRnBuffers - Array of unique buffers
 * @param rnBuffer - The buffer to find or add
 * @returns Index where the buffer should be placed
 */
export function calcBufferIdxToSet(existingUniqueRnBuffers: Buffer[], rnBuffer: Buffer): number {
  if (existingUniqueRnBuffers.length === 0) {
    existingUniqueRnBuffers.push(rnBuffer);
  }
  const bufferIdx = existingUniqueRnBuffers.findIndex(buffer => buffer.isSame(rnBuffer));
  const bufferIdxToSet = bufferIdx === -1 ? existingUniqueRnBuffers.length : bufferIdx;
  if (bufferIdx === -1) {
    existingUniqueRnBuffers.push(rnBuffer);
  }
  return bufferIdxToSet;
}

/**
 * Creates a glTF2 BufferView for animation data.
 *
 * @param params - Parameters for buffer view creation
 * @returns Created glTF2 buffer view with proper alignment
 */
export function createGltf2BufferViewForAnimation({
  bufferIdx,
  bufferViewByteOffset,
  accessorByteOffset,
  accessorCount,
  bufferViewByteStride,
  componentType,
  compositionType,
  uint8Array,
}: Gltf2BufferViewDesc): Gltf2BufferViewEx {
  const alignedAccessorByteOffset = alignAccessorByteOffsetTo4Bytes(accessorByteOffset);
  const { fixedBufferViewByteLength, fixedBufferViewByteOffset } = calcBufferViewByteLengthAndByteOffset({
    accessorByteOffset: alignedAccessorByteOffset,
    accessorCount: accessorCount,
    bufferViewByteStride,
    bufferViewByteOffset,
    sizeOfComponent: componentType.getSizeInBytes(),
    numberOfComponents: compositionType.getNumberOfComponents(),
  });

  const gltfBufferViewEx: Gltf2BufferViewEx = {
    buffer: bufferIdx,
    byteLength: fixedBufferViewByteLength,
    byteOffset: fixedBufferViewByteOffset,
    extras: {
      uint8Array,
    },
  };

  return gltfBufferViewEx;
}

/**
 * Creates a glTF2 Accessor for animation data.
 *
 * @param params - Parameters for accessor creation
 * @returns Created glTF2 accessor with proper type information
 */
export function createGltf2AccessorForAnimation({
  bufferViewIdx,
  accessorByteOffset,
  componentType,
  count,
  compositionType,
  min,
  max,
}: Gltf2AccessorDesc): Gltf2AccessorEx {
  const alignedAccessorByteOffset = alignAccessorByteOffsetTo4Bytes(accessorByteOffset);

  const gltf2AccessorEx = {
    bufferView: bufferViewIdx,
    byteOffset: alignedAccessorByteOffset,
    componentType: ComponentType.toGltf2AccessorComponentType(componentType),
    count,
    type: compositionType.str as Gltf2AccessorCompositionTypeString,
    min,
    max,
    extras: {},
  };
  return gltf2AccessorEx;
}

/**
 * Epsilon value for tangent vector calculations.
 */
export const TANGENT_EPSILON = 1e-6;

/**
 * Epsilon value for skin weight sum calculations.
 */
export const SKIN_WEIGHT_SUM_EPSILON = 1e-6;

/**
 * Epsilon value for skin weight difference calculations.
 */
export const SKIN_WEIGHT_DIFF_EPSILON = 1e-6;

/**
 * Tolerance value for skin weight residual calculations.
 */
export const SKIN_WEIGHT_RESIDUAL_TOLERANCE = 1e-6;

/**
 * Type definition for weight typed arrays.
 */
export type WeightTypedArray = Float32Array | Uint8Array | Uint16Array | Uint32Array;

/**
 * Accumulates a 3D vector into a Float32Array at the specified index.
 *
 * @param array - The Float32Array to accumulate into
 * @param index - The index of the vector
 * @param x - X component
 * @param y - Y component
 * @param z - Z component
 */
export function accumulateVector3(array: Float32Array, index: number, x: number, y: number, z: number): void {
  array[index * 3 + 0] += x;
  array[index * 3 + 1] += y;
  array[index * 3 + 2] += z;
}

/**
 * Builds an orthonormal vector perpendicular to the given normal.
 *
 * Creates a vector that is orthogonal to the provided normal vector,
 * used as a fallback when tangent vectors are degenerate.
 *
 * @param normal - Optional normal vector
 * @returns Orthonormal vector
 */
export function buildOrthonormalVector(normal?: { x: number; y: number; z: number }): {
  x: number;
  y: number;
  z: number;
} {
  if (!normal) {
    return { x: 1, y: 0, z: 0 };
  }

  const nx = normal.x;
  const ny = normal.y;
  const nz = normal.z;
  const normalLength = Math.hypot(nx, ny, nz);

  let ux = 0;
  let uy = 0;
  let uz = 1;

  if (normalLength > TANGENT_EPSILON) {
    const invLength = 1 / normalLength;
    const nnx = nx * invLength;
    const nny = ny * invLength;
    const nnz = nz * invLength;

    if (Math.abs(nnx) < 0.999) {
      ux = 1;
      uy = 0;
      uz = 0;
    } else {
      ux = 0;
      uy = 1;
      uz = 0;
    }

    // tangent = normalize(cross(up, normal))
    const tx = uy * nnz - uz * nny;
    const ty = uz * nnx - ux * nnz;
    const tz = ux * nny - uy * nnx;
    const tLength = Math.hypot(tx, ty, tz);
    if (tLength > TANGENT_EPSILON) {
      const inv = 1 / tLength;
      return { x: tx * inv, y: ty * inv, z: tz * inv };
    }
  }

  return { x: 1, y: 0, z: 0 };
}

/**
 * Normalizes a tangent vector and ensures it's orthogonal to the normal.
 *
 * Handles degenerate cases where the tangent vector is too small or parallel
 * to the normal vector by using a fallback orthonormal vector.
 *
 * @param tangent - The tangent vector to normalize
 * @param normal - Optional normal vector for orthogonalization
 * @param bitangent - Optional bitangent vector for handedness calculation
 * @returns Normalized tangent vector with w component indicating handedness
 */
export function normalizeTangentVector(
  tangent: { x: number; y: number; z: number; w: number },
  normal?: { x: number; y: number; z: number },
  bitangent?: { x: number; y: number; z: number }
): { x: number; y: number; z: number; w: number } {
  let tx = tangent.x;
  let ty = tangent.y;
  let tz = tangent.z;

  if (normal) {
    const dotNT = normal.x * tx + normal.y * ty + normal.z * tz;
    tx -= normal.x * dotNT;
    ty -= normal.y * dotNT;
    tz -= normal.z * dotNT;
  }

  let length = Math.hypot(tx, ty, tz);
  if (length <= TANGENT_EPSILON) {
    const fallback = buildOrthonormalVector(normal);
    tx = fallback.x;
    ty = fallback.y;
    tz = fallback.z;
    length = 1;
  } else {
    tx /= length;
    ty /= length;
    tz /= length;
  }

  let w = tangent.w !== 0 ? (tangent.w >= 0 ? 1 : -1) : 1;
  if (normal && bitangent) {
    const crossX = normal.y * tz - normal.z * ty;
    const crossY = normal.z * tx - normal.x * tz;
    const crossZ = normal.x * ty - normal.y * tx;
    const handedness = crossX * bitangent.x + crossY * bitangent.y + crossZ * bitangent.z;
    if (handedness < 0) {
      w = -1;
    }
  }

  return { x: tx, y: ty, z: tz, w };
}

/**
 * Processes a single skin weight element, sanitizing and normalizing values.
 *
 * @param accessor - The accessor containing weight data
 * @param elementIndex - Index of the element to process
 * @param baseIndex - Base index in the float data array
 * @param componentCount - Number of components per element
 * @param treatAsNormalizedUnsignedInt - Whether to treat values as normalized unsigned integers
 * @param normalizationDenominator - Denominator for normalization
 * @param floatData - Float32Array to store processed data
 * @returns True if any values were mutated
 */
export function processSkinWeightElement(
  accessor: Accessor,
  elementIndex: number,
  baseIndex: number,
  componentCount: number,
  treatAsNormalizedUnsignedInt: boolean,
  normalizationDenominator: number,
  floatData: Float32Array
): boolean {
  let mutated = false;
  let sum = 0;

  for (let componentIndex = 0; componentIndex < componentCount; componentIndex++) {
    const offset = componentIndex * accessor.componentSizeInBytes;
    const rawValue = accessor.getScalarAt(elementIndex, offset, {});
    const scaled = treatAsNormalizedUnsignedInt ? rawValue / normalizationDenominator : rawValue;
    const sanitized = sanitizeSkinWeight(scaled);
    if (sanitized.mutated) {
      mutated = true;
    }
    floatData[baseIndex + componentIndex] = sanitized.value;
    sum += sanitized.value;
  }

  if (normalizeSkinWeightElement(floatData, baseIndex, componentCount, sum)) {
    mutated = true;
  }

  return mutated;
}

/**
 * Normalizes skin weight elements to sum to 1.0.
 *
 * @param floatData - Float32Array containing weight data
 * @param baseIndex - Base index of the element
 * @param componentCount - Number of components per element
 * @param sum - Current sum of weights
 * @returns True if normalization was performed
 */
export function normalizeSkinWeightElement(
  floatData: Float32Array,
  baseIndex: number,
  componentCount: number,
  sum: number
): boolean {
  if (sum > SKIN_WEIGHT_SUM_EPSILON) {
    if (Math.abs(sum - 1) > SKIN_WEIGHT_DIFF_EPSILON) {
      const invSum = 1 / sum;
      let normalizedSum = 0;
      for (let componentIndex = 0; componentIndex < componentCount; componentIndex++) {
        const normalized = Math.fround(floatData[baseIndex + componentIndex] * invSum);
        floatData[baseIndex + componentIndex] = normalized;
        normalizedSum += normalized;
      }
      const residual = 1 - normalizedSum;
      adjustWeightsForResidual(floatData, baseIndex, componentCount, residual, SKIN_WEIGHT_RESIDUAL_TOLERANCE);
      return true;
    }
    return false;
  }
  if (sum !== 0) {
    for (let componentIndex = 0; componentIndex < componentCount; componentIndex++) {
      floatData[baseIndex + componentIndex] = 0;
    }
    return true;
  }
  return false;
}

/**
 * Scales skin weight elements to unsigned integer range.
 *
 * @param floatData - Float32Array containing normalized weight data
 * @param baseIndex - Base index of the element
 * @param componentCount - Number of components per element
 * @param typedArray - Target typed array for scaled values
 * @param maxValue - Maximum value for the component type
 */
export function scaleSkinWeightElementToUnsigned(
  floatData: Float32Array,
  baseIndex: number,
  componentCount: number,
  typedArray: WeightTypedArray,
  maxValue: number
): void {
  const scaled = new Array<number>(componentCount);
  let total = 0;

  for (let componentIndex = 0; componentIndex < componentCount; componentIndex++) {
    const clamped = Math.max(0, Math.min(floatData[baseIndex + componentIndex], 1));
    const value = Math.round(clamped * maxValue);
    scaled[componentIndex] = value;
    total += value;
  }

  let diff = maxValue - total;
  if (diff !== 0) {
    rebalanceScaledSkinWeights(diff, scaled, componentCount, maxValue, floatData, baseIndex);
  }

  for (let componentIndex = 0; componentIndex < componentCount; componentIndex++) {
    typedArray[baseIndex + componentIndex] = scaled[componentIndex];
  }
}

/**
 * Rebalances scaled skin weights to sum to the maximum value.
 *
 * @param diff - Difference to distribute
 * @param scaled - Array of scaled weight values
 * @param componentCount - Number of components
 * @param maxValue - Maximum value for the component type
 * @param floatData - Original float data for reference
 * @param baseIndex - Base index of the element
 */
export function rebalanceScaledSkinWeights(
  diff: number,
  scaled: number[],
  componentCount: number,
  maxValue: number,
  floatData: Float32Array,
  baseIndex: number
): void {
  const indices = Array.from({ length: componentCount }, (_, idx) => idx).sort(
    (a, b) => floatData[baseIndex + b] - floatData[baseIndex + a]
  );

  for (const idx of indices) {
    if (diff === 0) {
      break;
    }
    if (diff > 0) {
      const available = maxValue - scaled[idx];
      if (available <= 0) {
        continue;
      }
      const delta = Math.min(available, diff);
      scaled[idx] += delta;
      diff -= delta;
    } else {
      const available = scaled[idx];
      if (available <= 0) {
        continue;
      }
      const delta = Math.min(available, -diff);
      scaled[idx] -= delta;
      diff += delta;
    }
  }

  if (diff !== 0 && indices.length > 0) {
    const idx = indices[0];
    const baseValue = scaled[idx];
    const newValue = Math.max(0, Math.min(maxValue, baseValue + diff));
    scaled[idx] = newValue;
  }
}

/**
 * Adjusts weights to account for residual error after normalization.
 *
 * Distributes residual error across weights, prioritizing larger weights.
 *
 * @param data - Float32Array containing weight data
 * @param offset - Offset index in the array
 * @param componentCount - Number of components
 * @param residual - Residual error to distribute
 * @param tolerance - Tolerance for residual error
 */
export function adjustWeightsForResidual(
  data: Float32Array,
  offset: number,
  componentCount: number,
  residual: number,
  tolerance: number
): void {
  if (componentCount === 0 || Math.abs(residual) <= tolerance) {
    return;
  }

  const indices = Array.from({ length: componentCount }, (_, idx) => idx).sort(
    (a, b) => data[offset + b] - data[offset + a]
  );

  let remaining = residual;
  for (const localIndex of indices) {
    if (Math.abs(remaining) <= tolerance) {
      break;
    }
    const idx = offset + localIndex;
    const before = data[idx];
    const candidate = clampWeight(before + remaining);
    data[idx] = candidate;
    remaining -= candidate - before;
  }

  if (Math.abs(remaining) > tolerance) {
    const idx = offset + indices[0];
    const before = data[idx];
    const candidate = clampWeight(before + remaining);
    data[idx] = candidate;
  }
}

/**
 * Creates normalized float weights from an accessor.
 *
 * Processes skin weight data from an accessor, sanitizing and normalizing
 * values to ensure they sum to 1.0 for each element.
 *
 * @param accessor - The accessor containing weight data
 * @param componentCount - Number of components per element
 * @param elementCount - Number of elements
 * @param treatAsNormalizedUnsignedInt - Whether to treat values as normalized unsigned integers
 * @param normalizationDenominator - Denominator for normalization
 * @returns Object containing normalized float data and mutation flag
 */
export function createNormalizedFloatWeights(
  accessor: Accessor,
  componentCount: number,
  elementCount: number,
  treatAsNormalizedUnsignedInt: boolean,
  normalizationDenominator: number
): { data: Float32Array; mutated: boolean } {
  const floatData = new Float32Array(elementCount * componentCount);
  let mutated = false;

  for (let elementIndex = 0; elementIndex < elementCount; elementIndex++) {
    const baseIndex = elementIndex * componentCount;
    const elementMutated = processSkinWeightElement(
      accessor,
      elementIndex,
      baseIndex,
      componentCount,
      treatAsNormalizedUnsignedInt,
      normalizationDenominator,
      floatData
    );
    if (elementMutated) {
      mutated = true;
    }
  }

  return { data: floatData, mutated };
}

/**
 * Converts normalized float weights to unsigned integer format.
 *
 * Scales normalized float weights to the appropriate unsigned integer range
 * based on the component type, ensuring proper quantization.
 *
 * @param floatData - Float32Array containing normalized weight data
 * @param accessor - The original accessor
 * @param componentCount - Number of components per element
 * @param elementCount - Number of elements
 * @param normalizationDenominator - Denominator for normalization
 * @returns New accessor with unsigned integer weights
 */
export function convertNormalizedWeightsToUnsigned(
  floatData: Float32Array,
  accessor: Accessor,
  componentCount: number,
  elementCount: number,
  normalizationDenominator: number
): Accessor {
  const typedArray = createUnsignedTypedArray(accessor.componentType, floatData.length);
  const maxValue = normalizationDenominator;

  for (let elementIndex = 0; elementIndex < elementCount; elementIndex++) {
    const baseIndex = elementIndex * componentCount;
    scaleSkinWeightElementToUnsigned(floatData, baseIndex, componentCount, typedArray, maxValue);
  }

  return createAccessorFromWeightsTypedArray(typedArray, accessor, accessor.componentType, true);
}

/**
 * Creates an Accessor from a weight typed array.
 *
 * Constructs a new Accessor with the provided typed array data, creating
 * the necessary Buffer and BufferView structures.
 *
 * @param typedArray - The typed array containing weight data
 * @param baseAccessor - The base accessor to copy properties from
 * @param componentType - The component type for the new accessor
 * @param normalized - Whether the accessor values are normalized
 * @returns New Accessor instance
 */
export function createAccessorFromWeightsTypedArray(
  typedArray: WeightTypedArray,
  baseAccessor: Accessor,
  componentType: ComponentTypeEnum,
  normalized: boolean
): Accessor {
  const arrayBuffer = typedArray.buffer as ArrayBuffer;
  const buffer = new Buffer({
    byteLength: arrayBuffer.byteLength,
    buffer: arrayBuffer,
    name: 'NormalizedSkinWeightsBuffer',
    byteAlign: 4,
    bufferUsage: BufferUse.CPUGeneric,
    indexOfTheBufferUsage: 0,
  });
  const bufferView = new BufferView({
    buffer,
    byteOffsetInBuffer: 0,
    defaultByteStride: 0,
    byteLength: arrayBuffer.byteLength,
    raw: arrayBuffer,
  });

  const newAccessor = new Accessor({
    bufferView,
    byteOffsetInBufferView: 0,
    compositionType: baseAccessor.compositionType,
    componentType,
    byteStride: 0,
    count: baseAccessor.elementCount,
    raw: arrayBuffer,
    arrayLength: 1,
    normalized,
  });

  return newAccessor;
}

/**
 * Finds the primary texture coordinate accessor from a primitive.
 *
 * Searches for the first TEXCOORD attribute in the primitive's semantics.
 *
 * @param primitive - The primitive to search
 * @returns The primary texture coordinate accessor or undefined if not found
 */
export function findPrimaryTexcoordAccessor(primitive: Primitive): Accessor | undefined {
  const semantics = primitive.attributeSemantics;
  for (const semantic of semantics) {
    if (semantic.startsWith('TEXCOORD_')) {
      return primitive.getAttribute(semantic as VertexAttributeSemanticsJoinedString) ?? undefined;
    }
  }
  return undefined;
}

/**
 * Creates a temporary Vec4 accessor for tangent calculations.
 *
 * Creates a temporary buffer, buffer view, and accessor for storing
 * Vec4 tangent data during export processing.
 *
 * @param count - Number of elements in the accessor
 * @returns New Accessor instance with Vec4 composition type
 */
export function createTemporaryVec4Accessor(count: number): Accessor {
  const byteLength = count * 4 * 4;
  const buffer = new Buffer({
    byteLength,
    buffer: new ArrayBuffer(byteLength),
    name: 'Gltf2Exporter_Tangent',
    byteAlign: 4,
    bufferUsage: BufferUse.CPUGeneric,
    indexOfTheBufferUsage: 0,
  });
  const bufferView = buffer
    .takeBufferView({
      byteLengthToNeed: byteLength,
      byteStride: 0,
    })
    .unwrapForce();

  return bufferView
    .takeAccessor({
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      count,
    })
    .unwrapForce();
}

/**
 * Normalizes normal vectors in an accessor.
 *
 * Reads normal data from the accessor, normalizes each vector to unit length,
 * and creates a new accessor with the normalized data.
 *
 * @param accessor - The accessor containing normal data
 * @returns New Accessor with normalized normal vectors
 */
export function normalizeNormals(accessor: Accessor): Accessor {
  const componentCount = accessor.compositionType.getNumberOfComponents();
  const elementCount = accessor.elementCount;

  // Read the normal data
  const normalData = new Float32Array(elementCount * componentCount);
  if (componentCount === 3) {
    // VEC3
    for (let i = 0; i < elementCount; i++) {
      const vec = accessor.getVec3(i, {});
      normalData[i * 3 + 0] = vec.x;
      normalData[i * 3 + 1] = vec.y;
      normalData[i * 3 + 2] = vec.z;
    }
  } else if (componentCount === 2) {
    // VEC2
    for (let i = 0; i < elementCount; i++) {
      const vec = accessor.getVec2(i, {});
      normalData[i * 2 + 0] = vec.x;
      normalData[i * 2 + 1] = vec.y;
    }
  } else if (componentCount === 4) {
    // VEC4
    for (let i = 0; i < elementCount; i++) {
      const vec = accessor.getVec4(i, {});
      normalData[i * 4 + 0] = vec.x;
      normalData[i * 4 + 1] = vec.y;
      normalData[i * 4 + 2] = vec.z;
      normalData[i * 4 + 3] = vec.w;
    }
  } else {
    // Fallback: scalar
    for (let i = 0; i < elementCount; i++) {
      normalData[i] = accessor.getScalar(i, {});
    }
  }

  // Normalize each normal vector
  for (let i = 0; i < elementCount; i++) {
    const offset = i * componentCount;
    let length = 0;

    // Calculate length
    for (let j = 0; j < componentCount; j++) {
      const value = normalData[offset + j];
      length += value * value;
    }
    length = Math.sqrt(length);

    // Normalize if length is not zero
    if (length > 0) {
      for (let j = 0; j < componentCount; j++) {
        normalData[offset + j] /= length;
      }
    }
  }

  // Create new buffer and buffer view with normalized data
  const arrayBuffer = normalData.buffer;
  const newBuffer = new Buffer({
    byteLength: arrayBuffer.byteLength,
    buffer: arrayBuffer,
    name: 'NormalizedNormalsBuffer',
    byteAlign: 4,
    bufferUsage: BufferUse.CPUGeneric,
    indexOfTheBufferUsage: 0,
  });
  const newBufferView = new BufferView({
    buffer: newBuffer,
    byteOffsetInBuffer: 0,
    defaultByteStride: 0,
    byteLength: normalData.byteLength,
    raw: arrayBuffer,
  });

  // Create new accessor with the same properties but different data
  const newAccessor = new Accessor({
    bufferView: newBufferView,
    byteOffsetInBufferView: 0,
    compositionType: accessor.compositionType,
    componentType: accessor.componentType,
    byteStride: 0,
    count: elementCount,
    raw: arrayBuffer,
    arrayLength: 1,
    normalized: false,
  });

  return newAccessor;
}

/**
 * Normalizes skin weights in an accessor.
 *
 * Processes skin weight data to ensure values are properly normalized,
 * sanitized, and converted to the appropriate format.
 *
 * @param accessor - The accessor containing skin weight data
 * @returns New Accessor with normalized skin weights, or original if unchanged
 */
export function normalizeSkinWeights(accessor: Accessor): Accessor {
  const componentCount = accessor.compositionType.getNumberOfComponents();
  const elementCount = accessor.elementCount;
  if (componentCount === 0 || elementCount === 0) {
    return accessor;
  }

  const treatAsNormalizedUnsignedInt =
    accessor.normalized &&
    (accessor.componentType === ComponentType.UnsignedByte ||
      accessor.componentType === ComponentType.UnsignedShort ||
      accessor.componentType === ComponentType.UnsignedInt);

  const normalizationDenominator = treatAsNormalizedUnsignedInt
    ? getNormalizedUnsignedComponentMax(accessor.componentType)
    : 1;

  const normalizationResult = createNormalizedFloatWeights(
    accessor,
    componentCount,
    elementCount,
    treatAsNormalizedUnsignedInt,
    normalizationDenominator
  );

  if (!normalizationResult.mutated) {
    return accessor;
  }

  if (treatAsNormalizedUnsignedInt) {
    return convertNormalizedWeightsToUnsigned(
      normalizationResult.data,
      accessor,
      componentCount,
      elementCount,
      normalizationDenominator
    );
  }

  const componentTypeForFloat = accessor.componentType.isFloatingPoint() ? accessor.componentType : ComponentType.Float;
  const normalizedFlagForFloat = componentTypeForFloat === accessor.componentType ? accessor.normalized : false;
  return createAccessorFromWeightsTypedArray(
    normalizationResult.data,
    accessor,
    componentTypeForFloat,
    normalizedFlagForFloat
  );
}

/**
 * Creates BufferView and Accessor for animation input (time) data.
 *
 * @param json - The glTF2 JSON document
 * @param sampler - The animation sampler containing input data
 * @param bufferIdx - Index of the target buffer
 * @param bufferViewByteLengthAccumulated - Current accumulated byte length
 * @returns Object containing accessor index and updated byte length
 */
export function createGltf2BufferViewAndGltf2AccessorForInput(
  json: Gltf2Ex,
  sampler: AnimationSampler,
  bufferIdx: Index,
  bufferViewByteLengthAccumulated: Byte
): {
  inputAccessorIdx: Index;
  inputBufferViewByteLengthAccumulated: Byte;
} {
  const componentType = ComponentType.fromTypedArray(
    ArrayBuffer.isView(sampler.input) ? sampler.input : new Float32Array(sampler.input)
  );
  const accessorCount = sampler.input.length;
  // create a Gltf2BufferView
  const gltf2BufferView: Gltf2BufferViewEx = createGltf2BufferViewForAnimation({
    bufferIdx,
    bufferViewByteOffset: bufferViewByteLengthAccumulated,
    accessorByteOffset: 0,
    accessorCount,
    bufferViewByteStride: ComponentType.Float.getSizeInBytes(),
    componentType,
    compositionType: CompositionType.Scalar,
    uint8Array: new Uint8Array(
      ArrayBuffer.isView(sampler.input) ? sampler.input.buffer : new Float32Array(sampler.input).buffer
    ),
  });
  json.bufferViews.push(gltf2BufferView);

  // create a Gltf2Accessor
  const gltf2Accessor: Gltf2AccessorEx = createGltf2AccessorForAnimation({
    bufferViewIdx: json.bufferViews.indexOf(gltf2BufferView),
    accessorByteOffset: 0,
    componentType,
    count: accessorCount,
    compositionType: CompositionType.Scalar,
    min: [sampler.input[0]],
    max: [sampler.input[sampler.input.length - 1]],
  });
  json.accessors.push(gltf2Accessor);

  // register
  bufferViewByteLengthAccumulated = alignBufferViewByteLength(bufferViewByteLengthAccumulated, gltf2BufferView);
  const inputAccessorIdx = json.accessors.indexOf(gltf2Accessor);
  return {
    inputAccessorIdx,
    inputBufferViewByteLengthAccumulated: bufferViewByteLengthAccumulated,
  };
}

/**
 * Creates BufferView and Accessor for animation output (value) data.
 *
 * @param json - The glTF2 JSON document
 * @param sampler - The animation sampler containing output data
 * @param pathName - The animation path name
 * @param bufferIdx - Index of the target buffer
 * @param bufferViewByteLengthAccumulated - Current accumulated byte length
 * @returns Object containing accessor index and updated byte length
 */
export function createGltf2BufferViewAndGltf2AccessorForOutput(
  json: Gltf2Ex,
  sampler: AnimationSampler,
  pathName: AnimationPathName,
  bufferIdx: Index,
  bufferViewByteLengthAccumulated: Byte
): {
  outputAccessorIdx: Index;
  outputBufferViewByteLengthAccumulated: Byte;
} {
  const componentType = ComponentType.fromTypedArray(
    ArrayBuffer.isView(sampler.output) ? sampler.output : new Float32Array(sampler.output)
  );

  const compositionType =
    pathName === 'weights'
      ? CompositionType.Scalar
      : CompositionType.toGltf2AnimationAccessorCompositionType(sampler.outputComponentN);
  const accessorCount =
    pathName === 'weights' ? sampler.output.length : sampler.output.length / sampler.outputComponentN;

  // create a Gltf2BufferView
  const gltf2BufferView = createGltf2BufferViewForAnimation({
    bufferIdx,
    bufferViewByteOffset: bufferViewByteLengthAccumulated,
    accessorByteOffset: 0,
    accessorCount,
    bufferViewByteStride: componentType.getSizeInBytes() * sampler.outputComponentN,
    componentType,
    compositionType,
    uint8Array: new Uint8Array(
      ArrayBuffer.isView(sampler.output) ? sampler.output.buffer : new Float32Array(sampler.output).buffer
    ),
  });
  json.bufferViews.push(gltf2BufferView);

  // create a Gltf2Accessor
  const gltf2Accessor: Gltf2AccessorEx = createGltf2AccessorForAnimation({
    bufferViewIdx: json.bufferViews.indexOf(gltf2BufferView),
    accessorByteOffset: 0,
    componentType,
    count: accessorCount,
    compositionType,
  });
  json.accessors.push(gltf2Accessor);

  // register
  bufferViewByteLengthAccumulated = alignBufferViewByteLength(bufferViewByteLengthAccumulated, gltf2BufferView);
  const outputAccessorIdx = json.accessors.indexOf(gltf2Accessor);
  return {
    outputAccessorIdx,
    outputBufferViewByteLengthAccumulated: bufferViewByteLengthAccumulated,
  };
}

/**
 * Creates or reuses a glTF2 BufferView for general use.
 *
 * @param json - The glTF2 JSON document
 * @param existingUniqueRnBuffers - Buffer deduplication cache
 * @param existingUniqueRnBufferViews - BufferView deduplication cache
 * @param rnBufferView - The Rhodonite buffer view to convert
 * @param target - Optional target binding (e.g., ARRAY_BUFFER)
 * @returns The created or existing glTF2 buffer view
 */
export function createOrReuseGltf2BufferView(
  json: Gltf2Ex,
  existingUniqueRnBuffers: Buffer[],
  existingUniqueRnBufferViews: BufferView[],
  rnBufferView: BufferView,
  target?: number
): Gltf2BufferViewEx {
  const bufferViewIdx = findBufferViewIdx(existingUniqueRnBufferViews, rnBufferView);
  if (bufferViewIdx === -1) {
    const bufferIdxToSet = calcBufferIdxToSet(existingUniqueRnBuffers, rnBufferView.buffer);
    const gltf2BufferView: Gltf2BufferViewEx = {
      buffer: bufferIdxToSet,
      byteLength: rnBufferView.byteLength,
      byteOffset: rnBufferView.byteOffsetInBuffer,
      extras: {
        uint8Array: rnBufferView.getUint8Array(),
      },
    };
    if (Is.exist(target)) {
      gltf2BufferView.target = target;
    }

    json.extras.bufferViewByteLengthAccumulatedArray[bufferIdxToSet] = accumulateBufferViewByteLength(
      json.extras.bufferViewByteLengthAccumulatedArray,
      bufferIdxToSet,
      gltf2BufferView
    );
    existingUniqueRnBufferViews.push(rnBufferView);
    json.bufferViews.push(gltf2BufferView);
    return gltf2BufferView;
  }
  const gltf2BufferView = json.bufferViews[bufferViewIdx];
  return gltf2BufferView;
}

/**
 * Creates or reuses a glTF2 Accessor with deduplication.
 *
 * @param json - The glTF2 JSON document
 * @param bufferViewIdxToSet - Index of the buffer view to use
 * @param existingUniqueRnAccessors - Accessor deduplication cache
 * @param rnAccessor - The Rhodonite accessor to convert
 * @returns The created or existing glTF2 accessor
 */
export function createOrReuseGltf2Accessor(
  json: Gltf2Ex,
  bufferViewIdxToSet: Index,
  existingUniqueRnAccessors: Accessor[],
  rnAccessor: Accessor
): Gltf2AccessorEx {
  const accessorIdx = calcAccessorIdxToSet(existingUniqueRnAccessors, rnAccessor);
  if (accessorIdx === -1) {
    // create a Gltf2Accessor
    const gltf2Accessor: Gltf2AccessorEx = {
      bufferView: bufferViewIdxToSet,
      byteOffset: rnAccessor.byteOffsetInBufferView,
      componentType: ComponentType.toGltf2AccessorComponentType(rnAccessor.componentType as Gltf2AccessorComponentType),
      count: rnAccessor.elementCount,
      type: CompositionType.toGltf2AccessorCompositionTypeString(
        rnAccessor.compositionType.getNumberOfComponents() as VectorAndSquareMatrixComponentN
      ),
      extras: {
        uint8Array: undefined,
      },
    };
    if (rnAccessor.compositionType.getNumberOfComponents() <= 4) {
      gltf2Accessor.max = rnAccessor.max;
      gltf2Accessor.min = rnAccessor.min;
    }
    existingUniqueRnAccessors.push(rnAccessor);
    json.accessors.push(gltf2Accessor);
    return gltf2Accessor;
  }
  const gltf2Accessor = json.accessors[accessorIdx];
  return gltf2Accessor;
}

const exportTangentAccessorCache = new WeakMap<Primitive, Accessor>();

/**
 * Gets or creates the export tangent accessor for a primitive.
 *
 * Uses caching to avoid recomputing tangent accessors for the same primitive.
 * If an existing tangent accessor exists, it normalizes it. Otherwise, computes
 * tangents from position and texture coordinate data.
 *
 * @param primitive - The primitive to get/create tangent accessor for
 * @returns The tangent accessor or undefined if it cannot be created
 */
export function getExportTangentAccessorForPrimitive(primitive: Primitive): Accessor | undefined {
  if (exportTangentAccessorCache.has(primitive)) {
    return exportTangentAccessorCache.get(primitive);
  }

  let accessor: Accessor | undefined;
  const existingTangentAccessor = primitive.getAttribute(VertexAttribute.Tangent.XYZ);
  const normalAccessor = primitive.getAttribute(VertexAttribute.Normal.XYZ);

  if (Is.exist(existingTangentAccessor)) {
    accessor = createNormalizedTangentAccessor(existingTangentAccessor, normalAccessor);
  } else {
    accessor = createComputedTangentAccessor(primitive, normalAccessor);
  }

  if (Is.exist(accessor)) {
    exportTangentAccessorCache.set(primitive, accessor);
  }

  return accessor;
}

/**
 * Creates a normalized tangent accessor from an existing source accessor.
 *
 * Normalizes each tangent vector using the provided normal vectors to ensure
 * orthogonality and proper orientation.
 *
 * @param source - The source tangent accessor
 * @param normalAccessor - Optional normal accessor for orthonormalization
 * @returns New Accessor with normalized tangent vectors
 */
export function createNormalizedTangentAccessor(source: Accessor, normalAccessor: Accessor | undefined): Accessor {
  const count = source.elementCount;
  const accessor = createTemporaryVec4Accessor(count);

  for (let i = 0; i < count; i++) {
    const tangent = source.getVec4(i, {});
    const normal = normalAccessor?.getVec3(i, {});
    const normalized = normalizeTangentVector(
      { x: tangent.x, y: tangent.y, z: tangent.z, w: tangent.w },
      normal ? { x: normal.x, y: normal.y, z: normal.z } : undefined
    );
    accessor.setVec4(i, normalized.x, normalized.y, normalized.z, normalized.w, {});
  }

  return accessor;
}

/**
 * Computes tangent vectors for a primitive from position and texture coordinates.
 *
 * Calculates tangents using the Mikkelsen tangent space algorithm, accumulating
 * tangent and bitangent vectors across all triangles and then normalizing them.
 *
 * @param primitive - The primitive to compute tangents for
 * @param normalAccessor - Optional normal accessor for orthonormalization
 * @returns New Accessor with computed tangent vectors or undefined if computation fails
 */
export function createComputedTangentAccessor(
  primitive: Primitive,
  normalAccessor: Accessor | undefined
): Accessor | undefined {
  const positionAccessor = primitive.getAttribute(VertexAttribute.Position.XYZ);
  if (Is.not.exist(positionAccessor)) {
    return undefined;
  }

  const texcoordAccessor = findPrimaryTexcoordAccessor(primitive);
  if (Is.not.exist(texcoordAccessor)) {
    return undefined;
  }

  const vertexCount = positionAccessor.elementCount;
  if (vertexCount === 0) {
    return undefined;
  }

  const accessor = createTemporaryVec4Accessor(vertexCount);
  const tangentSums = new Float32Array(vertexCount * 3);
  const bitangentSums = new Float32Array(vertexCount * 3);

  const indicesAccessor = primitive.indicesAccessor;
  const vertexCountAsIndicesBased = primitive.getVertexCountAsIndicesBased();

  let incrementNum = 3;
  const primitiveMode = primitive.primitiveMode;
  if (primitiveMode === PrimitiveMode.TriangleStrip || primitiveMode === PrimitiveMode.TriangleFan) {
    incrementNum = 1;
  }

  const extractIndex = (i: number) => (indicesAccessor ? indicesAccessor.getScalar(i, {}) : i);

  for (let i = 0; i < vertexCountAsIndicesBased - 2; i += incrementNum) {
    const i0 = extractIndex(i);
    const i1 = extractIndex(i + 1);
    const i2 = extractIndex(i + 2);

    if (i0 === i1 || i1 === i2 || i0 === i2) {
      continue;
    }

    const pos0 = positionAccessor.getVec3(i0, {});
    const pos1 = positionAccessor.getVec3(i1, {});
    const pos2 = positionAccessor.getVec3(i2, {});

    const uv0 = texcoordAccessor.getVec2(i0, {});
    const uv1 = texcoordAccessor.getVec2(i1, {});
    const uv2 = texcoordAccessor.getVec2(i2, {});

    const edge1x = pos1.x - pos0.x;
    const edge1y = pos1.y - pos0.y;
    const edge1z = pos1.z - pos0.z;

    const edge2x = pos2.x - pos0.x;
    const edge2y = pos2.y - pos0.y;
    const edge2z = pos2.z - pos0.z;

    const deltaUv1x = uv1.x - uv0.x;
    const deltaUv1y = uv1.y - uv0.y;
    const deltaUv2x = uv2.x - uv0.x;
    const deltaUv2y = uv2.y - uv0.y;

    const denom = deltaUv1x * deltaUv2y - deltaUv2x * deltaUv1y;
    if (Math.abs(denom) <= TANGENT_EPSILON) {
      continue;
    }

    const r = 1.0 / denom;

    const tangentX = (deltaUv2y * edge1x - deltaUv1y * edge2x) * r;
    const tangentY = (deltaUv2y * edge1y - deltaUv1y * edge2y) * r;
    const tangentZ = (deltaUv2y * edge1z - deltaUv1y * edge2z) * r;

    const bitangentX = (deltaUv1x * edge2x - deltaUv2x * edge1x) * r;
    const bitangentY = (deltaUv1x * edge2y - deltaUv2x * edge1y) * r;
    const bitangentZ = (deltaUv1x * edge2z - deltaUv2x * edge1z) * r;

    accumulateVector3(tangentSums, i0, tangentX, tangentY, tangentZ);
    accumulateVector3(tangentSums, i1, tangentX, tangentY, tangentZ);
    accumulateVector3(tangentSums, i2, tangentX, tangentY, tangentZ);

    accumulateVector3(bitangentSums, i0, bitangentX, bitangentY, bitangentZ);
    accumulateVector3(bitangentSums, i1, bitangentX, bitangentY, bitangentZ);
    accumulateVector3(bitangentSums, i2, bitangentX, bitangentY, bitangentZ);
  }

  for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++) {
    const tangent = {
      x: tangentSums[vertexIndex * 3 + 0],
      y: tangentSums[vertexIndex * 3 + 1],
      z: tangentSums[vertexIndex * 3 + 2],
      w: 1,
    };
    const bitangent = {
      x: bitangentSums[vertexIndex * 3 + 0],
      y: bitangentSums[vertexIndex * 3 + 1],
      z: bitangentSums[vertexIndex * 3 + 2],
    };
    const normal = normalAccessor?.getVec3(vertexIndex, {});

    const normalized = normalizeTangentVector(
      tangent,
      normal ? { x: normal.x, y: normal.y, z: normal.z } : undefined,
      bitangent
    );
    accessor.setVec4(vertexIndex, normalized.x, normalized.y, normalized.z, normalized.w, {});
  }

  return accessor;
}

/**
 * Creates or reuses a glTF2 BufferView for vertex attribute data.
 *
 * Optimizes buffer view creation by checking for existing compatible buffer views
 * and creating new ones only when necessary. Handles proper stride calculation
 * for vertex attributes.
 *
 * @param json - The glTF2 JSON document
 * @param existingUniqueRnBuffers - Buffer deduplication cache
 * @param existingUniqueRnBufferViews - BufferView deduplication cache
 * @param rnBufferView - The Rhodonite buffer view to convert
 * @param rnAccessor - The accessor that will use this buffer view
 * @returns The created or existing glTF2 buffer view
 */
export function createOrReuseGltf2BufferViewForVertexAttributeBuffer(
  json: Gltf2Ex,
  existingUniqueRnBuffers: Buffer[],
  existingUniqueRnBufferViews: BufferView[],
  rnBufferView: BufferView,
  rnAccessor: Accessor
): Gltf2BufferViewEx {
  const bufferViewIdx = findBufferViewIdx(existingUniqueRnBufferViews, rnBufferView);
  if (bufferViewIdx === -1) {
    const bufferIdxToSet = calcBufferIdxToSet(existingUniqueRnBuffers, rnBufferView.buffer);
    const gltf2BufferView: Gltf2BufferViewEx = {
      buffer: bufferIdxToSet,
      byteLength: rnBufferView.byteLength,
      byteOffset: rnBufferView.byteOffsetInBuffer,
      extras: {
        uint8Array: rnBufferView.getUint8Array(),
      },
    };
    gltf2BufferView.target = GL_ARRAY_BUFFER;

    const resolvedByteStride = resolveVertexAttributeByteStride(rnBufferView, rnAccessor);
    if (Is.exist(resolvedByteStride)) {
      gltf2BufferView.byteStride = resolvedByteStride;
    }

    json.extras.bufferViewByteLengthAccumulatedArray[bufferIdxToSet] = accumulateBufferViewByteLength(
      json.extras.bufferViewByteLengthAccumulatedArray,
      bufferIdxToSet,
      gltf2BufferView
    );

    existingUniqueRnBufferViews.push(rnBufferView);
    json.bufferViews.push(gltf2BufferView);
    return gltf2BufferView;
  }
  const gltf2BufferView = json.bufferViews[bufferViewIdx] as Gltf2BufferViewEx;
  const resolvedByteStride = resolveVertexAttributeByteStride(rnBufferView, rnAccessor);
  if (Is.exist(resolvedByteStride)) {
    const currentStride = gltf2BufferView.byteStride ?? 0;
    if (currentStride === 0 || currentStride < resolvedByteStride) {
      gltf2BufferView.byteStride = resolvedByteStride;
    }
  }
  return gltf2BufferView;
}

/**
 * Checks if a Rhodonite material requires tangent vectors.
 *
 * Determines if the material uses normal mapping or clearcoat normal mapping,
 * which require tangent vectors for proper rendering.
 *
 * @param material - The material to check, or undefined
 * @returns True if the material requires tangents, false otherwise
 */
export function doesRhodoniteMaterialRequireTangents(material: Material | undefined): boolean {
  if (Is.not.exist(material)) {
    return false;
  }

  const normalTextureParam = material.getTextureParameter('normalTexture') as any;
  if (Is.exist(normalTextureParam?.[1])) {
    return true;
  }

  const clearcoatNormalTextureParam = material.getTextureParameter('clearcoatNormalTexture') as any;
  return Is.exist(clearcoatNormalTextureParam?.[1]);
}

/**
 * Sets up blend shape (morph target) data for a primitive.
 *
 * Processes blend shape targets from Rhodonite format to glTF2 morph targets,
 * creating the necessary accessors and buffer views for vertex attribute deltas.
 *
 * @param entity - The mesh entity containing blend shape data
 * @param rnPrimitive - The Rhodonite primitive with blend shape targets
 * @param primitive - The glTF2 primitive to populate with morph targets
 * @param json - The glTF2 JSON document
 * @param existingUniqueRnBuffers - Buffer deduplication cache
 * @param existingUniqueRnBufferViews - BufferView deduplication cache
 * @param existingUniqueRnAccessors - Accessor deduplication cache
 */
export function setupBlendShapeData(
  entity: IMeshEntity,
  rnPrimitive: Primitive,
  primitive: Gltf2Primitive,
  json: Gltf2Ex,
  existingUniqueRnBuffers: Buffer[],
  existingUniqueRnBufferViews: BufferView[],
  existingUniqueRnAccessors: Accessor[]
): void {
  const blendShapeComponent = entity.tryToGetBlendShape();
  if (Is.exist(blendShapeComponent)) {
    const targets = rnPrimitive.getBlendShapeTargets();
    if (Is.not.exist(primitive.targets)) {
      primitive.targets = [] as Gltf2AttributeBlendShapes;
    }

    const targetNames = blendShapeComponent.targetNames;
    if (targets.length > 0) {
      const limitedTargetNames = targets.map((_, idx) => targetNames[idx] ?? `MorphTarget_${idx}`);
      primitive.extras = primitive.extras ?? {};
      primitive.extras.targetNames = limitedTargetNames;
    }

    for (const target of targets) {
      const targetJson = {} as Gltf2Attributes;
      for (const [attributeName, rnAccessor] of target.entries()) {
        const gltf2BufferView = createOrReuseGltf2BufferView(
          json,
          existingUniqueRnBuffers,
          existingUniqueRnBufferViews,
          rnAccessor.bufferView,
          GL_ARRAY_BUFFER
        );

        const gltf2Accessor = createOrReuseGltf2Accessor(
          json,
          json.bufferViews.indexOf(gltf2BufferView),
          existingUniqueRnAccessors,
          rnAccessor
        );
        const accessorIdx = json.accessors.indexOf(gltf2Accessor);
        const attributeJoinedString = attributeName;
        const attribute = attributeJoinedString.split('.')[0];
        targetJson[attribute] = accessorIdx;
      }
      primitive.targets.push(targetJson);
    }
  }
}

/**
 * Handles texture image processing for different export formats.
 *
 * Processes texture images for inclusion in glTF2 export, handling both
 * separate file downloads and embedded binary formats depending on export type.
 *
 * @param json - The glTF2 JSON document
 * @param bufferIdx - Index of the target buffer
 * @param blob - Image data as a Blob
 * @param option - Export options affecting image handling
 * @param glTF2ImageEx - The glTF2 image object to populate
 * @param resolve - Promise resolve callback
 * @param rejected - Promise reject callback
 */
export async function handleTextureImage(
  json: Gltf2Ex,
  bufferIdx: Index,
  blob: Blob,
  option: { type: string },
  glTF2ImageEx: Gltf2ImageEx,
  resolve: (v?: ArrayBuffer) => void,
  rejected: (reason?: DOMException) => void,
  gltf2ExportType = 'glTF'
): Promise<void> {
  if (option.type === gltf2ExportType) {
    setTimeout(() => {
      const a = document.createElement('a');
      const e = new MouseEvent('click');
      a.href = URL.createObjectURL(blob!);
      a.download = glTF2ImageEx.uri!;
      a.dispatchEvent(e);
      URL.revokeObjectURL(a.href);
    }, Math.random() * 5000);
    resolve();
  } else {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const gltf2BufferView = createAndAddGltf2BufferView(
        json,
        bufferIdx,
        new Uint8ClampedArray(arrayBuffer) as unknown as Uint8Array
      );
      glTF2ImageEx.bufferView = json.bufferViews.indexOf(gltf2BufferView);
      glTF2ImageEx.mimeType = 'image/png';
      glTF2ImageEx.uri = undefined;
      resolve();
    });
    reader.addEventListener('error', () => {
      rejected(reader.error as DOMException);
    });
    reader.readAsArrayBuffer(blob);
  }
}

/**
 * Creates BufferViews and Accessors for skin (skeletal) data.
 *
 * Processes skeletal entities to extract inverse bind matrices and joint
 * hierarchies, creating the necessary glTF2 buffer views and accessors.
 *
 * @param json - The glTF2 JSON document to populate
 * @param entities - Skeletal entities to process
 * @param existingUniqueRnBuffers - Buffer deduplication cache
 * @param existingUniqueRnBufferViews - BufferView deduplication cache
 * @param existingUniqueRnAccessors - Accessor deduplication cache
 */
export function __createBufferViewsAndAccessorsOfSkin(
  json: Gltf2Ex,
  entities: ISkeletalEntity[],
  existingUniqueRnBuffers: Buffer[],
  existingUniqueRnBufferViews: BufferView[],
  existingUniqueRnAccessors: Accessor[]
): void {
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    const skeletalComponent = entity.tryToGetSkeletal();
    if (Is.not.exist(skeletalComponent)) {
      continue;
    }
    json.extras.rnSkins.push(skeletalComponent.entity as any);
    const jointSceneComponentsOfTheEntity = skeletalComponent.getJoints();
    const jointIndicesOfTheEntity: Index[] = [];
    for (const jointSceneComponent of jointSceneComponentsOfTheEntity) {
      entities.forEach((entityObj, j) => {
        if (jointSceneComponent.entity === entityObj) {
          jointIndicesOfTheEntity.push(j);
        }
      });
    }

    const inverseBindMatRnAccessor = skeletalComponent.getInverseBindMatricesAccessor();
    if (Is.exist(inverseBindMatRnAccessor)) {
      const gltf2BufferView = createOrReuseGltf2BufferView(
        json,
        existingUniqueRnBuffers,
        existingUniqueRnBufferViews,
        inverseBindMatRnAccessor.bufferView
      );

      createOrReuseGltf2Accessor(
        json,
        json.bufferViews.indexOf(gltf2BufferView),
        existingUniqueRnAccessors,
        inverseBindMatRnAccessor
      );
    }

    const topOfJointsSkeletonSceneComponent = skeletalComponent.topOfJointsHierarchy;
    const bindShapeMatrix = skeletalComponent._bindShapeMatrix;
    let skeletalIdx = -1;
    if (Is.exist(topOfJointsSkeletonSceneComponent)) {
      const skeletalEntity = topOfJointsSkeletonSceneComponent.entity as ISkeletalEntity;
      skeletalIdx = entities.indexOf(skeletalEntity);
    } else {
      skeletalIdx = jointIndicesOfTheEntity[0];
    }
    const skinJson: Gltf2Skin = {
      joints: jointIndicesOfTheEntity,
      inverseBindMatrices: json.accessors.length - 1,
      skeleton: skeletalIdx >= 0 ? skeletalIdx : undefined,
      bindShapeMatrix: bindShapeMatrix?.flattenAsArray(),
    };

    json.skins.push(skinJson);
  }
}

/**
 * Creates BufferViews and Accessors for mesh geometry data.
 *
 * Processes mesh entities to extract vertex attributes, indices, and blend shape
 * data, creating the necessary glTF2 buffer views and accessors. Handles
 * deduplication and proper memory layout for efficient storage.
 *
 * @param json - The glTF2 JSON document to populate
 * @param entities - Mesh entities to process
 * @param existingUniqueRnBuffers - Buffer deduplication cache
 * @param existingUniqueRnBufferViews - BufferView deduplication cache
 * @param existingUniqueRnAccessors - Accessor deduplication cache
 */
export function __createBufferViewsAndAccessorsOfMesh(
  json: Gltf2Ex,
  entities: IMeshEntity[],
  existingUniqueRnBuffers: Buffer[],
  existingUniqueRnBufferViews: BufferView[],
  existingUniqueRnAccessors: Accessor[]
): void {
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    const meshComponent = entity.tryToGetMesh();
    if (Is.exist(meshComponent) && meshComponent.mesh) {
      const mesh: Gltf2Mesh = { primitives: [] };
      const rnMesh = meshComponent.mesh;
      const primitiveCount = rnMesh.getPrimitiveNumber();
      for (let j = 0; j < primitiveCount; j++) {
        const rnPrimitive = rnMesh.getPrimitiveAt(j);
        const primitive: Gltf2Primitive = {
          attributes: {},
          mode: rnPrimitive.primitiveMode.index,
        };

        // Vertex Indices
        // For indices accessor
        const rnIndicesAccessor = rnPrimitive.indicesAccessor;
        if (Is.exist(rnIndicesAccessor)) {
          const rnBufferView = rnIndicesAccessor.bufferView;
          const gltf2BufferView = createOrReuseGltf2BufferView(
            json,
            existingUniqueRnBuffers,
            existingUniqueRnBufferViews,
            rnBufferView,
            GL_ELEMENT_ARRAY_BUFFER
          );

          const gltf2Accessor = createOrReuseGltf2Accessor(
            json,
            json.bufferViews.indexOf(gltf2BufferView),
            existingUniqueRnAccessors,
            rnIndicesAccessor
          );
          const accessorIdx = json.accessors.indexOf(gltf2Accessor);
          primitive.indices = accessorIdx;
        }

        // Vertex Attributes
        // For each attribute accessor
        const exportAttributeSemantics = rnPrimitive.attributeSemantics.concat();
        const exportAttributeAccessors = rnPrimitive.attributeAccessors.concat();

        const needsTangents = doesRhodoniteMaterialRequireTangents(rnPrimitive.material);
        if (needsTangents) {
          const tangentSemanticIndex = exportAttributeSemantics.findIndex(semantic => semantic.startsWith('TANGENT'));
          const exportTangentAccessor = getExportTangentAccessorForPrimitive(rnPrimitive);
          if (Is.exist(exportTangentAccessor)) {
            if (tangentSemanticIndex >= 0) {
              exportAttributeAccessors[tangentSemanticIndex] = exportTangentAccessor;
            } else {
              exportAttributeSemantics.push(VertexAttribute.Tangent.XYZ);
              exportAttributeAccessors.push(exportTangentAccessor);
            }
          }
        }

        for (let attrIndex = 0; attrIndex < exportAttributeAccessors.length; attrIndex++) {
          const attributeJoinedString = exportAttributeSemantics[attrIndex] as string;
          const attributeName = attributeJoinedString.split('.')[0];
          if (attributeName === 'BARY_CENTRIC_COORD') {
            continue;
          }
          // create a Gltf2BufferView
          const rnAttributeAccessor = exportAttributeAccessors[attrIndex];

          // Normalize normals if needed
          let normalizedAccessor = rnAttributeAccessor;
          if (attributeName === 'NORMAL') {
            normalizedAccessor = normalizeNormals(rnAttributeAccessor);
          } else if (attributeName === 'WEIGHTS_0') {
            normalizedAccessor = normalizeSkinWeights(rnAttributeAccessor);
          }

          const rnBufferView = normalizedAccessor.bufferView;
          const gltf2BufferView = createOrReuseGltf2BufferViewForVertexAttributeBuffer(
            json,
            existingUniqueRnBuffers,
            existingUniqueRnBufferViews,
            rnBufferView,
            normalizedAccessor
          );
          const gltf2Accessor = createOrReuseGltf2Accessor(
            json,
            json.bufferViews.indexOf(gltf2BufferView),
            existingUniqueRnAccessors,
            normalizedAccessor
          );

          const accessorIdx = json.accessors.indexOf(gltf2Accessor);
          primitive.attributes[attributeName] = accessorIdx;
        }
        // BlendShape
        setupBlendShapeData(
          entity,
          rnPrimitive,
          primitive,
          json,
          existingUniqueRnBuffers,
          existingUniqueRnBufferViews,
          existingUniqueRnAccessors
        );
        mesh.primitives[j] = primitive;
      }
      json.meshes.push(mesh);
    }
  }
}

/**
 * Creates BufferViews and Accessors for animation data.
 *
 * Processes animation entities to extract keyframe data, creating the necessary
 * glTF2 animation samplers, channels, and associated buffer views and accessors
 * for proper animation playback.
 *
 * @param json - The glTF2 JSON document to populate with animation data
 * @param entities - Animation entities to process
 */
export function __createBufferViewsAndAccessorsOfAnimation(
  json: Gltf2Ex,
  entities: IAnimationEntity[],
  options?: AnimationExportOptions
): void {
  let sumOfBufferViewByteLengthAccumulated = 0;
  const bufferIdx = json.extras.bufferViewByteLengthAccumulatedArray.length;
  const animationRegistry = new Map<AnimationTrackName, { animation: Gltf2Animation; samplerIdx: number }>();

  const acquireAnimation = (trackName: AnimationTrackName) => {
    let entry = animationRegistry.get(trackName);
    if (Is.not.exist(entry)) {
      const animation: Gltf2Animation = {
        name: trackName,
        channels: [],
        samplers: [],
      };
      json.animations.push(animation);
      entry = { animation, samplerIdx: 0 };
      animationRegistry.set(trackName, entry);
    }
    return entry;
  };

  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    const animationComponent = entity.tryToGetAnimation();
    if (Is.exist(animationComponent)) {
      const rnAnimationTrack = animationComponent.getAnimationChannelsOfTrack();
      const rnChannels = rnAnimationTrack.values();
      for (const rnChannel of rnChannels) {
        if (rnChannel.target.pathName === 'effekseer') {
          continue;
        }

        const animatedValue = rnChannel.animatedValue;
        const trackNames = animatedValue.getAllTrackNames();
        for (const trackName of trackNames) {
          const animationEntry = acquireAnimation(trackName);
          const animation = animationEntry.animation;

          const targetOverride = options?.resolveAnimationTarget?.({
            channel: rnChannel,
            entityIdx: i,
            trackName,
          });

          if (targetOverride === null) {
            continue;
          }

          // create and register Gltf2BufferView and Gltf2Accessor
          //   and set Input animation data as Uint8Array to the Gltf2Accessor
          const { inputAccessorIdx, inputBufferViewByteLengthAccumulated } =
            createGltf2BufferViewAndGltf2AccessorForInput(
              json,
              animatedValue.getAnimationSampler(trackName),
              bufferIdx,
              sumOfBufferViewByteLengthAccumulated
            );

          sumOfBufferViewByteLengthAccumulated += inputBufferViewByteLengthAccumulated;

          // create and register Gltf2BufferView and Gltf2Accessor
          //   and set Output animation data as Uint8Array to the Gltf2Accessor
          const { outputAccessorIdx, outputBufferViewByteLengthAccumulated } =
            createGltf2BufferViewAndGltf2AccessorForOutput(
              json,
              animatedValue.getAnimationSampler(trackName),
              rnChannel.target.pathName,
              bufferIdx,
              sumOfBufferViewByteLengthAccumulated
            );
          sumOfBufferViewByteLengthAccumulated += outputBufferViewByteLengthAccumulated;

          // Create Gltf2AnimationChannel
          animationEntry.samplerIdx = createGltf2AnimationChannel(
            rnChannel,
            animationEntry.samplerIdx,
            animation,
            i,
            targetOverride ?? undefined
          );

          // Create Gltf2AnimationSampler
          createGltf2AnimationSampler(
            inputAccessorIdx,
            outputAccessorIdx,
            animatedValue.getAnimationSampler(trackName),
            animation
          );
        }
      }
    }
  }
  json.extras.bufferViewByteLengthAccumulatedArray.push(sumOfBufferViewByteLengthAccumulated);
}

/**
 * Removes empty arrays from the glTF2 JSON to optimize output size.
 *
 * According to glTF2 specification, empty arrays should be omitted rather than
 * included as empty arrays to reduce file size and improve parsing performance.
 *
 * @param json - The glTF2 JSON object to clean up
 */
export function __deleteEmptyArrays(json: Gltf2Ex): void {
  if (json.accessors.length === 0) {
    (json as Gltf2).accessors = undefined;
  }
  if (json.bufferViews.length === 0) {
    (json as Gltf2).bufferViews = undefined;
  }
  if (json.materials.length === 0) {
    (json as Gltf2).materials = undefined;
  }
  if (json.meshes.length === 0) {
    (json as Gltf2).meshes = undefined;
  }
  if (json.skins.length === 0) {
    (json as Gltf2).skins = undefined;
  }
  if (json.textures.length === 0) {
    (json as Gltf2).textures = undefined;
  }
  if (json.images.length === 0) {
    (json as Gltf2).images = undefined;
  }
  if (json.samplers.length === 0) {
    (json as Gltf2).samplers = undefined;
  }
  if (json.animations.length === 0) {
    (json as Gltf2).animations = undefined;
  }
  if (Is.exist(json.extensionsUsed) && json.extensionsUsed.length === 0) {
    (json as Gltf2).extensionsUsed = undefined;
  }
  if (json.cameras.length === 0) {
    (json as Gltf2).cameras = undefined;
  }
  (json as Gltf2).extras = undefined;
}

/**
 * Extracts a scalar parameter value from various input types.
 *
 * Handles extraction of numeric values from different parameter formats,
 * including direct numbers, objects with x property, arrays, typed arrays,
 * and nested internal structures.
 *
 * @param value - The value to extract a scalar from
 * @returns The extracted scalar value or undefined if not found
 */
export function __extractScalarParameter(value: unknown): number | undefined {
  // Early return for null/undefined values
  if (value == null) {
    return undefined;
  }

  if (typeof value === 'number') {
    return value;
  }

  const candidateWithX = (value as { x?: number })?.x;
  if (typeof candidateWithX === 'number') {
    return candidateWithX;
  }

  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'number') {
    return value[0];
  }

  if (ArrayBuffer.isView(value)) {
    const view = value as ArrayBufferView;
    if (isNumericArrayBufferView(view) && view.length > 0) {
      return view[0];
    }
  }

  const internal = (value as { _v?: unknown })._v;
  if (Array.isArray(internal) && internal.length > 0 && typeof internal[0] === 'number') {
    return internal[0];
  }
  if (ArrayBuffer.isView(internal)) {
    const view = internal as ArrayBufferView;
    if (isNumericArrayBufferView(view) && view.length > 0) {
      return view[0];
    }
  }

  return undefined;
}

/**
 * Checks if a glTF2 material requires tangent vectors.
 *
 * Determines if the material uses normal mapping, clearcoat normal mapping,
 * or anisotropy features that require tangent vectors for proper rendering.
 *
 * @param material - The glTF2 material to check
 * @returns True if the material requires tangents, false otherwise
 */
export function __doesMaterialRequireTangents(material: Gltf2MaterialEx): boolean {
  if (Is.exist(material.normalTexture)) {
    return true;
  }
  const extensions = material.extensions as Record<string, any> | undefined;
  const clearcoatExtension = extensions?.KHR_materials_clearcoat as { clearcoatNormalTexture?: unknown } | undefined;
  if (Is.exist(clearcoatExtension?.clearcoatNormalTexture)) {
    return true;
  }
  const anisotropyExtension = extensions?.KHR_materials_anisotropy as {
    anisotropyTexture?: unknown;
    anisotropyStrength?: number;
  };
  if (Is.exist(anisotropyExtension)) {
    if (Is.exist(anisotropyExtension.anisotropyTexture)) {
      return true;
    }
    if (Is.exist(anisotropyExtension.anisotropyStrength) && anisotropyExtension.anisotropyStrength !== 0) {
      return true;
    }
  }
  return false;
}

/**
 * Collects used texture coordinate set indices from a glTF2 material.
 *
 * Scans the material and its extensions to identify which texture coordinate
 * sets (TEXCOORD_0, TEXCOORD_1, etc.) are actually used by textures.
 *
 * @param material - The glTF2 material to analyze
 * @returns Set of used texture coordinate set indices
 */
export function __collectUsedTexCoordSetIndices(material: Gltf2MaterialEx): Set<number> {
  const usedTexCoords = new Set<number>();
  const registerTexcoord = (info: { texCoord?: number; index?: number } | undefined) => {
    if (Is.not.exist(info) || typeof info.index !== 'number') {
      return;
    }
    const texCoord = typeof info.texCoord === 'number' ? info.texCoord : 0;
    usedTexCoords.add(texCoord);
  };

  const pbr = material.pbrMetallicRoughness;
  if (Is.exist(pbr)) {
    registerTexcoord(pbr.baseColorTexture);
    registerTexcoord(pbr.metallicRoughnessTexture);
  }

  registerTexcoord(material.normalTexture);
  registerTexcoord(material.occlusionTexture);
  registerTexcoord(material.emissiveTexture);

  const extensions = material.extensions as Record<string, any> | undefined;
  const clearcoatExtension = extensions?.KHR_materials_clearcoat as {
    clearcoatTexture?: { texCoord?: number; index?: number };
    clearcoatRoughnessTexture?: { texCoord?: number; index?: number };
    clearcoatNormalTexture?: { texCoord?: number; index?: number };
  };
  if (Is.exist(clearcoatExtension)) {
    registerTexcoord(clearcoatExtension.clearcoatTexture);
    registerTexcoord(clearcoatExtension.clearcoatRoughnessTexture);
    registerTexcoord(clearcoatExtension.clearcoatNormalTexture);
  }

  const diffuseTransmissionExtension = extensions?.KHR_materials_diffuse_transmission as {
    diffuseTransmissionTexture?: { texCoord?: number; index?: number };
    diffuseTransmissionColorTexture?: { texCoord?: number; index?: number };
  };
  if (Is.exist(diffuseTransmissionExtension)) {
    registerTexcoord(diffuseTransmissionExtension.diffuseTransmissionTexture);
    registerTexcoord(diffuseTransmissionExtension.diffuseTransmissionColorTexture);
  }

  const specularExtension = extensions?.KHR_materials_specular as {
    specularTexture?: { texCoord?: number; index?: number };
    specularColorTexture?: { texCoord?: number; index?: number };
  };
  if (Is.exist(specularExtension)) {
    registerTexcoord(specularExtension.specularTexture);
    registerTexcoord(specularExtension.specularColorTexture);
  }

  const transmissionExtension = extensions?.KHR_materials_transmission as {
    transmissionTexture?: { texCoord?: number; index?: number };
  };
  if (Is.exist(transmissionExtension)) {
    registerTexcoord(transmissionExtension.transmissionTexture);
  }

  const volumeExtension = extensions?.KHR_materials_volume as {
    thicknessTexture?: { texCoord?: number; index?: number };
  };
  if (Is.exist(volumeExtension)) {
    registerTexcoord(volumeExtension.thicknessTexture);
  }

  const sheenExtension = extensions?.KHR_materials_sheen as {
    sheenColorTexture?: { texCoord?: number; index?: number };
    sheenRoughnessTexture?: { texCoord?: number; index?: number };
  };
  if (Is.exist(sheenExtension)) {
    registerTexcoord(sheenExtension.sheenColorTexture);
    registerTexcoord(sheenExtension.sheenRoughnessTexture);
  }

  const iridescenceExtension = extensions?.KHR_materials_iridescence as {
    iridescenceTexture?: { texCoord?: number; index?: number };
    iridescenceThicknessTexture?: { texCoord?: number; index?: number };
  };
  if (Is.exist(iridescenceExtension)) {
    registerTexcoord(iridescenceExtension.iridescenceTexture);
    registerTexcoord(iridescenceExtension.iridescenceThicknessTexture);
  }

  const anisotropyExtension = extensions?.KHR_materials_anisotropy as {
    anisotropyTexture?: { texCoord?: number; index?: number };
  };
  if (Is.exist(anisotropyExtension)) {
    registerTexcoord(anisotropyExtension.anisotropyTexture);
  }

  return usedTexCoords;
}

/**
 * Prunes unused vertex attributes from a primitive based on material requirements.
 *
 * Removes vertex attributes that are not needed by the material, such as
 * TANGENT if not required, and unused TEXCOORD sets to optimize the output.
 *
 * @param primitive - The glTF2 primitive to prune attributes from
 * @param material - The glTF2 material to check requirements against
 */
export function __pruneUnusedVertexAttributes(primitive: Gltf2Primitive, material: Gltf2MaterialEx): void {
  // Skip pruning for node-based materials as they may require any vertex attributes
  if (material.extensions?.RHODONITE_materials_node != null) {
    return;
  }

  const attributes = primitive.attributes as Record<string, number | undefined>;

  if (!__doesMaterialRequireTangents(material) && Is.exist(attributes.TANGENT)) {
    attributes.TANGENT = undefined;
  }

  const usedTexCoords = __collectUsedTexCoordSetIndices(material);
  if (usedTexCoords.size === 0) {
    for (const attributeName of Object.keys(attributes)) {
      if (attributeName.startsWith('TEXCOORD_')) {
        delete attributes[attributeName];
      }
    }
    return;
  }

  for (const attributeName of Object.keys(attributes)) {
    if (!attributeName.startsWith('TEXCOORD_')) {
      continue;
    }
    const texCoordIndex = Number(attributeName.substring('TEXCOORD_'.length));
    if (Number.isNaN(texCoordIndex) || !usedTexCoords.has(texCoordIndex)) {
      delete attributes[attributeName];
    }
  }
}

export function __outputKhrMaterialsEmissiveStrengthInfo(
  ensureExtensionUsed: (extensionName: string) => void,
  coerceNumber: (value: any) => number | undefined,
  rnMaterial: Material,
  material: Gltf2MaterialEx
) {
  if (Is.false(rnMaterial.isLighting)) {
    return;
  }

  if ((material.extensions as Record<string, unknown> | undefined)?.KHR_materials_unlit) {
    return;
  }

  const rawStrength = coerceNumber(rnMaterial.getParameter('emissiveStrength'));
  if (Is.not.exist(rawStrength)) {
    return;
  }

  const emissiveStrength = Math.max(0, rawStrength);
  if (!Number.isFinite(emissiveStrength) || emissiveStrength === 1) {
    return;
  }

  material.extensions = material.extensions ?? {};
  material.extensions.KHR_materials_emissive_strength = {
    emissiveStrength,
  };
  ensureExtensionUsed('KHR_materials_emissive_strength');
}

export function __outputKhrMaterialsDiffuseTransmissionInfo(
  ensureExtensionUsed: (extensionName: string) => void,
  coerceNumber: (value: any) => number | undefined,
  coerceVec3: (value: any) => [number, number, number] | undefined,
  rnMaterial: Material,
  applyTexture: (
    paramName: string,
    options: {
      texCoordParam?: string;
      transform?: {
        scale?: string;
        offset?: string;
        rotation?: string;
      };
      scaleParam?: string;
      strengthParam?: string;
      onAssign: (info: any) => void;
    }
  ) => void,
  material: Gltf2MaterialEx
) {
  const diffuseTransmissionExtension: Record<string, unknown> = {};
  let diffuseTransmissionExtensionUsed = false;
  const markDiffuseTransmissionExtensionUsed = () => {
    if (!diffuseTransmissionExtensionUsed) {
      diffuseTransmissionExtensionUsed = true;
      ensureExtensionUsed('KHR_materials_diffuse_transmission');
    }
  };

  const diffuseTransmissionFactor = coerceNumber(rnMaterial.getParameter('diffuseTransmissionFactor'));
  if (Is.exist(diffuseTransmissionFactor)) {
    diffuseTransmissionExtension.diffuseTransmissionFactor = diffuseTransmissionFactor;
    if (diffuseTransmissionFactor !== 0) {
      markDiffuseTransmissionExtensionUsed();
    }
  }

  applyTexture('diffuseTransmissionTexture', {
    texCoordParam: 'diffuseTransmissionTexcoordIndex',
    transform: {
      scale: 'diffuseTransmissionTextureTransformScale',
      offset: 'diffuseTransmissionTextureTransformOffset',
      rotation: 'diffuseTransmissionTextureTransformRotation',
    },
    onAssign: info => {
      diffuseTransmissionExtension.diffuseTransmissionTexture = info;
      markDiffuseTransmissionExtensionUsed();
    },
  });

  const diffuseTransmissionColorFactor = coerceVec3(rnMaterial.getParameter('diffuseTransmissionColorFactor'));
  if (Is.exist(diffuseTransmissionColorFactor)) {
    diffuseTransmissionExtension.diffuseTransmissionColorFactor = diffuseTransmissionColorFactor;
    if (
      diffuseTransmissionColorFactor[0] !== 1 ||
      diffuseTransmissionColorFactor[1] !== 1 ||
      diffuseTransmissionColorFactor[2] !== 1
    ) {
      markDiffuseTransmissionExtensionUsed();
    }
  }

  applyTexture('diffuseTransmissionColorTexture', {
    texCoordParam: 'diffuseTransmissionColorTexcoordIndex',
    transform: {
      scale: 'diffuseTransmissionColorTextureTransformScale',
      offset: 'diffuseTransmissionColorTextureTransformOffset',
      rotation: 'diffuseTransmissionColorTextureTransformRotation',
    },
    onAssign: info => {
      diffuseTransmissionExtension.diffuseTransmissionColorTexture = info;
      markDiffuseTransmissionExtensionUsed();
    },
  });

  const shouldAttachDiffuseTransmissionExtension =
    diffuseTransmissionExtensionUsed ||
    Is.exist(diffuseTransmissionExtension.diffuseTransmissionTexture) ||
    Is.exist(diffuseTransmissionExtension.diffuseTransmissionColorTexture);

  if (shouldAttachDiffuseTransmissionExtension) {
    material.extensions = material.extensions ?? {};
    material.extensions.KHR_materials_diffuse_transmission = diffuseTransmissionExtension;
    ensureExtensionUsed('KHR_materials_diffuse_transmission');
  }
}

export function __outputKhrMaterialsTransmissionInfo(
  ensureExtensionUsed: (extensionName: string) => void,
  coerceNumber: (value: any) => number | undefined,
  rnMaterial: Material,
  applyTexture: (
    paramName: string,
    options: {
      texCoordParam?: string;
      transform?: {
        scale?: string;
        offset?: string;
        rotation?: string;
      };
      scaleParam?: string;
      strengthParam?: string;
      onAssign: (info: any) => void;
    }
  ) => void,
  material: Gltf2MaterialEx
) {
  const transmissionExtension: Record<string, unknown> = {};
  let transmissionExtensionUsed = false;
  const markTransmissionExtensionUsed = () => {
    if (!transmissionExtensionUsed) {
      transmissionExtensionUsed = true;
      ensureExtensionUsed('KHR_materials_transmission');
    }
  };

  const transmissionFactor = coerceNumber(rnMaterial.getParameter('transmissionFactor'));
  if (Is.exist(transmissionFactor)) {
    transmissionExtension.transmissionFactor = transmissionFactor;
    if (transmissionFactor !== 0) {
      markTransmissionExtensionUsed();
    }
  }

  applyTexture('transmissionTexture', {
    texCoordParam: 'transmissionTexcoordIndex',
    transform: {
      scale: 'transmissionTextureTransformScale',
      offset: 'transmissionTextureTransformOffset',
      rotation: 'transmissionTextureTransformRotation',
    },
    onAssign: info => {
      transmissionExtension.transmissionTexture = info;
      markTransmissionExtensionUsed();
    },
  });

  const shouldAttachTransmissionExtension =
    transmissionExtensionUsed || Is.exist(transmissionExtension.transmissionTexture);
  if (shouldAttachTransmissionExtension) {
    material.extensions = material.extensions ?? {};
    material.extensions.KHR_materials_transmission = transmissionExtension;
    ensureExtensionUsed('KHR_materials_transmission');
  }
}

export function __outputKhrMaterialsVolumeInfo(
  ensureExtensionUsed: (extensionName: string) => void,
  coerceNumber: (value: any) => number | undefined,
  coerceVec3: (value: any) => [number, number, number] | undefined,
  rnMaterial: Material,
  applyTexture: (
    paramName: string,
    options: {
      texCoordParam?: string;
      transform?: {
        scale?: string;
        offset?: string;
        rotation?: string;
      };
      scaleParam?: string;
      strengthParam?: string;
      onAssign: (info: any) => void;
    }
  ) => void,
  material: Gltf2MaterialEx
) {
  const volumeExtension: Record<string, unknown> = {};
  let volumeExtensionUsed = false;
  const markVolumeExtensionUsed = () => {
    if (!volumeExtensionUsed) {
      volumeExtensionUsed = true;
      ensureExtensionUsed('KHR_materials_volume');
    }
  };

  const thicknessFactor = coerceNumber(rnMaterial.getParameter('thicknessFactor'));
  if (Is.exist(thicknessFactor)) {
    volumeExtension.thicknessFactor = thicknessFactor;
    if (thicknessFactor !== 0) {
      markVolumeExtensionUsed();
    }
  }

  applyTexture('thicknessTexture', {
    texCoordParam: 'thicknessTexcoordIndex',
    transform: {
      scale: 'thicknessTextureTransformScale',
      offset: 'thicknessTextureTransformOffset',
      rotation: 'thicknessTextureTransformRotation',
    },
    onAssign: info => {
      volumeExtension.thicknessTexture = info;
      markVolumeExtensionUsed();
    },
  });

  const attenuationDistance = coerceNumber(rnMaterial.getParameter('attenuationDistance'));
  if (Is.exist(attenuationDistance) && attenuationDistance > 0) {
    volumeExtension.attenuationDistance = attenuationDistance;
    markVolumeExtensionUsed();
  }

  const attenuationColor = coerceVec3(rnMaterial.getParameter('attenuationColor'));
  if (Is.exist(attenuationColor)) {
    volumeExtension.attenuationColor = attenuationColor;
    if (attenuationColor.some(v => v !== 1)) {
      markVolumeExtensionUsed();
    }
  }

  const shouldAttachVolumeExtension =
    volumeExtensionUsed ||
    Is.exist(volumeExtension.thicknessTexture) ||
    (Is.exist(volumeExtension.thicknessFactor) && (volumeExtension.thicknessFactor as number) !== 0) ||
    (Is.exist(volumeExtension.attenuationDistance) && (volumeExtension.attenuationDistance as number) !== 0) ||
    (Is.exist(volumeExtension.attenuationColor) &&
      (volumeExtension.attenuationColor as [number, number, number]).some(v => v !== 1));
  if (shouldAttachVolumeExtension) {
    material.extensions = material.extensions ?? {};
    material.extensions.KHR_materials_volume = volumeExtension;
    ensureExtensionUsed('KHR_materials_volume');
  }
}

export function __outputKhrMaterialsIorInfo(
  ensureExtensionUsed: (extensionName: string) => void,
  coerceNumber: (value: any) => number | undefined,
  rnMaterial: Material,
  material: Gltf2MaterialEx
) {
  const rawIor = coerceNumber(rnMaterial.getParameter('ior'));
  if (Is.not.exist(rawIor)) {
    return;
  }

  const clampedIor = Math.max(1.0, rawIor);
  const defaultIor = 1.5;
  if (Math.abs(clampedIor - defaultIor) < 1e-6) {
    return;
  }

  material.extensions = material.extensions ?? {};
  material.extensions.KHR_materials_ior = {
    ior: clampedIor,
  };
  ensureExtensionUsed('KHR_materials_ior');
}

export function __outputKhrMaterialsClearcoatInfo(
  ensureExtensionUsed: (extensionName: string) => void,
  coerceNumber: (value: any) => number | undefined,
  rnMaterial: Material,
  applyTexture: (
    paramName: string,
    options: {
      texCoordParam?: string;
      transform?: {
        scale?: string;
        offset?: string;
        rotation?: string;
      };
      scaleParam?: string;
      strengthParam?: string;
      onAssign: (info: any) => void;
    }
  ) => void,
  material: Gltf2MaterialEx
) {
  const clearcoatExtension: Record<string, unknown> = {};
  let clearcoatExtensionUsed = false;
  const markClearcoatExtensionUsed = () => {
    if (!clearcoatExtensionUsed) {
      clearcoatExtensionUsed = true;
      ensureExtensionUsed('KHR_materials_clearcoat');
    }
  };

  const clearcoatFactor = coerceNumber(rnMaterial.getParameter('clearcoatFactor'));
  if (Is.exist(clearcoatFactor)) {
    clearcoatExtension.clearcoatFactor = clearcoatFactor;
    if (clearcoatFactor !== 0) {
      markClearcoatExtensionUsed();
    }
  }

  const clearcoatRoughnessFactor = coerceNumber(rnMaterial.getParameter('clearcoatRoughnessFactor'));
  if (Is.exist(clearcoatRoughnessFactor)) {
    clearcoatExtension.clearcoatRoughnessFactor = clearcoatRoughnessFactor;
    if (clearcoatRoughnessFactor !== 0) {
      markClearcoatExtensionUsed();
    }
  }

  applyTexture('clearcoatTexture', {
    texCoordParam: 'clearcoatTexcoordIndex',
    transform: {
      scale: 'clearcoatTextureTransformScale',
      offset: 'clearcoatTextureTransformOffset',
      rotation: 'clearcoatTextureTransformRotation',
    },
    onAssign: info => {
      clearcoatExtension.clearcoatTexture = info;
      markClearcoatExtensionUsed();
    },
  });

  applyTexture('clearcoatRoughnessTexture', {
    texCoordParam: 'clearcoatRoughnessTexcoordIndex',
    transform: {
      scale: 'clearcoatRoughnessTextureTransformScale',
      offset: 'clearcoatRoughnessTextureTransformOffset',
      rotation: 'clearcoatRoughnessTextureTransformRotation',
    },
    onAssign: info => {
      clearcoatExtension.clearcoatRoughnessTexture = info;
      markClearcoatExtensionUsed();
    },
  });

  applyTexture('clearcoatNormalTexture', {
    texCoordParam: 'clearcoatNormalTexcoordIndex',
    transform: {
      scale: 'clearcoatNormalTextureTransformScale',
      offset: 'clearcoatNormalTextureTransformOffset',
      rotation: 'clearcoatNormalTextureTransformRotation',
    },
    onAssign: info => {
      const clearcoatNormalScale =
        coerceNumber(rnMaterial.getParameter('clearcoatNormalScale')) ??
        coerceNumber(rnMaterial.getParameter('clearcoatNormalTextureScale'));
      if (Is.exist(clearcoatNormalScale)) {
        info.scale = clearcoatNormalScale;
      }
      clearcoatExtension.clearcoatNormalTexture = info;
      markClearcoatExtensionUsed();
    },
  });

  const shouldAttachClearcoatExtension =
    clearcoatExtensionUsed ||
    Is.exist(clearcoatExtension.clearcoatTexture) ||
    Is.exist(clearcoatExtension.clearcoatRoughnessTexture) ||
    Is.exist(clearcoatExtension.clearcoatNormalTexture);
  if (shouldAttachClearcoatExtension) {
    material.extensions = material.extensions ?? {};
    material.extensions.KHR_materials_clearcoat = clearcoatExtension;
    ensureExtensionUsed('KHR_materials_clearcoat');
  }
}

export function __outputKhrMaterialsSheenInfo(
  ensureExtensionUsed: (extensionName: string) => void,
  coerceNumber: (value: any) => number | undefined,
  coerceVec3: (value: any) => [number, number, number] | undefined,
  rnMaterial: Material,
  applyTexture: (
    paramName: string,
    options: {
      texCoordParam?: string;
      transform?: {
        scale?: string;
        offset?: string;
        rotation?: string;
      };
      scaleParam?: string;
      strengthParam?: string;
      onAssign: (info: any) => void;
    }
  ) => void,
  material: Gltf2MaterialEx
) {
  const sheenExtension: Record<string, unknown> = {};
  let sheenExtensionUsed = false;
  const markSheenExtensionUsed = () => {
    if (!sheenExtensionUsed) {
      sheenExtensionUsed = true;
      ensureExtensionUsed('KHR_materials_sheen');
    }
  };

  const sheenColorFactor = coerceVec3(rnMaterial.getParameter('sheenColorFactor'));
  if (Is.exist(sheenColorFactor)) {
    sheenExtension.sheenColorFactor = sheenColorFactor;
    if (sheenColorFactor.some(v => v !== 0)) {
      markSheenExtensionUsed();
    }
  }

  const sheenRoughnessFactor = coerceNumber(rnMaterial.getParameter('sheenRoughnessFactor'));
  if (Is.exist(sheenRoughnessFactor)) {
    sheenExtension.sheenRoughnessFactor = sheenRoughnessFactor;
    if (sheenRoughnessFactor !== 0) {
      markSheenExtensionUsed();
    }
  }

  applyTexture('sheenColorTexture', {
    texCoordParam: 'sheenColorTexcoordIndex',
    transform: {
      scale: 'sheenColorTextureTransformScale',
      offset: 'sheenColorTextureTransformOffset',
      rotation: 'sheenColorTextureTransformRotation',
    },
    onAssign: info => {
      sheenExtension.sheenColorTexture = info;
      markSheenExtensionUsed();
    },
  });

  applyTexture('sheenRoughnessTexture', {
    texCoordParam: 'sheenRoughnessTexcoordIndex',
    transform: {
      scale: 'sheenRoughnessTextureTransformScale',
      offset: 'sheenRoughnessTextureTransformOffset',
      rotation: 'sheenRoughnessTextureTransformRotation',
    },
    onAssign: info => {
      sheenExtension.sheenRoughnessTexture = info;
      markSheenExtensionUsed();
    },
  });

  const shouldAttachSheenExtension =
    sheenExtensionUsed || Is.exist(sheenExtension.sheenColorTexture) || Is.exist(sheenExtension.sheenRoughnessTexture);
  if (shouldAttachSheenExtension) {
    material.extensions = material.extensions ?? {};
    material.extensions.KHR_materials_sheen = sheenExtension;
    ensureExtensionUsed('KHR_materials_sheen');
  }
}

export function __outputKhrMaterialsSpecularInfo(
  ensureExtensionUsed: (extensionName: string) => void,
  coerceNumber: (value: any) => number | undefined,
  coerceVec3: (value: any) => [number, number, number] | undefined,
  rnMaterial: Material,
  applyTexture: (
    paramName: string,
    options: {
      texCoordParam?: string;
      transform?: {
        scale?: string;
        offset?: string;
        rotation?: string;
      };
      scaleParam?: string;
      strengthParam?: string;
      onAssign: (info: any) => void;
    }
  ) => void,
  material: Gltf2MaterialEx
) {
  const specularExtension: Record<string, unknown> = {};
  let specularExtensionUsed = false;
  const markSpecularExtensionUsed = () => {
    if (!specularExtensionUsed) {
      specularExtensionUsed = true;
      ensureExtensionUsed('KHR_materials_specular');
    }
  };

  const specularFactor = coerceNumber(rnMaterial.getParameter('specularFactor'));
  if (Is.exist(specularFactor) && specularFactor !== 1) {
    specularExtension.specularFactor = specularFactor;
    markSpecularExtensionUsed();
  }

  const specularColorFactor = coerceVec3(rnMaterial.getParameter('specularColorFactor'));
  if (Is.exist(specularColorFactor) && specularColorFactor.some(v => v !== 1)) {
    specularExtension.specularColorFactor = specularColorFactor;
    markSpecularExtensionUsed();
  }

  applyTexture('specularTexture', {
    texCoordParam: 'specularTexcoordIndex',
    transform: {
      scale: 'specularTextureTransformScale',
      offset: 'specularTextureTransformOffset',
      rotation: 'specularTextureTransformRotation',
    },
    onAssign: info => {
      specularExtension.specularTexture = info;
      markSpecularExtensionUsed();
    },
  });

  applyTexture('specularColorTexture', {
    texCoordParam: 'specularColorTexcoordIndex',
    transform: {
      scale: 'specularColorTextureTransformScale',
      offset: 'specularColorTextureTransformOffset',
      rotation: 'specularColorTextureTransformRotation',
    },
    onAssign: info => {
      specularExtension.specularColorTexture = info;
      markSpecularExtensionUsed();
    },
  });

  const shouldAttachSpecularExtension =
    specularExtensionUsed ||
    Is.exist(specularExtension.specularTexture) ||
    Is.exist(specularExtension.specularColorTexture) ||
    Is.exist(specularExtension.specularFactor) ||
    Is.exist(specularExtension.specularColorFactor);
  if (shouldAttachSpecularExtension) {
    material.extensions = material.extensions ?? {};
    material.extensions.KHR_materials_specular = specularExtension;
    ensureExtensionUsed('KHR_materials_specular');
  }
}

export function __outputKhrMaterialsIridescenceInfo(
  ensureExtensionUsed: (extensionName: string) => void,
  coerceNumber: (value: any) => number | undefined,
  rnMaterial: Material,
  applyTexture: (
    paramName: string,
    options: {
      texCoordParam?: string;
      transform?: {
        scale?: string;
        offset?: string;
        rotation?: string;
      };
      scaleParam?: string;
      strengthParam?: string;
      onAssign: (info: any) => void;
    }
  ) => void,
  material: Gltf2MaterialEx
) {
  const iridescenceExtension: Record<string, unknown> = {};
  let iridescenceExtensionUsed = false;
  const markIridescenceExtensionUsed = () => {
    if (!iridescenceExtensionUsed) {
      iridescenceExtensionUsed = true;
      ensureExtensionUsed('KHR_materials_iridescence');
    }
  };

  const defaultFactor = 0.0;
  const factor = coerceNumber(rnMaterial.getParameter('iridescenceFactor'));
  if (Is.exist(factor)) {
    iridescenceExtension.iridescenceFactor = factor;
    if (Math.abs(factor - defaultFactor) > 1e-6) {
      markIridescenceExtensionUsed();
    }
  }

  applyTexture('iridescenceTexture', {
    texCoordParam: 'iridescenceTexcoordIndex',
    transform: {
      scale: 'iridescenceTextureTransformScale',
      offset: 'iridescenceTextureTransformOffset',
      rotation: 'iridescenceTextureTransformRotation',
    },
    onAssign: info => {
      iridescenceExtension.iridescenceTexture = info;
      markIridescenceExtensionUsed();
    },
  });

  const defaultIor = 1.3;
  const rawIor = coerceNumber(rnMaterial.getParameter('iridescenceIor'));
  if (Is.exist(rawIor)) {
    const clampedIor = Math.max(1.0, rawIor);
    iridescenceExtension.iridescenceIor = clampedIor;
    if (Math.abs(clampedIor - defaultIor) > 1e-6) {
      markIridescenceExtensionUsed();
    }
  }

  const defaultThicknessMinimum = 100.0;
  const thicknessMinimum = coerceNumber(rnMaterial.getParameter('iridescenceThicknessMinimum'));
  if (Is.exist(thicknessMinimum)) {
    iridescenceExtension.iridescenceThicknessMinimum = thicknessMinimum;
    if (Math.abs(thicknessMinimum - defaultThicknessMinimum) > 1e-6) {
      markIridescenceExtensionUsed();
    }
  }

  const defaultThicknessMaximum = 400.0;
  const thicknessMaximum = coerceNumber(rnMaterial.getParameter('iridescenceThicknessMaximum'));
  if (Is.exist(thicknessMaximum)) {
    iridescenceExtension.iridescenceThicknessMaximum = thicknessMaximum;
    if (Math.abs(thicknessMaximum - defaultThicknessMaximum) > 1e-6) {
      markIridescenceExtensionUsed();
    }
  }

  applyTexture('iridescenceThicknessTexture', {
    texCoordParam: 'iridescenceThicknessTexcoordIndex',
    transform: {
      scale: 'iridescenceThicknessTextureTransformScale',
      offset: 'iridescenceThicknessTextureTransformOffset',
      rotation: 'iridescenceThicknessTextureTransformRotation',
    },
    onAssign: info => {
      iridescenceExtension.iridescenceThicknessTexture = info;
      markIridescenceExtensionUsed();
    },
  });

  const shouldAttachIridescenceExtension =
    iridescenceExtensionUsed ||
    Is.exist(iridescenceExtension.iridescenceTexture) ||
    Is.exist(iridescenceExtension.iridescenceThicknessTexture);
  if (shouldAttachIridescenceExtension) {
    material.extensions = material.extensions ?? {};
    material.extensions.KHR_materials_iridescence = iridescenceExtension;
    ensureExtensionUsed('KHR_materials_iridescence');
  }
}

export function __outputKhrMaterialsAnisotropyInfo(
  ensureExtensionUsed: (extensionName: string) => void,
  coerceNumber: (value: any) => number | undefined,
  coerceVec2: (value: any) => [number, number] | undefined,
  rnMaterial: Material,
  applyTexture: (
    paramName: string,
    options: {
      texCoordParam?: string;
      transform?: {
        scale?: string;
        offset?: string;
        rotation?: string;
      };
      scaleParam?: string;
      strengthParam?: string;
      onAssign: (info: any) => void;
    }
  ) => void,
  material: Gltf2MaterialEx
) {
  const anisotropyExtension: Record<string, unknown> = {};
  let anisotropyExtensionUsed = false;
  const markAnisotropyExtensionUsed = () => {
    if (!anisotropyExtensionUsed) {
      anisotropyExtensionUsed = true;
      ensureExtensionUsed('KHR_materials_anisotropy');
    }
  };

  const anisotropyStrength = coerceNumber(rnMaterial.getParameter('anisotropyStrength'));
  if (Is.exist(anisotropyStrength)) {
    anisotropyExtension.anisotropyStrength = anisotropyStrength;
    if (anisotropyStrength !== 0) {
      markAnisotropyExtensionUsed();
    }
  }

  const anisotropyRotationVector = coerceVec2(rnMaterial.getParameter('anisotropyRotation'));
  if (Is.exist(anisotropyRotationVector)) {
    const [x, y] = anisotropyRotationVector;
    const rotation = Math.atan2(y, x);
    if (Number.isFinite(rotation)) {
      anisotropyExtension.anisotropyRotation = rotation;
      if (rotation !== 0) {
        markAnisotropyExtensionUsed();
      }
    }
  }

  applyTexture('anisotropyTexture', {
    texCoordParam: 'anisotropyTexcoordIndex',
    transform: {
      scale: 'anisotropyTextureTransformScale',
      offset: 'anisotropyTextureTransformOffset',
      rotation: 'anisotropyTextureTransformRotation',
    },
    onAssign: info => {
      anisotropyExtension.anisotropyTexture = info;
      markAnisotropyExtensionUsed();
    },
  });

  const shouldAttachAnisotropyExtension =
    anisotropyExtensionUsed ||
    Is.exist(anisotropyExtension.anisotropyTexture) ||
    (Is.exist(anisotropyExtension.anisotropyStrength) && (anisotropyExtension.anisotropyStrength as number) !== 0) ||
    (Is.exist(anisotropyExtension.anisotropyRotation) && (anisotropyExtension.anisotropyRotation as number) !== 0);
  if (shouldAttachAnisotropyExtension) {
    material.extensions = material.extensions ?? {};
    material.extensions.KHR_materials_anisotropy = anisotropyExtension;
    ensureExtensionUsed('KHR_materials_anisotropy');
  }
}

export function __outputKhrMaterialsDispersionInfo(
  ensureExtensionUsed: (extensionName: string) => void,
  coerceNumber: (value: any) => number | undefined,
  rnMaterial: Material,
  material: Gltf2MaterialEx
) {
  const rawDispersion = coerceNumber(rnMaterial.getParameter('dispersion'));
  if (Is.not.exist(rawDispersion)) {
    return;
  }

  const dispersion = Math.max(0, rawDispersion);
  if (!Number.isFinite(dispersion) || dispersion === 0) {
    return;
  }

  material.extensions = material.extensions ?? {};
  material.extensions.KHR_materials_dispersion = {
    dispersion,
  };
  ensureExtensionUsed('KHR_materials_dispersion');

  if (Is.not.exist(material.extensions.KHR_materials_volume)) {
    material.extensions.KHR_materials_volume = {};
  }
  ensureExtensionUsed('KHR_materials_volume');
}

export function __removeUnusedAccessorsAndBufferViews(json: Gltf2Ex) {
  if (json.accessors.length === 0) {
    __recalculateBufferViewAccumulators(json);
    return;
  }

  __removeUnusedAccessors(json);

  if (json.bufferViews.length === 0) {
    __recalculateBufferViewAccumulators(json);
    return;
  }

  __removeUnusedBufferViews(json);
  __recalculateBufferViewAccumulators(json);
}

export function __removeUnusedAccessors(json: Gltf2Ex) {
  const usedAccessorIndices = __collectUsedAccessorIndices(json);
  const result = __filterItemsByUsage(json.accessors, usedAccessorIndices);
  if (!result) {
    return;
  }

  const { filtered, indexMap } = result;
  json.accessors = filtered;
  __remapAccessorReferences(json, indexMap);
}

export function __collectUsedAccessorIndices(json: Gltf2Ex) {
  const usedAccessorIndices = new Set<number>();
  const registerAccessor = (candidate: unknown) => {
    if (typeof candidate === 'number' && candidate >= 0) {
      usedAccessorIndices.add(candidate);
    }
  };

  __collectAccessorIndicesFromMeshes(json, registerAccessor);
  __collectAccessorIndicesFromSkins(json, registerAccessor);
  __collectAccessorIndicesFromAnimations(json, registerAccessor);

  return usedAccessorIndices;
}

export function __collectAccessorIndicesFromMeshes(json: Gltf2Ex, register: (candidate: unknown) => void) {
  if (Is.not.exist(json.meshes)) {
    return;
  }
  for (const mesh of json.meshes) {
    if (Is.not.exist(mesh?.primitives)) {
      continue;
    }
    for (const primitive of mesh.primitives) {
      register(primitive.indices);
      const attributes = primitive.attributes as Record<string, number | undefined> | undefined;
      if (Is.exist(attributes)) {
        for (const key of Object.keys(attributes)) {
          register(attributes[key]);
        }
      }
      if (Array.isArray(primitive.targets)) {
        for (const target of primitive.targets) {
          const targetAttributes = target as Record<string, number | undefined>;
          for (const key of Object.keys(targetAttributes)) {
            register(targetAttributes[key]);
          }
        }
      }
    }
  }
}

export function __collectAccessorIndicesFromSkins(json: Gltf2Ex, register: (candidate: unknown) => void) {
  if (Is.not.exist(json.skins)) {
    return;
  }
  for (const skin of json.skins) {
    register(skin.inverseBindMatrices);
  }
}

export function __collectAccessorIndicesFromAnimations(json: Gltf2Ex, register: (candidate: unknown) => void) {
  if (Is.not.exist(json.animations)) {
    return;
  }
  for (const animation of json.animations) {
    if (Is.not.exist(animation?.samplers)) {
      continue;
    }
    for (const sampler of animation.samplers) {
      register(sampler.input);
      register(sampler.output);
    }
  }
}

export function __remapAccessorReferences(json: Gltf2Ex, indexMap: Map<number, number>) {
  const mapAccessorIndex = (candidate: unknown): number | undefined => {
    if (typeof candidate !== 'number') {
      return undefined;
    }
    return indexMap.get(candidate);
  };

  if (Is.exist(json.meshes)) {
    for (const mesh of json.meshes) {
      if (Is.not.exist(mesh?.primitives)) {
        continue;
      }
      for (const primitive of mesh.primitives) {
        if (typeof primitive.indices === 'number') {
          const mapped = mapAccessorIndex(primitive.indices);
          primitive.indices = typeof mapped === 'number' ? mapped : undefined;
        }
        const attributes = primitive.attributes as Record<string, number | undefined> | undefined;
        __remapAccessorAttributeRecord(attributes, mapAccessorIndex);
        if (Array.isArray(primitive.targets)) {
          for (const target of primitive.targets) {
            __remapAccessorAttributeRecord(target as Record<string, number | undefined>, mapAccessorIndex);
          }
        }
      }
    }
  }

  if (Is.exist(json.skins)) {
    for (const skin of json.skins) {
      if (typeof skin.inverseBindMatrices === 'number') {
        const mapped = mapAccessorIndex(skin.inverseBindMatrices);
        skin.inverseBindMatrices = typeof mapped === 'number' ? mapped : undefined;
      }
    }
  }

  if (Is.exist(json.animations)) {
    for (const animation of json.animations) {
      if (Is.not.exist(animation?.samplers)) {
        continue;
      }
      for (const sampler of animation.samplers) {
        const mappedInput = mapAccessorIndex(sampler.input);
        const mappedOutput = mapAccessorIndex(sampler.output);
        if (typeof mappedInput === 'number') {
          sampler.input = mappedInput;
        }
        if (typeof mappedOutput === 'number') {
          sampler.output = mappedOutput;
        }
      }
    }
  }
}

export function __remapAccessorAttributeRecord(
  attributes: Record<string, number | undefined> | undefined,
  mapAccessorIndex: (candidate: unknown) => number | undefined
) {
  if (Is.not.exist(attributes)) {
    return;
  }
  for (const key of Object.keys(attributes)) {
    const mapped = mapAccessorIndex(attributes[key]);
    if (typeof mapped === 'number') {
      attributes[key] = mapped;
    } else {
      delete attributes[key];
    }
  }
}

export function __removeUnusedBufferViews(json: Gltf2Ex) {
  const usedBufferViewIndices = __collectUsedBufferViewIndices(json);
  const result = __filterItemsByUsage(json.bufferViews, usedBufferViewIndices);
  if (!result) {
    return;
  }

  const { filtered, indexMap } = result;
  json.bufferViews = filtered;
  __remapBufferViewReferences(json, indexMap);
}

export function __collectUsedBufferViewIndices(json: Gltf2Ex) {
  const usedBufferViewIndices = new Set<number>();
  for (const accessor of json.accessors) {
    if (typeof accessor.bufferView === 'number') {
      usedBufferViewIndices.add(accessor.bufferView);
    }
  }
  if (Is.exist(json.images)) {
    for (const image of json.images) {
      if (typeof image.bufferView === 'number') {
        usedBufferViewIndices.add(image.bufferView);
      }
    }
  }
  return usedBufferViewIndices;
}

export function __remapBufferViewReferences(json: Gltf2Ex, indexMap: Map<number, number>) {
  for (const accessor of json.accessors) {
    if (typeof accessor.bufferView === 'number') {
      const mapped = indexMap.get(accessor.bufferView);
      accessor.bufferView = typeof mapped === 'number' ? mapped : undefined;
    }
  }

  if (Is.exist(json.images)) {
    for (const image of json.images) {
      if (typeof image.bufferView === 'number') {
        const mapped = indexMap.get(image.bufferView);
        image.bufferView = typeof mapped === 'number' ? mapped : undefined;
      }
    }
  }
}

export function __filterItemsByUsage<T>(
  items: T[],
  usedIndices: Set<number>
): { filtered: T[]; indexMap: Map<number, number> } | undefined {
  if (usedIndices.size === items.length) {
    return undefined;
  }

  const filtered: T[] = [];
  const indexMap = new Map<number, number>();
  items.forEach((item, idx) => {
    if (usedIndices.has(idx)) {
      indexMap.set(idx, filtered.length);
      filtered.push(item);
    }
  });

  return { filtered, indexMap };
}

export function __recalculateBufferViewAccumulators(json: Gltf2Ex) {
  if (Is.not.exist(json.buffers) || json.buffers.length === 0) {
    json.extras.bufferViewByteLengthAccumulatedArray = [];
    return;
  }

  const accumulators = new Array(json.buffers.length).fill(0);
  for (const bufferView of json.bufferViews) {
    const bufferIdx = typeof bufferView.buffer === 'number' ? bufferView.buffer : 0;
    const sourceLength = bufferView.extras?.uint8Array?.byteLength;
    const effectiveLength = Math.max(bufferView.byteLength, Is.exist(sourceLength) ? sourceLength! : 0);
    const alignedLength = DataUtil.addPaddingBytes(effectiveLength, 4);
    accumulators[bufferIdx] += alignedLength;
  }
  json.extras.bufferViewByteLengthAccumulatedArray = accumulators;
}

export function __setupMaterialBasicProperties(material: Gltf2MaterialEx, rnMaterial: Material, json: Gltf2Ex) {
  const isUnlitMaterial = Is.false(rnMaterial.isLighting);

  if (isUnlitMaterial) {
    if (Is.not.exist(material.extensions)) {
      material.extensions = {};
    }
    material.extensions.KHR_materials_unlit = {};
    if (json.extensionsUsed.indexOf('KHR_materials_unlit') < 0) {
      json.extensionsUsed.push('KHR_materials_unlit');
    }
  }

  const baseColorParam =
    (rnMaterial.getParameter('baseColorFactor') as Vector4 | undefined) ??
    (rnMaterial.getParameter('diffuseColorFactor') as Vector4 | undefined) ??
    Vector4.fromCopy4(1, 1, 1, 1);
  material.pbrMetallicRoughness.baseColorFactor = [
    baseColorParam.x,
    baseColorParam.y,
    baseColorParam.z,
    baseColorParam.w,
  ];

  const metallicValue = __extractScalarParameter(rnMaterial.getParameter('metallicFactor'));
  if (Is.exist(metallicValue)) {
    material.pbrMetallicRoughness.metallicFactor = metallicValue as number;
  }

  const roughnessValue = __extractScalarParameter(rnMaterial.getParameter('roughnessFactor'));
  if (Is.exist(roughnessValue)) {
    material.pbrMetallicRoughness.roughnessFactor = roughnessValue as number;
  }

  const emissiveParam = rnMaterial.getParameter('emissiveFactor') as Vector3 | undefined;
  if (Is.exist(emissiveParam)) {
    material.emissiveFactor = [emissiveParam.x, emissiveParam.y, emissiveParam.z];
  }

  material.alphaMode = rnMaterial.alphaMode.toGltfString();

  if (isUnlitMaterial) {
    material.pbrMetallicRoughness.metallicFactor = 0;
    const currentRoughness = material.pbrMetallicRoughness.roughnessFactor ?? 1;
    material.pbrMetallicRoughness.roughnessFactor = Math.max(currentRoughness, 0.5);
    material.emissiveFactor = [0, 0, 0];
  }
}

export function __outputBaseMaterialInfo(
  rnMaterial: Material,
  applyTexture: (
    paramName: string,
    options: {
      texCoordParam?: string;
      transform?: {
        scale?: string;
        offset?: string;
        rotation?: string;
      };
      scaleParam?: string;
      strengthParam?: string;
      onAssign: (info: any) => void;
    }
  ) => void,
  material: Gltf2MaterialEx,
  json: Gltf2Ex,
  options?: {
    skipAdditionalTextures?: boolean;
  }
) {
  const skipAdditionalTextures = options?.skipAdditionalTextures ?? false;

  __setupMaterialBasicProperties(material, rnMaterial, json);

  const hasBaseColorTexture = Is.exist(rnMaterial.getTextureParameter('baseColorTexture'));

  applyTexture('baseColorTexture', {
    texCoordParam: 'baseColorTexcoordIndex',
    transform: {
      scale: 'baseColorTextureTransformScale',
      offset: 'baseColorTextureTransformOffset',
      rotation: 'baseColorTextureTransformRotation',
    },
    onAssign: info => {
      material.pbrMetallicRoughness.baseColorTexture = info;
    },
  });

  if (!hasBaseColorTexture) {
    applyTexture('diffuseColorTexture', {
      texCoordParam: 'baseColorTexcoordIndex',
      transform: {
        scale: 'baseColorTextureTransformScale',
        offset: 'baseColorTextureTransformOffset',
        rotation: 'baseColorTextureTransformRotation',
      },
      onAssign: info => {
        if (Is.not.exist(material.pbrMetallicRoughness.baseColorTexture)) {
          material.pbrMetallicRoughness.baseColorTexture = info;
        }
      },
    });
  }

  if (skipAdditionalTextures) {
    return;
  }

  applyTexture('metallicRoughnessTexture', {
    texCoordParam: 'metallicRoughnessTexcoordIndex',
    transform: {
      scale: 'metallicRoughnessTextureTransformScale',
      offset: 'metallicRoughnessTextureTransformOffset',
      rotation: 'metallicRoughnessTextureTransformRotation',
    },
    onAssign: info => {
      material.pbrMetallicRoughness.metallicRoughnessTexture = info;
    },
  });

  applyTexture('normalTexture', {
    texCoordParam: 'normalTexcoordIndex',
    transform: {
      scale: 'normalTextureTransformScale',
      offset: 'normalTextureTransformOffset',
      rotation: 'normalTextureTransformRotation',
    },
    scaleParam: 'normalScale',
    onAssign: info => {
      material.normalTexture = info;
    },
  });

  applyTexture('occlusionTexture', {
    texCoordParam: 'occlusionTexcoordIndex',
    transform: {
      scale: 'occlusionTextureTransformScale',
      offset: 'occlusionTextureTransformOffset',
      rotation: 'occlusionTextureTransformRotation',
    },
    strengthParam: 'occlusionStrength',
    onAssign: info => {
      material.occlusionTexture = info;
    },
  });

  applyTexture('emissiveTexture', {
    texCoordParam: 'emissiveTexcoordIndex',
    transform: {
      scale: 'emissiveTextureTransformScale',
      offset: 'emissiveTextureTransformOffset',
      rotation: 'emissiveTextureTransformRotation',
    },
    onAssign: info => {
      material.emissiveTexture = info;
    },
  });
}
