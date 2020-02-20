import RnObject from "../../core/RnObject";
import { AlphaModeEnum } from "../../definitions/AlphaMode";
import AbstractMaterialNode from "./AbstractMaterialNode";
import { ShaderSemanticsEnum, ShaderSemanticsInfo } from "../../definitions/ShaderSemantics";
import AbstractTexture from "../../textures/AbstractTexture";
import Accessor from "../../memory/Accessor";
import { Index, CGAPIResourceHandle } from "../../../commontypes/CommonTypes";
export declare type getShaderPropertyFunc = (materialTypeName: string, info: ShaderSemanticsInfo, propertyIndex: Index, isGlobalData: boolean) => string;
/**
 * The material class.
 * This class has one or more material nodes.
 */
export default class Material extends RnObject {
    private __materialNodes;
    private __fields;
    private __fieldsForNonSystem;
    private static __soloDatumFields;
    private __fieldsInfo;
    _shaderProgramUid: CGAPIResourceHandle;
    private __alphaMode;
    private static __shaderHashMap;
    private static __shaderStringMap;
    private static __materials;
    private static __instancesByTypes;
    private __materialTid;
    private static __materialTidCount;
    private static __materialTids;
    private static __materialInstanceCountOfType;
    private __materialSid;
    private static __materialTypes;
    private static __maxInstances;
    private __materialTypeName;
    private static __bufferViews;
    private static __accessors;
    cullFace: boolean | null;
    cullFrontFaceCCW: boolean;
    private __blendEquationMode;
    private __blendEquationModeAlpha;
    private __blendFuncSrcFactor;
    private __blendFuncDstFactor;
    private __blendFuncAlphaSrcFactor;
    private __blendFuncAlphaDstFactor;
    private constructor();
    get materialTypeName(): string;
    /**
     * Gets materialTID.
     */
    get materialTID(): number;
    get fieldsInfoArray(): ShaderSemanticsInfo[];
    /**
     * Creates an instance of this Material class.
     * @param materialTypeName The material type to create.
     * @param materialNodes_ The material nodes to add to the created material.
     */
    static createMaterial(materialTypeName: string, materialNodes_?: AbstractMaterialNode[]): Material;
    static isRegisteredMaterialType(materialTypeName: string): boolean;
    static _calcAlignedByteLength(semanticInfo: ShaderSemanticsInfo): number;
    private static __allocateBufferView;
    /**
     * Registers the material type.
     * @param materialTypeName The type name of the material.
     * @param materialNodes The material nodes to register.
     * @param maxInstancesNumber The maximum number to create the material instances.
     */
    static registerMaterial(materialTypeName: string, materialNodes: AbstractMaterialNode[], maxInstanceNumber?: number): boolean;
    static forceRegisterMaterial(materialTypeName: string, materialNodes: AbstractMaterialNode[], maxInstanceNumber?: number): boolean;
    static getAllMaterials(): Material[];
    setMaterialNodes(materialNodes: AbstractMaterialNode[]): void;
    get materialSID(): number;
    get isSkinning(): boolean;
    get isMorphing(): boolean;
    get isLighting(): boolean;
    /**
     * @private
     */
    static _getPropertyIndex(semanticInfo: ShaderSemanticsInfo): number;
    /**
     * @private
     */
    static _getPropertyIndex2(shaderSemantic: ShaderSemanticsEnum, index?: Index): number;
    initialize(): void;
    setParameter(shaderSemantic: ShaderSemanticsEnum, value: any, index?: Index): void;
    setTextureParameter(shaderSemantic: ShaderSemanticsEnum, value: AbstractTexture): void;
    getParameter(shaderSemantic: ShaderSemanticsEnum): any;
    setUniformLocations(shaderProgramUid: CGAPIResourceHandle): void;
    setParametersForGPU({ material, shaderProgram, firstTime, args }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args?: any;
    }): void;
    setSoloDatumParametersForGPU({ shaderProgram, firstTime, args }: {
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args?: any;
    }): void;
    private __setupGlobalShaderDefinition;
    createProgramAsSingleOperation(vertexShaderMethodDefinitions_uniform: string, propertySetter: getShaderPropertyFunc): number;
    /**
     * @private
     * @param propertySetter
     */
    _getProperties(propertySetter: getShaderPropertyFunc): {
        vertexPropertiesStr: string;
        pixelPropertiesStr: string;
    };
    createProgram(vertexShaderMethodDefinitions_uniform: string, propertySetter: getShaderPropertyFunc): number;
    isBlend(): boolean;
    static getLocationOffsetOfMemberOfMaterial(materialTypeName: string, propertyIndex: Index): number;
    static getAccessorOfMemberOfMaterial(materialTypeName: string, propertyIndex: Index): Accessor | undefined;
    get alphaMode(): AlphaModeEnum;
    set alphaMode(mode: AlphaModeEnum);
    setBlendEquationMode(blendEquationMode: number, blendEquationModeAlpha: number | null): void;
    setBlendFuncSeparateFactor(blendFuncSrcFactor: number, blendFuncDstFactor: number, blendFuncAlphaSrcFactor: number, blendFuncAlphaDstFactor: number): void;
    setBlendFuncFactor(blendFuncSrcFactor: number, blendFuncDstFactor: number): void;
    get blendEquationMode(): number;
    get blendEquationModeAlpha(): number | null;
    get blendFuncSrcFactor(): number;
    get blendFuncDstFactor(): number;
    get blendFuncAlphaSrcFactor(): number | null;
    get blendFuncAlphaDstFactor(): number | null;
    isEmptyMaterial(): boolean;
    getShaderSemanticInfoFromName(name: string): ShaderSemanticsInfo | undefined;
}
