import { RnObject } from '../../core/RnObject';
import { AlphaMode, AlphaModeEnum } from '../../definitions/AlphaMode';
import { AbstractMaterialContent } from './AbstractMaterialContent';
import {
  ShaderSemanticsEnum,
  ShaderSemantics,
  ShaderSemanticsIndex,
  getShaderPropertyFunc,
  _getPropertyIndex2,
  ShaderSemanticsName,
} from '../../definitions/ShaderSemantics';
import { CompositionType } from '../../definitions/CompositionType';
import { MathClassUtil } from '../../math/MathClassUtil';
import { CGAPIResourceRepository } from '../../renderer/CGAPIResourceRepository';
import type { AbstractTexture } from '../../textures/AbstractTexture';
import { ShaderType } from '../../definitions/ShaderType';
import {
  Index,
  CGAPIResourceHandle,
  PrimitiveUID,
  MaterialSID,
  MaterialTID,
  MaterialUID,
} from '../../../types/CommonTypes';
import { GlobalDataRepository } from '../../core/GlobalDataRepository';
import type { ShaderSources } from '../../../webgl/WebGLStrategy';
import type { Primitive } from '../../geometry/Primitive';
import type { RenderingArgWebGL, RenderingArgWebGpu } from '../../../webgl/types/CommonTypes';
import { ShaderSemanticsInfo, TextureParameter } from '../../definitions';
import { MaterialTypeName, ShaderVariable } from './MaterialTypes';
import { Sampler } from '../../textures/Sampler';
import { Blend, BlendEnum } from '../../definitions/Blend';
import {
  _createProgramAsSingleOperationWebGL,
  _createProgramAsSingleOperationByUpdatedSources,
  _getAttributeInfo,
  _outputVertexAttributeBindingInfo,
  _setupGlobalShaderDefinitionWebGL,
  _createProgramAsSingleOperationWebGpu,
} from './ShaderHandler';
import { Texture } from '../../textures';
import type { WebGLResourceRepository } from '../../../webgl/WebGLResourceRepository';
import { Logger } from '../../misc/Logger';
import { AnimatedScalar } from '../../math/AnimatedScalar';
import { AnimatedVector4 } from '../../math/AnimatedVector4';
import { AnimatedVector3 } from '../../math/AnimatedVector3';
import { AnimatedQuaternion } from '../../math/AnimatedQuaternion';
import { AnimatedVectorN } from '../../math/AnimatedVectorN';
import { IAnimatedValue } from '../../math/IAnimatedValue';
import { AnimatedVector2 } from '../../math/AnimatedVector2';
import { Is } from '../../misc/Is';

type PrimitiveFingerPrint = string;

/**
 * The Material class represents a material definition for 3D rendering in the Rhodonite engine.
 *
 * A material defines how a 3D object's surface appears when rendered, including:
 * - Shader programs and their parameters
 * - Texture bindings and sampling configurations
 * - Blending and transparency settings
 * - Rendering state configuration (culling, depth testing, etc.)
 *
 * ## Key Features:
 * - **Shader Management**: Automatically compiles and caches shader programs per primitive
 * - **Parameter Binding**: Supports both static and animated shader parameters
 * - **Texture Handling**: Manages texture bindings with customizable samplers
 * - **Blending Control**: Fine-grained control over alpha blending operations
 * - **Multi-API Support**: Compatible with both WebGL and WebGPU rendering backends
 * - **Performance Optimization**: Fingerprint-based caching and state versioning
 *
 * ## Material Types:
 * Materials are categorized by type (e.g., PBR, Phong, Custom) and can support:
 * - Skinning animations for skeletal meshes
 * - Morphing animations for vertex-based deformations
 * - Lighting calculations with various models
 *
 * ## Usage Examples:
 * ```typescript
 * // Set a basic parameter
 * material.setParameter('baseColorFactor', [1.0, 0.5, 0.0, 1.0]);
 *
 * // Assign a texture with custom sampler
 * const sampler = new Sampler({ magFilter: TextureParameter.Linear });
 * material.setTextureParameter('baseColorTexture', texture, sampler);
 *
 * // Configure blending for transparency
 * material.alphaMode = AlphaMode.Blend;
 * material.setBlendFuncFactor(Blend.SrcAlpha, Blend.OneMinusSrcAlpha);
 * ```
 *
 * ## State Management:
 * The material maintains internal state versioning for efficient change detection
 * and shader program invalidation when parameters change.
 *
 * @see {@link AbstractMaterialContent} for material-specific implementations
 * @see {@link AlphaMode} for transparency configuration options
 * @see {@link Primitive} for geometry that uses materials
 */
