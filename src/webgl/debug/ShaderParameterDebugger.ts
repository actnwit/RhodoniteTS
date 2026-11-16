import { Component } from '../../foundation/core/Component';
import type { IEntity } from '../../foundation/core/Entity';
import { BufferUse } from '../../foundation/definitions/BufferUse';
import { CompositionType } from '../../foundation/definitions/CompositionType';
import { ProcessApproach } from '../../foundation/definitions/ProcessApproach';
import type { ShaderSemanticsInfo } from '../../foundation/definitions/ShaderSemanticsInfo';
import type { Primitive } from '../../foundation/geometry/Primitive';
import type { Material } from '../../foundation/materials/core/Material';
import type { Engine } from '../../foundation/system/Engine';
import type { CGAPIResourceHandle } from '../../types/CommonTypes';
import type { RnWebGLProgram } from '../WebGLExtendedTypes';
import {
  type DataTextureLayoutSource,
  decodeComponentMember,
  decodeGlobalProperty,
  decodeMaterialProperty,
  decodeVariableLengthComponentMember,
} from './DataTextureLayoutDecoder';
import type {
  AllParameterReport,
  ComponentParameterReport,
  EntityParameterReport,
  GlobalParameterReport,
  MaterialParameterReport,
  RealUniformInfo,
  ShaderParameterEntry,
  ShaderParameterSource,
  Texel,
  TexelLocation,
  TextureBindingInfo,
} from './types';

const MAX_ARRAY_ELEMENTS = 4;
const MAX_SERIALIZED_ARRAY_LENGTH = 16;

function isWebGL2Available(engine: Engine): boolean {
  return ProcessApproach.isWebGL2Approach(engine.processApproach);
}

function getDataTextureWidth(engine: Engine): number {
  try {
    return engine.getCurrentWebGLContextWrapper()?.getMaxTextureSize() ?? 0;
  } catch (_e) {
    return 0;
  }
}

function createLayoutSource(engine: Engine, width: number): DataTextureLayoutSource {
  const read = (byteOffset: number, count: number) =>
    engine.memoryManager.readFloat32Array(BufferUse.GPUInstanceData, byteOffset, count);
  return {
    width,
    readVec4: (vec4Index: number): Texel | null => {
      const values = read(vec4Index * 16, 4);
      if (values == null) {
        return null;
      }
      return [values[0], values[1], values[2], values[3]];
    },
    readScalar: (scalarIndex: number): number | null => {
      const values = read(scalarIndex * 4, 1);
      return values == null ? null : values[0];
    },
  };
}

function serializeTypedArray(array: ArrayLike<number>): unknown {
  const length = Math.min(array.length, MAX_SERIALIZED_ARRAY_LENGTH);
  const values: number[] = [];
  for (let i = 0; i < length; i++) {
    values.push(array[i]);
  }
  if (array.length > MAX_SERIALIZED_ARRAY_LENGTH) {
    return { values, length: array.length, truncated: true };
  }
  return values;
}

function serializeArray(array: unknown[]): unknown {
  const length = Math.min(array.length, MAX_SERIALIZED_ARRAY_LENGTH);
  const values: unknown[] = [];
  for (let i = 0; i < length; i++) {
    values.push(serializeValue(array[i]));
  }
  if (array.length > MAX_SERIALIZED_ARRAY_LENGTH) {
    return { values, length: array.length, truncated: true };
  }
  return values;
}

/**
 * Converts math classes, typed arrays and texture tuples to plain JSON values.
 */
