import { AbstractTexture } from '../../textures/AbstractTexture';
import { ShaderSemanticsClass } from '../../definitions/ShaderSemantics';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import { Material } from '../core/Material';
import { RenderingArg } from '../../../webgl/types/CommonTypes';
import { Sampler } from '../../textures/Sampler';
export declare class MatCapMaterialContent extends AbstractMaterialContent {
    static MatCapTexture: ShaderSemanticsClass;
    constructor(isSkinning: boolean, uri?: string, texture?: AbstractTexture, sampler?: Sampler);
    _setCustomSettingParametersToGpuWebGL({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArg;
    }): void;
}
