import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import { Material } from '../core/Material';
import { ShaderityObject } from 'shaderity';
import { AlphaModeEnum } from '../../definitions/AlphaMode';
import { RenderingArg } from '../../../webgl/types/CommonTypes';
import { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
export declare class CustomMaterialContent extends AbstractMaterialContent {
    private static __globalDataRepository;
    constructor({ name, isMorphing, isSkinning, isLighting, isClearCoat, isTransmission, isVolume, isSheen, isSpecular, isShadow, alphaMode, useTangentAttribute, useNormalTexture, vertexShader, pixelShader, additionalShaderSemanticInfo, }: {
        name: string;
        isMorphing: boolean;
        isSkinning: boolean;
        isLighting: boolean;
        isClearCoat?: boolean;
        isTransmission?: boolean;
        isVolume?: boolean;
        isSheen?: boolean;
        isSpecular?: boolean;
        isShadow?: boolean;
        alphaMode: AlphaModeEnum;
        useTangentAttribute: boolean;
        useNormalTexture: boolean;
        vertexShader: ShaderityObject;
        pixelShader: ShaderityObject;
        additionalShaderSemanticInfo: ShaderSemanticsInfo[];
    });
    setCustomSettingParametersToGpu({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArg;
    }): void;
    private setupHdriParameters;
}
