import { ShaderSemanticsClass } from '../../definitions/ShaderSemantics';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import { Material } from '../core/Material';
import { AlphaModeEnum } from '../../definitions/AlphaMode';
import { RenderingArg } from '../../../webgl/types/CommonTypes';
/**
 * No longer used.
 */
export declare class PbrShadingMaterialContent extends AbstractMaterialContent {
    private static readonly IsOutputHDR;
    static readonly BaseColorTextureTransform: ShaderSemanticsClass;
    static readonly BaseColorTextureRotation: ShaderSemanticsClass;
    static readonly NormalTextureTransform: ShaderSemanticsClass;
    static readonly NormalTextureRotation: ShaderSemanticsClass;
    static readonly MetallicRoughnessTextureTransform: ShaderSemanticsClass;
    static readonly MetallicRoughnessTextureRotation: ShaderSemanticsClass;
    static readonly NormalTexcoordIndex: ShaderSemanticsClass;
    static readonly BaseColorTexcoordIndex: ShaderSemanticsClass;
    static readonly MetallicRoughnessTexcoordIndex: ShaderSemanticsClass;
    static readonly OcclusionTexcoordIndex: ShaderSemanticsClass;
    static readonly EmissiveTexcoordIndex: ShaderSemanticsClass;
    static readonly NormalScale: ShaderSemanticsClass;
    static readonly OcclusionStrength: ShaderSemanticsClass;
    constructor({ isMorphing, isSkinning, isLighting, useTangentAttribute, useNormalTexture, alphaMode, }: {
        isMorphing: boolean;
        isSkinning: boolean;
        isLighting: boolean;
        useTangentAttribute: boolean;
        useNormalTexture: boolean;
        alphaMode: AlphaModeEnum;
    });
    setCustomSettingParametersToGpu({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArg;
    }): void;
    private setupIBLParameters;
    private setupIBL;
    private setupHdriParameters;
}
