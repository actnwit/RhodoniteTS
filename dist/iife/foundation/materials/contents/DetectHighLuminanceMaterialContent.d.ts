import type { RenderingArgWebGL } from '../../../webgl/types/CommonTypes';
import { type ShaderSemanticsEnum } from '../../definitions/ShaderSemantics';
import type { Engine } from '../../system/Engine';
import type { AbstractTexture } from '../../textures/AbstractTexture';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
/**
 * A material content class that detects high luminance areas in textures and applies correction.
 * This is typically used for bloom effects or tone mapping where bright areas need to be identified.
 */
export declare class DetectHighLuminanceMaterialContent extends AbstractMaterialContent {
    /**
     * Shader semantic for the luminance criterion threshold value.
     * This determines the minimum luminance value to be considered as "high luminance".
     */
    static LuminanceCriterion: ShaderSemanticsEnum;
    /**
     * Creates a new DetectHighLuminanceMaterialContent instance.
     *
     * @param engine - The engine instance
     * @param materialName - The name identifier for this material
     * @param textureToDetectHighLuminance - The source texture to analyze for high luminance areas
     */
    constructor(engine: Engine, materialName: string, textureToDetectHighLuminance: AbstractTexture);
    /**
     * Sets internal GPU parameters for WebGL rendering on a per-material basis.
     * This method configures matrices and camera-related uniforms for the shader.
     *
     * @param params - The parameters object containing material, shader program, and rendering arguments
     * @param params.material - The material instance being rendered
     * @param params.shaderProgram - The WebGL shader program to configure
     * @param params.firstTime - Whether this is the first time setting up this material
     * @param params.args - WebGL rendering arguments including world matrix, render pass, and camera info
     */
    _setInternalSettingParametersToGpuWebGLPerMaterial({ engine, shaderProgram, args, }: {
        engine: Engine;
        shaderProgram: WebGLProgram;
        args: RenderingArgWebGL;
    }): void;
}
