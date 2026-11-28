// src/foundation/materials/core/Material.ts
import { Component } from "../../core/Component.js";
import { RnObject } from "../../core/RnObject.js";
import { TextureParameter } from "../../definitions/index.js";
import { AlphaMode } from "../../definitions/AlphaMode.js";
import { Blend } from "../../definitions/Blend.js";
import { CompositionType } from "../../definitions/CompositionType.js";
import { ShaderType } from "../../definitions/ShaderType.js";
import { AnimatedQuaternion } from "../../math/AnimatedQuaternion.js";
import { AnimatedScalar } from "../../math/AnimatedScalar.js";
import { AnimatedVector2 } from "../../math/AnimatedVector2.js";
import { AnimatedVector3 } from "../../math/AnimatedVector3.js";
import { AnimatedVector4 } from "../../math/AnimatedVector4.js";
import { AnimatedVectorN } from "../../math/AnimatedVectorN.js";
import { MathClassUtil } from "../../math/MathClassUtil.js";
import { Is } from "../../misc/Is.js";
import { Logger } from "../../misc/Logger.js";
import { Sampler } from "../../textures/Sampler.js";
import {
  _createProgramAsSingleOperationByUpdatedSources,
  _createProgramAsSingleOperationWebGL,
  _createProgramAsSingleOperationWebGpu
} from "./ShaderHandler.js";
var Material = class extends RnObject {
  /**
   * Creates a new Material instance.
   * @param materialTid - The material type ID
   * @param materialUid - The unique material ID
   * @param materialSid - The material serial ID within the material type
   * @param materialTypeName - The name of the material type
   * @param materialNode - The abstract material content associated with this material
   */
  constructor(engine, materialTid, materialUid, materialSid, materialTypeName, materialNode) {
    super();
    this._allFieldVariables = /* @__PURE__ */ new Map();
    this._autoFieldVariablesOnly = /* @__PURE__ */ new Map();
    this._autoTextureFieldVariablesOnly = /* @__PURE__ */ new Map();
    this._autoUniformFieldVariablesOnly = /* @__PURE__ */ new Map();
    this._allFieldsInfo = /* @__PURE__ */ new Map();
    this.cs = /* @__PURE__ */ new Map();
    // Ids
    this._shaderProgramUidMap = /* @__PURE__ */ new Map();
    // Tracks component buffer layout version per primitive to invalidate shaders when new BufferViews are added
    this._shaderProgramComponentStateVersionMap = /* @__PURE__ */ new Map();
    this.ds = -1;
    this.fs = -1;
    // material serial Id in the material type
    // Common Rendering States
    this.gs = AlphaMode.Opaque;
    this.zWriteWhenBlend = false;
    this.colorWriteMask = [true, true, true, true];
    this.isTranslucent = false;
    this.cullFace = true;
    // If true, enable gl.CULL_FACE
    this.cullFrontFaceCCW = true;
    this.cullFaceBack = true;
    // if true, cull back face. if false, cull front face
    this.hs = false;
    this.Tr = Blend.EquationFuncAdd;
    // gl.FUNC_ADD
    this.Ur = Blend.EquationFuncAdd;
    // gl.FUNC_ADD
    this.Vr = Blend.One;
    // Not SrcAlpha. Because In Rhodonite, premultiplied alpha is used
    this.Wr = Blend.OneMinusSrcAlpha;
    // gl.ONE_MINUS_SRC_ALPHA
    this.Xr = Blend.One;
    // gl.ONE
    this.Yr = Blend.OneMinusSrcAlpha;
    // gl.ONE_MINUS_SRC_ALPHA
    this.Mi = 0;
    // Incremented only when the render pipeline configuration changes (shader
    // program, blend state, cull mode, ...). Uniform value updates do not need a
    // new pipeline, so they must not bump this version.
    this.is = 0;
    // Incremented only when texture/sampler bindings change. WebGPU bind groups
    // must be recreated for these changes, while uniform updates are written to
    // the storage buffer and leave the bind groups untouched.
    this.Zr = 0;
    this.$d = "";
    this.Sr = /* @__PURE__ */ new Set();
    this.ls = "";
    this.ms = -1;
    this.as = "";
    this.ns = -1;
    this.c = engine;
    this._materialContent = materialNode;
    this.es = materialTid;
    this.ds = materialUid;
    this.fs = materialSid;
    this.Rr = materialTypeName;
  }
  /**
   * Adds a shader define directive that will be included in shader compilation.
   * This will invalidate existing shaders and require recompilation.
   * @param define - The define directive to add (e.g., "USE_NORMAL_MAPPING")
   */
  addShaderDefine(define) {
    this.Sr.add(define);
    this.makeShadersInvalidate();
  }
  /**
   * Removes a shader define directive from the material.
   * This will invalidate existing shaders and require recompilation.
   * @param define - The define directive to remove
   */
  removeShaderDefine(define) {
    this.Sr.delete(define);
    this.makeShadersInvalidate();
  }
  /**
   * Gets all shader define directives currently set on this material.
   * @returns A Set containing all shader defines
   */
  getShaderDefines() {
    return this.Sr;
  }
  /**
   * Checks if a specific shader define directive is set on this material.
   * @param define - The define directive to check for
   * @returns True if the define is set, false otherwise
   */
  isShaderDefine(define) {
    return this.Sr.has(define);
  }
  /**
   * Calculates and updates the material's fingerprint based on current state.
   * The fingerprint is used for shader program caching and state comparison.
   * @internal
   */
  calcFingerPrint() {
    let str = "";
    str += this.alphaMode.index;
    str += this.blendFuncSrcFactor.webgpu;
    str += this.blendFuncDstFactor.webgpu;
    str += this.blendFuncAlphaSrcFactor.webgpu;
    str += this.blendFuncAlphaDstFactor.webgpu;
    str += this.blendEquationMode.webgpu;
    str += this.blendEquationModeAlpha.webgpu;
    str += this.cullFace ? "1" : "0";
    str += this.cullFrontFaceCCW ? "1" : "0";
    str += this.cullFaceBack ? "1" : "0";
    if (str !== this.$d) {
      this.$d = str;
      this.$r();
    }
  }
  $r() {
    this.is++;
    this.c.materialRepository._incrementBindingStateVersion();
  }
  /**
   * Gets the current fingerprint of the material.
   * @returns The material's fingerprint string
   * @internal
   */
  _getFingerPrint() {
    return this.$d;
  }
  /**
   * Signature of the texture/sampler bindings and the true uniforms that are set per
   * material in WebGL2 mode. Materials with the same signature can share one
   * multi-draw batch (their per-draw state differs only in the data texture row).
   * @internal
   */
  _getTextureBindingSignature() {
    var _a, _b, _c, _d, _e;
    if (this.ms === this.Mi) {
      return this.ls;
    }
    let str = "";
    for (const [semantic, field] of this._autoTextureFieldVariablesOnly) {
      const value = field.value;
      str += `${semantic}:${value[0]}:${(_b = (_a = value[1]) == null ? void 0 : _a._textureResourceUid) != null ? _b : -1}:${(_d = (_c = value[2]) == null ? void 0 : _c._samplerResourceUid) != null ? _d : -1};`;
    }
    for (const [semantic, field] of this._autoUniformFieldVariablesOnly) {
      const value = field.value;
      const raw = (_e = value == null ? void 0 : value._v) != null ? _e : value;
      str += `${semantic}:${Array.isArray(raw) || ArrayBuffer.isView(raw) ? Array.from(raw).join(",") : String(raw)};`;
    }
    this.ls = str;
    this.ms = this.Mi;
    return str;
  }
  /**
   * Key of the material state that must be identical for a multi-draw batch:
   * material type, shader semantics variant, shader defines, pipeline fingerprint,
   * texture bindings and true-uniform values.
   * @internal
   */
  _getMultiDrawStateKey() {
    if (this.ns === this.Mi) {
      return this.as;
    }
    this.as = `${this.Rr}|${this._materialContent.getMaterialSemanticsVariantName()}|${[
      ...this.Sr
    ].sort().join(",")}|${this.$d}|${this._getTextureBindingSignature()}`;
    this.ns = this.Mi;
    return this.as;
  }
  ///
  /// Parameter Setters
  ///
  /**
   * Checks if a value is an animated value (implements IAnimatedValue).
   * @param value - The value to check
   * @returns True if the value is an animated value, false otherwise
   */
  _isAnimatedValue(value) {
    return value instanceof AnimatedScalar || value instanceof AnimatedVector2 || value instanceof AnimatedVector3 || value instanceof AnimatedVector4 || value instanceof AnimatedQuaternion || value instanceof AnimatedVectorN;
  }
  /**
   * Sets a parameter value for the specified shader semantic.
   * The parameter can be a static value or an animated value.
   * @param shaderSemanticName - The shader semantic name to set the parameter for
   * @param value - The value to set (can be static or animated)
   */
  setParameter(shaderSemanticName, value) {
    const info = this._allFieldsInfo.get(shaderSemanticName);
    if (info != null) {
      let valueObj;
      if (info.soloDatum) {
        valueObj = this.c.materialRepository._soloDatumFields.get(this.Rr).get(shaderSemanticName);
      } else {
        valueObj = this._allFieldVariables.get(shaderSemanticName);
      }
      if (this._isAnimatedValue(value)) {
        value.setFloat32Array(valueObj.value._v);
        valueObj.value = value;
        this.Mi++;
        this.c.materialRepository._incrementStateVersion();
        this.calcFingerPrint();
      } else {
        const updated = MathClassUtil._setForce(valueObj.value, value);
        if (updated) {
          this.Mi++;
          this.c.materialRepository._incrementStateVersion();
          this.calcFingerPrint();
        }
      }
    }
  }
  /**
   * Sets a texture parameter for the specified shader semantic.
   * If the texture has transparency, the material's alpha mode may be automatically set to Blend.
   * @param shaderSemantic - The shader semantic name for the texture
   * @param texture - The texture to assign
   * @param sampler - Optional sampler to use with the texture. If not provided, uses default sampler
   */
  setTextureParameter(shaderSemantic, texture, sampler) {
    if (Is.not.exist(sampler)) {
      const defaultSampler = new Sampler(this.c, {
        magFilter: TextureParameter.Linear,
        minFilter: TextureParameter.Linear,
        wrapS: TextureParameter.Repeat,
        wrapT: TextureParameter.Repeat
      });
      sampler = defaultSampler;
    }
    if (!sampler.created) {
      sampler.create();
    }
    if (this._allFieldsInfo.has(shaderSemantic)) {
      const array = this._allFieldVariables.get(shaderSemantic);
      if (array.value[1] === texture && array.value[2] === sampler) {
        return;
      }
      const shaderVariable = {
        value: [array.value[0], texture, sampler],
        info: array.info
      };
      this._allFieldVariables.set(shaderSemantic, shaderVariable);
      if (!array.info.isInternalSetting) {
        this._autoFieldVariablesOnly.set(shaderSemantic, shaderVariable);
        if (CompositionType.isTexture(array.info.compositionType)) {
          this._autoTextureFieldVariablesOnly.set(shaderSemantic, shaderVariable);
        }
      }
      if (shaderSemantic === "diffuseColorTexture" || shaderSemantic === "baseColorTexture") {
        if (texture.isTransparent) {
          this.alphaMode = AlphaMode.Blend;
        }
      }
      this.Mi++;
      this.Zr++;
      this.c.materialRepository._incrementStateVersion();
      this.c.materialRepository._incrementBindingStateVersion();
      this.calcFingerPrint();
    }
  }
  /**
   * Gets the texture parameter for the specified shader semantic.
   * @param shaderSemantic - The shader semantic name to get the texture for
   * @returns The texture parameter array or undefined if not found
   */
  getTextureParameter(shaderSemantic) {
    if (this._allFieldsInfo.has(shaderSemantic)) {
      const array = this._allFieldVariables.get(shaderSemantic);
      return array.value;
    }
    return void 0;
  }
  /**
   * Sets a texture parameter from a Promise that resolves to a texture.
   * This is useful for asynchronous texture loading.
   * @param shaderSemantic - The shader semantic name for the texture
   * @param promise - A Promise that resolves to the texture
   */
  setTextureParameterAsPromise(shaderSemantic, promise) {
    promise.then((texture) => {
      if (this._allFieldsInfo.has(shaderSemantic)) {
        const array = this._allFieldVariables.get(shaderSemantic);
        if (array.value[1] === texture) {
          return;
        }
        const shaderVariable = {
          value: [array.value[0], texture],
          info: array.info
        };
        this._allFieldVariables.set(shaderSemantic, shaderVariable);
        if (!array.info.isInternalSetting) {
          this._autoFieldVariablesOnly.set(shaderSemantic, shaderVariable);
          if (CompositionType.isTexture(array.info.compositionType)) {
            this._autoTextureFieldVariablesOnly.set(shaderSemantic, shaderVariable);
          }
        }
        if (shaderSemantic === "diffuseColorTexture" || shaderSemantic === "baseColorTexture") {
          if (texture.isTransparent) {
            this.alphaMode = AlphaMode.Blend;
          }
        }
      }
      this.Mi++;
      this.Zr++;
      this.c.materialRepository._incrementStateVersion();
      this.c.materialRepository._incrementBindingStateVersion();
      this.calcFingerPrint();
    });
  }
  /**
   * Gets the parameter value for the specified shader semantic.
   * @param shaderSemantic - The shader semantic name to get the parameter for
   * @returns The parameter value or undefined if not found
   */
  getParameter(shaderSemantic) {
    var _a, _b;
    const info = this._allFieldsInfo.get(shaderSemantic);
    if (info != null) {
      if (info.soloDatum) {
        return (_a = this.c.materialRepository._soloDatumFields.get(this.Rr).get(shaderSemantic)) == null ? void 0 : _a.value;
      }
      return (_b = this._allFieldVariables.get(shaderSemantic)) == null ? void 0 : _b.value;
    }
    return void 0;
  }
  /**
   * Checks if the shader program is ready for the given primitive.
   * @param primitive - The primitive to check shader readiness for
   * @returns True if the shader program is ready, false otherwise
   */
  isShaderProgramReady(primitive) {
    const primitiveFingerPrint = primitive._getFingerPrint();
    const componentStateVersion = this._shaderProgramComponentStateVersionMap.get(primitiveFingerPrint);
    if (componentStateVersion !== Component.getStateVersion(this.c)) {
      this._shaderProgramUidMap.delete(primitiveFingerPrint);
      this._shaderProgramComponentStateVersionMap.delete(primitiveFingerPrint);
      return false;
    }
    return this._shaderProgramUidMap.has(primitiveFingerPrint);
  }
  /**
   * Sets up uniform locations for material nodes in the shader program.
   * @internal Called from WebGLStrategyWebGL2 only
   * @param primitive - The primitive to set up uniforms for
   */
  _setUniformLocationsOfMaterialNodes(primitive) {
    const webglResourceRepository = this.c.webglResourceRepository;
    let array = [];
    if (this._materialContent != null) {
      const semanticsInfoArray = this._materialContent._semanticsInfoArray;
      array = array.concat(semanticsInfoArray);
    }
    const shaderProgramUid = this._shaderProgramUidMap.get(primitive._getFingerPrint());
    webglResourceRepository.setupUniformLocations(this.c.config, shaderProgramUid, array);
  }
  /**
   * Gets the shader program UID for the given primitive.
   * @param primitive - The primitive to get the shader program UID for
   * @returns The shader program UID or -1 if not found
   */
  getShaderProgramUid(primitive) {
    var _a;
    const primitiveFingerPrint = primitive._getFingerPrint();
    return (_a = this._shaderProgramUidMap.get(primitiveFingerPrint)) != null ? _a : -1;
  }
  /**
   * Adds a primitive to the list of primitives that belong to this material.
   * @internal Called from Primitive class only
   * @param primitive - The primitive to add
   */
  _addBelongPrimitive(primitive) {
    this.cs.set(primitive.primitiveUid, primitive);
  }
  /**
   * Gets all primitives that belong to this material.
   * @returns A Map of primitive UIDs to Primitive objects
   */
  getBelongPrimitives() {
    return this.cs;
  }
  /**
   * Creates a WebGL shader program for this material and the given primitive.
   * @internal Called from WebGLStrategyWebGL2
   * @param componentDataAccessMethodDefinitionsForVertexShader - method definitions for component data access for vertex shader
   * @param componentDataAccessMethodDefinitionsForPixelShader - method definitions for component data access for pixel shader
   * @param propertySetterOfGlobalDataRepository - Function to set shader properties of global data repository
   * @param propertySetterOfMaterial - Function to set shader properties of material
   * @param morphedPositionGetter - Function to get the morphed position
   * @param primitive - The primitive to create the program for
   * @returns A tuple containing the program UID and whether it's a new program
   */
  _createProgramWebGL(engine, componentDataAccessMethodDefinitionsForVertexShader, componentDataAccessMethodDefinitionsForPixelShader, propertySetterOfGlobalDataRepository, propertySetterOfMaterial, morphedPositionGetter, primitive) {
    const [programUid, newOne] = _createProgramAsSingleOperationWebGL(
      engine,
      this,
      componentDataAccessMethodDefinitionsForVertexShader,
      componentDataAccessMethodDefinitionsForPixelShader,
      propertySetterOfGlobalDataRepository,
      propertySetterOfMaterial,
      morphedPositionGetter,
      primitive
    );
    const primitiveFingerPrint = primitive._getFingerPrint();
    this._shaderProgramUidMap.set(primitiveFingerPrint, programUid);
    this._shaderProgramComponentStateVersionMap.set(primitiveFingerPrint, Component.getStateVersion(engine));
    this.c.materialRepository._incrementStateVersion();
    return [programUid, newOne];
  }
  /**
   * Creates a WebGPU shader program for this material and the given primitive.
   * @param primitive - The primitive to create the program for
   * @param componentDataAccessMethodDefinitionsForVertexShader - method definitions for component data access for vertex shader
   * @param componentDataAccessMethodDefinitionsForPixelShader - method definitions for component data access for pixel shader
   * @param propertySetterOfGlobalDataRepository - Function to set shader properties of global data repository
   * @param propertySetterOfMaterial - Function to set shader properties of material
   * @param morphedPositionGetter - Function to get the morphed position
   */
  _createProgramWebGpu(engine, primitive, componentDataAccessMethodDefinitionsForVertexShader, componentDataAccessMethodDefinitionsForPixelShader, propertySetterOfGlobalDataRepository, propertySetterOfMaterial, morphedPositionGetter) {
    const programUid = _createProgramAsSingleOperationWebGpu(
      engine,
      this,
      primitive,
      componentDataAccessMethodDefinitionsForVertexShader,
      componentDataAccessMethodDefinitionsForPixelShader,
      propertySetterOfGlobalDataRepository,
      propertySetterOfMaterial,
      morphedPositionGetter
    );
    const primitiveFingerPrint = primitive._getFingerPrint();
    this._shaderProgramUidMap.set(primitiveFingerPrint, programUid);
    this._shaderProgramComponentStateVersionMap.set(primitiveFingerPrint, Component.getStateVersion(engine));
    this.c.materialRepository._incrementStateVersion();
  }
  /**
   * Creates a shader program using updated shader source code.
   * @internal Called from WebGLStrategyWebGL2
   * @param updatedShaderSources - The updated shader source code
   * @param primitive - The primitive to create the program for
   * @param onError - Optional error callback function
   * @returns A tuple containing the program UID and whether it's a new program
   */
  _createProgramByUpdatedSources(updatedShaderSources, primitive, onError) {
    const [programUid, newOne] = _createProgramAsSingleOperationByUpdatedSources(
      this.c,
      this,
      primitive,
      this._materialContent,
      updatedShaderSources,
      onError
    );
    const primitiveFingerPrint = primitive._getFingerPrint();
    this._shaderProgramUidMap.set(primitiveFingerPrint, programUid);
    this._shaderProgramComponentStateVersionMap.set(primitiveFingerPrint, Component.getStateVersion(this.c));
    if (programUid > 0) {
    }
    this.c.materialRepository._incrementStateVersion();
    return [programUid, newOne];
  }
  /**
   * Sets up basic uniform locations in the shader program.
   * @internal Called by WebGLStrategyWebGL2 only
   * @param primitive - The primitive to set up uniforms for
   */
  _setupBasicUniformsLocations(primitive) {
    const webglResourceRepository = this.c.webglResourceRepository;
    const primitiveFingerPrint = primitive._getFingerPrint();
    const shaderProgramUid = this._shaderProgramUidMap.get(primitiveFingerPrint);
    webglResourceRepository.setupBasicUniformLocations(shaderProgramUid);
  }
  /**
   * Sets up additional uniform locations in the shader program.
   * @internal Called by WebGLStrategyWebGL2 only
   * @param shaderSemantics - Array of shader semantics to set up
   * @param primitive - The primitive to set up uniforms for
   */
  _setupAdditionalUniformLocations(shaderSemantics, primitive) {
    const webglResourceRepository = this.c.webglResourceRepository;
    const primitiveFingerPrint = primitive._getFingerPrint();
    const shaderProgramUid = this._shaderProgramUidMap.get(primitiveFingerPrint);
    webglResourceRepository.setupUniformLocations(this.c.config, shaderProgramUid, shaderSemantics);
  }
  /**
   * Sets internal setting parameters to GPU for WebGPU rendering.
   * @param params - Object containing material and rendering arguments
   */
  _setInternalSettingParametersToGpuWebGpu({
    engine,
    material,
    args
  }) {
    this._materialContent._setInternalSettingParametersToGpuWebGpu({
      engine,
      material,
      args
    });
  }
  /**
   * Sets parameters to GPU for WebGL rendering per material.
   * @internal Called from WebGLStrategyWebGL2 only
   * @param params - Object containing rendering parameters
   */
  _setParametersToGpuWebGL({
    engine,
    material,
    shaderProgram,
    firstTime,
    args
  }) {
    this.os(firstTime, shaderProgram);
    this._materialContent._setInternalSettingParametersToGpuWebGLPerMaterial({
      engine,
      material,
      shaderProgram,
      firstTime,
      args
    });
    this.ps({
      shaderProgram,
      firstTime
    });
  }
  /**
   * Sets parameters to GPU for WebGL rendering per shader program.
   * @param params - Object containing rendering parameters
   */
  _setParametersToGpuWebGLPerShaderProgram({
    engine,
    material,
    shaderProgram,
    firstTime,
    args
  }) {
    this._materialContent._setInternalSettingParametersToGpuWebGLPerShaderProgram({
      engine,
      material,
      shaderProgram,
      firstTime,
      args
    });
  }
  /**
   * Sets parameters to GPU for WebGL rendering per primitive.
   * @param params - Object containing rendering parameters
   */
  _setParametersToGpuWebGLPerPrimitive({
    material,
    shaderProgram,
    firstTime,
    args
  }) {
    this._materialContent._setInternalSettingParametersToGpuWebGLPerPrimitive({
      material,
      shaderProgram,
      firstTime,
      args
    });
  }
  /**
   * Sets parameters to GPU for WebGL rendering without internal settings.
   * @param params - Object containing rendering parameters
   */
  _setParametersToGpuWebGLWithOutInternalSetting({
    shaderProgram,
    firstTime
  }) {
    this.os(firstTime, shaderProgram);
    this.ps({
      shaderProgram,
      firstTime
    });
  }
  /**
   * Gets shader property strings for vertex and pixel shaders.
   * @internal
   * @param propertySetter - Function to set shader properties
   * @returns Object containing vertex and pixel property strings
   */
  _getProperties(engine, propertySetterOfGlobalDataRepository, propertySetterOfMaterial) {
    let vertexPropertiesStr = "";
    let pixelPropertiesStr = "";
    this._allFieldsInfo.forEach((info) => {
      if (info.stage === ShaderType.VertexShader || info.stage === ShaderType.VertexAndPixelShader) {
        vertexPropertiesStr += propertySetterOfMaterial(engine, this.Rr, info);
      }
      if (info.stage === ShaderType.PixelShader || info.stage === ShaderType.VertexAndPixelShader) {
        pixelPropertiesStr += propertySetterOfMaterial(engine, this.Rr, info);
      }
    });
    const globalDataRepository = engine.globalDataRepository;
    [vertexPropertiesStr, pixelPropertiesStr] = globalDataRepository._addPropertiesStr(
      vertexPropertiesStr,
      pixelPropertiesStr,
      propertySetterOfGlobalDataRepository
    );
    return { vertexPropertiesStr, pixelPropertiesStr };
  }
  /**
   * Sets automatic parameters to GPU for WebGL rendering.
   * @private
   * @param firstTime - Whether this is the first time setting parameters
   * @param shaderProgram - The WebGL shader program
   */
  os(firstTime, shaderProgram) {
    const webglResourceRepository = this.c.webglResourceRepository;
    for (const [, value] of this._autoTextureFieldVariablesOnly) {
      const info = value.info;
      if (firstTime) {
        webglResourceRepository.setUniform1iForTexture(shaderProgram, info.semantic, value.value);
      } else {
        webglResourceRepository.bindTexture(info, value.value);
      }
    }
    for (const [, value] of this._autoUniformFieldVariablesOnly) {
      const info = value.info;
      if (info.needUniformInDataTextureMode) {
        webglResourceRepository.setUniformValue(shaderProgram, info.semantic, firstTime, value.value);
      }
    }
  }
  /**
   * Sets solo datum parameters to GPU for WebGL rendering.
   * @private
   * @param params - Object containing rendering parameters
   */
  ps({
    shaderProgram,
    firstTime
  }) {
    const webglResourceRepository = this.c.webglResourceRepository;
    const materialTypeName = this.Rr;
    const map = this.c.materialRepository._soloDatumFields.get(materialTypeName);
    if (map == null) return;
    const values = map.values();
    for (const value of values) {
      const info = value.info;
      if (CompositionType.isTexture(info.compositionType)) {
        if (!info.isInternalSetting) {
          if (firstTime) {
            webglResourceRepository.setUniformValue(shaderProgram, info.semantic, firstTime, value.value);
          } else {
            webglResourceRepository.bindTexture(info, value.value);
          }
        }
      }
    }
  }
  /**
   * Sets the blend equation mode for blending operations.
   * This method only works if the alpha mode is set to blend.
   * @param blendEquationMode - The blend equation mode (e.g., gl.FUNC_ADD)
   * @param blendEquationModeAlpha - Optional separate blend equation mode for alpha channel
   */
  setBlendEquationMode(blendEquationMode, blendEquationModeAlpha) {
    this.Tr = blendEquationMode;
    this.Ur = blendEquationModeAlpha != null ? blendEquationModeAlpha : blendEquationMode;
    this.bs();
    this.Mi++;
    this.c.materialRepository._incrementStateVersion();
    this.calcFingerPrint();
  }
  /**
   * Handles special cases for Min/Max blend equations due to WebGPU limitations.
   * @private
   */
  bs() {
    if (this.Tr === Blend.Min || this.Tr === Blend.Max) {
      this.Wr = Blend.One;
      this.Vr = Blend.One;
    }
    if (this.Ur === Blend.Min || this.Ur === Blend.Max) {
      this.Yr = Blend.One;
      this.Xr = Blend.One;
    }
  }
  /**
   * Sets separate blend function factors for RGB and alpha channels.
   * This method only works if the alpha mode is set to blend.
   * @param blendFuncSrcFactor - Source blend factor for RGB
   * @param blendFuncDstFactor - Destination blend factor for RGB
   * @param blendFuncAlphaSrcFactor - Source blend factor for alpha
   * @param blendFuncAlphaDstFactor - Destination blend factor for alpha
   */
  setBlendFuncSeparateFactor(blendFuncSrcFactor, blendFuncDstFactor, blendFuncAlphaSrcFactor, blendFuncAlphaDstFactor) {
    this.Vr = blendFuncSrcFactor;
    this.Wr = blendFuncDstFactor;
    this.Xr = blendFuncAlphaSrcFactor;
    this.Yr = blendFuncAlphaDstFactor;
    this.bs();
    this.Mi++;
    this.c.materialRepository._incrementStateVersion();
    this.calcFingerPrint();
  }
  /**
   * Sets blend function factors for both RGB and alpha channels.
   * This method only works if the alpha mode is set to blend.
   * @param blendFuncSrcFactor - Source blend factor
   * @param blendFuncDstFactor - Destination blend factor
   */
  setBlendFuncFactor(blendFuncSrcFactor, blendFuncDstFactor) {
    this.Vr = blendFuncSrcFactor;
    this.Wr = blendFuncDstFactor;
    this.Xr = blendFuncSrcFactor;
    this.Yr = blendFuncDstFactor;
    this.bs();
    this.Mi++;
    this.c.materialRepository._incrementStateVersion();
    this.calcFingerPrint();
  }
  // setMaterialNode(materialNode: AbstractMaterialNode) {
  //   this.__materialNode = materialNode;
  // }
  ///
  /// Getters
  ///
  /**
   * Checks if the material is in blend mode.
   * @returns True if alpha mode is Blend, false otherwise
   */
  isBlend() {
    if (this.alphaMode === AlphaMode.Blend) {
      return true;
    }
    return false;
  }
  /**
   * Checks if the material is translucent but not in blend mode.
   * @returns True if alpha mode is Opaque or Mask and the material is translucent
   */
  isTranslucentOpaque() {
    if (this.alphaMode !== AlphaMode.Blend && this.isTranslucent) {
      return true;
    }
    return false;
  }
  /**
   * Checks if the material is either in blend mode or translucent.
   * @returns True if in blend mode or translucent, false otherwise
   */
  isBlendOrTranslucent() {
    if (this.alphaMode === AlphaMode.Blend || this.isTranslucent) {
      return true;
    }
    return false;
  }
  /**
   * Checks if the material is in opaque mode.
   * @returns True if alpha mode is Opaque, false otherwise
   */
  isOpaque() {
    return this.alphaMode === AlphaMode.Opaque;
  }
  /**
   * Checks if the material is in mask mode.
   * @returns True if alpha mode is Mask, false otherwise
   */
  isMask() {
    return this.alphaMode === AlphaMode.Mask;
  }
  /**
   * Sets whether alpha-to-coverage is enabled for this material.
   * NOTE: To apply alpha-to-coverage, the output alpha value must not be fixed to a constant value.
   * However, some shaders in Rhodonite fix the output alpha value to 1 by setAlphaIfNotInAlphaBlendMode.
   * The shader needs to be improved to properly use alpha-to-coverage.
   * @param alphaToCoverage - Whether to apply alpha-to-coverage to this material
   */
  set alphaToCoverage(alphaToCoverage) {
    if (alphaToCoverage && this.alphaMode === AlphaMode.Blend) {
      Logger.default.warn(
        "If you set alphaToCoverage = true on a material whose AlphaMode is Translucent, you may get drawing problems."
      );
    }
    this.hs = alphaToCoverage;
    this.makeShadersInvalidate();
    this.calcFingerPrint();
  }
  /**
   * Gets whether alpha-to-coverage is enabled for this material.
   * @returns True if alpha-to-coverage is enabled, false otherwise
   */
  get alphaToCoverage() {
    return this.hs;
  }
  /**
   * Gets the material type ID.
   * @returns The material type ID
   */
  get materialTID() {
    return this.es;
  }
  /**
   * Gets an array of all field information for this material.
   * @returns Array of shader semantics information
   */
  get fieldsInfoArray() {
    return Array.from(this._allFieldsInfo.values());
  }
  /**
   * Gets the blend equation mode for RGB channels.
   * @returns The blend equation mode
   */
  get blendEquationMode() {
    return this.Tr;
  }
  /**
   * Gets the blend equation mode for the alpha channel.
   * @returns The alpha blend equation mode
   */
  get blendEquationModeAlpha() {
    return this.Ur;
  }
  /**
   * Gets the source blend factor for RGB channels.
   * @returns The source blend factor
   */
  get blendFuncSrcFactor() {
    return this.Vr;
  }
  /**
   * Gets the destination blend factor for RGB channels.
   * @returns The destination blend factor
   */
  get blendFuncDstFactor() {
    return this.Wr;
  }
  /**
   * Gets the source blend factor for the alpha channel.
   * @returns The alpha source blend factor
   */
  get blendFuncAlphaSrcFactor() {
    return this.Xr;
  }
  /**
   * Gets the destination blend factor for the alpha channel.
   * @returns The alpha destination blend factor
   */
  get blendFuncAlphaDstFactor() {
    return this.Yr;
  }
  /**
   * Gets the current alpha mode of the material.
   * @returns The alpha mode
   */
  get alphaMode() {
    return this.gs;
  }
  /**
   * Sets the alpha mode of the material.
   * This will invalidate shaders and recalculate the fingerprint.
   * @param mode - The alpha mode to set
   */
  set alphaMode(mode) {
    this.gs = mode;
    this.calcFingerPrint();
    this.makeShadersInvalidate();
  }
  /**
   * Gets the unique material ID.
   * @returns The material UID
   */
  get materialUID() {
    return this.ds;
  }
  /**
   * Gets the material serial ID within the material type.
   * @returns The material SID
   */
  get materialSID() {
    return this.fs;
  }
  /**
   * Checks if this material supports skinning.
   * @returns True if skinning is supported, false otherwise
   */
  get isSkinning() {
    return this._materialContent.isSkinning;
  }
  /**
   * Checks if this material supports morphing.
   * @returns True if morphing is supported, false otherwise
   */
  get isMorphing() {
    return this._materialContent.isMorphing;
  }
  /**
   * Checks if this material supports lighting.
   * @returns True if lighting is supported, false otherwise
   */
  get isLighting() {
    return this._materialContent.isLighting;
  }
  /**
   * Gets the material type name.
   * This includes the full type name with variation identifier for internal use.
   * @returns The material type name
   */
  get materialTypeName() {
    return this.Rr;
  }
  /**
   * Gets the base material name without variation identifier.
   * This is the human-readable material type name (e.g., "PbrUber", "ClassicUber").
   * @returns The base material name
   */
  get baseMaterialName() {
    return this._materialContent.getBaseMaterialName();
  }
  /**
   * Gets the material variation identifier.
   * This represents the parameter variation part of the material type.
   * @returns The variation identifier string
   */
  get materialVariationIdentifier() {
    return this._materialContent.getMaterialVariationIdentifier();
  }
  /**
   * Gets the current state version of this material.
   * This is incremented whenever the material's state changes.
   * @returns The state version number
   */
  get stateVersion() {
    return this.Mi;
  }
  /**
   * Invalidates all shader programs associated with this material.
   * This forces shader recompilation on the next render.
   */
  makeShadersInvalidate() {
    this._shaderProgramUidMap.clear();
    this._shaderProgramComponentStateVersionMap.clear();
    this.Mi++;
    this.$r();
    this.c.materialRepository._incrementStateVersion();
  }
  updateStateVersion() {
    this.Mi++;
    this.$r();
    this.c.materialRepository._incrementStateVersion();
  }
  /**
   * Gets the version that is bumped only when the render pipeline
   * configuration changes (shader program, blend state, cull mode, ...).
   * Uniform parameter updates do not affect this version.
   * @returns The pipeline state version number
   */
  get pipelineStateVersion() {
    return this.is;
  }
  /**
   * Gets the version that is bumped only when texture or sampler bindings
   * change. Used to invalidate WebGPU bind groups and render bundles.
   * @returns The texture binding state version number
   */
  get textureStateVersion() {
    return this.Zr;
  }
  /**
   * Gets the shader node JSON data for node-based materials.
   * This is used by RHODONITE_materials_node extension.
   * @returns The shader node JSON data, or undefined if not a node-based material
   */
  get shaderNodeJson() {
    return this._r;
  }
  /**
   * Sets the shader node JSON data for node-based materials.
   * This marks the material as a node-based custom shader material.
   * @param json - The shader node JSON data
   */
  set shaderNodeJson(json) {
    this._r = json;
  }
  /**
   * Gets the uniform values for node-based materials.
   * @returns The uniform values object, or undefined if not set
   */
  get shaderNodeUniforms() {
    return this.js;
  }
  /**
   * Sets the uniform values for node-based materials.
   * @param uniforms - The uniform values object
   */
  set shaderNodeUniforms(uniforms) {
    this.js = uniforms;
  }
  /**
   * Checks if this material is a node-based custom shader material.
   * @returns True if this is a node-based material (has shaderNodeJson set)
   */
  get isNodeBasedMaterial() {
    return this._r != null;
  }
  /**
   * Gets the shader node file name for export.
   * This is used to specify the .rmn file name in the RHODONITE_materials_node extension.
   * @returns The shader node file name, or undefined if not set
   */
  get shaderNodeFileName() {
    return this.ks;
  }
  /**
   * Sets the shader node file name for export.
   * @param fileName - The .rmn file name to use in the RHODONITE_materials_node extension
   */
  set shaderNodeFileName(fileName) {
    this.ks = fileName;
  }
};
export {
  Material
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0ZXJpYWxzL2NvcmUvTWF0ZXJpYWwudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHtcbiAgQ0dBUElSZXNvdXJjZUhhbmRsZSxcbiAgSW5kZXgsXG4gIE1hdGVyaWFsU0lELFxuICBNYXRlcmlhbFRJRCxcbiAgTWF0ZXJpYWxVSUQsXG4gIFByaW1pdGl2ZVVJRCxcbn0gZnJvbSAnLi4vLi4vLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHR5cGUgeyBSZW5kZXJpbmdBcmdXZWJHTCwgUmVuZGVyaW5nQXJnV2ViR3B1IH0gZnJvbSAnLi4vLi4vLi4vd2ViZ2wvdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHR5cGUgeyBTaGFkZXJTb3VyY2VzIH0gZnJvbSAnLi4vLi4vLi4vd2ViZ2wvV2ViR0xTdHJhdGVneSc7XG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuLi8uLi9jb3JlL0NvbXBvbmVudCc7XG5pbXBvcnQgeyBSbk9iamVjdCB9IGZyb20gJy4uLy4uL2NvcmUvUm5PYmplY3QnO1xuaW1wb3J0IHsgdHlwZSBTaGFkZXJTZW1hbnRpY3NJbmZvLCBUZXh0dXJlUGFyYW1ldGVyIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMnO1xuaW1wb3J0IHsgQWxwaGFNb2RlLCB0eXBlIEFscGhhTW9kZUVudW0gfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9BbHBoYU1vZGUnO1xuaW1wb3J0IHsgQmxlbmQsIHR5cGUgQmxlbmRFbnVtIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvQmxlbmQnO1xuaW1wb3J0IHsgQ29tcG9zaXRpb25UeXBlIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvQ29tcG9zaXRpb25UeXBlJztcbmltcG9ydCB0eXBlIHtcbiAgZ2V0U2hhZGVyUHJvcGVydHlGdW5jT2ZHbG9iYWxEYXRhUmVwb3NpdG9yeSxcbiAgZ2V0U2hhZGVyUHJvcGVydHlGdW5jT2ZNYXRlcmlhbCxcbiAgU2hhZGVyU2VtYW50aWNzTmFtZSxcbn0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvU2hhZGVyU2VtYW50aWNzJztcbmltcG9ydCB7IFNoYWRlclR5cGUgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9TaGFkZXJUeXBlJztcbmltcG9ydCB0eXBlIHsgUHJpbWl0aXZlIH0gZnJvbSAnLi4vLi4vZ2VvbWV0cnkvUHJpbWl0aXZlJztcbmltcG9ydCB7IEFuaW1hdGVkUXVhdGVybmlvbiB9IGZyb20gJy4uLy4uL21hdGgvQW5pbWF0ZWRRdWF0ZXJuaW9uJztcbmltcG9ydCB7IEFuaW1hdGVkU2NhbGFyIH0gZnJvbSAnLi4vLi4vbWF0aC9BbmltYXRlZFNjYWxhcic7XG5pbXBvcnQgeyBBbmltYXRlZFZlY3RvcjIgfSBmcm9tICcuLi8uLi9tYXRoL0FuaW1hdGVkVmVjdG9yMic7XG5pbXBvcnQgeyBBbmltYXRlZFZlY3RvcjMgfSBmcm9tICcuLi8uLi9tYXRoL0FuaW1hdGVkVmVjdG9yMyc7XG5pbXBvcnQgeyBBbmltYXRlZFZlY3RvcjQgfSBmcm9tICcuLi8uLi9tYXRoL0FuaW1hdGVkVmVjdG9yNCc7XG5pbXBvcnQgeyBBbmltYXRlZFZlY3Rvck4gfSBmcm9tICcuLi8uLi9tYXRoL0FuaW1hdGVkVmVjdG9yTic7XG5pbXBvcnQgdHlwZSB7IElBbmltYXRlZFZhbHVlIH0gZnJvbSAnLi4vLi4vbWF0aC9JQW5pbWF0ZWRWYWx1ZSc7XG5pbXBvcnQgeyBNYXRoQ2xhc3NVdGlsIH0gZnJvbSAnLi4vLi4vbWF0aC9NYXRoQ2xhc3NVdGlsJztcbmltcG9ydCB7IElzIH0gZnJvbSAnLi4vLi4vbWlzYy9Jcyc7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICcuLi8uLi9taXNjL0xvZ2dlcic7XG5pbXBvcnQgdHlwZSB7IEVuZ2luZSB9IGZyb20gJy4uLy4uL3N5c3RlbS9FbmdpbmUnO1xuaW1wb3J0IHR5cGUgeyBBYnN0cmFjdFRleHR1cmUgfSBmcm9tICcuLi8uLi90ZXh0dXJlcy9BYnN0cmFjdFRleHR1cmUnO1xuaW1wb3J0IHsgU2FtcGxlciB9IGZyb20gJy4uLy4uL3RleHR1cmVzL1NhbXBsZXInO1xuaW1wb3J0IHR5cGUgeyBBYnN0cmFjdE1hdGVyaWFsQ29udGVudCB9IGZyb20gJy4vQWJzdHJhY3RNYXRlcmlhbENvbnRlbnQnO1xuaW1wb3J0IHR5cGUgeyBNYXRlcmlhbFR5cGVOYW1lLCBTaGFkZXJWYXJpYWJsZSB9IGZyb20gJy4vTWF0ZXJpYWxUeXBlcyc7XG5pbXBvcnQge1xuICBfY3JlYXRlUHJvZ3JhbUFzU2luZ2xlT3BlcmF0aW9uQnlVcGRhdGVkU291cmNlcyxcbiAgX2NyZWF0ZVByb2dyYW1Bc1NpbmdsZU9wZXJhdGlvbldlYkdMLFxuICBfY3JlYXRlUHJvZ3JhbUFzU2luZ2xlT3BlcmF0aW9uV2ViR3B1LFxufSBmcm9tICcuL1NoYWRlckhhbmRsZXInO1xuXG50eXBlIFByaW1pdGl2ZUZpbmdlclByaW50ID0gc3RyaW5nO1xuXG4vKipcbiAqIFRoZSBNYXRlcmlhbCBjbGFzcyByZXByZXNlbnRzIGEgbWF0ZXJpYWwgZGVmaW5pdGlvbiBmb3IgM0QgcmVuZGVyaW5nIGluIHRoZSBSaG9kb25pdGUgZW5naW5lLlxuICpcbiAqIEEgbWF0ZXJpYWwgZGVmaW5lcyBob3cgYSAzRCBvYmplY3QncyBzdXJmYWNlIGFwcGVhcnMgd2hlbiByZW5kZXJlZCwgaW5jbHVkaW5nOlxuICogLSBTaGFkZXIgcHJvZ3JhbXMgYW5kIHRoZWlyIHBhcmFtZXRlcnNcbiAqIC0gVGV4dHVyZSBiaW5kaW5ncyBhbmQgc2FtcGxpbmcgY29uZmlndXJhdGlvbnNcbiAqIC0gQmxlbmRpbmcgYW5kIHRyYW5zcGFyZW5jeSBzZXR0aW5nc1xuICogLSBSZW5kZXJpbmcgc3RhdGUgY29uZmlndXJhdGlvbiAoY3VsbGluZywgZGVwdGggdGVzdGluZywgZXRjLilcbiAqXG4gKiAjIyBLZXkgRmVhdHVyZXM6XG4gKiAtICoqU2hhZGVyIE1hbmFnZW1lbnQqKjogQXV0b21hdGljYWxseSBjb21waWxlcyBhbmQgY2FjaGVzIHNoYWRlciBwcm9ncmFtcyBwZXIgcHJpbWl0aXZlXG4gKiAtICoqUGFyYW1ldGVyIEJpbmRpbmcqKjogU3VwcG9ydHMgYm90aCBzdGF0aWMgYW5kIGFuaW1hdGVkIHNoYWRlciBwYXJhbWV0ZXJzXG4gKiAtICoqVGV4dHVyZSBIYW5kbGluZyoqOiBNYW5hZ2VzIHRleHR1cmUgYmluZGluZ3Mgd2l0aCBjdXN0b21pemFibGUgc2FtcGxlcnNcbiAqIC0gKipCbGVuZGluZyBDb250cm9sKio6IEZpbmUtZ3JhaW5lZCBjb250cm9sIG92ZXIgYWxwaGEgYmxlbmRpbmcgb3BlcmF0aW9uc1xuICogLSAqKk11bHRpLUFQSSBTdXBwb3J0Kio6IENvbXBhdGlibGUgd2l0aCBib3RoIFdlYkdMIGFuZCBXZWJHUFUgcmVuZGVyaW5nIGJhY2tlbmRzXG4gKiAtICoqUGVyZm9ybWFuY2UgT3B0aW1pemF0aW9uKio6IEZpbmdlcnByaW50LWJhc2VkIGNhY2hpbmcgYW5kIHN0YXRlIHZlcnNpb25pbmdcbiAqXG4gKiAjIyBNYXRlcmlhbCBUeXBlczpcbiAqIE1hdGVyaWFscyBhcmUgY2F0ZWdvcml6ZWQgYnkgdHlwZSAoZS5nLiwgUEJSLCBQaG9uZywgQ3VzdG9tKSBhbmQgY2FuIHN1cHBvcnQ6XG4gKiAtIFNraW5uaW5nIGFuaW1hdGlvbnMgZm9yIHNrZWxldGFsIG1lc2hlc1xuICogLSBNb3JwaGluZyBhbmltYXRpb25zIGZvciB2ZXJ0ZXgtYmFzZWQgZGVmb3JtYXRpb25zXG4gKiAtIExpZ2h0aW5nIGNhbGN1bGF0aW9ucyB3aXRoIHZhcmlvdXMgbW9kZWxzXG4gKlxuICogIyMgVXNhZ2UgRXhhbXBsZXM6XG4gKiBgYGB0eXBlc2NyaXB0XG4gKiAvLyBTZXQgYSBiYXNpYyBwYXJhbWV0ZXJcbiAqIG1hdGVyaWFsLnNldFBhcmFtZXRlcignYmFzZUNvbG9yRmFjdG9yJywgWzEuMCwgMC41LCAwLjAsIDEuMF0pO1xuICpcbiAqIC8vIEFzc2lnbiBhIHRleHR1cmUgd2l0aCBjdXN0b20gc2FtcGxlclxuICogY29uc3Qgc2FtcGxlciA9IG5ldyBTYW1wbGVyKHsgbWFnRmlsdGVyOiBUZXh0dXJlUGFyYW1ldGVyLkxpbmVhciB9KTtcbiAqIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoJ2Jhc2VDb2xvclRleHR1cmUnLCB0ZXh0dXJlLCBzYW1wbGVyKTtcbiAqXG4gKiAvLyBDb25maWd1cmUgYmxlbmRpbmcgZm9yIHRyYW5zcGFyZW5jeVxuICogbWF0ZXJpYWwuYWxwaGFNb2RlID0gQWxwaGFNb2RlLkJsZW5kO1xuICogbWF0ZXJpYWwuc2V0QmxlbmRGdW5jRmFjdG9yKEJsZW5kLlNyY0FscGhhLCBCbGVuZC5PbmVNaW51c1NyY0FscGhhKTtcbiAqIGBgYFxuICpcbiAqICMjIFN0YXRlIE1hbmFnZW1lbnQ6XG4gKiBUaGUgbWF0ZXJpYWwgbWFpbnRhaW5zIGludGVybmFsIHN0YXRlIHZlcnNpb25pbmcgZm9yIGVmZmljaWVudCBjaGFuZ2UgZGV0ZWN0aW9uXG4gKiBhbmQgc2hhZGVyIHByb2dyYW0gaW52YWxpZGF0aW9uIHdoZW4gcGFyYW1ldGVycyBjaGFuZ2UuXG4gKlxuICogQHNlZSB7QGxpbmsgQWJzdHJhY3RNYXRlcmlhbENvbnRlbnR9IGZvciBtYXRlcmlhbC1zcGVjaWZpYyBpbXBsZW1lbnRhdGlvbnNcbiAqIEBzZWUge0BsaW5rIEFscGhhTW9kZX0gZm9yIHRyYW5zcGFyZW5jeSBjb25maWd1cmF0aW9uIG9wdGlvbnNcbiAqIEBzZWUge0BsaW5rIFByaW1pdGl2ZX0gZm9yIGdlb21ldHJ5IHRoYXQgdXNlcyBtYXRlcmlhbHNcbiAqL1xuZXhwb3J0IGNsYXNzIE1hdGVyaWFsIGV4dGVuZHMgUm5PYmplY3Qge1xuICBwcml2YXRlIF9fZW5naW5lOiBFbmdpbmU7XG4gIC8vIEludGVybmFsIFJlc291cmNlc1xuICBfX21hdGVyaWFsVHlwZU5hbWU6IE1hdGVyaWFsVHlwZU5hbWU7XG4gIF9tYXRlcmlhbENvbnRlbnQ6IEFic3RyYWN0TWF0ZXJpYWxDb250ZW50O1xuICBfYWxsRmllbGRWYXJpYWJsZXM6IE1hcDxTaGFkZXJTZW1hbnRpY3NOYW1lLCBTaGFkZXJWYXJpYWJsZT4gPSBuZXcgTWFwKCk7XG4gIF9hdXRvRmllbGRWYXJpYWJsZXNPbmx5OiBNYXA8U2hhZGVyU2VtYW50aWNzTmFtZSwgU2hhZGVyVmFyaWFibGU+ID0gbmV3IE1hcCgpO1xuICBfYXV0b1RleHR1cmVGaWVsZFZhcmlhYmxlc09ubHk6IE1hcDxTaGFkZXJTZW1hbnRpY3NOYW1lLCBTaGFkZXJWYXJpYWJsZT4gPSBuZXcgTWFwKCk7XG4gIF9hdXRvVW5pZm9ybUZpZWxkVmFyaWFibGVzT25seTogTWFwPFNoYWRlclNlbWFudGljc05hbWUsIFNoYWRlclZhcmlhYmxlPiA9IG5ldyBNYXAoKTtcbiAgX2FsbEZpZWxkc0luZm86IE1hcDxTaGFkZXJTZW1hbnRpY3NOYW1lLCBTaGFkZXJTZW1hbnRpY3NJbmZvPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBfX2JlbG9uZ1ByaW1pdGl2ZXM6IE1hcDxQcmltaXRpdmVVSUQsIFByaW1pdGl2ZT4gPSBuZXcgTWFwKCk7XG5cbiAgLy8gSWRzXG4gIHByaXZhdGUgX3NoYWRlclByb2dyYW1VaWRNYXA6IE1hcDxQcmltaXRpdmVGaW5nZXJQcmludCwgQ0dBUElSZXNvdXJjZUhhbmRsZT4gPSBuZXcgTWFwKCk7XG4gIC8vIFRyYWNrcyBjb21wb25lbnQgYnVmZmVyIGxheW91dCB2ZXJzaW9uIHBlciBwcmltaXRpdmUgdG8gaW52YWxpZGF0ZSBzaGFkZXJzIHdoZW4gbmV3IEJ1ZmZlclZpZXdzIGFyZSBhZGRlZFxuICBwcml2YXRlIF9zaGFkZXJQcm9ncmFtQ29tcG9uZW50U3RhdGVWZXJzaW9uTWFwOiBNYXA8UHJpbWl0aXZlRmluZ2VyUHJpbnQsIG51bWJlcj4gPSBuZXcgTWFwKCk7XG4gIF9fbWF0ZXJpYWxVaWQ6IE1hdGVyaWFsVUlEID0gLTE7XG4gIHByaXZhdGUgX19tYXRlcmlhbFRpZDogTWF0ZXJpYWxUSUQ7XG4gIF9fbWF0ZXJpYWxTaWQ6IE1hdGVyaWFsU0lEID0gLTE7IC8vIG1hdGVyaWFsIHNlcmlhbCBJZCBpbiB0aGUgbWF0ZXJpYWwgdHlwZVxuXG4gIC8vIENvbW1vbiBSZW5kZXJpbmcgU3RhdGVzXG4gIHByaXZhdGUgX19hbHBoYU1vZGUgPSBBbHBoYU1vZGUuT3BhcXVlO1xuICBwdWJsaWMgeldyaXRlV2hlbkJsZW5kID0gZmFsc2U7XG4gIHB1YmxpYyBjb2xvcldyaXRlTWFzayA9IFt0cnVlLCB0cnVlLCB0cnVlLCB0cnVlXTtcbiAgcHVibGljIGlzVHJhbnNsdWNlbnQgPSBmYWxzZTtcbiAgcHVibGljIGN1bGxGYWNlID0gdHJ1ZTsgLy8gSWYgdHJ1ZSwgZW5hYmxlIGdsLkNVTExfRkFDRVxuICBwdWJsaWMgY3VsbEZyb250RmFjZUNDVyA9IHRydWU7XG4gIHB1YmxpYyBjdWxsRmFjZUJhY2sgPSB0cnVlOyAvLyBpZiB0cnVlLCBjdWxsIGJhY2sgZmFjZS4gaWYgZmFsc2UsIGN1bGwgZnJvbnQgZmFjZVxuICBwcml2YXRlIF9fYWxwaGFUb0NvdmVyYWdlID0gZmFsc2U7XG4gIHByaXZhdGUgX19ibGVuZEVxdWF0aW9uTW9kZSA9IEJsZW5kLkVxdWF0aW9uRnVuY0FkZDsgLy8gZ2wuRlVOQ19BRERcbiAgcHJpdmF0ZSBfX2JsZW5kRXF1YXRpb25Nb2RlQWxwaGEgPSBCbGVuZC5FcXVhdGlvbkZ1bmNBZGQ7IC8vIGdsLkZVTkNfQUREXG4gIHByaXZhdGUgX19ibGVuZEZ1bmNTcmNGYWN0b3IgPSBCbGVuZC5PbmU7IC8vIE5vdCBTcmNBbHBoYS4gQmVjYXVzZSBJbiBSaG9kb25pdGUsIHByZW11bHRpcGxpZWQgYWxwaGEgaXMgdXNlZFxuICBwcml2YXRlIF9fYmxlbmRGdW5jRHN0RmFjdG9yID0gQmxlbmQuT25lTWludXNTcmNBbHBoYTsgLy8gZ2wuT05FX01JTlVTX1NSQ19BTFBIQVxuICBwcml2YXRlIF9fYmxlbmRGdW5jQWxwaGFTcmNGYWN0b3IgPSBCbGVuZC5PbmU7IC8vIGdsLk9ORVxuICBwcml2YXRlIF9fYmxlbmRGdW5jQWxwaGFEc3RGYWN0b3IgPSBCbGVuZC5PbmVNaW51c1NyY0FscGhhOyAvLyBnbC5PTkVfTUlOVVNfU1JDX0FMUEhBXG5cbiAgcHJpdmF0ZSBfX3N0YXRlVmVyc2lvbiA9IDA7XG4gIC8vIEluY3JlbWVudGVkIG9ubHkgd2hlbiB0aGUgcmVuZGVyIHBpcGVsaW5lIGNvbmZpZ3VyYXRpb24gY2hhbmdlcyAoc2hhZGVyXG4gIC8vIHByb2dyYW0sIGJsZW5kIHN0YXRlLCBjdWxsIG1vZGUsIC4uLikuIFVuaWZvcm0gdmFsdWUgdXBkYXRlcyBkbyBub3QgbmVlZCBhXG4gIC8vIG5ldyBwaXBlbGluZSwgc28gdGhleSBtdXN0IG5vdCBidW1wIHRoaXMgdmVyc2lvbi5cbiAgcHJpdmF0ZSBfX3BpcGVsaW5lU3RhdGVWZXJzaW9uID0gMDtcbiAgLy8gSW5jcmVtZW50ZWQgb25seSB3aGVuIHRleHR1cmUvc2FtcGxlciBiaW5kaW5ncyBjaGFuZ2UuIFdlYkdQVSBiaW5kIGdyb3Vwc1xuICAvLyBtdXN0IGJlIHJlY3JlYXRlZCBmb3IgdGhlc2UgY2hhbmdlcywgd2hpbGUgdW5pZm9ybSB1cGRhdGVzIGFyZSB3cml0dGVuIHRvXG4gIC8vIHRoZSBzdG9yYWdlIGJ1ZmZlciBhbmQgbGVhdmUgdGhlIGJpbmQgZ3JvdXBzIHVudG91Y2hlZC5cbiAgcHJpdmF0ZSBfX3RleHR1cmVTdGF0ZVZlcnNpb24gPSAwO1xuICBwcml2YXRlIF9fZmluZ2VyUHJpbnQgPSAnJztcblxuICBwcml2YXRlIF9fc2hhZGVyRGVmaW5lczogU2V0PHN0cmluZz4gPSBuZXcgU2V0KCk7XG5cbiAgLy8gTm9kZS1iYXNlZCBzaGFkZXIgbWF0ZXJpYWwgcHJvcGVydGllcyAoZm9yIFJIT0RPTklURV9tYXRlcmlhbHNfbm9kZSBleHRlbnNpb24pXG4gIHByaXZhdGUgX19zaGFkZXJOb2RlSnNvbj86IHVua25vd247XG4gIHByaXZhdGUgX19zaGFkZXJOb2RlVW5pZm9ybXM/OiB7IFtuYW1lOiBzdHJpbmddOiBudW1iZXIgfCBudW1iZXJbXSB9O1xuICBwcml2YXRlIF9fc2hhZGVyTm9kZUZpbGVOYW1lPzogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IE1hdGVyaWFsIGluc3RhbmNlLlxuICAgKiBAcGFyYW0gbWF0ZXJpYWxUaWQgLSBUaGUgbWF0ZXJpYWwgdHlwZSBJRFxuICAgKiBAcGFyYW0gbWF0ZXJpYWxVaWQgLSBUaGUgdW5pcXVlIG1hdGVyaWFsIElEXG4gICAqIEBwYXJhbSBtYXRlcmlhbFNpZCAtIFRoZSBtYXRlcmlhbCBzZXJpYWwgSUQgd2l0aGluIHRoZSBtYXRlcmlhbCB0eXBlXG4gICAqIEBwYXJhbSBtYXRlcmlhbFR5cGVOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIG1hdGVyaWFsIHR5cGVcbiAgICogQHBhcmFtIG1hdGVyaWFsTm9kZSAtIFRoZSBhYnN0cmFjdCBtYXRlcmlhbCBjb250ZW50IGFzc29jaWF0ZWQgd2l0aCB0aGlzIG1hdGVyaWFsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBtYXRlcmlhbFRpZDogSW5kZXgsXG4gICAgbWF0ZXJpYWxVaWQ6IE1hdGVyaWFsVUlELFxuICAgIG1hdGVyaWFsU2lkOiBNYXRlcmlhbFNJRCxcbiAgICBtYXRlcmlhbFR5cGVOYW1lOiBzdHJpbmcsXG4gICAgbWF0ZXJpYWxOb2RlOiBBYnN0cmFjdE1hdGVyaWFsQ29udGVudFxuICApIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuX19lbmdpbmUgPSBlbmdpbmU7XG4gICAgdGhpcy5fbWF0ZXJpYWxDb250ZW50ID0gbWF0ZXJpYWxOb2RlO1xuICAgIHRoaXMuX19tYXRlcmlhbFRpZCA9IG1hdGVyaWFsVGlkO1xuICAgIHRoaXMuX19tYXRlcmlhbFVpZCA9IG1hdGVyaWFsVWlkO1xuICAgIHRoaXMuX19tYXRlcmlhbFNpZCA9IG1hdGVyaWFsU2lkO1xuICAgIHRoaXMuX19tYXRlcmlhbFR5cGVOYW1lID0gbWF0ZXJpYWxUeXBlTmFtZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgc2hhZGVyIGRlZmluZSBkaXJlY3RpdmUgdGhhdCB3aWxsIGJlIGluY2x1ZGVkIGluIHNoYWRlciBjb21waWxhdGlvbi5cbiAgICogVGhpcyB3aWxsIGludmFsaWRhdGUgZXhpc3Rpbmcgc2hhZGVycyBhbmQgcmVxdWlyZSByZWNvbXBpbGF0aW9uLlxuICAgKiBAcGFyYW0gZGVmaW5lIC0gVGhlIGRlZmluZSBkaXJlY3RpdmUgdG8gYWRkIChlLmcuLCBcIlVTRV9OT1JNQUxfTUFQUElOR1wiKVxuICAgKi9cbiAgYWRkU2hhZGVyRGVmaW5lKGRlZmluZTogc3RyaW5nKSB7XG4gICAgdGhpcy5fX3NoYWRlckRlZmluZXMuYWRkKGRlZmluZSk7XG4gICAgdGhpcy5tYWtlU2hhZGVyc0ludmFsaWRhdGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGEgc2hhZGVyIGRlZmluZSBkaXJlY3RpdmUgZnJvbSB0aGUgbWF0ZXJpYWwuXG4gICAqIFRoaXMgd2lsbCBpbnZhbGlkYXRlIGV4aXN0aW5nIHNoYWRlcnMgYW5kIHJlcXVpcmUgcmVjb21waWxhdGlvbi5cbiAgICogQHBhcmFtIGRlZmluZSAtIFRoZSBkZWZpbmUgZGlyZWN0aXZlIHRvIHJlbW92ZVxuICAgKi9cbiAgcmVtb3ZlU2hhZGVyRGVmaW5lKGRlZmluZTogc3RyaW5nKSB7XG4gICAgdGhpcy5fX3NoYWRlckRlZmluZXMuZGVsZXRlKGRlZmluZSk7XG4gICAgdGhpcy5tYWtlU2hhZGVyc0ludmFsaWRhdGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGFsbCBzaGFkZXIgZGVmaW5lIGRpcmVjdGl2ZXMgY3VycmVudGx5IHNldCBvbiB0aGlzIG1hdGVyaWFsLlxuICAgKiBAcmV0dXJucyBBIFNldCBjb250YWluaW5nIGFsbCBzaGFkZXIgZGVmaW5lc1xuICAgKi9cbiAgZ2V0U2hhZGVyRGVmaW5lcygpIHtcbiAgICByZXR1cm4gdGhpcy5fX3NoYWRlckRlZmluZXM7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIGEgc3BlY2lmaWMgc2hhZGVyIGRlZmluZSBkaXJlY3RpdmUgaXMgc2V0IG9uIHRoaXMgbWF0ZXJpYWwuXG4gICAqIEBwYXJhbSBkZWZpbmUgLSBUaGUgZGVmaW5lIGRpcmVjdGl2ZSB0byBjaGVjayBmb3JcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgZGVmaW5lIGlzIHNldCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBpc1NoYWRlckRlZmluZShkZWZpbmU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9fc2hhZGVyRGVmaW5lcy5oYXMoZGVmaW5lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIGFuZCB1cGRhdGVzIHRoZSBtYXRlcmlhbCdzIGZpbmdlcnByaW50IGJhc2VkIG9uIGN1cnJlbnQgc3RhdGUuXG4gICAqIFRoZSBmaW5nZXJwcmludCBpcyB1c2VkIGZvciBzaGFkZXIgcHJvZ3JhbSBjYWNoaW5nIGFuZCBzdGF0ZSBjb21wYXJpc29uLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNhbGNGaW5nZXJQcmludCgpIHtcbiAgICBsZXQgc3RyID0gJyc7XG4gICAgc3RyICs9IHRoaXMuYWxwaGFNb2RlLmluZGV4O1xuICAgIHN0ciArPSB0aGlzLmJsZW5kRnVuY1NyY0ZhY3Rvci53ZWJncHU7XG4gICAgc3RyICs9IHRoaXMuYmxlbmRGdW5jRHN0RmFjdG9yLndlYmdwdTtcbiAgICBzdHIgKz0gdGhpcy5ibGVuZEZ1bmNBbHBoYVNyY0ZhY3Rvci53ZWJncHU7XG4gICAgc3RyICs9IHRoaXMuYmxlbmRGdW5jQWxwaGFEc3RGYWN0b3Iud2ViZ3B1O1xuICAgIHN0ciArPSB0aGlzLmJsZW5kRXF1YXRpb25Nb2RlLndlYmdwdTtcbiAgICBzdHIgKz0gdGhpcy5ibGVuZEVxdWF0aW9uTW9kZUFscGhhLndlYmdwdTtcbiAgICBzdHIgKz0gdGhpcy5jdWxsRmFjZSA/ICcxJyA6ICcwJztcbiAgICBzdHIgKz0gdGhpcy5jdWxsRnJvbnRGYWNlQ0NXID8gJzEnIDogJzAnO1xuICAgIHN0ciArPSB0aGlzLmN1bGxGYWNlQmFjayA/ICcxJyA6ICcwJztcblxuICAgIC8vIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIHRoaXMuX2F1dG9GaWVsZFZhcmlhYmxlc09ubHkpIHtcbiAgICAvLyAgIGlmIChDb21wb3NpdGlvblR5cGUuaXNUZXh0dXJlKHZhbHVlLmluZm8uY29tcG9zaXRpb25UeXBlKSkge1xuICAgIC8vICAgICBzdHIgKz0gdmFsdWUuaW5mby5zZW1hbnRpYy5zdHI7XG4gICAgLy8gICAgIHN0ciArPSB2YWx1ZS52YWx1ZVswXTtcbiAgICAvLyAgICAgc3RyICs9IHZhbHVlLnZhbHVlWzFdO1xuICAgIC8vICAgICBzdHIgKz0gdmFsdWUudmFsdWVbMl07XG4gICAgLy8gICB9XG4gICAgLy8gfVxuXG4gICAgaWYgKHN0ciAhPT0gdGhpcy5fX2ZpbmdlclByaW50KSB7XG4gICAgICB0aGlzLl9fZmluZ2VyUHJpbnQgPSBzdHI7XG4gICAgICB0aGlzLl9faW5jcmVtZW50UGlwZWxpbmVTdGF0ZVZlcnNpb24oKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9faW5jcmVtZW50UGlwZWxpbmVTdGF0ZVZlcnNpb24oKSB7XG4gICAgdGhpcy5fX3BpcGVsaW5lU3RhdGVWZXJzaW9uKys7XG4gICAgdGhpcy5fX2VuZ2luZS5tYXRlcmlhbFJlcG9zaXRvcnkuX2luY3JlbWVudEJpbmRpbmdTdGF0ZVZlcnNpb24oKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IGZpbmdlcnByaW50IG9mIHRoZSBtYXRlcmlhbC5cbiAgICogQHJldHVybnMgVGhlIG1hdGVyaWFsJ3MgZmluZ2VycHJpbnQgc3RyaW5nXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2dldEZpbmdlclByaW50KCkge1xuICAgIHJldHVybiB0aGlzLl9fZmluZ2VyUHJpbnQ7XG4gIH1cblxuICBwcml2YXRlIF9fdGV4dHVyZUJpbmRpbmdTaWduYXR1cmUgPSAnJztcbiAgcHJpdmF0ZSBfX3RleHR1cmVCaW5kaW5nU2lnbmF0dXJlVmVyc2lvbiA9IC0xO1xuICBwcml2YXRlIF9fbXVsdGlEcmF3U3RhdGVLZXkgPSAnJztcbiAgcHJpdmF0ZSBfX211bHRpRHJhd1N0YXRlS2V5VmVyc2lvbiA9IC0xO1xuXG4gIC8qKlxuICAgKiBTaWduYXR1cmUgb2YgdGhlIHRleHR1cmUvc2FtcGxlciBiaW5kaW5ncyBhbmQgdGhlIHRydWUgdW5pZm9ybXMgdGhhdCBhcmUgc2V0IHBlclxuICAgKiBtYXRlcmlhbCBpbiBXZWJHTDIgbW9kZS4gTWF0ZXJpYWxzIHdpdGggdGhlIHNhbWUgc2lnbmF0dXJlIGNhbiBzaGFyZSBvbmVcbiAgICogbXVsdGktZHJhdyBiYXRjaCAodGhlaXIgcGVyLWRyYXcgc3RhdGUgZGlmZmVycyBvbmx5IGluIHRoZSBkYXRhIHRleHR1cmUgcm93KS5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBfZ2V0VGV4dHVyZUJpbmRpbmdTaWduYXR1cmUoKTogc3RyaW5nIHtcbiAgICBpZiAodGhpcy5fX3RleHR1cmVCaW5kaW5nU2lnbmF0dXJlVmVyc2lvbiA9PT0gdGhpcy5fX3N0YXRlVmVyc2lvbikge1xuICAgICAgcmV0dXJuIHRoaXMuX190ZXh0dXJlQmluZGluZ1NpZ25hdHVyZTtcbiAgICB9XG4gICAgbGV0IHN0ciA9ICcnO1xuICAgIGZvciAoY29uc3QgW3NlbWFudGljLCBmaWVsZF0gb2YgdGhpcy5fYXV0b1RleHR1cmVGaWVsZFZhcmlhYmxlc09ubHkpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gZmllbGQudmFsdWU7XG4gICAgICBzdHIgKz0gYCR7c2VtYW50aWN9OiR7dmFsdWVbMF19OiR7dmFsdWVbMV0/Ll90ZXh0dXJlUmVzb3VyY2VVaWQgPz8gLTF9OiR7dmFsdWVbMl0/Ll9zYW1wbGVyUmVzb3VyY2VVaWQgPz8gLTF9O2A7XG4gICAgfVxuICAgIGZvciAoY29uc3QgW3NlbWFudGljLCBmaWVsZF0gb2YgdGhpcy5fYXV0b1VuaWZvcm1GaWVsZFZhcmlhYmxlc09ubHkpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gZmllbGQudmFsdWU7XG4gICAgICBjb25zdCByYXcgPSB2YWx1ZT8uX3YgPz8gdmFsdWU7XG4gICAgICBzdHIgKz0gYCR7c2VtYW50aWN9OiR7QXJyYXkuaXNBcnJheShyYXcpIHx8IEFycmF5QnVmZmVyLmlzVmlldyhyYXcpID8gQXJyYXkuZnJvbShyYXcgYXMgYW55KS5qb2luKCcsJykgOiBTdHJpbmcocmF3KX07YDtcbiAgICB9XG4gICAgdGhpcy5fX3RleHR1cmVCaW5kaW5nU2lnbmF0dXJlID0gc3RyO1xuICAgIHRoaXMuX190ZXh0dXJlQmluZGluZ1NpZ25hdHVyZVZlcnNpb24gPSB0aGlzLl9fc3RhdGVWZXJzaW9uO1xuICAgIHJldHVybiBzdHI7XG4gIH1cblxuICAvKipcbiAgICogS2V5IG9mIHRoZSBtYXRlcmlhbCBzdGF0ZSB0aGF0IG11c3QgYmUgaWRlbnRpY2FsIGZvciBhIG11bHRpLWRyYXcgYmF0Y2g6XG4gICAqIG1hdGVyaWFsIHR5cGUsIHNoYWRlciBzZW1hbnRpY3MgdmFyaWFudCwgc2hhZGVyIGRlZmluZXMsIHBpcGVsaW5lIGZpbmdlcnByaW50LFxuICAgKiB0ZXh0dXJlIGJpbmRpbmdzIGFuZCB0cnVlLXVuaWZvcm0gdmFsdWVzLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9nZXRNdWx0aURyYXdTdGF0ZUtleSgpOiBzdHJpbmcge1xuICAgIGlmICh0aGlzLl9fbXVsdGlEcmF3U3RhdGVLZXlWZXJzaW9uID09PSB0aGlzLl9fc3RhdGVWZXJzaW9uKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX211bHRpRHJhd1N0YXRlS2V5O1xuICAgIH1cbiAgICB0aGlzLl9fbXVsdGlEcmF3U3RhdGVLZXkgPSBgJHt0aGlzLl9fbWF0ZXJpYWxUeXBlTmFtZX18JHt0aGlzLl9tYXRlcmlhbENvbnRlbnQuZ2V0TWF0ZXJpYWxTZW1hbnRpY3NWYXJpYW50TmFtZSgpfXwke1tcbiAgICAgIC4uLnRoaXMuX19zaGFkZXJEZWZpbmVzLFxuICAgIF1cbiAgICAgIC5zb3J0KClcbiAgICAgIC5qb2luKCcsJyl9fCR7dGhpcy5fX2ZpbmdlclByaW50fXwke3RoaXMuX2dldFRleHR1cmVCaW5kaW5nU2lnbmF0dXJlKCl9YDtcbiAgICB0aGlzLl9fbXVsdGlEcmF3U3RhdGVLZXlWZXJzaW9uID0gdGhpcy5fX3N0YXRlVmVyc2lvbjtcbiAgICByZXR1cm4gdGhpcy5fX211bHRpRHJhd1N0YXRlS2V5O1xuICB9XG5cbiAgLy8vXG4gIC8vLyBQYXJhbWV0ZXIgU2V0dGVyc1xuICAvLy9cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIGEgdmFsdWUgaXMgYW4gYW5pbWF0ZWQgdmFsdWUgKGltcGxlbWVudHMgSUFuaW1hdGVkVmFsdWUpLlxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgdmFsdWUgdG8gY2hlY2tcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgdmFsdWUgaXMgYW4gYW5pbWF0ZWQgdmFsdWUsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgcHVibGljIF9pc0FuaW1hdGVkVmFsdWUodmFsdWU6IGFueSk6IHZhbHVlIGlzIElBbmltYXRlZFZhbHVlIHtcbiAgICByZXR1cm4gKFxuICAgICAgdmFsdWUgaW5zdGFuY2VvZiBBbmltYXRlZFNjYWxhciB8fFxuICAgICAgdmFsdWUgaW5zdGFuY2VvZiBBbmltYXRlZFZlY3RvcjIgfHxcbiAgICAgIHZhbHVlIGluc3RhbmNlb2YgQW5pbWF0ZWRWZWN0b3IzIHx8XG4gICAgICB2YWx1ZSBpbnN0YW5jZW9mIEFuaW1hdGVkVmVjdG9yNCB8fFxuICAgICAgdmFsdWUgaW5zdGFuY2VvZiBBbmltYXRlZFF1YXRlcm5pb24gfHxcbiAgICAgIHZhbHVlIGluc3RhbmNlb2YgQW5pbWF0ZWRWZWN0b3JOXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGEgcGFyYW1ldGVyIHZhbHVlIGZvciB0aGUgc3BlY2lmaWVkIHNoYWRlciBzZW1hbnRpYy5cbiAgICogVGhlIHBhcmFtZXRlciBjYW4gYmUgYSBzdGF0aWMgdmFsdWUgb3IgYW4gYW5pbWF0ZWQgdmFsdWUuXG4gICAqIEBwYXJhbSBzaGFkZXJTZW1hbnRpY05hbWUgLSBUaGUgc2hhZGVyIHNlbWFudGljIG5hbWUgdG8gc2V0IHRoZSBwYXJhbWV0ZXIgZm9yXG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSB2YWx1ZSB0byBzZXQgKGNhbiBiZSBzdGF0aWMgb3IgYW5pbWF0ZWQpXG4gICAqL1xuICBwdWJsaWMgc2V0UGFyYW1ldGVyKHNoYWRlclNlbWFudGljTmFtZTogU2hhZGVyU2VtYW50aWNzTmFtZSwgdmFsdWU6IGFueSkge1xuICAgIGNvbnN0IGluZm8gPSB0aGlzLl9hbGxGaWVsZHNJbmZvLmdldChzaGFkZXJTZW1hbnRpY05hbWUpO1xuICAgIGlmIChpbmZvICE9IG51bGwpIHtcbiAgICAgIGxldCB2YWx1ZU9iajogU2hhZGVyVmFyaWFibGUgfCB1bmRlZmluZWQ7XG4gICAgICBpZiAoaW5mby5zb2xvRGF0dW0pIHtcbiAgICAgICAgdmFsdWVPYmogPSB0aGlzLl9fZW5naW5lLm1hdGVyaWFsUmVwb3NpdG9yeS5fc29sb0RhdHVtRmllbGRzXG4gICAgICAgICAgLmdldCh0aGlzLl9fbWF0ZXJpYWxUeXBlTmFtZSkhXG4gICAgICAgICAgLmdldChzaGFkZXJTZW1hbnRpY05hbWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFsdWVPYmogPSB0aGlzLl9hbGxGaWVsZFZhcmlhYmxlcy5nZXQoc2hhZGVyU2VtYW50aWNOYW1lKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9pc0FuaW1hdGVkVmFsdWUodmFsdWUpKSB7XG4gICAgICAgIHZhbHVlLnNldEZsb2F0MzJBcnJheSh2YWx1ZU9iaiEudmFsdWUuX3YpO1xuICAgICAgICB2YWx1ZU9iaiEudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5fX3N0YXRlVmVyc2lvbisrO1xuICAgICAgICB0aGlzLl9fZW5naW5lLm1hdGVyaWFsUmVwb3NpdG9yeS5faW5jcmVtZW50U3RhdGVWZXJzaW9uKCk7XG4gICAgICAgIHRoaXMuY2FsY0ZpbmdlclByaW50KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCB1cGRhdGVkID0gTWF0aENsYXNzVXRpbC5fc2V0Rm9yY2UodmFsdWVPYmohLnZhbHVlLCB2YWx1ZSk7XG4gICAgICAgIGlmICh1cGRhdGVkKSB7XG4gICAgICAgICAgdGhpcy5fX3N0YXRlVmVyc2lvbisrO1xuICAgICAgICAgIHRoaXMuX19lbmdpbmUubWF0ZXJpYWxSZXBvc2l0b3J5Ll9pbmNyZW1lbnRTdGF0ZVZlcnNpb24oKTtcbiAgICAgICAgICB0aGlzLmNhbGNGaW5nZXJQcmludCgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYSB0ZXh0dXJlIHBhcmFtZXRlciBmb3IgdGhlIHNwZWNpZmllZCBzaGFkZXIgc2VtYW50aWMuXG4gICAqIElmIHRoZSB0ZXh0dXJlIGhhcyB0cmFuc3BhcmVuY3ksIHRoZSBtYXRlcmlhbCdzIGFscGhhIG1vZGUgbWF5IGJlIGF1dG9tYXRpY2FsbHkgc2V0IHRvIEJsZW5kLlxuICAgKiBAcGFyYW0gc2hhZGVyU2VtYW50aWMgLSBUaGUgc2hhZGVyIHNlbWFudGljIG5hbWUgZm9yIHRoZSB0ZXh0dXJlXG4gICAqIEBwYXJhbSB0ZXh0dXJlIC0gVGhlIHRleHR1cmUgdG8gYXNzaWduXG4gICAqIEBwYXJhbSBzYW1wbGVyIC0gT3B0aW9uYWwgc2FtcGxlciB0byB1c2Ugd2l0aCB0aGUgdGV4dHVyZS4gSWYgbm90IHByb3ZpZGVkLCB1c2VzIGRlZmF1bHQgc2FtcGxlclxuICAgKi9cbiAgcHVibGljIHNldFRleHR1cmVQYXJhbWV0ZXIoc2hhZGVyU2VtYW50aWM6IFNoYWRlclNlbWFudGljc05hbWUsIHRleHR1cmU6IEFic3RyYWN0VGV4dHVyZSwgc2FtcGxlcj86IFNhbXBsZXIpOiB2b2lkIHtcbiAgICBpZiAoSXMubm90LmV4aXN0KHNhbXBsZXIpKSB7XG4gICAgICBjb25zdCBkZWZhdWx0U2FtcGxlciA9IG5ldyBTYW1wbGVyKHRoaXMuX19lbmdpbmUsIHtcbiAgICAgICAgbWFnRmlsdGVyOiBUZXh0dXJlUGFyYW1ldGVyLkxpbmVhcixcbiAgICAgICAgbWluRmlsdGVyOiBUZXh0dXJlUGFyYW1ldGVyLkxpbmVhcixcbiAgICAgICAgd3JhcFM6IFRleHR1cmVQYXJhbWV0ZXIuUmVwZWF0LFxuICAgICAgICB3cmFwVDogVGV4dHVyZVBhcmFtZXRlci5SZXBlYXQsXG4gICAgICB9KTtcbiAgICAgIHNhbXBsZXIgPSBkZWZhdWx0U2FtcGxlcjtcbiAgICB9XG4gICAgaWYgKCFzYW1wbGVyLmNyZWF0ZWQpIHtcbiAgICAgIHNhbXBsZXIuY3JlYXRlKCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2FsbEZpZWxkc0luZm8uaGFzKHNoYWRlclNlbWFudGljKSkge1xuICAgICAgY29uc3QgYXJyYXkgPSB0aGlzLl9hbGxGaWVsZFZhcmlhYmxlcy5nZXQoc2hhZGVyU2VtYW50aWMpITtcbiAgICAgIC8vIFJlbmRlcmVycyBjYWxsIHRoaXMgZXZlcnkgZnJhbWUgd2l0aCB0aGUgc2FtZSB0ZXh0dXJlL3NhbXBsZXIgKGZvclxuICAgICAgLy8gZXhhbXBsZSBJQkwgZW52aXJvbm1lbnQgbWFwcykuIFJlYXNzaWduaW5nIGlkZW50aWNhbCBiaW5kaW5ncyBtdXN0IG5vdFxuICAgICAgLy8gaW52YWxpZGF0ZSBwaXBlbGluZXMgb3IgYmluZCBncm91cHMsIG90aGVyd2lzZSBXZWJHUFUgcmVjcmVhdGVzIHRoZW1cbiAgICAgIC8vIGV2ZXJ5IGZyYW1lIGFuZCByZW5kZXIgYnVuZGxlcyBjYW4gbmV2ZXIgYmUgcmV1c2VkLlxuICAgICAgaWYgKGFycmF5LnZhbHVlWzFdID09PSB0ZXh0dXJlICYmIGFycmF5LnZhbHVlWzJdID09PSBzYW1wbGVyKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHNoYWRlclZhcmlhYmxlID0ge1xuICAgICAgICB2YWx1ZTogW2FycmF5LnZhbHVlWzBdLCB0ZXh0dXJlLCBzYW1wbGVyXSxcbiAgICAgICAgaW5mbzogYXJyYXkuaW5mbyxcbiAgICAgIH07XG4gICAgICB0aGlzLl9hbGxGaWVsZFZhcmlhYmxlcy5zZXQoc2hhZGVyU2VtYW50aWMsIHNoYWRlclZhcmlhYmxlKTtcbiAgICAgIGlmICghYXJyYXkuaW5mby5pc0ludGVybmFsU2V0dGluZykge1xuICAgICAgICB0aGlzLl9hdXRvRmllbGRWYXJpYWJsZXNPbmx5LnNldChzaGFkZXJTZW1hbnRpYywgc2hhZGVyVmFyaWFibGUpO1xuICAgICAgICBpZiAoQ29tcG9zaXRpb25UeXBlLmlzVGV4dHVyZShhcnJheS5pbmZvLmNvbXBvc2l0aW9uVHlwZSkpIHtcbiAgICAgICAgICB0aGlzLl9hdXRvVGV4dHVyZUZpZWxkVmFyaWFibGVzT25seS5zZXQoc2hhZGVyU2VtYW50aWMsIHNoYWRlclZhcmlhYmxlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHNoYWRlclNlbWFudGljID09PSAnZGlmZnVzZUNvbG9yVGV4dHVyZScgfHwgc2hhZGVyU2VtYW50aWMgPT09ICdiYXNlQ29sb3JUZXh0dXJlJykge1xuICAgICAgICBpZiAodGV4dHVyZS5pc1RyYW5zcGFyZW50KSB7XG4gICAgICAgICAgdGhpcy5hbHBoYU1vZGUgPSBBbHBoYU1vZGUuQmxlbmQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuX19zdGF0ZVZlcnNpb24rKztcbiAgICAgIHRoaXMuX190ZXh0dXJlU3RhdGVWZXJzaW9uKys7XG4gICAgICB0aGlzLl9fZW5naW5lLm1hdGVyaWFsUmVwb3NpdG9yeS5faW5jcmVtZW50U3RhdGVWZXJzaW9uKCk7XG4gICAgICB0aGlzLl9fZW5naW5lLm1hdGVyaWFsUmVwb3NpdG9yeS5faW5jcmVtZW50QmluZGluZ1N0YXRlVmVyc2lvbigpO1xuICAgICAgdGhpcy5jYWxjRmluZ2VyUHJpbnQoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdGV4dHVyZSBwYXJhbWV0ZXIgZm9yIHRoZSBzcGVjaWZpZWQgc2hhZGVyIHNlbWFudGljLlxuICAgKiBAcGFyYW0gc2hhZGVyU2VtYW50aWMgLSBUaGUgc2hhZGVyIHNlbWFudGljIG5hbWUgdG8gZ2V0IHRoZSB0ZXh0dXJlIGZvclxuICAgKiBAcmV0dXJucyBUaGUgdGV4dHVyZSBwYXJhbWV0ZXIgYXJyYXkgb3IgdW5kZWZpbmVkIGlmIG5vdCBmb3VuZFxuICAgKi9cbiAgcHVibGljIGdldFRleHR1cmVQYXJhbWV0ZXIoc2hhZGVyU2VtYW50aWM6IFNoYWRlclNlbWFudGljc05hbWUpIHtcbiAgICBpZiAodGhpcy5fYWxsRmllbGRzSW5mby5oYXMoc2hhZGVyU2VtYW50aWMpKSB7XG4gICAgICBjb25zdCBhcnJheSA9IHRoaXMuX2FsbEZpZWxkVmFyaWFibGVzLmdldChzaGFkZXJTZW1hbnRpYykhO1xuICAgICAgcmV0dXJuIGFycmF5LnZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYSB0ZXh0dXJlIHBhcmFtZXRlciBmcm9tIGEgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIGEgdGV4dHVyZS5cbiAgICogVGhpcyBpcyB1c2VmdWwgZm9yIGFzeW5jaHJvbm91cyB0ZXh0dXJlIGxvYWRpbmcuXG4gICAqIEBwYXJhbSBzaGFkZXJTZW1hbnRpYyAtIFRoZSBzaGFkZXIgc2VtYW50aWMgbmFtZSBmb3IgdGhlIHRleHR1cmVcbiAgICogQHBhcmFtIHByb21pc2UgLSBBIFByb21pc2UgdGhhdCByZXNvbHZlcyB0byB0aGUgdGV4dHVyZVxuICAgKi9cbiAgcHVibGljIHNldFRleHR1cmVQYXJhbWV0ZXJBc1Byb21pc2Uoc2hhZGVyU2VtYW50aWM6IFNoYWRlclNlbWFudGljc05hbWUsIHByb21pc2U6IFByb21pc2U8QWJzdHJhY3RUZXh0dXJlPik6IHZvaWQge1xuICAgIHByb21pc2UudGhlbih0ZXh0dXJlID0+IHtcbiAgICAgIGlmICh0aGlzLl9hbGxGaWVsZHNJbmZvLmhhcyhzaGFkZXJTZW1hbnRpYykpIHtcbiAgICAgICAgY29uc3QgYXJyYXkgPSB0aGlzLl9hbGxGaWVsZFZhcmlhYmxlcy5nZXQoc2hhZGVyU2VtYW50aWMpITtcbiAgICAgICAgaWYgKGFycmF5LnZhbHVlWzFdID09PSB0ZXh0dXJlKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHNoYWRlclZhcmlhYmxlID0ge1xuICAgICAgICAgIHZhbHVlOiBbYXJyYXkudmFsdWVbMF0sIHRleHR1cmVdLFxuICAgICAgICAgIGluZm86IGFycmF5LmluZm8sXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuX2FsbEZpZWxkVmFyaWFibGVzLnNldChzaGFkZXJTZW1hbnRpYywgc2hhZGVyVmFyaWFibGUpO1xuICAgICAgICBpZiAoIWFycmF5LmluZm8uaXNJbnRlcm5hbFNldHRpbmcpIHtcbiAgICAgICAgICB0aGlzLl9hdXRvRmllbGRWYXJpYWJsZXNPbmx5LnNldChzaGFkZXJTZW1hbnRpYywgc2hhZGVyVmFyaWFibGUpO1xuICAgICAgICAgIGlmIChDb21wb3NpdGlvblR5cGUuaXNUZXh0dXJlKGFycmF5LmluZm8uY29tcG9zaXRpb25UeXBlKSkge1xuICAgICAgICAgICAgdGhpcy5fYXV0b1RleHR1cmVGaWVsZFZhcmlhYmxlc09ubHkuc2V0KHNoYWRlclNlbWFudGljLCBzaGFkZXJWYXJpYWJsZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzaGFkZXJTZW1hbnRpYyA9PT0gJ2RpZmZ1c2VDb2xvclRleHR1cmUnIHx8IHNoYWRlclNlbWFudGljID09PSAnYmFzZUNvbG9yVGV4dHVyZScpIHtcbiAgICAgICAgICBpZiAodGV4dHVyZS5pc1RyYW5zcGFyZW50KSB7XG4gICAgICAgICAgICB0aGlzLmFscGhhTW9kZSA9IEFscGhhTW9kZS5CbGVuZDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuX19zdGF0ZVZlcnNpb24rKztcbiAgICAgIHRoaXMuX190ZXh0dXJlU3RhdGVWZXJzaW9uKys7XG4gICAgICB0aGlzLl9fZW5naW5lLm1hdGVyaWFsUmVwb3NpdG9yeS5faW5jcmVtZW50U3RhdGVWZXJzaW9uKCk7XG4gICAgICB0aGlzLl9fZW5naW5lLm1hdGVyaWFsUmVwb3NpdG9yeS5faW5jcmVtZW50QmluZGluZ1N0YXRlVmVyc2lvbigpO1xuICAgICAgdGhpcy5jYWxjRmluZ2VyUHJpbnQoKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBwYXJhbWV0ZXIgdmFsdWUgZm9yIHRoZSBzcGVjaWZpZWQgc2hhZGVyIHNlbWFudGljLlxuICAgKiBAcGFyYW0gc2hhZGVyU2VtYW50aWMgLSBUaGUgc2hhZGVyIHNlbWFudGljIG5hbWUgdG8gZ2V0IHRoZSBwYXJhbWV0ZXIgZm9yXG4gICAqIEByZXR1cm5zIFRoZSBwYXJhbWV0ZXIgdmFsdWUgb3IgdW5kZWZpbmVkIGlmIG5vdCBmb3VuZFxuICAgKi9cbiAgcHVibGljIGdldFBhcmFtZXRlcihzaGFkZXJTZW1hbnRpYzogU2hhZGVyU2VtYW50aWNzTmFtZSk6IGFueSB7XG4gICAgY29uc3QgaW5mbyA9IHRoaXMuX2FsbEZpZWxkc0luZm8uZ2V0KHNoYWRlclNlbWFudGljKTtcbiAgICBpZiAoaW5mbyAhPSBudWxsKSB7XG4gICAgICBpZiAoaW5mby5zb2xvRGF0dW0pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19lbmdpbmUubWF0ZXJpYWxSZXBvc2l0b3J5Ll9zb2xvRGF0dW1GaWVsZHMuZ2V0KHRoaXMuX19tYXRlcmlhbFR5cGVOYW1lKSEuZ2V0KHNoYWRlclNlbWFudGljKVxuICAgICAgICAgID8udmFsdWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5fYWxsRmllbGRWYXJpYWJsZXMuZ2V0KHNoYWRlclNlbWFudGljKT8udmFsdWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZvaWQgMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhlIHNoYWRlciBwcm9ncmFtIGlzIHJlYWR5IGZvciB0aGUgZ2l2ZW4gcHJpbWl0aXZlLlxuICAgKiBAcGFyYW0gcHJpbWl0aXZlIC0gVGhlIHByaW1pdGl2ZSB0byBjaGVjayBzaGFkZXIgcmVhZGluZXNzIGZvclxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBzaGFkZXIgcHJvZ3JhbSBpcyByZWFkeSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBwdWJsaWMgaXNTaGFkZXJQcm9ncmFtUmVhZHkocHJpbWl0aXZlOiBQcmltaXRpdmUpOiBib29sZWFuIHtcbiAgICBjb25zdCBwcmltaXRpdmVGaW5nZXJQcmludCA9IHByaW1pdGl2ZS5fZ2V0RmluZ2VyUHJpbnQoKTtcbiAgICBjb25zdCBjb21wb25lbnRTdGF0ZVZlcnNpb24gPSB0aGlzLl9zaGFkZXJQcm9ncmFtQ29tcG9uZW50U3RhdGVWZXJzaW9uTWFwLmdldChwcmltaXRpdmVGaW5nZXJQcmludCk7XG4gICAgaWYgKGNvbXBvbmVudFN0YXRlVmVyc2lvbiAhPT0gQ29tcG9uZW50LmdldFN0YXRlVmVyc2lvbih0aGlzLl9fZW5naW5lKSkge1xuICAgICAgdGhpcy5fc2hhZGVyUHJvZ3JhbVVpZE1hcC5kZWxldGUocHJpbWl0aXZlRmluZ2VyUHJpbnQpO1xuICAgICAgdGhpcy5fc2hhZGVyUHJvZ3JhbUNvbXBvbmVudFN0YXRlVmVyc2lvbk1hcC5kZWxldGUocHJpbWl0aXZlRmluZ2VyUHJpbnQpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9zaGFkZXJQcm9ncmFtVWlkTWFwLmhhcyhwcmltaXRpdmVGaW5nZXJQcmludCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB1cCB1bmlmb3JtIGxvY2F0aW9ucyBmb3IgbWF0ZXJpYWwgbm9kZXMgaW4gdGhlIHNoYWRlciBwcm9ncmFtLlxuICAgKiBAaW50ZXJuYWwgQ2FsbGVkIGZyb20gV2ViR0xTdHJhdGVneVdlYkdMMiBvbmx5XG4gICAqIEBwYXJhbSBwcmltaXRpdmUgLSBUaGUgcHJpbWl0aXZlIHRvIHNldCB1cCB1bmlmb3JtcyBmb3JcbiAgICovXG4gIF9zZXRVbmlmb3JtTG9jYXRpb25zT2ZNYXRlcmlhbE5vZGVzKHByaW1pdGl2ZTogUHJpbWl0aXZlKSB7XG4gICAgY29uc3Qgd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5O1xuXG4gICAgbGV0IGFycmF5OiBTaGFkZXJTZW1hbnRpY3NJbmZvW10gPSBbXTtcbiAgICBpZiAodGhpcy5fbWF0ZXJpYWxDb250ZW50ICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IHNlbWFudGljc0luZm9BcnJheSA9IHRoaXMuX21hdGVyaWFsQ29udGVudC5fc2VtYW50aWNzSW5mb0FycmF5O1xuICAgICAgYXJyYXkgPSBhcnJheS5jb25jYXQoc2VtYW50aWNzSW5mb0FycmF5KTtcbiAgICB9XG5cbiAgICBjb25zdCBzaGFkZXJQcm9ncmFtVWlkID0gdGhpcy5fc2hhZGVyUHJvZ3JhbVVpZE1hcC5nZXQocHJpbWl0aXZlLl9nZXRGaW5nZXJQcmludCgpKTtcbiAgICB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5zZXR1cFVuaWZvcm1Mb2NhdGlvbnModGhpcy5fX2VuZ2luZS5jb25maWcsIHNoYWRlclByb2dyYW1VaWQhLCBhcnJheSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgc2hhZGVyIHByb2dyYW0gVUlEIGZvciB0aGUgZ2l2ZW4gcHJpbWl0aXZlLlxuICAgKiBAcGFyYW0gcHJpbWl0aXZlIC0gVGhlIHByaW1pdGl2ZSB0byBnZXQgdGhlIHNoYWRlciBwcm9ncmFtIFVJRCBmb3JcbiAgICogQHJldHVybnMgVGhlIHNoYWRlciBwcm9ncmFtIFVJRCBvciAtMSBpZiBub3QgZm91bmRcbiAgICovXG4gIGdldFNoYWRlclByb2dyYW1VaWQocHJpbWl0aXZlOiBQcmltaXRpdmUpOiBDR0FQSVJlc291cmNlSGFuZGxlIHtcbiAgICBjb25zdCBwcmltaXRpdmVGaW5nZXJQcmludCA9IHByaW1pdGl2ZS5fZ2V0RmluZ2VyUHJpbnQoKTtcbiAgICByZXR1cm4gdGhpcy5fc2hhZGVyUHJvZ3JhbVVpZE1hcC5nZXQocHJpbWl0aXZlRmluZ2VyUHJpbnQpID8/IC0xO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBwcmltaXRpdmUgdG8gdGhlIGxpc3Qgb2YgcHJpbWl0aXZlcyB0aGF0IGJlbG9uZyB0byB0aGlzIG1hdGVyaWFsLlxuICAgKiBAaW50ZXJuYWwgQ2FsbGVkIGZyb20gUHJpbWl0aXZlIGNsYXNzIG9ubHlcbiAgICogQHBhcmFtIHByaW1pdGl2ZSAtIFRoZSBwcmltaXRpdmUgdG8gYWRkXG4gICAqL1xuICBfYWRkQmVsb25nUHJpbWl0aXZlKHByaW1pdGl2ZTogUHJpbWl0aXZlKSB7XG4gICAgdGhpcy5fX2JlbG9uZ1ByaW1pdGl2ZXMuc2V0KHByaW1pdGl2ZS5wcmltaXRpdmVVaWQsIHByaW1pdGl2ZSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhbGwgcHJpbWl0aXZlcyB0aGF0IGJlbG9uZyB0byB0aGlzIG1hdGVyaWFsLlxuICAgKiBAcmV0dXJucyBBIE1hcCBvZiBwcmltaXRpdmUgVUlEcyB0byBQcmltaXRpdmUgb2JqZWN0c1xuICAgKi9cbiAgZ2V0QmVsb25nUHJpbWl0aXZlcygpIHtcbiAgICByZXR1cm4gdGhpcy5fX2JlbG9uZ1ByaW1pdGl2ZXM7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIFdlYkdMIHNoYWRlciBwcm9ncmFtIGZvciB0aGlzIG1hdGVyaWFsIGFuZCB0aGUgZ2l2ZW4gcHJpbWl0aXZlLlxuICAgKiBAaW50ZXJuYWwgQ2FsbGVkIGZyb20gV2ViR0xTdHJhdGVneVdlYkdMMlxuICAgKiBAcGFyYW0gY29tcG9uZW50RGF0YUFjY2Vzc01ldGhvZERlZmluaXRpb25zRm9yVmVydGV4U2hhZGVyIC0gbWV0aG9kIGRlZmluaXRpb25zIGZvciBjb21wb25lbnQgZGF0YSBhY2Nlc3MgZm9yIHZlcnRleCBzaGFkZXJcbiAgICogQHBhcmFtIGNvbXBvbmVudERhdGFBY2Nlc3NNZXRob2REZWZpbml0aW9uc0ZvclBpeGVsU2hhZGVyIC0gbWV0aG9kIGRlZmluaXRpb25zIGZvciBjb21wb25lbnQgZGF0YSBhY2Nlc3MgZm9yIHBpeGVsIHNoYWRlclxuICAgKiBAcGFyYW0gcHJvcGVydHlTZXR0ZXJPZkdsb2JhbERhdGFSZXBvc2l0b3J5IC0gRnVuY3Rpb24gdG8gc2V0IHNoYWRlciBwcm9wZXJ0aWVzIG9mIGdsb2JhbCBkYXRhIHJlcG9zaXRvcnlcbiAgICogQHBhcmFtIHByb3BlcnR5U2V0dGVyT2ZNYXRlcmlhbCAtIEZ1bmN0aW9uIHRvIHNldCBzaGFkZXIgcHJvcGVydGllcyBvZiBtYXRlcmlhbFxuICAgKiBAcGFyYW0gbW9ycGhlZFBvc2l0aW9uR2V0dGVyIC0gRnVuY3Rpb24gdG8gZ2V0IHRoZSBtb3JwaGVkIHBvc2l0aW9uXG4gICAqIEBwYXJhbSBwcmltaXRpdmUgLSBUaGUgcHJpbWl0aXZlIHRvIGNyZWF0ZSB0aGUgcHJvZ3JhbSBmb3JcbiAgICogQHJldHVybnMgQSB0dXBsZSBjb250YWluaW5nIHRoZSBwcm9ncmFtIFVJRCBhbmQgd2hldGhlciBpdCdzIGEgbmV3IHByb2dyYW1cbiAgICovXG4gIF9jcmVhdGVQcm9ncmFtV2ViR0woXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgY29tcG9uZW50RGF0YUFjY2Vzc01ldGhvZERlZmluaXRpb25zRm9yVmVydGV4U2hhZGVyOiBzdHJpbmcsXG4gICAgY29tcG9uZW50RGF0YUFjY2Vzc01ldGhvZERlZmluaXRpb25zRm9yUGl4ZWxTaGFkZXI6IHN0cmluZyxcbiAgICBwcm9wZXJ0eVNldHRlck9mR2xvYmFsRGF0YVJlcG9zaXRvcnk6IGdldFNoYWRlclByb3BlcnR5RnVuY09mR2xvYmFsRGF0YVJlcG9zaXRvcnksXG4gICAgcHJvcGVydHlTZXR0ZXJPZk1hdGVyaWFsOiBnZXRTaGFkZXJQcm9wZXJ0eUZ1bmNPZk1hdGVyaWFsLFxuICAgIG1vcnBoZWRQb3NpdGlvbkdldHRlcjogc3RyaW5nLFxuICAgIHByaW1pdGl2ZTogUHJpbWl0aXZlXG4gICk6IFtDR0FQSVJlc291cmNlSGFuZGxlLCBib29sZWFuXSB7XG4gICAgY29uc3QgW3Byb2dyYW1VaWQsIG5ld09uZV0gPSBfY3JlYXRlUHJvZ3JhbUFzU2luZ2xlT3BlcmF0aW9uV2ViR0woXG4gICAgICBlbmdpbmUsXG4gICAgICB0aGlzLFxuICAgICAgY29tcG9uZW50RGF0YUFjY2Vzc01ldGhvZERlZmluaXRpb25zRm9yVmVydGV4U2hhZGVyLFxuICAgICAgY29tcG9uZW50RGF0YUFjY2Vzc01ldGhvZERlZmluaXRpb25zRm9yUGl4ZWxTaGFkZXIsXG4gICAgICBwcm9wZXJ0eVNldHRlck9mR2xvYmFsRGF0YVJlcG9zaXRvcnksXG4gICAgICBwcm9wZXJ0eVNldHRlck9mTWF0ZXJpYWwsXG4gICAgICBtb3JwaGVkUG9zaXRpb25HZXR0ZXIsXG4gICAgICBwcmltaXRpdmVcbiAgICApO1xuICAgIGNvbnN0IHByaW1pdGl2ZUZpbmdlclByaW50ID0gcHJpbWl0aXZlLl9nZXRGaW5nZXJQcmludCgpO1xuICAgIHRoaXMuX3NoYWRlclByb2dyYW1VaWRNYXAuc2V0KHByaW1pdGl2ZUZpbmdlclByaW50LCBwcm9ncmFtVWlkKTtcbiAgICB0aGlzLl9zaGFkZXJQcm9ncmFtQ29tcG9uZW50U3RhdGVWZXJzaW9uTWFwLnNldChwcmltaXRpdmVGaW5nZXJQcmludCwgQ29tcG9uZW50LmdldFN0YXRlVmVyc2lvbihlbmdpbmUpKTtcblxuICAgIHRoaXMuX19lbmdpbmUubWF0ZXJpYWxSZXBvc2l0b3J5Ll9pbmNyZW1lbnRTdGF0ZVZlcnNpb24oKTtcblxuICAgIHJldHVybiBbcHJvZ3JhbVVpZCwgbmV3T25lXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgV2ViR1BVIHNoYWRlciBwcm9ncmFtIGZvciB0aGlzIG1hdGVyaWFsIGFuZCB0aGUgZ2l2ZW4gcHJpbWl0aXZlLlxuICAgKiBAcGFyYW0gcHJpbWl0aXZlIC0gVGhlIHByaW1pdGl2ZSB0byBjcmVhdGUgdGhlIHByb2dyYW0gZm9yXG4gICAqIEBwYXJhbSBjb21wb25lbnREYXRhQWNjZXNzTWV0aG9kRGVmaW5pdGlvbnNGb3JWZXJ0ZXhTaGFkZXIgLSBtZXRob2QgZGVmaW5pdGlvbnMgZm9yIGNvbXBvbmVudCBkYXRhIGFjY2VzcyBmb3IgdmVydGV4IHNoYWRlclxuICAgKiBAcGFyYW0gY29tcG9uZW50RGF0YUFjY2Vzc01ldGhvZERlZmluaXRpb25zRm9yUGl4ZWxTaGFkZXIgLSBtZXRob2QgZGVmaW5pdGlvbnMgZm9yIGNvbXBvbmVudCBkYXRhIGFjY2VzcyBmb3IgcGl4ZWwgc2hhZGVyXG4gICAqIEBwYXJhbSBwcm9wZXJ0eVNldHRlck9mR2xvYmFsRGF0YVJlcG9zaXRvcnkgLSBGdW5jdGlvbiB0byBzZXQgc2hhZGVyIHByb3BlcnRpZXMgb2YgZ2xvYmFsIGRhdGEgcmVwb3NpdG9yeVxuICAgKiBAcGFyYW0gcHJvcGVydHlTZXR0ZXJPZk1hdGVyaWFsIC0gRnVuY3Rpb24gdG8gc2V0IHNoYWRlciBwcm9wZXJ0aWVzIG9mIG1hdGVyaWFsXG4gICAqIEBwYXJhbSBtb3JwaGVkUG9zaXRpb25HZXR0ZXIgLSBGdW5jdGlvbiB0byBnZXQgdGhlIG1vcnBoZWQgcG9zaXRpb25cbiAgICovXG4gIF9jcmVhdGVQcm9ncmFtV2ViR3B1KFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIHByaW1pdGl2ZTogUHJpbWl0aXZlLFxuICAgIGNvbXBvbmVudERhdGFBY2Nlc3NNZXRob2REZWZpbml0aW9uc0ZvclZlcnRleFNoYWRlcjogc3RyaW5nLFxuICAgIGNvbXBvbmVudERhdGFBY2Nlc3NNZXRob2REZWZpbml0aW9uc0ZvclBpeGVsU2hhZGVyOiBzdHJpbmcsXG4gICAgcHJvcGVydHlTZXR0ZXJPZkdsb2JhbERhdGFSZXBvc2l0b3J5OiBnZXRTaGFkZXJQcm9wZXJ0eUZ1bmNPZkdsb2JhbERhdGFSZXBvc2l0b3J5LFxuICAgIHByb3BlcnR5U2V0dGVyT2ZNYXRlcmlhbDogZ2V0U2hhZGVyUHJvcGVydHlGdW5jT2ZNYXRlcmlhbCxcbiAgICBtb3JwaGVkUG9zaXRpb25HZXR0ZXI6IHN0cmluZ1xuICApIHtcbiAgICBjb25zdCBwcm9ncmFtVWlkID0gX2NyZWF0ZVByb2dyYW1Bc1NpbmdsZU9wZXJhdGlvbldlYkdwdShcbiAgICAgIGVuZ2luZSxcbiAgICAgIHRoaXMsXG4gICAgICBwcmltaXRpdmUsXG4gICAgICBjb21wb25lbnREYXRhQWNjZXNzTWV0aG9kRGVmaW5pdGlvbnNGb3JWZXJ0ZXhTaGFkZXIsXG4gICAgICBjb21wb25lbnREYXRhQWNjZXNzTWV0aG9kRGVmaW5pdGlvbnNGb3JQaXhlbFNoYWRlcixcbiAgICAgIHByb3BlcnR5U2V0dGVyT2ZHbG9iYWxEYXRhUmVwb3NpdG9yeSxcbiAgICAgIHByb3BlcnR5U2V0dGVyT2ZNYXRlcmlhbCxcbiAgICAgIG1vcnBoZWRQb3NpdGlvbkdldHRlclxuICAgICk7XG5cbiAgICBjb25zdCBwcmltaXRpdmVGaW5nZXJQcmludCA9IHByaW1pdGl2ZS5fZ2V0RmluZ2VyUHJpbnQoKTtcbiAgICB0aGlzLl9zaGFkZXJQcm9ncmFtVWlkTWFwLnNldChwcmltaXRpdmVGaW5nZXJQcmludCwgcHJvZ3JhbVVpZCk7XG4gICAgdGhpcy5fc2hhZGVyUHJvZ3JhbUNvbXBvbmVudFN0YXRlVmVyc2lvbk1hcC5zZXQocHJpbWl0aXZlRmluZ2VyUHJpbnQsIENvbXBvbmVudC5nZXRTdGF0ZVZlcnNpb24oZW5naW5lKSk7XG4gICAgdGhpcy5fX2VuZ2luZS5tYXRlcmlhbFJlcG9zaXRvcnkuX2luY3JlbWVudFN0YXRlVmVyc2lvbigpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBzaGFkZXIgcHJvZ3JhbSB1c2luZyB1cGRhdGVkIHNoYWRlciBzb3VyY2UgY29kZS5cbiAgICogQGludGVybmFsIENhbGxlZCBmcm9tIFdlYkdMU3RyYXRlZ3lXZWJHTDJcbiAgICogQHBhcmFtIHVwZGF0ZWRTaGFkZXJTb3VyY2VzIC0gVGhlIHVwZGF0ZWQgc2hhZGVyIHNvdXJjZSBjb2RlXG4gICAqIEBwYXJhbSBwcmltaXRpdmUgLSBUaGUgcHJpbWl0aXZlIHRvIGNyZWF0ZSB0aGUgcHJvZ3JhbSBmb3JcbiAgICogQHBhcmFtIG9uRXJyb3IgLSBPcHRpb25hbCBlcnJvciBjYWxsYmFjayBmdW5jdGlvblxuICAgKiBAcmV0dXJucyBBIHR1cGxlIGNvbnRhaW5pbmcgdGhlIHByb2dyYW0gVUlEIGFuZCB3aGV0aGVyIGl0J3MgYSBuZXcgcHJvZ3JhbVxuICAgKi9cbiAgX2NyZWF0ZVByb2dyYW1CeVVwZGF0ZWRTb3VyY2VzKFxuICAgIHVwZGF0ZWRTaGFkZXJTb3VyY2VzOiBTaGFkZXJTb3VyY2VzLFxuICAgIHByaW1pdGl2ZTogUHJpbWl0aXZlLFxuICAgIG9uRXJyb3I/OiAobWVzc2FnZTogc3RyaW5nKSA9PiB2b2lkXG4gICk6IFtDR0FQSVJlc291cmNlSGFuZGxlLCBib29sZWFuXSB7XG4gICAgY29uc3QgW3Byb2dyYW1VaWQsIG5ld09uZV0gPSBfY3JlYXRlUHJvZ3JhbUFzU2luZ2xlT3BlcmF0aW9uQnlVcGRhdGVkU291cmNlcyhcbiAgICAgIHRoaXMuX19lbmdpbmUsXG4gICAgICB0aGlzLFxuICAgICAgcHJpbWl0aXZlLFxuICAgICAgdGhpcy5fbWF0ZXJpYWxDb250ZW50LFxuICAgICAgdXBkYXRlZFNoYWRlclNvdXJjZXMsXG4gICAgICBvbkVycm9yXG4gICAgKTtcbiAgICBjb25zdCBwcmltaXRpdmVGaW5nZXJQcmludCA9IHByaW1pdGl2ZS5fZ2V0RmluZ2VyUHJpbnQoKTtcbiAgICB0aGlzLl9zaGFkZXJQcm9ncmFtVWlkTWFwLnNldChwcmltaXRpdmVGaW5nZXJQcmludCwgcHJvZ3JhbVVpZCk7XG4gICAgdGhpcy5fc2hhZGVyUHJvZ3JhbUNvbXBvbmVudFN0YXRlVmVyc2lvbk1hcC5zZXQocHJpbWl0aXZlRmluZ2VyUHJpbnQsIENvbXBvbmVudC5nZXRTdGF0ZVZlcnNpb24odGhpcy5fX2VuZ2luZSkpO1xuXG4gICAgaWYgKHByb2dyYW1VaWQgPiAwKSB7XG4gICAgICAvLyB0aGlzLl9fdXBkYXRlZFNoYWRlclNvdXJjZXMgPSB1cGRhdGVkU2hhZGVyU291cmNlcztcbiAgICB9XG5cbiAgICB0aGlzLl9fZW5naW5lLm1hdGVyaWFsUmVwb3NpdG9yeS5faW5jcmVtZW50U3RhdGVWZXJzaW9uKCk7XG4gICAgcmV0dXJuIFtwcm9ncmFtVWlkLCBuZXdPbmVdO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgYmFzaWMgdW5pZm9ybSBsb2NhdGlvbnMgaW4gdGhlIHNoYWRlciBwcm9ncmFtLlxuICAgKiBAaW50ZXJuYWwgQ2FsbGVkIGJ5IFdlYkdMU3RyYXRlZ3lXZWJHTDIgb25seVxuICAgKiBAcGFyYW0gcHJpbWl0aXZlIC0gVGhlIHByaW1pdGl2ZSB0byBzZXQgdXAgdW5pZm9ybXMgZm9yXG4gICAqL1xuICBfc2V0dXBCYXNpY1VuaWZvcm1zTG9jYXRpb25zKHByaW1pdGl2ZTogUHJpbWl0aXZlKSB7XG4gICAgY29uc3Qgd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5O1xuXG4gICAgY29uc3QgcHJpbWl0aXZlRmluZ2VyUHJpbnQgPSBwcmltaXRpdmUuX2dldEZpbmdlclByaW50KCk7XG4gICAgY29uc3Qgc2hhZGVyUHJvZ3JhbVVpZCA9IHRoaXMuX3NoYWRlclByb2dyYW1VaWRNYXAuZ2V0KHByaW1pdGl2ZUZpbmdlclByaW50KTtcbiAgICB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5zZXR1cEJhc2ljVW5pZm9ybUxvY2F0aW9ucyhzaGFkZXJQcm9ncmFtVWlkISk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB1cCBhZGRpdGlvbmFsIHVuaWZvcm0gbG9jYXRpb25zIGluIHRoZSBzaGFkZXIgcHJvZ3JhbS5cbiAgICogQGludGVybmFsIENhbGxlZCBieSBXZWJHTFN0cmF0ZWd5V2ViR0wyIG9ubHlcbiAgICogQHBhcmFtIHNoYWRlclNlbWFudGljcyAtIEFycmF5IG9mIHNoYWRlciBzZW1hbnRpY3MgdG8gc2V0IHVwXG4gICAqIEBwYXJhbSBwcmltaXRpdmUgLSBUaGUgcHJpbWl0aXZlIHRvIHNldCB1cCB1bmlmb3JtcyBmb3JcbiAgICovXG4gIF9zZXR1cEFkZGl0aW9uYWxVbmlmb3JtTG9jYXRpb25zKHNoYWRlclNlbWFudGljczogU2hhZGVyU2VtYW50aWNzSW5mb1tdLCBwcmltaXRpdmU6IFByaW1pdGl2ZSkge1xuICAgIGNvbnN0IHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5ID0gdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeTtcbiAgICBjb25zdCBwcmltaXRpdmVGaW5nZXJQcmludCA9IHByaW1pdGl2ZS5fZ2V0RmluZ2VyUHJpbnQoKTtcbiAgICBjb25zdCBzaGFkZXJQcm9ncmFtVWlkID0gdGhpcy5fc2hhZGVyUHJvZ3JhbVVpZE1hcC5nZXQocHJpbWl0aXZlRmluZ2VyUHJpbnQpO1xuICAgIHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LnNldHVwVW5pZm9ybUxvY2F0aW9ucyh0aGlzLl9fZW5naW5lLmNvbmZpZywgc2hhZGVyUHJvZ3JhbVVpZCEsIHNoYWRlclNlbWFudGljcyk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBpbnRlcm5hbCBzZXR0aW5nIHBhcmFtZXRlcnMgdG8gR1BVIGZvciBXZWJHUFUgcmVuZGVyaW5nLlxuICAgKiBAcGFyYW0gcGFyYW1zIC0gT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgYW5kIHJlbmRlcmluZyBhcmd1bWVudHNcbiAgICovXG4gIF9zZXRJbnRlcm5hbFNldHRpbmdQYXJhbWV0ZXJzVG9HcHVXZWJHcHUoe1xuICAgIGVuZ2luZSxcbiAgICBtYXRlcmlhbCxcbiAgICBhcmdzLFxuICB9OiB7XG4gICAgZW5naW5lOiBFbmdpbmU7XG4gICAgbWF0ZXJpYWw6IE1hdGVyaWFsO1xuICAgIGFyZ3M6IFJlbmRlcmluZ0FyZ1dlYkdwdTtcbiAgfSkge1xuICAgIHRoaXMuX21hdGVyaWFsQ29udGVudC5fc2V0SW50ZXJuYWxTZXR0aW5nUGFyYW1ldGVyc1RvR3B1V2ViR3B1KHtcbiAgICAgIGVuZ2luZSxcbiAgICAgIG1hdGVyaWFsLFxuICAgICAgYXJncyxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHBhcmFtZXRlcnMgdG8gR1BVIGZvciBXZWJHTCByZW5kZXJpbmcgcGVyIG1hdGVyaWFsLlxuICAgKiBAaW50ZXJuYWwgQ2FsbGVkIGZyb20gV2ViR0xTdHJhdGVneVdlYkdMMiBvbmx5XG4gICAqIEBwYXJhbSBwYXJhbXMgLSBPYmplY3QgY29udGFpbmluZyByZW5kZXJpbmcgcGFyYW1ldGVyc1xuICAgKi9cbiAgX3NldFBhcmFtZXRlcnNUb0dwdVdlYkdMKHtcbiAgICBlbmdpbmUsXG4gICAgbWF0ZXJpYWwsXG4gICAgc2hhZGVyUHJvZ3JhbSxcbiAgICBmaXJzdFRpbWUsXG4gICAgYXJncyxcbiAgfToge1xuICAgIGVuZ2luZTogRW5naW5lO1xuICAgIG1hdGVyaWFsOiBNYXRlcmlhbDtcbiAgICBzaGFkZXJQcm9ncmFtOiBXZWJHTFByb2dyYW07XG4gICAgZmlyc3RUaW1lOiBib29sZWFuO1xuICAgIGFyZ3M6IFJlbmRlcmluZ0FyZ1dlYkdMO1xuICB9KSB7XG4gICAgLy8gRm9yIEF1dG8gUGFyYW1ldGVyc1xuICAgIHRoaXMuX19zZXRBdXRvUGFyYW1ldGVyc1RvR3B1V2ViR0woZmlyc3RUaW1lLCBzaGFkZXJQcm9ncmFtKTtcblxuICAgIC8vIEZvciBDdXN0b20gU2V0dGluZyBQYXJhbWV0ZXJzXG4gICAgdGhpcy5fbWF0ZXJpYWxDb250ZW50Ll9zZXRJbnRlcm5hbFNldHRpbmdQYXJhbWV0ZXJzVG9HcHVXZWJHTFBlck1hdGVyaWFsKHtcbiAgICAgIGVuZ2luZSxcbiAgICAgIG1hdGVyaWFsLFxuICAgICAgc2hhZGVyUHJvZ3JhbSxcbiAgICAgIGZpcnN0VGltZSxcbiAgICAgIGFyZ3MsXG4gICAgfSk7XG5cbiAgICAvLyBGb3IgU29sb0RhdHVtIFBhcmFtZXRlcnNcbiAgICB0aGlzLl9fc2V0U29sb0RhdHVtUGFyYW1ldGVyc1RvR3B1V2ViR0woe1xuICAgICAgc2hhZGVyUHJvZ3JhbSxcbiAgICAgIGZpcnN0VGltZSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHBhcmFtZXRlcnMgdG8gR1BVIGZvciBXZWJHTCByZW5kZXJpbmcgcGVyIHNoYWRlciBwcm9ncmFtLlxuICAgKiBAcGFyYW0gcGFyYW1zIC0gT2JqZWN0IGNvbnRhaW5pbmcgcmVuZGVyaW5nIHBhcmFtZXRlcnNcbiAgICovXG4gIF9zZXRQYXJhbWV0ZXJzVG9HcHVXZWJHTFBlclNoYWRlclByb2dyYW0oe1xuICAgIGVuZ2luZSxcbiAgICBtYXRlcmlhbCxcbiAgICBzaGFkZXJQcm9ncmFtLFxuICAgIGZpcnN0VGltZSxcbiAgICBhcmdzLFxuICB9OiB7XG4gICAgZW5naW5lOiBFbmdpbmU7XG4gICAgbWF0ZXJpYWw6IE1hdGVyaWFsO1xuICAgIHNoYWRlclByb2dyYW06IFdlYkdMUHJvZ3JhbTtcbiAgICBmaXJzdFRpbWU6IGJvb2xlYW47XG4gICAgYXJnczogUmVuZGVyaW5nQXJnV2ViR0w7XG4gIH0pIHtcbiAgICAvLyBGb3IgQ3VzdG9tIFNldHRpbmcgUGFyYW1ldGVyc1xuICAgIHRoaXMuX21hdGVyaWFsQ29udGVudC5fc2V0SW50ZXJuYWxTZXR0aW5nUGFyYW1ldGVyc1RvR3B1V2ViR0xQZXJTaGFkZXJQcm9ncmFtKHtcbiAgICAgIGVuZ2luZSxcbiAgICAgIG1hdGVyaWFsLFxuICAgICAgc2hhZGVyUHJvZ3JhbSxcbiAgICAgIGZpcnN0VGltZSxcbiAgICAgIGFyZ3MsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBwYXJhbWV0ZXJzIHRvIEdQVSBmb3IgV2ViR0wgcmVuZGVyaW5nIHBlciBwcmltaXRpdmUuXG4gICAqIEBwYXJhbSBwYXJhbXMgLSBPYmplY3QgY29udGFpbmluZyByZW5kZXJpbmcgcGFyYW1ldGVyc1xuICAgKi9cbiAgX3NldFBhcmFtZXRlcnNUb0dwdVdlYkdMUGVyUHJpbWl0aXZlKHtcbiAgICBtYXRlcmlhbCxcbiAgICBzaGFkZXJQcm9ncmFtLFxuICAgIGZpcnN0VGltZSxcbiAgICBhcmdzLFxuICB9OiB7XG4gICAgbWF0ZXJpYWw6IE1hdGVyaWFsO1xuICAgIHNoYWRlclByb2dyYW06IFdlYkdMUHJvZ3JhbTtcbiAgICBmaXJzdFRpbWU6IGJvb2xlYW47XG4gICAgYXJnczogUmVuZGVyaW5nQXJnV2ViR0w7XG4gIH0pIHtcbiAgICAvLyBGb3IgQ3VzdG9tIFNldHRpbmcgUGFyYW1ldGVyc1xuICAgIHRoaXMuX21hdGVyaWFsQ29udGVudC5fc2V0SW50ZXJuYWxTZXR0aW5nUGFyYW1ldGVyc1RvR3B1V2ViR0xQZXJQcmltaXRpdmUoe1xuICAgICAgbWF0ZXJpYWwsXG4gICAgICBzaGFkZXJQcm9ncmFtLFxuICAgICAgZmlyc3RUaW1lLFxuICAgICAgYXJncyxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHBhcmFtZXRlcnMgdG8gR1BVIGZvciBXZWJHTCByZW5kZXJpbmcgd2l0aG91dCBpbnRlcm5hbCBzZXR0aW5ncy5cbiAgICogQHBhcmFtIHBhcmFtcyAtIE9iamVjdCBjb250YWluaW5nIHJlbmRlcmluZyBwYXJhbWV0ZXJzXG4gICAqL1xuICBfc2V0UGFyYW1ldGVyc1RvR3B1V2ViR0xXaXRoT3V0SW50ZXJuYWxTZXR0aW5nKHtcbiAgICBzaGFkZXJQcm9ncmFtLFxuICAgIGZpcnN0VGltZSxcbiAgfToge1xuICAgIHNoYWRlclByb2dyYW06IFdlYkdMUHJvZ3JhbTtcbiAgICBmaXJzdFRpbWU6IGJvb2xlYW47XG4gIH0pIHtcbiAgICAvLyBGb3IgQXV0byBQYXJhbWV0ZXJzXG4gICAgdGhpcy5fX3NldEF1dG9QYXJhbWV0ZXJzVG9HcHVXZWJHTChmaXJzdFRpbWUsIHNoYWRlclByb2dyYW0pO1xuXG4gICAgLy8gRm9yIFNvbG9EYXR1bSBQYXJhbWV0ZXJzXG4gICAgdGhpcy5fX3NldFNvbG9EYXR1bVBhcmFtZXRlcnNUb0dwdVdlYkdMKHtcbiAgICAgIHNoYWRlclByb2dyYW0sXG4gICAgICBmaXJzdFRpbWUsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBzaGFkZXIgcHJvcGVydHkgc3RyaW5ncyBmb3IgdmVydGV4IGFuZCBwaXhlbCBzaGFkZXJzLlxuICAgKiBAaW50ZXJuYWxcbiAgICogQHBhcmFtIHByb3BlcnR5U2V0dGVyIC0gRnVuY3Rpb24gdG8gc2V0IHNoYWRlciBwcm9wZXJ0aWVzXG4gICAqIEByZXR1cm5zIE9iamVjdCBjb250YWluaW5nIHZlcnRleCBhbmQgcGl4ZWwgcHJvcGVydHkgc3RyaW5nc1xuICAgKi9cbiAgX2dldFByb3BlcnRpZXMoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgcHJvcGVydHlTZXR0ZXJPZkdsb2JhbERhdGFSZXBvc2l0b3J5OiBnZXRTaGFkZXJQcm9wZXJ0eUZ1bmNPZkdsb2JhbERhdGFSZXBvc2l0b3J5LFxuICAgIHByb3BlcnR5U2V0dGVyT2ZNYXRlcmlhbDogZ2V0U2hhZGVyUHJvcGVydHlGdW5jT2ZNYXRlcmlhbFxuICApIHtcbiAgICBsZXQgdmVydGV4UHJvcGVydGllc1N0ciA9ICcnO1xuICAgIGxldCBwaXhlbFByb3BlcnRpZXNTdHIgPSAnJztcbiAgICB0aGlzLl9hbGxGaWVsZHNJbmZvLmZvckVhY2goaW5mbyA9PiB7XG4gICAgICBpZiAoaW5mbyEuc3RhZ2UgPT09IFNoYWRlclR5cGUuVmVydGV4U2hhZGVyIHx8IGluZm8hLnN0YWdlID09PSBTaGFkZXJUeXBlLlZlcnRleEFuZFBpeGVsU2hhZGVyKSB7XG4gICAgICAgIHZlcnRleFByb3BlcnRpZXNTdHIgKz0gcHJvcGVydHlTZXR0ZXJPZk1hdGVyaWFsKGVuZ2luZSwgdGhpcy5fX21hdGVyaWFsVHlwZU5hbWUsIGluZm8hKTtcbiAgICAgIH1cbiAgICAgIGlmIChpbmZvIS5zdGFnZSA9PT0gU2hhZGVyVHlwZS5QaXhlbFNoYWRlciB8fCBpbmZvIS5zdGFnZSA9PT0gU2hhZGVyVHlwZS5WZXJ0ZXhBbmRQaXhlbFNoYWRlcikge1xuICAgICAgICBwaXhlbFByb3BlcnRpZXNTdHIgKz0gcHJvcGVydHlTZXR0ZXJPZk1hdGVyaWFsKGVuZ2luZSwgdGhpcy5fX21hdGVyaWFsVHlwZU5hbWUsIGluZm8hKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBjb25zdCBnbG9iYWxEYXRhUmVwb3NpdG9yeSA9IGVuZ2luZS5nbG9iYWxEYXRhUmVwb3NpdG9yeTtcbiAgICBbdmVydGV4UHJvcGVydGllc1N0ciwgcGl4ZWxQcm9wZXJ0aWVzU3RyXSA9IGdsb2JhbERhdGFSZXBvc2l0b3J5Ll9hZGRQcm9wZXJ0aWVzU3RyKFxuICAgICAgdmVydGV4UHJvcGVydGllc1N0cixcbiAgICAgIHBpeGVsUHJvcGVydGllc1N0cixcbiAgICAgIHByb3BlcnR5U2V0dGVyT2ZHbG9iYWxEYXRhUmVwb3NpdG9yeVxuICAgICk7XG4gICAgcmV0dXJuIHsgdmVydGV4UHJvcGVydGllc1N0ciwgcGl4ZWxQcm9wZXJ0aWVzU3RyIH07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhdXRvbWF0aWMgcGFyYW1ldGVycyB0byBHUFUgZm9yIFdlYkdMIHJlbmRlcmluZy5cbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIGZpcnN0VGltZSAtIFdoZXRoZXIgdGhpcyBpcyB0aGUgZmlyc3QgdGltZSBzZXR0aW5nIHBhcmFtZXRlcnNcbiAgICogQHBhcmFtIHNoYWRlclByb2dyYW0gLSBUaGUgV2ViR0wgc2hhZGVyIHByb2dyYW1cbiAgICovXG4gIHByaXZhdGUgX19zZXRBdXRvUGFyYW1ldGVyc1RvR3B1V2ViR0woZmlyc3RUaW1lOiBib29sZWFuLCBzaGFkZXJQcm9ncmFtOiBXZWJHTFByb2dyYW0pIHtcbiAgICBjb25zdCB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeSA9IHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgZm9yIChjb25zdCBbLCB2YWx1ZV0gb2YgdGhpcy5fYXV0b1RleHR1cmVGaWVsZFZhcmlhYmxlc09ubHkpIHtcbiAgICAgIGNvbnN0IGluZm8gPSB2YWx1ZS5pbmZvO1xuICAgICAgaWYgKGZpcnN0VGltZSkge1xuICAgICAgICB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5zZXRVbmlmb3JtMWlGb3JUZXh0dXJlKHNoYWRlclByb2dyYW0sIGluZm8uc2VtYW50aWMsIHZhbHVlLnZhbHVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmJpbmRUZXh0dXJlKGluZm8sIHZhbHVlLnZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChjb25zdCBbLCB2YWx1ZV0gb2YgdGhpcy5fYXV0b1VuaWZvcm1GaWVsZFZhcmlhYmxlc09ubHkpIHtcbiAgICAgIGNvbnN0IGluZm8gPSB2YWx1ZS5pbmZvO1xuICAgICAgaWYgKGluZm8ubmVlZFVuaWZvcm1JbkRhdGFUZXh0dXJlTW9kZSkge1xuICAgICAgICB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5zZXRVbmlmb3JtVmFsdWUoc2hhZGVyUHJvZ3JhbSwgaW5mby5zZW1hbnRpYywgZmlyc3RUaW1lLCB2YWx1ZS52YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgc29sbyBkYXR1bSBwYXJhbWV0ZXJzIHRvIEdQVSBmb3IgV2ViR0wgcmVuZGVyaW5nLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0gcGFyYW1zIC0gT2JqZWN0IGNvbnRhaW5pbmcgcmVuZGVyaW5nIHBhcmFtZXRlcnNcbiAgICovXG4gIHByaXZhdGUgX19zZXRTb2xvRGF0dW1QYXJhbWV0ZXJzVG9HcHVXZWJHTCh7XG4gICAgc2hhZGVyUHJvZ3JhbSxcbiAgICBmaXJzdFRpbWUsXG4gIH06IHtcbiAgICBzaGFkZXJQcm9ncmFtOiBXZWJHTFByb2dyYW07XG4gICAgZmlyc3RUaW1lOiBib29sZWFuO1xuICB9KSB7XG4gICAgY29uc3Qgd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIGNvbnN0IG1hdGVyaWFsVHlwZU5hbWUgPSB0aGlzLl9fbWF0ZXJpYWxUeXBlTmFtZTtcbiAgICBjb25zdCBtYXAgPSB0aGlzLl9fZW5naW5lLm1hdGVyaWFsUmVwb3NpdG9yeS5fc29sb0RhdHVtRmllbGRzLmdldChtYXRlcmlhbFR5cGVOYW1lKTtcbiAgICBpZiAobWFwID09IG51bGwpIHJldHVybjtcbiAgICBjb25zdCB2YWx1ZXMgPSBtYXAudmFsdWVzKCk7XG4gICAgZm9yIChjb25zdCB2YWx1ZSBvZiB2YWx1ZXMpIHtcbiAgICAgIGNvbnN0IGluZm8gPSB2YWx1ZS5pbmZvO1xuICAgICAgaWYgKENvbXBvc2l0aW9uVHlwZS5pc1RleHR1cmUoaW5mby5jb21wb3NpdGlvblR5cGUpKSB7XG4gICAgICAgIGlmICghaW5mby5pc0ludGVybmFsU2V0dGluZykge1xuICAgICAgICAgIGlmIChmaXJzdFRpbWUpIHtcbiAgICAgICAgICAgIHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LnNldFVuaWZvcm1WYWx1ZShzaGFkZXJQcm9ncmFtLCBpbmZvLnNlbWFudGljLCBmaXJzdFRpbWUsIHZhbHVlLnZhbHVlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuYmluZFRleHR1cmUoaW5mbywgdmFsdWUudmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBibGVuZCBlcXVhdGlvbiBtb2RlIGZvciBibGVuZGluZyBvcGVyYXRpb25zLlxuICAgKiBUaGlzIG1ldGhvZCBvbmx5IHdvcmtzIGlmIHRoZSBhbHBoYSBtb2RlIGlzIHNldCB0byBibGVuZC5cbiAgICogQHBhcmFtIGJsZW5kRXF1YXRpb25Nb2RlIC0gVGhlIGJsZW5kIGVxdWF0aW9uIG1vZGUgKGUuZy4sIGdsLkZVTkNfQUREKVxuICAgKiBAcGFyYW0gYmxlbmRFcXVhdGlvbk1vZGVBbHBoYSAtIE9wdGlvbmFsIHNlcGFyYXRlIGJsZW5kIGVxdWF0aW9uIG1vZGUgZm9yIGFscGhhIGNoYW5uZWxcbiAgICovXG4gIHB1YmxpYyBzZXRCbGVuZEVxdWF0aW9uTW9kZShibGVuZEVxdWF0aW9uTW9kZTogQmxlbmRFbnVtLCBibGVuZEVxdWF0aW9uTW9kZUFscGhhPzogQmxlbmRFbnVtKSB7XG4gICAgdGhpcy5fX2JsZW5kRXF1YXRpb25Nb2RlID0gYmxlbmRFcXVhdGlvbk1vZGU7XG4gICAgdGhpcy5fX2JsZW5kRXF1YXRpb25Nb2RlQWxwaGEgPSBibGVuZEVxdWF0aW9uTW9kZUFscGhhID8/IGJsZW5kRXF1YXRpb25Nb2RlO1xuXG4gICAgdGhpcy5fX3RyZWF0Rm9yTWluTWF4KCk7XG5cbiAgICB0aGlzLl9fc3RhdGVWZXJzaW9uKys7XG4gICAgdGhpcy5fX2VuZ2luZS5tYXRlcmlhbFJlcG9zaXRvcnkuX2luY3JlbWVudFN0YXRlVmVyc2lvbigpO1xuICAgIHRoaXMuY2FsY0ZpbmdlclByaW50KCk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyBzcGVjaWFsIGNhc2VzIGZvciBNaW4vTWF4IGJsZW5kIGVxdWF0aW9ucyBkdWUgdG8gV2ViR1BVIGxpbWl0YXRpb25zLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX3RyZWF0Rm9yTWluTWF4KCkge1xuICAgIC8vIGR1ZSB0byB0aGUgbGltaXRhdGlvbiBvZiBXZWJHUFUsIFNlZSB0aGUgbGFzdCBwYXJ0IG9mIGh0dHBzOi8vd3d3LnczLm9yZy9UUi93ZWJncHUvI2ZyYWdtZW50LXN0YXRlXG4gICAgaWYgKHRoaXMuX19ibGVuZEVxdWF0aW9uTW9kZSA9PT0gQmxlbmQuTWluIHx8IHRoaXMuX19ibGVuZEVxdWF0aW9uTW9kZSA9PT0gQmxlbmQuTWF4KSB7XG4gICAgICB0aGlzLl9fYmxlbmRGdW5jRHN0RmFjdG9yID0gQmxlbmQuT25lO1xuICAgICAgdGhpcy5fX2JsZW5kRnVuY1NyY0ZhY3RvciA9IEJsZW5kLk9uZTtcbiAgICB9XG4gICAgaWYgKHRoaXMuX19ibGVuZEVxdWF0aW9uTW9kZUFscGhhID09PSBCbGVuZC5NaW4gfHwgdGhpcy5fX2JsZW5kRXF1YXRpb25Nb2RlQWxwaGEgPT09IEJsZW5kLk1heCkge1xuICAgICAgdGhpcy5fX2JsZW5kRnVuY0FscGhhRHN0RmFjdG9yID0gQmxlbmQuT25lO1xuICAgICAgdGhpcy5fX2JsZW5kRnVuY0FscGhhU3JjRmFjdG9yID0gQmxlbmQuT25lO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHNlcGFyYXRlIGJsZW5kIGZ1bmN0aW9uIGZhY3RvcnMgZm9yIFJHQiBhbmQgYWxwaGEgY2hhbm5lbHMuXG4gICAqIFRoaXMgbWV0aG9kIG9ubHkgd29ya3MgaWYgdGhlIGFscGhhIG1vZGUgaXMgc2V0IHRvIGJsZW5kLlxuICAgKiBAcGFyYW0gYmxlbmRGdW5jU3JjRmFjdG9yIC0gU291cmNlIGJsZW5kIGZhY3RvciBmb3IgUkdCXG4gICAqIEBwYXJhbSBibGVuZEZ1bmNEc3RGYWN0b3IgLSBEZXN0aW5hdGlvbiBibGVuZCBmYWN0b3IgZm9yIFJHQlxuICAgKiBAcGFyYW0gYmxlbmRGdW5jQWxwaGFTcmNGYWN0b3IgLSBTb3VyY2UgYmxlbmQgZmFjdG9yIGZvciBhbHBoYVxuICAgKiBAcGFyYW0gYmxlbmRGdW5jQWxwaGFEc3RGYWN0b3IgLSBEZXN0aW5hdGlvbiBibGVuZCBmYWN0b3IgZm9yIGFscGhhXG4gICAqL1xuICBwdWJsaWMgc2V0QmxlbmRGdW5jU2VwYXJhdGVGYWN0b3IoXG4gICAgYmxlbmRGdW5jU3JjRmFjdG9yOiBCbGVuZEVudW0sXG4gICAgYmxlbmRGdW5jRHN0RmFjdG9yOiBCbGVuZEVudW0sXG4gICAgYmxlbmRGdW5jQWxwaGFTcmNGYWN0b3I6IEJsZW5kRW51bSxcbiAgICBibGVuZEZ1bmNBbHBoYURzdEZhY3RvcjogQmxlbmRFbnVtXG4gICkge1xuICAgIHRoaXMuX19ibGVuZEZ1bmNTcmNGYWN0b3IgPSBibGVuZEZ1bmNTcmNGYWN0b3I7XG4gICAgdGhpcy5fX2JsZW5kRnVuY0RzdEZhY3RvciA9IGJsZW5kRnVuY0RzdEZhY3RvcjtcbiAgICB0aGlzLl9fYmxlbmRGdW5jQWxwaGFTcmNGYWN0b3IgPSBibGVuZEZ1bmNBbHBoYVNyY0ZhY3RvcjtcbiAgICB0aGlzLl9fYmxlbmRGdW5jQWxwaGFEc3RGYWN0b3IgPSBibGVuZEZ1bmNBbHBoYURzdEZhY3RvcjtcblxuICAgIHRoaXMuX190cmVhdEZvck1pbk1heCgpO1xuXG4gICAgdGhpcy5fX3N0YXRlVmVyc2lvbisrO1xuICAgIHRoaXMuX19lbmdpbmUubWF0ZXJpYWxSZXBvc2l0b3J5Ll9pbmNyZW1lbnRTdGF0ZVZlcnNpb24oKTtcbiAgICB0aGlzLmNhbGNGaW5nZXJQcmludCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYmxlbmQgZnVuY3Rpb24gZmFjdG9ycyBmb3IgYm90aCBSR0IgYW5kIGFscGhhIGNoYW5uZWxzLlxuICAgKiBUaGlzIG1ldGhvZCBvbmx5IHdvcmtzIGlmIHRoZSBhbHBoYSBtb2RlIGlzIHNldCB0byBibGVuZC5cbiAgICogQHBhcmFtIGJsZW5kRnVuY1NyY0ZhY3RvciAtIFNvdXJjZSBibGVuZCBmYWN0b3JcbiAgICogQHBhcmFtIGJsZW5kRnVuY0RzdEZhY3RvciAtIERlc3RpbmF0aW9uIGJsZW5kIGZhY3RvclxuICAgKi9cbiAgcHVibGljIHNldEJsZW5kRnVuY0ZhY3RvcihibGVuZEZ1bmNTcmNGYWN0b3I6IEJsZW5kRW51bSwgYmxlbmRGdW5jRHN0RmFjdG9yOiBCbGVuZEVudW0pIHtcbiAgICB0aGlzLl9fYmxlbmRGdW5jU3JjRmFjdG9yID0gYmxlbmRGdW5jU3JjRmFjdG9yO1xuICAgIHRoaXMuX19ibGVuZEZ1bmNEc3RGYWN0b3IgPSBibGVuZEZ1bmNEc3RGYWN0b3I7XG4gICAgdGhpcy5fX2JsZW5kRnVuY0FscGhhU3JjRmFjdG9yID0gYmxlbmRGdW5jU3JjRmFjdG9yO1xuICAgIHRoaXMuX19ibGVuZEZ1bmNBbHBoYURzdEZhY3RvciA9IGJsZW5kRnVuY0RzdEZhY3RvcjtcblxuICAgIHRoaXMuX190cmVhdEZvck1pbk1heCgpO1xuXG4gICAgdGhpcy5fX3N0YXRlVmVyc2lvbisrO1xuICAgIHRoaXMuX19lbmdpbmUubWF0ZXJpYWxSZXBvc2l0b3J5Ll9pbmNyZW1lbnRTdGF0ZVZlcnNpb24oKTtcbiAgICB0aGlzLmNhbGNGaW5nZXJQcmludCgpO1xuICB9XG5cbiAgLy8gc2V0TWF0ZXJpYWxOb2RlKG1hdGVyaWFsTm9kZTogQWJzdHJhY3RNYXRlcmlhbE5vZGUpIHtcbiAgLy8gICB0aGlzLl9fbWF0ZXJpYWxOb2RlID0gbWF0ZXJpYWxOb2RlO1xuICAvLyB9XG5cbiAgLy8vXG4gIC8vLyBHZXR0ZXJzXG4gIC8vL1xuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhlIG1hdGVyaWFsIGlzIGluIGJsZW5kIG1vZGUuXG4gICAqIEByZXR1cm5zIFRydWUgaWYgYWxwaGEgbW9kZSBpcyBCbGVuZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBpc0JsZW5kKCkge1xuICAgIGlmICh0aGlzLmFscGhhTW9kZSA9PT0gQWxwaGFNb2RlLkJsZW5kKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgbWF0ZXJpYWwgaXMgdHJhbnNsdWNlbnQgYnV0IG5vdCBpbiBibGVuZCBtb2RlLlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIGFscGhhIG1vZGUgaXMgT3BhcXVlIG9yIE1hc2sgYW5kIHRoZSBtYXRlcmlhbCBpcyB0cmFuc2x1Y2VudFxuICAgKi9cbiAgaXNUcmFuc2x1Y2VudE9wYXF1ZSgpIHtcbiAgICBpZiAodGhpcy5hbHBoYU1vZGUgIT09IEFscGhhTW9kZS5CbGVuZCAmJiB0aGlzLmlzVHJhbnNsdWNlbnQpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSBtYXRlcmlhbCBpcyBlaXRoZXIgaW4gYmxlbmQgbW9kZSBvciB0cmFuc2x1Y2VudC5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiBpbiBibGVuZCBtb2RlIG9yIHRyYW5zbHVjZW50LCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGlzQmxlbmRPclRyYW5zbHVjZW50KCkge1xuICAgIGlmICh0aGlzLmFscGhhTW9kZSA9PT0gQWxwaGFNb2RlLkJsZW5kIHx8IHRoaXMuaXNUcmFuc2x1Y2VudCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhlIG1hdGVyaWFsIGlzIGluIG9wYXF1ZSBtb2RlLlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIGFscGhhIG1vZGUgaXMgT3BhcXVlLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGlzT3BhcXVlKCkge1xuICAgIHJldHVybiB0aGlzLmFscGhhTW9kZSA9PT0gQWxwaGFNb2RlLk9wYXF1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhlIG1hdGVyaWFsIGlzIGluIG1hc2sgbW9kZS5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiBhbHBoYSBtb2RlIGlzIE1hc2ssIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgaXNNYXNrKCkge1xuICAgIHJldHVybiB0aGlzLmFscGhhTW9kZSA9PT0gQWxwaGFNb2RlLk1hc2s7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB3aGV0aGVyIGFscGhhLXRvLWNvdmVyYWdlIGlzIGVuYWJsZWQgZm9yIHRoaXMgbWF0ZXJpYWwuXG4gICAqIE5PVEU6IFRvIGFwcGx5IGFscGhhLXRvLWNvdmVyYWdlLCB0aGUgb3V0cHV0IGFscGhhIHZhbHVlIG11c3Qgbm90IGJlIGZpeGVkIHRvIGEgY29uc3RhbnQgdmFsdWUuXG4gICAqIEhvd2V2ZXIsIHNvbWUgc2hhZGVycyBpbiBSaG9kb25pdGUgZml4IHRoZSBvdXRwdXQgYWxwaGEgdmFsdWUgdG8gMSBieSBzZXRBbHBoYUlmTm90SW5BbHBoYUJsZW5kTW9kZS5cbiAgICogVGhlIHNoYWRlciBuZWVkcyB0byBiZSBpbXByb3ZlZCB0byBwcm9wZXJseSB1c2UgYWxwaGEtdG8tY292ZXJhZ2UuXG4gICAqIEBwYXJhbSBhbHBoYVRvQ292ZXJhZ2UgLSBXaGV0aGVyIHRvIGFwcGx5IGFscGhhLXRvLWNvdmVyYWdlIHRvIHRoaXMgbWF0ZXJpYWxcbiAgICovXG4gIHNldCBhbHBoYVRvQ292ZXJhZ2UoYWxwaGFUb0NvdmVyYWdlOiBib29sZWFuKSB7XG4gICAgaWYgKGFscGhhVG9Db3ZlcmFnZSAmJiB0aGlzLmFscGhhTW9kZSA9PT0gQWxwaGFNb2RlLkJsZW5kKSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC53YXJuKFxuICAgICAgICAnSWYgeW91IHNldCBhbHBoYVRvQ292ZXJhZ2UgPSB0cnVlIG9uIGEgbWF0ZXJpYWwgd2hvc2UgQWxwaGFNb2RlIGlzIFRyYW5zbHVjZW50LCB5b3UgbWF5IGdldCBkcmF3aW5nIHByb2JsZW1zLidcbiAgICAgICk7XG4gICAgfVxuICAgIHRoaXMuX19hbHBoYVRvQ292ZXJhZ2UgPSBhbHBoYVRvQ292ZXJhZ2U7XG4gICAgdGhpcy5tYWtlU2hhZGVyc0ludmFsaWRhdGUoKTtcbiAgICB0aGlzLmNhbGNGaW5nZXJQcmludCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgd2hldGhlciBhbHBoYS10by1jb3ZlcmFnZSBpcyBlbmFibGVkIGZvciB0aGlzIG1hdGVyaWFsLlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIGFscGhhLXRvLWNvdmVyYWdlIGlzIGVuYWJsZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgZ2V0IGFscGhhVG9Db3ZlcmFnZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fX2FscGhhVG9Db3ZlcmFnZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtYXRlcmlhbCB0eXBlIElELlxuICAgKiBAcmV0dXJucyBUaGUgbWF0ZXJpYWwgdHlwZSBJRFxuICAgKi9cbiAgZ2V0IG1hdGVyaWFsVElEKCk6IE1hdGVyaWFsVElEIHtcbiAgICByZXR1cm4gdGhpcy5fX21hdGVyaWFsVGlkO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYW4gYXJyYXkgb2YgYWxsIGZpZWxkIGluZm9ybWF0aW9uIGZvciB0aGlzIG1hdGVyaWFsLlxuICAgKiBAcmV0dXJucyBBcnJheSBvZiBzaGFkZXIgc2VtYW50aWNzIGluZm9ybWF0aW9uXG4gICAqL1xuICBnZXQgZmllbGRzSW5mb0FycmF5KCkge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuX2FsbEZpZWxkc0luZm8udmFsdWVzKCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGJsZW5kIGVxdWF0aW9uIG1vZGUgZm9yIFJHQiBjaGFubmVscy5cbiAgICogQHJldHVybnMgVGhlIGJsZW5kIGVxdWF0aW9uIG1vZGVcbiAgICovXG4gIGdldCBibGVuZEVxdWF0aW9uTW9kZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fX2JsZW5kRXF1YXRpb25Nb2RlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGJsZW5kIGVxdWF0aW9uIG1vZGUgZm9yIHRoZSBhbHBoYSBjaGFubmVsLlxuICAgKiBAcmV0dXJucyBUaGUgYWxwaGEgYmxlbmQgZXF1YXRpb24gbW9kZVxuICAgKi9cbiAgZ2V0IGJsZW5kRXF1YXRpb25Nb2RlQWxwaGEoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19ibGVuZEVxdWF0aW9uTW9kZUFscGhhO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHNvdXJjZSBibGVuZCBmYWN0b3IgZm9yIFJHQiBjaGFubmVscy5cbiAgICogQHJldHVybnMgVGhlIHNvdXJjZSBibGVuZCBmYWN0b3JcbiAgICovXG4gIGdldCBibGVuZEZ1bmNTcmNGYWN0b3IoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19ibGVuZEZ1bmNTcmNGYWN0b3I7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZGVzdGluYXRpb24gYmxlbmQgZmFjdG9yIGZvciBSR0IgY2hhbm5lbHMuXG4gICAqIEByZXR1cm5zIFRoZSBkZXN0aW5hdGlvbiBibGVuZCBmYWN0b3JcbiAgICovXG4gIGdldCBibGVuZEZ1bmNEc3RGYWN0b3IoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19ibGVuZEZ1bmNEc3RGYWN0b3I7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgc291cmNlIGJsZW5kIGZhY3RvciBmb3IgdGhlIGFscGhhIGNoYW5uZWwuXG4gICAqIEByZXR1cm5zIFRoZSBhbHBoYSBzb3VyY2UgYmxlbmQgZmFjdG9yXG4gICAqL1xuICBnZXQgYmxlbmRGdW5jQWxwaGFTcmNGYWN0b3IoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19ibGVuZEZ1bmNBbHBoYVNyY0ZhY3RvcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBkZXN0aW5hdGlvbiBibGVuZCBmYWN0b3IgZm9yIHRoZSBhbHBoYSBjaGFubmVsLlxuICAgKiBAcmV0dXJucyBUaGUgYWxwaGEgZGVzdGluYXRpb24gYmxlbmQgZmFjdG9yXG4gICAqL1xuICBnZXQgYmxlbmRGdW5jQWxwaGFEc3RGYWN0b3IoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19ibGVuZEZ1bmNBbHBoYURzdEZhY3RvcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IGFscGhhIG1vZGUgb2YgdGhlIG1hdGVyaWFsLlxuICAgKiBAcmV0dXJucyBUaGUgYWxwaGEgbW9kZVxuICAgKi9cbiAgZ2V0IGFscGhhTW9kZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fX2FscGhhTW9kZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBhbHBoYSBtb2RlIG9mIHRoZSBtYXRlcmlhbC5cbiAgICogVGhpcyB3aWxsIGludmFsaWRhdGUgc2hhZGVycyBhbmQgcmVjYWxjdWxhdGUgdGhlIGZpbmdlcnByaW50LlxuICAgKiBAcGFyYW0gbW9kZSAtIFRoZSBhbHBoYSBtb2RlIHRvIHNldFxuICAgKi9cbiAgc2V0IGFscGhhTW9kZShtb2RlOiBBbHBoYU1vZGVFbnVtKSB7XG4gICAgdGhpcy5fX2FscGhhTW9kZSA9IG1vZGU7XG4gICAgdGhpcy5jYWxjRmluZ2VyUHJpbnQoKTtcbiAgICB0aGlzLm1ha2VTaGFkZXJzSW52YWxpZGF0ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHVuaXF1ZSBtYXRlcmlhbCBJRC5cbiAgICogQHJldHVybnMgVGhlIG1hdGVyaWFsIFVJRFxuICAgKi9cbiAgZ2V0IG1hdGVyaWFsVUlEKCk6IE1hdGVyaWFsVUlEIHtcbiAgICByZXR1cm4gdGhpcy5fX21hdGVyaWFsVWlkO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1hdGVyaWFsIHNlcmlhbCBJRCB3aXRoaW4gdGhlIG1hdGVyaWFsIHR5cGUuXG4gICAqIEByZXR1cm5zIFRoZSBtYXRlcmlhbCBTSURcbiAgICovXG4gIGdldCBtYXRlcmlhbFNJRCgpOiBNYXRlcmlhbFNJRCB7XG4gICAgcmV0dXJuIHRoaXMuX19tYXRlcmlhbFNpZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhpcyBtYXRlcmlhbCBzdXBwb3J0cyBza2lubmluZy5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiBza2lubmluZyBpcyBzdXBwb3J0ZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgZ2V0IGlzU2tpbm5pbmcoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX21hdGVyaWFsQ29udGVudC5pc1NraW5uaW5nO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGlzIG1hdGVyaWFsIHN1cHBvcnRzIG1vcnBoaW5nLlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIG1vcnBoaW5nIGlzIHN1cHBvcnRlZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBnZXQgaXNNb3JwaGluZygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fbWF0ZXJpYWxDb250ZW50LmlzTW9ycGhpbmc7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoaXMgbWF0ZXJpYWwgc3VwcG9ydHMgbGlnaHRpbmcuXG4gICAqIEByZXR1cm5zIFRydWUgaWYgbGlnaHRpbmcgaXMgc3VwcG9ydGVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGdldCBpc0xpZ2h0aW5nKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9tYXRlcmlhbENvbnRlbnQuaXNMaWdodGluZztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtYXRlcmlhbCB0eXBlIG5hbWUuXG4gICAqIFRoaXMgaW5jbHVkZXMgdGhlIGZ1bGwgdHlwZSBuYW1lIHdpdGggdmFyaWF0aW9uIGlkZW50aWZpZXIgZm9yIGludGVybmFsIHVzZS5cbiAgICogQHJldHVybnMgVGhlIG1hdGVyaWFsIHR5cGUgbmFtZVxuICAgKi9cbiAgZ2V0IG1hdGVyaWFsVHlwZU5hbWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fX21hdGVyaWFsVHlwZU5hbWU7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgYmFzZSBtYXRlcmlhbCBuYW1lIHdpdGhvdXQgdmFyaWF0aW9uIGlkZW50aWZpZXIuXG4gICAqIFRoaXMgaXMgdGhlIGh1bWFuLXJlYWRhYmxlIG1hdGVyaWFsIHR5cGUgbmFtZSAoZS5nLiwgXCJQYnJVYmVyXCIsIFwiQ2xhc3NpY1ViZXJcIikuXG4gICAqIEByZXR1cm5zIFRoZSBiYXNlIG1hdGVyaWFsIG5hbWVcbiAgICovXG4gIGdldCBiYXNlTWF0ZXJpYWxOYW1lKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuX21hdGVyaWFsQ29udGVudC5nZXRCYXNlTWF0ZXJpYWxOYW1lKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWF0ZXJpYWwgdmFyaWF0aW9uIGlkZW50aWZpZXIuXG4gICAqIFRoaXMgcmVwcmVzZW50cyB0aGUgcGFyYW1ldGVyIHZhcmlhdGlvbiBwYXJ0IG9mIHRoZSBtYXRlcmlhbCB0eXBlLlxuICAgKiBAcmV0dXJucyBUaGUgdmFyaWF0aW9uIGlkZW50aWZpZXIgc3RyaW5nXG4gICAqL1xuICBnZXQgbWF0ZXJpYWxWYXJpYXRpb25JZGVudGlmaWVyKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuX21hdGVyaWFsQ29udGVudC5nZXRNYXRlcmlhbFZhcmlhdGlvbklkZW50aWZpZXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IHN0YXRlIHZlcnNpb24gb2YgdGhpcyBtYXRlcmlhbC5cbiAgICogVGhpcyBpcyBpbmNyZW1lbnRlZCB3aGVuZXZlciB0aGUgbWF0ZXJpYWwncyBzdGF0ZSBjaGFuZ2VzLlxuICAgKiBAcmV0dXJucyBUaGUgc3RhdGUgdmVyc2lvbiBudW1iZXJcbiAgICovXG4gIGdldCBzdGF0ZVZlcnNpb24oKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fX3N0YXRlVmVyc2lvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnZhbGlkYXRlcyBhbGwgc2hhZGVyIHByb2dyYW1zIGFzc29jaWF0ZWQgd2l0aCB0aGlzIG1hdGVyaWFsLlxuICAgKiBUaGlzIGZvcmNlcyBzaGFkZXIgcmVjb21waWxhdGlvbiBvbiB0aGUgbmV4dCByZW5kZXIuXG4gICAqL1xuICBtYWtlU2hhZGVyc0ludmFsaWRhdGUoKSB7XG4gICAgdGhpcy5fc2hhZGVyUHJvZ3JhbVVpZE1hcC5jbGVhcigpO1xuICAgIHRoaXMuX3NoYWRlclByb2dyYW1Db21wb25lbnRTdGF0ZVZlcnNpb25NYXAuY2xlYXIoKTtcbiAgICB0aGlzLl9fc3RhdGVWZXJzaW9uKys7XG4gICAgdGhpcy5fX2luY3JlbWVudFBpcGVsaW5lU3RhdGVWZXJzaW9uKCk7XG4gICAgdGhpcy5fX2VuZ2luZS5tYXRlcmlhbFJlcG9zaXRvcnkuX2luY3JlbWVudFN0YXRlVmVyc2lvbigpO1xuICB9XG5cbiAgdXBkYXRlU3RhdGVWZXJzaW9uKCkge1xuICAgIHRoaXMuX19zdGF0ZVZlcnNpb24rKztcbiAgICAvLyBDYWxsZWQgd2hlbiB0aGUgc2hhZGVyIHByb2dyYW0gY2FjaGUgbWlzc2VzLCBzbyBhIG5ldyBHUFVTaGFkZXJNb2R1bGVcbiAgICAvLyB3aWxsIGJlIGNyZWF0ZWQuIFRoZSByZW5kZXIgcGlwZWxpbmUgZW1iZWRzIHRoZSBtb2R1bGUgYW5kIG11c3QgYmVcbiAgICAvLyByZWJ1aWx0IGFzIHdlbGwuXG4gICAgdGhpcy5fX2luY3JlbWVudFBpcGVsaW5lU3RhdGVWZXJzaW9uKCk7XG4gICAgdGhpcy5fX2VuZ2luZS5tYXRlcmlhbFJlcG9zaXRvcnkuX2luY3JlbWVudFN0YXRlVmVyc2lvbigpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHZlcnNpb24gdGhhdCBpcyBidW1wZWQgb25seSB3aGVuIHRoZSByZW5kZXIgcGlwZWxpbmVcbiAgICogY29uZmlndXJhdGlvbiBjaGFuZ2VzIChzaGFkZXIgcHJvZ3JhbSwgYmxlbmQgc3RhdGUsIGN1bGwgbW9kZSwgLi4uKS5cbiAgICogVW5pZm9ybSBwYXJhbWV0ZXIgdXBkYXRlcyBkbyBub3QgYWZmZWN0IHRoaXMgdmVyc2lvbi5cbiAgICogQHJldHVybnMgVGhlIHBpcGVsaW5lIHN0YXRlIHZlcnNpb24gbnVtYmVyXG4gICAqL1xuICBnZXQgcGlwZWxpbmVTdGF0ZVZlcnNpb24oKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fX3BpcGVsaW5lU3RhdGVWZXJzaW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHZlcnNpb24gdGhhdCBpcyBidW1wZWQgb25seSB3aGVuIHRleHR1cmUgb3Igc2FtcGxlciBiaW5kaW5nc1xuICAgKiBjaGFuZ2UuIFVzZWQgdG8gaW52YWxpZGF0ZSBXZWJHUFUgYmluZCBncm91cHMgYW5kIHJlbmRlciBidW5kbGVzLlxuICAgKiBAcmV0dXJucyBUaGUgdGV4dHVyZSBiaW5kaW5nIHN0YXRlIHZlcnNpb24gbnVtYmVyXG4gICAqL1xuICBnZXQgdGV4dHVyZVN0YXRlVmVyc2lvbigpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9fdGV4dHVyZVN0YXRlVmVyc2lvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBzaGFkZXIgbm9kZSBKU09OIGRhdGEgZm9yIG5vZGUtYmFzZWQgbWF0ZXJpYWxzLlxuICAgKiBUaGlzIGlzIHVzZWQgYnkgUkhPRE9OSVRFX21hdGVyaWFsc19ub2RlIGV4dGVuc2lvbi5cbiAgICogQHJldHVybnMgVGhlIHNoYWRlciBub2RlIEpTT04gZGF0YSwgb3IgdW5kZWZpbmVkIGlmIG5vdCBhIG5vZGUtYmFzZWQgbWF0ZXJpYWxcbiAgICovXG4gIGdldCBzaGFkZXJOb2RlSnNvbigpOiB1bmtub3duIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fX3NoYWRlck5vZGVKc29uO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHNoYWRlciBub2RlIEpTT04gZGF0YSBmb3Igbm9kZS1iYXNlZCBtYXRlcmlhbHMuXG4gICAqIFRoaXMgbWFya3MgdGhlIG1hdGVyaWFsIGFzIGEgbm9kZS1iYXNlZCBjdXN0b20gc2hhZGVyIG1hdGVyaWFsLlxuICAgKiBAcGFyYW0ganNvbiAtIFRoZSBzaGFkZXIgbm9kZSBKU09OIGRhdGFcbiAgICovXG4gIHNldCBzaGFkZXJOb2RlSnNvbihqc29uOiB1bmtub3duIHwgdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5fX3NoYWRlck5vZGVKc29uID0ganNvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB1bmlmb3JtIHZhbHVlcyBmb3Igbm9kZS1iYXNlZCBtYXRlcmlhbHMuXG4gICAqIEByZXR1cm5zIFRoZSB1bmlmb3JtIHZhbHVlcyBvYmplY3QsIG9yIHVuZGVmaW5lZCBpZiBub3Qgc2V0XG4gICAqL1xuICBnZXQgc2hhZGVyTm9kZVVuaWZvcm1zKCk6IHsgW25hbWU6IHN0cmluZ106IG51bWJlciB8IG51bWJlcltdIH0gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9fc2hhZGVyTm9kZVVuaWZvcm1zO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHVuaWZvcm0gdmFsdWVzIGZvciBub2RlLWJhc2VkIG1hdGVyaWFscy5cbiAgICogQHBhcmFtIHVuaWZvcm1zIC0gVGhlIHVuaWZvcm0gdmFsdWVzIG9iamVjdFxuICAgKi9cbiAgc2V0IHNoYWRlck5vZGVVbmlmb3Jtcyh1bmlmb3JtczogeyBbbmFtZTogc3RyaW5nXTogbnVtYmVyIHwgbnVtYmVyW10gfSB8IHVuZGVmaW5lZCkge1xuICAgIHRoaXMuX19zaGFkZXJOb2RlVW5pZm9ybXMgPSB1bmlmb3JtcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhpcyBtYXRlcmlhbCBpcyBhIG5vZGUtYmFzZWQgY3VzdG9tIHNoYWRlciBtYXRlcmlhbC5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGlzIGlzIGEgbm9kZS1iYXNlZCBtYXRlcmlhbCAoaGFzIHNoYWRlck5vZGVKc29uIHNldClcbiAgICovXG4gIGdldCBpc05vZGVCYXNlZE1hdGVyaWFsKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9fc2hhZGVyTm9kZUpzb24gIT0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBzaGFkZXIgbm9kZSBmaWxlIG5hbWUgZm9yIGV4cG9ydC5cbiAgICogVGhpcyBpcyB1c2VkIHRvIHNwZWNpZnkgdGhlIC5ybW4gZmlsZSBuYW1lIGluIHRoZSBSSE9ET05JVEVfbWF0ZXJpYWxzX25vZGUgZXh0ZW5zaW9uLlxuICAgKiBAcmV0dXJucyBUaGUgc2hhZGVyIG5vZGUgZmlsZSBuYW1lLCBvciB1bmRlZmluZWQgaWYgbm90IHNldFxuICAgKi9cbiAgZ2V0IHNoYWRlck5vZGVGaWxlTmFtZSgpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9fc2hhZGVyTm9kZUZpbGVOYW1lO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHNoYWRlciBub2RlIGZpbGUgbmFtZSBmb3IgZXhwb3J0LlxuICAgKiBAcGFyYW0gZmlsZU5hbWUgLSBUaGUgLnJtbiBmaWxlIG5hbWUgdG8gdXNlIGluIHRoZSBSSE9ET05JVEVfbWF0ZXJpYWxzX25vZGUgZXh0ZW5zaW9uXG4gICAqL1xuICBzZXQgc2hhZGVyTm9kZUZpbGVOYW1lKGZpbGVOYW1lOiBzdHJpbmcgfCB1bmRlZmluZWQpIHtcbiAgICB0aGlzLl9fc2hhZGVyTm9kZUZpbGVOYW1lID0gZmlsZU5hbWU7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFVQSxTQUFTLGlCQUFpQjtBQUMxQixTQUFTLGdCQUFnQjtBQUN6QixTQUFtQyx3QkFBd0I7QUFDM0QsU0FBUyxpQkFBcUM7QUFDOUMsU0FBUyxhQUE2QjtBQUN0QyxTQUFTLHVCQUF1QjtBQU1oQyxTQUFTLGtCQUFrQjtBQUUzQixTQUFTLDBCQUEwQjtBQUNuQyxTQUFTLHNCQUFzQjtBQUMvQixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLHVCQUF1QjtBQUVoQyxTQUFTLHFCQUFxQjtBQUM5QixTQUFTLFVBQVU7QUFDbkIsU0FBUyxjQUFjO0FBR3ZCLFNBQVMsZUFBZTtBQUd4QjtBQUFBLEVBQ0U7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLE9BQ0s7QUFpREEsSUFBTSxXQUFOLGNBQXVCLFNBQVM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUE4RHJDLFlBQ0UsUUFDQSxhQUNBLGFBQ0EsYUFDQSxrQkFDQSxjQUNBO0FBQ0EsVUFBTTtBQWpFUiw4QkFBK0Qsb0JBQUksSUFBSTtBQUN2RSxtQ0FBb0Usb0JBQUksSUFBSTtBQUM1RSwwQ0FBMkUsb0JBQUksSUFBSTtBQUNuRiwwQ0FBMkUsb0JBQUksSUFBSTtBQUNuRiwwQkFBZ0Usb0JBQUksSUFBSTtBQUN4RSxTQUFRQSxLQUFtRCxvQkFBSSxJQUFJO0FBR25FO0FBQUEsU0FBUSx1QkFBdUUsb0JBQUksSUFBSTtBQUV2RjtBQUFBLFNBQVEseUNBQTRFLG9CQUFJLElBQUk7QUFDNUYsU0FB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QUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLElBQUkscUJBQXlDO0FBQzNDLFdBQU8sS0FBS0U7QUFBQSxFQUNkO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQUksbUJBQW1CLFVBQThCO0FBQ25ELFNBQUtBLEtBQXVCO0FBQUEsRUFDOUI7QUFDRjsiLAogICJuYW1lcyI6IFsiX19iZWxvbmdQcmltaXRpdmVzIiwgIl9fbWF0ZXJpYWxVaWQiLCAiX19tYXRlcmlhbFNpZCIsICJfX2FscGhhTW9kZSIsICJfX2FscGhhVG9Db3ZlcmFnZSIsICJfX2JsZW5kRXF1YXRpb25Nb2RlIiwgIl9fYmxlbmRFcXVhdGlvbk1vZGVBbHBoYSIsICJfX2JsZW5kRnVuY1NyY0ZhY3RvciIsICJfX2JsZW5kRnVuY0RzdEZhY3RvciIsICJfX2JsZW5kRnVuY0FscGhhU3JjRmFjdG9yIiwgIl9fYmxlbmRGdW5jQWxwaGFEc3RGYWN0b3IiLCAiX19zdGF0ZVZlcnNpb24iLCAiX19waXBlbGluZVN0YXRlVmVyc2lvbiIsICJfX3RleHR1cmVTdGF0ZVZlcnNpb24iLCAiX19maW5nZXJQcmludCIsICJfX3NoYWRlckRlZmluZXMiLCAiX190ZXh0dXJlQmluZGluZ1NpZ25hdHVyZSIsICJfX3RleHR1cmVCaW5kaW5nU2lnbmF0dXJlVmVyc2lvbiIsICJfX211bHRpRHJhd1N0YXRlS2V5IiwgIl9fbXVsdGlEcmF3U3RhdGVLZXlWZXJzaW9uIiwgIl9fZW5naW5lIiwgIl9fbWF0ZXJpYWxUaWQiLCAiX19tYXRlcmlhbFR5cGVOYW1lIiwgIl9faW5jcmVtZW50UGlwZWxpbmVTdGF0ZVZlcnNpb24iLCAiX19zZXRBdXRvUGFyYW1ldGVyc1RvR3B1V2ViR0wiLCAiX19zZXRTb2xvRGF0dW1QYXJhbWV0ZXJzVG9HcHVXZWJHTCIsICJfX3RyZWF0Rm9yTWluTWF4IiwgIl9fc2hhZGVyTm9kZUpzb24iLCAiX19zaGFkZXJOb2RlVW5pZm9ybXMiLCAiX19zaGFkZXJOb2RlRmlsZU5hbWUiXQp9Cg==
