import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import { Material } from '../core/Material';
import { ShaderityObject } from 'shaderity';
import { RenderingArgWebGL, RenderingArgWebGpu } from '../../../webgl/types/CommonTypes';
import { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
export declare class CustomMaterialContent extends AbstractMaterialContent {
    private static __globalDataRepository;
    private static __diffuseIblCubeMapSampler;
    private static __specularIblCubeMapSampler;
    constructor({ name, isMorphing, isSkinning, isLighting, vertexShader, pixelShader, additionalShaderSemanticInfo, vertexShaderWebGpu, pixelShaderWebGpu, }: {
        name: string;
        isMorphing: boolean;
        isSkinning: boolean;
        isLighting: boolean;
        vertexShader?: ShaderityObject;
        pixelShader?: ShaderityObject;
        additionalShaderSemanticInfo: ShaderSemanticsInfo[];
        vertexShaderWebGpu?: ShaderityObject;
        pixelShaderWebGpu?: ShaderityObject;
    });
    _setInternalSettingParametersToGpuWebGpu({ material, args, }: {
        material: Material;
        args: RenderingArgWebGpu;
    }): void;
    _setInternalSettingParametersToGpuWebGL({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
    private static __setupHdriParameters;
}
