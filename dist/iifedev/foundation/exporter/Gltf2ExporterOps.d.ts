import type { AnimationChannel, AnimationPathName, AnimationSampler } from '../../types/AnimationTypes';
import type { Array1to4, Byte, Count, Index } from '../../types/CommonTypes';
import type { Gltf2, Gltf2Animation, Gltf2AnimationPathName, Gltf2Primitive } from '../../types/glTF2';
import type { Gltf2AccessorEx, Gltf2BufferViewEx, Gltf2Ex, Gltf2ImageEx, Gltf2MaterialEx } from '../../types/glTF2ForOutput';
import { type ComponentTypeEnum, type CompositionTypeEnum } from '../definitions';
import type { Primitive } from '../geometry/Primitive';
import type { IAnimationEntity, IMeshEntity, ISkeletalEntity } from '../helpers/EntityHelper';
import type { Material } from '../materials/core/Material';
import { Accessor } from '../memory/Accessor';
import { Buffer } from '../memory/Buffer';
import { BufferView } from '../memory/BufferView';
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
export declare function createAndAddGltf2BufferView(json: Gltf2Ex, bufferIdx: Index, uint8Array: Uint8Array): Gltf2BufferViewEx;
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
export declare function accumulateBufferViewByteLength(bufferViewByteLengthAccumulatedArray: number[], bufferIdxToSet: number, gltf2BufferView: Gltf2BufferViewEx): number;
/**
 * Converts Rhodonite animation path names to glTF2 format.
 *
 * @param path - The Rhodonite animation path name
 * @returns The corresponding glTF2 animation path name
 * @throws Error if the path name is invalid
 */
export declare function convertToGltfAnimationPathName(path: AnimationPathName): Gltf2AnimationPathName;
/**
 * Aligns accessor byte offset to 4-byte boundaries.
 *
 * glTF2 specification requires that accessor byte offsets be aligned to
 * 4-byte boundaries for optimal performance and compatibility.
 *
 * @param byteOffset - Byte offset that may not be aligned
 * @returns Aligned byte offset
 */
export declare function alignAccessorByteOffsetTo4Bytes(byteOffset: Byte): Byte;
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
export declare function alignBufferViewByteStrideTo4Bytes(byteStride: Byte): Byte;
/**
 * Type guard for checking if an ArrayBufferView has numeric array properties.
 */
export type NumericArrayBufferView = ArrayBufferView & {
    length: number;
    [index: number]: number;
};
/**
 * Type guard function to check if an ArrayBufferView is a numeric array buffer view.
 *
 * @param view - The ArrayBufferView to check
 * @returns True if the view has numeric array properties
 */
export declare function isNumericArrayBufferView(view: ArrayBufferView): view is NumericArrayBufferView;
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
export declare function createGltf2AnimationChannel(channel: AnimationChannel, samplerIdx: Index, animation: Gltf2Animation, entityIdx: Index, targetOverride?: AnimationChannelTargetOverride): Index;
/**
 * Creates a glTF2 animation sampler from Rhodonite sampler data.
 *
 * @param inputAccessorIdx - Index of the input (time) accessor
 * @param outputAccessorIdx - Index of the output (value) accessor
 * @param sampler - The Rhodonite animation sampler
 * @param animation - The glTF2 animation to add the sampler to
 */
export declare function createGltf2AnimationSampler(inputAccessorIdx: number, outputAccessorIdx: number, sampler: AnimationSampler, animation: Gltf2Animation): void;
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
export declare function alignBufferViewByteLength(bufferViewByteLengthAccumulated: number, bufferView: Gltf2BufferViewEx): number;
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
export declare function resolveVertexAttributeByteStride(rnBufferView: BufferView, rnAccessor: Accessor): Byte | undefined;
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
export declare function generateGlbArrayBuffer(json: Gltf2, arraybuffer: ArrayBuffer): ArrayBuffer;
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
export declare function calcBufferViewByteLengthAndByteOffset({ accessorByteOffset, accessorCount, bufferViewByteStride, bufferViewByteOffset, sizeOfComponent, numberOfComponents, }: BufferViewByteLengthDesc): {
    fixedBufferViewByteLength: Byte;
    fixedBufferViewByteOffset: Byte;
};
/**
 * Clamps a weight value to the valid range [0, 1].
 *
 * @param value - The weight value to clamp
 * @returns Clamped value between 0 and 1
 */
