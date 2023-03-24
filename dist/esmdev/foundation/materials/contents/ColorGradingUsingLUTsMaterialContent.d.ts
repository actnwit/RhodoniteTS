import { AbstractTexture } from '../../textures/AbstractTexture';
import { Count } from '../../../types/CommonTypes';
import { ShaderSemanticsClass } from '../../definitions/ShaderSemantics';
import { RenderPass } from '../../renderer/RenderPass';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import { Material } from '../core/Material';
import { RenderingArg } from '../../../webgl/types/CommonTypes';
export declare class ColorGradingUsingLUTsMaterialContent extends AbstractMaterialContent {
    static lookupTableTexture: ShaderSemanticsClass;
    constructor(targetRenderPass: RenderPass, colorAttachmentsNumber: Count, uri?: string, texture?: AbstractTexture);
    _setCustomSettingParametersToGpu({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArg;
    }): void;
}
