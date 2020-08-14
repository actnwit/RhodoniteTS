import { ShaderSemanticsEnum, ShaderSemanticsClass } from "../../definitions/ShaderSemantics";
import AbstractMaterialNode from "../core/AbstractMaterialNode";
import Material from "../core/Material";
import RenderPass from "../../renderer/RenderPass";
import { Count } from "../../../commontypes/CommonTypes";
export default class ShadowMapDecodeClassicSingleMaterialNode extends AbstractMaterialNode {
    static ShadowColorCoefficient: ShaderSemanticsEnum;
    static ShadowAlpha: ShaderSemanticsEnum;
    static NonShadowAlpha: ShaderSemanticsEnum;
    static AllowableDepthError: ShaderSemanticsEnum;
    static zNearInner: ShaderSemanticsClass;
    static zFarInner: ShaderSemanticsClass;
    private __zNearInner;
    private __zFarInner;
    private __encodedDepthRenderPass;
    constructor({ isMorphing, isSkinning, isLighting, colorAttachmentsNumber }: {
        isMorphing: boolean;
        isSkinning: boolean;
        isLighting: boolean;
        colorAttachmentsNumber: Count;
    }, encodedDepthRenderPass: RenderPass);
    setParametersForGPU({ material, shaderProgram, firstTime, args }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args?: any;
    }): void;
}