export declare function clampWeight(value: number): number;
/**
 * Sanitizes a skin weight value to ensure it's valid.
 *
 * Ensures the weight is finite, non-negative, and within the valid range [0, 1].
 *
 * @param weight - The weight value to sanitize
 * @returns Object containing the sanitized value and whether it was mutated
 */
export declare function sanitizeSkinWeight(weight: number): {
    value: number;
    mutated: boolean;
};
/**
 * Gets the maximum value for a normalized unsigned component type.
 *
 * @param componentType - The component type enum
 * @returns Maximum value for the component type
 */
export declare function getNormalizedUnsignedComponentMax(componentType: ComponentTypeEnum): number;
/**
 * Creates an unsigned typed array based on the component type.
 *
 * @param componentType - The component type enum
 * @param length - The length of the array to create
 * @returns The created typed array
 * @throws Error if the component type is not supported
 */
export declare function createUnsignedTypedArray(componentType: ComponentTypeEnum, length: number): Uint8Array | Uint16Array | Uint32Array;
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
export declare function calcAccessorIdxToSet(existingUniqueRnAccessors: Accessor[], rnAccessor: Accessor): number;
/**
 * Finds the index of an existing buffer view in the cache.
 *
 * @param existingUniqueRnBufferViews - Array of unique buffer views
 * @param rnBufferView - The buffer view to search for
 * @returns Index of the buffer view or -1 if not found
 */
export declare function findBufferViewIdx(existingUniqueRnBufferViews: BufferView[], rnBufferView: BufferView): number;
/**
 * Calculates the buffer index for deduplication purposes.
 *
 * @param existingUniqueRnBuffers - Array of unique buffers
 * @param rnBuffer - The buffer to find or add
 * @returns Index where the buffer should be placed
 */
export declare function calcBufferIdxToSet(existingUniqueRnBuffers: Buffer[], rnBuffer: Buffer): number;
/**
 * Creates a glTF2 BufferView for animation data.
 *
 * @param params - Parameters for buffer view creation
 * @returns Created glTF2 buffer view with proper alignment
 */
export declare function createGltf2BufferViewForAnimation({ bufferIdx, bufferViewByteOffset, accessorByteOffset, accessorCount, bufferViewByteStride, componentType, compositionType, uint8Array, }: Gltf2BufferViewDesc): Gltf2BufferViewEx;
/**
 * Creates a glTF2 Accessor for animation data.
 *
 * @param params - Parameters for accessor creation
 * @returns Created glTF2 accessor with proper type information
 */
export declare function createGltf2AccessorForAnimation({ bufferViewIdx, accessorByteOffset, componentType, count, compositionType, min, max, }: Gltf2AccessorDesc): Gltf2AccessorEx;
/**
 * Epsilon value for tangent vector calculations.
 */
export declare const TANGENT_EPSILON = 0.000001;
/**
 * Epsilon value for skin weight sum calculations.
 */
export declare const SKIN_WEIGHT_SUM_EPSILON = 0.000001;
/**
 * Epsilon value for skin weight difference calculations.
 */
export declare const SKIN_WEIGHT_DIFF_EPSILON = 0.000001;
/**
 * Tolerance value for skin weight residual calculations.
 */
export declare const SKIN_WEIGHT_RESIDUAL_TOLERANCE = 0.000001;
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
export declare function accumulateVector3(array: Float32Array, index: number, x: number, y: number, z: number): void;
/**
 * Builds an orthonormal vector perpendicular to the given normal.
 *
 * Creates a vector that is orthogonal to the provided normal vector,
 * used as a fallback when tangent vectors are degenerate.
 *
 * @param normal - Optional normal vector
 * @returns Orthonormal vector
 */
