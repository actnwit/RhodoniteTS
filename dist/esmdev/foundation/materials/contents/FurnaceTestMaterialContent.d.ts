import { ShaderSemanticsClass } from '../../definitions/ShaderSemantics';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import { Material } from '../core/Material';
import { RenderingArg } from '../../../webgl/types/CommonTypes';
export declare class FurnaceTestMaterialContent extends AbstractMaterialContent {
    static mode: ShaderSemanticsClass;
    static debugView: ShaderSemanticsClass;
    static g_type: ShaderSemanticsClass;
    static disable_fresnel: ShaderSemanticsClass;
    static f0: ShaderSemanticsClass;
    constructor();
    setCustomSettingParametersToGpu({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArg;
    }): void;
}
