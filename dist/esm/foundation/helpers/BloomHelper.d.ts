import { Expression } from '../renderer/Expression';
import type { Engine } from '../system/Engine';
import type { AbstractTexture } from '../textures/AbstractTexture';
import type { RenderTargetTexture } from '../textures/RenderTargetTexture';
export declare class Bloom {
    private __engine;
    private __mapDetectHighLuminanceMaterial;
    private __mapGaussianBlurMaterial;
    private __mapSynthesizeMaterial;
    private __mapReducedFramebuffer;
    private __mapDetectHighLuminanceFramebuffer;
    private __mapSynthesizeFramebuffer;
    /**
     * Constructor for the Bloom helper.
     *
     * @param engine - The engine instance to use for creating the bloom effect
     */
    constructor(engine: Engine);
    /**
     * Creates a complete bloom effect expression with all required render passes.
     *
     * The bloom effect consists of three main stages:
     * 1. Detect high luminance areas in the input texture
     * 2. Apply multiple levels of Gaussian blur to create a glow effect
     * 3. Synthesize the original texture with the blurred high luminance areas
     *
     * @param params - Configuration object for the bloom effect
     * @param params.textureToBloom - The source texture to apply bloom effect to
     * @param params.parameters - Bloom effect parameters
     * @param params.parameters.luminanceCriterion - Threshold for detecting high luminance areas (default: 1.0)
     * @param params.parameters.gaussianBlurLevelHighLuminance - Number of blur levels to apply (default: 4)
     * @param params.parameters.gaussianKernelSize - Size of the Gaussian blur kernel (default: 10)
     * @param params.parameters.gaussianVariance - Variance of the Gaussian distribution (default: 10)
     * @param params.parameters.synthesizeCoefficient - Blend coefficients for combining blur levels (default: computed array)
     * @returns Object containing the bloom expression and the final render target texture
     */
    createBloomExpression({ textureToBloom, parameters: { luminanceCriterion, gaussianBlurLevelHighLuminance, gaussianKernelSize, gaussianVariance, synthesizeCoefficient, }, }: {
        textureToBloom: AbstractTexture;
        parameters: {
            luminanceCriterion?: number;
            gaussianBlurLevelHighLuminance?: number;
            gaussianKernelSize?: number;
            gaussianVariance?: number;
            synthesizeCoefficient?: [number, number, number, number, number, number];
        };
    }): {
        bloomExpression: Expression;
        bloomedRenderTarget: RenderTargetTexture;
    };
    /**
     * Creates a render pass that detects high luminance areas in the input texture.
     *
     * This is the first stage of the bloom effect where pixels with luminance above
     * the specified criterion are extracted for further processing.
     *
     * @param texture - The input texture to analyze for high luminance areas
     * @param luminanceCriterion - The threshold value for detecting high luminance pixels
     * @returns A render pass configured to detect high luminance areas
     * @private
     */
    private __createRenderPassDetectHighLuminance;
    /**
     * Creates multiple render passes for applying Gaussian blur to high luminance areas.
     *
     * This method generates a series of blur passes with progressively reduced resolution
     * to create a multi-level bloom effect. Each level applies horizontal and vertical
     * blur passes to achieve a 2D Gaussian blur.
     *
     * @param renderPassHighLuminance - The render pass containing high luminance detection results
     * @param gaussianBlurLevelHighLuminance - Number of blur levels to generate
     * @param gaussianKernelSize - Size of the Gaussian blur kernel
     * @param gaussianVariance - Variance parameter for the Gaussian distribution
     * @param maxResolutionWidth - Maximum width for blur calculations
     * @param maxResolutionHeight - Maximum height for blur calculations
     * @returns Array of render passes for multi-level Gaussian blur
     * @private
     */
    private __createRenderPassesBlurredHighLuminance;
    /**
     * Creates a single Gaussian blur render pass.
     *
     * This method creates either a horizontal or vertical blur pass using a Gaussian
     * kernel. Two passes (horizontal + vertical) are typically combined to achieve
     * a full 2D Gaussian blur effect.
     *
     * @param renderPassBlurTarget - The source render pass to blur
     * @param gaussianKernelSize - Size of the Gaussian blur kernel
     * @param gaussianVariance - Variance parameter for the Gaussian distribution
     * @param isHorizontal - Whether this is a horizontal (true) or vertical (false) blur pass
     * @param resolutionWidthBlur - Width of the blur render target
     * @param resolutionHeightBlur - Height of the blur render target
     * @returns A configured Gaussian blur render pass
     * @private
     */
    private __createRenderPassGaussianBlur;
    /**
     * Creates a render pass that synthesizes the original texture with blurred high luminance areas.
     *
     * This is the final stage of the bloom effect where the original image is combined
     * with multiple levels of blurred high luminance areas using specified blend coefficients.
     * The result is a bloomed image with HDR-like glow effects.
     *
     * @param texture - The original input texture
     * @param renderPassesBlurredHighLuminance - Array of render passes containing blurred luminance data
     * @param synthesizeCoefficient - Blend coefficients for combining different blur levels
     * @returns A render pass that produces the final bloomed image
     * @private
     */
    private __createRenderPassSynthesizeImage;
    /**
     * Destroys all 3D API resources used by this Bloom instance.
     *
     * This method cleans up all cached framebuffers and their associated GPU resources.
     * It should be called when the Bloom instance is no longer needed to prevent
     * memory leaks and properly release graphics resources.
     *
     * @public
     */
    destroy3DAPIResources(): void;
}
