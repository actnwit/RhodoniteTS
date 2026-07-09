import { type TextureFormatEnum } from '../definitions';
import { Expression } from '../renderer/Expression';
import type { FrameBuffer } from '../renderer/FrameBuffer';
import type { RenderPass } from '../renderer/RenderPass';
import type { Engine } from '../system/Engine';
import type { AbstractTexture } from '../textures/AbstractTexture';
import type { RenderTargetTexture } from '../textures/RenderTargetTexture';
/**
 * A helper class for creating Gaussian blur effects on textures.
 * This class provides functionality to apply multi-pass Gaussian blur
 * with customizable parameters including blur levels, kernel size, and variance.
 */
export declare class GaussianBlur {
    private __engine;
    private __mapReducedFramebuffer;
    private __mapSynthesizeFramebuffer;
    /**
     * Constructor for the GaussianBlur helper.
     *
     * @param engine - The engine instance to use for creating the Gaussian blur effect
     */
    constructor(engine: Engine);
    /**
     * Creates a complete Gaussian blur expression with multiple blur passes and synthesis.
     * This method generates a series of render passes that apply Gaussian blur at different
     * resolution levels and synthesizes them into a final blurred image.
     *
     * @param config - Configuration object containing the texture to blur and parameters
     * @param config.textureToBlur - The source texture to apply Gaussian blur to
     * @param config.parameters - Blur configuration parameters
     * @param config.parameters.blurPassLevel - Number of blur passes (default: 4)
     * @param config.parameters.gaussianKernelSize - Size of the Gaussian kernel (default: 10)
     * @param config.parameters.gaussianVariance - Variance for Gaussian distribution (default: 10)
     * @param config.parameters.synthesizeCoefficient - Coefficients for blending blur levels (default: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0])
     * @param config.parameters.isReduceBuffer - Whether to reduce buffer size for each pass (default: true)
     * @param config.parameters.textureFormat - Format for intermediate textures (default: RGBA16F)
     * @param config.parameters.outputFrameBuffer - Optional output framebuffer (default: undefined)
     * @param config.parameters.outputFrameBufferLayerIndex - Layer index for output framebuffer (default: 0)
     *
     * @returns An object containing the blur expression, blurred render target, and render passes
     */
    createGaussianBlurExpression({ textureToBlur, parameters: { blurPassLevel, gaussianKernelSize, gaussianVariance, synthesizeCoefficient, isReduceBuffer, textureFormat, outputFrameBuffer, outputFrameBufferLayerIndex, }, }: {
        textureToBlur: AbstractTexture;
        parameters: {
            blurPassLevel?: number;
            gaussianKernelSize?: number;
            gaussianVariance?: number;
            synthesizeCoefficient?: [number, number, number, number, number, number];
            isReduceBuffer?: boolean;
            textureFormat?: TextureFormatEnum;
            outputFrameBuffer?: FrameBuffer;
            outputFrameBufferLayerIndex?: number;
        };
    }): {
        blurExpression: Expression;
        blurredRenderTarget: RenderTargetTexture;
        renderPassesBlurred: RenderPass[];
    };
    /**
     * Creates a series of blur render passes with horizontal and vertical blur operations.
     * Each blur level can optionally use reduced resolution for performance optimization.
     *
     * @param frameBufferToBlur - The source texture or framebuffer to blur
     * @param blurPassLevel - Number of blur passes to create
     * @param gaussianKernelSize - Size of the Gaussian blur kernel
     * @param gaussianVariance - Variance parameter for Gaussian distribution
     * @param maxResolutionWidth - Maximum width for blur textures
     * @param maxResolutionHeight - Maximum height for blur textures
     * @param isReduceBuffer - Whether to reduce buffer resolution for each pass
     * @param textureFormat - Format for intermediate blur textures
     *
     * @returns Array of render passes for horizontal and vertical blur operations
     */
    private __createBlurPasses;
    /**
     * Creates a render pass that synthesizes the original texture with multiple blur levels.
     * This method combines the original image with various blur intensities using
     * specified synthesis coefficients to create the final blurred result.
     *
     * @param texture - The original texture to synthesize with
     * @param renderPassesBlurredHighLuminance - Array of blur render passes to synthesize
     * @param synthesizeCoefficient - Coefficients for blending each blur level
     * @param textureFormat - Format for the synthesis output texture
     * @param outputFrameBuffer - Optional specific output framebuffer
     * @param outputFrameBufferLayerIndex - Layer index for multi-layer output framebuffers
     *
     * @returns Render pass that performs the synthesis operation
     */
    private __createRenderPassSynthesizeImage;
    /**
     * Creates a single Gaussian blur render pass for either horizontal or vertical blur direction.
     * This method sets up the material with appropriate Gaussian kernel parameters and
     * creates the necessary framebuffer for the blur operation.
     *
     * @param textureToBlur - The input texture to apply blur to
     * @param gaussianKernelSize - Size of the Gaussian blur kernel
     * @param gaussianVariance - Variance parameter for Gaussian distribution calculation
     * @param isHorizontal - Whether to apply horizontal (true) or vertical (false) blur
     * @param resolutionWidthBlur - Width of the blur output texture
     * @param resolutionHeightBlur - Height of the blur output texture
     * @param textureFormat - Format for the blur output texture
     *
     * @returns Configured render pass for Gaussian blur operation
     */
    private __createRenderPassGaussianBlur;
    /**
     * Destroys all 3D API resources associated with this GaussianBlur instance.
     * This method cleans up all cached framebuffers and their associated GPU resources
     * to prevent memory leaks. Should be called when the GaussianBlur instance is no longer needed.
     */
    destroy3DAPIResources(): void;
}
