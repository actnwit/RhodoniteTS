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
import { ShaderityUtilityWebGL } from "./ShaderityUtilityWebGL.js";
import { ShaderityUtilityWebGPU } from "./ShaderityUtilityWebGPU.js";
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0ZXJpYWxzL2NvcmUvQWJzdHJhY3RNYXRlcmlhbENvbnRlbnQudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCBTaGFkZXJpdHlNb2R1bGUsIHsgdHlwZSBTaGFkZXJpdHlPYmplY3QgfSBmcm9tICdzaGFkZXJpdHknO1xuaW1wb3J0IHR5cGUgeyBSZW5kZXJpbmdBcmdXZWJHTCB9IGZyb20gJy4uLy4uLy4uL3dlYmdsL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB0eXBlIHsgQmxlbmRTaGFwZUNvbXBvbmVudCB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvQmxlbmRTaGFwZS9CbGVuZFNoYXBlQ29tcG9uZW50JztcbmltcG9ydCB0eXBlIHsgQ2FtZXJhQ29tcG9uZW50IH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9DYW1lcmEvQ2FtZXJhQ29tcG9uZW50JztcbmltcG9ydCB0eXBlIHsgTWVzaENvbXBvbmVudCB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvTWVzaC9NZXNoQ29tcG9uZW50JztcbmltcG9ydCB7IFJuT2JqZWN0IH0gZnJvbSAnLi4vLi4vY29yZS9Sbk9iamVjdCc7XG5pbXBvcnQgeyBDb21wb3NpdGlvblR5cGUgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9Db21wb3NpdGlvblR5cGUnO1xuaW1wb3J0IHsgUHJvY2Vzc0FwcHJvYWNoIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvUHJvY2Vzc0FwcHJvYWNoJztcbmltcG9ydCB0eXBlIHsgU2hhZGVyU2VtYW50aWNzSW5mbyB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1NoYWRlclNlbWFudGljc0luZm8nO1xuaW1wb3J0IHsgU2hhZGVyVHlwZSwgdHlwZSBTaGFkZXJUeXBlRW51bSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1NoYWRlclR5cGUnO1xuaW1wb3J0IHR5cGUgeyBQcmltaXRpdmUgfSBmcm9tICcuLi8uLi9nZW9tZXRyeS9QcmltaXRpdmUnO1xuaW1wb3J0IHR5cGUgeyBJTWF0cml4MzMgfSBmcm9tICcuLi8uLi9tYXRoL0lNYXRyaXgnO1xuaW1wb3J0IHR5cGUgeyBJVmVjdG9yMyB9IGZyb20gJy4uLy4uL21hdGgvSVZlY3Rvcic7XG5pbXBvcnQgdHlwZSB7IE1hdHJpeDQ0IH0gZnJvbSAnLi4vLi4vbWF0aC9NYXRyaXg0NCc7XG5pbXBvcnQgeyBNdXRhYmxlTWF0cml4NDQgfSBmcm9tICcuLi8uLi9tYXRoL011dGFibGVNYXRyaXg0NCc7XG5pbXBvcnQgeyBNdXRhYmxlVmVjdG9yMiB9IGZyb20gJy4uLy4uL21hdGgvTXV0YWJsZVZlY3RvcjInO1xuaW1wb3J0IHsgTXV0YWJsZVZlY3RvcjQgfSBmcm9tICcuLi8uLi9tYXRoL011dGFibGVWZWN0b3I0JztcbmltcG9ydCB7IFZlY3RvcjMgfSBmcm9tICcuLi8uLi9tYXRoL1ZlY3RvcjMnO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vLi4vbWlzYy9Mb2dnZXInO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi8uLi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB0eXBlIHsgTWF0ZXJpYWwgfSBmcm9tICcuL01hdGVyaWFsJztcbmltcG9ydCB7IFNoYWRlcml0eVV0aWxpdHlXZWJHTCB9IGZyb20gJy4vU2hhZGVyaXR5VXRpbGl0eVdlYkdMJztcbmltcG9ydCB7IFNoYWRlcml0eVV0aWxpdHlXZWJHUFUgfSBmcm9tICcuL1NoYWRlcml0eVV0aWxpdHlXZWJHUFUnO1xuXG5jb25zdCBTaGFkZXJpdHkgPSAoU2hhZGVyaXR5TW9kdWxlIGFzIGFueSkuZGVmYXVsdCB8fCBTaGFkZXJpdHlNb2R1bGU7XG5cbnR5cGUgTWF0ZXJpYWxOb2RlVUlEID0gbnVtYmVyO1xuXG4vKipcbiAqIEFic3RyYWN0IGJhc2UgY2xhc3MgZm9yIG1hdGVyaWFsIGNvbnRlbnQgdGhhdCBwcm92aWRlcyBjb21tb24gZnVuY3Rpb25hbGl0eSBmb3IgbWF0ZXJpYWwgcmVuZGVyaW5nLlxuICogVGhpcyBjbGFzcyBoYW5kbGVzIHNoYWRlciBzZW1hbnRpY3MsIHJlbmRlcmluZyBzZXR1cCwgYW5kIEdQVSBwYXJhbWV0ZXIgbWFuYWdlbWVudCBmb3IgbWF0ZXJpYWxzLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQWJzdHJhY3RNYXRlcmlhbENvbnRlbnQgZXh0ZW5kcyBSbk9iamVjdCB7XG4gIC8qKlxuICAgKiBXaGV0aGVyIGRyYXdzIG9mIHRoaXMgbWF0ZXJpYWwgY2FuIGJlIGJhdGNoZWQgaW50byBvbmUgbXVsdGktZHJhdyBjYWxsLlxuICAgKiBNYXRlcmlhbCBjb250ZW50cyB0aGF0IHNldCBwZXItcHJpbWl0aXZlIHVuaWZvcm1zIGluIHRoZSBwZXItcHJpbWl0aXZlIGhvb2tcbiAgICogbXVzdCBvdmVycmlkZSB0aGlzIHRvIGZhbHNlLlxuICAgKi9cbiAgZ2V0IGlzTXVsdGlEcmF3Q29tcGF0aWJsZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHByb3RlY3RlZCBfX3NlbWFudGljczogU2hhZGVyU2VtYW50aWNzSW5mb1tdID0gW107XG4gIHN0YXRpYyBtYXRlcmlhbE5vZGVzOiBBYnN0cmFjdE1hdGVyaWFsQ29udGVudFtdID0gW107XG4gIHByb3RlY3RlZCBfX21hdGVyaWFsTmFtZTogc3RyaW5nO1xuXG4gIC8qKiBUaGUgZW5naW5lIGluc3RhbmNlIHRoaXMgbWF0ZXJpYWwgY29udGVudCBpcyBhc3NvY2lhdGVkIHdpdGggKi9cbiAgcHJvdGVjdGVkIF9lbmdpbmU/OiBFbmdpbmU7XG5cbiAgcHJvdGVjdGVkIF9fZGVmaW5pdGlvbnMgPSAnJztcbiAgcHJvdGVjdGVkIHN0YXRpYyBfX3RtcF92ZWN0b3I0ID0gTXV0YWJsZVZlY3RvcjQuemVybygpO1xuICBwcm90ZWN0ZWQgc3RhdGljIF9fdG1wX3ZlY3RvcjIgPSBNdXRhYmxlVmVjdG9yMi56ZXJvKCk7XG4gIHByaXZhdGUgX19pc01vcnBoaW5nOiBib29sZWFuO1xuICBwcml2YXRlIF9faXNTa2lubmluZzogYm9vbGVhbjtcbiAgcHJpdmF0ZSBfX2lzTGlnaHRpbmc6IGJvb2xlYW47XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19tYXRlcmlhbENvbnRlbnRDb3VudCA9IDA7XG4gIHByaXZhdGUgX19tYXRlcmlhbENvbnRlbnRVaWQ6IG51bWJlcjtcblxuICAvKiogU2hhZGVyIGNhY2hlcyBtYW5hZ2VkIHBlci1FbmdpbmUuIEtleSBpcyBFbmdpbmUub2JqZWN0VUlEICovXG4gIHByaXZhdGUgc3RhdGljIF9fdmVydGV4U2hhZGVyaXR5T2JqZWN0TWFwUGVyRW5naW5lOiBNYXA8bnVtYmVyLCBNYXA8c3RyaW5nLCBTaGFkZXJpdHlPYmplY3Q+PiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX19waXhlbFNoYWRlcml0eU9iamVjdE1hcFBlckVuZ2luZTogTWFwPG51bWJlciwgTWFwPHN0cmluZywgU2hhZGVyaXR5T2JqZWN0Pj4gPSBuZXcgTWFwKCk7XG4gIHByaXZhdGUgc3RhdGljIF9fcmVmbGVjdGVkU2hhZGVyU2VtYW50aWNzSW5mb0FycmF5TWFwUGVyRW5naW5lOiBNYXA8bnVtYmVyLCBNYXA8c3RyaW5nLCBTaGFkZXJTZW1hbnRpY3NJbmZvW10+PiA9XG4gICAgbmV3IE1hcCgpO1xuXG4gIHB1YmxpYyBzaGFkZXJUeXBlOiBTaGFkZXJUeXBlRW51bSA9IFNoYWRlclR5cGUuVmVydGV4QW5kUGl4ZWxTaGFkZXI7XG5cbiAgcHJpdmF0ZSBfX21hdGVyaWFsU2VtYW50aWNzVmFyaWFudE5hbWUgPSAnJztcbiAgcHJpdmF0ZSBfX21hdGVyaWFsVmFyaWF0aW9uSWRlbnRpZmllciA9ICcnO1xuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB2ZXJ0ZXggc2hhZGVyaXR5IG9iamVjdCBtYXAgZm9yIGEgc3BlY2lmaWMgZW5naW5lLlxuICAgKiBDcmVhdGVzIHRoZSBtYXAgaWYgaXQgZG9lc24ndCBleGlzdC5cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fZ2V0VmVydGV4U2hhZGVyaXR5T2JqZWN0TWFwKGVuZ2luZVVpZDogbnVtYmVyKTogTWFwPHN0cmluZywgU2hhZGVyaXR5T2JqZWN0PiB7XG4gICAgbGV0IG1hcCA9IEFic3RyYWN0TWF0ZXJpYWxDb250ZW50Ll9fdmVydGV4U2hhZGVyaXR5T2JqZWN0TWFwUGVyRW5naW5lLmdldChlbmdpbmVVaWQpO1xuICAgIGlmICghbWFwKSB7XG4gICAgICBtYXAgPSBuZXcgTWFwKCk7XG4gICAgICBBYnN0cmFjdE1hdGVyaWFsQ29udGVudC5fX3ZlcnRleFNoYWRlcml0eU9iamVjdE1hcFBlckVuZ2luZS5zZXQoZW5naW5lVWlkLCBtYXApO1xuICAgIH1cbiAgICByZXR1cm4gbWFwO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHBpeGVsIHNoYWRlcml0eSBvYmplY3QgbWFwIGZvciBhIHNwZWNpZmljIGVuZ2luZS5cbiAgICogQ3JlYXRlcyB0aGUgbWFwIGlmIGl0IGRvZXNuJ3QgZXhpc3QuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2dldFBpeGVsU2hhZGVyaXR5T2JqZWN0TWFwKGVuZ2luZVVpZDogbnVtYmVyKTogTWFwPHN0cmluZywgU2hhZGVyaXR5T2JqZWN0PiB7XG4gICAgbGV0IG1hcCA9IEFic3RyYWN0TWF0ZXJpYWxDb250ZW50Ll9fcGl4ZWxTaGFkZXJpdHlPYmplY3RNYXBQZXJFbmdpbmUuZ2V0KGVuZ2luZVVpZCk7XG4gICAgaWYgKCFtYXApIHtcbiAgICAgIG1hcCA9IG5ldyBNYXAoKTtcbiAgICAgIEFic3RyYWN0TWF0ZXJpYWxDb250ZW50Ll9fcGl4ZWxTaGFkZXJpdHlPYmplY3RNYXBQZXJFbmdpbmUuc2V0KGVuZ2luZVVpZCwgbWFwKTtcbiAgICB9XG4gICAgcmV0dXJuIG1hcDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSByZWZsZWN0ZWQgc2hhZGVyIHNlbWFudGljcyBpbmZvIG1hcCBmb3IgYSBzcGVjaWZpYyBlbmdpbmUuXG4gICAqIENyZWF0ZXMgdGhlIG1hcCBpZiBpdCBkb2Vzbid0IGV4aXN0LlxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZXRSZWZsZWN0ZWRTaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXlNYXAoZW5naW5lVWlkOiBudW1iZXIpOiBNYXA8c3RyaW5nLCBTaGFkZXJTZW1hbnRpY3NJbmZvW10+IHtcbiAgICBsZXQgbWFwID0gQWJzdHJhY3RNYXRlcmlhbENvbnRlbnQuX19yZWZsZWN0ZWRTaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXlNYXBQZXJFbmdpbmUuZ2V0KGVuZ2luZVVpZCk7XG4gICAgaWYgKCFtYXApIHtcbiAgICAgIG1hcCA9IG5ldyBNYXAoKTtcbiAgICAgIEFic3RyYWN0TWF0ZXJpYWxDb250ZW50Ll9fcmVmbGVjdGVkU2hhZGVyU2VtYW50aWNzSW5mb0FycmF5TWFwUGVyRW5naW5lLnNldChlbmdpbmVVaWQsIG1hcCk7XG4gICAgfVxuICAgIHJldHVybiBtYXA7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0cyBhIG5ldyBBYnN0cmFjdE1hdGVyaWFsQ29udGVudCBpbnN0YW5jZS5cbiAgICogQHBhcmFtIG1hdGVyaWFsTmFtZSAtIFRoZSB1bmlxdWUgbmFtZSBpZGVudGlmaWVyIGZvciB0aGlzIG1hdGVyaWFsXG4gICAqIEBwYXJhbSBvcHRpb25zIC0gQ29uZmlndXJhdGlvbiBvcHRpb25zIGZvciB0aGUgbWF0ZXJpYWxcbiAgICogQHBhcmFtIG9wdGlvbnMuaXNNb3JwaGluZyAtIFdoZXRoZXIgdGhpcyBtYXRlcmlhbCBzdXBwb3J0cyBtb3JwaCB0YXJnZXQgYW5pbWF0aW9uXG4gICAqIEBwYXJhbSBvcHRpb25zLmlzU2tpbm5pbmcgLSBXaGV0aGVyIHRoaXMgbWF0ZXJpYWwgc3VwcG9ydHMgc2tlbGV0YWwgYW5pbWF0aW9uXG4gICAqIEBwYXJhbSBvcHRpb25zLmlzTGlnaHRpbmcgLSBXaGV0aGVyIHRoaXMgbWF0ZXJpYWwgc3VwcG9ydHMgbGlnaHRpbmcgY2FsY3VsYXRpb25zXG4gICAqIEBwYXJhbSB2ZXJ0ZXhTaGFkZXJpdHlPYmplY3QgLSBPcHRpb25hbCB2ZXJ0ZXggc2hhZGVyIG9iamVjdFxuICAgKiBAcGFyYW0gcGl4ZWxTaGFkZXJpdHlPYmplY3QgLSBPcHRpb25hbCBwaXhlbCBzaGFkZXIgb2JqZWN0XG4gICAqIEBwYXJhbSBlbmdpbmUgLSBPcHRpb25hbCBlbmdpbmUgaW5zdGFuY2UgZm9yIHByb3BlciBzaGFkZXIgY2FjaGluZ1xuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgbWF0ZXJpYWxOYW1lOiBzdHJpbmcsXG4gICAgeyBpc01vcnBoaW5nID0gZmFsc2UsIGlzU2tpbm5pbmcgPSBmYWxzZSwgaXNMaWdodGluZyA9IGZhbHNlIH0gPSB7fSxcbiAgICB2ZXJ0ZXhTaGFkZXJpdHlPYmplY3Q/OiBTaGFkZXJpdHlPYmplY3QsXG4gICAgcGl4ZWxTaGFkZXJpdHlPYmplY3Q/OiBTaGFkZXJpdHlPYmplY3QsXG4gICAgZW5naW5lPzogRW5naW5lXG4gICkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5fX21hdGVyaWFsTmFtZSA9IG1hdGVyaWFsTmFtZTtcblxuICAgIC8vIFNldCBlbmdpbmUgaWYgcHJvdmlkZWQgKGltcG9ydGFudCBmb3IgcHJvcGVyIHNoYWRlciBjYWNoaW5nKVxuICAgIGlmIChlbmdpbmUpIHtcbiAgICAgIHRoaXMuX2VuZ2luZSA9IGVuZ2luZTtcbiAgICB9XG5cbiAgICB0aGlzLl9faXNNb3JwaGluZyA9IGlzTW9ycGhpbmc7XG4gICAgdGhpcy5fX2lzU2tpbm5pbmcgPSBpc1NraW5uaW5nO1xuICAgIHRoaXMuX19pc0xpZ2h0aW5nID0gaXNMaWdodGluZztcblxuICAgIHRoaXMuX19tYXRlcmlhbENvbnRlbnRVaWQgPSBBYnN0cmFjdE1hdGVyaWFsQ29udGVudC5fX21hdGVyaWFsQ29udGVudENvdW50Kys7XG5cbiAgICB0aGlzLnNldFZlcnRleFNoYWRlcml0eU9iamVjdCh2ZXJ0ZXhTaGFkZXJpdHlPYmplY3QsIGVuZ2luZSk7XG4gICAgdGhpcy5zZXRQaXhlbFNoYWRlcml0eU9iamVjdChwaXhlbFNoYWRlcml0eU9iamVjdCwgZW5naW5lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB2ZXJ0ZXggc2hhZGVyIG9iamVjdCBmb3IgdGhpcyBtYXRlcmlhbC5cbiAgICogQHBhcmFtIHZlcnRleFNoYWRlcml0eU9iamVjdCAtIFRoZSB2ZXJ0ZXggc2hhZGVyIG9iamVjdCB0byBzZXRcbiAgICogQHBhcmFtIGVuZ2luZSAtIE9wdGlvbmFsIGVuZ2luZSBpbnN0YW5jZSAodXNlcyB0aGlzLl9lbmdpbmUgaWYgbm90IHByb3ZpZGVkKVxuICAgKi9cbiAgcHJvdGVjdGVkIHNldFZlcnRleFNoYWRlcml0eU9iamVjdCh2ZXJ0ZXhTaGFkZXJpdHlPYmplY3Q/OiBTaGFkZXJpdHlPYmplY3QsIGVuZ2luZT86IEVuZ2luZSkge1xuICAgIGlmICh2ZXJ0ZXhTaGFkZXJpdHlPYmplY3QpIHtcbiAgICAgIGNvbnN0IGVuZ2luZVRvVXNlID0gZW5naW5lID8/IHRoaXMuX2VuZ2luZTtcbiAgICAgIGlmIChlbmdpbmVUb1VzZSkge1xuICAgICAgICBjb25zdCBtYXAgPSBBYnN0cmFjdE1hdGVyaWFsQ29udGVudC5fX2dldFZlcnRleFNoYWRlcml0eU9iamVjdE1hcChlbmdpbmVUb1VzZS5vYmplY3RVSUQpO1xuICAgICAgICBtYXAuc2V0KHRoaXMuX19tYXRlcmlhbE5hbWUsIHZlcnRleFNoYWRlcml0eU9iamVjdCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHBpeGVsIHNoYWRlciBvYmplY3QgZm9yIHRoaXMgbWF0ZXJpYWwuXG4gICAqIEBwYXJhbSBwaXhlbFNoYWRlcml0eU9iamVjdCAtIFRoZSBwaXhlbCBzaGFkZXIgb2JqZWN0IHRvIHNldFxuICAgKiBAcGFyYW0gZW5naW5lIC0gT3B0aW9uYWwgZW5naW5lIGluc3RhbmNlICh1c2VzIHRoaXMuX2VuZ2luZSBpZiBub3QgcHJvdmlkZWQpXG4gICAqL1xuICBwcm90ZWN0ZWQgc2V0UGl4ZWxTaGFkZXJpdHlPYmplY3QocGl4ZWxTaGFkZXJpdHlPYmplY3Q/OiBTaGFkZXJpdHlPYmplY3QsIGVuZ2luZT86IEVuZ2luZSkge1xuICAgIGlmIChwaXhlbFNoYWRlcml0eU9iamVjdCkge1xuICAgICAgY29uc3QgZW5naW5lVG9Vc2UgPSBlbmdpbmUgPz8gdGhpcy5fZW5naW5lO1xuICAgICAgaWYgKGVuZ2luZVRvVXNlKSB7XG4gICAgICAgIGNvbnN0IG1hcCA9IEFic3RyYWN0TWF0ZXJpYWxDb250ZW50Ll9fZ2V0UGl4ZWxTaGFkZXJpdHlPYmplY3RNYXAoZW5naW5lVG9Vc2Uub2JqZWN0VUlEKTtcbiAgICAgICAgbWFwLnNldCh0aGlzLl9fbWF0ZXJpYWxOYW1lLCBwaXhlbFNoYWRlcml0eU9iamVjdCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyBhIHVuaXF1ZSB2YXJpYW50IG5hbWUgZm9yIHRoaXMgbWF0ZXJpYWwgYmFzZWQgb24gaXRzIHNoYWRlciBzZW1hbnRpY3MuXG4gICAqIFRoaXMgbmFtZSBpcyB1c2VkIHRvIGRpZmZlcmVudGlhdGUgbWF0ZXJpYWxzIHdpdGggZGlmZmVyZW50IHNlbWFudGljIGNvbmZpZ3VyYXRpb25zLlxuICAgKi9cbiAgbWFrZU1hdGVyaWFsU2VtYW50aWNzVmFyaWFudE5hbWUoKSB7XG4gICAgbGV0IHNlbWFudGljcyA9ICcnO1xuICAgIGZvciAoY29uc3Qgc2VtYW50aWMgb2YgdGhpcy5fX3NlbWFudGljcykge1xuICAgICAgc2VtYW50aWNzICs9IGAke3NlbWFudGljLnNlbWFudGljfV9gOyAvLyR7c2VtYW50aWMuc3RhZ2UuaW5kZXh9ICR7c2VtYW50aWMuY29tcG9uZW50VHlwZS5pbmRleH0gJHtzZW1hbnRpYy5jb21wb3NpdGlvblR5cGUuaW5kZXh9ICR7c2VtYW50aWMuc29sb0RhdHVtfSAke3NlbWFudGljLmlzSW50ZXJuYWxTZXR0aW5nfSAke3NlbWFudGljLmFycmF5TGVuZ3RofSAke3NlbWFudGljLm5lZWRVbmlmb3JtSW5EYXRhVGV4dHVyZU1vZGV9XFxuYDtcbiAgICB9XG5cbiAgICAvLyBTdG9yZSB0aGUgdmFyaWF0aW9uIGlkZW50aWZpZXIgc2VwYXJhdGVseSAoanVzdCB0aGUgc2VtYW50aWNzIHZhcmlhdGlvbiBwYXJ0KVxuICAgIHRoaXMuX19tYXRlcmlhbFZhcmlhdGlvbklkZW50aWZpZXIgPSBgc2VtYW50aWNzVmFyaWF0aW9uXyR7c2VtYW50aWNzfWA7XG4gICAgLy8gS2VlcCB0aGUgZnVsbCB2YXJpYW50IG5hbWUgZm9yIGJhY2t3YXJkIGNvbXBhdGliaWxpdHlcbiAgICB0aGlzLl9fbWF0ZXJpYWxTZW1hbnRpY3NWYXJpYW50TmFtZSA9IGAke3RoaXMuX19tYXRlcmlhbE5hbWV9XyR7dGhpcy5fX21hdGVyaWFsVmFyaWF0aW9uSWRlbnRpZmllcn1gO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1hdGVyaWFsIHNlbWFudGljcyB2YXJpYW50IG5hbWUgZm9yIHRoaXMgbWF0ZXJpYWwuXG4gICAqIFRoaXMgaXMgdGhlIGZ1bGwgaWRlbnRpZmllciBjb21iaW5pbmcgbWF0ZXJpYWwgbmFtZSBhbmQgdmFyaWF0aW9uIGlkZW50aWZpZXIuXG4gICAqIEByZXR1cm5zIFRoZSB1bmlxdWUgdmFyaWFudCBuYW1lIHN0cmluZ1xuICAgKi9cbiAgZ2V0TWF0ZXJpYWxTZW1hbnRpY3NWYXJpYW50TmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fX21hdGVyaWFsU2VtYW50aWNzVmFyaWFudE5hbWU7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWF0ZXJpYWwgdmFyaWF0aW9uIGlkZW50aWZpZXIgKHdpdGhvdXQgdGhlIGJhc2UgbWF0ZXJpYWwgbmFtZSkuXG4gICAqIFRoaXMgcmVwcmVzZW50cyBvbmx5IHRoZSBwYXJhbWV0ZXIgdmFyaWF0aW9uIHBhcnQgb2YgdGhlIG1hdGVyaWFsIHR5cGUuXG4gICAqIEByZXR1cm5zIFRoZSB2YXJpYXRpb24gaWRlbnRpZmllciBzdHJpbmdcbiAgICovXG4gIGdldE1hdGVyaWFsVmFyaWF0aW9uSWRlbnRpZmllcigpIHtcbiAgICByZXR1cm4gdGhpcy5fX21hdGVyaWFsVmFyaWF0aW9uSWRlbnRpZmllcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBiYXNlIG1hdGVyaWFsIG5hbWUgKGUuZy4sIFwiUGJyVWJlclwiLCBcIkNsYXNzaWNVYmVyXCIpLlxuICAgKiBEb3VibGUgdHJhaWxpbmcgdW5kZXJzY29yZXMgYXJlIHJlbW92ZWQgZm9yIGNsZWFuZXIgZGlzcGxheS5cbiAgICogQHJldHVybnMgVGhlIGJhc2UgbWF0ZXJpYWwgbmFtZSBzdHJpbmdcbiAgICovXG4gIGdldEJhc2VNYXRlcmlhbE5hbWUoKSB7XG4gICAgLy8gUmVtb3ZlIGRvdWJsZSB0cmFpbGluZyB1bmRlcnNjb3JlcyBvbmx5IChlLmcuLCBcIlBiclViZXJfX1wiIC0+IFwiUGJyVWJlclwiKVxuICAgIC8vIEJ1dCBrZWVwIHNpbmdsZSB0cmFpbGluZyB1bmRlcnNjb3JlIChlLmcuLCBcIlBiclViZXJfU29tZU5hbWVfXCIgc3RheXMgYXMgaXMpXG4gICAgcmV0dXJuIHRoaXMuX19tYXRlcmlhbE5hbWUucmVwbGFjZSgvX18kLywgJycpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHZlcnRleCBzaGFkZXIgb2JqZWN0IGFzc29jaWF0ZWQgd2l0aCB0aGlzIG1hdGVyaWFsLlxuICAgKiBAcmV0dXJucyBUaGUgdmVydGV4IHNoYWRlciBvYmplY3Qgb3IgdW5kZWZpbmVkIGlmIG5vdCBzZXRcbiAgICovXG4gIGdldCB2ZXJ0ZXhTaGFkZXJpdHlPYmplY3QoKTogU2hhZGVyaXR5T2JqZWN0IHwgdW5kZWZpbmVkIHtcbiAgICBpZiAodGhpcy5fZW5naW5lKSB7XG4gICAgICBjb25zdCBtYXAgPSBBYnN0cmFjdE1hdGVyaWFsQ29udGVudC5fX2dldFZlcnRleFNoYWRlcml0eU9iamVjdE1hcCh0aGlzLl9lbmdpbmUub2JqZWN0VUlEKTtcbiAgICAgIHJldHVybiBtYXAuZ2V0KHRoaXMuX19tYXRlcmlhbE5hbWUpO1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHBpeGVsIHNoYWRlciBvYmplY3QgYXNzb2NpYXRlZCB3aXRoIHRoaXMgbWF0ZXJpYWwuXG4gICAqIEByZXR1cm5zIFRoZSBwaXhlbCBzaGFkZXIgb2JqZWN0IG9yIHVuZGVmaW5lZCBpZiBub3Qgc2V0XG4gICAqL1xuICBnZXQgcGl4ZWxTaGFkZXJpdHlPYmplY3QoKTogU2hhZGVyaXR5T2JqZWN0IHwgdW5kZWZpbmVkIHtcbiAgICBpZiAodGhpcy5fZW5naW5lKSB7XG4gICAgICBjb25zdCBtYXAgPSBBYnN0cmFjdE1hdGVyaWFsQ29udGVudC5fX2dldFBpeGVsU2hhZGVyaXR5T2JqZWN0TWFwKHRoaXMuX2VuZ2luZS5vYmplY3RVSUQpO1xuICAgICAgcmV0dXJuIG1hcC5nZXQodGhpcy5fX21hdGVyaWFsTmFtZSk7XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgc2hhZGVyIGRlZmluaXRpb25zIHN0cmluZyBmb3IgdGhpcyBtYXRlcmlhbC5cbiAgICogQHJldHVybnMgVGhlIGRlZmluaXRpb25zIHN0cmluZ1xuICAgKi9cbiAgZ2V0RGVmaW5pdGlvbnMoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19kZWZpbml0aW9ucztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYSBtYXRlcmlhbCBub2RlIGJ5IGl0cyB1bmlxdWUgaWRlbnRpZmllci5cbiAgICogQHBhcmFtIG1hdGVyaWFsTm9kZVVpZCAtIFRoZSB1bmlxdWUgaWRlbnRpZmllciBvZiB0aGUgbWF0ZXJpYWwgbm9kZVxuICAgKiBAcmV0dXJucyBUaGUgbWF0ZXJpYWwgbm9kZSBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIGdldE1hdGVyaWFsTm9kZShtYXRlcmlhbE5vZGVVaWQ6IE1hdGVyaWFsTm9kZVVJRCkge1xuICAgIHJldHVybiBBYnN0cmFjdE1hdGVyaWFsQ29udGVudC5tYXRlcmlhbE5vZGVzW21hdGVyaWFsTm9kZVVpZF07XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgc2hhZGVyIHNlbWFudGljcyBpbmZvcm1hdGlvbiBhcnJheSBmb3IgdGhpcyBtYXRlcmlhbC5cbiAgICogQHJldHVybnMgQXJyYXkgb2Ygc2hhZGVyIHNlbWFudGljcyBpbmZvcm1hdGlvblxuICAgKi9cbiAgZ2V0IF9zZW1hbnRpY3NJbmZvQXJyYXkoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19zZW1hbnRpY3M7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoaXMgbWF0ZXJpYWwgc3VwcG9ydHMgc2tlbGV0YWwgYW5pbWF0aW9uLlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHNraW5uaW5nIGlzIGVuYWJsZWRcbiAgICovXG4gIGdldCBpc1NraW5uaW5nKCkge1xuICAgIHJldHVybiB0aGlzLl9faXNTa2lubmluZztcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhpcyBtYXRlcmlhbCBzdXBwb3J0cyBtb3JwaCB0YXJnZXQgYW5pbWF0aW9uLlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIG1vcnBoaW5nIGlzIGVuYWJsZWRcbiAgICovXG4gIGdldCBpc01vcnBoaW5nKCkge1xuICAgIHJldHVybiB0aGlzLl9faXNNb3JwaGluZztcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhpcyBtYXRlcmlhbCBzdXBwb3J0cyBsaWdodGluZyBjYWxjdWxhdGlvbnMuXG4gICAqIEByZXR1cm5zIFRydWUgaWYgbGlnaHRpbmcgaXMgZW5hYmxlZFxuICAgKi9cbiAgZ2V0IGlzTGlnaHRpbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19pc0xpZ2h0aW5nO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHNoYWRlciBzZW1hbnRpY3MgaW5mb3JtYXRpb24gYXJyYXkgZm9yIHRoaXMgbWF0ZXJpYWwuXG4gICAqIEBwYXJhbSBzaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXkgLSBBcnJheSBvZiBzaGFkZXIgc2VtYW50aWNzIGluZm9ybWF0aW9uIHRvIHNldFxuICAgKi9cbiAgc2V0U2hhZGVyU2VtYW50aWNzSW5mb0FycmF5KHNoYWRlclNlbWFudGljc0luZm9BcnJheTogU2hhZGVyU2VtYW50aWNzSW5mb1tdKSB7XG4gICAgY29uc3QgaW5mb0FycmF5OiBTaGFkZXJTZW1hbnRpY3NJbmZvW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGluZm8gb2Ygc2hhZGVyU2VtYW50aWNzSW5mb0FycmF5KSB7XG4gICAgICBpbmZvQXJyYXkucHVzaChpbmZvKTtcbiAgICB9XG5cbiAgICAvLyBDb25zdHJ1Y3QgYSBzZXQgb2YgZXhpc3RpbmcgdGV4dHVyZSBzbG90IGluZGljZXNcbiAgICBjb25zdCBleGlzdGluZ1RleHR1cmVTbG90SW5kaWNlcyA9IG5ldyBTZXQ8bnVtYmVyPigpO1xuICAgIGV4aXN0aW5nVGV4dHVyZVNsb3RJbmRpY2VzLmFkZCgwKTsgLy8gRGF0YSB0ZXh0dXJlIHNsb3QgaW5kZXggaXMgMFxuICAgIGluZm9BcnJheS5mb3JFYWNoKGluZm8gPT4ge1xuICAgICAgaWYgKENvbXBvc2l0aW9uVHlwZS5pc1RleHR1cmUoaW5mby5jb21wb3NpdGlvblR5cGUpKSB7XG4gICAgICAgIGNvbnN0IHRleHR1cmVTbG90SW5kZXggPSBpbmZvLmluaXRpYWxWYWx1ZVswXTtcbiAgICAgICAgaWYgKHRleHR1cmVTbG90SW5kZXggPiAwKSB7XG4gICAgICAgICAgZXhpc3RpbmdUZXh0dXJlU2xvdEluZGljZXMuYWRkKHRleHR1cmVTbG90SW5kZXgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBBc3NpZ24gbmV3IHRleHR1cmUgc2xvdCBpbmRpY2VzIHRvIHRleHR1cmVzIHRoYXQgaGF2ZSBuZWdhdGl2ZSBzbG90IGluZGljZXNcbiAgICBpbmZvQXJyYXkuZm9yRWFjaChpbmZvID0+IHtcbiAgICAgIGlmIChDb21wb3NpdGlvblR5cGUuaXNUZXh0dXJlKGluZm8uY29tcG9zaXRpb25UeXBlKSkge1xuICAgICAgICBjb25zdCB0ZXh0dXJlU2xvdEluZGV4ID0gaW5mby5pbml0aWFsVmFsdWVbMF07XG4gICAgICAgIGlmICh0ZXh0dXJlU2xvdEluZGV4IDwgMCkge1xuICAgICAgICAgIGxldCBuZXdUZXh0dXJlU2xvdEluZGV4ID0gLTE7XG4gICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCAzMjsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoIWV4aXN0aW5nVGV4dHVyZVNsb3RJbmRpY2VzLmhhcyhpKSkge1xuICAgICAgICAgICAgICBuZXdUZXh0dXJlU2xvdEluZGV4ID0gaTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChuZXdUZXh0dXJlU2xvdEluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgTG9nZ2VyLmRlZmF1bHQud2FybihcbiAgICAgICAgICAgICAgYEFsbCB0ZXh0dXJlIHNsb3RzICgxLTMxKSBhcmUgb2NjdXBpZWQuIENhbm5vdCBhc3NpZ24gYSB2YWxpZCBzbG90IGZvciBzZW1hbnRpYyBcIiR7aW5mby5zZW1hbnRpY31cIi4gVGhpcyBtYXkgY2F1c2UgcmVuZGVyaW5nIGlzc3Vlcy5gXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpbmZvLmluaXRpYWxWYWx1ZVswXSA9IG5ld1RleHR1cmVTbG90SW5kZXg7XG4gICAgICAgICAgZXhpc3RpbmdUZXh0dXJlU2xvdEluZGljZXMuYWRkKG5ld1RleHR1cmVTbG90SW5kZXgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLl9fc2VtYW50aWNzID0gaW5mb0FycmF5O1xuICAgIHRoaXMubWFrZU1hdGVyaWFsU2VtYW50aWNzVmFyaWFudE5hbWUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHVwIGJhc2ljIHJlbmRlcmluZyBpbmZvcm1hdGlvbiBpbmNsdWRpbmcgbWF0cmljZXMsIGNhbWVyYSwgYW5kIGxpZ2h0aW5nLlxuICAgKiBAcGFyYW0gYXJncyAtIFdlYkdMIHJlbmRlcmluZyBhcmd1bWVudHNcbiAgICogQHBhcmFtIHNoYWRlclByb2dyYW0gLSBUaGUgV2ViR0wgc2hhZGVyIHByb2dyYW1cbiAgICogQHBhcmFtIGZpcnN0VGltZSAtIFdoZXRoZXIgdGhpcyBpcyB0aGUgZmlyc3QgdGltZSBzZXR1cFxuICAgKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgbWF0ZXJpYWwgaW5zdGFuY2VcbiAgICogQHBhcmFtIENhbWVyYUNvbXBvbmVudENsYXNzIC0gVGhlIGNhbWVyYSBjb21wb25lbnQgY2xhc3NcbiAgICovXG4gIHByb3RlY3RlZCBzZXR1cEJhc2ljSW5mbyhcbiAgICBfZW5naW5lOiBFbmdpbmUsXG4gICAgYXJnczogUmVuZGVyaW5nQXJnV2ViR0wsXG4gICAgc2hhZGVyUHJvZ3JhbTogV2ViR0xQcm9ncmFtLFxuICAgIF9maXJzdFRpbWU6IGJvb2xlYW4sXG4gICAgX21hdGVyaWFsOiBNYXRlcmlhbCxcbiAgICBfQ2FtZXJhQ29tcG9uZW50Q2xhc3M6IHR5cGVvZiBDYW1lcmFDb21wb25lbnRcbiAgKSB7XG4gICAgLy8gTW9ycGhcbiAgICBjb25zdCBibGVuZFNoYXBlQ29tcG9uZW50ID0gYXJncy5lbnRpdHkudHJ5VG9HZXRCbGVuZFNoYXBlKCk7XG4gICAgdGhpcy5zZXRNb3JwaEluZm8oc2hhZGVyUHJvZ3JhbSwgYXJncy5lbnRpdHkuZ2V0TWVzaCgpLCBhcmdzLnByaW1pdGl2ZSwgYmxlbmRTaGFwZUNvbXBvbmVudCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgd29ybGQgdHJhbnNmb3JtYXRpb24gbWF0cml4IHVuaWZvcm0gaW4gdGhlIHNoYWRlci5cbiAgICogQHBhcmFtIHNoYWRlclByb2dyYW0gLSBUaGUgV2ViR0wgc2hhZGVyIHByb2dyYW1cbiAgICogQHBhcmFtIHdvcmxkTWF0cml4IC0gVGhlIHdvcmxkIHRyYW5zZm9ybWF0aW9uIG1hdHJpeFxuICAgKi9cbiAgcHJvdGVjdGVkIHNldFdvcmxkTWF0cml4KHNoYWRlclByb2dyYW06IFdlYkdMUHJvZ3JhbSwgd29ybGRNYXRyaXg6IE1hdHJpeDQ0KSB7XG4gICAgKHNoYWRlclByb2dyYW0gYXMgYW55KS5fZ2wudW5pZm9ybU1hdHJpeDRmdigoc2hhZGVyUHJvZ3JhbSBhcyBhbnkpLndvcmxkTWF0cml4LCBmYWxzZSwgd29ybGRNYXRyaXguX3YpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIG5vcm1hbCB0cmFuc2Zvcm1hdGlvbiBtYXRyaXggdW5pZm9ybSBpbiB0aGUgc2hhZGVyLlxuICAgKiBAcGFyYW0gc2hhZGVyUHJvZ3JhbSAtIFRoZSBXZWJHTCBzaGFkZXIgcHJvZ3JhbVxuICAgKiBAcGFyYW0gbm9ybWFsTWF0cml4IC0gVGhlIG5vcm1hbCB0cmFuc2Zvcm1hdGlvbiBtYXRyaXhcbiAgICovXG4gIHByb3RlY3RlZCBzZXROb3JtYWxNYXRyaXgoc2hhZGVyUHJvZ3JhbTogV2ViR0xQcm9ncmFtLCBub3JtYWxNYXRyaXg6IElNYXRyaXgzMykge1xuICAgIChzaGFkZXJQcm9ncmFtIGFzIGFueSkuX2dsLnVuaWZvcm1NYXRyaXgzZnYoKHNoYWRlclByb2dyYW0gYXMgYW55KS5ub3JtYWxNYXRyaXgsIGZhbHNlLCBub3JtYWxNYXRyaXguX3YpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGJpbGxib2FyZCBmbGFnIHVuaWZvcm0gaW4gdGhlIHNoYWRlci5cbiAgICogQHBhcmFtIHNoYWRlclByb2dyYW0gLSBUaGUgV2ViR0wgc2hhZGVyIHByb2dyYW1cbiAgICogQHBhcmFtIGlzQmlsbGJvYXJkIC0gV2hldGhlciB0aGUgb2JqZWN0IHNob3VsZCBiZSByZW5kZXJlZCBhcyBhIGJpbGxib2FyZFxuICAgKi9cbiAgcHJvdGVjdGVkIHNldElzQmlsbGJvYXJkKHNoYWRlclByb2dyYW06IFdlYkdMUHJvZ3JhbSwgaXNCaWxsYm9hcmQ6IGJvb2xlYW4pIHtcbiAgICAoc2hhZGVyUHJvZ3JhbSBhcyBhbnkpLl9nbC51bmlmb3JtMWkoKHNoYWRlclByb2dyYW0gYXMgYW55KS5pc0JpbGxib2FyZCwgaXNCaWxsYm9hcmQgPyAxIDogMCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdmlzaWJpbGl0eSBmbGFnIHVuaWZvcm0gaW4gdGhlIHNoYWRlci5cbiAgICogQHBhcmFtIHNoYWRlclByb2dyYW0gLSBUaGUgV2ViR0wgc2hhZGVyIHByb2dyYW1cbiAgICogQHBhcmFtIGlzVmlzaWJsZSAtIFdoZXRoZXIgdGhlIG9iamVjdCBzaG91bGQgYmUgcmVuZGVyZWRcbiAgICovXG4gIHByb3RlY3RlZCBzZXRJc1Zpc2libGUoc2hhZGVyUHJvZ3JhbTogV2ViR0xQcm9ncmFtLCBpc1Zpc2libGU6IGJvb2xlYW4pIHtcbiAgICAoc2hhZGVyUHJvZ3JhbSBhcyBhbnkpLl9nbC51bmlmb3JtMWkoKHNoYWRlclByb2dyYW0gYXMgYW55KS5pc1Zpc2libGUsIGlzVmlzaWJsZSA/IDEgOiAwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHZpZXctcmVsYXRlZCB1bmlmb3JtcyBpbmNsdWRpbmcgdmlldyBtYXRyaXggYW5kIGNhbWVyYSBwb3NpdGlvbi5cbiAgICogQHBhcmFtIHNoYWRlclByb2dyYW0gLSBUaGUgV2ViR0wgc2hhZGVyIHByb2dyYW1cbiAgICogQHBhcmFtIGNhbWVyYUNvbXBvbmVudCAtIFRoZSBjYW1lcmEgY29tcG9uZW50XG4gICAqIEBwYXJhbSBpc1ZyIC0gV2hldGhlciByZW5kZXJpbmcgaW4gVlIgbW9kZVxuICAgKiBAcGFyYW0gZGlzcGxheUlkeCAtIFRoZSBkaXNwbGF5IGluZGV4IGZvciBWUiByZW5kZXJpbmdcbiAgICovXG4gIHB1YmxpYyBzZXRWaWV3SW5mbyhzaGFkZXJQcm9ncmFtOiBXZWJHTFByb2dyYW0sIGNhbWVyYUNvbXBvbmVudDogQ2FtZXJhQ29tcG9uZW50LCBpc1ZyOiBib29sZWFuLCBkaXNwbGF5SWR4OiBudW1iZXIpIHtcbiAgICBsZXQgdmlld01hdHJpeDogTWF0cml4NDQ7XG4gICAgbGV0IGNhbWVyYVBvc2l0aW9uOiBJVmVjdG9yMztcbiAgICBpZiAoaXNWcikge1xuICAgICAgY29uc3Qgd2VieHJTeXN0ZW0gPSBjYW1lcmFDb21wb25lbnQuZW50aXR5LmVuZ2luZS5fd2ViWFJTeXN0ZW1JZkVuYWJsZWQ7XG4gICAgICBpZiAod2VieHJTeXN0ZW0/LmlzV2ViWFJNb2RlKSB7XG4gICAgICAgIHZpZXdNYXRyaXggPSB3ZWJ4clN5c3RlbS5fZ2V0Vmlld01hdHJpeEF0KGRpc3BsYXlJZHgpO1xuICAgICAgICBjYW1lcmFQb3NpdGlvbiA9IHdlYnhyU3lzdGVtLl9nZXRDYW1lcmFXb3JsZFBvc2l0aW9uQXQoZGlzcGxheUlkeCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChjYW1lcmFDb21wb25lbnQpIHtcbiAgICAgIGNhbWVyYVBvc2l0aW9uID0gY2FtZXJhQ29tcG9uZW50LndvcmxkUG9zaXRpb247XG4gICAgICB2aWV3TWF0cml4ID0gY2FtZXJhQ29tcG9uZW50LnZpZXdNYXRyaXg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZpZXdNYXRyaXggPSBNdXRhYmxlTWF0cml4NDQuaWRlbnRpdHkoKTtcbiAgICAgIGNhbWVyYVBvc2l0aW9uID0gVmVjdG9yMy5mcm9tQ29weUFycmF5KFswLCAwLCAxMF0pO1xuICAgIH1cblxuICAgIChzaGFkZXJQcm9ncmFtIGFzIGFueSkuX2dsLnVuaWZvcm1NYXRyaXg0ZnYoKHNoYWRlclByb2dyYW0gYXMgYW55KS52aWV3TWF0cml4LCBmYWxzZSwgdmlld01hdHJpeCEuX3YpO1xuICAgIChzaGFkZXJQcm9ncmFtIGFzIGFueSkuX2dsLnVuaWZvcm0zZnYoKHNoYWRlclByb2dyYW0gYXMgYW55KS52aWV3UG9zaXRpb24sIGNhbWVyYVBvc2l0aW9uIS5fdik7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgcHJvamVjdGlvbiBtYXRyaXggdW5pZm9ybSBpbiB0aGUgc2hhZGVyLlxuICAgKiBAcGFyYW0gc2hhZGVyUHJvZ3JhbSAtIFRoZSBXZWJHTCBzaGFkZXIgcHJvZ3JhbVxuICAgKiBAcGFyYW0gY2FtZXJhQ29tcG9uZW50IC0gVGhlIGNhbWVyYSBjb21wb25lbnRcbiAgICogQHBhcmFtIGlzVnIgLSBXaGV0aGVyIHJlbmRlcmluZyBpbiBWUiBtb2RlXG4gICAqIEBwYXJhbSBkaXNwbGF5SWR4IC0gVGhlIGRpc3BsYXkgaW5kZXggZm9yIFZSIHJlbmRlcmluZ1xuICAgKi9cbiAgcHVibGljIHNldFByb2plY3Rpb24oXG4gICAgc2hhZGVyUHJvZ3JhbTogV2ViR0xQcm9ncmFtLFxuICAgIGNhbWVyYUNvbXBvbmVudDogQ2FtZXJhQ29tcG9uZW50LFxuICAgIGlzVnI6IGJvb2xlYW4sXG4gICAgZGlzcGxheUlkeDogbnVtYmVyXG4gICkge1xuICAgIGxldCBwcm9qZWN0aW9uTWF0cml4OiBNYXRyaXg0NDtcbiAgICBpZiAoaXNWcikge1xuICAgICAgY29uc3Qgd2VieHJTeXN0ZW0gPSBjYW1lcmFDb21wb25lbnQuZW50aXR5LmVuZ2luZS5fd2ViWFJTeXN0ZW1JZkVuYWJsZWQ7XG4gICAgICBpZiAod2VieHJTeXN0ZW0/LmlzV2ViWFJNb2RlKSB7XG4gICAgICAgIHByb2plY3Rpb25NYXRyaXggPSB3ZWJ4clN5c3RlbS5fZ2V0UHJvamVjdE1hdHJpeEF0KGRpc3BsYXlJZHgpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoY2FtZXJhQ29tcG9uZW50KSB7XG4gICAgICBwcm9qZWN0aW9uTWF0cml4ID0gY2FtZXJhQ29tcG9uZW50LnByb2plY3Rpb25NYXRyaXg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHByb2plY3Rpb25NYXRyaXggPSBNdXRhYmxlTWF0cml4NDQuaWRlbnRpdHkoKTtcbiAgICB9XG4gICAgKHNoYWRlclByb2dyYW0gYXMgYW55KS5fZ2wudW5pZm9ybU1hdHJpeDRmdigoc2hhZGVyUHJvZ3JhbSBhcyBhbnkpLnByb2plY3Rpb25NYXRyaXgsIGZhbHNlLCBwcm9qZWN0aW9uTWF0cml4IS5fdik7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBtb3JwaCB0YXJnZXQgYW5pbWF0aW9uIHVuaWZvcm1zIGluIHRoZSBzaGFkZXIuXG4gICAqIEBwYXJhbSBzaGFkZXJQcm9ncmFtIC0gVGhlIFdlYkdMIHNoYWRlciBwcm9ncmFtXG4gICAqIEBwYXJhbSBtZXNoQ29tcG9uZW50IC0gVGhlIG1lc2ggY29tcG9uZW50XG4gICAqIEBwYXJhbSBwcmltaXRpdmUgLSBUaGUgcHJpbWl0aXZlIGNvbnRhaW5pbmcgbW9ycGggdGFyZ2V0c1xuICAgKiBAcGFyYW0gYmxlbmRTaGFwZUNvbXBvbmVudCAtIFRoZSBibGVuZCBzaGFwZSBjb21wb25lbnQgY29udGFpbmluZyB3ZWlnaHRzXG4gICAqL1xuICBzZXRNb3JwaEluZm8oXG4gICAgc2hhZGVyUHJvZ3JhbTogV2ViR0xQcm9ncmFtLFxuICAgIF9tZXNoQ29tcG9uZW50OiBNZXNoQ29tcG9uZW50LFxuICAgIHByaW1pdGl2ZTogUHJpbWl0aXZlLFxuICAgIF9ibGVuZFNoYXBlQ29tcG9uZW50PzogQmxlbmRTaGFwZUNvbXBvbmVudFxuICApIHtcbiAgICBpZiAoIXRoaXMuX19pc01vcnBoaW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChwcmltaXRpdmUudGFyZ2V0cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwcmltaXRpdmVJZHggPSAocHJpbWl0aXZlLmNvbnN0cnVjdG9yIGFzIHR5cGVvZiBQcmltaXRpdmUpLmdldFByaW1pdGl2ZUlkeEhhc01vcnBoKHByaW1pdGl2ZS5wcmltaXRpdmVVaWQpITtcbiAgICAoc2hhZGVyUHJvZ3JhbSBhcyBhbnkpLl9nbC51bmlmb3JtMWkoKHNoYWRlclByb2dyYW0gYXMgYW55KS5jdXJyZW50UHJpbWl0aXZlSWR4LCBwcmltaXRpdmVJZHgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgaW50ZXJuYWwgc2V0dGluZyBwYXJhbWV0ZXJzIHRvIEdQVSBmb3IgV2ViR0wgcGVyIHNoYWRlciBwcm9ncmFtLlxuICAgKiBUaGlzIG1ldGhvZCBzaG91bGQgYmUgb3ZlcnJpZGRlbiBieSBkZXJpdmVkIGNsYXNzZXMgdG8gcHJvdmlkZSBzcGVjaWZpYyBwYXJhbWV0ZXIgaGFuZGxpbmcuXG4gICAqIEBwYXJhbSBwYXJhbXMgLSBPYmplY3QgY29udGFpbmluZyBtYXRlcmlhbCwgc2hhZGVyIHByb2dyYW0sIGZpcnN0VGltZSBmbGFnLCBhbmQgcmVuZGVyaW5nIGFyZ3VtZW50c1xuICAgKi9cbiAgX3NldEludGVybmFsU2V0dGluZ1BhcmFtZXRlcnNUb0dwdVdlYkdMUGVyU2hhZGVyUHJvZ3JhbShfcGFyYW1zOiB7fSkge31cblxuICAvKipcbiAgICogU2V0cyBpbnRlcm5hbCBzZXR0aW5nIHBhcmFtZXRlcnMgdG8gR1BVIGZvciBXZWJHTCBwZXIgbWF0ZXJpYWwuXG4gICAqIFRoaXMgbWV0aG9kIHNob3VsZCBiZSBvdmVycmlkZGVuIGJ5IGRlcml2ZWQgY2xhc3NlcyB0byBwcm92aWRlIHNwZWNpZmljIHBhcmFtZXRlciBoYW5kbGluZy5cbiAgICogQHBhcmFtIHBhcmFtcyAtIE9iamVjdCBjb250YWluaW5nIG1hdGVyaWFsLCBzaGFkZXIgcHJvZ3JhbSwgZmlyc3RUaW1lIGZsYWcsIGFuZCByZW5kZXJpbmcgYXJndW1lbnRzXG4gICAqL1xuICBfc2V0SW50ZXJuYWxTZXR0aW5nUGFyYW1ldGVyc1RvR3B1V2ViR0xQZXJNYXRlcmlhbChfcGFyYW1zOiB7fSkge31cblxuICAvKipcbiAgICogU2V0cyBpbnRlcm5hbCBzZXR0aW5nIHBhcmFtZXRlcnMgdG8gR1BVIGZvciBXZWJHTCBwZXIgcHJpbWl0aXZlLlxuICAgKiBUaGlzIG1ldGhvZCBzaG91bGQgYmUgb3ZlcnJpZGRlbiBieSBkZXJpdmVkIGNsYXNzZXMgdG8gcHJvdmlkZSBzcGVjaWZpYyBwYXJhbWV0ZXIgaGFuZGxpbmcuXG4gICAqIEBwYXJhbSBwYXJhbXMgLSBPYmplY3QgY29udGFpbmluZyBtYXRlcmlhbCwgc2hhZGVyIHByb2dyYW0sIGZpcnN0VGltZSBmbGFnLCBhbmQgcmVuZGVyaW5nIGFyZ3VtZW50c1xuICAgKi9cbiAgX3NldEludGVybmFsU2V0dGluZ1BhcmFtZXRlcnNUb0dwdVdlYkdMUGVyUHJpbWl0aXZlKF9wYXJhbXM6IHt9KSB7fVxuXG4gIC8qKlxuICAgKiBTZXRzIGludGVybmFsIHNldHRpbmcgcGFyYW1ldGVycyB0byBHUFUgZm9yIFdlYkdQVS5cbiAgICogVGhpcyBtZXRob2Qgc2hvdWxkIGJlIG92ZXJyaWRkZW4gYnkgZGVyaXZlZCBjbGFzc2VzIHRvIHByb3ZpZGUgc3BlY2lmaWMgcGFyYW1ldGVyIGhhbmRsaW5nLlxuICAgKiBAcGFyYW0gcGFyYW1zIC0gT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgYW5kIFdlYkdQVSByZW5kZXJpbmcgYXJndW1lbnRzXG4gICAqL1xuICBfc2V0SW50ZXJuYWxTZXR0aW5nUGFyYW1ldGVyc1RvR3B1V2ViR3B1KF9wYXJhbXM6IHt9KSB7fVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBzaGFkZXIgZGVmaW5pdGlvbiBzdHJpbmcgZm9yIHRoaXMgbWF0ZXJpYWwuXG4gICAqIFRoaXMgbWV0aG9kIHNob3VsZCBiZSBvdmVycmlkZGVuIGJ5IGRlcml2ZWQgY2xhc3NlcyB0byBwcm92aWRlIHNwZWNpZmljIGRlZmluaXRpb25zLlxuICAgKiBAcmV0dXJucyBFbXB0eSBzdHJpbmcgYnkgZGVmYXVsdFxuICAgKi9cbiAgZ2V0RGVmaW5pdGlvbigpIHtcbiAgICByZXR1cm4gJyc7XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybXMgc2hhZGVyIHJlZmxlY3Rpb24gdG8gZXh0cmFjdCBzZW1hbnRpY3MgaW5mb3JtYXRpb24gZnJvbSB2ZXJ0ZXggYW5kIHBpeGVsIHNoYWRlcnMuXG4gICAqIEBwYXJhbSB2ZXJ0ZXhTaGFkZXIgLSBUaGUgdmVydGV4IHNoYWRlciBvYmplY3QgZm9yIFdlYkdMXG4gICAqIEBwYXJhbSBwaXhlbFNoYWRlciAtIFRoZSBwaXhlbCBzaGFkZXIgb2JqZWN0IGZvciBXZWJHTFxuICAgKiBAcGFyYW0gdmVydGV4U2hhZGVyV2ViR3B1IC0gVGhlIHZlcnRleCBzaGFkZXIgb2JqZWN0IGZvciBXZWJHUFVcbiAgICogQHBhcmFtIHBpeGVsU2hhZGVyV2ViR3B1IC0gVGhlIHBpeGVsIHNoYWRlciBvYmplY3QgZm9yIFdlYkdQVVxuICAgKiBAcGFyYW0gZGVmaW5pdGlvbnMgLSBBcnJheSBvZiBzaGFkZXIgZGVmaW5pdGlvbnNcbiAgICogQHJldHVybnMgQXJyYXkgb2Ygc2hhZGVyIHNlbWFudGljcyBpbmZvcm1hdGlvblxuICAgKi9cbiAgcHJvdGVjdGVkIGRvU2hhZGVyUmVmbGVjdGlvbihcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICB2ZXJ0ZXhTaGFkZXI6IFNoYWRlcml0eU9iamVjdCxcbiAgICBwaXhlbFNoYWRlcjogU2hhZGVyaXR5T2JqZWN0LFxuICAgIHZlcnRleFNoYWRlcldlYkdwdTogU2hhZGVyaXR5T2JqZWN0LFxuICAgIHBpeGVsU2hhZGVyV2ViR3B1OiBTaGFkZXJpdHlPYmplY3QsXG4gICAgZGVmaW5pdGlvbnM6IHN0cmluZ1tdXG4gICkge1xuICAgIC8vIFN0b3JlIHRoZSBlbmdpbmUgcmVmZXJlbmNlIGZvciB0aGlzIG1hdGVyaWFsIGNvbnRlbnRcbiAgICB0aGlzLl9lbmdpbmUgPSBlbmdpbmU7XG5cbiAgICBjb25zdCBkZWZpbml0aW9uc1N0ciA9IGRlZmluaXRpb25zLmpvaW4oJycpO1xuICAgIGNvbnN0IHJlZmxlY3RlZE1hcCA9IEFic3RyYWN0TWF0ZXJpYWxDb250ZW50Ll9fZ2V0UmVmbGVjdGVkU2hhZGVyU2VtYW50aWNzSW5mb0FycmF5TWFwKGVuZ2luZS5vYmplY3RVSUQpO1xuICAgIGNvbnN0IHJlZmxlY3RlZFNoYWRlclNlbWFudGljc0luZm9BcnJheSA9IHJlZmxlY3RlZE1hcC5nZXQodGhpcy5fX21hdGVyaWFsTmFtZSArIGRlZmluaXRpb25zU3RyKTtcbiAgICBpZiAocmVmbGVjdGVkU2hhZGVyU2VtYW50aWNzSW5mb0FycmF5ICE9IG51bGwpIHtcbiAgICAgIHJldHVybiByZWZsZWN0ZWRTaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXkuY29uY2F0KCk7XG4gICAgfVxuXG4gICAgbGV0IHByZXByb2Nlc3NlZFZlcnRleFNoYWRlckRhdGE6IHtcbiAgICAgIHNoYWRlclNlbWFudGljc0luZm9BcnJheTogU2hhZGVyU2VtYW50aWNzSW5mb1tdO1xuICAgICAgc2hhZGVyaXR5T2JqZWN0OiBTaGFkZXJpdHlPYmplY3Q7XG4gICAgfTtcbiAgICBsZXQgcHJlcHJvY2Vzc2VkUGl4ZWxTaGFkZXJEYXRhOiB7XG4gICAgICBzaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXk6IFNoYWRlclNlbWFudGljc0luZm9bXTtcbiAgICAgIHNoYWRlcml0eU9iamVjdDogU2hhZGVyaXR5T2JqZWN0O1xuICAgIH07XG4gICAgaWYgKGVuZ2luZS5wcm9jZXNzQXBwcm9hY2ggPT09IFByb2Nlc3NBcHByb2FjaC5XZWJHUFUpIHtcbiAgICAgIGNvbnN0IHByZXByb2Nlc3NlZFZlcnRleFNoYWRlciA9IFNoYWRlcml0eS5wcm9jZXNzUHJhZ21hKHZlcnRleFNoYWRlcldlYkdwdSEsIGZhbHNlLCBkZWZpbml0aW9ucyk7XG4gICAgICBjb25zdCBwcmVwcm9jZXNzZWRQaXhlbFNoYWRlciA9IFNoYWRlcml0eS5wcm9jZXNzUHJhZ21hKHBpeGVsU2hhZGVyV2ViR3B1ISwgZmFsc2UsIGRlZmluaXRpb25zKTtcblxuICAgICAgcHJlcHJvY2Vzc2VkVmVydGV4U2hhZGVyRGF0YSA9IFNoYWRlcml0eVV0aWxpdHlXZWJHUFUuZ2V0U2hhZGVyRGF0YVJlZmxlY3Rpb24oZW5naW5lLCBwcmVwcm9jZXNzZWRWZXJ0ZXhTaGFkZXIpO1xuICAgICAgcHJlcHJvY2Vzc2VkUGl4ZWxTaGFkZXJEYXRhID0gU2hhZGVyaXR5VXRpbGl0eVdlYkdQVS5nZXRTaGFkZXJEYXRhUmVmbGVjdGlvbihlbmdpbmUsIHByZXByb2Nlc3NlZFBpeGVsU2hhZGVyKTtcbiAgICAgIGNvbnN0IHZlcnRleFNoYWRlckRhdGEgPSBTaGFkZXJpdHlVdGlsaXR5V2ViR1BVLmdldFNoYWRlckRhdGFSZWZsZWN0aW9uKGVuZ2luZSwgdmVydGV4U2hhZGVyV2ViR3B1ISk7XG4gICAgICBjb25zdCBwaXhlbFNoYWRlckRhdGEgPSBTaGFkZXJpdHlVdGlsaXR5V2ViR1BVLmdldFNoYWRlckRhdGFSZWZsZWN0aW9uKGVuZ2luZSwgcGl4ZWxTaGFkZXJXZWJHcHUhKTtcblxuICAgICAgdGhpcy5zZXRWZXJ0ZXhTaGFkZXJpdHlPYmplY3QodmVydGV4U2hhZGVyRGF0YS5zaGFkZXJpdHlPYmplY3QsIGVuZ2luZSk7XG4gICAgICB0aGlzLnNldFBpeGVsU2hhZGVyaXR5T2JqZWN0KHBpeGVsU2hhZGVyRGF0YS5zaGFkZXJpdHlPYmplY3QsIGVuZ2luZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHByZXByb2Nlc3NlZFZlcnRleFNoYWRlciA9IFNoYWRlcml0eS5wcm9jZXNzUHJhZ21hKHZlcnRleFNoYWRlciwgdHJ1ZSwgZGVmaW5pdGlvbnMpO1xuICAgICAgY29uc3QgcHJlcHJvY2Vzc2VkUGl4ZWxTaGFkZXIgPSBTaGFkZXJpdHkucHJvY2Vzc1ByYWdtYShwaXhlbFNoYWRlciwgdHJ1ZSwgZGVmaW5pdGlvbnMpO1xuXG4gICAgICBwcmVwcm9jZXNzZWRWZXJ0ZXhTaGFkZXJEYXRhID0gU2hhZGVyaXR5VXRpbGl0eVdlYkdMLmdldFNoYWRlckRhdGFSZWZsZWN0aW9uKGVuZ2luZSwgcHJlcHJvY2Vzc2VkVmVydGV4U2hhZGVyKTtcbiAgICAgIHByZXByb2Nlc3NlZFBpeGVsU2hhZGVyRGF0YSA9IFNoYWRlcml0eVV0aWxpdHlXZWJHTC5nZXRTaGFkZXJEYXRhUmVmbGVjdGlvbihlbmdpbmUsIHByZXByb2Nlc3NlZFBpeGVsU2hhZGVyKTtcblxuICAgICAgY29uc3QgdmVydGV4U2hhZGVyRGF0YSA9IFNoYWRlcml0eVV0aWxpdHlXZWJHTC5nZXRTaGFkZXJEYXRhUmVmbGVjdGlvbihlbmdpbmUsIHZlcnRleFNoYWRlcik7XG4gICAgICBjb25zdCBwaXhlbFNoYWRlckRhdGEgPSBTaGFkZXJpdHlVdGlsaXR5V2ViR0wuZ2V0U2hhZGVyRGF0YVJlZmxlY3Rpb24oZW5naW5lLCBwaXhlbFNoYWRlcik7XG5cbiAgICAgIHRoaXMuc2V0VmVydGV4U2hhZGVyaXR5T2JqZWN0KHZlcnRleFNoYWRlckRhdGEuc2hhZGVyaXR5T2JqZWN0LCBlbmdpbmUpO1xuICAgICAgdGhpcy5zZXRQaXhlbFNoYWRlcml0eU9iamVjdChwaXhlbFNoYWRlckRhdGEuc2hhZGVyaXR5T2JqZWN0LCBlbmdpbmUpO1xuICAgIH1cblxuICAgIGNvbnN0IHNoYWRlclNlbWFudGljc0luZm9BcnJheTogU2hhZGVyU2VtYW50aWNzSW5mb1tdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IHZlcnRleFNoYWRlclNlbWFudGljc0luZm8gb2YgcHJlcHJvY2Vzc2VkVmVydGV4U2hhZGVyRGF0YS5zaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXkpIHtcbiAgICAgIHZlcnRleFNoYWRlclNlbWFudGljc0luZm8uc3RhZ2UgPSBTaGFkZXJUeXBlLlZlcnRleFNoYWRlcjtcbiAgICAgIHNoYWRlclNlbWFudGljc0luZm9BcnJheS5wdXNoKHZlcnRleFNoYWRlclNlbWFudGljc0luZm8pO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IHBpeGVsU2hhZGVyU2VtYW50aWNzSW5mbyBvZiBwcmVwcm9jZXNzZWRQaXhlbFNoYWRlckRhdGEuc2hhZGVyU2VtYW50aWNzSW5mb0FycmF5KSB7XG4gICAgICBjb25zdCBmb3VuZFNoYWRlclNlbWFudGljc0luZm8gPSBzaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXkuZmluZCgodmVydGV4SW5mbzogU2hhZGVyU2VtYW50aWNzSW5mbykgPT4ge1xuICAgICAgICBpZiAodmVydGV4SW5mby5zZW1hbnRpYyA9PT0gcGl4ZWxTaGFkZXJTZW1hbnRpY3NJbmZvLnNlbWFudGljKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSk7XG4gICAgICBpZiAoZm91bmRTaGFkZXJTZW1hbnRpY3NJbmZvKSB7XG4gICAgICAgIGZvdW5kU2hhZGVyU2VtYW50aWNzSW5mby5zdGFnZSA9IFNoYWRlclR5cGUuVmVydGV4QW5kUGl4ZWxTaGFkZXI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwaXhlbFNoYWRlclNlbWFudGljc0luZm8uc3RhZ2UgPSBTaGFkZXJUeXBlLlBpeGVsU2hhZGVyO1xuICAgICAgICBzaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXkucHVzaChwaXhlbFNoYWRlclNlbWFudGljc0luZm8pO1xuICAgICAgfVxuICAgIH1cbiAgICByZWZsZWN0ZWRNYXAuc2V0KHRoaXMuX19tYXRlcmlhbE5hbWUgKyBkZWZpbml0aW9uc1N0ciwgc2hhZGVyU2VtYW50aWNzSW5mb0FycmF5KTtcblxuICAgIHJldHVybiBzaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXkuY29uY2F0KCk7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYW5zIHVwIHN0YXRpYyBjYWNoZXMgZm9yIGEgc3BlY2lmaWMgRW5naW5lIGluc3RhbmNlLlxuICAgKiBUaGlzIHNob3VsZCBiZSBjYWxsZWQgd2hlbiB0aGUgRW5naW5lIGlzIGRlc3Ryb3llZCB0byBwcmV2ZW50IHN0YWxlIHJlZmVyZW5jZXMuXG4gICAqXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgRW5naW5lIGluc3RhbmNlIGJlaW5nIGRlc3Ryb3llZFxuICAgKiBAaW50ZXJuYWwgQ2FsbGVkIGZyb20gRW5naW5lLmRlc3Ryb3koKVxuICAgKi9cbiAgc3RhdGljIF9jbGVhbnVwRm9yRW5naW5lKGVuZ2luZTogRW5naW5lKTogdm9pZCB7XG4gICAgQWJzdHJhY3RNYXRlcmlhbENvbnRlbnQuX192ZXJ0ZXhTaGFkZXJpdHlPYmplY3RNYXBQZXJFbmdpbmUuZGVsZXRlKGVuZ2luZS5vYmplY3RVSUQpO1xuICAgIEFic3RyYWN0TWF0ZXJpYWxDb250ZW50Ll9fcGl4ZWxTaGFkZXJpdHlPYmplY3RNYXBQZXJFbmdpbmUuZGVsZXRlKGVuZ2luZS5vYmplY3RVSUQpO1xuICAgIEFic3RyYWN0TWF0ZXJpYWxDb250ZW50Ll9fcmVmbGVjdGVkU2hhZGVyU2VtYW50aWNzSW5mb0FycmF5TWFwUGVyRW5naW5lLmRlbGV0ZShlbmdpbmUub2JqZWN0VUlEKTtcblxuICAgIC8vIE5vdGU6IFdlIGRvbid0IHJlc2V0IF9fbWF0ZXJpYWxDb250ZW50Q291bnQgYXMgVUlEcyBzaG91bGQgcmVtYWluIHVuaXF1ZSBhY3Jvc3MgZW5naW5lIGluc3RhbmNlc1xuICAgIC8vIE5vdGU6IFdlIGRvbid0IGNsZWFyIG1hdGVyaWFsTm9kZXMgYXMgdGhleSBtYXkgc3RpbGwgYmUgcmVmZXJlbmNlZFxuICAgIC8vIE5vdGU6IExpZ2h0IGFycmF5cyBhbmQgdG1wIHZlY3RvcnMgYXJlIGp1c3QgcmV1c2FibGUgYnVmZmVycywgbm8gbmVlZCB0byBjbGVhclxuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQUEsT0FBTyxxQkFBK0M7QUFLdEQsU0FBUyxnQkFBZ0I7QUFDekIsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyx1QkFBdUI7QUFFaEMsU0FBUyxrQkFBdUM7QUFLaEQsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyxzQkFBc0I7QUFDL0IsU0FBUyxzQkFBc0I7QUFDL0IsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsY0FBYztBQUd2QixTQUFTLDZCQUE2QjtBQUN0QyxTQUFTLDhCQUE4QjtBQUV2QyxJQUFNLFlBQWEsZ0JBQXdCLFdBQVc7QUFRL0MsSUFBZSwyQkFBZixNQUFlLGlDQUFnQyxTQUFTO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBd0Y3RCxZQUNFLGNBQ0EsRUFBRSxhQUFhLE9BQU8sYUFBYSxPQUFPLGFBQWEsTUFBTSxJQUFJ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Qix3QkFBd0IsUUFBUSx3QkFBd0I7QUFDN0csb0NBQThCLHNCQUFzQix3QkFBd0IsUUFBUSx1QkFBdUI7QUFFM0csWUFBTSxtQkFBbUIsc0JBQXNCLHdCQUF3QixRQUFRLFlBQVk7QUFDM0YsWUFBTSxrQkFBa0Isc0JBQXNCLHdCQUF3QixRQUFRLFdBQVc7QUFFekYsV0FBSyx5QkFBeUIsaUJBQWlCLGlCQUFpQixNQUFNO0FBQ3RFLFdBQUssd0JBQXdCLGdCQUFnQixpQkFBaUIsTUFBTTtBQUFBLElBQ3RFO0FBRUEsVUFBTSwyQkFBa0QsQ0FBQztBQUV6RCxlQUFXLDZCQUE2Qiw2QkFBNkIsMEJBQTBCO0FBQzdGLGdDQUEwQixRQUFRLFdBQVc7QUFDN0MsK0JBQXlCLEtBQUsseUJBQXlCO0FBQUEsSUFDekQ7QUFDQSxlQUFXLDRCQUE0Qiw0QkFBNEIsMEJBQTBCO0FBQzNGLFlBQU0sMkJBQTJCLHlCQUF5QixLQUFLLENBQUMsZUFBb0M7QUFDbEcsWUFBSSxXQUFXLGFBQWEseUJBQXlCLFVBQVU7QUFDN0QsaUJBQU87QUFBQSxRQUNUO0FBQ0EsZUFBTztBQUFBLE1BQ1QsQ0FBQztBQUNELFVBQUksMEJBQTBCO0FBQzVCLGlDQUF5QixRQUFRLFdBQVc7QUFBQSxNQUM5QyxPQUFPO0FBQ0wsaUNBQXlCLFFBQVEsV0FBVztBQUM1QyxpQ0FBeUIsS0FBSyx3QkFBd0I7QUFBQSxNQUN4RDtBQUFBLElBQ0Y7QUFDQSxpQkFBYSxJQUFJLEtBQUssaUJBQWlCLGdCQUFnQix3QkFBd0I7QUFFL0UsV0FBTyx5QkFBeUIsT0FBTztBQUFBLEVBQ3pDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVNBLE9BQU8sa0JBQWtCLFFBQXNCO0FBQzdDLDZCQUF3QixvQ0FBb0MsT0FBTyxPQUFPLFNBQVM7QUFDbkYsNkJBQXdCLG1DQUFtQyxPQUFPLE9BQU8sU0FBUztBQUNsRiw2QkFBd0IsZ0RBQWdELE9BQU8sT0FBTyxTQUFTO0FBQUEsRUFLakc7QUFDRjtBQXhrQnNCLHlCQVdiLGdCQUEyQyxDQUFDO0FBWC9CLHlCQWtCSCxnQkFBZ0IsZUFBZSxLQUFLO0FBbEJqQyx5QkFtQkgsZ0JBQWdCLGVBQWUsS0FBSztBQW5CakMseUJBd0JMLHlCQUF5QjtBQUFBO0FBeEJwQix5QkE0Qkwsc0NBQWlGLG9CQUFJLElBQUk7QUE1QnBGLHlCQTZCTCxxQ0FBZ0Ysb0JBQUksSUFBSTtBQTdCbkYseUJBOEJMLGtEQUNiLG9CQUFJLElBQUk7QUEvQkwsSUFBZSwwQkFBZjsiLAogICJuYW1lcyI6IFtdCn0K
