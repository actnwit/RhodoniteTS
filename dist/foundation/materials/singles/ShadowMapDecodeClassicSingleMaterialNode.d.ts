import { ShaderSemanticsEnum } from "../../definitions/ShaderSemantics";
import AbstractMaterialNode from "../core/AbstractMaterialNode";
import Material from "../core/Material";
import RenderPass from "../../renderer/RenderPass";
import { Count } from "../../../commontypes/CommonTypes";
export default class ShadowMapDecodeClassicSingleMaterialNode extends AbstractMaterialNode {
    static ShadowColor: ShaderSemanticsEnum;
    static ShadowAlpha: ShaderSemanticsEnum;
    static NonShadowAlpha: ShaderSemanticsEnum;
    static AllowableDepthError: ShaderSemanticsEnum;
    private encodedDepthRenderPass;
    constructor(encodedDepthRenderPass: RenderPass, { isMorphing, isSkinning, isLighting, colorAttachmentsNumber }: {
        isMorphing: boolean;
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
