import { RenderTargetTexture } from '../textures/RenderTargetTexture';
import { Expression } from '../renderer/Expression';
import { AbstractTexture } from '../textures/AbstractTexture';
/**
 * create a bloom expression
 *
 * @param textureToBloom - the texture to bloom
 * @param parameters - the parameters for the bloom
 * @returns the bloom expression and the bloomed render target
 */
declare function createBloomExpression({ textureToBloom, parameters: { luminanceCriterion, gaussianBlurLevelHighLuminance, gaussianKernelSize, gaussianVariance, synthesizeCoefficient, }, }: {
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
export declare const ExpressionHelper: Readonly<{
    createBloomExpression: typeof createBloomExpression;
}>;
export {};
