// src/webgl/debug/ShaderParameterDebugger.ts
import { Component } from "../../foundation/core/Component.js";
import { BufferUse } from "../../foundation/definitions/BufferUse.js";
import { CompositionType } from "../../foundation/definitions/CompositionType.js";
import { ProcessApproach } from "../../foundation/definitions/ProcessApproach.js";
import {
  decodeComponentMember,
  decodeGlobalProperty,
  decodeMaterialProperty,
  decodeVariableLengthComponentMember
} from "./BufferLayoutDecoder.js";
var MAX_ARRAY_ELEMENTS = 4;
var MAX_SERIALIZED_ARRAY_LENGTH = 16;
function getBackend(engine) {
  if (ProcessApproach.isWebGL2Approach(engine.processApproach)) {
    return "WebGL2";
  }
  if (ProcessApproach.isWebGpuApproach(engine.processApproach)) {
    return "WebGPU";
  }
  return "None";
}
function getBufferWidth(engine, backend) {
  var _a, _b;
  if (backend !== "WebGL2") {
    return 0;
  }
  try {
    return (_b = (_a = engine.getCurrentWebGLContextWrapper()) == null ? void 0 : _a.getMaxTextureSize()) != null ? _b : 0;
  } catch (_e) {
    return 0;
  }
}
function createLayoutSource(engine, width) {
  const read = (byteOffset, count) => engine.memoryManager.readFloat32Array(BufferUse.GPUInstanceData, byteOffset, count);
  return {
    width,
    readVec4: (vec4Index) => {
      const values = read(vec4Index * 16, 4);
      if (values == null) {
        return null;
      }
      return [values[0], values[1], values[2], values[3]];
    },
    readScalar: (scalarIndex) => {
      const values = read(scalarIndex * 4, 1);
      return values == null ? null : values[0];
    }
  };
}
function serializeTypedArray(array) {
  const length = Math.min(array.length, MAX_SERIALIZED_ARRAY_LENGTH);
  const values = [];
  for (let i = 0; i < length; i++) {
    values.push(array[i]);
  }
  if (array.length > MAX_SERIALIZED_ARRAY_LENGTH) {
    return { values, length: array.length, truncated: true };
  }
  return values;
}
function serializeArray(array) {
  const length = Math.min(array.length, MAX_SERIALIZED_ARRAY_LENGTH);
  const values = [];
  for (let i = 0; i < length; i++) {
    values.push(serializeValue(array[i]));
  }
  if (array.length > MAX_SERIALIZED_ARRAY_LENGTH) {
    return { values, length: array.length, truncated: true };
  }
  return values;
}
function serializeValue(value) {
  if (value == null) {
    return null;
  }
  if (typeof value === "number" || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (ArrayBuffer.isView(value)) {
    return serializeTypedArray(value);
  }
  if (Array.isArray(value)) {
    return serializeArray(value);
  }
  if (typeof value === "object") {
    const anyValue = value;
    if (ArrayBuffer.isView(anyValue._v)) {
      return serializeTypedArray(anyValue._v);
    }
    if (Array.isArray(anyValue._v)) {
      return serializeArray(anyValue._v);
    }
    if (ArrayBuffer.isView(anyValue.elements)) {
      return serializeTypedArray(anyValue.elements);
    }
    if (Array.isArray(anyValue.elements)) {
      return serializeArray(anyValue.elements);
    }
    const numeric = {};
    for (const key of ["x", "y", "z", "w", "r", "g", "b", "a"]) {
      if (typeof anyValue[key] === "number") {
        numeric[key] = anyValue[key];
      }
    }
    if (Object.keys(numeric).length > 0) {
      return numeric;
    }
    try {
      const json = JSON.stringify(value);
      if (json != null && json.length <= 2e3) {
        return JSON.parse(json);
      }
    } catch (_e) {
    }
    return String(value);
  }
  return String(value);
}
function getTextureBindingInfo(value, backend) {
  var _a, _b, _c, _d;
  if (!Array.isArray(value)) {
    return void 0;
  }
  const slot = typeof value[0] === "number" ? value[0] : null;
  const texture = value[1];
  const sampler = value[2];
  return {
    unit: backend === "WebGL2" ? slot : null,
    binding: slot,
    textureUid: (_b = (_a = texture == null ? void 0 : texture.objectUID) != null ? _a : texture == null ? void 0 : texture.uid) != null ? _b : null,
    samplerUid: (_d = (_c = sampler == null ? void 0 : sampler.objectUID) != null ? _c : sampler == null ? void 0 : sampler.uid) != null ? _d : null
  };
}
function interpretTexels(location) {
  var _a;
  if (location == null || location.vec4s.length === 0) {
    return null;
  }
  const flat = location.vec4s.flat();
  const offset = location.scalarIndex != null ? location.scalarIndex % 4 : 0;
  switch (location.fetchFunction) {
    case "fetchElement":
    case "fetchVec4":
      return location.vec4s[0];
    case "fetchScalarNo16BytesAligned":
      return (_a = flat[offset]) != null ? _a : null;
    case "fetchVec2No16BytesAligned":
      return flat.slice(offset, offset + 2);
    case "fetchVec3No16BytesAligned":
      return flat.slice(offset, offset + 3);
    case "fetchMat3No16BytesAligned":
      return flat.slice(offset, offset + 9);
    case "fetchMat4No16BytesAligned":
      return flat.slice(offset, offset + 16);
    case "fetchMat4":
      return location.vec4s;
    case "fetchMat3":
      return location.vec4s.map((vec4) => [vec4[0], vec4[1], vec4[2]]);
    case "fetchMat2":
    case "fetchMat2No16BytesAligned":
      return location.vec4s[0];
    case "fetchMat4x3":
      return location.vec4s;
    default:
      return location.vec4s;
  }
}
var ShaderParameterDebugger = class _ShaderParameterDebugger {
  static reportMaterial(engine, material, primitive) {
    var _a, _b;
    const backend = getBackend(engine);
    const processApproach = engine.processApproach.str;
    const available = backend !== "None";
    if (!available) {
      return {
        available: false,
        reason: `Shader parameter inspection is available in WebGL2 and WebGPU (current: ${processApproach}).`,
        backend,
        processApproach,
        materialTypeName: material.materialTypeName,
        materialUID: material.materialUID,
        materialSID: material.materialSID,
        materialCountPerBufferView: 0,
        bufferViewIndex: 0,
        shaderProgramUid: -1,
        bufferWidth: 0,
        sharedProgramMaterialMismatch: false,
        entries: []
      };
    }
    const bufferWidth = getBufferWidth(engine, backend);
    const layout = createLayoutSource(engine, bufferWidth);
    const isWebGPU = backend === "WebGPU";
    const materialCountPerBufferView = (_a = engine.materialRepository.getMaterialCountPerBufferView(material.materialTypeName)) != null ? _a : 1;
    const bufferViewIndex = Math.floor(material.materialSID / materialCountPerBufferView);
    const shaderProgramUid = _ShaderParameterDebugger.__getShaderProgramUid(material, primitive);
    const realUniforms = !isWebGPU && shaderProgramUid >= 0 ? _ShaderParameterDebugger.readRealUniforms(engine, shaderProgramUid) : null;
    const entries = [];
    for (const info of material.fieldsInfoArray) {
      const isTexture = CompositionType.isTexture(info.compositionType);
      const source = isTexture ? "texture" : isWebGPU ? info.soloDatum ? "soloDatum" : "storageBuffer" : info.needUniformInDataTextureMode ? "uniform" : info.soloDatum ? "soloDatum" : "dataTexture";
      const entry = {
        semantic: info.semantic,
        stage: info.stage.str,
        compositionType: info.compositionType.str,
        componentType: info.componentType.str,
        arrayLength: info.arrayLength,
        isTexture,
        isInternalSetting: info.isInternalSetting === true,
        needUniformInDataTextureMode: info.needUniformInDataTextureMode === true,
        soloDatum: info.soloDatum === true,
        source,
        valuePreview: isTexture ? null : serializeValue(material.getParameter(info.semantic))
      };
      if (isTexture) {
        entry.texture = getTextureBindingInfo(material.getTextureParameter(info.semantic), backend);
      } else {
        const offsets = engine.materialRepository.getLocationOffsetOfMemberOfMaterial(
          engine,
          material.materialTypeName,
          info.semantic
        );
        entry.buffer = decodeMaterialProperty({
          info,
          offsets,
          materialSID: material.materialSID,
          materialCountPerBufferView,
          layout,
          maxArrayElements: MAX_ARRAY_ELEMENTS
        });
        if (source === "uniform") {
          for (const location of entry.buffer.locations) {
            location.warnings.push("The shader reads this value from a real uniform, not from the data texture.");
          }
        }
      }
      if (realUniforms != null) {
        entry.realUniform = (_b = realUniforms.get(info.semantic)) != null ? _b : { locationFound: false, value: null };
      }
      entries.push(entry);
    }
    return {
      available: true,
      backend,
      processApproach,
      materialTypeName: material.materialTypeName,
      materialUID: material.materialUID,
      materialSID: material.materialSID,
      materialCountPerBufferView,
      bufferViewIndex,
      shaderProgramUid,
      bufferWidth,
      sharedProgramMaterialMismatch: !isWebGPU && shaderProgramUid >= 0 ? _ShaderParameterDebugger.__isProgramMaterialMismatch(engine, shaderProgramUid, material) : false,
      entries
    };
  }
  static reportGlobals(engine, shaderProgramUid) {
    const backend = getBackend(engine);
    const processApproach = engine.processApproach.str;
    const available = backend !== "None";
    if (!available) {
      return {
        available: false,
        reason: `Shader parameter inspection is available in WebGL2 and WebGPU (current: ${processApproach}).`,
        backend,
        processApproach,
        bufferWidth: 0,
        shaderProgramUid: -1,
        entries: []
      };
    }
    const bufferWidth = getBufferWidth(engine, backend);
    const layout = createLayoutSource(engine, bufferWidth);
    const isWebGPU = backend === "WebGPU";
    const realUniforms = !isWebGPU && shaderProgramUid != null && shaderProgramUid >= 0 ? _ShaderParameterDebugger.readRealUniforms(engine, shaderProgramUid) : null;
    const entries = engine.globalDataRepository.getPropertyTable().map((property) => {
      var _a;
      const info = property.info;
      const source = isWebGPU ? "storageBuffer" : info.needUniformInDataTextureMode ? "uniform" : "dataTexture";
      const entry = {
        semantic: info.semantic,
        stage: info.stage.str,
        compositionType: info.compositionType.str,
        componentType: info.componentType.str,
        arrayLength: info.arrayLength,
        isTexture: false,
        isInternalSetting: info.isInternalSetting === true,
        needUniformInDataTextureMode: info.needUniformInDataTextureMode === true,
        soloDatum: false,
        source,
        valuePreview: serializeValue(property.value)
      };
      entry.buffer = decodeGlobalProperty({
        info,
        offset: property.vec4Index,
        layout,
        maxArrayElements: MAX_ARRAY_ELEMENTS
      });
      if (source === "uniform") {
        for (const location of entry.buffer.locations) {
          location.warnings.push("The shader reads this value from a real uniform, not from the data texture.");
        }
      }
      if (realUniforms != null) {
        entry.realUniform = (_a = realUniforms.get(info.semantic)) != null ? _a : { locationFound: false, value: null };
      }
      return entry;
    });
    return {
      available: true,
      backend,
      processApproach,
      bufferWidth,
      shaderProgramUid: shaderProgramUid != null ? shaderProgramUid : -1,
      entries
    };
  }
  static reportComponent(engine, component) {
    var _a;
    const componentClass = component.constructor;
    const componentClassName = componentClass.name;
    const backend = getBackend(engine);
    const available = backend !== "None";
    if (!available) {
      return {
        available: false,
        reason: `Shader parameter inspection is available in WebGL2 and WebGPU (current: ${engine.processApproach.str}).`,
        backend,
        componentClassName,
        componentSID: component.componentSID,
        componentCountPerBufferView: 0,
        entries: []
      };
    }
    const memberInfoMap = Component.getMemberInfo(engine).get(componentClass);
    if (memberInfoMap == null) {
      return {
        available: false,
        reason: `No member information is registered for ${componentClassName}.`,
        backend,
        componentClassName,
        componentSID: component.componentSID,
        componentCountPerBufferView: 0,
        entries: []
      };
    }
    const isWebGPU = backend === "WebGPU";
    const componentCountPerBufferView = (_a = Component.getComponentCountPerBufferView(engine).get(componentClass)) != null ? _a : 1;
    const arrayLengthMap = Component.getArrayLengthOfMember(engine).get(componentClass);
    const bufferWidth = getBufferWidth(engine, backend);
    const layout = createLayoutSource(engine, bufferWidth);
    const entries = [];
    for (const [memberName, memberInfo] of memberInfoMap) {
      if (memberInfo.bufferUse !== BufferUse.GPUInstanceData) {
        continue;
      }
      const offsets = Component.getLocationOffsetOfMemberOfComponent(engine, componentClass, memberName);
      const arrayLength = arrayLengthMap == null ? void 0 : arrayLengthMap.get(memberName);
      let buffer;
      if (memberInfo.isVariableLength === true) {
        const locationMemberName = Component._getVariableLengthLocationMemberName(memberName);
        const locationOffsets = Component.getLocationOffsetOfMemberOfComponent(
          engine,
          componentClass,
          locationMemberName
        );
        buffer = decodeVariableLengthComponentMember({
          memberInfo: { compositionType: memberInfo.compositionType, arrayLength, isVariableLength: true },
          offsets,
          locationMemberOffsets: locationOffsets,
          componentSID: component.componentSID,
          componentCountPerBufferView,
          layout,
          maxArrayElements: MAX_ARRAY_ELEMENTS
        });
      } else {
        buffer = decodeComponentMember({
          memberInfo: { compositionType: memberInfo.compositionType, arrayLength },
          offsets,
          componentSID: component.componentSID,
          componentCountPerBufferView,
          layout,
          maxArrayElements: MAX_ARRAY_ELEMENTS
        });
      }
      entries.push({
        semantic: memberName,
        stage: memberInfo.shaderType.str,
        compositionType: memberInfo.compositionType.str,
        componentType: memberInfo.componentType.str,
        arrayLength,
        isTexture: false,
        isInternalSetting: false,
        needUniformInDataTextureMode: false,
        soloDatum: false,
        source: isWebGPU ? "storageBuffer" : "dataTexture",
        valuePreview: interpretTexels(buffer.locations[0]),
        buffer
      });
    }
    return {
      available: true,
      backend,
      componentClassName,
      componentSID: component.componentSID,
      componentCountPerBufferView,
      entries
    };
  }
  static reportEntity(engine, entity) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    const materials = [];
    const mesh = (_a = entity.tryToGetMesh()) == null ? void 0 : _a.mesh;
    if (mesh != null) {
      for (const primitive of mesh.primitives) {
        materials.push(_ShaderParameterDebugger.reportMaterial(engine, primitive.material, primitive));
      }
    }
    const components = [];
    const candidates = [
      (_b = entity.tryToGetSceneGraph) == null ? void 0 : _b.call(entity),
      (_c = entity.tryToGetTransform) == null ? void 0 : _c.call(entity),
      (_d = entity.tryToGetCamera) == null ? void 0 : _d.call(entity),
      (_e = entity.tryToGetLight) == null ? void 0 : _e.call(entity),
      (_f = entity.tryToGetSkeletal) == null ? void 0 : _f.call(entity),
      (_g = entity.tryToGetBlendShape) == null ? void 0 : _g.call(entity),
      (_h = entity.tryToGetMeshRenderer) == null ? void 0 : _h.call(entity),
      (_i = entity.tryToGetPhysics) == null ? void 0 : _i.call(entity)
    ];
    for (const component of candidates) {
      if (component != null) {
        components.push(_ShaderParameterDebugger.reportComponent(engine, component));
      }
    }
    return { entityUID: entity.entityUID, materials, components };
  }
  static reportAll(engine) {
    var _a;
    const liveMaterials = engine.materialRepository.getAllMaterials().map((ref) => ref.deref()).filter((material) => material != null);
    const materials = liveMaterials.map((material) => _ShaderParameterDebugger.reportMaterial(engine, material));
    const firstProgram = (_a = materials.find((report) => report.shaderProgramUid >= 0)) == null ? void 0 : _a.shaderProgramUid;
    const globals = _ShaderParameterDebugger.reportGlobals(engine, firstProgram);
    return { globals, materials };
  }
  static readRealUniforms(engine, shaderProgramUid) {
    if (getBackend(engine) !== "WebGL2") {
      return null;
    }
    const program = engine.webglResourceRepository.getWebGLResource(shaderProgramUid);
    if (program == null) {
      return null;
    }
    const glw = engine.getCurrentWebGLContextWrapper();
    if (glw == null) {
      return null;
    }
    const gl = glw.getRawContext();
    const result = /* @__PURE__ */ new Map();
    const infoMap = program._shaderSemanticsInfoMap;
    if (infoMap != null) {
      for (const semantic of infoMap.keys()) {
        const location = program[semantic];
        if (location == null) {
          result.set(semantic, { locationFound: false, value: null });
          continue;
        }
        try {
          result.set(semantic, {
            locationFound: true,
            value: serializeValue(gl.getUniform(program, location))
          });
        } catch (_e) {
          result.set(semantic, { locationFound: false, value: null });
        }
      }
    }
    for (const basicName of ["dataTexture", "currentComponentSIDs"]) {
      const location = program[basicName];
      if (location == null) {
        continue;
      }
      try {
        result.set(basicName, {
          locationFound: true,
          value: serializeValue(gl.getUniform(program, location))
        });
      } catch (_e) {
        result.set(basicName, { locationFound: false, value: null });
      }
    }
    return result;
  }
  static decode(engine, vec4Index) {
    const backend = getBackend(engine);
    if (backend === "None") {
      return null;
    }
    const width = getBufferWidth(engine, backend);
    const layout = createLayoutSource(engine, width);
    return {
      vec4Index,
      byteOffset: vec4Index * 16,
      row: width > 0 ? Math.floor(vec4Index / width) : -1,
      col: width > 0 ? vec4Index % width : -1,
      vec4: layout.readVec4(vec4Index)
    };
  }
  static formatEntries(entries) {
    var _a, _b, _c;
    const rows = [];
    for (const entry of entries) {
      if (entry.buffer == null || entry.buffer.locations.length === 0) {
        rows.push({
          semantic: entry.semantic,
          arrayElement: "",
          source: entry.source,
          value: entry.valuePreview,
          fetch: "",
          vec4: "",
          byteOffset: "",
          row: "",
          col: "",
          vec4s: "",
          uniform: ((_a = entry.realUniform) == null ? void 0 : _a.locationFound) ? entry.realUniform.value : "",
          warnings: ""
        });
        continue;
      }
      for (const location of entry.buffer.locations) {
        rows.push({
          semantic: entry.semantic,
          arrayElement: (_b = location.arrayElement) != null ? _b : "",
          source: entry.source,
          value: entry.valuePreview,
          fetch: location.fetchFunction,
          vec4: location.vec4Index,
          byteOffset: location.byteOffset,
          row: location.row >= 0 ? location.row : "",
          col: location.col >= 0 ? location.col : "",
          vec4s: location.vec4s.map((vec4) => vec4.join(",")).join(" | "),
          uniform: ((_c = entry.realUniform) == null ? void 0 : _c.locationFound) ? entry.realUniform.value : "",
          warnings: location.warnings.join("; ")
        });
      }
    }
    return rows;
  }
  static format(report) {
    return {
      ...report,
      entries: _ShaderParameterDebugger.formatEntries(report.entries)
    };
  }
  static dumpMaterial(engine, material, primitive) {
    const report = _ShaderParameterDebugger.reportMaterial(engine, material, primitive);
    console.table(_ShaderParameterDebugger.formatEntries(report.entries));
    return report;
  }
  static dumpPrimitive(engine, primitive) {
    return _ShaderParameterDebugger.dumpMaterial(engine, primitive.material, primitive);
  }
  static dumpGlobals(engine, shaderProgramUid) {
    const report = _ShaderParameterDebugger.reportGlobals(engine, shaderProgramUid);
    console.table(_ShaderParameterDebugger.formatEntries(report.entries));
    return report;
  }
  static dumpEntity(engine, entity) {
    const report = _ShaderParameterDebugger.reportEntity(engine, entity);
    for (const material of report.materials) {
      console.log(`Material: ${material.materialTypeName} (SID ${material.materialSID})`);
      console.table(_ShaderParameterDebugger.formatEntries(material.entries));
    }
    return report;
  }
  static dumpAll(engine) {
    const report = _ShaderParameterDebugger.reportAll(engine);
    console.log("Globals");
    console.table(_ShaderParameterDebugger.formatEntries(report.globals.entries));
    for (const material of report.materials) {
      console.log(`Material: ${material.materialTypeName} (SID ${material.materialSID})`);
      console.table(_ShaderParameterDebugger.formatEntries(material.entries));
    }
    return report;
  }
  static installConsoleHelpers(engine, target = typeof window !== "undefined" ? window : void 0) {
    if (target == null) {
      return;
    }
    target.RnShaderParameters = {
      reportAll: () => _ShaderParameterDebugger.reportAll(engine),
      reportMaterial: (material, primitive) => _ShaderParameterDebugger.reportMaterial(engine, material, primitive),
      reportEntity: (entity) => _ShaderParameterDebugger.reportEntity(engine, entity),
      globals: (shaderProgramUid) => _ShaderParameterDebugger.reportGlobals(engine, shaderProgramUid),
      decode: (vec4Index) => _ShaderParameterDebugger.decode(engine, vec4Index),
      dumpAll: () => _ShaderParameterDebugger.dumpAll(engine),
      dumpPrimitive: (primitive) => _ShaderParameterDebugger.dumpPrimitive(engine, primitive)
    };
  }
  static __getShaderProgramUid(material, primitive) {
    if (primitive != null) {
      return material.getShaderProgramUid(primitive);
    }
    for (const belongPrimitive of material.getBelongPrimitives().values()) {
      return material.getShaderProgramUid(belongPrimitive);
    }
    return -1;
  }
  static __isProgramMaterialMismatch(engine, shaderProgramUid, material) {
    const program = engine.webglResourceRepository.getWebGLResource(shaderProgramUid);
    if (program == null || program._material == null) {
      return false;
    }
    return program._material.deref() !== material;
  }
};
export {
  ShaderParameterDebugger,
  serializeValue
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL3dlYmdsL2RlYnVnL1NoYWRlclBhcmFtZXRlckRlYnVnZ2VyLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuLi8uLi9mb3VuZGF0aW9uL2NvcmUvQ29tcG9uZW50JztcbmltcG9ydCB0eXBlIHsgSUVudGl0eSB9IGZyb20gJy4uLy4uL2ZvdW5kYXRpb24vY29yZS9FbnRpdHknO1xuaW1wb3J0IHsgQnVmZmVyVXNlIH0gZnJvbSAnLi4vLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9CdWZmZXJVc2UnO1xuaW1wb3J0IHsgQ29tcG9zaXRpb25UeXBlIH0gZnJvbSAnLi4vLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9Db21wb3NpdGlvblR5cGUnO1xuaW1wb3J0IHsgUHJvY2Vzc0FwcHJvYWNoIH0gZnJvbSAnLi4vLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9Qcm9jZXNzQXBwcm9hY2gnO1xuaW1wb3J0IHR5cGUgeyBTaGFkZXJTZW1hbnRpY3NJbmZvIH0gZnJvbSAnLi4vLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9TaGFkZXJTZW1hbnRpY3NJbmZvJztcbmltcG9ydCB0eXBlIHsgUHJpbWl0aXZlIH0gZnJvbSAnLi4vLi4vZm91bmRhdGlvbi9nZW9tZXRyeS9QcmltaXRpdmUnO1xuaW1wb3J0IHR5cGUgeyBNYXRlcmlhbCB9IGZyb20gJy4uLy4uL2ZvdW5kYXRpb24vbWF0ZXJpYWxzL2NvcmUvTWF0ZXJpYWwnO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi8uLi9mb3VuZGF0aW9uL3N5c3RlbS9FbmdpbmUnO1xuaW1wb3J0IHR5cGUgeyBDR0FQSVJlc291cmNlSGFuZGxlIH0gZnJvbSAnLi4vLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHR5cGUgeyBSbldlYkdMUHJvZ3JhbSB9IGZyb20gJy4uL1dlYkdMRXh0ZW5kZWRUeXBlcyc7XG5pbXBvcnQge1xuICB0eXBlIEJ1ZmZlckxheW91dFNvdXJjZSxcbiAgZGVjb2RlQ29tcG9uZW50TWVtYmVyLFxuICBkZWNvZGVHbG9iYWxQcm9wZXJ0eSxcbiAgZGVjb2RlTWF0ZXJpYWxQcm9wZXJ0eSxcbiAgZGVjb2RlVmFyaWFibGVMZW5ndGhDb21wb25lbnRNZW1iZXIsXG59IGZyb20gJy4vQnVmZmVyTGF5b3V0RGVjb2Rlcic7XG5pbXBvcnQgdHlwZSB7XG4gIEFsbFBhcmFtZXRlclJlcG9ydCxcbiAgQnVmZmVyTG9jYXRpb24sXG4gIENvbXBvbmVudFBhcmFtZXRlclJlcG9ydCxcbiAgRW50aXR5UGFyYW1ldGVyUmVwb3J0LFxuICBHbG9iYWxQYXJhbWV0ZXJSZXBvcnQsXG4gIE1hdGVyaWFsUGFyYW1ldGVyUmVwb3J0LFxuICBSYXdWZWM0LFxuICBSZWFsVW5pZm9ybUluZm8sXG4gIFNoYWRlclBhcmFtZXRlckJhY2tlbmQsXG4gIFNoYWRlclBhcmFtZXRlckVudHJ5LFxuICBTaGFkZXJQYXJhbWV0ZXJTb3VyY2UsXG4gIFRleHR1cmVCaW5kaW5nSW5mbyxcbn0gZnJvbSAnLi90eXBlcyc7XG5cbmNvbnN0IE1BWF9BUlJBWV9FTEVNRU5UUyA9IDQ7XG5jb25zdCBNQVhfU0VSSUFMSVpFRF9BUlJBWV9MRU5HVEggPSAxNjtcblxuZnVuY3Rpb24gZ2V0QmFja2VuZChlbmdpbmU6IEVuZ2luZSk6IFNoYWRlclBhcmFtZXRlckJhY2tlbmQge1xuICBpZiAoUHJvY2Vzc0FwcHJvYWNoLmlzV2ViR0wyQXBwcm9hY2goZW5naW5lLnByb2Nlc3NBcHByb2FjaCkpIHtcbiAgICByZXR1cm4gJ1dlYkdMMic7XG4gIH1cbiAgaWYgKFByb2Nlc3NBcHByb2FjaC5pc1dlYkdwdUFwcHJvYWNoKGVuZ2luZS5wcm9jZXNzQXBwcm9hY2gpKSB7XG4gICAgcmV0dXJuICdXZWJHUFUnO1xuICB9XG4gIHJldHVybiAnTm9uZSc7XG59XG5cbmZ1bmN0aW9uIGdldEJ1ZmZlcldpZHRoKGVuZ2luZTogRW5naW5lLCBiYWNrZW5kOiBTaGFkZXJQYXJhbWV0ZXJCYWNrZW5kKTogbnVtYmVyIHtcbiAgaWYgKGJhY2tlbmQgIT09ICdXZWJHTDInKSB7XG4gICAgcmV0dXJuIDA7XG4gIH1cbiAgdHJ5IHtcbiAgICByZXR1cm4gZW5naW5lLmdldEN1cnJlbnRXZWJHTENvbnRleHRXcmFwcGVyKCk/LmdldE1heFRleHR1cmVTaXplKCkgPz8gMDtcbiAgfSBjYXRjaCAoX2UpIHtcbiAgICByZXR1cm4gMDtcbiAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVMYXlvdXRTb3VyY2UoZW5naW5lOiBFbmdpbmUsIHdpZHRoOiBudW1iZXIpOiBCdWZmZXJMYXlvdXRTb3VyY2Uge1xuICBjb25zdCByZWFkID0gKGJ5dGVPZmZzZXQ6IG51bWJlciwgY291bnQ6IG51bWJlcikgPT5cbiAgICBlbmdpbmUubWVtb3J5TWFuYWdlci5yZWFkRmxvYXQzMkFycmF5KEJ1ZmZlclVzZS5HUFVJbnN0YW5jZURhdGEsIGJ5dGVPZmZzZXQsIGNvdW50KTtcbiAgcmV0dXJuIHtcbiAgICB3aWR0aCxcbiAgICByZWFkVmVjNDogKHZlYzRJbmRleDogbnVtYmVyKTogUmF3VmVjNCB8IG51bGwgPT4ge1xuICAgICAgY29uc3QgdmFsdWVzID0gcmVhZCh2ZWM0SW5kZXggKiAxNiwgNCk7XG4gICAgICBpZiAodmFsdWVzID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICByZXR1cm4gW3ZhbHVlc1swXSwgdmFsdWVzWzFdLCB2YWx1ZXNbMl0sIHZhbHVlc1szXV07XG4gICAgfSxcbiAgICByZWFkU2NhbGFyOiAoc2NhbGFySW5kZXg6IG51bWJlcik6IG51bWJlciB8IG51bGwgPT4ge1xuICAgICAgY29uc3QgdmFsdWVzID0gcmVhZChzY2FsYXJJbmRleCAqIDQsIDEpO1xuICAgICAgcmV0dXJuIHZhbHVlcyA9PSBudWxsID8gbnVsbCA6IHZhbHVlc1swXTtcbiAgICB9LFxuICB9O1xufVxuXG5mdW5jdGlvbiBzZXJpYWxpemVUeXBlZEFycmF5KGFycmF5OiBBcnJheUxpa2U8bnVtYmVyPik6IHVua25vd24ge1xuICBjb25zdCBsZW5ndGggPSBNYXRoLm1pbihhcnJheS5sZW5ndGgsIE1BWF9TRVJJQUxJWkVEX0FSUkFZX0xFTkdUSCk7XG4gIGNvbnN0IHZhbHVlczogbnVtYmVyW10gPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIHZhbHVlcy5wdXNoKGFycmF5W2ldKTtcbiAgfVxuICBpZiAoYXJyYXkubGVuZ3RoID4gTUFYX1NFUklBTElaRURfQVJSQVlfTEVOR1RIKSB7XG4gICAgcmV0dXJuIHsgdmFsdWVzLCBsZW5ndGg6IGFycmF5Lmxlbmd0aCwgdHJ1bmNhdGVkOiB0cnVlIH07XG4gIH1cbiAgcmV0dXJuIHZhbHVlcztcbn1cblxuZnVuY3Rpb24gc2VyaWFsaXplQXJyYXkoYXJyYXk6IHVua25vd25bXSk6IHVua25vd24ge1xuICBjb25zdCBsZW5ndGggPSBNYXRoLm1pbihhcnJheS5sZW5ndGgsIE1BWF9TRVJJQUxJWkVEX0FSUkFZX0xFTkdUSCk7XG4gIGNvbnN0IHZhbHVlczogdW5rbm93bltdID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICB2YWx1ZXMucHVzaChzZXJpYWxpemVWYWx1ZShhcnJheVtpXSkpO1xuICB9XG4gIGlmIChhcnJheS5sZW5ndGggPiBNQVhfU0VSSUFMSVpFRF9BUlJBWV9MRU5HVEgpIHtcbiAgICByZXR1cm4geyB2YWx1ZXMsIGxlbmd0aDogYXJyYXkubGVuZ3RoLCB0cnVuY2F0ZWQ6IHRydWUgfTtcbiAgfVxuICByZXR1cm4gdmFsdWVzO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIG1hdGggY2xhc3NlcywgdHlwZWQgYXJyYXlzIGFuZCB0ZXh0dXJlIHR1cGxlcyB0byBwbGFpbiBKU09OIHZhbHVlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZVZhbHVlKHZhbHVlOiB1bmtub3duKTogdW5rbm93biB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgfHwgdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyB8fCB0eXBlb2YgdmFsdWUgPT09ICdib29sZWFuJykge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuICBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KHZhbHVlKSkge1xuICAgIHJldHVybiBzZXJpYWxpemVUeXBlZEFycmF5KHZhbHVlIGFzIHVua25vd24gYXMgQXJyYXlMaWtlPG51bWJlcj4pO1xuICB9XG4gIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgIHJldHVybiBzZXJpYWxpemVBcnJheSh2YWx1ZSk7XG4gIH1cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICBjb25zdCBhbnlWYWx1ZSA9IHZhbHVlIGFzIGFueTtcbiAgICBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KGFueVZhbHVlLl92KSkge1xuICAgICAgcmV0dXJuIHNlcmlhbGl6ZVR5cGVkQXJyYXkoYW55VmFsdWUuX3YgYXMgQXJyYXlMaWtlPG51bWJlcj4pO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheShhbnlWYWx1ZS5fdikpIHtcbiAgICAgIHJldHVybiBzZXJpYWxpemVBcnJheShhbnlWYWx1ZS5fdik7XG4gICAgfVxuICAgIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcoYW55VmFsdWUuZWxlbWVudHMpKSB7XG4gICAgICByZXR1cm4gc2VyaWFsaXplVHlwZWRBcnJheShhbnlWYWx1ZS5lbGVtZW50cyBhcyBBcnJheUxpa2U8bnVtYmVyPik7XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KGFueVZhbHVlLmVsZW1lbnRzKSkge1xuICAgICAgcmV0dXJuIHNlcmlhbGl6ZUFycmF5KGFueVZhbHVlLmVsZW1lbnRzKTtcbiAgICB9XG4gICAgY29uc3QgbnVtZXJpYzogUmVjb3JkPHN0cmluZywgbnVtYmVyPiA9IHt9O1xuICAgIGZvciAoY29uc3Qga2V5IG9mIFsneCcsICd5JywgJ3onLCAndycsICdyJywgJ2cnLCAnYicsICdhJ10pIHtcbiAgICAgIGlmICh0eXBlb2YgYW55VmFsdWVba2V5XSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgbnVtZXJpY1trZXldID0gYW55VmFsdWVba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKE9iamVjdC5rZXlzKG51bWVyaWMpLmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybiBudW1lcmljO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgY29uc3QganNvbiA9IEpTT04uc3RyaW5naWZ5KHZhbHVlKTtcbiAgICAgIGlmIChqc29uICE9IG51bGwgJiYganNvbi5sZW5ndGggPD0gMjAwMCkge1xuICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShqc29uKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChfZSkge1xuICAgICAgLy8gRmFsbCB0aHJvdWdoIHRvIFN0cmluZygpLlxuICAgIH1cbiAgICByZXR1cm4gU3RyaW5nKHZhbHVlKTtcbiAgfVxuICByZXR1cm4gU3RyaW5nKHZhbHVlKTtcbn1cblxuZnVuY3Rpb24gZ2V0VGV4dHVyZUJpbmRpbmdJbmZvKHZhbHVlOiB1bmtub3duLCBiYWNrZW5kOiBTaGFkZXJQYXJhbWV0ZXJCYWNrZW5kKTogVGV4dHVyZUJpbmRpbmdJbmZvIHwgdW5kZWZpbmVkIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgY29uc3Qgc2xvdCA9IHR5cGVvZiB2YWx1ZVswXSA9PT0gJ251bWJlcicgPyB2YWx1ZVswXSA6IG51bGw7XG4gIGNvbnN0IHRleHR1cmUgPSB2YWx1ZVsxXSBhcyBhbnk7XG4gIGNvbnN0IHNhbXBsZXIgPSB2YWx1ZVsyXSBhcyBhbnk7XG4gIHJldHVybiB7XG4gICAgdW5pdDogYmFja2VuZCA9PT0gJ1dlYkdMMicgPyBzbG90IDogbnVsbCxcbiAgICBiaW5kaW5nOiBzbG90LFxuICAgIHRleHR1cmVVaWQ6IHRleHR1cmU/Lm9iamVjdFVJRCA/PyB0ZXh0dXJlPy51aWQgPz8gbnVsbCxcbiAgICBzYW1wbGVyVWlkOiBzYW1wbGVyPy5vYmplY3RVSUQgPz8gc2FtcGxlcj8udWlkID8/IG51bGwsXG4gIH07XG59XG5cbmZ1bmN0aW9uIGludGVycHJldFRleGVscyhsb2NhdGlvbjogQnVmZmVyTG9jYXRpb24gfCB1bmRlZmluZWQpOiB1bmtub3duIHtcbiAgaWYgKGxvY2F0aW9uID09IG51bGwgfHwgbG9jYXRpb24udmVjNHMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgY29uc3QgZmxhdCA9IGxvY2F0aW9uLnZlYzRzLmZsYXQoKTtcbiAgY29uc3Qgb2Zmc2V0ID0gbG9jYXRpb24uc2NhbGFySW5kZXggIT0gbnVsbCA/IGxvY2F0aW9uLnNjYWxhckluZGV4ICUgNCA6IDA7XG4gIHN3aXRjaCAobG9jYXRpb24uZmV0Y2hGdW5jdGlvbikge1xuICAgIGNhc2UgJ2ZldGNoRWxlbWVudCc6XG4gICAgY2FzZSAnZmV0Y2hWZWM0JzpcbiAgICAgIHJldHVybiBsb2NhdGlvbi52ZWM0c1swXTtcbiAgICBjYXNlICdmZXRjaFNjYWxhck5vMTZCeXRlc0FsaWduZWQnOlxuICAgICAgcmV0dXJuIGZsYXRbb2Zmc2V0XSA/PyBudWxsO1xuICAgIGNhc2UgJ2ZldGNoVmVjMk5vMTZCeXRlc0FsaWduZWQnOlxuICAgICAgcmV0dXJuIGZsYXQuc2xpY2Uob2Zmc2V0LCBvZmZzZXQgKyAyKTtcbiAgICBjYXNlICdmZXRjaFZlYzNObzE2Qnl0ZXNBbGlnbmVkJzpcbiAgICAgIHJldHVybiBmbGF0LnNsaWNlKG9mZnNldCwgb2Zmc2V0ICsgMyk7XG4gICAgY2FzZSAnZmV0Y2hNYXQzTm8xNkJ5dGVzQWxpZ25lZCc6XG4gICAgICByZXR1cm4gZmxhdC5zbGljZShvZmZzZXQsIG9mZnNldCArIDkpO1xuICAgIGNhc2UgJ2ZldGNoTWF0NE5vMTZCeXRlc0FsaWduZWQnOlxuICAgICAgcmV0dXJuIGZsYXQuc2xpY2Uob2Zmc2V0LCBvZmZzZXQgKyAxNik7XG4gICAgY2FzZSAnZmV0Y2hNYXQ0JzpcbiAgICAgIHJldHVybiBsb2NhdGlvbi52ZWM0cztcbiAgICBjYXNlICdmZXRjaE1hdDMnOlxuICAgICAgcmV0dXJuIGxvY2F0aW9uLnZlYzRzLm1hcCh2ZWM0ID0+IFt2ZWM0WzBdLCB2ZWM0WzFdLCB2ZWM0WzJdXSk7XG4gICAgY2FzZSAnZmV0Y2hNYXQyJzpcbiAgICBjYXNlICdmZXRjaE1hdDJObzE2Qnl0ZXNBbGlnbmVkJzpcbiAgICAgIHJldHVybiBsb2NhdGlvbi52ZWM0c1swXTtcbiAgICBjYXNlICdmZXRjaE1hdDR4Myc6XG4gICAgICByZXR1cm4gbG9jYXRpb24udmVjNHM7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBsb2NhdGlvbi52ZWM0cztcbiAgfVxufVxuXG4vKipcbiAqIEluc3BlY3RvciBmb3IgdGhlIHZhbHVlcyBSaG9kb25pdGUgdXBsb2FkcyB0byBXZWJHTDIgb3IgV2ViR1BVIHNoYWRlcnMuXG4gKlxuICogSXQgcmVwb3J0cyBib3RoIHRoZSBDUFUtc2lkZSB2YWx1ZSBvZiBhIHNoYWRlciBzZW1hbnRpYyBhbmQgdGhlIGxvY2F0aW9uL3ZhbHVlIHRoZVxuICogc2hhZGVyIHJlYWRzIGZyb20gdGhlIFdlYkdMMiBkYXRhIHRleHR1cmUgb3IgdGhlIFdlYkdQVSBzdG9yYWdlIGJ1ZmZlciwgcGx1cyB0aGVcbiAqIHJlYWwgdW5pZm9ybSB2YWx1ZSB3aGVuIHRoZSBXZWJHTDIgc2hhZGVyIHVzZXMgb25lIChmb3JcbiAqIGBuZWVkVW5pZm9ybUluRGF0YVRleHR1cmVNb2RlYCBhbmQgc2FtcGxlciB1bmlmb3JtcykuXG4gKlxuICogVGhlIGRlY29kZXIgcmVhZHMgdGhlIENQVS1zaWRlIEdQVUluc3RhbmNlRGF0YSBidWZmZXJzLCB3aGljaCBhcmUgdGhlIHNhbWUgYnl0ZXNcbiAqIHRoYXQgYXJlIHVwbG9hZGVkIHRvIHRoZSBHUFUuIEl0IGRvZXMgbm90IHJlYWQgYmFjayBHUFUgbWVtb3J5LlxuICovXG5leHBvcnQgY2xhc3MgU2hhZGVyUGFyYW1ldGVyRGVidWdnZXIge1xuICBzdGF0aWMgcmVwb3J0TWF0ZXJpYWwoZW5naW5lOiBFbmdpbmUsIG1hdGVyaWFsOiBNYXRlcmlhbCwgcHJpbWl0aXZlPzogUHJpbWl0aXZlKTogTWF0ZXJpYWxQYXJhbWV0ZXJSZXBvcnQge1xuICAgIGNvbnN0IGJhY2tlbmQgPSBnZXRCYWNrZW5kKGVuZ2luZSk7XG4gICAgY29uc3QgcHJvY2Vzc0FwcHJvYWNoID0gZW5naW5lLnByb2Nlc3NBcHByb2FjaC5zdHI7XG4gICAgY29uc3QgYXZhaWxhYmxlID0gYmFja2VuZCAhPT0gJ05vbmUnO1xuICAgIGlmICghYXZhaWxhYmxlKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBhdmFpbGFibGU6IGZhbHNlLFxuICAgICAgICByZWFzb246IGBTaGFkZXIgcGFyYW1ldGVyIGluc3BlY3Rpb24gaXMgYXZhaWxhYmxlIGluIFdlYkdMMiBhbmQgV2ViR1BVIChjdXJyZW50OiAke3Byb2Nlc3NBcHByb2FjaH0pLmAsXG4gICAgICAgIGJhY2tlbmQsXG4gICAgICAgIHByb2Nlc3NBcHByb2FjaCxcbiAgICAgICAgbWF0ZXJpYWxUeXBlTmFtZTogbWF0ZXJpYWwubWF0ZXJpYWxUeXBlTmFtZSxcbiAgICAgICAgbWF0ZXJpYWxVSUQ6IG1hdGVyaWFsLm1hdGVyaWFsVUlELFxuICAgICAgICBtYXRlcmlhbFNJRDogbWF0ZXJpYWwubWF0ZXJpYWxTSUQsXG4gICAgICAgIG1hdGVyaWFsQ291bnRQZXJCdWZmZXJWaWV3OiAwLFxuICAgICAgICBidWZmZXJWaWV3SW5kZXg6IDAsXG4gICAgICAgIHNoYWRlclByb2dyYW1VaWQ6IC0xLFxuICAgICAgICBidWZmZXJXaWR0aDogMCxcbiAgICAgICAgc2hhcmVkUHJvZ3JhbU1hdGVyaWFsTWlzbWF0Y2g6IGZhbHNlLFxuICAgICAgICBlbnRyaWVzOiBbXSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc3QgYnVmZmVyV2lkdGggPSBnZXRCdWZmZXJXaWR0aChlbmdpbmUsIGJhY2tlbmQpO1xuICAgIGNvbnN0IGxheW91dCA9IGNyZWF0ZUxheW91dFNvdXJjZShlbmdpbmUsIGJ1ZmZlcldpZHRoKTtcbiAgICBjb25zdCBpc1dlYkdQVSA9IGJhY2tlbmQgPT09ICdXZWJHUFUnO1xuICAgIGNvbnN0IG1hdGVyaWFsQ291bnRQZXJCdWZmZXJWaWV3ID1cbiAgICAgIGVuZ2luZS5tYXRlcmlhbFJlcG9zaXRvcnkuZ2V0TWF0ZXJpYWxDb3VudFBlckJ1ZmZlclZpZXcobWF0ZXJpYWwubWF0ZXJpYWxUeXBlTmFtZSkgPz8gMTtcbiAgICBjb25zdCBidWZmZXJWaWV3SW5kZXggPSBNYXRoLmZsb29yKG1hdGVyaWFsLm1hdGVyaWFsU0lEIC8gbWF0ZXJpYWxDb3VudFBlckJ1ZmZlclZpZXcpO1xuICAgIGNvbnN0IHNoYWRlclByb2dyYW1VaWQgPSBTaGFkZXJQYXJhbWV0ZXJEZWJ1Z2dlci5fX2dldFNoYWRlclByb2dyYW1VaWQobWF0ZXJpYWwsIHByaW1pdGl2ZSk7XG4gICAgY29uc3QgcmVhbFVuaWZvcm1zID1cbiAgICAgICFpc1dlYkdQVSAmJiBzaGFkZXJQcm9ncmFtVWlkID49IDAgPyBTaGFkZXJQYXJhbWV0ZXJEZWJ1Z2dlci5yZWFkUmVhbFVuaWZvcm1zKGVuZ2luZSwgc2hhZGVyUHJvZ3JhbVVpZCkgOiBudWxsO1xuXG4gICAgY29uc3QgZW50cmllczogU2hhZGVyUGFyYW1ldGVyRW50cnlbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgaW5mbyBvZiBtYXRlcmlhbC5maWVsZHNJbmZvQXJyYXkpIHtcbiAgICAgIGNvbnN0IGlzVGV4dHVyZSA9IENvbXBvc2l0aW9uVHlwZS5pc1RleHR1cmUoaW5mby5jb21wb3NpdGlvblR5cGUpO1xuICAgICAgY29uc3Qgc291cmNlOiBTaGFkZXJQYXJhbWV0ZXJTb3VyY2UgPSBpc1RleHR1cmVcbiAgICAgICAgPyAndGV4dHVyZSdcbiAgICAgICAgOiBpc1dlYkdQVVxuICAgICAgICAgID8gaW5mby5zb2xvRGF0dW1cbiAgICAgICAgICAgID8gJ3NvbG9EYXR1bSdcbiAgICAgICAgICAgIDogJ3N0b3JhZ2VCdWZmZXInXG4gICAgICAgICAgOiBpbmZvLm5lZWRVbmlmb3JtSW5EYXRhVGV4dHVyZU1vZGVcbiAgICAgICAgICAgID8gJ3VuaWZvcm0nXG4gICAgICAgICAgICA6IGluZm8uc29sb0RhdHVtXG4gICAgICAgICAgICAgID8gJ3NvbG9EYXR1bSdcbiAgICAgICAgICAgICAgOiAnZGF0YVRleHR1cmUnO1xuXG4gICAgICBjb25zdCBlbnRyeTogU2hhZGVyUGFyYW1ldGVyRW50cnkgPSB7XG4gICAgICAgIHNlbWFudGljOiBpbmZvLnNlbWFudGljLFxuICAgICAgICBzdGFnZTogaW5mby5zdGFnZS5zdHIsXG4gICAgICAgIGNvbXBvc2l0aW9uVHlwZTogaW5mby5jb21wb3NpdGlvblR5cGUuc3RyLFxuICAgICAgICBjb21wb25lbnRUeXBlOiBpbmZvLmNvbXBvbmVudFR5cGUuc3RyLFxuICAgICAgICBhcnJheUxlbmd0aDogaW5mby5hcnJheUxlbmd0aCxcbiAgICAgICAgaXNUZXh0dXJlLFxuICAgICAgICBpc0ludGVybmFsU2V0dGluZzogaW5mby5pc0ludGVybmFsU2V0dGluZyA9PT0gdHJ1ZSxcbiAgICAgICAgbmVlZFVuaWZvcm1JbkRhdGFUZXh0dXJlTW9kZTogaW5mby5uZWVkVW5pZm9ybUluRGF0YVRleHR1cmVNb2RlID09PSB0cnVlLFxuICAgICAgICBzb2xvRGF0dW06IGluZm8uc29sb0RhdHVtID09PSB0cnVlLFxuICAgICAgICBzb3VyY2UsXG4gICAgICAgIHZhbHVlUHJldmlldzogaXNUZXh0dXJlID8gbnVsbCA6IHNlcmlhbGl6ZVZhbHVlKG1hdGVyaWFsLmdldFBhcmFtZXRlcihpbmZvLnNlbWFudGljKSksXG4gICAgICB9O1xuXG4gICAgICBpZiAoaXNUZXh0dXJlKSB7XG4gICAgICAgIGVudHJ5LnRleHR1cmUgPSBnZXRUZXh0dXJlQmluZGluZ0luZm8obWF0ZXJpYWwuZ2V0VGV4dHVyZVBhcmFtZXRlcihpbmZvLnNlbWFudGljKSwgYmFja2VuZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBvZmZzZXRzID0gZW5naW5lLm1hdGVyaWFsUmVwb3NpdG9yeS5nZXRMb2NhdGlvbk9mZnNldE9mTWVtYmVyT2ZNYXRlcmlhbChcbiAgICAgICAgICBlbmdpbmUsXG4gICAgICAgICAgbWF0ZXJpYWwubWF0ZXJpYWxUeXBlTmFtZSxcbiAgICAgICAgICBpbmZvLnNlbWFudGljXG4gICAgICAgICk7XG4gICAgICAgIGVudHJ5LmJ1ZmZlciA9IGRlY29kZU1hdGVyaWFsUHJvcGVydHkoe1xuICAgICAgICAgIGluZm8sXG4gICAgICAgICAgb2Zmc2V0cyxcbiAgICAgICAgICBtYXRlcmlhbFNJRDogbWF0ZXJpYWwubWF0ZXJpYWxTSUQsXG4gICAgICAgICAgbWF0ZXJpYWxDb3VudFBlckJ1ZmZlclZpZXcsXG4gICAgICAgICAgbGF5b3V0LFxuICAgICAgICAgIG1heEFycmF5RWxlbWVudHM6IE1BWF9BUlJBWV9FTEVNRU5UUyxcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChzb3VyY2UgPT09ICd1bmlmb3JtJykge1xuICAgICAgICAgIGZvciAoY29uc3QgbG9jYXRpb24gb2YgZW50cnkuYnVmZmVyLmxvY2F0aW9ucykge1xuICAgICAgICAgICAgbG9jYXRpb24ud2FybmluZ3MucHVzaCgnVGhlIHNoYWRlciByZWFkcyB0aGlzIHZhbHVlIGZyb20gYSByZWFsIHVuaWZvcm0sIG5vdCBmcm9tIHRoZSBkYXRhIHRleHR1cmUuJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChyZWFsVW5pZm9ybXMgIT0gbnVsbCkge1xuICAgICAgICBlbnRyeS5yZWFsVW5pZm9ybSA9IHJlYWxVbmlmb3Jtcy5nZXQoaW5mby5zZW1hbnRpYykgPz8geyBsb2NhdGlvbkZvdW5kOiBmYWxzZSwgdmFsdWU6IG51bGwgfTtcbiAgICAgIH1cblxuICAgICAgZW50cmllcy5wdXNoKGVudHJ5KTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgYXZhaWxhYmxlOiB0cnVlLFxuICAgICAgYmFja2VuZCxcbiAgICAgIHByb2Nlc3NBcHByb2FjaCxcbiAgICAgIG1hdGVyaWFsVHlwZU5hbWU6IG1hdGVyaWFsLm1hdGVyaWFsVHlwZU5hbWUsXG4gICAgICBtYXRlcmlhbFVJRDogbWF0ZXJpYWwubWF0ZXJpYWxVSUQsXG4gICAgICBtYXRlcmlhbFNJRDogbWF0ZXJpYWwubWF0ZXJpYWxTSUQsXG4gICAgICBtYXRlcmlhbENvdW50UGVyQnVmZmVyVmlldyxcbiAgICAgIGJ1ZmZlclZpZXdJbmRleCxcbiAgICAgIHNoYWRlclByb2dyYW1VaWQsXG4gICAgICBidWZmZXJXaWR0aCxcbiAgICAgIHNoYXJlZFByb2dyYW1NYXRlcmlhbE1pc21hdGNoOlxuICAgICAgICAhaXNXZWJHUFUgJiYgc2hhZGVyUHJvZ3JhbVVpZCA+PSAwXG4gICAgICAgICAgPyBTaGFkZXJQYXJhbWV0ZXJEZWJ1Z2dlci5fX2lzUHJvZ3JhbU1hdGVyaWFsTWlzbWF0Y2goZW5naW5lLCBzaGFkZXJQcm9ncmFtVWlkLCBtYXRlcmlhbClcbiAgICAgICAgICA6IGZhbHNlLFxuICAgICAgZW50cmllcyxcbiAgICB9O1xuICB9XG5cbiAgc3RhdGljIHJlcG9ydEdsb2JhbHMoZW5naW5lOiBFbmdpbmUsIHNoYWRlclByb2dyYW1VaWQ/OiBDR0FQSVJlc291cmNlSGFuZGxlKTogR2xvYmFsUGFyYW1ldGVyUmVwb3J0IHtcbiAgICBjb25zdCBiYWNrZW5kID0gZ2V0QmFja2VuZChlbmdpbmUpO1xuICAgIGNvbnN0IHByb2Nlc3NBcHByb2FjaCA9IGVuZ2luZS5wcm9jZXNzQXBwcm9hY2guc3RyO1xuICAgIGNvbnN0IGF2YWlsYWJsZSA9IGJhY2tlbmQgIT09ICdOb25lJztcbiAgICBpZiAoIWF2YWlsYWJsZSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgYXZhaWxhYmxlOiBmYWxzZSxcbiAgICAgICAgcmVhc29uOiBgU2hhZGVyIHBhcmFtZXRlciBpbnNwZWN0aW9uIGlzIGF2YWlsYWJsZSBpbiBXZWJHTDIgYW5kIFdlYkdQVSAoY3VycmVudDogJHtwcm9jZXNzQXBwcm9hY2h9KS5gLFxuICAgICAgICBiYWNrZW5kLFxuICAgICAgICBwcm9jZXNzQXBwcm9hY2gsXG4gICAgICAgIGJ1ZmZlcldpZHRoOiAwLFxuICAgICAgICBzaGFkZXJQcm9ncmFtVWlkOiAtMSxcbiAgICAgICAgZW50cmllczogW10sXG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnN0IGJ1ZmZlcldpZHRoID0gZ2V0QnVmZmVyV2lkdGgoZW5naW5lLCBiYWNrZW5kKTtcbiAgICBjb25zdCBsYXlvdXQgPSBjcmVhdGVMYXlvdXRTb3VyY2UoZW5naW5lLCBidWZmZXJXaWR0aCk7XG4gICAgY29uc3QgaXNXZWJHUFUgPSBiYWNrZW5kID09PSAnV2ViR1BVJztcbiAgICBjb25zdCByZWFsVW5pZm9ybXMgPVxuICAgICAgIWlzV2ViR1BVICYmIHNoYWRlclByb2dyYW1VaWQgIT0gbnVsbCAmJiBzaGFkZXJQcm9ncmFtVWlkID49IDBcbiAgICAgICAgPyBTaGFkZXJQYXJhbWV0ZXJEZWJ1Z2dlci5yZWFkUmVhbFVuaWZvcm1zKGVuZ2luZSwgc2hhZGVyUHJvZ3JhbVVpZClcbiAgICAgICAgOiBudWxsO1xuXG4gICAgY29uc3QgZW50cmllczogU2hhZGVyUGFyYW1ldGVyRW50cnlbXSA9IGVuZ2luZS5nbG9iYWxEYXRhUmVwb3NpdG9yeS5nZXRQcm9wZXJ0eVRhYmxlKCkubWFwKHByb3BlcnR5ID0+IHtcbiAgICAgIGNvbnN0IGluZm86IFNoYWRlclNlbWFudGljc0luZm8gPSBwcm9wZXJ0eS5pbmZvO1xuICAgICAgY29uc3Qgc291cmNlOiBTaGFkZXJQYXJhbWV0ZXJTb3VyY2UgPSBpc1dlYkdQVVxuICAgICAgICA/ICdzdG9yYWdlQnVmZmVyJ1xuICAgICAgICA6IGluZm8ubmVlZFVuaWZvcm1JbkRhdGFUZXh0dXJlTW9kZVxuICAgICAgICAgID8gJ3VuaWZvcm0nXG4gICAgICAgICAgOiAnZGF0YVRleHR1cmUnO1xuICAgICAgY29uc3QgZW50cnk6IFNoYWRlclBhcmFtZXRlckVudHJ5ID0ge1xuICAgICAgICBzZW1hbnRpYzogaW5mby5zZW1hbnRpYyxcbiAgICAgICAgc3RhZ2U6IGluZm8uc3RhZ2Uuc3RyLFxuICAgICAgICBjb21wb3NpdGlvblR5cGU6IGluZm8uY29tcG9zaXRpb25UeXBlLnN0cixcbiAgICAgICAgY29tcG9uZW50VHlwZTogaW5mby5jb21wb25lbnRUeXBlLnN0cixcbiAgICAgICAgYXJyYXlMZW5ndGg6IGluZm8uYXJyYXlMZW5ndGgsXG4gICAgICAgIGlzVGV4dHVyZTogZmFsc2UsXG4gICAgICAgIGlzSW50ZXJuYWxTZXR0aW5nOiBpbmZvLmlzSW50ZXJuYWxTZXR0aW5nID09PSB0cnVlLFxuICAgICAgICBuZWVkVW5pZm9ybUluRGF0YVRleHR1cmVNb2RlOiBpbmZvLm5lZWRVbmlmb3JtSW5EYXRhVGV4dHVyZU1vZGUgPT09IHRydWUsXG4gICAgICAgIHNvbG9EYXR1bTogZmFsc2UsXG4gICAgICAgIHNvdXJjZSxcbiAgICAgICAgdmFsdWVQcmV2aWV3OiBzZXJpYWxpemVWYWx1ZShwcm9wZXJ0eS52YWx1ZSksXG4gICAgICB9O1xuICAgICAgZW50cnkuYnVmZmVyID0gZGVjb2RlR2xvYmFsUHJvcGVydHkoe1xuICAgICAgICBpbmZvLFxuICAgICAgICBvZmZzZXQ6IHByb3BlcnR5LnZlYzRJbmRleCxcbiAgICAgICAgbGF5b3V0LFxuICAgICAgICBtYXhBcnJheUVsZW1lbnRzOiBNQVhfQVJSQVlfRUxFTUVOVFMsXG4gICAgICB9KTtcbiAgICAgIGlmIChzb3VyY2UgPT09ICd1bmlmb3JtJykge1xuICAgICAgICBmb3IgKGNvbnN0IGxvY2F0aW9uIG9mIGVudHJ5LmJ1ZmZlci5sb2NhdGlvbnMpIHtcbiAgICAgICAgICBsb2NhdGlvbi53YXJuaW5ncy5wdXNoKCdUaGUgc2hhZGVyIHJlYWRzIHRoaXMgdmFsdWUgZnJvbSBhIHJlYWwgdW5pZm9ybSwgbm90IGZyb20gdGhlIGRhdGEgdGV4dHVyZS4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHJlYWxVbmlmb3JtcyAhPSBudWxsKSB7XG4gICAgICAgIGVudHJ5LnJlYWxVbmlmb3JtID0gcmVhbFVuaWZvcm1zLmdldChpbmZvLnNlbWFudGljKSA/PyB7IGxvY2F0aW9uRm91bmQ6IGZhbHNlLCB2YWx1ZTogbnVsbCB9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIGVudHJ5O1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGF2YWlsYWJsZTogdHJ1ZSxcbiAgICAgIGJhY2tlbmQsXG4gICAgICBwcm9jZXNzQXBwcm9hY2gsXG4gICAgICBidWZmZXJXaWR0aCxcbiAgICAgIHNoYWRlclByb2dyYW1VaWQ6IHNoYWRlclByb2dyYW1VaWQgPz8gLTEsXG4gICAgICBlbnRyaWVzLFxuICAgIH07XG4gIH1cblxuICBzdGF0aWMgcmVwb3J0Q29tcG9uZW50KGVuZ2luZTogRW5naW5lLCBjb21wb25lbnQ6IENvbXBvbmVudCk6IENvbXBvbmVudFBhcmFtZXRlclJlcG9ydCB7XG4gICAgY29uc3QgY29tcG9uZW50Q2xhc3MgPSBjb21wb25lbnQuY29uc3RydWN0b3IgYXMgdHlwZW9mIENvbXBvbmVudDtcbiAgICBjb25zdCBjb21wb25lbnRDbGFzc05hbWUgPSBjb21wb25lbnRDbGFzcy5uYW1lO1xuICAgIGNvbnN0IGJhY2tlbmQgPSBnZXRCYWNrZW5kKGVuZ2luZSk7XG4gICAgY29uc3QgYXZhaWxhYmxlID0gYmFja2VuZCAhPT0gJ05vbmUnO1xuICAgIGlmICghYXZhaWxhYmxlKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBhdmFpbGFibGU6IGZhbHNlLFxuICAgICAgICByZWFzb246IGBTaGFkZXIgcGFyYW1ldGVyIGluc3BlY3Rpb24gaXMgYXZhaWxhYmxlIGluIFdlYkdMMiBhbmQgV2ViR1BVIChjdXJyZW50OiAke2VuZ2luZS5wcm9jZXNzQXBwcm9hY2guc3RyfSkuYCxcbiAgICAgICAgYmFja2VuZCxcbiAgICAgICAgY29tcG9uZW50Q2xhc3NOYW1lLFxuICAgICAgICBjb21wb25lbnRTSUQ6IGNvbXBvbmVudC5jb21wb25lbnRTSUQsXG4gICAgICAgIGNvbXBvbmVudENvdW50UGVyQnVmZmVyVmlldzogMCxcbiAgICAgICAgZW50cmllczogW10sXG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnN0IG1lbWJlckluZm9NYXAgPSBDb21wb25lbnQuZ2V0TWVtYmVySW5mbyhlbmdpbmUpLmdldChjb21wb25lbnRDbGFzcyk7XG4gICAgaWYgKG1lbWJlckluZm9NYXAgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgYXZhaWxhYmxlOiBmYWxzZSxcbiAgICAgICAgcmVhc29uOiBgTm8gbWVtYmVyIGluZm9ybWF0aW9uIGlzIHJlZ2lzdGVyZWQgZm9yICR7Y29tcG9uZW50Q2xhc3NOYW1lfS5gLFxuICAgICAgICBiYWNrZW5kLFxuICAgICAgICBjb21wb25lbnRDbGFzc05hbWUsXG4gICAgICAgIGNvbXBvbmVudFNJRDogY29tcG9uZW50LmNvbXBvbmVudFNJRCxcbiAgICAgICAgY29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3OiAwLFxuICAgICAgICBlbnRyaWVzOiBbXSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc3QgaXNXZWJHUFUgPSBiYWNrZW5kID09PSAnV2ViR1BVJztcbiAgICBjb25zdCBjb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXcgPSBDb21wb25lbnQuZ2V0Q29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3KGVuZ2luZSkuZ2V0KGNvbXBvbmVudENsYXNzKSA/PyAxO1xuICAgIGNvbnN0IGFycmF5TGVuZ3RoTWFwID0gQ29tcG9uZW50LmdldEFycmF5TGVuZ3RoT2ZNZW1iZXIoZW5naW5lKS5nZXQoY29tcG9uZW50Q2xhc3MpO1xuICAgIGNvbnN0IGJ1ZmZlcldpZHRoID0gZ2V0QnVmZmVyV2lkdGgoZW5naW5lLCBiYWNrZW5kKTtcbiAgICBjb25zdCBsYXlvdXQgPSBjcmVhdGVMYXlvdXRTb3VyY2UoZW5naW5lLCBidWZmZXJXaWR0aCk7XG4gICAgY29uc3QgZW50cmllczogU2hhZGVyUGFyYW1ldGVyRW50cnlbXSA9IFtdO1xuXG4gICAgZm9yIChjb25zdCBbbWVtYmVyTmFtZSwgbWVtYmVySW5mb10gb2YgbWVtYmVySW5mb01hcCkge1xuICAgICAgaWYgKG1lbWJlckluZm8uYnVmZmVyVXNlICE9PSBCdWZmZXJVc2UuR1BVSW5zdGFuY2VEYXRhKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3Qgb2Zmc2V0cyA9IENvbXBvbmVudC5nZXRMb2NhdGlvbk9mZnNldE9mTWVtYmVyT2ZDb21wb25lbnQoZW5naW5lLCBjb21wb25lbnRDbGFzcywgbWVtYmVyTmFtZSk7XG4gICAgICBjb25zdCBhcnJheUxlbmd0aCA9IGFycmF5TGVuZ3RoTWFwPy5nZXQobWVtYmVyTmFtZSk7XG4gICAgICBsZXQgYnVmZmVyO1xuICAgICAgaWYgKG1lbWJlckluZm8uaXNWYXJpYWJsZUxlbmd0aCA9PT0gdHJ1ZSkge1xuICAgICAgICBjb25zdCBsb2NhdGlvbk1lbWJlck5hbWUgPSBDb21wb25lbnQuX2dldFZhcmlhYmxlTGVuZ3RoTG9jYXRpb25NZW1iZXJOYW1lKG1lbWJlck5hbWUpO1xuICAgICAgICBjb25zdCBsb2NhdGlvbk9mZnNldHMgPSBDb21wb25lbnQuZ2V0TG9jYXRpb25PZmZzZXRPZk1lbWJlck9mQ29tcG9uZW50KFxuICAgICAgICAgIGVuZ2luZSxcbiAgICAgICAgICBjb21wb25lbnRDbGFzcyxcbiAgICAgICAgICBsb2NhdGlvbk1lbWJlck5hbWVcbiAgICAgICAgKTtcbiAgICAgICAgYnVmZmVyID0gZGVjb2RlVmFyaWFibGVMZW5ndGhDb21wb25lbnRNZW1iZXIoe1xuICAgICAgICAgIG1lbWJlckluZm86IHsgY29tcG9zaXRpb25UeXBlOiBtZW1iZXJJbmZvLmNvbXBvc2l0aW9uVHlwZSwgYXJyYXlMZW5ndGgsIGlzVmFyaWFibGVMZW5ndGg6IHRydWUgfSxcbiAgICAgICAgICBvZmZzZXRzLFxuICAgICAgICAgIGxvY2F0aW9uTWVtYmVyT2Zmc2V0czogbG9jYXRpb25PZmZzZXRzLFxuICAgICAgICAgIGNvbXBvbmVudFNJRDogY29tcG9uZW50LmNvbXBvbmVudFNJRCxcbiAgICAgICAgICBjb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXcsXG4gICAgICAgICAgbGF5b3V0LFxuICAgICAgICAgIG1heEFycmF5RWxlbWVudHM6IE1BWF9BUlJBWV9FTEVNRU5UUyxcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBidWZmZXIgPSBkZWNvZGVDb21wb25lbnRNZW1iZXIoe1xuICAgICAgICAgIG1lbWJlckluZm86IHsgY29tcG9zaXRpb25UeXBlOiBtZW1iZXJJbmZvLmNvbXBvc2l0aW9uVHlwZSwgYXJyYXlMZW5ndGggfSxcbiAgICAgICAgICBvZmZzZXRzLFxuICAgICAgICAgIGNvbXBvbmVudFNJRDogY29tcG9uZW50LmNvbXBvbmVudFNJRCxcbiAgICAgICAgICBjb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXcsXG4gICAgICAgICAgbGF5b3V0LFxuICAgICAgICAgIG1heEFycmF5RWxlbWVudHM6IE1BWF9BUlJBWV9FTEVNRU5UUyxcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGVudHJpZXMucHVzaCh7XG4gICAgICAgIHNlbWFudGljOiBtZW1iZXJOYW1lLFxuICAgICAgICBzdGFnZTogbWVtYmVySW5mby5zaGFkZXJUeXBlLnN0cixcbiAgICAgICAgY29tcG9zaXRpb25UeXBlOiBtZW1iZXJJbmZvLmNvbXBvc2l0aW9uVHlwZS5zdHIsXG4gICAgICAgIGNvbXBvbmVudFR5cGU6IG1lbWJlckluZm8uY29tcG9uZW50VHlwZS5zdHIsXG4gICAgICAgIGFycmF5TGVuZ3RoLFxuICAgICAgICBpc1RleHR1cmU6IGZhbHNlLFxuICAgICAgICBpc0ludGVybmFsU2V0dGluZzogZmFsc2UsXG4gICAgICAgIG5lZWRVbmlmb3JtSW5EYXRhVGV4dHVyZU1vZGU6IGZhbHNlLFxuICAgICAgICBzb2xvRGF0dW06IGZhbHNlLFxuICAgICAgICBzb3VyY2U6IGlzV2ViR1BVID8gJ3N0b3JhZ2VCdWZmZXInIDogJ2RhdGFUZXh0dXJlJyxcbiAgICAgICAgdmFsdWVQcmV2aWV3OiBpbnRlcnByZXRUZXhlbHMoYnVmZmVyLmxvY2F0aW9uc1swXSksXG4gICAgICAgIGJ1ZmZlcixcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBhdmFpbGFibGU6IHRydWUsXG4gICAgICBiYWNrZW5kLFxuICAgICAgY29tcG9uZW50Q2xhc3NOYW1lLFxuICAgICAgY29tcG9uZW50U0lEOiBjb21wb25lbnQuY29tcG9uZW50U0lELFxuICAgICAgY29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3LFxuICAgICAgZW50cmllcyxcbiAgICB9O1xuICB9XG5cbiAgc3RhdGljIHJlcG9ydEVudGl0eShlbmdpbmU6IEVuZ2luZSwgZW50aXR5OiBJRW50aXR5KTogRW50aXR5UGFyYW1ldGVyUmVwb3J0IHtcbiAgICBjb25zdCBtYXRlcmlhbHM6IE1hdGVyaWFsUGFyYW1ldGVyUmVwb3J0W10gPSBbXTtcbiAgICBjb25zdCBtZXNoID0gZW50aXR5LnRyeVRvR2V0TWVzaCgpPy5tZXNoO1xuICAgIGlmIChtZXNoICE9IG51bGwpIHtcbiAgICAgIGZvciAoY29uc3QgcHJpbWl0aXZlIG9mIG1lc2gucHJpbWl0aXZlcykge1xuICAgICAgICBtYXRlcmlhbHMucHVzaChTaGFkZXJQYXJhbWV0ZXJEZWJ1Z2dlci5yZXBvcnRNYXRlcmlhbChlbmdpbmUsIHByaW1pdGl2ZS5tYXRlcmlhbCwgcHJpbWl0aXZlKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgY29tcG9uZW50czogQ29tcG9uZW50UGFyYW1ldGVyUmVwb3J0W10gPSBbXTtcbiAgICBjb25zdCBjYW5kaWRhdGVzID0gW1xuICAgICAgZW50aXR5LnRyeVRvR2V0U2NlbmVHcmFwaD8uKCksXG4gICAgICBlbnRpdHkudHJ5VG9HZXRUcmFuc2Zvcm0/LigpLFxuICAgICAgZW50aXR5LnRyeVRvR2V0Q2FtZXJhPy4oKSxcbiAgICAgIGVudGl0eS50cnlUb0dldExpZ2h0Py4oKSxcbiAgICAgIGVudGl0eS50cnlUb0dldFNrZWxldGFsPy4oKSxcbiAgICAgIGVudGl0eS50cnlUb0dldEJsZW5kU2hhcGU/LigpLFxuICAgICAgZW50aXR5LnRyeVRvR2V0TWVzaFJlbmRlcmVyPy4oKSxcbiAgICAgIGVudGl0eS50cnlUb0dldFBoeXNpY3M/LigpLFxuICAgIF07XG4gICAgZm9yIChjb25zdCBjb21wb25lbnQgb2YgY2FuZGlkYXRlcykge1xuICAgICAgaWYgKGNvbXBvbmVudCAhPSBudWxsKSB7XG4gICAgICAgIGNvbXBvbmVudHMucHVzaChTaGFkZXJQYXJhbWV0ZXJEZWJ1Z2dlci5yZXBvcnRDb21wb25lbnQoZW5naW5lLCBjb21wb25lbnQpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4geyBlbnRpdHlVSUQ6IGVudGl0eS5lbnRpdHlVSUQsIG1hdGVyaWFscywgY29tcG9uZW50cyB9O1xuICB9XG5cbiAgc3RhdGljIHJlcG9ydEFsbChlbmdpbmU6IEVuZ2luZSk6IEFsbFBhcmFtZXRlclJlcG9ydCB7XG4gICAgY29uc3QgbGl2ZU1hdGVyaWFscyA9IGVuZ2luZS5tYXRlcmlhbFJlcG9zaXRvcnlcbiAgICAgIC5nZXRBbGxNYXRlcmlhbHMoKVxuICAgICAgLm1hcChyZWYgPT4gcmVmLmRlcmVmKCkpXG4gICAgICAuZmlsdGVyKChtYXRlcmlhbCk6IG1hdGVyaWFsIGlzIE1hdGVyaWFsID0+IG1hdGVyaWFsICE9IG51bGwpO1xuICAgIGNvbnN0IG1hdGVyaWFscyA9IGxpdmVNYXRlcmlhbHMubWFwKG1hdGVyaWFsID0+IFNoYWRlclBhcmFtZXRlckRlYnVnZ2VyLnJlcG9ydE1hdGVyaWFsKGVuZ2luZSwgbWF0ZXJpYWwpKTtcbiAgICBjb25zdCBmaXJzdFByb2dyYW0gPSBtYXRlcmlhbHMuZmluZChyZXBvcnQgPT4gcmVwb3J0LnNoYWRlclByb2dyYW1VaWQgPj0gMCk/LnNoYWRlclByb2dyYW1VaWQ7XG4gICAgY29uc3QgZ2xvYmFscyA9IFNoYWRlclBhcmFtZXRlckRlYnVnZ2VyLnJlcG9ydEdsb2JhbHMoZW5naW5lLCBmaXJzdFByb2dyYW0pO1xuICAgIHJldHVybiB7IGdsb2JhbHMsIG1hdGVyaWFscyB9O1xuICB9XG5cbiAgc3RhdGljIHJlYWRSZWFsVW5pZm9ybXMoZW5naW5lOiBFbmdpbmUsIHNoYWRlclByb2dyYW1VaWQ6IENHQVBJUmVzb3VyY2VIYW5kbGUpOiBNYXA8c3RyaW5nLCBSZWFsVW5pZm9ybUluZm8+IHwgbnVsbCB7XG4gICAgaWYgKGdldEJhY2tlbmQoZW5naW5lKSAhPT0gJ1dlYkdMMicpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBwcm9ncmFtID0gZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmdldFdlYkdMUmVzb3VyY2Uoc2hhZGVyUHJvZ3JhbVVpZCkgYXMgUm5XZWJHTFByb2dyYW0gfCBudWxsO1xuICAgIGlmIChwcm9ncmFtID09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBnbHcgPSBlbmdpbmUuZ2V0Q3VycmVudFdlYkdMQ29udGV4dFdyYXBwZXIoKTtcbiAgICBpZiAoZ2x3ID09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBnbCA9IGdsdy5nZXRSYXdDb250ZXh0KCk7XG4gICAgY29uc3QgcmVzdWx0ID0gbmV3IE1hcDxzdHJpbmcsIFJlYWxVbmlmb3JtSW5mbz4oKTtcblxuICAgIGNvbnN0IGluZm9NYXAgPSBwcm9ncmFtLl9zaGFkZXJTZW1hbnRpY3NJbmZvTWFwO1xuICAgIGlmIChpbmZvTWFwICE9IG51bGwpIHtcbiAgICAgIGZvciAoY29uc3Qgc2VtYW50aWMgb2YgaW5mb01hcC5rZXlzKCkpIHtcbiAgICAgICAgY29uc3QgbG9jYXRpb24gPSAocHJvZ3JhbSBhcyBhbnkpW3NlbWFudGljXTtcbiAgICAgICAgaWYgKGxvY2F0aW9uID09IG51bGwpIHtcbiAgICAgICAgICByZXN1bHQuc2V0KHNlbWFudGljLCB7IGxvY2F0aW9uRm91bmQ6IGZhbHNlLCB2YWx1ZTogbnVsbCB9KTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJlc3VsdC5zZXQoc2VtYW50aWMsIHtcbiAgICAgICAgICAgIGxvY2F0aW9uRm91bmQ6IHRydWUsXG4gICAgICAgICAgICB2YWx1ZTogc2VyaWFsaXplVmFsdWUoZ2wuZ2V0VW5pZm9ybShwcm9ncmFtLCBsb2NhdGlvbikpLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChfZSkge1xuICAgICAgICAgIHJlc3VsdC5zZXQoc2VtYW50aWMsIHsgbG9jYXRpb25Gb3VuZDogZmFsc2UsIHZhbHVlOiBudWxsIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVGhlc2UgdHdvIHVuaWZvcm1zIGFyZSBzdG9yZWQgb24gdGhlIHByb2dyYW0gYnkgc2V0dXBCYXNpY1VuaWZvcm1Mb2NhdGlvbnMoKSBhbmRcbiAgICAvLyBhcmUgbm90IHBhcnQgb2YgX3NoYWRlclNlbWFudGljc0luZm9NYXAuXG4gICAgZm9yIChjb25zdCBiYXNpY05hbWUgb2YgWydkYXRhVGV4dHVyZScsICdjdXJyZW50Q29tcG9uZW50U0lEcyddIGFzIGNvbnN0KSB7XG4gICAgICBjb25zdCBsb2NhdGlvbiA9IChwcm9ncmFtIGFzIGFueSlbYmFzaWNOYW1lXTtcbiAgICAgIGlmIChsb2NhdGlvbiA9PSBudWxsKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgdHJ5IHtcbiAgICAgICAgcmVzdWx0LnNldChiYXNpY05hbWUsIHtcbiAgICAgICAgICBsb2NhdGlvbkZvdW5kOiB0cnVlLFxuICAgICAgICAgIHZhbHVlOiBzZXJpYWxpemVWYWx1ZShnbC5nZXRVbmlmb3JtKHByb2dyYW0sIGxvY2F0aW9uKSksXG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCAoX2UpIHtcbiAgICAgICAgcmVzdWx0LnNldChiYXNpY05hbWUsIHsgbG9jYXRpb25Gb3VuZDogZmFsc2UsIHZhbHVlOiBudWxsIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBzdGF0aWMgZGVjb2RlKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIHZlYzRJbmRleDogbnVtYmVyXG4gICk6IHsgdmVjNEluZGV4OiBudW1iZXI7IGJ5dGVPZmZzZXQ6IG51bWJlcjsgcm93OiBudW1iZXI7IGNvbDogbnVtYmVyOyB2ZWM0OiBSYXdWZWM0IHwgbnVsbCB9IHwgbnVsbCB7XG4gICAgY29uc3QgYmFja2VuZCA9IGdldEJhY2tlbmQoZW5naW5lKTtcbiAgICBpZiAoYmFja2VuZCA9PT0gJ05vbmUnKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3Qgd2lkdGggPSBnZXRCdWZmZXJXaWR0aChlbmdpbmUsIGJhY2tlbmQpO1xuICAgIGNvbnN0IGxheW91dCA9IGNyZWF0ZUxheW91dFNvdXJjZShlbmdpbmUsIHdpZHRoKTtcbiAgICByZXR1cm4ge1xuICAgICAgdmVjNEluZGV4LFxuICAgICAgYnl0ZU9mZnNldDogdmVjNEluZGV4ICogMTYsXG4gICAgICByb3c6IHdpZHRoID4gMCA/IE1hdGguZmxvb3IodmVjNEluZGV4IC8gd2lkdGgpIDogLTEsXG4gICAgICBjb2w6IHdpZHRoID4gMCA/IHZlYzRJbmRleCAlIHdpZHRoIDogLTEsXG4gICAgICB2ZWM0OiBsYXlvdXQucmVhZFZlYzQodmVjNEluZGV4KSxcbiAgICB9O1xuICB9XG5cbiAgc3RhdGljIGZvcm1hdEVudHJpZXMoZW50cmllczogU2hhZGVyUGFyYW1ldGVyRW50cnlbXSk6IEFycmF5PFJlY29yZDxzdHJpbmcsIHVua25vd24+PiB7XG4gICAgY29uc3Qgcm93czogQXJyYXk8UmVjb3JkPHN0cmluZywgdW5rbm93bj4+ID0gW107XG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XG4gICAgICBpZiAoZW50cnkuYnVmZmVyID09IG51bGwgfHwgZW50cnkuYnVmZmVyLmxvY2F0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcm93cy5wdXNoKHtcbiAgICAgICAgICBzZW1hbnRpYzogZW50cnkuc2VtYW50aWMsXG4gICAgICAgICAgYXJyYXlFbGVtZW50OiAnJyxcbiAgICAgICAgICBzb3VyY2U6IGVudHJ5LnNvdXJjZSxcbiAgICAgICAgICB2YWx1ZTogZW50cnkudmFsdWVQcmV2aWV3LFxuICAgICAgICAgIGZldGNoOiAnJyxcbiAgICAgICAgICB2ZWM0OiAnJyxcbiAgICAgICAgICBieXRlT2Zmc2V0OiAnJyxcbiAgICAgICAgICByb3c6ICcnLFxuICAgICAgICAgIGNvbDogJycsXG4gICAgICAgICAgdmVjNHM6ICcnLFxuICAgICAgICAgIHVuaWZvcm06IGVudHJ5LnJlYWxVbmlmb3JtPy5sb2NhdGlvbkZvdW5kID8gZW50cnkucmVhbFVuaWZvcm0udmFsdWUgOiAnJyxcbiAgICAgICAgICB3YXJuaW5nczogJycsXG4gICAgICAgIH0pO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGZvciAoY29uc3QgbG9jYXRpb24gb2YgZW50cnkuYnVmZmVyLmxvY2F0aW9ucykge1xuICAgICAgICByb3dzLnB1c2goe1xuICAgICAgICAgIHNlbWFudGljOiBlbnRyeS5zZW1hbnRpYyxcbiAgICAgICAgICBhcnJheUVsZW1lbnQ6IGxvY2F0aW9uLmFycmF5RWxlbWVudCA/PyAnJyxcbiAgICAgICAgICBzb3VyY2U6IGVudHJ5LnNvdXJjZSxcbiAgICAgICAgICB2YWx1ZTogZW50cnkudmFsdWVQcmV2aWV3LFxuICAgICAgICAgIGZldGNoOiBsb2NhdGlvbi5mZXRjaEZ1bmN0aW9uLFxuICAgICAgICAgIHZlYzQ6IGxvY2F0aW9uLnZlYzRJbmRleCxcbiAgICAgICAgICBieXRlT2Zmc2V0OiBsb2NhdGlvbi5ieXRlT2Zmc2V0LFxuICAgICAgICAgIHJvdzogbG9jYXRpb24ucm93ID49IDAgPyBsb2NhdGlvbi5yb3cgOiAnJyxcbiAgICAgICAgICBjb2w6IGxvY2F0aW9uLmNvbCA+PSAwID8gbG9jYXRpb24uY29sIDogJycsXG4gICAgICAgICAgdmVjNHM6IGxvY2F0aW9uLnZlYzRzLm1hcCh2ZWM0ID0+IHZlYzQuam9pbignLCcpKS5qb2luKCcgfCAnKSxcbiAgICAgICAgICB1bmlmb3JtOiBlbnRyeS5yZWFsVW5pZm9ybT8ubG9jYXRpb25Gb3VuZCA/IGVudHJ5LnJlYWxVbmlmb3JtLnZhbHVlIDogJycsXG4gICAgICAgICAgd2FybmluZ3M6IGxvY2F0aW9uLndhcm5pbmdzLmpvaW4oJzsgJyksXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcm93cztcbiAgfVxuXG4gIHN0YXRpYyBmb3JtYXQocmVwb3J0OiBNYXRlcmlhbFBhcmFtZXRlclJlcG9ydCB8IEdsb2JhbFBhcmFtZXRlclJlcG9ydCB8IENvbXBvbmVudFBhcmFtZXRlclJlcG9ydCk6IHVua25vd24ge1xuICAgIHJldHVybiB7XG4gICAgICAuLi5yZXBvcnQsXG4gICAgICBlbnRyaWVzOiBTaGFkZXJQYXJhbWV0ZXJEZWJ1Z2dlci5mb3JtYXRFbnRyaWVzKHJlcG9ydC5lbnRyaWVzKSxcbiAgICB9O1xuICB9XG5cbiAgc3RhdGljIGR1bXBNYXRlcmlhbChlbmdpbmU6IEVuZ2luZSwgbWF0ZXJpYWw6IE1hdGVyaWFsLCBwcmltaXRpdmU/OiBQcmltaXRpdmUpOiBNYXRlcmlhbFBhcmFtZXRlclJlcG9ydCB7XG4gICAgY29uc3QgcmVwb3J0ID0gU2hhZGVyUGFyYW1ldGVyRGVidWdnZXIucmVwb3J0TWF0ZXJpYWwoZW5naW5lLCBtYXRlcmlhbCwgcHJpbWl0aXZlKTtcbiAgICBjb25zb2xlLnRhYmxlKFNoYWRlclBhcmFtZXRlckRlYnVnZ2VyLmZvcm1hdEVudHJpZXMocmVwb3J0LmVudHJpZXMpKTtcbiAgICByZXR1cm4gcmVwb3J0O1xuICB9XG5cbiAgc3RhdGljIGR1bXBQcmltaXRpdmUoZW5naW5lOiBFbmdpbmUsIHByaW1pdGl2ZTogUHJpbWl0aXZlKTogTWF0ZXJpYWxQYXJhbWV0ZXJSZXBvcnQge1xuICAgIHJldHVybiBTaGFkZXJQYXJhbWV0ZXJEZWJ1Z2dlci5kdW1wTWF0ZXJpYWwoZW5naW5lLCBwcmltaXRpdmUubWF0ZXJpYWwsIHByaW1pdGl2ZSk7XG4gIH1cblxuICBzdGF0aWMgZHVtcEdsb2JhbHMoZW5naW5lOiBFbmdpbmUsIHNoYWRlclByb2dyYW1VaWQ/OiBDR0FQSVJlc291cmNlSGFuZGxlKTogR2xvYmFsUGFyYW1ldGVyUmVwb3J0IHtcbiAgICBjb25zdCByZXBvcnQgPSBTaGFkZXJQYXJhbWV0ZXJEZWJ1Z2dlci5yZXBvcnRHbG9iYWxzKGVuZ2luZSwgc2hhZGVyUHJvZ3JhbVVpZCk7XG4gICAgY29uc29sZS50YWJsZShTaGFkZXJQYXJhbWV0ZXJEZWJ1Z2dlci5mb3JtYXRFbnRyaWVzKHJlcG9ydC5lbnRyaWVzKSk7XG4gICAgcmV0dXJuIHJlcG9ydDtcbiAgfVxuXG4gIHN0YXRpYyBkdW1wRW50aXR5KGVuZ2luZTogRW5naW5lLCBlbnRpdHk6IElFbnRpdHkpOiBFbnRpdHlQYXJhbWV0ZXJSZXBvcnQge1xuICAgIGNvbnN0IHJlcG9ydCA9IFNoYWRlclBhcmFtZXRlckRlYnVnZ2VyLnJlcG9ydEVudGl0eShlbmdpbmUsIGVudGl0eSk7XG4gICAgZm9yIChjb25zdCBtYXRlcmlhbCBvZiByZXBvcnQubWF0ZXJpYWxzKSB7XG4gICAgICBjb25zb2xlLmxvZyhgTWF0ZXJpYWw6ICR7bWF0ZXJpYWwubWF0ZXJpYWxUeXBlTmFtZX0gKFNJRCAke21hdGVyaWFsLm1hdGVyaWFsU0lEfSlgKTtcbiAgICAgIGNvbnNvbGUudGFibGUoU2hhZGVyUGFyYW1ldGVyRGVidWdnZXIuZm9ybWF0RW50cmllcyhtYXRlcmlhbC5lbnRyaWVzKSk7XG4gICAgfVxuICAgIHJldHVybiByZXBvcnQ7XG4gIH1cblxuICBzdGF0aWMgZHVtcEFsbChlbmdpbmU6IEVuZ2luZSk6IEFsbFBhcmFtZXRlclJlcG9ydCB7XG4gICAgY29uc3QgcmVwb3J0ID0gU2hhZGVyUGFyYW1ldGVyRGVidWdnZXIucmVwb3J0QWxsKGVuZ2luZSk7XG4gICAgY29uc29sZS5sb2coJ0dsb2JhbHMnKTtcbiAgICBjb25zb2xlLnRhYmxlKFNoYWRlclBhcmFtZXRlckRlYnVnZ2VyLmZvcm1hdEVudHJpZXMocmVwb3J0Lmdsb2JhbHMuZW50cmllcykpO1xuICAgIGZvciAoY29uc3QgbWF0ZXJpYWwgb2YgcmVwb3J0Lm1hdGVyaWFscykge1xuICAgICAgY29uc29sZS5sb2coYE1hdGVyaWFsOiAke21hdGVyaWFsLm1hdGVyaWFsVHlwZU5hbWV9IChTSUQgJHttYXRlcmlhbC5tYXRlcmlhbFNJRH0pYCk7XG4gICAgICBjb25zb2xlLnRhYmxlKFNoYWRlclBhcmFtZXRlckRlYnVnZ2VyLmZvcm1hdEVudHJpZXMobWF0ZXJpYWwuZW50cmllcykpO1xuICAgIH1cbiAgICByZXR1cm4gcmVwb3J0O1xuICB9XG5cbiAgc3RhdGljIGluc3RhbGxDb25zb2xlSGVscGVycyhlbmdpbmU6IEVuZ2luZSwgdGFyZ2V0OiBhbnkgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IHVuZGVmaW5lZCk6IHZvaWQge1xuICAgIGlmICh0YXJnZXQgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0YXJnZXQuUm5TaGFkZXJQYXJhbWV0ZXJzID0ge1xuICAgICAgcmVwb3J0QWxsOiAoKSA9PiBTaGFkZXJQYXJhbWV0ZXJEZWJ1Z2dlci5yZXBvcnRBbGwoZW5naW5lKSxcbiAgICAgIHJlcG9ydE1hdGVyaWFsOiAobWF0ZXJpYWw6IE1hdGVyaWFsLCBwcmltaXRpdmU/OiBQcmltaXRpdmUpID0+XG4gICAgICAgIFNoYWRlclBhcmFtZXRlckRlYnVnZ2VyLnJlcG9ydE1hdGVyaWFsKGVuZ2luZSwgbWF0ZXJpYWwsIHByaW1pdGl2ZSksXG4gICAgICByZXBvcnRFbnRpdHk6IChlbnRpdHk6IElFbnRpdHkpID0+IFNoYWRlclBhcmFtZXRlckRlYnVnZ2VyLnJlcG9ydEVudGl0eShlbmdpbmUsIGVudGl0eSksXG4gICAgICBnbG9iYWxzOiAoc2hhZGVyUHJvZ3JhbVVpZD86IENHQVBJUmVzb3VyY2VIYW5kbGUpID0+XG4gICAgICAgIFNoYWRlclBhcmFtZXRlckRlYnVnZ2VyLnJlcG9ydEdsb2JhbHMoZW5naW5lLCBzaGFkZXJQcm9ncmFtVWlkKSxcbiAgICAgIGRlY29kZTogKHZlYzRJbmRleDogbnVtYmVyKSA9PiBTaGFkZXJQYXJhbWV0ZXJEZWJ1Z2dlci5kZWNvZGUoZW5naW5lLCB2ZWM0SW5kZXgpLFxuICAgICAgZHVtcEFsbDogKCkgPT4gU2hhZGVyUGFyYW1ldGVyRGVidWdnZXIuZHVtcEFsbChlbmdpbmUpLFxuICAgICAgZHVtcFByaW1pdGl2ZTogKHByaW1pdGl2ZTogUHJpbWl0aXZlKSA9PiBTaGFkZXJQYXJhbWV0ZXJEZWJ1Z2dlci5kdW1wUHJpbWl0aXZlKGVuZ2luZSwgcHJpbWl0aXZlKSxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZXRTaGFkZXJQcm9ncmFtVWlkKG1hdGVyaWFsOiBNYXRlcmlhbCwgcHJpbWl0aXZlPzogUHJpbWl0aXZlKTogQ0dBUElSZXNvdXJjZUhhbmRsZSB7XG4gICAgaWYgKHByaW1pdGl2ZSAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gbWF0ZXJpYWwuZ2V0U2hhZGVyUHJvZ3JhbVVpZChwcmltaXRpdmUpO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGJlbG9uZ1ByaW1pdGl2ZSBvZiBtYXRlcmlhbC5nZXRCZWxvbmdQcmltaXRpdmVzKCkudmFsdWVzKCkpIHtcbiAgICAgIHJldHVybiBtYXRlcmlhbC5nZXRTaGFkZXJQcm9ncmFtVWlkKGJlbG9uZ1ByaW1pdGl2ZSk7XG4gICAgfVxuICAgIHJldHVybiAtMTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9faXNQcm9ncmFtTWF0ZXJpYWxNaXNtYXRjaChcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBzaGFkZXJQcm9ncmFtVWlkOiBDR0FQSVJlc291cmNlSGFuZGxlLFxuICAgIG1hdGVyaWFsOiBNYXRlcmlhbFxuICApOiBib29sZWFuIHtcbiAgICBjb25zdCBwcm9ncmFtID0gZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmdldFdlYkdMUmVzb3VyY2Uoc2hhZGVyUHJvZ3JhbVVpZCkgYXMgUm5XZWJHTFByb2dyYW0gfCBudWxsO1xuICAgIGlmIChwcm9ncmFtID09IG51bGwgfHwgcHJvZ3JhbS5fbWF0ZXJpYWwgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gcHJvZ3JhbS5fbWF0ZXJpYWwuZGVyZWYoKSAhPT0gbWF0ZXJpYWw7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBQSxTQUFTLGlCQUFpQjtBQUUxQixTQUFTLGlCQUFpQjtBQUMxQixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLHVCQUF1QjtBQU9oQztBQUFBLEVBRUU7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxPQUNLO0FBZ0JQLElBQU0scUJBQXFCO0FBQzNCLElBQU0sOEJBQThCO0FBRXBDLFNBQVMsV0FBVyxRQUF3QztBQUMxRCxNQUFJLGdCQUFnQixpQkFBaUIsT0FBTyxlQUFlLEdBQUc7QUFDNUQsV0FBTztBQUFBLEVBQ1Q7QUFDQSxNQUFJLGdCQUFnQixpQkFBaUIsT0FBTyxlQUFlLEdBQUc7QUFDNUQsV0FBTztBQUFBLEVBQ1Q7QUFDQSxTQUFPO0FBQ1Q7QUFFQSxTQUFTLGVBQWUsUUFBZ0IsU0FB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
