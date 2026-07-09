import type { RenderingArgWebGL } from '../../../webgl/types/CommonTypes';
import { ShaderSemanticsClass } from '../../definitions/ShaderSemantics';
import type { Engine } from '../../system/Engine';
import type { AbstractTexture } from '../../textures/AbstractTexture';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import type { Material } from '../core/Material';
/**
 * Material content for synthesizing HDR textures with optional target region masking.
 * This material is commonly used for glare effects and other post-processing operations.
 */
export declare class SynthesizeHdrMaterialContent extends AbstractMaterialContent {
    static SynthesizeCoefficient: ShaderSemanticsClass;
    static TargetRegionTexture: ShaderSemanticsClass;
    static Synthesize0Texture: ShaderSemanticsClass;
    static Synthesize1Texture: ShaderSemanticsClass;
    static Synthesize2Texture: ShaderSemanticsClass;
    static Synthesize3Texture: ShaderSemanticsClass;
    static Synthesize4Texture: ShaderSemanticsClass;
    static Synthesize5Texture: ShaderSemanticsClass;
    private textureNumber;
    /**
     * Creates a new SynthesizeHdrMaterialContent instance for HDR texture synthesis.
     *
     * This material node supports texture synthesis operations commonly used for glare effects
     * and other post-processing operations. It can synthesize up to 6 textures simultaneously.
     *
     * **Synthesis Behavior:**
     * - **Without targetRegionTexture**: Synthesizes all input textures across all pixels,
     *   weighted by the corresponding synthesizeCoefficient values.
     * - **With targetRegionTexture**: Applies weighted synthesis only to non-white pixels
     *   (where color != (1.0, 1.0, 1.0, 1.0)). White areas receive the product of
     *   synthesizeTextures[0] and synthesizeCoefficient[0].
     *
     * @param materialName - Unique identifier for this material instance
     * @param synthesizeTextures - Array of textures to be synthesized (supports up to 6 textures)
     *
     * @example
     * ```typescript
     * const synthesizeTextures = [texture1, texture2, texture3];
     * const material = new SynthesizeHdrMaterialContent('GlareMaterial', synthesizeTextures);
     * ```
     */
    constructor(engine: Engine, materialName: string, synthesizeTextures: AbstractTexture[]);
    /**
     * Sets internal WebGL-specific parameters for the material during rendering.
     *
     * This method is called during the WebGL rendering pipeline to configure
     * shader uniforms and state specific to this material. It handles matrix
     * transformations and synthesis coefficient updates.
     *
     * @param params - Configuration object containing material and rendering context
     * @param params.material - The material instance being rendered
     * @param params.shaderProgram - WebGL shader program to configure
     * @param params.firstTime - Whether this is the first time setting parameters
     * @param params.args - WebGL rendering arguments and context
     *
     * @internal This method is part of the internal rendering pipeline
     */
    _setInternalSettingParametersToGpuWebGLPerMaterial({ engine, material, shaderProgram, args, }: {
        engine: Engine;
        material: Material;
        shaderProgram: WebGLProgram;
        args: RenderingArgWebGL;
    }): void;
    /**
     * Gets the number of textures configured for synthesis.
     *
     * @returns The count of textures that will be processed during synthesis
     *
     * @example
     * ```typescript
     * const material = new SynthesizeHdrMaterialContent('test', [tex1, tex2]);
     * console.log(material.synthesizeTextureNumber); // 2
     * ```
     */
    get synthesizeTextureNumber(): number;
}
