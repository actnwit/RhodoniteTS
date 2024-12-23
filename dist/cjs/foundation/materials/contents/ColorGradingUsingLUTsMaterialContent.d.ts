import { AbstractTexture } from '../../textures/AbstractTexture';
import { Count } from '../../../types/CommonTypes';
import { ShaderSemanticsClass } from '../../definitions/ShaderSemantics';
import { RenderPass } from '../../renderer/RenderPass';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import { Material } from '../core/Material';
import { RenderingArgWebGL } from '../../../webgl/types/CommonTypes';
export declare class ColorGradingUsingLUTsMaterialContent extends AbstractMaterialContent {
    static lookupTableTexture: ShaderSemanticsClass;
    constructor(materialName: string, targetRenderPass: RenderPass, colorAttachmentsNumber: Count, uri?: string, texture?: AbstractTexture);
    _setInternalSettingParametersToGpuWebGL({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
}
