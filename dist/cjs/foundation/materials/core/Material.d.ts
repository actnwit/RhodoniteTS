import { RnObject } from '../../core/RnObject';
import { AlphaModeEnum } from '../../definitions/AlphaMode';
import { AbstractMaterialContent } from './AbstractMaterialContent';
import { ShaderSemanticsEnum, ShaderSemanticsIndex, getShaderPropertyFunc } from '../../definitions/ShaderSemantics';
import type { AbstractTexture } from '../../textures/AbstractTexture';
import { Index, CGAPIResourceHandle, MaterialSID, MaterialTID, MaterialUID } from '../../../types/CommonTypes';
import type { ShaderSources } from '../../../webgl/WebGLStrategy';
import type { Primitive } from '../../geometry/Primitive';
import type { RenderingArgWebGL, RenderingArgWebGpu } from '../../../webgl/types/CommonTypes';
import { ShaderSemanticsInfo } from '../../definitions';
import { MaterialTypeName, ShaderVariable } from './MaterialTypes';
import { Sampler } from '../../textures/Sampler';
import { BlendEnum } from '../../definitions/Blend';
/**
 * The material class.
 * This class has one or more material nodes.
 */
export declare class Material extends RnObject {
    __materialTypeName: MaterialTypeName;
    _materialContent: AbstractMaterialContent;
    _allFieldVariables: Map<ShaderSemanticsIndex, ShaderVariable>;
    _autoFieldVariablesOnly: Map<ShaderSemanticsIndex, ShaderVariable>;
    _allFieldsInfo: Map<ShaderSemanticsIndex, ShaderSemanticsInfo>;
    private __belongPrimitives;
    private _shaderProgramUidMap;
    private _primitiveFingerPrintBackUp;
    __materialUid: MaterialUID;
    private __materialTid;
    __materialSid: MaterialSID;
    private __alphaMode;
    isTranslucent: boolean;
    cullFace: boolean;
    cullFrontFaceCCW: boolean;
    private __alphaToCoverage;
    private __blendEquationMode;
    private __blendEquationModeAlpha;
    private __blendFuncSrcFactor;
    private __blendFuncDstFactor;
    private __blendFuncAlphaSrcFactor;
    private __blendFuncAlphaDstFactor;
    private __stateVersion;
    private static __stateVersion;
    private __fingerPrint;
    private __shaderDefines;
    private static __webglResourceRepository?;
    static _soloDatumFields: Map<MaterialTypeName, Map<ShaderSemanticsIndex, ShaderVariable>>;
    constructor(materialTid: Index, materialUid: MaterialUID, materialSid: MaterialSID, materialTypeName: string, materialNode: AbstractMaterialContent);
    addShaderDefine(define: string): void;
    removeShaderDefine(define: string): void;
    getShaderDefines(): Set<string>;
    calcFingerPrint(): void;
    _getFingerPrint(): string;
    static get stateVersion(): number;
    setParameter(shaderSemantic: ShaderSemanticsEnum, value: any): void;
    setTextureParameter(shaderSemantic: ShaderSemanticsEnum, texture: AbstractTexture, sampler: Sampler): void;
    getTextureParameter(shaderSemantic: ShaderSemanticsEnum): any;
    setTextureParameterAsPromise(shaderSemantic: ShaderSemanticsEnum, promise: Promise<AbstractTexture>): void;
    getParameter(shaderSemantic: ShaderSemanticsEnum): any;
    /**
     * return whether the shader program ready or not
     * @returns is shader program ready or not
     */
    isShaderProgramReady(primitive: Primitive): boolean;
    /**
     * @internal
     * called from WebGLStrategyDataTexture and WebGLStrategyUniform only
     * @param isUniformOnlyMode
     */
    _setUniformLocationsOfMaterialNodes(isUniformOnlyMode: boolean, primitive?: Primitive): void;
    getShaderProgramUid(primitive?: Primitive): CGAPIResourceHandle;
    /**
     * @internal
     * called from Primitive class only
     * @param primitive
     */
    _addBelongPrimitive(primitive: Primitive): void;
    /**
     * @internal
     * called from WebGLStrategyDataTexture and WebGLStrategyUniform
     * @param vertexShaderMethodDefinitions_uniform
     * @param propertySetter
     * @param isWebGL2
     * @returns
     */
    _createProgramWebGL(vertexShaderMethodDefinitions_uniform: string, propertySetter: getShaderPropertyFunc, primitive: Primitive, isWebGL2: boolean): [CGAPIResourceHandle, boolean];
    _createProgramWebGpu(primitive: Primitive, vertexShaderMethodDefinitions: string, propertySetter: getShaderPropertyFunc): void;
    /**
     * create program by updated shader source code
     * @internal
     * called from WebGLStrategyDataTexture and WebGLStrategyUniform
     *
     * @param updatedShaderSources - updated shader source code
     * @param onError
     * @returns
     */
    _createProgramByUpdatedSources(updatedShaderSources: ShaderSources, onError?: (message: string) => void): [CGAPIResourceHandle, boolean];
    /**
     * @internal
     * called WebGLStrategyDataTexture and WebGLStrategyUniform only
     */
    _setupBasicUniformsLocations(primitive?: Primitive): void;
    /**
     * @internal
     * called WebGLStrategyDataTexture and WebGLStrategyUniform only
     */
    _setupAdditionalUniformLocations(shaderSemantics: ShaderSemanticsInfo[], isUniformOnlyMode: boolean, primitive?: Primitive): void;
    _setInternalSettingParametersToGpuWebGpu({ material, args, }: {
        material: Material;
        args: RenderingArgWebGpu;
    }): void;
    /**
     * @internal
     * called from WebGLStrategyDataTexture and WebGLStrategyUniform only
     */
    _setParametersToGpuWebGL({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
    _setParametersToGpuWebGLWithOutInternalSetting({ shaderProgram, firstTime, isUniformMode, }: {
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        isUniformMode: boolean;
    }): void;
    /**
     * @internal
     * @param propertySetter
     */
    _getProperties(propertySetter: getShaderPropertyFunc, isWebGL2: boolean): {
        vertexPropertiesStr: string;
        pixelPropertiesStr: string;
    };
    private __setAutoParametersToGpuWebGL;
    private __setSoloDatumParametersToGpuWebGL;
    /**
     * Change the blendEquations
     * This method works only if this alphaMode is the blend
     * @param blendEquationMode the argument of gl.blendEquation of the first argument of gl.blendEquationSeparate such as gl.FUNC_ADD
     * @param blendEquationModeAlpha the second argument of gl.blendEquationSeparate
     */
    setBlendEquationMode(blendEquationMode: BlendEnum, blendEquationModeAlpha?: BlendEnum): void;
    private __treatForMinMax;
    /**
     * Change the blendFuncSeparateFactors
     * This method works only if this alphaMode is the blend
     */
    setBlendFuncSeparateFactor(blendFuncSrcFactor: BlendEnum, blendFuncDstFactor: BlendEnum, blendFuncAlphaSrcFactor: BlendEnum, blendFuncAlphaDstFactor: BlendEnum): void;
    /**
     * Change the blendFuncFactors
     * This method works only if this alphaMode is the blend
     */
    setBlendFuncFactor(blendFuncSrcFactor: BlendEnum, blendFuncDstFactor: BlendEnum): void;
    isBlend(): boolean;
    /**
     *
     * @returns return true if (alphaMode is Opaque or Mask) and translucent
     */
    isTranslucentOpaque(): boolean;
    isBlendOrTranslucent(): boolean;
    isOpaque(): boolean;
    isMask(): boolean;
    /**
     * NOTE: To apply the alphaToCoverage, the output alpha value must not be fixed to constant value.
     * However, some shaders in the Rhodonite fixes the output alpha value to 1 by setAlphaIfNotInAlphaBlendMode.
     * So we need to improve the shader to use the alphaToCoverage.
     * @param alphaToCoverage apply alphaToCoverage to this material or not
     */
    set alphaToCoverage(alphaToCoverage: boolean);
    get alphaToCoverage(): boolean;
    /**
     * Gets materialTID.
     */
    get materialTID(): MaterialTID;
    get fieldsInfoArray(): ShaderSemanticsInfo[];
    get blendEquationMode(): BlendEnum;
    get blendEquationModeAlpha(): BlendEnum;
    get blendFuncSrcFactor(): BlendEnum;
    get blendFuncDstFactor(): BlendEnum;
    get blendFuncAlphaSrcFactor(): BlendEnum;
    get blendFuncAlphaDstFactor(): BlendEnum;
    get alphaMode(): AlphaModeEnum;
    set alphaMode(mode: AlphaModeEnum);
    get materialUID(): MaterialUID;
    get materialSID(): MaterialSID;
    get isSkinning(): boolean;
    get isMorphing(): boolean;
    get isLighting(): boolean;
    get materialTypeName(): string;
    get stateVersion(): number;
    makeShadersInvalidate(): void;
}
