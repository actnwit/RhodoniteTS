import { TextureFormat, type TextureFormatEnum } from '../definitions';
import { MathUtil } from '../math/MathUtil';
import { Vector2 } from '../math/Vector2';
import { VectorN } from '../math/VectorN';
import { Expression } from '../renderer/Expression';
import type { FrameBuffer } from '../renderer/FrameBuffer';
import type { RenderPass } from '../renderer/RenderPass';
import type { Engine } from '../system/Engine';
import type { AbstractTexture } from '../textures/AbstractTexture';
import type { RenderTargetTexture } from '../textures/RenderTargetTexture';
import { MaterialHelper } from './MaterialHelper';
import { RenderPassHelper } from './RenderPassHelper';
import { RenderableHelper } from './RenderableHelper';

/**
 * A helper class for creating Gaussian blur effects on textures.
 * This class provides functionality to apply multi-pass Gaussian blur
 * with customizable parameters including blur levels, kernel size, and variance.
 */
export class GaussianBlur {
  private __engine: Engine;
  private __mapReducedFramebuffer: Map<string, FrameBuffer> = new Map();
  private __mapSynthesizeFramebuffer: Map<string, FrameBuffer> = new Map();

  /**
   * Constructor for the GaussianBlur helper.
   *
   * @param engine - The engine instance to use for creating the Gaussian blur effect
   */
  constructor(engine: Engine) {
    this.__engine = engine;
  }
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
      blurredRenderTarget: renderPassSynthesizeImage.getFramebuffer()!.colorAttachments[0] as RenderTargetTexture,
      renderPassesBlurred,
    };
  }

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
      const resolutionWidthBlur = isReduceBuffer ? Math.max(maxResolutionWidth >> (i + 1), 1) : maxResolutionWidth;
      const resolutionHeightBlur = isReduceBuffer ? Math.max(maxResolutionHeight >> (i + 1), 1) : maxResolutionHeight;

      let renderPassBlurH: RenderPass;
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
          renderPasses[renderPasses.length - 1].getFramebuffer()!.getColorAttachedRenderTargetTexture(0)!,
          gaussianKernelSize,
          gaussianVariance,
          true,
          resolutionWidthBlur,
          resolutionHeightBlur,
          textureFormat
        );
      }
      renderPassBlurH.tryToSetUniqueName(`renderPassBlurH_${i}`, true);

      const renderPassBlurHV = this.__createRenderPassGaussianBlur(
        renderPassBlurH.getFramebuffer()!.getColorAttachedRenderTargetTexture(0)!,
        gaussianKernelSize,
        gaussianVariance,
        false,
        resolutionWidthBlur,
        resolutionHeightBlur,
        textureFormat
      );
      renderPassBlurHV.tryToSetUniqueName(`renderPassBlurHV_${i}`, true);

      renderPasses.push(renderPassBlurH, renderPassBlurHV);
    }

    return renderPasses;
  }

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
        renderPassesBlurredHighLuminance[i].getFramebuffer()!.colorAttachments[0] as unknown as AbstractTexture // blurred textures
      );
    }

    const materialSynthesizeTextures = MaterialHelper.createSynthesizeHDRMaterial(
      this.__engine,
      {
        maxInstancesNumber: 1,
      },
      texturesSynthesize
    );
    materialSynthesizeTextures.setParameter('synthesizeCoefficient', synthesizeCoefficient);
    const renderPassSynthesizeBlur = RenderPassHelper.createScreenDrawRenderPass(
      this.__engine,
      materialSynthesizeTextures
    );
    renderPassSynthesizeBlur.tryToSetUniqueName('renderPassSynthesizeBlur', true);

    let framebufferSynthesizeImages = outputFrameBuffer;
    if (framebufferSynthesizeImages == null) {
      const key = `${texture.width}x${texture.height}_${textureFormat.str}`;
      framebufferSynthesizeImages = this.__mapSynthesizeFramebuffer.get(key);
      if (framebufferSynthesizeImages == null) {
        framebufferSynthesizeImages = RenderableHelper.createFrameBuffer(this.__engine, {
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
  private __createRenderPassGaussianBlur(
    textureToBlur: AbstractTexture,
    gaussianKernelSize: number,
    gaussianVariance: number,
    isHorizontal: boolean,
    resolutionWidthBlur: number,
    resolutionHeightBlur: number,
    textureFormat: TextureFormatEnum
  ) {
    const material = MaterialHelper.createGaussianBlurMaterial(this.__engine);

    const gaussianDistributionRatio = MathUtil.computeGaussianDistributionRatioWhoseSumIsOne({
      kernelSize: gaussianKernelSize,
      variance: gaussianVariance,
    });
    material.setParameter('gaussianKernelSize', gaussianKernelSize);
    material.setParameter('gaussianRatio', new VectorN(new Float32Array(gaussianDistributionRatio)));
    material.setParameter('framebufferSize', Vector2.fromCopy2(resolutionWidthBlur, resolutionHeightBlur));

    if (isHorizontal === false) {
      material.setParameter('isHorizontal', false);
    }

    const renderPass = RenderPassHelper.createScreenDrawRenderPassWithBaseColorTexture(
      this.__engine,
      material,
      textureToBlur
    );

    const key = `${resolutionWidthBlur}x${resolutionHeightBlur}_${textureFormat.str}_${isHorizontal}`;
    let framebuffer = this.__mapReducedFramebuffer.get(key);
    if (framebuffer == null) {
      framebuffer = RenderableHelper.createFrameBuffer(this.__engine, {
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

  /**
   * Destroys all 3D API resources associated with this GaussianBlur instance.
   * This method cleans up all cached framebuffers and their associated GPU resources
   * to prevent memory leaks. Should be called when the GaussianBlur instance is no longer needed.
   */
  public destroy3DAPIResources() {
    this.__mapReducedFramebuffer.forEach(framebuffer => {
      framebuffer.destroy3DAPIResources();
    });
    this.__mapSynthesizeFramebuffer.forEach(framebuffer => {
      framebuffer.destroy3DAPIResources();
    });
    this.__mapReducedFramebuffer.clear();
    this.__mapSynthesizeFramebuffer.clear();
  }
}