export declare function buildOrthonormalVector(normal?: {
    x: number;
    y: number;
    z: number;
}): {
    x: number;
    y: number;
    z: number;
};
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
export declare function normalizeTangentVector(tangent: {
    x: number;
    y: number;
    z: number;
    w: number;
}, normal?: {
    x: number;
    y: number;
    z: number;
}, bitangent?: {
    x: number;
    y: number;
    z: number;
}): {
    x: number;
    y: number;
    z: number;
    w: number;
};
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
export declare function processSkinWeightElement(accessor: Accessor, elementIndex: number, baseIndex: number, componentCount: number, treatAsNormalizedUnsignedInt: boolean, normalizationDenominator: number, floatData: Float32Array): boolean;
/**
 * Normalizes skin weight elements to sum to 1.0.
 *
 * @param floatData - Float32Array containing weight data
 * @param baseIndex - Base index of the element
 * @param componentCount - Number of components per element
 * @param sum - Current sum of weights
 * @returns True if normalization was performed
 */
export declare function normalizeSkinWeightElement(floatData: Float32Array, baseIndex: number, componentCount: number, sum: number): boolean;
/**
 * Scales skin weight elements to unsigned integer range.
 *
 * @param floatData - Float32Array containing normalized weight data
 * @param baseIndex - Base index of the element
 * @param componentCount - Number of components per element
 * @param typedArray - Target typed array for scaled values
 * @param maxValue - Maximum value for the component type
 */
export declare function scaleSkinWeightElementToUnsigned(floatData: Float32Array, baseIndex: number, componentCount: number, typedArray: WeightTypedArray, maxValue: number): void;
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
export declare function rebalanceScaledSkinWeights(diff: number, scaled: number[], componentCount: number, maxValue: number, floatData: Float32Array, baseIndex: number): void;
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
export declare function adjustWeightsForResidual(data: Float32Array, offset: number, componentCount: number, residual: number, tolerance: number): void;
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
export declare function createNormalizedFloatWeights(accessor: Accessor, componentCount: number, elementCount: number, treatAsNormalizedUnsignedInt: boolean, normalizationDenominator: number): {
    data: Float32Array;
    mutated: boolean;
};
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
export declare function convertNormalizedWeightsToUnsigned(floatData: Float32Array, accessor: Accessor, componentCount: number, elementCount: number, normalizationDenominator: number): Accessor;
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
export declare function createAccessorFromWeightsTypedArray(typedArray: WeightTypedArray, baseAccessor: Accessor, componentType: ComponentTypeEnum, normalized: boolean): Accessor;
/**
 * Finds the primary texture coordinate accessor from a primitive.
 *
 * Searches for the first TEXCOORD attribute in the primitive's semantics.
 *
 * @param primitive - The primitive to search
 * @returns The primary texture coordinate accessor or undefined if not found
 */
export declare function findPrimaryTexcoordAccessor(primitive: Primitive): Accessor | undefined;
/**
 * Creates a temporary Vec4 accessor for tangent calculations.
 *
 * Creates a temporary buffer, buffer view, and accessor for storing
 * Vec4 tangent data during export processing.
 *
 * @param count - Number of elements in the accessor
 * @returns New Accessor instance with Vec4 composition type
 */
export declare function createTemporaryVec4Accessor(count: number): Accessor;
/**
 * Normalizes normal vectors in an accessor.
 *
 * Reads normal data from the accessor, normalizes each vector to unit length,
 * and creates a new accessor with the normalized data.
 *
 * @param accessor - The accessor containing normal data
 * @returns New Accessor with normalized normal vectors
 */
export declare function normalizeNormals(accessor: Accessor): Accessor;
/**
 * Normalizes skin weights in an accessor.
 *
 * Processes skin weight data to ensure values are properly normalized,
 * sanitized, and converted to the appropriate format.
 *
 * @param accessor - The accessor containing skin weight data
 * @returns New Accessor with normalized skin weights, or original if unchanged
 */
export declare function normalizeSkinWeights(accessor: Accessor): Accessor;
/**
 * Creates BufferView and Accessor for animation input (time) data.
 *
 * @param json - The glTF2 JSON document
 * @param sampler - The animation sampler containing input data
 * @param bufferIdx - Index of the target buffer
 * @param bufferViewByteLengthAccumulated - Current accumulated byte length
 * @returns Object containing accessor index and updated byte length
 */
