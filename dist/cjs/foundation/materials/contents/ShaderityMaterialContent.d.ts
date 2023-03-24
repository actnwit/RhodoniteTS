import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import { Material } from '../core/Material';
import { ShaderityObject } from 'shaderity';
import { RenderingArg } from '../../../webgl/types/CommonTypes';
export declare class ShaderityMaterialContent extends AbstractMaterialContent {
    constructor({ name, vertexShaderityObj, pixelShaderityObj, }: {
        name: string;
        vertexShaderityObj: ShaderityObject;
        pixelShaderityObj: ShaderityObject;
    });
    _setCustomSettingParametersToGpu({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArg;
    }): void;
    private static __removeUselessShaderSemantics;
}
