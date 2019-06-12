import RnObject from "../core/RnObject";
import AbstractMaterialNode from "./AbstractMaterialNode";
import { ShaderSemanticsEnum, ShaderSemanticsInfo } from "../definitions/ShaderSemantics";
import AbstractTexture from "../textures/AbstractTexture";
export default class Material extends RnObject {
    private __materialNodes;
    private __fields;
    private __fieldsInfo;
    _shaderProgramUid: CGAPIResourceHandle;
    alphaMode: import("../definitions/AlphaMode").AlphaModeEnum;
    private static __shaderMap;
    private static __materials;
    constructor(materialNodes: AbstractMaterialNode[]);
    static getAllMaterials(): Material[];
    readonly fieldsInfoEntries: () => IterableIterator<[string, ShaderSemanticsInfo]>;
    setMaterialNodes(materialNodes: AbstractMaterialNode[]): void;
    initialize(): void;
    setParameter(shaderSemantic: ShaderSemanticsEnum, value: any): void;
    setParameter(shaderSemantic: string, value: any): void;
    setTextureParameter(shaderSemantic: ShaderSemanticsEnum, value: AbstractTexture): void;
    setTextureParameter(shaderSemantic: string, value: AbstractTexture): void;
    getParameter(shaderSemantic: ShaderSemanticsEnum): any;
    getParameter(shaderSemantic: string): any;
    setUniformLocations(shaderProgramUid: CGAPIResourceHandle): void;
    setUniformValues(firstTime: boolean): void;
    createProgramAsSingleOperation(vertexShaderMethodDefinitions_uniform: string): number;
    createProgramString(vertexShaderMethodDefinitions_uniform?: string): {
        vertexShader: string;
        pixelShader: string;
        attributeNames: string[];
        attributeSemantics: import("../definitions/VertexAttribute").VertexAttributeEnum[];
    };
    createProgram(vertexShaderMethodDefinitions_uniform: string): number;
    isBlend(): boolean;
}
