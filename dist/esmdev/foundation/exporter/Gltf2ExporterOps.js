// src/foundation/exporter/Gltf2ExporterOps.ts
import { GL_ARRAY_BUFFER, GL_ELEMENT_ARRAY_BUFFER } from "../../types/WebGLConstants.js";
import { BufferUse } from "../definitions/index.js";
import { ComponentType } from "../definitions/ComponentType.js";
import { CompositionType } from "../definitions/CompositionType.js";
import { PrimitiveMode } from "../definitions/PrimitiveMode.js";
import { VertexAttribute } from "../definitions/VertexAttribute.js";
import { Vector4 } from "../math/Vector4.js";
import { Accessor } from "../memory/Accessor.js";
import { Buffer } from "../memory/Buffer.js";
import { BufferView } from "../memory/BufferView.js";
import { DataUtil } from "../misc/DataUtil.js";
import { Is } from "../misc/Is.js";
function createAndAddGltf2BufferView(json, bufferIdx, uint8Array) {
  const bufferViewByteLengthAccumulated = json.extras.bufferViewByteLengthAccumulatedArray[bufferIdx];
  const gltfBufferViewEx = {
    buffer: bufferIdx,
    byteLength: uint8Array.byteLength,
    byteOffset: bufferViewByteLengthAccumulated,
    extras: {
      uint8Array
    }
  };
  const nextBufferViewBytesLengthAccumulated = DataUtil.addPaddingBytes(gltfBufferViewEx.byteLength, 4) + bufferViewByteLengthAccumulated;
  json.bufferViews.push(gltfBufferViewEx);
  json.extras.bufferViewByteLengthAccumulatedArray[bufferIdx] = nextBufferViewBytesLengthAccumulated;
  return gltfBufferViewEx;
}
function accumulateBufferViewByteLength(bufferViewByteLengthAccumulatedArray, bufferIdxToSet, gltf2BufferView) {
  const bufferViewLengthAligned = Is.exist(bufferViewByteLengthAccumulatedArray[bufferIdxToSet]) ? bufferViewByteLengthAccumulatedArray[bufferIdxToSet] + DataUtil.addPaddingBytes(gltf2BufferView.byteLength, 4) : DataUtil.addPaddingBytes(gltf2BufferView.byteLength, 4);
  return bufferViewLengthAligned;
}
function convertToGltfAnimationPathName(path) {
  switch (path) {
    case "translate":
      return "translation";
    case "quaternion":
      return "rotation";
    case "scale":
      return "scale";
    case "weights":
      return "weights";
    // case 'effekseer':
    //   return 'effekseer';
    default:
      throw new Error("Invalid Path Name");
  }
}
function isRuntimeOnlyAnimationPath(path) {
  return path.startsWith("vrmExpression/");
}
function alignAccessorByteOffsetTo4Bytes(byteOffset) {
  const alignSize = 4;
  if (byteOffset % 4 === 0) {
    return byteOffset;
  }
  return byteOffset + (alignSize - byteOffset % alignSize);
}
function alignBufferViewByteStrideTo4Bytes(byteStride) {
  const alignSize = 4;
  if (byteStride % 4 === 0) {
    return byteStride;
  }
  const byteStrideAlgined = byteStride + (alignSize - byteStride % alignSize);
  return byteStrideAlgined;
}
function isNumericArrayBufferView(view) {
  return typeof view.length === "number";
}
function createGltf2AnimationChannel(channel, samplerIdx, animation, entityIdx, targetOverride) {
  const pathName = channel.target.pathName;
  const overrides = Array.isArray(targetOverride) ? targetOverride : targetOverride ? [targetOverride] : void 0;
  if (overrides == null ? void 0 : overrides.length) {
    for (const override of overrides) {
      const target = {
        path: override.path
      };
      if (typeof override.node === "number") {
        target.node = override.node;
      }
      if (Is.exist(override.extensions)) {
        target.extensions = override.extensions;
      }
      animation.channels.push({
        sampler: samplerIdx,
        target
      });
    }
  } else {
    const channelJson = {
      sampler: samplerIdx,
      target: {
        path: convertToGltfAnimationPathName(pathName),
        node: entityIdx
      }
    };
    animation.channels.push(channelJson);
  }
  return samplerIdx + 1;
}
function createGltf2AnimationSampler(inputAccessorIdx, outputAccessorIdx, sampler, animation) {
  const samplerJson = {
    input: inputAccessorIdx,
    output: outputAccessorIdx,
    interpolation: sampler.interpolationMethod.GltfString
  };
  animation.samplers.push(samplerJson);
}
function alignBufferViewByteLength(bufferViewByteLengthAccumulated, bufferView) {
  const bufferViewEnd = bufferView.byteOffset + bufferView.byteLength;
  const alignedEnd = bufferViewEnd + DataUtil.calcPaddingBytes(bufferViewEnd, 4);
  const delta = alignedEnd - bufferViewByteLengthAccumulated;
  return Math.max(delta, 0);
}
function resolveVertexAttributeByteStride(rnBufferView, rnAccessor) {
  const candidates = [];
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
    return void 0;
  }
  const resolved = Math.max(...candidates);
  const aligned = alignBufferViewByteStrideTo4Bytes(resolved);
  return Math.max(aligned, elementSize);
}
function generateGlbArrayBuffer(json, arraybuffer) {
  const headerBytes = 12;
  json.buffers[0].uri = void 0;
  let jsonStr = JSON.stringify(json, null, 2);
  let jsonArrayBuffer = DataUtil.stringToBuffer(jsonStr);
  const paddingBytes = DataUtil.calcPaddingBytes(jsonArrayBuffer.byteLength, 4);
  if (paddingBytes > 0) {
    for (let i = 0; i < paddingBytes; i++) {
      jsonStr += " ";
    }
    jsonArrayBuffer = DataUtil.stringToBuffer(jsonStr);
  }
  const jsonChunkLength = jsonArrayBuffer.byteLength;
  const headerAndChunk0 = headerBytes + 4 + 4 + jsonChunkLength;
  const totalBytes = headerAndChunk0 + 4 + 4 + arraybuffer.byteLength;
  const glbArrayBuffer = new ArrayBuffer(totalBytes);
  const dataView = new DataView(glbArrayBuffer);
  dataView.setUint32(0, 1179937895, true);
  dataView.setUint32(4, 2, true);
  dataView.setUint32(8, totalBytes, true);
  dataView.setUint32(12, jsonArrayBuffer.byteLength, true);
  dataView.setUint32(16, 1313821514, true);
  DataUtil.copyArrayBufferAs4Bytes({
    src: jsonArrayBuffer,
    dist: glbArrayBuffer,
    srcByteOffset: 0,
    copyByteLength: jsonArrayBuffer.byteLength,
    distByteOffset: 20
  });
  DataUtil.copyArrayBufferAs4Bytes({
    src: arraybuffer,
    dist: glbArrayBuffer,
    srcByteOffset: 0,
    copyByteLength: arraybuffer.byteLength,
    distByteOffset: 20 + jsonChunkLength + 8
  });
  dataView.setUint32(headerAndChunk0, arraybuffer.byteLength, true);
  dataView.setUint32(headerAndChunk0 + 4, 5130562, true);
  return glbArrayBuffer;
}
function calcBufferViewByteLengthAndByteOffset({
  accessorByteOffset,
  accessorCount,
  bufferViewByteStride,
  bufferViewByteOffset,
  sizeOfComponent,
  numberOfComponents
}) {
  const effectiveByteStride = bufferViewByteStride === 0 ? sizeOfComponent * numberOfComponents : bufferViewByteStride;
  if (bufferViewByteStride % sizeOfComponent !== 0) {
    throw Error(
      "glTF2: When byteStride is defined, it MUST be a multiple of the size of the accessor's component type."
    );
  }
  const effectiveByteStrideAligned = alignBufferViewByteStrideTo4Bytes(effectiveByteStride);
  const alignedAccessorByteOffset = alignAccessorByteOffsetTo4Bytes(accessorByteOffset);
  const bufferViewByteLength = alignedAccessorByteOffset + effectiveByteStrideAligned * (accessorCount - 1) + sizeOfComponent * numberOfComponents;
  const valByteLength = sizeOfComponent * numberOfComponents;
  const sumByteOffset = alignedAccessorByteOffset + bufferViewByteOffset;
  const paddingByte = valByteLength - sumByteOffset % valByteLength;
  const fixedBufferViewByteOffset = bufferViewByteOffset + paddingByte;
  const alignedBufferViewByteOffset = alignAccessorByteOffsetTo4Bytes(fixedBufferViewByteOffset);
  const fixedBufferViewByteLength = bufferViewByteLength;
  return {
    fixedBufferViewByteLength,
    fixedBufferViewByteOffset: alignedBufferViewByteOffset
  };
}
function clampWeight(value) {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}
function sanitizeSkinWeight(weight) {
  if (!Number.isFinite(weight) || weight < 0) {
    return { value: 0, mutated: weight !== 0 };
  }
  if (weight > 1) {
    return { value: 1, mutated: true };
  }
  return { value: weight, mutated: false };
}
function getNormalizedUnsignedComponentMax(componentType) {
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
function createUnsignedTypedArray(componentType, length) {
  if (componentType === ComponentType.UnsignedByte) {
    return new Uint8Array(length);
  }
  if (componentType === ComponentType.UnsignedShort) {
    return new Uint16Array(length);
  }
  if (componentType === ComponentType.UnsignedInt) {
    return new Uint32Array(length);
  }
  throw new Error("Unsupported component type for normalized weights");
}
function calcAccessorIdxToSet(existingUniqueRnAccessors, rnAccessor) {
  const accessorIdx = existingUniqueRnAccessors.findIndex((accessor) => {
    return accessor.isSame(rnAccessor);
  });
  return accessorIdx;
}
function findBufferViewIdx(existingUniqueRnBufferViews, rnBufferView) {
  const bufferViewIdx = existingUniqueRnBufferViews.findIndex((bufferView) => bufferView.isSame(rnBufferView));
  return bufferViewIdx;
}
function calcBufferIdxToSet(existingUniqueRnBuffers, rnBuffer) {
  if (existingUniqueRnBuffers.length === 0) {
    existingUniqueRnBuffers.push(rnBuffer);
  }
  const bufferIdx = existingUniqueRnBuffers.findIndex((buffer) => buffer.isSame(rnBuffer));
  const bufferIdxToSet = bufferIdx === -1 ? existingUniqueRnBuffers.length : bufferIdx;
  if (bufferIdx === -1) {
    existingUniqueRnBuffers.push(rnBuffer);
  }
  return bufferIdxToSet;
}
function createGltf2BufferViewForAnimation({
  bufferIdx,
  bufferViewByteOffset,
  accessorByteOffset,
  accessorCount,
  bufferViewByteStride,
  componentType,
  compositionType,
  uint8Array
}) {
  const alignedAccessorByteOffset = alignAccessorByteOffsetTo4Bytes(accessorByteOffset);
  const { fixedBufferViewByteLength, fixedBufferViewByteOffset } = calcBufferViewByteLengthAndByteOffset({
    accessorByteOffset: alignedAccessorByteOffset,
    accessorCount,
    bufferViewByteStride,
    bufferViewByteOffset,
    sizeOfComponent: componentType.getSizeInBytes(),
    numberOfComponents: compositionType.getNumberOfComponents()
  });
  const gltfBufferViewEx = {
    buffer: bufferIdx,
    byteLength: fixedBufferViewByteLength,
    byteOffset: fixedBufferViewByteOffset,
    extras: {
      uint8Array
    }
  };
  return gltfBufferViewEx;
}
function createGltf2AccessorForAnimation({
  bufferViewIdx,
  accessorByteOffset,
  componentType,
  count,
  compositionType,
  min,
  max
}) {
  const alignedAccessorByteOffset = alignAccessorByteOffsetTo4Bytes(accessorByteOffset);
  const gltf2AccessorEx = {
    bufferView: bufferViewIdx,
    byteOffset: alignedAccessorByteOffset,
    componentType: ComponentType.toGltf2AccessorComponentType(componentType),
    count,
    type: compositionType.str,
    min,
    max,
    extras: {}
  };
  return gltf2AccessorEx;
}
var TANGENT_EPSILON = 1e-6;
var SKIN_WEIGHT_SUM_EPSILON = 1e-6;
var SKIN_WEIGHT_DIFF_EPSILON = 1e-6;
var SKIN_WEIGHT_RESIDUAL_TOLERANCE = 1e-6;
function accumulateVector3(array, index, x, y, z) {
  array[index * 3 + 0] += x;
  array[index * 3 + 1] += y;
  array[index * 3 + 2] += z;
}
function buildOrthonormalVector(normal) {
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
function normalizeTangentVector(tangent, normal, bitangent) {
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
  let w = tangent.w !== 0 ? tangent.w >= 0 ? 1 : -1 : 1;
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
function processSkinWeightElement(accessor, elementIndex, baseIndex, componentCount, treatAsNormalizedUnsignedInt, normalizationDenominator, floatData) {
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
function normalizeSkinWeightElement(floatData, baseIndex, componentCount, sum) {
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
function scaleSkinWeightElementToUnsigned(floatData, baseIndex, componentCount, typedArray, maxValue) {
  const scaled = new Array(componentCount);
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
function rebalanceScaledSkinWeights(diff, scaled, componentCount, maxValue, floatData, baseIndex) {
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
function adjustWeightsForResidual(data, offset, componentCount, residual, tolerance) {
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
function createNormalizedFloatWeights(accessor, componentCount, elementCount, treatAsNormalizedUnsignedInt, normalizationDenominator) {
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
function convertNormalizedWeightsToUnsigned(floatData, accessor, componentCount, elementCount, normalizationDenominator) {
  const typedArray = createUnsignedTypedArray(accessor.componentType, floatData.length);
  const maxValue = normalizationDenominator;
  for (let elementIndex = 0; elementIndex < elementCount; elementIndex++) {
    const baseIndex = elementIndex * componentCount;
    scaleSkinWeightElementToUnsigned(floatData, baseIndex, componentCount, typedArray, maxValue);
  }
  return createAccessorFromWeightsTypedArray(typedArray, accessor, accessor.componentType, true);
}
function createAccessorFromWeightsTypedArray(typedArray, baseAccessor, componentType, normalized) {
  const arrayBuffer = typedArray.buffer;
  const buffer = new Buffer({
    byteLength: arrayBuffer.byteLength,
    buffer: arrayBuffer,
    name: "NormalizedSkinWeightsBuffer",
    byteAlign: 4,
    bufferUsage: BufferUse.CPUGeneric,
    indexOfTheBufferUsage: 0
  });
  const bufferView = new BufferView({
    buffer,
    byteOffsetInBuffer: 0,
    defaultByteStride: 0,
    byteLength: arrayBuffer.byteLength,
    raw: arrayBuffer
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
    normalized
  });
  return newAccessor;
}
function findPrimaryTexcoordAccessor(primitive) {
  var _a;
  const semantics = primitive.attributeSemantics;
  for (const semantic of semantics) {
    if (semantic.startsWith("TEXCOORD_")) {
      return (_a = primitive.getAttribute(semantic)) != null ? _a : void 0;
    }
  }
  return void 0;
}
function createTemporaryVec4Accessor(count) {
  const byteLength = count * 4 * 4;
  const buffer = new Buffer({
    byteLength,
    buffer: new ArrayBuffer(byteLength),
    name: "Gltf2Exporter_Tangent",
    byteAlign: 4,
    bufferUsage: BufferUse.CPUGeneric,
    indexOfTheBufferUsage: 0
  });
  const bufferView = buffer.takeBufferView({
    byteLengthToNeed: byteLength,
    byteStride: 0
  }).unwrapForce();
  return bufferView.takeAccessor({
    compositionType: CompositionType.Vec4,
    componentType: ComponentType.Float,
    count
  }).unwrapForce();
}
function normalizeNormals(accessor) {
  const componentCount = accessor.compositionType.getNumberOfComponents();
  const elementCount = accessor.elementCount;
  const normalData = new Float32Array(elementCount * componentCount);
  if (componentCount === 3) {
    for (let i = 0; i < elementCount; i++) {
      const vec = accessor.getVec3(i, {});
      normalData[i * 3 + 0] = vec.x;
      normalData[i * 3 + 1] = vec.y;
      normalData[i * 3 + 2] = vec.z;
    }
  } else if (componentCount === 2) {
    for (let i = 0; i < elementCount; i++) {
      const vec = accessor.getVec2(i, {});
      normalData[i * 2 + 0] = vec.x;
      normalData[i * 2 + 1] = vec.y;
    }
  } else if (componentCount === 4) {
    for (let i = 0; i < elementCount; i++) {
      const vec = accessor.getVec4(i, {});
      normalData[i * 4 + 0] = vec.x;
      normalData[i * 4 + 1] = vec.y;
      normalData[i * 4 + 2] = vec.z;
      normalData[i * 4 + 3] = vec.w;
    }
  } else {
    for (let i = 0; i < elementCount; i++) {
      normalData[i] = accessor.getScalar(i, {});
    }
  }
  for (let i = 0; i < elementCount; i++) {
    const offset = i * componentCount;
    let length = 0;
    for (let j = 0; j < componentCount; j++) {
      const value = normalData[offset + j];
      length += value * value;
    }
    length = Math.sqrt(length);
    if (length > 0) {
      for (let j = 0; j < componentCount; j++) {
        normalData[offset + j] /= length;
      }
    }
  }
  const arrayBuffer = normalData.buffer;
  const newBuffer = new Buffer({
    byteLength: arrayBuffer.byteLength,
    buffer: arrayBuffer,
    name: "NormalizedNormalsBuffer",
    byteAlign: 4,
    bufferUsage: BufferUse.CPUGeneric,
    indexOfTheBufferUsage: 0
  });
  const newBufferView = new BufferView({
    buffer: newBuffer,
    byteOffsetInBuffer: 0,
    defaultByteStride: 0,
    byteLength: normalData.byteLength,
    raw: arrayBuffer
  });
  const newAccessor = new Accessor({
    bufferView: newBufferView,
    byteOffsetInBufferView: 0,
    compositionType: accessor.compositionType,
    componentType: accessor.componentType,
    byteStride: 0,
    count: elementCount,
    raw: arrayBuffer,
    arrayLength: 1,
    normalized: false
  });
  return newAccessor;
}
function normalizeSkinWeights(accessor) {
  const componentCount = accessor.compositionType.getNumberOfComponents();
  const elementCount = accessor.elementCount;
  if (componentCount === 0 || elementCount === 0) {
    return accessor;
  }
  const treatAsNormalizedUnsignedInt = accessor.normalized && (accessor.componentType === ComponentType.UnsignedByte || accessor.componentType === ComponentType.UnsignedShort || accessor.componentType === ComponentType.UnsignedInt);
  const normalizationDenominator = treatAsNormalizedUnsignedInt ? getNormalizedUnsignedComponentMax(accessor.componentType) : 1;
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
function createGltf2BufferViewAndGltf2AccessorForInput(json, sampler, bufferIdx, bufferViewByteLengthAccumulated) {
  const componentType = ComponentType.fromTypedArray(
    ArrayBuffer.isView(sampler.input) ? sampler.input : new Float32Array(sampler.input)
  );
  const accessorCount = sampler.input.length;
  const gltf2BufferView = createGltf2BufferViewForAnimation({
    bufferIdx,
    bufferViewByteOffset: bufferViewByteLengthAccumulated,
    accessorByteOffset: 0,
    accessorCount,
    bufferViewByteStride: ComponentType.Float.getSizeInBytes(),
    componentType,
    compositionType: CompositionType.Scalar,
    uint8Array: new Uint8Array(
      ArrayBuffer.isView(sampler.input) ? sampler.input.buffer : new Float32Array(sampler.input).buffer
    )
  });
  json.bufferViews.push(gltf2BufferView);
  const gltf2Accessor = createGltf2AccessorForAnimation({
    bufferViewIdx: json.bufferViews.indexOf(gltf2BufferView),
    accessorByteOffset: 0,
    componentType,
    count: accessorCount,
    compositionType: CompositionType.Scalar,
    min: [sampler.input[0]],
    max: [sampler.input[sampler.input.length - 1]]
  });
  json.accessors.push(gltf2Accessor);
  bufferViewByteLengthAccumulated = alignBufferViewByteLength(bufferViewByteLengthAccumulated, gltf2BufferView);
  const inputAccessorIdx = json.accessors.indexOf(gltf2Accessor);
  return {
    inputAccessorIdx,
    inputBufferViewByteLengthAccumulated: bufferViewByteLengthAccumulated
  };
}
function createGltf2BufferViewAndGltf2AccessorForOutput(json, sampler, pathName, bufferIdx, bufferViewByteLengthAccumulated) {
  const componentType = ComponentType.fromTypedArray(
    ArrayBuffer.isView(sampler.output) ? sampler.output : new Float32Array(sampler.output)
  );
  const compositionType = pathName === "weights" ? CompositionType.Scalar : CompositionType.toGltf2AnimationAccessorCompositionType(sampler.outputComponentN);
  const accessorCount = pathName === "weights" ? sampler.output.length : sampler.output.length / sampler.outputComponentN;
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
    )
  });
  json.bufferViews.push(gltf2BufferView);
  const gltf2Accessor = createGltf2AccessorForAnimation({
    bufferViewIdx: json.bufferViews.indexOf(gltf2BufferView),
    accessorByteOffset: 0,
    componentType,
    count: accessorCount,
    compositionType
  });
  json.accessors.push(gltf2Accessor);
  bufferViewByteLengthAccumulated = alignBufferViewByteLength(bufferViewByteLengthAccumulated, gltf2BufferView);
  const outputAccessorIdx = json.accessors.indexOf(gltf2Accessor);
  return {
    outputAccessorIdx,
    outputBufferViewByteLengthAccumulated: bufferViewByteLengthAccumulated
  };
}
function createOrReuseGltf2BufferView(json, existingUniqueRnBuffers, existingUniqueRnBufferViews, rnBufferView, target) {
  const bufferViewIdx = findBufferViewIdx(existingUniqueRnBufferViews, rnBufferView);
  if (bufferViewIdx === -1) {
    const bufferIdxToSet = calcBufferIdxToSet(existingUniqueRnBuffers, rnBufferView.buffer);
    const gltf2BufferView2 = {
      buffer: bufferIdxToSet,
      byteLength: rnBufferView.byteLength,
      byteOffset: rnBufferView.byteOffsetInBuffer,
      extras: {
        uint8Array: rnBufferView.getUint8Array()
      }
    };
    if (Is.exist(target)) {
      gltf2BufferView2.target = target;
    }
    json.extras.bufferViewByteLengthAccumulatedArray[bufferIdxToSet] = accumulateBufferViewByteLength(
      json.extras.bufferViewByteLengthAccumulatedArray,
      bufferIdxToSet,
      gltf2BufferView2
    );
    existingUniqueRnBufferViews.push(rnBufferView);
    json.bufferViews.push(gltf2BufferView2);
    return gltf2BufferView2;
  }
  const gltf2BufferView = json.bufferViews[bufferViewIdx];
  return gltf2BufferView;
}
function createOrReuseGltf2Accessor(json, bufferViewIdxToSet, existingUniqueRnAccessors, rnAccessor) {
  const accessorIdx = calcAccessorIdxToSet(existingUniqueRnAccessors, rnAccessor);
  if (accessorIdx === -1) {
    const gltf2Accessor2 = {
      bufferView: bufferViewIdxToSet,
      byteOffset: rnAccessor.byteOffsetInBufferView,
      componentType: ComponentType.toGltf2AccessorComponentType(rnAccessor.componentType),
      count: rnAccessor.elementCount,
      type: CompositionType.toGltf2AccessorCompositionTypeString(
        rnAccessor.compositionType.getNumberOfComponents()
      ),
      extras: {
        uint8Array: void 0
      }
    };
    if (rnAccessor.compositionType.getNumberOfComponents() <= 4) {
      gltf2Accessor2.max = rnAccessor.max;
      gltf2Accessor2.min = rnAccessor.min;
    }
    existingUniqueRnAccessors.push(rnAccessor);
    json.accessors.push(gltf2Accessor2);
    return gltf2Accessor2;
  }
  const gltf2Accessor = json.accessors[accessorIdx];
  return gltf2Accessor;
}
var exportTangentAccessorCache = /* @__PURE__ */ new WeakMap();
function getExportTangentAccessorForPrimitive(primitive) {
  if (exportTangentAccessorCache.has(primitive)) {
    return exportTangentAccessorCache.get(primitive);
  }
  let accessor;
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
function createNormalizedTangentAccessor(source, normalAccessor) {
  const count = source.elementCount;
  const accessor = createTemporaryVec4Accessor(count);
  for (let i = 0; i < count; i++) {
    const tangent = source.getVec4(i, {});
    const normal = normalAccessor == null ? void 0 : normalAccessor.getVec3(i, {});
    const normalized = normalizeTangentVector(
      { x: tangent.x, y: tangent.y, z: tangent.z, w: tangent.w },
      normal ? { x: normal.x, y: normal.y, z: normal.z } : void 0
    );
    accessor.setVec4(i, normalized.x, normalized.y, normalized.z, normalized.w, {});
  }
  return accessor;
}
function createComputedTangentAccessor(primitive, normalAccessor) {
  const positionAccessor = primitive.getAttribute(VertexAttribute.Position.XYZ);
  if (Is.not.exist(positionAccessor)) {
    return void 0;
  }
  const texcoordAccessor = findPrimaryTexcoordAccessor(primitive);
  if (Is.not.exist(texcoordAccessor)) {
    return void 0;
  }
  const vertexCount = positionAccessor.elementCount;
  if (vertexCount === 0) {
    return void 0;
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
  const extractIndex = (i) => indicesAccessor ? indicesAccessor.getScalar(i, {}) : i;
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
    const r = 1 / denom;
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
      w: 1
    };
    const bitangent = {
      x: bitangentSums[vertexIndex * 3 + 0],
      y: bitangentSums[vertexIndex * 3 + 1],
      z: bitangentSums[vertexIndex * 3 + 2]
    };
    const normal = normalAccessor == null ? void 0 : normalAccessor.getVec3(vertexIndex, {});
    const normalized = normalizeTangentVector(
      tangent,
      normal ? { x: normal.x, y: normal.y, z: normal.z } : void 0,
      bitangent
    );
    accessor.setVec4(vertexIndex, normalized.x, normalized.y, normalized.z, normalized.w, {});
  }
  return accessor;
}
function createOrReuseGltf2BufferViewForVertexAttributeBuffer(json, existingUniqueRnBuffers, existingUniqueRnBufferViews, rnBufferView, rnAccessor) {
  var _a;
  const bufferViewIdx = findBufferViewIdx(existingUniqueRnBufferViews, rnBufferView);
  if (bufferViewIdx === -1) {
    const bufferIdxToSet = calcBufferIdxToSet(existingUniqueRnBuffers, rnBufferView.buffer);
    const gltf2BufferView2 = {
      buffer: bufferIdxToSet,
      byteLength: rnBufferView.byteLength,
      byteOffset: rnBufferView.byteOffsetInBuffer,
      extras: {
        uint8Array: rnBufferView.getUint8Array()
      }
    };
    gltf2BufferView2.target = GL_ARRAY_BUFFER;
    const resolvedByteStride2 = resolveVertexAttributeByteStride(rnBufferView, rnAccessor);
    if (Is.exist(resolvedByteStride2)) {
      gltf2BufferView2.byteStride = resolvedByteStride2;
    }
    json.extras.bufferViewByteLengthAccumulatedArray[bufferIdxToSet] = accumulateBufferViewByteLength(
      json.extras.bufferViewByteLengthAccumulatedArray,
      bufferIdxToSet,
      gltf2BufferView2
    );
    existingUniqueRnBufferViews.push(rnBufferView);
    json.bufferViews.push(gltf2BufferView2);
    return gltf2BufferView2;
  }
  const gltf2BufferView = json.bufferViews[bufferViewIdx];
  const resolvedByteStride = resolveVertexAttributeByteStride(rnBufferView, rnAccessor);
  if (Is.exist(resolvedByteStride)) {
    const currentStride = (_a = gltf2BufferView.byteStride) != null ? _a : 0;
    if (currentStride === 0 || currentStride < resolvedByteStride) {
      gltf2BufferView.byteStride = resolvedByteStride;
    }
  }
  return gltf2BufferView;
}
function doesRhodoniteMaterialRequireTangents(material) {
  if (Is.not.exist(material)) {
    return false;
  }
  const normalTextureParam = material.getTextureParameter("normalTexture");
  if (Is.exist(normalTextureParam == null ? void 0 : normalTextureParam[1])) {
    return true;
  }
  const clearcoatNormalTextureParam = material.getTextureParameter("clearcoatNormalTexture");
  return Is.exist(clearcoatNormalTextureParam == null ? void 0 : clearcoatNormalTextureParam[1]);
}
function setupBlendShapeData(entity, rnPrimitive, primitive, json, existingUniqueRnBuffers, existingUniqueRnBufferViews, existingUniqueRnAccessors) {
  var _a;
  const blendShapeComponent = entity.tryToGetBlendShape();
  if (Is.exist(blendShapeComponent)) {
    const targets = rnPrimitive.getBlendShapeTargets();
    if (Is.not.exist(primitive.targets)) {
      primitive.targets = [];
    }
    const targetNames = blendShapeComponent.targetNames;
    if (targets.length > 0) {
      const limitedTargetNames = targets.map((_, idx) => {
        var _a2;
        return (_a2 = targetNames[idx]) != null ? _a2 : `MorphTarget_${idx}`;
      });
      primitive.extras = (_a = primitive.extras) != null ? _a : {};
      primitive.extras.targetNames = limitedTargetNames;
    }
    for (const target of targets) {
      const targetJson = {};
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
        const attribute = attributeJoinedString.split(".")[0];
        targetJson[attribute] = accessorIdx;
      }
      primitive.targets.push(targetJson);
    }
  }
}
async function handleTextureImage(json, bufferIdx, blob, option, glTF2ImageEx, resolve, rejected, gltf2ExportType = "glTF") {
  if (option.type === gltf2ExportType) {
    setTimeout(() => {
      const a = document.createElement("a");
      const e = new MouseEvent("click");
      a.href = URL.createObjectURL(blob);
      a.download = glTF2ImageEx.uri;
      a.dispatchEvent(e);
      URL.revokeObjectURL(a.href);
    }, Math.random() * 5e3);
    resolve();
  } else {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const arrayBuffer = reader.result;
      const gltf2BufferView = createAndAddGltf2BufferView(
        json,
        bufferIdx,
        new Uint8ClampedArray(arrayBuffer)
      );
      glTF2ImageEx.bufferView = json.bufferViews.indexOf(gltf2BufferView);
      glTF2ImageEx.mimeType = "image/png";
      glTF2ImageEx.uri = void 0;
      resolve();
    });
    reader.addEventListener("error", () => {
      rejected(reader.error);
    });
    reader.readAsArrayBuffer(blob);
  }
}
function __createBufferViewsAndAccessorsOfSkin(json, entities, existingUniqueRnBuffers, existingUniqueRnBufferViews, existingUniqueRnAccessors) {
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    const skeletalComponent = entity.tryToGetSkeletal();
    if (Is.not.exist(skeletalComponent)) {
      continue;
    }
    json.extras.rnSkins.push(skeletalComponent.entity);
    const jointSceneComponentsOfTheEntity = skeletalComponent.getJoints();
    const jointIndicesOfTheEntity = [];
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
      const skeletalEntity = topOfJointsSkeletonSceneComponent.entity;
      skeletalIdx = entities.indexOf(skeletalEntity);
    } else {
      skeletalIdx = jointIndicesOfTheEntity[0];
    }
    const skinJson = {
      joints: jointIndicesOfTheEntity,
      inverseBindMatrices: json.accessors.length - 1,
      skeleton: skeletalIdx >= 0 ? skeletalIdx : void 0,
      bindShapeMatrix: bindShapeMatrix == null ? void 0 : bindShapeMatrix.flattenAsArray()
    };
    json.skins.push(skinJson);
  }
}
function __createBufferViewsAndAccessorsOfMesh(json, entities, existingUniqueRnBuffers, existingUniqueRnBufferViews, existingUniqueRnAccessors) {
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    const meshComponent = entity.tryToGetMesh();
    if (Is.exist(meshComponent) && meshComponent.mesh) {
      const mesh = { primitives: [] };
      const rnMesh = meshComponent.mesh;
      const primitiveCount = rnMesh.getPrimitiveNumber();
      for (let j = 0; j < primitiveCount; j++) {
        const rnPrimitive = rnMesh.getPrimitiveAt(j);
        const primitive = {
          attributes: {},
          mode: rnPrimitive.primitiveMode.index
        };
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
        const exportAttributeSemantics = rnPrimitive.attributeSemantics.concat();
        const exportAttributeAccessors = rnPrimitive.attributeAccessors.concat();
        const needsTangents = doesRhodoniteMaterialRequireTangents(rnPrimitive.material);
        if (needsTangents) {
          const tangentSemanticIndex = exportAttributeSemantics.findIndex((semantic) => semantic.startsWith("TANGENT"));
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
          const attributeJoinedString = exportAttributeSemantics[attrIndex];
          const attributeName = attributeJoinedString.split(".")[0];
          if (attributeName === "BARY_CENTRIC_COORD") {
            continue;
          }
          const rnAttributeAccessor = exportAttributeAccessors[attrIndex];
          let normalizedAccessor = rnAttributeAccessor;
          if (attributeName === "NORMAL") {
            normalizedAccessor = normalizeNormals(rnAttributeAccessor);
          } else if (attributeName === "WEIGHTS_0") {
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
function __createBufferViewsAndAccessorsOfAnimation(json, entities, options) {
  var _a;
  let sumOfBufferViewByteLengthAccumulated = 0;
  const bufferIdx = json.extras.bufferViewByteLengthAccumulatedArray.length;
  const animationRegistry = /* @__PURE__ */ new Map();
  const acquireAnimation = (trackName) => {
    let entry = animationRegistry.get(trackName);
    if (Is.not.exist(entry)) {
      const animation = {
        name: trackName,
        channels: [],
        samplers: []
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
        if (rnChannel.target.pathName === "effekseer") {
          continue;
        }
        const animatedValue = rnChannel.animatedValue;
        const trackNames = animatedValue.getAllTrackNames();
        for (const trackName of trackNames) {
          const targetOverride = (_a = options == null ? void 0 : options.resolveAnimationTarget) == null ? void 0 : _a.call(options, {
            channel: rnChannel,
            entityIdx: i,
            trackName
          });
          if (targetOverride === null) {
            continue;
          }
          const animationEntry = acquireAnimation(trackName);
          const animation = animationEntry.animation;
          const { inputAccessorIdx, inputBufferViewByteLengthAccumulated } = createGltf2BufferViewAndGltf2AccessorForInput(
            json,
            animatedValue.getAnimationSampler(trackName),
            bufferIdx,
            sumOfBufferViewByteLengthAccumulated
          );
          sumOfBufferViewByteLengthAccumulated += inputBufferViewByteLengthAccumulated;
          const { outputAccessorIdx, outputBufferViewByteLengthAccumulated } = createGltf2BufferViewAndGltf2AccessorForOutput(
            json,
            animatedValue.getAnimationSampler(trackName),
            rnChannel.target.pathName,
            bufferIdx,
            sumOfBufferViewByteLengthAccumulated
          );
          sumOfBufferViewByteLengthAccumulated += outputBufferViewByteLengthAccumulated;
          animationEntry.samplerIdx = createGltf2AnimationChannel(
            rnChannel,
            animationEntry.samplerIdx,
            animation,
            i,
            targetOverride != null ? targetOverride : void 0
          );
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
function __deleteEmptyArrays(json) {
  if (json.accessors.length === 0) {
    json.accessors = void 0;
  }
  if (json.bufferViews.length === 0) {
    json.bufferViews = void 0;
  }
  if (json.materials.length === 0) {
    json.materials = void 0;
  }
  if (json.meshes.length === 0) {
    json.meshes = void 0;
  }
  if (json.skins.length === 0) {
    json.skins = void 0;
  }
  if (json.textures.length === 0) {
    json.textures = void 0;
  }
  if (json.images.length === 0) {
    json.images = void 0;
  }
  if (json.samplers.length === 0) {
    json.samplers = void 0;
  }
  if (json.animations.length === 0) {
    json.animations = void 0;
  }
  if (Is.exist(json.extensionsUsed) && json.extensionsUsed.length === 0) {
    json.extensionsUsed = void 0;
  }
  if (json.cameras.length === 0) {
    json.cameras = void 0;
  }
  json.extras = void 0;
}
function __extractScalarParameter(value) {
  if (value == null) {
    return void 0;
  }
  if (typeof value === "number") {
    return value;
  }
  const candidateWithX = value == null ? void 0 : value.x;
  if (typeof candidateWithX === "number") {
    return candidateWithX;
  }
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "number") {
    return value[0];
  }
  if (ArrayBuffer.isView(value)) {
    const view = value;
    if (isNumericArrayBufferView(view) && view.length > 0) {
      return view[0];
    }
  }
  const internal = value._v;
  if (Array.isArray(internal) && internal.length > 0 && typeof internal[0] === "number") {
    return internal[0];
  }
  if (ArrayBuffer.isView(internal)) {
    const view = internal;
    if (isNumericArrayBufferView(view) && view.length > 0) {
      return view[0];
    }
  }
  return void 0;
}
function __doesMaterialRequireTangents(material) {
  if (Is.exist(material.normalTexture)) {
    return true;
  }
  const extensions = material.extensions;
  const clearcoatExtension = extensions == null ? void 0 : extensions.KHR_materials_clearcoat;
  if (Is.exist(clearcoatExtension == null ? void 0 : clearcoatExtension.clearcoatNormalTexture)) {
    return true;
  }
  const anisotropyExtension = extensions == null ? void 0 : extensions.KHR_materials_anisotropy;
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
function __collectUsedTexCoordSetIndices(material) {
  const usedTexCoords = /* @__PURE__ */ new Set();
  const registerTexcoord = (info) => {
    if (Is.not.exist(info) || typeof info.index !== "number") {
      return;
    }
    const texCoord = typeof info.texCoord === "number" ? info.texCoord : 0;
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
  const extensions = material.extensions;
  const clearcoatExtension = extensions == null ? void 0 : extensions.KHR_materials_clearcoat;
  if (Is.exist(clearcoatExtension)) {
    registerTexcoord(clearcoatExtension.clearcoatTexture);
    registerTexcoord(clearcoatExtension.clearcoatRoughnessTexture);
    registerTexcoord(clearcoatExtension.clearcoatNormalTexture);
  }
  const diffuseTransmissionExtension = extensions == null ? void 0 : extensions.KHR_materials_diffuse_transmission;
  if (Is.exist(diffuseTransmissionExtension)) {
    registerTexcoord(diffuseTransmissionExtension.diffuseTransmissionTexture);
    registerTexcoord(diffuseTransmissionExtension.diffuseTransmissionColorTexture);
  }
  const specularExtension = extensions == null ? void 0 : extensions.KHR_materials_specular;
  if (Is.exist(specularExtension)) {
    registerTexcoord(specularExtension.specularTexture);
    registerTexcoord(specularExtension.specularColorTexture);
  }
  const transmissionExtension = extensions == null ? void 0 : extensions.KHR_materials_transmission;
  if (Is.exist(transmissionExtension)) {
    registerTexcoord(transmissionExtension.transmissionTexture);
  }
  const volumeExtension = extensions == null ? void 0 : extensions.KHR_materials_volume;
  if (Is.exist(volumeExtension)) {
    registerTexcoord(volumeExtension.thicknessTexture);
  }
  const sheenExtension = extensions == null ? void 0 : extensions.KHR_materials_sheen;
  if (Is.exist(sheenExtension)) {
    registerTexcoord(sheenExtension.sheenColorTexture);
    registerTexcoord(sheenExtension.sheenRoughnessTexture);
  }
  const iridescenceExtension = extensions == null ? void 0 : extensions.KHR_materials_iridescence;
  if (Is.exist(iridescenceExtension)) {
    registerTexcoord(iridescenceExtension.iridescenceTexture);
    registerTexcoord(iridescenceExtension.iridescenceThicknessTexture);
  }
  const anisotropyExtension = extensions == null ? void 0 : extensions.KHR_materials_anisotropy;
  if (Is.exist(anisotropyExtension)) {
    registerTexcoord(anisotropyExtension.anisotropyTexture);
  }
  return usedTexCoords;
}
function __pruneUnusedVertexAttributes(primitive, material) {
  var _a;
  if (((_a = material.extensions) == null ? void 0 : _a.RHODONITE_materials_node) != null) {
    return;
  }
  const attributes = primitive.attributes;
  if (!__doesMaterialRequireTangents(material) && Is.exist(attributes.TANGENT)) {
    attributes.TANGENT = void 0;
  }
  const usedTexCoords = __collectUsedTexCoordSetIndices(material);
  if (usedTexCoords.size === 0) {
    for (const attributeName of Object.keys(attributes)) {
      if (attributeName.startsWith("TEXCOORD_")) {
        delete attributes[attributeName];
      }
    }
    return;
  }
  for (const attributeName of Object.keys(attributes)) {
    if (!attributeName.startsWith("TEXCOORD_")) {
      continue;
    }
    const texCoordIndex = Number(attributeName.substring("TEXCOORD_".length));
    if (Number.isNaN(texCoordIndex) || !usedTexCoords.has(texCoordIndex)) {
      delete attributes[attributeName];
    }
  }
}
function __outputKhrMaterialsEmissiveStrengthInfo(ensureExtensionUsed, coerceNumber, rnMaterial, material) {
  var _a, _b;
  if (Is.false(rnMaterial.isLighting)) {
    return;
  }
  if ((_a = material.extensions) == null ? void 0 : _a.KHR_materials_unlit) {
    return;
  }
  const rawStrength = coerceNumber(rnMaterial.getParameter("emissiveStrength"));
  if (Is.not.exist(rawStrength)) {
    return;
  }
  const emissiveStrength = Math.max(0, rawStrength);
  if (!Number.isFinite(emissiveStrength) || emissiveStrength === 1) {
    return;
  }
  material.extensions = (_b = material.extensions) != null ? _b : {};
  material.extensions.KHR_materials_emissive_strength = {
    emissiveStrength
  };
  ensureExtensionUsed("KHR_materials_emissive_strength");
}
function __outputKhrMaterialsDiffuseTransmissionInfo(ensureExtensionUsed, coerceNumber, coerceVec3, rnMaterial, applyTexture, material) {
  var _a;
  const diffuseTransmissionExtension = {};
  let diffuseTransmissionExtensionUsed = false;
  const markDiffuseTransmissionExtensionUsed = () => {
    if (!diffuseTransmissionExtensionUsed) {
      diffuseTransmissionExtensionUsed = true;
      ensureExtensionUsed("KHR_materials_diffuse_transmission");
    }
  };
  const diffuseTransmissionFactor = coerceNumber(rnMaterial.getParameter("diffuseTransmissionFactor"));
  if (Is.exist(diffuseTransmissionFactor)) {
    diffuseTransmissionExtension.diffuseTransmissionFactor = diffuseTransmissionFactor;
    if (diffuseTransmissionFactor !== 0) {
      markDiffuseTransmissionExtensionUsed();
    }
  }
  applyTexture("diffuseTransmissionTexture", {
    texCoordParam: "diffuseTransmissionTexcoordIndex",
    transform: {
      scale: "diffuseTransmissionTextureTransformScale",
      offset: "diffuseTransmissionTextureTransformOffset",
      rotation: "diffuseTransmissionTextureTransformRotation"
    },
    onAssign: (info) => {
      diffuseTransmissionExtension.diffuseTransmissionTexture = info;
      markDiffuseTransmissionExtensionUsed();
    }
  });
  const diffuseTransmissionColorFactor = coerceVec3(rnMaterial.getParameter("diffuseTransmissionColorFactor"));
  if (Is.exist(diffuseTransmissionColorFactor)) {
    diffuseTransmissionExtension.diffuseTransmissionColorFactor = diffuseTransmissionColorFactor;
    if (diffuseTransmissionColorFactor[0] !== 1 || diffuseTransmissionColorFactor[1] !== 1 || diffuseTransmissionColorFactor[2] !== 1) {
      markDiffuseTransmissionExtensionUsed();
    }
  }
  applyTexture("diffuseTransmissionColorTexture", {
    texCoordParam: "diffuseTransmissionColorTexcoordIndex",
    transform: {
      scale: "diffuseTransmissionColorTextureTransformScale",
      offset: "diffuseTransmissionColorTextureTransformOffset",
      rotation: "diffuseTransmissionColorTextureTransformRotation"
    },
    onAssign: (info) => {
      diffuseTransmissionExtension.diffuseTransmissionColorTexture = info;
      markDiffuseTransmissionExtensionUsed();
    }
  });
  const shouldAttachDiffuseTransmissionExtension = diffuseTransmissionExtensionUsed || Is.exist(diffuseTransmissionExtension.diffuseTransmissionTexture) || Is.exist(diffuseTransmissionExtension.diffuseTransmissionColorTexture);
  if (shouldAttachDiffuseTransmissionExtension) {
    material.extensions = (_a = material.extensions) != null ? _a : {};
    material.extensions.KHR_materials_diffuse_transmission = diffuseTransmissionExtension;
    ensureExtensionUsed("KHR_materials_diffuse_transmission");
  }
}
function __outputKhrMaterialsTransmissionInfo(ensureExtensionUsed, coerceNumber, rnMaterial, applyTexture, material) {
  var _a;
  const transmissionExtension = {};
  let transmissionExtensionUsed = false;
  const markTransmissionExtensionUsed = () => {
    if (!transmissionExtensionUsed) {
      transmissionExtensionUsed = true;
      ensureExtensionUsed("KHR_materials_transmission");
    }
  };
  const transmissionFactor = coerceNumber(rnMaterial.getParameter("transmissionFactor"));
  if (Is.exist(transmissionFactor)) {
    transmissionExtension.transmissionFactor = transmissionFactor;
    if (transmissionFactor !== 0) {
      markTransmissionExtensionUsed();
    }
  }
  applyTexture("transmissionTexture", {
    texCoordParam: "transmissionTexcoordIndex",
    transform: {
      scale: "transmissionTextureTransformScale",
      offset: "transmissionTextureTransformOffset",
      rotation: "transmissionTextureTransformRotation"
    },
    onAssign: (info) => {
      transmissionExtension.transmissionTexture = info;
      markTransmissionExtensionUsed();
    }
  });
  const shouldAttachTransmissionExtension = transmissionExtensionUsed || Is.exist(transmissionExtension.transmissionTexture);
  if (shouldAttachTransmissionExtension) {
    material.extensions = (_a = material.extensions) != null ? _a : {};
    material.extensions.KHR_materials_transmission = transmissionExtension;
    ensureExtensionUsed("KHR_materials_transmission");
  }
}
function __outputKhrMaterialsVolumeInfo(ensureExtensionUsed, coerceNumber, coerceVec3, rnMaterial, applyTexture, material) {
  var _a;
  const volumeExtension = {};
  let volumeExtensionUsed = false;
  const markVolumeExtensionUsed = () => {
    if (!volumeExtensionUsed) {
      volumeExtensionUsed = true;
      ensureExtensionUsed("KHR_materials_volume");
    }
  };
  const thicknessFactor = coerceNumber(rnMaterial.getParameter("thicknessFactor"));
  if (Is.exist(thicknessFactor)) {
    volumeExtension.thicknessFactor = thicknessFactor;
    if (thicknessFactor !== 0) {
      markVolumeExtensionUsed();
    }
  }
  applyTexture("thicknessTexture", {
    texCoordParam: "thicknessTexcoordIndex",
    transform: {
      scale: "thicknessTextureTransformScale",
      offset: "thicknessTextureTransformOffset",
      rotation: "thicknessTextureTransformRotation"
    },
    onAssign: (info) => {
      volumeExtension.thicknessTexture = info;
      markVolumeExtensionUsed();
    }
  });
  const attenuationDistance = coerceNumber(rnMaterial.getParameter("attenuationDistance"));
  if (Is.exist(attenuationDistance) && attenuationDistance > 0) {
    volumeExtension.attenuationDistance = attenuationDistance;
    markVolumeExtensionUsed();
  }
  const attenuationColor = coerceVec3(rnMaterial.getParameter("attenuationColor"));
  if (Is.exist(attenuationColor)) {
    volumeExtension.attenuationColor = attenuationColor;
    if (attenuationColor.some((v) => v !== 1)) {
      markVolumeExtensionUsed();
    }
  }
  const shouldAttachVolumeExtension = volumeExtensionUsed || Is.exist(volumeExtension.thicknessTexture) || Is.exist(volumeExtension.thicknessFactor) && volumeExtension.thicknessFactor !== 0 || Is.exist(volumeExtension.attenuationDistance) && volumeExtension.attenuationDistance !== 0 || Is.exist(volumeExtension.attenuationColor) && volumeExtension.attenuationColor.some((v) => v !== 1);
  if (shouldAttachVolumeExtension) {
    material.extensions = (_a = material.extensions) != null ? _a : {};
    material.extensions.KHR_materials_volume = volumeExtension;
    ensureExtensionUsed("KHR_materials_volume");
  }
}
function __outputKhrMaterialsIorInfo(ensureExtensionUsed, coerceNumber, rnMaterial, material) {
  var _a;
  const rawIor = coerceNumber(rnMaterial.getParameter("ior"));
  if (Is.not.exist(rawIor)) {
    return;
  }
  const clampedIor = Math.max(1, rawIor);
  const defaultIor = 1.5;
  if (Math.abs(clampedIor - defaultIor) < 1e-6) {
    return;
  }
  material.extensions = (_a = material.extensions) != null ? _a : {};
  material.extensions.KHR_materials_ior = {
    ior: clampedIor
  };
  ensureExtensionUsed("KHR_materials_ior");
}
function __outputKhrMaterialsClearcoatInfo(ensureExtensionUsed, coerceNumber, rnMaterial, applyTexture, material) {
  var _a;
  const clearcoatExtension = {};
  let clearcoatExtensionUsed = false;
  const markClearcoatExtensionUsed = () => {
    if (!clearcoatExtensionUsed) {
      clearcoatExtensionUsed = true;
      ensureExtensionUsed("KHR_materials_clearcoat");
    }
  };
  const clearcoatFactor = coerceNumber(rnMaterial.getParameter("clearcoatFactor"));
  if (Is.exist(clearcoatFactor)) {
    clearcoatExtension.clearcoatFactor = clearcoatFactor;
    if (clearcoatFactor !== 0) {
      markClearcoatExtensionUsed();
    }
  }
  const clearcoatRoughnessFactor = coerceNumber(rnMaterial.getParameter("clearcoatRoughnessFactor"));
  if (Is.exist(clearcoatRoughnessFactor)) {
    clearcoatExtension.clearcoatRoughnessFactor = clearcoatRoughnessFactor;
    if (clearcoatRoughnessFactor !== 0) {
      markClearcoatExtensionUsed();
    }
  }
  applyTexture("clearcoatTexture", {
    texCoordParam: "clearcoatTexcoordIndex",
    transform: {
      scale: "clearcoatTextureTransformScale",
      offset: "clearcoatTextureTransformOffset",
      rotation: "clearcoatTextureTransformRotation"
    },
    onAssign: (info) => {
      clearcoatExtension.clearcoatTexture = info;
      markClearcoatExtensionUsed();
    }
  });
  applyTexture("clearcoatRoughnessTexture", {
    texCoordParam: "clearcoatRoughnessTexcoordIndex",
    transform: {
      scale: "clearcoatRoughnessTextureTransformScale",
      offset: "clearcoatRoughnessTextureTransformOffset",
      rotation: "clearcoatRoughnessTextureTransformRotation"
    },
    onAssign: (info) => {
      clearcoatExtension.clearcoatRoughnessTexture = info;
      markClearcoatExtensionUsed();
    }
  });
  applyTexture("clearcoatNormalTexture", {
    texCoordParam: "clearcoatNormalTexcoordIndex",
    transform: {
      scale: "clearcoatNormalTextureTransformScale",
      offset: "clearcoatNormalTextureTransformOffset",
      rotation: "clearcoatNormalTextureTransformRotation"
    },
    onAssign: (info) => {
      var _a2;
      const clearcoatNormalScale = (_a2 = coerceNumber(rnMaterial.getParameter("clearcoatNormalScale"))) != null ? _a2 : coerceNumber(rnMaterial.getParameter("clearcoatNormalTextureScale"));
      if (Is.exist(clearcoatNormalScale)) {
        info.scale = clearcoatNormalScale;
      }
      clearcoatExtension.clearcoatNormalTexture = info;
      markClearcoatExtensionUsed();
    }
  });
  const shouldAttachClearcoatExtension = clearcoatExtensionUsed || Is.exist(clearcoatExtension.clearcoatTexture) || Is.exist(clearcoatExtension.clearcoatRoughnessTexture) || Is.exist(clearcoatExtension.clearcoatNormalTexture);
  if (shouldAttachClearcoatExtension) {
    material.extensions = (_a = material.extensions) != null ? _a : {};
    material.extensions.KHR_materials_clearcoat = clearcoatExtension;
    ensureExtensionUsed("KHR_materials_clearcoat");
  }
}
function __outputKhrMaterialsSheenInfo(ensureExtensionUsed, coerceNumber, coerceVec3, rnMaterial, applyTexture, material) {
  var _a;
  const sheenExtension = {};
  let sheenExtensionUsed = false;
  const markSheenExtensionUsed = () => {
    if (!sheenExtensionUsed) {
      sheenExtensionUsed = true;
      ensureExtensionUsed("KHR_materials_sheen");
    }
  };
  const sheenColorFactor = coerceVec3(rnMaterial.getParameter("sheenColorFactor"));
  if (Is.exist(sheenColorFactor)) {
    sheenExtension.sheenColorFactor = sheenColorFactor;
    if (sheenColorFactor.some((v) => v !== 0)) {
      markSheenExtensionUsed();
    }
  }
  const sheenRoughnessFactor = coerceNumber(rnMaterial.getParameter("sheenRoughnessFactor"));
  if (Is.exist(sheenRoughnessFactor)) {
    sheenExtension.sheenRoughnessFactor = sheenRoughnessFactor;
    if (sheenRoughnessFactor !== 0) {
      markSheenExtensionUsed();
    }
  }
  applyTexture("sheenColorTexture", {
    texCoordParam: "sheenColorTexcoordIndex",
    transform: {
      scale: "sheenColorTextureTransformScale",
      offset: "sheenColorTextureTransformOffset",
      rotation: "sheenColorTextureTransformRotation"
    },
    onAssign: (info) => {
      sheenExtension.sheenColorTexture = info;
      markSheenExtensionUsed();
    }
  });
  applyTexture("sheenRoughnessTexture", {
    texCoordParam: "sheenRoughnessTexcoordIndex",
    transform: {
      scale: "sheenRoughnessTextureTransformScale",
      offset: "sheenRoughnessTextureTransformOffset",
      rotation: "sheenRoughnessTextureTransformRotation"
    },
    onAssign: (info) => {
      sheenExtension.sheenRoughnessTexture = info;
      markSheenExtensionUsed();
    }
  });
  const shouldAttachSheenExtension = sheenExtensionUsed || Is.exist(sheenExtension.sheenColorTexture) || Is.exist(sheenExtension.sheenRoughnessTexture);
  if (shouldAttachSheenExtension) {
    material.extensions = (_a = material.extensions) != null ? _a : {};
    material.extensions.KHR_materials_sheen = sheenExtension;
    ensureExtensionUsed("KHR_materials_sheen");
  }
}
function __outputKhrMaterialsSpecularInfo(ensureExtensionUsed, coerceNumber, coerceVec3, rnMaterial, applyTexture, material) {
  var _a;
  const specularExtension = {};
  let specularExtensionUsed = false;
  const markSpecularExtensionUsed = () => {
    if (!specularExtensionUsed) {
      specularExtensionUsed = true;
      ensureExtensionUsed("KHR_materials_specular");
    }
  };
  const specularFactor = coerceNumber(rnMaterial.getParameter("specularFactor"));
  if (Is.exist(specularFactor) && specularFactor !== 1) {
    specularExtension.specularFactor = specularFactor;
    markSpecularExtensionUsed();
  }
  const specularColorFactor = coerceVec3(rnMaterial.getParameter("specularColorFactor"));
  if (Is.exist(specularColorFactor) && specularColorFactor.some((v) => v !== 1)) {
    specularExtension.specularColorFactor = specularColorFactor;
    markSpecularExtensionUsed();
  }
  applyTexture("specularTexture", {
    texCoordParam: "specularTexcoordIndex",
    transform: {
      scale: "specularTextureTransformScale",
      offset: "specularTextureTransformOffset",
      rotation: "specularTextureTransformRotation"
    },
    onAssign: (info) => {
      specularExtension.specularTexture = info;
      markSpecularExtensionUsed();
    }
  });
  applyTexture("specularColorTexture", {
    texCoordParam: "specularColorTexcoordIndex",
    transform: {
      scale: "specularColorTextureTransformScale",
      offset: "specularColorTextureTransformOffset",
      rotation: "specularColorTextureTransformRotation"
    },
    onAssign: (info) => {
      specularExtension.specularColorTexture = info;
      markSpecularExtensionUsed();
    }
  });
  const shouldAttachSpecularExtension = specularExtensionUsed || Is.exist(specularExtension.specularTexture) || Is.exist(specularExtension.specularColorTexture) || Is.exist(specularExtension.specularFactor) || Is.exist(specularExtension.specularColorFactor);
  if (shouldAttachSpecularExtension) {
    material.extensions = (_a = material.extensions) != null ? _a : {};
    material.extensions.KHR_materials_specular = specularExtension;
    ensureExtensionUsed("KHR_materials_specular");
  }
}
function __outputKhrMaterialsIridescenceInfo(ensureExtensionUsed, coerceNumber, rnMaterial, applyTexture, material) {
  var _a;
  const iridescenceExtension = {};
  let iridescenceExtensionUsed = false;
  const markIridescenceExtensionUsed = () => {
    if (!iridescenceExtensionUsed) {
      iridescenceExtensionUsed = true;
      ensureExtensionUsed("KHR_materials_iridescence");
    }
  };
  const defaultFactor = 0;
  const factor = coerceNumber(rnMaterial.getParameter("iridescenceFactor"));
  if (Is.exist(factor)) {
    iridescenceExtension.iridescenceFactor = factor;
    if (Math.abs(factor - defaultFactor) > 1e-6) {
      markIridescenceExtensionUsed();
    }
  }
  applyTexture("iridescenceTexture", {
    texCoordParam: "iridescenceTexcoordIndex",
    transform: {
      scale: "iridescenceTextureTransformScale",
      offset: "iridescenceTextureTransformOffset",
      rotation: "iridescenceTextureTransformRotation"
    },
    onAssign: (info) => {
      iridescenceExtension.iridescenceTexture = info;
      markIridescenceExtensionUsed();
    }
  });
  const defaultIor = 1.3;
  const rawIor = coerceNumber(rnMaterial.getParameter("iridescenceIor"));
  if (Is.exist(rawIor)) {
    const clampedIor = Math.max(1, rawIor);
    iridescenceExtension.iridescenceIor = clampedIor;
    if (Math.abs(clampedIor - defaultIor) > 1e-6) {
      markIridescenceExtensionUsed();
    }
  }
  const defaultThicknessMinimum = 100;
  const thicknessMinimum = coerceNumber(rnMaterial.getParameter("iridescenceThicknessMinimum"));
  if (Is.exist(thicknessMinimum)) {
    iridescenceExtension.iridescenceThicknessMinimum = thicknessMinimum;
    if (Math.abs(thicknessMinimum - defaultThicknessMinimum) > 1e-6) {
      markIridescenceExtensionUsed();
    }
  }
  const defaultThicknessMaximum = 400;
  const thicknessMaximum = coerceNumber(rnMaterial.getParameter("iridescenceThicknessMaximum"));
  if (Is.exist(thicknessMaximum)) {
    iridescenceExtension.iridescenceThicknessMaximum = thicknessMaximum;
    if (Math.abs(thicknessMaximum - defaultThicknessMaximum) > 1e-6) {
      markIridescenceExtensionUsed();
    }
  }
  applyTexture("iridescenceThicknessTexture", {
    texCoordParam: "iridescenceThicknessTexcoordIndex",
    transform: {
      scale: "iridescenceThicknessTextureTransformScale",
      offset: "iridescenceThicknessTextureTransformOffset",
      rotation: "iridescenceThicknessTextureTransformRotation"
    },
    onAssign: (info) => {
      iridescenceExtension.iridescenceThicknessTexture = info;
      markIridescenceExtensionUsed();
    }
  });
  const shouldAttachIridescenceExtension = iridescenceExtensionUsed || Is.exist(iridescenceExtension.iridescenceTexture) || Is.exist(iridescenceExtension.iridescenceThicknessTexture);
  if (shouldAttachIridescenceExtension) {
    material.extensions = (_a = material.extensions) != null ? _a : {};
    material.extensions.KHR_materials_iridescence = iridescenceExtension;
    ensureExtensionUsed("KHR_materials_iridescence");
  }
}
function __outputKhrMaterialsAnisotropyInfo(ensureExtensionUsed, coerceNumber, coerceVec2, rnMaterial, applyTexture, material) {
  var _a;
  const anisotropyExtension = {};
  let anisotropyExtensionUsed = false;
  const markAnisotropyExtensionUsed = () => {
    if (!anisotropyExtensionUsed) {
      anisotropyExtensionUsed = true;
      ensureExtensionUsed("KHR_materials_anisotropy");
    }
  };
  const anisotropyStrength = coerceNumber(rnMaterial.getParameter("anisotropyStrength"));
  if (Is.exist(anisotropyStrength)) {
    anisotropyExtension.anisotropyStrength = anisotropyStrength;
    if (anisotropyStrength !== 0) {
      markAnisotropyExtensionUsed();
    }
  }
  const anisotropyRotationVector = coerceVec2(rnMaterial.getParameter("anisotropyRotation"));
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
  applyTexture("anisotropyTexture", {
    texCoordParam: "anisotropyTexcoordIndex",
    transform: {
      scale: "anisotropyTextureTransformScale",
      offset: "anisotropyTextureTransformOffset",
      rotation: "anisotropyTextureTransformRotation"
    },
    onAssign: (info) => {
      anisotropyExtension.anisotropyTexture = info;
      markAnisotropyExtensionUsed();
    }
  });
  const shouldAttachAnisotropyExtension = anisotropyExtensionUsed || Is.exist(anisotropyExtension.anisotropyTexture) || Is.exist(anisotropyExtension.anisotropyStrength) && anisotropyExtension.anisotropyStrength !== 0 || Is.exist(anisotropyExtension.anisotropyRotation) && anisotropyExtension.anisotropyRotation !== 0;
  if (shouldAttachAnisotropyExtension) {
    material.extensions = (_a = material.extensions) != null ? _a : {};
    material.extensions.KHR_materials_anisotropy = anisotropyExtension;
    ensureExtensionUsed("KHR_materials_anisotropy");
  }
}
function __outputKhrMaterialsDispersionInfo(ensureExtensionUsed, coerceNumber, rnMaterial, material) {
  var _a;
  const rawDispersion = coerceNumber(rnMaterial.getParameter("dispersion"));
  if (Is.not.exist(rawDispersion)) {
    return;
  }
  const dispersion = Math.max(0, rawDispersion);
  if (!Number.isFinite(dispersion) || dispersion === 0) {
    return;
  }
  material.extensions = (_a = material.extensions) != null ? _a : {};
  material.extensions.KHR_materials_dispersion = {
    dispersion
  };
  ensureExtensionUsed("KHR_materials_dispersion");
  if (Is.not.exist(material.extensions.KHR_materials_volume)) {
    material.extensions.KHR_materials_volume = {};
  }
  ensureExtensionUsed("KHR_materials_volume");
}
function __removeUnusedAccessorsAndBufferViews(json) {
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
function __removeUnusedAccessors(json) {
  const usedAccessorIndices = __collectUsedAccessorIndices(json);
  const result = __filterItemsByUsage(json.accessors, usedAccessorIndices);
  if (!result) {
    return;
  }
  const { filtered, indexMap } = result;
  json.accessors = filtered;
  __remapAccessorReferences(json, indexMap);
}
function __collectUsedAccessorIndices(json) {
  const usedAccessorIndices = /* @__PURE__ */ new Set();
  const registerAccessor = (candidate) => {
    if (typeof candidate === "number" && candidate >= 0) {
      usedAccessorIndices.add(candidate);
    }
  };
  __collectAccessorIndicesFromMeshes(json, registerAccessor);
  __collectAccessorIndicesFromSkins(json, registerAccessor);
  __collectAccessorIndicesFromAnimations(json, registerAccessor);
  return usedAccessorIndices;
}
function __collectAccessorIndicesFromMeshes(json, register) {
  if (Is.not.exist(json.meshes)) {
    return;
  }
  for (const mesh of json.meshes) {
    if (Is.not.exist(mesh == null ? void 0 : mesh.primitives)) {
      continue;
    }
    for (const primitive of mesh.primitives) {
      register(primitive.indices);
      const attributes = primitive.attributes;
      if (Is.exist(attributes)) {
        for (const key of Object.keys(attributes)) {
          register(attributes[key]);
        }
      }
      if (Array.isArray(primitive.targets)) {
        for (const target of primitive.targets) {
          const targetAttributes = target;
          for (const key of Object.keys(targetAttributes)) {
            register(targetAttributes[key]);
          }
        }
      }
    }
  }
}
function __collectAccessorIndicesFromSkins(json, register) {
  if (Is.not.exist(json.skins)) {
    return;
  }
  for (const skin of json.skins) {
    register(skin.inverseBindMatrices);
  }
}
function __collectAccessorIndicesFromAnimations(json, register) {
  if (Is.not.exist(json.animations)) {
    return;
  }
  for (const animation of json.animations) {
    if (Is.not.exist(animation == null ? void 0 : animation.samplers)) {
      continue;
    }
    for (const sampler of animation.samplers) {
      register(sampler.input);
      register(sampler.output);
    }
  }
}
function __remapAccessorReferences(json, indexMap) {
  const mapAccessorIndex = (candidate) => {
    if (typeof candidate !== "number") {
      return void 0;
    }
    return indexMap.get(candidate);
  };
  if (Is.exist(json.meshes)) {
    for (const mesh of json.meshes) {
      if (Is.not.exist(mesh == null ? void 0 : mesh.primitives)) {
        continue;
      }
      for (const primitive of mesh.primitives) {
        if (typeof primitive.indices === "number") {
          const mapped = mapAccessorIndex(primitive.indices);
          primitive.indices = typeof mapped === "number" ? mapped : void 0;
        }
        const attributes = primitive.attributes;
        __remapAccessorAttributeRecord(attributes, mapAccessorIndex);
        if (Array.isArray(primitive.targets)) {
          for (const target of primitive.targets) {
            __remapAccessorAttributeRecord(target, mapAccessorIndex);
          }
        }
      }
    }
  }
  if (Is.exist(json.skins)) {
    for (const skin of json.skins) {
      if (typeof skin.inverseBindMatrices === "number") {
        const mapped = mapAccessorIndex(skin.inverseBindMatrices);
        skin.inverseBindMatrices = typeof mapped === "number" ? mapped : void 0;
      }
    }
  }
  if (Is.exist(json.animations)) {
    for (const animation of json.animations) {
      if (Is.not.exist(animation == null ? void 0 : animation.samplers)) {
        continue;
      }
      for (const sampler of animation.samplers) {
        const mappedInput = mapAccessorIndex(sampler.input);
        const mappedOutput = mapAccessorIndex(sampler.output);
        if (typeof mappedInput === "number") {
          sampler.input = mappedInput;
        }
        if (typeof mappedOutput === "number") {
          sampler.output = mappedOutput;
        }
      }
    }
  }
}
function __remapAccessorAttributeRecord(attributes, mapAccessorIndex) {
  if (Is.not.exist(attributes)) {
    return;
  }
  for (const key of Object.keys(attributes)) {
    const mapped = mapAccessorIndex(attributes[key]);
    if (typeof mapped === "number") {
      attributes[key] = mapped;
    } else {
      delete attributes[key];
    }
  }
}
function __removeUnusedBufferViews(json) {
  const usedBufferViewIndices = __collectUsedBufferViewIndices(json);
  const result = __filterItemsByUsage(json.bufferViews, usedBufferViewIndices);
  if (!result) {
    return;
  }
  const { filtered, indexMap } = result;
  json.bufferViews = filtered;
  __remapBufferViewReferences(json, indexMap);
}
function __collectUsedBufferViewIndices(json) {
  const usedBufferViewIndices = /* @__PURE__ */ new Set();
  for (const accessor of json.accessors) {
    if (typeof accessor.bufferView === "number") {
      usedBufferViewIndices.add(accessor.bufferView);
    }
  }
  if (Is.exist(json.images)) {
    for (const image of json.images) {
      if (typeof image.bufferView === "number") {
        usedBufferViewIndices.add(image.bufferView);
      }
    }
  }
  return usedBufferViewIndices;
}
function __remapBufferViewReferences(json, indexMap) {
  for (const accessor of json.accessors) {
    if (typeof accessor.bufferView === "number") {
      const mapped = indexMap.get(accessor.bufferView);
      accessor.bufferView = typeof mapped === "number" ? mapped : void 0;
    }
  }
  if (Is.exist(json.images)) {
    for (const image of json.images) {
      if (typeof image.bufferView === "number") {
        const mapped = indexMap.get(image.bufferView);
        image.bufferView = typeof mapped === "number" ? mapped : void 0;
      }
    }
  }
}
function __filterItemsByUsage(items, usedIndices) {
  if (usedIndices.size === items.length) {
    return void 0;
  }
  const filtered = [];
  const indexMap = /* @__PURE__ */ new Map();
  items.forEach((item, idx) => {
    if (usedIndices.has(idx)) {
      indexMap.set(idx, filtered.length);
      filtered.push(item);
    }
  });
  return { filtered, indexMap };
}
function __recalculateBufferViewAccumulators(json) {
  var _a, _b;
  if (Is.not.exist(json.buffers) || json.buffers.length === 0) {
    json.extras.bufferViewByteLengthAccumulatedArray = [];
    return;
  }
  const accumulators = new Array(json.buffers.length).fill(0);
  for (const bufferView of json.bufferViews) {
    const bufferIdx = typeof bufferView.buffer === "number" ? bufferView.buffer : 0;
    const sourceLength = (_b = (_a = bufferView.extras) == null ? void 0 : _a.uint8Array) == null ? void 0 : _b.byteLength;
    const effectiveLength = Math.max(bufferView.byteLength, Is.exist(sourceLength) ? sourceLength : 0);
    const alignedLength = DataUtil.addPaddingBytes(effectiveLength, 4);
    accumulators[bufferIdx] += alignedLength;
  }
  json.extras.bufferViewByteLengthAccumulatedArray = accumulators;
}
function __setupMaterialBasicProperties(material, rnMaterial, json) {
  var _a, _b, _c;
  const isUnlitMaterial = Is.false(rnMaterial.isLighting);
  if (isUnlitMaterial) {
    if (Is.not.exist(material.extensions)) {
      material.extensions = {};
    }
    material.extensions.KHR_materials_unlit = {};
    if (json.extensionsUsed.indexOf("KHR_materials_unlit") < 0) {
      json.extensionsUsed.push("KHR_materials_unlit");
    }
  }
  const baseColorParam = (_b = (_a = rnMaterial.getParameter("baseColorFactor")) != null ? _a : rnMaterial.getParameter("diffuseColorFactor")) != null ? _b : Vector4.fromCopy4(1, 1, 1, 1);
  material.pbrMetallicRoughness.baseColorFactor = [
    baseColorParam.x,
    baseColorParam.y,
    baseColorParam.z,
    baseColorParam.w
  ];
  const metallicValue = __extractScalarParameter(rnMaterial.getParameter("metallicFactor"));
  if (Is.exist(metallicValue)) {
    material.pbrMetallicRoughness.metallicFactor = metallicValue;
  }
  const roughnessValue = __extractScalarParameter(rnMaterial.getParameter("roughnessFactor"));
  if (Is.exist(roughnessValue)) {
    material.pbrMetallicRoughness.roughnessFactor = roughnessValue;
  }
  const emissiveParam = rnMaterial.getParameter("emissiveFactor");
  if (Is.exist(emissiveParam)) {
    material.emissiveFactor = [emissiveParam.x, emissiveParam.y, emissiveParam.z];
  }
  material.alphaMode = rnMaterial.alphaMode.toGltfString();
  if (isUnlitMaterial) {
    material.pbrMetallicRoughness.metallicFactor = 0;
    const currentRoughness = (_c = material.pbrMetallicRoughness.roughnessFactor) != null ? _c : 1;
    material.pbrMetallicRoughness.roughnessFactor = Math.max(currentRoughness, 0.5);
    material.emissiveFactor = [0, 0, 0];
  }
}
function __outputBaseMaterialInfo(rnMaterial, applyTexture, material, json, options) {
  var _a;
  const skipAdditionalTextures = (_a = options == null ? void 0 : options.skipAdditionalTextures) != null ? _a : false;
  __setupMaterialBasicProperties(material, rnMaterial, json);
  const hasBaseColorTexture = Is.exist(rnMaterial.getTextureParameter("baseColorTexture"));
  applyTexture("baseColorTexture", {
    texCoordParam: "baseColorTexcoordIndex",
    transform: {
      scale: "baseColorTextureTransformScale",
      offset: "baseColorTextureTransformOffset",
      rotation: "baseColorTextureTransformRotation"
    },
    onAssign: (info) => {
      material.pbrMetallicRoughness.baseColorTexture = info;
    }
  });
  if (!hasBaseColorTexture) {
    applyTexture("diffuseColorTexture", {
      texCoordParam: "baseColorTexcoordIndex",
      transform: {
        scale: "baseColorTextureTransformScale",
        offset: "baseColorTextureTransformOffset",
        rotation: "baseColorTextureTransformRotation"
      },
      onAssign: (info) => {
        if (Is.not.exist(material.pbrMetallicRoughness.baseColorTexture)) {
          material.pbrMetallicRoughness.baseColorTexture = info;
        }
      }
    });
  }
  if (skipAdditionalTextures) {
    return;
  }
  applyTexture("metallicRoughnessTexture", {
    texCoordParam: "metallicRoughnessTexcoordIndex",
    transform: {
      scale: "metallicRoughnessTextureTransformScale",
      offset: "metallicRoughnessTextureTransformOffset",
      rotation: "metallicRoughnessTextureTransformRotation"
    },
    onAssign: (info) => {
      material.pbrMetallicRoughness.metallicRoughnessTexture = info;
    }
  });
  applyTexture("normalTexture", {
    texCoordParam: "normalTexcoordIndex",
    transform: {
      scale: "normalTextureTransformScale",
      offset: "normalTextureTransformOffset",
      rotation: "normalTextureTransformRotation"
    },
    scaleParam: "normalScale",
    onAssign: (info) => {
      material.normalTexture = info;
    }
  });
  applyTexture("occlusionTexture", {
    texCoordParam: "occlusionTexcoordIndex",
    transform: {
      scale: "occlusionTextureTransformScale",
      offset: "occlusionTextureTransformOffset",
      rotation: "occlusionTextureTransformRotation"
    },
    strengthParam: "occlusionStrength",
    onAssign: (info) => {
      material.occlusionTexture = info;
    }
  });
  applyTexture("emissiveTexture", {
    texCoordParam: "emissiveTexcoordIndex",
    transform: {
      scale: "emissiveTextureTransformScale",
      offset: "emissiveTextureTransformOffset",
      rotation: "emissiveTextureTransformRotation"
    },
    onAssign: (info) => {
      material.emissiveTexture = info;
    }
  });
}
export {
  SKIN_WEIGHT_DIFF_EPSILON,
  SKIN_WEIGHT_RESIDUAL_TOLERANCE,
  SKIN_WEIGHT_SUM_EPSILON,
  TANGENT_EPSILON,
  __collectAccessorIndicesFromAnimations,
  __collectAccessorIndicesFromMeshes,
  __collectAccessorIndicesFromSkins,
  __collectUsedAccessorIndices,
  __collectUsedBufferViewIndices,
  __collectUsedTexCoordSetIndices,
  __createBufferViewsAndAccessorsOfAnimation,
  __createBufferViewsAndAccessorsOfMesh,
  __createBufferViewsAndAccessorsOfSkin,
  __deleteEmptyArrays,
  __doesMaterialRequireTangents,
  __extractScalarParameter,
  __filterItemsByUsage,
  __outputBaseMaterialInfo,
  __outputKhrMaterialsAnisotropyInfo,
  __outputKhrMaterialsClearcoatInfo,
  __outputKhrMaterialsDiffuseTransmissionInfo,
  __outputKhrMaterialsDispersionInfo,
  __outputKhrMaterialsEmissiveStrengthInfo,
  __outputKhrMaterialsIorInfo,
  __outputKhrMaterialsIridescenceInfo,
  __outputKhrMaterialsSheenInfo,
  __outputKhrMaterialsSpecularInfo,
  __outputKhrMaterialsTransmissionInfo,
  __outputKhrMaterialsVolumeInfo,
  __pruneUnusedVertexAttributes,
  __recalculateBufferViewAccumulators,
  __remapAccessorAttributeRecord,
  __remapAccessorReferences,
  __remapBufferViewReferences,
  __removeUnusedAccessors,
  __removeUnusedAccessorsAndBufferViews,
  __removeUnusedBufferViews,
  __setupMaterialBasicProperties,
  accumulateBufferViewByteLength,
  accumulateVector3,
  adjustWeightsForResidual,
  alignAccessorByteOffsetTo4Bytes,
  alignBufferViewByteLength,
  alignBufferViewByteStrideTo4Bytes,
  buildOrthonormalVector,
  calcAccessorIdxToSet,
  calcBufferIdxToSet,
  calcBufferViewByteLengthAndByteOffset,
  clampWeight,
  convertNormalizedWeightsToUnsigned,
  convertToGltfAnimationPathName,
  createAccessorFromWeightsTypedArray,
  createAndAddGltf2BufferView,
  createComputedTangentAccessor,
  createGltf2AccessorForAnimation,
  createGltf2AnimationChannel,
  createGltf2AnimationSampler,
  createGltf2BufferViewAndGltf2AccessorForInput,
  createGltf2BufferViewAndGltf2AccessorForOutput,
  createGltf2BufferViewForAnimation,
  createNormalizedFloatWeights,
  createNormalizedTangentAccessor,
  createOrReuseGltf2Accessor,
  createOrReuseGltf2BufferView,
  createOrReuseGltf2BufferViewForVertexAttributeBuffer,
  createTemporaryVec4Accessor,
  createUnsignedTypedArray,
  doesRhodoniteMaterialRequireTangents,
  findBufferViewIdx,
  findPrimaryTexcoordAccessor,
  generateGlbArrayBuffer,
  getExportTangentAccessorForPrimitive,
  getNormalizedUnsignedComponentMax,
  handleTextureImage,
  isNumericArrayBufferView,
  isRuntimeOnlyAnimationPath,
  normalizeNormals,
  normalizeSkinWeightElement,
  normalizeSkinWeights,
  normalizeTangentVector,
  processSkinWeightElement,
  rebalanceScaledSkinWeights,
  resolveVertexAttributeByteStride,
  sanitizeSkinWeight,
  scaleSkinWeightElementToUnsigned,
  setupBlendShapeData
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vZXhwb3J0ZXIvR2x0ZjJFeHBvcnRlck9wcy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUge1xuICBBbmltYXRpb25DaGFubmVsLFxuICBBbmltYXRpb25QYXRoTmFtZSxcbiAgQW5pbWF0aW9uU2FtcGxlcixcbiAgQW5pbWF0aW9uVHJhY2tOYW1lLFxufSBmcm9tICcuLi8uLi90eXBlcy9BbmltYXRpb25UeXBlcyc7XG5pbXBvcnQgdHlwZSB7IEFycmF5MXRvNCwgQnl0ZSwgQ291bnQsIEluZGV4LCBWZWN0b3JBbmRTcXVhcmVNYXRyaXhDb21wb25lbnROIH0gZnJvbSAnLi4vLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHR5cGUge1xuICBHbHRmMixcbiAgR2x0ZjJBY2Nlc3NvckNvbXBvc2l0aW9uVHlwZVN0cmluZyxcbiAgR2x0ZjJBbmltYXRpb24sXG4gIEdsdGYyQW5pbWF0aW9uQ2hhbm5lbCxcbiAgR2x0ZjJBbmltYXRpb25QYXRoTmFtZSxcbiAgR2x0ZjJBbmltYXRpb25TYW1wbGVyLFxuICBHbHRmMkF0dHJpYnV0ZUJsZW5kU2hhcGVzLFxuICBHbHRmMkF0dHJpYnV0ZXMsXG4gIEdsdGYyTWVzaCxcbiAgR2x0ZjJQcmltaXRpdmUsXG4gIEdsdGYyU2tpbixcbn0gZnJvbSAnLi4vLi4vdHlwZXMvZ2xURjInO1xuaW1wb3J0IHR5cGUge1xuICBHbHRmMkFjY2Vzc29yRXgsXG4gIEdsdGYyQnVmZmVyVmlld0V4LFxuICBHbHRmMkV4LFxuICBHbHRmMkltYWdlRXgsXG4gIEdsdGYyTWF0ZXJpYWxFeCxcbn0gZnJvbSAnLi4vLi4vdHlwZXMvZ2xURjJGb3JPdXRwdXQnO1xuaW1wb3J0IHsgR0xfQVJSQVlfQlVGRkVSLCBHTF9FTEVNRU5UX0FSUkFZX0JVRkZFUiB9IGZyb20gJy4uLy4uL3R5cGVzL1dlYkdMQ29uc3RhbnRzJztcbmltcG9ydCB7IEJ1ZmZlclVzZSwgdHlwZSBDb21wb25lbnRUeXBlRW51bSwgdHlwZSBDb21wb3NpdGlvblR5cGVFbnVtIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMnO1xuaW1wb3J0IHsgQ29tcG9uZW50VHlwZSwgdHlwZSBHbHRmMkFjY2Vzc29yQ29tcG9uZW50VHlwZSB9IGZyb20gJy4uL2RlZmluaXRpb25zL0NvbXBvbmVudFR5cGUnO1xuaW1wb3J0IHsgQ29tcG9zaXRpb25UeXBlIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvQ29tcG9zaXRpb25UeXBlJztcbmltcG9ydCB7IFByaW1pdGl2ZU1vZGUgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9QcmltaXRpdmVNb2RlJztcbmltcG9ydCB0eXBlIHsgVmVydGV4QXR0cmlidXRlU2VtYW50aWNzSm9pbmVkU3RyaW5nIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvVmVydGV4QXR0cmlidXRlJztcbmltcG9ydCB7IFZlcnRleEF0dHJpYnV0ZSB9IGZyb20gJy4uL2RlZmluaXRpb25zL1ZlcnRleEF0dHJpYnV0ZSc7XG5pbXBvcnQgdHlwZSB7IFByaW1pdGl2ZSB9IGZyb20gJy4uL2dlb21ldHJ5L1ByaW1pdGl2ZSc7XG5pbXBvcnQgdHlwZSB7IElBbmltYXRpb25FbnRpdHksIElNZXNoRW50aXR5LCBJU2tlbGV0YWxFbnRpdHkgfSBmcm9tICcuLi9oZWxwZXJzL0VudGl0eUhlbHBlcic7XG5pbXBvcnQgdHlwZSB7IE1hdGVyaWFsIH0gZnJvbSAnLi4vbWF0ZXJpYWxzL2NvcmUvTWF0ZXJpYWwnO1xuaW1wb3J0IHR5cGUgeyBWZWN0b3IzIH0gZnJvbSAnLi4vbWF0aC9WZWN0b3IzJztcbmltcG9ydCB7IFZlY3RvcjQgfSBmcm9tICcuLi9tYXRoL1ZlY3RvcjQnO1xuaW1wb3J0IHsgQWNjZXNzb3IgfSBmcm9tICcuLi9tZW1vcnkvQWNjZXNzb3InO1xuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSAnLi4vbWVtb3J5L0J1ZmZlcic7XG5pbXBvcnQgeyBCdWZmZXJWaWV3IH0gZnJvbSAnLi4vbWVtb3J5L0J1ZmZlclZpZXcnO1xuaW1wb3J0IHsgRGF0YVV0aWwgfSBmcm9tICcuLi9taXNjL0RhdGFVdGlsJztcbmltcG9ydCB7IElzIH0gZnJvbSAnLi4vbWlzYy9Jcyc7XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBnbFRGIDIuMCBidWZmZXIgdmlldyBhbmQgYWRkcyBpdCB0byB0aGUgcHJvdmlkZWQgZ2xURiBKU09OIG9iamVjdC5cbiAqIFRoaXMgZnVuY3Rpb24gbWFuYWdlcyBidWZmZXIgdmlldyBjcmVhdGlvbiB3aXRoIHByb3BlciBieXRlIGFsaWdubWVudCBhbmQgb2Zmc2V0IGNhbGN1bGF0aW9uLlxuICpcbiAqIEBwYXJhbSBqc29uIC0gVGhlIGdsVEYgMi4wIEpTT04gb2JqZWN0IHRvIGFkZCB0aGUgYnVmZmVyIHZpZXcgdG9cbiAqIEBwYXJhbSBidWZmZXJJZHggLSBUaGUgaW5kZXggb2YgdGhlIGJ1ZmZlciB0aGF0IHRoaXMgYnVmZmVyIHZpZXcgd2lsbCByZWZlcmVuY2VcbiAqIEBwYXJhbSB1aW50OEFycmF5IC0gVGhlIHJhdyBiaW5hcnkgZGF0YSB0byBiZSBzdG9yZWQgaW4gdGhpcyBidWZmZXIgdmlld1xuICogQHJldHVybnMgVGhlIGNyZWF0ZWQgYnVmZmVyIHZpZXcgb2JqZWN0IHdpdGggZXh0ZW5kZWQgcHJvcGVydGllc1xuICpcbiAqIEByZW1hcmtzXG4gKiBUaGlzIGZ1bmN0aW9uIGF1dG9tYXRpY2FsbHkgaGFuZGxlczpcbiAqIC0gQ2FsY3VsYXRpbmcgdGhlIGNvcnJlY3QgYnl0ZSBvZmZzZXQgYmFzZWQgb24gYWNjdW11bGF0ZWQgYnVmZmVyIHZpZXcgbGVuZ3Roc1xuICogLSBBZGRpbmcgbmVjZXNzYXJ5IHBhZGRpbmcgYnl0ZXMgZm9yIHByb3BlciBhbGlnbm1lbnQgKDQtYnl0ZSBhbGlnbm1lbnQpXG4gKiAtIFVwZGF0aW5nIHRoZSBhY2N1bXVsYXRlZCBieXRlIGxlbmd0aCB0cmFja2luZyBmb3IgdGhlIHNwZWNpZmllZCBidWZmZXJcbiAqIC0gQWRkaW5nIHRoZSBidWZmZXIgdmlldyB0byB0aGUgZ2xURiBKU09OIHN0cnVjdHVyZVxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBjb25zdCBnbHRmID0gY3JlYXRlRW1wdHlHbHRmMigpO1xuICogY29uc3QgdmVydGV4RGF0YSA9IG5ldyBVaW50OEFycmF5KFsxLCAyLCAzLCA0XSk7XG4gKiBjb25zdCBidWZmZXJWaWV3ID0gY3JlYXRlQW5kQWRkR2x0ZjJCdWZmZXJWaWV3KGdsdGYsIDAsIHZlcnRleERhdGEpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVBbmRBZGRHbHRmMkJ1ZmZlclZpZXcoXG4gIGpzb246IEdsdGYyRXgsXG4gIGJ1ZmZlcklkeDogSW5kZXgsXG4gIHVpbnQ4QXJyYXk6IFVpbnQ4QXJyYXlcbik6IEdsdGYyQnVmZmVyVmlld0V4IHtcbiAgY29uc3QgYnVmZmVyVmlld0J5dGVMZW5ndGhBY2N1bXVsYXRlZCA9IGpzb24uZXh0cmFzLmJ1ZmZlclZpZXdCeXRlTGVuZ3RoQWNjdW11bGF0ZWRBcnJheVtidWZmZXJJZHhdO1xuICBjb25zdCBnbHRmQnVmZmVyVmlld0V4OiBHbHRmMkJ1ZmZlclZpZXdFeCA9IHtcbiAgICBidWZmZXI6IGJ1ZmZlcklkeCxcbiAgICBieXRlTGVuZ3RoOiB1aW50OEFycmF5LmJ5dGVMZW5ndGgsXG4gICAgYnl0ZU9mZnNldDogYnVmZmVyVmlld0J5dGVMZW5ndGhBY2N1bXVsYXRlZCxcbiAgICBleHRyYXM6IHtcbiAgICAgIHVpbnQ4QXJyYXksXG4gICAgfSxcbiAgfTtcblxuICBjb25zdCBuZXh0QnVmZmVyVmlld0J5dGVzTGVuZ3RoQWNjdW11bGF0ZWQgPVxuICAgIERhdGFVdGlsLmFkZFBhZGRpbmdCeXRlcyhnbHRmQnVmZmVyVmlld0V4LmJ5dGVMZW5ndGgsIDQpICsgYnVmZmVyVmlld0J5dGVMZW5ndGhBY2N1bXVsYXRlZDtcblxuICBqc29uLmJ1ZmZlclZpZXdzLnB1c2goZ2x0ZkJ1ZmZlclZpZXdFeCk7XG4gIGpzb24uZXh0cmFzLmJ1ZmZlclZpZXdCeXRlTGVuZ3RoQWNjdW11bGF0ZWRBcnJheVtidWZmZXJJZHhdID0gbmV4dEJ1ZmZlclZpZXdCeXRlc0xlbmd0aEFjY3VtdWxhdGVkO1xuICByZXR1cm4gZ2x0ZkJ1ZmZlclZpZXdFeDtcbn1cblxuLyoqXG4gKiBBY2N1bXVsYXRlcyBidWZmZXIgdmlldyBieXRlIGxlbmd0aCB3aXRoIHByb3BlciBhbGlnbm1lbnQuXG4gKlxuICogQ2FsY3VsYXRlcyB0aGUgdG90YWwgYWNjdW11bGF0ZWQgYnl0ZSBsZW5ndGggZm9yIGEgYnVmZmVyIHZpZXcsIGluY2x1ZGluZ1xuICogbmVjZXNzYXJ5IHBhZGRpbmcgYnl0ZXMgZm9yIDQtYnl0ZSBhbGlnbm1lbnQuIFVzZWQgdG8gdHJhY2sgYnVmZmVyIG9mZnNldHNcbiAqIHdoZW4gY3JlYXRpbmcgbXVsdGlwbGUgYnVmZmVyIHZpZXdzIGluIHNlcXVlbmNlLlxuICpcbiAqIEBwYXJhbSBidWZmZXJWaWV3Qnl0ZUxlbmd0aEFjY3VtdWxhdGVkQXJyYXkgLSBBcnJheSB0cmFja2luZyBhY2N1bXVsYXRlZCBsZW5ndGhzIHBlciBidWZmZXJcbiAqIEBwYXJhbSBidWZmZXJJZHhUb1NldCAtIEluZGV4IG9mIHRoZSB0YXJnZXQgYnVmZmVyXG4gKiBAcGFyYW0gZ2x0ZjJCdWZmZXJWaWV3IC0gVGhlIGJ1ZmZlciB2aWV3IHRvIGFjY3VtdWxhdGVcbiAqIEByZXR1cm5zIFVwZGF0ZWQgYWNjdW11bGF0ZWQgYnl0ZSBsZW5ndGhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFjY3VtdWxhdGVCdWZmZXJWaWV3Qnl0ZUxlbmd0aChcbiAgYnVmZmVyVmlld0J5dGVMZW5ndGhBY2N1bXVsYXRlZEFycmF5OiBudW1iZXJbXSxcbiAgYnVmZmVySWR4VG9TZXQ6IG51bWJlcixcbiAgZ2x0ZjJCdWZmZXJWaWV3OiBHbHRmMkJ1ZmZlclZpZXdFeFxuKTogbnVtYmVyIHtcbiAgY29uc3QgYnVmZmVyVmlld0xlbmd0aEFsaWduZWQgPSBJcy5leGlzdChidWZmZXJWaWV3Qnl0ZUxlbmd0aEFjY3VtdWxhdGVkQXJyYXlbYnVmZmVySWR4VG9TZXRdKVxuICAgID8gYnVmZmVyVmlld0J5dGVMZW5ndGhBY2N1bXVsYXRlZEFycmF5W2J1ZmZlcklkeFRvU2V0XSArIERhdGFVdGlsLmFkZFBhZGRpbmdCeXRlcyhnbHRmMkJ1ZmZlclZpZXcuYnl0ZUxlbmd0aCwgNClcbiAgICA6IERhdGFVdGlsLmFkZFBhZGRpbmdCeXRlcyhnbHRmMkJ1ZmZlclZpZXcuYnl0ZUxlbmd0aCwgNCk7XG5cbiAgcmV0dXJuIGJ1ZmZlclZpZXdMZW5ndGhBbGlnbmVkO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIFJob2Rvbml0ZSBhbmltYXRpb24gcGF0aCBuYW1lcyB0byBnbFRGMiBmb3JtYXQuXG4gKlxuICogQHBhcmFtIHBhdGggLSBUaGUgUmhvZG9uaXRlIGFuaW1hdGlvbiBwYXRoIG5hbWVcbiAqIEByZXR1cm5zIFRoZSBjb3JyZXNwb25kaW5nIGdsVEYyIGFuaW1hdGlvbiBwYXRoIG5hbWVcbiAqIEB0aHJvd3MgRXJyb3IgaWYgdGhlIHBhdGggbmFtZSBpcyBpbnZhbGlkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb252ZXJ0VG9HbHRmQW5pbWF0aW9uUGF0aE5hbWUocGF0aDogQW5pbWF0aW9uUGF0aE5hbWUpOiBHbHRmMkFuaW1hdGlvblBhdGhOYW1lIHtcbiAgc3dpdGNoIChwYXRoKSB7XG4gICAgY2FzZSAndHJhbnNsYXRlJzpcbiAgICAgIHJldHVybiAndHJhbnNsYXRpb24nO1xuICAgIGNhc2UgJ3F1YXRlcm5pb24nOlxuICAgICAgcmV0dXJuICdyb3RhdGlvbic7XG4gICAgY2FzZSAnc2NhbGUnOlxuICAgICAgcmV0dXJuICdzY2FsZSc7XG4gICAgY2FzZSAnd2VpZ2h0cyc6XG4gICAgICByZXR1cm4gJ3dlaWdodHMnO1xuICAgIC8vIGNhc2UgJ2VmZmVrc2Vlcic6XG4gICAgLy8gICByZXR1cm4gJ2VmZmVrc2Vlcic7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBQYXRoIE5hbWUnKTtcbiAgfVxufVxuXG4vKiogUmV0dXJucyB3aGV0aGVyIGFuIGFuaW1hdGlvbiBwYXRoIG9ubHkgaGFzIG1lYW5pbmcgaW5zaWRlIFJob2Rvbml0ZSBhdCBydW50aW1lLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzUnVudGltZU9ubHlBbmltYXRpb25QYXRoKHBhdGg6IEFuaW1hdGlvblBhdGhOYW1lKTogYm9vbGVhbiB7XG4gIHJldHVybiBwYXRoLnN0YXJ0c1dpdGgoJ3ZybUV4cHJlc3Npb24vJyk7XG59XG5cbi8qKlxuICogQWxpZ25zIGFjY2Vzc29yIGJ5dGUgb2Zmc2V0IHRvIDQtYnl0ZSBib3VuZGFyaWVzLlxuICpcbiAqIGdsVEYyIHNwZWNpZmljYXRpb24gcmVxdWlyZXMgdGhhdCBhY2Nlc3NvciBieXRlIG9mZnNldHMgYmUgYWxpZ25lZCB0b1xuICogNC1ieXRlIGJvdW5kYXJpZXMgZm9yIG9wdGltYWwgcGVyZm9ybWFuY2UgYW5kIGNvbXBhdGliaWxpdHkuXG4gKlxuICogQHBhcmFtIGJ5dGVPZmZzZXQgLSBCeXRlIG9mZnNldCB0aGF0IG1heSBub3QgYmUgYWxpZ25lZFxuICogQHJldHVybnMgQWxpZ25lZCBieXRlIG9mZnNldFxuICovXG5leHBvcnQgZnVuY3Rpb24gYWxpZ25BY2Nlc3NvckJ5dGVPZmZzZXRUbzRCeXRlcyhieXRlT2Zmc2V0OiBCeXRlKTogQnl0ZSB7XG4gIGNvbnN0IGFsaWduU2l6ZSA9IDQ7XG4gIGlmIChieXRlT2Zmc2V0ICUgNCA9PT0gMCkge1xuICAgIHJldHVybiBieXRlT2Zmc2V0O1xuICB9XG4gIHJldHVybiBieXRlT2Zmc2V0ICsgKGFsaWduU2l6ZSAtIChieXRlT2Zmc2V0ICUgYWxpZ25TaXplKSk7XG59XG5cbi8qKlxuICogQWxpZ25zIGJ1ZmZlciB2aWV3IGJ5dGUgc3RyaWRlIHRvIDQtYnl0ZSBib3VuZGFyaWVzLlxuICpcbiAqIEZvciBwZXJmb3JtYW5jZSBhbmQgY29tcGF0aWJpbGl0eSByZWFzb25zLCBidWZmZXJWaWV3LmJ5dGVTdHJpZGUgbXVzdCBiZVxuICogYSBtdWx0aXBsZSBvZiA0IGZvciB2ZXJ0ZXggYXR0cmlidXRlcy5cbiAqXG4gKiBAcGFyYW0gYnl0ZVN0cmlkZSAtIEJ5dGUgc3RyaWRlIHRoYXQgbWF5IG5vdCBiZSBhbGlnbmVkXG4gKiBAcmV0dXJucyBBbGlnbmVkIGJ5dGUgc3RyaWRlXG4gKlxuICogQHNlZSBodHRwczovL3d3dy5raHJvbm9zLm9yZy9yZWdpc3RyeS9nbFRGL3NwZWNzLzIuMC9nbFRGLTIuMC5odG1sI2RhdGEtYWxpZ25tZW50XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbGlnbkJ1ZmZlclZpZXdCeXRlU3RyaWRlVG80Qnl0ZXMoYnl0ZVN0cmlkZTogQnl0ZSk6IEJ5dGUge1xuICBjb25zdCBhbGlnblNpemUgPSA0O1xuICBpZiAoYnl0ZVN0cmlkZSAlIDQgPT09IDApIHtcbiAgICByZXR1cm4gYnl0ZVN0cmlkZTtcbiAgfVxuICBjb25zdCBieXRlU3RyaWRlQWxnaW5lZCA9IGJ5dGVTdHJpZGUgKyAoYWxpZ25TaXplIC0gKGJ5dGVTdHJpZGUgJSBhbGlnblNpemUpKTtcblxuICByZXR1cm4gYnl0ZVN0cmlkZUFsZ2luZWQ7XG59XG5cbi8qKlxuICogVHlwZSBndWFyZCBmb3IgY2hlY2tpbmcgaWYgYW4gQXJyYXlCdWZmZXJWaWV3IGhhcyBudW1lcmljIGFycmF5IHByb3BlcnRpZXMuXG4gKi9cbmV4cG9ydCB0eXBlIE51bWVyaWNBcnJheUJ1ZmZlclZpZXcgPSBBcnJheUJ1ZmZlclZpZXcgJiB7IGxlbmd0aDogbnVtYmVyOyBbaW5kZXg6IG51bWJlcl06IG51bWJlciB9O1xuXG4vKipcbiAqIFR5cGUgZ3VhcmQgZnVuY3Rpb24gdG8gY2hlY2sgaWYgYW4gQXJyYXlCdWZmZXJWaWV3IGlzIGEgbnVtZXJpYyBhcnJheSBidWZmZXIgdmlldy5cbiAqXG4gKiBAcGFyYW0gdmlldyAtIFRoZSBBcnJheUJ1ZmZlclZpZXcgdG8gY2hlY2tcbiAqIEByZXR1cm5zIFRydWUgaWYgdGhlIHZpZXcgaGFzIG51bWVyaWMgYXJyYXkgcHJvcGVydGllc1xuICovXG5leHBvcnQgZnVuY3Rpb24gaXNOdW1lcmljQXJyYXlCdWZmZXJWaWV3KHZpZXc6IEFycmF5QnVmZmVyVmlldyk6IHZpZXcgaXMgTnVtZXJpY0FycmF5QnVmZmVyVmlldyB7XG4gIHJldHVybiB0eXBlb2YgKHZpZXcgYXMgYW55KS5sZW5ndGggPT09ICdudW1iZXInO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFuaW1hdGlvbkNoYW5uZWxUYXJnZXRSZXNvbHV0aW9uIHtcbiAgcGF0aDogR2x0ZjJBbmltYXRpb25QYXRoTmFtZTtcbiAgbm9kZT86IG51bWJlcjtcbiAgZXh0ZW5zaW9ucz86IFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xufVxuXG5leHBvcnQgdHlwZSBBbmltYXRpb25DaGFubmVsVGFyZ2V0T3ZlcnJpZGUgPSBBbmltYXRpb25DaGFubmVsVGFyZ2V0UmVzb2x1dGlvbiB8IEFuaW1hdGlvbkNoYW5uZWxUYXJnZXRSZXNvbHV0aW9uW107XG5cbmV4cG9ydCBpbnRlcmZhY2UgQW5pbWF0aW9uRXhwb3J0T3B0aW9ucyB7XG4gIHJlc29sdmVBbmltYXRpb25UYXJnZXQ/OiAoYXJnczoge1xuICAgIGNoYW5uZWw6IEFuaW1hdGlvbkNoYW5uZWw7XG4gICAgZW50aXR5SWR4OiBJbmRleDtcbiAgICB0cmFja05hbWU6IHN0cmluZztcbiAgfSkgPT4gQW5pbWF0aW9uQ2hhbm5lbFRhcmdldE92ZXJyaWRlIHwgbnVsbCB8IHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgZ2xURjIgYW5pbWF0aW9uIGNoYW5uZWwgZnJvbSBSaG9kb25pdGUgYW5pbWF0aW9uIGRhdGEuXG4gKlxuICogQHBhcmFtIGNoYW5uZWwgLSBUaGUgUmhvZG9uaXRlIGFuaW1hdGlvbiBjaGFubmVsXG4gKiBAcGFyYW0gc2FtcGxlcklkeCAtIEN1cnJlbnQgc2FtcGxlciBpbmRleFxuICogQHBhcmFtIGFuaW1hdGlvbiAtIFRoZSBnbFRGMiBhbmltYXRpb24gdG8gYWRkIHRoZSBjaGFubmVsIHRvXG4gKiBAcGFyYW0gZW50aXR5SWR4IC0gSW5kZXggb2YgdGhlIHRhcmdldCBlbnRpdHlcbiAqIEByZXR1cm5zIFVwZGF0ZWQgc2FtcGxlciBpbmRleFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlR2x0ZjJBbmltYXRpb25DaGFubmVsKFxuICBjaGFubmVsOiBBbmltYXRpb25DaGFubmVsLFxuICBzYW1wbGVySWR4OiBJbmRleCxcbiAgYW5pbWF0aW9uOiBHbHRmMkFuaW1hdGlvbixcbiAgZW50aXR5SWR4OiBJbmRleCxcbiAgdGFyZ2V0T3ZlcnJpZGU/OiBBbmltYXRpb25DaGFubmVsVGFyZ2V0T3ZlcnJpZGVcbik6IEluZGV4IHtcbiAgY29uc3QgcGF0aE5hbWUgPSBjaGFubmVsLnRhcmdldC5wYXRoTmFtZSBhcyBBbmltYXRpb25QYXRoTmFtZTtcbiAgY29uc3Qgb3ZlcnJpZGVzID0gQXJyYXkuaXNBcnJheSh0YXJnZXRPdmVycmlkZSkgPyB0YXJnZXRPdmVycmlkZSA6IHRhcmdldE92ZXJyaWRlID8gW3RhcmdldE92ZXJyaWRlXSA6IHVuZGVmaW5lZDtcblxuICBpZiAob3ZlcnJpZGVzPy5sZW5ndGgpIHtcbiAgICBmb3IgKGNvbnN0IG92ZXJyaWRlIG9mIG92ZXJyaWRlcykge1xuICAgICAgY29uc3QgdGFyZ2V0OiBHbHRmMkFuaW1hdGlvbkNoYW5uZWxbJ3RhcmdldCddID0ge1xuICAgICAgICBwYXRoOiBvdmVycmlkZS5wYXRoLFxuICAgICAgfTtcbiAgICAgIGlmICh0eXBlb2Ygb3ZlcnJpZGUubm9kZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgdGFyZ2V0Lm5vZGUgPSBvdmVycmlkZS5ub2RlO1xuICAgICAgfVxuICAgICAgaWYgKElzLmV4aXN0KG92ZXJyaWRlLmV4dGVuc2lvbnMpKSB7XG4gICAgICAgIHRhcmdldC5leHRlbnNpb25zID0gb3ZlcnJpZGUuZXh0ZW5zaW9ucztcbiAgICAgIH1cbiAgICAgIGFuaW1hdGlvbi5jaGFubmVscy5wdXNoKHtcbiAgICAgICAgc2FtcGxlcjogc2FtcGxlcklkeCxcbiAgICAgICAgdGFyZ2V0LFxuICAgICAgfSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IGNoYW5uZWxKc29uOiBHbHRmMkFuaW1hdGlvbkNoYW5uZWwgPSB7XG4gICAgICBzYW1wbGVyOiBzYW1wbGVySWR4LFxuICAgICAgdGFyZ2V0OiB7XG4gICAgICAgIHBhdGg6IGNvbnZlcnRUb0dsdGZBbmltYXRpb25QYXRoTmFtZShwYXRoTmFtZSksXG4gICAgICAgIG5vZGU6IGVudGl0eUlkeCxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBhbmltYXRpb24uY2hhbm5lbHMucHVzaChjaGFubmVsSnNvbik7XG4gIH1cblxuICByZXR1cm4gc2FtcGxlcklkeCArIDE7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIGdsVEYyIGFuaW1hdGlvbiBzYW1wbGVyIGZyb20gUmhvZG9uaXRlIHNhbXBsZXIgZGF0YS5cbiAqXG4gKiBAcGFyYW0gaW5wdXRBY2Nlc3NvcklkeCAtIEluZGV4IG9mIHRoZSBpbnB1dCAodGltZSkgYWNjZXNzb3JcbiAqIEBwYXJhbSBvdXRwdXRBY2Nlc3NvcklkeCAtIEluZGV4IG9mIHRoZSBvdXRwdXQgKHZhbHVlKSBhY2Nlc3NvclxuICogQHBhcmFtIHNhbXBsZXIgLSBUaGUgUmhvZG9uaXRlIGFuaW1hdGlvbiBzYW1wbGVyXG4gKiBAcGFyYW0gYW5pbWF0aW9uIC0gVGhlIGdsVEYyIGFuaW1hdGlvbiB0byBhZGQgdGhlIHNhbXBsZXIgdG9cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUdsdGYyQW5pbWF0aW9uU2FtcGxlcihcbiAgaW5wdXRBY2Nlc3NvcklkeDogbnVtYmVyLFxuICBvdXRwdXRBY2Nlc3NvcklkeDogbnVtYmVyLFxuICBzYW1wbGVyOiBBbmltYXRpb25TYW1wbGVyLFxuICBhbmltYXRpb246IEdsdGYyQW5pbWF0aW9uXG4pOiB2b2lkIHtcbiAgY29uc3Qgc2FtcGxlckpzb246IEdsdGYyQW5pbWF0aW9uU2FtcGxlciA9IHtcbiAgICBpbnB1dDogaW5wdXRBY2Nlc3NvcklkeCxcbiAgICBvdXRwdXQ6IG91dHB1dEFjY2Vzc29ySWR4LFxuICAgIGludGVycG9sYXRpb246IHNhbXBsZXIuaW50ZXJwb2xhdGlvbk1ldGhvZC5HbHRmU3RyaW5nLFxuICB9O1xuICBhbmltYXRpb24uc2FtcGxlcnMucHVzaChzYW1wbGVySnNvbik7XG59XG5cbi8qKlxuICogQWxpZ25zIGJ1ZmZlciB2aWV3IGJ5dGUgbGVuZ3RoIHRvIHByb3BlciBib3VuZGFyaWVzLlxuICpcbiAqIENhbGN1bGF0ZXMgdGhlIGFsaWduZWQgZW5kIHBvc2l0aW9uIG9mIGEgYnVmZmVyIHZpZXcgYW5kIHJldHVybnMgdGhlIGRlbHRhXG4gKiBuZWVkZWQgdG8gYWxpZ24gaXQgcHJvcGVybHkuIFVzZWQgdG8gbWFpbnRhaW4gcHJvcGVyIG1lbW9yeSBhbGlnbm1lbnQgd2hlblxuICogY3JlYXRpbmcgbXVsdGlwbGUgYnVmZmVyIHZpZXdzIHNlcXVlbnRpYWxseS5cbiAqXG4gKiBAcGFyYW0gYnVmZmVyVmlld0J5dGVMZW5ndGhBY2N1bXVsYXRlZCAtIEN1cnJlbnQgYWNjdW11bGF0ZWQgYnl0ZSBsZW5ndGhcbiAqIEBwYXJhbSBidWZmZXJWaWV3IC0gVGhlIGJ1ZmZlciB2aWV3IHRvIGFsaWduXG4gKiBAcmV0dXJucyBEZWx0YSB2YWx1ZSBmb3IgYWxpZ25tZW50IChub24tbmVnYXRpdmUpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbGlnbkJ1ZmZlclZpZXdCeXRlTGVuZ3RoKFxuICBidWZmZXJWaWV3Qnl0ZUxlbmd0aEFjY3VtdWxhdGVkOiBudW1iZXIsXG4gIGJ1ZmZlclZpZXc6IEdsdGYyQnVmZmVyVmlld0V4XG4pOiBudW1iZXIge1xuICBjb25zdCBidWZmZXJWaWV3RW5kID0gYnVmZmVyVmlldy5ieXRlT2Zmc2V0ICsgYnVmZmVyVmlldy5ieXRlTGVuZ3RoO1xuICBjb25zdCBhbGlnbmVkRW5kID0gYnVmZmVyVmlld0VuZCArIERhdGFVdGlsLmNhbGNQYWRkaW5nQnl0ZXMoYnVmZmVyVmlld0VuZCwgNCk7XG4gIGNvbnN0IGRlbHRhID0gYWxpZ25lZEVuZCAtIGJ1ZmZlclZpZXdCeXRlTGVuZ3RoQWNjdW11bGF0ZWQ7XG4gIHJldHVybiBNYXRoLm1heChkZWx0YSwgMCk7XG59XG5cbi8qKlxuICogUmVzb2x2ZXMgdGhlIGJ5dGVTdHJpZGUgdG8gYmUgd3JpdHRlbiB0byBhIGdsVEYgYnVmZmVyVmlldyBmb3IgdmVydGV4IGF0dHJpYnV0ZXMuXG4gKlxuICogUHJlZmVycyB0aGUgYnVmZmVyVmlldydzIGV4cGxpY2l0IHN0cmlkZSBvciBhY2Nlc3NvciBzdHJpZGUgd2hlbiBhdmFpbGFibGUgYW5kXG4gKiBndWFyYW50ZWVzIHRoZSByZXN1bHQgaXMgbGFyZ2UgZW5vdWdoIGZvciB0aGUgYWNjZXNzb3IncyBlbGVtZW50IHdpZHRoIGFuZCBhbGlnbmVkXG4gKiB0byA0IGJ5dGVzIHRvIHNhdGlzZnkgZ2xURiByZXF1aXJlbWVudHMuXG4gKlxuICogQHBhcmFtIHJuQnVmZmVyVmlldyAtIFNvdXJjZSBidWZmZXIgdmlld1xuICogQHBhcmFtIHJuQWNjZXNzb3IgLSBBY2Nlc3NvciB0aGF0IHJlZmVyZW5jZXMgdGhlIGJ1ZmZlciB2aWV3XG4gKiBAcmV0dXJucyBUaGUgcmVzb2x2ZWQgc3RyaWRlIGluIGJ5dGVzIG9yIHVuZGVmaW5lZCB3aGVuIHN0cmlkZSBzaG91bGQgYmUgb21pdHRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZVZlcnRleEF0dHJpYnV0ZUJ5dGVTdHJpZGUocm5CdWZmZXJWaWV3OiBCdWZmZXJWaWV3LCBybkFjY2Vzc29yOiBBY2Nlc3Nvcik6IEJ5dGUgfCB1bmRlZmluZWQge1xuICBjb25zdCBjYW5kaWRhdGVzOiBudW1iZXJbXSA9IFtdO1xuICBjb25zdCBkZWZhdWx0U3RyaWRlID0gcm5CdWZmZXJWaWV3LmRlZmF1bHRCeXRlU3RyaWRlO1xuICBpZiAoZGVmYXVsdFN0cmlkZSA+IDApIHtcbiAgICBjYW5kaWRhdGVzLnB1c2goZGVmYXVsdFN0cmlkZSk7XG4gIH1cbiAgY29uc3QgYWNjZXNzb3JTdHJpZGUgPSBybkFjY2Vzc29yLmJ5dGVTdHJpZGU7XG4gIGlmIChhY2Nlc3NvclN0cmlkZSA+IDApIHtcbiAgICBjYW5kaWRhdGVzLnB1c2goYWNjZXNzb3JTdHJpZGUpO1xuICB9XG4gIGNvbnN0IGVsZW1lbnRTaXplID0gcm5BY2Nlc3Nvci5lbGVtZW50U2l6ZUluQnl0ZXM7XG4gIGlmIChlbGVtZW50U2l6ZSA+IDApIHtcbiAgICBjYW5kaWRhdGVzLnB1c2goZWxlbWVudFNpemUpO1xuICB9XG5cbiAgaWYgKGNhbmRpZGF0ZXMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIGNvbnN0IHJlc29sdmVkID0gTWF0aC5tYXgoLi4uY2FuZGlkYXRlcyk7XG4gIGNvbnN0IGFsaWduZWQgPSBhbGlnbkJ1ZmZlclZpZXdCeXRlU3RyaWRlVG80Qnl0ZXMocmVzb2x2ZWQgYXMgQnl0ZSk7XG5cbiAgcmV0dXJuIE1hdGgubWF4KGFsaWduZWQsIGVsZW1lbnRTaXplKTtcbn1cblxuLyoqXG4gKiBHZW5lcmF0ZXMgYSBjb21wbGV0ZSBnbFRGMiBCaW5hcnkgKC5nbGIpIEFycmF5QnVmZmVyIGZyb20gSlNPTiBhbmQgYmluYXJ5IGRhdGEuXG4gKlxuICogQ29tYmluZXMgdGhlIGdsVEYyIEpTT04gZG9jdW1lbnQgYW5kIGJpbmFyeSBidWZmZXIgaW50byBhIHNpbmdsZSAuZ2xiIGZpbGVcbiAqIGZvbGxvd2luZyB0aGUgZ2xURjIgYmluYXJ5IGZvcm1hdCBzcGVjaWZpY2F0aW9uLiBIYW5kbGVzIHByb3BlciBjaHVua1xuICogYWxpZ25tZW50IGFuZCBoZWFkZXIgY29uc3RydWN0aW9uLlxuICpcbiAqIEBwYXJhbSBqc29uIC0gVGhlIGdsVEYyIEpTT04gZG9jdW1lbnQgdG8gZW1iZWRcbiAqIEBwYXJhbSBhcnJheWJ1ZmZlciAtIEJpbmFyeSBkYXRhIGJ1ZmZlciB0byBpbmNsdWRlXG4gKiBAcmV0dXJucyBDb21wbGV0ZSAuZ2xiIGZpbGUgYXMgQXJyYXlCdWZmZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlR2xiQXJyYXlCdWZmZXIoanNvbjogR2x0ZjIsIGFycmF5YnVmZmVyOiBBcnJheUJ1ZmZlcik6IEFycmF5QnVmZmVyIHtcbiAgY29uc3QgaGVhZGVyQnl0ZXMgPSAxMjsgLy8gMTJieXRlLWhlYWRlclxuXG4gIC8vIC5nbGIgZmlsZVxuICBqc29uLmJ1ZmZlcnMhWzBdLnVyaSA9IHVuZGVmaW5lZDtcbiAgbGV0IGpzb25TdHIgPSBKU09OLnN0cmluZ2lmeShqc29uLCBudWxsLCAyKTtcbiAgbGV0IGpzb25BcnJheUJ1ZmZlciA9IERhdGFVdGlsLnN0cmluZ1RvQnVmZmVyKGpzb25TdHIpO1xuICBjb25zdCBwYWRkaW5nQnl0ZXMgPSBEYXRhVXRpbC5jYWxjUGFkZGluZ0J5dGVzKGpzb25BcnJheUJ1ZmZlci5ieXRlTGVuZ3RoLCA0KTtcbiAgaWYgKHBhZGRpbmdCeXRlcyA+IDApIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhZGRpbmdCeXRlczsgaSsrKSB7XG4gICAgICBqc29uU3RyICs9ICcgJztcbiAgICB9XG4gICAganNvbkFycmF5QnVmZmVyID0gRGF0YVV0aWwuc3RyaW5nVG9CdWZmZXIoanNvblN0cik7XG4gIH1cbiAgY29uc3QganNvbkNodW5rTGVuZ3RoID0ganNvbkFycmF5QnVmZmVyLmJ5dGVMZW5ndGg7XG4gIGNvbnN0IGhlYWRlckFuZENodW5rMCA9IGhlYWRlckJ5dGVzICsgNCArIDQgKyBqc29uQ2h1bmtMZW5ndGg7IC8vIENodW5rLTBcbiAgY29uc3QgdG90YWxCeXRlcyA9IGhlYWRlckFuZENodW5rMCArIDQgKyA0ICsgYXJyYXlidWZmZXIuYnl0ZUxlbmd0aDsgLy8gQ2h1bmstMVxuXG4gIGNvbnN0IGdsYkFycmF5QnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKHRvdGFsQnl0ZXMpO1xuICBjb25zdCBkYXRhVmlldyA9IG5ldyBEYXRhVmlldyhnbGJBcnJheUJ1ZmZlcik7XG4gIGRhdGFWaWV3LnNldFVpbnQzMigwLCAweDQ2NTQ2YzY3LCB0cnVlKTtcbiAgZGF0YVZpZXcuc2V0VWludDMyKDQsIDIsIHRydWUpO1xuICBkYXRhVmlldy5zZXRVaW50MzIoOCwgdG90YWxCeXRlcywgdHJ1ZSk7XG4gIGRhdGFWaWV3LnNldFVpbnQzMigxMiwganNvbkFycmF5QnVmZmVyLmJ5dGVMZW5ndGgsIHRydWUpO1xuICBkYXRhVmlldy5zZXRVaW50MzIoMTYsIDB4NGU0ZjUzNGEsIHRydWUpO1xuXG4gIERhdGFVdGlsLmNvcHlBcnJheUJ1ZmZlckFzNEJ5dGVzKHtcbiAgICBzcmM6IGpzb25BcnJheUJ1ZmZlcixcbiAgICBkaXN0OiBnbGJBcnJheUJ1ZmZlcixcbiAgICBzcmNCeXRlT2Zmc2V0OiAwLFxuICAgIGNvcHlCeXRlTGVuZ3RoOiBqc29uQXJyYXlCdWZmZXIuYnl0ZUxlbmd0aCxcbiAgICBkaXN0Qnl0ZU9mZnNldDogMjAsXG4gIH0pO1xuICBEYXRhVXRpbC5jb3B5QXJyYXlCdWZmZXJBczRCeXRlcyh7XG4gICAgc3JjOiBhcnJheWJ1ZmZlcixcbiAgICBkaXN0OiBnbGJBcnJheUJ1ZmZlcixcbiAgICBzcmNCeXRlT2Zmc2V0OiAwLFxuICAgIGNvcHlCeXRlTGVuZ3RoOiBhcnJheWJ1ZmZlci5ieXRlTGVuZ3RoLFxuICAgIGRpc3RCeXRlT2Zmc2V0OiAyMCArIGpzb25DaHVua0xlbmd0aCArIDgsXG4gIH0pO1xuICBkYXRhVmlldy5zZXRVaW50MzIoaGVhZGVyQW5kQ2h1bmswLCBhcnJheWJ1ZmZlci5ieXRlTGVuZ3RoLCB0cnVlKTtcbiAgZGF0YVZpZXcuc2V0VWludDMyKGhlYWRlckFuZENodW5rMCArIDQsIDB4MDA0ZTQ5NDIsIHRydWUpO1xuICByZXR1cm4gZ2xiQXJyYXlCdWZmZXI7XG59XG5cbi8qKlxuICogVHlwZSBkZWZpbml0aW9uIGZvciBidWZmZXIgdmlldyBieXRlIGxlbmd0aCBjYWxjdWxhdGlvbiBwYXJhbWV0ZXJzLlxuICovXG5leHBvcnQgdHlwZSBCdWZmZXJWaWV3Qnl0ZUxlbmd0aERlc2MgPSB7XG4gIC8qKiBCeXRlIG9mZnNldCBvZiB0aGUgYWNjZXNzb3Igd2l0aGluIHRoZSBidWZmZXIgdmlldyAqL1xuICBhY2Nlc3NvckJ5dGVPZmZzZXQ6IEJ5dGU7XG4gIC8qKiBOdW1iZXIgb2YgZWxlbWVudHMgaW4gdGhlIGFjY2Vzc29yICovXG4gIGFjY2Vzc29yQ291bnQ6IENvdW50O1xuICAvKiogQnl0ZSBzdHJpZGUgb2YgdGhlIGJ1ZmZlciB2aWV3ICovXG4gIGJ1ZmZlclZpZXdCeXRlU3RyaWRlOiBCeXRlO1xuICAvKiogQnl0ZSBvZmZzZXQgb2YgdGhlIGJ1ZmZlciB2aWV3IHdpdGhpbiB0aGUgYnVmZmVyICovXG4gIGJ1ZmZlclZpZXdCeXRlT2Zmc2V0OiBCeXRlO1xuICAvKiogU2l6ZSBpbiBieXRlcyBvZiBlYWNoIGNvbXBvbmVudCAqL1xuICBzaXplT2ZDb21wb25lbnQ6IEJ5dGU7XG4gIC8qKiBOdW1iZXIgb2YgY29tcG9uZW50cyBwZXIgZWxlbWVudCAqL1xuICBudW1iZXJPZkNvbXBvbmVudHM6IG51bWJlcjtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyBCdWZmZXJWaWV3IGJ5dGUgbGVuZ3RoIGFuZCBieXRlIG9mZnNldCBhY2NvcmRpbmcgdG8gZ2xURjIgc3BlY2lmaWNhdGlvbi5cbiAqXG4gKiBFbnN1cmVzIHByb3BlciBkYXRhIGFsaWdubWVudCBmb3IgcGVyZm9ybWFuY2UgYW5kIGNvbXBhdGliaWxpdHkuIEVhY2ggZWxlbWVudFxuICogb2YgYSB2ZXJ0ZXggYXR0cmlidXRlIG11c3QgYmUgYWxpZ25lZCB0byA0LWJ5dGUgYm91bmRhcmllcyBpbnNpZGUgYSBidWZmZXJWaWV3LlxuICpcbiAqIEBwYXJhbSBwYXJhbXMgLSBQYXJhbWV0ZXJzIGZvciBjYWxjdWxhdGlvbiBpbmNsdWRpbmcgb2Zmc2V0cyBhbmQgc2l6ZXNcbiAqIEByZXR1cm5zIE9iamVjdCBjb250YWluaW5nIGZpeGVkIGJ5dGUgbGVuZ3RoIGFuZCBvZmZzZXQgdmFsdWVzXG4gKlxuICogQHNlZSBodHRwczovL3d3dy5raHJvbm9zLm9yZy9yZWdpc3RyeS9nbFRGL3NwZWNzLzIuMC9nbFRGLTIuMC5odG1sI2RhdGEtYWxpZ25tZW50XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYWxjQnVmZmVyVmlld0J5dGVMZW5ndGhBbmRCeXRlT2Zmc2V0KHtcbiAgYWNjZXNzb3JCeXRlT2Zmc2V0LFxuICBhY2Nlc3NvckNvdW50LFxuICBidWZmZXJWaWV3Qnl0ZVN0cmlkZSxcbiAgYnVmZmVyVmlld0J5dGVPZmZzZXQsXG4gIHNpemVPZkNvbXBvbmVudCxcbiAgbnVtYmVyT2ZDb21wb25lbnRzLFxufTogQnVmZmVyVmlld0J5dGVMZW5ndGhEZXNjKToge1xuICBmaXhlZEJ1ZmZlclZpZXdCeXRlTGVuZ3RoOiBCeXRlO1xuICBmaXhlZEJ1ZmZlclZpZXdCeXRlT2Zmc2V0OiBCeXRlO1xufSB7XG4gIC8vIFdoZW4gYnl0ZVN0cmlkZSBvZiB0aGUgcmVmZXJlbmNlZCBidWZmZXJWaWV3IGlzIG5vdCBkZWZpbmVkLFxuICAvLyBpdCBtZWFucyB0aGF0IGFjY2Vzc29yIGVsZW1lbnRzIGFyZSB0aWdodGx5IHBhY2tlZCxcbiAgLy8gICBpLmUuLCBlZmZlY3RpdmUgc3RyaWRlIGVxdWFscyB0aGUgc2l6ZSBvZiB0aGUgZWxlbWVudC5cbiAgY29uc3QgZWZmZWN0aXZlQnl0ZVN0cmlkZSA9IGJ1ZmZlclZpZXdCeXRlU3RyaWRlID09PSAwID8gc2l6ZU9mQ29tcG9uZW50ICogbnVtYmVyT2ZDb21wb25lbnRzIDogYnVmZmVyVmlld0J5dGVTdHJpZGU7XG5cbiAgLy8gV2hlbiBieXRlU3RyaWRlIGlzIGRlZmluZWQsXG4gIC8vICAgaXQgTVVTVCBiZSBhIG11bHRpcGxlIG9mIHRoZSBzaXplIG9mIHRoZSBhY2Nlc3NvcidzIGNvbXBvbmVudCB0eXBlLlxuICBpZiAoYnVmZmVyVmlld0J5dGVTdHJpZGUgJSBzaXplT2ZDb21wb25lbnQgIT09IDApIHtcbiAgICB0aHJvdyBFcnJvcihcbiAgICAgIFwiZ2xURjI6IFdoZW4gYnl0ZVN0cmlkZSBpcyBkZWZpbmVkLCBpdCBNVVNUIGJlIGEgbXVsdGlwbGUgb2YgdGhlIHNpemUgb2YgdGhlIGFjY2Vzc29yJ3MgY29tcG9uZW50IHR5cGUuXCJcbiAgICApO1xuICB9XG5cbiAgLy8gTVVTVCBiZSA0IGJ5dGVzIGFsaWduZWRcbiAgY29uc3QgZWZmZWN0aXZlQnl0ZVN0cmlkZUFsaWduZWQgPSBhbGlnbkJ1ZmZlclZpZXdCeXRlU3RyaWRlVG80Qnl0ZXMoZWZmZWN0aXZlQnl0ZVN0cmlkZSk7XG4gIC8vIE1VU1QgYmUgNCBieXRlcyBhbGlnbmVkXG4gIGNvbnN0IGFsaWduZWRBY2Nlc3NvckJ5dGVPZmZzZXQgPSBhbGlnbkFjY2Vzc29yQnl0ZU9mZnNldFRvNEJ5dGVzKGFjY2Vzc29yQnl0ZU9mZnNldCk7XG5cbiAgLy8gY2FsYyBCdWZmZXJWaWV3IGJ5dGVMZW5ndGggYXMgZm9sbG93aW5nLFxuICAvL1xuICAvLyAgRWFjaCBhY2Nlc3NvciBNVVNUIGZpdCBpdHMgYnVmZmVyVmlldywgaS5lLixcbiAgLy8gIGBgYFxuICAvLyAgYWNjZXNzb3IuYnl0ZU9mZnNldCArIEVGRkVDVElWRV9CWVRFX1NUUklERSAqIChhY2Nlc3Nvci5jb3VudCAtIDEpICsgU0laRV9PRl9DT01QT05FTlQgKiBOVU1CRVJfT0ZfQ09NUE9ORU5UU1xuICAvLyAgYGBgXG4gIC8vICAgTVVTVCBiZSBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gYnVmZmVyVmlldy5sZW5ndGguXG4gIGNvbnN0IGJ1ZmZlclZpZXdCeXRlTGVuZ3RoID1cbiAgICBhbGlnbmVkQWNjZXNzb3JCeXRlT2Zmc2V0ICsgZWZmZWN0aXZlQnl0ZVN0cmlkZUFsaWduZWQgKiAoYWNjZXNzb3JDb3VudCAtIDEpICsgc2l6ZU9mQ29tcG9uZW50ICogbnVtYmVyT2ZDb21wb25lbnRzO1xuXG4gIC8vIFRoZSBvZmZzZXQgb2YgYW4gYWNjZXNzb3IgaW50byBhIGJ1ZmZlclZpZXcgKGkuZS4sIGFjY2Vzc29yLmJ5dGVPZmZzZXQpXG4gIC8vICAgYW5kIHRoZSBvZmZzZXQgb2YgYW4gYWNjZXNzb3IgaW50byBhIGJ1ZmZlciAoaS5lLiwgYWNjZXNzb3IuYnl0ZU9mZnNldCArIGJ1ZmZlclZpZXcuYnl0ZU9mZnNldClcbiAgLy8gICAgIE1VU1QgYmUgYSBtdWx0aXBsZSBvZiB0aGUgc2l6ZSBvZiB0aGUgYWNjZXNzb3IncyBjb21wb25lbnQgdHlwZS5cbiAgY29uc3QgdmFsQnl0ZUxlbmd0aCA9IHNpemVPZkNvbXBvbmVudCAqIG51bWJlck9mQ29tcG9uZW50cztcbiAgY29uc3Qgc3VtQnl0ZU9mZnNldCA9IGFsaWduZWRBY2Nlc3NvckJ5dGVPZmZzZXQgKyBidWZmZXJWaWV3Qnl0ZU9mZnNldDtcbiAgY29uc3QgcGFkZGluZ0J5dGUgPSB2YWxCeXRlTGVuZ3RoIC0gKHN1bUJ5dGVPZmZzZXQgJSB2YWxCeXRlTGVuZ3RoKTtcbiAgY29uc3QgZml4ZWRCdWZmZXJWaWV3Qnl0ZU9mZnNldCA9IGJ1ZmZlclZpZXdCeXRlT2Zmc2V0ICsgcGFkZGluZ0J5dGU7XG5cbiAgLy8gTVVTVCBiZSA0IGJ5dGVzIGFsaWduZWRcbiAgY29uc3QgYWxpZ25lZEJ1ZmZlclZpZXdCeXRlT2Zmc2V0ID0gYWxpZ25BY2Nlc3NvckJ5dGVPZmZzZXRUbzRCeXRlcyhmaXhlZEJ1ZmZlclZpZXdCeXRlT2Zmc2V0KTtcblxuICBjb25zdCBmaXhlZEJ1ZmZlclZpZXdCeXRlTGVuZ3RoID0gYnVmZmVyVmlld0J5dGVMZW5ndGg7XG4gIHJldHVybiB7XG4gICAgZml4ZWRCdWZmZXJWaWV3Qnl0ZUxlbmd0aCxcbiAgICBmaXhlZEJ1ZmZlclZpZXdCeXRlT2Zmc2V0OiBhbGlnbmVkQnVmZmVyVmlld0J5dGVPZmZzZXQsXG4gIH07XG59XG5cbi8qKlxuICogQ2xhbXBzIGEgd2VpZ2h0IHZhbHVlIHRvIHRoZSB2YWxpZCByYW5nZSBbMCwgMV0uXG4gKlxuICogQHBhcmFtIHZhbHVlIC0gVGhlIHdlaWdodCB2YWx1ZSB0byBjbGFtcFxuICogQHJldHVybnMgQ2xhbXBlZCB2YWx1ZSBiZXR3ZWVuIDAgYW5kIDFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsYW1wV2VpZ2h0KHZhbHVlOiBudW1iZXIpOiBudW1iZXIge1xuICBpZiAodmFsdWUgPCAwKSB7XG4gICAgcmV0dXJuIDA7XG4gIH1cbiAgaWYgKHZhbHVlID4gMSkge1xuICAgIHJldHVybiAxO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuLyoqXG4gKiBTYW5pdGl6ZXMgYSBza2luIHdlaWdodCB2YWx1ZSB0byBlbnN1cmUgaXQncyB2YWxpZC5cbiAqXG4gKiBFbnN1cmVzIHRoZSB3ZWlnaHQgaXMgZmluaXRlLCBub24tbmVnYXRpdmUsIGFuZCB3aXRoaW4gdGhlIHZhbGlkIHJhbmdlIFswLCAxXS5cbiAqXG4gKiBAcGFyYW0gd2VpZ2h0IC0gVGhlIHdlaWdodCB2YWx1ZSB0byBzYW5pdGl6ZVxuICogQHJldHVybnMgT2JqZWN0IGNvbnRhaW5pbmcgdGhlIHNhbml0aXplZCB2YWx1ZSBhbmQgd2hldGhlciBpdCB3YXMgbXV0YXRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gc2FuaXRpemVTa2luV2VpZ2h0KHdlaWdodDogbnVtYmVyKTogeyB2YWx1ZTogbnVtYmVyOyBtdXRhdGVkOiBib29sZWFuIH0ge1xuICBpZiAoIU51bWJlci5pc0Zpbml0ZSh3ZWlnaHQpIHx8IHdlaWdodCA8IDApIHtcbiAgICByZXR1cm4geyB2YWx1ZTogMCwgbXV0YXRlZDogd2VpZ2h0ICE9PSAwIH07XG4gIH1cbiAgaWYgKHdlaWdodCA+IDEpIHtcbiAgICByZXR1cm4geyB2YWx1ZTogMSwgbXV0YXRlZDogdHJ1ZSB9O1xuICB9XG4gIHJldHVybiB7IHZhbHVlOiB3ZWlnaHQsIG11dGF0ZWQ6IGZhbHNlIH07XG59XG5cbi8qKlxuICogR2V0cyB0aGUgbWF4aW11bSB2YWx1ZSBmb3IgYSBub3JtYWxpemVkIHVuc2lnbmVkIGNvbXBvbmVudCB0eXBlLlxuICpcbiAqIEBwYXJhbSBjb21wb25lbnRUeXBlIC0gVGhlIGNvbXBvbmVudCB0eXBlIGVudW1cbiAqIEByZXR1cm5zIE1heGltdW0gdmFsdWUgZm9yIHRoZSBjb21wb25lbnQgdHlwZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Tm9ybWFsaXplZFVuc2lnbmVkQ29tcG9uZW50TWF4KGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGVFbnVtKTogbnVtYmVyIHtcbiAgaWYgKGNvbXBvbmVudFR5cGUgPT09IENvbXBvbmVudFR5cGUuVW5zaWduZWRCeXRlKSB7XG4gICAgcmV0dXJuIDI1NTtcbiAgfVxuICBpZiAoY29tcG9uZW50VHlwZSA9PT0gQ29tcG9uZW50VHlwZS5VbnNpZ25lZFNob3J0KSB7XG4gICAgcmV0dXJuIDY1NTM1O1xuICB9XG4gIGlmIChjb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLlVuc2lnbmVkSW50KSB7XG4gICAgcmV0dXJuIDQyOTQ5NjcyOTU7XG4gIH1cbiAgcmV0dXJuIDE7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiB1bnNpZ25lZCB0eXBlZCBhcnJheSBiYXNlZCBvbiB0aGUgY29tcG9uZW50IHR5cGUuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudFR5cGUgLSBUaGUgY29tcG9uZW50IHR5cGUgZW51bVxuICogQHBhcmFtIGxlbmd0aCAtIFRoZSBsZW5ndGggb2YgdGhlIGFycmF5IHRvIGNyZWF0ZVxuICogQHJldHVybnMgVGhlIGNyZWF0ZWQgdHlwZWQgYXJyYXlcbiAqIEB0aHJvd3MgRXJyb3IgaWYgdGhlIGNvbXBvbmVudCB0eXBlIGlzIG5vdCBzdXBwb3J0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVVuc2lnbmVkVHlwZWRBcnJheShcbiAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZUVudW0sXG4gIGxlbmd0aDogbnVtYmVyXG4pOiBVaW50OEFycmF5IHwgVWludDE2QXJyYXkgfCBVaW50MzJBcnJheSB7XG4gIGlmIChjb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLlVuc2lnbmVkQnl0ZSkge1xuICAgIHJldHVybiBuZXcgVWludDhBcnJheShsZW5ndGgpO1xuICB9XG4gIGlmIChjb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLlVuc2lnbmVkU2hvcnQpIHtcbiAgICByZXR1cm4gbmV3IFVpbnQxNkFycmF5KGxlbmd0aCk7XG4gIH1cbiAgaWYgKGNvbXBvbmVudFR5cGUgPT09IENvbXBvbmVudFR5cGUuVW5zaWduZWRJbnQpIHtcbiAgICByZXR1cm4gbmV3IFVpbnQzMkFycmF5KGxlbmd0aCk7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKCdVbnN1cHBvcnRlZCBjb21wb25lbnQgdHlwZSBmb3Igbm9ybWFsaXplZCB3ZWlnaHRzJyk7XG59XG5cbi8qKlxuICogUGFyYW1ldGVycyBmb3IgY3JlYXRpbmcgYSBnbFRGMiBhY2Nlc3Nvci5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBHbHRmMkFjY2Vzc29yRGVzYyB7XG4gIC8qKiBJbmRleCBvZiB0aGUgYnVmZmVyIHZpZXcgKi9cbiAgYnVmZmVyVmlld0lkeDogSW5kZXg7XG4gIC8qKiBCeXRlIG9mZnNldCB3aXRoaW4gdGhlIGJ1ZmZlciB2aWV3ICovXG4gIGFjY2Vzc29yQnl0ZU9mZnNldDogQnl0ZTtcbiAgLyoqIENvbXBvbmVudCB0eXBlIChlLmcuLCBGTE9BVCwgVU5TSUdORURfU0hPUlQpICovXG4gIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGVFbnVtO1xuICAvKiogTnVtYmVyIG9mIGVsZW1lbnRzICovXG4gIGNvdW50OiBDb3VudDtcbiAgLyoqIENvbXBvc2l0aW9uIHR5cGUgKGUuZy4sIFZFQzMsIE1BVDQpICovXG4gIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlRW51bTtcbiAgLyoqIE1pbmltdW0gdmFsdWVzIGZvciBlYWNoIGNvbXBvbmVudCAqL1xuICBtaW4/OiBBcnJheTF0bzQ8bnVtYmVyPjtcbiAgLyoqIE1heGltdW0gdmFsdWVzIGZvciBlYWNoIGNvbXBvbmVudCAqL1xuICBtYXg/OiBBcnJheTF0bzQ8bnVtYmVyPjtcbn1cblxuLyoqXG4gKiBQYXJhbWV0ZXJzIGZvciBjcmVhdGluZyBhIGdsVEYyIGJ1ZmZlciB2aWV3LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEdsdGYyQnVmZmVyVmlld0Rlc2Mge1xuICAvKiogSW5kZXggb2YgdGhlIGJ1ZmZlciAqL1xuICBidWZmZXJJZHg6IEluZGV4O1xuICAvKiogQnl0ZSBvZmZzZXQgd2l0aGluIHRoZSBidWZmZXIgKi9cbiAgYnVmZmVyVmlld0J5dGVPZmZzZXQ6IEJ5dGU7XG4gIC8qKiBBY2Nlc3NvciBieXRlIG9mZnNldCB3aXRoaW4gdGhlIGJ1ZmZlciB2aWV3ICovXG4gIGFjY2Vzc29yQnl0ZU9mZnNldDogQnl0ZTtcbiAgLyoqIE51bWJlciBvZiBhY2Nlc3NvciBlbGVtZW50cyAqL1xuICBhY2Nlc3NvckNvdW50OiBDb3VudDtcbiAgLyoqIEJ5dGUgc3RyaWRlIG9mIHRoZSBidWZmZXIgdmlldyAqL1xuICBidWZmZXJWaWV3Qnl0ZVN0cmlkZTogQnl0ZTtcbiAgLyoqIENvbXBvbmVudCB0eXBlICovXG4gIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGVFbnVtO1xuICAvKiogQ29tcG9zaXRpb24gdHlwZSAqL1xuICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZUVudW07XG4gIC8qKiBSYXcgZGF0YSBhcyBVaW50OEFycmF5ICovXG4gIHVpbnQ4QXJyYXk6IFVpbnQ4QXJyYXk7XG59XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgYWNjZXNzb3IgaW5kZXggZm9yIGRlZHVwbGljYXRpb24gcHVycG9zZXMuXG4gKlxuICogQHBhcmFtIGV4aXN0aW5nVW5pcXVlUm5BY2Nlc3NvcnMgLSBBcnJheSBvZiB1bmlxdWUgYWNjZXNzb3JzXG4gKiBAcGFyYW0gcm5BY2Nlc3NvciAtIFRoZSBhY2Nlc3NvciB0byBmaW5kXG4gKiBAcmV0dXJucyBJbmRleCBvZiB0aGUgYWNjZXNzb3Igb3IgLTEgaWYgbm90IGZvdW5kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYWxjQWNjZXNzb3JJZHhUb1NldChleGlzdGluZ1VuaXF1ZVJuQWNjZXNzb3JzOiBBY2Nlc3NvcltdLCBybkFjY2Vzc29yOiBBY2Nlc3Nvcik6IG51bWJlciB7XG4gIGNvbnN0IGFjY2Vzc29ySWR4ID0gZXhpc3RpbmdVbmlxdWVSbkFjY2Vzc29ycy5maW5kSW5kZXgoYWNjZXNzb3IgPT4ge1xuICAgIHJldHVybiBhY2Nlc3Nvci5pc1NhbWUocm5BY2Nlc3Nvcik7XG4gIH0pO1xuICByZXR1cm4gYWNjZXNzb3JJZHg7XG59XG5cbi8qKlxuICogRmluZHMgdGhlIGluZGV4IG9mIGFuIGV4aXN0aW5nIGJ1ZmZlciB2aWV3IGluIHRoZSBjYWNoZS5cbiAqXG4gKiBAcGFyYW0gZXhpc3RpbmdVbmlxdWVSbkJ1ZmZlclZpZXdzIC0gQXJyYXkgb2YgdW5pcXVlIGJ1ZmZlciB2aWV3c1xuICogQHBhcmFtIHJuQnVmZmVyVmlldyAtIFRoZSBidWZmZXIgdmlldyB0byBzZWFyY2ggZm9yXG4gKiBAcmV0dXJucyBJbmRleCBvZiB0aGUgYnVmZmVyIHZpZXcgb3IgLTEgaWYgbm90IGZvdW5kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kQnVmZmVyVmlld0lkeChleGlzdGluZ1VuaXF1ZVJuQnVmZmVyVmlld3M6IEJ1ZmZlclZpZXdbXSwgcm5CdWZmZXJWaWV3OiBCdWZmZXJWaWV3KTogbnVtYmVyIHtcbiAgY29uc3QgYnVmZmVyVmlld0lkeCA9IGV4aXN0aW5nVW5pcXVlUm5CdWZmZXJWaWV3cy5maW5kSW5kZXgoYnVmZmVyVmlldyA9PiBidWZmZXJWaWV3LmlzU2FtZShybkJ1ZmZlclZpZXcpKTtcbiAgcmV0dXJuIGJ1ZmZlclZpZXdJZHg7XG59XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgYnVmZmVyIGluZGV4IGZvciBkZWR1cGxpY2F0aW9uIHB1cnBvc2VzLlxuICpcbiAqIEBwYXJhbSBleGlzdGluZ1VuaXF1ZVJuQnVmZmVycyAtIEFycmF5IG9mIHVuaXF1ZSBidWZmZXJzXG4gKiBAcGFyYW0gcm5CdWZmZXIgLSBUaGUgYnVmZmVyIHRvIGZpbmQgb3IgYWRkXG4gKiBAcmV0dXJucyBJbmRleCB3aGVyZSB0aGUgYnVmZmVyIHNob3VsZCBiZSBwbGFjZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbGNCdWZmZXJJZHhUb1NldChleGlzdGluZ1VuaXF1ZVJuQnVmZmVyczogQnVmZmVyW10sIHJuQnVmZmVyOiBCdWZmZXIpOiBudW1iZXIge1xuICBpZiAoZXhpc3RpbmdVbmlxdWVSbkJ1ZmZlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgZXhpc3RpbmdVbmlxdWVSbkJ1ZmZlcnMucHVzaChybkJ1ZmZlcik7XG4gIH1cbiAgY29uc3QgYnVmZmVySWR4ID0gZXhpc3RpbmdVbmlxdWVSbkJ1ZmZlcnMuZmluZEluZGV4KGJ1ZmZlciA9PiBidWZmZXIuaXNTYW1lKHJuQnVmZmVyKSk7XG4gIGNvbnN0IGJ1ZmZlcklkeFRvU2V0ID0gYnVmZmVySWR4ID09PSAtMSA/IGV4aXN0aW5nVW5pcXVlUm5CdWZmZXJzLmxlbmd0aCA6IGJ1ZmZlcklkeDtcbiAgaWYgKGJ1ZmZlcklkeCA9PT0gLTEpIHtcbiAgICBleGlzdGluZ1VuaXF1ZVJuQnVmZmVycy5wdXNoKHJuQnVmZmVyKTtcbiAgfVxuICByZXR1cm4gYnVmZmVySWR4VG9TZXQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIGdsVEYyIEJ1ZmZlclZpZXcgZm9yIGFuaW1hdGlvbiBkYXRhLlxuICpcbiAqIEBwYXJhbSBwYXJhbXMgLSBQYXJhbWV0ZXJzIGZvciBidWZmZXIgdmlldyBjcmVhdGlvblxuICogQHJldHVybnMgQ3JlYXRlZCBnbFRGMiBidWZmZXIgdmlldyB3aXRoIHByb3BlciBhbGlnbm1lbnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUdsdGYyQnVmZmVyVmlld0ZvckFuaW1hdGlvbih7XG4gIGJ1ZmZlcklkeCxcbiAgYnVmZmVyVmlld0J5dGVPZmZzZXQsXG4gIGFjY2Vzc29yQnl0ZU9mZnNldCxcbiAgYWNjZXNzb3JDb3VudCxcbiAgYnVmZmVyVmlld0J5dGVTdHJpZGUsXG4gIGNvbXBvbmVudFR5cGUsXG4gIGNvbXBvc2l0aW9uVHlwZSxcbiAgdWludDhBcnJheSxcbn06IEdsdGYyQnVmZmVyVmlld0Rlc2MpOiBHbHRmMkJ1ZmZlclZpZXdFeCB7XG4gIGNvbnN0IGFsaWduZWRBY2Nlc3NvckJ5dGVPZmZzZXQgPSBhbGlnbkFjY2Vzc29yQnl0ZU9mZnNldFRvNEJ5dGVzKGFjY2Vzc29yQnl0ZU9mZnNldCk7XG4gIGNvbnN0IHsgZml4ZWRCdWZmZXJWaWV3Qnl0ZUxlbmd0aCwgZml4ZWRCdWZmZXJWaWV3Qnl0ZU9mZnNldCB9ID0gY2FsY0J1ZmZlclZpZXdCeXRlTGVuZ3RoQW5kQnl0ZU9mZnNldCh7XG4gICAgYWNjZXNzb3JCeXRlT2Zmc2V0OiBhbGlnbmVkQWNjZXNzb3JCeXRlT2Zmc2V0LFxuICAgIGFjY2Vzc29yQ291bnQ6IGFjY2Vzc29yQ291bnQsXG4gICAgYnVmZmVyVmlld0J5dGVTdHJpZGUsXG4gICAgYnVmZmVyVmlld0J5dGVPZmZzZXQsXG4gICAgc2l6ZU9mQ29tcG9uZW50OiBjb21wb25lbnRUeXBlLmdldFNpemVJbkJ5dGVzKCksXG4gICAgbnVtYmVyT2ZDb21wb25lbnRzOiBjb21wb3NpdGlvblR5cGUuZ2V0TnVtYmVyT2ZDb21wb25lbnRzKCksXG4gIH0pO1xuXG4gIGNvbnN0IGdsdGZCdWZmZXJWaWV3RXg6IEdsdGYyQnVmZmVyVmlld0V4ID0ge1xuICAgIGJ1ZmZlcjogYnVmZmVySWR4LFxuICAgIGJ5dGVMZW5ndGg6IGZpeGVkQnVmZmVyVmlld0J5dGVMZW5ndGgsXG4gICAgYnl0ZU9mZnNldDogZml4ZWRCdWZmZXJWaWV3Qnl0ZU9mZnNldCxcbiAgICBleHRyYXM6IHtcbiAgICAgIHVpbnQ4QXJyYXksXG4gICAgfSxcbiAgfTtcblxuICByZXR1cm4gZ2x0ZkJ1ZmZlclZpZXdFeDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgZ2xURjIgQWNjZXNzb3IgZm9yIGFuaW1hdGlvbiBkYXRhLlxuICpcbiAqIEBwYXJhbSBwYXJhbXMgLSBQYXJhbWV0ZXJzIGZvciBhY2Nlc3NvciBjcmVhdGlvblxuICogQHJldHVybnMgQ3JlYXRlZCBnbFRGMiBhY2Nlc3NvciB3aXRoIHByb3BlciB0eXBlIGluZm9ybWF0aW9uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVHbHRmMkFjY2Vzc29yRm9yQW5pbWF0aW9uKHtcbiAgYnVmZmVyVmlld0lkeCxcbiAgYWNjZXNzb3JCeXRlT2Zmc2V0LFxuICBjb21wb25lbnRUeXBlLFxuICBjb3VudCxcbiAgY29tcG9zaXRpb25UeXBlLFxuICBtaW4sXG4gIG1heCxcbn06IEdsdGYyQWNjZXNzb3JEZXNjKTogR2x0ZjJBY2Nlc3NvckV4IHtcbiAgY29uc3QgYWxpZ25lZEFjY2Vzc29yQnl0ZU9mZnNldCA9IGFsaWduQWNjZXNzb3JCeXRlT2Zmc2V0VG80Qnl0ZXMoYWNjZXNzb3JCeXRlT2Zmc2V0KTtcblxuICBjb25zdCBnbHRmMkFjY2Vzc29yRXggPSB7XG4gICAgYnVmZmVyVmlldzogYnVmZmVyVmlld0lkeCxcbiAgICBieXRlT2Zmc2V0OiBhbGlnbmVkQWNjZXNzb3JCeXRlT2Zmc2V0LFxuICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUudG9HbHRmMkFjY2Vzc29yQ29tcG9uZW50VHlwZShjb21wb25lbnRUeXBlKSxcbiAgICBjb3VudCxcbiAgICB0eXBlOiBjb21wb3NpdGlvblR5cGUuc3RyIGFzIEdsdGYyQWNjZXNzb3JDb21wb3NpdGlvblR5cGVTdHJpbmcsXG4gICAgbWluLFxuICAgIG1heCxcbiAgICBleHRyYXM6IHt9LFxuICB9O1xuICByZXR1cm4gZ2x0ZjJBY2Nlc3NvckV4O1xufVxuXG4vKipcbiAqIEVwc2lsb24gdmFsdWUgZm9yIHRhbmdlbnQgdmVjdG9yIGNhbGN1bGF0aW9ucy5cbiAqL1xuZXhwb3J0IGNvbnN0IFRBTkdFTlRfRVBTSUxPTiA9IDFlLTY7XG5cbi8qKlxuICogRXBzaWxvbiB2YWx1ZSBmb3Igc2tpbiB3ZWlnaHQgc3VtIGNhbGN1bGF0aW9ucy5cbiAqL1xuZXhwb3J0IGNvbnN0IFNLSU5fV0VJR0hUX1NVTV9FUFNJTE9OID0gMWUtNjtcblxuLyoqXG4gKiBFcHNpbG9uIHZhbHVlIGZvciBza2luIHdlaWdodCBkaWZmZXJlbmNlIGNhbGN1bGF0aW9ucy5cbiAqL1xuZXhwb3J0IGNvbnN0IFNLSU5fV0VJR0hUX0RJRkZfRVBTSUxPTiA9IDFlLTY7XG5cbi8qKlxuICogVG9sZXJhbmNlIHZhbHVlIGZvciBza2luIHdlaWdodCByZXNpZHVhbCBjYWxjdWxhdGlvbnMuXG4gKi9cbmV4cG9ydCBjb25zdCBTS0lOX1dFSUdIVF9SRVNJRFVBTF9UT0xFUkFOQ0UgPSAxZS02O1xuXG4vKipcbiAqIFR5cGUgZGVmaW5pdGlvbiBmb3Igd2VpZ2h0IHR5cGVkIGFycmF5cy5cbiAqL1xuZXhwb3J0IHR5cGUgV2VpZ2h0VHlwZWRBcnJheSA9IEZsb2F0MzJBcnJheSB8IFVpbnQ4QXJyYXkgfCBVaW50MTZBcnJheSB8IFVpbnQzMkFycmF5O1xuXG4vKipcbiAqIEFjY3VtdWxhdGVzIGEgM0QgdmVjdG9yIGludG8gYSBGbG9hdDMyQXJyYXkgYXQgdGhlIHNwZWNpZmllZCBpbmRleC5cbiAqXG4gKiBAcGFyYW0gYXJyYXkgLSBUaGUgRmxvYXQzMkFycmF5IHRvIGFjY3VtdWxhdGUgaW50b1xuICogQHBhcmFtIGluZGV4IC0gVGhlIGluZGV4IG9mIHRoZSB2ZWN0b3JcbiAqIEBwYXJhbSB4IC0gWCBjb21wb25lbnRcbiAqIEBwYXJhbSB5IC0gWSBjb21wb25lbnRcbiAqIEBwYXJhbSB6IC0gWiBjb21wb25lbnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFjY3VtdWxhdGVWZWN0b3IzKGFycmF5OiBGbG9hdDMyQXJyYXksIGluZGV4OiBudW1iZXIsIHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIpOiB2b2lkIHtcbiAgYXJyYXlbaW5kZXggKiAzICsgMF0gKz0geDtcbiAgYXJyYXlbaW5kZXggKiAzICsgMV0gKz0geTtcbiAgYXJyYXlbaW5kZXggKiAzICsgMl0gKz0gejtcbn1cblxuLyoqXG4gKiBCdWlsZHMgYW4gb3J0aG9ub3JtYWwgdmVjdG9yIHBlcnBlbmRpY3VsYXIgdG8gdGhlIGdpdmVuIG5vcm1hbC5cbiAqXG4gKiBDcmVhdGVzIGEgdmVjdG9yIHRoYXQgaXMgb3J0aG9nb25hbCB0byB0aGUgcHJvdmlkZWQgbm9ybWFsIHZlY3RvcixcbiAqIHVzZWQgYXMgYSBmYWxsYmFjayB3aGVuIHRhbmdlbnQgdmVjdG9ycyBhcmUgZGVnZW5lcmF0ZS5cbiAqXG4gKiBAcGFyYW0gbm9ybWFsIC0gT3B0aW9uYWwgbm9ybWFsIHZlY3RvclxuICogQHJldHVybnMgT3J0aG9ub3JtYWwgdmVjdG9yXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBidWlsZE9ydGhvbm9ybWFsVmVjdG9yKG5vcm1hbD86IHsgeDogbnVtYmVyOyB5OiBudW1iZXI7IHo6IG51bWJlciB9KToge1xuICB4OiBudW1iZXI7XG4gIHk6IG51bWJlcjtcbiAgejogbnVtYmVyO1xufSB7XG4gIGlmICghbm9ybWFsKSB7XG4gICAgcmV0dXJuIHsgeDogMSwgeTogMCwgejogMCB9O1xuICB9XG5cbiAgY29uc3QgbnggPSBub3JtYWwueDtcbiAgY29uc3QgbnkgPSBub3JtYWwueTtcbiAgY29uc3QgbnogPSBub3JtYWwuejtcbiAgY29uc3Qgbm9ybWFsTGVuZ3RoID0gTWF0aC5oeXBvdChueCwgbnksIG56KTtcblxuICBsZXQgdXggPSAwO1xuICBsZXQgdXkgPSAwO1xuICBsZXQgdXogPSAxO1xuXG4gIGlmIChub3JtYWxMZW5ndGggPiBUQU5HRU5UX0VQU0lMT04pIHtcbiAgICBjb25zdCBpbnZMZW5ndGggPSAxIC8gbm9ybWFsTGVuZ3RoO1xuICAgIGNvbnN0IG5ueCA9IG54ICogaW52TGVuZ3RoO1xuICAgIGNvbnN0IG5ueSA9IG55ICogaW52TGVuZ3RoO1xuICAgIGNvbnN0IG5ueiA9IG56ICogaW52TGVuZ3RoO1xuXG4gICAgaWYgKE1hdGguYWJzKG5ueCkgPCAwLjk5OSkge1xuICAgICAgdXggPSAxO1xuICAgICAgdXkgPSAwO1xuICAgICAgdXogPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICB1eCA9IDA7XG4gICAgICB1eSA9IDE7XG4gICAgICB1eiA9IDA7XG4gICAgfVxuXG4gICAgLy8gdGFuZ2VudCA9IG5vcm1hbGl6ZShjcm9zcyh1cCwgbm9ybWFsKSlcbiAgICBjb25zdCB0eCA9IHV5ICogbm56IC0gdXogKiBubnk7XG4gICAgY29uc3QgdHkgPSB1eiAqIG5ueCAtIHV4ICogbm56O1xuICAgIGNvbnN0IHR6ID0gdXggKiBubnkgLSB1eSAqIG5ueDtcbiAgICBjb25zdCB0TGVuZ3RoID0gTWF0aC5oeXBvdCh0eCwgdHksIHR6KTtcbiAgICBpZiAodExlbmd0aCA+IFRBTkdFTlRfRVBTSUxPTikge1xuICAgICAgY29uc3QgaW52ID0gMSAvIHRMZW5ndGg7XG4gICAgICByZXR1cm4geyB4OiB0eCAqIGludiwgeTogdHkgKiBpbnYsIHo6IHR6ICogaW52IH07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHsgeDogMSwgeTogMCwgejogMCB9O1xufVxuXG4vKipcbiAqIE5vcm1hbGl6ZXMgYSB0YW5nZW50IHZlY3RvciBhbmQgZW5zdXJlcyBpdCdzIG9ydGhvZ29uYWwgdG8gdGhlIG5vcm1hbC5cbiAqXG4gKiBIYW5kbGVzIGRlZ2VuZXJhdGUgY2FzZXMgd2hlcmUgdGhlIHRhbmdlbnQgdmVjdG9yIGlzIHRvbyBzbWFsbCBvciBwYXJhbGxlbFxuICogdG8gdGhlIG5vcm1hbCB2ZWN0b3IgYnkgdXNpbmcgYSBmYWxsYmFjayBvcnRob25vcm1hbCB2ZWN0b3IuXG4gKlxuICogQHBhcmFtIHRhbmdlbnQgLSBUaGUgdGFuZ2VudCB2ZWN0b3IgdG8gbm9ybWFsaXplXG4gKiBAcGFyYW0gbm9ybWFsIC0gT3B0aW9uYWwgbm9ybWFsIHZlY3RvciBmb3Igb3J0aG9nb25hbGl6YXRpb25cbiAqIEBwYXJhbSBiaXRhbmdlbnQgLSBPcHRpb25hbCBiaXRhbmdlbnQgdmVjdG9yIGZvciBoYW5kZWRuZXNzIGNhbGN1bGF0aW9uXG4gKiBAcmV0dXJucyBOb3JtYWxpemVkIHRhbmdlbnQgdmVjdG9yIHdpdGggdyBjb21wb25lbnQgaW5kaWNhdGluZyBoYW5kZWRuZXNzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVUYW5nZW50VmVjdG9yKFxuICB0YW5nZW50OiB7IHg6IG51bWJlcjsgeTogbnVtYmVyOyB6OiBudW1iZXI7IHc6IG51bWJlciB9LFxuICBub3JtYWw/OiB7IHg6IG51bWJlcjsgeTogbnVtYmVyOyB6OiBudW1iZXIgfSxcbiAgYml0YW5nZW50PzogeyB4OiBudW1iZXI7IHk6IG51bWJlcjsgejogbnVtYmVyIH1cbik6IHsgeDogbnVtYmVyOyB5OiBudW1iZXI7IHo6IG51bWJlcjsgdzogbnVtYmVyIH0ge1xuICBsZXQgdHggPSB0YW5nZW50Lng7XG4gIGxldCB0eSA9IHRhbmdlbnQueTtcbiAgbGV0IHR6ID0gdGFuZ2VudC56O1xuXG4gIGlmIChub3JtYWwpIHtcbiAgICBjb25zdCBkb3ROVCA9IG5vcm1hbC54ICogdHggKyBub3JtYWwueSAqIHR5ICsgbm9ybWFsLnogKiB0ejtcbiAgICB0eCAtPSBub3JtYWwueCAqIGRvdE5UO1xuICAgIHR5IC09IG5vcm1hbC55ICogZG90TlQ7XG4gICAgdHogLT0gbm9ybWFsLnogKiBkb3ROVDtcbiAgfVxuXG4gIGxldCBsZW5ndGggPSBNYXRoLmh5cG90KHR4LCB0eSwgdHopO1xuICBpZiAobGVuZ3RoIDw9IFRBTkdFTlRfRVBTSUxPTikge1xuICAgIGNvbnN0IGZhbGxiYWNrID0gYnVpbGRPcnRob25vcm1hbFZlY3Rvcihub3JtYWwpO1xuICAgIHR4ID0gZmFsbGJhY2sueDtcbiAgICB0eSA9IGZhbGxiYWNrLnk7XG4gICAgdHogPSBmYWxsYmFjay56O1xuICAgIGxlbmd0aCA9IDE7XG4gIH0gZWxzZSB7XG4gICAgdHggLz0gbGVuZ3RoO1xuICAgIHR5IC89IGxlbmd0aDtcbiAgICB0eiAvPSBsZW5ndGg7XG4gIH1cblxuICBsZXQgdyA9IHRhbmdlbnQudyAhPT0gMCA/ICh0YW5nZW50LncgPj0gMCA/IDEgOiAtMSkgOiAxO1xuICBpZiAobm9ybWFsICYmIGJpdGFuZ2VudCkge1xuICAgIGNvbnN0IGNyb3NzWCA9IG5vcm1hbC55ICogdHogLSBub3JtYWwueiAqIHR5O1xuICAgIGNvbnN0IGNyb3NzWSA9IG5vcm1hbC56ICogdHggLSBub3JtYWwueCAqIHR6O1xuICAgIGNvbnN0IGNyb3NzWiA9IG5vcm1hbC54ICogdHkgLSBub3JtYWwueSAqIHR4O1xuICAgIGNvbnN0IGhhbmRlZG5lc3MgPSBjcm9zc1ggKiBiaXRhbmdlbnQueCArIGNyb3NzWSAqIGJpdGFuZ2VudC55ICsgY3Jvc3NaICogYml0YW5nZW50Lno7XG4gICAgaWYgKGhhbmRlZG5lc3MgPCAwKSB7XG4gICAgICB3ID0gLTE7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHsgeDogdHgsIHk6IHR5LCB6OiB0eiwgdyB9O1xufVxuXG4vKipcbiAqIFByb2Nlc3NlcyBhIHNpbmdsZSBza2luIHdlaWdodCBlbGVtZW50LCBzYW5pdGl6aW5nIGFuZCBub3JtYWxpemluZyB2YWx1ZXMuXG4gKlxuICogQHBhcmFtIGFjY2Vzc29yIC0gVGhlIGFjY2Vzc29yIGNvbnRhaW5pbmcgd2VpZ2h0IGRhdGFcbiAqIEBwYXJhbSBlbGVtZW50SW5kZXggLSBJbmRleCBvZiB0aGUgZWxlbWVudCB0byBwcm9jZXNzXG4gKiBAcGFyYW0gYmFzZUluZGV4IC0gQmFzZSBpbmRleCBpbiB0aGUgZmxvYXQgZGF0YSBhcnJheVxuICogQHBhcmFtIGNvbXBvbmVudENvdW50IC0gTnVtYmVyIG9mIGNvbXBvbmVudHMgcGVyIGVsZW1lbnRcbiAqIEBwYXJhbSB0cmVhdEFzTm9ybWFsaXplZFVuc2lnbmVkSW50IC0gV2hldGhlciB0byB0cmVhdCB2YWx1ZXMgYXMgbm9ybWFsaXplZCB1bnNpZ25lZCBpbnRlZ2Vyc1xuICogQHBhcmFtIG5vcm1hbGl6YXRpb25EZW5vbWluYXRvciAtIERlbm9taW5hdG9yIGZvciBub3JtYWxpemF0aW9uXG4gKiBAcGFyYW0gZmxvYXREYXRhIC0gRmxvYXQzMkFycmF5IHRvIHN0b3JlIHByb2Nlc3NlZCBkYXRhXG4gKiBAcmV0dXJucyBUcnVlIGlmIGFueSB2YWx1ZXMgd2VyZSBtdXRhdGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm9jZXNzU2tpbldlaWdodEVsZW1lbnQoXG4gIGFjY2Vzc29yOiBBY2Nlc3NvcixcbiAgZWxlbWVudEluZGV4OiBudW1iZXIsXG4gIGJhc2VJbmRleDogbnVtYmVyLFxuICBjb21wb25lbnRDb3VudDogbnVtYmVyLFxuICB0cmVhdEFzTm9ybWFsaXplZFVuc2lnbmVkSW50OiBib29sZWFuLFxuICBub3JtYWxpemF0aW9uRGVub21pbmF0b3I6IG51bWJlcixcbiAgZmxvYXREYXRhOiBGbG9hdDMyQXJyYXlcbik6IGJvb2xlYW4ge1xuICBsZXQgbXV0YXRlZCA9IGZhbHNlO1xuICBsZXQgc3VtID0gMDtcblxuICBmb3IgKGxldCBjb21wb25lbnRJbmRleCA9IDA7IGNvbXBvbmVudEluZGV4IDwgY29tcG9uZW50Q291bnQ7IGNvbXBvbmVudEluZGV4KyspIHtcbiAgICBjb25zdCBvZmZzZXQgPSBjb21wb25lbnRJbmRleCAqIGFjY2Vzc29yLmNvbXBvbmVudFNpemVJbkJ5dGVzO1xuICAgIGNvbnN0IHJhd1ZhbHVlID0gYWNjZXNzb3IuZ2V0U2NhbGFyQXQoZWxlbWVudEluZGV4LCBvZmZzZXQsIHt9KTtcbiAgICBjb25zdCBzY2FsZWQgPSB0cmVhdEFzTm9ybWFsaXplZFVuc2lnbmVkSW50ID8gcmF3VmFsdWUgLyBub3JtYWxpemF0aW9uRGVub21pbmF0b3IgOiByYXdWYWx1ZTtcbiAgICBjb25zdCBzYW5pdGl6ZWQgPSBzYW5pdGl6ZVNraW5XZWlnaHQoc2NhbGVkKTtcbiAgICBpZiAoc2FuaXRpemVkLm11dGF0ZWQpIHtcbiAgICAgIG11dGF0ZWQgPSB0cnVlO1xuICAgIH1cbiAgICBmbG9hdERhdGFbYmFzZUluZGV4ICsgY29tcG9uZW50SW5kZXhdID0gc2FuaXRpemVkLnZhbHVlO1xuICAgIHN1bSArPSBzYW5pdGl6ZWQudmFsdWU7XG4gIH1cblxuICBpZiAobm9ybWFsaXplU2tpbldlaWdodEVsZW1lbnQoZmxvYXREYXRhLCBiYXNlSW5kZXgsIGNvbXBvbmVudENvdW50LCBzdW0pKSB7XG4gICAgbXV0YXRlZCA9IHRydWU7XG4gIH1cblxuICByZXR1cm4gbXV0YXRlZDtcbn1cblxuLyoqXG4gKiBOb3JtYWxpemVzIHNraW4gd2VpZ2h0IGVsZW1lbnRzIHRvIHN1bSB0byAxLjAuXG4gKlxuICogQHBhcmFtIGZsb2F0RGF0YSAtIEZsb2F0MzJBcnJheSBjb250YWluaW5nIHdlaWdodCBkYXRhXG4gKiBAcGFyYW0gYmFzZUluZGV4IC0gQmFzZSBpbmRleCBvZiB0aGUgZWxlbWVudFxuICogQHBhcmFtIGNvbXBvbmVudENvdW50IC0gTnVtYmVyIG9mIGNvbXBvbmVudHMgcGVyIGVsZW1lbnRcbiAqIEBwYXJhbSBzdW0gLSBDdXJyZW50IHN1bSBvZiB3ZWlnaHRzXG4gKiBAcmV0dXJucyBUcnVlIGlmIG5vcm1hbGl6YXRpb24gd2FzIHBlcmZvcm1lZFxuICovXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplU2tpbldlaWdodEVsZW1lbnQoXG4gIGZsb2F0RGF0YTogRmxvYXQzMkFycmF5LFxuICBiYXNlSW5kZXg6IG51bWJlcixcbiAgY29tcG9uZW50Q291bnQ6IG51bWJlcixcbiAgc3VtOiBudW1iZXJcbik6IGJvb2xlYW4ge1xuICBpZiAoc3VtID4gU0tJTl9XRUlHSFRfU1VNX0VQU0lMT04pIHtcbiAgICBpZiAoTWF0aC5hYnMoc3VtIC0gMSkgPiBTS0lOX1dFSUdIVF9ESUZGX0VQU0lMT04pIHtcbiAgICAgIGNvbnN0IGludlN1bSA9IDEgLyBzdW07XG4gICAgICBsZXQgbm9ybWFsaXplZFN1bSA9IDA7XG4gICAgICBmb3IgKGxldCBjb21wb25lbnRJbmRleCA9IDA7IGNvbXBvbmVudEluZGV4IDwgY29tcG9uZW50Q291bnQ7IGNvbXBvbmVudEluZGV4KyspIHtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZCA9IE1hdGguZnJvdW5kKGZsb2F0RGF0YVtiYXNlSW5kZXggKyBjb21wb25lbnRJbmRleF0gKiBpbnZTdW0pO1xuICAgICAgICBmbG9hdERhdGFbYmFzZUluZGV4ICsgY29tcG9uZW50SW5kZXhdID0gbm9ybWFsaXplZDtcbiAgICAgICAgbm9ybWFsaXplZFN1bSArPSBub3JtYWxpemVkO1xuICAgICAgfVxuICAgICAgY29uc3QgcmVzaWR1YWwgPSAxIC0gbm9ybWFsaXplZFN1bTtcbiAgICAgIGFkanVzdFdlaWdodHNGb3JSZXNpZHVhbChmbG9hdERhdGEsIGJhc2VJbmRleCwgY29tcG9uZW50Q291bnQsIHJlc2lkdWFsLCBTS0lOX1dFSUdIVF9SRVNJRFVBTF9UT0xFUkFOQ0UpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoc3VtICE9PSAwKSB7XG4gICAgZm9yIChsZXQgY29tcG9uZW50SW5kZXggPSAwOyBjb21wb25lbnRJbmRleCA8IGNvbXBvbmVudENvdW50OyBjb21wb25lbnRJbmRleCsrKSB7XG4gICAgICBmbG9hdERhdGFbYmFzZUluZGV4ICsgY29tcG9uZW50SW5kZXhdID0gMDtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIFNjYWxlcyBza2luIHdlaWdodCBlbGVtZW50cyB0byB1bnNpZ25lZCBpbnRlZ2VyIHJhbmdlLlxuICpcbiAqIEBwYXJhbSBmbG9hdERhdGEgLSBGbG9hdDMyQXJyYXkgY29udGFpbmluZyBub3JtYWxpemVkIHdlaWdodCBkYXRhXG4gKiBAcGFyYW0gYmFzZUluZGV4IC0gQmFzZSBpbmRleCBvZiB0aGUgZWxlbWVudFxuICogQHBhcmFtIGNvbXBvbmVudENvdW50IC0gTnVtYmVyIG9mIGNvbXBvbmVudHMgcGVyIGVsZW1lbnRcbiAqIEBwYXJhbSB0eXBlZEFycmF5IC0gVGFyZ2V0IHR5cGVkIGFycmF5IGZvciBzY2FsZWQgdmFsdWVzXG4gKiBAcGFyYW0gbWF4VmFsdWUgLSBNYXhpbXVtIHZhbHVlIGZvciB0aGUgY29tcG9uZW50IHR5cGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNjYWxlU2tpbldlaWdodEVsZW1lbnRUb1Vuc2lnbmVkKFxuICBmbG9hdERhdGE6IEZsb2F0MzJBcnJheSxcbiAgYmFzZUluZGV4OiBudW1iZXIsXG4gIGNvbXBvbmVudENvdW50OiBudW1iZXIsXG4gIHR5cGVkQXJyYXk6IFdlaWdodFR5cGVkQXJyYXksXG4gIG1heFZhbHVlOiBudW1iZXJcbik6IHZvaWQge1xuICBjb25zdCBzY2FsZWQgPSBuZXcgQXJyYXk8bnVtYmVyPihjb21wb25lbnRDb3VudCk7XG4gIGxldCB0b3RhbCA9IDA7XG5cbiAgZm9yIChsZXQgY29tcG9uZW50SW5kZXggPSAwOyBjb21wb25lbnRJbmRleCA8IGNvbXBvbmVudENvdW50OyBjb21wb25lbnRJbmRleCsrKSB7XG4gICAgY29uc3QgY2xhbXBlZCA9IE1hdGgubWF4KDAsIE1hdGgubWluKGZsb2F0RGF0YVtiYXNlSW5kZXggKyBjb21wb25lbnRJbmRleF0sIDEpKTtcbiAgICBjb25zdCB2YWx1ZSA9IE1hdGgucm91bmQoY2xhbXBlZCAqIG1heFZhbHVlKTtcbiAgICBzY2FsZWRbY29tcG9uZW50SW5kZXhdID0gdmFsdWU7XG4gICAgdG90YWwgKz0gdmFsdWU7XG4gIH1cblxuICBsZXQgZGlmZiA9IG1heFZhbHVlIC0gdG90YWw7XG4gIGlmIChkaWZmICE9PSAwKSB7XG4gICAgcmViYWxhbmNlU2NhbGVkU2tpbldlaWdodHMoZGlmZiwgc2NhbGVkLCBjb21wb25lbnRDb3VudCwgbWF4VmFsdWUsIGZsb2F0RGF0YSwgYmFzZUluZGV4KTtcbiAgfVxuXG4gIGZvciAobGV0IGNvbXBvbmVudEluZGV4ID0gMDsgY29tcG9uZW50SW5kZXggPCBjb21wb25lbnRDb3VudDsgY29tcG9uZW50SW5kZXgrKykge1xuICAgIHR5cGVkQXJyYXlbYmFzZUluZGV4ICsgY29tcG9uZW50SW5kZXhdID0gc2NhbGVkW2NvbXBvbmVudEluZGV4XTtcbiAgfVxufVxuXG4vKipcbiAqIFJlYmFsYW5jZXMgc2NhbGVkIHNraW4gd2VpZ2h0cyB0byBzdW0gdG8gdGhlIG1heGltdW0gdmFsdWUuXG4gKlxuICogQHBhcmFtIGRpZmYgLSBEaWZmZXJlbmNlIHRvIGRpc3RyaWJ1dGVcbiAqIEBwYXJhbSBzY2FsZWQgLSBBcnJheSBvZiBzY2FsZWQgd2VpZ2h0IHZhbHVlc1xuICogQHBhcmFtIGNvbXBvbmVudENvdW50IC0gTnVtYmVyIG9mIGNvbXBvbmVudHNcbiAqIEBwYXJhbSBtYXhWYWx1ZSAtIE1heGltdW0gdmFsdWUgZm9yIHRoZSBjb21wb25lbnQgdHlwZVxuICogQHBhcmFtIGZsb2F0RGF0YSAtIE9yaWdpbmFsIGZsb2F0IGRhdGEgZm9yIHJlZmVyZW5jZVxuICogQHBhcmFtIGJhc2VJbmRleCAtIEJhc2UgaW5kZXggb2YgdGhlIGVsZW1lbnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlYmFsYW5jZVNjYWxlZFNraW5XZWlnaHRzKFxuICBkaWZmOiBudW1iZXIsXG4gIHNjYWxlZDogbnVtYmVyW10sXG4gIGNvbXBvbmVudENvdW50OiBudW1iZXIsXG4gIG1heFZhbHVlOiBudW1iZXIsXG4gIGZsb2F0RGF0YTogRmxvYXQzMkFycmF5LFxuICBiYXNlSW5kZXg6IG51bWJlclxuKTogdm9pZCB7XG4gIGNvbnN0IGluZGljZXMgPSBBcnJheS5mcm9tKHsgbGVuZ3RoOiBjb21wb25lbnRDb3VudCB9LCAoXywgaWR4KSA9PiBpZHgpLnNvcnQoXG4gICAgKGEsIGIpID0+IGZsb2F0RGF0YVtiYXNlSW5kZXggKyBiXSAtIGZsb2F0RGF0YVtiYXNlSW5kZXggKyBhXVxuICApO1xuXG4gIGZvciAoY29uc3QgaWR4IG9mIGluZGljZXMpIHtcbiAgICBpZiAoZGlmZiA9PT0gMCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGlmIChkaWZmID4gMCkge1xuICAgICAgY29uc3QgYXZhaWxhYmxlID0gbWF4VmFsdWUgLSBzY2FsZWRbaWR4XTtcbiAgICAgIGlmIChhdmFpbGFibGUgPD0gMCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGRlbHRhID0gTWF0aC5taW4oYXZhaWxhYmxlLCBkaWZmKTtcbiAgICAgIHNjYWxlZFtpZHhdICs9IGRlbHRhO1xuICAgICAgZGlmZiAtPSBkZWx0YTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgYXZhaWxhYmxlID0gc2NhbGVkW2lkeF07XG4gICAgICBpZiAoYXZhaWxhYmxlIDw9IDApIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCBkZWx0YSA9IE1hdGgubWluKGF2YWlsYWJsZSwgLWRpZmYpO1xuICAgICAgc2NhbGVkW2lkeF0gLT0gZGVsdGE7XG4gICAgICBkaWZmICs9IGRlbHRhO1xuICAgIH1cbiAgfVxuXG4gIGlmIChkaWZmICE9PSAwICYmIGluZGljZXMubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IGlkeCA9IGluZGljZXNbMF07XG4gICAgY29uc3QgYmFzZVZhbHVlID0gc2NhbGVkW2lkeF07XG4gICAgY29uc3QgbmV3VmFsdWUgPSBNYXRoLm1heCgwLCBNYXRoLm1pbihtYXhWYWx1ZSwgYmFzZVZhbHVlICsgZGlmZikpO1xuICAgIHNjYWxlZFtpZHhdID0gbmV3VmFsdWU7XG4gIH1cbn1cblxuLyoqXG4gKiBBZGp1c3RzIHdlaWdodHMgdG8gYWNjb3VudCBmb3IgcmVzaWR1YWwgZXJyb3IgYWZ0ZXIgbm9ybWFsaXphdGlvbi5cbiAqXG4gKiBEaXN0cmlidXRlcyByZXNpZHVhbCBlcnJvciBhY3Jvc3Mgd2VpZ2h0cywgcHJpb3JpdGl6aW5nIGxhcmdlciB3ZWlnaHRzLlxuICpcbiAqIEBwYXJhbSBkYXRhIC0gRmxvYXQzMkFycmF5IGNvbnRhaW5pbmcgd2VpZ2h0IGRhdGFcbiAqIEBwYXJhbSBvZmZzZXQgLSBPZmZzZXQgaW5kZXggaW4gdGhlIGFycmF5XG4gKiBAcGFyYW0gY29tcG9uZW50Q291bnQgLSBOdW1iZXIgb2YgY29tcG9uZW50c1xuICogQHBhcmFtIHJlc2lkdWFsIC0gUmVzaWR1YWwgZXJyb3IgdG8gZGlzdHJpYnV0ZVxuICogQHBhcmFtIHRvbGVyYW5jZSAtIFRvbGVyYW5jZSBmb3IgcmVzaWR1YWwgZXJyb3JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkanVzdFdlaWdodHNGb3JSZXNpZHVhbChcbiAgZGF0YTogRmxvYXQzMkFycmF5LFxuICBvZmZzZXQ6IG51bWJlcixcbiAgY29tcG9uZW50Q291bnQ6IG51bWJlcixcbiAgcmVzaWR1YWw6IG51bWJlcixcbiAgdG9sZXJhbmNlOiBudW1iZXJcbik6IHZvaWQge1xuICBpZiAoY29tcG9uZW50Q291bnQgPT09IDAgfHwgTWF0aC5hYnMocmVzaWR1YWwpIDw9IHRvbGVyYW5jZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGluZGljZXMgPSBBcnJheS5mcm9tKHsgbGVuZ3RoOiBjb21wb25lbnRDb3VudCB9LCAoXywgaWR4KSA9PiBpZHgpLnNvcnQoXG4gICAgKGEsIGIpID0+IGRhdGFbb2Zmc2V0ICsgYl0gLSBkYXRhW29mZnNldCArIGFdXG4gICk7XG5cbiAgbGV0IHJlbWFpbmluZyA9IHJlc2lkdWFsO1xuICBmb3IgKGNvbnN0IGxvY2FsSW5kZXggb2YgaW5kaWNlcykge1xuICAgIGlmIChNYXRoLmFicyhyZW1haW5pbmcpIDw9IHRvbGVyYW5jZSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNvbnN0IGlkeCA9IG9mZnNldCArIGxvY2FsSW5kZXg7XG4gICAgY29uc3QgYmVmb3JlID0gZGF0YVtpZHhdO1xuICAgIGNvbnN0IGNhbmRpZGF0ZSA9IGNsYW1wV2VpZ2h0KGJlZm9yZSArIHJlbWFpbmluZyk7XG4gICAgZGF0YVtpZHhdID0gY2FuZGlkYXRlO1xuICAgIHJlbWFpbmluZyAtPSBjYW5kaWRhdGUgLSBiZWZvcmU7XG4gIH1cblxuICBpZiAoTWF0aC5hYnMocmVtYWluaW5nKSA+IHRvbGVyYW5jZSkge1xuICAgIGNvbnN0IGlkeCA9IG9mZnNldCArIGluZGljZXNbMF07XG4gICAgY29uc3QgYmVmb3JlID0gZGF0YVtpZHhdO1xuICAgIGNvbnN0IGNhbmRpZGF0ZSA9IGNsYW1wV2VpZ2h0KGJlZm9yZSArIHJlbWFpbmluZyk7XG4gICAgZGF0YVtpZHhdID0gY2FuZGlkYXRlO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBub3JtYWxpemVkIGZsb2F0IHdlaWdodHMgZnJvbSBhbiBhY2Nlc3Nvci5cbiAqXG4gKiBQcm9jZXNzZXMgc2tpbiB3ZWlnaHQgZGF0YSBmcm9tIGFuIGFjY2Vzc29yLCBzYW5pdGl6aW5nIGFuZCBub3JtYWxpemluZ1xuICogdmFsdWVzIHRvIGVuc3VyZSB0aGV5IHN1bSB0byAxLjAgZm9yIGVhY2ggZWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gYWNjZXNzb3IgLSBUaGUgYWNjZXNzb3IgY29udGFpbmluZyB3ZWlnaHQgZGF0YVxuICogQHBhcmFtIGNvbXBvbmVudENvdW50IC0gTnVtYmVyIG9mIGNvbXBvbmVudHMgcGVyIGVsZW1lbnRcbiAqIEBwYXJhbSBlbGVtZW50Q291bnQgLSBOdW1iZXIgb2YgZWxlbWVudHNcbiAqIEBwYXJhbSB0cmVhdEFzTm9ybWFsaXplZFVuc2lnbmVkSW50IC0gV2hldGhlciB0byB0cmVhdCB2YWx1ZXMgYXMgbm9ybWFsaXplZCB1bnNpZ25lZCBpbnRlZ2Vyc1xuICogQHBhcmFtIG5vcm1hbGl6YXRpb25EZW5vbWluYXRvciAtIERlbm9taW5hdG9yIGZvciBub3JtYWxpemF0aW9uXG4gKiBAcmV0dXJucyBPYmplY3QgY29udGFpbmluZyBub3JtYWxpemVkIGZsb2F0IGRhdGEgYW5kIG11dGF0aW9uIGZsYWdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vcm1hbGl6ZWRGbG9hdFdlaWdodHMoXG4gIGFjY2Vzc29yOiBBY2Nlc3NvcixcbiAgY29tcG9uZW50Q291bnQ6IG51bWJlcixcbiAgZWxlbWVudENvdW50OiBudW1iZXIsXG4gIHRyZWF0QXNOb3JtYWxpemVkVW5zaWduZWRJbnQ6IGJvb2xlYW4sXG4gIG5vcm1hbGl6YXRpb25EZW5vbWluYXRvcjogbnVtYmVyXG4pOiB7IGRhdGE6IEZsb2F0MzJBcnJheTsgbXV0YXRlZDogYm9vbGVhbiB9IHtcbiAgY29uc3QgZmxvYXREYXRhID0gbmV3IEZsb2F0MzJBcnJheShlbGVtZW50Q291bnQgKiBjb21wb25lbnRDb3VudCk7XG4gIGxldCBtdXRhdGVkID0gZmFsc2U7XG5cbiAgZm9yIChsZXQgZWxlbWVudEluZGV4ID0gMDsgZWxlbWVudEluZGV4IDwgZWxlbWVudENvdW50OyBlbGVtZW50SW5kZXgrKykge1xuICAgIGNvbnN0IGJhc2VJbmRleCA9IGVsZW1lbnRJbmRleCAqIGNvbXBvbmVudENvdW50O1xuICAgIGNvbnN0IGVsZW1lbnRNdXRhdGVkID0gcHJvY2Vzc1NraW5XZWlnaHRFbGVtZW50KFxuICAgICAgYWNjZXNzb3IsXG4gICAgICBlbGVtZW50SW5kZXgsXG4gICAgICBiYXNlSW5kZXgsXG4gICAgICBjb21wb25lbnRDb3VudCxcbiAgICAgIHRyZWF0QXNOb3JtYWxpemVkVW5zaWduZWRJbnQsXG4gICAgICBub3JtYWxpemF0aW9uRGVub21pbmF0b3IsXG4gICAgICBmbG9hdERhdGFcbiAgICApO1xuICAgIGlmIChlbGVtZW50TXV0YXRlZCkge1xuICAgICAgbXV0YXRlZCA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHsgZGF0YTogZmxvYXREYXRhLCBtdXRhdGVkIH07XG59XG5cbi8qKlxuICogQ29udmVydHMgbm9ybWFsaXplZCBmbG9hdCB3ZWlnaHRzIHRvIHVuc2lnbmVkIGludGVnZXIgZm9ybWF0LlxuICpcbiAqIFNjYWxlcyBub3JtYWxpemVkIGZsb2F0IHdlaWdodHMgdG8gdGhlIGFwcHJvcHJpYXRlIHVuc2lnbmVkIGludGVnZXIgcmFuZ2VcbiAqIGJhc2VkIG9uIHRoZSBjb21wb25lbnQgdHlwZSwgZW5zdXJpbmcgcHJvcGVyIHF1YW50aXphdGlvbi5cbiAqXG4gKiBAcGFyYW0gZmxvYXREYXRhIC0gRmxvYXQzMkFycmF5IGNvbnRhaW5pbmcgbm9ybWFsaXplZCB3ZWlnaHQgZGF0YVxuICogQHBhcmFtIGFjY2Vzc29yIC0gVGhlIG9yaWdpbmFsIGFjY2Vzc29yXG4gKiBAcGFyYW0gY29tcG9uZW50Q291bnQgLSBOdW1iZXIgb2YgY29tcG9uZW50cyBwZXIgZWxlbWVudFxuICogQHBhcmFtIGVsZW1lbnRDb3VudCAtIE51bWJlciBvZiBlbGVtZW50c1xuICogQHBhcmFtIG5vcm1hbGl6YXRpb25EZW5vbWluYXRvciAtIERlbm9taW5hdG9yIGZvciBub3JtYWxpemF0aW9uXG4gKiBAcmV0dXJucyBOZXcgYWNjZXNzb3Igd2l0aCB1bnNpZ25lZCBpbnRlZ2VyIHdlaWdodHNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnZlcnROb3JtYWxpemVkV2VpZ2h0c1RvVW5zaWduZWQoXG4gIGZsb2F0RGF0YTogRmxvYXQzMkFycmF5LFxuICBhY2Nlc3NvcjogQWNjZXNzb3IsXG4gIGNvbXBvbmVudENvdW50OiBudW1iZXIsXG4gIGVsZW1lbnRDb3VudDogbnVtYmVyLFxuICBub3JtYWxpemF0aW9uRGVub21pbmF0b3I6IG51bWJlclxuKTogQWNjZXNzb3Ige1xuICBjb25zdCB0eXBlZEFycmF5ID0gY3JlYXRlVW5zaWduZWRUeXBlZEFycmF5KGFjY2Vzc29yLmNvbXBvbmVudFR5cGUsIGZsb2F0RGF0YS5sZW5ndGgpO1xuICBjb25zdCBtYXhWYWx1ZSA9IG5vcm1hbGl6YXRpb25EZW5vbWluYXRvcjtcblxuICBmb3IgKGxldCBlbGVtZW50SW5kZXggPSAwOyBlbGVtZW50SW5kZXggPCBlbGVtZW50Q291bnQ7IGVsZW1lbnRJbmRleCsrKSB7XG4gICAgY29uc3QgYmFzZUluZGV4ID0gZWxlbWVudEluZGV4ICogY29tcG9uZW50Q291bnQ7XG4gICAgc2NhbGVTa2luV2VpZ2h0RWxlbWVudFRvVW5zaWduZWQoZmxvYXREYXRhLCBiYXNlSW5kZXgsIGNvbXBvbmVudENvdW50LCB0eXBlZEFycmF5LCBtYXhWYWx1ZSk7XG4gIH1cblxuICByZXR1cm4gY3JlYXRlQWNjZXNzb3JGcm9tV2VpZ2h0c1R5cGVkQXJyYXkodHlwZWRBcnJheSwgYWNjZXNzb3IsIGFjY2Vzc29yLmNvbXBvbmVudFR5cGUsIHRydWUpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gQWNjZXNzb3IgZnJvbSBhIHdlaWdodCB0eXBlZCBhcnJheS5cbiAqXG4gKiBDb25zdHJ1Y3RzIGEgbmV3IEFjY2Vzc29yIHdpdGggdGhlIHByb3ZpZGVkIHR5cGVkIGFycmF5IGRhdGEsIGNyZWF0aW5nXG4gKiB0aGUgbmVjZXNzYXJ5IEJ1ZmZlciBhbmQgQnVmZmVyVmlldyBzdHJ1Y3R1cmVzLlxuICpcbiAqIEBwYXJhbSB0eXBlZEFycmF5IC0gVGhlIHR5cGVkIGFycmF5IGNvbnRhaW5pbmcgd2VpZ2h0IGRhdGFcbiAqIEBwYXJhbSBiYXNlQWNjZXNzb3IgLSBUaGUgYmFzZSBhY2Nlc3NvciB0byBjb3B5IHByb3BlcnRpZXMgZnJvbVxuICogQHBhcmFtIGNvbXBvbmVudFR5cGUgLSBUaGUgY29tcG9uZW50IHR5cGUgZm9yIHRoZSBuZXcgYWNjZXNzb3JcbiAqIEBwYXJhbSBub3JtYWxpemVkIC0gV2hldGhlciB0aGUgYWNjZXNzb3IgdmFsdWVzIGFyZSBub3JtYWxpemVkXG4gKiBAcmV0dXJucyBOZXcgQWNjZXNzb3IgaW5zdGFuY2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUFjY2Vzc29yRnJvbVdlaWdodHNUeXBlZEFycmF5KFxuICB0eXBlZEFycmF5OiBXZWlnaHRUeXBlZEFycmF5LFxuICBiYXNlQWNjZXNzb3I6IEFjY2Vzc29yLFxuICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlRW51bSxcbiAgbm9ybWFsaXplZDogYm9vbGVhblxuKTogQWNjZXNzb3Ige1xuICBjb25zdCBhcnJheUJ1ZmZlciA9IHR5cGVkQXJyYXkuYnVmZmVyIGFzIEFycmF5QnVmZmVyO1xuICBjb25zdCBidWZmZXIgPSBuZXcgQnVmZmVyKHtcbiAgICBieXRlTGVuZ3RoOiBhcnJheUJ1ZmZlci5ieXRlTGVuZ3RoLFxuICAgIGJ1ZmZlcjogYXJyYXlCdWZmZXIsXG4gICAgbmFtZTogJ05vcm1hbGl6ZWRTa2luV2VpZ2h0c0J1ZmZlcicsXG4gICAgYnl0ZUFsaWduOiA0LFxuICAgIGJ1ZmZlclVzYWdlOiBCdWZmZXJVc2UuQ1BVR2VuZXJpYyxcbiAgICBpbmRleE9mVGhlQnVmZmVyVXNhZ2U6IDAsXG4gIH0pO1xuICBjb25zdCBidWZmZXJWaWV3ID0gbmV3IEJ1ZmZlclZpZXcoe1xuICAgIGJ1ZmZlcixcbiAgICBieXRlT2Zmc2V0SW5CdWZmZXI6IDAsXG4gICAgZGVmYXVsdEJ5dGVTdHJpZGU6IDAsXG4gICAgYnl0ZUxlbmd0aDogYXJyYXlCdWZmZXIuYnl0ZUxlbmd0aCxcbiAgICByYXc6IGFycmF5QnVmZmVyLFxuICB9KTtcblxuICBjb25zdCBuZXdBY2Nlc3NvciA9IG5ldyBBY2Nlc3Nvcih7XG4gICAgYnVmZmVyVmlldyxcbiAgICBieXRlT2Zmc2V0SW5CdWZmZXJWaWV3OiAwLFxuICAgIGNvbXBvc2l0aW9uVHlwZTogYmFzZUFjY2Vzc29yLmNvbXBvc2l0aW9uVHlwZSxcbiAgICBjb21wb25lbnRUeXBlLFxuICAgIGJ5dGVTdHJpZGU6IDAsXG4gICAgY291bnQ6IGJhc2VBY2Nlc3Nvci5lbGVtZW50Q291bnQsXG4gICAgcmF3OiBhcnJheUJ1ZmZlcixcbiAgICBhcnJheUxlbmd0aDogMSxcbiAgICBub3JtYWxpemVkLFxuICB9KTtcblxuICByZXR1cm4gbmV3QWNjZXNzb3I7XG59XG5cbi8qKlxuICogRmluZHMgdGhlIHByaW1hcnkgdGV4dHVyZSBjb29yZGluYXRlIGFjY2Vzc29yIGZyb20gYSBwcmltaXRpdmUuXG4gKlxuICogU2VhcmNoZXMgZm9yIHRoZSBmaXJzdCBURVhDT09SRCBhdHRyaWJ1dGUgaW4gdGhlIHByaW1pdGl2ZSdzIHNlbWFudGljcy5cbiAqXG4gKiBAcGFyYW0gcHJpbWl0aXZlIC0gVGhlIHByaW1pdGl2ZSB0byBzZWFyY2hcbiAqIEByZXR1cm5zIFRoZSBwcmltYXJ5IHRleHR1cmUgY29vcmRpbmF0ZSBhY2Nlc3NvciBvciB1bmRlZmluZWQgaWYgbm90IGZvdW5kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kUHJpbWFyeVRleGNvb3JkQWNjZXNzb3IocHJpbWl0aXZlOiBQcmltaXRpdmUpOiBBY2Nlc3NvciB8IHVuZGVmaW5lZCB7XG4gIGNvbnN0IHNlbWFudGljcyA9IHByaW1pdGl2ZS5hdHRyaWJ1dGVTZW1hbnRpY3M7XG4gIGZvciAoY29uc3Qgc2VtYW50aWMgb2Ygc2VtYW50aWNzKSB7XG4gICAgaWYgKHNlbWFudGljLnN0YXJ0c1dpdGgoJ1RFWENPT1JEXycpKSB7XG4gICAgICByZXR1cm4gcHJpbWl0aXZlLmdldEF0dHJpYnV0ZShzZW1hbnRpYyBhcyBWZXJ0ZXhBdHRyaWJ1dGVTZW1hbnRpY3NKb2luZWRTdHJpbmcpID8/IHVuZGVmaW5lZDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgdGVtcG9yYXJ5IFZlYzQgYWNjZXNzb3IgZm9yIHRhbmdlbnQgY2FsY3VsYXRpb25zLlxuICpcbiAqIENyZWF0ZXMgYSB0ZW1wb3JhcnkgYnVmZmVyLCBidWZmZXIgdmlldywgYW5kIGFjY2Vzc29yIGZvciBzdG9yaW5nXG4gKiBWZWM0IHRhbmdlbnQgZGF0YSBkdXJpbmcgZXhwb3J0IHByb2Nlc3NpbmcuXG4gKlxuICogQHBhcmFtIGNvdW50IC0gTnVtYmVyIG9mIGVsZW1lbnRzIGluIHRoZSBhY2Nlc3NvclxuICogQHJldHVybnMgTmV3IEFjY2Vzc29yIGluc3RhbmNlIHdpdGggVmVjNCBjb21wb3NpdGlvbiB0eXBlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUZW1wb3JhcnlWZWM0QWNjZXNzb3IoY291bnQ6IG51bWJlcik6IEFjY2Vzc29yIHtcbiAgY29uc3QgYnl0ZUxlbmd0aCA9IGNvdW50ICogNCAqIDQ7XG4gIGNvbnN0IGJ1ZmZlciA9IG5ldyBCdWZmZXIoe1xuICAgIGJ5dGVMZW5ndGgsXG4gICAgYnVmZmVyOiBuZXcgQXJyYXlCdWZmZXIoYnl0ZUxlbmd0aCksXG4gICAgbmFtZTogJ0dsdGYyRXhwb3J0ZXJfVGFuZ2VudCcsXG4gICAgYnl0ZUFsaWduOiA0LFxuICAgIGJ1ZmZlclVzYWdlOiBCdWZmZXJVc2UuQ1BVR2VuZXJpYyxcbiAgICBpbmRleE9mVGhlQnVmZmVyVXNhZ2U6IDAsXG4gIH0pO1xuICBjb25zdCBidWZmZXJWaWV3ID0gYnVmZmVyXG4gICAgLnRha2VCdWZmZXJWaWV3KHtcbiAgICAgIGJ5dGVMZW5ndGhUb05lZWQ6IGJ5dGVMZW5ndGgsXG4gICAgICBieXRlU3RyaWRlOiAwLFxuICAgIH0pXG4gICAgLnVud3JhcEZvcmNlKCk7XG5cbiAgcmV0dXJuIGJ1ZmZlclZpZXdcbiAgICAudGFrZUFjY2Vzc29yKHtcbiAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlZlYzQsXG4gICAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICAgICAgY291bnQsXG4gICAgfSlcbiAgICAudW53cmFwRm9yY2UoKTtcbn1cblxuLyoqXG4gKiBOb3JtYWxpemVzIG5vcm1hbCB2ZWN0b3JzIGluIGFuIGFjY2Vzc29yLlxuICpcbiAqIFJlYWRzIG5vcm1hbCBkYXRhIGZyb20gdGhlIGFjY2Vzc29yLCBub3JtYWxpemVzIGVhY2ggdmVjdG9yIHRvIHVuaXQgbGVuZ3RoLFxuICogYW5kIGNyZWF0ZXMgYSBuZXcgYWNjZXNzb3Igd2l0aCB0aGUgbm9ybWFsaXplZCBkYXRhLlxuICpcbiAqIEBwYXJhbSBhY2Nlc3NvciAtIFRoZSBhY2Nlc3NvciBjb250YWluaW5nIG5vcm1hbCBkYXRhXG4gKiBAcmV0dXJucyBOZXcgQWNjZXNzb3Igd2l0aCBub3JtYWxpemVkIG5vcm1hbCB2ZWN0b3JzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVOb3JtYWxzKGFjY2Vzc29yOiBBY2Nlc3Nvcik6IEFjY2Vzc29yIHtcbiAgY29uc3QgY29tcG9uZW50Q291bnQgPSBhY2Nlc3Nvci5jb21wb3NpdGlvblR5cGUuZ2V0TnVtYmVyT2ZDb21wb25lbnRzKCk7XG4gIGNvbnN0IGVsZW1lbnRDb3VudCA9IGFjY2Vzc29yLmVsZW1lbnRDb3VudDtcblxuICAvLyBSZWFkIHRoZSBub3JtYWwgZGF0YVxuICBjb25zdCBub3JtYWxEYXRhID0gbmV3IEZsb2F0MzJBcnJheShlbGVtZW50Q291bnQgKiBjb21wb25lbnRDb3VudCk7XG4gIGlmIChjb21wb25lbnRDb3VudCA9PT0gMykge1xuICAgIC8vIFZFQzNcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVsZW1lbnRDb3VudDsgaSsrKSB7XG4gICAgICBjb25zdCB2ZWMgPSBhY2Nlc3Nvci5nZXRWZWMzKGksIHt9KTtcbiAgICAgIG5vcm1hbERhdGFbaSAqIDMgKyAwXSA9IHZlYy54O1xuICAgICAgbm9ybWFsRGF0YVtpICogMyArIDFdID0gdmVjLnk7XG4gICAgICBub3JtYWxEYXRhW2kgKiAzICsgMl0gPSB2ZWMuejtcbiAgICB9XG4gIH0gZWxzZSBpZiAoY29tcG9uZW50Q291bnQgPT09IDIpIHtcbiAgICAvLyBWRUMyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbGVtZW50Q291bnQ7IGkrKykge1xuICAgICAgY29uc3QgdmVjID0gYWNjZXNzb3IuZ2V0VmVjMihpLCB7fSk7XG4gICAgICBub3JtYWxEYXRhW2kgKiAyICsgMF0gPSB2ZWMueDtcbiAgICAgIG5vcm1hbERhdGFbaSAqIDIgKyAxXSA9IHZlYy55O1xuICAgIH1cbiAgfSBlbHNlIGlmIChjb21wb25lbnRDb3VudCA9PT0gNCkge1xuICAgIC8vIFZFQzRcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVsZW1lbnRDb3VudDsgaSsrKSB7XG4gICAgICBjb25zdCB2ZWMgPSBhY2Nlc3Nvci5nZXRWZWM0KGksIHt9KTtcbiAgICAgIG5vcm1hbERhdGFbaSAqIDQgKyAwXSA9IHZlYy54O1xuICAgICAgbm9ybWFsRGF0YVtpICogNCArIDFdID0gdmVjLnk7XG4gICAgICBub3JtYWxEYXRhW2kgKiA0ICsgMl0gPSB2ZWMuejtcbiAgICAgIG5vcm1hbERhdGFbaSAqIDQgKyAzXSA9IHZlYy53O1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBGYWxsYmFjazogc2NhbGFyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbGVtZW50Q291bnQ7IGkrKykge1xuICAgICAgbm9ybWFsRGF0YVtpXSA9IGFjY2Vzc29yLmdldFNjYWxhcihpLCB7fSk7XG4gICAgfVxuICB9XG5cbiAgLy8gTm9ybWFsaXplIGVhY2ggbm9ybWFsIHZlY3RvclxuICBmb3IgKGxldCBpID0gMDsgaSA8IGVsZW1lbnRDb3VudDsgaSsrKSB7XG4gICAgY29uc3Qgb2Zmc2V0ID0gaSAqIGNvbXBvbmVudENvdW50O1xuICAgIGxldCBsZW5ndGggPSAwO1xuXG4gICAgLy8gQ2FsY3VsYXRlIGxlbmd0aFxuICAgIGZvciAobGV0IGogPSAwOyBqIDwgY29tcG9uZW50Q291bnQ7IGorKykge1xuICAgICAgY29uc3QgdmFsdWUgPSBub3JtYWxEYXRhW29mZnNldCArIGpdO1xuICAgICAgbGVuZ3RoICs9IHZhbHVlICogdmFsdWU7XG4gICAgfVxuICAgIGxlbmd0aCA9IE1hdGguc3FydChsZW5ndGgpO1xuXG4gICAgLy8gTm9ybWFsaXplIGlmIGxlbmd0aCBpcyBub3QgemVyb1xuICAgIGlmIChsZW5ndGggPiAwKSB7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGNvbXBvbmVudENvdW50OyBqKyspIHtcbiAgICAgICAgbm9ybWFsRGF0YVtvZmZzZXQgKyBqXSAvPSBsZW5ndGg7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gQ3JlYXRlIG5ldyBidWZmZXIgYW5kIGJ1ZmZlciB2aWV3IHdpdGggbm9ybWFsaXplZCBkYXRhXG4gIGNvbnN0IGFycmF5QnVmZmVyID0gbm9ybWFsRGF0YS5idWZmZXI7XG4gIGNvbnN0IG5ld0J1ZmZlciA9IG5ldyBCdWZmZXIoe1xuICAgIGJ5dGVMZW5ndGg6IGFycmF5QnVmZmVyLmJ5dGVMZW5ndGgsXG4gICAgYnVmZmVyOiBhcnJheUJ1ZmZlcixcbiAgICBuYW1lOiAnTm9ybWFsaXplZE5vcm1hbHNCdWZmZXInLFxuICAgIGJ5dGVBbGlnbjogNCxcbiAgICBidWZmZXJVc2FnZTogQnVmZmVyVXNlLkNQVUdlbmVyaWMsXG4gICAgaW5kZXhPZlRoZUJ1ZmZlclVzYWdlOiAwLFxuICB9KTtcbiAgY29uc3QgbmV3QnVmZmVyVmlldyA9IG5ldyBCdWZmZXJWaWV3KHtcbiAgICBidWZmZXI6IG5ld0J1ZmZlcixcbiAgICBieXRlT2Zmc2V0SW5CdWZmZXI6IDAsXG4gICAgZGVmYXVsdEJ5dGVTdHJpZGU6IDAsXG4gICAgYnl0ZUxlbmd0aDogbm9ybWFsRGF0YS5ieXRlTGVuZ3RoLFxuICAgIHJhdzogYXJyYXlCdWZmZXIsXG4gIH0pO1xuXG4gIC8vIENyZWF0ZSBuZXcgYWNjZXNzb3Igd2l0aCB0aGUgc2FtZSBwcm9wZXJ0aWVzIGJ1dCBkaWZmZXJlbnQgZGF0YVxuICBjb25zdCBuZXdBY2Nlc3NvciA9IG5ldyBBY2Nlc3Nvcih7XG4gICAgYnVmZmVyVmlldzogbmV3QnVmZmVyVmlldyxcbiAgICBieXRlT2Zmc2V0SW5CdWZmZXJWaWV3OiAwLFxuICAgIGNvbXBvc2l0aW9uVHlwZTogYWNjZXNzb3IuY29tcG9zaXRpb25UeXBlLFxuICAgIGNvbXBvbmVudFR5cGU6IGFjY2Vzc29yLmNvbXBvbmVudFR5cGUsXG4gICAgYnl0ZVN0cmlkZTogMCxcbiAgICBjb3VudDogZWxlbWVudENvdW50LFxuICAgIHJhdzogYXJyYXlCdWZmZXIsXG4gICAgYXJyYXlMZW5ndGg6IDEsXG4gICAgbm9ybWFsaXplZDogZmFsc2UsXG4gIH0pO1xuXG4gIHJldHVybiBuZXdBY2Nlc3Nvcjtcbn1cblxuLyoqXG4gKiBOb3JtYWxpemVzIHNraW4gd2VpZ2h0cyBpbiBhbiBhY2Nlc3Nvci5cbiAqXG4gKiBQcm9jZXNzZXMgc2tpbiB3ZWlnaHQgZGF0YSB0byBlbnN1cmUgdmFsdWVzIGFyZSBwcm9wZXJseSBub3JtYWxpemVkLFxuICogc2FuaXRpemVkLCBhbmQgY29udmVydGVkIHRvIHRoZSBhcHByb3ByaWF0ZSBmb3JtYXQuXG4gKlxuICogQHBhcmFtIGFjY2Vzc29yIC0gVGhlIGFjY2Vzc29yIGNvbnRhaW5pbmcgc2tpbiB3ZWlnaHQgZGF0YVxuICogQHJldHVybnMgTmV3IEFjY2Vzc29yIHdpdGggbm9ybWFsaXplZCBza2luIHdlaWdodHMsIG9yIG9yaWdpbmFsIGlmIHVuY2hhbmdlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplU2tpbldlaWdodHMoYWNjZXNzb3I6IEFjY2Vzc29yKTogQWNjZXNzb3Ige1xuICBjb25zdCBjb21wb25lbnRDb3VudCA9IGFjY2Vzc29yLmNvbXBvc2l0aW9uVHlwZS5nZXROdW1iZXJPZkNvbXBvbmVudHMoKTtcbiAgY29uc3QgZWxlbWVudENvdW50ID0gYWNjZXNzb3IuZWxlbWVudENvdW50O1xuICBpZiAoY29tcG9uZW50Q291bnQgPT09IDAgfHwgZWxlbWVudENvdW50ID09PSAwKSB7XG4gICAgcmV0dXJuIGFjY2Vzc29yO1xuICB9XG5cbiAgY29uc3QgdHJlYXRBc05vcm1hbGl6ZWRVbnNpZ25lZEludCA9XG4gICAgYWNjZXNzb3Iubm9ybWFsaXplZCAmJlxuICAgIChhY2Nlc3Nvci5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLlVuc2lnbmVkQnl0ZSB8fFxuICAgICAgYWNjZXNzb3IuY29tcG9uZW50VHlwZSA9PT0gQ29tcG9uZW50VHlwZS5VbnNpZ25lZFNob3J0IHx8XG4gICAgICBhY2Nlc3Nvci5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLlVuc2lnbmVkSW50KTtcblxuICBjb25zdCBub3JtYWxpemF0aW9uRGVub21pbmF0b3IgPSB0cmVhdEFzTm9ybWFsaXplZFVuc2lnbmVkSW50XG4gICAgPyBnZXROb3JtYWxpemVkVW5zaWduZWRDb21wb25lbnRNYXgoYWNjZXNzb3IuY29tcG9uZW50VHlwZSlcbiAgICA6IDE7XG5cbiAgY29uc3Qgbm9ybWFsaXphdGlvblJlc3VsdCA9IGNyZWF0ZU5vcm1hbGl6ZWRGbG9hdFdlaWdodHMoXG4gICAgYWNjZXNzb3IsXG4gICAgY29tcG9uZW50Q291bnQsXG4gICAgZWxlbWVudENvdW50LFxuICAgIHRyZWF0QXNOb3JtYWxpemVkVW5zaWduZWRJbnQsXG4gICAgbm9ybWFsaXphdGlvbkRlbm9taW5hdG9yXG4gICk7XG5cbiAgaWYgKCFub3JtYWxpemF0aW9uUmVzdWx0Lm11dGF0ZWQpIHtcbiAgICByZXR1cm4gYWNjZXNzb3I7XG4gIH1cblxuICBpZiAodHJlYXRBc05vcm1hbGl6ZWRVbnNpZ25lZEludCkge1xuICAgIHJldHVybiBjb252ZXJ0Tm9ybWFsaXplZFdlaWdodHNUb1Vuc2lnbmVkKFxuICAgICAgbm9ybWFsaXphdGlvblJlc3VsdC5kYXRhLFxuICAgICAgYWNjZXNzb3IsXG4gICAgICBjb21wb25lbnRDb3VudCxcbiAgICAgIGVsZW1lbnRDb3VudCxcbiAgICAgIG5vcm1hbGl6YXRpb25EZW5vbWluYXRvclxuICAgICk7XG4gIH1cblxuICBjb25zdCBjb21wb25lbnRUeXBlRm9yRmxvYXQgPSBhY2Nlc3Nvci5jb21wb25lbnRUeXBlLmlzRmxvYXRpbmdQb2ludCgpID8gYWNjZXNzb3IuY29tcG9uZW50VHlwZSA6IENvbXBvbmVudFR5cGUuRmxvYXQ7XG4gIGNvbnN0IG5vcm1hbGl6ZWRGbGFnRm9yRmxvYXQgPSBjb21wb25lbnRUeXBlRm9yRmxvYXQgPT09IGFjY2Vzc29yLmNvbXBvbmVudFR5cGUgPyBhY2Nlc3Nvci5ub3JtYWxpemVkIDogZmFsc2U7XG4gIHJldHVybiBjcmVhdGVBY2Nlc3NvckZyb21XZWlnaHRzVHlwZWRBcnJheShcbiAgICBub3JtYWxpemF0aW9uUmVzdWx0LmRhdGEsXG4gICAgYWNjZXNzb3IsXG4gICAgY29tcG9uZW50VHlwZUZvckZsb2F0LFxuICAgIG5vcm1hbGl6ZWRGbGFnRm9yRmxvYXRcbiAgKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIEJ1ZmZlclZpZXcgYW5kIEFjY2Vzc29yIGZvciBhbmltYXRpb24gaW5wdXQgKHRpbWUpIGRhdGEuXG4gKlxuICogQHBhcmFtIGpzb24gLSBUaGUgZ2xURjIgSlNPTiBkb2N1bWVudFxuICogQHBhcmFtIHNhbXBsZXIgLSBUaGUgYW5pbWF0aW9uIHNhbXBsZXIgY29udGFpbmluZyBpbnB1dCBkYXRhXG4gKiBAcGFyYW0gYnVmZmVySWR4IC0gSW5kZXggb2YgdGhlIHRhcmdldCBidWZmZXJcbiAqIEBwYXJhbSBidWZmZXJWaWV3Qnl0ZUxlbmd0aEFjY3VtdWxhdGVkIC0gQ3VycmVudCBhY2N1bXVsYXRlZCBieXRlIGxlbmd0aFxuICogQHJldHVybnMgT2JqZWN0IGNvbnRhaW5pbmcgYWNjZXNzb3IgaW5kZXggYW5kIHVwZGF0ZWQgYnl0ZSBsZW5ndGhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUdsdGYyQnVmZmVyVmlld0FuZEdsdGYyQWNjZXNzb3JGb3JJbnB1dChcbiAganNvbjogR2x0ZjJFeCxcbiAgc2FtcGxlcjogQW5pbWF0aW9uU2FtcGxlcixcbiAgYnVmZmVySWR4OiBJbmRleCxcbiAgYnVmZmVyVmlld0J5dGVMZW5ndGhBY2N1bXVsYXRlZDogQnl0ZVxuKToge1xuICBpbnB1dEFjY2Vzc29ySWR4OiBJbmRleDtcbiAgaW5wdXRCdWZmZXJWaWV3Qnl0ZUxlbmd0aEFjY3VtdWxhdGVkOiBCeXRlO1xufSB7XG4gIGNvbnN0IGNvbXBvbmVudFR5cGUgPSBDb21wb25lbnRUeXBlLmZyb21UeXBlZEFycmF5KFxuICAgIEFycmF5QnVmZmVyLmlzVmlldyhzYW1wbGVyLmlucHV0KSA/IHNhbXBsZXIuaW5wdXQgOiBuZXcgRmxvYXQzMkFycmF5KHNhbXBsZXIuaW5wdXQpXG4gICk7XG4gIGNvbnN0IGFjY2Vzc29yQ291bnQgPSBzYW1wbGVyLmlucHV0Lmxlbmd0aDtcbiAgLy8gY3JlYXRlIGEgR2x0ZjJCdWZmZXJWaWV3XG4gIGNvbnN0IGdsdGYyQnVmZmVyVmlldzogR2x0ZjJCdWZmZXJWaWV3RXggPSBjcmVhdGVHbHRmMkJ1ZmZlclZpZXdGb3JBbmltYXRpb24oe1xuICAgIGJ1ZmZlcklkeCxcbiAgICBidWZmZXJWaWV3Qnl0ZU9mZnNldDogYnVmZmVyVmlld0J5dGVMZW5ndGhBY2N1bXVsYXRlZCxcbiAgICBhY2Nlc3NvckJ5dGVPZmZzZXQ6IDAsXG4gICAgYWNjZXNzb3JDb3VudCxcbiAgICBidWZmZXJWaWV3Qnl0ZVN0cmlkZTogQ29tcG9uZW50VHlwZS5GbG9hdC5nZXRTaXplSW5CeXRlcygpLFxuICAgIGNvbXBvbmVudFR5cGUsXG4gICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuU2NhbGFyLFxuICAgIHVpbnQ4QXJyYXk6IG5ldyBVaW50OEFycmF5KFxuICAgICAgQXJyYXlCdWZmZXIuaXNWaWV3KHNhbXBsZXIuaW5wdXQpID8gc2FtcGxlci5pbnB1dC5idWZmZXIgOiBuZXcgRmxvYXQzMkFycmF5KHNhbXBsZXIuaW5wdXQpLmJ1ZmZlclxuICAgICksXG4gIH0pO1xuICBqc29uLmJ1ZmZlclZpZXdzLnB1c2goZ2x0ZjJCdWZmZXJWaWV3KTtcblxuICAvLyBjcmVhdGUgYSBHbHRmMkFjY2Vzc29yXG4gIGNvbnN0IGdsdGYyQWNjZXNzb3I6IEdsdGYyQWNjZXNzb3JFeCA9IGNyZWF0ZUdsdGYyQWNjZXNzb3JGb3JBbmltYXRpb24oe1xuICAgIGJ1ZmZlclZpZXdJZHg6IGpzb24uYnVmZmVyVmlld3MuaW5kZXhPZihnbHRmMkJ1ZmZlclZpZXcpLFxuICAgIGFjY2Vzc29yQnl0ZU9mZnNldDogMCxcbiAgICBjb21wb25lbnRUeXBlLFxuICAgIGNvdW50OiBhY2Nlc3NvckNvdW50LFxuICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlNjYWxhcixcbiAgICBtaW46IFtzYW1wbGVyLmlucHV0WzBdXSxcbiAgICBtYXg6IFtzYW1wbGVyLmlucHV0W3NhbXBsZXIuaW5wdXQubGVuZ3RoIC0gMV1dLFxuICB9KTtcbiAganNvbi5hY2Nlc3NvcnMucHVzaChnbHRmMkFjY2Vzc29yKTtcblxuICAvLyByZWdpc3RlclxuICBidWZmZXJWaWV3Qnl0ZUxlbmd0aEFjY3VtdWxhdGVkID0gYWxpZ25CdWZmZXJWaWV3Qnl0ZUxlbmd0aChidWZmZXJWaWV3Qnl0ZUxlbmd0aEFjY3VtdWxhdGVkLCBnbHRmMkJ1ZmZlclZpZXcpO1xuICBjb25zdCBpbnB1dEFjY2Vzc29ySWR4ID0ganNvbi5hY2Nlc3NvcnMuaW5kZXhPZihnbHRmMkFjY2Vzc29yKTtcbiAgcmV0dXJuIHtcbiAgICBpbnB1dEFjY2Vzc29ySWR4LFxuICAgIGlucHV0QnVmZmVyVmlld0J5dGVMZW5ndGhBY2N1bXVsYXRlZDogYnVmZmVyVmlld0J5dGVMZW5ndGhBY2N1bXVsYXRlZCxcbiAgfTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIEJ1ZmZlclZpZXcgYW5kIEFjY2Vzc29yIGZvciBhbmltYXRpb24gb3V0cHV0ICh2YWx1ZSkgZGF0YS5cbiAqXG4gKiBAcGFyYW0ganNvbiAtIFRoZSBnbFRGMiBKU09OIGRvY3VtZW50XG4gKiBAcGFyYW0gc2FtcGxlciAtIFRoZSBhbmltYXRpb24gc2FtcGxlciBjb250YWluaW5nIG91dHB1dCBkYXRhXG4gKiBAcGFyYW0gcGF0aE5hbWUgLSBUaGUgYW5pbWF0aW9uIHBhdGggbmFtZVxuICogQHBhcmFtIGJ1ZmZlcklkeCAtIEluZGV4IG9mIHRoZSB0YXJnZXQgYnVmZmVyXG4gKiBAcGFyYW0gYnVmZmVyVmlld0J5dGVMZW5ndGhBY2N1bXVsYXRlZCAtIEN1cnJlbnQgYWNjdW11bGF0ZWQgYnl0ZSBsZW5ndGhcbiAqIEByZXR1cm5zIE9iamVjdCBjb250YWluaW5nIGFjY2Vzc29yIGluZGV4IGFuZCB1cGRhdGVkIGJ5dGUgbGVuZ3RoXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVHbHRmMkJ1ZmZlclZpZXdBbmRHbHRmMkFjY2Vzc29yRm9yT3V0cHV0KFxuICBqc29uOiBHbHRmMkV4LFxuICBzYW1wbGVyOiBBbmltYXRpb25TYW1wbGVyLFxuICBwYXRoTmFtZTogQW5pbWF0aW9uUGF0aE5hbWUsXG4gIGJ1ZmZlcklkeDogSW5kZXgsXG4gIGJ1ZmZlclZpZXdCeXRlTGVuZ3RoQWNjdW11bGF0ZWQ6IEJ5dGVcbik6IHtcbiAgb3V0cHV0QWNjZXNzb3JJZHg6IEluZGV4O1xuICBvdXRwdXRCdWZmZXJWaWV3Qnl0ZUxlbmd0aEFjY3VtdWxhdGVkOiBCeXRlO1xufSB7XG4gIGNvbnN0IGNvbXBvbmVudFR5cGUgPSBDb21wb25lbnRUeXBlLmZyb21UeXBlZEFycmF5KFxuICAgIEFycmF5QnVmZmVyLmlzVmlldyhzYW1wbGVyLm91dHB1dCkgPyBzYW1wbGVyLm91dHB1dCA6IG5ldyBGbG9hdDMyQXJyYXkoc2FtcGxlci5vdXRwdXQpXG4gICk7XG5cbiAgY29uc3QgY29tcG9zaXRpb25UeXBlID1cbiAgICBwYXRoTmFtZSA9PT0gJ3dlaWdodHMnXG4gICAgICA/IENvbXBvc2l0aW9uVHlwZS5TY2FsYXJcbiAgICAgIDogQ29tcG9zaXRpb25UeXBlLnRvR2x0ZjJBbmltYXRpb25BY2Nlc3NvckNvbXBvc2l0aW9uVHlwZShzYW1wbGVyLm91dHB1dENvbXBvbmVudE4pO1xuICBjb25zdCBhY2Nlc3NvckNvdW50ID1cbiAgICBwYXRoTmFtZSA9PT0gJ3dlaWdodHMnID8gc2FtcGxlci5vdXRwdXQubGVuZ3RoIDogc2FtcGxlci5vdXRwdXQubGVuZ3RoIC8gc2FtcGxlci5vdXRwdXRDb21wb25lbnROO1xuXG4gIC8vIGNyZWF0ZSBhIEdsdGYyQnVmZmVyVmlld1xuICBjb25zdCBnbHRmMkJ1ZmZlclZpZXcgPSBjcmVhdGVHbHRmMkJ1ZmZlclZpZXdGb3JBbmltYXRpb24oe1xuICAgIGJ1ZmZlcklkeCxcbiAgICBidWZmZXJWaWV3Qnl0ZU9mZnNldDogYnVmZmVyVmlld0J5dGVMZW5ndGhBY2N1bXVsYXRlZCxcbiAgICBhY2Nlc3NvckJ5dGVPZmZzZXQ6IDAsXG4gICAgYWNjZXNzb3JDb3VudCxcbiAgICBidWZmZXJWaWV3Qnl0ZVN0cmlkZTogY29tcG9uZW50VHlwZS5nZXRTaXplSW5CeXRlcygpICogc2FtcGxlci5vdXRwdXRDb21wb25lbnROLFxuICAgIGNvbXBvbmVudFR5cGUsXG4gICAgY29tcG9zaXRpb25UeXBlLFxuICAgIHVpbnQ4QXJyYXk6IG5ldyBVaW50OEFycmF5KFxuICAgICAgQXJyYXlCdWZmZXIuaXNWaWV3KHNhbXBsZXIub3V0cHV0KSA/IHNhbXBsZXIub3V0cHV0LmJ1ZmZlciA6IG5ldyBGbG9hdDMyQXJyYXkoc2FtcGxlci5vdXRwdXQpLmJ1ZmZlclxuICAgICksXG4gIH0pO1xuICBqc29uLmJ1ZmZlclZpZXdzLnB1c2goZ2x0ZjJCdWZmZXJWaWV3KTtcblxuICAvLyBjcmVhdGUgYSBHbHRmMkFjY2Vzc29yXG4gIGNvbnN0IGdsdGYyQWNjZXNzb3I6IEdsdGYyQWNjZXNzb3JFeCA9IGNyZWF0ZUdsdGYyQWNjZXNzb3JGb3JBbmltYXRpb24oe1xuICAgIGJ1ZmZlclZpZXdJZHg6IGpzb24uYnVmZmVyVmlld3MuaW5kZXhPZihnbHRmMkJ1ZmZlclZpZXcpLFxuICAgIGFjY2Vzc29yQnl0ZU9mZnNldDogMCxcbiAgICBjb21wb25lbnRUeXBlLFxuICAgIGNvdW50OiBhY2Nlc3NvckNvdW50LFxuICAgIGNvbXBvc2l0aW9uVHlwZSxcbiAgfSk7XG4gIGpzb24uYWNjZXNzb3JzLnB1c2goZ2x0ZjJBY2Nlc3Nvcik7XG5cbiAgLy8gcmVnaXN0ZXJcbiAgYnVmZmVyVmlld0J5dGVMZW5ndGhBY2N1bXVsYXRlZCA9IGFsaWduQnVmZmVyVmlld0J5dGVMZW5ndGgoYnVmZmVyVmlld0J5dGVMZW5ndGhBY2N1bXVsYXRlZCwgZ2x0ZjJCdWZmZXJWaWV3KTtcbiAgY29uc3Qgb3V0cHV0QWNjZXNzb3JJZHggPSBqc29uLmFjY2Vzc29ycy5pbmRleE9mKGdsdGYyQWNjZXNzb3IpO1xuICByZXR1cm4ge1xuICAgIG91dHB1dEFjY2Vzc29ySWR4LFxuICAgIG91dHB1dEJ1ZmZlclZpZXdCeXRlTGVuZ3RoQWNjdW11bGF0ZWQ6IGJ1ZmZlclZpZXdCeXRlTGVuZ3RoQWNjdW11bGF0ZWQsXG4gIH07XG59XG5cbi8qKlxuICogQ3JlYXRlcyBvciByZXVzZXMgYSBnbFRGMiBCdWZmZXJWaWV3IGZvciBnZW5lcmFsIHVzZS5cbiAqXG4gKiBAcGFyYW0ganNvbiAtIFRoZSBnbFRGMiBKU09OIGRvY3VtZW50XG4gKiBAcGFyYW0gZXhpc3RpbmdVbmlxdWVSbkJ1ZmZlcnMgLSBCdWZmZXIgZGVkdXBsaWNhdGlvbiBjYWNoZVxuICogQHBhcmFtIGV4aXN0aW5nVW5pcXVlUm5CdWZmZXJWaWV3cyAtIEJ1ZmZlclZpZXcgZGVkdXBsaWNhdGlvbiBjYWNoZVxuICogQHBhcmFtIHJuQnVmZmVyVmlldyAtIFRoZSBSaG9kb25pdGUgYnVmZmVyIHZpZXcgdG8gY29udmVydFxuICogQHBhcmFtIHRhcmdldCAtIE9wdGlvbmFsIHRhcmdldCBiaW5kaW5nIChlLmcuLCBBUlJBWV9CVUZGRVIpXG4gKiBAcmV0dXJucyBUaGUgY3JlYXRlZCBvciBleGlzdGluZyBnbFRGMiBidWZmZXIgdmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlT3JSZXVzZUdsdGYyQnVmZmVyVmlldyhcbiAganNvbjogR2x0ZjJFeCxcbiAgZXhpc3RpbmdVbmlxdWVSbkJ1ZmZlcnM6IEJ1ZmZlcltdLFxuICBleGlzdGluZ1VuaXF1ZVJuQnVmZmVyVmlld3M6IEJ1ZmZlclZpZXdbXSxcbiAgcm5CdWZmZXJWaWV3OiBCdWZmZXJWaWV3LFxuICB0YXJnZXQ/OiBudW1iZXJcbik6IEdsdGYyQnVmZmVyVmlld0V4IHtcbiAgY29uc3QgYnVmZmVyVmlld0lkeCA9IGZpbmRCdWZmZXJWaWV3SWR4KGV4aXN0aW5nVW5pcXVlUm5CdWZmZXJWaWV3cywgcm5CdWZmZXJWaWV3KTtcbiAgaWYgKGJ1ZmZlclZpZXdJZHggPT09IC0xKSB7XG4gICAgY29uc3QgYnVmZmVySWR4VG9TZXQgPSBjYWxjQnVmZmVySWR4VG9TZXQoZXhpc3RpbmdVbmlxdWVSbkJ1ZmZlcnMsIHJuQnVmZmVyVmlldy5idWZmZXIpO1xuICAgIGNvbnN0IGdsdGYyQnVmZmVyVmlldzogR2x0ZjJCdWZmZXJWaWV3RXggPSB7XG4gICAgICBidWZmZXI6IGJ1ZmZlcklkeFRvU2V0LFxuICAgICAgYnl0ZUxlbmd0aDogcm5CdWZmZXJWaWV3LmJ5dGVMZW5ndGgsXG4gICAgICBieXRlT2Zmc2V0OiBybkJ1ZmZlclZpZXcuYnl0ZU9mZnNldEluQnVmZmVyLFxuICAgICAgZXh0cmFzOiB7XG4gICAgICAgIHVpbnQ4QXJyYXk6IHJuQnVmZmVyVmlldy5nZXRVaW50OEFycmF5KCksXG4gICAgICB9LFxuICAgIH07XG4gICAgaWYgKElzLmV4aXN0KHRhcmdldCkpIHtcbiAgICAgIGdsdGYyQnVmZmVyVmlldy50YXJnZXQgPSB0YXJnZXQ7XG4gICAgfVxuXG4gICAganNvbi5leHRyYXMuYnVmZmVyVmlld0J5dGVMZW5ndGhBY2N1bXVsYXRlZEFycmF5W2J1ZmZlcklkeFRvU2V0XSA9IGFjY3VtdWxhdGVCdWZmZXJWaWV3Qnl0ZUxlbmd0aChcbiAgICAgIGpzb24uZXh0cmFzLmJ1ZmZlclZpZXdCeXRlTGVuZ3RoQWNjdW11bGF0ZWRBcnJheSxcbiAgICAgIGJ1ZmZlcklkeFRvU2V0LFxuICAgICAgZ2x0ZjJCdWZmZXJWaWV3XG4gICAgKTtcbiAgICBleGlzdGluZ1VuaXF1ZVJuQnVmZmVyVmlld3MucHVzaChybkJ1ZmZlclZpZXcpO1xuICAgIGpzb24uYnVmZmVyVmlld3MucHVzaChnbHRmMkJ1ZmZlclZpZXcpO1xuICAgIHJldHVybiBnbHRmMkJ1ZmZlclZpZXc7XG4gIH1cbiAgY29uc3QgZ2x0ZjJCdWZmZXJWaWV3ID0ganNvbi5idWZmZXJWaWV3c1tidWZmZXJWaWV3SWR4XTtcbiAgcmV0dXJuIGdsdGYyQnVmZmVyVmlldztcbn1cblxuLyoqXG4gKiBDcmVhdGVzIG9yIHJldXNlcyBhIGdsVEYyIEFjY2Vzc29yIHdpdGggZGVkdXBsaWNhdGlvbi5cbiAqXG4gKiBAcGFyYW0ganNvbiAtIFRoZSBnbFRGMiBKU09OIGRvY3VtZW50XG4gKiBAcGFyYW0gYnVmZmVyVmlld0lkeFRvU2V0IC0gSW5kZXggb2YgdGhlIGJ1ZmZlciB2aWV3IHRvIHVzZVxuICogQHBhcmFtIGV4aXN0aW5nVW5pcXVlUm5BY2Nlc3NvcnMgLSBBY2Nlc3NvciBkZWR1cGxpY2F0aW9uIGNhY2hlXG4gKiBAcGFyYW0gcm5BY2Nlc3NvciAtIFRoZSBSaG9kb25pdGUgYWNjZXNzb3IgdG8gY29udmVydFxuICogQHJldHVybnMgVGhlIGNyZWF0ZWQgb3IgZXhpc3RpbmcgZ2xURjIgYWNjZXNzb3JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU9yUmV1c2VHbHRmMkFjY2Vzc29yKFxuICBqc29uOiBHbHRmMkV4LFxuICBidWZmZXJWaWV3SWR4VG9TZXQ6IEluZGV4LFxuICBleGlzdGluZ1VuaXF1ZVJuQWNjZXNzb3JzOiBBY2Nlc3NvcltdLFxuICBybkFjY2Vzc29yOiBBY2Nlc3NvclxuKTogR2x0ZjJBY2Nlc3NvckV4IHtcbiAgY29uc3QgYWNjZXNzb3JJZHggPSBjYWxjQWNjZXNzb3JJZHhUb1NldChleGlzdGluZ1VuaXF1ZVJuQWNjZXNzb3JzLCBybkFjY2Vzc29yKTtcbiAgaWYgKGFjY2Vzc29ySWR4ID09PSAtMSkge1xuICAgIC8vIGNyZWF0ZSBhIEdsdGYyQWNjZXNzb3JcbiAgICBjb25zdCBnbHRmMkFjY2Vzc29yOiBHbHRmMkFjY2Vzc29yRXggPSB7XG4gICAgICBidWZmZXJWaWV3OiBidWZmZXJWaWV3SWR4VG9TZXQsXG4gICAgICBieXRlT2Zmc2V0OiBybkFjY2Vzc29yLmJ5dGVPZmZzZXRJbkJ1ZmZlclZpZXcsXG4gICAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLnRvR2x0ZjJBY2Nlc3NvckNvbXBvbmVudFR5cGUocm5BY2Nlc3Nvci5jb21wb25lbnRUeXBlIGFzIEdsdGYyQWNjZXNzb3JDb21wb25lbnRUeXBlKSxcbiAgICAgIGNvdW50OiBybkFjY2Vzc29yLmVsZW1lbnRDb3VudCxcbiAgICAgIHR5cGU6IENvbXBvc2l0aW9uVHlwZS50b0dsdGYyQWNjZXNzb3JDb21wb3NpdGlvblR5cGVTdHJpbmcoXG4gICAgICAgIHJuQWNjZXNzb3IuY29tcG9zaXRpb25UeXBlLmdldE51bWJlck9mQ29tcG9uZW50cygpIGFzIFZlY3RvckFuZFNxdWFyZU1hdHJpeENvbXBvbmVudE5cbiAgICAgICksXG4gICAgICBleHRyYXM6IHtcbiAgICAgICAgdWludDhBcnJheTogdW5kZWZpbmVkLFxuICAgICAgfSxcbiAgICB9O1xuICAgIGlmIChybkFjY2Vzc29yLmNvbXBvc2l0aW9uVHlwZS5nZXROdW1iZXJPZkNvbXBvbmVudHMoKSA8PSA0KSB7XG4gICAgICBnbHRmMkFjY2Vzc29yLm1heCA9IHJuQWNjZXNzb3IubWF4O1xuICAgICAgZ2x0ZjJBY2Nlc3Nvci5taW4gPSBybkFjY2Vzc29yLm1pbjtcbiAgICB9XG4gICAgZXhpc3RpbmdVbmlxdWVSbkFjY2Vzc29ycy5wdXNoKHJuQWNjZXNzb3IpO1xuICAgIGpzb24uYWNjZXNzb3JzLnB1c2goZ2x0ZjJBY2Nlc3Nvcik7XG4gICAgcmV0dXJuIGdsdGYyQWNjZXNzb3I7XG4gIH1cbiAgY29uc3QgZ2x0ZjJBY2Nlc3NvciA9IGpzb24uYWNjZXNzb3JzW2FjY2Vzc29ySWR4XTtcbiAgcmV0dXJuIGdsdGYyQWNjZXNzb3I7XG59XG5cbmNvbnN0IGV4cG9ydFRhbmdlbnRBY2Nlc3NvckNhY2hlID0gbmV3IFdlYWtNYXA8UHJpbWl0aXZlLCBBY2Nlc3Nvcj4oKTtcblxuLyoqXG4gKiBHZXRzIG9yIGNyZWF0ZXMgdGhlIGV4cG9ydCB0YW5nZW50IGFjY2Vzc29yIGZvciBhIHByaW1pdGl2ZS5cbiAqXG4gKiBVc2VzIGNhY2hpbmcgdG8gYXZvaWQgcmVjb21wdXRpbmcgdGFuZ2VudCBhY2Nlc3NvcnMgZm9yIHRoZSBzYW1lIHByaW1pdGl2ZS5cbiAqIElmIGFuIGV4aXN0aW5nIHRhbmdlbnQgYWNjZXNzb3IgZXhpc3RzLCBpdCBub3JtYWxpemVzIGl0LiBPdGhlcndpc2UsIGNvbXB1dGVzXG4gKiB0YW5nZW50cyBmcm9tIHBvc2l0aW9uIGFuZCB0ZXh0dXJlIGNvb3JkaW5hdGUgZGF0YS5cbiAqXG4gKiBAcGFyYW0gcHJpbWl0aXZlIC0gVGhlIHByaW1pdGl2ZSB0byBnZXQvY3JlYXRlIHRhbmdlbnQgYWNjZXNzb3IgZm9yXG4gKiBAcmV0dXJucyBUaGUgdGFuZ2VudCBhY2Nlc3NvciBvciB1bmRlZmluZWQgaWYgaXQgY2Fubm90IGJlIGNyZWF0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEV4cG9ydFRhbmdlbnRBY2Nlc3NvckZvclByaW1pdGl2ZShwcmltaXRpdmU6IFByaW1pdGl2ZSk6IEFjY2Vzc29yIHwgdW5kZWZpbmVkIHtcbiAgaWYgKGV4cG9ydFRhbmdlbnRBY2Nlc3NvckNhY2hlLmhhcyhwcmltaXRpdmUpKSB7XG4gICAgcmV0dXJuIGV4cG9ydFRhbmdlbnRBY2Nlc3NvckNhY2hlLmdldChwcmltaXRpdmUpO1xuICB9XG5cbiAgbGV0IGFjY2Vzc29yOiBBY2Nlc3NvciB8IHVuZGVmaW5lZDtcbiAgY29uc3QgZXhpc3RpbmdUYW5nZW50QWNjZXNzb3IgPSBwcmltaXRpdmUuZ2V0QXR0cmlidXRlKFZlcnRleEF0dHJpYnV0ZS5UYW5nZW50LlhZWik7XG4gIGNvbnN0IG5vcm1hbEFjY2Vzc29yID0gcHJpbWl0aXZlLmdldEF0dHJpYnV0ZShWZXJ0ZXhBdHRyaWJ1dGUuTm9ybWFsLlhZWik7XG5cbiAgaWYgKElzLmV4aXN0KGV4aXN0aW5nVGFuZ2VudEFjY2Vzc29yKSkge1xuICAgIGFjY2Vzc29yID0gY3JlYXRlTm9ybWFsaXplZFRhbmdlbnRBY2Nlc3NvcihleGlzdGluZ1RhbmdlbnRBY2Nlc3Nvciwgbm9ybWFsQWNjZXNzb3IpO1xuICB9IGVsc2Uge1xuICAgIGFjY2Vzc29yID0gY3JlYXRlQ29tcHV0ZWRUYW5nZW50QWNjZXNzb3IocHJpbWl0aXZlLCBub3JtYWxBY2Nlc3Nvcik7XG4gIH1cblxuICBpZiAoSXMuZXhpc3QoYWNjZXNzb3IpKSB7XG4gICAgZXhwb3J0VGFuZ2VudEFjY2Vzc29yQ2FjaGUuc2V0KHByaW1pdGl2ZSwgYWNjZXNzb3IpO1xuICB9XG5cbiAgcmV0dXJuIGFjY2Vzc29yO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBub3JtYWxpemVkIHRhbmdlbnQgYWNjZXNzb3IgZnJvbSBhbiBleGlzdGluZyBzb3VyY2UgYWNjZXNzb3IuXG4gKlxuICogTm9ybWFsaXplcyBlYWNoIHRhbmdlbnQgdmVjdG9yIHVzaW5nIHRoZSBwcm92aWRlZCBub3JtYWwgdmVjdG9ycyB0byBlbnN1cmVcbiAqIG9ydGhvZ29uYWxpdHkgYW5kIHByb3BlciBvcmllbnRhdGlvbi5cbiAqXG4gKiBAcGFyYW0gc291cmNlIC0gVGhlIHNvdXJjZSB0YW5nZW50IGFjY2Vzc29yXG4gKiBAcGFyYW0gbm9ybWFsQWNjZXNzb3IgLSBPcHRpb25hbCBub3JtYWwgYWNjZXNzb3IgZm9yIG9ydGhvbm9ybWFsaXphdGlvblxuICogQHJldHVybnMgTmV3IEFjY2Vzc29yIHdpdGggbm9ybWFsaXplZCB0YW5nZW50IHZlY3RvcnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vcm1hbGl6ZWRUYW5nZW50QWNjZXNzb3Ioc291cmNlOiBBY2Nlc3Nvciwgbm9ybWFsQWNjZXNzb3I6IEFjY2Vzc29yIHwgdW5kZWZpbmVkKTogQWNjZXNzb3Ige1xuICBjb25zdCBjb3VudCA9IHNvdXJjZS5lbGVtZW50Q291bnQ7XG4gIGNvbnN0IGFjY2Vzc29yID0gY3JlYXRlVGVtcG9yYXJ5VmVjNEFjY2Vzc29yKGNvdW50KTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICBjb25zdCB0YW5nZW50ID0gc291cmNlLmdldFZlYzQoaSwge30pO1xuICAgIGNvbnN0IG5vcm1hbCA9IG5vcm1hbEFjY2Vzc29yPy5nZXRWZWMzKGksIHt9KTtcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplVGFuZ2VudFZlY3RvcihcbiAgICAgIHsgeDogdGFuZ2VudC54LCB5OiB0YW5nZW50LnksIHo6IHRhbmdlbnQueiwgdzogdGFuZ2VudC53IH0sXG4gICAgICBub3JtYWwgPyB7IHg6IG5vcm1hbC54LCB5OiBub3JtYWwueSwgejogbm9ybWFsLnogfSA6IHVuZGVmaW5lZFxuICAgICk7XG4gICAgYWNjZXNzb3Iuc2V0VmVjNChpLCBub3JtYWxpemVkLngsIG5vcm1hbGl6ZWQueSwgbm9ybWFsaXplZC56LCBub3JtYWxpemVkLncsIHt9KTtcbiAgfVxuXG4gIHJldHVybiBhY2Nlc3Nvcjtcbn1cblxuLyoqXG4gKiBDb21wdXRlcyB0YW5nZW50IHZlY3RvcnMgZm9yIGEgcHJpbWl0aXZlIGZyb20gcG9zaXRpb24gYW5kIHRleHR1cmUgY29vcmRpbmF0ZXMuXG4gKlxuICogQ2FsY3VsYXRlcyB0YW5nZW50cyB1c2luZyB0aGUgTWlra2Vsc2VuIHRhbmdlbnQgc3BhY2UgYWxnb3JpdGhtLCBhY2N1bXVsYXRpbmdcbiAqIHRhbmdlbnQgYW5kIGJpdGFuZ2VudCB2ZWN0b3JzIGFjcm9zcyBhbGwgdHJpYW5nbGVzIGFuZCB0aGVuIG5vcm1hbGl6aW5nIHRoZW0uXG4gKlxuICogQHBhcmFtIHByaW1pdGl2ZSAtIFRoZSBwcmltaXRpdmUgdG8gY29tcHV0ZSB0YW5nZW50cyBmb3JcbiAqIEBwYXJhbSBub3JtYWxBY2Nlc3NvciAtIE9wdGlvbmFsIG5vcm1hbCBhY2Nlc3NvciBmb3Igb3J0aG9ub3JtYWxpemF0aW9uXG4gKiBAcmV0dXJucyBOZXcgQWNjZXNzb3Igd2l0aCBjb21wdXRlZCB0YW5nZW50IHZlY3RvcnMgb3IgdW5kZWZpbmVkIGlmIGNvbXB1dGF0aW9uIGZhaWxzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDb21wdXRlZFRhbmdlbnRBY2Nlc3NvcihcbiAgcHJpbWl0aXZlOiBQcmltaXRpdmUsXG4gIG5vcm1hbEFjY2Vzc29yOiBBY2Nlc3NvciB8IHVuZGVmaW5lZFxuKTogQWNjZXNzb3IgfCB1bmRlZmluZWQge1xuICBjb25zdCBwb3NpdGlvbkFjY2Vzc29yID0gcHJpbWl0aXZlLmdldEF0dHJpYnV0ZShWZXJ0ZXhBdHRyaWJ1dGUuUG9zaXRpb24uWFlaKTtcbiAgaWYgKElzLm5vdC5leGlzdChwb3NpdGlvbkFjY2Vzc29yKSkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBjb25zdCB0ZXhjb29yZEFjY2Vzc29yID0gZmluZFByaW1hcnlUZXhjb29yZEFjY2Vzc29yKHByaW1pdGl2ZSk7XG4gIGlmIChJcy5ub3QuZXhpc3QodGV4Y29vcmRBY2Nlc3NvcikpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgY29uc3QgdmVydGV4Q291bnQgPSBwb3NpdGlvbkFjY2Vzc29yLmVsZW1lbnRDb3VudDtcbiAgaWYgKHZlcnRleENvdW50ID09PSAwKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIGNvbnN0IGFjY2Vzc29yID0gY3JlYXRlVGVtcG9yYXJ5VmVjNEFjY2Vzc29yKHZlcnRleENvdW50KTtcbiAgY29uc3QgdGFuZ2VudFN1bXMgPSBuZXcgRmxvYXQzMkFycmF5KHZlcnRleENvdW50ICogMyk7XG4gIGNvbnN0IGJpdGFuZ2VudFN1bXMgPSBuZXcgRmxvYXQzMkFycmF5KHZlcnRleENvdW50ICogMyk7XG5cbiAgY29uc3QgaW5kaWNlc0FjY2Vzc29yID0gcHJpbWl0aXZlLmluZGljZXNBY2Nlc3NvcjtcbiAgY29uc3QgdmVydGV4Q291bnRBc0luZGljZXNCYXNlZCA9IHByaW1pdGl2ZS5nZXRWZXJ0ZXhDb3VudEFzSW5kaWNlc0Jhc2VkKCk7XG5cbiAgbGV0IGluY3JlbWVudE51bSA9IDM7XG4gIGNvbnN0IHByaW1pdGl2ZU1vZGUgPSBwcmltaXRpdmUucHJpbWl0aXZlTW9kZTtcbiAgaWYgKHByaW1pdGl2ZU1vZGUgPT09IFByaW1pdGl2ZU1vZGUuVHJpYW5nbGVTdHJpcCB8fCBwcmltaXRpdmVNb2RlID09PSBQcmltaXRpdmVNb2RlLlRyaWFuZ2xlRmFuKSB7XG4gICAgaW5jcmVtZW50TnVtID0gMTtcbiAgfVxuXG4gIGNvbnN0IGV4dHJhY3RJbmRleCA9IChpOiBudW1iZXIpID0+IChpbmRpY2VzQWNjZXNzb3IgPyBpbmRpY2VzQWNjZXNzb3IuZ2V0U2NhbGFyKGksIHt9KSA6IGkpO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdmVydGV4Q291bnRBc0luZGljZXNCYXNlZCAtIDI7IGkgKz0gaW5jcmVtZW50TnVtKSB7XG4gICAgY29uc3QgaTAgPSBleHRyYWN0SW5kZXgoaSk7XG4gICAgY29uc3QgaTEgPSBleHRyYWN0SW5kZXgoaSArIDEpO1xuICAgIGNvbnN0IGkyID0gZXh0cmFjdEluZGV4KGkgKyAyKTtcblxuICAgIGlmIChpMCA9PT0gaTEgfHwgaTEgPT09IGkyIHx8IGkwID09PSBpMikge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgcG9zMCA9IHBvc2l0aW9uQWNjZXNzb3IuZ2V0VmVjMyhpMCwge30pO1xuICAgIGNvbnN0IHBvczEgPSBwb3NpdGlvbkFjY2Vzc29yLmdldFZlYzMoaTEsIHt9KTtcbiAgICBjb25zdCBwb3MyID0gcG9zaXRpb25BY2Nlc3Nvci5nZXRWZWMzKGkyLCB7fSk7XG5cbiAgICBjb25zdCB1djAgPSB0ZXhjb29yZEFjY2Vzc29yLmdldFZlYzIoaTAsIHt9KTtcbiAgICBjb25zdCB1djEgPSB0ZXhjb29yZEFjY2Vzc29yLmdldFZlYzIoaTEsIHt9KTtcbiAgICBjb25zdCB1djIgPSB0ZXhjb29yZEFjY2Vzc29yLmdldFZlYzIoaTIsIHt9KTtcblxuICAgIGNvbnN0IGVkZ2UxeCA9IHBvczEueCAtIHBvczAueDtcbiAgICBjb25zdCBlZGdlMXkgPSBwb3MxLnkgLSBwb3MwLnk7XG4gICAgY29uc3QgZWRnZTF6ID0gcG9zMS56IC0gcG9zMC56O1xuXG4gICAgY29uc3QgZWRnZTJ4ID0gcG9zMi54IC0gcG9zMC54O1xuICAgIGNvbnN0IGVkZ2UyeSA9IHBvczIueSAtIHBvczAueTtcbiAgICBjb25zdCBlZGdlMnogPSBwb3MyLnogLSBwb3MwLno7XG5cbiAgICBjb25zdCBkZWx0YVV2MXggPSB1djEueCAtIHV2MC54O1xuICAgIGNvbnN0IGRlbHRhVXYxeSA9IHV2MS55IC0gdXYwLnk7XG4gICAgY29uc3QgZGVsdGFVdjJ4ID0gdXYyLnggLSB1djAueDtcbiAgICBjb25zdCBkZWx0YVV2MnkgPSB1djIueSAtIHV2MC55O1xuXG4gICAgY29uc3QgZGVub20gPSBkZWx0YVV2MXggKiBkZWx0YVV2MnkgLSBkZWx0YVV2MnggKiBkZWx0YVV2MXk7XG4gICAgaWYgKE1hdGguYWJzKGRlbm9tKSA8PSBUQU5HRU5UX0VQU0lMT04pIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHIgPSAxLjAgLyBkZW5vbTtcblxuICAgIGNvbnN0IHRhbmdlbnRYID0gKGRlbHRhVXYyeSAqIGVkZ2UxeCAtIGRlbHRhVXYxeSAqIGVkZ2UyeCkgKiByO1xuICAgIGNvbnN0IHRhbmdlbnRZID0gKGRlbHRhVXYyeSAqIGVkZ2UxeSAtIGRlbHRhVXYxeSAqIGVkZ2UyeSkgKiByO1xuICAgIGNvbnN0IHRhbmdlbnRaID0gKGRlbHRhVXYyeSAqIGVkZ2UxeiAtIGRlbHRhVXYxeSAqIGVkZ2UyeikgKiByO1xuXG4gICAgY29uc3QgYml0YW5nZW50WCA9IChkZWx0YVV2MXggKiBlZGdlMnggLSBkZWx0YVV2MnggKiBlZGdlMXgpICogcjtcbiAgICBjb25zdCBiaXRhbmdlbnRZID0gKGRlbHRhVXYxeCAqIGVkZ2UyeSAtIGRlbHRhVXYyeCAqIGVkZ2UxeSkgKiByO1xuICAgIGNvbnN0IGJpdGFuZ2VudFogPSAoZGVsdGFVdjF4ICogZWRnZTJ6IC0gZGVsdGFVdjJ4ICogZWRnZTF6KSAqIHI7XG5cbiAgICBhY2N1bXVsYXRlVmVjdG9yMyh0YW5nZW50U3VtcywgaTAsIHRhbmdlbnRYLCB0YW5nZW50WSwgdGFuZ2VudFopO1xuICAgIGFjY3VtdWxhdGVWZWN0b3IzKHRhbmdlbnRTdW1zLCBpMSwgdGFuZ2VudFgsIHRhbmdlbnRZLCB0YW5nZW50Wik7XG4gICAgYWNjdW11bGF0ZVZlY3RvcjModGFuZ2VudFN1bXMsIGkyLCB0YW5nZW50WCwgdGFuZ2VudFksIHRhbmdlbnRaKTtcblxuICAgIGFjY3VtdWxhdGVWZWN0b3IzKGJpdGFuZ2VudFN1bXMsIGkwLCBiaXRhbmdlbnRYLCBiaXRhbmdlbnRZLCBiaXRhbmdlbnRaKTtcbiAgICBhY2N1bXVsYXRlVmVjdG9yMyhiaXRhbmdlbnRTdW1zLCBpMSwgYml0YW5nZW50WCwgYml0YW5nZW50WSwgYml0YW5nZW50Wik7XG4gICAgYWNjdW11bGF0ZVZlY3RvcjMoYml0YW5nZW50U3VtcywgaTIsIGJpdGFuZ2VudFgsIGJpdGFuZ2VudFksIGJpdGFuZ2VudFopO1xuICB9XG5cbiAgZm9yIChsZXQgdmVydGV4SW5kZXggPSAwOyB2ZXJ0ZXhJbmRleCA8IHZlcnRleENvdW50OyB2ZXJ0ZXhJbmRleCsrKSB7XG4gICAgY29uc3QgdGFuZ2VudCA9IHtcbiAgICAgIHg6IHRhbmdlbnRTdW1zW3ZlcnRleEluZGV4ICogMyArIDBdLFxuICAgICAgeTogdGFuZ2VudFN1bXNbdmVydGV4SW5kZXggKiAzICsgMV0sXG4gICAgICB6OiB0YW5nZW50U3Vtc1t2ZXJ0ZXhJbmRleCAqIDMgKyAyXSxcbiAgICAgIHc6IDEsXG4gICAgfTtcbiAgICBjb25zdCBiaXRhbmdlbnQgPSB7XG4gICAgICB4OiBiaXRhbmdlbnRTdW1zW3ZlcnRleEluZGV4ICogMyArIDBdLFxuICAgICAgeTogYml0YW5nZW50U3Vtc1t2ZXJ0ZXhJbmRleCAqIDMgKyAxXSxcbiAgICAgIHo6IGJpdGFuZ2VudFN1bXNbdmVydGV4SW5kZXggKiAzICsgMl0sXG4gICAgfTtcbiAgICBjb25zdCBub3JtYWwgPSBub3JtYWxBY2Nlc3Nvcj8uZ2V0VmVjMyh2ZXJ0ZXhJbmRleCwge30pO1xuXG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVRhbmdlbnRWZWN0b3IoXG4gICAgICB0YW5nZW50LFxuICAgICAgbm9ybWFsID8geyB4OiBub3JtYWwueCwgeTogbm9ybWFsLnksIHo6IG5vcm1hbC56IH0gOiB1bmRlZmluZWQsXG4gICAgICBiaXRhbmdlbnRcbiAgICApO1xuICAgIGFjY2Vzc29yLnNldFZlYzQodmVydGV4SW5kZXgsIG5vcm1hbGl6ZWQueCwgbm9ybWFsaXplZC55LCBub3JtYWxpemVkLnosIG5vcm1hbGl6ZWQudywge30pO1xuICB9XG5cbiAgcmV0dXJuIGFjY2Vzc29yO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgb3IgcmV1c2VzIGEgZ2xURjIgQnVmZmVyVmlldyBmb3IgdmVydGV4IGF0dHJpYnV0ZSBkYXRhLlxuICpcbiAqIE9wdGltaXplcyBidWZmZXIgdmlldyBjcmVhdGlvbiBieSBjaGVja2luZyBmb3IgZXhpc3RpbmcgY29tcGF0aWJsZSBidWZmZXIgdmlld3NcbiAqIGFuZCBjcmVhdGluZyBuZXcgb25lcyBvbmx5IHdoZW4gbmVjZXNzYXJ5LiBIYW5kbGVzIHByb3BlciBzdHJpZGUgY2FsY3VsYXRpb25cbiAqIGZvciB2ZXJ0ZXggYXR0cmlidXRlcy5cbiAqXG4gKiBAcGFyYW0ganNvbiAtIFRoZSBnbFRGMiBKU09OIGRvY3VtZW50XG4gKiBAcGFyYW0gZXhpc3RpbmdVbmlxdWVSbkJ1ZmZlcnMgLSBCdWZmZXIgZGVkdXBsaWNhdGlvbiBjYWNoZVxuICogQHBhcmFtIGV4aXN0aW5nVW5pcXVlUm5CdWZmZXJWaWV3cyAtIEJ1ZmZlclZpZXcgZGVkdXBsaWNhdGlvbiBjYWNoZVxuICogQHBhcmFtIHJuQnVmZmVyVmlldyAtIFRoZSBSaG9kb25pdGUgYnVmZmVyIHZpZXcgdG8gY29udmVydFxuICogQHBhcmFtIHJuQWNjZXNzb3IgLSBUaGUgYWNjZXNzb3IgdGhhdCB3aWxsIHVzZSB0aGlzIGJ1ZmZlciB2aWV3XG4gKiBAcmV0dXJucyBUaGUgY3JlYXRlZCBvciBleGlzdGluZyBnbFRGMiBidWZmZXIgdmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlT3JSZXVzZUdsdGYyQnVmZmVyVmlld0ZvclZlcnRleEF0dHJpYnV0ZUJ1ZmZlcihcbiAganNvbjogR2x0ZjJFeCxcbiAgZXhpc3RpbmdVbmlxdWVSbkJ1ZmZlcnM6IEJ1ZmZlcltdLFxuICBleGlzdGluZ1VuaXF1ZVJuQnVmZmVyVmlld3M6IEJ1ZmZlclZpZXdbXSxcbiAgcm5CdWZmZXJWaWV3OiBCdWZmZXJWaWV3LFxuICBybkFjY2Vzc29yOiBBY2Nlc3NvclxuKTogR2x0ZjJCdWZmZXJWaWV3RXgge1xuICBjb25zdCBidWZmZXJWaWV3SWR4ID0gZmluZEJ1ZmZlclZpZXdJZHgoZXhpc3RpbmdVbmlxdWVSbkJ1ZmZlclZpZXdzLCBybkJ1ZmZlclZpZXcpO1xuICBpZiAoYnVmZmVyVmlld0lkeCA9PT0gLTEpIHtcbiAgICBjb25zdCBidWZmZXJJZHhUb1NldCA9IGNhbGNCdWZmZXJJZHhUb1NldChleGlzdGluZ1VuaXF1ZVJuQnVmZmVycywgcm5CdWZmZXJWaWV3LmJ1ZmZlcik7XG4gICAgY29uc3QgZ2x0ZjJCdWZmZXJWaWV3OiBHbHRmMkJ1ZmZlclZpZXdFeCA9IHtcbiAgICAgIGJ1ZmZlcjogYnVmZmVySWR4VG9TZXQsXG4gICAgICBieXRlTGVuZ3RoOiBybkJ1ZmZlclZpZXcuYnl0ZUxlbmd0aCxcbiAgICAgIGJ5dGVPZmZzZXQ6IHJuQnVmZmVyVmlldy5ieXRlT2Zmc2V0SW5CdWZmZXIsXG4gICAgICBleHRyYXM6IHtcbiAgICAgICAgdWludDhBcnJheTogcm5CdWZmZXJWaWV3LmdldFVpbnQ4QXJyYXkoKSxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBnbHRmMkJ1ZmZlclZpZXcudGFyZ2V0ID0gR0xfQVJSQVlfQlVGRkVSO1xuXG4gICAgY29uc3QgcmVzb2x2ZWRCeXRlU3RyaWRlID0gcmVzb2x2ZVZlcnRleEF0dHJpYnV0ZUJ5dGVTdHJpZGUocm5CdWZmZXJWaWV3LCBybkFjY2Vzc29yKTtcbiAgICBpZiAoSXMuZXhpc3QocmVzb2x2ZWRCeXRlU3RyaWRlKSkge1xuICAgICAgZ2x0ZjJCdWZmZXJWaWV3LmJ5dGVTdHJpZGUgPSByZXNvbHZlZEJ5dGVTdHJpZGU7XG4gICAgfVxuXG4gICAganNvbi5leHRyYXMuYnVmZmVyVmlld0J5dGVMZW5ndGhBY2N1bXVsYXRlZEFycmF5W2J1ZmZlcklkeFRvU2V0XSA9IGFjY3VtdWxhdGVCdWZmZXJWaWV3Qnl0ZUxlbmd0aChcbiAgICAgIGpzb24uZXh0cmFzLmJ1ZmZlclZpZXdCeXRlTGVuZ3RoQWNjdW11bGF0ZWRBcnJheSxcbiAgICAgIGJ1ZmZlcklkeFRvU2V0LFxuICAgICAgZ2x0ZjJCdWZmZXJWaWV3XG4gICAgKTtcblxuICAgIGV4aXN0aW5nVW5pcXVlUm5CdWZmZXJWaWV3cy5wdXNoKHJuQnVmZmVyVmlldyk7XG4gICAganNvbi5idWZmZXJWaWV3cy5wdXNoKGdsdGYyQnVmZmVyVmlldyk7XG4gICAgcmV0dXJuIGdsdGYyQnVmZmVyVmlldztcbiAgfVxuICBjb25zdCBnbHRmMkJ1ZmZlclZpZXcgPSBqc29uLmJ1ZmZlclZpZXdzW2J1ZmZlclZpZXdJZHhdIGFzIEdsdGYyQnVmZmVyVmlld0V4O1xuICBjb25zdCByZXNvbHZlZEJ5dGVTdHJpZGUgPSByZXNvbHZlVmVydGV4QXR0cmlidXRlQnl0ZVN0cmlkZShybkJ1ZmZlclZpZXcsIHJuQWNjZXNzb3IpO1xuICBpZiAoSXMuZXhpc3QocmVzb2x2ZWRCeXRlU3RyaWRlKSkge1xuICAgIGNvbnN0IGN1cnJlbnRTdHJpZGUgPSBnbHRmMkJ1ZmZlclZpZXcuYnl0ZVN0cmlkZSA/PyAwO1xuICAgIGlmIChjdXJyZW50U3RyaWRlID09PSAwIHx8IGN1cnJlbnRTdHJpZGUgPCByZXNvbHZlZEJ5dGVTdHJpZGUpIHtcbiAgICAgIGdsdGYyQnVmZmVyVmlldy5ieXRlU3RyaWRlID0gcmVzb2x2ZWRCeXRlU3RyaWRlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZ2x0ZjJCdWZmZXJWaWV3O1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBhIFJob2Rvbml0ZSBtYXRlcmlhbCByZXF1aXJlcyB0YW5nZW50IHZlY3RvcnMuXG4gKlxuICogRGV0ZXJtaW5lcyBpZiB0aGUgbWF0ZXJpYWwgdXNlcyBub3JtYWwgbWFwcGluZyBvciBjbGVhcmNvYXQgbm9ybWFsIG1hcHBpbmcsXG4gKiB3aGljaCByZXF1aXJlIHRhbmdlbnQgdmVjdG9ycyBmb3IgcHJvcGVyIHJlbmRlcmluZy5cbiAqXG4gKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgbWF0ZXJpYWwgdG8gY2hlY2ssIG9yIHVuZGVmaW5lZFxuICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgbWF0ZXJpYWwgcmVxdWlyZXMgdGFuZ2VudHMsIGZhbHNlIG90aGVyd2lzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZG9lc1Job2Rvbml0ZU1hdGVyaWFsUmVxdWlyZVRhbmdlbnRzKG1hdGVyaWFsOiBNYXRlcmlhbCB8IHVuZGVmaW5lZCk6IGJvb2xlYW4ge1xuICBpZiAoSXMubm90LmV4aXN0KG1hdGVyaWFsKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGNvbnN0IG5vcm1hbFRleHR1cmVQYXJhbSA9IG1hdGVyaWFsLmdldFRleHR1cmVQYXJhbWV0ZXIoJ25vcm1hbFRleHR1cmUnKSBhcyBhbnk7XG4gIGlmIChJcy5leGlzdChub3JtYWxUZXh0dXJlUGFyYW0/LlsxXSkpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGNvbnN0IGNsZWFyY29hdE5vcm1hbFRleHR1cmVQYXJhbSA9IG1hdGVyaWFsLmdldFRleHR1cmVQYXJhbWV0ZXIoJ2NsZWFyY29hdE5vcm1hbFRleHR1cmUnKSBhcyBhbnk7XG4gIHJldHVybiBJcy5leGlzdChjbGVhcmNvYXROb3JtYWxUZXh0dXJlUGFyYW0/LlsxXSk7XG59XG5cbi8qKlxuICogU2V0cyB1cCBibGVuZCBzaGFwZSAobW9ycGggdGFyZ2V0KSBkYXRhIGZvciBhIHByaW1pdGl2ZS5cbiAqXG4gKiBQcm9jZXNzZXMgYmxlbmQgc2hhcGUgdGFyZ2V0cyBmcm9tIFJob2Rvbml0ZSBmb3JtYXQgdG8gZ2xURjIgbW9ycGggdGFyZ2V0cyxcbiAqIGNyZWF0aW5nIHRoZSBuZWNlc3NhcnkgYWNjZXNzb3JzIGFuZCBidWZmZXIgdmlld3MgZm9yIHZlcnRleCBhdHRyaWJ1dGUgZGVsdGFzLlxuICpcbiAqIEBwYXJhbSBlbnRpdHkgLSBUaGUgbWVzaCBlbnRpdHkgY29udGFpbmluZyBibGVuZCBzaGFwZSBkYXRhXG4gKiBAcGFyYW0gcm5QcmltaXRpdmUgLSBUaGUgUmhvZG9uaXRlIHByaW1pdGl2ZSB3aXRoIGJsZW5kIHNoYXBlIHRhcmdldHNcbiAqIEBwYXJhbSBwcmltaXRpdmUgLSBUaGUgZ2xURjIgcHJpbWl0aXZlIHRvIHBvcHVsYXRlIHdpdGggbW9ycGggdGFyZ2V0c1xuICogQHBhcmFtIGpzb24gLSBUaGUgZ2xURjIgSlNPTiBkb2N1bWVudFxuICogQHBhcmFtIGV4aXN0aW5nVW5pcXVlUm5CdWZmZXJzIC0gQnVmZmVyIGRlZHVwbGljYXRpb24gY2FjaGVcbiAqIEBwYXJhbSBleGlzdGluZ1VuaXF1ZVJuQnVmZmVyVmlld3MgLSBCdWZmZXJWaWV3IGRlZHVwbGljYXRpb24gY2FjaGVcbiAqIEBwYXJhbSBleGlzdGluZ1VuaXF1ZVJuQWNjZXNzb3JzIC0gQWNjZXNzb3IgZGVkdXBsaWNhdGlvbiBjYWNoZVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0dXBCbGVuZFNoYXBlRGF0YShcbiAgZW50aXR5OiBJTWVzaEVudGl0eSxcbiAgcm5QcmltaXRpdmU6IFByaW1pdGl2ZSxcbiAgcHJpbWl0aXZlOiBHbHRmMlByaW1pdGl2ZSxcbiAganNvbjogR2x0ZjJFeCxcbiAgZXhpc3RpbmdVbmlxdWVSbkJ1ZmZlcnM6IEJ1ZmZlcltdLFxuICBleGlzdGluZ1VuaXF1ZVJuQnVmZmVyVmlld3M6IEJ1ZmZlclZpZXdbXSxcbiAgZXhpc3RpbmdVbmlxdWVSbkFjY2Vzc29yczogQWNjZXNzb3JbXVxuKTogdm9pZCB7XG4gIGNvbnN0IGJsZW5kU2hhcGVDb21wb25lbnQgPSBlbnRpdHkudHJ5VG9HZXRCbGVuZFNoYXBlKCk7XG4gIGlmIChJcy5leGlzdChibGVuZFNoYXBlQ29tcG9uZW50KSkge1xuICAgIGNvbnN0IHRhcmdldHMgPSByblByaW1pdGl2ZS5nZXRCbGVuZFNoYXBlVGFyZ2V0cygpO1xuICAgIGlmIChJcy5ub3QuZXhpc3QocHJpbWl0aXZlLnRhcmdldHMpKSB7XG4gICAgICBwcmltaXRpdmUudGFyZ2V0cyA9IFtdIGFzIEdsdGYyQXR0cmlidXRlQmxlbmRTaGFwZXM7XG4gICAgfVxuXG4gICAgY29uc3QgdGFyZ2V0TmFtZXMgPSBibGVuZFNoYXBlQ29tcG9uZW50LnRhcmdldE5hbWVzO1xuICAgIGlmICh0YXJnZXRzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IGxpbWl0ZWRUYXJnZXROYW1lcyA9IHRhcmdldHMubWFwKChfLCBpZHgpID0+IHRhcmdldE5hbWVzW2lkeF0gPz8gYE1vcnBoVGFyZ2V0XyR7aWR4fWApO1xuICAgICAgcHJpbWl0aXZlLmV4dHJhcyA9IHByaW1pdGl2ZS5leHRyYXMgPz8ge307XG4gICAgICBwcmltaXRpdmUuZXh0cmFzLnRhcmdldE5hbWVzID0gbGltaXRlZFRhcmdldE5hbWVzO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgdGFyZ2V0IG9mIHRhcmdldHMpIHtcbiAgICAgIGNvbnN0IHRhcmdldEpzb24gPSB7fSBhcyBHbHRmMkF0dHJpYnV0ZXM7XG4gICAgICBmb3IgKGNvbnN0IFthdHRyaWJ1dGVOYW1lLCBybkFjY2Vzc29yXSBvZiB0YXJnZXQuZW50cmllcygpKSB7XG4gICAgICAgIGNvbnN0IGdsdGYyQnVmZmVyVmlldyA9IGNyZWF0ZU9yUmV1c2VHbHRmMkJ1ZmZlclZpZXcoXG4gICAgICAgICAganNvbixcbiAgICAgICAgICBleGlzdGluZ1VuaXF1ZVJuQnVmZmVycyxcbiAgICAgICAgICBleGlzdGluZ1VuaXF1ZVJuQnVmZmVyVmlld3MsXG4gICAgICAgICAgcm5BY2Nlc3Nvci5idWZmZXJWaWV3LFxuICAgICAgICAgIEdMX0FSUkFZX0JVRkZFUlxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnN0IGdsdGYyQWNjZXNzb3IgPSBjcmVhdGVPclJldXNlR2x0ZjJBY2Nlc3NvcihcbiAgICAgICAgICBqc29uLFxuICAgICAgICAgIGpzb24uYnVmZmVyVmlld3MuaW5kZXhPZihnbHRmMkJ1ZmZlclZpZXcpLFxuICAgICAgICAgIGV4aXN0aW5nVW5pcXVlUm5BY2Nlc3NvcnMsXG4gICAgICAgICAgcm5BY2Nlc3NvclxuICAgICAgICApO1xuICAgICAgICBjb25zdCBhY2Nlc3NvcklkeCA9IGpzb24uYWNjZXNzb3JzLmluZGV4T2YoZ2x0ZjJBY2Nlc3Nvcik7XG4gICAgICAgIGNvbnN0IGF0dHJpYnV0ZUpvaW5lZFN0cmluZyA9IGF0dHJpYnV0ZU5hbWU7XG4gICAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IGF0dHJpYnV0ZUpvaW5lZFN0cmluZy5zcGxpdCgnLicpWzBdO1xuICAgICAgICB0YXJnZXRKc29uW2F0dHJpYnV0ZV0gPSBhY2Nlc3NvcklkeDtcbiAgICAgIH1cbiAgICAgIHByaW1pdGl2ZS50YXJnZXRzLnB1c2godGFyZ2V0SnNvbik7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogSGFuZGxlcyB0ZXh0dXJlIGltYWdlIHByb2Nlc3NpbmcgZm9yIGRpZmZlcmVudCBleHBvcnQgZm9ybWF0cy5cbiAqXG4gKiBQcm9jZXNzZXMgdGV4dHVyZSBpbWFnZXMgZm9yIGluY2x1c2lvbiBpbiBnbFRGMiBleHBvcnQsIGhhbmRsaW5nIGJvdGhcbiAqIHNlcGFyYXRlIGZpbGUgZG93bmxvYWRzIGFuZCBlbWJlZGRlZCBiaW5hcnkgZm9ybWF0cyBkZXBlbmRpbmcgb24gZXhwb3J0IHR5cGUuXG4gKlxuICogQHBhcmFtIGpzb24gLSBUaGUgZ2xURjIgSlNPTiBkb2N1bWVudFxuICogQHBhcmFtIGJ1ZmZlcklkeCAtIEluZGV4IG9mIHRoZSB0YXJnZXQgYnVmZmVyXG4gKiBAcGFyYW0gYmxvYiAtIEltYWdlIGRhdGEgYXMgYSBCbG9iXG4gKiBAcGFyYW0gb3B0aW9uIC0gRXhwb3J0IG9wdGlvbnMgYWZmZWN0aW5nIGltYWdlIGhhbmRsaW5nXG4gKiBAcGFyYW0gZ2xURjJJbWFnZUV4IC0gVGhlIGdsVEYyIGltYWdlIG9iamVjdCB0byBwb3B1bGF0ZVxuICogQHBhcmFtIHJlc29sdmUgLSBQcm9taXNlIHJlc29sdmUgY2FsbGJhY2tcbiAqIEBwYXJhbSByZWplY3RlZCAtIFByb21pc2UgcmVqZWN0IGNhbGxiYWNrXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVUZXh0dXJlSW1hZ2UoXG4gIGpzb246IEdsdGYyRXgsXG4gIGJ1ZmZlcklkeDogSW5kZXgsXG4gIGJsb2I6IEJsb2IsXG4gIG9wdGlvbjogeyB0eXBlOiBzdHJpbmcgfSxcbiAgZ2xURjJJbWFnZUV4OiBHbHRmMkltYWdlRXgsXG4gIHJlc29sdmU6ICh2PzogQXJyYXlCdWZmZXIpID0+IHZvaWQsXG4gIHJlamVjdGVkOiAocmVhc29uPzogRE9NRXhjZXB0aW9uKSA9PiB2b2lkLFxuICBnbHRmMkV4cG9ydFR5cGUgPSAnZ2xURidcbik6IFByb21pc2U8dm9pZD4ge1xuICBpZiAob3B0aW9uLnR5cGUgPT09IGdsdGYyRXhwb3J0VHlwZSkge1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY29uc3QgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgIGNvbnN0IGUgPSBuZXcgTW91c2VFdmVudCgnY2xpY2snKTtcbiAgICAgIGEuaHJlZiA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYiEpO1xuICAgICAgYS5kb3dubG9hZCA9IGdsVEYySW1hZ2VFeC51cmkhO1xuICAgICAgYS5kaXNwYXRjaEV2ZW50KGUpO1xuICAgICAgVVJMLnJldm9rZU9iamVjdFVSTChhLmhyZWYpO1xuICAgIH0sIE1hdGgucmFuZG9tKCkgKiA1MDAwKTtcbiAgICByZXNvbHZlKCk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICByZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGFycmF5QnVmZmVyID0gcmVhZGVyLnJlc3VsdCBhcyBBcnJheUJ1ZmZlcjtcbiAgICAgIGNvbnN0IGdsdGYyQnVmZmVyVmlldyA9IGNyZWF0ZUFuZEFkZEdsdGYyQnVmZmVyVmlldyhcbiAgICAgICAganNvbixcbiAgICAgICAgYnVmZmVySWR4LFxuICAgICAgICBuZXcgVWludDhDbGFtcGVkQXJyYXkoYXJyYXlCdWZmZXIpIGFzIHVua25vd24gYXMgVWludDhBcnJheVxuICAgICAgKTtcbiAgICAgIGdsVEYySW1hZ2VFeC5idWZmZXJWaWV3ID0ganNvbi5idWZmZXJWaWV3cy5pbmRleE9mKGdsdGYyQnVmZmVyVmlldyk7XG4gICAgICBnbFRGMkltYWdlRXgubWltZVR5cGUgPSAnaW1hZ2UvcG5nJztcbiAgICAgIGdsVEYySW1hZ2VFeC51cmkgPSB1bmRlZmluZWQ7XG4gICAgICByZXNvbHZlKCk7XG4gICAgfSk7XG4gICAgcmVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgKCkgPT4ge1xuICAgICAgcmVqZWN0ZWQocmVhZGVyLmVycm9yIGFzIERPTUV4Y2VwdGlvbik7XG4gICAgfSk7XG4gICAgcmVhZGVyLnJlYWRBc0FycmF5QnVmZmVyKGJsb2IpO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBCdWZmZXJWaWV3cyBhbmQgQWNjZXNzb3JzIGZvciBza2luIChza2VsZXRhbCkgZGF0YS5cbiAqXG4gKiBQcm9jZXNzZXMgc2tlbGV0YWwgZW50aXRpZXMgdG8gZXh0cmFjdCBpbnZlcnNlIGJpbmQgbWF0cmljZXMgYW5kIGpvaW50XG4gKiBoaWVyYXJjaGllcywgY3JlYXRpbmcgdGhlIG5lY2Vzc2FyeSBnbFRGMiBidWZmZXIgdmlld3MgYW5kIGFjY2Vzc29ycy5cbiAqXG4gKiBAcGFyYW0ganNvbiAtIFRoZSBnbFRGMiBKU09OIGRvY3VtZW50IHRvIHBvcHVsYXRlXG4gKiBAcGFyYW0gZW50aXRpZXMgLSBTa2VsZXRhbCBlbnRpdGllcyB0byBwcm9jZXNzXG4gKiBAcGFyYW0gZXhpc3RpbmdVbmlxdWVSbkJ1ZmZlcnMgLSBCdWZmZXIgZGVkdXBsaWNhdGlvbiBjYWNoZVxuICogQHBhcmFtIGV4aXN0aW5nVW5pcXVlUm5CdWZmZXJWaWV3cyAtIEJ1ZmZlclZpZXcgZGVkdXBsaWNhdGlvbiBjYWNoZVxuICogQHBhcmFtIGV4aXN0aW5nVW5pcXVlUm5BY2Nlc3NvcnMgLSBBY2Nlc3NvciBkZWR1cGxpY2F0aW9uIGNhY2hlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBfX2NyZWF0ZUJ1ZmZlclZpZXdzQW5kQWNjZXNzb3JzT2ZTa2luKFxuICBqc29uOiBHbHRmMkV4LFxuICBlbnRpdGllczogSVNrZWxldGFsRW50aXR5W10sXG4gIGV4aXN0aW5nVW5pcXVlUm5CdWZmZXJzOiBCdWZmZXJbXSxcbiAgZXhpc3RpbmdVbmlxdWVSbkJ1ZmZlclZpZXdzOiBCdWZmZXJWaWV3W10sXG4gIGV4aXN0aW5nVW5pcXVlUm5BY2Nlc3NvcnM6IEFjY2Vzc29yW11cbik6IHZvaWQge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGVudGl0aWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgZW50aXR5ID0gZW50aXRpZXNbaV07XG4gICAgY29uc3Qgc2tlbGV0YWxDb21wb25lbnQgPSBlbnRpdHkudHJ5VG9HZXRTa2VsZXRhbCgpO1xuICAgIGlmIChJcy5ub3QuZXhpc3Qoc2tlbGV0YWxDb21wb25lbnQpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAganNvbi5leHRyYXMucm5Ta2lucy5wdXNoKHNrZWxldGFsQ29tcG9uZW50LmVudGl0eSBhcyBhbnkpO1xuICAgIGNvbnN0IGpvaW50U2NlbmVDb21wb25lbnRzT2ZUaGVFbnRpdHkgPSBza2VsZXRhbENvbXBvbmVudC5nZXRKb2ludHMoKTtcbiAgICBjb25zdCBqb2ludEluZGljZXNPZlRoZUVudGl0eTogSW5kZXhbXSA9IFtdO1xuICAgIGZvciAoY29uc3Qgam9pbnRTY2VuZUNvbXBvbmVudCBvZiBqb2ludFNjZW5lQ29tcG9uZW50c09mVGhlRW50aXR5KSB7XG4gICAgICBlbnRpdGllcy5mb3JFYWNoKChlbnRpdHlPYmosIGopID0+IHtcbiAgICAgICAgaWYgKGpvaW50U2NlbmVDb21wb25lbnQuZW50aXR5ID09PSBlbnRpdHlPYmopIHtcbiAgICAgICAgICBqb2ludEluZGljZXNPZlRoZUVudGl0eS5wdXNoKGopO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBpbnZlcnNlQmluZE1hdFJuQWNjZXNzb3IgPSBza2VsZXRhbENvbXBvbmVudC5nZXRJbnZlcnNlQmluZE1hdHJpY2VzQWNjZXNzb3IoKTtcbiAgICBpZiAoSXMuZXhpc3QoaW52ZXJzZUJpbmRNYXRSbkFjY2Vzc29yKSkge1xuICAgICAgY29uc3QgZ2x0ZjJCdWZmZXJWaWV3ID0gY3JlYXRlT3JSZXVzZUdsdGYyQnVmZmVyVmlldyhcbiAgICAgICAganNvbixcbiAgICAgICAgZXhpc3RpbmdVbmlxdWVSbkJ1ZmZlcnMsXG4gICAgICAgIGV4aXN0aW5nVW5pcXVlUm5CdWZmZXJWaWV3cyxcbiAgICAgICAgaW52ZXJzZUJpbmRNYXRSbkFjY2Vzc29yLmJ1ZmZlclZpZXdcbiAgICAgICk7XG5cbiAgICAgIGNyZWF0ZU9yUmV1c2VHbHRmMkFjY2Vzc29yKFxuICAgICAgICBqc29uLFxuICAgICAgICBqc29uLmJ1ZmZlclZpZXdzLmluZGV4T2YoZ2x0ZjJCdWZmZXJWaWV3KSxcbiAgICAgICAgZXhpc3RpbmdVbmlxdWVSbkFjY2Vzc29ycyxcbiAgICAgICAgaW52ZXJzZUJpbmRNYXRSbkFjY2Vzc29yXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IHRvcE9mSm9pbnRzU2tlbGV0b25TY2VuZUNvbXBvbmVudCA9IHNrZWxldGFsQ29tcG9uZW50LnRvcE9mSm9pbnRzSGllcmFyY2h5O1xuICAgIGNvbnN0IGJpbmRTaGFwZU1hdHJpeCA9IHNrZWxldGFsQ29tcG9uZW50Ll9iaW5kU2hhcGVNYXRyaXg7XG4gICAgbGV0IHNrZWxldGFsSWR4ID0gLTE7XG4gICAgaWYgKElzLmV4aXN0KHRvcE9mSm9pbnRzU2tlbGV0b25TY2VuZUNvbXBvbmVudCkpIHtcbiAgICAgIGNvbnN0IHNrZWxldGFsRW50aXR5ID0gdG9wT2ZKb2ludHNTa2VsZXRvblNjZW5lQ29tcG9uZW50LmVudGl0eSBhcyBJU2tlbGV0YWxFbnRpdHk7XG4gICAgICBza2VsZXRhbElkeCA9IGVudGl0aWVzLmluZGV4T2Yoc2tlbGV0YWxFbnRpdHkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBza2VsZXRhbElkeCA9IGpvaW50SW5kaWNlc09mVGhlRW50aXR5WzBdO1xuICAgIH1cbiAgICBjb25zdCBza2luSnNvbjogR2x0ZjJTa2luID0ge1xuICAgICAgam9pbnRzOiBqb2ludEluZGljZXNPZlRoZUVudGl0eSxcbiAgICAgIGludmVyc2VCaW5kTWF0cmljZXM6IGpzb24uYWNjZXNzb3JzLmxlbmd0aCAtIDEsXG4gICAgICBza2VsZXRvbjogc2tlbGV0YWxJZHggPj0gMCA/IHNrZWxldGFsSWR4IDogdW5kZWZpbmVkLFxuICAgICAgYmluZFNoYXBlTWF0cml4OiBiaW5kU2hhcGVNYXRyaXg/LmZsYXR0ZW5Bc0FycmF5KCksXG4gICAgfTtcblxuICAgIGpzb24uc2tpbnMucHVzaChza2luSnNvbik7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIEJ1ZmZlclZpZXdzIGFuZCBBY2Nlc3NvcnMgZm9yIG1lc2ggZ2VvbWV0cnkgZGF0YS5cbiAqXG4gKiBQcm9jZXNzZXMgbWVzaCBlbnRpdGllcyB0byBleHRyYWN0IHZlcnRleCBhdHRyaWJ1dGVzLCBpbmRpY2VzLCBhbmQgYmxlbmQgc2hhcGVcbiAqIGRhdGEsIGNyZWF0aW5nIHRoZSBuZWNlc3NhcnkgZ2xURjIgYnVmZmVyIHZpZXdzIGFuZCBhY2Nlc3NvcnMuIEhhbmRsZXNcbiAqIGRlZHVwbGljYXRpb24gYW5kIHByb3BlciBtZW1vcnkgbGF5b3V0IGZvciBlZmZpY2llbnQgc3RvcmFnZS5cbiAqXG4gKiBAcGFyYW0ganNvbiAtIFRoZSBnbFRGMiBKU09OIGRvY3VtZW50IHRvIHBvcHVsYXRlXG4gKiBAcGFyYW0gZW50aXRpZXMgLSBNZXNoIGVudGl0aWVzIHRvIHByb2Nlc3NcbiAqIEBwYXJhbSBleGlzdGluZ1VuaXF1ZVJuQnVmZmVycyAtIEJ1ZmZlciBkZWR1cGxpY2F0aW9uIGNhY2hlXG4gKiBAcGFyYW0gZXhpc3RpbmdVbmlxdWVSbkJ1ZmZlclZpZXdzIC0gQnVmZmVyVmlldyBkZWR1cGxpY2F0aW9uIGNhY2hlXG4gKiBAcGFyYW0gZXhpc3RpbmdVbmlxdWVSbkFjY2Vzc29ycyAtIEFjY2Vzc29yIGRlZHVwbGljYXRpb24gY2FjaGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIF9fY3JlYXRlQnVmZmVyVmlld3NBbmRBY2Nlc3NvcnNPZk1lc2goXG4gIGpzb246IEdsdGYyRXgsXG4gIGVudGl0aWVzOiBJTWVzaEVudGl0eVtdLFxuICBleGlzdGluZ1VuaXF1ZVJuQnVmZmVyczogQnVmZmVyW10sXG4gIGV4aXN0aW5nVW5pcXVlUm5CdWZmZXJWaWV3czogQnVmZmVyVmlld1tdLFxuICBleGlzdGluZ1VuaXF1ZVJuQWNjZXNzb3JzOiBBY2Nlc3NvcltdXG4pOiB2b2lkIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbnRpdGllcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGVudGl0eSA9IGVudGl0aWVzW2ldO1xuICAgIGNvbnN0IG1lc2hDb21wb25lbnQgPSBlbnRpdHkudHJ5VG9HZXRNZXNoKCk7XG4gICAgaWYgKElzLmV4aXN0KG1lc2hDb21wb25lbnQpICYmIG1lc2hDb21wb25lbnQubWVzaCkge1xuICAgICAgY29uc3QgbWVzaDogR2x0ZjJNZXNoID0geyBwcmltaXRpdmVzOiBbXSB9O1xuICAgICAgY29uc3Qgcm5NZXNoID0gbWVzaENvbXBvbmVudC5tZXNoO1xuICAgICAgY29uc3QgcHJpbWl0aXZlQ291bnQgPSBybk1lc2guZ2V0UHJpbWl0aXZlTnVtYmVyKCk7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHByaW1pdGl2ZUNvdW50OyBqKyspIHtcbiAgICAgICAgY29uc3Qgcm5QcmltaXRpdmUgPSBybk1lc2guZ2V0UHJpbWl0aXZlQXQoaik7XG4gICAgICAgIGNvbnN0IHByaW1pdGl2ZTogR2x0ZjJQcmltaXRpdmUgPSB7XG4gICAgICAgICAgYXR0cmlidXRlczoge30sXG4gICAgICAgICAgbW9kZTogcm5QcmltaXRpdmUucHJpbWl0aXZlTW9kZS5pbmRleCxcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBWZXJ0ZXggSW5kaWNlc1xuICAgICAgICAvLyBGb3IgaW5kaWNlcyBhY2Nlc3NvclxuICAgICAgICBjb25zdCBybkluZGljZXNBY2Nlc3NvciA9IHJuUHJpbWl0aXZlLmluZGljZXNBY2Nlc3NvcjtcbiAgICAgICAgaWYgKElzLmV4aXN0KHJuSW5kaWNlc0FjY2Vzc29yKSkge1xuICAgICAgICAgIGNvbnN0IHJuQnVmZmVyVmlldyA9IHJuSW5kaWNlc0FjY2Vzc29yLmJ1ZmZlclZpZXc7XG4gICAgICAgICAgY29uc3QgZ2x0ZjJCdWZmZXJWaWV3ID0gY3JlYXRlT3JSZXVzZUdsdGYyQnVmZmVyVmlldyhcbiAgICAgICAgICAgIGpzb24sXG4gICAgICAgICAgICBleGlzdGluZ1VuaXF1ZVJuQnVmZmVycyxcbiAgICAgICAgICAgIGV4aXN0aW5nVW5pcXVlUm5CdWZmZXJWaWV3cyxcbiAgICAgICAgICAgIHJuQnVmZmVyVmlldyxcbiAgICAgICAgICAgIEdMX0VMRU1FTlRfQVJSQVlfQlVGRkVSXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGNvbnN0IGdsdGYyQWNjZXNzb3IgPSBjcmVhdGVPclJldXNlR2x0ZjJBY2Nlc3NvcihcbiAgICAgICAgICAgIGpzb24sXG4gICAgICAgICAgICBqc29uLmJ1ZmZlclZpZXdzLmluZGV4T2YoZ2x0ZjJCdWZmZXJWaWV3KSxcbiAgICAgICAgICAgIGV4aXN0aW5nVW5pcXVlUm5BY2Nlc3NvcnMsXG4gICAgICAgICAgICBybkluZGljZXNBY2Nlc3NvclxuICAgICAgICAgICk7XG4gICAgICAgICAgY29uc3QgYWNjZXNzb3JJZHggPSBqc29uLmFjY2Vzc29ycy5pbmRleE9mKGdsdGYyQWNjZXNzb3IpO1xuICAgICAgICAgIHByaW1pdGl2ZS5pbmRpY2VzID0gYWNjZXNzb3JJZHg7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBWZXJ0ZXggQXR0cmlidXRlc1xuICAgICAgICAvLyBGb3IgZWFjaCBhdHRyaWJ1dGUgYWNjZXNzb3JcbiAgICAgICAgY29uc3QgZXhwb3J0QXR0cmlidXRlU2VtYW50aWNzID0gcm5QcmltaXRpdmUuYXR0cmlidXRlU2VtYW50aWNzLmNvbmNhdCgpO1xuICAgICAgICBjb25zdCBleHBvcnRBdHRyaWJ1dGVBY2Nlc3NvcnMgPSByblByaW1pdGl2ZS5hdHRyaWJ1dGVBY2Nlc3NvcnMuY29uY2F0KCk7XG5cbiAgICAgICAgY29uc3QgbmVlZHNUYW5nZW50cyA9IGRvZXNSaG9kb25pdGVNYXRlcmlhbFJlcXVpcmVUYW5nZW50cyhyblByaW1pdGl2ZS5tYXRlcmlhbCk7XG4gICAgICAgIGlmIChuZWVkc1RhbmdlbnRzKSB7XG4gICAgICAgICAgY29uc3QgdGFuZ2VudFNlbWFudGljSW5kZXggPSBleHBvcnRBdHRyaWJ1dGVTZW1hbnRpY3MuZmluZEluZGV4KHNlbWFudGljID0+IHNlbWFudGljLnN0YXJ0c1dpdGgoJ1RBTkdFTlQnKSk7XG4gICAgICAgICAgY29uc3QgZXhwb3J0VGFuZ2VudEFjY2Vzc29yID0gZ2V0RXhwb3J0VGFuZ2VudEFjY2Vzc29yRm9yUHJpbWl0aXZlKHJuUHJpbWl0aXZlKTtcbiAgICAgICAgICBpZiAoSXMuZXhpc3QoZXhwb3J0VGFuZ2VudEFjY2Vzc29yKSkge1xuICAgICAgICAgICAgaWYgKHRhbmdlbnRTZW1hbnRpY0luZGV4ID49IDApIHtcbiAgICAgICAgICAgICAgZXhwb3J0QXR0cmlidXRlQWNjZXNzb3JzW3RhbmdlbnRTZW1hbnRpY0luZGV4XSA9IGV4cG9ydFRhbmdlbnRBY2Nlc3NvcjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGV4cG9ydEF0dHJpYnV0ZVNlbWFudGljcy5wdXNoKFZlcnRleEF0dHJpYnV0ZS5UYW5nZW50LlhZWik7XG4gICAgICAgICAgICAgIGV4cG9ydEF0dHJpYnV0ZUFjY2Vzc29ycy5wdXNoKGV4cG9ydFRhbmdlbnRBY2Nlc3Nvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgYXR0ckluZGV4ID0gMDsgYXR0ckluZGV4IDwgZXhwb3J0QXR0cmlidXRlQWNjZXNzb3JzLmxlbmd0aDsgYXR0ckluZGV4KyspIHtcbiAgICAgICAgICBjb25zdCBhdHRyaWJ1dGVKb2luZWRTdHJpbmcgPSBleHBvcnRBdHRyaWJ1dGVTZW1hbnRpY3NbYXR0ckluZGV4XSBhcyBzdHJpbmc7XG4gICAgICAgICAgY29uc3QgYXR0cmlidXRlTmFtZSA9IGF0dHJpYnV0ZUpvaW5lZFN0cmluZy5zcGxpdCgnLicpWzBdO1xuICAgICAgICAgIGlmIChhdHRyaWJ1dGVOYW1lID09PSAnQkFSWV9DRU5UUklDX0NPT1JEJykge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIGNyZWF0ZSBhIEdsdGYyQnVmZmVyVmlld1xuICAgICAgICAgIGNvbnN0IHJuQXR0cmlidXRlQWNjZXNzb3IgPSBleHBvcnRBdHRyaWJ1dGVBY2Nlc3NvcnNbYXR0ckluZGV4XTtcblxuICAgICAgICAgIC8vIE5vcm1hbGl6ZSBub3JtYWxzIGlmIG5lZWRlZFxuICAgICAgICAgIGxldCBub3JtYWxpemVkQWNjZXNzb3IgPSBybkF0dHJpYnV0ZUFjY2Vzc29yO1xuICAgICAgICAgIGlmIChhdHRyaWJ1dGVOYW1lID09PSAnTk9STUFMJykge1xuICAgICAgICAgICAgbm9ybWFsaXplZEFjY2Vzc29yID0gbm9ybWFsaXplTm9ybWFscyhybkF0dHJpYnV0ZUFjY2Vzc29yKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGF0dHJpYnV0ZU5hbWUgPT09ICdXRUlHSFRTXzAnKSB7XG4gICAgICAgICAgICBub3JtYWxpemVkQWNjZXNzb3IgPSBub3JtYWxpemVTa2luV2VpZ2h0cyhybkF0dHJpYnV0ZUFjY2Vzc29yKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBybkJ1ZmZlclZpZXcgPSBub3JtYWxpemVkQWNjZXNzb3IuYnVmZmVyVmlldztcbiAgICAgICAgICBjb25zdCBnbHRmMkJ1ZmZlclZpZXcgPSBjcmVhdGVPclJldXNlR2x0ZjJCdWZmZXJWaWV3Rm9yVmVydGV4QXR0cmlidXRlQnVmZmVyKFxuICAgICAgICAgICAganNvbixcbiAgICAgICAgICAgIGV4aXN0aW5nVW5pcXVlUm5CdWZmZXJzLFxuICAgICAgICAgICAgZXhpc3RpbmdVbmlxdWVSbkJ1ZmZlclZpZXdzLFxuICAgICAgICAgICAgcm5CdWZmZXJWaWV3LFxuICAgICAgICAgICAgbm9ybWFsaXplZEFjY2Vzc29yXG4gICAgICAgICAgKTtcbiAgICAgICAgICBjb25zdCBnbHRmMkFjY2Vzc29yID0gY3JlYXRlT3JSZXVzZUdsdGYyQWNjZXNzb3IoXG4gICAgICAgICAgICBqc29uLFxuICAgICAgICAgICAganNvbi5idWZmZXJWaWV3cy5pbmRleE9mKGdsdGYyQnVmZmVyVmlldyksXG4gICAgICAgICAgICBleGlzdGluZ1VuaXF1ZVJuQWNjZXNzb3JzLFxuICAgICAgICAgICAgbm9ybWFsaXplZEFjY2Vzc29yXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGNvbnN0IGFjY2Vzc29ySWR4ID0ganNvbi5hY2Nlc3NvcnMuaW5kZXhPZihnbHRmMkFjY2Vzc29yKTtcbiAgICAgICAgICBwcmltaXRpdmUuYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXSA9IGFjY2Vzc29ySWR4O1xuICAgICAgICB9XG4gICAgICAgIC8vIEJsZW5kU2hhcGVcbiAgICAgICAgc2V0dXBCbGVuZFNoYXBlRGF0YShcbiAgICAgICAgICBlbnRpdHksXG4gICAgICAgICAgcm5QcmltaXRpdmUsXG4gICAgICAgICAgcHJpbWl0aXZlLFxuICAgICAgICAgIGpzb24sXG4gICAgICAgICAgZXhpc3RpbmdVbmlxdWVSbkJ1ZmZlcnMsXG4gICAgICAgICAgZXhpc3RpbmdVbmlxdWVSbkJ1ZmZlclZpZXdzLFxuICAgICAgICAgIGV4aXN0aW5nVW5pcXVlUm5BY2Nlc3NvcnNcbiAgICAgICAgKTtcbiAgICAgICAgbWVzaC5wcmltaXRpdmVzW2pdID0gcHJpbWl0aXZlO1xuICAgICAgfVxuICAgICAganNvbi5tZXNoZXMucHVzaChtZXNoKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIEJ1ZmZlclZpZXdzIGFuZCBBY2Nlc3NvcnMgZm9yIGFuaW1hdGlvbiBkYXRhLlxuICpcbiAqIFByb2Nlc3NlcyBhbmltYXRpb24gZW50aXRpZXMgdG8gZXh0cmFjdCBrZXlmcmFtZSBkYXRhLCBjcmVhdGluZyB0aGUgbmVjZXNzYXJ5XG4gKiBnbFRGMiBhbmltYXRpb24gc2FtcGxlcnMsIGNoYW5uZWxzLCBhbmQgYXNzb2NpYXRlZCBidWZmZXIgdmlld3MgYW5kIGFjY2Vzc29yc1xuICogZm9yIHByb3BlciBhbmltYXRpb24gcGxheWJhY2suXG4gKlxuICogQHBhcmFtIGpzb24gLSBUaGUgZ2xURjIgSlNPTiBkb2N1bWVudCB0byBwb3B1bGF0ZSB3aXRoIGFuaW1hdGlvbiBkYXRhXG4gKiBAcGFyYW0gZW50aXRpZXMgLSBBbmltYXRpb24gZW50aXRpZXMgdG8gcHJvY2Vzc1xuICovXG5leHBvcnQgZnVuY3Rpb24gX19jcmVhdGVCdWZmZXJWaWV3c0FuZEFjY2Vzc29yc09mQW5pbWF0aW9uKFxuICBqc29uOiBHbHRmMkV4LFxuICBlbnRpdGllczogSUFuaW1hdGlvbkVudGl0eVtdLFxuICBvcHRpb25zPzogQW5pbWF0aW9uRXhwb3J0T3B0aW9uc1xuKTogdm9pZCB7XG4gIGxldCBzdW1PZkJ1ZmZlclZpZXdCeXRlTGVuZ3RoQWNjdW11bGF0ZWQgPSAwO1xuICBjb25zdCBidWZmZXJJZHggPSBqc29uLmV4dHJhcy5idWZmZXJWaWV3Qnl0ZUxlbmd0aEFjY3VtdWxhdGVkQXJyYXkubGVuZ3RoO1xuICBjb25zdCBhbmltYXRpb25SZWdpc3RyeSA9IG5ldyBNYXA8QW5pbWF0aW9uVHJhY2tOYW1lLCB7IGFuaW1hdGlvbjogR2x0ZjJBbmltYXRpb247IHNhbXBsZXJJZHg6IG51bWJlciB9PigpO1xuXG4gIGNvbnN0IGFjcXVpcmVBbmltYXRpb24gPSAodHJhY2tOYW1lOiBBbmltYXRpb25UcmFja05hbWUpID0+IHtcbiAgICBsZXQgZW50cnkgPSBhbmltYXRpb25SZWdpc3RyeS5nZXQodHJhY2tOYW1lKTtcbiAgICBpZiAoSXMubm90LmV4aXN0KGVudHJ5KSkge1xuICAgICAgY29uc3QgYW5pbWF0aW9uOiBHbHRmMkFuaW1hdGlvbiA9IHtcbiAgICAgICAgbmFtZTogdHJhY2tOYW1lLFxuICAgICAgICBjaGFubmVsczogW10sXG4gICAgICAgIHNhbXBsZXJzOiBbXSxcbiAgICAgIH07XG4gICAgICBqc29uLmFuaW1hdGlvbnMucHVzaChhbmltYXRpb24pO1xuICAgICAgZW50cnkgPSB7IGFuaW1hdGlvbiwgc2FtcGxlcklkeDogMCB9O1xuICAgICAgYW5pbWF0aW9uUmVnaXN0cnkuc2V0KHRyYWNrTmFtZSwgZW50cnkpO1xuICAgIH1cbiAgICByZXR1cm4gZW50cnk7XG4gIH07XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbnRpdGllcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGVudGl0eSA9IGVudGl0aWVzW2ldO1xuICAgIGNvbnN0IGFuaW1hdGlvbkNvbXBvbmVudCA9IGVudGl0eS50cnlUb0dldEFuaW1hdGlvbigpO1xuICAgIGlmIChJcy5leGlzdChhbmltYXRpb25Db21wb25lbnQpKSB7XG4gICAgICBjb25zdCBybkFuaW1hdGlvblRyYWNrID0gYW5pbWF0aW9uQ29tcG9uZW50LmdldEFuaW1hdGlvbkNoYW5uZWxzT2ZUcmFjaygpO1xuICAgICAgY29uc3Qgcm5DaGFubmVscyA9IHJuQW5pbWF0aW9uVHJhY2sudmFsdWVzKCk7XG4gICAgICBmb3IgKGNvbnN0IHJuQ2hhbm5lbCBvZiBybkNoYW5uZWxzKSB7XG4gICAgICAgIGlmIChybkNoYW5uZWwudGFyZ2V0LnBhdGhOYW1lID09PSAnZWZmZWtzZWVyJykge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYW5pbWF0ZWRWYWx1ZSA9IHJuQ2hhbm5lbC5hbmltYXRlZFZhbHVlO1xuICAgICAgICBjb25zdCB0cmFja05hbWVzID0gYW5pbWF0ZWRWYWx1ZS5nZXRBbGxUcmFja05hbWVzKCk7XG4gICAgICAgIGZvciAoY29uc3QgdHJhY2tOYW1lIG9mIHRyYWNrTmFtZXMpIHtcbiAgICAgICAgICBjb25zdCB0YXJnZXRPdmVycmlkZSA9IG9wdGlvbnM/LnJlc29sdmVBbmltYXRpb25UYXJnZXQ/Lih7XG4gICAgICAgICAgICBjaGFubmVsOiBybkNoYW5uZWwsXG4gICAgICAgICAgICBlbnRpdHlJZHg6IGksXG4gICAgICAgICAgICB0cmFja05hbWUsXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBpZiAodGFyZ2V0T3ZlcnJpZGUgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IGFuaW1hdGlvbkVudHJ5ID0gYWNxdWlyZUFuaW1hdGlvbih0cmFja05hbWUpO1xuICAgICAgICAgIGNvbnN0IGFuaW1hdGlvbiA9IGFuaW1hdGlvbkVudHJ5LmFuaW1hdGlvbjtcblxuICAgICAgICAgIC8vIGNyZWF0ZSBhbmQgcmVnaXN0ZXIgR2x0ZjJCdWZmZXJWaWV3IGFuZCBHbHRmMkFjY2Vzc29yXG4gICAgICAgICAgLy8gICBhbmQgc2V0IElucHV0IGFuaW1hdGlvbiBkYXRhIGFzIFVpbnQ4QXJyYXkgdG8gdGhlIEdsdGYyQWNjZXNzb3JcbiAgICAgICAgICBjb25zdCB7IGlucHV0QWNjZXNzb3JJZHgsIGlucHV0QnVmZmVyVmlld0J5dGVMZW5ndGhBY2N1bXVsYXRlZCB9ID1cbiAgICAgICAgICAgIGNyZWF0ZUdsdGYyQnVmZmVyVmlld0FuZEdsdGYyQWNjZXNzb3JGb3JJbnB1dChcbiAgICAgICAgICAgICAganNvbixcbiAgICAgICAgICAgICAgYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSksXG4gICAgICAgICAgICAgIGJ1ZmZlcklkeCxcbiAgICAgICAgICAgICAgc3VtT2ZCdWZmZXJWaWV3Qnl0ZUxlbmd0aEFjY3VtdWxhdGVkXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgc3VtT2ZCdWZmZXJWaWV3Qnl0ZUxlbmd0aEFjY3VtdWxhdGVkICs9IGlucHV0QnVmZmVyVmlld0J5dGVMZW5ndGhBY2N1bXVsYXRlZDtcblxuICAgICAgICAgIC8vIGNyZWF0ZSBhbmQgcmVnaXN0ZXIgR2x0ZjJCdWZmZXJWaWV3IGFuZCBHbHRmMkFjY2Vzc29yXG4gICAgICAgICAgLy8gICBhbmQgc2V0IE91dHB1dCBhbmltYXRpb24gZGF0YSBhcyBVaW50OEFycmF5IHRvIHRoZSBHbHRmMkFjY2Vzc29yXG4gICAgICAgICAgY29uc3QgeyBvdXRwdXRBY2Nlc3NvcklkeCwgb3V0cHV0QnVmZmVyVmlld0J5dGVMZW5ndGhBY2N1bXVsYXRlZCB9ID1cbiAgICAgICAgICAgIGNyZWF0ZUdsdGYyQnVmZmVyVmlld0FuZEdsdGYyQWNjZXNzb3JGb3JPdXRwdXQoXG4gICAgICAgICAgICAgIGpzb24sXG4gICAgICAgICAgICAgIGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLFxuICAgICAgICAgICAgICBybkNoYW5uZWwudGFyZ2V0LnBhdGhOYW1lLFxuICAgICAgICAgICAgICBidWZmZXJJZHgsXG4gICAgICAgICAgICAgIHN1bU9mQnVmZmVyVmlld0J5dGVMZW5ndGhBY2N1bXVsYXRlZFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICBzdW1PZkJ1ZmZlclZpZXdCeXRlTGVuZ3RoQWNjdW11bGF0ZWQgKz0gb3V0cHV0QnVmZmVyVmlld0J5dGVMZW5ndGhBY2N1bXVsYXRlZDtcblxuICAgICAgICAgIC8vIENyZWF0ZSBHbHRmMkFuaW1hdGlvbkNoYW5uZWxcbiAgICAgICAgICBhbmltYXRpb25FbnRyeS5zYW1wbGVySWR4ID0gY3JlYXRlR2x0ZjJBbmltYXRpb25DaGFubmVsKFxuICAgICAgICAgICAgcm5DaGFubmVsLFxuICAgICAgICAgICAgYW5pbWF0aW9uRW50cnkuc2FtcGxlcklkeCxcbiAgICAgICAgICAgIGFuaW1hdGlvbixcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICB0YXJnZXRPdmVycmlkZSA/PyB1bmRlZmluZWRcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgLy8gQ3JlYXRlIEdsdGYyQW5pbWF0aW9uU2FtcGxlclxuICAgICAgICAgIGNyZWF0ZUdsdGYyQW5pbWF0aW9uU2FtcGxlcihcbiAgICAgICAgICAgIGlucHV0QWNjZXNzb3JJZHgsXG4gICAgICAgICAgICBvdXRwdXRBY2Nlc3NvcklkeCxcbiAgICAgICAgICAgIGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLFxuICAgICAgICAgICAgYW5pbWF0aW9uXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBqc29uLmV4dHJhcy5idWZmZXJWaWV3Qnl0ZUxlbmd0aEFjY3VtdWxhdGVkQXJyYXkucHVzaChzdW1PZkJ1ZmZlclZpZXdCeXRlTGVuZ3RoQWNjdW11bGF0ZWQpO1xufVxuXG4vKipcbiAqIFJlbW92ZXMgZW1wdHkgYXJyYXlzIGZyb20gdGhlIGdsVEYyIEpTT04gdG8gb3B0aW1pemUgb3V0cHV0IHNpemUuXG4gKlxuICogQWNjb3JkaW5nIHRvIGdsVEYyIHNwZWNpZmljYXRpb24sIGVtcHR5IGFycmF5cyBzaG91bGQgYmUgb21pdHRlZCByYXRoZXIgdGhhblxuICogaW5jbHVkZWQgYXMgZW1wdHkgYXJyYXlzIHRvIHJlZHVjZSBmaWxlIHNpemUgYW5kIGltcHJvdmUgcGFyc2luZyBwZXJmb3JtYW5jZS5cbiAqXG4gKiBAcGFyYW0ganNvbiAtIFRoZSBnbFRGMiBKU09OIG9iamVjdCB0byBjbGVhbiB1cFxuICovXG5leHBvcnQgZnVuY3Rpb24gX19kZWxldGVFbXB0eUFycmF5cyhqc29uOiBHbHRmMkV4KTogdm9pZCB7XG4gIGlmIChqc29uLmFjY2Vzc29ycy5sZW5ndGggPT09IDApIHtcbiAgICAoanNvbiBhcyBHbHRmMikuYWNjZXNzb3JzID0gdW5kZWZpbmVkO1xuICB9XG4gIGlmIChqc29uLmJ1ZmZlclZpZXdzLmxlbmd0aCA9PT0gMCkge1xuICAgIChqc29uIGFzIEdsdGYyKS5idWZmZXJWaWV3cyA9IHVuZGVmaW5lZDtcbiAgfVxuICBpZiAoanNvbi5tYXRlcmlhbHMubGVuZ3RoID09PSAwKSB7XG4gICAgKGpzb24gYXMgR2x0ZjIpLm1hdGVyaWFscyA9IHVuZGVmaW5lZDtcbiAgfVxuICBpZiAoanNvbi5tZXNoZXMubGVuZ3RoID09PSAwKSB7XG4gICAgKGpzb24gYXMgR2x0ZjIpLm1lc2hlcyA9IHVuZGVmaW5lZDtcbiAgfVxuICBpZiAoanNvbi5za2lucy5sZW5ndGggPT09IDApIHtcbiAgICAoanNvbiBhcyBHbHRmMikuc2tpbnMgPSB1bmRlZmluZWQ7XG4gIH1cbiAgaWYgKGpzb24udGV4dHVyZXMubGVuZ3RoID09PSAwKSB7XG4gICAgKGpzb24gYXMgR2x0ZjIpLnRleHR1cmVzID0gdW5kZWZpbmVkO1xuICB9XG4gIGlmIChqc29uLmltYWdlcy5sZW5ndGggPT09IDApIHtcbiAgICAoanNvbiBhcyBHbHRmMikuaW1hZ2VzID0gdW5kZWZpbmVkO1xuICB9XG4gIGlmIChqc29uLnNhbXBsZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgIChqc29uIGFzIEdsdGYyKS5zYW1wbGVycyA9IHVuZGVmaW5lZDtcbiAgfVxuICBpZiAoanNvbi5hbmltYXRpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgIChqc29uIGFzIEdsdGYyKS5hbmltYXRpb25zID0gdW5kZWZpbmVkO1xuICB9XG4gIGlmIChJcy5leGlzdChqc29uLmV4dGVuc2lvbnNVc2VkKSAmJiBqc29uLmV4dGVuc2lvbnNVc2VkLmxlbmd0aCA9PT0gMCkge1xuICAgIChqc29uIGFzIEdsdGYyKS5leHRlbnNpb25zVXNlZCA9IHVuZGVmaW5lZDtcbiAgfVxuICBpZiAoanNvbi5jYW1lcmFzLmxlbmd0aCA9PT0gMCkge1xuICAgIChqc29uIGFzIEdsdGYyKS5jYW1lcmFzID0gdW5kZWZpbmVkO1xuICB9XG4gIChqc29uIGFzIEdsdGYyKS5leHRyYXMgPSB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogRXh0cmFjdHMgYSBzY2FsYXIgcGFyYW1ldGVyIHZhbHVlIGZyb20gdmFyaW91cyBpbnB1dCB0eXBlcy5cbiAqXG4gKiBIYW5kbGVzIGV4dHJhY3Rpb24gb2YgbnVtZXJpYyB2YWx1ZXMgZnJvbSBkaWZmZXJlbnQgcGFyYW1ldGVyIGZvcm1hdHMsXG4gKiBpbmNsdWRpbmcgZGlyZWN0IG51bWJlcnMsIG9iamVjdHMgd2l0aCB4IHByb3BlcnR5LCBhcnJheXMsIHR5cGVkIGFycmF5cyxcbiAqIGFuZCBuZXN0ZWQgaW50ZXJuYWwgc3RydWN0dXJlcy5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgLSBUaGUgdmFsdWUgdG8gZXh0cmFjdCBhIHNjYWxhciBmcm9tXG4gKiBAcmV0dXJucyBUaGUgZXh0cmFjdGVkIHNjYWxhciB2YWx1ZSBvciB1bmRlZmluZWQgaWYgbm90IGZvdW5kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBfX2V4dHJhY3RTY2FsYXJQYXJhbWV0ZXIodmFsdWU6IHVua25vd24pOiBudW1iZXIgfCB1bmRlZmluZWQge1xuICAvLyBFYXJseSByZXR1cm4gZm9yIG51bGwvdW5kZWZpbmVkIHZhbHVlc1xuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIGNvbnN0IGNhbmRpZGF0ZVdpdGhYID0gKHZhbHVlIGFzIHsgeD86IG51bWJlciB9KT8ueDtcbiAgaWYgKHR5cGVvZiBjYW5kaWRhdGVXaXRoWCA9PT0gJ251bWJlcicpIHtcbiAgICByZXR1cm4gY2FuZGlkYXRlV2l0aFg7XG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID4gMCAmJiB0eXBlb2YgdmFsdWVbMF0gPT09ICdudW1iZXInKSB7XG4gICAgcmV0dXJuIHZhbHVlWzBdO1xuICB9XG5cbiAgaWYgKEFycmF5QnVmZmVyLmlzVmlldyh2YWx1ZSkpIHtcbiAgICBjb25zdCB2aWV3ID0gdmFsdWUgYXMgQXJyYXlCdWZmZXJWaWV3O1xuICAgIGlmIChpc051bWVyaWNBcnJheUJ1ZmZlclZpZXcodmlldykgJiYgdmlldy5sZW5ndGggPiAwKSB7XG4gICAgICByZXR1cm4gdmlld1swXTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBpbnRlcm5hbCA9ICh2YWx1ZSBhcyB7IF92PzogdW5rbm93biB9KS5fdjtcbiAgaWYgKEFycmF5LmlzQXJyYXkoaW50ZXJuYWwpICYmIGludGVybmFsLmxlbmd0aCA+IDAgJiYgdHlwZW9mIGludGVybmFsWzBdID09PSAnbnVtYmVyJykge1xuICAgIHJldHVybiBpbnRlcm5hbFswXTtcbiAgfVxuICBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KGludGVybmFsKSkge1xuICAgIGNvbnN0IHZpZXcgPSBpbnRlcm5hbCBhcyBBcnJheUJ1ZmZlclZpZXc7XG4gICAgaWYgKGlzTnVtZXJpY0FycmF5QnVmZmVyVmlldyh2aWV3KSAmJiB2aWV3Lmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybiB2aWV3WzBdO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGEgZ2xURjIgbWF0ZXJpYWwgcmVxdWlyZXMgdGFuZ2VudCB2ZWN0b3JzLlxuICpcbiAqIERldGVybWluZXMgaWYgdGhlIG1hdGVyaWFsIHVzZXMgbm9ybWFsIG1hcHBpbmcsIGNsZWFyY29hdCBub3JtYWwgbWFwcGluZyxcbiAqIG9yIGFuaXNvdHJvcHkgZmVhdHVyZXMgdGhhdCByZXF1aXJlIHRhbmdlbnQgdmVjdG9ycyBmb3IgcHJvcGVyIHJlbmRlcmluZy5cbiAqXG4gKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgZ2xURjIgbWF0ZXJpYWwgdG8gY2hlY2tcbiAqIEByZXR1cm5zIFRydWUgaWYgdGhlIG1hdGVyaWFsIHJlcXVpcmVzIHRhbmdlbnRzLCBmYWxzZSBvdGhlcndpc2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIF9fZG9lc01hdGVyaWFsUmVxdWlyZVRhbmdlbnRzKG1hdGVyaWFsOiBHbHRmMk1hdGVyaWFsRXgpOiBib29sZWFuIHtcbiAgaWYgKElzLmV4aXN0KG1hdGVyaWFsLm5vcm1hbFRleHR1cmUpKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgY29uc3QgZXh0ZW5zaW9ucyA9IG1hdGVyaWFsLmV4dGVuc2lvbnMgYXMgUmVjb3JkPHN0cmluZywgYW55PiB8IHVuZGVmaW5lZDtcbiAgY29uc3QgY2xlYXJjb2F0RXh0ZW5zaW9uID0gZXh0ZW5zaW9ucz8uS0hSX21hdGVyaWFsc19jbGVhcmNvYXQgYXMgeyBjbGVhcmNvYXROb3JtYWxUZXh0dXJlPzogdW5rbm93biB9IHwgdW5kZWZpbmVkO1xuICBpZiAoSXMuZXhpc3QoY2xlYXJjb2F0RXh0ZW5zaW9uPy5jbGVhcmNvYXROb3JtYWxUZXh0dXJlKSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGNvbnN0IGFuaXNvdHJvcHlFeHRlbnNpb24gPSBleHRlbnNpb25zPy5LSFJfbWF0ZXJpYWxzX2FuaXNvdHJvcHkgYXMge1xuICAgIGFuaXNvdHJvcHlUZXh0dXJlPzogdW5rbm93bjtcbiAgICBhbmlzb3Ryb3B5U3RyZW5ndGg/OiBudW1iZXI7XG4gIH07XG4gIGlmIChJcy5leGlzdChhbmlzb3Ryb3B5RXh0ZW5zaW9uKSkge1xuICAgIGlmIChJcy5leGlzdChhbmlzb3Ryb3B5RXh0ZW5zaW9uLmFuaXNvdHJvcHlUZXh0dXJlKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmIChJcy5leGlzdChhbmlzb3Ryb3B5RXh0ZW5zaW9uLmFuaXNvdHJvcHlTdHJlbmd0aCkgJiYgYW5pc290cm9weUV4dGVuc2lvbi5hbmlzb3Ryb3B5U3RyZW5ndGggIT09IDApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogQ29sbGVjdHMgdXNlZCB0ZXh0dXJlIGNvb3JkaW5hdGUgc2V0IGluZGljZXMgZnJvbSBhIGdsVEYyIG1hdGVyaWFsLlxuICpcbiAqIFNjYW5zIHRoZSBtYXRlcmlhbCBhbmQgaXRzIGV4dGVuc2lvbnMgdG8gaWRlbnRpZnkgd2hpY2ggdGV4dHVyZSBjb29yZGluYXRlXG4gKiBzZXRzIChURVhDT09SRF8wLCBURVhDT09SRF8xLCBldGMuKSBhcmUgYWN0dWFsbHkgdXNlZCBieSB0ZXh0dXJlcy5cbiAqXG4gKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgZ2xURjIgbWF0ZXJpYWwgdG8gYW5hbHl6ZVxuICogQHJldHVybnMgU2V0IG9mIHVzZWQgdGV4dHVyZSBjb29yZGluYXRlIHNldCBpbmRpY2VzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBfX2NvbGxlY3RVc2VkVGV4Q29vcmRTZXRJbmRpY2VzKG1hdGVyaWFsOiBHbHRmMk1hdGVyaWFsRXgpOiBTZXQ8bnVtYmVyPiB7XG4gIGNvbnN0IHVzZWRUZXhDb29yZHMgPSBuZXcgU2V0PG51bWJlcj4oKTtcbiAgY29uc3QgcmVnaXN0ZXJUZXhjb29yZCA9IChpbmZvOiB7IHRleENvb3JkPzogbnVtYmVyOyBpbmRleD86IG51bWJlciB9IHwgdW5kZWZpbmVkKSA9PiB7XG4gICAgaWYgKElzLm5vdC5leGlzdChpbmZvKSB8fCB0eXBlb2YgaW5mby5pbmRleCAhPT0gJ251bWJlcicpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgdGV4Q29vcmQgPSB0eXBlb2YgaW5mby50ZXhDb29yZCA9PT0gJ251bWJlcicgPyBpbmZvLnRleENvb3JkIDogMDtcbiAgICB1c2VkVGV4Q29vcmRzLmFkZCh0ZXhDb29yZCk7XG4gIH07XG5cbiAgY29uc3QgcGJyID0gbWF0ZXJpYWwucGJyTWV0YWxsaWNSb3VnaG5lc3M7XG4gIGlmIChJcy5leGlzdChwYnIpKSB7XG4gICAgcmVnaXN0ZXJUZXhjb29yZChwYnIuYmFzZUNvbG9yVGV4dHVyZSk7XG4gICAgcmVnaXN0ZXJUZXhjb29yZChwYnIubWV0YWxsaWNSb3VnaG5lc3NUZXh0dXJlKTtcbiAgfVxuXG4gIHJlZ2lzdGVyVGV4Y29vcmQobWF0ZXJpYWwubm9ybWFsVGV4dHVyZSk7XG4gIHJlZ2lzdGVyVGV4Y29vcmQobWF0ZXJpYWwub2NjbHVzaW9uVGV4dHVyZSk7XG4gIHJlZ2lzdGVyVGV4Y29vcmQobWF0ZXJpYWwuZW1pc3NpdmVUZXh0dXJlKTtcblxuICBjb25zdCBleHRlbnNpb25zID0gbWF0ZXJpYWwuZXh0ZW5zaW9ucyBhcyBSZWNvcmQ8c3RyaW5nLCBhbnk+IHwgdW5kZWZpbmVkO1xuICBjb25zdCBjbGVhcmNvYXRFeHRlbnNpb24gPSBleHRlbnNpb25zPy5LSFJfbWF0ZXJpYWxzX2NsZWFyY29hdCBhcyB7XG4gICAgY2xlYXJjb2F0VGV4dHVyZT86IHsgdGV4Q29vcmQ/OiBudW1iZXI7IGluZGV4PzogbnVtYmVyIH07XG4gICAgY2xlYXJjb2F0Um91Z2huZXNzVGV4dHVyZT86IHsgdGV4Q29vcmQ/OiBudW1iZXI7IGluZGV4PzogbnVtYmVyIH07XG4gICAgY2xlYXJjb2F0Tm9ybWFsVGV4dHVyZT86IHsgdGV4Q29vcmQ/OiBudW1iZXI7IGluZGV4PzogbnVtYmVyIH07XG4gIH07XG4gIGlmIChJcy5leGlzdChjbGVhcmNvYXRFeHRlbnNpb24pKSB7XG4gICAgcmVnaXN0ZXJUZXhjb29yZChjbGVhcmNvYXRFeHRlbnNpb24uY2xlYXJjb2F0VGV4dHVyZSk7XG4gICAgcmVnaXN0ZXJUZXhjb29yZChjbGVhcmNvYXRFeHRlbnNpb24uY2xlYXJjb2F0Um91Z2huZXNzVGV4dHVyZSk7XG4gICAgcmVnaXN0ZXJUZXhjb29yZChjbGVhcmNvYXRFeHRlbnNpb24uY2xlYXJjb2F0Tm9ybWFsVGV4dHVyZSk7XG4gIH1cblxuICBjb25zdCBkaWZmdXNlVHJhbnNtaXNzaW9uRXh0ZW5zaW9uID0gZXh0ZW5zaW9ucz8uS0hSX21hdGVyaWFsc19kaWZmdXNlX3RyYW5zbWlzc2lvbiBhcyB7XG4gICAgZGlmZnVzZVRyYW5zbWlzc2lvblRleHR1cmU/OiB7IHRleENvb3JkPzogbnVtYmVyOyBpbmRleD86IG51bWJlciB9O1xuICAgIGRpZmZ1c2VUcmFuc21pc3Npb25Db2xvclRleHR1cmU/OiB7IHRleENvb3JkPzogbnVtYmVyOyBpbmRleD86IG51bWJlciB9O1xuICB9O1xuICBpZiAoSXMuZXhpc3QoZGlmZnVzZVRyYW5zbWlzc2lvbkV4dGVuc2lvbikpIHtcbiAgICByZWdpc3RlclRleGNvb3JkKGRpZmZ1c2VUcmFuc21pc3Npb25FeHRlbnNpb24uZGlmZnVzZVRyYW5zbWlzc2lvblRleHR1cmUpO1xuICAgIHJlZ2lzdGVyVGV4Y29vcmQoZGlmZnVzZVRyYW5zbWlzc2lvbkV4dGVuc2lvbi5kaWZmdXNlVHJhbnNtaXNzaW9uQ29sb3JUZXh0dXJlKTtcbiAgfVxuXG4gIGNvbnN0IHNwZWN1bGFyRXh0ZW5zaW9uID0gZXh0ZW5zaW9ucz8uS0hSX21hdGVyaWFsc19zcGVjdWxhciBhcyB7XG4gICAgc3BlY3VsYXJUZXh0dXJlPzogeyB0ZXhDb29yZD86IG51bWJlcjsgaW5kZXg/OiBudW1iZXIgfTtcbiAgICBzcGVjdWxhckNvbG9yVGV4dHVyZT86IHsgdGV4Q29vcmQ/OiBudW1iZXI7IGluZGV4PzogbnVtYmVyIH07XG4gIH07XG4gIGlmIChJcy5leGlzdChzcGVjdWxhckV4dGVuc2lvbikpIHtcbiAgICByZWdpc3RlclRleGNvb3JkKHNwZWN1bGFyRXh0ZW5zaW9uLnNwZWN1bGFyVGV4dHVyZSk7XG4gICAgcmVnaXN0ZXJUZXhjb29yZChzcGVjdWxhckV4dGVuc2lvbi5zcGVjdWxhckNvbG9yVGV4dHVyZSk7XG4gIH1cblxuICBjb25zdCB0cmFuc21pc3Npb25FeHRlbnNpb24gPSBleHRlbnNpb25zPy5LSFJfbWF0ZXJpYWxzX3RyYW5zbWlzc2lvbiBhcyB7XG4gICAgdHJhbnNtaXNzaW9uVGV4dHVyZT86IHsgdGV4Q29vcmQ/OiBudW1iZXI7IGluZGV4PzogbnVtYmVyIH07XG4gIH07XG4gIGlmIChJcy5leGlzdCh0cmFuc21pc3Npb25FeHRlbnNpb24pKSB7XG4gICAgcmVnaXN0ZXJUZXhjb29yZCh0cmFuc21pc3Npb25FeHRlbnNpb24udHJhbnNtaXNzaW9uVGV4dHVyZSk7XG4gIH1cblxuICBjb25zdCB2b2x1bWVFeHRlbnNpb24gPSBleHRlbnNpb25zPy5LSFJfbWF0ZXJpYWxzX3ZvbHVtZSBhcyB7XG4gICAgdGhpY2tuZXNzVGV4dHVyZT86IHsgdGV4Q29vcmQ/OiBudW1iZXI7IGluZGV4PzogbnVtYmVyIH07XG4gIH07XG4gIGlmIChJcy5leGlzdCh2b2x1bWVFeHRlbnNpb24pKSB7XG4gICAgcmVnaXN0ZXJUZXhjb29yZCh2b2x1bWVFeHRlbnNpb24udGhpY2tuZXNzVGV4dHVyZSk7XG4gIH1cblxuICBjb25zdCBzaGVlbkV4dGVuc2lvbiA9IGV4dGVuc2lvbnM/LktIUl9tYXRlcmlhbHNfc2hlZW4gYXMge1xuICAgIHNoZWVuQ29sb3JUZXh0dXJlPzogeyB0ZXhDb29yZD86IG51bWJlcjsgaW5kZXg/OiBudW1iZXIgfTtcbiAgICBzaGVlblJvdWdobmVzc1RleHR1cmU/OiB7IHRleENvb3JkPzogbnVtYmVyOyBpbmRleD86IG51bWJlciB9O1xuICB9O1xuICBpZiAoSXMuZXhpc3Qoc2hlZW5FeHRlbnNpb24pKSB7XG4gICAgcmVnaXN0ZXJUZXhjb29yZChzaGVlbkV4dGVuc2lvbi5zaGVlbkNvbG9yVGV4dHVyZSk7XG4gICAgcmVnaXN0ZXJUZXhjb29yZChzaGVlbkV4dGVuc2lvbi5zaGVlblJvdWdobmVzc1RleHR1cmUpO1xuICB9XG5cbiAgY29uc3QgaXJpZGVzY2VuY2VFeHRlbnNpb24gPSBleHRlbnNpb25zPy5LSFJfbWF0ZXJpYWxzX2lyaWRlc2NlbmNlIGFzIHtcbiAgICBpcmlkZXNjZW5jZVRleHR1cmU/OiB7IHRleENvb3JkPzogbnVtYmVyOyBpbmRleD86IG51bWJlciB9O1xuICAgIGlyaWRlc2NlbmNlVGhpY2tuZXNzVGV4dHVyZT86IHsgdGV4Q29vcmQ/OiBudW1iZXI7IGluZGV4PzogbnVtYmVyIH07XG4gIH07XG4gIGlmIChJcy5leGlzdChpcmlkZXNjZW5jZUV4dGVuc2lvbikpIHtcbiAgICByZWdpc3RlclRleGNvb3JkKGlyaWRlc2NlbmNlRXh0ZW5zaW9uLmlyaWRlc2NlbmNlVGV4dHVyZSk7XG4gICAgcmVnaXN0ZXJUZXhjb29yZChpcmlkZXNjZW5jZUV4dGVuc2lvbi5pcmlkZXNjZW5jZVRoaWNrbmVzc1RleHR1cmUpO1xuICB9XG5cbiAgY29uc3QgYW5pc290cm9weUV4dGVuc2lvbiA9IGV4dGVuc2lvbnM/LktIUl9tYXRlcmlhbHNfYW5pc290cm9weSBhcyB7XG4gICAgYW5pc290cm9weVRleHR1cmU/OiB7IHRleENvb3JkPzogbnVtYmVyOyBpbmRleD86IG51bWJlciB9O1xuICB9O1xuICBpZiAoSXMuZXhpc3QoYW5pc290cm9weUV4dGVuc2lvbikpIHtcbiAgICByZWdpc3RlclRleGNvb3JkKGFuaXNvdHJvcHlFeHRlbnNpb24uYW5pc290cm9weVRleHR1cmUpO1xuICB9XG5cbiAgcmV0dXJuIHVzZWRUZXhDb29yZHM7XG59XG5cbi8qKlxuICogUHJ1bmVzIHVudXNlZCB2ZXJ0ZXggYXR0cmlidXRlcyBmcm9tIGEgcHJpbWl0aXZlIGJhc2VkIG9uIG1hdGVyaWFsIHJlcXVpcmVtZW50cy5cbiAqXG4gKiBSZW1vdmVzIHZlcnRleCBhdHRyaWJ1dGVzIHRoYXQgYXJlIG5vdCBuZWVkZWQgYnkgdGhlIG1hdGVyaWFsLCBzdWNoIGFzXG4gKiBUQU5HRU5UIGlmIG5vdCByZXF1aXJlZCwgYW5kIHVudXNlZCBURVhDT09SRCBzZXRzIHRvIG9wdGltaXplIHRoZSBvdXRwdXQuXG4gKlxuICogQHBhcmFtIHByaW1pdGl2ZSAtIFRoZSBnbFRGMiBwcmltaXRpdmUgdG8gcHJ1bmUgYXR0cmlidXRlcyBmcm9tXG4gKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgZ2xURjIgbWF0ZXJpYWwgdG8gY2hlY2sgcmVxdWlyZW1lbnRzIGFnYWluc3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIF9fcHJ1bmVVbnVzZWRWZXJ0ZXhBdHRyaWJ1dGVzKHByaW1pdGl2ZTogR2x0ZjJQcmltaXRpdmUsIG1hdGVyaWFsOiBHbHRmMk1hdGVyaWFsRXgpOiB2b2lkIHtcbiAgLy8gU2tpcCBwcnVuaW5nIGZvciBub2RlLWJhc2VkIG1hdGVyaWFscyBhcyB0aGV5IG1heSByZXF1aXJlIGFueSB2ZXJ0ZXggYXR0cmlidXRlc1xuICBpZiAobWF0ZXJpYWwuZXh0ZW5zaW9ucz8uUkhPRE9OSVRFX21hdGVyaWFsc19ub2RlICE9IG51bGwpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBhdHRyaWJ1dGVzID0gcHJpbWl0aXZlLmF0dHJpYnV0ZXMgYXMgUmVjb3JkPHN0cmluZywgbnVtYmVyIHwgdW5kZWZpbmVkPjtcblxuICBpZiAoIV9fZG9lc01hdGVyaWFsUmVxdWlyZVRhbmdlbnRzKG1hdGVyaWFsKSAmJiBJcy5leGlzdChhdHRyaWJ1dGVzLlRBTkdFTlQpKSB7XG4gICAgYXR0cmlidXRlcy5UQU5HRU5UID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgY29uc3QgdXNlZFRleENvb3JkcyA9IF9fY29sbGVjdFVzZWRUZXhDb29yZFNldEluZGljZXMobWF0ZXJpYWwpO1xuICBpZiAodXNlZFRleENvb3Jkcy5zaXplID09PSAwKSB7XG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGVOYW1lIG9mIE9iamVjdC5rZXlzKGF0dHJpYnV0ZXMpKSB7XG4gICAgICBpZiAoYXR0cmlidXRlTmFtZS5zdGFydHNXaXRoKCdURVhDT09SRF8nKSkge1xuICAgICAgICBkZWxldGUgYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgZm9yIChjb25zdCBhdHRyaWJ1dGVOYW1lIG9mIE9iamVjdC5rZXlzKGF0dHJpYnV0ZXMpKSB7XG4gICAgaWYgKCFhdHRyaWJ1dGVOYW1lLnN0YXJ0c1dpdGgoJ1RFWENPT1JEXycpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3QgdGV4Q29vcmRJbmRleCA9IE51bWJlcihhdHRyaWJ1dGVOYW1lLnN1YnN0cmluZygnVEVYQ09PUkRfJy5sZW5ndGgpKTtcbiAgICBpZiAoTnVtYmVyLmlzTmFOKHRleENvb3JkSW5kZXgpIHx8ICF1c2VkVGV4Q29vcmRzLmhhcyh0ZXhDb29yZEluZGV4KSkge1xuICAgICAgZGVsZXRlIGF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV07XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX291dHB1dEtock1hdGVyaWFsc0VtaXNzaXZlU3RyZW5ndGhJbmZvKFxuICBlbnN1cmVFeHRlbnNpb25Vc2VkOiAoZXh0ZW5zaW9uTmFtZTogc3RyaW5nKSA9PiB2b2lkLFxuICBjb2VyY2VOdW1iZXI6ICh2YWx1ZTogYW55KSA9PiBudW1iZXIgfCB1bmRlZmluZWQsXG4gIHJuTWF0ZXJpYWw6IE1hdGVyaWFsLFxuICBtYXRlcmlhbDogR2x0ZjJNYXRlcmlhbEV4XG4pIHtcbiAgaWYgKElzLmZhbHNlKHJuTWF0ZXJpYWwuaXNMaWdodGluZykpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAoKG1hdGVyaWFsLmV4dGVuc2lvbnMgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQpPy5LSFJfbWF0ZXJpYWxzX3VubGl0KSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgcmF3U3RyZW5ndGggPSBjb2VyY2VOdW1iZXIocm5NYXRlcmlhbC5nZXRQYXJhbWV0ZXIoJ2VtaXNzaXZlU3RyZW5ndGgnKSk7XG4gIGlmIChJcy5ub3QuZXhpc3QocmF3U3RyZW5ndGgpKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgZW1pc3NpdmVTdHJlbmd0aCA9IE1hdGgubWF4KDAsIHJhd1N0cmVuZ3RoKTtcbiAgaWYgKCFOdW1iZXIuaXNGaW5pdGUoZW1pc3NpdmVTdHJlbmd0aCkgfHwgZW1pc3NpdmVTdHJlbmd0aCA9PT0gMSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIG1hdGVyaWFsLmV4dGVuc2lvbnMgPSBtYXRlcmlhbC5leHRlbnNpb25zID8/IHt9O1xuICBtYXRlcmlhbC5leHRlbnNpb25zLktIUl9tYXRlcmlhbHNfZW1pc3NpdmVfc3RyZW5ndGggPSB7XG4gICAgZW1pc3NpdmVTdHJlbmd0aCxcbiAgfTtcbiAgZW5zdXJlRXh0ZW5zaW9uVXNlZCgnS0hSX21hdGVyaWFsc19lbWlzc2l2ZV9zdHJlbmd0aCcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gX19vdXRwdXRLaHJNYXRlcmlhbHNEaWZmdXNlVHJhbnNtaXNzaW9uSW5mbyhcbiAgZW5zdXJlRXh0ZW5zaW9uVXNlZDogKGV4dGVuc2lvbk5hbWU6IHN0cmluZykgPT4gdm9pZCxcbiAgY29lcmNlTnVtYmVyOiAodmFsdWU6IGFueSkgPT4gbnVtYmVyIHwgdW5kZWZpbmVkLFxuICBjb2VyY2VWZWMzOiAodmFsdWU6IGFueSkgPT4gW251bWJlciwgbnVtYmVyLCBudW1iZXJdIHwgdW5kZWZpbmVkLFxuICBybk1hdGVyaWFsOiBNYXRlcmlhbCxcbiAgYXBwbHlUZXh0dXJlOiAoXG4gICAgcGFyYW1OYW1lOiBzdHJpbmcsXG4gICAgb3B0aW9uczoge1xuICAgICAgdGV4Q29vcmRQYXJhbT86IHN0cmluZztcbiAgICAgIHRyYW5zZm9ybT86IHtcbiAgICAgICAgc2NhbGU/OiBzdHJpbmc7XG4gICAgICAgIG9mZnNldD86IHN0cmluZztcbiAgICAgICAgcm90YXRpb24/OiBzdHJpbmc7XG4gICAgICB9O1xuICAgICAgc2NhbGVQYXJhbT86IHN0cmluZztcbiAgICAgIHN0cmVuZ3RoUGFyYW0/OiBzdHJpbmc7XG4gICAgICBvbkFzc2lnbjogKGluZm86IGFueSkgPT4gdm9pZDtcbiAgICB9XG4gICkgPT4gdm9pZCxcbiAgbWF0ZXJpYWw6IEdsdGYyTWF0ZXJpYWxFeFxuKSB7XG4gIGNvbnN0IGRpZmZ1c2VUcmFuc21pc3Npb25FeHRlbnNpb246IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge307XG4gIGxldCBkaWZmdXNlVHJhbnNtaXNzaW9uRXh0ZW5zaW9uVXNlZCA9IGZhbHNlO1xuICBjb25zdCBtYXJrRGlmZnVzZVRyYW5zbWlzc2lvbkV4dGVuc2lvblVzZWQgPSAoKSA9PiB7XG4gICAgaWYgKCFkaWZmdXNlVHJhbnNtaXNzaW9uRXh0ZW5zaW9uVXNlZCkge1xuICAgICAgZGlmZnVzZVRyYW5zbWlzc2lvbkV4dGVuc2lvblVzZWQgPSB0cnVlO1xuICAgICAgZW5zdXJlRXh0ZW5zaW9uVXNlZCgnS0hSX21hdGVyaWFsc19kaWZmdXNlX3RyYW5zbWlzc2lvbicpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBkaWZmdXNlVHJhbnNtaXNzaW9uRmFjdG9yID0gY29lcmNlTnVtYmVyKHJuTWF0ZXJpYWwuZ2V0UGFyYW1ldGVyKCdkaWZmdXNlVHJhbnNtaXNzaW9uRmFjdG9yJykpO1xuICBpZiAoSXMuZXhpc3QoZGlmZnVzZVRyYW5zbWlzc2lvbkZhY3RvcikpIHtcbiAgICBkaWZmdXNlVHJhbnNtaXNzaW9uRXh0ZW5zaW9uLmRpZmZ1c2VUcmFuc21pc3Npb25GYWN0b3IgPSBkaWZmdXNlVHJhbnNtaXNzaW9uRmFjdG9yO1xuICAgIGlmIChkaWZmdXNlVHJhbnNtaXNzaW9uRmFjdG9yICE9PSAwKSB7XG4gICAgICBtYXJrRGlmZnVzZVRyYW5zbWlzc2lvbkV4dGVuc2lvblVzZWQoKTtcbiAgICB9XG4gIH1cblxuICBhcHBseVRleHR1cmUoJ2RpZmZ1c2VUcmFuc21pc3Npb25UZXh0dXJlJywge1xuICAgIHRleENvb3JkUGFyYW06ICdkaWZmdXNlVHJhbnNtaXNzaW9uVGV4Y29vcmRJbmRleCcsXG4gICAgdHJhbnNmb3JtOiB7XG4gICAgICBzY2FsZTogJ2RpZmZ1c2VUcmFuc21pc3Npb25UZXh0dXJlVHJhbnNmb3JtU2NhbGUnLFxuICAgICAgb2Zmc2V0OiAnZGlmZnVzZVRyYW5zbWlzc2lvblRleHR1cmVUcmFuc2Zvcm1PZmZzZXQnLFxuICAgICAgcm90YXRpb246ICdkaWZmdXNlVHJhbnNtaXNzaW9uVGV4dHVyZVRyYW5zZm9ybVJvdGF0aW9uJyxcbiAgICB9LFxuICAgIG9uQXNzaWduOiBpbmZvID0+IHtcbiAgICAgIGRpZmZ1c2VUcmFuc21pc3Npb25FeHRlbnNpb24uZGlmZnVzZVRyYW5zbWlzc2lvblRleHR1cmUgPSBpbmZvO1xuICAgICAgbWFya0RpZmZ1c2VUcmFuc21pc3Npb25FeHRlbnNpb25Vc2VkKCk7XG4gICAgfSxcbiAgfSk7XG5cbiAgY29uc3QgZGlmZnVzZVRyYW5zbWlzc2lvbkNvbG9yRmFjdG9yID0gY29lcmNlVmVjMyhybk1hdGVyaWFsLmdldFBhcmFtZXRlcignZGlmZnVzZVRyYW5zbWlzc2lvbkNvbG9yRmFjdG9yJykpO1xuICBpZiAoSXMuZXhpc3QoZGlmZnVzZVRyYW5zbWlzc2lvbkNvbG9yRmFjdG9yKSkge1xuICAgIGRpZmZ1c2VUcmFuc21pc3Npb25FeHRlbnNpb24uZGlmZnVzZVRyYW5zbWlzc2lvbkNvbG9yRmFjdG9yID0gZGlmZnVzZVRyYW5zbWlzc2lvbkNvbG9yRmFjdG9yO1xuICAgIGlmIChcbiAgICAgIGRpZmZ1c2VUcmFuc21pc3Npb25Db2xvckZhY3RvclswXSAhPT0gMSB8fFxuICAgICAgZGlmZnVzZVRyYW5zbWlzc2lvbkNvbG9yRmFjdG9yWzFdICE9PSAxIHx8XG4gICAgICBkaWZmdXNlVHJhbnNtaXNzaW9uQ29sb3JGYWN0b3JbMl0gIT09IDFcbiAgICApIHtcbiAgICAgIG1hcmtEaWZmdXNlVHJhbnNtaXNzaW9uRXh0ZW5zaW9uVXNlZCgpO1xuICAgIH1cbiAgfVxuXG4gIGFwcGx5VGV4dHVyZSgnZGlmZnVzZVRyYW5zbWlzc2lvbkNvbG9yVGV4dHVyZScsIHtcbiAgICB0ZXhDb29yZFBhcmFtOiAnZGlmZnVzZVRyYW5zbWlzc2lvbkNvbG9yVGV4Y29vcmRJbmRleCcsXG4gICAgdHJhbnNmb3JtOiB7XG4gICAgICBzY2FsZTogJ2RpZmZ1c2VUcmFuc21pc3Npb25Db2xvclRleHR1cmVUcmFuc2Zvcm1TY2FsZScsXG4gICAgICBvZmZzZXQ6ICdkaWZmdXNlVHJhbnNtaXNzaW9uQ29sb3JUZXh0dXJlVHJhbnNmb3JtT2Zmc2V0JyxcbiAgICAgIHJvdGF0aW9uOiAnZGlmZnVzZVRyYW5zbWlzc2lvbkNvbG9yVGV4dHVyZVRyYW5zZm9ybVJvdGF0aW9uJyxcbiAgICB9LFxuICAgIG9uQXNzaWduOiBpbmZvID0+IHtcbiAgICAgIGRpZmZ1c2VUcmFuc21pc3Npb25FeHRlbnNpb24uZGlmZnVzZVRyYW5zbWlzc2lvbkNvbG9yVGV4dHVyZSA9IGluZm87XG4gICAgICBtYXJrRGlmZnVzZVRyYW5zbWlzc2lvbkV4dGVuc2lvblVzZWQoKTtcbiAgICB9LFxuICB9KTtcblxuICBjb25zdCBzaG91bGRBdHRhY2hEaWZmdXNlVHJhbnNtaXNzaW9uRXh0ZW5zaW9uID1cbiAgICBkaWZmdXNlVHJhbnNtaXNzaW9uRXh0ZW5zaW9uVXNlZCB8fFxuICAgIElzLmV4aXN0KGRpZmZ1c2VUcmFuc21pc3Npb25FeHRlbnNpb24uZGlmZnVzZVRyYW5zbWlzc2lvblRleHR1cmUpIHx8XG4gICAgSXMuZXhpc3QoZGlmZnVzZVRyYW5zbWlzc2lvbkV4dGVuc2lvbi5kaWZmdXNlVHJhbnNtaXNzaW9uQ29sb3JUZXh0dXJlKTtcblxuICBpZiAoc2hvdWxkQXR0YWNoRGlmZnVzZVRyYW5zbWlzc2lvbkV4dGVuc2lvbikge1xuICAgIG1hdGVyaWFsLmV4dGVuc2lvbnMgPSBtYXRlcmlhbC5leHRlbnNpb25zID8/IHt9O1xuICAgIG1hdGVyaWFsLmV4dGVuc2lvbnMuS0hSX21hdGVyaWFsc19kaWZmdXNlX3RyYW5zbWlzc2lvbiA9IGRpZmZ1c2VUcmFuc21pc3Npb25FeHRlbnNpb247XG4gICAgZW5zdXJlRXh0ZW5zaW9uVXNlZCgnS0hSX21hdGVyaWFsc19kaWZmdXNlX3RyYW5zbWlzc2lvbicpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX291dHB1dEtock1hdGVyaWFsc1RyYW5zbWlzc2lvbkluZm8oXG4gIGVuc3VyZUV4dGVuc2lvblVzZWQ6IChleHRlbnNpb25OYW1lOiBzdHJpbmcpID0+IHZvaWQsXG4gIGNvZXJjZU51bWJlcjogKHZhbHVlOiBhbnkpID0+IG51bWJlciB8IHVuZGVmaW5lZCxcbiAgcm5NYXRlcmlhbDogTWF0ZXJpYWwsXG4gIGFwcGx5VGV4dHVyZTogKFxuICAgIHBhcmFtTmFtZTogc3RyaW5nLFxuICAgIG9wdGlvbnM6IHtcbiAgICAgIHRleENvb3JkUGFyYW0/OiBzdHJpbmc7XG4gICAgICB0cmFuc2Zvcm0/OiB7XG4gICAgICAgIHNjYWxlPzogc3RyaW5nO1xuICAgICAgICBvZmZzZXQ/OiBzdHJpbmc7XG4gICAgICAgIHJvdGF0aW9uPzogc3RyaW5nO1xuICAgICAgfTtcbiAgICAgIHNjYWxlUGFyYW0/OiBzdHJpbmc7XG4gICAgICBzdHJlbmd0aFBhcmFtPzogc3RyaW5nO1xuICAgICAgb25Bc3NpZ246IChpbmZvOiBhbnkpID0+IHZvaWQ7XG4gICAgfVxuICApID0+IHZvaWQsXG4gIG1hdGVyaWFsOiBHbHRmMk1hdGVyaWFsRXhcbikge1xuICBjb25zdCB0cmFuc21pc3Npb25FeHRlbnNpb246IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge307XG4gIGxldCB0cmFuc21pc3Npb25FeHRlbnNpb25Vc2VkID0gZmFsc2U7XG4gIGNvbnN0IG1hcmtUcmFuc21pc3Npb25FeHRlbnNpb25Vc2VkID0gKCkgPT4ge1xuICAgIGlmICghdHJhbnNtaXNzaW9uRXh0ZW5zaW9uVXNlZCkge1xuICAgICAgdHJhbnNtaXNzaW9uRXh0ZW5zaW9uVXNlZCA9IHRydWU7XG4gICAgICBlbnN1cmVFeHRlbnNpb25Vc2VkKCdLSFJfbWF0ZXJpYWxzX3RyYW5zbWlzc2lvbicpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCB0cmFuc21pc3Npb25GYWN0b3IgPSBjb2VyY2VOdW1iZXIocm5NYXRlcmlhbC5nZXRQYXJhbWV0ZXIoJ3RyYW5zbWlzc2lvbkZhY3RvcicpKTtcbiAgaWYgKElzLmV4aXN0KHRyYW5zbWlzc2lvbkZhY3RvcikpIHtcbiAgICB0cmFuc21pc3Npb25FeHRlbnNpb24udHJhbnNtaXNzaW9uRmFjdG9yID0gdHJhbnNtaXNzaW9uRmFjdG9yO1xuICAgIGlmICh0cmFuc21pc3Npb25GYWN0b3IgIT09IDApIHtcbiAgICAgIG1hcmtUcmFuc21pc3Npb25FeHRlbnNpb25Vc2VkKCk7XG4gICAgfVxuICB9XG5cbiAgYXBwbHlUZXh0dXJlKCd0cmFuc21pc3Npb25UZXh0dXJlJywge1xuICAgIHRleENvb3JkUGFyYW06ICd0cmFuc21pc3Npb25UZXhjb29yZEluZGV4JyxcbiAgICB0cmFuc2Zvcm06IHtcbiAgICAgIHNjYWxlOiAndHJhbnNtaXNzaW9uVGV4dHVyZVRyYW5zZm9ybVNjYWxlJyxcbiAgICAgIG9mZnNldDogJ3RyYW5zbWlzc2lvblRleHR1cmVUcmFuc2Zvcm1PZmZzZXQnLFxuICAgICAgcm90YXRpb246ICd0cmFuc21pc3Npb25UZXh0dXJlVHJhbnNmb3JtUm90YXRpb24nLFxuICAgIH0sXG4gICAgb25Bc3NpZ246IGluZm8gPT4ge1xuICAgICAgdHJhbnNtaXNzaW9uRXh0ZW5zaW9uLnRyYW5zbWlzc2lvblRleHR1cmUgPSBpbmZvO1xuICAgICAgbWFya1RyYW5zbWlzc2lvbkV4dGVuc2lvblVzZWQoKTtcbiAgICB9LFxuICB9KTtcblxuICBjb25zdCBzaG91bGRBdHRhY2hUcmFuc21pc3Npb25FeHRlbnNpb24gPVxuICAgIHRyYW5zbWlzc2lvbkV4dGVuc2lvblVzZWQgfHwgSXMuZXhpc3QodHJhbnNtaXNzaW9uRXh0ZW5zaW9uLnRyYW5zbWlzc2lvblRleHR1cmUpO1xuICBpZiAoc2hvdWxkQXR0YWNoVHJhbnNtaXNzaW9uRXh0ZW5zaW9uKSB7XG4gICAgbWF0ZXJpYWwuZXh0ZW5zaW9ucyA9IG1hdGVyaWFsLmV4dGVuc2lvbnMgPz8ge307XG4gICAgbWF0ZXJpYWwuZXh0ZW5zaW9ucy5LSFJfbWF0ZXJpYWxzX3RyYW5zbWlzc2lvbiA9IHRyYW5zbWlzc2lvbkV4dGVuc2lvbjtcbiAgICBlbnN1cmVFeHRlbnNpb25Vc2VkKCdLSFJfbWF0ZXJpYWxzX3RyYW5zbWlzc2lvbicpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX291dHB1dEtock1hdGVyaWFsc1ZvbHVtZUluZm8oXG4gIGVuc3VyZUV4dGVuc2lvblVzZWQ6IChleHRlbnNpb25OYW1lOiBzdHJpbmcpID0+IHZvaWQsXG4gIGNvZXJjZU51bWJlcjogKHZhbHVlOiBhbnkpID0+IG51bWJlciB8IHVuZGVmaW5lZCxcbiAgY29lcmNlVmVjMzogKHZhbHVlOiBhbnkpID0+IFtudW1iZXIsIG51bWJlciwgbnVtYmVyXSB8IHVuZGVmaW5lZCxcbiAgcm5NYXRlcmlhbDogTWF0ZXJpYWwsXG4gIGFwcGx5VGV4dHVyZTogKFxuICAgIHBhcmFtTmFtZTogc3RyaW5nLFxuICAgIG9wdGlvbnM6IHtcbiAgICAgIHRleENvb3JkUGFyYW0/OiBzdHJpbmc7XG4gICAgICB0cmFuc2Zvcm0/OiB7XG4gICAgICAgIHNjYWxlPzogc3RyaW5nO1xuICAgICAgICBvZmZzZXQ/OiBzdHJpbmc7XG4gICAgICAgIHJvdGF0aW9uPzogc3RyaW5nO1xuICAgICAgfTtcbiAgICAgIHNjYWxlUGFyYW0/OiBzdHJpbmc7XG4gICAgICBzdHJlbmd0aFBhcmFtPzogc3RyaW5nO1xuICAgICAgb25Bc3NpZ246IChpbmZvOiBhbnkpID0+IHZvaWQ7XG4gICAgfVxuICApID0+IHZvaWQsXG4gIG1hdGVyaWFsOiBHbHRmMk1hdGVyaWFsRXhcbikge1xuICBjb25zdCB2b2x1bWVFeHRlbnNpb246IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge307XG4gIGxldCB2b2x1bWVFeHRlbnNpb25Vc2VkID0gZmFsc2U7XG4gIGNvbnN0IG1hcmtWb2x1bWVFeHRlbnNpb25Vc2VkID0gKCkgPT4ge1xuICAgIGlmICghdm9sdW1lRXh0ZW5zaW9uVXNlZCkge1xuICAgICAgdm9sdW1lRXh0ZW5zaW9uVXNlZCA9IHRydWU7XG4gICAgICBlbnN1cmVFeHRlbnNpb25Vc2VkKCdLSFJfbWF0ZXJpYWxzX3ZvbHVtZScpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCB0aGlja25lc3NGYWN0b3IgPSBjb2VyY2VOdW1iZXIocm5NYXRlcmlhbC5nZXRQYXJhbWV0ZXIoJ3RoaWNrbmVzc0ZhY3RvcicpKTtcbiAgaWYgKElzLmV4aXN0KHRoaWNrbmVzc0ZhY3RvcikpIHtcbiAgICB2b2x1bWVFeHRlbnNpb24udGhpY2tuZXNzRmFjdG9yID0gdGhpY2tuZXNzRmFjdG9yO1xuICAgIGlmICh0aGlja25lc3NGYWN0b3IgIT09IDApIHtcbiAgICAgIG1hcmtWb2x1bWVFeHRlbnNpb25Vc2VkKCk7XG4gICAgfVxuICB9XG5cbiAgYXBwbHlUZXh0dXJlKCd0aGlja25lc3NUZXh0dXJlJywge1xuICAgIHRleENvb3JkUGFyYW06ICd0aGlja25lc3NUZXhjb29yZEluZGV4JyxcbiAgICB0cmFuc2Zvcm06IHtcbiAgICAgIHNjYWxlOiAndGhpY2tuZXNzVGV4dHVyZVRyYW5zZm9ybVNjYWxlJyxcbiAgICAgIG9mZnNldDogJ3RoaWNrbmVzc1RleHR1cmVUcmFuc2Zvcm1PZmZzZXQnLFxuICAgICAgcm90YXRpb246ICd0aGlja25lc3NUZXh0dXJlVHJhbnNmb3JtUm90YXRpb24nLFxuICAgIH0sXG4gICAgb25Bc3NpZ246IGluZm8gPT4ge1xuICAgICAgdm9sdW1lRXh0ZW5zaW9uLnRoaWNrbmVzc1RleHR1cmUgPSBpbmZvO1xuICAgICAgbWFya1ZvbHVtZUV4dGVuc2lvblVzZWQoKTtcbiAgICB9LFxuICB9KTtcblxuICBjb25zdCBhdHRlbnVhdGlvbkRpc3RhbmNlID0gY29lcmNlTnVtYmVyKHJuTWF0ZXJpYWwuZ2V0UGFyYW1ldGVyKCdhdHRlbnVhdGlvbkRpc3RhbmNlJykpO1xuICBpZiAoSXMuZXhpc3QoYXR0ZW51YXRpb25EaXN0YW5jZSkgJiYgYXR0ZW51YXRpb25EaXN0YW5jZSA+IDApIHtcbiAgICB2b2x1bWVFeHRlbnNpb24uYXR0ZW51YXRpb25EaXN0YW5jZSA9IGF0dGVudWF0aW9uRGlzdGFuY2U7XG4gICAgbWFya1ZvbHVtZUV4dGVuc2lvblVzZWQoKTtcbiAgfVxuXG4gIGNvbnN0IGF0dGVudWF0aW9uQ29sb3IgPSBjb2VyY2VWZWMzKHJuTWF0ZXJpYWwuZ2V0UGFyYW1ldGVyKCdhdHRlbnVhdGlvbkNvbG9yJykpO1xuICBpZiAoSXMuZXhpc3QoYXR0ZW51YXRpb25Db2xvcikpIHtcbiAgICB2b2x1bWVFeHRlbnNpb24uYXR0ZW51YXRpb25Db2xvciA9IGF0dGVudWF0aW9uQ29sb3I7XG4gICAgaWYgKGF0dGVudWF0aW9uQ29sb3Iuc29tZSh2ID0+IHYgIT09IDEpKSB7XG4gICAgICBtYXJrVm9sdW1lRXh0ZW5zaW9uVXNlZCgpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHNob3VsZEF0dGFjaFZvbHVtZUV4dGVuc2lvbiA9XG4gICAgdm9sdW1lRXh0ZW5zaW9uVXNlZCB8fFxuICAgIElzLmV4aXN0KHZvbHVtZUV4dGVuc2lvbi50aGlja25lc3NUZXh0dXJlKSB8fFxuICAgIChJcy5leGlzdCh2b2x1bWVFeHRlbnNpb24udGhpY2tuZXNzRmFjdG9yKSAmJiAodm9sdW1lRXh0ZW5zaW9uLnRoaWNrbmVzc0ZhY3RvciBhcyBudW1iZXIpICE9PSAwKSB8fFxuICAgIChJcy5leGlzdCh2b2x1bWVFeHRlbnNpb24uYXR0ZW51YXRpb25EaXN0YW5jZSkgJiYgKHZvbHVtZUV4dGVuc2lvbi5hdHRlbnVhdGlvbkRpc3RhbmNlIGFzIG51bWJlcikgIT09IDApIHx8XG4gICAgKElzLmV4aXN0KHZvbHVtZUV4dGVuc2lvbi5hdHRlbnVhdGlvbkNvbG9yKSAmJlxuICAgICAgKHZvbHVtZUV4dGVuc2lvbi5hdHRlbnVhdGlvbkNvbG9yIGFzIFtudW1iZXIsIG51bWJlciwgbnVtYmVyXSkuc29tZSh2ID0+IHYgIT09IDEpKTtcbiAgaWYgKHNob3VsZEF0dGFjaFZvbHVtZUV4dGVuc2lvbikge1xuICAgIG1hdGVyaWFsLmV4dGVuc2lvbnMgPSBtYXRlcmlhbC5leHRlbnNpb25zID8/IHt9O1xuICAgIG1hdGVyaWFsLmV4dGVuc2lvbnMuS0hSX21hdGVyaWFsc192b2x1bWUgPSB2b2x1bWVFeHRlbnNpb247XG4gICAgZW5zdXJlRXh0ZW5zaW9uVXNlZCgnS0hSX21hdGVyaWFsc192b2x1bWUnKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gX19vdXRwdXRLaHJNYXRlcmlhbHNJb3JJbmZvKFxuICBlbnN1cmVFeHRlbnNpb25Vc2VkOiAoZXh0ZW5zaW9uTmFtZTogc3RyaW5nKSA9PiB2b2lkLFxuICBjb2VyY2VOdW1iZXI6ICh2YWx1ZTogYW55KSA9PiBudW1iZXIgfCB1bmRlZmluZWQsXG4gIHJuTWF0ZXJpYWw6IE1hdGVyaWFsLFxuICBtYXRlcmlhbDogR2x0ZjJNYXRlcmlhbEV4XG4pIHtcbiAgY29uc3QgcmF3SW9yID0gY29lcmNlTnVtYmVyKHJuTWF0ZXJpYWwuZ2V0UGFyYW1ldGVyKCdpb3InKSk7XG4gIGlmIChJcy5ub3QuZXhpc3QocmF3SW9yKSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGNsYW1wZWRJb3IgPSBNYXRoLm1heCgxLjAsIHJhd0lvcik7XG4gIGNvbnN0IGRlZmF1bHRJb3IgPSAxLjU7XG4gIGlmIChNYXRoLmFicyhjbGFtcGVkSW9yIC0gZGVmYXVsdElvcikgPCAxZS02KSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgbWF0ZXJpYWwuZXh0ZW5zaW9ucyA9IG1hdGVyaWFsLmV4dGVuc2lvbnMgPz8ge307XG4gIG1hdGVyaWFsLmV4dGVuc2lvbnMuS0hSX21hdGVyaWFsc19pb3IgPSB7XG4gICAgaW9yOiBjbGFtcGVkSW9yLFxuICB9O1xuICBlbnN1cmVFeHRlbnNpb25Vc2VkKCdLSFJfbWF0ZXJpYWxzX2lvcicpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gX19vdXRwdXRLaHJNYXRlcmlhbHNDbGVhcmNvYXRJbmZvKFxuICBlbnN1cmVFeHRlbnNpb25Vc2VkOiAoZXh0ZW5zaW9uTmFtZTogc3RyaW5nKSA9PiB2b2lkLFxuICBjb2VyY2VOdW1iZXI6ICh2YWx1ZTogYW55KSA9PiBudW1iZXIgfCB1bmRlZmluZWQsXG4gIHJuTWF0ZXJpYWw6IE1hdGVyaWFsLFxuICBhcHBseVRleHR1cmU6IChcbiAgICBwYXJhbU5hbWU6IHN0cmluZyxcbiAgICBvcHRpb25zOiB7XG4gICAgICB0ZXhDb29yZFBhcmFtPzogc3RyaW5nO1xuICAgICAgdHJhbnNmb3JtPzoge1xuICAgICAgICBzY2FsZT86IHN0cmluZztcbiAgICAgICAgb2Zmc2V0Pzogc3RyaW5nO1xuICAgICAgICByb3RhdGlvbj86IHN0cmluZztcbiAgICAgIH07XG4gICAgICBzY2FsZVBhcmFtPzogc3RyaW5nO1xuICAgICAgc3RyZW5ndGhQYXJhbT86IHN0cmluZztcbiAgICAgIG9uQXNzaWduOiAoaW5mbzogYW55KSA9PiB2b2lkO1xuICAgIH1cbiAgKSA9PiB2b2lkLFxuICBtYXRlcmlhbDogR2x0ZjJNYXRlcmlhbEV4XG4pIHtcbiAgY29uc3QgY2xlYXJjb2F0RXh0ZW5zaW9uOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9O1xuICBsZXQgY2xlYXJjb2F0RXh0ZW5zaW9uVXNlZCA9IGZhbHNlO1xuICBjb25zdCBtYXJrQ2xlYXJjb2F0RXh0ZW5zaW9uVXNlZCA9ICgpID0+IHtcbiAgICBpZiAoIWNsZWFyY29hdEV4dGVuc2lvblVzZWQpIHtcbiAgICAgIGNsZWFyY29hdEV4dGVuc2lvblVzZWQgPSB0cnVlO1xuICAgICAgZW5zdXJlRXh0ZW5zaW9uVXNlZCgnS0hSX21hdGVyaWFsc19jbGVhcmNvYXQnKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgY2xlYXJjb2F0RmFjdG9yID0gY29lcmNlTnVtYmVyKHJuTWF0ZXJpYWwuZ2V0UGFyYW1ldGVyKCdjbGVhcmNvYXRGYWN0b3InKSk7XG4gIGlmIChJcy5leGlzdChjbGVhcmNvYXRGYWN0b3IpKSB7XG4gICAgY2xlYXJjb2F0RXh0ZW5zaW9uLmNsZWFyY29hdEZhY3RvciA9IGNsZWFyY29hdEZhY3RvcjtcbiAgICBpZiAoY2xlYXJjb2F0RmFjdG9yICE9PSAwKSB7XG4gICAgICBtYXJrQ2xlYXJjb2F0RXh0ZW5zaW9uVXNlZCgpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGNsZWFyY29hdFJvdWdobmVzc0ZhY3RvciA9IGNvZXJjZU51bWJlcihybk1hdGVyaWFsLmdldFBhcmFtZXRlcignY2xlYXJjb2F0Um91Z2huZXNzRmFjdG9yJykpO1xuICBpZiAoSXMuZXhpc3QoY2xlYXJjb2F0Um91Z2huZXNzRmFjdG9yKSkge1xuICAgIGNsZWFyY29hdEV4dGVuc2lvbi5jbGVhcmNvYXRSb3VnaG5lc3NGYWN0b3IgPSBjbGVhcmNvYXRSb3VnaG5lc3NGYWN0b3I7XG4gICAgaWYgKGNsZWFyY29hdFJvdWdobmVzc0ZhY3RvciAhPT0gMCkge1xuICAgICAgbWFya0NsZWFyY29hdEV4dGVuc2lvblVzZWQoKTtcbiAgICB9XG4gIH1cblxuICBhcHBseVRleHR1cmUoJ2NsZWFyY29hdFRleHR1cmUnLCB7XG4gICAgdGV4Q29vcmRQYXJhbTogJ2NsZWFyY29hdFRleGNvb3JkSW5kZXgnLFxuICAgIHRyYW5zZm9ybToge1xuICAgICAgc2NhbGU6ICdjbGVhcmNvYXRUZXh0dXJlVHJhbnNmb3JtU2NhbGUnLFxuICAgICAgb2Zmc2V0OiAnY2xlYXJjb2F0VGV4dHVyZVRyYW5zZm9ybU9mZnNldCcsXG4gICAgICByb3RhdGlvbjogJ2NsZWFyY29hdFRleHR1cmVUcmFuc2Zvcm1Sb3RhdGlvbicsXG4gICAgfSxcbiAgICBvbkFzc2lnbjogaW5mbyA9PiB7XG4gICAgICBjbGVhcmNvYXRFeHRlbnNpb24uY2xlYXJjb2F0VGV4dHVyZSA9IGluZm87XG4gICAgICBtYXJrQ2xlYXJjb2F0RXh0ZW5zaW9uVXNlZCgpO1xuICAgIH0sXG4gIH0pO1xuXG4gIGFwcGx5VGV4dHVyZSgnY2xlYXJjb2F0Um91Z2huZXNzVGV4dHVyZScsIHtcbiAgICB0ZXhDb29yZFBhcmFtOiAnY2xlYXJjb2F0Um91Z2huZXNzVGV4Y29vcmRJbmRleCcsXG4gICAgdHJhbnNmb3JtOiB7XG4gICAgICBzY2FsZTogJ2NsZWFyY29hdFJvdWdobmVzc1RleHR1cmVUcmFuc2Zvcm1TY2FsZScsXG4gICAgICBvZmZzZXQ6ICdjbGVhcmNvYXRSb3VnaG5lc3NUZXh0dXJlVHJhbnNmb3JtT2Zmc2V0JyxcbiAgICAgIHJvdGF0aW9uOiAnY2xlYXJjb2F0Um91Z2huZXNzVGV4dHVyZVRyYW5zZm9ybVJvdGF0aW9uJyxcbiAgICB9LFxuICAgIG9uQXNzaWduOiBpbmZvID0+IHtcbiAgICAgIGNsZWFyY29hdEV4dGVuc2lvbi5jbGVhcmNvYXRSb3VnaG5lc3NUZXh0dXJlID0gaW5mbztcbiAgICAgIG1hcmtDbGVhcmNvYXRFeHRlbnNpb25Vc2VkKCk7XG4gICAgfSxcbiAgfSk7XG5cbiAgYXBwbHlUZXh0dXJlKCdjbGVhcmNvYXROb3JtYWxUZXh0dXJlJywge1xuICAgIHRleENvb3JkUGFyYW06ICdjbGVhcmNvYXROb3JtYWxUZXhjb29yZEluZGV4JyxcbiAgICB0cmFuc2Zvcm06IHtcbiAgICAgIHNjYWxlOiAnY2xlYXJjb2F0Tm9ybWFsVGV4dHVyZVRyYW5zZm9ybVNjYWxlJyxcbiAgICAgIG9mZnNldDogJ2NsZWFyY29hdE5vcm1hbFRleHR1cmVUcmFuc2Zvcm1PZmZzZXQnLFxuICAgICAgcm90YXRpb246ICdjbGVhcmNvYXROb3JtYWxUZXh0dXJlVHJhbnNmb3JtUm90YXRpb24nLFxuICAgIH0sXG4gICAgb25Bc3NpZ246IGluZm8gPT4ge1xuICAgICAgY29uc3QgY2xlYXJjb2F0Tm9ybWFsU2NhbGUgPVxuICAgICAgICBjb2VyY2VOdW1iZXIocm5NYXRlcmlhbC5nZXRQYXJhbWV0ZXIoJ2NsZWFyY29hdE5vcm1hbFNjYWxlJykpID8/XG4gICAgICAgIGNvZXJjZU51bWJlcihybk1hdGVyaWFsLmdldFBhcmFtZXRlcignY2xlYXJjb2F0Tm9ybWFsVGV4dHVyZVNjYWxlJykpO1xuICAgICAgaWYgKElzLmV4aXN0KGNsZWFyY29hdE5vcm1hbFNjYWxlKSkge1xuICAgICAgICBpbmZvLnNjYWxlID0gY2xlYXJjb2F0Tm9ybWFsU2NhbGU7XG4gICAgICB9XG4gICAgICBjbGVhcmNvYXRFeHRlbnNpb24uY2xlYXJjb2F0Tm9ybWFsVGV4dHVyZSA9IGluZm87XG4gICAgICBtYXJrQ2xlYXJjb2F0RXh0ZW5zaW9uVXNlZCgpO1xuICAgIH0sXG4gIH0pO1xuXG4gIGNvbnN0IHNob3VsZEF0dGFjaENsZWFyY29hdEV4dGVuc2lvbiA9XG4gICAgY2xlYXJjb2F0RXh0ZW5zaW9uVXNlZCB8fFxuICAgIElzLmV4aXN0KGNsZWFyY29hdEV4dGVuc2lvbi5jbGVhcmNvYXRUZXh0dXJlKSB8fFxuICAgIElzLmV4aXN0KGNsZWFyY29hdEV4dGVuc2lvbi5jbGVhcmNvYXRSb3VnaG5lc3NUZXh0dXJlKSB8fFxuICAgIElzLmV4aXN0KGNsZWFyY29hdEV4dGVuc2lvbi5jbGVhcmNvYXROb3JtYWxUZXh0dXJlKTtcbiAgaWYgKHNob3VsZEF0dGFjaENsZWFyY29hdEV4dGVuc2lvbikge1xuICAgIG1hdGVyaWFsLmV4dGVuc2lvbnMgPSBtYXRlcmlhbC5leHRlbnNpb25zID8/IHt9O1xuICAgIG1hdGVyaWFsLmV4dGVuc2lvbnMuS0hSX21hdGVyaWFsc19jbGVhcmNvYXQgPSBjbGVhcmNvYXRFeHRlbnNpb247XG4gICAgZW5zdXJlRXh0ZW5zaW9uVXNlZCgnS0hSX21hdGVyaWFsc19jbGVhcmNvYXQnKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gX19vdXRwdXRLaHJNYXRlcmlhbHNTaGVlbkluZm8oXG4gIGVuc3VyZUV4dGVuc2lvblVzZWQ6IChleHRlbnNpb25OYW1lOiBzdHJpbmcpID0+IHZvaWQsXG4gIGNvZXJjZU51bWJlcjogKHZhbHVlOiBhbnkpID0+IG51bWJlciB8IHVuZGVmaW5lZCxcbiAgY29lcmNlVmVjMzogKHZhbHVlOiBhbnkpID0+IFtudW1iZXIsIG51bWJlciwgbnVtYmVyXSB8IHVuZGVmaW5lZCxcbiAgcm5NYXRlcmlhbDogTWF0ZXJpYWwsXG4gIGFwcGx5VGV4dHVyZTogKFxuICAgIHBhcmFtTmFtZTogc3RyaW5nLFxuICAgIG9wdGlvbnM6IHtcbiAgICAgIHRleENvb3JkUGFyYW0/OiBzdHJpbmc7XG4gICAgICB0cmFuc2Zvcm0/OiB7XG4gICAgICAgIHNjYWxlPzogc3RyaW5nO1xuICAgICAgICBvZmZzZXQ/OiBzdHJpbmc7XG4gICAgICAgIHJvdGF0aW9uPzogc3RyaW5nO1xuICAgICAgfTtcbiAgICAgIHNjYWxlUGFyYW0/OiBzdHJpbmc7XG4gICAgICBzdHJlbmd0aFBhcmFtPzogc3RyaW5nO1xuICAgICAgb25Bc3NpZ246IChpbmZvOiBhbnkpID0+IHZvaWQ7XG4gICAgfVxuICApID0+IHZvaWQsXG4gIG1hdGVyaWFsOiBHbHRmMk1hdGVyaWFsRXhcbikge1xuICBjb25zdCBzaGVlbkV4dGVuc2lvbjogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7fTtcbiAgbGV0IHNoZWVuRXh0ZW5zaW9uVXNlZCA9IGZhbHNlO1xuICBjb25zdCBtYXJrU2hlZW5FeHRlbnNpb25Vc2VkID0gKCkgPT4ge1xuICAgIGlmICghc2hlZW5FeHRlbnNpb25Vc2VkKSB7XG4gICAgICBzaGVlbkV4dGVuc2lvblVzZWQgPSB0cnVlO1xuICAgICAgZW5zdXJlRXh0ZW5zaW9uVXNlZCgnS0hSX21hdGVyaWFsc19zaGVlbicpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBzaGVlbkNvbG9yRmFjdG9yID0gY29lcmNlVmVjMyhybk1hdGVyaWFsLmdldFBhcmFtZXRlcignc2hlZW5Db2xvckZhY3RvcicpKTtcbiAgaWYgKElzLmV4aXN0KHNoZWVuQ29sb3JGYWN0b3IpKSB7XG4gICAgc2hlZW5FeHRlbnNpb24uc2hlZW5Db2xvckZhY3RvciA9IHNoZWVuQ29sb3JGYWN0b3I7XG4gICAgaWYgKHNoZWVuQ29sb3JGYWN0b3Iuc29tZSh2ID0+IHYgIT09IDApKSB7XG4gICAgICBtYXJrU2hlZW5FeHRlbnNpb25Vc2VkKCk7XG4gICAgfVxuICB9XG5cbiAgY29uc3Qgc2hlZW5Sb3VnaG5lc3NGYWN0b3IgPSBjb2VyY2VOdW1iZXIocm5NYXRlcmlhbC5nZXRQYXJhbWV0ZXIoJ3NoZWVuUm91Z2huZXNzRmFjdG9yJykpO1xuICBpZiAoSXMuZXhpc3Qoc2hlZW5Sb3VnaG5lc3NGYWN0b3IpKSB7XG4gICAgc2hlZW5FeHRlbnNpb24uc2hlZW5Sb3VnaG5lc3NGYWN0b3IgPSBzaGVlblJvdWdobmVzc0ZhY3RvcjtcbiAgICBpZiAoc2hlZW5Sb3VnaG5lc3NGYWN0b3IgIT09IDApIHtcbiAgICAgIG1hcmtTaGVlbkV4dGVuc2lvblVzZWQoKTtcbiAgICB9XG4gIH1cblxuICBhcHBseVRleHR1cmUoJ3NoZWVuQ29sb3JUZXh0dXJlJywge1xuICAgIHRleENvb3JkUGFyYW06ICdzaGVlbkNvbG9yVGV4Y29vcmRJbmRleCcsXG4gICAgdHJhbnNmb3JtOiB7XG4gICAgICBzY2FsZTogJ3NoZWVuQ29sb3JUZXh0dXJlVHJhbnNmb3JtU2NhbGUnLFxuICAgICAgb2Zmc2V0OiAnc2hlZW5Db2xvclRleHR1cmVUcmFuc2Zvcm1PZmZzZXQnLFxuICAgICAgcm90YXRpb246ICdzaGVlbkNvbG9yVGV4dHVyZVRyYW5zZm9ybVJvdGF0aW9uJyxcbiAgICB9LFxuICAgIG9uQXNzaWduOiBpbmZvID0+IHtcbiAgICAgIHNoZWVuRXh0ZW5zaW9uLnNoZWVuQ29sb3JUZXh0dXJlID0gaW5mbztcbiAgICAgIG1hcmtTaGVlbkV4dGVuc2lvblVzZWQoKTtcbiAgICB9LFxuICB9KTtcblxuICBhcHBseVRleHR1cmUoJ3NoZWVuUm91Z2huZXNzVGV4dHVyZScsIHtcbiAgICB0ZXhDb29yZFBhcmFtOiAnc2hlZW5Sb3VnaG5lc3NUZXhjb29yZEluZGV4JyxcbiAgICB0cmFuc2Zvcm06IHtcbiAgICAgIHNjYWxlOiAnc2hlZW5Sb3VnaG5lc3NUZXh0dXJlVHJhbnNmb3JtU2NhbGUnLFxuICAgICAgb2Zmc2V0OiAnc2hlZW5Sb3VnaG5lc3NUZXh0dXJlVHJhbnNmb3JtT2Zmc2V0JyxcbiAgICAgIHJvdGF0aW9uOiAnc2hlZW5Sb3VnaG5lc3NUZXh0dXJlVHJhbnNmb3JtUm90YXRpb24nLFxuICAgIH0sXG4gICAgb25Bc3NpZ246IGluZm8gPT4ge1xuICAgICAgc2hlZW5FeHRlbnNpb24uc2hlZW5Sb3VnaG5lc3NUZXh0dXJlID0gaW5mbztcbiAgICAgIG1hcmtTaGVlbkV4dGVuc2lvblVzZWQoKTtcbiAgICB9LFxuICB9KTtcblxuICBjb25zdCBzaG91bGRBdHRhY2hTaGVlbkV4dGVuc2lvbiA9XG4gICAgc2hlZW5FeHRlbnNpb25Vc2VkIHx8IElzLmV4aXN0KHNoZWVuRXh0ZW5zaW9uLnNoZWVuQ29sb3JUZXh0dXJlKSB8fCBJcy5leGlzdChzaGVlbkV4dGVuc2lvbi5zaGVlblJvdWdobmVzc1RleHR1cmUpO1xuICBpZiAoc2hvdWxkQXR0YWNoU2hlZW5FeHRlbnNpb24pIHtcbiAgICBtYXRlcmlhbC5leHRlbnNpb25zID0gbWF0ZXJpYWwuZXh0ZW5zaW9ucyA/PyB7fTtcbiAgICBtYXRlcmlhbC5leHRlbnNpb25zLktIUl9tYXRlcmlhbHNfc2hlZW4gPSBzaGVlbkV4dGVuc2lvbjtcbiAgICBlbnN1cmVFeHRlbnNpb25Vc2VkKCdLSFJfbWF0ZXJpYWxzX3NoZWVuJyk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9fb3V0cHV0S2hyTWF0ZXJpYWxzU3BlY3VsYXJJbmZvKFxuICBlbnN1cmVFeHRlbnNpb25Vc2VkOiAoZXh0ZW5zaW9uTmFtZTogc3RyaW5nKSA9PiB2b2lkLFxuICBjb2VyY2VOdW1iZXI6ICh2YWx1ZTogYW55KSA9PiBudW1iZXIgfCB1bmRlZmluZWQsXG4gIGNvZXJjZVZlYzM6ICh2YWx1ZTogYW55KSA9PiBbbnVtYmVyLCBudW1iZXIsIG51bWJlcl0gfCB1bmRlZmluZWQsXG4gIHJuTWF0ZXJpYWw6IE1hdGVyaWFsLFxuICBhcHBseVRleHR1cmU6IChcbiAgICBwYXJhbU5hbWU6IHN0cmluZyxcbiAgICBvcHRpb25zOiB7XG4gICAgICB0ZXhDb29yZFBhcmFtPzogc3RyaW5nO1xuICAgICAgdHJhbnNmb3JtPzoge1xuICAgICAgICBzY2FsZT86IHN0cmluZztcbiAgICAgICAgb2Zmc2V0Pzogc3RyaW5nO1xuICAgICAgICByb3RhdGlvbj86IHN0cmluZztcbiAgICAgIH07XG4gICAgICBzY2FsZVBhcmFtPzogc3RyaW5nO1xuICAgICAgc3RyZW5ndGhQYXJhbT86IHN0cmluZztcbiAgICAgIG9uQXNzaWduOiAoaW5mbzogYW55KSA9PiB2b2lkO1xuICAgIH1cbiAgKSA9PiB2b2lkLFxuICBtYXRlcmlhbDogR2x0ZjJNYXRlcmlhbEV4XG4pIHtcbiAgY29uc3Qgc3BlY3VsYXJFeHRlbnNpb246IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge307XG4gIGxldCBzcGVjdWxhckV4dGVuc2lvblVzZWQgPSBmYWxzZTtcbiAgY29uc3QgbWFya1NwZWN1bGFyRXh0ZW5zaW9uVXNlZCA9ICgpID0+IHtcbiAgICBpZiAoIXNwZWN1bGFyRXh0ZW5zaW9uVXNlZCkge1xuICAgICAgc3BlY3VsYXJFeHRlbnNpb25Vc2VkID0gdHJ1ZTtcbiAgICAgIGVuc3VyZUV4dGVuc2lvblVzZWQoJ0tIUl9tYXRlcmlhbHNfc3BlY3VsYXInKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3Qgc3BlY3VsYXJGYWN0b3IgPSBjb2VyY2VOdW1iZXIocm5NYXRlcmlhbC5nZXRQYXJhbWV0ZXIoJ3NwZWN1bGFyRmFjdG9yJykpO1xuICBpZiAoSXMuZXhpc3Qoc3BlY3VsYXJGYWN0b3IpICYmIHNwZWN1bGFyRmFjdG9yICE9PSAxKSB7XG4gICAgc3BlY3VsYXJFeHRlbnNpb24uc3BlY3VsYXJGYWN0b3IgPSBzcGVjdWxhckZhY3RvcjtcbiAgICBtYXJrU3BlY3VsYXJFeHRlbnNpb25Vc2VkKCk7XG4gIH1cblxuICBjb25zdCBzcGVjdWxhckNvbG9yRmFjdG9yID0gY29lcmNlVmVjMyhybk1hdGVyaWFsLmdldFBhcmFtZXRlcignc3BlY3VsYXJDb2xvckZhY3RvcicpKTtcbiAgaWYgKElzLmV4aXN0KHNwZWN1bGFyQ29sb3JGYWN0b3IpICYmIHNwZWN1bGFyQ29sb3JGYWN0b3Iuc29tZSh2ID0+IHYgIT09IDEpKSB7XG4gICAgc3BlY3VsYXJFeHRlbnNpb24uc3BlY3VsYXJDb2xvckZhY3RvciA9IHNwZWN1bGFyQ29sb3JGYWN0b3I7XG4gICAgbWFya1NwZWN1bGFyRXh0ZW5zaW9uVXNlZCgpO1xuICB9XG5cbiAgYXBwbHlUZXh0dXJlKCdzcGVjdWxhclRleHR1cmUnLCB7XG4gICAgdGV4Q29vcmRQYXJhbTogJ3NwZWN1bGFyVGV4Y29vcmRJbmRleCcsXG4gICAgdHJhbnNmb3JtOiB7XG4gICAgICBzY2FsZTogJ3NwZWN1bGFyVGV4dHVyZVRyYW5zZm9ybVNjYWxlJyxcbiAgICAgIG9mZnNldDogJ3NwZWN1bGFyVGV4dHVyZVRyYW5zZm9ybU9mZnNldCcsXG4gICAgICByb3RhdGlvbjogJ3NwZWN1bGFyVGV4dHVyZVRyYW5zZm9ybVJvdGF0aW9uJyxcbiAgICB9LFxuICAgIG9uQXNzaWduOiBpbmZvID0+IHtcbiAgICAgIHNwZWN1bGFyRXh0ZW5zaW9uLnNwZWN1bGFyVGV4dHVyZSA9IGluZm87XG4gICAgICBtYXJrU3BlY3VsYXJFeHRlbnNpb25Vc2VkKCk7XG4gICAgfSxcbiAgfSk7XG5cbiAgYXBwbHlUZXh0dXJlKCdzcGVjdWxhckNvbG9yVGV4dHVyZScsIHtcbiAgICB0ZXhDb29yZFBhcmFtOiAnc3BlY3VsYXJDb2xvclRleGNvb3JkSW5kZXgnLFxuICAgIHRyYW5zZm9ybToge1xuICAgICAgc2NhbGU6ICdzcGVjdWxhckNvbG9yVGV4dHVyZVRyYW5zZm9ybVNjYWxlJyxcbiAgICAgIG9mZnNldDogJ3NwZWN1bGFyQ29sb3JUZXh0dXJlVHJhbnNmb3JtT2Zmc2V0JyxcbiAgICAgIHJvdGF0aW9uOiAnc3BlY3VsYXJDb2xvclRleHR1cmVUcmFuc2Zvcm1Sb3RhdGlvbicsXG4gICAgfSxcbiAgICBvbkFzc2lnbjogaW5mbyA9PiB7XG4gICAgICBzcGVjdWxhckV4dGVuc2lvbi5zcGVjdWxhckNvbG9yVGV4dHVyZSA9IGluZm87XG4gICAgICBtYXJrU3BlY3VsYXJFeHRlbnNpb25Vc2VkKCk7XG4gICAgfSxcbiAgfSk7XG5cbiAgY29uc3Qgc2hvdWxkQXR0YWNoU3BlY3VsYXJFeHRlbnNpb24gPVxuICAgIHNwZWN1bGFyRXh0ZW5zaW9uVXNlZCB8fFxuICAgIElzLmV4aXN0KHNwZWN1bGFyRXh0ZW5zaW9uLnNwZWN1bGFyVGV4dHVyZSkgfHxcbiAgICBJcy5leGlzdChzcGVjdWxhckV4dGVuc2lvbi5zcGVjdWxhckNvbG9yVGV4dHVyZSkgfHxcbiAgICBJcy5leGlzdChzcGVjdWxhckV4dGVuc2lvbi5zcGVjdWxhckZhY3RvcikgfHxcbiAgICBJcy5leGlzdChzcGVjdWxhckV4dGVuc2lvbi5zcGVjdWxhckNvbG9yRmFjdG9yKTtcbiAgaWYgKHNob3VsZEF0dGFjaFNwZWN1bGFyRXh0ZW5zaW9uKSB7XG4gICAgbWF0ZXJpYWwuZXh0ZW5zaW9ucyA9IG1hdGVyaWFsLmV4dGVuc2lvbnMgPz8ge307XG4gICAgbWF0ZXJpYWwuZXh0ZW5zaW9ucy5LSFJfbWF0ZXJpYWxzX3NwZWN1bGFyID0gc3BlY3VsYXJFeHRlbnNpb247XG4gICAgZW5zdXJlRXh0ZW5zaW9uVXNlZCgnS0hSX21hdGVyaWFsc19zcGVjdWxhcicpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX291dHB1dEtock1hdGVyaWFsc0lyaWRlc2NlbmNlSW5mbyhcbiAgZW5zdXJlRXh0ZW5zaW9uVXNlZDogKGV4dGVuc2lvbk5hbWU6IHN0cmluZykgPT4gdm9pZCxcbiAgY29lcmNlTnVtYmVyOiAodmFsdWU6IGFueSkgPT4gbnVtYmVyIHwgdW5kZWZpbmVkLFxuICBybk1hdGVyaWFsOiBNYXRlcmlhbCxcbiAgYXBwbHlUZXh0dXJlOiAoXG4gICAgcGFyYW1OYW1lOiBzdHJpbmcsXG4gICAgb3B0aW9uczoge1xuICAgICAgdGV4Q29vcmRQYXJhbT86IHN0cmluZztcbiAgICAgIHRyYW5zZm9ybT86IHtcbiAgICAgICAgc2NhbGU/OiBzdHJpbmc7XG4gICAgICAgIG9mZnNldD86IHN0cmluZztcbiAgICAgICAgcm90YXRpb24/OiBzdHJpbmc7XG4gICAgICB9O1xuICAgICAgc2NhbGVQYXJhbT86IHN0cmluZztcbiAgICAgIHN0cmVuZ3RoUGFyYW0/OiBzdHJpbmc7XG4gICAgICBvbkFzc2lnbjogKGluZm86IGFueSkgPT4gdm9pZDtcbiAgICB9XG4gICkgPT4gdm9pZCxcbiAgbWF0ZXJpYWw6IEdsdGYyTWF0ZXJpYWxFeFxuKSB7XG4gIGNvbnN0IGlyaWRlc2NlbmNlRXh0ZW5zaW9uOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9O1xuICBsZXQgaXJpZGVzY2VuY2VFeHRlbnNpb25Vc2VkID0gZmFsc2U7XG4gIGNvbnN0IG1hcmtJcmlkZXNjZW5jZUV4dGVuc2lvblVzZWQgPSAoKSA9PiB7XG4gICAgaWYgKCFpcmlkZXNjZW5jZUV4dGVuc2lvblVzZWQpIHtcbiAgICAgIGlyaWRlc2NlbmNlRXh0ZW5zaW9uVXNlZCA9IHRydWU7XG4gICAgICBlbnN1cmVFeHRlbnNpb25Vc2VkKCdLSFJfbWF0ZXJpYWxzX2lyaWRlc2NlbmNlJyk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IGRlZmF1bHRGYWN0b3IgPSAwLjA7XG4gIGNvbnN0IGZhY3RvciA9IGNvZXJjZU51bWJlcihybk1hdGVyaWFsLmdldFBhcmFtZXRlcignaXJpZGVzY2VuY2VGYWN0b3InKSk7XG4gIGlmIChJcy5leGlzdChmYWN0b3IpKSB7XG4gICAgaXJpZGVzY2VuY2VFeHRlbnNpb24uaXJpZGVzY2VuY2VGYWN0b3IgPSBmYWN0b3I7XG4gICAgaWYgKE1hdGguYWJzKGZhY3RvciAtIGRlZmF1bHRGYWN0b3IpID4gMWUtNikge1xuICAgICAgbWFya0lyaWRlc2NlbmNlRXh0ZW5zaW9uVXNlZCgpO1xuICAgIH1cbiAgfVxuXG4gIGFwcGx5VGV4dHVyZSgnaXJpZGVzY2VuY2VUZXh0dXJlJywge1xuICAgIHRleENvb3JkUGFyYW06ICdpcmlkZXNjZW5jZVRleGNvb3JkSW5kZXgnLFxuICAgIHRyYW5zZm9ybToge1xuICAgICAgc2NhbGU6ICdpcmlkZXNjZW5jZVRleHR1cmVUcmFuc2Zvcm1TY2FsZScsXG4gICAgICBvZmZzZXQ6ICdpcmlkZXNjZW5jZVRleHR1cmVUcmFuc2Zvcm1PZmZzZXQnLFxuICAgICAgcm90YXRpb246ICdpcmlkZXNjZW5jZVRleHR1cmVUcmFuc2Zvcm1Sb3RhdGlvbicsXG4gICAgfSxcbiAgICBvbkFzc2lnbjogaW5mbyA9PiB7XG4gICAgICBpcmlkZXNjZW5jZUV4dGVuc2lvbi5pcmlkZXNjZW5jZVRleHR1cmUgPSBpbmZvO1xuICAgICAgbWFya0lyaWRlc2NlbmNlRXh0ZW5zaW9uVXNlZCgpO1xuICAgIH0sXG4gIH0pO1xuXG4gIGNvbnN0IGRlZmF1bHRJb3IgPSAxLjM7XG4gIGNvbnN0IHJhd0lvciA9IGNvZXJjZU51bWJlcihybk1hdGVyaWFsLmdldFBhcmFtZXRlcignaXJpZGVzY2VuY2VJb3InKSk7XG4gIGlmIChJcy5leGlzdChyYXdJb3IpKSB7XG4gICAgY29uc3QgY2xhbXBlZElvciA9IE1hdGgubWF4KDEuMCwgcmF3SW9yKTtcbiAgICBpcmlkZXNjZW5jZUV4dGVuc2lvbi5pcmlkZXNjZW5jZUlvciA9IGNsYW1wZWRJb3I7XG4gICAgaWYgKE1hdGguYWJzKGNsYW1wZWRJb3IgLSBkZWZhdWx0SW9yKSA+IDFlLTYpIHtcbiAgICAgIG1hcmtJcmlkZXNjZW5jZUV4dGVuc2lvblVzZWQoKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBkZWZhdWx0VGhpY2tuZXNzTWluaW11bSA9IDEwMC4wO1xuICBjb25zdCB0aGlja25lc3NNaW5pbXVtID0gY29lcmNlTnVtYmVyKHJuTWF0ZXJpYWwuZ2V0UGFyYW1ldGVyKCdpcmlkZXNjZW5jZVRoaWNrbmVzc01pbmltdW0nKSk7XG4gIGlmIChJcy5leGlzdCh0aGlja25lc3NNaW5pbXVtKSkge1xuICAgIGlyaWRlc2NlbmNlRXh0ZW5zaW9uLmlyaWRlc2NlbmNlVGhpY2tuZXNzTWluaW11bSA9IHRoaWNrbmVzc01pbmltdW07XG4gICAgaWYgKE1hdGguYWJzKHRoaWNrbmVzc01pbmltdW0gLSBkZWZhdWx0VGhpY2tuZXNzTWluaW11bSkgPiAxZS02KSB7XG4gICAgICBtYXJrSXJpZGVzY2VuY2VFeHRlbnNpb25Vc2VkKCk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgZGVmYXVsdFRoaWNrbmVzc01heGltdW0gPSA0MDAuMDtcbiAgY29uc3QgdGhpY2tuZXNzTWF4aW11bSA9IGNvZXJjZU51bWJlcihybk1hdGVyaWFsLmdldFBhcmFtZXRlcignaXJpZGVzY2VuY2VUaGlja25lc3NNYXhpbXVtJykpO1xuICBpZiAoSXMuZXhpc3QodGhpY2tuZXNzTWF4aW11bSkpIHtcbiAgICBpcmlkZXNjZW5jZUV4dGVuc2lvbi5pcmlkZXNjZW5jZVRoaWNrbmVzc01heGltdW0gPSB0aGlja25lc3NNYXhpbXVtO1xuICAgIGlmIChNYXRoLmFicyh0aGlja25lc3NNYXhpbXVtIC0gZGVmYXVsdFRoaWNrbmVzc01heGltdW0pID4gMWUtNikge1xuICAgICAgbWFya0lyaWRlc2NlbmNlRXh0ZW5zaW9uVXNlZCgpO1xuICAgIH1cbiAgfVxuXG4gIGFwcGx5VGV4dHVyZSgnaXJpZGVzY2VuY2VUaGlja25lc3NUZXh0dXJlJywge1xuICAgIHRleENvb3JkUGFyYW06ICdpcmlkZXNjZW5jZVRoaWNrbmVzc1RleGNvb3JkSW5kZXgnLFxuICAgIHRyYW5zZm9ybToge1xuICAgICAgc2NhbGU6ICdpcmlkZXNjZW5jZVRoaWNrbmVzc1RleHR1cmVUcmFuc2Zvcm1TY2FsZScsXG4gICAgICBvZmZzZXQ6ICdpcmlkZXNjZW5jZVRoaWNrbmVzc1RleHR1cmVUcmFuc2Zvcm1PZmZzZXQnLFxuICAgICAgcm90YXRpb246ICdpcmlkZXNjZW5jZVRoaWNrbmVzc1RleHR1cmVUcmFuc2Zvcm1Sb3RhdGlvbicsXG4gICAgfSxcbiAgICBvbkFzc2lnbjogaW5mbyA9PiB7XG4gICAgICBpcmlkZXNjZW5jZUV4dGVuc2lvbi5pcmlkZXNjZW5jZVRoaWNrbmVzc1RleHR1cmUgPSBpbmZvO1xuICAgICAgbWFya0lyaWRlc2NlbmNlRXh0ZW5zaW9uVXNlZCgpO1xuICAgIH0sXG4gIH0pO1xuXG4gIGNvbnN0IHNob3VsZEF0dGFjaElyaWRlc2NlbmNlRXh0ZW5zaW9uID1cbiAgICBpcmlkZXNjZW5jZUV4dGVuc2lvblVzZWQgfHxcbiAgICBJcy5leGlzdChpcmlkZXNjZW5jZUV4dGVuc2lvbi5pcmlkZXNjZW5jZVRleHR1cmUpIHx8XG4gICAgSXMuZXhpc3QoaXJpZGVzY2VuY2VFeHRlbnNpb24uaXJpZGVzY2VuY2VUaGlja25lc3NUZXh0dXJlKTtcbiAgaWYgKHNob3VsZEF0dGFjaElyaWRlc2NlbmNlRXh0ZW5zaW9uKSB7XG4gICAgbWF0ZXJpYWwuZXh0ZW5zaW9ucyA9IG1hdGVyaWFsLmV4dGVuc2lvbnMgPz8ge307XG4gICAgbWF0ZXJpYWwuZXh0ZW5zaW9ucy5LSFJfbWF0ZXJpYWxzX2lyaWRlc2NlbmNlID0gaXJpZGVzY2VuY2VFeHRlbnNpb247XG4gICAgZW5zdXJlRXh0ZW5zaW9uVXNlZCgnS0hSX21hdGVyaWFsc19pcmlkZXNjZW5jZScpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX291dHB1dEtock1hdGVyaWFsc0FuaXNvdHJvcHlJbmZvKFxuICBlbnN1cmVFeHRlbnNpb25Vc2VkOiAoZXh0ZW5zaW9uTmFtZTogc3RyaW5nKSA9PiB2b2lkLFxuICBjb2VyY2VOdW1iZXI6ICh2YWx1ZTogYW55KSA9PiBudW1iZXIgfCB1bmRlZmluZWQsXG4gIGNvZXJjZVZlYzI6ICh2YWx1ZTogYW55KSA9PiBbbnVtYmVyLCBudW1iZXJdIHwgdW5kZWZpbmVkLFxuICBybk1hdGVyaWFsOiBNYXRlcmlhbCxcbiAgYXBwbHlUZXh0dXJlOiAoXG4gICAgcGFyYW1OYW1lOiBzdHJpbmcsXG4gICAgb3B0aW9uczoge1xuICAgICAgdGV4Q29vcmRQYXJhbT86IHN0cmluZztcbiAgICAgIHRyYW5zZm9ybT86IHtcbiAgICAgICAgc2NhbGU/OiBzdHJpbmc7XG4gICAgICAgIG9mZnNldD86IHN0cmluZztcbiAgICAgICAgcm90YXRpb24/OiBzdHJpbmc7XG4gICAgICB9O1xuICAgICAgc2NhbGVQYXJhbT86IHN0cmluZztcbiAgICAgIHN0cmVuZ3RoUGFyYW0/OiBzdHJpbmc7XG4gICAgICBvbkFzc2lnbjogKGluZm86IGFueSkgPT4gdm9pZDtcbiAgICB9XG4gICkgPT4gdm9pZCxcbiAgbWF0ZXJpYWw6IEdsdGYyTWF0ZXJpYWxFeFxuKSB7XG4gIGNvbnN0IGFuaXNvdHJvcHlFeHRlbnNpb246IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge307XG4gIGxldCBhbmlzb3Ryb3B5RXh0ZW5zaW9uVXNlZCA9IGZhbHNlO1xuICBjb25zdCBtYXJrQW5pc290cm9weUV4dGVuc2lvblVzZWQgPSAoKSA9PiB7XG4gICAgaWYgKCFhbmlzb3Ryb3B5RXh0ZW5zaW9uVXNlZCkge1xuICAgICAgYW5pc290cm9weUV4dGVuc2lvblVzZWQgPSB0cnVlO1xuICAgICAgZW5zdXJlRXh0ZW5zaW9uVXNlZCgnS0hSX21hdGVyaWFsc19hbmlzb3Ryb3B5Jyk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IGFuaXNvdHJvcHlTdHJlbmd0aCA9IGNvZXJjZU51bWJlcihybk1hdGVyaWFsLmdldFBhcmFtZXRlcignYW5pc290cm9weVN0cmVuZ3RoJykpO1xuICBpZiAoSXMuZXhpc3QoYW5pc290cm9weVN0cmVuZ3RoKSkge1xuICAgIGFuaXNvdHJvcHlFeHRlbnNpb24uYW5pc290cm9weVN0cmVuZ3RoID0gYW5pc290cm9weVN0cmVuZ3RoO1xuICAgIGlmIChhbmlzb3Ryb3B5U3RyZW5ndGggIT09IDApIHtcbiAgICAgIG1hcmtBbmlzb3Ryb3B5RXh0ZW5zaW9uVXNlZCgpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGFuaXNvdHJvcHlSb3RhdGlvblZlY3RvciA9IGNvZXJjZVZlYzIocm5NYXRlcmlhbC5nZXRQYXJhbWV0ZXIoJ2FuaXNvdHJvcHlSb3RhdGlvbicpKTtcbiAgaWYgKElzLmV4aXN0KGFuaXNvdHJvcHlSb3RhdGlvblZlY3RvcikpIHtcbiAgICBjb25zdCBbeCwgeV0gPSBhbmlzb3Ryb3B5Um90YXRpb25WZWN0b3I7XG4gICAgY29uc3Qgcm90YXRpb24gPSBNYXRoLmF0YW4yKHksIHgpO1xuICAgIGlmIChOdW1iZXIuaXNGaW5pdGUocm90YXRpb24pKSB7XG4gICAgICBhbmlzb3Ryb3B5RXh0ZW5zaW9uLmFuaXNvdHJvcHlSb3RhdGlvbiA9IHJvdGF0aW9uO1xuICAgICAgaWYgKHJvdGF0aW9uICE9PSAwKSB7XG4gICAgICAgIG1hcmtBbmlzb3Ryb3B5RXh0ZW5zaW9uVXNlZCgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGFwcGx5VGV4dHVyZSgnYW5pc290cm9weVRleHR1cmUnLCB7XG4gICAgdGV4Q29vcmRQYXJhbTogJ2FuaXNvdHJvcHlUZXhjb29yZEluZGV4JyxcbiAgICB0cmFuc2Zvcm06IHtcbiAgICAgIHNjYWxlOiAnYW5pc290cm9weVRleHR1cmVUcmFuc2Zvcm1TY2FsZScsXG4gICAgICBvZmZzZXQ6ICdhbmlzb3Ryb3B5VGV4dHVyZVRyYW5zZm9ybU9mZnNldCcsXG4gICAgICByb3RhdGlvbjogJ2FuaXNvdHJvcHlUZXh0dXJlVHJhbnNmb3JtUm90YXRpb24nLFxuICAgIH0sXG4gICAgb25Bc3NpZ246IGluZm8gPT4ge1xuICAgICAgYW5pc290cm9weUV4dGVuc2lvbi5hbmlzb3Ryb3B5VGV4dHVyZSA9IGluZm87XG4gICAgICBtYXJrQW5pc290cm9weUV4dGVuc2lvblVzZWQoKTtcbiAgICB9LFxuICB9KTtcblxuICBjb25zdCBzaG91bGRBdHRhY2hBbmlzb3Ryb3B5RXh0ZW5zaW9uID1cbiAgICBhbmlzb3Ryb3B5RXh0ZW5zaW9uVXNlZCB8fFxuICAgIElzLmV4aXN0KGFuaXNvdHJvcHlFeHRlbnNpb24uYW5pc290cm9weVRleHR1cmUpIHx8XG4gICAgKElzLmV4aXN0KGFuaXNvdHJvcHlFeHRlbnNpb24uYW5pc290cm9weVN0cmVuZ3RoKSAmJiAoYW5pc290cm9weUV4dGVuc2lvbi5hbmlzb3Ryb3B5U3RyZW5ndGggYXMgbnVtYmVyKSAhPT0gMCkgfHxcbiAgICAoSXMuZXhpc3QoYW5pc290cm9weUV4dGVuc2lvbi5hbmlzb3Ryb3B5Um90YXRpb24pICYmIChhbmlzb3Ryb3B5RXh0ZW5zaW9uLmFuaXNvdHJvcHlSb3RhdGlvbiBhcyBudW1iZXIpICE9PSAwKTtcbiAgaWYgKHNob3VsZEF0dGFjaEFuaXNvdHJvcHlFeHRlbnNpb24pIHtcbiAgICBtYXRlcmlhbC5leHRlbnNpb25zID0gbWF0ZXJpYWwuZXh0ZW5zaW9ucyA/PyB7fTtcbiAgICBtYXRlcmlhbC5leHRlbnNpb25zLktIUl9tYXRlcmlhbHNfYW5pc290cm9weSA9IGFuaXNvdHJvcHlFeHRlbnNpb247XG4gICAgZW5zdXJlRXh0ZW5zaW9uVXNlZCgnS0hSX21hdGVyaWFsc19hbmlzb3Ryb3B5Jyk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9fb3V0cHV0S2hyTWF0ZXJpYWxzRGlzcGVyc2lvbkluZm8oXG4gIGVuc3VyZUV4dGVuc2lvblVzZWQ6IChleHRlbnNpb25OYW1lOiBzdHJpbmcpID0+IHZvaWQsXG4gIGNvZXJjZU51bWJlcjogKHZhbHVlOiBhbnkpID0+IG51bWJlciB8IHVuZGVmaW5lZCxcbiAgcm5NYXRlcmlhbDogTWF0ZXJpYWwsXG4gIG1hdGVyaWFsOiBHbHRmMk1hdGVyaWFsRXhcbikge1xuICBjb25zdCByYXdEaXNwZXJzaW9uID0gY29lcmNlTnVtYmVyKHJuTWF0ZXJpYWwuZ2V0UGFyYW1ldGVyKCdkaXNwZXJzaW9uJykpO1xuICBpZiAoSXMubm90LmV4aXN0KHJhd0Rpc3BlcnNpb24pKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgZGlzcGVyc2lvbiA9IE1hdGgubWF4KDAsIHJhd0Rpc3BlcnNpb24pO1xuICBpZiAoIU51bWJlci5pc0Zpbml0ZShkaXNwZXJzaW9uKSB8fCBkaXNwZXJzaW9uID09PSAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgbWF0ZXJpYWwuZXh0ZW5zaW9ucyA9IG1hdGVyaWFsLmV4dGVuc2lvbnMgPz8ge307XG4gIG1hdGVyaWFsLmV4dGVuc2lvbnMuS0hSX21hdGVyaWFsc19kaXNwZXJzaW9uID0ge1xuICAgIGRpc3BlcnNpb24sXG4gIH07XG4gIGVuc3VyZUV4dGVuc2lvblVzZWQoJ0tIUl9tYXRlcmlhbHNfZGlzcGVyc2lvbicpO1xuXG4gIGlmIChJcy5ub3QuZXhpc3QobWF0ZXJpYWwuZXh0ZW5zaW9ucy5LSFJfbWF0ZXJpYWxzX3ZvbHVtZSkpIHtcbiAgICBtYXRlcmlhbC5leHRlbnNpb25zLktIUl9tYXRlcmlhbHNfdm9sdW1lID0ge307XG4gIH1cbiAgZW5zdXJlRXh0ZW5zaW9uVXNlZCgnS0hSX21hdGVyaWFsc192b2x1bWUnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9fcmVtb3ZlVW51c2VkQWNjZXNzb3JzQW5kQnVmZmVyVmlld3MoanNvbjogR2x0ZjJFeCkge1xuICBpZiAoanNvbi5hY2Nlc3NvcnMubGVuZ3RoID09PSAwKSB7XG4gICAgX19yZWNhbGN1bGF0ZUJ1ZmZlclZpZXdBY2N1bXVsYXRvcnMoanNvbik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgX19yZW1vdmVVbnVzZWRBY2Nlc3NvcnMoanNvbik7XG5cbiAgaWYgKGpzb24uYnVmZmVyVmlld3MubGVuZ3RoID09PSAwKSB7XG4gICAgX19yZWNhbGN1bGF0ZUJ1ZmZlclZpZXdBY2N1bXVsYXRvcnMoanNvbik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgX19yZW1vdmVVbnVzZWRCdWZmZXJWaWV3cyhqc29uKTtcbiAgX19yZWNhbGN1bGF0ZUJ1ZmZlclZpZXdBY2N1bXVsYXRvcnMoanNvbik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX3JlbW92ZVVudXNlZEFjY2Vzc29ycyhqc29uOiBHbHRmMkV4KSB7XG4gIGNvbnN0IHVzZWRBY2Nlc3NvckluZGljZXMgPSBfX2NvbGxlY3RVc2VkQWNjZXNzb3JJbmRpY2VzKGpzb24pO1xuICBjb25zdCByZXN1bHQgPSBfX2ZpbHRlckl0ZW1zQnlVc2FnZShqc29uLmFjY2Vzc29ycywgdXNlZEFjY2Vzc29ySW5kaWNlcyk7XG4gIGlmICghcmVzdWx0KSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgeyBmaWx0ZXJlZCwgaW5kZXhNYXAgfSA9IHJlc3VsdDtcbiAganNvbi5hY2Nlc3NvcnMgPSBmaWx0ZXJlZDtcbiAgX19yZW1hcEFjY2Vzc29yUmVmZXJlbmNlcyhqc29uLCBpbmRleE1hcCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX2NvbGxlY3RVc2VkQWNjZXNzb3JJbmRpY2VzKGpzb246IEdsdGYyRXgpIHtcbiAgY29uc3QgdXNlZEFjY2Vzc29ySW5kaWNlcyA9IG5ldyBTZXQ8bnVtYmVyPigpO1xuICBjb25zdCByZWdpc3RlckFjY2Vzc29yID0gKGNhbmRpZGF0ZTogdW5rbm93bikgPT4ge1xuICAgIGlmICh0eXBlb2YgY2FuZGlkYXRlID09PSAnbnVtYmVyJyAmJiBjYW5kaWRhdGUgPj0gMCkge1xuICAgICAgdXNlZEFjY2Vzc29ySW5kaWNlcy5hZGQoY2FuZGlkYXRlKTtcbiAgICB9XG4gIH07XG5cbiAgX19jb2xsZWN0QWNjZXNzb3JJbmRpY2VzRnJvbU1lc2hlcyhqc29uLCByZWdpc3RlckFjY2Vzc29yKTtcbiAgX19jb2xsZWN0QWNjZXNzb3JJbmRpY2VzRnJvbVNraW5zKGpzb24sIHJlZ2lzdGVyQWNjZXNzb3IpO1xuICBfX2NvbGxlY3RBY2Nlc3NvckluZGljZXNGcm9tQW5pbWF0aW9ucyhqc29uLCByZWdpc3RlckFjY2Vzc29yKTtcblxuICByZXR1cm4gdXNlZEFjY2Vzc29ySW5kaWNlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9fY29sbGVjdEFjY2Vzc29ySW5kaWNlc0Zyb21NZXNoZXMoanNvbjogR2x0ZjJFeCwgcmVnaXN0ZXI6IChjYW5kaWRhdGU6IHVua25vd24pID0+IHZvaWQpIHtcbiAgaWYgKElzLm5vdC5leGlzdChqc29uLm1lc2hlcykpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgZm9yIChjb25zdCBtZXNoIG9mIGpzb24ubWVzaGVzKSB7XG4gICAgaWYgKElzLm5vdC5leGlzdChtZXNoPy5wcmltaXRpdmVzKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGZvciAoY29uc3QgcHJpbWl0aXZlIG9mIG1lc2gucHJpbWl0aXZlcykge1xuICAgICAgcmVnaXN0ZXIocHJpbWl0aXZlLmluZGljZXMpO1xuICAgICAgY29uc3QgYXR0cmlidXRlcyA9IHByaW1pdGl2ZS5hdHRyaWJ1dGVzIGFzIFJlY29yZDxzdHJpbmcsIG51bWJlciB8IHVuZGVmaW5lZD4gfCB1bmRlZmluZWQ7XG4gICAgICBpZiAoSXMuZXhpc3QoYXR0cmlidXRlcykpIHtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoYXR0cmlidXRlcykpIHtcbiAgICAgICAgICByZWdpc3RlcihhdHRyaWJ1dGVzW2tleV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShwcmltaXRpdmUudGFyZ2V0cykpIHtcbiAgICAgICAgZm9yIChjb25zdCB0YXJnZXQgb2YgcHJpbWl0aXZlLnRhcmdldHMpIHtcbiAgICAgICAgICBjb25zdCB0YXJnZXRBdHRyaWJ1dGVzID0gdGFyZ2V0IGFzIFJlY29yZDxzdHJpbmcsIG51bWJlciB8IHVuZGVmaW5lZD47XG4gICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXModGFyZ2V0QXR0cmlidXRlcykpIHtcbiAgICAgICAgICAgIHJlZ2lzdGVyKHRhcmdldEF0dHJpYnV0ZXNba2V5XSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX2NvbGxlY3RBY2Nlc3NvckluZGljZXNGcm9tU2tpbnMoanNvbjogR2x0ZjJFeCwgcmVnaXN0ZXI6IChjYW5kaWRhdGU6IHVua25vd24pID0+IHZvaWQpIHtcbiAgaWYgKElzLm5vdC5leGlzdChqc29uLnNraW5zKSkge1xuICAgIHJldHVybjtcbiAgfVxuICBmb3IgKGNvbnN0IHNraW4gb2YganNvbi5za2lucykge1xuICAgIHJlZ2lzdGVyKHNraW4uaW52ZXJzZUJpbmRNYXRyaWNlcyk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9fY29sbGVjdEFjY2Vzc29ySW5kaWNlc0Zyb21BbmltYXRpb25zKGpzb246IEdsdGYyRXgsIHJlZ2lzdGVyOiAoY2FuZGlkYXRlOiB1bmtub3duKSA9PiB2b2lkKSB7XG4gIGlmIChJcy5ub3QuZXhpc3QoanNvbi5hbmltYXRpb25zKSkge1xuICAgIHJldHVybjtcbiAgfVxuICBmb3IgKGNvbnN0IGFuaW1hdGlvbiBvZiBqc29uLmFuaW1hdGlvbnMpIHtcbiAgICBpZiAoSXMubm90LmV4aXN0KGFuaW1hdGlvbj8uc2FtcGxlcnMpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBzYW1wbGVyIG9mIGFuaW1hdGlvbi5zYW1wbGVycykge1xuICAgICAgcmVnaXN0ZXIoc2FtcGxlci5pbnB1dCk7XG4gICAgICByZWdpc3RlcihzYW1wbGVyLm91dHB1dCk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX3JlbWFwQWNjZXNzb3JSZWZlcmVuY2VzKGpzb246IEdsdGYyRXgsIGluZGV4TWFwOiBNYXA8bnVtYmVyLCBudW1iZXI+KSB7XG4gIGNvbnN0IG1hcEFjY2Vzc29ySW5kZXggPSAoY2FuZGlkYXRlOiB1bmtub3duKTogbnVtYmVyIHwgdW5kZWZpbmVkID0+IHtcbiAgICBpZiAodHlwZW9mIGNhbmRpZGF0ZSAhPT0gJ251bWJlcicpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiBpbmRleE1hcC5nZXQoY2FuZGlkYXRlKTtcbiAgfTtcblxuICBpZiAoSXMuZXhpc3QoanNvbi5tZXNoZXMpKSB7XG4gICAgZm9yIChjb25zdCBtZXNoIG9mIGpzb24ubWVzaGVzKSB7XG4gICAgICBpZiAoSXMubm90LmV4aXN0KG1lc2g/LnByaW1pdGl2ZXMpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgZm9yIChjb25zdCBwcmltaXRpdmUgb2YgbWVzaC5wcmltaXRpdmVzKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcHJpbWl0aXZlLmluZGljZXMgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgY29uc3QgbWFwcGVkID0gbWFwQWNjZXNzb3JJbmRleChwcmltaXRpdmUuaW5kaWNlcyk7XG4gICAgICAgICAgcHJpbWl0aXZlLmluZGljZXMgPSB0eXBlb2YgbWFwcGVkID09PSAnbnVtYmVyJyA/IG1hcHBlZCA6IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhdHRyaWJ1dGVzID0gcHJpbWl0aXZlLmF0dHJpYnV0ZXMgYXMgUmVjb3JkPHN0cmluZywgbnVtYmVyIHwgdW5kZWZpbmVkPiB8IHVuZGVmaW5lZDtcbiAgICAgICAgX19yZW1hcEFjY2Vzc29yQXR0cmlidXRlUmVjb3JkKGF0dHJpYnV0ZXMsIG1hcEFjY2Vzc29ySW5kZXgpO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShwcmltaXRpdmUudGFyZ2V0cykpIHtcbiAgICAgICAgICBmb3IgKGNvbnN0IHRhcmdldCBvZiBwcmltaXRpdmUudGFyZ2V0cykge1xuICAgICAgICAgICAgX19yZW1hcEFjY2Vzc29yQXR0cmlidXRlUmVjb3JkKHRhcmdldCBhcyBSZWNvcmQ8c3RyaW5nLCBudW1iZXIgfCB1bmRlZmluZWQ+LCBtYXBBY2Nlc3NvckluZGV4KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoSXMuZXhpc3QoanNvbi5za2lucykpIHtcbiAgICBmb3IgKGNvbnN0IHNraW4gb2YganNvbi5za2lucykge1xuICAgICAgaWYgKHR5cGVvZiBza2luLmludmVyc2VCaW5kTWF0cmljZXMgPT09ICdudW1iZXInKSB7XG4gICAgICAgIGNvbnN0IG1hcHBlZCA9IG1hcEFjY2Vzc29ySW5kZXgoc2tpbi5pbnZlcnNlQmluZE1hdHJpY2VzKTtcbiAgICAgICAgc2tpbi5pbnZlcnNlQmluZE1hdHJpY2VzID0gdHlwZW9mIG1hcHBlZCA9PT0gJ251bWJlcicgPyBtYXBwZWQgOiB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKElzLmV4aXN0KGpzb24uYW5pbWF0aW9ucykpIHtcbiAgICBmb3IgKGNvbnN0IGFuaW1hdGlvbiBvZiBqc29uLmFuaW1hdGlvbnMpIHtcbiAgICAgIGlmIChJcy5ub3QuZXhpc3QoYW5pbWF0aW9uPy5zYW1wbGVycykpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBmb3IgKGNvbnN0IHNhbXBsZXIgb2YgYW5pbWF0aW9uLnNhbXBsZXJzKSB7XG4gICAgICAgIGNvbnN0IG1hcHBlZElucHV0ID0gbWFwQWNjZXNzb3JJbmRleChzYW1wbGVyLmlucHV0KTtcbiAgICAgICAgY29uc3QgbWFwcGVkT3V0cHV0ID0gbWFwQWNjZXNzb3JJbmRleChzYW1wbGVyLm91dHB1dCk7XG4gICAgICAgIGlmICh0eXBlb2YgbWFwcGVkSW5wdXQgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgc2FtcGxlci5pbnB1dCA9IG1hcHBlZElucHV0O1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgbWFwcGVkT3V0cHV0ID09PSAnbnVtYmVyJykge1xuICAgICAgICAgIHNhbXBsZXIub3V0cHV0ID0gbWFwcGVkT3V0cHV0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX3JlbWFwQWNjZXNzb3JBdHRyaWJ1dGVSZWNvcmQoXG4gIGF0dHJpYnV0ZXM6IFJlY29yZDxzdHJpbmcsIG51bWJlciB8IHVuZGVmaW5lZD4gfCB1bmRlZmluZWQsXG4gIG1hcEFjY2Vzc29ySW5kZXg6IChjYW5kaWRhdGU6IHVua25vd24pID0+IG51bWJlciB8IHVuZGVmaW5lZFxuKSB7XG4gIGlmIChJcy5ub3QuZXhpc3QoYXR0cmlidXRlcykpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoYXR0cmlidXRlcykpIHtcbiAgICBjb25zdCBtYXBwZWQgPSBtYXBBY2Nlc3NvckluZGV4KGF0dHJpYnV0ZXNba2V5XSk7XG4gICAgaWYgKHR5cGVvZiBtYXBwZWQgPT09ICdudW1iZXInKSB7XG4gICAgICBhdHRyaWJ1dGVzW2tleV0gPSBtYXBwZWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlbGV0ZSBhdHRyaWJ1dGVzW2tleV07XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX3JlbW92ZVVudXNlZEJ1ZmZlclZpZXdzKGpzb246IEdsdGYyRXgpIHtcbiAgY29uc3QgdXNlZEJ1ZmZlclZpZXdJbmRpY2VzID0gX19jb2xsZWN0VXNlZEJ1ZmZlclZpZXdJbmRpY2VzKGpzb24pO1xuICBjb25zdCByZXN1bHQgPSBfX2ZpbHRlckl0ZW1zQnlVc2FnZShqc29uLmJ1ZmZlclZpZXdzLCB1c2VkQnVmZmVyVmlld0luZGljZXMpO1xuICBpZiAoIXJlc3VsdCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHsgZmlsdGVyZWQsIGluZGV4TWFwIH0gPSByZXN1bHQ7XG4gIGpzb24uYnVmZmVyVmlld3MgPSBmaWx0ZXJlZDtcbiAgX19yZW1hcEJ1ZmZlclZpZXdSZWZlcmVuY2VzKGpzb24sIGluZGV4TWFwKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9fY29sbGVjdFVzZWRCdWZmZXJWaWV3SW5kaWNlcyhqc29uOiBHbHRmMkV4KSB7XG4gIGNvbnN0IHVzZWRCdWZmZXJWaWV3SW5kaWNlcyA9IG5ldyBTZXQ8bnVtYmVyPigpO1xuICBmb3IgKGNvbnN0IGFjY2Vzc29yIG9mIGpzb24uYWNjZXNzb3JzKSB7XG4gICAgaWYgKHR5cGVvZiBhY2Nlc3Nvci5idWZmZXJWaWV3ID09PSAnbnVtYmVyJykge1xuICAgICAgdXNlZEJ1ZmZlclZpZXdJbmRpY2VzLmFkZChhY2Nlc3Nvci5idWZmZXJWaWV3KTtcbiAgICB9XG4gIH1cbiAgaWYgKElzLmV4aXN0KGpzb24uaW1hZ2VzKSkge1xuICAgIGZvciAoY29uc3QgaW1hZ2Ugb2YganNvbi5pbWFnZXMpIHtcbiAgICAgIGlmICh0eXBlb2YgaW1hZ2UuYnVmZmVyVmlldyA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgdXNlZEJ1ZmZlclZpZXdJbmRpY2VzLmFkZChpbWFnZS5idWZmZXJWaWV3KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHVzZWRCdWZmZXJWaWV3SW5kaWNlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9fcmVtYXBCdWZmZXJWaWV3UmVmZXJlbmNlcyhqc29uOiBHbHRmMkV4LCBpbmRleE1hcDogTWFwPG51bWJlciwgbnVtYmVyPikge1xuICBmb3IgKGNvbnN0IGFjY2Vzc29yIG9mIGpzb24uYWNjZXNzb3JzKSB7XG4gICAgaWYgKHR5cGVvZiBhY2Nlc3Nvci5idWZmZXJWaWV3ID09PSAnbnVtYmVyJykge1xuICAgICAgY29uc3QgbWFwcGVkID0gaW5kZXhNYXAuZ2V0KGFjY2Vzc29yLmJ1ZmZlclZpZXcpO1xuICAgICAgYWNjZXNzb3IuYnVmZmVyVmlldyA9IHR5cGVvZiBtYXBwZWQgPT09ICdudW1iZXInID8gbWFwcGVkIDogdW5kZWZpbmVkO1xuICAgIH1cbiAgfVxuXG4gIGlmIChJcy5leGlzdChqc29uLmltYWdlcykpIHtcbiAgICBmb3IgKGNvbnN0IGltYWdlIG9mIGpzb24uaW1hZ2VzKSB7XG4gICAgICBpZiAodHlwZW9mIGltYWdlLmJ1ZmZlclZpZXcgPT09ICdudW1iZXInKSB7XG4gICAgICAgIGNvbnN0IG1hcHBlZCA9IGluZGV4TWFwLmdldChpbWFnZS5idWZmZXJWaWV3KTtcbiAgICAgICAgaW1hZ2UuYnVmZmVyVmlldyA9IHR5cGVvZiBtYXBwZWQgPT09ICdudW1iZXInID8gbWFwcGVkIDogdW5kZWZpbmVkO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gX19maWx0ZXJJdGVtc0J5VXNhZ2U8VD4oXG4gIGl0ZW1zOiBUW10sXG4gIHVzZWRJbmRpY2VzOiBTZXQ8bnVtYmVyPlxuKTogeyBmaWx0ZXJlZDogVFtdOyBpbmRleE1hcDogTWFwPG51bWJlciwgbnVtYmVyPiB9IHwgdW5kZWZpbmVkIHtcbiAgaWYgKHVzZWRJbmRpY2VzLnNpemUgPT09IGl0ZW1zLmxlbmd0aCkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBjb25zdCBmaWx0ZXJlZDogVFtdID0gW107XG4gIGNvbnN0IGluZGV4TWFwID0gbmV3IE1hcDxudW1iZXIsIG51bWJlcj4oKTtcbiAgaXRlbXMuZm9yRWFjaCgoaXRlbSwgaWR4KSA9PiB7XG4gICAgaWYgKHVzZWRJbmRpY2VzLmhhcyhpZHgpKSB7XG4gICAgICBpbmRleE1hcC5zZXQoaWR4LCBmaWx0ZXJlZC5sZW5ndGgpO1xuICAgICAgZmlsdGVyZWQucHVzaChpdGVtKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiB7IGZpbHRlcmVkLCBpbmRleE1hcCB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gX19yZWNhbGN1bGF0ZUJ1ZmZlclZpZXdBY2N1bXVsYXRvcnMoanNvbjogR2x0ZjJFeCkge1xuICBpZiAoSXMubm90LmV4aXN0KGpzb24uYnVmZmVycykgfHwganNvbi5idWZmZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgIGpzb24uZXh0cmFzLmJ1ZmZlclZpZXdCeXRlTGVuZ3RoQWNjdW11bGF0ZWRBcnJheSA9IFtdO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGFjY3VtdWxhdG9ycyA9IG5ldyBBcnJheShqc29uLmJ1ZmZlcnMubGVuZ3RoKS5maWxsKDApO1xuICBmb3IgKGNvbnN0IGJ1ZmZlclZpZXcgb2YganNvbi5idWZmZXJWaWV3cykge1xuICAgIGNvbnN0IGJ1ZmZlcklkeCA9IHR5cGVvZiBidWZmZXJWaWV3LmJ1ZmZlciA9PT0gJ251bWJlcicgPyBidWZmZXJWaWV3LmJ1ZmZlciA6IDA7XG4gICAgY29uc3Qgc291cmNlTGVuZ3RoID0gYnVmZmVyVmlldy5leHRyYXM/LnVpbnQ4QXJyYXk/LmJ5dGVMZW5ndGg7XG4gICAgY29uc3QgZWZmZWN0aXZlTGVuZ3RoID0gTWF0aC5tYXgoYnVmZmVyVmlldy5ieXRlTGVuZ3RoLCBJcy5leGlzdChzb3VyY2VMZW5ndGgpID8gc291cmNlTGVuZ3RoISA6IDApO1xuICAgIGNvbnN0IGFsaWduZWRMZW5ndGggPSBEYXRhVXRpbC5hZGRQYWRkaW5nQnl0ZXMoZWZmZWN0aXZlTGVuZ3RoLCA0KTtcbiAgICBhY2N1bXVsYXRvcnNbYnVmZmVySWR4XSArPSBhbGlnbmVkTGVuZ3RoO1xuICB9XG4gIGpzb24uZXh0cmFzLmJ1ZmZlclZpZXdCeXRlTGVuZ3RoQWNjdW11bGF0ZWRBcnJheSA9IGFjY3VtdWxhdG9ycztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9fc2V0dXBNYXRlcmlhbEJhc2ljUHJvcGVydGllcyhtYXRlcmlhbDogR2x0ZjJNYXRlcmlhbEV4LCBybk1hdGVyaWFsOiBNYXRlcmlhbCwganNvbjogR2x0ZjJFeCkge1xuICBjb25zdCBpc1VubGl0TWF0ZXJpYWwgPSBJcy5mYWxzZShybk1hdGVyaWFsLmlzTGlnaHRpbmcpO1xuXG4gIGlmIChpc1VubGl0TWF0ZXJpYWwpIHtcbiAgICBpZiAoSXMubm90LmV4aXN0KG1hdGVyaWFsLmV4dGVuc2lvbnMpKSB7XG4gICAgICBtYXRlcmlhbC5leHRlbnNpb25zID0ge307XG4gICAgfVxuICAgIG1hdGVyaWFsLmV4dGVuc2lvbnMuS0hSX21hdGVyaWFsc191bmxpdCA9IHt9O1xuICAgIGlmIChqc29uLmV4dGVuc2lvbnNVc2VkLmluZGV4T2YoJ0tIUl9tYXRlcmlhbHNfdW5saXQnKSA8IDApIHtcbiAgICAgIGpzb24uZXh0ZW5zaW9uc1VzZWQucHVzaCgnS0hSX21hdGVyaWFsc191bmxpdCcpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGJhc2VDb2xvclBhcmFtID1cbiAgICAocm5NYXRlcmlhbC5nZXRQYXJhbWV0ZXIoJ2Jhc2VDb2xvckZhY3RvcicpIGFzIFZlY3RvcjQgfCB1bmRlZmluZWQpID8/XG4gICAgKHJuTWF0ZXJpYWwuZ2V0UGFyYW1ldGVyKCdkaWZmdXNlQ29sb3JGYWN0b3InKSBhcyBWZWN0b3I0IHwgdW5kZWZpbmVkKSA/P1xuICAgIFZlY3RvcjQuZnJvbUNvcHk0KDEsIDEsIDEsIDEpO1xuICBtYXRlcmlhbC5wYnJNZXRhbGxpY1JvdWdobmVzcy5iYXNlQ29sb3JGYWN0b3IgPSBbXG4gICAgYmFzZUNvbG9yUGFyYW0ueCxcbiAgICBiYXNlQ29sb3JQYXJhbS55LFxuICAgIGJhc2VDb2xvclBhcmFtLnosXG4gICAgYmFzZUNvbG9yUGFyYW0udyxcbiAgXTtcblxuICBjb25zdCBtZXRhbGxpY1ZhbHVlID0gX19leHRyYWN0U2NhbGFyUGFyYW1ldGVyKHJuTWF0ZXJpYWwuZ2V0UGFyYW1ldGVyKCdtZXRhbGxpY0ZhY3RvcicpKTtcbiAgaWYgKElzLmV4aXN0KG1ldGFsbGljVmFsdWUpKSB7XG4gICAgbWF0ZXJpYWwucGJyTWV0YWxsaWNSb3VnaG5lc3MubWV0YWxsaWNGYWN0b3IgPSBtZXRhbGxpY1ZhbHVlIGFzIG51bWJlcjtcbiAgfVxuXG4gIGNvbnN0IHJvdWdobmVzc1ZhbHVlID0gX19leHRyYWN0U2NhbGFyUGFyYW1ldGVyKHJuTWF0ZXJpYWwuZ2V0UGFyYW1ldGVyKCdyb3VnaG5lc3NGYWN0b3InKSk7XG4gIGlmIChJcy5leGlzdChyb3VnaG5lc3NWYWx1ZSkpIHtcbiAgICBtYXRlcmlhbC5wYnJNZXRhbGxpY1JvdWdobmVzcy5yb3VnaG5lc3NGYWN0b3IgPSByb3VnaG5lc3NWYWx1ZSBhcyBudW1iZXI7XG4gIH1cblxuICBjb25zdCBlbWlzc2l2ZVBhcmFtID0gcm5NYXRlcmlhbC5nZXRQYXJhbWV0ZXIoJ2VtaXNzaXZlRmFjdG9yJykgYXMgVmVjdG9yMyB8IHVuZGVmaW5lZDtcbiAgaWYgKElzLmV4aXN0KGVtaXNzaXZlUGFyYW0pKSB7XG4gICAgbWF0ZXJpYWwuZW1pc3NpdmVGYWN0b3IgPSBbZW1pc3NpdmVQYXJhbS54LCBlbWlzc2l2ZVBhcmFtLnksIGVtaXNzaXZlUGFyYW0uel07XG4gIH1cblxuICBtYXRlcmlhbC5hbHBoYU1vZGUgPSBybk1hdGVyaWFsLmFscGhhTW9kZS50b0dsdGZTdHJpbmcoKTtcblxuICBpZiAoaXNVbmxpdE1hdGVyaWFsKSB7XG4gICAgbWF0ZXJpYWwucGJyTWV0YWxsaWNSb3VnaG5lc3MubWV0YWxsaWNGYWN0b3IgPSAwO1xuICAgIGNvbnN0IGN1cnJlbnRSb3VnaG5lc3MgPSBtYXRlcmlhbC5wYnJNZXRhbGxpY1JvdWdobmVzcy5yb3VnaG5lc3NGYWN0b3IgPz8gMTtcbiAgICBtYXRlcmlhbC5wYnJNZXRhbGxpY1JvdWdobmVzcy5yb3VnaG5lc3NGYWN0b3IgPSBNYXRoLm1heChjdXJyZW50Um91Z2huZXNzLCAwLjUpO1xuICAgIG1hdGVyaWFsLmVtaXNzaXZlRmFjdG9yID0gWzAsIDAsIDBdO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX291dHB1dEJhc2VNYXRlcmlhbEluZm8oXG4gIHJuTWF0ZXJpYWw6IE1hdGVyaWFsLFxuICBhcHBseVRleHR1cmU6IChcbiAgICBwYXJhbU5hbWU6IHN0cmluZyxcbiAgICBvcHRpb25zOiB7XG4gICAgICB0ZXhDb29yZFBhcmFtPzogc3RyaW5nO1xuICAgICAgdHJhbnNmb3JtPzoge1xuICAgICAgICBzY2FsZT86IHN0cmluZztcbiAgICAgICAgb2Zmc2V0Pzogc3RyaW5nO1xuICAgICAgICByb3RhdGlvbj86IHN0cmluZztcbiAgICAgIH07XG4gICAgICBzY2FsZVBhcmFtPzogc3RyaW5nO1xuICAgICAgc3RyZW5ndGhQYXJhbT86IHN0cmluZztcbiAgICAgIG9uQXNzaWduOiAoaW5mbzogYW55KSA9PiB2b2lkO1xuICAgIH1cbiAgKSA9PiB2b2lkLFxuICBtYXRlcmlhbDogR2x0ZjJNYXRlcmlhbEV4LFxuICBqc29uOiBHbHRmMkV4LFxuICBvcHRpb25zPzoge1xuICAgIHNraXBBZGRpdGlvbmFsVGV4dHVyZXM/OiBib29sZWFuO1xuICB9XG4pIHtcbiAgY29uc3Qgc2tpcEFkZGl0aW9uYWxUZXh0dXJlcyA9IG9wdGlvbnM/LnNraXBBZGRpdGlvbmFsVGV4dHVyZXMgPz8gZmFsc2U7XG5cbiAgX19zZXR1cE1hdGVyaWFsQmFzaWNQcm9wZXJ0aWVzKG1hdGVyaWFsLCBybk1hdGVyaWFsLCBqc29uKTtcblxuICBjb25zdCBoYXNCYXNlQ29sb3JUZXh0dXJlID0gSXMuZXhpc3Qocm5NYXRlcmlhbC5nZXRUZXh0dXJlUGFyYW1ldGVyKCdiYXNlQ29sb3JUZXh0dXJlJykpO1xuXG4gIGFwcGx5VGV4dHVyZSgnYmFzZUNvbG9yVGV4dHVyZScsIHtcbiAgICB0ZXhDb29yZFBhcmFtOiAnYmFzZUNvbG9yVGV4Y29vcmRJbmRleCcsXG4gICAgdHJhbnNmb3JtOiB7XG4gICAgICBzY2FsZTogJ2Jhc2VDb2xvclRleHR1cmVUcmFuc2Zvcm1TY2FsZScsXG4gICAgICBvZmZzZXQ6ICdiYXNlQ29sb3JUZXh0dXJlVHJhbnNmb3JtT2Zmc2V0JyxcbiAgICAgIHJvdGF0aW9uOiAnYmFzZUNvbG9yVGV4dHVyZVRyYW5zZm9ybVJvdGF0aW9uJyxcbiAgICB9LFxuICAgIG9uQXNzaWduOiBpbmZvID0+IHtcbiAgICAgIG1hdGVyaWFsLnBick1ldGFsbGljUm91Z2huZXNzLmJhc2VDb2xvclRleHR1cmUgPSBpbmZvO1xuICAgIH0sXG4gIH0pO1xuXG4gIGlmICghaGFzQmFzZUNvbG9yVGV4dHVyZSkge1xuICAgIGFwcGx5VGV4dHVyZSgnZGlmZnVzZUNvbG9yVGV4dHVyZScsIHtcbiAgICAgIHRleENvb3JkUGFyYW06ICdiYXNlQ29sb3JUZXhjb29yZEluZGV4JyxcbiAgICAgIHRyYW5zZm9ybToge1xuICAgICAgICBzY2FsZTogJ2Jhc2VDb2xvclRleHR1cmVUcmFuc2Zvcm1TY2FsZScsXG4gICAgICAgIG9mZnNldDogJ2Jhc2VDb2xvclRleHR1cmVUcmFuc2Zvcm1PZmZzZXQnLFxuICAgICAgICByb3RhdGlvbjogJ2Jhc2VDb2xvclRleHR1cmVUcmFuc2Zvcm1Sb3RhdGlvbicsXG4gICAgICB9LFxuICAgICAgb25Bc3NpZ246IGluZm8gPT4ge1xuICAgICAgICBpZiAoSXMubm90LmV4aXN0KG1hdGVyaWFsLnBick1ldGFsbGljUm91Z2huZXNzLmJhc2VDb2xvclRleHR1cmUpKSB7XG4gICAgICAgICAgbWF0ZXJpYWwucGJyTWV0YWxsaWNSb3VnaG5lc3MuYmFzZUNvbG9yVGV4dHVyZSA9IGluZm87XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICBpZiAoc2tpcEFkZGl0aW9uYWxUZXh0dXJlcykge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGFwcGx5VGV4dHVyZSgnbWV0YWxsaWNSb3VnaG5lc3NUZXh0dXJlJywge1xuICAgIHRleENvb3JkUGFyYW06ICdtZXRhbGxpY1JvdWdobmVzc1RleGNvb3JkSW5kZXgnLFxuICAgIHRyYW5zZm9ybToge1xuICAgICAgc2NhbGU6ICdtZXRhbGxpY1JvdWdobmVzc1RleHR1cmVUcmFuc2Zvcm1TY2FsZScsXG4gICAgICBvZmZzZXQ6ICdtZXRhbGxpY1JvdWdobmVzc1RleHR1cmVUcmFuc2Zvcm1PZmZzZXQnLFxuICAgICAgcm90YXRpb246ICdtZXRhbGxpY1JvdWdobmVzc1RleHR1cmVUcmFuc2Zvcm1Sb3RhdGlvbicsXG4gICAgfSxcbiAgICBvbkFzc2lnbjogaW5mbyA9PiB7XG4gICAgICBtYXRlcmlhbC5wYnJNZXRhbGxpY1JvdWdobmVzcy5tZXRhbGxpY1JvdWdobmVzc1RleHR1cmUgPSBpbmZvO1xuICAgIH0sXG4gIH0pO1xuXG4gIGFwcGx5VGV4dHVyZSgnbm9ybWFsVGV4dHVyZScsIHtcbiAgICB0ZXhDb29yZFBhcmFtOiAnbm9ybWFsVGV4Y29vcmRJbmRleCcsXG4gICAgdHJhbnNmb3JtOiB7XG4gICAgICBzY2FsZTogJ25vcm1hbFRleHR1cmVUcmFuc2Zvcm1TY2FsZScsXG4gICAgICBvZmZzZXQ6ICdub3JtYWxUZXh0dXJlVHJhbnNmb3JtT2Zmc2V0JyxcbiAgICAgIHJvdGF0aW9uOiAnbm9ybWFsVGV4dHVyZVRyYW5zZm9ybVJvdGF0aW9uJyxcbiAgICB9LFxuICAgIHNjYWxlUGFyYW06ICdub3JtYWxTY2FsZScsXG4gICAgb25Bc3NpZ246IGluZm8gPT4ge1xuICAgICAgbWF0ZXJpYWwubm9ybWFsVGV4dHVyZSA9IGluZm87XG4gICAgfSxcbiAgfSk7XG5cbiAgYXBwbHlUZXh0dXJlKCdvY2NsdXNpb25UZXh0dXJlJywge1xuICAgIHRleENvb3JkUGFyYW06ICdvY2NsdXNpb25UZXhjb29yZEluZGV4JyxcbiAgICB0cmFuc2Zvcm06IHtcbiAgICAgIHNjYWxlOiAnb2NjbHVzaW9uVGV4dHVyZVRyYW5zZm9ybVNjYWxlJyxcbiAgICAgIG9mZnNldDogJ29jY2x1c2lvblRleHR1cmVUcmFuc2Zvcm1PZmZzZXQnLFxuICAgICAgcm90YXRpb246ICdvY2NsdXNpb25UZXh0dXJlVHJhbnNmb3JtUm90YXRpb24nLFxuICAgIH0sXG4gICAgc3RyZW5ndGhQYXJhbTogJ29jY2x1c2lvblN0cmVuZ3RoJyxcbiAgICBvbkFzc2lnbjogaW5mbyA9PiB7XG4gICAgICBtYXRlcmlhbC5vY2NsdXNpb25UZXh0dXJlID0gaW5mbztcbiAgICB9LFxuICB9KTtcblxuICBhcHBseVRleHR1cmUoJ2VtaXNzaXZlVGV4dHVyZScsIHtcbiAgICB0ZXhDb29yZFBhcmFtOiAnZW1pc3NpdmVUZXhjb29yZEluZGV4JyxcbiAgICB0cmFuc2Zvcm06IHtcbiAgICAgIHNjYWxlOiAnZW1pc3NpdmVUZXh0dXJlVHJhbnNmb3JtU2NhbGUnLFxuICAgICAgb2Zmc2V0OiAnZW1pc3NpdmVUZXh0dXJlVHJhbnNmb3JtT2Zmc2V0JyxcbiAgICAgIHJvdGF0aW9uOiAnZW1pc3NpdmVUZXh0dXJlVHJhbnNmb3JtUm90YXRpb24nLFxuICAgIH0sXG4gICAgb25Bc3NpZ246IGluZm8gPT4ge1xuICAgICAgbWF0ZXJpYWwuZW1pc3NpdmVUZXh0dXJlID0gaW5mbztcbiAgICB9LFxuICB9KTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUEyQkEsU0FBUyxpQkFBaUIsK0JBQStCO0FBQ3pELFNBQVMsaUJBQW1FO0FBQzVFLFNBQVMscUJBQXNEO0FBQy9ELFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMscUJBQXFCO0FBRTlCLFNBQVMsdUJBQXVCO0FBS2hDLFNBQVMsZUFBZTtBQUN4QixTQUFTLGdCQUFnQjtBQUN6QixTQUFTLGNBQWM7QUFDdkIsU0FBUyxrQkFBa0I7QUFDM0IsU0FBUyxnQkFBZ0I7QUFDekIsU0FBUyxVQUFVO0FBeUJaLFNBQVMsNEJBQ2QsTUFDQSxXQUNBLFlBQ21CO0FBQ25CLFFBQU0sa0NBQWtDLEtBQUssT0FBTyxxQ0FBcUMsU0FBUztBQUNsRyxRQUFNLG1CQUFzQztBQUFBLElBQzFDLFFBQVE7QUFBQSxJQUNSLFlBQVksV0FBVztBQUFBLElBQ3ZCLFlBQVk7QUFBQSxJQUNaLFFBQVE7QUFBQSxNQUNOO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFFQSxRQUFNLHVDQUNKLFNBQVMsZ0JBQWdCLGlCQUFpQixZQUFZLENBQUMsSUFBSTtBQUU3RCxPQUFLLFlBQVksS0FBSyxnQkFBZ0I7QUFDdEMsT0FBSyxPQUFPLHFDQUFxQyxTQUFTLElBQUk7QUFDOUQsU0FBTztBQUNUO0FBY08sU0FBUywrQkFDZCxzQ0FDQSxnQkFDQSxpQkFDUTtBQUNSLFFBQU0sMEJBQTBCLEdBQUcsTUFBTSxxQ0FBcUMsY0FBYyxDQUFDLElBQ3pGLHFDQUFxQyxjQUFjLElBQUksU0FBUyxnQkFBZ0IsZ0JBQWdCLFlBQVksQ0FBQyxJQUM3RyxTQUFTLGdCQUFnQixnQkFBZ0IsWUFBWSxDQUFDO0FBRTFELFNBQU87QUFDVDtBQVNPLFNBQVMsK0JBQStCLE1BQWlEO0FBQzlGLFVBQVEsTUFBTTtBQUFBLElB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
