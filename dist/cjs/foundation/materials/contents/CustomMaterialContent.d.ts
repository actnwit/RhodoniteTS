import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import { Material } from '../core/Material';
import { ShaderityObject } from 'shaderity';
import { RenderingArg } from '../../../webgl/types/CommonTypes';
import { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
export declare class CustomMaterialContent extends AbstractMaterialContent {
    private static __globalDataRepository;
    constructor({ name, isMorphing, isSkinning, isLighting, isClearCoat, isTransmission, isVolume, isSheen, isSpecular, isIridescence, isAnisotropy, isShadow, useTangentAttribute, useNormalTexture, vertexShader, pixelShader, noUseCameraTransform, additionalShaderSemanticInfo, }: {
        name: string;
        isMorphing: boolean;
        isSkinning: boolean;
        isLighting: boolean;
        isClearCoat?: boolean;
        isTransmission?: boolean;
        isVolume?: boolean;
        isSheen?: boolean;
        isSpecular?: boolean;
        isIridescence?: boolean;
        isAnisotropy?: boolean;
        isShadow?: boolean;
        useTangentAttribute: boolean;
        useNormalTexture: boolean;
        vertexShader: ShaderityObject;
        pixelShader: ShaderityObject;
        noUseCameraTransform: boolean;
        additionalShaderSemanticInfo: ShaderSemanticsInfo[];
    });
    _setCustomSettingParametersToGpu({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArg;
    }): void;
    private static __setupHdriParameters;
}
