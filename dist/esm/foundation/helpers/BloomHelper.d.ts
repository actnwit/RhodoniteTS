import { RenderTargetTexture } from '../textures/RenderTargetTexture';
import { Expression } from '../renderer/Expression';
import { AbstractTexture } from '../textures/AbstractTexture';
export declare class Bloom {
    private __mapReducedFramebuffer;
    private __mapDetectHighLuminanceFramebuffer;
    private __mapSynthesizeFramebuffer;
    constructor();
    /**
     * create a bloom expression
     *
     * @param textureToBloom - the texture to bloom
     * @param parameters - the parameters for the bloom
     * @returns the bloom expression and the bloomed render target
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
    private __createRenderPassDetectHighLuminance;
    private __createRenderPassesBlurredHighLuminance;
    private __createRenderPassGaussianBlur;
    private __createRenderPassSynthesizeImage;
    destroy3DAPIResources(): void;
}