export declare function createGltf2BufferViewAndGltf2AccessorForInput(json: Gltf2Ex, sampler: AnimationSampler, bufferIdx: Index, bufferViewByteLengthAccumulated: Byte): {
    inputAccessorIdx: Index;
    inputBufferViewByteLengthAccumulated: Byte;
};
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
export declare function createGltf2BufferViewAndGltf2AccessorForOutput(json: Gltf2Ex, sampler: AnimationSampler, pathName: AnimationPathName, bufferIdx: Index, bufferViewByteLengthAccumulated: Byte): {
    outputAccessorIdx: Index;
    outputBufferViewByteLengthAccumulated: Byte;
};
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
export declare function createOrReuseGltf2BufferView(json: Gltf2Ex, existingUniqueRnBuffers: Buffer[], existingUniqueRnBufferViews: BufferView[], rnBufferView: BufferView, target?: number): Gltf2BufferViewEx;
/**
 * Creates or reuses a glTF2 Accessor with deduplication.
 *
 * @param json - The glTF2 JSON document
 * @param bufferViewIdxToSet - Index of the buffer view to use
 * @param existingUniqueRnAccessors - Accessor deduplication cache
 * @param rnAccessor - The Rhodonite accessor to convert
 * @returns The created or existing glTF2 accessor
 */
export declare function createOrReuseGltf2Accessor(json: Gltf2Ex, bufferViewIdxToSet: Index, existingUniqueRnAccessors: Accessor[], rnAccessor: Accessor): Gltf2AccessorEx;
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
export declare function getExportTangentAccessorForPrimitive(primitive: Primitive): Accessor | undefined;
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
export declare function createNormalizedTangentAccessor(source: Accessor, normalAccessor: Accessor | undefined): Accessor;
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
export declare function createComputedTangentAccessor(primitive: Primitive, normalAccessor: Accessor | undefined): Accessor | undefined;
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
export declare function createOrReuseGltf2BufferViewForVertexAttributeBuffer(json: Gltf2Ex, existingUniqueRnBuffers: Buffer[], existingUniqueRnBufferViews: BufferView[], rnBufferView: BufferView, rnAccessor: Accessor): Gltf2BufferViewEx;
/**
 * Checks if a Rhodonite material requires tangent vectors.
 *
 * Determines if the material uses normal mapping or clearcoat normal mapping,
 * which require tangent vectors for proper rendering.
 *
 * @param material - The material to check, or undefined
 * @returns True if the material requires tangents, false otherwise
 */
export declare function doesRhodoniteMaterialRequireTangents(material: Material | undefined): boolean;
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
export declare function setupBlendShapeData(entity: IMeshEntity, rnPrimitive: Primitive, primitive: Gltf2Primitive, json: Gltf2Ex, existingUniqueRnBuffers: Buffer[], existingUniqueRnBufferViews: BufferView[], existingUniqueRnAccessors: Accessor[]): void;
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
export declare function handleTextureImage(json: Gltf2Ex, bufferIdx: Index, blob: Blob, option: {
    type: string;
}, glTF2ImageEx: Gltf2ImageEx, resolve: (v?: ArrayBuffer) => void, rejected: (reason?: DOMException) => void, gltf2ExportType?: string): Promise<void>;
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
export declare function __createBufferViewsAndAccessorsOfSkin(json: Gltf2Ex, entities: ISkeletalEntity[], existingUniqueRnBuffers: Buffer[], existingUniqueRnBufferViews: BufferView[], existingUniqueRnAccessors: Accessor[]): void;
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
export declare function __createBufferViewsAndAccessorsOfMesh(json: Gltf2Ex, entities: IMeshEntity[], existingUniqueRnBuffers: Buffer[], existingUniqueRnBufferViews: BufferView[], existingUniqueRnAccessors: Accessor[]): void;
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
export declare function __createBufferViewsAndAccessorsOfAnimation(json: Gltf2Ex, entities: IAnimationEntity[], options?: AnimationExportOptions): void;
/**
 * Removes empty arrays from the glTF2 JSON to optimize output size.
 *
 * According to glTF2 specification, empty arrays should be omitted rather than
 * included as empty arrays to reduce file size and improve parsing performance.
 *
 * @param json - The glTF2 JSON object to clean up
 */
