import { ShaderSemanticsEnum } from "../definitions/ShaderSemantics";
import AbstractMaterialNode from "./AbstractMaterialNode";
import Material from "./Material";
import RenderPass from "../renderer/RenderPass";
import { Count } from "../../types/CommonTypes";
export default class ShadowMapDecodeClassicSingleMaterialNode extends AbstractMaterialNode {
    static ShadowColor: ShaderSemanticsEnum;
    static ShadowAlpha: ShaderSemanticsEnum;
    static NonShadowAlpha: ShaderSemanticsEnum;
    static AllowableDepthError: ShaderSemanticsEnum;
    private encodedDepthRenderPass;
    constructor(encodedDepthRenderPass: RenderPass, { isSkinning, isLighting, colorAttachmentsNumber }: {
        isSkinning: boolean;
        isLighting: boolean;
        colorAttachmentsNumber: Count;
    });
    setParametersForGPU({ material, shaderProgram, firstTime, args }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args?: any;
    }): void;
}
