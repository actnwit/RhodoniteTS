import { ShaderSemanticsEnum } from '../../definitions/ShaderSemantics';
import { RenderPass } from '../../renderer/RenderPass';
import { Count } from '../../../types/CommonTypes';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import { Material } from '../core/Material';
import { RenderingArg } from '../../../webgl/types/CommonTypes';
export declare class DetectHighLuminanceMaterialContent extends AbstractMaterialContent {
    static LuminanceCriterion: ShaderSemanticsEnum;
    static LuminanceReduce: ShaderSemanticsEnum;
    static FramebufferWidth: ShaderSemanticsEnum;
    constructor(HDRRenderPass: RenderPass, colorAttachmentsNumber: Count);
    setCustomSettingParametersToGpu({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArg;
    }): void;
}
