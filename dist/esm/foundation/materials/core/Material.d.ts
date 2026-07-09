import type { CGAPIResourceHandle, Index, MaterialSID, MaterialTID, MaterialUID } from '../../../types/CommonTypes';
import type { RenderingArgWebGL, RenderingArgWebGpu } from '../../../webgl/types/CommonTypes';
import type { ShaderSources } from '../../../webgl/WebGLStrategy';
import { RnObject } from '../../core/RnObject';
import { type ShaderSemanticsInfo } from '../../definitions';
import { type AlphaModeEnum } from '../../definitions/AlphaMode';
import { type BlendEnum } from '../../definitions/Blend';
import type { getShaderPropertyFuncOfGlobalDataRepository, getShaderPropertyFuncOfMaterial, ShaderSemanticsName } from '../../definitions/ShaderSemantics';
import type { Primitive } from '../../geometry/Primitive';
import type { IAnimatedValue } from '../../math/IAnimatedValue';
import type { Engine } from '../../system/Engine';
import type { AbstractTexture } from '../../textures/AbstractTexture';
import { Sampler } from '../../textures/Sampler';
import type { AbstractMaterialContent } from './AbstractMaterialContent';
import type { MaterialTypeName, ShaderVariable } from './MaterialTypes';
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
export declare class Material extends RnObject {
    private __engine;
    __materialTypeName: MaterialTypeName;
    _materialContent: AbstractMaterialContent;
    _allFieldVariables: Map<ShaderSemanticsName, ShaderVariable>;
    _autoFieldVariablesOnly: Map<ShaderSemanticsName, ShaderVariable>;
    _autoTextureFieldVariablesOnly: Map<ShaderSemanticsName, ShaderVariable>;
    _autoUniformFieldVariablesOnly: Map<ShaderSemanticsName, ShaderVariable>;
    _allFieldsInfo: Map<ShaderSemanticsName, ShaderSemanticsInfo>;
    private __belongPrimitives;
    private _shaderProgramUidMap;
    private _shaderProgramComponentStateVersionMap;
    __materialUid: MaterialUID;
    private __materialTid;
    __materialSid: MaterialSID;
    private __alphaMode;
    zWriteWhenBlend: boolean;
    colorWriteMask: boolean[];
    isTranslucent: boolean;
    cullFace: boolean;
    cullFrontFaceCCW: boolean;
    cullFaceBack: boolean;
    private __alphaToCoverage;
    private __blendEquationMode;
    private __blendEquationModeAlpha;
    private __blendFuncSrcFactor;
    private __blendFuncDstFactor;
    private __blendFuncAlphaSrcFactor;
    private __blendFuncAlphaDstFactor;
    private __stateVersion;
    private __fingerPrint;
    private __shaderDefines;
    private __shaderNodeJson?;
    private __shaderNodeUniforms?;
    private __shaderNodeFileName?;
    /**
     * Creates a new Material instance.
     * @param materialTid - The material type ID
     * @param materialUid - The unique material ID
     * @param materialSid - The material serial ID within the material type
     * @param materialTypeName - The name of the material type
     * @param materialNode - The abstract material content associated with this material
     */
    constructor(engine: Engine, materialTid: Index, materialUid: MaterialUID, materialSid: MaterialSID, materialTypeName: string, materialNode: AbstractMaterialContent);
    /**
     * Adds a shader define directive that will be included in shader compilation.
     * This will invalidate existing shaders and require recompilation.
     * @param define - The define directive to add (e.g., "USE_NORMAL_MAPPING")
     */
    addShaderDefine(define: string): void;
    /**
     * Removes a shader define directive from the material.
     * This will invalidate existing shaders and require recompilation.
     * @param define - The define directive to remove
     */
    removeShaderDefine(define: string): void;
    /**
     * Gets all shader define directives currently set on this material.
     * @returns A Set containing all shader defines
     */
    getShaderDefines(): Set<string>;
    /**
     * Checks if a specific shader define directive is set on this material.
     * @param define - The define directive to check for
     * @returns True if the define is set, false otherwise
     */
    isShaderDefine(define: string): boolean;
    /**
     * Calculates and updates the material's fingerprint based on current state.
     * The fingerprint is used for shader program caching and state comparison.
     * @internal
     */
    calcFingerPrint(): void;
    /**
     * Gets the current fingerprint of the material.
     * @returns The material's fingerprint string
     * @internal
     */
    _getFingerPrint(): string;
    /**
     * Checks if a value is an animated value (implements IAnimatedValue).
     * @param value - The value to check
     * @returns True if the value is an animated value, false otherwise
     */
    _isAnimatedValue(value: any): value is IAnimatedValue;
    /**
     * Sets a parameter value for the specified shader semantic.
     * The parameter can be a static value or an animated value.
     * @param shaderSemanticName - The shader semantic name to set the parameter for
     * @param value - The value to set (can be static or animated)
     */
    setParameter(shaderSemanticName: ShaderSemanticsName, value: any): void;
    /**
     * Sets a texture parameter for the specified shader semantic.
     * If the texture has transparency, the material's alpha mode may be automatically set to Blend.
     * @param shaderSemantic - The shader semantic name for the texture
     * @param texture - The texture to assign
     * @param sampler - Optional sampler to use with the texture. If not provided, uses default sampler
     */
    setTextureParameter(shaderSemantic: ShaderSemanticsName, texture: AbstractTexture, sampler?: Sampler): void;
    /**
     * Gets the texture parameter for the specified shader semantic.
     * @param shaderSemantic - The shader semantic name to get the texture for
     * @returns The texture parameter array or undefined if not found
     */
    getTextureParameter(shaderSemantic: ShaderSemanticsName): any;
    /**
     * Sets a texture parameter from a Promise that resolves to a texture.
     * This is useful for asynchronous texture loading.
     * @param shaderSemantic - The shader semantic name for the texture
     * @param promise - A Promise that resolves to the texture
     */
    setTextureParameterAsPromise(shaderSemantic: ShaderSemanticsName, promise: Promise<AbstractTexture>): void;
    /**
     * Gets the parameter value for the specified shader semantic.
     * @param shaderSemantic - The shader semantic name to get the parameter for
     * @returns The parameter value or undefined if not found
     */
    getParameter(shaderSemantic: ShaderSemanticsName): any;
    /**
     * Checks if the shader program is ready for the given primitive.
     * @param primitive - The primitive to check shader readiness for
     * @returns True if the shader program is ready, false otherwise
     */
    isShaderProgramReady(primitive: Primitive): boolean;
    /**
     * Sets up uniform locations for material nodes in the shader program.
     * @internal Called from WebGLStrategyDataTexture and WebGLStrategyUniform only
     * @param isUniformOnlyMode - Whether to operate in uniform-only mode
     * @param primitive - The primitive to set up uniforms for
     */
    _setUniformLocationsOfMaterialNodes(isUniformOnlyMode: boolean, primitive: Primitive): void;
    /**
     * Gets the shader program UID for the given primitive.
     * @param primitive - The primitive to get the shader program UID for
     * @returns The shader program UID or -1 if not found
     */
    getShaderProgramUid(primitive: Primitive): CGAPIResourceHandle;
    /**
     * Adds a primitive to the list of primitives that belong to this material.
     * @internal Called from Primitive class only
     * @param primitive - The primitive to add
     */
    _addBelongPrimitive(primitive: Primitive): void;
    /**
     * Gets all primitives that belong to this material.
     * @returns A Map of primitive UIDs to Primitive objects
     */
    getBelongPrimitives(): Map<number, Primitive>;
    /**
     * Creates a WebGL shader program for this material and the given primitive.
     * @internal Called from WebGLStrategyDataTexture and WebGLStrategyUniform
     * @param componentDataAccessMethodDefinitionsForVertexShader - method definitions for component data access for vertex shader
     * @param componentDataAccessMethodDefinitionsForPixelShader - method definitions for component data access for pixel shader
     * @param propertySetterOfGlobalDataRepository - Function to set shader properties of global data repository
     * @param propertySetterOfMaterial - Function to set shader properties of material
     * @param morphedPositionGetter - Function to get the morphed position
     * @param primitive - The primitive to create the program for
     * @returns A tuple containing the program UID and whether it's a new program
     */
    _createProgramWebGL(engine: Engine, componentDataAccessMethodDefinitionsForVertexShader: string, componentDataAccessMethodDefinitionsForPixelShader: string, propertySetterOfGlobalDataRepository: getShaderPropertyFuncOfGlobalDataRepository, propertySetterOfMaterial: getShaderPropertyFuncOfMaterial, morphedPositionGetter: string, primitive: Primitive): [CGAPIResourceHandle, boolean];
    /**
     * Creates a WebGPU shader program for this material and the given primitive.
     * @param primitive - The primitive to create the program for
     * @param componentDataAccessMethodDefinitionsForVertexShader - method definitions for component data access for vertex shader
     * @param componentDataAccessMethodDefinitionsForPixelShader - method definitions for component data access for pixel shader
     * @param propertySetterOfGlobalDataRepository - Function to set shader properties of global data repository
     * @param propertySetterOfMaterial - Function to set shader properties of material
     * @param morphedPositionGetter - Function to get the morphed position
     */
    _createProgramWebGpu(engine: Engine, primitive: Primitive, componentDataAccessMethodDefinitionsForVertexShader: string, componentDataAccessMethodDefinitionsForPixelShader: string, propertySetterOfGlobalDataRepository: getShaderPropertyFuncOfGlobalDataRepository, propertySetterOfMaterial: getShaderPropertyFuncOfMaterial, morphedPositionGetter: string): void;
    /**
     * Creates a shader program using updated shader source code.
     * @internal Called from WebGLStrategyDataTexture and WebGLStrategyUniform
     * @param updatedShaderSources - The updated shader source code
     * @param primitive - The primitive to create the program for
     * @param onError - Optional error callback function
     * @returns A tuple containing the program UID and whether it's a new program
     */
    _createProgramByUpdatedSources(updatedShaderSources: ShaderSources, primitive: Primitive, onError?: (message: string) => void): [CGAPIResourceHandle, boolean];
    /**
     * Sets up basic uniform locations in the shader program.
     * @internal Called by WebGLStrategyDataTexture and WebGLStrategyUniform only
     * @param primitive - The primitive to set up uniforms for
     */
    _setupBasicUniformsLocations(primitive: Primitive): void;
    /**
     * Sets up additional uniform locations in the shader program.
     * @internal Called by WebGLStrategyDataTexture and WebGLStrategyUniform only
     * @param shaderSemantics - Array of shader semantics to set up
     * @param isUniformOnlyMode - Whether to operate in uniform-only mode
     * @param primitive - The primitive to set up uniforms for
     */
    _setupAdditionalUniformLocations(shaderSemantics: ShaderSemanticsInfo[], isUniformOnlyMode: boolean, primitive: Primitive): void;
    /**
     * Sets internal setting parameters to GPU for WebGPU rendering.
     * @param params - Object containing material and rendering arguments
     */
    _setInternalSettingParametersToGpuWebGpu({ engine, material, args, }: {
        engine: Engine;
        material: Material;
        args: RenderingArgWebGpu;
    }): void;
    /**
     * Sets parameters to GPU for WebGL rendering per material.
     * @internal Called from WebGLStrategyDataTexture and WebGLStrategyUniform only
     * @param params - Object containing rendering parameters
     */
    _setParametersToGpuWebGL({ engine, material, shaderProgram, firstTime, args, }: {
        engine: Engine;
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
    /**
     * Sets parameters to GPU for WebGL rendering per shader program.
     * @param params - Object containing rendering parameters
     */
    _setParametersToGpuWebGLPerShaderProgram({ engine, material, shaderProgram, firstTime, args, }: {
        engine: Engine;
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
    /**
     * Sets parameters to GPU for WebGL rendering per primitive.
     * @param params - Object containing rendering parameters
     */
    _setParametersToGpuWebGLPerPrimitive({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
    /**
     * Sets parameters to GPU for WebGL rendering without internal settings.
     * @param params - Object containing rendering parameters
     */
    _setParametersToGpuWebGLWithOutInternalSetting({ shaderProgram, firstTime, isUniformMode, }: {
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        isUniformMode: boolean;
    }): void;
    /**
     * Gets shader property strings for vertex and pixel shaders.
     * @internal
     * @param propertySetter - Function to set shader properties
     * @returns Object containing vertex and pixel property strings
     */
    _getProperties(engine: Engine, propertySetterOfGlobalDataRepository: getShaderPropertyFuncOfGlobalDataRepository, propertySetterOfMaterial: getShaderPropertyFuncOfMaterial): {
        vertexPropertiesStr: string;
        pixelPropertiesStr: string;
    };
    /**
     * Sets automatic parameters to GPU for WebGL rendering.
     * @private
     * @param isUniformMode - Whether to operate in uniform mode
     * @param firstTime - Whether this is the first time setting parameters
     * @param shaderProgram - The WebGL shader program
     */
    private __setAutoParametersToGpuWebGL;
    /**
     * Sets solo datum parameters to GPU for WebGL rendering.
     * @private
     * @param params - Object containing rendering parameters
     */
    private __setSoloDatumParametersToGpuWebGL;
    /**
     * Sets the blend equation mode for blending operations.
     * This method only works if the alpha mode is set to blend.
     * @param blendEquationMode - The blend equation mode (e.g., gl.FUNC_ADD)
     * @param blendEquationModeAlpha - Optional separate blend equation mode for alpha channel
     */
    setBlendEquationMode(blendEquationMode: BlendEnum, blendEquationModeAlpha?: BlendEnum): void;
    /**
     * Handles special cases for Min/Max blend equations due to WebGPU limitations.
     * @private
     */
    private __treatForMinMax;
    /**
     * Sets separate blend function factors for RGB and alpha channels.
     * This method only works if the alpha mode is set to blend.
     * @param blendFuncSrcFactor - Source blend factor for RGB
     * @param blendFuncDstFactor - Destination blend factor for RGB
     * @param blendFuncAlphaSrcFactor - Source blend factor for alpha
     * @param blendFuncAlphaDstFactor - Destination blend factor for alpha
     */
    setBlendFuncSeparateFactor(blendFuncSrcFactor: BlendEnum, blendFuncDstFactor: BlendEnum, blendFuncAlphaSrcFactor: BlendEnum, blendFuncAlphaDstFactor: BlendEnum): void;
    /**
     * Sets blend function factors for both RGB and alpha channels.
     * This method only works if the alpha mode is set to blend.
     * @param blendFuncSrcFactor - Source blend factor
     * @param blendFuncDstFactor - Destination blend factor
     */
    setBlendFuncFactor(blendFuncSrcFactor: BlendEnum, blendFuncDstFactor: BlendEnum): void;
    /**
     * Checks if the material is in blend mode.
     * @returns True if alpha mode is Blend, false otherwise
     */
    isBlend(): boolean;
    /**
     * Checks if the material is translucent but not in blend mode.
     * @returns True if alpha mode is Opaque or Mask and the material is translucent
     */
    isTranslucentOpaque(): boolean;
    /**
     * Checks if the material is either in blend mode or translucent.
     * @returns True if in blend mode or translucent, false otherwise
     */
    isBlendOrTranslucent(): boolean;
    /**
     * Checks if the material is in opaque mode.
     * @returns True if alpha mode is Opaque, false otherwise
     */
    isOpaque(): boolean;
    /**
     * Checks if the material is in mask mode.
     * @returns True if alpha mode is Mask, false otherwise
     */
    isMask(): boolean;
    /**
     * Sets whether alpha-to-coverage is enabled for this material.
     * NOTE: To apply alpha-to-coverage, the output alpha value must not be fixed to a constant value.
     * However, some shaders in Rhodonite fix the output alpha value to 1 by setAlphaIfNotInAlphaBlendMode.
     * The shader needs to be improved to properly use alpha-to-coverage.
     * @param alphaToCoverage - Whether to apply alpha-to-coverage to this material
     */
    set alphaToCoverage(alphaToCoverage: boolean);
    /**
     * Gets whether alpha-to-coverage is enabled for this material.
     * @returns True if alpha-to-coverage is enabled, false otherwise
     */
    get alphaToCoverage(): boolean;
    /**
     * Gets the material type ID.
     * @returns The material type ID
     */
    get materialTID(): MaterialTID;
    /**
     * Gets an array of all field information for this material.
     * @returns Array of shader semantics information
     */
    get fieldsInfoArray(): ShaderSemanticsInfo[];
    /**
     * Gets the blend equation mode for RGB channels.
     * @returns The blend equation mode
     */
    get blendEquationMode(): BlendEnum;
    /**
     * Gets the blend equation mode for the alpha channel.
     * @returns The alpha blend equation mode
     */
    get blendEquationModeAlpha(): BlendEnum;
    /**
     * Gets the source blend factor for RGB channels.
     * @returns The source blend factor
     */
    get blendFuncSrcFactor(): BlendEnum;
    /**
     * Gets the destination blend factor for RGB channels.
     * @returns The destination blend factor
     */
    get blendFuncDstFactor(): BlendEnum;
    /**
     * Gets the source blend factor for the alpha channel.
     * @returns The alpha source blend factor
     */
    get blendFuncAlphaSrcFactor(): BlendEnum;
    /**
     * Gets the destination blend factor for the alpha channel.
     * @returns The alpha destination blend factor
     */
    get blendFuncAlphaDstFactor(): BlendEnum;
    /**
     * Gets the current alpha mode of the material.
     * @returns The alpha mode
     */
    get alphaMode(): AlphaModeEnum;
    /**
     * Sets the alpha mode of the material.
     * This will invalidate shaders and recalculate the fingerprint.
     * @param mode - The alpha mode to set
     */
    set alphaMode(mode: AlphaModeEnum);
    /**
     * Gets the unique material ID.
     * @returns The material UID
     */
    get materialUID(): MaterialUID;
    /**
     * Gets the material serial ID within the material type.
     * @returns The material SID
     */
    get materialSID(): MaterialSID;
    /**
     * Checks if this material supports skinning.
     * @returns True if skinning is supported, false otherwise
     */
    get isSkinning(): boolean;
    /**
     * Checks if this material supports morphing.
     * @returns True if morphing is supported, false otherwise
     */
    get isMorphing(): boolean;
    /**
     * Checks if this material supports lighting.
     * @returns True if lighting is supported, false otherwise
     */
    get isLighting(): boolean;
    /**
     * Gets the material type name.
     * This includes the full type name with variation identifier for internal use.
     * @returns The material type name
     */
    get materialTypeName(): string;
    /**
     * Gets the base material name without variation identifier.
     * This is the human-readable material type name (e.g., "PbrUber", "ClassicUber").
     * @returns The base material name
     */
    get baseMaterialName(): string;
    /**
     * Gets the material variation identifier.
     * This represents the parameter variation part of the material type.
     * @returns The variation identifier string
     */
    get materialVariationIdentifier(): string;
    /**
     * Gets the current state version of this material.
     * This is incremented whenever the material's state changes.
     * @returns The state version number
     */
    get stateVersion(): number;
    /**
     * Invalidates all shader programs associated with this material.
     * This forces shader recompilation on the next render.
     */
    makeShadersInvalidate(): void;
    updateStateVersion(): void;
    /**
     * Gets the shader node JSON data for node-based materials.
     * This is used by RHODONITE_materials_node extension.
     * @returns The shader node JSON data, or undefined if not a node-based material
     */
    get shaderNodeJson(): unknown | undefined;
    /**
     * Sets the shader node JSON data for node-based materials.
     * This marks the material as a node-based custom shader material.
     * @param json - The shader node JSON data
     */
    set shaderNodeJson(json: unknown | undefined);
    /**
     * Gets the uniform values for node-based materials.
     * @returns The uniform values object, or undefined if not set
     */
    get shaderNodeUniforms(): {
        [name: string]: number | number[];
    } | undefined;
    /**
     * Sets the uniform values for node-based materials.
     * @param uniforms - The uniform values object
     */
    set shaderNodeUniforms(uniforms: {
        [name: string]: number | number[];
    } | undefined);
    /**
     * Checks if this material is a node-based custom shader material.
     * @returns True if this is a node-based material (has shaderNodeJson set)
     */
    get isNodeBasedMaterial(): boolean;
    /**
     * Gets the shader node file name for export.
     * This is used to specify the .rmn file name in the RHODONITE_materials_node extension.
     * @returns The shader node file name, or undefined if not set
     */
    get shaderNodeFileName(): string | undefined;
    /**
     * Sets the shader node file name for export.
     * @param fileName - The .rmn file name to use in the RHODONITE_materials_node extension
     */
    set shaderNodeFileName(fileName: string | undefined);
}
