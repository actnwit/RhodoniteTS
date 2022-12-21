import { ShaderSemanticsClass } from '../../definitions/ShaderSemantics';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import { Material } from '../core/Material';
import { RenderingArg } from '../../../webgl/types/CommonTypes';
export declare class PbrExtendedShadingMaterialContent extends AbstractMaterialContent {
    static detailNormalTexture: ShaderSemanticsClass;
    static detailColorTexture: ShaderSemanticsClass;
    static diffuseTextureTransform: ShaderSemanticsClass;
    static diffuseTextureRotation: ShaderSemanticsClass;
    static normalTextureTransform: ShaderSemanticsClass;
    static normalTextureRotation: ShaderSemanticsClass;
    static detailColorTextureTransform: ShaderSemanticsClass;
    static detailColorTextureRotation: ShaderSemanticsClass;
    static detailNormalTextureTransform: ShaderSemanticsClass;
    static detailNormalTextureRotation: ShaderSemanticsClass;
    static debugDisplay: ShaderSemanticsClass;
    private static __pbrCookTorranceBrdfLutDataUrlUid;
    constructor({ isMorphing, isSkinning, isLighting, }: {
        isMorphing: boolean;
        isSkinning: boolean;
        isLighting: boolean;
    });
    static initDefaultTextures(): Promise<void>;
    setCustomSettingParametersToGpu({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArg;
    }): void;
}
