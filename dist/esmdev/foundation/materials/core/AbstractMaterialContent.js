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
    this.vr = [];
    this.nr = "";
    this.shaderType = ShaderType.VertexAndPixelShader;
    this.Br = "";
    this.zr = "";
    this.ur = materialName;
    if (engine) {
      this._engine = engine;
    }
    this.Jq = isMorphing;
    this.Ar = isSkinning;
    this.fq = isLighting;
    this.Fr = _AbstractMaterialContent.Er++;
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
  static Cr(engineUid) {
    let map = _AbstractMaterialContent.wr.get(engineUid);
    if (!map) {
      map = /* @__PURE__ */ new Map();
      _AbstractMaterialContent.wr.set(engineUid, map);
    }
    return map;
  }
  /**
   * Gets the pixel shaderity object map for a specific engine.
   * Creates the map if it doesn't exist.
   */
  static Dr(engineUid) {
    let map = _AbstractMaterialContent.xr.get(engineUid);
    if (!map) {
      map = /* @__PURE__ */ new Map();
      _AbstractMaterialContent.xr.set(engineUid, map);
    }
    return map;
  }
  /**
   * Gets the reflected shader semantics info map for a specific engine.
   * Creates the map if it doesn't exist.
   */
  static Gr(engineUid) {
    let map = _AbstractMaterialContent.yr.get(engineUid);
    if (!map) {
      map = /* @__PURE__ */ new Map();
      _AbstractMaterialContent.yr.set(engineUid, map);
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
        const map = _AbstractMaterialContent.Cr(engineToUse.objectUID);
        map.set(this.ur, vertexShaderityObject);
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
        const map = _AbstractMaterialContent.Dr(engineToUse.objectUID);
        map.set(this.ur, pixelShaderityObject);
      }
    }
  }
  /**
   * Generates a unique variant name for this material based on its shader semantics.
   * This name is used to differentiate materials with different semantic configurations.
   */
  makeMaterialSemanticsVariantName() {
    let semantics = "";
    for (const semantic of this.vr) {
      semantics += `${semantic.semantic}_`;
    }
    this.zr = `semanticsVariation_${semantics}`;
    this.Br = `${this.ur}_${this.zr}`;
  }
  /**
   * Gets the material semantics variant name for this material.
   * This is the full identifier combining material name and variation identifier.
   * @returns The unique variant name string
   */
  getMaterialSemanticsVariantName() {
    return this.Br;
  }
  /**
   * Gets the material variation identifier (without the base material name).
   * This represents only the parameter variation part of the material type.
   * @returns The variation identifier string
   */
  getMaterialVariationIdentifier() {
    return this.zr;
  }
  /**
   * Gets the base material name (e.g., "PbrUber", "ClassicUber").
   * Double trailing underscores are removed for cleaner display.
   * @returns The base material name string
   */
  getBaseMaterialName() {
    return this.ur.replace(/__$/, "");
  }
  /**
   * Gets the vertex shader object associated with this material.
   * @returns The vertex shader object or undefined if not set
   */
  get vertexShaderityObject() {
    if (this._engine) {
      const map = _AbstractMaterialContent.Cr(this._engine.objectUID);
      return map.get(this.ur);
    }
    return void 0;
  }
  /**
   * Gets the pixel shader object associated with this material.
   * @returns The pixel shader object or undefined if not set
   */
  get pixelShaderityObject() {
    if (this._engine) {
      const map = _AbstractMaterialContent.Dr(this._engine.objectUID);
      return map.get(this.ur);
    }
    return void 0;
  }
  /**
   * Gets the shader definitions string for this material.
   * @returns The definitions string
   */
  getDefinitions() {
    return this.nr;
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
    return this.vr;
  }
  /**
   * Checks if this material supports skeletal animation.
   * @returns True if skinning is enabled
   */
  get isSkinning() {
    return this.Ar;
  }
  /**
   * Checks if this material supports morph target animation.
   * @returns True if morphing is enabled
   */
  get isMorphing() {
    return this.Jq;
  }
  /**
   * Checks if this material supports lighting calculations.
   * @returns True if lighting is enabled
   */
  get isLighting() {
    return this.fq;
  }
  /**
   * Sets the shader semantics information array for this material.
   *
   * A semantic name may arrive more than once: a custom shader can reflect a
   * parameter from its own `// #param` declaration while the material factory
   * declares the same parameter explicitly (for example, the raymarching
   * Uniform nodes). The material's field maps and the buffer view accessors are
   * keyed by the semantic name, so a duplicate leaves a JS-side field pointing
   * at another parameter's memory while the shader reads the first entry's
   * slot, and `setParameter` then updates a value no shader reads. Keep a single
   * definition per semantic: the later definition wins (the explicit factory
   * one over the reflected one) at the position of its first appearance.
   *
   * @param shaderSemanticsInfoArray - Array of shader semantics information to set
   */
  setShaderSemanticsInfoArray(shaderSemanticsInfoArray) {
    const uniqueInfoArray = /* @__PURE__ */ new Map();
    for (const info of shaderSemanticsInfoArray) {
      uniqueInfoArray.set(info.semantic, info);
    }
    const infoArray = [];
    for (const info of uniqueInfoArray.values()) {
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
    this.vr = infoArray;
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
    if (!this.Jq) {
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
    const reflectedMap = _AbstractMaterialContent.Gr(engine.objectUID);
    const reflectedShaderSemanticsInfoArray = reflectedMap.get(this.ur + definitionsStr);
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
    reflectedMap.set(this.ur + definitionsStr, shaderSemanticsInfoArray);
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
    _AbstractMaterialContent.wr.delete(engine.objectUID);
    _AbstractMaterialContent.xr.delete(engine.objectUID);
    _AbstractMaterialContent.yr.delete(engine.objectUID);
  }
};
_AbstractMaterialContent.materialNodes = [];
_AbstractMaterialContent.hr = MutableVector4.zero();
_AbstractMaterialContent.ir = MutableVector2.zero();
_AbstractMaterialContent.Er = 0;
/** Shader caches managed per-Engine. Key is Engine.objectUID */
_AbstractMaterialContent.wr = /* @__PURE__ */ new Map();
_AbstractMaterialContent.xr = /* @__PURE__ */ new Map();
_AbstractMaterialContent.yr = /* @__PURE__ */ new Map();
var AbstractMaterialContent = _AbstractMaterialContent;
export {
  AbstractMaterialContent
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0ZXJpYWxzL2NvcmUvQWJzdHJhY3RNYXRlcmlhbENvbnRlbnQudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCBTaGFkZXJpdHlNb2R1bGUsIHsgdHlwZSBTaGFkZXJpdHlPYmplY3QgfSBmcm9tICdzaGFkZXJpdHknO1xuaW1wb3J0IHR5cGUgeyBSZW5kZXJpbmdBcmdXZWJHTCB9IGZyb20gJy4uLy4uLy4uL3dlYmdsL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB0eXBlIHsgQmxlbmRTaGFwZUNvbXBvbmVudCB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvQmxlbmRTaGFwZS9CbGVuZFNoYXBlQ29tcG9uZW50JztcbmltcG9ydCB0eXBlIHsgQ2FtZXJhQ29tcG9uZW50IH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9DYW1lcmEvQ2FtZXJhQ29tcG9uZW50JztcbmltcG9ydCB0eXBlIHsgTWVzaENvbXBvbmVudCB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvTWVzaC9NZXNoQ29tcG9uZW50JztcbmltcG9ydCB7IFJuT2JqZWN0IH0gZnJvbSAnLi4vLi4vY29yZS9Sbk9iamVjdCc7XG5pbXBvcnQgeyBDb21wb3NpdGlvblR5cGUgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9Db21wb3NpdGlvblR5cGUnO1xuaW1wb3J0IHsgUHJvY2Vzc0FwcHJvYWNoIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvUHJvY2Vzc0FwcHJvYWNoJztcbmltcG9ydCB0eXBlIHsgU2hhZGVyU2VtYW50aWNzSW5mbyB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1NoYWRlclNlbWFudGljc0luZm8nO1xuaW1wb3J0IHsgU2hhZGVyVHlwZSwgdHlwZSBTaGFkZXJUeXBlRW51bSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1NoYWRlclR5cGUnO1xuaW1wb3J0IHR5cGUgeyBQcmltaXRpdmUgfSBmcm9tICcuLi8uLi9nZW9tZXRyeS9QcmltaXRpdmUnO1xuaW1wb3J0IHR5cGUgeyBJTWF0cml4MzMgfSBmcm9tICcuLi8uLi9tYXRoL0lNYXRyaXgnO1xuaW1wb3J0IHR5cGUgeyBJVmVjdG9yMyB9IGZyb20gJy4uLy4uL21hdGgvSVZlY3Rvcic7XG5pbXBvcnQgdHlwZSB7IE1hdHJpeDQ0IH0gZnJvbSAnLi4vLi4vbWF0aC9NYXRyaXg0NCc7XG5pbXBvcnQgeyBNdXRhYmxlTWF0cml4NDQgfSBmcm9tICcuLi8uLi9tYXRoL011dGFibGVNYXRyaXg0NCc7XG5pbXBvcnQgeyBNdXRhYmxlVmVjdG9yMiB9IGZyb20gJy4uLy4uL21hdGgvTXV0YWJsZVZlY3RvcjInO1xuaW1wb3J0IHsgTXV0YWJsZVZlY3RvcjQgfSBmcm9tICcuLi8uLi9tYXRoL011dGFibGVWZWN0b3I0JztcbmltcG9ydCB7IFZlY3RvcjMgfSBmcm9tICcuLi8uLi9tYXRoL1ZlY3RvcjMnO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vLi4vbWlzYy9Mb2dnZXInO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi8uLi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB0eXBlIHsgTWF0ZXJpYWwgfSBmcm9tICcuL01hdGVyaWFsJztcbmltcG9ydCB7IFNoYWRlcml0eVV0aWxpdHlXZWJHTCBhcyBTaGFkZXJpdHlVdGlsaXR5V2ViR0xfIH0gZnJvbSAnLi9TaGFkZXJpdHlVdGlsaXR5V2ViR0wnO1xuaW1wb3J0IHsgU2hhZGVyaXR5VXRpbGl0eVdlYkdQVSBhcyBTaGFkZXJpdHlVdGlsaXR5V2ViR1BVXyB9IGZyb20gJy4vU2hhZGVyaXR5VXRpbGl0eVdlYkdQVSc7XG5cbi8vIEEgYmFja2VuZCBleGNsdWRlZCBhdCBidWlsZCB0aW1lIChzZWUgc3JjL2JhY2tlbmRGbGFncy5kLnRzKSBpcyBkcm9wcGVkIGJ5IHRoZSBidW5kbGVyLlxuY29uc3QgU2hhZGVyaXR5VXRpbGl0eVdlYkdMID0gKFxuICB0eXBlb2YgX19STl9XRUJHTF9fID09PSAndW5kZWZpbmVkJyB8fCBfX1JOX1dFQkdMX18gPyBTaGFkZXJpdHlVdGlsaXR5V2ViR0xfIDogdW5kZWZpbmVkXG4pIGFzIHR5cGVvZiBTaGFkZXJpdHlVdGlsaXR5V2ViR0xfO1xuY29uc3QgU2hhZGVyaXR5VXRpbGl0eVdlYkdQVSA9IChcbiAgdHlwZW9mIF9fUk5fV0VCR1BVX18gPT09ICd1bmRlZmluZWQnIHx8IF9fUk5fV0VCR1BVX18gPyBTaGFkZXJpdHlVdGlsaXR5V2ViR1BVXyA6IHVuZGVmaW5lZFxuKSBhcyB0eXBlb2YgU2hhZGVyaXR5VXRpbGl0eVdlYkdQVV87XG5cbmNvbnN0IFNoYWRlcml0eSA9IChTaGFkZXJpdHlNb2R1bGUgYXMgYW55KS5kZWZhdWx0IHx8IFNoYWRlcml0eU1vZHVsZTtcblxudHlwZSBNYXRlcmlhbE5vZGVVSUQgPSBudW1iZXI7XG5cbi8qKlxuICogQWJzdHJhY3QgYmFzZSBjbGFzcyBmb3IgbWF0ZXJpYWwgY29udGVudCB0aGF0IHByb3ZpZGVzIGNvbW1vbiBmdW5jdGlvbmFsaXR5IGZvciBtYXRlcmlhbCByZW5kZXJpbmcuXG4gKiBUaGlzIGNsYXNzIGhhbmRsZXMgc2hhZGVyIHNlbWFudGljcywgcmVuZGVyaW5nIHNldHVwLCBhbmQgR1BVIHBhcmFtZXRlciBtYW5hZ2VtZW50IGZvciBtYXRlcmlhbHMuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBBYnN0cmFjdE1hdGVyaWFsQ29udGVudCBleHRlbmRzIFJuT2JqZWN0IHtcbiAgLyoqXG4gICAqIFdoZXRoZXIgZHJhd3Mgb2YgdGhpcyBtYXRlcmlhbCBjYW4gYmUgYmF0Y2hlZCBpbnRvIG9uZSBtdWx0aS1kcmF3IGNhbGwuXG4gICAqIE1hdGVyaWFsIGNvbnRlbnRzIHRoYXQgc2V0IHBlci1wcmltaXRpdmUgdW5pZm9ybXMgaW4gdGhlIHBlci1wcmltaXRpdmUgaG9va1xuICAgKiBtdXN0IG92ZXJyaWRlIHRoaXMgdG8gZmFsc2UuXG4gICAqL1xuICBnZXQgaXNNdWx0aURyYXdDb21wYXRpYmxlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcHJvdGVjdGVkIF9fc2VtYW50aWNzOiBTaGFkZXJTZW1hbnRpY3NJbmZvW10gPSBbXTtcbiAgc3RhdGljIG1hdGVyaWFsTm9kZXM6IEFic3RyYWN0TWF0ZXJpYWxDb250ZW50W10gPSBbXTtcbiAgcHJvdGVjdGVkIF9fbWF0ZXJpYWxOYW1lOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBlbmdpbmUgaW5zdGFuY2UgdGhpcyBtYXRlcmlhbCBjb250ZW50IGlzIGFzc29jaWF0ZWQgd2l0aCAqL1xuICBwcm90ZWN0ZWQgX2VuZ2luZT86IEVuZ2luZTtcblxuICBwcm90ZWN0ZWQgX19kZWZpbml0aW9ucyA9ICcnO1xuICBwcm90ZWN0ZWQgc3RhdGljIF9fdG1wX3ZlY3RvcjQgPSBNdXRhYmxlVmVjdG9yNC56ZXJvKCk7XG4gIHByb3RlY3RlZCBzdGF0aWMgX190bXBfdmVjdG9yMiA9IE11dGFibGVWZWN0b3IyLnplcm8oKTtcbiAgcHJpdmF0ZSBfX2lzTW9ycGhpbmc6IGJvb2xlYW47XG4gIHByaXZhdGUgX19pc1NraW5uaW5nOiBib29sZWFuO1xuICBwcml2YXRlIF9faXNMaWdodGluZzogYm9vbGVhbjtcblxuICBwcml2YXRlIHN0YXRpYyBfX21hdGVyaWFsQ29udGVudENvdW50ID0gMDtcbiAgcHJpdmF0ZSBfX21hdGVyaWFsQ29udGVudFVpZDogbnVtYmVyO1xuXG4gIC8qKiBTaGFkZXIgY2FjaGVzIG1hbmFnZWQgcGVyLUVuZ2luZS4gS2V5IGlzIEVuZ2luZS5vYmplY3RVSUQgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX192ZXJ0ZXhTaGFkZXJpdHlPYmplY3RNYXBQZXJFbmdpbmU6IE1hcDxudW1iZXIsIE1hcDxzdHJpbmcsIFNoYWRlcml0eU9iamVjdD4+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIHN0YXRpYyBfX3BpeGVsU2hhZGVyaXR5T2JqZWN0TWFwUGVyRW5naW5lOiBNYXA8bnVtYmVyLCBNYXA8c3RyaW5nLCBTaGFkZXJpdHlPYmplY3Q+PiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX19yZWZsZWN0ZWRTaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXlNYXBQZXJFbmdpbmU6IE1hcDxudW1iZXIsIE1hcDxzdHJpbmcsIFNoYWRlclNlbWFudGljc0luZm9bXT4+ID1cbiAgICBuZXcgTWFwKCk7XG5cbiAgcHVibGljIHNoYWRlclR5cGU6IFNoYWRlclR5cGVFbnVtID0gU2hhZGVyVHlwZS5WZXJ0ZXhBbmRQaXhlbFNoYWRlcjtcblxuICBwcml2YXRlIF9fbWF0ZXJpYWxTZW1hbnRpY3NWYXJpYW50TmFtZSA9ICcnO1xuICBwcml2YXRlIF9fbWF0ZXJpYWxWYXJpYXRpb25JZGVudGlmaWVyID0gJyc7XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHZlcnRleCBzaGFkZXJpdHkgb2JqZWN0IG1hcCBmb3IgYSBzcGVjaWZpYyBlbmdpbmUuXG4gICAqIENyZWF0ZXMgdGhlIG1hcCBpZiBpdCBkb2Vzbid0IGV4aXN0LlxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZXRWZXJ0ZXhTaGFkZXJpdHlPYmplY3RNYXAoZW5naW5lVWlkOiBudW1iZXIpOiBNYXA8c3RyaW5nLCBTaGFkZXJpdHlPYmplY3Q+IHtcbiAgICBsZXQgbWFwID0gQWJzdHJhY3RNYXRlcmlhbENvbnRlbnQuX192ZXJ0ZXhTaGFkZXJpdHlPYmplY3RNYXBQZXJFbmdpbmUuZ2V0KGVuZ2luZVVpZCk7XG4gICAgaWYgKCFtYXApIHtcbiAgICAgIG1hcCA9IG5ldyBNYXAoKTtcbiAgICAgIEFic3RyYWN0TWF0ZXJpYWxDb250ZW50Ll9fdmVydGV4U2hhZGVyaXR5T2JqZWN0TWFwUGVyRW5naW5lLnNldChlbmdpbmVVaWQsIG1hcCk7XG4gICAgfVxuICAgIHJldHVybiBtYXA7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgcGl4ZWwgc2hhZGVyaXR5IG9iamVjdCBtYXAgZm9yIGEgc3BlY2lmaWMgZW5naW5lLlxuICAgKiBDcmVhdGVzIHRoZSBtYXAgaWYgaXQgZG9lc24ndCBleGlzdC5cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fZ2V0UGl4ZWxTaGFkZXJpdHlPYmplY3RNYXAoZW5naW5lVWlkOiBudW1iZXIpOiBNYXA8c3RyaW5nLCBTaGFkZXJpdHlPYmplY3Q+IHtcbiAgICBsZXQgbWFwID0gQWJzdHJhY3RNYXRlcmlhbENvbnRlbnQuX19waXhlbFNoYWRlcml0eU9iamVjdE1hcFBlckVuZ2luZS5nZXQoZW5naW5lVWlkKTtcbiAgICBpZiAoIW1hcCkge1xuICAgICAgbWFwID0gbmV3IE1hcCgpO1xuICAgICAgQWJzdHJhY3RNYXRlcmlhbENvbnRlbnQuX19waXhlbFNoYWRlcml0eU9iamVjdE1hcFBlckVuZ2luZS5zZXQoZW5naW5lVWlkLCBtYXApO1xuICAgIH1cbiAgICByZXR1cm4gbWFwO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHJlZmxlY3RlZCBzaGFkZXIgc2VtYW50aWNzIGluZm8gbWFwIGZvciBhIHNwZWNpZmljIGVuZ2luZS5cbiAgICogQ3JlYXRlcyB0aGUgbWFwIGlmIGl0IGRvZXNuJ3QgZXhpc3QuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2dldFJlZmxlY3RlZFNoYWRlclNlbWFudGljc0luZm9BcnJheU1hcChlbmdpbmVVaWQ6IG51bWJlcik6IE1hcDxzdHJpbmcsIFNoYWRlclNlbWFudGljc0luZm9bXT4ge1xuICAgIGxldCBtYXAgPSBBYnN0cmFjdE1hdGVyaWFsQ29udGVudC5fX3JlZmxlY3RlZFNoYWRlclNlbWFudGljc0luZm9BcnJheU1hcFBlckVuZ2luZS5nZXQoZW5naW5lVWlkKTtcbiAgICBpZiAoIW1hcCkge1xuICAgICAgbWFwID0gbmV3IE1hcCgpO1xuICAgICAgQWJzdHJhY3RNYXRlcmlhbENvbnRlbnQuX19yZWZsZWN0ZWRTaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXlNYXBQZXJFbmdpbmUuc2V0KGVuZ2luZVVpZCwgbWFwKTtcbiAgICB9XG4gICAgcmV0dXJuIG1hcDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RzIGEgbmV3IEFic3RyYWN0TWF0ZXJpYWxDb250ZW50IGluc3RhbmNlLlxuICAgKiBAcGFyYW0gbWF0ZXJpYWxOYW1lIC0gVGhlIHVuaXF1ZSBuYW1lIGlkZW50aWZpZXIgZm9yIHRoaXMgbWF0ZXJpYWxcbiAgICogQHBhcmFtIG9wdGlvbnMgLSBDb25maWd1cmF0aW9uIG9wdGlvbnMgZm9yIHRoZSBtYXRlcmlhbFxuICAgKiBAcGFyYW0gb3B0aW9ucy5pc01vcnBoaW5nIC0gV2hldGhlciB0aGlzIG1hdGVyaWFsIHN1cHBvcnRzIG1vcnBoIHRhcmdldCBhbmltYXRpb25cbiAgICogQHBhcmFtIG9wdGlvbnMuaXNTa2lubmluZyAtIFdoZXRoZXIgdGhpcyBtYXRlcmlhbCBzdXBwb3J0cyBza2VsZXRhbCBhbmltYXRpb25cbiAgICogQHBhcmFtIG9wdGlvbnMuaXNMaWdodGluZyAtIFdoZXRoZXIgdGhpcyBtYXRlcmlhbCBzdXBwb3J0cyBsaWdodGluZyBjYWxjdWxhdGlvbnNcbiAgICogQHBhcmFtIHZlcnRleFNoYWRlcml0eU9iamVjdCAtIE9wdGlvbmFsIHZlcnRleCBzaGFkZXIgb2JqZWN0XG4gICAqIEBwYXJhbSBwaXhlbFNoYWRlcml0eU9iamVjdCAtIE9wdGlvbmFsIHBpeGVsIHNoYWRlciBvYmplY3RcbiAgICogQHBhcmFtIGVuZ2luZSAtIE9wdGlvbmFsIGVuZ2luZSBpbnN0YW5jZSBmb3IgcHJvcGVyIHNoYWRlciBjYWNoaW5nXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBtYXRlcmlhbE5hbWU6IHN0cmluZyxcbiAgICB7IGlzTW9ycGhpbmcgPSBmYWxzZSwgaXNTa2lubmluZyA9IGZhbHNlLCBpc0xpZ2h0aW5nID0gZmFsc2UgfSA9IHt9LFxuICAgIHZlcnRleFNoYWRlcml0eU9iamVjdD86IFNoYWRlcml0eU9iamVjdCxcbiAgICBwaXhlbFNoYWRlcml0eU9iamVjdD86IFNoYWRlcml0eU9iamVjdCxcbiAgICBlbmdpbmU/OiBFbmdpbmVcbiAgKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLl9fbWF0ZXJpYWxOYW1lID0gbWF0ZXJpYWxOYW1lO1xuXG4gICAgLy8gU2V0IGVuZ2luZSBpZiBwcm92aWRlZCAoaW1wb3J0YW50IGZvciBwcm9wZXIgc2hhZGVyIGNhY2hpbmcpXG4gICAgaWYgKGVuZ2luZSkge1xuICAgICAgdGhpcy5fZW5naW5lID0gZW5naW5lO1xuICAgIH1cblxuICAgIHRoaXMuX19pc01vcnBoaW5nID0gaXNNb3JwaGluZztcbiAgICB0aGlzLl9faXNTa2lubmluZyA9IGlzU2tpbm5pbmc7XG4gICAgdGhpcy5fX2lzTGlnaHRpbmcgPSBpc0xpZ2h0aW5nO1xuXG4gICAgdGhpcy5fX21hdGVyaWFsQ29udGVudFVpZCA9IEFic3RyYWN0TWF0ZXJpYWxDb250ZW50Ll9fbWF0ZXJpYWxDb250ZW50Q291bnQrKztcblxuICAgIHRoaXMuc2V0VmVydGV4U2hhZGVyaXR5T2JqZWN0KHZlcnRleFNoYWRlcml0eU9iamVjdCwgZW5naW5lKTtcbiAgICB0aGlzLnNldFBpeGVsU2hhZGVyaXR5T2JqZWN0KHBpeGVsU2hhZGVyaXR5T2JqZWN0LCBlbmdpbmUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHZlcnRleCBzaGFkZXIgb2JqZWN0IGZvciB0aGlzIG1hdGVyaWFsLlxuICAgKiBAcGFyYW0gdmVydGV4U2hhZGVyaXR5T2JqZWN0IC0gVGhlIHZlcnRleCBzaGFkZXIgb2JqZWN0IHRvIHNldFxuICAgKiBAcGFyYW0gZW5naW5lIC0gT3B0aW9uYWwgZW5naW5lIGluc3RhbmNlICh1c2VzIHRoaXMuX2VuZ2luZSBpZiBub3QgcHJvdmlkZWQpXG4gICAqL1xuICBwcm90ZWN0ZWQgc2V0VmVydGV4U2hhZGVyaXR5T2JqZWN0KHZlcnRleFNoYWRlcml0eU9iamVjdD86IFNoYWRlcml0eU9iamVjdCwgZW5naW5lPzogRW5naW5lKSB7XG4gICAgaWYgKHZlcnRleFNoYWRlcml0eU9iamVjdCkge1xuICAgICAgY29uc3QgZW5naW5lVG9Vc2UgPSBlbmdpbmUgPz8gdGhpcy5fZW5naW5lO1xuICAgICAgaWYgKGVuZ2luZVRvVXNlKSB7XG4gICAgICAgIGNvbnN0IG1hcCA9IEFic3RyYWN0TWF0ZXJpYWxDb250ZW50Ll9fZ2V0VmVydGV4U2hhZGVyaXR5T2JqZWN0TWFwKGVuZ2luZVRvVXNlLm9iamVjdFVJRCk7XG4gICAgICAgIG1hcC5zZXQodGhpcy5fX21hdGVyaWFsTmFtZSwgdmVydGV4U2hhZGVyaXR5T2JqZWN0KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgcGl4ZWwgc2hhZGVyIG9iamVjdCBmb3IgdGhpcyBtYXRlcmlhbC5cbiAgICogQHBhcmFtIHBpeGVsU2hhZGVyaXR5T2JqZWN0IC0gVGhlIHBpeGVsIHNoYWRlciBvYmplY3QgdG8gc2V0XG4gICAqIEBwYXJhbSBlbmdpbmUgLSBPcHRpb25hbCBlbmdpbmUgaW5zdGFuY2UgKHVzZXMgdGhpcy5fZW5naW5lIGlmIG5vdCBwcm92aWRlZClcbiAgICovXG4gIHByb3RlY3RlZCBzZXRQaXhlbFNoYWRlcml0eU9iamVjdChwaXhlbFNoYWRlcml0eU9iamVjdD86IFNoYWRlcml0eU9iamVjdCwgZW5naW5lPzogRW5naW5lKSB7XG4gICAgaWYgKHBpeGVsU2hhZGVyaXR5T2JqZWN0KSB7XG4gICAgICBjb25zdCBlbmdpbmVUb1VzZSA9IGVuZ2luZSA/PyB0aGlzLl9lbmdpbmU7XG4gICAgICBpZiAoZW5naW5lVG9Vc2UpIHtcbiAgICAgICAgY29uc3QgbWFwID0gQWJzdHJhY3RNYXRlcmlhbENvbnRlbnQuX19nZXRQaXhlbFNoYWRlcml0eU9iamVjdE1hcChlbmdpbmVUb1VzZS5vYmplY3RVSUQpO1xuICAgICAgICBtYXAuc2V0KHRoaXMuX19tYXRlcmlhbE5hbWUsIHBpeGVsU2hhZGVyaXR5T2JqZWN0KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIGEgdW5pcXVlIHZhcmlhbnQgbmFtZSBmb3IgdGhpcyBtYXRlcmlhbCBiYXNlZCBvbiBpdHMgc2hhZGVyIHNlbWFudGljcy5cbiAgICogVGhpcyBuYW1lIGlzIHVzZWQgdG8gZGlmZmVyZW50aWF0ZSBtYXRlcmlhbHMgd2l0aCBkaWZmZXJlbnQgc2VtYW50aWMgY29uZmlndXJhdGlvbnMuXG4gICAqL1xuICBtYWtlTWF0ZXJpYWxTZW1hbnRpY3NWYXJpYW50TmFtZSgpIHtcbiAgICBsZXQgc2VtYW50aWNzID0gJyc7XG4gICAgZm9yIChjb25zdCBzZW1hbnRpYyBvZiB0aGlzLl9fc2VtYW50aWNzKSB7XG4gICAgICBzZW1hbnRpY3MgKz0gYCR7c2VtYW50aWMuc2VtYW50aWN9X2A7IC8vJHtzZW1hbnRpYy5zdGFnZS5pbmRleH0gJHtzZW1hbnRpYy5jb21wb25lbnRUeXBlLmluZGV4fSAke3NlbWFudGljLmNvbXBvc2l0aW9uVHlwZS5pbmRleH0gJHtzZW1hbnRpYy5zb2xvRGF0dW19ICR7c2VtYW50aWMuaXNJbnRlcm5hbFNldHRpbmd9ICR7c2VtYW50aWMuYXJyYXlMZW5ndGh9ICR7c2VtYW50aWMubmVlZFVuaWZvcm1JbkRhdGFUZXh0dXJlTW9kZX1cXG5gO1xuICAgIH1cblxuICAgIC8vIFN0b3JlIHRoZSB2YXJpYXRpb24gaWRlbnRpZmllciBzZXBhcmF0ZWx5IChqdXN0IHRoZSBzZW1hbnRpY3MgdmFyaWF0aW9uIHBhcnQpXG4gICAgdGhpcy5fX21hdGVyaWFsVmFyaWF0aW9uSWRlbnRpZmllciA9IGBzZW1hbnRpY3NWYXJpYXRpb25fJHtzZW1hbnRpY3N9YDtcbiAgICAvLyBLZWVwIHRoZSBmdWxsIHZhcmlhbnQgbmFtZSBmb3IgYmFja3dhcmQgY29tcGF0aWJpbGl0eVxuICAgIHRoaXMuX19tYXRlcmlhbFNlbWFudGljc1ZhcmlhbnROYW1lID0gYCR7dGhpcy5fX21hdGVyaWFsTmFtZX1fJHt0aGlzLl9fbWF0ZXJpYWxWYXJpYXRpb25JZGVudGlmaWVyfWA7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWF0ZXJpYWwgc2VtYW50aWNzIHZhcmlhbnQgbmFtZSBmb3IgdGhpcyBtYXRlcmlhbC5cbiAgICogVGhpcyBpcyB0aGUgZnVsbCBpZGVudGlmaWVyIGNvbWJpbmluZyBtYXRlcmlhbCBuYW1lIGFuZCB2YXJpYXRpb24gaWRlbnRpZmllci5cbiAgICogQHJldHVybnMgVGhlIHVuaXF1ZSB2YXJpYW50IG5hbWUgc3RyaW5nXG4gICAqL1xuICBnZXRNYXRlcmlhbFNlbWFudGljc1ZhcmlhbnROYW1lKCkge1xuICAgIHJldHVybiB0aGlzLl9fbWF0ZXJpYWxTZW1hbnRpY3NWYXJpYW50TmFtZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtYXRlcmlhbCB2YXJpYXRpb24gaWRlbnRpZmllciAod2l0aG91dCB0aGUgYmFzZSBtYXRlcmlhbCBuYW1lKS5cbiAgICogVGhpcyByZXByZXNlbnRzIG9ubHkgdGhlIHBhcmFtZXRlciB2YXJpYXRpb24gcGFydCBvZiB0aGUgbWF0ZXJpYWwgdHlwZS5cbiAgICogQHJldHVybnMgVGhlIHZhcmlhdGlvbiBpZGVudGlmaWVyIHN0cmluZ1xuICAgKi9cbiAgZ2V0TWF0ZXJpYWxWYXJpYXRpb25JZGVudGlmaWVyKCkge1xuICAgIHJldHVybiB0aGlzLl9fbWF0ZXJpYWxWYXJpYXRpb25JZGVudGlmaWVyO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGJhc2UgbWF0ZXJpYWwgbmFtZSAoZS5nLiwgXCJQYnJVYmVyXCIsIFwiQ2xhc3NpY1ViZXJcIikuXG4gICAqIERvdWJsZSB0cmFpbGluZyB1bmRlcnNjb3JlcyBhcmUgcmVtb3ZlZCBmb3IgY2xlYW5lciBkaXNwbGF5LlxuICAgKiBAcmV0dXJucyBUaGUgYmFzZSBtYXRlcmlhbCBuYW1lIHN0cmluZ1xuICAgKi9cbiAgZ2V0QmFzZU1hdGVyaWFsTmFtZSgpIHtcbiAgICAvLyBSZW1vdmUgZG91YmxlIHRyYWlsaW5nIHVuZGVyc2NvcmVzIG9ubHkgKGUuZy4sIFwiUGJyVWJlcl9fXCIgLT4gXCJQYnJVYmVyXCIpXG4gICAgLy8gQnV0IGtlZXAgc2luZ2xlIHRyYWlsaW5nIHVuZGVyc2NvcmUgKGUuZy4sIFwiUGJyVWJlcl9Tb21lTmFtZV9cIiBzdGF5cyBhcyBpcylcbiAgICByZXR1cm4gdGhpcy5fX21hdGVyaWFsTmFtZS5yZXBsYWNlKC9fXyQvLCAnJyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdmVydGV4IHNoYWRlciBvYmplY3QgYXNzb2NpYXRlZCB3aXRoIHRoaXMgbWF0ZXJpYWwuXG4gICAqIEByZXR1cm5zIFRoZSB2ZXJ0ZXggc2hhZGVyIG9iamVjdCBvciB1bmRlZmluZWQgaWYgbm90IHNldFxuICAgKi9cbiAgZ2V0IHZlcnRleFNoYWRlcml0eU9iamVjdCgpOiBTaGFkZXJpdHlPYmplY3QgfCB1bmRlZmluZWQge1xuICAgIGlmICh0aGlzLl9lbmdpbmUpIHtcbiAgICAgIGNvbnN0IG1hcCA9IEFic3RyYWN0TWF0ZXJpYWxDb250ZW50Ll9fZ2V0VmVydGV4U2hhZGVyaXR5T2JqZWN0TWFwKHRoaXMuX2VuZ2luZS5vYmplY3RVSUQpO1xuICAgICAgcmV0dXJuIG1hcC5nZXQodGhpcy5fX21hdGVyaWFsTmFtZSk7XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgcGl4ZWwgc2hhZGVyIG9iamVjdCBhc3NvY2lhdGVkIHdpdGggdGhpcyBtYXRlcmlhbC5cbiAgICogQHJldHVybnMgVGhlIHBpeGVsIHNoYWRlciBvYmplY3Qgb3IgdW5kZWZpbmVkIGlmIG5vdCBzZXRcbiAgICovXG4gIGdldCBwaXhlbFNoYWRlcml0eU9iamVjdCgpOiBTaGFkZXJpdHlPYmplY3QgfCB1bmRlZmluZWQge1xuICAgIGlmICh0aGlzLl9lbmdpbmUpIHtcbiAgICAgIGNvbnN0IG1hcCA9IEFic3RyYWN0TWF0ZXJpYWxDb250ZW50Ll9fZ2V0UGl4ZWxTaGFkZXJpdHlPYmplY3RNYXAodGhpcy5fZW5naW5lLm9iamVjdFVJRCk7XG4gICAgICByZXR1cm4gbWFwLmdldCh0aGlzLl9fbWF0ZXJpYWxOYW1lKTtcbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBzaGFkZXIgZGVmaW5pdGlvbnMgc3RyaW5nIGZvciB0aGlzIG1hdGVyaWFsLlxuICAgKiBAcmV0dXJucyBUaGUgZGVmaW5pdGlvbnMgc3RyaW5nXG4gICAqL1xuICBnZXREZWZpbml0aW9ucygpIHtcbiAgICByZXR1cm4gdGhpcy5fX2RlZmluaXRpb25zO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhIG1hdGVyaWFsIG5vZGUgYnkgaXRzIHVuaXF1ZSBpZGVudGlmaWVyLlxuICAgKiBAcGFyYW0gbWF0ZXJpYWxOb2RlVWlkIC0gVGhlIHVuaXF1ZSBpZGVudGlmaWVyIG9mIHRoZSBtYXRlcmlhbCBub2RlXG4gICAqIEByZXR1cm5zIFRoZSBtYXRlcmlhbCBub2RlIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgZ2V0TWF0ZXJpYWxOb2RlKG1hdGVyaWFsTm9kZVVpZDogTWF0ZXJpYWxOb2RlVUlEKSB7XG4gICAgcmV0dXJuIEFic3RyYWN0TWF0ZXJpYWxDb250ZW50Lm1hdGVyaWFsTm9kZXNbbWF0ZXJpYWxOb2RlVWlkXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBzaGFkZXIgc2VtYW50aWNzIGluZm9ybWF0aW9uIGFycmF5IGZvciB0aGlzIG1hdGVyaWFsLlxuICAgKiBAcmV0dXJucyBBcnJheSBvZiBzaGFkZXIgc2VtYW50aWNzIGluZm9ybWF0aW9uXG4gICAqL1xuICBnZXQgX3NlbWFudGljc0luZm9BcnJheSgpIHtcbiAgICByZXR1cm4gdGhpcy5fX3NlbWFudGljcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhpcyBtYXRlcmlhbCBzdXBwb3J0cyBza2VsZXRhbCBhbmltYXRpb24uXG4gICAqIEByZXR1cm5zIFRydWUgaWYgc2tpbm5pbmcgaXMgZW5hYmxlZFxuICAgKi9cbiAgZ2V0IGlzU2tpbm5pbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19pc1NraW5uaW5nO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGlzIG1hdGVyaWFsIHN1cHBvcnRzIG1vcnBoIHRhcmdldCBhbmltYXRpb24uXG4gICAqIEByZXR1cm5zIFRydWUgaWYgbW9ycGhpbmcgaXMgZW5hYmxlZFxuICAgKi9cbiAgZ2V0IGlzTW9ycGhpbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19pc01vcnBoaW5nO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGlzIG1hdGVyaWFsIHN1cHBvcnRzIGxpZ2h0aW5nIGNhbGN1bGF0aW9ucy5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiBsaWdodGluZyBpcyBlbmFibGVkXG4gICAqL1xuICBnZXQgaXNMaWdodGluZygpIHtcbiAgICByZXR1cm4gdGhpcy5fX2lzTGlnaHRpbmc7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgc2hhZGVyIHNlbWFudGljcyBpbmZvcm1hdGlvbiBhcnJheSBmb3IgdGhpcyBtYXRlcmlhbC5cbiAgICpcbiAgICogQSBzZW1hbnRpYyBuYW1lIG1heSBhcnJpdmUgbW9yZSB0aGFuIG9uY2U6IGEgY3VzdG9tIHNoYWRlciBjYW4gcmVmbGVjdCBhXG4gICAqIHBhcmFtZXRlciBmcm9tIGl0cyBvd24gYC8vICNwYXJhbWAgZGVjbGFyYXRpb24gd2hpbGUgdGhlIG1hdGVyaWFsIGZhY3RvcnlcbiAgICogZGVjbGFyZXMgdGhlIHNhbWUgcGFyYW1ldGVyIGV4cGxpY2l0bHkgKGZvciBleGFtcGxlLCB0aGUgcmF5bWFyY2hpbmdcbiAgICogVW5pZm9ybSBub2RlcykuIFRoZSBtYXRlcmlhbCdzIGZpZWxkIG1hcHMgYW5kIHRoZSBidWZmZXIgdmlldyBhY2Nlc3NvcnMgYXJlXG4gICAqIGtleWVkIGJ5IHRoZSBzZW1hbnRpYyBuYW1lLCBzbyBhIGR1cGxpY2F0ZSBsZWF2ZXMgYSBKUy1zaWRlIGZpZWxkIHBvaW50aW5nXG4gICAqIGF0IGFub3RoZXIgcGFyYW1ldGVyJ3MgbWVtb3J5IHdoaWxlIHRoZSBzaGFkZXIgcmVhZHMgdGhlIGZpcnN0IGVudHJ5J3NcbiAgICogc2xvdCwgYW5kIGBzZXRQYXJhbWV0ZXJgIHRoZW4gdXBkYXRlcyBhIHZhbHVlIG5vIHNoYWRlciByZWFkcy4gS2VlcCBhIHNpbmdsZVxuICAgKiBkZWZpbml0aW9uIHBlciBzZW1hbnRpYzogdGhlIGxhdGVyIGRlZmluaXRpb24gd2lucyAodGhlIGV4cGxpY2l0IGZhY3RvcnlcbiAgICogb25lIG92ZXIgdGhlIHJlZmxlY3RlZCBvbmUpIGF0IHRoZSBwb3NpdGlvbiBvZiBpdHMgZmlyc3QgYXBwZWFyYW5jZS5cbiAgICpcbiAgICogQHBhcmFtIHNoYWRlclNlbWFudGljc0luZm9BcnJheSAtIEFycmF5IG9mIHNoYWRlciBzZW1hbnRpY3MgaW5mb3JtYXRpb24gdG8gc2V0XG4gICAqL1xuICBzZXRTaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXkoc2hhZGVyU2VtYW50aWNzSW5mb0FycmF5OiBTaGFkZXJTZW1hbnRpY3NJbmZvW10pIHtcbiAgICBjb25zdCB1bmlxdWVJbmZvQXJyYXkgPSBuZXcgTWFwPHN0cmluZywgU2hhZGVyU2VtYW50aWNzSW5mbz4oKTtcbiAgICBmb3IgKGNvbnN0IGluZm8gb2Ygc2hhZGVyU2VtYW50aWNzSW5mb0FycmF5KSB7XG4gICAgICAvLyBNYXAuc2V0IG9uIGFuIGV4aXN0aW5nIGtleSBrZWVwcyB0aGUgZmlyc3QgaW5zZXJ0aW9uIHBvc2l0aW9uIGFuZFxuICAgICAgLy8gcmVwbGFjZXMgdGhlIHZhbHVlLCB3aGljaCBpcyB0aGUgd2FudGVkIFwibGF0ZXIgZGVmaW5pdGlvbiB3aW5zXCIgcnVsZS5cbiAgICAgIHVuaXF1ZUluZm9BcnJheS5zZXQoaW5mby5zZW1hbnRpYywgaW5mbyk7XG4gICAgfVxuICAgIGNvbnN0IGluZm9BcnJheTogU2hhZGVyU2VtYW50aWNzSW5mb1tdID0gW107XG4gICAgZm9yIChjb25zdCBpbmZvIG9mIHVuaXF1ZUluZm9BcnJheS52YWx1ZXMoKSkge1xuICAgICAgaW5mb0FycmF5LnB1c2goaW5mbyk7XG4gICAgfVxuXG4gICAgLy8gQ29uc3RydWN0IGEgc2V0IG9mIGV4aXN0aW5nIHRleHR1cmUgc2xvdCBpbmRpY2VzXG4gICAgY29uc3QgZXhpc3RpbmdUZXh0dXJlU2xvdEluZGljZXMgPSBuZXcgU2V0PG51bWJlcj4oKTtcbiAgICBleGlzdGluZ1RleHR1cmVTbG90SW5kaWNlcy5hZGQoMCk7IC8vIERhdGEgdGV4dHVyZSBzbG90IGluZGV4IGlzIDBcbiAgICBpbmZvQXJyYXkuZm9yRWFjaChpbmZvID0+IHtcbiAgICAgIGlmIChDb21wb3NpdGlvblR5cGUuaXNUZXh0dXJlKGluZm8uY29tcG9zaXRpb25UeXBlKSkge1xuICAgICAgICBjb25zdCB0ZXh0dXJlU2xvdEluZGV4ID0gaW5mby5pbml0aWFsVmFsdWVbMF07XG4gICAgICAgIGlmICh0ZXh0dXJlU2xvdEluZGV4ID4gMCkge1xuICAgICAgICAgIGV4aXN0aW5nVGV4dHVyZVNsb3RJbmRpY2VzLmFkZCh0ZXh0dXJlU2xvdEluZGV4KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gQXNzaWduIG5ldyB0ZXh0dXJlIHNsb3QgaW5kaWNlcyB0byB0ZXh0dXJlcyB0aGF0IGhhdmUgbmVnYXRpdmUgc2xvdCBpbmRpY2VzXG4gICAgaW5mb0FycmF5LmZvckVhY2goaW5mbyA9PiB7XG4gICAgICBpZiAoQ29tcG9zaXRpb25UeXBlLmlzVGV4dHVyZShpbmZvLmNvbXBvc2l0aW9uVHlwZSkpIHtcbiAgICAgICAgY29uc3QgdGV4dHVyZVNsb3RJbmRleCA9IGluZm8uaW5pdGlhbFZhbHVlWzBdO1xuICAgICAgICBpZiAodGV4dHVyZVNsb3RJbmRleCA8IDApIHtcbiAgICAgICAgICBsZXQgbmV3VGV4dHVyZVNsb3RJbmRleCA9IC0xO1xuICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgMzI7IGkrKykge1xuICAgICAgICAgICAgaWYgKCFleGlzdGluZ1RleHR1cmVTbG90SW5kaWNlcy5oYXMoaSkpIHtcbiAgICAgICAgICAgICAgbmV3VGV4dHVyZVNsb3RJbmRleCA9IGk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobmV3VGV4dHVyZVNsb3RJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgIExvZ2dlci5kZWZhdWx0Lndhcm4oXG4gICAgICAgICAgICAgIGBBbGwgdGV4dHVyZSBzbG90cyAoMS0zMSkgYXJlIG9jY3VwaWVkLiBDYW5ub3QgYXNzaWduIGEgdmFsaWQgc2xvdCBmb3Igc2VtYW50aWMgXCIke2luZm8uc2VtYW50aWN9XCIuIFRoaXMgbWF5IGNhdXNlIHJlbmRlcmluZyBpc3N1ZXMuYFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaW5mby5pbml0aWFsVmFsdWVbMF0gPSBuZXdUZXh0dXJlU2xvdEluZGV4O1xuICAgICAgICAgIGV4aXN0aW5nVGV4dHVyZVNsb3RJbmRpY2VzLmFkZChuZXdUZXh0dXJlU2xvdEluZGV4KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5fX3NlbWFudGljcyA9IGluZm9BcnJheTtcbiAgICB0aGlzLm1ha2VNYXRlcmlhbFNlbWFudGljc1ZhcmlhbnROYW1lKCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB1cCBiYXNpYyByZW5kZXJpbmcgaW5mb3JtYXRpb24gaW5jbHVkaW5nIG1hdHJpY2VzLCBjYW1lcmEsIGFuZCBsaWdodGluZy5cbiAgICogQHBhcmFtIGFyZ3MgLSBXZWJHTCByZW5kZXJpbmcgYXJndW1lbnRzXG4gICAqIEBwYXJhbSBzaGFkZXJQcm9ncmFtIC0gVGhlIFdlYkdMIHNoYWRlciBwcm9ncmFtXG4gICAqIEBwYXJhbSBmaXJzdFRpbWUgLSBXaGV0aGVyIHRoaXMgaXMgdGhlIGZpcnN0IHRpbWUgc2V0dXBcbiAgICogQHBhcmFtIG1hdGVyaWFsIC0gVGhlIG1hdGVyaWFsIGluc3RhbmNlXG4gICAqIEBwYXJhbSBDYW1lcmFDb21wb25lbnRDbGFzcyAtIFRoZSBjYW1lcmEgY29tcG9uZW50IGNsYXNzXG4gICAqL1xuICBwcm90ZWN0ZWQgc2V0dXBCYXNpY0luZm8oXG4gICAgX2VuZ2luZTogRW5naW5lLFxuICAgIGFyZ3M6IFJlbmRlcmluZ0FyZ1dlYkdMLFxuICAgIHNoYWRlclByb2dyYW06IFdlYkdMUHJvZ3JhbSxcbiAgICBfZmlyc3RUaW1lOiBib29sZWFuLFxuICAgIF9tYXRlcmlhbDogTWF0ZXJpYWwsXG4gICAgX0NhbWVyYUNvbXBvbmVudENsYXNzOiB0eXBlb2YgQ2FtZXJhQ29tcG9uZW50XG4gICkge1xuICAgIC8vIE1vcnBoXG4gICAgY29uc3QgYmxlbmRTaGFwZUNvbXBvbmVudCA9IGFyZ3MuZW50aXR5LnRyeVRvR2V0QmxlbmRTaGFwZSgpO1xuICAgIHRoaXMuc2V0TW9ycGhJbmZvKHNoYWRlclByb2dyYW0sIGFyZ3MuZW50aXR5LmdldE1lc2goKSwgYXJncy5wcmltaXRpdmUsIGJsZW5kU2hhcGVDb21wb25lbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHdvcmxkIHRyYW5zZm9ybWF0aW9uIG1hdHJpeCB1bmlmb3JtIGluIHRoZSBzaGFkZXIuXG4gICAqIEBwYXJhbSBzaGFkZXJQcm9ncmFtIC0gVGhlIFdlYkdMIHNoYWRlciBwcm9ncmFtXG4gICAqIEBwYXJhbSB3b3JsZE1hdHJpeCAtIFRoZSB3b3JsZCB0cmFuc2Zvcm1hdGlvbiBtYXRyaXhcbiAgICovXG4gIHByb3RlY3RlZCBzZXRXb3JsZE1hdHJpeChzaGFkZXJQcm9ncmFtOiBXZWJHTFByb2dyYW0sIHdvcmxkTWF0cml4OiBNYXRyaXg0NCkge1xuICAgIChzaGFkZXJQcm9ncmFtIGFzIGFueSkuX2dsLnVuaWZvcm1NYXRyaXg0ZnYoKHNoYWRlclByb2dyYW0gYXMgYW55KS53b3JsZE1hdHJpeCwgZmFsc2UsIHdvcmxkTWF0cml4Ll92KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBub3JtYWwgdHJhbnNmb3JtYXRpb24gbWF0cml4IHVuaWZvcm0gaW4gdGhlIHNoYWRlci5cbiAgICogQHBhcmFtIHNoYWRlclByb2dyYW0gLSBUaGUgV2ViR0wgc2hhZGVyIHByb2dyYW1cbiAgICogQHBhcmFtIG5vcm1hbE1hdHJpeCAtIFRoZSBub3JtYWwgdHJhbnNmb3JtYXRpb24gbWF0cml4XG4gICAqL1xuICBwcm90ZWN0ZWQgc2V0Tm9ybWFsTWF0cml4KHNoYWRlclByb2dyYW06IFdlYkdMUHJvZ3JhbSwgbm9ybWFsTWF0cml4OiBJTWF0cml4MzMpIHtcbiAgICAoc2hhZGVyUHJvZ3JhbSBhcyBhbnkpLl9nbC51bmlmb3JtTWF0cml4M2Z2KChzaGFkZXJQcm9ncmFtIGFzIGFueSkubm9ybWFsTWF0cml4LCBmYWxzZSwgbm9ybWFsTWF0cml4Ll92KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBiaWxsYm9hcmQgZmxhZyB1bmlmb3JtIGluIHRoZSBzaGFkZXIuXG4gICAqIEBwYXJhbSBzaGFkZXJQcm9ncmFtIC0gVGhlIFdlYkdMIHNoYWRlciBwcm9ncmFtXG4gICAqIEBwYXJhbSBpc0JpbGxib2FyZCAtIFdoZXRoZXIgdGhlIG9iamVjdCBzaG91bGQgYmUgcmVuZGVyZWQgYXMgYSBiaWxsYm9hcmRcbiAgICovXG4gIHByb3RlY3RlZCBzZXRJc0JpbGxib2FyZChzaGFkZXJQcm9ncmFtOiBXZWJHTFByb2dyYW0sIGlzQmlsbGJvYXJkOiBib29sZWFuKSB7XG4gICAgKHNoYWRlclByb2dyYW0gYXMgYW55KS5fZ2wudW5pZm9ybTFpKChzaGFkZXJQcm9ncmFtIGFzIGFueSkuaXNCaWxsYm9hcmQsIGlzQmlsbGJvYXJkID8gMSA6IDApO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHZpc2liaWxpdHkgZmxhZyB1bmlmb3JtIGluIHRoZSBzaGFkZXIuXG4gICAqIEBwYXJhbSBzaGFkZXJQcm9ncmFtIC0gVGhlIFdlYkdMIHNoYWRlciBwcm9ncmFtXG4gICAqIEBwYXJhbSBpc1Zpc2libGUgLSBXaGV0aGVyIHRoZSBvYmplY3Qgc2hvdWxkIGJlIHJlbmRlcmVkXG4gICAqL1xuICBwcm90ZWN0ZWQgc2V0SXNWaXNpYmxlKHNoYWRlclByb2dyYW06IFdlYkdMUHJvZ3JhbSwgaXNWaXNpYmxlOiBib29sZWFuKSB7XG4gICAgKHNoYWRlclByb2dyYW0gYXMgYW55KS5fZ2wudW5pZm9ybTFpKChzaGFkZXJQcm9ncmFtIGFzIGFueSkuaXNWaXNpYmxlLCBpc1Zpc2libGUgPyAxIDogMCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB2aWV3LXJlbGF0ZWQgdW5pZm9ybXMgaW5jbHVkaW5nIHZpZXcgbWF0cml4IGFuZCBjYW1lcmEgcG9zaXRpb24uXG4gICAqIEBwYXJhbSBzaGFkZXJQcm9ncmFtIC0gVGhlIFdlYkdMIHNoYWRlciBwcm9ncmFtXG4gICAqIEBwYXJhbSBjYW1lcmFDb21wb25lbnQgLSBUaGUgY2FtZXJhIGNvbXBvbmVudFxuICAgKiBAcGFyYW0gaXNWciAtIFdoZXRoZXIgcmVuZGVyaW5nIGluIFZSIG1vZGVcbiAgICogQHBhcmFtIGRpc3BsYXlJZHggLSBUaGUgZGlzcGxheSBpbmRleCBmb3IgVlIgcmVuZGVyaW5nXG4gICAqL1xuICBwdWJsaWMgc2V0Vmlld0luZm8oc2hhZGVyUHJvZ3JhbTogV2ViR0xQcm9ncmFtLCBjYW1lcmFDb21wb25lbnQ6IENhbWVyYUNvbXBvbmVudCwgaXNWcjogYm9vbGVhbiwgZGlzcGxheUlkeDogbnVtYmVyKSB7XG4gICAgbGV0IHZpZXdNYXRyaXg6IE1hdHJpeDQ0O1xuICAgIGxldCBjYW1lcmFQb3NpdGlvbjogSVZlY3RvcjM7XG4gICAgaWYgKGlzVnIpIHtcbiAgICAgIGNvbnN0IHdlYnhyU3lzdGVtID0gY2FtZXJhQ29tcG9uZW50LmVudGl0eS5lbmdpbmUuX3dlYlhSU3lzdGVtSWZFbmFibGVkO1xuICAgICAgaWYgKHdlYnhyU3lzdGVtPy5pc1dlYlhSTW9kZSkge1xuICAgICAgICB2aWV3TWF0cml4ID0gd2VieHJTeXN0ZW0uX2dldFZpZXdNYXRyaXhBdChkaXNwbGF5SWR4KTtcbiAgICAgICAgY2FtZXJhUG9zaXRpb24gPSB3ZWJ4clN5c3RlbS5fZ2V0Q2FtZXJhV29ybGRQb3NpdGlvbkF0KGRpc3BsYXlJZHgpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoY2FtZXJhQ29tcG9uZW50KSB7XG4gICAgICBjYW1lcmFQb3NpdGlvbiA9IGNhbWVyYUNvbXBvbmVudC53b3JsZFBvc2l0aW9uO1xuICAgICAgdmlld01hdHJpeCA9IGNhbWVyYUNvbXBvbmVudC52aWV3TWF0cml4O1xuICAgIH0gZWxzZSB7XG4gICAgICB2aWV3TWF0cml4ID0gTXV0YWJsZU1hdHJpeDQ0LmlkZW50aXR5KCk7XG4gICAgICBjYW1lcmFQb3NpdGlvbiA9IFZlY3RvcjMuZnJvbUNvcHlBcnJheShbMCwgMCwgMTBdKTtcbiAgICB9XG5cbiAgICAoc2hhZGVyUHJvZ3JhbSBhcyBhbnkpLl9nbC51bmlmb3JtTWF0cml4NGZ2KChzaGFkZXJQcm9ncmFtIGFzIGFueSkudmlld01hdHJpeCwgZmFsc2UsIHZpZXdNYXRyaXghLl92KTtcbiAgICAoc2hhZGVyUHJvZ3JhbSBhcyBhbnkpLl9nbC51bmlmb3JtM2Z2KChzaGFkZXJQcm9ncmFtIGFzIGFueSkudmlld1Bvc2l0aW9uLCBjYW1lcmFQb3NpdGlvbiEuX3YpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHByb2plY3Rpb24gbWF0cml4IHVuaWZvcm0gaW4gdGhlIHNoYWRlci5cbiAgICogQHBhcmFtIHNoYWRlclByb2dyYW0gLSBUaGUgV2ViR0wgc2hhZGVyIHByb2dyYW1cbiAgICogQHBhcmFtIGNhbWVyYUNvbXBvbmVudCAtIFRoZSBjYW1lcmEgY29tcG9uZW50XG4gICAqIEBwYXJhbSBpc1ZyIC0gV2hldGhlciByZW5kZXJpbmcgaW4gVlIgbW9kZVxuICAgKiBAcGFyYW0gZGlzcGxheUlkeCAtIFRoZSBkaXNwbGF5IGluZGV4IGZvciBWUiByZW5kZXJpbmdcbiAgICovXG4gIHB1YmxpYyBzZXRQcm9qZWN0aW9uKFxuICAgIHNoYWRlclByb2dyYW06IFdlYkdMUHJvZ3JhbSxcbiAgICBjYW1lcmFDb21wb25lbnQ6IENhbWVyYUNvbXBvbmVudCxcbiAgICBpc1ZyOiBib29sZWFuLFxuICAgIGRpc3BsYXlJZHg6IG51bWJlclxuICApIHtcbiAgICBsZXQgcHJvamVjdGlvbk1hdHJpeDogTWF0cml4NDQ7XG4gICAgaWYgKGlzVnIpIHtcbiAgICAgIGNvbnN0IHdlYnhyU3lzdGVtID0gY2FtZXJhQ29tcG9uZW50LmVudGl0eS5lbmdpbmUuX3dlYlhSU3lzdGVtSWZFbmFibGVkO1xuICAgICAgaWYgKHdlYnhyU3lzdGVtPy5pc1dlYlhSTW9kZSkge1xuICAgICAgICBwcm9qZWN0aW9uTWF0cml4ID0gd2VieHJTeXN0ZW0uX2dldFByb2plY3RNYXRyaXhBdChkaXNwbGF5SWR4KTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGNhbWVyYUNvbXBvbmVudCkge1xuICAgICAgcHJvamVjdGlvbk1hdHJpeCA9IGNhbWVyYUNvbXBvbmVudC5wcm9qZWN0aW9uTWF0cml4O1xuICAgIH0gZWxzZSB7XG4gICAgICBwcm9qZWN0aW9uTWF0cml4ID0gTXV0YWJsZU1hdHJpeDQ0LmlkZW50aXR5KCk7XG4gICAgfVxuICAgIChzaGFkZXJQcm9ncmFtIGFzIGFueSkuX2dsLnVuaWZvcm1NYXRyaXg0ZnYoKHNoYWRlclByb2dyYW0gYXMgYW55KS5wcm9qZWN0aW9uTWF0cml4LCBmYWxzZSwgcHJvamVjdGlvbk1hdHJpeCEuX3YpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgbW9ycGggdGFyZ2V0IGFuaW1hdGlvbiB1bmlmb3JtcyBpbiB0aGUgc2hhZGVyLlxuICAgKiBAcGFyYW0gc2hhZGVyUHJvZ3JhbSAtIFRoZSBXZWJHTCBzaGFkZXIgcHJvZ3JhbVxuICAgKiBAcGFyYW0gbWVzaENvbXBvbmVudCAtIFRoZSBtZXNoIGNvbXBvbmVudFxuICAgKiBAcGFyYW0gcHJpbWl0aXZlIC0gVGhlIHByaW1pdGl2ZSBjb250YWluaW5nIG1vcnBoIHRhcmdldHNcbiAgICogQHBhcmFtIGJsZW5kU2hhcGVDb21wb25lbnQgLSBUaGUgYmxlbmQgc2hhcGUgY29tcG9uZW50IGNvbnRhaW5pbmcgd2VpZ2h0c1xuICAgKi9cbiAgc2V0TW9ycGhJbmZvKFxuICAgIHNoYWRlclByb2dyYW06IFdlYkdMUHJvZ3JhbSxcbiAgICBfbWVzaENvbXBvbmVudDogTWVzaENvbXBvbmVudCxcbiAgICBwcmltaXRpdmU6IFByaW1pdGl2ZSxcbiAgICBfYmxlbmRTaGFwZUNvbXBvbmVudD86IEJsZW5kU2hhcGVDb21wb25lbnRcbiAgKSB7XG4gICAgaWYgKCF0aGlzLl9faXNNb3JwaGluZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAocHJpbWl0aXZlLnRhcmdldHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcHJpbWl0aXZlSWR4ID0gKHByaW1pdGl2ZS5jb25zdHJ1Y3RvciBhcyB0eXBlb2YgUHJpbWl0aXZlKS5nZXRQcmltaXRpdmVJZHhIYXNNb3JwaChwcmltaXRpdmUucHJpbWl0aXZlVWlkKSE7XG4gICAgKHNoYWRlclByb2dyYW0gYXMgYW55KS5fZ2wudW5pZm9ybTFpKChzaGFkZXJQcm9ncmFtIGFzIGFueSkuY3VycmVudFByaW1pdGl2ZUlkeCwgcHJpbWl0aXZlSWR4KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGludGVybmFsIHNldHRpbmcgcGFyYW1ldGVycyB0byBHUFUgZm9yIFdlYkdMIHBlciBzaGFkZXIgcHJvZ3JhbS5cbiAgICogVGhpcyBtZXRob2Qgc2hvdWxkIGJlIG92ZXJyaWRkZW4gYnkgZGVyaXZlZCBjbGFzc2VzIHRvIHByb3ZpZGUgc3BlY2lmaWMgcGFyYW1ldGVyIGhhbmRsaW5nLlxuICAgKiBAcGFyYW0gcGFyYW1zIC0gT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwsIHNoYWRlciBwcm9ncmFtLCBmaXJzdFRpbWUgZmxhZywgYW5kIHJlbmRlcmluZyBhcmd1bWVudHNcbiAgICovXG4gIF9zZXRJbnRlcm5hbFNldHRpbmdQYXJhbWV0ZXJzVG9HcHVXZWJHTFBlclNoYWRlclByb2dyYW0oX3BhcmFtczoge30pIHt9XG5cbiAgLyoqXG4gICAqIFNldHMgaW50ZXJuYWwgc2V0dGluZyBwYXJhbWV0ZXJzIHRvIEdQVSBmb3IgV2ViR0wgcGVyIG1hdGVyaWFsLlxuICAgKiBUaGlzIG1ldGhvZCBzaG91bGQgYmUgb3ZlcnJpZGRlbiBieSBkZXJpdmVkIGNsYXNzZXMgdG8gcHJvdmlkZSBzcGVjaWZpYyBwYXJhbWV0ZXIgaGFuZGxpbmcuXG4gICAqIEBwYXJhbSBwYXJhbXMgLSBPYmplY3QgY29udGFpbmluZyBtYXRlcmlhbCwgc2hhZGVyIHByb2dyYW0sIGZpcnN0VGltZSBmbGFnLCBhbmQgcmVuZGVyaW5nIGFyZ3VtZW50c1xuICAgKi9cbiAgX3NldEludGVybmFsU2V0dGluZ1BhcmFtZXRlcnNUb0dwdVdlYkdMUGVyTWF0ZXJpYWwoX3BhcmFtczoge30pIHt9XG5cbiAgLyoqXG4gICAqIFNldHMgaW50ZXJuYWwgc2V0dGluZyBwYXJhbWV0ZXJzIHRvIEdQVSBmb3IgV2ViR0wgcGVyIHByaW1pdGl2ZS5cbiAgICogVGhpcyBtZXRob2Qgc2hvdWxkIGJlIG92ZXJyaWRkZW4gYnkgZGVyaXZlZCBjbGFzc2VzIHRvIHByb3ZpZGUgc3BlY2lmaWMgcGFyYW1ldGVyIGhhbmRsaW5nLlxuICAgKiBAcGFyYW0gcGFyYW1zIC0gT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwsIHNoYWRlciBwcm9ncmFtLCBmaXJzdFRpbWUgZmxhZywgYW5kIHJlbmRlcmluZyBhcmd1bWVudHNcbiAgICovXG4gIF9zZXRJbnRlcm5hbFNldHRpbmdQYXJhbWV0ZXJzVG9HcHVXZWJHTFBlclByaW1pdGl2ZShfcGFyYW1zOiB7fSkge31cblxuICAvKipcbiAgICogU2V0cyBpbnRlcm5hbCBzZXR0aW5nIHBhcmFtZXRlcnMgdG8gR1BVIGZvciBXZWJHUFUuXG4gICAqIFRoaXMgbWV0aG9kIHNob3VsZCBiZSBvdmVycmlkZGVuIGJ5IGRlcml2ZWQgY2xhc3NlcyB0byBwcm92aWRlIHNwZWNpZmljIHBhcmFtZXRlciBoYW5kbGluZy5cbiAgICogQHBhcmFtIHBhcmFtcyAtIE9iamVjdCBjb250YWluaW5nIG1hdGVyaWFsIGFuZCBXZWJHUFUgcmVuZGVyaW5nIGFyZ3VtZW50c1xuICAgKi9cbiAgX3NldEludGVybmFsU2V0dGluZ1BhcmFtZXRlcnNUb0dwdVdlYkdwdShfcGFyYW1zOiB7fSkge31cblxuICAvKipcbiAgICogR2V0cyB0aGUgc2hhZGVyIGRlZmluaXRpb24gc3RyaW5nIGZvciB0aGlzIG1hdGVyaWFsLlxuICAgKiBUaGlzIG1ldGhvZCBzaG91bGQgYmUgb3ZlcnJpZGRlbiBieSBkZXJpdmVkIGNsYXNzZXMgdG8gcHJvdmlkZSBzcGVjaWZpYyBkZWZpbml0aW9ucy5cbiAgICogQHJldHVybnMgRW1wdHkgc3RyaW5nIGJ5IGRlZmF1bHRcbiAgICovXG4gIGdldERlZmluaXRpb24oKSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm1zIHNoYWRlciByZWZsZWN0aW9uIHRvIGV4dHJhY3Qgc2VtYW50aWNzIGluZm9ybWF0aW9uIGZyb20gdmVydGV4IGFuZCBwaXhlbCBzaGFkZXJzLlxuICAgKiBAcGFyYW0gdmVydGV4U2hhZGVyIC0gVGhlIHZlcnRleCBzaGFkZXIgb2JqZWN0IGZvciBXZWJHTFxuICAgKiBAcGFyYW0gcGl4ZWxTaGFkZXIgLSBUaGUgcGl4ZWwgc2hhZGVyIG9iamVjdCBmb3IgV2ViR0xcbiAgICogQHBhcmFtIHZlcnRleFNoYWRlcldlYkdwdSAtIFRoZSB2ZXJ0ZXggc2hhZGVyIG9iamVjdCBmb3IgV2ViR1BVXG4gICAqIEBwYXJhbSBwaXhlbFNoYWRlcldlYkdwdSAtIFRoZSBwaXhlbCBzaGFkZXIgb2JqZWN0IGZvciBXZWJHUFVcbiAgICogQHBhcmFtIGRlZmluaXRpb25zIC0gQXJyYXkgb2Ygc2hhZGVyIGRlZmluaXRpb25zXG4gICAqIEByZXR1cm5zIEFycmF5IG9mIHNoYWRlciBzZW1hbnRpY3MgaW5mb3JtYXRpb25cbiAgICovXG4gIHByb3RlY3RlZCBkb1NoYWRlclJlZmxlY3Rpb24oXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgdmVydGV4U2hhZGVyOiBTaGFkZXJpdHlPYmplY3QsXG4gICAgcGl4ZWxTaGFkZXI6IFNoYWRlcml0eU9iamVjdCxcbiAgICB2ZXJ0ZXhTaGFkZXJXZWJHcHU6IFNoYWRlcml0eU9iamVjdCxcbiAgICBwaXhlbFNoYWRlcldlYkdwdTogU2hhZGVyaXR5T2JqZWN0LFxuICAgIGRlZmluaXRpb25zOiBzdHJpbmdbXVxuICApIHtcbiAgICAvLyBTdG9yZSB0aGUgZW5naW5lIHJlZmVyZW5jZSBmb3IgdGhpcyBtYXRlcmlhbCBjb250ZW50XG4gICAgdGhpcy5fZW5naW5lID0gZW5naW5lO1xuXG4gICAgY29uc3QgZGVmaW5pdGlvbnNTdHIgPSBkZWZpbml0aW9ucy5qb2luKCcnKTtcbiAgICBjb25zdCByZWZsZWN0ZWRNYXAgPSBBYnN0cmFjdE1hdGVyaWFsQ29udGVudC5fX2dldFJlZmxlY3RlZFNoYWRlclNlbWFudGljc0luZm9BcnJheU1hcChlbmdpbmUub2JqZWN0VUlEKTtcbiAgICBjb25zdCByZWZsZWN0ZWRTaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXkgPSByZWZsZWN0ZWRNYXAuZ2V0KHRoaXMuX19tYXRlcmlhbE5hbWUgKyBkZWZpbml0aW9uc1N0cik7XG4gICAgaWYgKHJlZmxlY3RlZFNoYWRlclNlbWFudGljc0luZm9BcnJheSAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gcmVmbGVjdGVkU2hhZGVyU2VtYW50aWNzSW5mb0FycmF5LmNvbmNhdCgpO1xuICAgIH1cblxuICAgIGxldCBwcmVwcm9jZXNzZWRWZXJ0ZXhTaGFkZXJEYXRhOiB7XG4gICAgICBzaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXk6IFNoYWRlclNlbWFudGljc0luZm9bXTtcbiAgICAgIHNoYWRlcml0eU9iamVjdDogU2hhZGVyaXR5T2JqZWN0O1xuICAgIH07XG4gICAgbGV0IHByZXByb2Nlc3NlZFBpeGVsU2hhZGVyRGF0YToge1xuICAgICAgc2hhZGVyU2VtYW50aWNzSW5mb0FycmF5OiBTaGFkZXJTZW1hbnRpY3NJbmZvW107XG4gICAgICBzaGFkZXJpdHlPYmplY3Q6IFNoYWRlcml0eU9iamVjdDtcbiAgICB9O1xuICAgIGlmIChlbmdpbmUucHJvY2Vzc0FwcHJvYWNoID09PSBQcm9jZXNzQXBwcm9hY2guV2ViR1BVKSB7XG4gICAgICBjb25zdCBwcmVwcm9jZXNzZWRWZXJ0ZXhTaGFkZXIgPSBTaGFkZXJpdHkucHJvY2Vzc1ByYWdtYSh2ZXJ0ZXhTaGFkZXJXZWJHcHUhLCBmYWxzZSwgZGVmaW5pdGlvbnMpO1xuICAgICAgY29uc3QgcHJlcHJvY2Vzc2VkUGl4ZWxTaGFkZXIgPSBTaGFkZXJpdHkucHJvY2Vzc1ByYWdtYShwaXhlbFNoYWRlcldlYkdwdSEsIGZhbHNlLCBkZWZpbml0aW9ucyk7XG5cbiAgICAgIHByZXByb2Nlc3NlZFZlcnRleFNoYWRlckRhdGEgPSBTaGFkZXJpdHlVdGlsaXR5V2ViR1BVLmdldFNoYWRlckRhdGFSZWZsZWN0aW9uKGVuZ2luZSwgcHJlcHJvY2Vzc2VkVmVydGV4U2hhZGVyKTtcbiAgICAgIHByZXByb2Nlc3NlZFBpeGVsU2hhZGVyRGF0YSA9IFNoYWRlcml0eVV0aWxpdHlXZWJHUFUuZ2V0U2hhZGVyRGF0YVJlZmxlY3Rpb24oZW5naW5lLCBwcmVwcm9jZXNzZWRQaXhlbFNoYWRlcik7XG4gICAgICBjb25zdCB2ZXJ0ZXhTaGFkZXJEYXRhID0gU2hhZGVyaXR5VXRpbGl0eVdlYkdQVS5nZXRTaGFkZXJEYXRhUmVmbGVjdGlvbihlbmdpbmUsIHZlcnRleFNoYWRlcldlYkdwdSEpO1xuICAgICAgY29uc3QgcGl4ZWxTaGFkZXJEYXRhID0gU2hhZGVyaXR5VXRpbGl0eVdlYkdQVS5nZXRTaGFkZXJEYXRhUmVmbGVjdGlvbihlbmdpbmUsIHBpeGVsU2hhZGVyV2ViR3B1ISk7XG5cbiAgICAgIHRoaXMuc2V0VmVydGV4U2hhZGVyaXR5T2JqZWN0KHZlcnRleFNoYWRlckRhdGEuc2hhZGVyaXR5T2JqZWN0LCBlbmdpbmUpO1xuICAgICAgdGhpcy5zZXRQaXhlbFNoYWRlcml0eU9iamVjdChwaXhlbFNoYWRlckRhdGEuc2hhZGVyaXR5T2JqZWN0LCBlbmdpbmUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBwcmVwcm9jZXNzZWRWZXJ0ZXhTaGFkZXIgPSBTaGFkZXJpdHkucHJvY2Vzc1ByYWdtYSh2ZXJ0ZXhTaGFkZXIsIHRydWUsIGRlZmluaXRpb25zKTtcbiAgICAgIGNvbnN0IHByZXByb2Nlc3NlZFBpeGVsU2hhZGVyID0gU2hhZGVyaXR5LnByb2Nlc3NQcmFnbWEocGl4ZWxTaGFkZXIsIHRydWUsIGRlZmluaXRpb25zKTtcblxuICAgICAgcHJlcHJvY2Vzc2VkVmVydGV4U2hhZGVyRGF0YSA9IFNoYWRlcml0eVV0aWxpdHlXZWJHTC5nZXRTaGFkZXJEYXRhUmVmbGVjdGlvbihlbmdpbmUsIHByZXByb2Nlc3NlZFZlcnRleFNoYWRlcik7XG4gICAgICBwcmVwcm9jZXNzZWRQaXhlbFNoYWRlckRhdGEgPSBTaGFkZXJpdHlVdGlsaXR5V2ViR0wuZ2V0U2hhZGVyRGF0YVJlZmxlY3Rpb24oZW5naW5lLCBwcmVwcm9jZXNzZWRQaXhlbFNoYWRlcik7XG5cbiAgICAgIGNvbnN0IHZlcnRleFNoYWRlckRhdGEgPSBTaGFkZXJpdHlVdGlsaXR5V2ViR0wuZ2V0U2hhZGVyRGF0YVJlZmxlY3Rpb24oZW5naW5lLCB2ZXJ0ZXhTaGFkZXIpO1xuICAgICAgY29uc3QgcGl4ZWxTaGFkZXJEYXRhID0gU2hhZGVyaXR5VXRpbGl0eVdlYkdMLmdldFNoYWRlckRhdGFSZWZsZWN0aW9uKGVuZ2luZSwgcGl4ZWxTaGFkZXIpO1xuXG4gICAgICB0aGlzLnNldFZlcnRleFNoYWRlcml0eU9iamVjdCh2ZXJ0ZXhTaGFkZXJEYXRhLnNoYWRlcml0eU9iamVjdCwgZW5naW5lKTtcbiAgICAgIHRoaXMuc2V0UGl4ZWxTaGFkZXJpdHlPYmplY3QocGl4ZWxTaGFkZXJEYXRhLnNoYWRlcml0eU9iamVjdCwgZW5naW5lKTtcbiAgICB9XG5cbiAgICBjb25zdCBzaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXk6IFNoYWRlclNlbWFudGljc0luZm9bXSA9IFtdO1xuXG4gICAgZm9yIChjb25zdCB2ZXJ0ZXhTaGFkZXJTZW1hbnRpY3NJbmZvIG9mIHByZXByb2Nlc3NlZFZlcnRleFNoYWRlckRhdGEuc2hhZGVyU2VtYW50aWNzSW5mb0FycmF5KSB7XG4gICAgICB2ZXJ0ZXhTaGFkZXJTZW1hbnRpY3NJbmZvLnN0YWdlID0gU2hhZGVyVHlwZS5WZXJ0ZXhTaGFkZXI7XG4gICAgICBzaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXkucHVzaCh2ZXJ0ZXhTaGFkZXJTZW1hbnRpY3NJbmZvKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBwaXhlbFNoYWRlclNlbWFudGljc0luZm8gb2YgcHJlcHJvY2Vzc2VkUGl4ZWxTaGFkZXJEYXRhLnNoYWRlclNlbWFudGljc0luZm9BcnJheSkge1xuICAgICAgY29uc3QgZm91bmRTaGFkZXJTZW1hbnRpY3NJbmZvID0gc2hhZGVyU2VtYW50aWNzSW5mb0FycmF5LmZpbmQoKHZlcnRleEluZm86IFNoYWRlclNlbWFudGljc0luZm8pID0+IHtcbiAgICAgICAgaWYgKHZlcnRleEluZm8uc2VtYW50aWMgPT09IHBpeGVsU2hhZGVyU2VtYW50aWNzSW5mby5zZW1hbnRpYykge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0pO1xuICAgICAgaWYgKGZvdW5kU2hhZGVyU2VtYW50aWNzSW5mbykge1xuICAgICAgICBmb3VuZFNoYWRlclNlbWFudGljc0luZm8uc3RhZ2UgPSBTaGFkZXJUeXBlLlZlcnRleEFuZFBpeGVsU2hhZGVyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGl4ZWxTaGFkZXJTZW1hbnRpY3NJbmZvLnN0YWdlID0gU2hhZGVyVHlwZS5QaXhlbFNoYWRlcjtcbiAgICAgICAgc2hhZGVyU2VtYW50aWNzSW5mb0FycmF5LnB1c2gocGl4ZWxTaGFkZXJTZW1hbnRpY3NJbmZvKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmVmbGVjdGVkTWFwLnNldCh0aGlzLl9fbWF0ZXJpYWxOYW1lICsgZGVmaW5pdGlvbnNTdHIsIHNoYWRlclNlbWFudGljc0luZm9BcnJheSk7XG5cbiAgICByZXR1cm4gc2hhZGVyU2VtYW50aWNzSW5mb0FycmF5LmNvbmNhdCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFucyB1cCBzdGF0aWMgY2FjaGVzIGZvciBhIHNwZWNpZmljIEVuZ2luZSBpbnN0YW5jZS5cbiAgICogVGhpcyBzaG91bGQgYmUgY2FsbGVkIHdoZW4gdGhlIEVuZ2luZSBpcyBkZXN0cm95ZWQgdG8gcHJldmVudCBzdGFsZSByZWZlcmVuY2VzLlxuICAgKlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIEVuZ2luZSBpbnN0YW5jZSBiZWluZyBkZXN0cm95ZWRcbiAgICogQGludGVybmFsIENhbGxlZCBmcm9tIEVuZ2luZS5kZXN0cm95KClcbiAgICovXG4gIHN0YXRpYyBfY2xlYW51cEZvckVuZ2luZShlbmdpbmU6IEVuZ2luZSk6IHZvaWQge1xuICAgIEFic3RyYWN0TWF0ZXJpYWxDb250ZW50Ll9fdmVydGV4U2hhZGVyaXR5T2JqZWN0TWFwUGVyRW5naW5lLmRlbGV0ZShlbmdpbmUub2JqZWN0VUlEKTtcbiAgICBBYnN0cmFjdE1hdGVyaWFsQ29udGVudC5fX3BpeGVsU2hhZGVyaXR5T2JqZWN0TWFwUGVyRW5naW5lLmRlbGV0ZShlbmdpbmUub2JqZWN0VUlEKTtcbiAgICBBYnN0cmFjdE1hdGVyaWFsQ29udGVudC5fX3JlZmxlY3RlZFNoYWRlclNlbWFudGljc0luZm9BcnJheU1hcFBlckVuZ2luZS5kZWxldGUoZW5naW5lLm9iamVjdFVJRCk7XG5cbiAgICAvLyBOb3RlOiBXZSBkb24ndCByZXNldCBfX21hdGVyaWFsQ29udGVudENvdW50IGFzIFVJRHMgc2hvdWxkIHJlbWFpbiB1bmlxdWUgYWNyb3NzIGVuZ2luZSBpbnN0YW5jZXNcbiAgICAvLyBOb3RlOiBXZSBkb24ndCBjbGVhciBtYXRlcmlhbE5vZGVzIGFzIHRoZXkgbWF5IHN0aWxsIGJlIHJlZmVyZW5jZWRcbiAgICAvLyBOb3RlOiBMaWdodCBhcnJheXMgYW5kIHRtcCB2ZWN0b3JzIGFyZSBqdXN0IHJldXNhYmxlIGJ1ZmZlcnMsIG5vIG5lZWQgdG8gY2xlYXJcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFBLE9BQU8scUJBQStDO0FBS3RELFNBQVMsZ0JBQWdCO0FBQ3pCLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsdUJBQXVCO0FBRWhDLFNBQVMsa0JBQXVDO0FBS2hELFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsc0JBQXNCO0FBQy9CLFNBQVMsc0JBQXNCO0FBQy9CLFNBQVMsZUFBZTtBQUN4QixTQUFTLGNBQWM7QUFHdkIsU0FBUyx5QkFBeUIsOEJBQThCO0FBQ2hFLFNBQVMsMEJBQTBCLCtCQUErQjtBQUdsRSxJQUFNLHdCQUNKLE9BQU8saUJBQWlCLGVBQWUsZUFBZSx5QkFBeUI7QUFFakYsSUFBTSx5QkFDSixPQUFPLGtCQUFrQixlQUFlLGdCQUFnQiwwQkFBMEI7QUFHcEYsSUFBTSxZQUFhLGdCQUF3QixXQUFXO0FBUS9DLElBQWUsMkJBQWYsTUFBZSxpQ0FBZ0MsU0FBUztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQXdGN0QsWUFDRSxjQUNBLEVBQUUsYUFBYSxPQUFPLGFBQWEsT0FBTyxhQUFhLE1BQU0sSUFBSSxDQUFDLEdBQ2xFLHVCQUNBLHNCQUNBLFFBQ0E7QUFDQSxVQUFNO0FBckZSLFNBQVVBLEtBQXFDLENBQUM7QUFPaEQsU0FBVUMsS0FBZ0I7QUFnQjFCLFNBQU8sYUFBNkIsV0FBVztBQUUvQyxTQUFRQyxLQUFpQztBQUN6QyxTQUFRQyxLQUFnQztBQTREdEMsU0FBS0MsS0FBaUI7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O0FBemxCc0IseUJBV2IsZ0JBQTJDLENBQUM7QUFYL0IseUJBa0JIQyxLQUFnQixlQUFlLEtBQUs7QUFsQmpDLHlCQW1CSEMsS0FBZ0IsZUFBZSxLQUFLO0FBbkJqQyx5QkF3QkxSLEtBQXlCO0FBQUE7QUF4QnBCLHlCQTRCTEUsS0FBaUYsb0JBQUksSUFBSTtBQTVCcEYseUJBNkJMRSxLQUFnRixvQkFBSSxJQUFJO0FBN0JuRix5QkE4QkxFLEtBQ2Isb0JBQUksSUFBSTtBQS9CTCxJQUFlLDBCQUFmOyIsCiAgIm5hbWVzIjogWyJfX3NlbWFudGljcyIsICJfX2RlZmluaXRpb25zIiwgIl9fbWF0ZXJpYWxTZW1hbnRpY3NWYXJpYW50TmFtZSIsICJfX21hdGVyaWFsVmFyaWF0aW9uSWRlbnRpZmllciIsICJfX21hdGVyaWFsTmFtZSIsICJfX2lzTW9ycGhpbmciLCAiX19pc1NraW5uaW5nIiwgIl9faXNMaWdodGluZyIsICJfX21hdGVyaWFsQ29udGVudFVpZCIsICJfX21hdGVyaWFsQ29udGVudENvdW50IiwgIl9fZ2V0VmVydGV4U2hhZGVyaXR5T2JqZWN0TWFwIiwgIl9fdmVydGV4U2hhZGVyaXR5T2JqZWN0TWFwUGVyRW5naW5lIiwgIl9fZ2V0UGl4ZWxTaGFkZXJpdHlPYmplY3RNYXAiLCAiX19waXhlbFNoYWRlcml0eU9iamVjdE1hcFBlckVuZ2luZSIsICJfX2dldFJlZmxlY3RlZFNoYWRlclNlbWFudGljc0luZm9BcnJheU1hcCIsICJfX3JlZmxlY3RlZFNoYWRlclNlbWFudGljc0luZm9BcnJheU1hcFBlckVuZ2luZSIsICJfX3RtcF92ZWN0b3I0IiwgIl9fdG1wX3ZlY3RvcjIiXQp9Cg==
