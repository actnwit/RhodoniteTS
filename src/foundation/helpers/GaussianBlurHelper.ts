import { TextureFormat, TextureFormatEnum } from '../definitions';
import { MathUtil } from '../math/MathUtil';
import { Vector2 } from '../math/Vector2';
import { VectorN } from '../math/VectorN';
import { Expression } from '../renderer/Expression';
import { FrameBuffer } from '../renderer/FrameBuffer';
import { RenderPass } from '../renderer/RenderPass';
import { AbstractTexture } from '../textures/AbstractTexture';
import { RenderTargetTexture } from '../textures/RenderTargetTexture';
import { MaterialHelper } from './MaterialHelper';
import { RenderableHelper } from './RenderableHelper';
import { RenderPassHelper } from './RenderPassHelper';

export class GaussianBlur {
  private __mapReducedFramebuffer: Map<string, FrameBuffer> = new Map();
  private __mapSynthesizeFramebuffer: Map<string, FrameBuffer> = new Map();

  constructor() {}

  public createGaussianBlurExpression({
    textureToBlur,
    parameters: {
      blurPassLevel = 4,
      gaussianKernelSize = 10,
      gaussianVariance = 10,
      synthesizeCoefficient = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
      isReduceBuffer = true,
      textureFormat = TextureFormat.RGBA16F,
      outputFrameBuffer = undefined,
      outputFrameBufferLayerIndex = 0,
    },
  }: {
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
  }) {
    const renderPassesBlurred = this.__createBlurPasses(
      textureToBlur,
      blurPassLevel,
      gaussianKernelSize,
      gaussianVariance,
      textureToBlur.width,
      textureToBlur.height,
      isReduceBuffer,
      textureFormat
    );

    // Setup SynthesizeMaterial
    const renderPassSynthesizeImage = this.__createRenderPassSynthesizeImage(
      textureToBlur,
      renderPassesBlurred,
      synthesizeCoefficient,
      textureFormat,
      outputFrameBuffer,
      outputFrameBufferLayerIndex
    );

    // Setup Expression
    const expression = new Expression();
    expression.addRenderPasses([...renderPassesBlurred, renderPassSynthesizeImage]);

    return {
      blurExpression: expression,
      blurredRenderTarget: renderPassSynthesizeImage.getFramebuffer()!
        .colorAttachments[0] as RenderTargetTexture,
      renderPassesBlurred,
    };
  }

  private __createBlurPasses(
    frameBufferToBlur: AbstractTexture,
    blurPassLevel: number,
    gaussianKernelSize: number,
    gaussianVariance: number,
    maxResolutionWidth: number,
    maxResolutionHeight: number,
    isReduceBuffer: boolean,
    textureFormat: TextureFormatEnum
  ) {
    const renderPasses: RenderPass[] = [];

    for (let i = 0; i < blurPassLevel; i++) {
      const resolutionWidthBlur = isReduceBuffer
        ? Math.max(maxResolutionWidth >> (i + 1), 1)
        : maxResolutionWidth;
      const resolutionHeightBlur = isReduceBuffer
        ? Math.max(maxResolutionHeight >> (i + 1), 1)
        : maxResolutionHeight;

      let renderPassBlurH;
      if (i === 0) {
        renderPassBlurH = this.__createRenderPassGaussianBlur(
          frameBufferToBlur,
          gaussianKernelSize,
          gaussianVariance,
          true,
          resolutionWidthBlur,
          resolutionHeightBlur,
          textureFormat
        );
      } else {
        renderPassBlurH = this.__createRenderPassGaussianBlur(
          renderPasses[renderPasses.length - 1]
            .getFramebuffer()!
            .getColorAttachedRenderTargetTexture(0)!,
          gaussianKernelSize,
          gaussianVariance,
          true,
          resolutionWidthBlur,
          resolutionHeightBlur,
          textureFormat
        );
      }
      renderPassBlurH.tryToSetUniqueName('renderPassBlurH_' + i, true);

      const renderPassBlurHV = this.__createRenderPassGaussianBlur(
        renderPassBlurH.getFramebuffer()!.getColorAttachedRenderTargetTexture(0)!,
        gaussianKernelSize,
        gaussianVariance,
        false,
        resolutionWidthBlur,
        resolutionHeightBlur,
        textureFormat
      );
      renderPassBlurHV.tryToSetUniqueName('renderPassBlurHV_' + i, true);

      renderPasses.push(renderPassBlurH, renderPassBlurHV);
    }

    return renderPasses;
  }

