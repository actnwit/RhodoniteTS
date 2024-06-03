import { ShaderSemanticsEnum } from '../../definitions/ShaderSemantics';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import { Material } from '../core/Material';
import { RenderingArgWebGL } from '../../../webgl/types/CommonTypes';
import { AbstractTexture } from '../../textures/AbstractTexture';
export declare class DetectHighLuminanceMaterialContent extends AbstractMaterialContent {
    static LuminanceCriterion: ShaderSemanticsEnum;
    constructor(textureToDetectHighLuminance: AbstractTexture);
    _setInternalSettingParametersToGpuWebGL({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
}
