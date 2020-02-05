import { ShaderSemanticsClass } from "../definitions/ShaderSemantics";
import AbstractMaterialNode from "./AbstractMaterialNode";
import Material from "./Material";
export default class PbrShadingMaterialNode extends AbstractMaterialNode {
    private static __pbrCookTorranceBrdfLutDataUrlUid;
    private static readonly IsOutputHDR;
    static baseColorTextureTransform: ShaderSemanticsClass;
    static baseColorTextureRotation: ShaderSemanticsClass;
    static normalTextureTransform: ShaderSemanticsClass;
    static normalTextureRotation: ShaderSemanticsClass;
    static metallicRoughnessTextureTransform: ShaderSemanticsClass;
    static metallicRoughnessTextureRotation: ShaderSemanticsClass;
    constructor({ isMorphing, isSkinning, isLighting }: {
        isMorphing: boolean;
        isSkinning: boolean;
        isLighting: boolean;
    });
    setParametersForGPU({ material, shaderProgram, firstTime, args }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args?: any;
    }): void;
    private setupHdriParameters;
}
