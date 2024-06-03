import { RenderTargetTexture } from '../textures/RenderTargetTexture';
import { Expression } from '../renderer/Expression';
import { AbstractTexture } from '../textures/AbstractTexture';
declare function createBloomExpression({ textureToBloom, parameters: { luminanceCriterion, luminanceReduce, gaussianBlurLevelHighLuminance, gaussianKernelSize, gaussianVariance, synthesizeCoefficient, }, }: {
    textureToBloom: AbstractTexture;
    parameters: {
        luminanceCriterion?: number;
        luminanceReduce?: number;
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
