import RnObject from "../core/RnObject";
import AbstractMaterialNode from "./AbstractMaterialNode";
import { ShaderSemanticsEnum, ShaderSemanticsInfo } from "../definitions/ShaderSemantics";
import AbstractTexture from "../textures/AbstractTexture";
import { Index, CGAPIResourceHandle } from "../../types/CommonTypes";
declare type getShaderPropertyFunc = (materialTypeName: string, info: ShaderSemanticsInfo, memberName: string) => string;
/**
 * The material class.
 * This class has one or more material nodes.
 */
export default class Material extends RnObject {
    private __materialNodes;
    private __fields;
    private static __soloDatumFields;
    private __fieldsInfo;
    _shaderProgramUid: CGAPIResourceHandle;
    alphaMode: import("../definitions/AlphaMode").AlphaModeEnum;
    private static __shaderMap;
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
    private constructor();
    /**
     * Gets materialTID.
     */
    readonly materialTID: number;
    readonly fieldsInfoArray: ShaderSemanticsInfo[];
    /**
     * Creates an instance of this Material class.
     * @param materialTypeName The material type to create.
     * @param materialNodes_ The material nodes to add to the created materlal.
     */
    static createMaterial(materialTypeName: string, materialNodes_?: AbstractMaterialNode[]): Material | undefined;
    private static __allocateBufferView;
    /**
     * Registers the material type.
     * @param materialTypeName The type name of the material.
     * @param materialNodes The material nodes to register.
     * @param maxInstancesNumber The maximum number to create the material instances.
     */
    static registerMaterial(materialTypeName: string, materialNodes: AbstractMaterialNode[], maxInstancesNumber?: number): boolean;
    static getAllMaterials(): Material[];
    setMaterialNodes(materialNodes: AbstractMaterialNode[]): void;
    readonly materialSID: number;
    private static __getPropertyName;
    initialize(): void;
    setParameter(shaderSemantic: ShaderSemanticsEnum, value: any, index?: Index): void;
    setParameter(shaderSemantic: string, value: any, index?: Index): void;
    setTextureParameter(shaderSemantic: ShaderSemanticsEnum, value: AbstractTexture): void;
    setTextureParameter(shaderSemantic: string, value: AbstractTexture): void;
    getParameter(shaderSemantic: ShaderSemanticsEnum): any;
    getParameter(shaderSemantic: string): any;
    setUniformLocations(shaderProgramUid: CGAPIResourceHandle): void;
    setUniformValues(firstTime: boolean, args?: Object): void;
    setUniformValuesForOnlyTextures(firstTime: boolean, args?: Object): void;
    createProgramAsSingleOperation(vertexShaderMethodDefinitions_uniform: string, propertySetter?: getShaderPropertyFunc): number;
    createProgramString(vertexShaderMethodDefinitions_uniform?: string): {
        vertexShader: string;
        pixelShader: string;
        attributeNames: string[];
        attributeSemantics: import("../definitions/VertexAttribute").VertexAttributeEnum[];
    };
    createProgram(vertexShaderMethodDefinitions_uniform: string, propertySetter?: getShaderPropertyFunc): number;
    isBlend(): boolean;
    static getLocationOffsetOfMemberOfMaterial(materialTypeName: string, memberName: string): number;
}
export {};