export declare function __deleteEmptyArrays(json: Gltf2Ex): void;
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
export declare function __extractScalarParameter(value: unknown): number | undefined;
/**
 * Checks if a glTF2 material requires tangent vectors.
 *
 * Determines if the material uses normal mapping, clearcoat normal mapping,
 * or anisotropy features that require tangent vectors for proper rendering.
 *
 * @param material - The glTF2 material to check
 * @returns True if the material requires tangents, false otherwise
 */
export declare function __doesMaterialRequireTangents(material: Gltf2MaterialEx): boolean;
/**
 * Collects used texture coordinate set indices from a glTF2 material.
 *
 * Scans the material and its extensions to identify which texture coordinate
 * sets (TEXCOORD_0, TEXCOORD_1, etc.) are actually used by textures.
 *
 * @param material - The glTF2 material to analyze
 * @returns Set of used texture coordinate set indices
 */
export declare function __collectUsedTexCoordSetIndices(material: Gltf2MaterialEx): Set<number>;
/**
 * Prunes unused vertex attributes from a primitive based on material requirements.
 *
 * Removes vertex attributes that are not needed by the material, such as
 * TANGENT if not required, and unused TEXCOORD sets to optimize the output.
 *
 * @param primitive - The glTF2 primitive to prune attributes from
 * @param material - The glTF2 material to check requirements against
 */
