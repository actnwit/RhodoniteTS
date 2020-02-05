import { ShaderSemanticsClass } from "../../definitions/ShaderSemantics";
import AbstractMaterialNode from "../core/AbstractMaterialNode";
import Material from "../core/Material";
import { ShaderityObject } from "shaderity";
export default class CustomSingleMaterialNode extends AbstractMaterialNode {
    private static __pbrCookTorranceBrdfLutDataUrlUid;
    private static readonly IsOutputHDR;
    static baseColorTextureTransform: ShaderSemanticsClass;
    static baseColorTextureRotation: ShaderSemanticsClass;
    static normalTextureTransform: ShaderSemanticsClass;
    static normalTextureRotation: ShaderSemanticsClass;
    static metallicRoughnessTextureTransform: ShaderSemanticsClass;
    static metallicRoughnessTextureRotation: ShaderSemanticsClass;
    private static __shaderityUtility;
    constructor({ name, isMorphing, isSkinning, isLighting, vertexShader, pixelShader }: {
        name: string;
        isMorphing: boolean;
        isSkinning: boolean;
        isLighting: boolean;
        vertexShader: ShaderityObject;
        pixelShader: ShaderityObject;
    });
    setParametersForGPU({ material, shaderProgram, firstTime, args }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args?: any;
    }): void;
    private setupHdriParameters;
}
