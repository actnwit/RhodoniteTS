import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import { Material } from '../core/Material';
import { ShaderSemanticsClass } from '../../definitions/ShaderSemantics';
import { RenderingArg } from '../../../webgl/types/CommonTypes';
export declare class DepthEncodeMaterialContent extends AbstractMaterialContent {
    static zNearInner: ShaderSemanticsClass;
    static zFarInner: ShaderSemanticsClass;
    static isPointLight: ShaderSemanticsClass;
    static depthPow: ShaderSemanticsClass;
    private __lastZNear;
    private __lastZFar;
    constructor(depthPow: number, { isSkinning }: {
        isSkinning: boolean;
    });
    setCustomSettingParametersToGpu({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArg;
    }): void;
}