export class Material extends RnObject {
  // Internal Resources
  __materialTypeName: MaterialTypeName;
  _materialContent: AbstractMaterialContent;
  _allFieldVariables: Map<ShaderSemanticsName, ShaderVariable> = new Map();
  _autoFieldVariablesOnly: Map<ShaderSemanticsName, ShaderVariable> = new Map();
  _autoTextureFieldVariablesOnly: Map<ShaderSemanticsName, ShaderVariable> = new Map();
  _autoUniformFieldVariablesOnly: Map<ShaderSemanticsName, ShaderVariable> = new Map();
  _allFieldsInfo: Map<ShaderSemanticsName, ShaderSemanticsInfo> = new Map();
  private __belongPrimitives: Map<PrimitiveUID, Primitive> = new Map();

  // Ids
  private _shaderProgramUidMap: Map<PrimitiveFingerPrint, CGAPIResourceHandle> = new Map();
  __materialUid: MaterialUID = -1;
  private __materialTid: MaterialTID;
  __materialSid: MaterialSID = -1; // material serial Id in the material type

  // Common Rendering States
  private __alphaMode = AlphaMode.Opaque;
  public zWriteWhenBlend = false;
  public colorWriteMask = [true, true, true, true];
  public isTranslucent = false;
  public cullFace = true; // If true, enable gl.CULL_FACE
  public cullFrontFaceCCW = true;
  public cullFaceBack = true; // if true, cull back face. if false, cull front face
  private __alphaToCoverage = false;
  private __blendEquationMode = Blend.EquationFuncAdd; // gl.FUNC_ADD
  private __blendEquationModeAlpha = Blend.EquationFuncAdd; // gl.FUNC_ADD
  private __blendFuncSrcFactor = Blend.One; // Not SrcAlpha. Because In Rhodonite, premultiplied alpha is used
  private __blendFuncDstFactor = Blend.OneMinusSrcAlpha; // gl.ONE_MINUS_SRC_ALPHA
  private __blendFuncAlphaSrcFactor = Blend.One; // gl.ONE
  private __blendFuncAlphaDstFactor = Blend.OneMinusSrcAlpha; // gl.ONE_MINUS_SRC_ALPHA

  private __stateVersion = 0;
  private static __stateVersion = 0;
  private __fingerPrint = '';

  private __shaderDefines: Set<string> = new Set();

  private static __webglResourceRepository?: WebGLResourceRepository;

  private static __defaultSampler = new Sampler({
    magFilter: TextureParameter.Linear,
    minFilter: TextureParameter.Linear,
    wrapS: TextureParameter.Repeat,
    wrapT: TextureParameter.Repeat,
  });

  // static fields
  static _soloDatumFields: Map<MaterialTypeName, Map<ShaderSemanticsName, ShaderVariable>> =
    new Map();

  /**
   * Creates a new Material instance.
   * @param materialTid - The material type ID
   * @param materialUid - The unique material ID
   * @param materialSid - The material serial ID within the material type
   * @param materialTypeName - The name of the material type
   * @param materialNode - The abstract material content associated with this material
   */
  constructor(
    materialTid: Index,
    materialUid: MaterialUID,
    materialSid: MaterialSID,
    materialTypeName: string,
    materialNode: AbstractMaterialContent
  ) {
    super();
    this._materialContent = materialNode;
    this.__materialTid = materialTid;
    this.__materialUid = materialUid;
    this.__materialSid = materialSid;
    this.__materialTypeName = materialTypeName;
  }

  /**
   * Adds a shader define directive that will be included in shader compilation.
   * This will invalidate existing shaders and require recompilation.
   * @param define - The define directive to add (e.g., "USE_NORMAL_MAPPING")
   */
  addShaderDefine(define: string) {
    this.__shaderDefines.add(define);
    this.makeShadersInvalidate();
  }

  /**
   * Removes a shader define directive from the material.
   * This will invalidate existing shaders and require recompilation.
   * @param define - The define directive to remove
   */
  removeShaderDefine(define: string) {
    this.__shaderDefines.delete(define);
    this.makeShadersInvalidate();
  }

  /**
   * Gets all shader define directives currently set on this material.
   * @returns A Set containing all shader defines
   */
  getShaderDefines() {
    return this.__shaderDefines;
  }