export function serializeValue(value: unknown): unknown {
  if (value == null) {
    return null;
  }
  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }
  if (ArrayBuffer.isView(value)) {
    return serializeTypedArray(value as unknown as ArrayLike<number>);
  }
  if (Array.isArray(value)) {
    return serializeArray(value);
  }
  if (typeof value === 'object') {
    const anyValue = value as any;
    if (ArrayBuffer.isView(anyValue._v)) {
      return serializeTypedArray(anyValue._v as ArrayLike<number>);
    }
    if (Array.isArray(anyValue._v)) {
      return serializeArray(anyValue._v);
    }
    if (ArrayBuffer.isView(anyValue.elements)) {
      return serializeTypedArray(anyValue.elements as ArrayLike<number>);
    }
    if (Array.isArray(anyValue.elements)) {
      return serializeArray(anyValue.elements);
    }
    const numeric: Record<string, number> = {};
    for (const key of ['x', 'y', 'z', 'w', 'r', 'g', 'b', 'a']) {
      if (typeof anyValue[key] === 'number') {
        numeric[key] = anyValue[key];
      }
    }
    if (Object.keys(numeric).length > 0) {
      return numeric;
    }
    try {
      const json = JSON.stringify(value);
      if (json != null && json.length <= 2000) {
        return JSON.parse(json);
      }
    } catch (_e) {
      // Fall through to String().
    }
    return String(value);
  }
  return String(value);
}

function getTextureBindingInfo(value: unknown): TextureBindingInfo | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const slot = value[0];
  const texture = value[1] as any;
  const sampler = value[2] as any;
  return {
    unit: typeof slot === 'number' ? slot : null,
    textureUid: texture?.objectUID ?? texture?.uid ?? null,
    samplerUid: sampler?.objectUID ?? sampler?.uid ?? null,
  };
}

function interpretTexels(location: TexelLocation | undefined): unknown {
  if (location == null || location.texels.length === 0) {
    return null;
  }
  const flat = location.texels.flat();
  const offset = location.scalarIndex != null ? location.scalarIndex % 4 : 0;
  switch (location.fetchFunction) {
    case 'fetchElement':
    case 'fetchVec4':
      return location.texels[0];
    case 'fetchScalarNo16BytesAligned':
      return flat[offset] ?? null;
    case 'fetchVec2No16BytesAligned':
      return flat.slice(offset, offset + 2);
    case 'fetchVec3No16BytesAligned':
      return flat.slice(offset, offset + 3);
    case 'fetchMat3No16BytesAligned':
      return flat.slice(offset, offset + 9);
    case 'fetchMat4No16BytesAligned':
      return flat.slice(offset, offset + 16);
    case 'fetchMat4':
      return location.texels;
    case 'fetchMat3':
      return location.texels.map(texel => [texel[0], texel[1], texel[2]]);
    case 'fetchMat2':
    case 'fetchMat2No16BytesAligned':
      return location.texels[0];
    case 'fetchMat4x3':
      return location.texels;
    default:
      return location.texels;
  }
}

/**
 * Inspector for the values Rhodonite uploads to WebGL2 shaders.
 *
 * It reports both the CPU-side value of a shader semantic and the location/value the
 * shader reads from the data texture, plus the real uniform value when the shader
 * uses one (for `needUniformInDataTextureMode` and sampler uniforms).
 *
 * The decoder reads the CPU-side GPUInstanceData buffers, which are the same bytes
 * that are uploaded to the data texture. It does not read back the GPU texture.
 */
