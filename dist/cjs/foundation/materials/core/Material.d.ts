import { RnObject } from '../../core/RnObject';
import { AlphaModeEnum } from '../../definitions/AlphaMode';
import { AbstractMaterialContent } from './AbstractMaterialContent';
import { ShaderSemanticsEnum, ShaderSemanticsIndex, getShaderPropertyFunc } from '../../definitions/ShaderSemantics';
import { AbstractTexture } from '../../textures/AbstractTexture';
import { Index, CGAPIResourceHandle, MaterialSID, MaterialUID } from '../../../types/CommonTypes';
import { ShaderSources } from '../../../webgl/WebGLStrategy';
import { Primitive } from '../../geometry/Primitive';
import { RenderingArg } from '../../../webgl/types/CommonTypes';
import { ShaderSemanticsInfo } from '../../definitions';
import { MaterialTypeName, ShaderVariable } from './MaterialTypes';
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
    private __updatedShaderSources?;
    _shaderProgramUid: CGAPIResourceHandle;
    __materialUid: MaterialUID;
    private __materialTid;
    __materialSid: MaterialSID;
    private __alphaMode;
    cullFace: boolean;
    cullFrontFaceCCW: boolean;
    private __alphaToCoverage;
    private __blendEquationMode;
    private __blendEquationModeAlpha;
    private __blendFuncSrcFactor;
    private __blendFuncDstFactor;
    private __blendFuncAlphaSrcFactor;
    private __blendFuncAlphaDstFactor;
    private static __shaderHashMap;
    private static __shaderStringMap;
    static _soloDatumFields: Map<MaterialTypeName, Map<ShaderSemanticsIndex, ShaderVariable>>;
    constructor(materialTid: Index, materialUid: MaterialUID, materialSid: MaterialSID, materialTypeName: string, materialNode: AbstractMaterialContent);
    /**
     * @private
     * called from Primitive class only
     * @param primitive
     */
    _addBelongPrimitive(primitive: Primitive): void;
    setParameter(shaderSemantic: ShaderSemanticsEnum, value: any): void;
    setTextureParameter(shaderSemantic: ShaderSemanticsEnum, value: AbstractTexture): void;
    getTextureParameter(shaderSemantic: ShaderSemanticsEnum): any;
    setTextureParameterAsPromise(shaderSemantic: ShaderSemanticsEnum, promise: Promise<AbstractTexture>): void;
    setParameterByUniformName(uniformName: string, value: any): void;
    setTextureParameterByUniformName(uniformName: string, value: any): void;
    getParameter(shaderSemantic: ShaderSemanticsEnum): any;
    /**
     * @private
     * called from WebGLStrategyDataTexture and WebGLStrategyUnfirom only
     * @param isUniformOnlyMode
     */
    _setUniformLocationsOfMaterialNodes(isUniformOnlyMode: boolean): void;
    /**
     * return whether the shader program ready or not
     * @returns is shader program ready or not
     */
    isShaderProgramReady(): boolean;
    /**
     * @private
     * called from WebGLStrategyDataTexture and WebGLStrategyUnitform only
     */
    _setParametersToGpu({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArg;
    }): void;
    private __setAutoParametersToGpu;
    private __setSoloDatumParametersToGpu;
    private __setupGlobalShaderDefinition;
    private __createProgramAsSingleOperation;
    private __createProgramAsSingleOperationByUpdatedSources;
    private __createShaderProgramWithCache;
    private __getAttributeInfo;
    private __outputVertexAttributeBindingInfo;
    /**
     * @private
     * @param propertySetter
     */
    _getProperties(propertySetter: getShaderPropertyFunc, isWebGL2: boolean): {
        vertexPropertiesStr: string;
        pixelPropertiesStr: string;
    };
    private __getTargetShaderSemantics;
    /**
     * @private
     * called from WebGLStrategyDataTexture and WebGLStrategyUnfirom
     * @param vertexShaderMethodDefinitions_uniform
     * @param propertySetter
     * @param isWebGL2
     * @returns
     */
    _createProgram(vertexShaderMethodDefinitions_uniform: string, propertySetter: getShaderPropertyFunc, isWebGL2: boolean): CGAPIResourceHandle;
    createProgramByUpdatedSources(updatedShaderSources: ShaderSources): CGAPIResourceHandle;
    /**
     * Change the blendEquations
     * This method works only if this alphaMode is the translucent
     * @param blendEquationMode the argument of gl.blendEquation of the first argument of gl.blendEquationSeparate such as gl.FUNC_ADD
     * @param blendEquationModeAlpha the second argument of gl.blendEquationSeparate
     */
    setBlendEquationMode(blendEquationMode: number, blendEquationModeAlpha?: number): void;
    /**
     * Change the blendFuncSeparateFactors
     * This method works only if this alphaMode is the translucent
     */
    setBlendFuncSeparateFactor(blendFuncSrcFactor: number, blendFuncDstFactor: number, blendFuncAlphaSrcFactor: number, blendFuncAlphaDstFactor: number): void;
    /**
     * Change the blendFuncFactors
     * This method works only if this alphaMode is the translucent
     */
    setBlendFuncFactor(blendFuncSrcFactor: number, blendFuncDstFactor: number): void;
    /**
     * @private
     * called WebGLStrategyDataTexture and WebGLStrategyUniform only
     */
    _setupBasicUniformsLocations(): void;
    /**
     * @private
     * called WebGLStrategyDataTexture and WebGLStrategyUniform only
     */
    _setupAdditionalUniformLocations(shaderSemantics: ShaderSemanticsInfo[], isUniformOnlyMode: boolean): WebGLProgram;
    isEmptyMaterial(): boolean;
    isBlend(): boolean;
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
    get materialTID(): number;
    get fieldsInfoArray(): ShaderSemanticsInfo[];
    get blendEquationMode(): number;
    get blendEquationModeAlpha(): number;
    get blendFuncSrcFactor(): number;
    get blendFuncDstFactor(): number;
    get blendFuncAlphaSrcFactor(): number;
    get blendFuncAlphaDstFactor(): number;
    get alphaMode(): AlphaModeEnum;
    set alphaMode(mode: AlphaModeEnum);
    get materialUID(): number;
    get materialSID(): number;
    get isSkinning(): boolean;
    get isMorphing(): boolean;
    get isLighting(): boolean;
    get materialTypeName(): string;
}
