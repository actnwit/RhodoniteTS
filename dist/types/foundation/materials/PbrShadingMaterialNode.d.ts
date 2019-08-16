import { ShaderSemanticsEnum, ShaderSemanticsClass } from "../definitions/ShaderSemantics";
import AbstractMaterialNode from "./AbstractMaterialNode";
import Material from "./Material";
export default class PbrShadingMaterialNode extends AbstractMaterialNode {
    private static __pbrCookTorranceBrdfLutDataUrlUid;
    static readonly isOutputHDR: ShaderSemanticsClass;
    constructor({ isMorphing, isSkinning, isLighting }: {
        isMorphing: boolean;
        isSkinning: boolean;
        isLighting: boolean;
    });
    static initDefaultTextures(): Promise<void>;
    convertValue(shaderSemantic: ShaderSemanticsEnum, value: any): void;
    setParametersForGPU({ material, shaderProgram, firstTime, args }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args?: any;
    }): void;
}
