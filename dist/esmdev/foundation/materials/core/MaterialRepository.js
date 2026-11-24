// src/foundation/materials/core/MaterialRepository.ts
import { BufferUse } from "../../definitions/BufferUse.js";
import { ComponentType } from "../../definitions/ComponentType.js";
import { CompositionType } from "../../definitions/CompositionType.js";
import { calcAlignedByteLength } from "../../definitions/ShaderSemanticsInfo.js";
import { MathClassUtil } from "../../math/MathClassUtil.js";
import { Is } from "../../misc/Is.js";
import { Logger } from "../../misc/Logger.js";
import { Material } from "./Material.js";
var _MaterialRepository = class _MaterialRepository {
  constructor() {
    this.hs = /* @__PURE__ */ new Map();
    this.js = /* @__PURE__ */ new Map();
    this.os = /* @__PURE__ */ new Map();
    this.ms = /* @__PURE__ */ new Map();
    this.ns = /* @__PURE__ */ new Map();
    this.is = /* @__PURE__ */ new Map();
    this.ks = /* @__PURE__ */ new Map();
    this.Gi = /* @__PURE__ */ new Map();
    /** Tracks version incremented when a new buffer view is allocated for a material type. */
    this.ls = /* @__PURE__ */ new Map();
    /** Solo datum fields for each material type (engine-specific, not shared across engines) */
    this._soloDatumFields = /* @__PURE__ */ new Map();
    /** State version counter for tracking material changes (engine-specific) */
    this.Fi = 0;
    /**
     * State version counter for changes that invalidate WebGPU bind groups and
     * render bundles (texture bindings, pipelines). Uniform-only updates do not
     * bump this, so render bundles stay reusable across frames.
     */
    this.ps = 0;
  }
  /**
   * Registers a new material type with the repository.
   * This method creates the necessary data structures and allocates memory for the material type.
   * If the material type is already registered, the registration will be skipped.
   *
   * @param materialTypeName - The unique name identifier for the material type
   * @param materialNode - The material content definition containing shader semantics and properties
   * @param materialCountPerBufferView - The number of materials per buffer view
   * @returns True if the material type was successfully registered, false if it was already registered
   */
  registerMaterial(engine, materialTypeName, materialNode, materialCountPerBufferView = engine.config.materialCountPerBufferView) {
    if (!this.ns.has(materialTypeName)) {
      this.qs(materialTypeName, materialNode, materialCountPerBufferView);
      return true;
    }
    return false;
  }
  /**
   * Forcibly registers a material type, overwriting any existing registration.
   * This method bypasses the duplicate check and always performs the registration.
   * Use with caution as it can replace existing material type definitions.
   *
   * @param materialTypeName - The unique name identifier for the material type
   * @param materialNode - The material content definition containing shader semantics and properties
   * @param materialCountPerBufferView - The number of materials per buffer view
   * @returns Always returns true as the registration is forced
   */
  forceRegisterMaterial(engine, materialTypeName, materialNode, materialCountPerBufferView = engine.config.materialCountPerBufferView) {
    this.qs(materialTypeName, materialNode, materialCountPerBufferView);
    return true;
  }
  /**
   * Checks if a material type is already registered in the repository.
   *
   * @param materialTypeName - The name of the material type to check
   * @returns True if the material type is registered, false otherwise
   */
  isRegisteredMaterialType(materialTypeName) {
    return this.ns.has(materialTypeName);
  }
  /**
   * Retrieves a material instance by its unique identifier.
   * Returns undefined if the material doesn't exist or has been garbage collected.
   *
   * @param materialUid - The unique identifier of the material to retrieve
   * @returns The material instance if found and still alive, undefined otherwise
   */
  getMaterialByMaterialUid(materialUid) {
    var _a;
    return (_a = this.hs.get(materialUid)) == null ? void 0 : _a.deref();
  }
  /**
   * Gets all currently active material instances from the repository.
   * Returns an array of WeakRef objects that may contain undefined values
   * if materials have been garbage collected.
   *
   * @returns Array of WeakRef objects pointing to all registered materials
   */
  getAllMaterials() {
    return Array.from(this.hs.values());
  }
  /**
   * Creates a new material instance of the specified type.
   * The material type must be registered before calling this method.
   * This method handles instance counting and initialization.
   *
   * @param materialTypeName - The name of the registered material type
   * @param materialNode - The material content definition for this specific instance
   * @returns A new Material instance with proper initialization
   * @throws Error if the material type is not registered or maximum instances exceeded
   */
  createMaterial(engine, materialTypeName, materialNode) {
    let countOfThisType = this.ms.get(materialTypeName);
    const materialCountPerBufferView = this.is.get(materialTypeName);
    const indexInTheBufferView = countOfThisType % materialCountPerBufferView;
    const indexOfBufferViews = Math.floor(countOfThisType / materialCountPerBufferView);
    let newlyAllocatedBufferView = false;
    if (indexInTheBufferView === 0) {
      newlyAllocatedBufferView = this.ts(engine, materialTypeName, materialNode, indexOfBufferViews);
    }
    const material = new Material(
      engine,
      this.os.get(materialTypeName),
      ++_MaterialRepository.ss,
      countOfThisType++,
      materialTypeName,
      materialNode
    );
    this.us(material, countOfThisType, indexOfBufferViews, indexInTheBufferView);
    if (newlyAllocatedBufferView && indexOfBufferViews > 0) {
      this.vs(materialTypeName);
    }
    return material;
  }
  /**
   * Determines if a new material node is compatible with an existing material.
   * Compatibility is checked by comparing shader semantics information arrays.
   * Materials are compatible if they have identical shader semantic structures.
   *
   * @param currentMaterial - The existing material to compare against
   * @param newMaterialNode - The new material node to check for compatibility
   * @returns True if the materials are compatible, false otherwise
   */
  isMaterialCompatible(currentMaterial, newMaterialNode) {
    var _a;
    const existingMaterial = (_a = this.hs.get(currentMaterial.materialUID)) == null ? void 0 : _a.deref();
    if (Is.not.exist(existingMaterial)) {
      return false;
    }
    const existingShaderSemanticsInfoList = Array.from(existingMaterial._allFieldsInfo.values());
    const existingShaderSemanticsInfoListString = existingShaderSemanticsInfoList.map((info) => info.semantic + info.compositionType.str + info.componentType.str + info.stage.index).join("");
    const newShaderSemanticsInfoList = newMaterialNode._semanticsInfoArray;
    const newShaderSemanticsInfoListString = newShaderSemanticsInfoList.map((info) => info.semantic + info.compositionType.str + info.componentType.str + info.stage.index).join("");
    if (existingShaderSemanticsInfoListString !== newShaderSemanticsInfoListString) {
      return false;
    }
    return true;
  }
  /**
   * Initializes a newly created material instance with proper data structures and memory allocation.
   * This method sets up the material's shader variables, semantic information, and registers
   * the material in the repository's tracking maps.
   *
   * @param material - The material instance to initialize
   * @param countOfThisType - The current count of instances for this material type
   * @private
   */
  us(material, countOfThisType, indexOfBufferViews, _indexInTheBufferView) {
    {
      this.hs.set(material.materialUID, new WeakRef(material));
      let map = this.js.get(material.Ir);
      if (Is.not.exist(map)) {
        map = /* @__PURE__ */ new Map();
        this.js.set(material.materialTypeName, map);
      }
      map.set(material.materialSID, new WeakRef(material));
      this.ms.set(material.materialTypeName, countOfThisType);
    }
    if (Is.exist(material._materialContent)) {
      const semanticsInfoArray = material._materialContent._semanticsInfoArray;
      const accessorMap = this.Gi.get(material.materialTypeName).get(indexOfBufferViews);
      semanticsInfoArray.forEach((semanticsInfo) => {
        material._allFieldsInfo.set(semanticsInfo.semantic, semanticsInfo);
        if (!semanticsInfo.soloDatum) {
          const accessor = accessorMap.get(semanticsInfo.semantic);
          const typedArray = accessor.takeOne();
          const shaderVariable = {
            info: semanticsInfo,
            value: MathClassUtil.initWithFloat32Array(semanticsInfo.initialValue, typedArray)
          };
          material._allFieldVariables.set(semanticsInfo.semantic, shaderVariable);
          if (!semanticsInfo.isInternalSetting) {
            material._autoFieldVariablesOnly.set(semanticsInfo.semantic, shaderVariable);
            if (CompositionType.isTexture(semanticsInfo.compositionType)) {
              material._autoTextureFieldVariablesOnly.set(semanticsInfo.semantic, shaderVariable);
            }
            if (semanticsInfo.needUniformInDataTextureMode) {
              material._autoUniformFieldVariablesOnly.set(semanticsInfo.semantic, shaderVariable);
            }
          }
        }
      });
    }
  }
  /**
   * Gets the memory location offset for a specific property of a material type.
   * The offset is calculated in 16-byte aligned units for GPU buffer access.
   * This is used for efficient GPU memory access in shaders.
   *
   * @param engine - The engine instance
   * @param materialTypeName - The name of the material type
   * @param propertyName - The shader semantic name of the property
   * @returns The byte offset divided by 16 (IndexOf16Bytes) for the property location
   */
  getLocationOffsetOfMemberOfMaterial(engine, materialTypeName, propertyName) {
    const map = this.js.get(materialTypeName);
    const materialRef = Array.from(map.values()).find((m) => m.deref() !== void 0);
    if (Is.not.exist(materialRef == null ? void 0 : materialRef.deref())) {
      Logger.default.warn(
        `Material is not found. getLocationOffsetOfMemberOfMaterial returns invalid 0 value. materialTypeName: ${materialTypeName}`
      );
      return [0];
    }
    const material = materialRef.deref();
    const info = material._allFieldsInfo.get(propertyName);
    if (info.soloDatum) {
      const value = this._soloDatumFields.get(material.materialTypeName).get(propertyName);
      return [value.value._v.byteOffset / 4 / 4];
    }
    const propertiesOfBufferViews = this.Gi.get(materialTypeName);
    const locationOffsets = [];
    propertiesOfBufferViews == null ? void 0 : propertiesOfBufferViews.forEach((properties) => {
      const accessor = properties.get(propertyName);
      const byteOffsetOfExistingBuffers = engine.memoryManager.getByteOffsetOfExistingBuffers(
        BufferUse.GPUInstanceData,
        accessor.bufferView.buffer.indexOfTheBufferUsage
      );
      const byteOffset = byteOffsetOfExistingBuffers + accessor.byteOffsetInBuffer;
      locationOffsets.push(byteOffset / 4 / 4);
    });
    return locationOffsets;
  }
  /**
   * Internal method that performs the actual material type registration.
   * This method sets up the material type ID, allocates buffer views,
   * and initializes all necessary data structures.
   *
   * @param materialTypeName - The unique name identifier for the material type
   * @param materialNode - The material content definition
   * @param materialCountPerBufferView - The number of materials per buffer view
   * @private
   */
  qs(materialTypeName, materialNode, materialCountPerBufferView) {
    const materialTid = ++_MaterialRepository.rs;
    this.ns.set(materialTypeName, materialNode);
    this.os.set(materialTypeName, materialTid);
    this.is.set(materialTypeName, materialCountPerBufferView);
    this.ms.set(materialTypeName, 0);
    this.ls.set(materialTypeName, 0);
  }
  /**
   * Allocates GPU buffer memory for a material type based on its shader semantics.
   * This method calculates the total memory requirements, creates buffer views,
   * and sets up accessors for efficient GPU data access.
   *
   * @param materialTypeName - The name of the material type to allocate memory for
   * @param materialNode - The material node containing semantic information
   * @returns Whether a new BufferView was allocated (true) or an existing one was reused (false)
   * @private
   */
  ts(engine, materialTypeName, materialNode, indexOfBufferViews) {
    var _a;
    let newlyAllocated = false;
    let totalByteLength = 0;
    const alignedByteLengthAndSemanticInfoArray = [];
    for (const semanticInfo of materialNode._semanticsInfoArray) {
      const alignedByteLength = calcAlignedByteLength(semanticInfo);
      let dataCount = 1;
      if (!semanticInfo.soloDatum) {
        dataCount = this.is.get(materialTypeName);
      }
      totalByteLength += alignedByteLength * dataCount;
      alignedByteLengthAndSemanticInfoArray.push({
        alignedByte: alignedByteLength,
        semanticInfo
      });
    }
    if (!this.Gi.has(materialTypeName)) {
      this.Gi.set(materialTypeName, /* @__PURE__ */ new Map());
    }
    let bufferView;
    if (this.ks.has(materialTypeName)) {
      const map = this.ks.get(materialTypeName);
      bufferView = map.get(indexOfBufferViews);
    } else {
      this.ks.set(materialTypeName, /* @__PURE__ */ new Map());
    }
    if (bufferView == null) {
      let bufferViewResult;
      let requireBufferLayerIndex = 0;
      do {
        const buffer = engine.memoryManager.createOrGetBuffer(BufferUse.GPUInstanceData, requireBufferLayerIndex);
        bufferViewResult = buffer.takeBufferView({
          byteLengthToNeed: totalByteLength,
          byteStride: 0
        });
        if (bufferViewResult.isErr()) {
          requireBufferLayerIndex++;
        }
      } while (bufferViewResult.isErr());
      bufferView = bufferViewResult.get();
      this.ks.get(materialTypeName).set(indexOfBufferViews, bufferView);
      newlyAllocated = true;
      const currentVersion = (_a = this.ls.get(materialTypeName)) != null ? _a : 0;
      this.ls.set(materialTypeName, currentVersion + 1);
    }
    for (let i = 0; i < alignedByteLengthAndSemanticInfoArray.length; i++) {
      const alignedByte = alignedByteLengthAndSemanticInfoArray[i].alignedByte;
      const semanticInfo = alignedByteLengthAndSemanticInfoArray[i].semanticInfo;
      let count = 1;
      if (!semanticInfo.soloDatum) {
        count = this.is.get(materialTypeName);
      }
      let maxArrayLength = semanticInfo.arrayLength;
      if (CompositionType.isArray(semanticInfo.compositionType) && maxArrayLength == null) {
        maxArrayLength = 100;
      }
      const accessor = bufferView.takeAccessor({
        compositionType: semanticInfo.compositionType,
        componentType: ComponentType.Float,
        count,
        byteStride: alignedByte,
        arrayLength: maxArrayLength
      }).unwrapForce();
      if (semanticInfo.soloDatum) {
        const typedArray = accessor.takeOne();
        let map = this._soloDatumFields.get(materialTypeName);
        if (map == null) {
          map = /* @__PURE__ */ new Map();
          this._soloDatumFields.set(materialTypeName, map);
        }
        map.set(semanticInfo.semantic, {
          info: semanticInfo,
          value: MathClassUtil.initWithFloat32Array(semanticInfo.initialValue, typedArray)
        });
      } else {
        let properties = this.Gi.get(materialTypeName).get(indexOfBufferViews);
        if (properties == null) {
          const map = /* @__PURE__ */ new Map();
          this.Gi.get(materialTypeName).set(indexOfBufferViews, map);
          properties = map;
        }
        properties.set(semanticInfo.semantic, accessor);
      }
    }
    return newlyAllocated;
  }
  _getMaterialCountPerBufferView(materialTypeName) {
    return this.is.get(materialTypeName);
  }
  /**
   * Public accessor used by debugging tools. The material SID selects a buffer view
   * with `floor(materialSID / materialCountPerBufferView)`.
   */
  getMaterialCountPerBufferView(materialTypeName) {
    return this._getMaterialCountPerBufferView(materialTypeName);
  }
  _getBufferViewVersion(materialTypeName) {
    var _a;
    return (_a = this.ls.get(materialTypeName)) != null ? _a : 0;
  }
  /**
   * Invalidates all shader programs for all registered materials.
   * This method is typically called when global shader settings change
   * and all materials need to recompile their shaders.
   *
   * @internal
   */
  _makeShaderInvalidateToAllMaterials() {
    var _a;
    for (const material of this.hs.values()) {
      (_a = material.deref()) == null ? void 0 : _a.makeShadersInvalidate();
    }
  }
  /**
   * Invalidates shader programs only for materials that are affected by morph changes.
   * Affected materials are those that support morphing and are currently used by primitives
   * with morph targets.
   *
   * @internal
   */
  _makeShaderInvalidateToMorphMaterials() {
    for (const materialRef of this.hs.values()) {
      const material = materialRef.deref();
      if (material == null || material.isMorphing === false) {
        continue;
      }
      const primitives = material.getBelongPrimitives();
      for (const primitive of primitives.values()) {
        if (primitive.targets.length > 0) {
          material.makeShadersInvalidate();
          break;
        }
      }
    }
  }
  vs(materialTypeName) {
    var _a;
    const materials = this.js.get(materialTypeName);
    if (materials == null) {
      return;
    }
    for (const materialRef of materials.values()) {
      (_a = materialRef.deref()) == null ? void 0 : _a.makeShadersInvalidate();
    }
  }
  /**
   * Gets the current state version for materials in this repository.
   * This version is incremented whenever any material's state changes.
   * @returns The current state version number
   */
  get stateVersion() {
    return this.Fi;
  }
  /**
   * Gets the state version that invalidates GPU bind groups and render bundles.
   * @returns The binding state version number
   */
  get bindingStateVersion() {
    return this.ps;
  }
  /**
   * Increments the state version counter.
   * Called when a material's state changes.
   * @internal
   */
  _incrementStateVersion() {
    this.Fi++;
  }
  /**
   * Increments the state version that invalidates WebGPU bind groups and
   * render bundles.
   * @internal
   */
  _incrementBindingStateVersion() {
    this.ps++;
  }
};
_MaterialRepository.rs = -1;
_MaterialRepository.ss = -1;
var MaterialRepository = _MaterialRepository;
export {
  MaterialRepository
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0ZXJpYWxzL2NvcmUvTWF0ZXJpYWxSZXBvc2l0b3J5LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7XG4gIEJ5dGUsXG4gIENvdW50LFxuICBJbmRleCxcbiAgSW5kZXhPZjE2Qnl0ZXMsXG4gIE1hdGVyaWFsU0lELFxuICBNYXRlcmlhbFRJRCxcbiAgTWF0ZXJpYWxVSUQsXG59IGZyb20gJy4uLy4uLy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB7IEJ1ZmZlclVzZSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL0J1ZmZlclVzZSc7XG5pbXBvcnQgeyBDb21wb25lbnRUeXBlIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvQ29tcG9uZW50VHlwZSc7XG5pbXBvcnQgeyBDb21wb3NpdGlvblR5cGUgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9Db21wb3NpdGlvblR5cGUnO1xuaW1wb3J0IHR5cGUgeyBTaGFkZXJTZW1hbnRpY3NOYW1lIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvU2hhZGVyU2VtYW50aWNzJztcbmltcG9ydCB7IGNhbGNBbGlnbmVkQnl0ZUxlbmd0aCwgdHlwZSBTaGFkZXJTZW1hbnRpY3NJbmZvIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvU2hhZGVyU2VtYW50aWNzSW5mbyc7XG5pbXBvcnQgeyBNYXRoQ2xhc3NVdGlsIH0gZnJvbSAnLi4vLi4vbWF0aC9NYXRoQ2xhc3NVdGlsJztcbmltcG9ydCB0eXBlIHsgQWNjZXNzb3IgfSBmcm9tICcuLi8uLi9tZW1vcnkvQWNjZXNzb3InO1xuaW1wb3J0IHR5cGUgeyBCdWZmZXJWaWV3IH0gZnJvbSAnLi4vLi4vbWVtb3J5L0J1ZmZlclZpZXcnO1xuaW1wb3J0IHsgSXMgfSBmcm9tICcuLi8uLi9taXNjL0lzJztcbmltcG9ydCB7IExvZ2dlciB9IGZyb20gJy4uLy4uL21pc2MvTG9nZ2VyJztcbmltcG9ydCB0eXBlIHsgUmVzdWx0IH0gZnJvbSAnLi4vLi4vbWlzYy9SZXN1bHQnO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi8uLi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB0eXBlIHsgQWJzdHJhY3RNYXRlcmlhbENvbnRlbnQgfSBmcm9tICcuL0Fic3RyYWN0TWF0ZXJpYWxDb250ZW50JztcbmltcG9ydCB7IE1hdGVyaWFsIH0gZnJvbSAnLi9NYXRlcmlhbCc7XG5pbXBvcnQgdHlwZSB7IEluZGV4T2ZCdWZmZXJWaWV3cywgTWF0ZXJpYWxUeXBlTmFtZSwgU2hhZGVyVmFyaWFibGUgfSBmcm9tICcuL01hdGVyaWFsVHlwZXMnO1xuXG4vKipcbiAqIFJlcG9zaXRvcnkgY2xhc3MgZm9yIG1hbmFnaW5nIG1hdGVyaWFsIHR5cGVzIGFuZCBpbnN0YW5jZXMuXG4gKiBIYW5kbGVzIHJlZ2lzdHJhdGlvbiwgY3JlYXRpb24sIGFuZCBsaWZlY3ljbGUgbWFuYWdlbWVudCBvZiBtYXRlcmlhbHMuXG4gKi9cbmV4cG9ydCBjbGFzcyBNYXRlcmlhbFJlcG9zaXRvcnkge1xuICBwcml2YXRlIF9fbWF0ZXJpYWxNYXA6IE1hcDxNYXRlcmlhbFVJRCwgV2Vha1JlZjxNYXRlcmlhbD4+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIF9faW5zdGFuY2VzOiBNYXA8TWF0ZXJpYWxUeXBlTmFtZSwgTWFwPE1hdGVyaWFsU0lELCBXZWFrUmVmPE1hdGVyaWFsPj4+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIF9fbWF0ZXJpYWxUaWRzOiBNYXA8TWF0ZXJpYWxUeXBlTmFtZSwgTWF0ZXJpYWxUSUQ+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIF9fbWF0ZXJpYWxJbnN0YW5jZUNvdW50T2ZUeXBlOiBNYXA8TWF0ZXJpYWxUeXBlTmFtZSwgQ291bnQ+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIF9fbWF0ZXJpYWxOb2RlczogTWFwPE1hdGVyaWFsVHlwZU5hbWUsIEFic3RyYWN0TWF0ZXJpYWxDb250ZW50IHwgdW5kZWZpbmVkPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBfX21hdGVyaWFsQ291bnRQZXJCdWZmZXJWaWV3TWFwOiBNYXA8TWF0ZXJpYWxUeXBlTmFtZSwgQ291bnQ+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIF9fYnVmZmVyVmlld3M6IE1hcDxNYXRlcmlhbFR5cGVOYW1lLCBNYXA8SW5kZXhPZkJ1ZmZlclZpZXdzLCBCdWZmZXJWaWV3Pj4gPSBuZXcgTWFwKCk7XG4gIHByaXZhdGUgX19hY2Nlc3NvcnM6IE1hcDxNYXRlcmlhbFR5cGVOYW1lLCBNYXA8SW5kZXhPZkJ1ZmZlclZpZXdzLCBNYXA8U2hhZGVyU2VtYW50aWNzTmFtZSwgQWNjZXNzb3I+Pj4gPSBuZXcgTWFwKCk7XG4gIC8qKiBUcmFja3MgdmVyc2lvbiBpbmNyZW1lbnRlZCB3aGVuIGEgbmV3IGJ1ZmZlciB2aWV3IGlzIGFsbG9jYXRlZCBmb3IgYSBtYXRlcmlhbCB0eXBlLiAqL1xuICBwcml2YXRlIF9fYnVmZmVyVmlld1ZlcnNpb25zOiBNYXA8TWF0ZXJpYWxUeXBlTmFtZSwgbnVtYmVyPiA9IG5ldyBNYXAoKTtcbiAgLyoqIFNvbG8gZGF0dW0gZmllbGRzIGZvciBlYWNoIG1hdGVyaWFsIHR5cGUgKGVuZ2luZS1zcGVjaWZpYywgbm90IHNoYXJlZCBhY3Jvc3MgZW5naW5lcykgKi9cbiAgX3NvbG9EYXR1bUZpZWxkczogTWFwPE1hdGVyaWFsVHlwZU5hbWUsIE1hcDxTaGFkZXJTZW1hbnRpY3NOYW1lLCBTaGFkZXJWYXJpYWJsZT4+ID0gbmV3IE1hcCgpO1xuICAvKiogU3RhdGUgdmVyc2lvbiBjb3VudGVyIGZvciB0cmFja2luZyBtYXRlcmlhbCBjaGFuZ2VzIChlbmdpbmUtc3BlY2lmaWMpICovXG4gIHByaXZhdGUgX19zdGF0ZVZlcnNpb24gPSAwO1xuICAvKipcbiAgICogU3RhdGUgdmVyc2lvbiBjb3VudGVyIGZvciBjaGFuZ2VzIHRoYXQgaW52YWxpZGF0ZSBXZWJHUFUgYmluZCBncm91cHMgYW5kXG4gICAqIHJlbmRlciBidW5kbGVzICh0ZXh0dXJlIGJpbmRpbmdzLCBwaXBlbGluZXMpLiBVbmlmb3JtLW9ubHkgdXBkYXRlcyBkbyBub3RcbiAgICogYnVtcCB0aGlzLCBzbyByZW5kZXIgYnVuZGxlcyBzdGF5IHJldXNhYmxlIGFjcm9zcyBmcmFtZXMuXG4gICAqL1xuICBwcml2YXRlIF9fYmluZGluZ1N0YXRlVmVyc2lvbiA9IDA7XG4gIHByaXZhdGUgc3RhdGljIF9fbWF0ZXJpYWxUaWRDb3VudCA9IC0xO1xuICBwcml2YXRlIHN0YXRpYyBfX21hdGVyaWFsVWlkQ291bnQgPSAtMTtcblxuICAvKipcbiAgICogUmVnaXN0ZXJzIGEgbmV3IG1hdGVyaWFsIHR5cGUgd2l0aCB0aGUgcmVwb3NpdG9yeS5cbiAgICogVGhpcyBtZXRob2QgY3JlYXRlcyB0aGUgbmVjZXNzYXJ5IGRhdGEgc3RydWN0dXJlcyBhbmQgYWxsb2NhdGVzIG1lbW9yeSBmb3IgdGhlIG1hdGVyaWFsIHR5cGUuXG4gICAqIElmIHRoZSBtYXRlcmlhbCB0eXBlIGlzIGFscmVhZHkgcmVnaXN0ZXJlZCwgdGhlIHJlZ2lzdHJhdGlvbiB3aWxsIGJlIHNraXBwZWQuXG4gICAqXG4gICAqIEBwYXJhbSBtYXRlcmlhbFR5cGVOYW1lIC0gVGhlIHVuaXF1ZSBuYW1lIGlkZW50aWZpZXIgZm9yIHRoZSBtYXRlcmlhbCB0eXBlXG4gICAqIEBwYXJhbSBtYXRlcmlhbE5vZGUgLSBUaGUgbWF0ZXJpYWwgY29udGVudCBkZWZpbml0aW9uIGNvbnRhaW5pbmcgc2hhZGVyIHNlbWFudGljcyBhbmQgcHJvcGVydGllc1xuICAgKiBAcGFyYW0gbWF0ZXJpYWxDb3VudFBlckJ1ZmZlclZpZXcgLSBUaGUgbnVtYmVyIG9mIG1hdGVyaWFscyBwZXIgYnVmZmVyIHZpZXdcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgbWF0ZXJpYWwgdHlwZSB3YXMgc3VjY2Vzc2Z1bGx5IHJlZ2lzdGVyZWQsIGZhbHNlIGlmIGl0IHdhcyBhbHJlYWR5IHJlZ2lzdGVyZWRcbiAgICovXG4gIHB1YmxpYyByZWdpc3Rlck1hdGVyaWFsKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIG1hdGVyaWFsVHlwZU5hbWU6IHN0cmluZyxcbiAgICBtYXRlcmlhbE5vZGU6IEFic3RyYWN0TWF0ZXJpYWxDb250ZW50LFxuICAgIG1hdGVyaWFsQ291bnRQZXJCdWZmZXJWaWV3OiBudW1iZXIgPSBlbmdpbmUuY29uZmlnLm1hdGVyaWFsQ291bnRQZXJCdWZmZXJWaWV3XG4gICk6IGJvb2xlYW4ge1xuICAgIGlmICghdGhpcy5fX21hdGVyaWFsTm9kZXMuaGFzKG1hdGVyaWFsVHlwZU5hbWUpKSB7XG4gICAgICB0aGlzLl9fcmVnaXN0ZXJJbm5lcihtYXRlcmlhbFR5cGVOYW1lLCBtYXRlcmlhbE5vZGUsIG1hdGVyaWFsQ291bnRQZXJCdWZmZXJWaWV3KTtcblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8vIGNvbnNvbGUuaW5mbyhgJHttYXRlcmlhbFR5cGVOYW1lfSBpcyBhbHJlYWR5IHJlZ2lzdGVyZWQuYCk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvcmNpYmx5IHJlZ2lzdGVycyBhIG1hdGVyaWFsIHR5cGUsIG92ZXJ3cml0aW5nIGFueSBleGlzdGluZyByZWdpc3RyYXRpb24uXG4gICAqIFRoaXMgbWV0aG9kIGJ5cGFzc2VzIHRoZSBkdXBsaWNhdGUgY2hlY2sgYW5kIGFsd2F5cyBwZXJmb3JtcyB0aGUgcmVnaXN0cmF0aW9uLlxuICAgKiBVc2Ugd2l0aCBjYXV0aW9uIGFzIGl0IGNhbiByZXBsYWNlIGV4aXN0aW5nIG1hdGVyaWFsIHR5cGUgZGVmaW5pdGlvbnMuXG4gICAqXG4gICAqIEBwYXJhbSBtYXRlcmlhbFR5cGVOYW1lIC0gVGhlIHVuaXF1ZSBuYW1lIGlkZW50aWZpZXIgZm9yIHRoZSBtYXRlcmlhbCB0eXBlXG4gICAqIEBwYXJhbSBtYXRlcmlhbE5vZGUgLSBUaGUgbWF0ZXJpYWwgY29udGVudCBkZWZpbml0aW9uIGNvbnRhaW5pbmcgc2hhZGVyIHNlbWFudGljcyBhbmQgcHJvcGVydGllc1xuICAgKiBAcGFyYW0gbWF0ZXJpYWxDb3VudFBlckJ1ZmZlclZpZXcgLSBUaGUgbnVtYmVyIG9mIG1hdGVyaWFscyBwZXIgYnVmZmVyIHZpZXdcbiAgICogQHJldHVybnMgQWx3YXlzIHJldHVybnMgdHJ1ZSBhcyB0aGUgcmVnaXN0cmF0aW9uIGlzIGZvcmNlZFxuICAgKi9cbiAgcHVibGljIGZvcmNlUmVnaXN0ZXJNYXRlcmlhbChcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBtYXRlcmlhbFR5cGVOYW1lOiBzdHJpbmcsXG4gICAgbWF0ZXJpYWxOb2RlOiBBYnN0cmFjdE1hdGVyaWFsQ29udGVudCxcbiAgICBtYXRlcmlhbENvdW50UGVyQnVmZmVyVmlldzogbnVtYmVyID0gZW5naW5lLmNvbmZpZy5tYXRlcmlhbENvdW50UGVyQnVmZmVyVmlld1xuICApOiBib29sZWFuIHtcbiAgICB0aGlzLl9fcmVnaXN0ZXJJbm5lcihtYXRlcmlhbFR5cGVOYW1lLCBtYXRlcmlhbE5vZGUsIG1hdGVyaWFsQ291bnRQZXJCdWZmZXJWaWV3KTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYSBtYXRlcmlhbCB0eXBlIGlzIGFscmVhZHkgcmVnaXN0ZXJlZCBpbiB0aGUgcmVwb3NpdG9yeS5cbiAgICpcbiAgICogQHBhcmFtIG1hdGVyaWFsVHlwZU5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgbWF0ZXJpYWwgdHlwZSB0byBjaGVja1xuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBtYXRlcmlhbCB0eXBlIGlzIHJlZ2lzdGVyZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgcHVibGljIGlzUmVnaXN0ZXJlZE1hdGVyaWFsVHlwZShtYXRlcmlhbFR5cGVOYW1lOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5fX21hdGVyaWFsTm9kZXMuaGFzKG1hdGVyaWFsVHlwZU5hbWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhIG1hdGVyaWFsIGluc3RhbmNlIGJ5IGl0cyB1bmlxdWUgaWRlbnRpZmllci5cbiAgICogUmV0dXJucyB1bmRlZmluZWQgaWYgdGhlIG1hdGVyaWFsIGRvZXNuJ3QgZXhpc3Qgb3IgaGFzIGJlZW4gZ2FyYmFnZSBjb2xsZWN0ZWQuXG4gICAqXG4gICAqIEBwYXJhbSBtYXRlcmlhbFVpZCAtIFRoZSB1bmlxdWUgaWRlbnRpZmllciBvZiB0aGUgbWF0ZXJpYWwgdG8gcmV0cmlldmVcbiAgICogQHJldHVybnMgVGhlIG1hdGVyaWFsIGluc3RhbmNlIGlmIGZvdW5kIGFuZCBzdGlsbCBhbGl2ZSwgdW5kZWZpbmVkIG90aGVyd2lzZVxuICAgKi9cbiAgcHVibGljIGdldE1hdGVyaWFsQnlNYXRlcmlhbFVpZChtYXRlcmlhbFVpZDogTWF0ZXJpYWxTSUQpOiBNYXRlcmlhbCB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX19tYXRlcmlhbE1hcC5nZXQobWF0ZXJpYWxVaWQpPy5kZXJlZigpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYWxsIGN1cnJlbnRseSBhY3RpdmUgbWF0ZXJpYWwgaW5zdGFuY2VzIGZyb20gdGhlIHJlcG9zaXRvcnkuXG4gICAqIFJldHVybnMgYW4gYXJyYXkgb2YgV2Vha1JlZiBvYmplY3RzIHRoYXQgbWF5IGNvbnRhaW4gdW5kZWZpbmVkIHZhbHVlc1xuICAgKiBpZiBtYXRlcmlhbHMgaGF2ZSBiZWVuIGdhcmJhZ2UgY29sbGVjdGVkLlxuICAgKlxuICAgKiBAcmV0dXJucyBBcnJheSBvZiBXZWFrUmVmIG9iamVjdHMgcG9pbnRpbmcgdG8gYWxsIHJlZ2lzdGVyZWQgbWF0ZXJpYWxzXG4gICAqL1xuICBwdWJsaWMgZ2V0QWxsTWF0ZXJpYWxzKCkge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuX19tYXRlcmlhbE1hcC52YWx1ZXMoKSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBtYXRlcmlhbCBpbnN0YW5jZSBvZiB0aGUgc3BlY2lmaWVkIHR5cGUuXG4gICAqIFRoZSBtYXRlcmlhbCB0eXBlIG11c3QgYmUgcmVnaXN0ZXJlZCBiZWZvcmUgY2FsbGluZyB0aGlzIG1ldGhvZC5cbiAgICogVGhpcyBtZXRob2QgaGFuZGxlcyBpbnN0YW5jZSBjb3VudGluZyBhbmQgaW5pdGlhbGl6YXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBtYXRlcmlhbFR5cGVOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIHJlZ2lzdGVyZWQgbWF0ZXJpYWwgdHlwZVxuICAgKiBAcGFyYW0gbWF0ZXJpYWxOb2RlIC0gVGhlIG1hdGVyaWFsIGNvbnRlbnQgZGVmaW5pdGlvbiBmb3IgdGhpcyBzcGVjaWZpYyBpbnN0YW5jZVxuICAgKiBAcmV0dXJucyBBIG5ldyBNYXRlcmlhbCBpbnN0YW5jZSB3aXRoIHByb3BlciBpbml0aWFsaXphdGlvblxuICAgKiBAdGhyb3dzIEVycm9yIGlmIHRoZSBtYXRlcmlhbCB0eXBlIGlzIG5vdCByZWdpc3RlcmVkIG9yIG1heGltdW0gaW5zdGFuY2VzIGV4Y2VlZGVkXG4gICAqL1xuICBwdWJsaWMgY3JlYXRlTWF0ZXJpYWwoZW5naW5lOiBFbmdpbmUsIG1hdGVyaWFsVHlwZU5hbWU6IHN0cmluZywgbWF0ZXJpYWxOb2RlOiBBYnN0cmFjdE1hdGVyaWFsQ29udGVudCk6IE1hdGVyaWFsIHtcbiAgICAvLyBnZXQgdGhlIGNvdW50IG9mIGluc3RhbmNlIGZvciB0aGUgbWF0ZXJpYWwgdHlwZVxuICAgIGxldCBjb3VudE9mVGhpc1R5cGUgPSB0aGlzLl9fbWF0ZXJpYWxJbnN0YW5jZUNvdW50T2ZUeXBlLmdldChtYXRlcmlhbFR5cGVOYW1lKSBhcyBudW1iZXI7XG5cbiAgICBjb25zdCBtYXRlcmlhbENvdW50UGVyQnVmZmVyVmlldyA9IHRoaXMuX19tYXRlcmlhbENvdW50UGVyQnVmZmVyVmlld01hcC5nZXQobWF0ZXJpYWxUeXBlTmFtZSkgYXMgbnVtYmVyO1xuICAgIGNvbnN0IGluZGV4SW5UaGVCdWZmZXJWaWV3ID0gY291bnRPZlRoaXNUeXBlICUgbWF0ZXJpYWxDb3VudFBlckJ1ZmZlclZpZXc7XG4gICAgY29uc3QgaW5kZXhPZkJ1ZmZlclZpZXdzID0gTWF0aC5mbG9vcihjb3VudE9mVGhpc1R5cGUgLyBtYXRlcmlhbENvdW50UGVyQnVmZmVyVmlldyk7XG4gICAgbGV0IG5ld2x5QWxsb2NhdGVkQnVmZmVyVmlldyA9IGZhbHNlO1xuICAgIGlmIChpbmRleEluVGhlQnVmZmVyVmlldyA9PT0gMCkge1xuICAgICAgbmV3bHlBbGxvY2F0ZWRCdWZmZXJWaWV3ID0gdGhpcy5fX2FsbG9jYXRlQnVmZmVyVmlldyhlbmdpbmUsIG1hdGVyaWFsVHlwZU5hbWUsIG1hdGVyaWFsTm9kZSwgaW5kZXhPZkJ1ZmZlclZpZXdzKTtcbiAgICB9XG5cbiAgICBjb25zdCBtYXRlcmlhbCA9IG5ldyBNYXRlcmlhbChcbiAgICAgIGVuZ2luZSxcbiAgICAgIHRoaXMuX19tYXRlcmlhbFRpZHMuZ2V0KG1hdGVyaWFsVHlwZU5hbWUpISxcbiAgICAgICsrTWF0ZXJpYWxSZXBvc2l0b3J5Ll9fbWF0ZXJpYWxVaWRDb3VudCxcbiAgICAgIGNvdW50T2ZUaGlzVHlwZSsrLFxuICAgICAgbWF0ZXJpYWxUeXBlTmFtZSxcbiAgICAgIG1hdGVyaWFsTm9kZVxuICAgICk7XG5cbiAgICB0aGlzLl9faW5pdGlhbGl6ZU1hdGVyaWFsKG1hdGVyaWFsLCBjb3VudE9mVGhpc1R5cGUsIGluZGV4T2ZCdWZmZXJWaWV3cywgaW5kZXhJblRoZUJ1ZmZlclZpZXcpO1xuICAgIGlmIChuZXdseUFsbG9jYXRlZEJ1ZmZlclZpZXcgJiYgaW5kZXhPZkJ1ZmZlclZpZXdzID4gMCkge1xuICAgICAgdGhpcy5fX21ha2VTaGFkZXJJbnZhbGlkYXRlRm9yTWF0ZXJpYWxUeXBlKG1hdGVyaWFsVHlwZU5hbWUpO1xuICAgIH1cblxuICAgIHJldHVybiBtYXRlcmlhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIGlmIGEgbmV3IG1hdGVyaWFsIG5vZGUgaXMgY29tcGF0aWJsZSB3aXRoIGFuIGV4aXN0aW5nIG1hdGVyaWFsLlxuICAgKiBDb21wYXRpYmlsaXR5IGlzIGNoZWNrZWQgYnkgY29tcGFyaW5nIHNoYWRlciBzZW1hbnRpY3MgaW5mb3JtYXRpb24gYXJyYXlzLlxuICAgKiBNYXRlcmlhbHMgYXJlIGNvbXBhdGlibGUgaWYgdGhleSBoYXZlIGlkZW50aWNhbCBzaGFkZXIgc2VtYW50aWMgc3RydWN0dXJlcy5cbiAgICpcbiAgICogQHBhcmFtIGN1cnJlbnRNYXRlcmlhbCAtIFRoZSBleGlzdGluZyBtYXRlcmlhbCB0byBjb21wYXJlIGFnYWluc3RcbiAgICogQHBhcmFtIG5ld01hdGVyaWFsTm9kZSAtIFRoZSBuZXcgbWF0ZXJpYWwgbm9kZSB0byBjaGVjayBmb3IgY29tcGF0aWJpbGl0eVxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBtYXRlcmlhbHMgYXJlIGNvbXBhdGlibGUsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgaXNNYXRlcmlhbENvbXBhdGlibGUoY3VycmVudE1hdGVyaWFsOiBNYXRlcmlhbCwgbmV3TWF0ZXJpYWxOb2RlOiBBYnN0cmFjdE1hdGVyaWFsQ29udGVudCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGV4aXN0aW5nTWF0ZXJpYWwgPSB0aGlzLl9fbWF0ZXJpYWxNYXAuZ2V0KGN1cnJlbnRNYXRlcmlhbC5tYXRlcmlhbFVJRCk/LmRlcmVmKCk7XG4gICAgaWYgKElzLm5vdC5leGlzdChleGlzdGluZ01hdGVyaWFsKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IGV4aXN0aW5nU2hhZGVyU2VtYW50aWNzSW5mb0xpc3QgPSBBcnJheS5mcm9tKGV4aXN0aW5nTWF0ZXJpYWwuX2FsbEZpZWxkc0luZm8udmFsdWVzKCkpO1xuICAgIC8vIEluY2x1ZGUgc3RhZ2UgaW5mb3JtYXRpb24gaW4gdGhlIGNvbXBhcmlzb24gdG8gZW5zdXJlIHNoYWRlciBwcm9wZXJ0aWVzIGFyZSBnZW5lcmF0ZWQgY29ycmVjdGx5XG4gICAgY29uc3QgZXhpc3RpbmdTaGFkZXJTZW1hbnRpY3NJbmZvTGlzdFN0cmluZyA9IGV4aXN0aW5nU2hhZGVyU2VtYW50aWNzSW5mb0xpc3RcbiAgICAgIC5tYXAoaW5mbyA9PiBpbmZvLnNlbWFudGljICsgaW5mby5jb21wb3NpdGlvblR5cGUuc3RyICsgaW5mby5jb21wb25lbnRUeXBlLnN0ciArIGluZm8uc3RhZ2UuaW5kZXgpXG4gICAgICAuam9pbignJyk7XG4gICAgY29uc3QgbmV3U2hhZGVyU2VtYW50aWNzSW5mb0xpc3QgPSBuZXdNYXRlcmlhbE5vZGUuX3NlbWFudGljc0luZm9BcnJheTtcbiAgICBjb25zdCBuZXdTaGFkZXJTZW1hbnRpY3NJbmZvTGlzdFN0cmluZyA9IG5ld1NoYWRlclNlbWFudGljc0luZm9MaXN0XG4gICAgICAubWFwKGluZm8gPT4gaW5mby5zZW1hbnRpYyArIGluZm8uY29tcG9zaXRpb25UeXBlLnN0ciArIGluZm8uY29tcG9uZW50VHlwZS5zdHIgKyBpbmZvLnN0YWdlLmluZGV4KVxuICAgICAgLmpvaW4oJycpO1xuICAgIGlmIChleGlzdGluZ1NoYWRlclNlbWFudGljc0luZm9MaXN0U3RyaW5nICE9PSBuZXdTaGFkZXJTZW1hbnRpY3NJbmZvTGlzdFN0cmluZykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGEgbmV3bHkgY3JlYXRlZCBtYXRlcmlhbCBpbnN0YW5jZSB3aXRoIHByb3BlciBkYXRhIHN0cnVjdHVyZXMgYW5kIG1lbW9yeSBhbGxvY2F0aW9uLlxuICAgKiBUaGlzIG1ldGhvZCBzZXRzIHVwIHRoZSBtYXRlcmlhbCdzIHNoYWRlciB2YXJpYWJsZXMsIHNlbWFudGljIGluZm9ybWF0aW9uLCBhbmQgcmVnaXN0ZXJzXG4gICAqIHRoZSBtYXRlcmlhbCBpbiB0aGUgcmVwb3NpdG9yeSdzIHRyYWNraW5nIG1hcHMuXG4gICAqXG4gICAqIEBwYXJhbSBtYXRlcmlhbCAtIFRoZSBtYXRlcmlhbCBpbnN0YW5jZSB0byBpbml0aWFsaXplXG4gICAqIEBwYXJhbSBjb3VudE9mVGhpc1R5cGUgLSBUaGUgY3VycmVudCBjb3VudCBvZiBpbnN0YW5jZXMgZm9yIHRoaXMgbWF0ZXJpYWwgdHlwZVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX2luaXRpYWxpemVNYXRlcmlhbChcbiAgICBtYXRlcmlhbDogTWF0ZXJpYWwsXG4gICAgY291bnRPZlRoaXNUeXBlOiBDb3VudCxcbiAgICBpbmRleE9mQnVmZmVyVmlld3M6IEluZGV4LFxuICAgIF9pbmRleEluVGhlQnVmZmVyVmlldzogSW5kZXhcbiAgKSB7XG4gICAgLy8gU2V0IG5hbWVcbiAgICAvLyBtYXRlcmlhbC50cnlUb1NldFVuaXF1ZU5hbWUobWF0ZXJpYWwuX19tYXRlcmlhbFR5cGVOYW1lLCB0cnVlKTtcblxuICAgIC8vIFNldCBtZXRhIGRhdGEgdG8gTWF0ZXJpYWxSZXBvc2l0b3J5XG4gICAge1xuICAgICAgdGhpcy5fX21hdGVyaWFsTWFwLnNldChtYXRlcmlhbC5tYXRlcmlhbFVJRCwgbmV3IFdlYWtSZWYobWF0ZXJpYWwpKTtcblxuICAgICAgLy8gc2V0IHRoaXMgbWF0ZXJpYWwgaW5zdGFuY2UgZm9yIHRoZSBtYXRlcmlhbCB0eXBlXG4gICAgICBsZXQgbWFwID0gdGhpcy5fX2luc3RhbmNlcy5nZXQobWF0ZXJpYWwuX19tYXRlcmlhbFR5cGVOYW1lKTtcbiAgICAgIGlmIChJcy5ub3QuZXhpc3QobWFwKSkge1xuICAgICAgICBtYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuX19pbnN0YW5jZXMuc2V0KG1hdGVyaWFsLm1hdGVyaWFsVHlwZU5hbWUsIG1hcCk7XG4gICAgICB9XG4gICAgICBtYXAuc2V0KG1hdGVyaWFsLm1hdGVyaWFsU0lELCBuZXcgV2Vha1JlZihtYXRlcmlhbCkpO1xuXG4gICAgICAvLyBzZXQgdGhlIGNvdW50IG9mIGluc3RhbmNlIGZvciB0aGUgbWF0ZXJpYWwgdHlwZVxuICAgICAgdGhpcy5fX21hdGVyaWFsSW5zdGFuY2VDb3VudE9mVHlwZS5zZXQobWF0ZXJpYWwubWF0ZXJpYWxUeXBlTmFtZSwgY291bnRPZlRoaXNUeXBlKTtcbiAgICB9XG5cbiAgICAvLyBTZXQgc2VtYW50aWNzSW5mbyBhbmQgc2hhZGVyVmFyaWFibGVzIHRvIHRoZSBtYXRlcmlhbCBpbnN0YW5jZVxuICAgIGlmIChJcy5leGlzdChtYXRlcmlhbC5fbWF0ZXJpYWxDb250ZW50KSkge1xuICAgICAgY29uc3Qgc2VtYW50aWNzSW5mb0FycmF5ID0gbWF0ZXJpYWwuX21hdGVyaWFsQ29udGVudC5fc2VtYW50aWNzSW5mb0FycmF5O1xuICAgICAgY29uc3QgYWNjZXNzb3JNYXAgPSB0aGlzLl9fYWNjZXNzb3JzLmdldChtYXRlcmlhbC5tYXRlcmlhbFR5cGVOYW1lKSEuZ2V0KGluZGV4T2ZCdWZmZXJWaWV3cykhO1xuICAgICAgc2VtYW50aWNzSW5mb0FycmF5LmZvckVhY2goc2VtYW50aWNzSW5mbyA9PiB7XG4gICAgICAgIG1hdGVyaWFsLl9hbGxGaWVsZHNJbmZvLnNldChzZW1hbnRpY3NJbmZvLnNlbWFudGljLCBzZW1hbnRpY3NJbmZvKTtcbiAgICAgICAgaWYgKCFzZW1hbnRpY3NJbmZvLnNvbG9EYXR1bSkge1xuICAgICAgICAgIGNvbnN0IGFjY2Vzc29yID0gYWNjZXNzb3JNYXAuZ2V0KHNlbWFudGljc0luZm8uc2VtYW50aWMpIGFzIEFjY2Vzc29yO1xuICAgICAgICAgIGNvbnN0IHR5cGVkQXJyYXkgPSBhY2Nlc3Nvci50YWtlT25lKCkgYXMgRmxvYXQzMkFycmF5O1xuICAgICAgICAgIGNvbnN0IHNoYWRlclZhcmlhYmxlID0ge1xuICAgICAgICAgICAgaW5mbzogc2VtYW50aWNzSW5mbyxcbiAgICAgICAgICAgIHZhbHVlOiBNYXRoQ2xhc3NVdGlsLmluaXRXaXRoRmxvYXQzMkFycmF5KHNlbWFudGljc0luZm8uaW5pdGlhbFZhbHVlLCB0eXBlZEFycmF5KSxcbiAgICAgICAgICB9O1xuICAgICAgICAgIG1hdGVyaWFsLl9hbGxGaWVsZFZhcmlhYmxlcy5zZXQoc2VtYW50aWNzSW5mby5zZW1hbnRpYywgc2hhZGVyVmFyaWFibGUpO1xuICAgICAgICAgIGlmICghc2VtYW50aWNzSW5mby5pc0ludGVybmFsU2V0dGluZykge1xuICAgICAgICAgICAgbWF0ZXJpYWwuX2F1dG9GaWVsZFZhcmlhYmxlc09ubHkuc2V0KHNlbWFudGljc0luZm8uc2VtYW50aWMsIHNoYWRlclZhcmlhYmxlKTtcbiAgICAgICAgICAgIGlmIChDb21wb3NpdGlvblR5cGUuaXNUZXh0dXJlKHNlbWFudGljc0luZm8uY29tcG9zaXRpb25UeXBlKSkge1xuICAgICAgICAgICAgICBtYXRlcmlhbC5fYXV0b1RleHR1cmVGaWVsZFZhcmlhYmxlc09ubHkuc2V0KHNlbWFudGljc0luZm8uc2VtYW50aWMsIHNoYWRlclZhcmlhYmxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzZW1hbnRpY3NJbmZvLm5lZWRVbmlmb3JtSW5EYXRhVGV4dHVyZU1vZGUpIHtcbiAgICAgICAgICAgICAgbWF0ZXJpYWwuX2F1dG9Vbmlmb3JtRmllbGRWYXJpYWJsZXNPbmx5LnNldChzZW1hbnRpY3NJbmZvLnNlbWFudGljLCBzaGFkZXJWYXJpYWJsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWVtb3J5IGxvY2F0aW9uIG9mZnNldCBmb3IgYSBzcGVjaWZpYyBwcm9wZXJ0eSBvZiBhIG1hdGVyaWFsIHR5cGUuXG4gICAqIFRoZSBvZmZzZXQgaXMgY2FsY3VsYXRlZCBpbiAxNi1ieXRlIGFsaWduZWQgdW5pdHMgZm9yIEdQVSBidWZmZXIgYWNjZXNzLlxuICAgKiBUaGlzIGlzIHVzZWQgZm9yIGVmZmljaWVudCBHUFUgbWVtb3J5IGFjY2VzcyBpbiBzaGFkZXJzLlxuICAgKlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0gbWF0ZXJpYWxUeXBlTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBtYXRlcmlhbCB0eXBlXG4gICAqIEBwYXJhbSBwcm9wZXJ0eU5hbWUgLSBUaGUgc2hhZGVyIHNlbWFudGljIG5hbWUgb2YgdGhlIHByb3BlcnR5XG4gICAqIEByZXR1cm5zIFRoZSBieXRlIG9mZnNldCBkaXZpZGVkIGJ5IDE2IChJbmRleE9mMTZCeXRlcykgZm9yIHRoZSBwcm9wZXJ0eSBsb2NhdGlvblxuICAgKi9cbiAgZ2V0TG9jYXRpb25PZmZzZXRPZk1lbWJlck9mTWF0ZXJpYWwoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgbWF0ZXJpYWxUeXBlTmFtZTogc3RyaW5nLFxuICAgIHByb3BlcnR5TmFtZTogU2hhZGVyU2VtYW50aWNzTmFtZVxuICApOiBJbmRleE9mMTZCeXRlc1tdIHtcbiAgICBjb25zdCBtYXAgPSB0aGlzLl9faW5zdGFuY2VzLmdldChtYXRlcmlhbFR5cGVOYW1lKSE7XG4gICAgY29uc3QgbWF0ZXJpYWxSZWYgPSBBcnJheS5mcm9tKG1hcC52YWx1ZXMoKSkuZmluZChtID0+IG0uZGVyZWYoKSAhPT0gdW5kZWZpbmVkKTsgLy8gZmluZCBhbiBhY3R1YWwgZXhpc3QgbWF0ZXJpYWxcbiAgICBpZiAoSXMubm90LmV4aXN0KG1hdGVyaWFsUmVmPy5kZXJlZigpKSkge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQud2FybihcbiAgICAgICAgYE1hdGVyaWFsIGlzIG5vdCBmb3VuZC4gZ2V0TG9jYXRpb25PZmZzZXRPZk1lbWJlck9mTWF0ZXJpYWwgcmV0dXJucyBpbnZhbGlkIDAgdmFsdWUuIG1hdGVyaWFsVHlwZU5hbWU6ICR7bWF0ZXJpYWxUeXBlTmFtZX1gXG4gICAgICApO1xuICAgICAgcmV0dXJuIFswXTtcbiAgICB9XG4gICAgY29uc3QgbWF0ZXJpYWwgPSBtYXRlcmlhbFJlZi5kZXJlZigpITtcbiAgICBjb25zdCBpbmZvID0gbWF0ZXJpYWwuX2FsbEZpZWxkc0luZm8uZ2V0KHByb3BlcnR5TmFtZSkhO1xuICAgIGlmIChpbmZvLnNvbG9EYXR1bSkge1xuICAgICAgY29uc3QgdmFsdWUgPSB0aGlzLl9zb2xvRGF0dW1GaWVsZHMuZ2V0KG1hdGVyaWFsLm1hdGVyaWFsVHlwZU5hbWUpIS5nZXQocHJvcGVydHlOYW1lKTtcbiAgICAgIHJldHVybiBbKHZhbHVlIS52YWx1ZS5fdiBhcyBGbG9hdDMyQXJyYXkpLmJ5dGVPZmZzZXQgLyA0IC8gNF07XG4gICAgfVxuICAgIGNvbnN0IHByb3BlcnRpZXNPZkJ1ZmZlclZpZXdzID0gdGhpcy5fX2FjY2Vzc29ycy5nZXQobWF0ZXJpYWxUeXBlTmFtZSk7XG4gICAgY29uc3QgbG9jYXRpb25PZmZzZXRzOiBJbmRleE9mMTZCeXRlc1tdID0gW107XG4gICAgcHJvcGVydGllc09mQnVmZmVyVmlld3M/LmZvckVhY2gocHJvcGVydGllcyA9PiB7XG4gICAgICBjb25zdCBhY2Nlc3NvciA9IHByb3BlcnRpZXMuZ2V0KHByb3BlcnR5TmFtZSkhO1xuICAgICAgY29uc3QgYnl0ZU9mZnNldE9mRXhpc3RpbmdCdWZmZXJzID0gZW5naW5lLm1lbW9yeU1hbmFnZXIuZ2V0Qnl0ZU9mZnNldE9mRXhpc3RpbmdCdWZmZXJzKFxuICAgICAgICBCdWZmZXJVc2UuR1BVSW5zdGFuY2VEYXRhLFxuICAgICAgICBhY2Nlc3Nvci5idWZmZXJWaWV3LmJ1ZmZlci5pbmRleE9mVGhlQnVmZmVyVXNhZ2VcbiAgICAgICk7XG4gICAgICBjb25zdCBieXRlT2Zmc2V0ID0gYnl0ZU9mZnNldE9mRXhpc3RpbmdCdWZmZXJzICsgYWNjZXNzb3IuYnl0ZU9mZnNldEluQnVmZmVyO1xuICAgICAgbG9jYXRpb25PZmZzZXRzLnB1c2goYnl0ZU9mZnNldCAvIDQgLyA0KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBsb2NhdGlvbk9mZnNldHM7XG4gIH1cblxuICAvKipcbiAgICogSW50ZXJuYWwgbWV0aG9kIHRoYXQgcGVyZm9ybXMgdGhlIGFjdHVhbCBtYXRlcmlhbCB0eXBlIHJlZ2lzdHJhdGlvbi5cbiAgICogVGhpcyBtZXRob2Qgc2V0cyB1cCB0aGUgbWF0ZXJpYWwgdHlwZSBJRCwgYWxsb2NhdGVzIGJ1ZmZlciB2aWV3cyxcbiAgICogYW5kIGluaXRpYWxpemVzIGFsbCBuZWNlc3NhcnkgZGF0YSBzdHJ1Y3R1cmVzLlxuICAgKlxuICAgKiBAcGFyYW0gbWF0ZXJpYWxUeXBlTmFtZSAtIFRoZSB1bmlxdWUgbmFtZSBpZGVudGlmaWVyIGZvciB0aGUgbWF0ZXJpYWwgdHlwZVxuICAgKiBAcGFyYW0gbWF0ZXJpYWxOb2RlIC0gVGhlIG1hdGVyaWFsIGNvbnRlbnQgZGVmaW5pdGlvblxuICAgKiBAcGFyYW0gbWF0ZXJpYWxDb3VudFBlckJ1ZmZlclZpZXcgLSBUaGUgbnVtYmVyIG9mIG1hdGVyaWFscyBwZXIgYnVmZmVyIHZpZXdcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgX19yZWdpc3RlcklubmVyKFxuICAgIG1hdGVyaWFsVHlwZU5hbWU6IHN0cmluZyxcbiAgICBtYXRlcmlhbE5vZGU6IEFic3RyYWN0TWF0ZXJpYWxDb250ZW50LFxuICAgIG1hdGVyaWFsQ291bnRQZXJCdWZmZXJWaWV3OiBudW1iZXJcbiAgKSB7XG4gICAgY29uc3QgbWF0ZXJpYWxUaWQgPSArK01hdGVyaWFsUmVwb3NpdG9yeS5fX21hdGVyaWFsVGlkQ291bnQ7XG4gICAgdGhpcy5fX21hdGVyaWFsTm9kZXMuc2V0KG1hdGVyaWFsVHlwZU5hbWUsIG1hdGVyaWFsTm9kZSk7XG4gICAgdGhpcy5fX21hdGVyaWFsVGlkcy5zZXQobWF0ZXJpYWxUeXBlTmFtZSwgbWF0ZXJpYWxUaWQpO1xuICAgIHRoaXMuX19tYXRlcmlhbENvdW50UGVyQnVmZmVyVmlld01hcC5zZXQobWF0ZXJpYWxUeXBlTmFtZSwgbWF0ZXJpYWxDb3VudFBlckJ1ZmZlclZpZXcpO1xuICAgIHRoaXMuX19tYXRlcmlhbEluc3RhbmNlQ291bnRPZlR5cGUuc2V0KG1hdGVyaWFsVHlwZU5hbWUsIDApO1xuICAgIHRoaXMuX19idWZmZXJWaWV3VmVyc2lvbnMuc2V0KG1hdGVyaWFsVHlwZU5hbWUsIDApO1xuICB9XG5cbiAgLyoqXG4gICAqIEFsbG9jYXRlcyBHUFUgYnVmZmVyIG1lbW9yeSBmb3IgYSBtYXRlcmlhbCB0eXBlIGJhc2VkIG9uIGl0cyBzaGFkZXIgc2VtYW50aWNzLlxuICAgKiBUaGlzIG1ldGhvZCBjYWxjdWxhdGVzIHRoZSB0b3RhbCBtZW1vcnkgcmVxdWlyZW1lbnRzLCBjcmVhdGVzIGJ1ZmZlciB2aWV3cyxcbiAgICogYW5kIHNldHMgdXAgYWNjZXNzb3JzIGZvciBlZmZpY2llbnQgR1BVIGRhdGEgYWNjZXNzLlxuICAgKlxuICAgKiBAcGFyYW0gbWF0ZXJpYWxUeXBlTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBtYXRlcmlhbCB0eXBlIHRvIGFsbG9jYXRlIG1lbW9yeSBmb3JcbiAgICogQHBhcmFtIG1hdGVyaWFsTm9kZSAtIFRoZSBtYXRlcmlhbCBub2RlIGNvbnRhaW5pbmcgc2VtYW50aWMgaW5mb3JtYXRpb25cbiAgICogQHJldHVybnMgV2hldGhlciBhIG5ldyBCdWZmZXJWaWV3IHdhcyBhbGxvY2F0ZWQgKHRydWUpIG9yIGFuIGV4aXN0aW5nIG9uZSB3YXMgcmV1c2VkIChmYWxzZSlcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgX19hbGxvY2F0ZUJ1ZmZlclZpZXcoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgbWF0ZXJpYWxUeXBlTmFtZTogc3RyaW5nLFxuICAgIG1hdGVyaWFsTm9kZTogQWJzdHJhY3RNYXRlcmlhbENvbnRlbnQsXG4gICAgaW5kZXhPZkJ1ZmZlclZpZXdzOiBJbmRleE9mQnVmZmVyVmlld3NcbiAgKTogYm9vbGVhbiB7XG4gICAgbGV0IG5ld2x5QWxsb2NhdGVkID0gZmFsc2U7XG4gICAgLy8gQ2FsY3VsYXRlIGEgQnVmZmVyVmlldyBzaXplIHRvIHRha2VcbiAgICBsZXQgdG90YWxCeXRlTGVuZ3RoID0gMDtcbiAgICBjb25zdCBhbGlnbmVkQnl0ZUxlbmd0aEFuZFNlbWFudGljSW5mb0FycmF5OiB7XG4gICAgICBhbGlnbmVkQnl0ZTogbnVtYmVyO1xuICAgICAgc2VtYW50aWNJbmZvOiBTaGFkZXJTZW1hbnRpY3NJbmZvO1xuICAgIH1bXSA9IFtdO1xuICAgIGZvciAoY29uc3Qgc2VtYW50aWNJbmZvIG9mIG1hdGVyaWFsTm9kZS5fc2VtYW50aWNzSW5mb0FycmF5KSB7XG4gICAgICBjb25zdCBhbGlnbmVkQnl0ZUxlbmd0aCA9IGNhbGNBbGlnbmVkQnl0ZUxlbmd0aChzZW1hbnRpY0luZm8pO1xuICAgICAgbGV0IGRhdGFDb3VudCA9IDE7XG4gICAgICBpZiAoIXNlbWFudGljSW5mby5zb2xvRGF0dW0pIHtcbiAgICAgICAgZGF0YUNvdW50ID0gdGhpcy5fX21hdGVyaWFsQ291bnRQZXJCdWZmZXJWaWV3TWFwLmdldChtYXRlcmlhbFR5cGVOYW1lKSE7XG4gICAgICB9XG5cbiAgICAgIHRvdGFsQnl0ZUxlbmd0aCArPSBhbGlnbmVkQnl0ZUxlbmd0aCAqIGRhdGFDb3VudDtcbiAgICAgIGFsaWduZWRCeXRlTGVuZ3RoQW5kU2VtYW50aWNJbmZvQXJyYXkucHVzaCh7XG4gICAgICAgIGFsaWduZWRCeXRlOiBhbGlnbmVkQnl0ZUxlbmd0aCxcbiAgICAgICAgc2VtYW50aWNJbmZvOiBzZW1hbnRpY0luZm8sXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuX19hY2Nlc3NvcnMuaGFzKG1hdGVyaWFsVHlwZU5hbWUpKSB7XG4gICAgICB0aGlzLl9fYWNjZXNzb3JzLnNldChtYXRlcmlhbFR5cGVOYW1lLCBuZXcgTWFwKCkpO1xuICAgIH1cblxuICAgIC8vIHRha2UgQSBCdWZmZXIgVmlldyBmcm9tIEdQVUluc3RhbmNlRGF0YSBidWZmZXIsIG9yIHJldXNlIGl0IGlmIGl0IGFscmVhZHkgZXhpc3RzXG4gICAgbGV0IGJ1ZmZlclZpZXc6IEJ1ZmZlclZpZXcgfCB1bmRlZmluZWQ7XG4gICAgaWYgKHRoaXMuX19idWZmZXJWaWV3cy5oYXMobWF0ZXJpYWxUeXBlTmFtZSkpIHtcbiAgICAgIGNvbnN0IG1hcCA9IHRoaXMuX19idWZmZXJWaWV3cy5nZXQobWF0ZXJpYWxUeXBlTmFtZSkhO1xuICAgICAgYnVmZmVyVmlldyA9IG1hcC5nZXQoaW5kZXhPZkJ1ZmZlclZpZXdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fX2J1ZmZlclZpZXdzLnNldChtYXRlcmlhbFR5cGVOYW1lLCBuZXcgTWFwKCkpO1xuICAgIH1cbiAgICBpZiAoYnVmZmVyVmlldyA9PSBudWxsKSB7XG4gICAgICBsZXQgYnVmZmVyVmlld1Jlc3VsdDogUmVzdWx0PEJ1ZmZlclZpZXcsIHsgJ0J1ZmZlci5ieXRlTGVuZ3RoJzogQnl0ZTsgJ0J1ZmZlci50YWtlblNpemVJbkJ5dGUnOiBCeXRlIH0+O1xuICAgICAgbGV0IHJlcXVpcmVCdWZmZXJMYXllckluZGV4ID0gMDtcbiAgICAgIGRvIHtcbiAgICAgICAgY29uc3QgYnVmZmVyID0gZW5naW5lLm1lbW9yeU1hbmFnZXIuY3JlYXRlT3JHZXRCdWZmZXIoQnVmZmVyVXNlLkdQVUluc3RhbmNlRGF0YSwgcmVxdWlyZUJ1ZmZlckxheWVySW5kZXgpO1xuICAgICAgICBidWZmZXJWaWV3UmVzdWx0ID0gYnVmZmVyLnRha2VCdWZmZXJWaWV3KHtcbiAgICAgICAgICBieXRlTGVuZ3RoVG9OZWVkOiB0b3RhbEJ5dGVMZW5ndGgsXG4gICAgICAgICAgYnl0ZVN0cmlkZTogMCxcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChidWZmZXJWaWV3UmVzdWx0LmlzRXJyKCkpIHtcbiAgICAgICAgICByZXF1aXJlQnVmZmVyTGF5ZXJJbmRleCsrO1xuICAgICAgICB9XG4gICAgICB9IHdoaWxlIChidWZmZXJWaWV3UmVzdWx0LmlzRXJyKCkpO1xuICAgICAgYnVmZmVyVmlldyA9IGJ1ZmZlclZpZXdSZXN1bHQuZ2V0KCk7XG4gICAgICB0aGlzLl9fYnVmZmVyVmlld3MuZ2V0KG1hdGVyaWFsVHlwZU5hbWUpIS5zZXQoaW5kZXhPZkJ1ZmZlclZpZXdzLCBidWZmZXJWaWV3KTtcbiAgICAgIG5ld2x5QWxsb2NhdGVkID0gdHJ1ZTtcbiAgICAgIC8vIGJ1bXAgYnVmZmVyIHZpZXcgdmVyc2lvbiBzbyBzaGFkZXJzIHBpY2sgdXAgbmV3IG9mZnNldHNcbiAgICAgIGNvbnN0IGN1cnJlbnRWZXJzaW9uID0gdGhpcy5fX2J1ZmZlclZpZXdWZXJzaW9ucy5nZXQobWF0ZXJpYWxUeXBlTmFtZSkgPz8gMDtcbiAgICAgIHRoaXMuX19idWZmZXJWaWV3VmVyc2lvbnMuc2V0KG1hdGVyaWFsVHlwZU5hbWUsIGN1cnJlbnRWZXJzaW9uICsgMSk7XG4gICAgfVxuXG4gICAgLy8gVGFrZSBBY2Nlc3NvcnMgYW5kIHJlZ2lzdGVyIGl0XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhbGlnbmVkQnl0ZUxlbmd0aEFuZFNlbWFudGljSW5mb0FycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBhbGlnbmVkQnl0ZSA9IGFsaWduZWRCeXRlTGVuZ3RoQW5kU2VtYW50aWNJbmZvQXJyYXlbaV0uYWxpZ25lZEJ5dGU7XG4gICAgICBjb25zdCBzZW1hbnRpY0luZm8gPSBhbGlnbmVkQnl0ZUxlbmd0aEFuZFNlbWFudGljSW5mb0FycmF5W2ldLnNlbWFudGljSW5mbztcblxuICAgICAgbGV0IGNvdW50ID0gMTtcbiAgICAgIGlmICghc2VtYW50aWNJbmZvLnNvbG9EYXR1bSkge1xuICAgICAgICBjb3VudCA9IHRoaXMuX19tYXRlcmlhbENvdW50UGVyQnVmZmVyVmlld01hcC5nZXQobWF0ZXJpYWxUeXBlTmFtZSkhO1xuICAgICAgfVxuICAgICAgbGV0IG1heEFycmF5TGVuZ3RoID0gc2VtYW50aWNJbmZvLmFycmF5TGVuZ3RoO1xuICAgICAgaWYgKENvbXBvc2l0aW9uVHlwZS5pc0FycmF5KHNlbWFudGljSW5mby5jb21wb3NpdGlvblR5cGUpICYmIG1heEFycmF5TGVuZ3RoID09IG51bGwpIHtcbiAgICAgICAgbWF4QXJyYXlMZW5ndGggPSAxMDA7XG4gICAgICB9XG4gICAgICAvLyB0YWtlIGFuIEFjY2Vzc29yXG4gICAgICBjb25zdCBhY2Nlc3NvciA9IGJ1ZmZlclZpZXchXG4gICAgICAgIC50YWtlQWNjZXNzb3Ioe1xuICAgICAgICAgIGNvbXBvc2l0aW9uVHlwZTogc2VtYW50aWNJbmZvLmNvbXBvc2l0aW9uVHlwZSxcbiAgICAgICAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICAgICAgICAgIGNvdW50OiBjb3VudCxcbiAgICAgICAgICBieXRlU3RyaWRlOiBhbGlnbmVkQnl0ZSxcbiAgICAgICAgICBhcnJheUxlbmd0aDogbWF4QXJyYXlMZW5ndGgsXG4gICAgICAgIH0pXG4gICAgICAgIC51bndyYXBGb3JjZSgpO1xuXG4gICAgICBpZiAoc2VtYW50aWNJbmZvLnNvbG9EYXR1bSkge1xuICAgICAgICBjb25zdCB0eXBlZEFycmF5ID0gYWNjZXNzb3IudGFrZU9uZSgpIGFzIEZsb2F0MzJBcnJheTtcbiAgICAgICAgbGV0IG1hcCA9IHRoaXMuX3NvbG9EYXR1bUZpZWxkcy5nZXQobWF0ZXJpYWxUeXBlTmFtZSk7XG4gICAgICAgIGlmIChtYXAgPT0gbnVsbCkge1xuICAgICAgICAgIG1hcCA9IG5ldyBNYXAoKTtcbiAgICAgICAgICB0aGlzLl9zb2xvRGF0dW1GaWVsZHMuc2V0KG1hdGVyaWFsVHlwZU5hbWUsIG1hcCk7XG4gICAgICAgIH1cblxuICAgICAgICBtYXAuc2V0KHNlbWFudGljSW5mby5zZW1hbnRpYywge1xuICAgICAgICAgIGluZm86IHNlbWFudGljSW5mbyxcbiAgICAgICAgICB2YWx1ZTogTWF0aENsYXNzVXRpbC5pbml0V2l0aEZsb2F0MzJBcnJheShzZW1hbnRpY0luZm8uaW5pdGlhbFZhbHVlLCB0eXBlZEFycmF5KSxcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBTZXQgYW4gYWNjZXNzb3IgdG8gdGhpcy5fX2FjY2Vzc29yc1xuICAgICAgICBsZXQgcHJvcGVydGllcyA9IHRoaXMuX19hY2Nlc3NvcnMuZ2V0KG1hdGVyaWFsVHlwZU5hbWUpIS5nZXQoaW5kZXhPZkJ1ZmZlclZpZXdzKTtcbiAgICAgICAgaWYgKHByb3BlcnRpZXMgPT0gbnVsbCkge1xuICAgICAgICAgIGNvbnN0IG1hcCA9IG5ldyBNYXAoKTtcbiAgICAgICAgICB0aGlzLl9fYWNjZXNzb3JzLmdldChtYXRlcmlhbFR5cGVOYW1lKSEuc2V0KGluZGV4T2ZCdWZmZXJWaWV3cywgbWFwKTtcbiAgICAgICAgICBwcm9wZXJ0aWVzID0gbWFwO1xuICAgICAgICB9XG4gICAgICAgIHByb3BlcnRpZXMuc2V0KHNlbWFudGljSW5mby5zZW1hbnRpYywgYWNjZXNzb3IpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBuZXdseUFsbG9jYXRlZDtcbiAgfVxuXG4gIF9nZXRNYXRlcmlhbENvdW50UGVyQnVmZmVyVmlldyhtYXRlcmlhbFR5cGVOYW1lOiBzdHJpbmcpOiBDb3VudCB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX19tYXRlcmlhbENvdW50UGVyQnVmZmVyVmlld01hcC5nZXQobWF0ZXJpYWxUeXBlTmFtZSk7XG4gIH1cblxuICAvKipcbiAgICogUHVibGljIGFjY2Vzc29yIHVzZWQgYnkgZGVidWdnaW5nIHRvb2xzLiBUaGUgbWF0ZXJpYWwgU0lEIHNlbGVjdHMgYSBidWZmZXIgdmlld1xuICAgKiB3aXRoIGBmbG9vcihtYXRlcmlhbFNJRCAvIG1hdGVyaWFsQ291bnRQZXJCdWZmZXJWaWV3KWAuXG4gICAqL1xuICBnZXRNYXRlcmlhbENvdW50UGVyQnVmZmVyVmlldyhtYXRlcmlhbFR5cGVOYW1lOiBzdHJpbmcpOiBDb3VudCB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX2dldE1hdGVyaWFsQ291bnRQZXJCdWZmZXJWaWV3KG1hdGVyaWFsVHlwZU5hbWUpO1xuICB9XG5cbiAgX2dldEJ1ZmZlclZpZXdWZXJzaW9uKG1hdGVyaWFsVHlwZU5hbWU6IHN0cmluZyk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX19idWZmZXJWaWV3VmVyc2lvbnMuZ2V0KG1hdGVyaWFsVHlwZU5hbWUpID8/IDA7XG4gIH1cblxuICAvKipcbiAgICogSW52YWxpZGF0ZXMgYWxsIHNoYWRlciBwcm9ncmFtcyBmb3IgYWxsIHJlZ2lzdGVyZWQgbWF0ZXJpYWxzLlxuICAgKiBUaGlzIG1ldGhvZCBpcyB0eXBpY2FsbHkgY2FsbGVkIHdoZW4gZ2xvYmFsIHNoYWRlciBzZXR0aW5ncyBjaGFuZ2VcbiAgICogYW5kIGFsbCBtYXRlcmlhbHMgbmVlZCB0byByZWNvbXBpbGUgdGhlaXIgc2hhZGVycy5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfbWFrZVNoYWRlckludmFsaWRhdGVUb0FsbE1hdGVyaWFscygpIHtcbiAgICBmb3IgKGNvbnN0IG1hdGVyaWFsIG9mIHRoaXMuX19tYXRlcmlhbE1hcC52YWx1ZXMoKSkge1xuICAgICAgbWF0ZXJpYWwuZGVyZWYoKT8ubWFrZVNoYWRlcnNJbnZhbGlkYXRlKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEludmFsaWRhdGVzIHNoYWRlciBwcm9ncmFtcyBvbmx5IGZvciBtYXRlcmlhbHMgdGhhdCBhcmUgYWZmZWN0ZWQgYnkgbW9ycGggY2hhbmdlcy5cbiAgICogQWZmZWN0ZWQgbWF0ZXJpYWxzIGFyZSB0aG9zZSB0aGF0IHN1cHBvcnQgbW9ycGhpbmcgYW5kIGFyZSBjdXJyZW50bHkgdXNlZCBieSBwcmltaXRpdmVzXG4gICAqIHdpdGggbW9ycGggdGFyZ2V0cy5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfbWFrZVNoYWRlckludmFsaWRhdGVUb01vcnBoTWF0ZXJpYWxzKCkge1xuICAgIGZvciAoY29uc3QgbWF0ZXJpYWxSZWYgb2YgdGhpcy5fX21hdGVyaWFsTWFwLnZhbHVlcygpKSB7XG4gICAgICBjb25zdCBtYXRlcmlhbCA9IG1hdGVyaWFsUmVmLmRlcmVmKCk7XG4gICAgICBpZiAobWF0ZXJpYWwgPT0gbnVsbCB8fCBtYXRlcmlhbC5pc01vcnBoaW5nID09PSBmYWxzZSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcHJpbWl0aXZlcyA9IG1hdGVyaWFsLmdldEJlbG9uZ1ByaW1pdGl2ZXMoKTtcbiAgICAgIGZvciAoY29uc3QgcHJpbWl0aXZlIG9mIHByaW1pdGl2ZXMudmFsdWVzKCkpIHtcbiAgICAgICAgaWYgKHByaW1pdGl2ZS50YXJnZXRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBtYXRlcmlhbC5tYWtlU2hhZGVyc0ludmFsaWRhdGUoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX19tYWtlU2hhZGVySW52YWxpZGF0ZUZvck1hdGVyaWFsVHlwZShtYXRlcmlhbFR5cGVOYW1lOiBzdHJpbmcpIHtcbiAgICBjb25zdCBtYXRlcmlhbHMgPSB0aGlzLl9faW5zdGFuY2VzLmdldChtYXRlcmlhbFR5cGVOYW1lKTtcbiAgICBpZiAobWF0ZXJpYWxzID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IG1hdGVyaWFsUmVmIG9mIG1hdGVyaWFscy52YWx1ZXMoKSkge1xuICAgICAgbWF0ZXJpYWxSZWYuZGVyZWYoKT8ubWFrZVNoYWRlcnNJbnZhbGlkYXRlKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgc3RhdGUgdmVyc2lvbiBmb3IgbWF0ZXJpYWxzIGluIHRoaXMgcmVwb3NpdG9yeS5cbiAgICogVGhpcyB2ZXJzaW9uIGlzIGluY3JlbWVudGVkIHdoZW5ldmVyIGFueSBtYXRlcmlhbCdzIHN0YXRlIGNoYW5nZXMuXG4gICAqIEByZXR1cm5zIFRoZSBjdXJyZW50IHN0YXRlIHZlcnNpb24gbnVtYmVyXG4gICAqL1xuICBnZXQgc3RhdGVWZXJzaW9uKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX19zdGF0ZVZlcnNpb247XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgc3RhdGUgdmVyc2lvbiB0aGF0IGludmFsaWRhdGVzIEdQVSBiaW5kIGdyb3VwcyBhbmQgcmVuZGVyIGJ1bmRsZXMuXG4gICAqIEByZXR1cm5zIFRoZSBiaW5kaW5nIHN0YXRlIHZlcnNpb24gbnVtYmVyXG4gICAqL1xuICBnZXQgYmluZGluZ1N0YXRlVmVyc2lvbigpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9fYmluZGluZ1N0YXRlVmVyc2lvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmNyZW1lbnRzIHRoZSBzdGF0ZSB2ZXJzaW9uIGNvdW50ZXIuXG4gICAqIENhbGxlZCB3aGVuIGEgbWF0ZXJpYWwncyBzdGF0ZSBjaGFuZ2VzLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9pbmNyZW1lbnRTdGF0ZVZlcnNpb24oKTogdm9pZCB7XG4gICAgdGhpcy5fX3N0YXRlVmVyc2lvbisrO1xuICB9XG5cbiAgLyoqXG4gICAqIEluY3JlbWVudHMgdGhlIHN0YXRlIHZlcnNpb24gdGhhdCBpbnZhbGlkYXRlcyBXZWJHUFUgYmluZCBncm91cHMgYW5kXG4gICAqIHJlbmRlciBidW5kbGVzLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9pbmNyZW1lbnRCaW5kaW5nU3RhdGVWZXJzaW9uKCk6IHZvaWQge1xuICAgIHRoaXMuX19iaW5kaW5nU3RhdGVWZXJzaW9uKys7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFTQSxTQUFTLGlCQUFpQjtBQUMxQixTQUFTLHFCQUFxQjtBQUM5QixTQUFTLHVCQUF1QjtBQUVoQyxTQUFTLDZCQUF1RDtBQUNoRSxTQUFTLHFCQUFxQjtBQUc5QixTQUFTLFVBQVU7QUFDbkIsU0FBUyxjQUFjO0FBSXZCLFNBQVMsZ0JBQWdCO0FBT2xCLElBQU0sc0JBQU4sTUFBTSxvQkFBbUI7QUFBQSxFQUF6QjtBQUNMLFNBQVFBLEtB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QUFBQSxFQUVRZSxHQUFzQyxrQkFBMEI7QUF2ZjFFO0FBd2ZJLFVBQU0sWUFBWSxLQUFLZCxHQUFZLElBQUksZ0JBQWdCO0FBQ3ZELFFBQUksYUFBYSxNQUFNO0FBQ3JCO0FBQUEsSUFDRjtBQUVBLGVBQVcsZUFBZSxVQUFVLE9BQU8sR0FBRztBQUM1Qyx3QkFBWSxNQUFNLE1BQWxCLG1CQUFxQjtBQUFBLElBQ3ZCO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLElBQUksZUFBdUI7QUFDekIsV0FBTyxLQUFLUTtBQUFBLEVBQ2Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBSSxzQkFBOEI7QUFDaEMsV0FBTyxLQUFLQztBQUFBLEVBQ2Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSx5QkFBK0I7QUFDN0IsU0FBS0Q7QUFBQSxFQUNQO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsZ0NBQXNDO0FBQ3BDLFNBQUtDO0FBQUEsRUFDUDtBQUNGO0FBdmdCYSxvQkFxQklPLEtBQXFCO0FBckJ6QixvQkFzQklKLEtBQXFCO0FBdEIvQixJQUFNLHFCQUFOOyIsCiAgIm5hbWVzIjogWyJfX21hdGVyaWFsTWFwIiwgIl9faW5zdGFuY2VzIiwgIl9fbWF0ZXJpYWxUaWRzIiwgIl9fbWF0ZXJpYWxJbnN0YW5jZUNvdW50T2ZUeXBlIiwgIl9fbWF0ZXJpYWxOb2RlcyIsICJfX21hdGVyaWFsQ291bnRQZXJCdWZmZXJWaWV3TWFwIiwgIl9fYnVmZmVyVmlld3MiLCAiX19hY2Nlc3NvcnMiLCAiX19idWZmZXJWaWV3VmVyc2lvbnMiLCAiX19zdGF0ZVZlcnNpb24iLCAiX19iaW5kaW5nU3RhdGVWZXJzaW9uIiwgIl9fcmVnaXN0ZXJJbm5lciIsICJfX2FsbG9jYXRlQnVmZmVyVmlldyIsICJfX21hdGVyaWFsVWlkQ291bnQiLCAiX19pbml0aWFsaXplTWF0ZXJpYWwiLCAiX19tYWtlU2hhZGVySW52YWxpZGF0ZUZvck1hdGVyaWFsVHlwZSIsICJfX21hdGVyaWFsVHlwZU5hbWUiLCAiX19tYXRlcmlhbFRpZENvdW50Il0KfQo=