export class ShaderParameterDebugger {
  static reportMaterial(engine: Engine, material: Material, primitive?: Primitive): MaterialParameterReport {
    const available = isWebGL2Available(engine);
    const processApproach = engine.processApproach.str;
    if (!available) {
      return {
        available: false,
        reason: `Shader parameter inspection is available only in WebGL2 (current: ${processApproach}).`,
        processApproach,
        materialTypeName: material.materialTypeName,
        materialUID: material.materialUID,
        materialSID: material.materialSID,
        materialCountPerBufferView: 0,
        bufferViewIndex: 0,
        shaderProgramUid: -1,
        dataTextureWidth: 0,
        sharedProgramMaterialMismatch: false,
        entries: [],
      };
    }

    const dataTextureWidth = getDataTextureWidth(engine);
    const layout = createLayoutSource(engine, dataTextureWidth);
    const materialCountPerBufferView =
      engine.materialRepository.getMaterialCountPerBufferView(material.materialTypeName) ?? 1;
    const bufferViewIndex = Math.floor(material.materialSID / materialCountPerBufferView);
    const shaderProgramUid = ShaderParameterDebugger.__getShaderProgramUid(material, primitive);
    const realUniforms =
      shaderProgramUid >= 0 ? ShaderParameterDebugger.readRealUniforms(engine, shaderProgramUid) : null;

    const entries: ShaderParameterEntry[] = [];
    for (const info of material.fieldsInfoArray) {
      const isTexture = CompositionType.isTexture(info.compositionType);
      const source: ShaderParameterSource = isTexture
        ? 'texture'
        : info.needUniformInDataTextureMode
          ? 'uniform'
          : info.soloDatum
            ? 'soloDatum'
            : 'dataTexture';

      const entry: ShaderParameterEntry = {
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
        valuePreview: isTexture ? null : serializeValue(material.getParameter(info.semantic)),
      };

      if (isTexture) {
        entry.texture = getTextureBindingInfo(material.getTextureParameter(info.semantic));
      } else {
        const offsets = engine.materialRepository.getLocationOffsetOfMemberOfMaterial(
          engine,
          material.materialTypeName,
          info.semantic
        );
        entry.dataTexture = decodeMaterialProperty({
          info,
          offsets,
          materialSID: material.materialSID,
          materialCountPerBufferView,
          layout,
          maxArrayElements: MAX_ARRAY_ELEMENTS,
        });
        if (source === 'uniform') {
          for (const location of entry.dataTexture.locations) {
            location.warnings.push('The shader reads this value from a real uniform, not from the data texture.');
          }
        }
      }

      if (realUniforms != null) {
        entry.realUniform = realUniforms.get(info.semantic) ?? { locationFound: false, value: null };
      }

      entries.push(entry);
    }

    return {
      available: true,
      processApproach,
      materialTypeName: material.materialTypeName,
      materialUID: material.materialUID,
      materialSID: material.materialSID,
      materialCountPerBufferView,
      bufferViewIndex,
      shaderProgramUid,
      dataTextureWidth,
      sharedProgramMaterialMismatch:
        shaderProgramUid >= 0
          ? ShaderParameterDebugger.__isProgramMaterialMismatch(engine, shaderProgramUid, material)
          : false,
      entries,
    };
  }

  static reportGlobals(engine: Engine, shaderProgramUid?: CGAPIResourceHandle): GlobalParameterReport {
    const available = isWebGL2Available(engine);
    const processApproach = engine.processApproach.str;
    if (!available) {
      return {
        available: false,
        reason: `Shader parameter inspection is available only in WebGL2 (current: ${processApproach}).`,
        processApproach,
        dataTextureWidth: 0,
        shaderProgramUid: -1,
        entries: [],
      };
    }

    const dataTextureWidth = getDataTextureWidth(engine);
    const layout = createLayoutSource(engine, dataTextureWidth);
    const realUniforms =
      shaderProgramUid != null && shaderProgramUid >= 0
        ? ShaderParameterDebugger.readRealUniforms(engine, shaderProgramUid)
        : null;

    const entries: ShaderParameterEntry[] = engine.globalDataRepository.getPropertyTable().map(property => {
      const info: ShaderSemanticsInfo = property.info;
      const source: ShaderParameterSource = info.needUniformInDataTextureMode ? 'uniform' : 'dataTexture';
      const entry: ShaderParameterEntry = {
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
        valuePreview: serializeValue(property.value),
      };
      entry.dataTexture = decodeGlobalProperty({
        info,
        offset: property.vec4Index,
        layout,
        maxArrayElements: MAX_ARRAY_ELEMENTS,
      });
      if (source === 'uniform') {
        for (const location of entry.dataTexture.locations) {
          location.warnings.push('The shader reads this value from a real uniform, not from the data texture.');
        }
      }
      if (realUniforms != null) {
        entry.realUniform = realUniforms.get(info.semantic) ?? { locationFound: false, value: null };
      }
      return entry;
    });

    return {
      available: true,
      processApproach,
      dataTextureWidth,
      shaderProgramUid: shaderProgramUid ?? -1,
      entries,
    };
  }

