import { TextureFormatEnum } from '../definitions';
import { Expression } from '../renderer/Expression';
import { FrameBuffer } from '../renderer/FrameBuffer';
import { RenderPass } from '../renderer/RenderPass';
import { AbstractTexture } from '../textures/AbstractTexture';
import { RenderTargetTexture } from '../textures/RenderTargetTexture';
export declare class GaussianBlur {
    private __mapReducedFramebuffer;
    private __mapSynthesizeFramebuffer;
    constructor();
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
    private __createBlurPasses;
    private __createRenderPassSynthesizeImage;
    private __createRenderPassGaussianBlur;
    destroy3DAPIResources(): void;
}