export declare function __pruneUnusedVertexAttributes(primitive: Gltf2Primitive, material: Gltf2MaterialEx): void;
export declare function __outputKhrMaterialsEmissiveStrengthInfo(ensureExtensionUsed: (extensionName: string) => void, coerceNumber: (value: any) => number | undefined, rnMaterial: Material, material: Gltf2MaterialEx): void;
export declare function __outputKhrMaterialsDiffuseTransmissionInfo(ensureExtensionUsed: (extensionName: string) => void, coerceNumber: (value: any) => number | undefined, coerceVec3: (value: any) => [number, number, number] | undefined, rnMaterial: Material, applyTexture: (paramName: string, options: {
    texCoordParam?: string;
    transform?: {
        scale?: string;
        offset?: string;
        rotation?: string;
    };
    scaleParam?: string;
    strengthParam?: string;
    onAssign: (info: any) => void;
}) => void, material: Gltf2MaterialEx): void;
export declare function __outputKhrMaterialsTransmissionInfo(ensureExtensionUsed: (extensionName: string) => void, coerceNumber: (value: any) => number | undefined, rnMaterial: Material, applyTexture: (paramName: string, options: {
    texCoordParam?: string;
    transform?: {
        scale?: string;
        offset?: string;
        rotation?: string;
    };
    scaleParam?: string;
    strengthParam?: string;
    onAssign: (info: any) => void;
}) => void, material: Gltf2MaterialEx): void;
export declare function __outputKhrMaterialsVolumeInfo(ensureExtensionUsed: (extensionName: string) => void, coerceNumber: (value: any) => number | undefined, coerceVec3: (value: any) => [number, number, number] | undefined, rnMaterial: Material, applyTexture: (paramName: string, options: {
    texCoordParam?: string;
    transform?: {
        scale?: string;
        offset?: string;
        rotation?: string;
    };
    scaleParam?: string;
    strengthParam?: string;
    onAssign: (info: any) => void;
}) => void, material: Gltf2MaterialEx): void;
export declare function __outputKhrMaterialsIorInfo(ensureExtensionUsed: (extensionName: string) => void, coerceNumber: (value: any) => number | undefined, rnMaterial: Material, material: Gltf2MaterialEx): void;
export declare function __outputKhrMaterialsClearcoatInfo(ensureExtensionUsed: (extensionName: string) => void, coerceNumber: (value: any) => number | undefined, rnMaterial: Material, applyTexture: (paramName: string, options: {
    texCoordParam?: string;
    transform?: {
        scale?: string;
        offset?: string;
        rotation?: string;
    };
    scaleParam?: string;
    strengthParam?: string;
    onAssign: (info: any) => void;
}) => void, material: Gltf2MaterialEx): void;
export declare function __outputKhrMaterialsSheenInfo(ensureExtensionUsed: (extensionName: string) => void, coerceNumber: (value: any) => number | undefined, coerceVec3: (value: any) => [number, number, number] | undefined, rnMaterial: Material, applyTexture: (paramName: string, options: {
    texCoordParam?: string;
    transform?: {
        scale?: string;
        offset?: string;
        rotation?: string;
    };
    scaleParam?: string;
    strengthParam?: string;
    onAssign: (info: any) => void;
}) => void, material: Gltf2MaterialEx): void;
export declare function __outputKhrMaterialsSpecularInfo(ensureExtensionUsed: (extensionName: string) => void, coerceNumber: (value: any) => number | undefined, coerceVec3: (value: any) => [number, number, number] | undefined, rnMaterial: Material, applyTexture: (paramName: string, options: {
    texCoordParam?: string;
    transform?: {
        scale?: string;
        offset?: string;
        rotation?: string;
    };
    scaleParam?: string;
    strengthParam?: string;
    onAssign: (info: any) => void;
}) => void, material: Gltf2MaterialEx): void;
export declare function __outputKhrMaterialsIridescenceInfo(ensureExtensionUsed: (extensionName: string) => void, coerceNumber: (value: any) => number | undefined, rnMaterial: Material, applyTexture: (paramName: string, options: {
    texCoordParam?: string;
    transform?: {
        scale?: string;
        offset?: string;
        rotation?: string;
    };
    scaleParam?: string;
    strengthParam?: string;
    onAssign: (info: any) => void;
}) => void, material: Gltf2MaterialEx): void;
export declare function __outputKhrMaterialsAnisotropyInfo(ensureExtensionUsed: (extensionName: string) => void, coerceNumber: (value: any) => number | undefined, coerceVec2: (value: any) => [number, number] | undefined, rnMaterial: Material, applyTexture: (paramName: string, options: {
    texCoordParam?: string;
    transform?: {
        scale?: string;
        offset?: string;
        rotation?: string;
    };
    scaleParam?: string;
    strengthParam?: string;
    onAssign: (info: any) => void;
}) => void, material: Gltf2MaterialEx): void;
export declare function __outputKhrMaterialsDispersionInfo(ensureExtensionUsed: (extensionName: string) => void, coerceNumber: (value: any) => number | undefined, rnMaterial: Material, material: Gltf2MaterialEx): void;
export declare function __removeUnusedAccessorsAndBufferViews(json: Gltf2Ex): void;
export declare function __removeUnusedAccessors(json: Gltf2Ex): void;
export declare function __collectUsedAccessorIndices(json: Gltf2Ex): Set<number>;
export declare function __collectAccessorIndicesFromMeshes(json: Gltf2Ex, register: (candidate: unknown) => void): void;
export declare function __collectAccessorIndicesFromSkins(json: Gltf2Ex, register: (candidate: unknown) => void): void;
export declare function __collectAccessorIndicesFromAnimations(json: Gltf2Ex, register: (candidate: unknown) => void): void;
export declare function __remapAccessorReferences(json: Gltf2Ex, indexMap: Map<number, number>): void;
export declare function __remapAccessorAttributeRecord(attributes: Record<string, number | undefined> | undefined, mapAccessorIndex: (candidate: unknown) => number | undefined): void;
export declare function __removeUnusedBufferViews(json: Gltf2Ex): void;
export declare function __collectUsedBufferViewIndices(json: Gltf2Ex): Set<number>;
export declare function __remapBufferViewReferences(json: Gltf2Ex, indexMap: Map<number, number>): void;
export declare function __filterItemsByUsage<T>(items: T[], usedIndices: Set<number>): {
    filtered: T[];
    indexMap: Map<number, number>;
} | undefined;
export declare function __recalculateBufferViewAccumulators(json: Gltf2Ex): void;
export declare function __setupMaterialBasicProperties(material: Gltf2MaterialEx, rnMaterial: Material, json: Gltf2Ex): void;
export declare function __outputBaseMaterialInfo(rnMaterial: Material, applyTexture: (paramName: string, options: {
    texCoordParam?: string;
    transform?: {
        scale?: string;
        offset?: string;
        rotation?: string;
    };
    scaleParam?: string;
    strengthParam?: string;
    onAssign: (info: any) => void;
}) => void, material: Gltf2MaterialEx, json: Gltf2Ex, options?: {
    skipAdditionalTextures?: boolean;
}): void;