  static reportComponent(engine: Engine, component: Component): ComponentParameterReport {
    const componentClass = component.constructor as typeof Component;
    const componentClassName = componentClass.name;
    if (!isWebGL2Available(engine)) {
      return {
        available: false,
        reason: `Shader parameter inspection is available only in WebGL2 (current: ${engine.processApproach.str}).`,
        componentClassName,
        componentSID: component.componentSID,
        componentCountPerBufferView: 0,
        entries: [],
      };
    }

    const memberInfoMap = Component.getMemberInfo(engine).get(componentClass);
    if (memberInfoMap == null) {
      return {
        available: false,
        reason: `No member information is registered for ${componentClassName}.`,
        componentClassName,
        componentSID: component.componentSID,
        componentCountPerBufferView: 0,
        entries: [],
      };
    }

    const componentCountPerBufferView = Component.getComponentCountPerBufferView(engine).get(componentClass) ?? 1;
    const arrayLengthMap = Component.getArrayLengthOfMember(engine).get(componentClass);
    const dataTextureWidth = getDataTextureWidth(engine);
    const layout = createLayoutSource(engine, dataTextureWidth);
    const entries: ShaderParameterEntry[] = [];

    for (const [memberName, memberInfo] of memberInfoMap) {
      if (memberInfo.bufferUse !== BufferUse.GPUInstanceData) {
        continue;
      }
      const offsets = Component.getLocationOffsetOfMemberOfComponent(engine, componentClass, memberName);
      const arrayLength = arrayLengthMap?.get(memberName);
      let dataTexture;
      if (memberInfo.isVariableLength === true) {
        const locationMemberName = Component._getVariableLengthLocationMemberName(memberName);
        const locationOffsets = Component.getLocationOffsetOfMemberOfComponent(
          engine,
          componentClass,
          locationMemberName
        );
        dataTexture = decodeVariableLengthComponentMember({
          memberInfo: { compositionType: memberInfo.compositionType, arrayLength, isVariableLength: true },
          offsets,
          locationMemberOffsets: locationOffsets,
          componentSID: component.componentSID,
          componentCountPerBufferView,
          layout,
          maxArrayElements: MAX_ARRAY_ELEMENTS,
        });
      } else {
        dataTexture = decodeComponentMember({
          memberInfo: { compositionType: memberInfo.compositionType, arrayLength },
          offsets,
          componentSID: component.componentSID,
          componentCountPerBufferView,
          layout,
          maxArrayElements: MAX_ARRAY_ELEMENTS,
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
        source: 'dataTexture',
        valuePreview: interpretTexels(dataTexture.locations[0]),
        dataTexture,
      });
    }

    return {
      available: true,
      componentClassName,
      componentSID: component.componentSID,
      componentCountPerBufferView,
      entries,
    };
  }

  static reportEntity(engine: Engine, entity: IEntity): EntityParameterReport {
    const materials: MaterialParameterReport[] = [];
    const mesh = entity.tryToGetMesh()?.mesh;
    if (mesh != null) {
      for (const primitive of mesh.primitives) {
        materials.push(ShaderParameterDebugger.reportMaterial(engine, primitive.material, primitive));
      }
    }

    const components: ComponentParameterReport[] = [];
    const candidates = [
      entity.tryToGetSceneGraph?.(),
      entity.tryToGetTransform?.(),
      entity.tryToGetCamera?.(),
      entity.tryToGetLight?.(),
      entity.tryToGetSkeletal?.(),
      entity.tryToGetBlendShape?.(),
      entity.tryToGetMeshRenderer?.(),
      entity.tryToGetPhysics?.(),
    ];
    for (const component of candidates) {
      if (component != null) {
        components.push(ShaderParameterDebugger.reportComponent(engine, component));
      }
    }

    return { entityUID: entity.entityUID, materials, components };
  }

  static reportAll(engine: Engine): AllParameterReport {
    const liveMaterials = engine.materialRepository
      .getAllMaterials()
      .map(ref => ref.deref())
      .filter((material): material is Material => material != null);
    const materials = liveMaterials.map(material => ShaderParameterDebugger.reportMaterial(engine, material));
    const firstProgram = materials.find(report => report.shaderProgramUid >= 0)?.shaderProgramUid;
    const globals = ShaderParameterDebugger.reportGlobals(engine, firstProgram);
    return { globals, materials };
  }

  static readRealUniforms(engine: Engine, shaderProgramUid: CGAPIResourceHandle): Map<string, RealUniformInfo> | null {
    const program = engine.webglResourceRepository.getWebGLResource(shaderProgramUid) as RnWebGLProgram | null;
    if (program == null) {
      return null;
    }
    const glw = engine.getCurrentWebGLContextWrapper();
    if (glw == null) {
      return null;
    }
    const gl = glw.getRawContext();
    const result = new Map<string, RealUniformInfo>();

    const infoMap = program._shaderSemanticsInfoMap;
    if (infoMap != null) {
      for (const semantic of infoMap.keys()) {
        const location = (program as any)[semantic];
        if (location == null) {
          result.set(semantic, { locationFound: false, value: null });
          continue;
        }
        try {
          result.set(semantic, {
            locationFound: true,
            value: serializeValue(gl.getUniform(program, location)),
          });
        } catch (_e) {
          result.set(semantic, { locationFound: false, value: null });
        }
      }
    }

    // These two uniforms are stored on the program by setupBasicUniformLocations() and
    // are not part of _shaderSemanticsInfoMap.
    for (const basicName of ['dataTexture', 'currentComponentSIDs'] as const) {
      const location = (program as any)[basicName];
      if (location == null) {
        continue;
      }
      try {
        result.set(basicName, {
          locationFound: true,
          value: serializeValue(gl.getUniform(program, location)),
        });
      } catch (_e) {
        result.set(basicName, { locationFound: false, value: null });
      }
    }

    return result;
  }

  static decode(
    engine: Engine,
    vec4Index: number
  ): { vec4Index: number; row: number; col: number; texel: Texel | null } | null {
    if (!isWebGL2Available(engine)) {
      return null;
    }
    const width = getDataTextureWidth(engine);
    const layout = createLayoutSource(engine, width);
    return {
      vec4Index,
      row: width > 0 ? Math.floor(vec4Index / width) : -1,
      col: width > 0 ? vec4Index % width : -1,
      texel: layout.readVec4(vec4Index),
    };
  }

  static formatEntries(entries: ShaderParameterEntry[]): Array<Record<string, unknown>> {
    const rows: Array<Record<string, unknown>> = [];
    for (const entry of entries) {
      if (entry.dataTexture == null || entry.dataTexture.locations.length === 0) {
        rows.push({
          semantic: entry.semantic,
          arrayElement: '',
          source: entry.source,
          value: entry.valuePreview,
          fetch: '',
          vec4: '',
          row: '',
          col: '',
          texel: '',
          uniform: entry.realUniform?.locationFound ? entry.realUniform.value : '',
          warnings: '',
        });
        continue;
      }
      for (const location of entry.dataTexture.locations) {
        rows.push({
          semantic: entry.semantic,
          arrayElement: location.arrayElement ?? '',
          source: entry.source,
          value: entry.valuePreview,
          fetch: location.fetchFunction,
          vec4: location.vec4Index,
          row: location.row,
          col: location.col,
          texel: location.texels.map(texel => texel.join(',')).join(' | '),
          uniform: entry.realUniform?.locationFound ? entry.realUniform.value : '',
          warnings: location.warnings.join('; '),
        });
      }
    }
    return rows;
  }

  static format(report: MaterialParameterReport | GlobalParameterReport | ComponentParameterReport): unknown {
    return {
      ...report,
      entries: ShaderParameterDebugger.formatEntries(report.entries),
    };
  }

  static dumpMaterial(engine: Engine, material: Material, primitive?: Primitive): MaterialParameterReport {
    const report = ShaderParameterDebugger.reportMaterial(engine, material, primitive);
    console.table(ShaderParameterDebugger.formatEntries(report.entries));
    return report;
  }

  static dumpPrimitive(engine: Engine, primitive: Primitive): MaterialParameterReport {
    return ShaderParameterDebugger.dumpMaterial(engine, primitive.material, primitive);
  }

  static dumpGlobals(engine: Engine, shaderProgramUid?: CGAPIResourceHandle): GlobalParameterReport {
    const report = ShaderParameterDebugger.reportGlobals(engine, shaderProgramUid);
    console.table(ShaderParameterDebugger.formatEntries(report.entries));
    return report;
  }

  static dumpEntity(engine: Engine, entity: IEntity): EntityParameterReport {
    const report = ShaderParameterDebugger.reportEntity(engine, entity);
    for (const material of report.materials) {
      console.log(`Material: ${material.materialTypeName} (SID ${material.materialSID})`);
      console.table(ShaderParameterDebugger.formatEntries(material.entries));
    }
    return report;
  }

  static dumpAll(engine: Engine): AllParameterReport {
    const report = ShaderParameterDebugger.reportAll(engine);
    console.log('Globals');
    console.table(ShaderParameterDebugger.formatEntries(report.globals.entries));
    for (const material of report.materials) {
      console.log(`Material: ${material.materialTypeName} (SID ${material.materialSID})`);
      console.table(ShaderParameterDebugger.formatEntries(material.entries));
    }
    return report;
  }

  static installConsoleHelpers(engine: Engine, target: any = typeof window !== 'undefined' ? window : undefined): void {
    if (target == null) {
      return;
    }
    target.RnShaderParameters = {
      reportAll: () => ShaderParameterDebugger.reportAll(engine),
      reportMaterial: (material: Material, primitive?: Primitive) =>
        ShaderParameterDebugger.reportMaterial(engine, material, primitive),
      reportEntity: (entity: IEntity) => ShaderParameterDebugger.reportEntity(engine, entity),
      globals: (shaderProgramUid?: CGAPIResourceHandle) =>
        ShaderParameterDebugger.reportGlobals(engine, shaderProgramUid),
      decode: (vec4Index: number) => ShaderParameterDebugger.decode(engine, vec4Index),
      dumpAll: () => ShaderParameterDebugger.dumpAll(engine),
      dumpPrimitive: (primitive: Primitive) => ShaderParameterDebugger.dumpPrimitive(engine, primitive),
    };
  }

  private static __getShaderProgramUid(material: Material, primitive?: Primitive): CGAPIResourceHandle {
    if (primitive != null) {
      return material.getShaderProgramUid(primitive);
    }
    for (const belongPrimitive of material.getBelongPrimitives().values()) {
      return material.getShaderProgramUid(belongPrimitive);
    }
    return -1;
  }

  private static __isProgramMaterialMismatch(
    engine: Engine,
    shaderProgramUid: CGAPIResourceHandle,
    material: Material
  ): boolean {
    const program = engine.webglResourceRepository.getWebGLResource(shaderProgramUid) as RnWebGLProgram | null;
    if (program == null || program._material == null) {
      return false;
    }
    return program._material.deref() !== material;
  }
}
