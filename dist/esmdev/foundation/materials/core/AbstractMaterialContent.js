// src/foundation/materials/core/AbstractMaterialContent.ts
import ShaderityModule from "../../../_deps/shaderity.js";
import { RnObject } from "../../core/RnObject.js";
import { CompositionType } from "../../definitions/CompositionType.js";
import { ProcessApproach } from "../../definitions/ProcessApproach.js";
import { ShaderType } from "../../definitions/ShaderType.js";
import { MutableMatrix44 } from "../../math/MutableMatrix44.js";
import { MutableVector2 } from "../../math/MutableVector2.js";
import { MutableVector4 } from "../../math/MutableVector4.js";
import { Vector3 } from "../../math/Vector3.js";
import { Logger } from "../../misc/Logger.js";
import { ShaderityUtilityWebGL as ShaderityUtilityWebGL_ } from "./ShaderityUtilityWebGL.js";
import { ShaderityUtilityWebGPU as ShaderityUtilityWebGPU_ } from "./ShaderityUtilityWebGPU.js";
var ShaderityUtilityWebGL = typeof __RN_WEBGL__ === "undefined" || __RN_WEBGL__ ? ShaderityUtilityWebGL_ : void 0;
var ShaderityUtilityWebGPU = typeof __RN_WEBGPU__ === "undefined" || __RN_WEBGPU__ ? ShaderityUtilityWebGPU_ : void 0;
var Shaderity = ShaderityModule.default || ShaderityModule;
var _AbstractMaterialContent = class _AbstractMaterialContent extends RnObject {
  /**
   * Constructs a new AbstractMaterialContent instance.
   * @param materialName - The unique name identifier for this material
   * @param options - Configuration options for the material
   * @param options.isMorphing - Whether this material supports morph target animation
   * @param options.isSkinning - Whether this material supports skeletal animation
   * @param options.isLighting - Whether this material supports lighting calculations
   * @param vertexShaderityObject - Optional vertex shader object
   * @param pixelShaderityObject - Optional pixel shader object
   * @param engine - Optional engine instance for proper shader caching
   */
  constructor(materialName, { isMorphing = false, isSkinning = false, isLighting = false } = {}, vertexShaderityObject, pixelShaderityObject, engine) {
    super();
    this.__semantics = [];
    this.__definitions = "";
    this.shaderType = ShaderType.VertexAndPixelShader;
    this.__materialSemanticsVariantName = "";
    this.__materialVariationIdentifier = "";
    this.__materialName = materialName;
    if (engine) {
      this._engine = engine;
    }
    this.__isMorphing = isMorphing;
    this.__isSkinning = isSkinning;
    this.__isLighting = isLighting;
    this.__materialContentUid = _AbstractMaterialContent.__materialContentCount++;
    this.setVertexShaderityObject(vertexShaderityObject, engine);
    this.setPixelShaderityObject(pixelShaderityObject, engine);
  }
  /**
   * Whether draws of this material can be batched into one multi-draw call.
   * Material contents that set per-primitive uniforms in the per-primitive hook
   * must override this to false.
   */
  get isMultiDrawCompatible() {
    return true;
  }
  /**
   * Gets the vertex shaderity object map for a specific engine.
   * Creates the map if it doesn't exist.
   */
  static __getVertexShaderityObjectMap(engineUid) {
    let map = _AbstractMaterialContent.__vertexShaderityObjectMapPerEngine.get(engineUid);
    if (!map) {
      map = /* @__PURE__ */ new Map();
      _AbstractMaterialContent.__vertexShaderityObjectMapPerEngine.set(engineUid, map);
    }
    return map;
  }
  /**
   * Gets the pixel shaderity object map for a specific engine.
   * Creates the map if it doesn't exist.
   */
  static __getPixelShaderityObjectMap(engineUid) {
    let map = _AbstractMaterialContent.__pixelShaderityObjectMapPerEngine.get(engineUid);
    if (!map) {
      map = /* @__PURE__ */ new Map();
      _AbstractMaterialContent.__pixelShaderityObjectMapPerEngine.set(engineUid, map);
    }
    return map;
  }
  /**
   * Gets the reflected shader semantics info map for a specific engine.
   * Creates the map if it doesn't exist.
   */
  static __getReflectedShaderSemanticsInfoArrayMap(engineUid) {
    let map = _AbstractMaterialContent.__reflectedShaderSemanticsInfoArrayMapPerEngine.get(engineUid);
    if (!map) {
      map = /* @__PURE__ */ new Map();
      _AbstractMaterialContent.__reflectedShaderSemanticsInfoArrayMapPerEngine.set(engineUid, map);
    }
    return map;
  }
  /**
   * Sets the vertex shader object for this material.
   * @param vertexShaderityObject - The vertex shader object to set
   * @param engine - Optional engine instance (uses this._engine if not provided)
   */
  setVertexShaderityObject(vertexShaderityObject, engine) {
    if (vertexShaderityObject) {
      const engineToUse = engine != null ? engine : this._engine;
      if (engineToUse) {
        const map = _AbstractMaterialContent.__getVertexShaderityObjectMap(engineToUse.objectUID);
        map.set(this.__materialName, vertexShaderityObject);
      }
    }
  }
  /**
   * Sets the pixel shader object for this material.
   * @param pixelShaderityObject - The pixel shader object to set
   * @param engine - Optional engine instance (uses this._engine if not provided)
   */
  setPixelShaderityObject(pixelShaderityObject, engine) {
    if (pixelShaderityObject) {
      const engineToUse = engine != null ? engine : this._engine;
      if (engineToUse) {
        const map = _AbstractMaterialContent.__getPixelShaderityObjectMap(engineToUse.objectUID);
        map.set(this.__materialName, pixelShaderityObject);
      }
    }
  }
  /**
   * Generates a unique variant name for this material based on its shader semantics.
   * This name is used to differentiate materials with different semantic configurations.
   */
  makeMaterialSemanticsVariantName() {
    let semantics = "";
    for (const semantic of this.__semantics) {
      semantics += `${semantic.semantic}_`;
    }
    this.__materialVariationIdentifier = `semanticsVariation_${semantics}`;
    this.__materialSemanticsVariantName = `${this.__materialName}_${this.__materialVariationIdentifier}`;
  }
  /**
   * Gets the material semantics variant name for this material.
   * This is the full identifier combining material name and variation identifier.
   * @returns The unique variant name string
   */
  getMaterialSemanticsVariantName() {
    return this.__materialSemanticsVariantName;
  }
  /**
   * Gets the material variation identifier (without the base material name).
   * This represents only the parameter variation part of the material type.
   * @returns The variation identifier string
   */
  getMaterialVariationIdentifier() {
    return this.__materialVariationIdentifier;
  }
  /**
   * Gets the base material name (e.g., "PbrUber", "ClassicUber").
   * Double trailing underscores are removed for cleaner display.
   * @returns The base material name string
   */
  getBaseMaterialName() {
    return this.__materialName.replace(/__$/, "");
  }
  /**
   * Gets the vertex shader object associated with this material.
   * @returns The vertex shader object or undefined if not set
   */
  get vertexShaderityObject() {
    if (this._engine) {
      const map = _AbstractMaterialContent.__getVertexShaderityObjectMap(this._engine.objectUID);
      return map.get(this.__materialName);
    }
    return void 0;
  }
  /**
   * Gets the pixel shader object associated with this material.
   * @returns The pixel shader object or undefined if not set
   */
  get pixelShaderityObject() {
    if (this._engine) {
      const map = _AbstractMaterialContent.__getPixelShaderityObjectMap(this._engine.objectUID);
      return map.get(this.__materialName);
    }
    return void 0;
  }
  /**
   * Gets the shader definitions string for this material.
   * @returns The definitions string
   */
  getDefinitions() {
    return this.__definitions;
  }
  /**
   * Retrieves a material node by its unique identifier.
   * @param materialNodeUid - The unique identifier of the material node
   * @returns The material node instance
   */
  static getMaterialNode(materialNodeUid) {
    return _AbstractMaterialContent.materialNodes[materialNodeUid];
  }
  /**
   * Gets the shader semantics information array for this material.
   * @returns Array of shader semantics information
   */
  get _semanticsInfoArray() {
    return this.__semantics;
  }
  /**
   * Checks if this material supports skeletal animation.
   * @returns True if skinning is enabled
   */
  get isSkinning() {
    return this.__isSkinning;
  }
  /**
   * Checks if this material supports morph target animation.
   * @returns True if morphing is enabled
   */
  get isMorphing() {
    return this.__isMorphing;
  }
  /**
   * Checks if this material supports lighting calculations.
   * @returns True if lighting is enabled
   */
  get isLighting() {
    return this.__isLighting;
  }
  /**
   * Sets the shader semantics information array for this material.
   * @param shaderSemanticsInfoArray - Array of shader semantics information to set
   */
  setShaderSemanticsInfoArray(shaderSemanticsInfoArray) {
    const infoArray = [];
    for (const info of shaderSemanticsInfoArray) {
      infoArray.push(info);
    }
    const existingTextureSlotIndices = /* @__PURE__ */ new Set();
    existingTextureSlotIndices.add(0);
    infoArray.forEach((info) => {
      if (CompositionType.isTexture(info.compositionType)) {
        const textureSlotIndex = info.initialValue[0];
        if (textureSlotIndex > 0) {
          existingTextureSlotIndices.add(textureSlotIndex);
        }
      }
    });
    infoArray.forEach((info) => {
      if (CompositionType.isTexture(info.compositionType)) {
        const textureSlotIndex = info.initialValue[0];
        if (textureSlotIndex < 0) {
          let newTextureSlotIndex = -1;
          for (let i = 1; i < 32; i++) {
            if (!existingTextureSlotIndices.has(i)) {
              newTextureSlotIndex = i;
              break;
            }
          }
          if (newTextureSlotIndex === -1) {
            Logger.default.warn(
              `All texture slots (1-31) are occupied. Cannot assign a valid slot for semantic "${info.semantic}". This may cause rendering issues.`
            );
          }
          info.initialValue[0] = newTextureSlotIndex;
          existingTextureSlotIndices.add(newTextureSlotIndex);
        }
      }
    });
    this.__semantics = infoArray;
    this.makeMaterialSemanticsVariantName();
  }
  /**
   * Sets up basic rendering information including matrices, camera, and lighting.
   * @param args - WebGL rendering arguments
   * @param shaderProgram - The WebGL shader program
   * @param firstTime - Whether this is the first time setup
   * @param material - The material instance
   * @param CameraComponentClass - The camera component class
   */
  setupBasicInfo(_engine, args, shaderProgram, _firstTime, _material, _CameraComponentClass) {
    const blendShapeComponent = args.entity.tryToGetBlendShape();
    this.setMorphInfo(shaderProgram, args.entity.getMesh(), args.primitive, blendShapeComponent);
  }
  /**
   * Sets the world transformation matrix uniform in the shader.
   * @param shaderProgram - The WebGL shader program
   * @param worldMatrix - The world transformation matrix
   */
  setWorldMatrix(shaderProgram, worldMatrix) {
    shaderProgram._gl.uniformMatrix4fv(shaderProgram.worldMatrix, false, worldMatrix._v);
  }
  /**
   * Sets the normal transformation matrix uniform in the shader.
   * @param shaderProgram - The WebGL shader program
   * @param normalMatrix - The normal transformation matrix
   */
  setNormalMatrix(shaderProgram, normalMatrix) {
    shaderProgram._gl.uniformMatrix3fv(shaderProgram.normalMatrix, false, normalMatrix._v);
  }
  /**
   * Sets the billboard flag uniform in the shader.
   * @param shaderProgram - The WebGL shader program
   * @param isBillboard - Whether the object should be rendered as a billboard
   */
  setIsBillboard(shaderProgram, isBillboard) {
    shaderProgram._gl.uniform1i(shaderProgram.isBillboard, isBillboard ? 1 : 0);
  }
  /**
   * Sets the visibility flag uniform in the shader.
   * @param shaderProgram - The WebGL shader program
   * @param isVisible - Whether the object should be rendered
   */
  setIsVisible(shaderProgram, isVisible) {
    shaderProgram._gl.uniform1i(shaderProgram.isVisible, isVisible ? 1 : 0);
  }
  /**
   * Sets view-related uniforms including view matrix and camera position.
   * @param shaderProgram - The WebGL shader program
   * @param cameraComponent - The camera component
   * @param isVr - Whether rendering in VR mode
   * @param displayIdx - The display index for VR rendering
   */
  setViewInfo(shaderProgram, cameraComponent, isVr, displayIdx) {
    let viewMatrix;
    let cameraPosition;
    if (isVr) {
      const webxrSystem = cameraComponent.entity.engine._webXRSystemIfEnabled;
      if (webxrSystem == null ? void 0 : webxrSystem.isWebXRMode) {
        viewMatrix = webxrSystem._getViewMatrixAt(displayIdx);
        cameraPosition = webxrSystem._getCameraWorldPositionAt(displayIdx);
      }
    } else if (cameraComponent) {
      cameraPosition = cameraComponent.worldPosition;
      viewMatrix = cameraComponent.viewMatrix;
    } else {
      viewMatrix = MutableMatrix44.identity();
      cameraPosition = Vector3.fromCopyArray([0, 0, 10]);
    }
    shaderProgram._gl.uniformMatrix4fv(shaderProgram.viewMatrix, false, viewMatrix._v);
    shaderProgram._gl.uniform3fv(shaderProgram.viewPosition, cameraPosition._v);
  }
  /**
   * Sets the projection matrix uniform in the shader.
   * @param shaderProgram - The WebGL shader program
   * @param cameraComponent - The camera component
   * @param isVr - Whether rendering in VR mode
   * @param displayIdx - The display index for VR rendering
   */
  setProjection(shaderProgram, cameraComponent, isVr, displayIdx) {
    let projectionMatrix;
    if (isVr) {
      const webxrSystem = cameraComponent.entity.engine._webXRSystemIfEnabled;
      if (webxrSystem == null ? void 0 : webxrSystem.isWebXRMode) {
        projectionMatrix = webxrSystem._getProjectMatrixAt(displayIdx);
      }
    } else if (cameraComponent) {
      projectionMatrix = cameraComponent.projectionMatrix;
    } else {
      projectionMatrix = MutableMatrix44.identity();
    }
    shaderProgram._gl.uniformMatrix4fv(shaderProgram.projectionMatrix, false, projectionMatrix._v);
  }
  /**
   * Sets morph target animation uniforms in the shader.
   * @param shaderProgram - The WebGL shader program
   * @param meshComponent - The mesh component
   * @param primitive - The primitive containing morph targets
   * @param blendShapeComponent - The blend shape component containing weights
   */
  setMorphInfo(shaderProgram, _meshComponent, primitive, _blendShapeComponent) {
    if (!this.__isMorphing) {
      return;
    }
    if (primitive.targets.length === 0) {
      return;
    }
    const primitiveIdx = primitive.constructor.getPrimitiveIdxHasMorph(primitive.primitiveUid);
    shaderProgram._gl.uniform1i(shaderProgram.currentPrimitiveIdx, primitiveIdx);
  }
  /**
   * Sets internal setting parameters to GPU for WebGL per shader program.
   * This method should be overridden by derived classes to provide specific parameter handling.
   * @param params - Object containing material, shader program, firstTime flag, and rendering arguments
   */
  _setInternalSettingParametersToGpuWebGLPerShaderProgram(_params) {
  }
  /**
   * Sets internal setting parameters to GPU for WebGL per material.
   * This method should be overridden by derived classes to provide specific parameter handling.
   * @param params - Object containing material, shader program, firstTime flag, and rendering arguments
   */
  _setInternalSettingParametersToGpuWebGLPerMaterial(_params) {
  }
  /**
   * Sets internal setting parameters to GPU for WebGL per primitive.
   * This method should be overridden by derived classes to provide specific parameter handling.
   * @param params - Object containing material, shader program, firstTime flag, and rendering arguments
   */
  _setInternalSettingParametersToGpuWebGLPerPrimitive(_params) {
  }
  /**
   * Sets internal setting parameters to GPU for WebGPU.
   * This method should be overridden by derived classes to provide specific parameter handling.
   * @param params - Object containing material and WebGPU rendering arguments
   */
  _setInternalSettingParametersToGpuWebGpu(_params) {
  }
  /**
   * Gets the shader definition string for this material.
   * This method should be overridden by derived classes to provide specific definitions.
   * @returns Empty string by default
   */
  getDefinition() {
    return "";
  }
  /**
   * Performs shader reflection to extract semantics information from vertex and pixel shaders.
   * @param vertexShader - The vertex shader object for WebGL
   * @param pixelShader - The pixel shader object for WebGL
   * @param vertexShaderWebGpu - The vertex shader object for WebGPU
   * @param pixelShaderWebGpu - The pixel shader object for WebGPU
   * @param definitions - Array of shader definitions
   * @returns Array of shader semantics information
   */
  doShaderReflection(engine, vertexShader, pixelShader, vertexShaderWebGpu, pixelShaderWebGpu, definitions) {
    this._engine = engine;
    const definitionsStr = definitions.join("");
    const reflectedMap = _AbstractMaterialContent.__getReflectedShaderSemanticsInfoArrayMap(engine.objectUID);
    const reflectedShaderSemanticsInfoArray = reflectedMap.get(this.__materialName + definitionsStr);
    if (reflectedShaderSemanticsInfoArray != null) {
      return reflectedShaderSemanticsInfoArray.concat();
    }
    let preprocessedVertexShaderData;
    let preprocessedPixelShaderData;
    if (engine.processApproach === ProcessApproach.WebGPU) {
      const preprocessedVertexShader = Shaderity.processPragma(vertexShaderWebGpu, false, definitions);
      const preprocessedPixelShader = Shaderity.processPragma(pixelShaderWebGpu, false, definitions);
      preprocessedVertexShaderData = ShaderityUtilityWebGPU.getShaderDataReflection(engine, preprocessedVertexShader);
      preprocessedPixelShaderData = ShaderityUtilityWebGPU.getShaderDataReflection(engine, preprocessedPixelShader);
      const vertexShaderData = ShaderityUtilityWebGPU.getShaderDataReflection(engine, vertexShaderWebGpu);
      const pixelShaderData = ShaderityUtilityWebGPU.getShaderDataReflection(engine, pixelShaderWebGpu);
      this.setVertexShaderityObject(vertexShaderData.shaderityObject, engine);
      this.setPixelShaderityObject(pixelShaderData.shaderityObject, engine);
    } else {
      const preprocessedVertexShader = Shaderity.processPragma(vertexShader, true, definitions);
      const preprocessedPixelShader = Shaderity.processPragma(pixelShader, true, definitions);
      preprocessedVertexShaderData = ShaderityUtilityWebGL.getShaderDataReflection(engine, preprocessedVertexShader);
      preprocessedPixelShaderData = ShaderityUtilityWebGL.getShaderDataReflection(engine, preprocessedPixelShader);
      const vertexShaderData = ShaderityUtilityWebGL.getShaderDataReflection(engine, vertexShader);
      const pixelShaderData = ShaderityUtilityWebGL.getShaderDataReflection(engine, pixelShader);
      this.setVertexShaderityObject(vertexShaderData.shaderityObject, engine);
      this.setPixelShaderityObject(pixelShaderData.shaderityObject, engine);
    }
    const shaderSemanticsInfoArray = [];
    for (const vertexShaderSemanticsInfo of preprocessedVertexShaderData.shaderSemanticsInfoArray) {
      vertexShaderSemanticsInfo.stage = ShaderType.VertexShader;
      shaderSemanticsInfoArray.push(vertexShaderSemanticsInfo);
    }
    for (const pixelShaderSemanticsInfo of preprocessedPixelShaderData.shaderSemanticsInfoArray) {
      const foundShaderSemanticsInfo = shaderSemanticsInfoArray.find((vertexInfo) => {
        if (vertexInfo.semantic === pixelShaderSemanticsInfo.semantic) {
          return true;
        }
        return false;
      });
      if (foundShaderSemanticsInfo) {
        foundShaderSemanticsInfo.stage = ShaderType.VertexAndPixelShader;
      } else {
        pixelShaderSemanticsInfo.stage = ShaderType.PixelShader;
        shaderSemanticsInfoArray.push(pixelShaderSemanticsInfo);
      }
    }
    reflectedMap.set(this.__materialName + definitionsStr, shaderSemanticsInfoArray);
    return shaderSemanticsInfoArray.concat();
  }
  /**
   * Cleans up static caches for a specific Engine instance.
   * This should be called when the Engine is destroyed to prevent stale references.
   *
   * @param engine - The Engine instance being destroyed
   * @internal Called from Engine.destroy()
   */
  static _cleanupForEngine(engine) {
    _AbstractMaterialContent.__vertexShaderityObjectMapPerEngine.delete(engine.objectUID);
    _AbstractMaterialContent.__pixelShaderityObjectMapPerEngine.delete(engine.objectUID);
    _AbstractMaterialContent.__reflectedShaderSemanticsInfoArrayMapPerEngine.delete(engine.objectUID);
  }
};
_AbstractMaterialContent.materialNodes = [];
_AbstractMaterialContent.__tmp_vector4 = MutableVector4.zero();
_AbstractMaterialContent.__tmp_vector2 = MutableVector2.zero();
_AbstractMaterialContent.__materialContentCount = 0;
/** Shader caches managed per-Engine. Key is Engine.objectUID */
_AbstractMaterialContent.__vertexShaderityObjectMapPerEngine = /* @__PURE__ */ new Map();
_AbstractMaterialContent.__pixelShaderityObjectMapPerEngine = /* @__PURE__ */ new Map();
_AbstractMaterialContent.__reflectedShaderSemanticsInfoArrayMapPerEngine = /* @__PURE__ */ new Map();
var AbstractMaterialContent = _AbstractMaterialContent;
export {
  AbstractMaterialContent
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0ZXJpYWxzL2NvcmUvQWJzdHJhY3RNYXRlcmlhbENvbnRlbnQudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCBTaGFkZXJpdHlNb2R1bGUsIHsgdHlwZSBTaGFkZXJpdHlPYmplY3QgfSBmcm9tICdzaGFkZXJpdHknO1xuaW1wb3J0IHR5cGUgeyBSZW5kZXJpbmdBcmdXZWJHTCB9IGZyb20gJy4uLy4uLy4uL3dlYmdsL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB0eXBlIHsgQmxlbmRTaGFwZUNvbXBvbmVudCB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvQmxlbmRTaGFwZS9CbGVuZFNoYXBlQ29tcG9uZW50JztcbmltcG9ydCB0eXBlIHsgQ2FtZXJhQ29tcG9uZW50IH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9DYW1lcmEvQ2FtZXJhQ29tcG9uZW50JztcbmltcG9ydCB0eXBlIHsgTWVzaENvbXBvbmVudCB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvTWVzaC9NZXNoQ29tcG9uZW50JztcbmltcG9ydCB7IFJuT2JqZWN0IH0gZnJvbSAnLi4vLi4vY29yZS9Sbk9iamVjdCc7XG5pbXBvcnQgeyBDb21wb3NpdGlvblR5cGUgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9Db21wb3NpdGlvblR5cGUnO1xuaW1wb3J0IHsgUHJvY2Vzc0FwcHJvYWNoIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvUHJvY2Vzc0FwcHJvYWNoJztcbmltcG9ydCB0eXBlIHsgU2hhZGVyU2VtYW50aWNzSW5mbyB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1NoYWRlclNlbWFudGljc0luZm8nO1xuaW1wb3J0IHsgU2hhZGVyVHlwZSwgdHlwZSBTaGFkZXJUeXBlRW51bSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1NoYWRlclR5cGUnO1xuaW1wb3J0IHR5cGUgeyBQcmltaXRpdmUgfSBmcm9tICcuLi8uLi9nZW9tZXRyeS9QcmltaXRpdmUnO1xuaW1wb3J0IHR5cGUgeyBJTWF0cml4MzMgfSBmcm9tICcuLi8uLi9tYXRoL0lNYXRyaXgnO1xuaW1wb3J0IHR5cGUgeyBJVmVjdG9yMyB9IGZyb20gJy4uLy4uL21hdGgvSVZlY3Rvcic7XG5pbXBvcnQgdHlwZSB7IE1hdHJpeDQ0IH0gZnJvbSAnLi4vLi4vbWF0aC9NYXRyaXg0NCc7XG5pbXBvcnQgeyBNdXRhYmxlTWF0cml4NDQgfSBmcm9tICcuLi8uLi9tYXRoL011dGFibGVNYXRyaXg0NCc7XG5pbXBvcnQgeyBNdXRhYmxlVmVjdG9yMiB9IGZyb20gJy4uLy4uL21hdGgvTXV0YWJsZVZlY3RvcjInO1xuaW1wb3J0IHsgTXV0YWJsZVZlY3RvcjQgfSBmcm9tICcuLi8uLi9tYXRoL011dGFibGVWZWN0b3I0JztcbmltcG9ydCB7IFZlY3RvcjMgfSBmcm9tICcuLi8uLi9tYXRoL1ZlY3RvcjMnO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vLi4vbWlzYy9Mb2dnZXInO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi8uLi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB0eXBlIHsgTWF0ZXJpYWwgfSBmcm9tICcuL01hdGVyaWFsJztcbmltcG9ydCB7IFNoYWRlcml0eVV0aWxpdHlXZWJHTCBhcyBTaGFkZXJpdHlVdGlsaXR5V2ViR0xfIH0gZnJvbSAnLi9TaGFkZXJpdHlVdGlsaXR5V2ViR0wnO1xuaW1wb3J0IHsgU2hhZGVyaXR5VXRpbGl0eVdlYkdQVSBhcyBTaGFkZXJpdHlVdGlsaXR5V2ViR1BVXyB9IGZyb20gJy4vU2hhZGVyaXR5VXRpbGl0eVdlYkdQVSc7XG5cbi8vIEEgYmFja2VuZCBleGNsdWRlZCBhdCBidWlsZCB0aW1lIChzZWUgc3JjL2JhY2tlbmRGbGFncy5kLnRzKSBpcyBkcm9wcGVkIGJ5IHRoZSBidW5kbGVyLlxuY29uc3QgU2hhZGVyaXR5VXRpbGl0eVdlYkdMID0gKFxuICB0eXBlb2YgX19STl9XRUJHTF9fID09PSAndW5kZWZpbmVkJyB8fCBfX1JOX1dFQkdMX18gPyBTaGFkZXJpdHlVdGlsaXR5V2ViR0xfIDogdW5kZWZpbmVkXG4pIGFzIHR5cGVvZiBTaGFkZXJpdHlVdGlsaXR5V2ViR0xfO1xuY29uc3QgU2hhZGVyaXR5VXRpbGl0eVdlYkdQVSA9IChcbiAgdHlwZW9mIF9fUk5fV0VCR1BVX18gPT09ICd1bmRlZmluZWQnIHx8IF9fUk5fV0VCR1BVX18gPyBTaGFkZXJpdHlVdGlsaXR5V2ViR1BVXyA6IHVuZGVmaW5lZFxuKSBhcyB0eXBlb2YgU2hhZGVyaXR5VXRpbGl0eVdlYkdQVV87XG5cbmNvbnN0IFNoYWRlcml0eSA9IChTaGFkZXJpdHlNb2R1bGUgYXMgYW55KS5kZWZhdWx0IHx8IFNoYWRlcml0eU1vZHVsZTtcblxudHlwZSBNYXRlcmlhbE5vZGVVSUQgPSBudW1iZXI7XG5cbi8qKlxuICogQWJzdHJhY3QgYmFzZSBjbGFzcyBmb3IgbWF0ZXJpYWwgY29udGVudCB0aGF0IHByb3ZpZGVzIGNvbW1vbiBmdW5jdGlvbmFsaXR5IGZvciBtYXRlcmlhbCByZW5kZXJpbmcuXG4gKiBUaGlzIGNsYXNzIGhhbmRsZXMgc2hhZGVyIHNlbWFudGljcywgcmVuZGVyaW5nIHNldHVwLCBhbmQgR1BVIHBhcmFtZXRlciBtYW5hZ2VtZW50IGZvciBtYXRlcmlhbHMuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBBYnN0cmFjdE1hdGVyaWFsQ29udGVudCBleHRlbmRzIFJuT2JqZWN0IHtcbiAgLyoqXG4gICAqIFdoZXRoZXIgZHJhd3Mgb2YgdGhpcyBtYXRlcmlhbCBjYW4gYmUgYmF0Y2hlZCBpbnRvIG9uZSBtdWx0aS1kcmF3IGNhbGwuXG4gICAqIE1hdGVyaWFsIGNvbnRlbnRzIHRoYXQgc2V0IHBlci1wcmltaXRpdmUgdW5pZm9ybXMgaW4gdGhlIHBlci1wcmltaXRpdmUgaG9va1xuICAgKiBtdXN0IG92ZXJyaWRlIHRoaXMgdG8gZmFsc2UuXG4gICAqL1xuICBnZXQgaXNNdWx0aURyYXdDb21wYXRpYmxlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcHJvdGVjdGVkIF9fc2VtYW50aWNzOiBTaGFkZXJTZW1hbnRpY3NJbmZvW10gPSBbXTtcbiAgc3RhdGljIG1hdGVyaWFsTm9kZXM6IEFic3RyYWN0TWF0ZXJpYWxDb250ZW50W10gPSBbXTtcbiAgcHJvdGVjdGVkIF9fbWF0ZXJpYWxOYW1lOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBlbmdpbmUgaW5zdGFuY2UgdGhpcyBtYXRlcmlhbCBjb250ZW50IGlzIGFzc29jaWF0ZWQgd2l0aCAqL1xuICBwcm90ZWN0ZWQgX2VuZ2luZT86IEVuZ2luZTtcblxuICBwcm90ZWN0ZWQgX19kZWZpbml0aW9ucyA9ICcnO1xuICBwcm90ZWN0ZWQgc3RhdGljIF9fdG1wX3ZlY3RvcjQgPSBNdXRhYmxlVmVjdG9yNC56ZXJvKCk7XG4gIHByb3RlY3RlZCBzdGF0aWMgX190bXBfdmVjdG9yMiA9IE11dGFibGVWZWN0b3IyLnplcm8oKTtcbiAgcHJpdmF0ZSBfX2lzTW9ycGhpbmc6IGJvb2xlYW47XG4gIHByaXZhdGUgX19pc1NraW5uaW5nOiBib29sZWFuO1xuICBwcml2YXRlIF9faXNMaWdodGluZzogYm9vbGVhbjtcblxuICBwcml2YXRlIHN0YXRpYyBfX21hdGVyaWFsQ29udGVudENvdW50ID0gMDtcbiAgcHJpdmF0ZSBfX21hdGVyaWFsQ29udGVudFVpZDogbnVtYmVyO1xuXG4gIC8qKiBTaGFkZXIgY2FjaGVzIG1hbmFnZWQgcGVyLUVuZ2luZS4gS2V5IGlzIEVuZ2luZS5vYmplY3RVSUQgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX192ZXJ0ZXhTaGFkZXJpdHlPYmplY3RNYXBQZXJFbmdpbmU6IE1hcDxudW1iZXIsIE1hcDxzdHJpbmcsIFNoYWRlcml0eU9iamVjdD4+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIHN0YXRpYyBfX3BpeGVsU2hhZGVyaXR5T2JqZWN0TWFwUGVyRW5naW5lOiBNYXA8bnVtYmVyLCBNYXA8c3RyaW5nLCBTaGFkZXJpdHlPYmplY3Q+PiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX19yZWZsZWN0ZWRTaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXlNYXBQZXJFbmdpbmU6IE1hcDxudW1iZXIsIE1hcDxzdHJpbmcsIFNoYWRlclNlbWFudGljc0luZm9bXT4+ID1cbiAgICBuZXcgTWFwKCk7XG5cbiAgcHVibGljIHNoYWRlclR5cGU6IFNoYWRlclR5cGVFbnVtID0gU2hhZGVyVHlwZS5WZXJ0ZXhBbmRQaXhlbFNoYWRlcjtcblxuICBwcml2YXRlIF9fbWF0ZXJpYWxTZW1hbnRpY3NWYXJpYW50TmFtZSA9ICcnO1xuICBwcml2YXRlIF9fbWF0ZXJpYWxWYXJpYXRpb25JZGVudGlmaWVyID0gJyc7XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHZlcnRleCBzaGFkZXJpdHkgb2JqZWN0IG1hcCBmb3IgYSBzcGVjaWZpYyBlbmdpbmUuXG4gICAqIENyZWF0ZXMgdGhlIG1hcCBpZiBpdCBkb2Vzbid0IGV4aXN0LlxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZXRWZXJ0ZXhTaGFkZXJpdHlPYmplY3RNYXAoZW5naW5lVWlkOiBudW1iZXIpOiBNYXA8c3RyaW5nLCBTaGFkZXJpdHlPYmplY3Q+IHtcbiAgICBsZXQgbWFwID0gQWJzdHJhY3RNYXRlcmlhbENvbnRlbnQuX192ZXJ0ZXhTaGFkZXJpdHlPYmplY3RNYXBQZXJFbmdpbmUuZ2V0KGVuZ2luZVVpZCk7XG4gICAgaWYgKCFtYXApIHtcbiAgICAgIG1hcCA9IG5ldyBNYXAoKTtcbiAgICAgIEFic3RyYWN0TWF0ZXJpYWxDb250ZW50Ll9fdmVydGV4U2hhZGVyaXR5T2JqZWN0TWFwUGVyRW5naW5lLnNldChlbmdpbmVVaWQsIG1hcCk7XG4gICAgfVxuICAgIHJldHVybiBtYXA7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgcGl4ZWwgc2hhZGVyaXR5IG9iamVjdCBtYXAgZm9yIGEgc3BlY2lmaWMgZW5naW5lLlxuICAgKiBDcmVhdGVzIHRoZSBtYXAgaWYgaXQgZG9lc24ndCBleGlzdC5cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fZ2V0UGl4ZWxTaGFkZXJpdHlPYmplY3RNYXAoZW5naW5lVWlkOiBudW1iZXIpOiBNYXA8c3RyaW5nLCBTaGFkZXJpdHlPYmplY3Q+IHtcbiAgICBsZXQgbWFwID0gQWJzdHJhY3RNYXRlcmlhbENvbnRlbnQuX19waXhlbFNoYWRlcml0eU9iamVjdE1hcFBlckVuZ2luZS5nZXQoZW5naW5lVWlkKTtcbiAgICBpZiAoIW1hcCkge1xuICAgICAgbWFwID0gbmV3IE1hcCgpO1xuICAgICAgQWJzdHJhY3RNYXRlcmlhbENvbnRlbnQuX19waXhlbFNoYWRlcml0eU9iamVjdE1hcFBlckVuZ2luZS5zZXQoZW5naW5lVWlkLCBtYXApO1xuICAgIH1cbiAgICByZXR1cm4gbWFwO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHJlZmxlY3RlZCBzaGFkZXIgc2VtYW50aWNzIGluZm8gbWFwIGZvciBhIHNwZWNpZmljIGVuZ2luZS5cbiAgICogQ3JlYXRlcyB0aGUgbWFwIGlmIGl0IGRvZXNuJ3QgZXhpc3QuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2dldFJlZmxlY3RlZFNoYWRlclNlbWFudGljc0luZm9BcnJheU1hcChlbmdpbmVVaWQ6IG51bWJlcik6IE1hcDxzdHJpbmcsIFNoYWRlclNlbWFudGljc0luZm9bXT4ge1xuICAgIGxldCBtYXAgPSBBYnN0cmFjdE1hdGVyaWFsQ29udGVudC5fX3JlZmxlY3RlZFNoYWRlclNlbWFudGljc0luZm9BcnJheU1hcFBlckVuZ2luZS5nZXQoZW5naW5lVWlkKTtcbiAgICBpZiAoIW1hcCkge1xuICAgICAgbWFwID0gbmV3IE1hcCgpO1xuICAgICAgQWJzdHJhY3RNYXRlcmlhbENvbnRlbnQuX19yZWZsZWN0ZWRTaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXlNYXBQZXJFbmdpbmUuc2V0KGVuZ2luZVVpZCwgbWFwKTtcbiAgICB9XG4gICAgcmV0dXJuIG1hcDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RzIGEgbmV3IEFic3RyYWN0TWF0ZXJpYWxDb250ZW50IGluc3RhbmNlLlxuICAgKiBAcGFyYW0gbWF0ZXJpYWxOYW1lIC0gVGhlIHVuaXF1ZSBuYW1lIGlkZW50aWZpZXIgZm9yIHRoaXMgbWF0ZXJpYWxcbiAgICogQHBhcmFtIG9wdGlvbnMgLSBDb25maWd1cmF0aW9uIG9wdGlvbnMgZm9yIHRoZSBtYXRlcmlhbFxuICAgKiBAcGFyYW0gb3B0aW9ucy5pc01vcnBoaW5nIC0gV2hldGhlciB0aGlzIG1hdGVyaWFsIHN1cHBvcnRzIG1vcnBoIHRhcmdldCBhbmltYXRpb25cbiAgICogQHBhcmFtIG9wdGlvbnMuaXNTa2lubmluZyAtIFdoZXRoZXIgdGhpcyBtYXRlcmlhbCBzdXBwb3J0cyBza2VsZXRhbCBhbmltYXRpb25cbiAgICogQHBhcmFtIG9wdGlvbnMuaXNMaWdodGluZyAtIFdoZXRoZXIgdGhpcyBtYXRlcmlhbCBzdXBwb3J0cyBsaWdodGluZyBjYWxjdWxhdGlvbnNcbiAgICogQHBhcmFtIHZlcnRleFNoYWRlcml0eU9iamVjdCAtIE9wdGlvbmFsIHZlcnRleCBzaGFkZXIgb2JqZWN0XG4gICAqIEBwYXJhbSBwaXhlbFNoYWRlcml0eU9iamVjdCAtIE9wdGlvbmFsIHBpeGVsIHNoYWRlciBvYmplY3RcbiAgICogQHBhcmFtIGVuZ2luZSAtIE9wdGlvbmFsIGVuZ2luZSBpbnN0YW5jZSBmb3IgcHJvcGVyIHNoYWRlciBjYWNoaW5nXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBtYXRlcmlhbE5hbWU6IHN0cmluZyxcbiAgICB7IGlzTW9ycGhpbmcgPSBmYWxzZSwgaXNTa2lubmluZyA9IGZhbHNlLCBpc0xpZ2h0aW5nID0gZmFsc2UgfSA9IHt9LFxuICAgIHZlcnRleFNoYWRlcml0eU9iamVjdD86IFNoYWRlcml0eU9iamVjdCxcbiAgICBwaXhlbFNoYWRlcml0eU9iamVjdD86IFNoYWRlcml0eU9iamVjdCxcbiAgICBlbmdpbmU/OiBFbmdpbmVcbiAgKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLl9fbWF0ZXJpYWxOYW1lID0gbWF0ZXJpYWxOYW1lO1xuXG4gICAgLy8gU2V0IGVuZ2luZSBpZiBwcm92aWRlZCAoaW1wb3J0YW50IGZvciBwcm9wZXIgc2hhZGVyIGNhY2hpbmcpXG4gICAgaWYgKGVuZ2luZSkge1xuICAgICAgdGhpcy5fZW5naW5lID0gZW5naW5lO1xuICAgIH1cblxuICAgIHRoaXMuX19pc01vcnBoaW5nID0gaXNNb3JwaGluZztcbiAgICB0aGlzLl9faXNTa2lubmluZyA9IGlzU2tpbm5pbmc7XG4gICAgdGhpcy5fX2lzTGlnaHRpbmcgPSBpc0xpZ2h0aW5nO1xuXG4gICAgdGhpcy5fX21hdGVyaWFsQ29udGVudFVpZCA9IEFic3RyYWN0TWF0ZXJpYWxDb250ZW50Ll9fbWF0ZXJpYWxDb250ZW50Q291bnQrKztcblxuICAgIHRoaXMuc2V0VmVydGV4U2hhZGVyaXR5T2JqZWN0KHZlcnRleFNoYWRlcml0eU9iamVjdCwgZW5naW5lKTtcbiAgICB0aGlzLnNldFBpeGVsU2hhZGVyaXR5T2JqZWN0KHBpeGVsU2hhZGVyaXR5T2JqZWN0LCBlbmdpbmUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHZlcnRleCBzaGFkZXIgb2JqZWN0IGZvciB0aGlzIG1hdGVyaWFsLlxuICAgKiBAcGFyYW0gdmVydGV4U2hhZGVyaXR5T2JqZWN0IC0gVGhlIHZlcnRleCBzaGFkZXIgb2JqZWN0IHRvIHNldFxuICAgKiBAcGFyYW0gZW5naW5lIC0gT3B0aW9uYWwgZW5naW5lIGluc3RhbmNlICh1c2VzIHRoaXMuX2VuZ2luZSBpZiBub3QgcHJvdmlkZWQpXG4gICAqL1xuICBwcm90ZWN0ZWQgc2V0VmVydGV4U2hhZGVyaXR5T2JqZWN0KHZlcnRleFNoYWRlcml0eU9iamVjdD86IFNoYWRlcml0eU9iamVjdCwgZW5naW5lPzogRW5naW5lKSB7XG4gICAgaWYgKHZlcnRleFNoYWRlcml0eU9iamVjdCkge1xuICAgICAgY29uc3QgZW5naW5lVG9Vc2UgPSBlbmdpbmUgPz8gdGhpcy5fZW5naW5lO1xuICAgICAgaWYgKGVuZ2luZVRvVXNlKSB7XG4gICAgICAgIGNvbnN0IG1hcCA9IEFic3RyYWN0TWF0ZXJpYWxDb250ZW50Ll9fZ2V0VmVydGV4U2hhZGVyaXR5T2JqZWN0TWFwKGVuZ2luZVRvVXNlLm9iamVjdFVJRCk7XG4gICAgICAgIG1hcC5zZXQodGhpcy5fX21hdGVyaWFsTmFtZSwgdmVydGV4U2hhZGVyaXR5T2JqZWN0KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgcGl4ZWwgc2hhZGVyIG9iamVjdCBmb3IgdGhpcyBtYXRlcmlhbC5cbiAgICogQHBhcmFtIHBpeGVsU2hhZGVyaXR5T2JqZWN0IC0gVGhlIHBpeGVsIHNoYWRlciBvYmplY3QgdG8gc2V0XG4gICAqIEBwYXJhbSBlbmdpbmUgLSBPcHRpb25hbCBlbmdpbmUgaW5zdGFuY2UgKHVzZXMgdGhpcy5fZW5naW5lIGlmIG5vdCBwcm92aWRlZClcbiAgICovXG4gIHByb3RlY3RlZCBzZXRQaXhlbFNoYWRlcml0eU9iamVjdChwaXhlbFNoYWRlcml0eU9iamVjdD86IFNoYWRlcml0eU9iamVjdCwgZW5naW5lPzogRW5naW5lKSB7XG4gICAgaWYgKHBpeGVsU2hhZGVyaXR5T2JqZWN0KSB7XG4gICAgICBjb25zdCBlbmdpbmVUb1VzZSA9IGVuZ2luZSA/PyB0aGlzLl9lbmdpbmU7XG4gICAgICBpZiAoZW5naW5lVG9Vc2UpIHtcbiAgICAgICAgY29uc3QgbWFwID0gQWJzdHJhY3RNYXRlcmlhbENvbnRlbnQuX19nZXRQaXhlbFNoYWRlcml0eU9iamVjdE1hcChlbmdpbmVUb1VzZS5vYmplY3RVSUQpO1xuICAgICAgICBtYXAuc2V0KHRoaXMuX19tYXRlcmlhbE5hbWUsIHBpeGVsU2hhZGVyaXR5T2JqZWN0KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIGEgdW5pcXVlIHZhcmlhbnQgbmFtZSBmb3IgdGhpcyBtYXRlcmlhbCBiYXNlZCBvbiBpdHMgc2hhZGVyIHNlbWFudGljcy5cbiAgICogVGhpcyBuYW1lIGlzIHVzZWQgdG8gZGlmZmVyZW50aWF0ZSBtYXRlcmlhbHMgd2l0aCBkaWZmZXJlbnQgc2VtYW50aWMgY29uZmlndXJhdGlvbnMuXG4gICAqL1xuICBtYWtlTWF0ZXJpYWxTZW1hbnRpY3NWYXJpYW50TmFtZSgpIHtcbiAgICBsZXQgc2VtYW50aWNzID0gJyc7XG4gICAgZm9yIChjb25zdCBzZW1hbnRpYyBvZiB0aGlzLl9fc2VtYW50aWNzKSB7XG4gICAgICBzZW1hbnRpY3MgKz0gYCR7c2VtYW50aWMuc2VtYW50aWN9X2A7IC8vJHtzZW1hbnRpYy5zdGFnZS5pbmRleH0gJHtzZW1hbnRpYy5jb21wb25lbnRUeXBlLmluZGV4fSAke3NlbWFudGljLmNvbXBvc2l0aW9uVHlwZS5pbmRleH0gJHtzZW1hbnRpYy5zb2xvRGF0dW19ICR7c2VtYW50aWMuaXNJbnRlcm5hbFNldHRpbmd9ICR7c2VtYW50aWMuYXJyYXlMZW5ndGh9ICR7c2VtYW50aWMubmVlZFVuaWZvcm1JbkRhdGFUZXh0dXJlTW9kZX1cXG5gO1xuICAgIH1cblxuICAgIC8vIFN0b3JlIHRoZSB2YXJpYXRpb24gaWRlbnRpZmllciBzZXBhcmF0ZWx5IChqdXN0IHRoZSBzZW1hbnRpY3MgdmFyaWF0aW9uIHBhcnQpXG4gICAgdGhpcy5fX21hdGVyaWFsVmFyaWF0aW9uSWRlbnRpZmllciA9IGBzZW1hbnRpY3NWYXJpYXRpb25fJHtzZW1hbnRpY3N9YDtcbiAgICAvLyBLZWVwIHRoZSBmdWxsIHZhcmlhbnQgbmFtZSBmb3IgYmFja3dhcmQgY29tcGF0aWJpbGl0eVxuICAgIHRoaXMuX19tYXRlcmlhbFNlbWFudGljc1ZhcmlhbnROYW1lID0gYCR7dGhpcy5fX21hdGVyaWFsTmFtZX1fJHt0aGlzLl9fbWF0ZXJpYWxWYXJpYXRpb25JZGVudGlmaWVyfWA7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWF0ZXJpYWwgc2VtYW50aWNzIHZhcmlhbnQgbmFtZSBmb3IgdGhpcyBtYXRlcmlhbC5cbiAgICogVGhpcyBpcyB0aGUgZnVsbCBpZGVudGlmaWVyIGNvbWJpbmluZyBtYXRlcmlhbCBuYW1lIGFuZCB2YXJpYXRpb24gaWRlbnRpZmllci5cbiAgICogQHJldHVybnMgVGhlIHVuaXF1ZSB2YXJpYW50IG5hbWUgc3RyaW5nXG4gICAqL1xuICBnZXRNYXRlcmlhbFNlbWFudGljc1ZhcmlhbnROYW1lKCkge1xuICAgIHJldHVybiB0aGlzLl9fbWF0ZXJpYWxTZW1hbnRpY3NWYXJpYW50TmFtZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtYXRlcmlhbCB2YXJpYXRpb24gaWRlbnRpZmllciAod2l0aG91dCB0aGUgYmFzZSBtYXRlcmlhbCBuYW1lKS5cbiAgICogVGhpcyByZXByZXNlbnRzIG9ubHkgdGhlIHBhcmFtZXRlciB2YXJpYXRpb24gcGFydCBvZiB0aGUgbWF0ZXJpYWwgdHlwZS5cbiAgICogQHJldHVybnMgVGhlIHZhcmlhdGlvbiBpZGVudGlmaWVyIHN0cmluZ1xuICAgKi9cbiAgZ2V0TWF0ZXJpYWxWYXJpYXRpb25JZGVudGlmaWVyKCkge1xuICAgIHJldHVybiB0aGlzLl9fbWF0ZXJpYWxWYXJpYXRpb25JZGVudGlmaWVyO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGJhc2UgbWF0ZXJpYWwgbmFtZSAoZS5nLiwgXCJQYnJVYmVyXCIsIFwiQ2xhc3NpY1ViZXJcIikuXG4gICAqIERvdWJsZSB0cmFpbGluZyB1bmRlcnNjb3JlcyBhcmUgcmVtb3ZlZCBmb3IgY2xlYW5lciBkaXNwbGF5LlxuICAgKiBAcmV0dXJucyBUaGUgYmFzZSBtYXRlcmlhbCBuYW1lIHN0cmluZ1xuICAgKi9cbiAgZ2V0QmFzZU1hdGVyaWFsTmFtZSgpIHtcbiAgICAvLyBSZW1vdmUgZG91YmxlIHRyYWlsaW5nIHVuZGVyc2NvcmVzIG9ubHkgKGUuZy4sIFwiUGJyVWJlcl9fXCIgLT4gXCJQYnJVYmVyXCIpXG4gICAgLy8gQnV0IGtlZXAgc2luZ2xlIHRyYWlsaW5nIHVuZGVyc2NvcmUgKGUuZy4sIFwiUGJyVWJlcl9Tb21lTmFtZV9cIiBzdGF5cyBhcyBpcylcbiAgICByZXR1cm4gdGhpcy5fX21hdGVyaWFsTmFtZS5yZXBsYWNlKC9fXyQvLCAnJyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdmVydGV4IHNoYWRlciBvYmplY3QgYXNzb2NpYXRlZCB3aXRoIHRoaXMgbWF0ZXJpYWwuXG4gICAqIEByZXR1cm5zIFRoZSB2ZXJ0ZXggc2hhZGVyIG9iamVjdCBvciB1bmRlZmluZWQgaWYgbm90IHNldFxuICAgKi9cbiAgZ2V0IHZlcnRleFNoYWRlcml0eU9iamVjdCgpOiBTaGFkZXJpdHlPYmplY3QgfCB1bmRlZmluZWQge1xuICAgIGlmICh0aGlzLl9lbmdpbmUpIHtcbiAgICAgIGNvbnN0IG1hcCA9IEFic3RyYWN0TWF0ZXJpYWxDb250ZW50Ll9fZ2V0VmVydGV4U2hhZGVyaXR5T2JqZWN0TWFwKHRoaXMuX2VuZ2luZS5vYmplY3RVSUQpO1xuICAgICAgcmV0dXJuIG1hcC5nZXQodGhpcy5fX21hdGVyaWFsTmFtZSk7XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgcGl4ZWwgc2hhZGVyIG9iamVjdCBhc3NvY2lhdGVkIHdpdGggdGhpcyBtYXRlcmlhbC5cbiAgICogQHJldHVybnMgVGhlIHBpeGVsIHNoYWRlciBvYmplY3Qgb3IgdW5kZWZpbmVkIGlmIG5vdCBzZXRcbiAgICovXG4gIGdldCBwaXhlbFNoYWRlcml0eU9iamVjdCgpOiBTaGFkZXJpdHlPYmplY3QgfCB1bmRlZmluZWQge1xuICAgIGlmICh0aGlzLl9lbmdpbmUpIHtcbiAgICAgIGNvbnN0IG1hcCA9IEFic3RyYWN0TWF0ZXJpYWxDb250ZW50Ll9fZ2V0UGl4ZWxTaGFkZXJpdHlPYmplY3RNYXAodGhpcy5fZW5naW5lLm9iamVjdFVJRCk7XG4gICAgICByZXR1cm4gbWFwLmdldCh0aGlzLl9fbWF0ZXJpYWxOYW1lKTtcbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBzaGFkZXIgZGVmaW5pdGlvbnMgc3RyaW5nIGZvciB0aGlzIG1hdGVyaWFsLlxuICAgKiBAcmV0dXJucyBUaGUgZGVmaW5pdGlvbnMgc3RyaW5nXG4gICAqL1xuICBnZXREZWZpbml0aW9ucygpIHtcbiAgICByZXR1cm4gdGhpcy5fX2RlZmluaXRpb25zO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhIG1hdGVyaWFsIG5vZGUgYnkgaXRzIHVuaXF1ZSBpZGVudGlmaWVyLlxuICAgKiBAcGFyYW0gbWF0ZXJpYWxOb2RlVWlkIC0gVGhlIHVuaXF1ZSBpZGVudGlmaWVyIG9mIHRoZSBtYXRlcmlhbCBub2RlXG4gICAqIEByZXR1cm5zIFRoZSBtYXRlcmlhbCBub2RlIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgZ2V0TWF0ZXJpYWxOb2RlKG1hdGVyaWFsTm9kZVVpZDogTWF0ZXJpYWxOb2RlVUlEKSB7XG4gICAgcmV0dXJuIEFic3RyYWN0TWF0ZXJpYWxDb250ZW50Lm1hdGVyaWFsTm9kZXNbbWF0ZXJpYWxOb2RlVWlkXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBzaGFkZXIgc2VtYW50aWNzIGluZm9ybWF0aW9uIGFycmF5IGZvciB0aGlzIG1hdGVyaWFsLlxuICAgKiBAcmV0dXJucyBBcnJheSBvZiBzaGFkZXIgc2VtYW50aWNzIGluZm9ybWF0aW9uXG4gICAqL1xuICBnZXQgX3NlbWFudGljc0luZm9BcnJheSgpIHtcbiAgICByZXR1cm4gdGhpcy5fX3NlbWFudGljcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhpcyBtYXRlcmlhbCBzdXBwb3J0cyBza2VsZXRhbCBhbmltYXRpb24uXG4gICAqIEByZXR1cm5zIFRydWUgaWYgc2tpbm5pbmcgaXMgZW5hYmxlZFxuICAgKi9cbiAgZ2V0IGlzU2tpbm5pbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19pc1NraW5uaW5nO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGlzIG1hdGVyaWFsIHN1cHBvcnRzIG1vcnBoIHRhcmdldCBhbmltYXRpb24uXG4gICAqIEByZXR1cm5zIFRydWUgaWYgbW9ycGhpbmcgaXMgZW5hYmxlZFxuICAgKi9cbiAgZ2V0IGlzTW9ycGhpbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19pc01vcnBoaW5nO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGlzIG1hdGVyaWFsIHN1cHBvcnRzIGxpZ2h0aW5nIGNhbGN1bGF0aW9ucy5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiBsaWdodGluZyBpcyBlbmFibGVkXG4gICAqL1xuICBnZXQgaXNMaWdodGluZygpIHtcbiAgICByZXR1cm4gdGhpcy5fX2lzTGlnaHRpbmc7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgc2hhZGVyIHNlbWFudGljcyBpbmZvcm1hdGlvbiBhcnJheSBmb3IgdGhpcyBtYXRlcmlhbC5cbiAgICogQHBhcmFtIHNoYWRlclNlbWFudGljc0luZm9BcnJheSAtIEFycmF5IG9mIHNoYWRlciBzZW1hbnRpY3MgaW5mb3JtYXRpb24gdG8gc2V0XG4gICAqL1xuICBzZXRTaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXkoc2hhZGVyU2VtYW50aWNzSW5mb0FycmF5OiBTaGFkZXJTZW1hbnRpY3NJbmZvW10pIHtcbiAgICBjb25zdCBpbmZvQXJyYXk6IFNoYWRlclNlbWFudGljc0luZm9bXSA9IFtdO1xuICAgIGZvciAoY29uc3QgaW5mbyBvZiBzaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXkpIHtcbiAgICAgIGluZm9BcnJheS5wdXNoKGluZm8pO1xuICAgIH1cblxuICAgIC8vIENvbnN0cnVjdCBhIHNldCBvZiBleGlzdGluZyB0ZXh0dXJlIHNsb3QgaW5kaWNlc1xuICAgIGNvbnN0IGV4aXN0aW5nVGV4dHVyZVNsb3RJbmRpY2VzID0gbmV3IFNldDxudW1iZXI+KCk7XG4gICAgZXhpc3RpbmdUZXh0dXJlU2xvdEluZGljZXMuYWRkKDApOyAvLyBEYXRhIHRleHR1cmUgc2xvdCBpbmRleCBpcyAwXG4gICAgaW5mb0FycmF5LmZvckVhY2goaW5mbyA9PiB7XG4gICAgICBpZiAoQ29tcG9zaXRpb25UeXBlLmlzVGV4dHVyZShpbmZvLmNvbXBvc2l0aW9uVHlwZSkpIHtcbiAgICAgICAgY29uc3QgdGV4dHVyZVNsb3RJbmRleCA9IGluZm8uaW5pdGlhbFZhbHVlWzBdO1xuICAgICAgICBpZiAodGV4dHVyZVNsb3RJbmRleCA+IDApIHtcbiAgICAgICAgICBleGlzdGluZ1RleHR1cmVTbG90SW5kaWNlcy5hZGQodGV4dHVyZVNsb3RJbmRleCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIEFzc2lnbiBuZXcgdGV4dHVyZSBzbG90IGluZGljZXMgdG8gdGV4dHVyZXMgdGhhdCBoYXZlIG5lZ2F0aXZlIHNsb3QgaW5kaWNlc1xuICAgIGluZm9BcnJheS5mb3JFYWNoKGluZm8gPT4ge1xuICAgICAgaWYgKENvbXBvc2l0aW9uVHlwZS5pc1RleHR1cmUoaW5mby5jb21wb3NpdGlvblR5cGUpKSB7XG4gICAgICAgIGNvbnN0IHRleHR1cmVTbG90SW5kZXggPSBpbmZvLmluaXRpYWxWYWx1ZVswXTtcbiAgICAgICAgaWYgKHRleHR1cmVTbG90SW5kZXggPCAwKSB7XG4gICAgICAgICAgbGV0IG5ld1RleHR1cmVTbG90SW5kZXggPSAtMTtcbiAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IDMyOyBpKyspIHtcbiAgICAgICAgICAgIGlmICghZXhpc3RpbmdUZXh0dXJlU2xvdEluZGljZXMuaGFzKGkpKSB7XG4gICAgICAgICAgICAgIG5ld1RleHR1cmVTbG90SW5kZXggPSBpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG5ld1RleHR1cmVTbG90SW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICBMb2dnZXIuZGVmYXVsdC53YXJuKFxuICAgICAgICAgICAgICBgQWxsIHRleHR1cmUgc2xvdHMgKDEtMzEpIGFyZSBvY2N1cGllZC4gQ2Fubm90IGFzc2lnbiBhIHZhbGlkIHNsb3QgZm9yIHNlbWFudGljIFwiJHtpbmZvLnNlbWFudGljfVwiLiBUaGlzIG1heSBjYXVzZSByZW5kZXJpbmcgaXNzdWVzLmBcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGluZm8uaW5pdGlhbFZhbHVlWzBdID0gbmV3VGV4dHVyZVNsb3RJbmRleDtcbiAgICAgICAgICBleGlzdGluZ1RleHR1cmVTbG90SW5kaWNlcy5hZGQobmV3VGV4dHVyZVNsb3RJbmRleCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuX19zZW1hbnRpY3MgPSBpbmZvQXJyYXk7XG4gICAgdGhpcy5tYWtlTWF0ZXJpYWxTZW1hbnRpY3NWYXJpYW50TmFtZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgYmFzaWMgcmVuZGVyaW5nIGluZm9ybWF0aW9uIGluY2x1ZGluZyBtYXRyaWNlcywgY2FtZXJhLCBhbmQgbGlnaHRpbmcuXG4gICAqIEBwYXJhbSBhcmdzIC0gV2ViR0wgcmVuZGVyaW5nIGFyZ3VtZW50c1xuICAgKiBAcGFyYW0gc2hhZGVyUHJvZ3JhbSAtIFRoZSBXZWJHTCBzaGFkZXIgcHJvZ3JhbVxuICAgKiBAcGFyYW0gZmlyc3RUaW1lIC0gV2hldGhlciB0aGlzIGlzIHRoZSBmaXJzdCB0aW1lIHNldHVwXG4gICAqIEBwYXJhbSBtYXRlcmlhbCAtIFRoZSBtYXRlcmlhbCBpbnN0YW5jZVxuICAgKiBAcGFyYW0gQ2FtZXJhQ29tcG9uZW50Q2xhc3MgLSBUaGUgY2FtZXJhIGNvbXBvbmVudCBjbGFzc1xuICAgKi9cbiAgcHJvdGVjdGVkIHNldHVwQmFzaWNJbmZvKFxuICAgIF9lbmdpbmU6IEVuZ2luZSxcbiAgICBhcmdzOiBSZW5kZXJpbmdBcmdXZWJHTCxcbiAgICBzaGFkZXJQcm9ncmFtOiBXZWJHTFByb2dyYW0sXG4gICAgX2ZpcnN0VGltZTogYm9vbGVhbixcbiAgICBfbWF0ZXJpYWw6IE1hdGVyaWFsLFxuICAgIF9DYW1lcmFDb21wb25lbnRDbGFzczogdHlwZW9mIENhbWVyYUNvbXBvbmVudFxuICApIHtcbiAgICAvLyBNb3JwaFxuICAgIGNvbnN0IGJsZW5kU2hhcGVDb21wb25lbnQgPSBhcmdzLmVudGl0eS50cnlUb0dldEJsZW5kU2hhcGUoKTtcbiAgICB0aGlzLnNldE1vcnBoSW5mbyhzaGFkZXJQcm9ncmFtLCBhcmdzLmVudGl0eS5nZXRNZXNoKCksIGFyZ3MucHJpbWl0aXZlLCBibGVuZFNoYXBlQ29tcG9uZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB3b3JsZCB0cmFuc2Zvcm1hdGlvbiBtYXRyaXggdW5pZm9ybSBpbiB0aGUgc2hhZGVyLlxuICAgKiBAcGFyYW0gc2hhZGVyUHJvZ3JhbSAtIFRoZSBXZWJHTCBzaGFkZXIgcHJvZ3JhbVxuICAgKiBAcGFyYW0gd29ybGRNYXRyaXggLSBUaGUgd29ybGQgdHJhbnNmb3JtYXRpb24gbWF0cml4XG4gICAqL1xuICBwcm90ZWN0ZWQgc2V0V29ybGRNYXRyaXgoc2hhZGVyUHJvZ3JhbTogV2ViR0xQcm9ncmFtLCB3b3JsZE1hdHJpeDogTWF0cml4NDQpIHtcbiAgICAoc2hhZGVyUHJvZ3JhbSBhcyBhbnkpLl9nbC51bmlmb3JtTWF0cml4NGZ2KChzaGFkZXJQcm9ncmFtIGFzIGFueSkud29ybGRNYXRyaXgsIGZhbHNlLCB3b3JsZE1hdHJpeC5fdik7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgbm9ybWFsIHRyYW5zZm9ybWF0aW9uIG1hdHJpeCB1bmlmb3JtIGluIHRoZSBzaGFkZXIuXG4gICAqIEBwYXJhbSBzaGFkZXJQcm9ncmFtIC0gVGhlIFdlYkdMIHNoYWRlciBwcm9ncmFtXG4gICAqIEBwYXJhbSBub3JtYWxNYXRyaXggLSBUaGUgbm9ybWFsIHRyYW5zZm9ybWF0aW9uIG1hdHJpeFxuICAgKi9cbiAgcHJvdGVjdGVkIHNldE5vcm1hbE1hdHJpeChzaGFkZXJQcm9ncmFtOiBXZWJHTFByb2dyYW0sIG5vcm1hbE1hdHJpeDogSU1hdHJpeDMzKSB7XG4gICAgKHNoYWRlclByb2dyYW0gYXMgYW55KS5fZ2wudW5pZm9ybU1hdHJpeDNmdigoc2hhZGVyUHJvZ3JhbSBhcyBhbnkpLm5vcm1hbE1hdHJpeCwgZmFsc2UsIG5vcm1hbE1hdHJpeC5fdik7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgYmlsbGJvYXJkIGZsYWcgdW5pZm9ybSBpbiB0aGUgc2hhZGVyLlxuICAgKiBAcGFyYW0gc2hhZGVyUHJvZ3JhbSAtIFRoZSBXZWJHTCBzaGFkZXIgcHJvZ3JhbVxuICAgKiBAcGFyYW0gaXNCaWxsYm9hcmQgLSBXaGV0aGVyIHRoZSBvYmplY3Qgc2hvdWxkIGJlIHJlbmRlcmVkIGFzIGEgYmlsbGJvYXJkXG4gICAqL1xuICBwcm90ZWN0ZWQgc2V0SXNCaWxsYm9hcmQoc2hhZGVyUHJvZ3JhbTogV2ViR0xQcm9ncmFtLCBpc0JpbGxib2FyZDogYm9vbGVhbikge1xuICAgIChzaGFkZXJQcm9ncmFtIGFzIGFueSkuX2dsLnVuaWZvcm0xaSgoc2hhZGVyUHJvZ3JhbSBhcyBhbnkpLmlzQmlsbGJvYXJkLCBpc0JpbGxib2FyZCA/IDEgOiAwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB2aXNpYmlsaXR5IGZsYWcgdW5pZm9ybSBpbiB0aGUgc2hhZGVyLlxuICAgKiBAcGFyYW0gc2hhZGVyUHJvZ3JhbSAtIFRoZSBXZWJHTCBzaGFkZXIgcHJvZ3JhbVxuICAgKiBAcGFyYW0gaXNWaXNpYmxlIC0gV2hldGhlciB0aGUgb2JqZWN0IHNob3VsZCBiZSByZW5kZXJlZFxuICAgKi9cbiAgcHJvdGVjdGVkIHNldElzVmlzaWJsZShzaGFkZXJQcm9ncmFtOiBXZWJHTFByb2dyYW0sIGlzVmlzaWJsZTogYm9vbGVhbikge1xuICAgIChzaGFkZXJQcm9ncmFtIGFzIGFueSkuX2dsLnVuaWZvcm0xaSgoc2hhZGVyUHJvZ3JhbSBhcyBhbnkpLmlzVmlzaWJsZSwgaXNWaXNpYmxlID8gMSA6IDApO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdmlldy1yZWxhdGVkIHVuaWZvcm1zIGluY2x1ZGluZyB2aWV3IG1hdHJpeCBhbmQgY2FtZXJhIHBvc2l0aW9uLlxuICAgKiBAcGFyYW0gc2hhZGVyUHJvZ3JhbSAtIFRoZSBXZWJHTCBzaGFkZXIgcHJvZ3JhbVxuICAgKiBAcGFyYW0gY2FtZXJhQ29tcG9uZW50IC0gVGhlIGNhbWVyYSBjb21wb25lbnRcbiAgICogQHBhcmFtIGlzVnIgLSBXaGV0aGVyIHJlbmRlcmluZyBpbiBWUiBtb2RlXG4gICAqIEBwYXJhbSBkaXNwbGF5SWR4IC0gVGhlIGRpc3BsYXkgaW5kZXggZm9yIFZSIHJlbmRlcmluZ1xuICAgKi9cbiAgcHVibGljIHNldFZpZXdJbmZvKHNoYWRlclByb2dyYW06IFdlYkdMUHJvZ3JhbSwgY2FtZXJhQ29tcG9uZW50OiBDYW1lcmFDb21wb25lbnQsIGlzVnI6IGJvb2xlYW4sIGRpc3BsYXlJZHg6IG51bWJlcikge1xuICAgIGxldCB2aWV3TWF0cml4OiBNYXRyaXg0NDtcbiAgICBsZXQgY2FtZXJhUG9zaXRpb246IElWZWN0b3IzO1xuICAgIGlmIChpc1ZyKSB7XG4gICAgICBjb25zdCB3ZWJ4clN5c3RlbSA9IGNhbWVyYUNvbXBvbmVudC5lbnRpdHkuZW5naW5lLl93ZWJYUlN5c3RlbUlmRW5hYmxlZDtcbiAgICAgIGlmICh3ZWJ4clN5c3RlbT8uaXNXZWJYUk1vZGUpIHtcbiAgICAgICAgdmlld01hdHJpeCA9IHdlYnhyU3lzdGVtLl9nZXRWaWV3TWF0cml4QXQoZGlzcGxheUlkeCk7XG4gICAgICAgIGNhbWVyYVBvc2l0aW9uID0gd2VieHJTeXN0ZW0uX2dldENhbWVyYVdvcmxkUG9zaXRpb25BdChkaXNwbGF5SWR4KTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGNhbWVyYUNvbXBvbmVudCkge1xuICAgICAgY2FtZXJhUG9zaXRpb24gPSBjYW1lcmFDb21wb25lbnQud29ybGRQb3NpdGlvbjtcbiAgICAgIHZpZXdNYXRyaXggPSBjYW1lcmFDb21wb25lbnQudmlld01hdHJpeDtcbiAgICB9IGVsc2Uge1xuICAgICAgdmlld01hdHJpeCA9IE11dGFibGVNYXRyaXg0NC5pZGVudGl0eSgpO1xuICAgICAgY2FtZXJhUG9zaXRpb24gPSBWZWN0b3IzLmZyb21Db3B5QXJyYXkoWzAsIDAsIDEwXSk7XG4gICAgfVxuXG4gICAgKHNoYWRlclByb2dyYW0gYXMgYW55KS5fZ2wudW5pZm9ybU1hdHJpeDRmdigoc2hhZGVyUHJvZ3JhbSBhcyBhbnkpLnZpZXdNYXRyaXgsIGZhbHNlLCB2aWV3TWF0cml4IS5fdik7XG4gICAgKHNoYWRlclByb2dyYW0gYXMgYW55KS5fZ2wudW5pZm9ybTNmdigoc2hhZGVyUHJvZ3JhbSBhcyBhbnkpLnZpZXdQb3NpdGlvbiwgY2FtZXJhUG9zaXRpb24hLl92KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBwcm9qZWN0aW9uIG1hdHJpeCB1bmlmb3JtIGluIHRoZSBzaGFkZXIuXG4gICAqIEBwYXJhbSBzaGFkZXJQcm9ncmFtIC0gVGhlIFdlYkdMIHNoYWRlciBwcm9ncmFtXG4gICAqIEBwYXJhbSBjYW1lcmFDb21wb25lbnQgLSBUaGUgY2FtZXJhIGNvbXBvbmVudFxuICAgKiBAcGFyYW0gaXNWciAtIFdoZXRoZXIgcmVuZGVyaW5nIGluIFZSIG1vZGVcbiAgICogQHBhcmFtIGRpc3BsYXlJZHggLSBUaGUgZGlzcGxheSBpbmRleCBmb3IgVlIgcmVuZGVyaW5nXG4gICAqL1xuICBwdWJsaWMgc2V0UHJvamVjdGlvbihcbiAgICBzaGFkZXJQcm9ncmFtOiBXZWJHTFByb2dyYW0sXG4gICAgY2FtZXJhQ29tcG9uZW50OiBDYW1lcmFDb21wb25lbnQsXG4gICAgaXNWcjogYm9vbGVhbixcbiAgICBkaXNwbGF5SWR4OiBudW1iZXJcbiAgKSB7XG4gICAgbGV0IHByb2plY3Rpb25NYXRyaXg6IE1hdHJpeDQ0O1xuICAgIGlmIChpc1ZyKSB7XG4gICAgICBjb25zdCB3ZWJ4clN5c3RlbSA9IGNhbWVyYUNvbXBvbmVudC5lbnRpdHkuZW5naW5lLl93ZWJYUlN5c3RlbUlmRW5hYmxlZDtcbiAgICAgIGlmICh3ZWJ4clN5c3RlbT8uaXNXZWJYUk1vZGUpIHtcbiAgICAgICAgcHJvamVjdGlvbk1hdHJpeCA9IHdlYnhyU3lzdGVtLl9nZXRQcm9qZWN0TWF0cml4QXQoZGlzcGxheUlkeCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChjYW1lcmFDb21wb25lbnQpIHtcbiAgICAgIHByb2plY3Rpb25NYXRyaXggPSBjYW1lcmFDb21wb25lbnQucHJvamVjdGlvbk1hdHJpeDtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJvamVjdGlvbk1hdHJpeCA9IE11dGFibGVNYXRyaXg0NC5pZGVudGl0eSgpO1xuICAgIH1cbiAgICAoc2hhZGVyUHJvZ3JhbSBhcyBhbnkpLl9nbC51bmlmb3JtTWF0cml4NGZ2KChzaGFkZXJQcm9ncmFtIGFzIGFueSkucHJvamVjdGlvbk1hdHJpeCwgZmFsc2UsIHByb2plY3Rpb25NYXRyaXghLl92KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIG1vcnBoIHRhcmdldCBhbmltYXRpb24gdW5pZm9ybXMgaW4gdGhlIHNoYWRlci5cbiAgICogQHBhcmFtIHNoYWRlclByb2dyYW0gLSBUaGUgV2ViR0wgc2hhZGVyIHByb2dyYW1cbiAgICogQHBhcmFtIG1lc2hDb21wb25lbnQgLSBUaGUgbWVzaCBjb21wb25lbnRcbiAgICogQHBhcmFtIHByaW1pdGl2ZSAtIFRoZSBwcmltaXRpdmUgY29udGFpbmluZyBtb3JwaCB0YXJnZXRzXG4gICAqIEBwYXJhbSBibGVuZFNoYXBlQ29tcG9uZW50IC0gVGhlIGJsZW5kIHNoYXBlIGNvbXBvbmVudCBjb250YWluaW5nIHdlaWdodHNcbiAgICovXG4gIHNldE1vcnBoSW5mbyhcbiAgICBzaGFkZXJQcm9ncmFtOiBXZWJHTFByb2dyYW0sXG4gICAgX21lc2hDb21wb25lbnQ6IE1lc2hDb21wb25lbnQsXG4gICAgcHJpbWl0aXZlOiBQcmltaXRpdmUsXG4gICAgX2JsZW5kU2hhcGVDb21wb25lbnQ/OiBCbGVuZFNoYXBlQ29tcG9uZW50XG4gICkge1xuICAgIGlmICghdGhpcy5fX2lzTW9ycGhpbmcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHByaW1pdGl2ZS50YXJnZXRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHByaW1pdGl2ZUlkeCA9IChwcmltaXRpdmUuY29uc3RydWN0b3IgYXMgdHlwZW9mIFByaW1pdGl2ZSkuZ2V0UHJpbWl0aXZlSWR4SGFzTW9ycGgocHJpbWl0aXZlLnByaW1pdGl2ZVVpZCkhO1xuICAgIChzaGFkZXJQcm9ncmFtIGFzIGFueSkuX2dsLnVuaWZvcm0xaSgoc2hhZGVyUHJvZ3JhbSBhcyBhbnkpLmN1cnJlbnRQcmltaXRpdmVJZHgsIHByaW1pdGl2ZUlkeCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBpbnRlcm5hbCBzZXR0aW5nIHBhcmFtZXRlcnMgdG8gR1BVIGZvciBXZWJHTCBwZXIgc2hhZGVyIHByb2dyYW0uXG4gICAqIFRoaXMgbWV0aG9kIHNob3VsZCBiZSBvdmVycmlkZGVuIGJ5IGRlcml2ZWQgY2xhc3NlcyB0byBwcm92aWRlIHNwZWNpZmljIHBhcmFtZXRlciBoYW5kbGluZy5cbiAgICogQHBhcmFtIHBhcmFtcyAtIE9iamVjdCBjb250YWluaW5nIG1hdGVyaWFsLCBzaGFkZXIgcHJvZ3JhbSwgZmlyc3RUaW1lIGZsYWcsIGFuZCByZW5kZXJpbmcgYXJndW1lbnRzXG4gICAqL1xuICBfc2V0SW50ZXJuYWxTZXR0aW5nUGFyYW1ldGVyc1RvR3B1V2ViR0xQZXJTaGFkZXJQcm9ncmFtKF9wYXJhbXM6IHt9KSB7fVxuXG4gIC8qKlxuICAgKiBTZXRzIGludGVybmFsIHNldHRpbmcgcGFyYW1ldGVycyB0byBHUFUgZm9yIFdlYkdMIHBlciBtYXRlcmlhbC5cbiAgICogVGhpcyBtZXRob2Qgc2hvdWxkIGJlIG92ZXJyaWRkZW4gYnkgZGVyaXZlZCBjbGFzc2VzIHRvIHByb3ZpZGUgc3BlY2lmaWMgcGFyYW1ldGVyIGhhbmRsaW5nLlxuICAgKiBAcGFyYW0gcGFyYW1zIC0gT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwsIHNoYWRlciBwcm9ncmFtLCBmaXJzdFRpbWUgZmxhZywgYW5kIHJlbmRlcmluZyBhcmd1bWVudHNcbiAgICovXG4gIF9zZXRJbnRlcm5hbFNldHRpbmdQYXJhbWV0ZXJzVG9HcHVXZWJHTFBlck1hdGVyaWFsKF9wYXJhbXM6IHt9KSB7fVxuXG4gIC8qKlxuICAgKiBTZXRzIGludGVybmFsIHNldHRpbmcgcGFyYW1ldGVycyB0byBHUFUgZm9yIFdlYkdMIHBlciBwcmltaXRpdmUuXG4gICAqIFRoaXMgbWV0aG9kIHNob3VsZCBiZSBvdmVycmlkZGVuIGJ5IGRlcml2ZWQgY2xhc3NlcyB0byBwcm92aWRlIHNwZWNpZmljIHBhcmFtZXRlciBoYW5kbGluZy5cbiAgICogQHBhcmFtIHBhcmFtcyAtIE9iamVjdCBjb250YWluaW5nIG1hdGVyaWFsLCBzaGFkZXIgcHJvZ3JhbSwgZmlyc3RUaW1lIGZsYWcsIGFuZCByZW5kZXJpbmcgYXJndW1lbnRzXG4gICAqL1xuICBfc2V0SW50ZXJuYWxTZXR0aW5nUGFyYW1ldGVyc1RvR3B1V2ViR0xQZXJQcmltaXRpdmUoX3BhcmFtczoge30pIHt9XG5cbiAgLyoqXG4gICAqIFNldHMgaW50ZXJuYWwgc2V0dGluZyBwYXJhbWV0ZXJzIHRvIEdQVSBmb3IgV2ViR1BVLlxuICAgKiBUaGlzIG1ldGhvZCBzaG91bGQgYmUgb3ZlcnJpZGRlbiBieSBkZXJpdmVkIGNsYXNzZXMgdG8gcHJvdmlkZSBzcGVjaWZpYyBwYXJhbWV0ZXIgaGFuZGxpbmcuXG4gICAqIEBwYXJhbSBwYXJhbXMgLSBPYmplY3QgY29udGFpbmluZyBtYXRlcmlhbCBhbmQgV2ViR1BVIHJlbmRlcmluZyBhcmd1bWVudHNcbiAgICovXG4gIF9zZXRJbnRlcm5hbFNldHRpbmdQYXJhbWV0ZXJzVG9HcHVXZWJHcHUoX3BhcmFtczoge30pIHt9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHNoYWRlciBkZWZpbml0aW9uIHN0cmluZyBmb3IgdGhpcyBtYXRlcmlhbC5cbiAgICogVGhpcyBtZXRob2Qgc2hvdWxkIGJlIG92ZXJyaWRkZW4gYnkgZGVyaXZlZCBjbGFzc2VzIHRvIHByb3ZpZGUgc3BlY2lmaWMgZGVmaW5pdGlvbnMuXG4gICAqIEByZXR1cm5zIEVtcHR5IHN0cmluZyBieSBkZWZhdWx0XG4gICAqL1xuICBnZXREZWZpbml0aW9uKCkge1xuICAgIHJldHVybiAnJztcbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtcyBzaGFkZXIgcmVmbGVjdGlvbiB0byBleHRyYWN0IHNlbWFudGljcyBpbmZvcm1hdGlvbiBmcm9tIHZlcnRleCBhbmQgcGl4ZWwgc2hhZGVycy5cbiAgICogQHBhcmFtIHZlcnRleFNoYWRlciAtIFRoZSB2ZXJ0ZXggc2hhZGVyIG9iamVjdCBmb3IgV2ViR0xcbiAgICogQHBhcmFtIHBpeGVsU2hhZGVyIC0gVGhlIHBpeGVsIHNoYWRlciBvYmplY3QgZm9yIFdlYkdMXG4gICAqIEBwYXJhbSB2ZXJ0ZXhTaGFkZXJXZWJHcHUgLSBUaGUgdmVydGV4IHNoYWRlciBvYmplY3QgZm9yIFdlYkdQVVxuICAgKiBAcGFyYW0gcGl4ZWxTaGFkZXJXZWJHcHUgLSBUaGUgcGl4ZWwgc2hhZGVyIG9iamVjdCBmb3IgV2ViR1BVXG4gICAqIEBwYXJhbSBkZWZpbml0aW9ucyAtIEFycmF5IG9mIHNoYWRlciBkZWZpbml0aW9uc1xuICAgKiBAcmV0dXJucyBBcnJheSBvZiBzaGFkZXIgc2VtYW50aWNzIGluZm9ybWF0aW9uXG4gICAqL1xuICBwcm90ZWN0ZWQgZG9TaGFkZXJSZWZsZWN0aW9uKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIHZlcnRleFNoYWRlcjogU2hhZGVyaXR5T2JqZWN0LFxuICAgIHBpeGVsU2hhZGVyOiBTaGFkZXJpdHlPYmplY3QsXG4gICAgdmVydGV4U2hhZGVyV2ViR3B1OiBTaGFkZXJpdHlPYmplY3QsXG4gICAgcGl4ZWxTaGFkZXJXZWJHcHU6IFNoYWRlcml0eU9iamVjdCxcbiAgICBkZWZpbml0aW9uczogc3RyaW5nW11cbiAgKSB7XG4gICAgLy8gU3RvcmUgdGhlIGVuZ2luZSByZWZlcmVuY2UgZm9yIHRoaXMgbWF0ZXJpYWwgY29udGVudFxuICAgIHRoaXMuX2VuZ2luZSA9IGVuZ2luZTtcblxuICAgIGNvbnN0IGRlZmluaXRpb25zU3RyID0gZGVmaW5pdGlvbnMuam9pbignJyk7XG4gICAgY29uc3QgcmVmbGVjdGVkTWFwID0gQWJzdHJhY3RNYXRlcmlhbENvbnRlbnQuX19nZXRSZWZsZWN0ZWRTaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXlNYXAoZW5naW5lLm9iamVjdFVJRCk7XG4gICAgY29uc3QgcmVmbGVjdGVkU2hhZGVyU2VtYW50aWNzSW5mb0FycmF5ID0gcmVmbGVjdGVkTWFwLmdldCh0aGlzLl9fbWF0ZXJpYWxOYW1lICsgZGVmaW5pdGlvbnNTdHIpO1xuICAgIGlmIChyZWZsZWN0ZWRTaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXkgIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHJlZmxlY3RlZFNoYWRlclNlbWFudGljc0luZm9BcnJheS5jb25jYXQoKTtcbiAgICB9XG5cbiAgICBsZXQgcHJlcHJvY2Vzc2VkVmVydGV4U2hhZGVyRGF0YToge1xuICAgICAgc2hhZGVyU2VtYW50aWNzSW5mb0FycmF5OiBTaGFkZXJTZW1hbnRpY3NJbmZvW107XG4gICAgICBzaGFkZXJpdHlPYmplY3Q6IFNoYWRlcml0eU9iamVjdDtcbiAgICB9O1xuICAgIGxldCBwcmVwcm9jZXNzZWRQaXhlbFNoYWRlckRhdGE6IHtcbiAgICAgIHNoYWRlclNlbWFudGljc0luZm9BcnJheTogU2hhZGVyU2VtYW50aWNzSW5mb1tdO1xuICAgICAgc2hhZGVyaXR5T2JqZWN0OiBTaGFkZXJpdHlPYmplY3Q7XG4gICAgfTtcbiAgICBpZiAoZW5naW5lLnByb2Nlc3NBcHByb2FjaCA9PT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdQVSkge1xuICAgICAgY29uc3QgcHJlcHJvY2Vzc2VkVmVydGV4U2hhZGVyID0gU2hhZGVyaXR5LnByb2Nlc3NQcmFnbWEodmVydGV4U2hhZGVyV2ViR3B1ISwgZmFsc2UsIGRlZmluaXRpb25zKTtcbiAgICAgIGNvbnN0IHByZXByb2Nlc3NlZFBpeGVsU2hhZGVyID0gU2hhZGVyaXR5LnByb2Nlc3NQcmFnbWEocGl4ZWxTaGFkZXJXZWJHcHUhLCBmYWxzZSwgZGVmaW5pdGlvbnMpO1xuXG4gICAgICBwcmVwcm9jZXNzZWRWZXJ0ZXhTaGFkZXJEYXRhID0gU2hhZGVyaXR5VXRpbGl0eVdlYkdQVS5nZXRTaGFkZXJEYXRhUmVmbGVjdGlvbihlbmdpbmUsIHByZXByb2Nlc3NlZFZlcnRleFNoYWRlcik7XG4gICAgICBwcmVwcm9jZXNzZWRQaXhlbFNoYWRlckRhdGEgPSBTaGFkZXJpdHlVdGlsaXR5V2ViR1BVLmdldFNoYWRlckRhdGFSZWZsZWN0aW9uKGVuZ2luZSwgcHJlcHJvY2Vzc2VkUGl4ZWxTaGFkZXIpO1xuICAgICAgY29uc3QgdmVydGV4U2hhZGVyRGF0YSA9IFNoYWRlcml0eVV0aWxpdHlXZWJHUFUuZ2V0U2hhZGVyRGF0YVJlZmxlY3Rpb24oZW5naW5lLCB2ZXJ0ZXhTaGFkZXJXZWJHcHUhKTtcbiAgICAgIGNvbnN0IHBpeGVsU2hhZGVyRGF0YSA9IFNoYWRlcml0eVV0aWxpdHlXZWJHUFUuZ2V0U2hhZGVyRGF0YVJlZmxlY3Rpb24oZW5naW5lLCBwaXhlbFNoYWRlcldlYkdwdSEpO1xuXG4gICAgICB0aGlzLnNldFZlcnRleFNoYWRlcml0eU9iamVjdCh2ZXJ0ZXhTaGFkZXJEYXRhLnNoYWRlcml0eU9iamVjdCwgZW5naW5lKTtcbiAgICAgIHRoaXMuc2V0UGl4ZWxTaGFkZXJpdHlPYmplY3QocGl4ZWxTaGFkZXJEYXRhLnNoYWRlcml0eU9iamVjdCwgZW5naW5lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcHJlcHJvY2Vzc2VkVmVydGV4U2hhZGVyID0gU2hhZGVyaXR5LnByb2Nlc3NQcmFnbWEodmVydGV4U2hhZGVyLCB0cnVlLCBkZWZpbml0aW9ucyk7XG4gICAgICBjb25zdCBwcmVwcm9jZXNzZWRQaXhlbFNoYWRlciA9IFNoYWRlcml0eS5wcm9jZXNzUHJhZ21hKHBpeGVsU2hhZGVyLCB0cnVlLCBkZWZpbml0aW9ucyk7XG5cbiAgICAgIHByZXByb2Nlc3NlZFZlcnRleFNoYWRlckRhdGEgPSBTaGFkZXJpdHlVdGlsaXR5V2ViR0wuZ2V0U2hhZGVyRGF0YVJlZmxlY3Rpb24oZW5naW5lLCBwcmVwcm9jZXNzZWRWZXJ0ZXhTaGFkZXIpO1xuICAgICAgcHJlcHJvY2Vzc2VkUGl4ZWxTaGFkZXJEYXRhID0gU2hhZGVyaXR5VXRpbGl0eVdlYkdMLmdldFNoYWRlckRhdGFSZWZsZWN0aW9uKGVuZ2luZSwgcHJlcHJvY2Vzc2VkUGl4ZWxTaGFkZXIpO1xuXG4gICAgICBjb25zdCB2ZXJ0ZXhTaGFkZXJEYXRhID0gU2hhZGVyaXR5VXRpbGl0eVdlYkdMLmdldFNoYWRlckRhdGFSZWZsZWN0aW9uKGVuZ2luZSwgdmVydGV4U2hhZGVyKTtcbiAgICAgIGNvbnN0IHBpeGVsU2hhZGVyRGF0YSA9IFNoYWRlcml0eVV0aWxpdHlXZWJHTC5nZXRTaGFkZXJEYXRhUmVmbGVjdGlvbihlbmdpbmUsIHBpeGVsU2hhZGVyKTtcblxuICAgICAgdGhpcy5zZXRWZXJ0ZXhTaGFkZXJpdHlPYmplY3QodmVydGV4U2hhZGVyRGF0YS5zaGFkZXJpdHlPYmplY3QsIGVuZ2luZSk7XG4gICAgICB0aGlzLnNldFBpeGVsU2hhZGVyaXR5T2JqZWN0KHBpeGVsU2hhZGVyRGF0YS5zaGFkZXJpdHlPYmplY3QsIGVuZ2luZSk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2hhZGVyU2VtYW50aWNzSW5mb0FycmF5OiBTaGFkZXJTZW1hbnRpY3NJbmZvW10gPSBbXTtcblxuICAgIGZvciAoY29uc3QgdmVydGV4U2hhZGVyU2VtYW50aWNzSW5mbyBvZiBwcmVwcm9jZXNzZWRWZXJ0ZXhTaGFkZXJEYXRhLnNoYWRlclNlbWFudGljc0luZm9BcnJheSkge1xuICAgICAgdmVydGV4U2hhZGVyU2VtYW50aWNzSW5mby5zdGFnZSA9IFNoYWRlclR5cGUuVmVydGV4U2hhZGVyO1xuICAgICAgc2hhZGVyU2VtYW50aWNzSW5mb0FycmF5LnB1c2godmVydGV4U2hhZGVyU2VtYW50aWNzSW5mbyk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgcGl4ZWxTaGFkZXJTZW1hbnRpY3NJbmZvIG9mIHByZXByb2Nlc3NlZFBpeGVsU2hhZGVyRGF0YS5zaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXkpIHtcbiAgICAgIGNvbnN0IGZvdW5kU2hhZGVyU2VtYW50aWNzSW5mbyA9IHNoYWRlclNlbWFudGljc0luZm9BcnJheS5maW5kKCh2ZXJ0ZXhJbmZvOiBTaGFkZXJTZW1hbnRpY3NJbmZvKSA9PiB7XG4gICAgICAgIGlmICh2ZXJ0ZXhJbmZvLnNlbWFudGljID09PSBwaXhlbFNoYWRlclNlbWFudGljc0luZm8uc2VtYW50aWMpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9KTtcbiAgICAgIGlmIChmb3VuZFNoYWRlclNlbWFudGljc0luZm8pIHtcbiAgICAgICAgZm91bmRTaGFkZXJTZW1hbnRpY3NJbmZvLnN0YWdlID0gU2hhZGVyVHlwZS5WZXJ0ZXhBbmRQaXhlbFNoYWRlcjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBpeGVsU2hhZGVyU2VtYW50aWNzSW5mby5zdGFnZSA9IFNoYWRlclR5cGUuUGl4ZWxTaGFkZXI7XG4gICAgICAgIHNoYWRlclNlbWFudGljc0luZm9BcnJheS5wdXNoKHBpeGVsU2hhZGVyU2VtYW50aWNzSW5mbyk7XG4gICAgICB9XG4gICAgfVxuICAgIHJlZmxlY3RlZE1hcC5zZXQodGhpcy5fX21hdGVyaWFsTmFtZSArIGRlZmluaXRpb25zU3RyLCBzaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXkpO1xuXG4gICAgcmV0dXJuIHNoYWRlclNlbWFudGljc0luZm9BcnJheS5jb25jYXQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhbnMgdXAgc3RhdGljIGNhY2hlcyBmb3IgYSBzcGVjaWZpYyBFbmdpbmUgaW5zdGFuY2UuXG4gICAqIFRoaXMgc2hvdWxkIGJlIGNhbGxlZCB3aGVuIHRoZSBFbmdpbmUgaXMgZGVzdHJveWVkIHRvIHByZXZlbnQgc3RhbGUgcmVmZXJlbmNlcy5cbiAgICpcbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBFbmdpbmUgaW5zdGFuY2UgYmVpbmcgZGVzdHJveWVkXG4gICAqIEBpbnRlcm5hbCBDYWxsZWQgZnJvbSBFbmdpbmUuZGVzdHJveSgpXG4gICAqL1xuICBzdGF0aWMgX2NsZWFudXBGb3JFbmdpbmUoZW5naW5lOiBFbmdpbmUpOiB2b2lkIHtcbiAgICBBYnN0cmFjdE1hdGVyaWFsQ29udGVudC5fX3ZlcnRleFNoYWRlcml0eU9iamVjdE1hcFBlckVuZ2luZS5kZWxldGUoZW5naW5lLm9iamVjdFVJRCk7XG4gICAgQWJzdHJhY3RNYXRlcmlhbENvbnRlbnQuX19waXhlbFNoYWRlcml0eU9iamVjdE1hcFBlckVuZ2luZS5kZWxldGUoZW5naW5lLm9iamVjdFVJRCk7XG4gICAgQWJzdHJhY3RNYXRlcmlhbENvbnRlbnQuX19yZWZsZWN0ZWRTaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXlNYXBQZXJFbmdpbmUuZGVsZXRlKGVuZ2luZS5vYmplY3RVSUQpO1xuXG4gICAgLy8gTm90ZTogV2UgZG9uJ3QgcmVzZXQgX19tYXRlcmlhbENvbnRlbnRDb3VudCBhcyBVSURzIHNob3VsZCByZW1haW4gdW5pcXVlIGFjcm9zcyBlbmdpbmUgaW5zdGFuY2VzXG4gICAgLy8gTm90ZTogV2UgZG9uJ3QgY2xlYXIgbWF0ZXJpYWxOb2RlcyBhcyB0aGV5IG1heSBzdGlsbCBiZSByZWZlcmVuY2VkXG4gICAgLy8gTm90ZTogTGlnaHQgYXJyYXlzIGFuZCB0bXAgdmVjdG9ycyBhcmUganVzdCByZXVzYWJsZSBidWZmZXJzLCBubyBuZWVkIHRvIGNsZWFyXG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBQSxPQUFPLHFCQUErQztBQUt0RCxTQUFTLGdCQUFnQjtBQUN6QixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLHVCQUF1QjtBQUVoQyxTQUFTLGtCQUF1QztBQUtoRCxTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLHNCQUFzQjtBQUMvQixTQUFTLHNCQUFzQjtBQUMvQixTQUFTLGVBQWU7QUFDeEIsU0FBUyxjQUFjO0FBR3ZCLFNBQVMseUJBQXlCLDhCQUE4QjtBQUNoRSxTQUFTLDBCQUEwQiwrQkFBK0I7QUFHbEUsSUFBTSx3QkFDSixPQUFPLGlCQUFpQixlQUFlLGVBQWUseUJBQXlCO0FBRWpGLElBQU0seUJBQ0osT0FBTyxrQkFBa0IsZUFBZSxnQkFBZ0IsMEJBQTBCO0FBR3BGLElBQU0sWUFBYSxnQkFBd0IsV0FBVztBQVEvQyxJQUFlLDJCQUFmLE1BQWUsaUNBQWdDLFNBQVM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUF3RjdELFlBQ0UsY0FDQSxFQUFFLGFBQWEsT0FBTyxhQUFhLE9BQU8sYUFBYSxNQUFNLElBQUksQ0FBQyxHQUNsRSx1QkFDQSxzQkFDQSxRQUNBO0FBQ0EsVUFBTTtBQXJGUixTQUFVLGNBQXFDLENBQUM7QUFPaEQsU0FBVSxnQkFBZ0I7QUFnQjFCLFNBQU8sYUFBNkIsV0FBVztBQUUvQyxTQUFRLGlDQUFpQztBQUN6QyxTQUFRLGdDQUFnQztBQTREdEMsU0FBSyxpQkFBaUI7QUFHdEIsUUFBSSxRQUFRO0FBQ1YsV0FBSyxVQUFVO0FBQUEsSUFDakI7QUFFQSxTQUFLLGVBQWU7QUFDcEIsU0FBSyxlQUFlO0FBQ3BCLFNBQUssZUFBZTtBQUVwQixTQUFLLHVCQUF1Qix5QkFBd0I7QUFFcEQsU0FBSyx5QkFBeUIsdUJBQXVCLE1BQU07QUFDM0QsU0FBSyx3QkFB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
