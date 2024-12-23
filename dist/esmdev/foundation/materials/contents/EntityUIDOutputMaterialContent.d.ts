import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import { Material } from '../core/Material';
import { RenderingArgWebGL } from '../../../webgl/types/CommonTypes';
export declare class EntityUIDOutputMaterialContent extends AbstractMaterialContent {
    constructor(materialName: string);
    _setInternalSettingParametersToGpuWebGL({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
}
