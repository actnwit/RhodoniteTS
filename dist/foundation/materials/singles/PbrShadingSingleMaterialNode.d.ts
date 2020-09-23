import { ShaderSemanticsClass } from "../../definitions/ShaderSemantics";
import AbstractMaterialNode from "../core/AbstractMaterialNode";
import Material from "../core/Material";
import { AlphaModeEnum } from "../../definitions/AlphaMode";
export default class PbrShadingSingleMaterialNode extends AbstractMaterialNode {
    private static __pbrCookTorranceBrdfLutDataUrlUid;
    private static readonly IsOutputHDR;
    static baseColorTextureTransform: ShaderSemanticsClass;
    static baseColorTextureRotation: ShaderSemanticsClass;
    static normalTextureTransform: ShaderSemanticsClass;
    static normalTextureRotation: ShaderSemanticsClass;
    static metallicRoughnessTextureTransform: ShaderSemanticsClass;
    static metallicRoughnessTextureRotation: ShaderSemanticsClass;
    constructor({ isMorphing, isSkinning, isLighting, alphaMode }: {
        isMorphing: boolean;
        isSkinning: boolean;
        isLighting: boolean;
        alphaMode: AlphaModeEnum;
    });
    setParametersForGPU({ material, shaderProgram, firstTime, args }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args?: any;
    }): void;
    private setupHdriParameters;
}