  /**
   * Checks if a specific shader define directive is set on this material.
   * @param define - The define directive to check for
   * @returns True if the define is set, false otherwise
   */
  isShaderDefine(define: string): boolean {
    return this.__shaderDefines.has(define);
  }

  /**
   * Calculates and updates the material's fingerprint based on current state.
   * The fingerprint is used for shader program caching and state comparison.
   * @internal
   */
  calcFingerPrint() {
    let str = '';
    str += this.alphaMode.index;
    str += this.blendFuncSrcFactor.webgpu;
    str += this.blendFuncDstFactor.webgpu;
    str += this.blendFuncAlphaSrcFactor.webgpu;
    str += this.blendFuncAlphaDstFactor.webgpu;
    str += this.blendEquationMode.webgpu;
    str += this.blendEquationModeAlpha.webgpu;
    str += this.cullFace ? '1' : '0';
    str += this.cullFrontFaceCCW ? '1' : '0';
    str += this.cullFaceBack ? '1' : '0';

    // for (const [key, value] of this._autoFieldVariablesOnly) {
    //   if (CompositionType.isTexture(value.info.compositionType)) {
    //     str += value.info.semantic.str;
    //     str += value.value[0];
    //     str += value.value[1];
    //     str += value.value[2];
    //   }
    // }

    this.__fingerPrint = str;
  }

  /**
   * Gets the current fingerprint of the material.
   * @returns The material's fingerprint string
   * @internal
   */
  _getFingerPrint() {
    return this.__fingerPrint;
  }

  /**
   * Gets the global state version for all materials.
   * This is incremented whenever any material's state changes.
   * @returns The global state version number
   */
  static get stateVersion() {
    return Material.__stateVersion;
  }

  ///
  /// Parameter Setters
  ///

  /**
   * Checks if a value is an animated value (implements IAnimatedValue).
   * @param value - The value to check
   * @returns True if the value is an animated value, false otherwise
   */
  public _isAnimatedValue(value: any): value is IAnimatedValue {
    return value instanceof AnimatedScalar || value instanceof AnimatedVector2 || value instanceof AnimatedVector3 || value instanceof AnimatedVector4 || value instanceof AnimatedQuaternion || value instanceof AnimatedVectorN;
  }