  private __createRenderPassSynthesizeImage(
    texture: AbstractTexture,
    renderPassesBlurredHighLuminance: RenderPass[],
    synthesizeCoefficient: [number, number, number, number, number, number],
    textureFormat: TextureFormatEnum,
    outputFrameBuffer?: FrameBuffer,
    outputFrameBufferLayerIndex?: number
  ) {
    const texturesSynthesize = [texture] as AbstractTexture[]; // original texture
    for (let i = 1; i < renderPassesBlurredHighLuminance.length; i += 2) {
      texturesSynthesize.push(
        renderPassesBlurredHighLuminance[i].getFramebuffer()! // blurred textures
          .colorAttachments[0] as unknown as AbstractTexture
      );
    }

    const materialSynthesizeTextures = MaterialHelper.createSynthesizeHDRMaterial(
      {
        maxInstancesNumber: 1,
      },
      texturesSynthesize
    );
    materialSynthesizeTextures.setParameter('synthesizeCoefficient', synthesizeCoefficient);
    const renderPassSynthesizeBlur = RenderPassHelper.createScreenDrawRenderPass(
      materialSynthesizeTextures
    );
    renderPassSynthesizeBlur.tryToSetUniqueName('renderPassSynthesizeBlur', true);

    let framebufferSynthesizeImages = outputFrameBuffer;
    if (framebufferSynthesizeImages == null) {
      const key = `${texture.width}x${texture.height}_${textureFormat.str}`;
      framebufferSynthesizeImages = this.__mapSynthesizeFramebuffer.get(key);
      if (framebufferSynthesizeImages == null) {
        framebufferSynthesizeImages = RenderableHelper.createFrameBuffer({
          width: texture.width,
          height: texture.height,
          textureNum: 1,
          textureFormats: [textureFormat],
          createDepthBuffer: false,
        });
        this.__mapSynthesizeFramebuffer.set(key, framebufferSynthesizeImages);
      }
    }
    renderPassSynthesizeBlur.setFramebuffer(framebufferSynthesizeImages);
    if (outputFrameBuffer != null) {
      renderPassSynthesizeBlur.setPreRenderFunction(() => {
        outputFrameBuffer.setColorAttachmentLayerAt(
          0,
          framebufferSynthesizeImages.getColorAttachedRenderTargetTexture(0)!,
          outputFrameBufferLayerIndex!,
          0
        );
      });
    }

    return renderPassSynthesizeBlur;
  }

  private __createRenderPassGaussianBlur(
    textureToBlur: AbstractTexture,
    gaussianKernelSize: number,
    gaussianVariance: number,
    isHorizontal: boolean,
    resolutionWidthBlur: number,
    resolutionHeightBlur: number,
    textureFormat: TextureFormatEnum
  ) {
    const material = MaterialHelper.createGaussianBlurMaterial();

    const gaussianDistributionRatio = MathUtil.computeGaussianDistributionRatioWhoseSumIsOne({
      kernelSize: gaussianKernelSize,
      variance: gaussianVariance,
    });
    material.setParameter('gaussianKernelSize', gaussianKernelSize);
    material.setParameter(
      'gaussianRatio',
      new VectorN(new Float32Array(gaussianDistributionRatio))
    );
    material.setParameter(
      'framebufferSize',
      Vector2.fromCopy2(resolutionWidthBlur, resolutionHeightBlur)
    );

    if (isHorizontal === false) {
      material.setParameter('isHorizontal', false);
    }

    const renderPass = RenderPassHelper.createScreenDrawRenderPassWithBaseColorTexture(
      material,
      textureToBlur
    );

    const key = `${resolutionWidthBlur}x${resolutionHeightBlur}_${textureFormat.str}_${isHorizontal}`;
    let framebuffer = this.__mapReducedFramebuffer.get(key);
    if (framebuffer == null) {
      framebuffer = RenderableHelper.createFrameBuffer({
        width: resolutionWidthBlur,
        height: resolutionHeightBlur,
        textureNum: 1,
        textureFormats: [textureFormat],
        createDepthBuffer: false,
      });
      this.__mapReducedFramebuffer.set(key, framebuffer);
    }
    renderPass.setFramebuffer(framebuffer);

    return renderPass;
  }

  public destroy3DAPIResources() {
    this.__mapReducedFramebuffer.forEach((framebuffer) => {
      framebuffer.destroy3DAPIResources();
    });
    this.__mapSynthesizeFramebuffer.forEach((framebuffer) => {
      framebuffer.destroy3DAPIResources();
    });
    this.__mapReducedFramebuffer.clear();
    this.__mapSynthesizeFramebuffer.clear();
  }
}