  /**
   * Sets a parameter value for the specified shader semantic.
   * The parameter can be a static value or an animated value.
   * @param shaderSemanticName - The shader semantic name to set the parameter for
   * @param value - The value to set (can be static or animated)
   */
  public setParameter(shaderSemanticName: ShaderSemanticsName, value: any) {
    const info = this._allFieldsInfo.get(shaderSemanticName);
    if (info != null) {
      let valueObj: ShaderVariable | undefined;
      if (info.soloDatum) {
        valueObj = Material._soloDatumFields.get(this.__materialTypeName)!.get(shaderSemanticName);
      } else {
        valueObj = this._allFieldVariables.get(shaderSemanticName);
      }
      if (this._isAnimatedValue(value)) {
        value.setFloat32Array(valueObj!.value._v);
        valueObj!.value = value;
        this.__stateVersion++;
        Material.__stateVersion++;
        this.calcFingerPrint();
      } else {
        const updated = MathClassUtil._setForce(valueObj!.value, value);
        if (updated) {
          this.__stateVersion++;
          Material.__stateVersion++;
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
  public setTextureParameter(
    shaderSemantic: ShaderSemanticsName,
    texture: AbstractTexture,
    sampler?: Sampler
  ): void {
    if (Is.not.exist(sampler)) {
      sampler = Material.__defaultSampler;
    }
    if (!sampler.created) {
      sampler.create();
    }

    if (this._allFieldsInfo.has(shaderSemantic)) {
      const array = this._allFieldVariables.get(shaderSemantic)!;
      const shaderVariable = {
        value: [array.value[0], texture, sampler],
        info: array.info,
      };
      this._allFieldVariables.set(shaderSemantic, shaderVariable);
      if (!array.info.isInternalSetting) {
        this._autoFieldVariablesOnly.set(shaderSemantic, shaderVariable);
        if (CompositionType.isTexture(array.info.compositionType)) {
          this._autoTextureFieldVariablesOnly.set(shaderSemantic, shaderVariable);
        }
      }
      if (shaderSemantic === 'diffuseColorTexture' || shaderSemantic === 'baseColorTexture') {
        if (texture.isTransparent) {
          this.alphaMode = AlphaMode.Blend;
        }
      }
      this.__stateVersion++;
      Material.__stateVersion++;
      this.calcFingerPrint();
    }
  }

  /**
   * Gets the texture parameter for the specified shader semantic.
   * @param shaderSemantic - The shader semantic name to get the texture for
   * @returns The texture parameter array or undefined if not found
   */
  public getTextureParameter(shaderSemantic: ShaderSemanticsName) {
    if (this._allFieldsInfo.has(shaderSemantic)) {
      const array = this._allFieldVariables.get(shaderSemantic)!;
      return array.value;
    }
    return undefined;
  }

  /**
   * Sets a texture parameter from a Promise that resolves to a texture.
   * This is useful for asynchronous texture loading.
   * @param shaderSemantic - The shader semantic name for the texture
   * @param promise - A Promise that resolves to the texture
   */
  public setTextureParameterAsPromise(
    shaderSemantic: ShaderSemanticsName,
    promise: Promise<AbstractTexture>
  ): void {
    promise.then((texture) => {
      if (this._allFieldsInfo.has(shaderSemantic)) {
        const array = this._allFieldVariables.get(shaderSemantic)!;
        const shaderVariable = {
          value: [array.value[0], texture],
          info: array.info,
        };
        this._allFieldVariables.set(shaderSemantic, shaderVariable);
        if (!array.info.isInternalSetting) {
          this._autoFieldVariablesOnly.set(shaderSemantic, shaderVariable);
          if (CompositionType.isTexture(array.info.compositionType)) {
            this._autoTextureFieldVariablesOnly.set(shaderSemantic, shaderVariable);
          }
        }
        if (shaderSemantic === 'diffuseColorTexture' || shaderSemantic === 'baseColorTexture') {
          if (texture.isTransparent) {
            this.alphaMode = AlphaMode.Blend;
          }
        }
      }
      this.__stateVersion++;
      Material.__stateVersion++;
      this.calcFingerPrint();
    });
  }

  /**
   * Gets the parameter value for the specified shader semantic.
   * @param shaderSemantic - The shader semantic name to get the parameter for
   * @returns The parameter value or undefined if not found
   */
  public getParameter(shaderSemantic: ShaderSemanticsName): any {
    const info = this._allFieldsInfo.get(shaderSemantic);
    if (info != null) {
      if (info.soloDatum) {
        return Material._soloDatumFields.get(this.__materialTypeName)!.get(shaderSemantic)?.value;
      } else {
        return this._allFieldVariables.get(shaderSemantic)?.value;
      }
    }

    return void 0;
  }

  /**
   * Checks if the shader program is ready for the given primitive.
   * @param primitive - The primitive to check shader readiness for
   * @returns True if the shader program is ready, false otherwise
   */
  public isShaderProgramReady(primitive: Primitive): boolean {
    return this._shaderProgramUidMap.has(primitive._getFingerPrint());
  }

  /**
   * Sets up uniform locations for material nodes in the shader program.
   * @internal Called from WebGLStrategyDataTexture and WebGLStrategyUniform only
   * @param isUniformOnlyMode - Whether to operate in uniform-only mode
   * @param primitive - The primitive to set up uniforms for
   */
  _setUniformLocationsOfMaterialNodes(isUniformOnlyMode: boolean, primitive: Primitive) {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();

    let array: ShaderSemanticsInfo[] = [];
    if (this._materialContent != null) {
      const semanticsInfoArray = this._materialContent._semanticsInfoArray;
      array = array.concat(semanticsInfoArray);
    }

    const shaderProgramUid = this._shaderProgramUidMap.get(primitive._getFingerPrint());
    webglResourceRepository.setupUniformLocations(shaderProgramUid!, array, isUniformOnlyMode);
  }

  /**
   * Gets the shader program UID for the given primitive.
   * @param primitive - The primitive to get the shader program UID for
   * @returns The shader program UID or -1 if not found
   */
  getShaderProgramUid(primitive: Primitive): CGAPIResourceHandle {
    const primitiveFingerPrint = primitive._getFingerPrint();
    return this._shaderProgramUidMap.get(primitiveFingerPrint) ?? -1;
  }

  /**
   * Adds a primitive to the list of primitives that belong to this material.
   * @internal Called from Primitive class only
   * @param primitive - The primitive to add
   */
  _addBelongPrimitive(primitive: Primitive) {
    this.__belongPrimitives.set(primitive.primitiveUid, primitive);
  }

  /**
   * Gets all primitives that belong to this material.
   * @returns A Map of primitive UIDs to Primitive objects
   */
  getBelongPrimitives() {
    return this.__belongPrimitives;
  }

  /**
   * Creates a WebGL shader program for this material and the given primitive.
   * @internal Called from WebGLStrategyDataTexture and WebGLStrategyUniform
   * @param vertexShaderMethodDefinitions_uniform - Vertex shader method definitions for uniforms
   * @param propertySetter - Function to set shader properties
   * @param primitive - The primitive to create the program for
   * @param isWebGL2 - Whether to create a WebGL2 program
   * @returns A tuple containing the program UID and whether it's a new program
   */
  _createProgramWebGL(
    vertexShaderMethodDefinitions_uniform: string,
    propertySetter: getShaderPropertyFunc,
    primitive: Primitive,
    isWebGL2: boolean
  ): [CGAPIResourceHandle, boolean] {
    const [programUid, newOne] = _createProgramAsSingleOperationWebGL(
      this,
      propertySetter,
      primitive,
      vertexShaderMethodDefinitions_uniform,
      isWebGL2
    );
    this._shaderProgramUidMap.set(primitive._getFingerPrint(), programUid);

    Material.__stateVersion++;

    return [programUid, newOne];
  }

  /**
   * Creates a WebGPU shader program for this material and the given primitive.
   * @param primitive - The primitive to create the program for
   * @param vertexShaderMethodDefinitions - Vertex shader method definitions
   * @param propertySetter - Function to set shader properties
   */
  _createProgramWebGpu(
    primitive: Primitive,
    vertexShaderMethodDefinitions: string,
    propertySetter: getShaderPropertyFunc
  ) {
    const programUid = _createProgramAsSingleOperationWebGpu(
      this,
      primitive,
      vertexShaderMethodDefinitions,
      propertySetter
    );

    this._shaderProgramUidMap.set(primitive._getFingerPrint(), programUid);
    Material.__stateVersion++;
  }

  /**
   * Creates a shader program using updated shader source code.
   * @internal Called from WebGLStrategyDataTexture and WebGLStrategyUniform
   * @param updatedShaderSources - The updated shader source code
   * @param primitive - The primitive to create the program for
   * @param onError - Optional error callback function
   * @returns A tuple containing the program UID and whether it's a new program
   */
  _createProgramByUpdatedSources(
    updatedShaderSources: ShaderSources,
    primitive: Primitive,
    onError?: (message: string) => void
  ): [CGAPIResourceHandle, boolean] {
    const [programUid, newOne] = _createProgramAsSingleOperationByUpdatedSources(
      this,
      primitive,
      this._materialContent,
      updatedShaderSources,
      onError
    );
    this._shaderProgramUidMap.set(primitive._getFingerPrint(), programUid);

    if (programUid > 0) {
      // this.__updatedShaderSources = updatedShaderSources;
    }

    Material.__stateVersion++;
    return [programUid, newOne];
  }

  /**
   * Sets up basic uniform locations in the shader program.
   * @internal Called by WebGLStrategyDataTexture and WebGLStrategyUniform only
   * @param primitive - The primitive to set up uniforms for
   */
  _setupBasicUniformsLocations(primitive: Primitive) {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();

    const primitiveFingerPrint = primitive._getFingerPrint();
    const shaderProgramUid = this._shaderProgramUidMap.get(primitiveFingerPrint);
    webglResourceRepository.setupBasicUniformLocations(shaderProgramUid!);
  }

  /**
   * Sets up additional uniform locations in the shader program.
   * @internal Called by WebGLStrategyDataTexture and WebGLStrategyUniform only
   * @param shaderSemantics - Array of shader semantics to set up
   * @param isUniformOnlyMode - Whether to operate in uniform-only mode
   * @param primitive - The primitive to set up uniforms for
   */
  _setupAdditionalUniformLocations(
    shaderSemantics: ShaderSemanticsInfo[],
    isUniformOnlyMode: boolean,
    primitive: Primitive
  ) {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const primitiveFingerPrint = primitive._getFingerPrint();
    const shaderProgramUid = this._shaderProgramUidMap.get(primitiveFingerPrint);
    webglResourceRepository.setupUniformLocations(
      shaderProgramUid!,
      shaderSemantics,
      isUniformOnlyMode
    );
  }

  /**
   * Sets internal setting parameters to GPU for WebGPU rendering.
   * @param params - Object containing material and rendering arguments
   */
  _setInternalSettingParametersToGpuWebGpu({
    material,
    args,
  }: {
    material: Material;
    args: RenderingArgWebGpu;
  }) {
    this._materialContent._setInternalSettingParametersToGpuWebGpu({
      material,
      args,
    });
  }

  /**
   * Sets parameters to GPU for WebGL rendering per material.
   * @internal Called from WebGLStrategyDataTexture and WebGLStrategyUniform only
   * @param params - Object containing rendering parameters
   */
  _setParametersToGpuWebGL({
    material,
    shaderProgram,
    firstTime,
    args,
  }: {
    material: Material;
    shaderProgram: WebGLProgram;
    firstTime: boolean;
    args: RenderingArgWebGL;
  }) {
    // For Auto Parameters
    this.__setAutoParametersToGpuWebGL(args.setUniform, firstTime, shaderProgram);

    // For Custom Setting Parameters
    this._materialContent._setInternalSettingParametersToGpuWebGLPerMaterial({
      material,
      shaderProgram,
      firstTime,
      args,
    });

    // For SoloDatum Parameters
    this.__setSoloDatumParametersToGpuWebGL({
      shaderProgram,
      firstTime,
      isUniformMode: args.setUniform,
    });
  }

  /**
   * Sets parameters to GPU for WebGL rendering per shader program.
   * @param params - Object containing rendering parameters
   */
  _setParametersToGpuWebGLPerShaderProgram({
    material,
    shaderProgram,
    firstTime,
    args,
  }: {
    material: Material;
    shaderProgram: WebGLProgram;
    firstTime: boolean;
    args: RenderingArgWebGL;
  }) {
    // For Custom Setting Parameters
    this._materialContent._setInternalSettingParametersToGpuWebGLPerShaderProgram({
      material,
      shaderProgram,
      firstTime,
      args,
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
    args,
  }: {
    material: Material;
    shaderProgram: WebGLProgram;
    firstTime: boolean;
    args: RenderingArgWebGL;
  }) {
    // For Custom Setting Parameters
    this._materialContent._setInternalSettingParametersToGpuWebGLPerPrimitive({
      material,
      shaderProgram,
      firstTime,
      args,
    });
  }

  /**
   * Sets parameters to GPU for WebGL rendering without internal settings.
   * @param params - Object containing rendering parameters
   */
  _setParametersToGpuWebGLWithOutInternalSetting({
    shaderProgram,
    firstTime,
    isUniformMode,
  }: {
    shaderProgram: WebGLProgram;
    firstTime: boolean;
    isUniformMode: boolean;
  }) {
    // For Auto Parameters
    this.__setAutoParametersToGpuWebGL(isUniformMode, firstTime, shaderProgram);

    // For SoloDatum Parameters
    this.__setSoloDatumParametersToGpuWebGL({
      shaderProgram,
      firstTime,
      isUniformMode,
    });
  }

  /**
   * Gets shader property strings for vertex and pixel shaders.
   * @internal
   * @param propertySetter - Function to set shader properties
   * @param isWebGL2 - Whether to generate WebGL2-compatible properties
   * @returns Object containing vertex and pixel property strings
   */
  _getProperties(propertySetter: getShaderPropertyFunc, isWebGL2: boolean) {
    let vertexPropertiesStr = '';
    let pixelPropertiesStr = '';
    this._allFieldsInfo.forEach((info) => {
      if (
        info!.stage === ShaderType.VertexShader ||
        info!.stage === ShaderType.VertexAndPixelShader
      ) {
        vertexPropertiesStr += propertySetter(this.__materialTypeName, info!, false, isWebGL2);
      }
      if (
        info!.stage === ShaderType.PixelShader ||
        info!.stage === ShaderType.VertexAndPixelShader
      ) {
        pixelPropertiesStr += propertySetter(this.__materialTypeName, info!, false, isWebGL2);
      }
    });
    const globalDataRepository = GlobalDataRepository.getInstance();
    [vertexPropertiesStr, pixelPropertiesStr] = globalDataRepository._addPropertiesStr(
      vertexPropertiesStr,
      pixelPropertiesStr,
      propertySetter,
      isWebGL2
    );
    return { vertexPropertiesStr, pixelPropertiesStr };
  }

  /**
   * Sets automatic parameters to GPU for WebGL rendering.
   * @private
   * @param isUniformMode - Whether to operate in uniform mode
   * @param firstTime - Whether this is the first time setting parameters
   * @param shaderProgram - The WebGL shader program
   */
  private __setAutoParametersToGpuWebGL(
    isUniformMode: boolean,
    firstTime: boolean,
    shaderProgram: WebGLProgram
  ) {
    if (Material.__webglResourceRepository == null) {
      Material.__webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    }
    const webglResourceRepository = Material.__webglResourceRepository!;
    if (isUniformMode) {
      this._autoFieldVariablesOnly.forEach((value) => {
        const info = value.info;
        webglResourceRepository.setUniformValue(
          shaderProgram,
          info.semantic,
          firstTime,
          value.value
        );
      });
    } else {
      for (const [key, value] of this._autoTextureFieldVariablesOnly) {
      const info = value.info;
        if (firstTime) {
          webglResourceRepository.setUniform1iForTexture(
            shaderProgram,
            info.semantic,
            value.value
          );
        } else {
          webglResourceRepository.bindTexture(info, value.value);
        }
      }
      for (const [key, value] of this._autoUniformFieldVariablesOnly) {
        const info = value.info;
        if (info.needUniformInDataTextureMode) {
          webglResourceRepository.setUniformValue(
            shaderProgram,
            info.semantic,
            firstTime,
            value.value
          );
        }
      }
    }
  }

  /**
   * Sets solo datum parameters to GPU for WebGL rendering.
   * @private
   * @param params - Object containing rendering parameters
   */
  private __setSoloDatumParametersToGpuWebGL({
    shaderProgram,
    firstTime,
    isUniformMode,
  }: {
    shaderProgram: WebGLProgram;
    firstTime: boolean;
    isUniformMode: boolean;
  }) {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const materialTypeName = this.__materialTypeName;
    const map = Material._soloDatumFields.get(materialTypeName);
    if (map == null) return;
    const values = map.values();
    for (const value of values) {
      const info = value.info;
      if (isUniformMode || CompositionType.isTexture(info.compositionType)) {
        if (!info.isInternalSetting) {
          if (firstTime) {
            webglResourceRepository.setUniformValue(
              shaderProgram,
              info.semantic,
              firstTime,
              value.value
            );
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
  public setBlendEquationMode(blendEquationMode: BlendEnum, blendEquationModeAlpha?: BlendEnum) {
    this.__blendEquationMode = blendEquationMode;
    this.__blendEquationModeAlpha = blendEquationModeAlpha ?? blendEquationMode;

    this.__treatForMinMax();

    this.__stateVersion++;
    Material.__stateVersion++;
    this.calcFingerPrint();
  }

  /**
   * Handles special cases for Min/Max blend equations due to WebGPU limitations.
   * @private
   */
  private __treatForMinMax() {
    // due to the limitation of WebGPU, See the last part of https://www.w3.org/TR/webgpu/#fragment-state
    if (this.__blendEquationMode === Blend.Min || this.__blendEquationMode === Blend.Max) {
      this.__blendFuncDstFactor = Blend.One;
      this.__blendFuncSrcFactor = Blend.One;
    }
    if (
      this.__blendEquationModeAlpha === Blend.Min ||
      this.__blendEquationModeAlpha === Blend.Max
    ) {
      this.__blendFuncAlphaDstFactor = Blend.One;
      this.__blendFuncAlphaSrcFactor = Blend.One;
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
  public setBlendFuncSeparateFactor(
    blendFuncSrcFactor: BlendEnum,
    blendFuncDstFactor: BlendEnum,
    blendFuncAlphaSrcFactor: BlendEnum,
    blendFuncAlphaDstFactor: BlendEnum
  ) {
    this.__blendFuncSrcFactor = blendFuncSrcFactor;
    this.__blendFuncDstFactor = blendFuncDstFactor;
    this.__blendFuncAlphaSrcFactor = blendFuncAlphaSrcFactor;
    this.__blendFuncAlphaDstFactor = blendFuncAlphaDstFactor;

    this.__treatForMinMax();

    this.__stateVersion++;
    Material.__stateVersion++;
    this.calcFingerPrint();
  }

  /**
   * Sets blend function factors for both RGB and alpha channels.
   * This method only works if the alpha mode is set to blend.
   * @param blendFuncSrcFactor - Source blend factor
   * @param blendFuncDstFactor - Destination blend factor
   */
  public setBlendFuncFactor(blendFuncSrcFactor: BlendEnum, blendFuncDstFactor: BlendEnum) {
    this.__blendFuncSrcFactor = blendFuncSrcFactor;
    this.__blendFuncDstFactor = blendFuncDstFactor;
    this.__blendFuncAlphaSrcFactor = blendFuncSrcFactor;
    this.__blendFuncAlphaDstFactor = blendFuncDstFactor;

    this.__treatForMinMax();

    this.__stateVersion++;
    Material.__stateVersion++;
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
    } else {
      return false;
    }
  }

  /**
   * Checks if the material is translucent but not in blend mode.
   * @returns True if alpha mode is Opaque or Mask and the material is translucent
   */
  isTranslucentOpaque() {
    if (this.alphaMode !== AlphaMode.Blend && this.isTranslucent) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Checks if the material is either in blend mode or translucent.
   * @returns True if in blend mode or translucent, false otherwise
   */
  isBlendOrTranslucent() {
    if (this.alphaMode === AlphaMode.Blend || this.isTranslucent) {
      return true;
    } else {
      return false;
    }
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
  set alphaToCoverage(alphaToCoverage: boolean) {
    if (alphaToCoverage && this.alphaMode === AlphaMode.Blend) {
      Logger.warn(
        'If you set alphaToCoverage = true on a material whose AlphaMode is Translucent, you may get drawing problems.'
      );
    }
    this.__alphaToCoverage = alphaToCoverage;
    this.makeShadersInvalidate();
    this.calcFingerPrint();
  }

  /**
   * Gets whether alpha-to-coverage is enabled for this material.
   * @returns True if alpha-to-coverage is enabled, false otherwise
   */
  get alphaToCoverage(): boolean {
    return this.__alphaToCoverage;
  }

  /**
   * Gets the material type ID.
   * @returns The material type ID
   */
  get materialTID(): MaterialTID {
    return this.__materialTid;
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
    return this.__blendEquationMode;
  }

  /**
   * Gets the blend equation mode for the alpha channel.
   * @returns The alpha blend equation mode
   */
  get blendEquationModeAlpha() {
    return this.__blendEquationModeAlpha;
  }

  /**
   * Gets the source blend factor for RGB channels.
   * @returns The source blend factor
   */
  get blendFuncSrcFactor() {
    return this.__blendFuncSrcFactor;
  }

  /**
   * Gets the destination blend factor for RGB channels.
   * @returns The destination blend factor
   */
  get blendFuncDstFactor() {
    return this.__blendFuncDstFactor;
  }

  /**
   * Gets the source blend factor for the alpha channel.
   * @returns The alpha source blend factor
   */
  get blendFuncAlphaSrcFactor() {
    return this.__blendFuncAlphaSrcFactor;
  }

  /**
   * Gets the destination blend factor for the alpha channel.
   * @returns The alpha destination blend factor
   */
  get blendFuncAlphaDstFactor() {
    return this.__blendFuncAlphaDstFactor;
  }

  /**
   * Gets the current alpha mode of the material.
   * @returns The alpha mode
   */
  get alphaMode() {
    return this.__alphaMode;
  }

  /**
   * Sets the alpha mode of the material.
   * This will invalidate shaders and recalculate the fingerprint.
   * @param mode - The alpha mode to set
   */
  set alphaMode(mode: AlphaModeEnum) {
    this.__alphaMode = mode;
    this.calcFingerPrint();
    this.makeShadersInvalidate();
  }

  /**
   * Gets the unique material ID.
   * @returns The material UID
   */
  get materialUID(): MaterialUID {
    return this.__materialUid;
  }

  /**
   * Gets the material serial ID within the material type.
   * @returns The material SID
   */
  get materialSID(): MaterialSID {
    return this.__materialSid;
  }

  /**
   * Checks if this material supports skinning.
   * @returns True if skinning is supported, false otherwise
   */
  get isSkinning(): boolean {
    return this._materialContent.isSkinning;
  }

  /**
   * Checks if this material supports morphing.
   * @returns True if morphing is supported, false otherwise
   */
  get isMorphing(): boolean {
    return this._materialContent.isMorphing;
  }

  /**
   * Checks if this material supports lighting.
   * @returns True if lighting is supported, false otherwise
   */
  get isLighting(): boolean {
    return this._materialContent.isLighting;
  }

  /**
   * Gets the material type name.
   * @returns The material type name
   */
  get materialTypeName(): string {
    return this.__materialTypeName;
  }

  /**
   * Gets the current state version of this material.
   * This is incremented whenever the material's state changes.
   * @returns The state version number
   */
  get stateVersion(): number {
    return this.__stateVersion;
  }

  /**
   * Invalidates all shader programs associated with this material.
   * This forces shader recompilation on the next render.
   */
  makeShadersInvalidate() {
    this._shaderProgramUidMap.clear();
    this.__stateVersion++;
    Material.__stateVersion++;
  }
}
